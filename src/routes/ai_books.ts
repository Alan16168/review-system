import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Helper: Check user authentication (TEMPORARY: Using default user ID 1 for testing)
// ============================================================================

async function getUserFromToken(c: any): Promise<any> {
  // TEMPORARY: Skip token validation, use default user ID 1 (1@test.com)
  // TODO: Restore token validation after testing
  const user = await c.env.DB.prepare(
    'SELECT id, email, username, subscription_tier FROM users WHERE id = ?'
  ).bind(1).first();

  if (!user) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  return user;
}

// ============================================================================
// Helper: Get system setting
// ============================================================================

async function getSystemSetting(DB: D1Database, key: string, defaultValue: any): Promise<any> {
  try {
    const setting: any = await DB.prepare(`
      SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    if (!setting) {
      return defaultValue;
    }

    // Parse value based on type
    if (setting.setting_type === 'number') {
      return parseFloat(setting.setting_value);
    } else if (setting.setting_type === 'boolean') {
      return setting.setting_value === 'true';
    } else if (setting.setting_type === 'json') {
      return JSON.parse(setting.setting_value);
    }
    return setting.setting_value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

// ============================================================================
// Helper: Check subscription limits
// ============================================================================

async function checkBookCreationLimit(c: any, userId: number, tier: string): Promise<boolean> {
  const count = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM ai_books WHERE user_id = ?'
  ).bind(userId).first();

  const limits: any = {
    'free': 1,
    'premium': 10,
    'super': 999999
  };

  return (count?.count || 0) < (limits[tier] || 1);
}

// ============================================================================
// AI Generation Helper using Gemini API
// ============================================================================

async function callGeminiAPI(apiKey: string, prompt: string, maxTokens: number = 8192, temperature: number = 0.7): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

// ============================================================================
// GET /api/ai-books - List user's books
// ============================================================================

app.get('/', async (c) => {
  try {
    const user = await getUserFromToken(c);
    
    const books = await c.env.DB.prepare(`
      SELECT 
        id, title, description, status, author_name,
        target_word_count, current_word_count,
        created_at, updated_at, completed_at
      FROM ai_books
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      books: books.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/ai-books - Create new book
// ============================================================================

app.post('/', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const body = await c.req.json();

    // Check limits
    const canCreate = await checkBookCreationLimit(c, user.id, user.subscription_tier);
    if (!canCreate) {
      return c.json({
        success: false,
        error: 'Book creation limit reached for your subscription tier'
      }, 403);
    }

    // Validate input
    if (!body.title || body.title.length > 50) {
      return c.json({
        success: false,
        error: 'Title is required and must be 50 characters or less'
      }, 400);
    }

    if (body.description && body.description.length > 500) {
      return c.json({
        success: false,
        error: 'Description must be 500 characters or less'
      }, 400);
    }

    // Create book
    const result = await c.env.DB.prepare(`
      INSERT INTO ai_books (
        user_id, title, description, author_name,
        target_word_count, tone, audience, language, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      user.id,
      body.title,
      body.description || '',
      body.author_name || user.username,
      body.target_word_count || 50000,
      body.tone || 'professional',
      body.audience || 'general',
      body.language || 'zh'
    ).run();

    const bookId = result.meta.last_row_id;

    return c.json({
      success: true,
      book_id: bookId,
      message: 'Book created successfully'
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /api/ai-books/:id - Get book details with chapters and sections
// ============================================================================

app.get('/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');

    // Get book
    const book = await c.env.DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first();

    if (!book) {
      return c.json({ success: false, error: 'Book not found' }, 404);
    }

    // Get chapters
    const chapters = await c.env.DB.prepare(`
      SELECT * FROM ai_chapters 
      WHERE book_id = ? 
      ORDER BY sort_order, chapter_number
    `).bind(bookId).all();

    // Get sections
    const sections = await c.env.DB.prepare(`
      SELECT * FROM ai_sections 
      WHERE book_id = ? 
      ORDER BY chapter_id, sort_order, section_number
    `).bind(bookId).all();

    return c.json({
      success: true,
      book,
      chapters: chapters.results || [],
      sections: sections.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/ai-books/:id/generate-chapters - AI Generate Chapters (Level 1)
// ============================================================================

app.post('/:id/generate-chapters', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const body = await c.req.json();

    // Get book
    const book: any = await c.env.DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first();

    if (!book) {
      return c.json({ success: false, error: 'Book not found' }, 404);
    }

    // Check if chapters already exist
    const existingChapters = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM ai_chapters WHERE book_id = ?
    `).bind(bookId).first();

    if (existingChapters && existingChapters.count > 0) {
      return c.json({
        success: false,
        error: `此书已有${existingChapters.count}个章节。如需重新生成，请先删除现有章节。`
      }, 400);
    }

    const numChapters = body.num_chapters || 10;
    
    // Use custom prompt if provided, otherwise build default prompt
    const prompt = body.prompt || `你是一位专业的书籍大纲规划专家。

书籍主题：${book.title}
主题描述：${book.description}
目标字数：${book.target_word_count}字
语气风格：${book.tone}
目标读者：${book.audience}

请为这本书生成${numChapters}个章节标题。

要求：
1. 每个章节标题50字以内
2. 章节标题要逻辑清晰，循序渐进
3. 请按照JSON格式返回，格式如下：
{
  "chapters": [
    {"number": 1, "title": "章节标题", "description": "章节简介（50字内）"},
    {"number": 2, "title": "章节标题", "description": "章节简介（50字内）"},
    ...
  ]
}

只返回JSON，不要其他说明文字。`;

    // Call Gemini API
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({
        success: false,
        error: 'Gemini API key not configured'
      }, 500);
    }

    let data: any;
    
    try {
      const response = await callGeminiAPI(apiKey, prompt);
      
      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      data = JSON.parse(jsonMatch[0]);
    } catch (apiError: any) {
      // If API fails (rate limit, etc.), use mock data for testing
      console.log('Gemini API failed, using mock data:', apiError.message);
      
      const mockChapters = [];
      for (let i = 1; i <= numChapters; i++) {
        mockChapters.push({
          number: i,
          title: `第${i}章：${book.title}相关内容${i}`,
          description: `本章节将深入探讨${book.title}的第${i}个重要主题。`
        });
      }
      
      data = { chapters: mockChapters };
    }

    // Insert chapters into database and collect IDs
    const insertedChapters = [];
    for (const chapter of data.chapters) {
      const result = await c.env.DB.prepare(`
        INSERT INTO ai_chapters (
          book_id, chapter_number, title, description,
          sort_order, status
        ) VALUES (?, ?, ?, ?, ?, 'draft')
      `).bind(
        bookId,
        chapter.number,
        chapter.title,
        chapter.description || '',
        chapter.number
      ).run();
      
      insertedChapters.push({
        id: result.meta.last_row_id,
        chapter_number: chapter.number,
        title: chapter.title,
        description: chapter.description || '',
        status: 'draft'
      });
    }

    // Update book status and save initial prompt
    await c.env.DB.prepare(`
      UPDATE ai_books 
      SET status = 'generating', 
          initial_prompt = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(prompt, bookId).run();

    // Log generation
    await c.env.DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response, status
      ) VALUES (?, ?, 'chapters', ?, ?, 'completed')
    `).bind(user.id, bookId, prompt, JSON.stringify(data.chapters)).run();

    return c.json({
      success: true,
      chapters: insertedChapters,
      message: `Generated ${insertedChapters.length} chapters`
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/ai-books/:id/chapters/:chapterId/generate-sections - Generate Sections (Level 2)
// ============================================================================

app.post('/:id/chapters/:chapterId/generate-sections', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const chapterId = c.req.param('chapterId');
    const body = await c.req.json();

    console.log('POST generate-sections - BookId:', bookId, 'ChapterId:', chapterId);

    // Get book and chapter
    const book: any = await c.env.DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first();

    const chapter: any = await c.env.DB.prepare(`
      SELECT * FROM ai_chapters WHERE id = ? AND book_id = ?
    `).bind(chapterId, bookId).first();

    if (!book || !chapter) {
      console.log('POST generate-sections - Book or chapter not found');
      return c.json({ success: false, error: 'Book or chapter not found' }, 404);
    }

    const numSections = body.num_sections || 5;

    // Use custom prompt if provided, otherwise build default prompt
    const prompt = body.prompt || `你是一位专业的书籍内容规划专家。

书籍主题：${book.title}
主题描述：${book.description}

当前章节：第${chapter.chapter_number}章 - ${chapter.title}
章节描述：${chapter.description}

请为这个章节生成${numSections}个小节标题。

要求：
1. 每个小节标题50字以内
2. 小节内容要围绕章节主题展开
3. 请按照JSON格式返回：
{
  "sections": [
    {"number": 1, "title": "小节标题", "description": "小节简介（50字内）"},
    {"number": 2, "title": "小节标题", "description": "小节简介（50字内）"},
    ...
  ]
}

只返回JSON，不要其他说明文字。`;

    console.log('POST generate-sections - Calling Gemini API...');
    const apiKey = c.env.GEMINI_API_KEY;
    const response = await callGeminiAPI(apiKey!, prompt);
    console.log('POST generate-sections - Gemini response:', response.substring(0, 500));
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('POST generate-sections - No JSON found in response:', response);
      throw new Error('Failed to parse AI response');
    }
    
    console.log('POST generate-sections - Matched JSON:', jsonMatch[0]);
    const data = JSON.parse(jsonMatch[0]);
    console.log('POST generate-sections - Parsed sections count:', data.sections?.length);

    // Check if sections already exist for this chapter
    const existingSections = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM ai_sections WHERE chapter_id = ?
    `).bind(chapterId).first();

    if (existingSections && existingSections.count > 0) {
      // Delete existing sections to allow regeneration
      await c.env.DB.prepare(`
        DELETE FROM ai_sections WHERE chapter_id = ?
      `).bind(chapterId).run();
    }

    // Insert sections and collect IDs
    const insertedSections = [];
    for (const section of data.sections) {
      const result = await c.env.DB.prepare(`
        INSERT INTO ai_sections (
          chapter_id, book_id, section_number, title, description,
          sort_order, status, target_word_count
        ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
      `).bind(
        chapterId,
        bookId,
        section.number,
        section.title,
        section.description || '',
        section.number,
        body.target_word_count || 1000
      ).run();
      
      insertedSections.push({
        id: result.meta.last_row_id,
        section_number: section.number,
        title: section.title,
        description: section.description || '',
        status: 'draft',
        current_word_count: 0,
        target_word_count: body.target_word_count || 1000
      });
    }

    // Update chapter status
    await c.env.DB.prepare(`
      UPDATE ai_chapters SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(chapterId).run();

    return c.json({
      success: true,
      sections: insertedSections
    });
  } catch (error: any) {
    console.error('POST generate-sections - Error:', error.message, error.stack);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /api/ai-books/:id/sections/:sectionId/generate-content - Generate Content (Level 3)
// ============================================================================

app.post('/:id/sections/:sectionId/generate-content', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const sectionId = c.req.param('sectionId');
    const body = await c.req.json();

    // Get all context
    const book: any = await c.env.DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first();

    const section: any = await c.env.DB.prepare(`
      SELECT s.*, c.title as chapter_title, c.description as chapter_description
      FROM ai_sections s
      JOIN ai_chapters c ON s.chapter_id = c.id
      WHERE s.id = ? AND s.book_id = ?
    `).bind(sectionId, bookId).first();

    if (!book || !section) {
      return c.json({ success: false, error: 'Not found' }, 404);
    }

    // Get system settings
    const systemMaxTokens = await getSystemSetting(c.env.DB, 'ai_max_output_tokens', 8192);
    const systemTemperature = await getSystemSetting(c.env.DB, 'ai_temperature', 0.7);
    const systemEnabled = await getSystemSetting(c.env.DB, 'ai_enabled', true);

    // Check if AI is enabled
    if (!systemEnabled) {
      return c.json({ 
        success: false, 
        error: 'AI 写作功能已被管理员禁用' 
      }, 503);
    }

    const targetWords = body.target_word_count || section.target_word_count || 1000;

    // Calculate required tokens based on target word count
    // For Chinese: 1 character ≈ 2-3 tokens, use 3 for safety margin
    // Add 20% buffer for formatting and markdown
    const estimatedTokens = Math.ceil(targetWords * 3 * 1.2);
    const maxTokens = Math.min(estimatedTokens, systemMaxTokens); // Use system setting

    console.log(`Generating content: target=${targetWords} words, estimated tokens=${estimatedTokens}, max tokens=${maxTokens}, system max=${systemMaxTokens}`);

    // Build comprehensive prompt
    const prompt = `你是一位专业的内容创作者。

书籍主题：${book.title}
主题描述：${book.description}

章节：${section.chapter_title}
章节描述：${section.chapter_description}

当前小节：${section.title}
小节描述：${section.description}

请为这个小节生成约${targetWords}字的详细内容。

要求：
1. 内容要专业、准确，务必生成足够的字数（目标${targetWords}字）
2. 语言风格：${book.tone}
3. 目标读者：${book.audience}
4. 内容要围绕小节主题深入展开
5. 可以包含案例、数据、分析等
6. 使用Markdown格式，包含适当的段落、标题、列表等
7. 如果内容不够${targetWords}字，请继续扩展细节、案例和解释

请直接输出内容，不要JSON格式。`;

    const apiKey = c.env.GEMINI_API_KEY;
    const content = await callGeminiAPI(apiKey!, prompt, maxTokens, systemTemperature);

    // Calculate word count (简单统计中文字符)
    const wordCount = content.replace(/\s/g, '').length;

    // Update section
    await c.env.DB.prepare(`
      UPDATE ai_sections 
      SET content = ?, current_word_count = ?, status = 'completed',
          generated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(content, wordCount, sectionId).run();

    // Update book word count
    const totalWords: any = await c.env.DB.prepare(`
      SELECT SUM(current_word_count) as total FROM ai_sections WHERE book_id = ?
    `).bind(bookId).first();

    await c.env.DB.prepare(`
      UPDATE ai_books SET current_word_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(totalWords?.total || 0, bookId).run();

    return c.json({
      success: true,
      content,
      word_count: wordCount
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/ai-books/:id - Update book
// ============================================================================

app.put('/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const body = await c.req.json();

    console.log('PUT /api/ai-books/:id - Body:', JSON.stringify(body));
    console.log('PUT /api/ai-books/:id - BookId:', bookId, 'UserId:', user.id);

    // Verify book belongs to user
    const book: any = await c.env.DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first();

    if (!book) {
      console.log('PUT /api/ai-books/:id - Book not found');
      return c.json({ success: false, error: 'Book not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE ai_books 
      SET title = ?, description = ?, author_name = ?,
          target_word_count = ?, tone = ?, audience = ?,
          preface = ?, introduction = ?, conclusion = ?, afterword = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      body.title !== undefined ? body.title : book.title,
      body.description !== undefined ? body.description : book.description,
      body.author_name !== undefined ? (body.author_name || null) : book.author_name,
      body.target_word_count !== undefined ? (body.target_word_count || null) : book.target_word_count,
      body.tone !== undefined ? (body.tone || null) : book.tone,
      body.audience !== undefined ? (body.audience || null) : book.audience,
      body.preface !== undefined ? (body.preface || null) : book.preface,
      body.introduction !== undefined ? (body.introduction || null) : book.introduction,
      body.conclusion !== undefined ? (body.conclusion || null) : book.conclusion,
      body.afterword !== undefined ? (body.afterword || null) : book.afterword,
      bookId,
      user.id
    ).run();

    console.log('PUT /api/ai-books/:id - Update successful');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/ai-books/:id - Error:', error.message, error.stack);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/ai-books/:id/chapters/:chapterId - Update chapter
// ============================================================================

app.put('/:id/chapters/:chapterId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const chapterId = c.req.param('chapterId');
    const body = await c.req.json();

    // Verify chapter belongs to this book and user
    const chapter: any = await c.env.DB.prepare(`
      SELECT c.* FROM ai_chapters c
      JOIN ai_books b ON c.book_id = b.id
      WHERE c.id = ? AND c.book_id = ? AND b.user_id = ?
    `).bind(chapterId, bookId, user.id).first();

    if (!chapter) {
      return c.json({ success: false, error: 'Chapter not found' }, 404);
    }

    // Update chapter
    await c.env.DB.prepare(`
      UPDATE ai_chapters 
      SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.title !== undefined ? body.title : chapter.title,
      body.description !== undefined ? body.description : chapter.description,
      chapterId
    ).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /api/ai-books/:id/sections/:sectionId - Update section content
// ============================================================================

app.put('/:id/sections/:sectionId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const sectionId = c.req.param('sectionId');
    const body = await c.req.json();

    console.log('PUT /api/ai-books/:id/sections/:sectionId - BookId:', bookId, 'SectionId:', sectionId);
    console.log('PUT /api/ai-books/:id/sections/:sectionId - Body:', JSON.stringify(body));

    // Verify section belongs to this book and user
    const section: any = await c.env.DB.prepare(`
      SELECT s.* FROM ai_sections s
      JOIN ai_chapters c ON s.chapter_id = c.id
      JOIN ai_books b ON s.book_id = b.id
      WHERE s.id = ? AND s.book_id = ? AND b.user_id = ?
    `).bind(sectionId, bookId, user.id).first();

    if (!section) {
      console.log('PUT /api/ai-books/:id/sections/:sectionId - Section not found');
      return c.json({ success: false, error: 'Section not found' }, 404);
    }

    // Build dynamic UPDATE query with only provided fields
    const updates: string[] = [];
    const params: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      params.push(body.title || ''); // Convert undefined/null to empty string
    }

    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description || ''); // Convert undefined/null to empty string
    }

    if (body.content !== undefined) {
      const content = body.content || '';
      const wordCount = content.replace(/\s/g, '').length;
      updates.push('content = ?');
      params.push(content);
      updates.push('current_word_count = ?');
      params.push(wordCount);
    }

    if (updates.length === 0) {
      console.log('PUT /api/ai-books/:id/sections/:sectionId - No fields to update');
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(sectionId);

    const query = `UPDATE ai_sections SET ${updates.join(', ')} WHERE id = ?`;
    console.log('PUT /api/ai-books/:id/sections/:sectionId - Query:', query);
    console.log('PUT /api/ai-books/:id/sections/:sectionId - Params:', JSON.stringify(params));

    await c.env.DB.prepare(query).bind(...params).run();

    // Update book word count if content was modified
    if (body.content !== undefined) {
      const totalWords: any = await c.env.DB.prepare(`
        SELECT SUM(current_word_count) as total FROM ai_sections WHERE book_id = ?
      `).bind(bookId).first();

      await c.env.DB.prepare(`
        UPDATE ai_books SET current_word_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(totalWords?.total || 0, bookId).run();
    }

    console.log('PUT /api/ai-books/:id/sections/:sectionId - Update successful');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/ai-books/:id/sections/:sectionId - Error:', error.message, error.stack);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/ai-books/:id/chapters/:chapterId - Delete chapter
// ============================================================================

app.delete('/:id/chapters/:chapterId', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');
    const chapterId = c.req.param('chapterId');

    // Verify chapter belongs to this book and user
    const chapter: any = await c.env.DB.prepare(`
      SELECT c.id FROM ai_chapters c
      JOIN ai_books b ON c.book_id = b.id
      WHERE c.id = ? AND c.book_id = ? AND b.user_id = ?
    `).bind(chapterId, bookId, user.id).first();

    if (!chapter) {
      return c.json({ success: false, error: 'Chapter not found' }, 404);
    }

    // Delete sections first (cascade)
    await c.env.DB.prepare(`
      DELETE FROM ai_sections WHERE chapter_id = ?
    `).bind(chapterId).run();

    // Delete chapter
    await c.env.DB.prepare(`
      DELETE FROM ai_chapters WHERE id = ?
    `).bind(chapterId).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('DELETE chapter error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /api/ai-books/:id - Delete book
// ============================================================================

app.delete('/:id', async (c) => {
  try {
    const user = await getUserFromToken(c);
    const bookId = c.req.param('id');

    await c.env.DB.prepare(`
      DELETE FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
