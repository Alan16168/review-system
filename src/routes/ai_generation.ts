// AI Generation Routes - Manhattan Project Phase 1
// Handles AI content generation using Gemini API

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  GEMINI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// Helper Functions
// ============================================================================

// Call Gemini API
async function callGeminiAPI(apiKey: string, prompt: string, temperature = 0.7, maxTokens = 4096): Promise<string> {
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
          temperature,
          maxOutputTokens: maxTokens,
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data: any = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// Calculate word count
function calculateWordCount(text: string): number {
  if (!text) return 0
  const cleanText = text.replace(/\s+/g, '')
  const chineseChars = cleanText.match(/[\u4e00-\u9fa5]/g)
  const chineseCount = chineseChars ? chineseChars.length : 0
  const nonChineseText = cleanText.replace(/[\u4e00-\u9fa5]/g, '')
  const englishWords = nonChineseText.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 0)
  return chineseCount + englishWords.length
}

// Check subscription limits
async function checkGenerationLimit(DB: D1Database, userId: number, tier: string): Promise<{ allowed: boolean, message?: string }> {
  // Get current month's generation count
  const result = await DB.prepare(`
    SELECT COUNT(*) as count 
    FROM ai_generation_log 
    WHERE user_id = ? 
    AND status = 'completed'
    AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).bind(userId).first()
  
  const currentCount = result?.count || 0
  
  const limits: any = {
    'free': 10,
    'premium': 100,
    'super': 999999
  }
  
  const limit = limits[tier] || 10
  
  if (currentCount >= limit) {
    return {
      allowed: false,
      message: `Monthly generation limit reached (${limit} generations per month for ${tier} tier)`
    }
  }
  
  return { allowed: true }
}

// ============================================================================
// POST /api/ai-generation/chapters - Generate chapters for a book (Level 1)
// ============================================================================

app.post('/chapters', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { book_id, num_chapters } = body
    
    if (!book_id) {
      return c.json({ error: 'book_id is required' }, 400)
    }
    
    const { DB, GEMINI_API_KEY } = c.env
    
    if (!GEMINI_API_KEY) {
      return c.json({ error: 'Gemini API key not configured' }, 500)
    }
    
    // Check generation limits
    const limitCheck = await checkGenerationLimit(DB, user.id, user.subscription_tier)
    if (!limitCheck.allowed) {
      return c.json({ error: limitCheck.message }, 403)
    }
    
    // Get book details
    const book: any = await DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(book_id, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    const chaptersToGenerate = num_chapters || 10
    
    // Build prompt
    const prompt = `你是一位专业的书籍大纲规划专家。

书籍主题：${book.title}
主题描述：${book.description || '无'}
目标字数：${book.target_word_count}字
语气风格：${book.tone}
目标读者：${book.audience}

请为这本书生成${chaptersToGenerate}个章节标题。

要求：
1. 每个章节标题50字以内
2. 章节标题要逻辑清晰，循序渐进
3. 章节内容要全面覆盖主题
4. 请按照JSON格式返回，格式如下：
{
  "chapters": [
    {"number": 1, "title": "章节标题", "description": "章节简介（50字内）"},
    {"number": 2, "title": "章节标题", "description": "章节简介（50字内）"}
  ]
}

只返回JSON，不要其他说明文字。`
    
    // Call Gemini API
    const startTime = Date.now()
    const response = await callGeminiAPI(GEMINI_API_KEY, prompt, 0.7, 4096)
    const duration = Date.now() - startTime
    
    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }
    
    const data = JSON.parse(jsonMatch[0])
    
    if (!data.chapters || !Array.isArray(data.chapters)) {
      throw new Error('Invalid response format: chapters array not found')
    }
    
    // Insert chapters into database
    const createdChapters = []
    for (const chapter of data.chapters) {
      const result = await DB.prepare(`
        INSERT INTO ai_chapters (
          book_id, chapter_number, title, description,
          sort_order, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        book_id,
        chapter.number,
        chapter.title.substring(0, 50),
        chapter.description?.substring(0, 500) || null,
        chapter.number
      ).run()
      
      if (result.success) {
        const newChapter = await DB.prepare(`
          SELECT * FROM ai_chapters WHERE id = ?
        `).bind(result.meta.last_row_id).first()
        createdChapters.push(newChapter)
      }
    }
    
    // Update book status
    await DB.prepare(`
      UPDATE ai_books 
      SET status = 'generating', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(book_id).run()
    
    // Log generation
    await DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response,
        tokens_used, cost_credits, status, created_at
      ) VALUES (?, ?, 'chapters', ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `).bind(
      user.id,
      book_id,
      prompt,
      response,
      Math.ceil(response.length / 4), // Approximate token count
      1,
    ).run()
    
    return c.json({
      message: `Generated ${createdChapters.length} chapters successfully`,
      chapters: createdChapters,
      duration_ms: duration
    })
    
  } catch (error: any) {
    console.error('Error generating chapters:', error)
    return c.json({ error: 'Failed to generate chapters', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/ai-generation/sections - Generate sections for a chapter (Level 2)
// ============================================================================

app.post('/sections', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { chapter_id, num_sections } = body
    
    if (!chapter_id) {
      return c.json({ error: 'chapter_id is required' }, 400)
    }
    
    const { DB, GEMINI_API_KEY } = c.env
    
    if (!GEMINI_API_KEY) {
      return c.json({ error: 'Gemini API key not configured' }, 500)
    }
    
    // Check generation limits
    const limitCheck = await checkGenerationLimit(DB, user.id, user.subscription_tier)
    if (!limitCheck.allowed) {
      return c.json({ error: limitCheck.message }, 403)
    }
    
    // Get chapter and book details
    const chapter: any = await DB.prepare(`
      SELECT c.*, b.title as book_title, b.description as book_description,
             b.tone, b.audience, b.user_id
      FROM ai_chapters c
      JOIN ai_books b ON c.book_id = b.id
      WHERE c.id = ?
    `).bind(chapter_id).first()
    
    if (!chapter) {
      return c.json({ error: 'Chapter not found' }, 404)
    }
    
    if (chapter.user_id !== user.id) {
      return c.json({ error: 'Access denied' }, 403)
    }
    
    const sectionsToGenerate = num_sections || 5
    
    // Build prompt
    const prompt = `你是一位专业的书籍内容规划专家。

书籍主题：${chapter.book_title}
主题描述：${chapter.book_description || '无'}

当前章节：第${chapter.chapter_number}章 - ${chapter.title}
章节描述：${chapter.description || '无'}

请为这个章节生成${sectionsToGenerate}个小节标题。

要求：
1. 每个小节标题50字以内
2. 小节内容要围绕章节主题展开
3. 小节之间要有逻辑连贯性
4. 请按照JSON格式返回：
{
  "sections": [
    {"number": 1, "title": "小节标题", "description": "小节简介（50字内）"},
    {"number": 2, "title": "小节标题", "description": "小节简介（50字内）"}
  ]
}

只返回JSON，不要其他说明文字。`
    
    // Call Gemini API
    const startTime = Date.now()
    const response = await callGeminiAPI(GEMINI_API_KEY, prompt, 0.7, 4096)
    const duration = Date.now() - startTime
    
    // Parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }
    
    const data = JSON.parse(jsonMatch[0])
    
    if (!data.sections || !Array.isArray(data.sections)) {
      throw new Error('Invalid response format: sections array not found')
    }
    
    // Insert sections
    const createdSections = []
    for (const section of data.sections) {
      const result = await DB.prepare(`
        INSERT INTO ai_sections (
          chapter_id, book_id, section_number, title, description,
          target_word_count, current_word_count,
          sort_order, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1000, 0, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        chapter_id,
        chapter.book_id,
        section.number,
        section.title.substring(0, 50),
        section.description?.substring(0, 500) || null,
        section.number
      ).run()
      
      if (result.success) {
        const newSection = await DB.prepare(`
          SELECT * FROM ai_sections WHERE id = ?
        `).bind(result.meta.last_row_id).first()
        createdSections.push(newSection)
      }
    }
    
    // Update chapter status
    await DB.prepare(`
      UPDATE ai_chapters 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(chapter_id).run()
    
    // Log generation
    await DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response,
        tokens_used, cost_credits, status, created_at
      ) VALUES (?, ?, 'sections', ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `).bind(
      user.id,
      chapter.book_id,
      prompt,
      response,
      Math.ceil(response.length / 4),
      1
    ).run()
    
    return c.json({
      message: `Generated ${createdSections.length} sections successfully`,
      sections: createdSections,
      duration_ms: duration
    })
    
  } catch (error: any) {
    console.error('Error generating sections:', error)
    return c.json({ error: 'Failed to generate sections', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/ai-generation/content - Generate content for a section (Level 3)
// ============================================================================

app.post('/content', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { section_id, target_word_count } = body
    
    if (!section_id) {
      return c.json({ error: 'section_id is required' }, 400)
    }
    
    const { DB, GEMINI_API_KEY } = c.env
    
    if (!GEMINI_API_KEY) {
      return c.json({ error: 'Gemini API key not configured' }, 500)
    }
    
    // Check generation limits
    const limitCheck = await checkGenerationLimit(DB, user.id, user.subscription_tier)
    if (!limitCheck.allowed) {
      return c.json({ error: limitCheck.message }, 403)
    }
    
    // Get full context
    const section: any = await DB.prepare(`
      SELECT 
        s.*,
        c.title as chapter_title,
        c.description as chapter_description,
        c.chapter_number,
        b.title as book_title,
        b.description as book_description,
        b.tone,
        b.audience,
        b.language,
        b.user_id
      FROM ai_sections s
      JOIN ai_chapters c ON s.chapter_id = c.id
      JOIN ai_books b ON s.book_id = b.id
      WHERE s.id = ?
    `).bind(section_id).first()
    
    if (!section) {
      return c.json({ error: 'Section not found' }, 404)
    }
    
    if (section.user_id !== user.id) {
      return c.json({ error: 'Access denied' }, 403)
    }
    
    const targetWords = target_word_count || section.target_word_count || 1000
    
    // Build comprehensive prompt with strict word count control
    const prompt = `你是一位专业的内容创作者。

书籍主题：${section.book_title}
主题描述：${section.book_description || '无'}

章节：第${section.chapter_number}章 - ${section.chapter_title}
章节描述：${section.chapter_description || '无'}

当前小节：${section.section_number}. ${section.title}
小节描述：${section.description || '无'}

⚠️ 字数要求：必须严格控制在 ${targetWords} 字左右（上下浮动不超过10%，即${Math.floor(targetWords * 0.9)}-${Math.ceil(targetWords * 1.1)}字）

内容要求：
1. 内容要专业、准确、有深度
2. 语言风格：${section.tone}
3. 目标读者：${section.audience}
4. 内容要围绕小节主题深入展开
5. 可以包含案例、数据、分析、示例等
6. 使用Markdown格式，包含适当的段落、标题、列表等
7. 内容要有条理性和可读性
8. **字数控制优先级最高**：如果内容过长，请精简；如果过短，请适当扩展

字数计算规则：
- 中文字符：每个汉字算1个字
- 英文单词：每个单词算1个字
- 标点符号和空格不计入字数

请直接输出内容，不要JSON格式，不要前言后语。生成完成后请自己检查字数是否符合要求。`
    
    // Call Gemini API with higher token limit for content
    const startTime = Date.now()
    const content = await callGeminiAPI(GEMINI_API_KEY, prompt, 0.7, 8192)
    const duration = Date.now() - startTime
    
    // Calculate word count
    const wordCount = calculateWordCount(content)
    
    // Update section with generated content
    await DB.prepare(`
      UPDATE ai_sections 
      SET content = ?, 
          current_word_count = ?, 
          status = 'completed',
          generated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(content, wordCount, section_id).run()
    
    // Update book word count
    const totalWords: any = await DB.prepare(`
      SELECT SUM(current_word_count) as total 
      FROM ai_sections 
      WHERE book_id = ?
    `).bind(section.book_id).first()
    
    await DB.prepare(`
      UPDATE ai_books 
      SET current_word_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(totalWords?.total || 0, section.book_id).run()
    
    // Update chapter word count
    const chapterWords: any = await DB.prepare(`
      SELECT SUM(current_word_count) as total 
      FROM ai_sections 
      WHERE chapter_id = ?
    `).bind(section.chapter_id).first()
    
    await DB.prepare(`
      UPDATE ai_chapters 
      SET word_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(chapterWords?.total || 0, section.chapter_id).run()
    
    // Log generation
    await DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response,
        tokens_used, cost_credits, status, created_at
      ) VALUES (?, ?, 'content', ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `).bind(
      user.id,
      section.book_id,
      prompt,
      content.substring(0, 5000), // Store first 5000 chars of content
      Math.ceil(content.length / 4),
      1
    ).run()
    
    return c.json({
      message: 'Content generated successfully',
      content,
      word_count: wordCount,
      duration_ms: duration
    })
    
  } catch (error: any) {
    console.error('Error generating content:', error)
    return c.json({ error: 'Failed to generate content', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/ai-generation/preface - Generate preface for a book
// ============================================================================

app.post('/preface', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { book_id, target_word_count } = body
    
    if (!book_id) {
      return c.json({ error: 'book_id is required' }, 400)
    }
    
    const { DB, GEMINI_API_KEY } = c.env
    
    if (!GEMINI_API_KEY) {
      return c.json({ error: 'Gemini API key not configured' }, 500)
    }
    
    // Check generation limits
    const limitCheck = await checkGenerationLimit(DB, user.id, user.subscription_tier)
    if (!limitCheck.allowed) {
      return c.json({ error: limitCheck.message }, 403)
    }
    
    // Get book details
    const book: any = await DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(book_id, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    const targetWords = target_word_count || 500
    
    // Build prompt with strict word count control
    const prompt = `你是一位专业的作家。

书籍主题：${book.title}
主题描述：${book.description || '无'}
作者：${book.author_name || '匿名'}

⚠️ 字数要求：必须严格控制在 ${targetWords} 字左右（上下浮动不超过10%，即${Math.floor(targetWords * 0.9)}-${Math.ceil(targetWords * 1.1)}字）

请为这本书撰写前言。

内容要求：
1. 介绍本书的创作背景和动机
2. 说明本书的主要内容和价值
3. 阐述本书适合哪些读者
4. 语言风格：${book.tone}
5. 使用Markdown格式
6. **字数控制优先级最高**：如果内容过长，请精简；如果过短，请适当扩展

字数计算规则：
- 中文字符：每个汉字算1个字
- 英文单词：每个单词算1个字
- 标点符号和空格不计入字数

请直接输出前言内容，不要JSON格式。生成完成后请自己检查字数是否符合要求。`
    
    // Call Gemini API
    const startTime = Date.now()
    const preface = await callGeminiAPI(GEMINI_API_KEY, prompt, 0.7, 4096)
    const duration = Date.now() - startTime
    
    // Update book
    await DB.prepare(`
      UPDATE ai_books 
      SET preface = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(preface, book_id).run()
    
    // Log generation
    await DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response,
        tokens_used, cost_credits, status, created_at
      ) VALUES (?, ?, 'preface', ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `).bind(
      user.id,
      book_id,
      prompt,
      preface,
      Math.ceil(preface.length / 4),
      1
    ).run()
    
    return c.json({
      message: 'Preface generated successfully',
      preface,
      duration_ms: duration
    })
    
  } catch (error: any) {
    console.error('Error generating preface:', error)
    return c.json({ error: 'Failed to generate preface', details: error.message }, 500)
  }
})

// ============================================================================
// POST /api/ai-generation/afterword - Generate afterword for a book
// ============================================================================

app.post('/afterword', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { book_id, target_word_count } = body
    
    if (!book_id) {
      return c.json({ error: 'book_id is required' }, 400)
    }
    
    const { DB, GEMINI_API_KEY } = c.env
    
    if (!GEMINI_API_KEY) {
      return c.json({ error: 'Gemini API key not configured' }, 500)
    }
    
    // Check generation limits
    const limitCheck = await checkGenerationLimit(DB, user.id, user.subscription_tier)
    if (!limitCheck.allowed) {
      return c.json({ error: limitCheck.message }, 403)
    }
    
    // Get book details
    const book: any = await DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(book_id, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    const targetWords = target_word_count || 300
    
    // Build prompt with strict word count control
    const prompt = `你是一位专业的作家。

书籍主题：${book.title}
主题描述：${book.description || '无'}
作者：${book.author_name || '匿名'}

⚠️ 字数要求：必须严格控制在 ${targetWords} 字左右（上下浮动不超过10%，即${Math.floor(targetWords * 0.9)}-${Math.ceil(targetWords * 1.1)}字）

请为这本书撰写后记。

内容要求：
1. 总结全书的核心内容
2. 分享创作感悟和心得
3. 感谢读者并展望未来
4. 语言风格：${book.tone}
5. 使用Markdown格式
6. **字数控制优先级最高**：如果内容过长，请精简；如果过短，请适当扩展

字数计算规则：
- 中文字符：每个汉字算1个字
- 英文单词：每个单词算1个字
- 标点符号和空格不计入字数

请直接输出后记内容，不要JSON格式。生成完成后请自己检查字数是否符合要求。`
    
    // Call Gemini API
    const startTime = Date.now()
    const afterword = await callGeminiAPI(GEMINI_API_KEY, prompt, 0.7, 4096)
    const duration = Date.now() - startTime
    
    // Update book
    await DB.prepare(`
      UPDATE ai_books 
      SET afterword = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(afterword, book_id).run()
    
    // Log generation
    await DB.prepare(`
      INSERT INTO ai_generation_log (
        user_id, book_id, generation_type, prompt, response,
        tokens_used, cost_credits, status, created_at
      ) VALUES (?, ?, 'conclusion', ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
    `).bind(
      user.id,
      book_id,
      prompt,
      afterword,
      Math.ceil(afterword.length / 4),
      1
    ).run()
    
    return c.json({
      message: 'Afterword generated successfully',
      afterword,
      duration_ms: duration
    })
    
  } catch (error: any) {
    console.error('Error generating afterword:', error)
    return c.json({ error: 'Failed to generate afterword', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/ai-generation/usage - Get user's generation usage statistics
// ============================================================================

app.get('/usage', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { DB } = c.env
    
    // Get current month's usage
    const monthlyUsage: any = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_generation_log
      WHERE user_id = ?
      AND status = 'completed'
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).bind(user.id).first()
    
    // Get total usage
    const totalUsage: any = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_generation_log
      WHERE user_id = ?
      AND status = 'completed'
    `).bind(user.id).first()
    
    // Get tier limits
    const limits: any = {
      'free': 10,
      'premium': 100,
      'super': 999999
    }
    
    const tier = user.subscription_tier || 'free'
    const limit = limits[tier]
    
    return c.json({
      tier,
      monthly_usage: monthlyUsage?.count || 0,
      monthly_limit: limit,
      total_usage: totalUsage?.count || 0,
      remaining: limit - (monthlyUsage?.count || 0)
    })
    
  } catch (error: any) {
    console.error('Error fetching usage:', error)
    return c.json({ error: 'Failed to fetch usage', details: error.message }, 500)
  }
})

export default app
