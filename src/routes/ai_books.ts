import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Helper: Check user authentication
// ============================================================================

async function getUserFromToken(c: any): Promise<any> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  // Verify JWT token (simplified - in production use proper JWT verification)
  const user = await c.env.DB.prepare(
    'SELECT id, email, username, subscription_tier FROM users WHERE id = ?'
  ).bind(1).first(); // TODO: Extract user ID from JWT

  if (!user) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  return user;
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

async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
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

    const numChapters = body.num_chapters || 10;
    
    // Build prompt for Gemini
    const prompt = `你是一位专业的书籍大纲规划专家。

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

    const response = await callGeminiAPI(apiKey, prompt);
    
    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const data = JSON.parse(jsonMatch[0]);

    // Insert chapters into database
    for (const chapter of data.chapters) {
      await c.env.DB.prepare(`
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
    }

    // Update book status
    await c.env.DB.prepare(`
      UPDATE ai_books SET status = 'generating', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(bookId).run();

    // Log generation
    await c.env.DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response, status
      ) VALUES (?, ?, 'chapters', ?, ?, 'completed')
    `).bind(user.id, bookId, prompt, response).run();

    return c.json({
      success: true,
      chapters: data.chapters,
      message: `Generated ${data.chapters.length} chapters`
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

    // Get book and chapter
    const book: any = await c.env.DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first();

    const chapter: any = await c.env.DB.prepare(`
      SELECT * FROM ai_chapters WHERE id = ? AND book_id = ?
    `).bind(chapterId, bookId).first();

    if (!book || !chapter) {
      return c.json({ success: false, error: 'Book or chapter not found' }, 404);
    }

    const numSections = body.num_sections || 5;

    // Build prompt
    const prompt = `你是一位专业的书籍内容规划专家。

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

    const apiKey = c.env.GEMINI_API_KEY;
    const response = await callGeminiAPI(apiKey!, prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch![0]);

    // Insert sections
    for (const section of data.sections) {
      await c.env.DB.prepare(`
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
    }

    // Update chapter status
    await c.env.DB.prepare(`
      UPDATE ai_chapters SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(chapterId).run();

    return c.json({
      success: true,
      sections: data.sections
    });
  } catch (error: any) {
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

    const targetWords = body.target_word_count || section.target_word_count || 1000;

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
1. 内容要专业、准确
2. 语言风格：${book.tone}
3. 目标读者：${book.audience}
4. 内容要围绕小节主题深入展开
5. 可以包含案例、数据、分析等
6. 使用Markdown格式，包含适当的段落、标题、列表等

请直接输出内容，不要JSON格式。`;

    const apiKey = c.env.GEMINI_API_KEY;
    const content = await callGeminiAPI(apiKey!, prompt);

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

    await c.env.DB.prepare(`
      UPDATE ai_books 
      SET title = ?, description = ?, author_name = ?,
          preface = ?, introduction = ?, conclusion = ?, afterword = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      body.title,
      body.description,
      body.author_name,
      body.preface || null,
      body.introduction || null,
      body.conclusion || null,
      body.afterword || null,
      bookId,
      user.id
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
    const sectionId = c.req.param('sectionId');
    const body = await c.req.json();

    const wordCount = (body.content || '').replace(/\s/g, '').length;

    await c.env.DB.prepare(`
      UPDATE ai_sections 
      SET title = ?, description = ?, content = ?, current_word_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.title,
      body.description,
      body.content,
      wordCount,
      sectionId
    ).run();

    return c.json({ success: true });
  } catch (error: any) {
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
