// AI Export Routes - Manhattan Project Phase 1
// Handles HTML export for AI-generated books

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// Helper Functions
// ============================================================================

// Convert Markdown to HTML (basic implementation)
function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  // Clean up
  html = html.replace(/<p><h/g, '<h')
  html = html.replace(/<\/h[123]><\/p>/g, '')
  html = html.replace(/<p><ul>/g, '<ul>')
  html = html.replace(/<\/ul><\/p>/g, '</ul>')
  html = html.replace(/<p><pre>/g, '<pre>')
  html = html.replace(/<\/pre><\/p>/g, '</pre>')
  
  return html
}

// Generate HTML book template
function generateBookHtml(book: any, chapters: any[], sections: any[]): string {
  const bookTitle = book.title || 'Untitled Book'
  const authorName = book.author_name || 'Anonymous'
  
  // Build table of contents
  let toc = '<div class="toc">\n<h2>目录</h2>\n<ul>\n'
  for (const chapter of chapters) {
    toc += `  <li><a href="#chapter-${chapter.id}">第${chapter.chapter_number}章 ${chapter.title}</a></li>\n`
  }
  toc += '</ul>\n</div>\n'
  
  // Build content
  let content = ''
  
  // Preface
  if (book.preface) {
    content += '<div class="preface page-break">\n'
    content += '<h2 class="section-title">前言</h2>\n'
    content += markdownToHtml(book.preface)
    content += '</div>\n\n'
  }
  
  // Chapters and sections
  for (const chapter of chapters) {
    content += `<div class="chapter page-break" id="chapter-${chapter.id}">\n`
    content += `<h1 class="chapter-title">第${chapter.chapter_number}章 ${chapter.title}</h1>\n`
    
    if (chapter.description) {
      content += `<p class="chapter-description">${chapter.description}</p>\n`
    }
    
    // Get sections for this chapter
    const chapterSections = sections
      .filter(s => s.chapter_id === chapter.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    
    for (const section of chapterSections) {
      content += `<div class="section">\n`
      content += `<h2 class="section-title">${section.section_number}. ${section.title}</h2>\n`
      
      if (section.content) {
        content += markdownToHtml(section.content)
      } else {
        content += '<p class="placeholder">[内容待生成]</p>\n'
      }
      
      content += '</div>\n\n'
    }
    
    content += '</div>\n\n'
  }
  
  // Afterword
  if (book.afterword) {
    content += '<div class="afterword page-break">\n'
    content += '<h2 class="section-title">后记</h2>\n'
    content += markdownToHtml(book.afterword)
    content += '</div>\n\n'
  }
  
  // Complete HTML document
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: "Source Han Serif CN", "Noto Serif SC", serif;
            line-height: 1.8;
            color: #333;
            background: #f9f9f9;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 60px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        /* Cover page */
        .cover {
            text-align: center;
            padding: 100px 20px;
            page-break-after: always;
        }
        
        .cover h1 {
            font-size: 48px;
            margin-bottom: 40px;
            font-weight: bold;
            color: #222;
        }
        
        .cover .author {
            font-size: 24px;
            color: #666;
            margin-top: 40px;
        }
        
        .cover .meta {
            margin-top: 60px;
            color: #999;
            font-size: 14px;
        }
        
        /* Table of contents */
        .toc {
            padding: 40px 0;
            page-break-after: always;
        }
        
        .toc h2 {
            font-size: 32px;
            margin-bottom: 30px;
            text-align: center;
            color: #222;
        }
        
        .toc ul {
            list-style: none;
        }
        
        .toc li {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        .toc a {
            color: #0066cc;
            text-decoration: none;
            font-size: 18px;
        }
        
        .toc a:hover {
            text-decoration: underline;
        }
        
        /* Chapter */
        .chapter {
            margin-bottom: 80px;
        }
        
        .chapter-title {
            font-size: 36px;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #0066cc;
            color: #222;
            font-weight: bold;
        }
        
        .chapter-description {
            font-size: 16px;
            color: #666;
            margin-bottom: 40px;
            font-style: italic;
        }
        
        /* Section */
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 24px;
            margin-bottom: 20px;
            color: #333;
            font-weight: bold;
        }
        
        /* Content */
        p {
            margin-bottom: 16px;
            text-align: justify;
            text-indent: 2em;
            font-size: 16px;
        }
        
        h1, h2, h3 {
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        h1 { font-size: 28px; }
        h2 { font-size: 24px; }
        h3 { font-size: 20px; }
        
        ul, ol {
            margin: 20px 0;
            padding-left: 40px;
        }
        
        li {
            margin: 10px 0;
            line-height: 1.6;
        }
        
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "Courier New", monospace;
            font-size: 14px;
        }
        
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        strong {
            font-weight: bold;
            color: #222;
        }
        
        em {
            font-style: italic;
        }
        
        .placeholder {
            color: #999;
            font-style: italic;
            text-indent: 0;
        }
        
        /* Preface and Afterword */
        .preface, .afterword {
            margin-bottom: 60px;
        }
        
        /* Page breaks for printing */
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                padding: 40px;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
            }
            
            .cover h1 {
                font-size: 32px;
            }
            
            .chapter-title {
                font-size: 28px;
            }
            
            .section-title {
                font-size: 20px;
            }
            
            p {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Cover Page -->
        <div class="cover">
            <h1>${bookTitle}</h1>
            <p class="author">作者：${authorName}</p>
            <div class="meta">
                <p>总字数：${book.current_word_count || 0} 字</p>
                <p>生成时间：${new Date().toLocaleDateString('zh-CN')}</p>
            </div>
        </div>
        
        <!-- Table of Contents -->
        ${toc}
        
        <!-- Main Content -->
        ${content}
    </div>
</body>
</html>`
}

// ============================================================================
// GET /api/ai-export/html/:book_id - Export book as HTML
// ============================================================================

app.get('/html/:book_id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const bookId = c.req.param('book_id')
    const { DB } = c.env
    
    // Get book
    const book: any = await DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    // Get chapters
    const chaptersResult = await DB.prepare(`
      SELECT * FROM ai_chapters 
      WHERE book_id = ? 
      ORDER BY sort_order, chapter_number
    `).bind(bookId).all()
    
    const chapters = chaptersResult.results || []
    
    // Get sections
    const sectionsResult = await DB.prepare(`
      SELECT * FROM ai_sections 
      WHERE book_id = ? 
      ORDER BY chapter_id, sort_order, section_number
    `).bind(bookId).all()
    
    const sections = sectionsResult.results || []
    
    // Generate HTML
    const html = generateBookHtml(book, chapters, sections)
    
    // Log export
    await DB.prepare(`
      INSERT INTO ai_book_exports (
        book_id, export_format, status, created_at
      ) VALUES (?, 'html', 'completed', CURRENT_TIMESTAMP)
    `).bind(bookId).run()
    
    // Return HTML
    return c.html(html)
    
  } catch (error: any) {
    console.error('Error exporting book:', error)
    return c.json({ error: 'Failed to export book', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/ai-export/download/:book_id - Download book as HTML file
// ============================================================================

app.get('/download/:book_id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const bookId = c.req.param('book_id')
    const { DB } = c.env
    
    // Get book
    const book: any = await DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    // Get chapters
    const chaptersResult = await DB.prepare(`
      SELECT * FROM ai_chapters 
      WHERE book_id = ? 
      ORDER BY sort_order, chapter_number
    `).bind(bookId).all()
    
    const chapters = chaptersResult.results || []
    
    // Get sections
    const sectionsResult = await DB.prepare(`
      SELECT * FROM ai_sections 
      WHERE book_id = ? 
      ORDER BY chapter_id, sort_order, section_number
    `).bind(bookId).all()
    
    const sections = sectionsResult.results || []
    
    // Generate HTML
    const html = generateBookHtml(book, chapters, sections)
    
    // Log export
    await DB.prepare(`
      INSERT INTO ai_book_exports (
        book_id, export_format, status, created_at
      ) VALUES (?, 'html', 'completed', CURRENT_TIMESTAMP)
    `).bind(bookId).run()
    
    // Set headers for file download
    const filename = `${book.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.html`
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
    
  } catch (error: any) {
    console.error('Error downloading book:', error)
    return c.json({ error: 'Failed to download book', details: error.message }, 500)
  }
})

// ============================================================================
// GET /api/ai-export/preview/:book_id - Preview book structure
// ============================================================================

app.get('/preview/:book_id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const bookId = c.req.param('book_id')
    const { DB } = c.env
    
    // Get book
    const book: any = await DB.prepare(`
      SELECT * FROM ai_books WHERE id = ? AND user_id = ?
    `).bind(bookId, user.id).first()
    
    if (!book) {
      return c.json({ error: 'Book not found' }, 404)
    }
    
    // Get chapters with section counts
    const chaptersResult = await DB.prepare(`
      SELECT 
        c.*,
        COUNT(s.id) as section_count,
        SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_sections
      FROM ai_chapters c
      LEFT JOIN ai_sections s ON c.id = s.chapter_id
      WHERE c.book_id = ?
      GROUP BY c.id
      ORDER BY c.sort_order, c.chapter_number
    `).bind(bookId).all()
    
    const chapters = chaptersResult.results || []
    
    // Calculate completion stats
    let totalSections = 0
    let completedSections = 0
    
    for (const chapter of chapters) {
      totalSections += chapter.section_count || 0
      completedSections += chapter.completed_sections || 0
    }
    
    const completionRate = totalSections > 0 
      ? Math.round((completedSections / totalSections) * 100) 
      : 0
    
    return c.json({
      book: {
        id: book.id,
        title: book.title,
        author_name: book.author_name,
        status: book.status,
        current_word_count: book.current_word_count,
        target_word_count: book.target_word_count,
        has_preface: !!book.preface,
        has_afterword: !!book.afterword,
      },
      statistics: {
        chapter_count: chapters.length,
        total_sections: totalSections,
        completed_sections: completedSections,
        completion_rate: completionRate,
        word_count_progress: book.target_word_count > 0
          ? Math.round((book.current_word_count / book.target_word_count) * 100)
          : 0,
      },
      chapters: chapters.map(ch => ({
        id: ch.id,
        chapter_number: ch.chapter_number,
        title: ch.title,
        section_count: ch.section_count || 0,
        completed_sections: ch.completed_sections || 0,
        word_count: ch.word_count || 0,
        status: ch.status,
      })),
    })
    
  } catch (error: any) {
    console.error('Error previewing book:', error)
    return c.json({ error: 'Failed to preview book', details: error.message }, 500)
  }
})

export default app
