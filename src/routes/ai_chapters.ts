// AI Chapters Routes - Manhattan Project Phase 1
// Handles chapter management and AI generation

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// Routes
// ============================================================================

// POST /api/ai-chapters - Create chapters (can be batch)
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { book_id, chapters } = body
    
    if (!book_id) {
      return c.json({ error: 'book_id is required' }, 400)
    }
    
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return c.json({ error: 'chapters array is required' }, 400)
    }
    
    const { DB } = c.env
    
    // Verify book ownership
    const book = await DB.prepare(`
      SELECT id FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(book_id, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    // Validate chapters
    for (const chapter of chapters) {
      if (!chapter.title || chapter.title.length > 50) {
        return c.json({ 
          error: 'Each chapter must have a title (max 50 characters)' 
        }, 400)
      }
      
      if (chapter.description && chapter.description.length > 500) {
        return c.json({ 
          error: 'Chapter description must be 500 characters or less' 
        }, 400)
      }
    }
    
    // Get next chapter number
    const lastChapter = await DB.prepare(`
      SELECT MAX(chapter_number) as max_num FROM ai_chapters WHERE book_id = ?
    `).bind(book_id).first()
    
    let nextChapterNumber = (lastChapter?.max_num || 0) + 1
    
    // Insert chapters
    const createdChapters = []
    
    for (const chapter of chapters) {
      const result = await DB.prepare(`
        INSERT INTO ai_chapters (
          book_id, chapter_number, title, description,
          sort_order, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        book_id,
        nextChapterNumber,
        chapter.title,
        chapter.description || null,
        chapter.sort_order || nextChapterNumber
      ).run()
      
      if (result.success) {
        const newChapter = await DB.prepare(`
          SELECT * FROM ai_chapters WHERE id = ?
        `).bind(result.meta.last_row_id).first()
        
        createdChapters.push(newChapter)
      }
      
      nextChapterNumber++
    }
    
    return c.json({ 
      message: `${createdChapters.length} chapter(s) created successfully`,
      chapters: createdChapters 
    }, 201)
    
  } catch (error: any) {
    console.error('Error creating chapters:', error)
    return c.json({ error: 'Failed to create chapters', details: error.message }, 500)
  }
})

// PUT /api/ai-chapters/:id - Update chapter
app.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const chapterId = c.req.param('id')
    const { DB } = c.env
    
    // Verify ownership through book
    const chapter = await DB.prepare(`
      SELECT c.* FROM ai_chapters c
      JOIN ai_books b ON c.book_id = b.id
      WHERE c.id = ? AND b.user_id = ?
    `).bind(chapterId, user.id).first()
    
    if (!chapter) {
      return c.json({ error: 'Chapter not found' }, 404)
    }
    
    const body = await c.req.json()
    const { title, description, sort_order, status } = body
    
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
    params.push(chapterId)
    
    const query = `
      UPDATE ai_chapters 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `
    
    await DB.prepare(query).bind(...params).run()
    
    // Get updated chapter
    const updatedChapter = await DB.prepare(`
      SELECT * FROM ai_chapters WHERE id = ?
    `).bind(chapterId).first()
    
    // Update chapter word count
    await updateChapterWordCount(DB, chapterId)
    
    return c.json({ 
      message: 'Chapter updated successfully', 
      chapter: updatedChapter 
    })
    
  } catch (error: any) {
    console.error('Error updating chapter:', error)
    return c.json({ error: 'Failed to update chapter', details: error.message }, 500)
  }
})

// DELETE /api/ai-chapters/:id - Delete chapter
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const chapterId = c.req.param('id')
    const { DB } = c.env
    
    // Verify ownership
    const chapter = await DB.prepare(`
      SELECT c.* FROM ai_chapters c
      JOIN ai_books b ON c.book_id = b.id
      WHERE c.id = ? AND b.user_id = ?
    `).bind(chapterId, user.id).first()
    
    if (!chapter) {
      return c.json({ error: 'Chapter not found' }, 404)
    }
    
    // Delete chapter (cascades to sections)
    await DB.prepare(`
      DELETE FROM ai_chapters WHERE id = ?
    `).bind(chapterId).run()
    
    // Update book word count
    await updateBookWordCount(DB, chapter.book_id)
    
    return c.json({ 
      message: 'Chapter deleted successfully' 
    })
    
  } catch (error: any) {
    console.error('Error deleting chapter:', error)
    return c.json({ error: 'Failed to delete chapter', details: error.message }, 500)
  }
})

// Helper: Update chapter word count
async function updateChapterWordCount(DB: D1Database, chapterId: number) {
  const result = await DB.prepare(`
    SELECT SUM(current_word_count) as total 
    FROM ai_sections 
    WHERE chapter_id = ?
  `).bind(chapterId).first()
  
  const totalWords = result?.total || 0
  
  await DB.prepare(`
    UPDATE ai_chapters 
    SET word_count = ? 
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

// Helper: Update book word count
async function updateBookWordCount(DB: D1Database, bookId: number) {
  const result = await DB.prepare(`
    SELECT SUM(current_word_count) as total 
    FROM ai_sections 
    WHERE book_id = ?
  `).bind(bookId).first()
  
  const totalWords = result?.total || 0
  
  await DB.prepare(`
    UPDATE ai_books 
    SET current_word_count = ? 
    WHERE id = ?
  `).bind(totalWords, bookId).run()
}

export default app
