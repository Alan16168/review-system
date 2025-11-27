import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

const answerSets = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware
answerSets.use('/*', authMiddleware);

/**
 * Get all answer sets for a review
 * GET /api/answer-sets/:reviewId?mode=edit|view
 * Returns: { sets: [{ set_number, created_at, user_id, username, answers: [...] }] }
 * 
 * Query Parameters:
 * - mode: "edit" (default) or "view"
 *   - edit mode: Returns only current user's answer sets (for editing)
 *   - view mode: Returns all team members' answer sets (for viewing)
 * 
 * For personal reviews, always returns only current user's answer sets
 */
answerSets.get('/:reviewId', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const user = c.get('user') as any;
    const userId = user?.id;
    const mode = c.req.query('mode') || 'edit'; // Default to edit mode

    if (isNaN(reviewId)) {
      return c.json({ error: 'Invalid review ID' }, 400);
    }

    // First, get the review to check team_id
    const review = await c.env.DB.prepare(`
      SELECT team_id FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Get answer sets based on mode and review type
    let setsQuery;
    if (review.team_id && mode === 'view') {
      // Team review in view mode: get all answer sets from all team members
      setsQuery = c.env.DB.prepare(`
        SELECT ras.id, ras.user_id, ras.set_number, ras.created_at, ras.updated_at, 
               ras.is_locked, ras.locked_at, ras.locked_by, u.username
        FROM review_answer_sets ras
        LEFT JOIN users u ON ras.user_id = u.id
        WHERE ras.review_id = ?
        ORDER BY ras.created_at DESC
      `).bind(reviewId);
    } else {
      // Edit mode OR personal review: only get current user's answer sets
      setsQuery = c.env.DB.prepare(`
        SELECT ras.id, ras.user_id, ras.set_number, ras.created_at, ras.updated_at, 
               ras.is_locked, ras.locked_at, ras.locked_by, u.username
        FROM review_answer_sets ras
        LEFT JOIN users u ON ras.user_id = u.id
        WHERE ras.review_id = ? AND ras.user_id = ?
        ORDER BY ras.created_at DESC
      `).bind(reviewId, userId);
    }

    const sets = await setsQuery.all();

    if (!sets.results || sets.results.length === 0) {
      return c.json({ sets: [] });
    }

    // Get all answers for these sets
    const setIds = sets.results.map((s: any) => s.id);
    const placeholders = setIds.map(() => '?').join(',');
    
    const answers = await c.env.DB.prepare(`
      SELECT answer_set_id, question_number, answer, 
             datetime_value, datetime_title, datetime_answer,
             created_at, updated_at
      FROM review_answers
      WHERE answer_set_id IN (${placeholders})
      ORDER BY answer_set_id, question_number
    `).bind(...setIds).all();

    // Group answers by set_id
    const answersBySet: Record<number, any[]> = {};
    if (answers.results) {
      answers.results.forEach((ans: any) => {
        if (!answersBySet[ans.answer_set_id]) {
          answersBySet[ans.answer_set_id] = [];
        }
        answersBySet[ans.answer_set_id].push(ans);
      });
    }

    // Combine sets with their answers (include lock status and user info)
    const result = sets.results.map((set: any) => ({
      id: set.id,  // Add set ID for frontend reference
      set_number: set.set_number,
      user_id: set.user_id,  // Add user_id so frontend knows who owns each set
      username: set.username,  // Add username for display
      created_at: set.created_at,
      updated_at: set.updated_at,
      is_locked: set.is_locked || 'no',
      locked_at: set.locked_at,
      locked_by: set.locked_by,
      answers: answersBySet[set.id] || []
    }));

    return c.json({ sets: result });

  } catch (error: any) {
    console.error('Error fetching answer sets:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      reviewId: c.req.param('reviewId'),
      userId: c.get('userId')
    });
    return c.json({ 
      error: 'Failed to fetch answer sets',
      details: error.message 
    }, 500);
  }
});

/**
 * Create a new answer set (adds empty answers for all questions)
 * POST /api/answer-sets/:reviewId
 * Body: { answers: { [questionNumber]: { answer?, datetime_value?, datetime_title?, datetime_answer? } } }
 */
answerSets.post('/:reviewId', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const user = c.get('user') as any; // UserPayload from auth middleware
    const userId = user?.id;
    const body = await c.req.json();

    console.log('[answer_sets POST] Starting:', { 
      reviewId, 
      reviewIdType: typeof reviewId,
      userId, 
      userIdType: typeof userId,
      answersCount: Object.keys(body.answers || {}).length 
    });

    if (isNaN(reviewId)) {
      return c.json({ error: 'Invalid review ID' }, 400);
    }

    if (!userId || typeof userId !== 'number') {
      console.error('Invalid userId:', userId, typeof userId);
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    // Get next set_number
    const maxSet = await c.env.DB.prepare(`
      SELECT MAX(set_number) as max_num
      FROM review_answer_sets
      WHERE review_id = ? AND user_id = ?
    `).bind(reviewId, userId).first();

    const nextSetNumber = (maxSet?.max_num || 0) + 1;

    // Create new answer set
    const setResult = await c.env.DB.prepare(`
      INSERT INTO review_answer_sets (review_id, user_id, set_number)
      VALUES (?, ?, ?)
    `).bind(reviewId, userId, nextSetNumber).run();

    // Get the inserted ID from meta.last_row_id
    // D1 returns last_row_id which could be number or undefined
    const setId = setResult.meta.last_row_id;

    if (!setId || typeof setId !== 'number') {
      console.error('Failed to get inserted set ID:', setResult);
      console.error('setId type:', typeof setId, 'value:', setId);
      return c.json({ error: 'Failed to create answer set' }, 500);
    }

    console.log('[answer_sets POST] Created set with ID:', setId);

    // Insert answers for all questions
    const answers = body.answers || {};
    const insertPromises: Promise<any>[] = [];

    console.log('[answer_sets POST] Processing answers:', JSON.stringify(answers));

    for (const [questionNum, answerData] of Object.entries(answers)) {
      const data: any = answerData;
      const parsedQuestionNum = parseInt(questionNum);
      
      if (isNaN(parsedQuestionNum)) {
        console.error('Invalid question number:', questionNum);
        continue;
      }
      
      // Ensure all values are either valid or null (not undefined)
      // D1 doesn't accept undefined, only null
      const answerValue = (data.answer !== undefined && data.answer !== null && data.answer !== '') ? String(data.answer) : null;
      const datetimeValue = (data.datetime_value !== undefined && data.datetime_value !== null) ? data.datetime_value : null;
      const datetimeTitle = (data.datetime_title !== undefined && data.datetime_title !== null) ? data.datetime_title : null;
      const datetimeAnswer = (data.datetime_answer !== undefined && data.datetime_answer !== null) ? data.datetime_answer : null;
      
      console.log(`[answer_sets POST] Inserting Q${parsedQuestionNum}:`, {
        answer: answerValue,
        datetime_value: datetimeValue,
        datetime_title: datetimeTitle,
        datetime_answer: datetimeAnswer
      });
      
      // Double check: ensure no undefined values before binding
      const bindParams = [
        setId,
        parsedQuestionNum,
        answerValue,
        datetimeValue,
        datetimeTitle,
        datetimeAnswer
      ];
      
      // Validate all parameters
      const hasUndefined = bindParams.some(p => p === undefined);
      if (hasUndefined) {
        console.error('Found undefined in bind params:', bindParams);
        return c.json({ 
          error: 'Internal error: undefined parameter detected',
          details: 'One or more required parameters are undefined'
        }, 500);
      }
      
      const query = c.env.DB.prepare(`
        INSERT INTO review_answers 
        (answer_set_id, question_number, answer, datetime_value, datetime_title, datetime_answer)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(...bindParams);
      
      insertPromises.push(query.run());
    }

    await Promise.all(insertPromises);

    return c.json({ 
      success: true, 
      set_number: nextSetNumber,
      set_id: setId 
    });

  } catch (error: any) {
    console.error('Error creating answer set:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return c.json({ 
      error: 'Failed to create answer set',
      details: error.message 
    }, 500);
  }
});

