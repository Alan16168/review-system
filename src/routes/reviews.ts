import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { UserPayload } from '../utils/auth';
import { 
  getReviewAnswers, 
  saveMyAnswer, 
  deleteAnswer,
  deleteAnswerById,
  getAnswerCompletionStatus 
} from '../utils/db';

type Bindings = {
  DB: D1Database;
  YOUTUBE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  GENSPARK_API_KEY?: string;
};

const reviews = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
reviews.use('/*', authMiddleware);

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Helper function to analyze YouTube video
async function analyzeYouTubeVideo(videoUrl: string, prompt: string, env: any): Promise<string> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  // Step 1: Get video metadata from YouTube Data API
  let videoMetadata = '';
  const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
  
  if (YOUTUBE_API_KEY) {
    try {
      const metadataResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();
        const video = metadataData.items?.[0];
        
        if (video) {
          const snippet = video.snippet;
          const statistics = video.statistics;
          const duration = video.contentDetails?.duration;
          
          videoMetadata = `
视频标题：${snippet.title}
发布日期：${snippet.publishedAt}
频道：${snippet.channelTitle}
描述：${snippet.description}
观看次数：${statistics.viewCount || '未知'}
点赞数：${statistics.likeCount || '未知'}
视频时长：${duration || '未知'}
`;
        }
      }
    } catch (error) {
      console.error('Failed to fetch YouTube metadata:', error);
    }
  }
  
  // Step 2: Try to get transcript by parsing video page
  let transcript = '';
  let transcriptLanguage = 'unknown';
  
  try {
    // Fetch the video page to extract caption tracks
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });
    
    if (videoPageResponse.ok) {
      const pageHtml = await videoPageResponse.text();
      
      // Extract caption tracks from the page
      const captionTracksMatch = pageHtml.match(/"captionTracks":\[([^\]]+)\]/);
      
      if (captionTracksMatch) {
        const captionTracksJson = '[' + captionTracksMatch[1] + ']';
        const captionTracks = JSON.parse(captionTracksJson);
        
        // Priority: zh-Hans (简体中文) -> zh-Hant (繁体中文) -> zh (中文) -> en (English)
        const priorityLangs = ['zh-Hans', 'zh-Hant', 'zh', 'en'];
        let selectedTrack = null;
        
        for (const lang of priorityLangs) {
          selectedTrack = captionTracks.find((track: any) => 
            track.languageCode === lang || track.languageCode?.startsWith(lang)
          );
          if (selectedTrack) {
            transcriptLanguage = lang;
            break;
          }
        }
        
        // If no preferred language found, use first available track
        if (!selectedTrack && captionTracks.length > 0) {
          selectedTrack = captionTracks[0];
          transcriptLanguage = selectedTrack.languageCode || 'unknown';
        }
        
        if (selectedTrack && selectedTrack.baseUrl) {
          // Fetch the transcript using the base URL
          const transcriptResponse = await fetch(selectedTrack.baseUrl);
          
          if (transcriptResponse.ok) {
            const transcriptXml = await transcriptResponse.text();
            
            // Parse XML transcript (format: <text start="0.000" dur="2.000">Text here</text>)
            const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
            const transcriptParts: string[] = [];
            
            for (const match of textMatches) {
              // Decode HTML entities and clean up text
              const text = match[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\n/g, ' ')
                .trim();
              
              if (text) {
                transcriptParts.push(text);
              }
            }
            
            transcript = transcriptParts.join(' ');
            
            console.log(`Transcript fetched successfully. Language: ${transcriptLanguage}, Length: ${transcript.length} characters`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
  }
  
  // Step 3: Use AI to analyze the content
  const GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  // Build comprehensive context
  let context = `视频链接：${videoUrl}\n视频ID：${videoId}\n\n`;
  
  if (videoMetadata) {
    context += `【视频信息】\n${videoMetadata}\n\n`;
  }
  
  if (transcript) {
    context += `【视频字幕/文稿】（语言：${transcriptLanguage}，字数：${transcript.length}）\n${transcript.substring(0, 50000)}\n\n`;
  } else {
    context += `【注意】此视频没有可用的字幕（可能是视频创作者未添加字幕，或字幕暂时无法获取）。\n分析将仅基于视频标题、描述和其他元数据进行。如果需要更准确的分析，建议使用带有字幕的视频。\n\n`;
  }
  
  // Call Gemini API
  const fullPrompt = `${context}\n${prompt}`;
  const model = 'gemini-2.0-flash-exp';
  
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          role: 'user',
          parts: [{ text: fullPrompt }]
        }]
      })
    }
  );
  
  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorText}`);
  }
  
  const geminiData = await geminiResponse.json();
  const result = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';
  
  return result;
}

// Get public reviews (owner_type='public' or 'team')
// Note: 'team' owner_type reviews are only visible to team members
reviews.get('/public', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.owner_type IN ('public', 'team')
      AND (r.review_type IS NULL OR r.review_type NOT IN ('famous-book', 'document'))
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    const allReviews = result.results || [];
    
    // Filter reviews based on ownership and team membership
    const filteredReviews = await Promise.all(
      allReviews.map(async (review: any) => {
        // If owner_type is 'team', check team membership
        if (review.owner_type === 'team' && review.team_id) {
          // Check if current user is a member of this team
          const memberCheck = await c.env.DB.prepare(`
            SELECT 1 FROM team_members 
            WHERE team_id = ? AND user_id = ?
          `).bind(review.team_id, user.id).first();
          
          // Only include if user is a team member
          if (memberCheck) {
            review.is_team_member = true;
            return review;
          } else {
            return null; // Filter out - user is not a team member
          }
        } else {
          // owner_type is 'public' - visible to everyone
          review.is_team_member = false;
          return review;
        }
      })
    );

    // Remove null entries (filtered out team reviews)
    const accessibleReviews = filteredReviews.filter(r => r !== null);

    return c.json({ reviews: accessibleReviews });
  } catch (error) {
    console.error('Get public reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Famous Books Reviews (Premium feature)
reviews.get('/famous-books', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check if user has premium subscription (not free) or is admin
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    // Only return reviews created by current user (user isolation)
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.review_type = 'famous-book' AND r.user_id = ?
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id).all();
    const reviews = result.results || [];

    return c.json({ reviews });
  } catch (error) {
    console.error('Get famous books reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Documents Reviews (Premium feature)
reviews.get('/documents', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check if user has premium subscription (not free) or is admin
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    // Only return reviews created by current user (user isolation)
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.review_type = 'document' AND r.user_id = ?
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id).all();
    const reviews = result.results || [];

    return c.json({ reviews });
  } catch (error) {
    console.error('Get documents reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get YouTube video transcript (for preview before analysis)
reviews.post('/famous-books/get-transcript', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check premium subscription
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const { content } = await c.req.json();
    
    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }
    
    // Check if it's a YouTube video URL
    const videoId = extractYouTubeVideoId(content);
    if (!videoId) {
      return c.json({ 
        hasTranscript: false, 
        message: 'Not a YouTube video URL' 
      });
    }
    
    // Get video metadata
    let videoMetadata: any = null;
    const YOUTUBE_API_KEY = c.env.YOUTUBE_API_KEY;
    
    if (YOUTUBE_API_KEY) {
      try {
        const metadataResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
        );
        
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          const video = metadataData.items?.[0];
          
          if (video) {
            const snippet = video.snippet;
            const statistics = video.statistics;
            const duration = video.contentDetails?.duration;
            
            videoMetadata = {
              title: snippet.title,
              publishedAt: snippet.publishedAt,
              channelTitle: snippet.channelTitle,
              description: snippet.description,
              viewCount: statistics.viewCount || '未知',
              likeCount: statistics.likeCount || '未知',
              duration: duration || '未知'
            };
          }
        }
      } catch (error) {
        console.error('Failed to fetch YouTube metadata:', error);
      }
    }
    
    // Get transcript by parsing video page
    let transcript = '';
    let transcriptLanguage = 'unknown';
    
    try {
      const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });
      
      if (videoPageResponse.ok) {
        const pageHtml = await videoPageResponse.text();
        const captionTracksMatch = pageHtml.match(/"captionTracks":\[([^\]]+)\]/);
        
        if (captionTracksMatch) {
          const captionTracksJson = '[' + captionTracksMatch[1] + ']';
          const captionTracks = JSON.parse(captionTracksJson);
          
          const priorityLangs = ['zh-Hans', 'zh-Hant', 'zh', 'en'];
          let selectedTrack = null;
          
          for (const lang of priorityLangs) {
            selectedTrack = captionTracks.find((track: any) => 
              track.languageCode === lang || track.languageCode?.startsWith(lang)
            );
            if (selectedTrack) {
              transcriptLanguage = lang;
              break;
            }
          }
          
          if (!selectedTrack && captionTracks.length > 0) {
            selectedTrack = captionTracks[0];
            transcriptLanguage = selectedTrack.languageCode || 'unknown';
          }
          
          if (selectedTrack && selectedTrack.baseUrl) {
            const transcriptResponse = await fetch(selectedTrack.baseUrl);
            
            if (transcriptResponse.ok) {
              const transcriptXml = await transcriptResponse.text();
              const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
              const transcriptParts: string[] = [];
              
              for (const match of textMatches) {
                const text = match[1]
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/\n/g, ' ')
                  .trim();
                
                if (text) {
                  transcriptParts.push(text);
                }
              }
              
              transcript = transcriptParts.join(' ');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
    }
    
    return c.json({
      hasTranscript: transcript.length > 0,
      transcript: transcript,
      transcriptLanguage: transcriptLanguage,
      transcriptLength: transcript.length,
      videoMetadata: videoMetadata,
      videoId: videoId
    });
  } catch (error) {
    console.error('Get transcript error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Analyze Famous Book with Genspark/Gemini API
reviews.post('/famous-books/analyze', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check premium subscription
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const { inputType, content, prompt, language, useGenspark } = await c.req.json();
    
    if (!content || !prompt) {
      return c.json({ error: 'Content and prompt are required' }, 400);
    }
    
    // Try Genspark first for video analysis (more detailed)
    if (inputType === 'video' && useGenspark) {
      try {
        const GENSPARK_API_KEY = c.env.GENSPARK_API_KEY;
        if (!GENSPARK_API_KEY) {
          console.log('Genspark API key not configured, falling back to Gemini');
        } else {
          // Call Genspark API for detailed video analysis
          const gensparkResponse = await fetch(
            'https://www.genspark.ai/api/copilot/query',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GENSPARK_API_KEY}`
              },
              body: JSON.stringify({
                query: prompt,
                context: content,
                mode: 'detailed' // Request detailed analysis
              })
            }
          );
          
          if (gensparkResponse.ok) {
            const gensparkData = await gensparkResponse.json();
            const result = gensparkData.answer || gensparkData.result || 'No response from Genspark';
            return c.json({ result, source: 'genspark' });
          } else {
            console.log('Genspark API failed, falling back to Gemini:', gensparkResponse.statusText);
          }
        }
      } catch (gensparkError) {
        console.log('Genspark error, falling back to Gemini:', gensparkError);
      }
    }
    
    // Handle video analysis with YouTube APIs
    if (inputType === 'video' && (content.includes('youtube.com') || content.includes('youtu.be'))) {
      try {
        const videoAnalysis = await analyzeYouTubeVideo(content, prompt, c.env);
        return c.json({ result: videoAnalysis, source: 'youtube+ai' });
      } catch (videoError) {
        console.error('YouTube video analysis failed:', videoError);
        // Fall through to regular AI analysis with video URL as text
      }
    }
    
    // Multi-tier AI service fallback strategy
    // For books or other text content
    const fullPrompt = inputType === 'book' 
      ? `${prompt}\n\n书籍名称：${content}`
      : `${prompt}\n\n内容：${content}`;
    
    const errors: string[] = [];
    
    // Tier 1: Try Gemini API first (fastest and cheapest)
    const GEMINI_API_KEY = c.env.GEMINI_API_KEY;
    if (GEMINI_API_KEY) {
      try {
        const model = 'gemini-2.0-flash-exp';
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ 
                role: 'user',
                parts: [{ text: fullPrompt }]
              }]
            })
          }
        );
        
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const result = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
          return c.json({ result, source: 'gemini' });
        } else {
          const errorText = await geminiResponse.text();
          errors.push(`Gemini: ${geminiResponse.status} ${geminiResponse.statusText}`);
          console.log('Gemini API failed, trying OpenAI...', errorText);
        }
      } catch (geminiError: any) {
        errors.push(`Gemini: ${geminiError.message}`);
        console.log('Gemini error, trying OpenAI:', geminiError);
      }
    }
    
    // Tier 2: Try OpenAI GPT-4 (high quality)
    const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
    if (OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'user', content: fullPrompt }
              ],
              temperature: 0.7,
              max_tokens: 4000
            })
          }
        );
        
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const result = openaiData.choices?.[0]?.message?.content || 'No response from OpenAI';
          return c.json({ result, source: 'openai' });
        } else {
          const errorText = await openaiResponse.text();
          errors.push(`OpenAI: ${openaiResponse.status} ${openaiResponse.statusText}`);
          console.log('OpenAI API failed, trying Claude...', errorText);
        }
      } catch (openaiError: any) {
        errors.push(`OpenAI: ${openaiError.message}`);
        console.log('OpenAI error, trying Claude:', openaiError);
      }
    }
    
    // Tier 3: Try Claude (high quality, Anthropic)
    const CLAUDE_API_KEY = c.env.CLAUDE_API_KEY;
    if (CLAUDE_API_KEY) {
      try {
        const claudeResponse = await fetch(
          'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': CLAUDE_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4000,
              messages: [
                { role: 'user', content: fullPrompt }
              ]
            })
          }
        );
        
        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json();
          const result = claudeData.content?.[0]?.text || 'No response from Claude';
          return c.json({ result, source: 'claude' });
        } else {
          const errorText = await claudeResponse.text();
          errors.push(`Claude: ${claudeResponse.status} ${claudeResponse.statusText}`);
          console.log('Claude API failed, trying Genspark...', errorText);
        }
      } catch (claudeError: any) {
        errors.push(`Claude: ${claudeError.message}`);
        console.log('Claude error, trying Genspark:', claudeError);
      }
    }
    
    // Tier 4: Try Genspark as last resort (already tried earlier for video, but retry for text)
    const GENSPARK_API_KEY = c.env.GENSPARK_API_KEY;
    if (GENSPARK_API_KEY) {
      try {
        const gensparkResponse = await fetch(
          'https://www.genspark.ai/api/copilot/query',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GENSPARK_API_KEY}`
            },
            body: JSON.stringify({
              query: prompt,
              context: content,
              mode: 'detailed'
            })
          }
        );
        
        if (gensparkResponse.ok) {
          const gensparkData = await gensparkResponse.json();
          const result = gensparkData.answer || gensparkData.result || 'No response from Genspark';
          return c.json({ result, source: 'genspark' });
        } else {
          const errorText = await gensparkResponse.text();
          errors.push(`Genspark: ${gensparkResponse.status} ${gensparkResponse.statusText}`);
          console.log('Genspark API failed:', errorText);
        }
      } catch (gensparkError: any) {
        errors.push(`Genspark: ${gensparkError.message}`);
        console.log('Genspark error:', gensparkError);
      }
    }
    
    // All AI services failed
    const errorMessage = errors.length > 0 
      ? `所有 AI 服务暂时不可用。错误详情：${errors.join('; ')}`
      : 'AI 服务未配置。请联系管理员添加 API 密钥（Gemini/OpenAI/Claude/Genspark）。';
    
    return c.json({ 
      error: errorMessage,
      errors: errors
    }, 503);
  } catch (error) {
    console.error('Analyze famous book error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// Save Famous Book Review
reviews.post('/famous-books/save', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check premium subscription
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const { title, content, inputType, source } = await c.req.json();
    
    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }
    
    // Create review in database
    const result = await c.env.DB.prepare(`
      INSERT INTO reviews (title, description, user_id, review_type, status, created_at, updated_at)
      VALUES (?, ?, ?, 'famous-book', 'published', datetime('now'), datetime('now'))
    `).bind(title, content, user.id).run();
    
    return c.json({ 
      success: true,
      reviewId: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('Save famous book review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update Famous Book Review
reviews.put('/famous-books/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    
    // Check premium subscription
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    // Check if user owns this review
    const existingReview: any = await c.env.DB.prepare(`
      SELECT user_id FROM reviews WHERE id = ? AND review_type = 'famous-book'
    `).bind(reviewId).first();
    
    if (!existingReview) {
      return c.json({ error: 'Review not found' }, 404);
    }
    
    if (existingReview.user_id !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    const { title, content } = await c.req.json();
    
    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }
    
    // Update review in database
    await c.env.DB.prepare(`
      UPDATE reviews 
      SET title = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(title, content, reviewId).run();
    
    return c.json({ 
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update famous book review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Analyze Document with Gemini API
reviews.post('/documents/analyze', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check premium subscription
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const { fileName, fileContent, prompt, language } = await c.req.json();
    
    // Debug logging
    console.log('Document analyze request:', {
      fileName,
      fileContentLength: fileContent?.length || 0,
      fileContentPreview: fileContent?.substring(0, 200) || '[empty]',
      promptLength: prompt?.length || 0,
      language
    });
    
    if (!fileContent || !prompt) {
      console.error('Missing required fields:', { hasContent: !!fileContent, hasPrompt: !!prompt });
      return c.json({ error: 'File content and prompt are required' }, 400);
    }
    
    // Additional check for empty content
    if (fileContent.trim().length === 0) {
      console.error('File content is empty (whitespace only)');
      return c.json({ error: 'File content is empty. Please check if the file is corrupted or blank.' }, 400);
    }
    
    const GEMINI_API_KEY = c.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not configured');
      return c.json({ error: 'Gemini API key not configured' }, 500);
    }
    
    // Combine file content with prompt
    const fullPrompt = `文档内容：\n\n${fileContent}\n\n---\n\n${prompt}`;
    
    console.log('Calling Gemini API with fullPrompt length:', fullPrompt.length);
    
    // Call Gemini API (using gemini-2.0-flash - faster and more cost-effective)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      }
    );
    
    console.log('Gemini API response status:', geminiResponse.status);
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', { status: geminiResponse.status, error: errorText });
      throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorText}`);
    }
    
    const geminiData = await geminiResponse.json();
    console.log('Gemini API response structure:', {
      hasCandidates: !!geminiData.candidates,
      candidatesLength: geminiData.candidates?.length || 0,
      firstCandidate: geminiData.candidates?.[0] ? 'exists' : 'missing'
    });
    
    const result = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
    
    console.log('Analysis result length:', result.length);
    
    return c.json({ result });
  } catch (error) {
    console.error('Analyze document error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// Save Document Review
reviews.post('/documents/save', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check premium subscription
    if (user.role !== 'admin' && (!user.subscription_tier || user.subscription_tier === 'free')) {
      return c.json({ error: 'Premium subscription required' }, 403);
    }
    
    const { title, content, fileName } = await c.req.json();
    
    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }
    
    // Create review in database
    const result = await c.env.DB.prepare(`
      INSERT INTO reviews (title, description, user_id, review_type, status, created_at, updated_at)
      VALUES (?, ?, ?, 'document', 'published', datetime('now'), datetime('now'))
    `).bind(title, content, user.id).run();
    
    return c.json({ 
      success: true,
      reviewId: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('Save document review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper function to get language from request
function getLanguage(c: any): string {
  // Try X-Language header first
  const xLanguage = c.req.header('X-Language');
  if (xLanguage && (xLanguage === 'en' || xLanguage === 'zh')) {
    return xLanguage;
  }
  
  // Try Accept-Language header
  const acceptLanguage = c.req.header('Accept-Language') || '';
  if (acceptLanguage.includes('zh')) {
    return 'zh';
  }
  
  // Default to English
  return 'en';
}

// Get all reviews (personal and team reviews the user has access to)
// Note: This endpoint returns "My Reviews" - reviews created by user or their team reviews
// Public reviews are excluded and should be accessed via /api/reviews/public endpoint
reviews.get('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    // Get reviews based on access control:
    // 1. Personal reviews (no team_id) created by the user
    // 2. Team reviews where user is CURRENTLY a team member (verified in real-time)
    // 3. Non-public reviews where user is a collaborator
    // IMPORTANT: Exclude famous-book and document review types (they have separate lists)
    // CRITICAL: Team reviews require CURRENT team membership, even for creators who left the team
    // CRITICAL: Line 933 previously had a bug allowing creators to see team reviews after leaving
    const query = `
      SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN review_collaborators rc ON r.id = rc.review_id
      WHERE (
        (r.team_id IS NULL AND r.user_id = ?)
        OR (r.team_id IS NOT NULL AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
        OR (rc.user_id = ?)
      )
      AND (r.review_type IS NULL OR r.review_type NOT IN ('famous-book', 'document'))
      ORDER BY r.updated_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id, user.id, user.id).all();
    const reviews = result.results || [];

    // For each review with team_id, check if current user is a team member
    const reviewsWithMembership = await Promise.all(
      reviews.map(async (review: any) => {
        if (review.team_id) {
          // Check if current user is a member of this team
          const memberCheck = await c.env.DB.prepare(`
            SELECT 1 FROM team_members 
            WHERE team_id = ? AND user_id = ?
          `).bind(review.team_id, user.id).first();
          
          review.is_team_member = !!memberCheck;
        } else {
          review.is_team_member = false;
        }
        return review;
      })
    );

    return c.json({ reviews: reviewsWithMembership });
  } catch (error) {
    console.error('Get reviews error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single review
reviews.get('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    
    // Validate user object
    if (!user || !user.id) {
      console.error('[GET REVIEW] User object missing or invalid:', user);
      return c.json({ error: 'Unauthorized - user not authenticated' }, 401);
    }
    
    const lang = getLanguage(c);

    console.log('[GET REVIEW] Starting request:', { reviewId, userId: user.id, lang });

    const query = `
      SELECT r.*, u.username as creator_name, t.name as team_name, 
             tp.name as template_name,
             tp.description as template_description,
             u2.username as created_by_username
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users u2 ON r.created_by = u2.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN templates tp ON r.template_id = tp.id
      WHERE r.id = ? AND (
        r.user_id = ?
        OR (r.team_id IS NOT NULL AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
        OR (r.owner_type = 'public')
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
      )
    `;

    console.log('[GET REVIEW] Executing main query...');
    const review: any = await c.env.DB.prepare(query).bind(reviewId, user.id, user.id, user.id).first();
    console.log('[GET REVIEW] Main query result:', review ? 'Found' : 'Not found');

    if (!review) {
      return c.json({ error: 'Review not found or access denied' }, 404);
    }

    // CRITICAL: If review belongs to a team, verify user is STILL a team member
    // This prevents removed team members from accessing team reviews
    // IMPORTANT: This applies to ALL users, including the review creator
    if (review.team_id && review.owner_type !== 'public') {
      const isMember = await c.env.DB.prepare(`
        SELECT 1 FROM team_members 
        WHERE team_id = ? AND user_id = ?
      `).bind(review.team_id, user.id).first();
      
      // If user is not a current team member, deny access (including creators who left)
      if (!isMember) {
        console.log('[GET REVIEW] Access denied: User is no longer a team member');
        return c.json({ 
          error: 'Access denied. You are no longer a member of this team.',
          code: 'NOT_TEAM_MEMBER'
        }, 403);
      }
    }

    // Get template questions with language-specific text and question type info
    console.log('[GET REVIEW] Fetching template questions for template_id:', review.template_id);
    const questionsResult = await c.env.DB.prepare(`
      SELECT 
        question_number,
        question_text,
        question_type,
        options,
        correct_answer,
        answer_length,
        datetime_value,
        datetime_title,
        datetime_answer_max_length,
        owner,
        required
      FROM template_questions
      WHERE template_id = ?
      ORDER BY question_number ASC
    `).bind(review.template_id).all();
    console.log('[GET REVIEW] Questions fetched:', questionsResult.results?.length || 0);

    // Get review answers with user information (support multiple answers per question)
    // Updated to work with new answer_sets structure
    console.log('[GET REVIEW] Fetching review answers...');
    const answersResult = await c.env.DB.prepare(`
      SELECT ra.id, ra.question_number, ra.answer, 
             ra.datetime_value, ra.datetime_title, ra.datetime_answer,
             ra.comment, ra.comment_updated_at,
             ras.user_id, u.username, u.email, 
             ra.created_at, ra.updated_at
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      JOIN users u ON ras.user_id = u.id
      WHERE ras.review_id = ?
      ORDER BY ra.question_number ASC, ras.set_number ASC, ra.created_at ASC
    `).bind(reviewId).all();
    console.log('[GET REVIEW] Answers fetched:', answersResult.results?.length || 0);

    // Check if current user is the creator for comment visibility
    const reviewObj: any = await c.env.DB.prepare(`SELECT user_id, created_by FROM reviews WHERE id = ?`).bind(reviewId).first();
    const reviewCreatorId = reviewObj?.created_by || reviewObj?.user_id;

    // Group answers by question number
    const answersByQuestion: Record<number, any[]> = {};
    (answersResult.results || []).forEach((ans: any) => {
      if (!answersByQuestion[ans.question_number]) {
        answersByQuestion[ans.question_number] = [];
      }
      
      // Determine if comment should be visible
      // Comment is visible to: review creator OR answer creator
      const canSeeComment = user.id === reviewCreatorId || ans.user_id === user.id;
      
      answersByQuestion[ans.question_number].push({
        id: ans.id,
        user_id: ans.user_id,
        username: ans.username,
        email: ans.email,
        answer: ans.answer,
        created_at: ans.created_at,
        updated_at: ans.updated_at,
        is_mine: ans.user_id === user.id,
        comment: canSeeComment ? (ans.comment || '') : null,
        comment_updated_at: canSeeComment ? ans.comment_updated_at : null,
        can_comment: canSeeComment
      });
    });

    // Check if current user is a team member
    let is_team_member = false;
    if (review.team_id) {
      const memberCheck = await c.env.DB.prepare(`
        SELECT 1 FROM team_members 
        WHERE team_id = ? AND user_id = ?
      `).bind(review.team_id, user.id).first();
      is_team_member = !!memberCheck;
    }

    // Get collaborators
    const collabQuery = `
      SELECT u.id, u.username, u.email, rc.can_edit
      FROM review_collaborators rc
      JOIN users u ON rc.user_id = u.id
      WHERE rc.review_id = ?
    `;
    const collaborators = await c.env.DB.prepare(collabQuery).bind(reviewId).all();

    // Check if current user is the creator
    const creatorId = review.created_by || review.user_id;
    const isCreator = creatorId === user.id;

    // Check if review is locked (default to false if field doesn't exist)
    const isLocked = review.is_locked === 'yes';

    // Keep allow_multiple_answers as string value ('yes' or 'no')
    // Default to 'yes' if not set
    const allowMultipleAnswers = review.allow_multiple_answers || 'yes';

    return c.json({ 
      review: {
        ...review,
        is_team_member,
        is_creator: isCreator,
        is_locked: isLocked,
        allow_multiple_answers: allowMultipleAnswers
      },
      questions: questionsResult.results || [],
      answersByQuestion,
      collaborators: collaborators.results || []
    }, 200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  } catch (error) {
    console.error('[DETAILED ERROR] Get review error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reviewId: c.req.param('id'),
      userId: (c.get('user') as UserPayload)?.id,
      timestamp: new Date().toISOString()
    });
    return c.json({ 
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : String(error),
        reviewId: c.req.param('id')
      } : undefined
    }, 500);
  }
});

