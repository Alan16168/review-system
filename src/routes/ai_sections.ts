// AI Sections Routes - Manhattan Project Phase 1
// Handles section management and content generation

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// Helper Functions
// ============================================================================

// Calculate word count from text (supports Chinese and English)
function calculateWordCount(text: string): number {
  if (!text) return 0
  
  // Remove all whitespace and count characters for Chinese text
  // For English, this will still give a reasonable approximation
  const cleanText = text.replace(/\s+/g, '')
  
  // Count Chinese characters (CJK Unified Ideographs)
  const chineseChars = cleanText.match(/[\u4e00-\u9fa5]/g)
  const chineseCount = chineseChars ? chineseChars.length : 0
  
  // Count remaining non-Chinese text as words
  const nonChineseText = cleanText.replace(/[\u4e00-\u9fa5]/g, '')
  const englishWords = nonChineseText.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 0)
  const englishCount = englishWords.length
  
  return chineseCount + englishCount
}

// Update chapter word count based on its sections
async function updateChapterWordCount(DB: D1Database, chapterId: number) {
  const result = await DB.prepare(`
    SELECT SUM(current_word_count) as total 
    FROM ai_sections 
    WHERE chapter_id = ?
  `).bind(chapterId).first()
  
  const totalWords = result?.total || 0
  
  await DB.prepare(`
    UPDATE ai_chapters 
    SET word_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(totalWords, chapterId).run()
  
  // Also update book word count
  const chapter = await DB.prepare(`
    SELECT book_id FROM ai_chapters WHERE id = ?
  `).bind(chapterId).first()
  
  if (chapter) {
    await updateBookWordCount(DB, chapter.book_id)
  }
}

// Update book word count based on all its sections
async function updateBookWordCount(DB: D1Database, bookId: number) {
  const result = await DB.prepare(`
    SELECT SUM(current_word_count) as total 
    FROM ai_sections 
    WHERE book_id = ?
  `).bind(bookId).first()
  
  const totalWords = result?.total || 0
  
  await DB.prepare(`
    UPDATE ai_books 
    SET current_word_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(totalWords, bookId).run()
}

// ============================================================================
// Routes
// ============================================================================

// POST /api/ai-sections - Create sections (batch support for AI-generated sections)
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { chapter_id, book_id, sections } = body
    
    if (!chapter_id || !book_id) {
      return c.json({ error: 'chapter_id and book_id are required' }, 400)
    }
    
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return c.json({ error: 'sections array is required' }, 400)
    }
    
    const { DB } = c.env
    
    // Verify chapter ownership through book
    const chapter = await DB.prepare(`
      SELECT c.* FROM ai_chapters c
      JOIN ai_books b ON c.book_id = b.id
      WHERE c.id = ? AND c.book_id = ? AND b.user_id = ?
    `).bind(chapter_id, book_id, user.id).first()
    
    if (!chapter) {
      return c.json({ error: 'Chapter not found or access denied' }, 404)
    }
    
    // Validate sections
    for (const section of sections) {
      if (!section.title || section.title.length > 50) {
        return c.json({ 
          error: 'Each section must have a title (max 50 characters)' 
        }, 400)
      }
      
      if (section.description && section.description.length > 500) {
        return c.json({ 
          error: 'Section description must be 500 characters or less' 
        }, 400)
      }
    }
    
    // Get next section number for this chapter
    const lastSection = await DB.prepare(`
      SELECT MAX(section_number) as max_num 
      FROM ai_sections 
      WHERE chapter_id = ?
    `).bind(chapter_id).first()
    
    let nextSectionNumber = (lastSection?.max_num || 0) + 1
    
    // Insert sections
    const createdSections = []
    
    for (const section of sections) {
      const wordCount = section.content ? calculateWordCount(section.content) : 0
      
      const result = await DB.prepare(`
        INSERT INTO ai_sections (
          chapter_id, book_id, section_number, title, description,
          content, target_word_count, current_word_count,
          sort_order, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        chapter_id,
        book_id,
        nextSectionNumber,
        section.title,
        section.description || null,
        section.content || null,
        section.target_word_count || 1000,
        wordCount,
        section.sort_order || nextSectionNumber
      ).run()
      
      if (result.success) {
        const newSection = await DB.prepare(`
          SELECT * FROM ai_sections WHERE id = ?
        `).bind(result.meta.last_row_id).first()
        
        createdSections.push(newSection)
      }
      
      nextSectionNumber++
    }
    
    // Update chapter and book word counts
    await updateChapterWordCount(DB, chapter_id)
    
    return c.json({ 
      message: `${createdSections.length} section(s) created successfully`,
      sections: createdSections 
    }, 201)
    
  } catch (error: any) {
    console.error('Error creating sections:', error)
    return c.json({ error: 'Failed to create sections', details: error.message }, 500)
  }
})

// GET /api/ai-sections/:id - Get section details
app.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const sectionId = c.req.param('id')
    const { DB } = c.env
    
    // Get section with ownership verification
    const section = await DB.prepare(`
      SELECT s.* 
      FROM ai_sections s
      JOIN ai_chapters c ON s.chapter_id = c.id
      JOIN ai_books b ON s.book_id = b.id
      WHERE s.id = ? AND b.user_id = ?
    `).bind(sectionId, user.id).first()
    
    if (!section) {
      return c.json({ error: 'Section not found' }, 404)
    }
    
    return c.json({ section })
    
  } catch (error: any) {
    console.error('Error fetching section:', error)
    return c.json({ error: 'Failed to fetch section', details: error.message }, 500)
  }
})

// PUT /api/ai-sections/:id - Update section (including content editing)
app.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const sectionId = c.req.param('id')
    const { DB } = c.env
    
    // Verify ownership through book
    const section = await DB.prepare(`
      SELECT s.* 
      FROM ai_sections s
      JOIN ai_chapters c ON s.chapter_id = c.id
      JOIN ai_books b ON s.book_id = b.id
      WHERE s.id = ? AND b.user_id = ?
    `).bind(sectionId, user.id).first()
    
    if (!section) {
      return c.json({ error: 'Section not found' }, 404)
    }
    
    const body = await c.req.json()
    const { title, description, content, target_word_count, sort_order, status } = body
    
    const updates: string[] = []
    const params: any[] = []
    
    if (title !== undefined) {
      if (title.length > 50) {
        return c.json({ error: 'Title must be 50 characters or less' }, 400)
      }
      updates.push('title = ?')
      params.push(title)
    }
    
    if (description !== undefined) {
      if (description && description.length > 500) {
        return c.json({ error: 'Description must be 500 characters or less' }, 400)
      }
      updates.push('description = ?')
      params.push(description)
    }
    
    if (content !== undefined) {
      const wordCount = calculateWordCount(content)
      updates.push('content = ?')
      params.push(content)
      updates.push('current_word_count = ?')
      params.push(wordCount)
      
      // If content is being completed, update status
      if (wordCount > 0 && section.status === 'draft') {
        updates.push('status = ?')
        params.push('completed')
        updates.push('generated_at = CURRENT_TIMESTAMP')
      }
    }
    
    if (target_word_count !== undefined) {
      updates.push('target_word_count = ?')
      params.push(target_word_count)
    }
    
    if (sort_order !== undefined) {
      updates.push('sort_order = ?')
      params.push(sort_order)
    }
    
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(sectionId)
    
    const query = `
      UPDATE ai_sections 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `
    
    await DB.prepare(query).bind(...params).run()
    
    // Get updated section
    const updatedSection = await DB.prepare(`
      SELECT * FROM ai_sections WHERE id = ?
    `).bind(sectionId).first()
    
    // Update chapter and book word counts
    await updateChapterWordCount(DB, section.chapter_id)
    
    return c.json({ 
      message: 'Section updated successfully', 
      section: updatedSection 
    })
    
  } catch (error: any) {
    console.error('Error updating section:', error)
    return c.json({ error: 'Failed to update section', details: error.message }, 500)
  }
})

// DELETE /api/ai-sections/:id - Delete section
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const sectionId = c.req.param('id')
    const { DB } = c.env
    
    // Verify ownership
    const section = await DB.prepare(`
      SELECT s.* 
      FROM ai_sections s
      JOIN ai_chapters c ON s.chapter_id = c.id
      JOIN ai_books b ON s.book_id = b.id
      WHERE s.id = ? AND b.user_id = ?
    `).bind(sectionId, user.id).first()
    
    if (!section) {
      return c.json({ error: 'Section not found' }, 404)
    }
    
    const chapterId = section.chapter_id
    
    // Delete section
    await DB.prepare(`
      DELETE FROM ai_sections WHERE id = ?
    `).bind(sectionId).run()
    
    // Update chapter and book word counts
    await updateChapterWordCount(DB, chapterId)
    
    return c.json({ 
      message: 'Section deleted successfully' 
    })
    
  } catch (error: any) {
    console.error('Error deleting section:', error)
    return c.json({ error: 'Failed to delete section', details: error.message }, 500)
  }
})

// POST /api/ai-sections/batch-update-order - Batch update section order
app.post('/batch-update-order', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { sections } = body // Array of { id, sort_order }
    
    if (!sections || !Array.isArray(sections)) {
      return c.json({ error: 'sections array is required' }, 400)
    }
    
    const { DB } = c.env
    
    // Update each section's sort order
    for (const section of sections) {
      // Verify ownership first
      const existing = await DB.prepare(`
        SELECT s.id 
        FROM ai_sections s
        JOIN ai_chapters c ON s.chapter_id = c.id
        JOIN ai_books b ON s.book_id = b.id
        WHERE s.id = ? AND b.user_id = ?
      `).bind(section.id, user.id).first()
      
      if (existing) {
        await DB.prepare(`
          UPDATE ai_sections 
          SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(section.sort_order, section.id).run()
      }
    }
    
    return c.json({ 
      message: 'Section order updated successfully' 
    })
    
  } catch (error: any) {
    console.error('Error updating section order:', error)
    return c.json({ error: 'Failed to update section order', details: error.message }, 500)
  }
})

export default app