/**
 * Update an answer set
 * PUT /api/answer-sets/:reviewId/:setNumber
 * Body: { answers: { [questionNumber]: { answer?, datetime_value?, datetime_title?, datetime_answer? } } }
 */
answerSets.put('/:reviewId/:setNumber', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const setNumber = parseInt(c.req.param('setNumber'));
    const user = c.get('user') as any;
    const userId = user?.id;
    
    console.log('[PUT answer-sets] Request params:', { reviewId, setNumber, userId });
    
    const body = await c.req.json();
    console.log('[PUT answer-sets] Request body:', JSON.stringify(body, null, 2));

    if (isNaN(reviewId) || isNaN(setNumber)) {
      console.error('[PUT answer-sets] Invalid parameters');
      return c.json({ error: 'Invalid parameters' }, 400);
    }

    // Get set ID and check if it's locked
    console.log('[PUT answer-sets] Fetching answer set...');
    const set = await c.env.DB.prepare(`
      SELECT id, is_locked FROM review_answer_sets
      WHERE review_id = ? AND user_id = ? AND set_number = ?
    `).bind(reviewId, userId, setNumber).first();
    
    console.log('[PUT answer-sets] Found set:', set);

    if (!set) {
      return c.json({ error: 'Answer set not found' }, 404);
    }

    // Prevent editing locked answer sets
    if (set.is_locked === 'yes') {
      return c.json({ 
        error: 'This answer set is locked and cannot be edited. Please unlock it first.',
        is_locked: 'yes'
      }, 403);
    }

    const setId = set.id;
    const answers = body.answers || {};

    // Update or insert answers (UPSERT logic)
    const upsertPromises: Promise<any>[] = [];

    for (const [questionNum, answerData] of Object.entries(answers)) {
      const data: any = answerData;
      const parsedQuestionNum = parseInt(questionNum);
      
      if (isNaN(parsedQuestionNum)) {
        console.error('Invalid question number:', questionNum);
        continue;
      }
      
      // Check if answer already exists
      const existingAnswer = await c.env.DB.prepare(`
        SELECT id FROM review_answers
        WHERE answer_set_id = ? AND question_number = ?
      `).bind(setId, parsedQuestionNum).first();
      
      if (existingAnswer) {
        // UPDATE existing answer
        const updateQuery = c.env.DB.prepare(`
          UPDATE review_answers
          SET answer = ?, 
              datetime_value = ?,
              datetime_title = ?,
              datetime_answer = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE answer_set_id = ? AND question_number = ?
        `).bind(
          data.answer !== undefined ? data.answer : (typeof data === 'string' ? data : null),
          data.datetime_value !== undefined ? data.datetime_value : null,
          data.datetime_title !== undefined ? data.datetime_title : null,
          data.datetime_answer !== undefined ? data.datetime_answer : null,
          setId,
          parsedQuestionNum
        );
        
        upsertPromises.push(updateQuery.run());
      } else {
        // INSERT new answer
        const insertQuery = c.env.DB.prepare(`
          INSERT INTO review_answers 
          (answer_set_id, question_number, answer, datetime_value, datetime_title, datetime_answer)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          setId,
          parsedQuestionNum,
          data.answer !== undefined ? data.answer : (typeof data === 'string' ? data : null),
          data.datetime_value !== undefined ? data.datetime_value : null,
          data.datetime_title !== undefined ? data.datetime_title : null,
          data.datetime_answer !== undefined ? data.datetime_answer : null
        );
        
        upsertPromises.push(insertQuery.run());
      }
    }

    await Promise.all(upsertPromises);

    // Update set's updated_at
    await c.env.DB.prepare(`
      UPDATE review_answer_sets
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(setId).run();

    return c.json({ success: true });

  } catch (error: any) {
    console.error('Error updating answer set:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      reviewId: c.req.param('reviewId'),
      setNumber: c.req.param('setNumber'),
      userId: c.get('user')?.id
    });
    return c.json({ 
      error: 'Failed to update answer set',
      details: error.message 
    }, 500);
  }
});