// Create review
reviews.post('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const body = await c.req.json();
    const { 
      title, description, team_id, time_type, template_id, answers, status, owner_type, 
      scheduled_at, location, reminder_minutes, allow_multiple_answers, is_locked 
    } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Validate template_id - default to 1 if not provided
    const templateIdToUse = template_id || 1;
    const template = await c.env.DB.prepare(
      'SELECT id FROM templates WHERE id = ? AND is_active = 1'
    ).bind(templateIdToUse).first();

    if (!template) {
      return c.json({ error: 'Invalid template' }, 400);
    }

    // If team_id provided, check if user is a member
    if (team_id) {
      const isMember = await c.env.DB.prepare(
        'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
      ).bind(team_id, user.id).first();

      if (!isMember) {
        return c.json({ error: 'You are not a member of this team' }, 403);
      }
    }

    // Validate owner_type
    let ownerType = owner_type || 'private';
    if (!['private', 'team', 'public'].includes(ownerType)) {
      ownerType = 'private';
    }
    // If owner_type is 'team' but no team_id, force to 'private'
    if (ownerType === 'team' && !team_id) {
      ownerType = 'private';
    }
    
    // Map frontend values to database constraint values
    // Database CHECK constraint only allows: 'personal', 'team'
    // Frontend uses: 'private' (personal), 'team', 'public' (personal with public flag)
    const ownerTypeForDB = ownerType === 'private' || ownerType === 'public' ? 'personal' : 'team';

    // Validate allow_multiple_answers (default to 'yes' for backward compatibility)
    const allowMultipleAnswers = allow_multiple_answers === 'no' ? 'no' : 'yes';

    // Validate is_locked (default to 'no' for new reviews)
    const isLocked = is_locked === 'yes' ? 'yes' : 'no';

    // Create review with template_id, owner_type, calendar fields, and enhancement fields
    // Try to insert with new fields, fall back to old schema if fields don't exist
    let result;
    try {
      result = await c.env.DB.prepare(`
        INSERT INTO reviews (
          title, description, user_id, team_id, time_type,
          template_id, status, owner_type, scheduled_at, location, reminder_minutes,
          allow_multiple_answers, is_locked, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        title, description || null, user.id, team_id || null,
        time_type || 'daily',
        templateIdToUse,
        status || 'draft',
        ownerTypeForDB,  // Use mapped value for database
        scheduled_at || null,
        location || null,
        reminder_minutes || 60,
        allowMultipleAnswers,
        isLocked,
        user.id // created_by is the current user
      ).run();
    } catch (dbError) {
      // Fall back to old schema if new fields don't exist
      console.warn('New fields not available, using old schema:', dbError);
      result = await c.env.DB.prepare(`
        INSERT INTO reviews (
          title, description, user_id, team_id, time_type,
          template_id, status, owner_type, scheduled_at, location, reminder_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        title, description || null, user.id, team_id || null,
        time_type || 'daily',
        templateIdToUse,
        status || 'draft',
        ownerTypeForDB,  // Use mapped value for database
        scheduled_at || null,
        location || null,
        reminder_minutes || 60
      ).run();
    }

    const reviewId = result.meta.last_row_id;

    // Save answers if provided (with user_id)
    // Support both single answers (string) and multiple answers (array)
    // Use saveMyAnswer utility which handles answer_set_id properly
    if (answers && typeof answers === 'object') {
      for (const [questionNumber, answer] of Object.entries(answers)) {
        // Handle array of answers (multiple text answers for same question)
        if (Array.isArray(answer)) {
          for (const singleAnswer of answer) {
            const answerText = String(singleAnswer).trim();
            if (answerText) {
              await saveMyAnswer(c.env.DB, reviewId as number, user.id, parseInt(questionNumber), answerText);
            }
          }
        } else if (answer && String(answer).trim()) {
          // Handle single answer (string)
          await saveMyAnswer(c.env.DB, reviewId as number, user.id, parseInt(questionNumber), String(answer));
        }
      }
    }

    // If it's a team review, add creator as collaborator
    if (team_id) {
      await c.env.DB.prepare(
        'INSERT INTO review_collaborators (review_id, user_id, can_edit) VALUES (?, ?, 1)'
      ).bind(reviewId, user.id).run();
    }

    // If allow_multiple_answers is 'no', automatically create the first answer set
    if (allowMultipleAnswers === 'no') {
      // Get the next set_number (should be 1 for a new review)
      const existingSetsResult = await c.env.DB.prepare(`
        SELECT COALESCE(MAX(set_number), 0) as max_set_number
        FROM review_answer_sets
        WHERE review_id = ? AND user_id = ?
      `).bind(reviewId, user.id).first();
      
      const nextSetNumber = (existingSetsResult?.max_set_number || 0) + 1;
      
      // Create the first answer set
      await c.env.DB.prepare(`
        INSERT INTO review_answer_sets (review_id, user_id, set_number, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).bind(reviewId, user.id, nextSetNumber).run();
    }

    return c.json({ 
      id: reviewId,
      message: 'Review created successfully'
    }, 201);
  } catch (error) {
    console.error('Create review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update review
reviews.put('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    const body = await c.req.json();

    // Check if user has access to this review
    const reviewQuery = `
      SELECT r.user_id, r.owner_type, r.team_id FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.team_id IS NOT NULL AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const review: any = await c.env.DB.prepare(reviewQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!review) {
      return c.json({ error: 'Access denied. You do not have permission to access this review.' }, 403);
    }

    const { title, description, time_type, answers, status, owner_type, scheduled_at, location, reminder_minutes, allow_multiple_answers } = body;
    
    // Check if user is the creator or admin
    const isCreator = review.user_id === user.id;
    const isAdmin = user.role === 'admin';
    const canModifyBasicProperties = isCreator || isAdmin;

    // Update basic properties if user is creator or admin
    if (canModifyBasicProperties && (title || description || time_type || status || owner_type || scheduled_at !== undefined || location !== undefined || reminder_minutes !== undefined || allow_multiple_answers !== undefined)) {
      // Validate and map owner_type if provided
      let validOwnerType = null;
      if (owner_type) {
        if (['private', 'team', 'public'].includes(owner_type)) {
          // Map frontend values to database constraint values
          // Database CHECK constraint only allows: 'personal', 'team'
          // Frontend uses: 'private' (personal), 'team', 'public' (personal with public flag)
          validOwnerType = (owner_type === 'private' || owner_type === 'public') ? 'personal' : 'team';
        }
      }

      await c.env.DB.prepare(`
        UPDATE reviews SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          time_type = COALESCE(?, time_type),
          status = COALESCE(?, status),
          owner_type = COALESCE(?, owner_type),
          scheduled_at = COALESCE(?, scheduled_at),
          location = COALESCE(?, location),
          reminder_minutes = COALESCE(?, reminder_minutes),
          allow_multiple_answers = COALESCE(?, allow_multiple_answers),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        title || null,
        description || null,
        time_type || null,
        status || null,
        validOwnerType,
        scheduled_at !== undefined ? scheduled_at : null,
        location !== undefined ? location : null,
        reminder_minutes !== undefined ? reminder_minutes : null,
        allow_multiple_answers !== undefined ? allow_multiple_answers : null,
        reviewId
      ).run();
    }

    // Update answers for choice-type questions and multiple text answers
    // Note: Single text-type answers in edit mode are managed through POST /my-answer/:questionNumber endpoint
    // But during creation/draft save, we support multiple text answers as arrays
    // Use saveMyAnswer and deleteAnswer utilities which handle answer_set_id properly
    if (answers && typeof answers === 'object') {
      for (const [questionNumber, answer] of Object.entries(answers)) {
        const qNum = parseInt(questionNumber);
        
        // Handle array of answers (multiple text answers for same question)
        if (Array.isArray(answer)) {
          // Delete existing answers for this question first
          await deleteAnswer(c.env.DB, parseInt(reviewId), user.id, qNum);
          
          // Insert all new answers
          for (const singleAnswer of answer) {
            const answerText = String(singleAnswer).trim();
            if (answerText) {
              await saveMyAnswer(c.env.DB, parseInt(reviewId), user.id, qNum, answerText);
            }
          }
        } else {
          // Handle single answer (string) - for choice-type questions
          const answerText = answer ? String(answer).trim() : '';
          
          if (answerText) {
            // For choice-type questions, delete and recreate the answer
            // This is simpler than checking existence and updating
            await deleteAnswer(c.env.DB, parseInt(reviewId), user.id, qNum);
            await saveMyAnswer(c.env.DB, parseInt(reviewId), user.id, qNum, answerText);
          } else {
            // Delete all answers for this question if empty (for choice-type questions)
            await deleteAnswer(c.env.DB, parseInt(reviewId), user.id, qNum);
          }
        }
      }
    }

    return c.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete review
reviews.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');

    // Get review information
    const review: any = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?').bind(reviewId).first();
    
    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Permission check:
    // 1. Admin (role='admin') can delete any review
    // 2. Review creator can delete their own review
    // 3. Team creator can delete team reviews
    let hasPermission = false;
    
    // Check if user is admin
    if (user.role === 'admin') {
      hasPermission = true;
    }
    // Check if user is the review creator
    else if (review.user_id === user.id) {
      hasPermission = true;
    }
    // Check if user is team creator (for team reviews)
    else if (review.team_id) {
      const teamMember: any = await c.env.DB.prepare(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?'
      ).bind(review.team_id, user.id).first();
      
      if (teamMember && teamMember.role === 'creator') {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return c.json({ error: 'Access denied. Only review creator, team creator, or admin can delete.' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(reviewId).run();

    return c.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add collaborator to review
reviews.post('/:id/collaborators', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');
    const { user_id, can_edit } = await c.req.json();

    // Check if current user is the creator
    const review = await c.env.DB.prepare(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?'
    ).bind(reviewId, user.id).first();

    if (!review) {
      return c.json({ error: 'Only creator can add collaborators' }, 403);
    }

    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO review_collaborators (review_id, user_id, can_edit) VALUES (?, ?, ?)'
    ).bind(reviewId, user_id, can_edit ? 1 : 0).run();

    return c.json({ message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Add collaborator error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== Team Review Collaboration Endpoints ====================

/**
 * GET /api/reviews/:id/all-answers
 * Get all users' answers for a review (replaces team-answers)
 */
reviews.get('/:id/all-answers', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));

    // Check if user has access to this review based on owner_type
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        (r.owner_type = 'private' AND r.user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
        OR (r.owner_type = 'public')
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get all answers
    const answers = await getReviewAnswers(c.env.DB, reviewId);
    
    // Get review to check if it's a team review
    const review: any = await c.env.DB.prepare('SELECT team_id FROM reviews WHERE id = ?').bind(reviewId).first();
    const teamId = review?.team_id;
    
    // Get completion status
    const completionStatus = await getAnswerCompletionStatus(c.env.DB, reviewId);

    // If it's a team review, get current team members
    let currentTeamMembers = new Set<number>();
    if (teamId) {
      const members = await c.env.DB.prepare('SELECT user_id FROM team_members WHERE team_id = ?').bind(teamId).all();
      currentTeamMembers = new Set(members.results?.map((m: any) => m.user_id) || []);
    }

    // Group answers by question
    const answersByQuestion: {[key: number]: any[]} = {};
    for (let i = 1; i <= 20; i++) { // Support up to 20 questions
      answersByQuestion[i] = [];
    }

    answers.forEach(answer => {
      // Check if user is still a team member (if this is a team review)
      const isCurrentTeamMember = !teamId || currentTeamMembers.has(answer.user_id);
      
      answersByQuestion[answer.question_number].push({
        id: answer.id,
        user_id: answer.user_id,
        username: answer.username,
        email: answer.email,
        answer: answer.answer,
        created_at: answer.created_at,
        updated_at: answer.updated_at,
        is_mine: answer.user_id === user.id,
        is_current_team_member: isCurrentTeamMember
      });
    });

    return c.json({ 
      answersByQuestion,
      completionStatus,
      currentUserId: user.id
    });
  } catch (error) {
    console.error('Get all answers error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/reviews/:id/my-answer/:questionNumber
 * Create a new answer for current user (supports multiple answers per question)
 */
reviews.post('/:id/my-answer/:questionNumber', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const questionNumber = parseInt(c.req.param('questionNumber'));
    const { answer } = await c.req.json();

    if (!answer || answer.trim() === '') {
      return c.json({ error: 'Answer cannot be empty' }, 400);
    }

    if (questionNumber < 1) {
      return c.json({ error: 'Invalid question number' }, 400);
    }

    // Check if user has access to this review and can contribute
    const accessQuery = `
      SELECT r.owner_type, r.team_id, r.user_id FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const review: any = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!review) {
      return c.json({ error: 'Access denied. You cannot contribute to this review.' }, 403);
    }

    // Create new answer (always INSERT, never UPDATE)
    const answerId = await saveMyAnswer(c.env.DB, reviewId, user.id, questionNumber, answer);

    // Get the created answer with timestamp
    const newAnswer: any = await c.env.DB.prepare(`
      SELECT ra.id, ra.created_at, ra.updated_at, ras.user_id, u.username, u.email
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      JOIN users u ON ras.user_id = u.id
      WHERE ra.id = ?
    `).bind(answerId).first();

    return c.json({ 
      message: 'Answer created successfully',
      answer: {
        id: newAnswer.id,
        user_id: user.id,
        username: newAnswer.username,
        email: newAnswer.email,
        answer: answer,
        created_at: newAnswer.created_at,
        updated_at: newAnswer.updated_at,
        is_mine: true
      }
    });
  } catch (error) {
    console.error('Create answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/reviews/:id/answer/:answerId
 * Delete a specific answer by ID (user can only delete their own answers)
 */
reviews.delete('/:id/answer/:answerId', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const answerId = parseInt(c.req.param('answerId'));

    // Check if user has access to this review
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Verify the answer belongs to this review
    const answerCheck: any = await c.env.DB.prepare(`
      SELECT ras.review_id
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      WHERE ra.id = ?
    `).bind(answerId).first();

    if (!answerCheck || answerCheck.review_id !== reviewId) {
      return c.json({ error: 'Answer not found in this review' }, 404);
    }

    // Delete answer by ID (only if it belongs to current user)
    const deleted = await deleteAnswerById(c.env.DB, answerId, user.id);

    if (!deleted) {
      return c.json({ error: 'Answer not found or access denied' }, 404);
    }

    return c.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/reviews/:id/my-answer/:questionNumber
 * Delete current user's own answer (legacy endpoint - kept for backwards compatibility)
 */
reviews.delete('/:id/my-answer/:questionNumber', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('id'));
    const questionNumber = parseInt(c.req.param('questionNumber'));

    // Check if user has access to this review
    const accessQuery = `
      SELECT 1 FROM reviews r
      WHERE r.id = ? AND (
        r.user_id = ?
        OR EXISTS (SELECT 1 FROM review_collaborators WHERE review_id = r.id AND user_id = ?)
        OR (r.owner_type = 'team' AND EXISTS (SELECT 1 FROM team_members WHERE team_id = r.team_id AND user_id = ?))
      )
    `;
    const hasAccess = await c.env.DB.prepare(accessQuery)
      .bind(reviewId, user.id, user.id, user.id).first();

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete current user's answer only
    await deleteAnswer(c.env.DB, reviewId, user.id, questionNumber);

    return c.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== Review Enhancement Features ====================

/**
 * PUT /api/reviews/:id/lock
 * Lock a review - only creator can lock
 * When locked, no editing is allowed but viewing is still possible
 */
reviews.put('/:id/lock', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');

    // Check if user is the creator (created_by or user_id if created_by not exists)
    const review: any = await c.env.DB.prepare(`
      SELECT user_id, created_by FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Check if user is the creator
    const creatorId = review.created_by || review.user_id;
    if (creatorId !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Only creator can lock the review' }, 403);
    }

    // Try to update is_locked field (will fail gracefully if field doesn't exist)
    try {
      await c.env.DB.prepare(`
        UPDATE reviews SET is_locked = 'yes', updated_at = datetime('now')
        WHERE id = ?
      `).bind(reviewId).run();
      
      return c.json({ message: 'Review locked successfully', is_locked: 'yes' });
    } catch (dbError) {
      // If field doesn't exist, return error asking to apply migrations
      console.error('Lock review DB error:', dbError);
      return c.json({ 
        error: 'Database schema update required. Please apply migration 0067.',
        details: 'is_locked field not found in reviews table'
      }, 500);
    }
  } catch (error) {
    console.error('Lock review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/reviews/:id/unlock
 * Unlock a review - only creator can unlock
 */
reviews.put('/:id/unlock', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = c.req.param('id');

    // Check if user is the creator
    const review: any = await c.env.DB.prepare(`
      SELECT user_id, created_by FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    const creatorId = review.created_by || review.user_id;
    if (creatorId !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Only creator can unlock the review' }, 403);
    }

    // Try to update is_locked field
    try {
      await c.env.DB.prepare(`
        UPDATE reviews SET is_locked = 'no', updated_at = datetime('now')
        WHERE id = ?
      `).bind(reviewId).run();
      
      return c.json({ message: 'Review unlocked successfully', is_locked: 'no' });
    } catch (dbError) {
      console.error('Unlock review DB error:', dbError);
      return c.json({ 
        error: 'Database schema update required. Please apply migration 0067.',
        details: 'is_locked field not found in reviews table'
      }, 500);
    }
  } catch (error) {
    console.error('Unlock review error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/reviews/:reviewId/answers/:answerId/comment
 * Add or update comment on an answer
 * Only review creator or answer creator can add/edit comments
 */
reviews.post('/:reviewId/answers/:answerId/comment', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('reviewId'));
    const answerId = parseInt(c.req.param('answerId'));
    const { comment } = await c.req.json();

    if (!comment || typeof comment !== 'string') {
      return c.json({ error: 'Comment text is required' }, 400);
    }

    // Get review and answer information
    const review: any = await c.env.DB.prepare(`
      SELECT user_id, created_by FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Get answer and its creator through answer_set
    const answer: any = await c.env.DB.prepare(`
      SELECT ra.id, ras.user_id as answer_creator_id
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      WHERE ra.id = ? AND ras.review_id = ?
    `).bind(answerId, reviewId).first();

    if (!answer) {
      return c.json({ error: 'Answer not found' }, 404);
    }

    // Check permissions: only review creator or answer creator can comment
    const reviewCreatorId = review.created_by || review.user_id;
    const answerCreatorId = answer.answer_creator_id;
    
    if (user.id !== reviewCreatorId && user.id !== answerCreatorId) {
      return c.json({ 
        error: 'Only review creator or answer creator can add comments' 
      }, 403);
    }

    // Update comment in review_answers table
    try {
      await c.env.DB.prepare(`
        UPDATE review_answers 
        SET comment = ?, comment_updated_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(comment, answerId).run();
      
      return c.json({ 
        message: 'Comment saved successfully',
        comment,
        answerId
      });
    } catch (dbError) {
      console.error('Save comment DB error:', dbError);
      return c.json({ 
        error: 'Database schema update required. Please apply migration 0067.',
        details: 'comment field not found in review_answers table'
      }, 500);
    }
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/reviews/:reviewId/answers/:answerId/comment
 * Get comment for a specific answer
 * Only review creator or answer creator can view comments
 */
reviews.get('/:reviewId/answers/:answerId/comment', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const reviewId = parseInt(c.req.param('reviewId'));
    const answerId = parseInt(c.req.param('answerId'));

    // Get review information
    const review: any = await c.env.DB.prepare(`
      SELECT user_id, created_by FROM reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Get answer with comment
    const answer: any = await c.env.DB.prepare(`
      SELECT ra.id, ra.comment, ra.comment_updated_at, ras.user_id as answer_creator_id
      FROM review_answers ra
      JOIN review_answer_sets ras ON ra.answer_set_id = ras.id
      WHERE ra.id = ? AND ras.review_id = ?
    `).bind(answerId, reviewId).first();

    if (!answer) {
      return c.json({ error: 'Answer not found' }, 404);
    }

    // Check permissions
    const reviewCreatorId = review.created_by || review.user_id;
    const answerCreatorId = answer.answer_creator_id;
    
    if (user.id !== reviewCreatorId && user.id !== answerCreatorId) {
      return c.json({ 
        error: 'Only review creator or answer creator can view comments' 
      }, 403);
    }

    return c.json({ 
      comment: answer.comment || '',
      commentUpdatedAt: answer.comment_updated_at,
      answerId: answer.id,
      canEdit: user.id === reviewCreatorId || user.id === answerCreatorId
    });
  } catch (error) {
    console.error('Get comment error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default reviews;
