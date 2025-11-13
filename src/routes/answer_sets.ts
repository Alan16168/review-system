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
 * GET /api/answer-sets/:reviewId
 * Returns: { sets: [{ set_number, created_at, answers: [...] }] }
 */
answerSets.get('/:reviewId', async (c: Context) => {
  try {
    const reviewId = parseInt(c.req.param('reviewId'));
    const user = c.get('user') as any;
    const userId = user?.id;

    if (isNaN(reviewId)) {
      return c.json({ error: 'Invalid review ID' }, 400);
    }

    // Get all answer sets for this review/user
    const sets = await c.env.DB.prepare(`
      SELECT id, set_number, created_at, updated_at
      FROM review_answer_sets
      WHERE review_id = ? AND user_id = ?
      ORDER BY set_number ASC
    `).bind(reviewId, userId).all();

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

    // Combine sets with their answers
    const result = sets.results.map((set: any) => ({
      set_number: set.set_number,
      created_at: set.created_at,
      updated_at: set.updated_at,
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
    const body = await c.req.json();

    if (isNaN(reviewId) || isNaN(setNumber)) {
      return c.json({ error: 'Invalid parameters' }, 400);
    }

    // Get set ID
    const set = await c.env.DB.prepare(`
      SELECT id FROM review_answer_sets
      WHERE review_id = ? AND user_id = ? AND set_number = ?
    `).bind(reviewId, userId, setNumber).first();

    if (!set) {
      return c.json({ error: 'Answer set not found' }, 404);
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
          data.answer || data || null,
          data.datetime_value || null,
          data.datetime_title || null,
          data.datetime_answer || null,
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
          data.answer || data || null,
          data.datetime_value || null,
          data.datetime_title || null,
          data.datetime_answer || null
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
    return c.json({ error: 'Failed to update answer set' }, 500);
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

export default answerSets;