/**
 * Delete an answer set
 * DELETE /api/answer-sets/:reviewId/:setNumber
 */
answerSets.delete('/:reviewId/:setNumber', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const setNumber = parseInt(c.req.param('setNumber'));
    const user = c.get('user') as any;
    const userId = user?.id;

    if (isNaN(reviewId) || isNaN(setNumber)) {
      return c.json({ error: 'Invalid parameters' }, 400);
    }

    // Check if answer set is locked before deleting
    const set = await c.env.DB.prepare(`
      SELECT is_locked FROM review_answer_sets
      WHERE review_id = ? AND user_id = ? AND set_number = ?
    `).bind(reviewId, userId, setNumber).first();

    if (!set) {
      return c.json({ error: 'Answer set not found' }, 404);
    }

    if (set.is_locked === 'yes') {
      return c.json({ 
        error: 'Cannot delete locked answer set. Please unlock it first.' 
      }, 403);
    }

    // Delete the answer set (CASCADE will delete associated answers)
    const result = await c.env.DB.prepare(`
      DELETE FROM review_answer_sets
      WHERE review_id = ? AND user_id = ? AND set_number = ?
    `).bind(reviewId, userId, setNumber).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Answer set not found' }, 404);
    }

    return c.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting answer set:', error);
    return c.json({ error: 'Failed to delete answer set' }, 500);
  }
});

/**
 * Lock answer sets by batch (set_number)
 * PUT /api/answer-sets/:reviewId/:setNumber/lock
 * Only the review creator can lock answer sets
 * Locks ALL answer sets with the same set_number (entire batch for all members)
 */
answerSets.put('/:reviewId/:setNumber/lock', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const setNumber = parseInt(c.req.param('setNumber'));
    const user = c.get('user') as any;
    const userId = user?.id;

    if (isNaN(reviewId) || isNaN(setNumber)) {
      return c.json({ error: 'Invalid parameters' }, 400);
    }

    // Check if user is the review creator
    const review = await c.env.DB.prepare(`
      SELECT user_id FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.user_id !== userId) {
      return c.json({ 
        error: 'Only the review creator can lock answer sets',
        permission: 'denied'
      }, 403);
    }

    // Check if this batch is already locked
    const existingSet = await c.env.DB.prepare(`
      SELECT is_locked FROM review_answer_sets
      WHERE review_id = ? AND set_number = ?
      LIMIT 1
    `).bind(reviewId, setNumber).first();

    if (!existingSet) {
      return c.json({ error: 'Answer set batch not found' }, 404);
    }

    if (existingSet.is_locked === 'yes') {
      return c.json({ 
        error: 'Answer set batch is already locked',
        is_locked: 'yes'
      }, 400);
    }

    // Lock ALL answer sets with this set_number (entire batch)
    await c.env.DB.prepare(`
      UPDATE review_answer_sets
      SET is_locked = 'yes',
          locked_at = CURRENT_TIMESTAMP,
          locked_by = ?
      WHERE review_id = ? AND set_number = ?
    `).bind(userId, reviewId, setNumber).run();

    return c.json({ 
      success: true,
      message: 'Answer set batch locked successfully',
      is_locked: 'yes',
      set_number: setNumber
    });

  } catch (error: any) {
    console.error('Error locking answer set batch:', error);
    return c.json({ error: 'Failed to lock answer set batch' }, 500);
  }
});

/**
 * Unlock answer sets by batch (set_number)
 * PUT /api/answer-sets/:reviewId/:setNumber/unlock
 * Only the review creator can unlock answer sets
 * Unlocks ALL answer sets with the same set_number (entire batch for all members)
 */
answerSets.put('/:reviewId/:setNumber/unlock', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const setNumber = parseInt(c.req.param('setNumber'));
    const user = c.get('user') as any;
    const userId = user?.id;

    if (isNaN(reviewId) || isNaN(setNumber)) {
      return c.json({ error: 'Invalid parameters' }, 400);
    }

    // Check if user is the review creator
    const review = await c.env.DB.prepare(`
      SELECT user_id FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.user_id !== userId) {
      return c.json({ 
        error: 'Only the review creator can unlock answer sets',
        permission: 'denied'
      }, 403);
    }

    // Check if this batch is already unlocked
    const existingSet = await c.env.DB.prepare(`
      SELECT is_locked FROM review_answer_sets
      WHERE review_id = ? AND set_number = ?
      LIMIT 1
    `).bind(reviewId, setNumber).first();

    if (!existingSet) {
      return c.json({ error: 'Answer set batch not found' }, 404);
    }

    if (existingSet.is_locked === 'no') {
      return c.json({ 
        error: 'Answer set batch is already unlocked',
        is_locked: 'no'
      }, 400);
    }

    // Unlock ALL answer sets with this set_number (entire batch)
    await c.env.DB.prepare(`
      UPDATE review_answer_sets
      SET is_locked = 'no',
          locked_at = NULL,
          locked_by = NULL
      WHERE review_id = ? AND set_number = ?
    `).bind(reviewId, setNumber).run();

    return c.json({ 
      success: true,
      message: 'Answer set batch unlocked successfully',
      is_locked: 'no',
      set_number: setNumber
    });

  } catch (error: any) {
    console.error('Error unlocking answer set batch:', error);
    return c.json({ error: 'Failed to unlock answer set batch' }, 500);
  }
});

export default answerSets;
