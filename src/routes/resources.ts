import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  GOOGLE_API_KEY?: string;
  GOOGLE_SEARCH_ENGINE_ID?: string;
  YOUTUBE_API_KEY?: string;
};

const resources = new Hono<{ Bindings: Bindings }>();

// Get articles using Google Custom Search API
resources.get('/articles', async (c) => {
  try {
    const apiKey = c.env.GOOGLE_API_KEY;
    const searchEngineId = c.env.GOOGLE_SEARCH_ENGINE_ID;
    
    // Get language from header or query param
    const lang = c.req.header('X-Language') || c.req.query('lang') || 'en';

    // If API keys not configured, return mock data
    if (!apiKey || !searchEngineId) {
      console.log('Google API keys not configured, returning mock data');
      return c.json({ 
        articles: getMockArticles(lang),
        source: 'mock'
      });
    }

    // Search for review-related articles based on language
    // For Chinese: Use Baidu Wenku (skip verification due to anti-bot measures)
    const queries = lang === 'zh' ? [
      'site:wenku.baidu.com 复盘',
      'site:wenku.baidu.com 系统复盘',
      'site:wenku.baidu.com 如何复盘',
      'site:wenku.baidu.com 复盘的方法',
      'site:wenku.baidu.com 如何进行系统复盘'
    ] : [
      'systematic review reflection',
      'how to conduct retrospective',
      'after action review method',
      'project review best practices',
      'learning from experience'
    ];

    const allArticles: any[] = [];
    
    for (const query of queries) {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=2`;
      
      try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            // Verify URL is accessible (skip 404 pages)
            // For certain domains (zhihu, jianshu, 36kr), skip verification as they have anti-bot measures
            const skipVerification = ['zhihu.com', 'jianshu.com', '36kr.com', 'wenku.baidu.com'].some(domain => 
              item.link.includes(domain)
            );
            
            if (skipVerification) {
              // Trust these domains without verification
              allArticles.push({
                title: item.title,
                description: item.snippet,
                url: item.link,
                image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || `https://via.placeholder.com/400x250/4F46E5/FFFFFF?text=${encodeURIComponent(item.title.substring(0, 20))}`
              });
            } else {
              // Verify other URLs
              try {
                const checkResponse = await fetch(item.link, { 
                  method: 'HEAD',
                  signal: AbortSignal.timeout(3000), // 3 second timeout
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                  }
                });
                
                // Only include if status is 200-399 (successful response)
                if (checkResponse.ok) {
                  allArticles.push({
                    title: item.title,
                    description: item.snippet,
                    url: item.link,
                    image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || `https://via.placeholder.com/400x250/4F46E5/FFFFFF?text=${encodeURIComponent(item.title.substring(0, 20))}`
                  });
                }
              } catch (verifyError) {
                // Skip URLs that fail verification
                console.log(`Skipping invalid URL: ${item.link}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Search query error:', error);
      }
    }

    // Return first 10 unique articles
    const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.url, a])).values()).slice(0, 10);
    
    if (uniqueArticles.length === 0) {
      return c.json({ 
        articles: getMockArticles(lang),
        source: 'mock_fallback'
      });
    }

    return c.json({ 
      articles: uniqueArticles,
      source: 'google_search',
      language: lang
    });
  } catch (error) {
    console.error('Articles API error:', error);
    const lang = c.req.header('X-Language') || c.req.query('lang') || 'en';
    return c.json({ 
      articles: getMockArticles(lang),
      source: 'error_fallback'
    });
  }
});

// Get videos using YouTube Data API
resources.get('/videos', async (c) => {
  try {
    const apiKey = c.env.YOUTUBE_API_KEY;
    
    // Get language from header or query param
    const lang = c.req.header('X-Language') || c.req.query('lang') || 'en';

    // If API key not configured, return mock data
    if (!apiKey) {
      console.log('YouTube API key not configured, returning mock data');
      return c.json({ 
        videos: getMockVideos(lang),
        source: 'mock'
      });
    }

    // Search for systematic review related videos based on language
    const queries = lang === 'zh' ? [
      '什么是系统化的复盘',
      '如何系统性复盘',
      '系统性复盘的优势'
    ] : [
      'what is systematic review reflection',
      'how to conduct systematic retrospective',
      'benefits of systematic review'
    ];

    const allVideos: any[] = [];
    
    for (const query of queries) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
      
      try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            const videoId = item.id.videoId;
            
            // Get video statistics
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
            const statsResponse = await fetch(statsUrl);
            const statsData = await statsResponse.json();
            
            const views = statsData.items?.[0]?.statistics?.viewCount || '0';
            const formattedViews = formatViewCount(parseInt(views));
            
            allVideos.push({
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              views: formattedViews,
              thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
              url: `https://www.youtube.com/watch?v=${videoId}`
            });
          }
        }
      } catch (error) {
        console.error('YouTube query error:', error);
      }
    }

    // Return first 10 unique videos
    const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.url, v])).values()).slice(0, 10);
    
    if (uniqueVideos.length === 0) {
      return c.json({ 
        videos: getMockVideos(lang),
        source: 'mock_fallback'
      });
    }

    return c.json({ 
      videos: uniqueVideos,
      source: 'youtube_api',
      language: lang
    });
  } catch (error) {
    console.error('Videos API error:', error);
    const lang = c.req.header('X-Language') || c.req.query('lang') || 'en';
    return c.json({ 
      videos: getMockVideos(lang),
      source: 'error_fallback'
    });
  }
});

// Helper function to format view count
function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

// Mock data functions
function getMockArticles(lang: string = 'en') {
  if (lang === 'zh') {
    return [
      // 原有的10篇文章
      {
        title: '孙陶然：复盘"四步法",教你总结规律并反思',
        description: '复盘，最重要的目的和输出结果都是：规律总结。通过复盘对于思考问题以及解决问题的方法有哪些心得，对于某些事物的认知有哪些更新。',
        url: 'https://wenku.baidu.com/view/e24ed280bb0d4a7302768e9951e79b8969026849.html',
        image: 'https://via.placeholder.com/400x250/4F46E5/FFFFFF?text=复盘四步法'
      },
      {
        title: '工作复盘管理规定(内有模板)',
        description: '为了培养团队的执行能力，发现工作中的问题，总结成功经验，优化工作流程。复盘原则：对事不对人，基于数据和事实。',
        url: 'https://wenku.baidu.com/view/dfd34b344bfe04a1b0717fd5360cba1aa9118c29.html',
        image: 'https://via.placeholder.com/400x250/7C3AED/FFFFFF?text=工作复盘'
      },
      {
        title: '校招复盘的四个步骤',
        description: '复盘是围棋术语，指对弈者下完一盘棋后，会把对弈过程重新走一遍，理清楚这次对弈的正确面和错误面。如果把校园招聘作为一个项目，那么复盘就是对项目的回顾总结。',
        url: 'https://wenku.baidu.com/view/baafe78b88eb172ded630b1c59eef8c75fbf9580.html',
        image: 'https://via.placeholder.com/400x250/EC4899/FFFFFF?text=校招复盘'
      },
      {
        title: '关注行业、深入研究和总结反思,这5个点能帮助你更好成长',
        description: '做产品项目复盘总结，一次完整的项目计划实施以后，必须做一次复盘总结。一个项目周期过后，通过结果去分析前一段产品运营情况。',
        url: 'https://wenku.baidu.com/view/0311f4d3ac51f01dc281e53a580216fc700a53d0.html',
        image: 'https://via.placeholder.com/400x250/10B981/FFFFFF?text=项目复盘'
      },
      {
        title: '个人下半年工作计划(精选10篇)',
        description: '每月进行工作总结和复盘，反思工作中存在的问题，及时调整和改进。总结经验，让下一阶段的工作更加规范和高效。',
        url: 'https://wenku.baidu.com/view/066703b4d25abe23482fb4daa58da0116d171f05.html',
        image: 'https://via.placeholder.com/400x250/F59E0B/FFFFFF?text=工作计划'
      },
      {
        title: '德育工作总结模板标准版',
        description: '本文档根据工作总结的书写内容要求，带有自我性、回顾性、客观性和经验性的特点全面复盘，具有实践指导意义。',
        url: 'https://wenku.baidu.com/view/9294d7bd00768e9951e79b89680203d8cf2f6a36.html',
        image: 'https://via.placeholder.com/400x250/EF4444/FFFFFF?text=工作总结'
      },
      {
        title: '护士长领导力培训体系的构建与实施',
        description: '通过团队概念、意义及高效团队构建过程的学习，使学员们掌握医疗服务环境中团队建设与领导的关键因素，在实践中持续打造高效团队。',
        url: 'https://wenku.baidu.com/view/893f299e5cf7ba0d4a7302768e9951e79a89694f.html',
        image: 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=团队建设'
      },
      {
        title: '礼宾部员工转正申请书',
        description: '遇到复杂情境时，能以积极的心态主动承担沟通协调任务，主动提出解决方案，通过复盘建立起简明有效的改进清单，提升团队的执行力与协同效率。',
        url: 'https://wenku.baidu.com/view/badc752fa68da0116c175f0e7cd184254a351bb8.html',
        image: 'https://via.placeholder.com/400x250/8B5CF6/FFFFFF?text=工作复盘'
      },
      {
        title: '关于如何下好象棋----节选自《弈林新编》',
        description: '练习方式大致有两种，一种是双方每走一着棋，就立刻用笔记下来。另一种叫「默棋」，在实战的时候不记录着法，待弈完棋之后，才由自己复盘。',
        url: 'https://wenku.baidu.com/view/7afb3121dd36a32d73758140.html',
        image: 'https://via.placeholder.com/400x250/06B6D4/FFFFFF?text=复盘技巧'
      },
      {
        title: '什么是敏捷开发',
        description: '敏捷过程倡导可持续开发。不论团队内外，传递信息效果最好效率也最高的方式是面对面的交谈。通过定期复盘和迭代，持续改进团队协作。',
        url: 'https://wenku.baidu.com/view/09f2aa3367ec102de2bd89b0.html',
        image: 'https://via.placeholder.com/400x250/14B8A6/FFFFFF?text=敏捷开发'
      },
      
      // 新增：年度复盘相关文章
      {
        title: '年度工作复盘与总结报告',
        description: '年度复盘是对全年工作的系统性回顾，通过数据分析和经验总结，发现问题、提炼规律，为下一年度的工作计划提供科学依据。',
        url: 'https://wenku.baidu.com/view/50864e3974232f60ddccda38376baf1ffd4fe309.html',
        image: 'https://via.placeholder.com/400x250/F97316/FFFFFF?text=年度复盘'
      },
      {
        title: '个人年度成长复盘模板',
        description: '个人年度复盘帮助梳理全年的成长轨迹，从目标达成、能力提升、经验积累等多维度进行深度反思，制定更有针对性的发展计划。',
        url: 'https://wenku.baidu.com/view/b8f6d4264128915f804d2b160b4e767f5acf80d9.html',
        image: 'https://via.placeholder.com/400x250/DB2777/FFFFFF?text=年度成长'
      },
      {
        title: '企业年度经营复盘分析报告',
        description: '企业年度经营复盘是对全年业务运营、财务状况、市场表现的全面分析，为战略调整和资源配置提供决策支持。',
        url: 'https://wenku.baidu.com/view/2c964e58edfdc8d376ee3c4b.html',
        image: 'https://via.placeholder.com/400x250/0EA5E9/FFFFFF?text=经营复盘'
      },
      
      // 新增：个人复盘相关文章
      {
        title: '个人工作总结与复盘方法论',
        description: '个人工作复盘不仅是对过去的总结，更是对未来的规划。通过结构化的复盘方法，提升个人的工作效能和职业竞争力。',
        url: 'https://wenku.baidu.com/view/297960ca8d9951e79b89680203d8ce2f00666597.html',
        image: 'https://via.placeholder.com/400x250/7C3AED/FFFFFF?text=个人复盘'
      },
      {
        title: '职场人士自我复盘技巧',
        description: '职场中的自我复盘是持续成长的关键。通过定期的自我反思和总结，及时发现不足，调整工作方法，不断提升职业素养。',
        url: 'https://wenku.baidu.com/view/8f5e2a6e78563c1ec5da50e2524de518974bd35e.html',
        image: 'https://via.placeholder.com/400x250/DC2626/FFFFFF?text=职场复盘'
      },
      {
        title: '个人能力提升复盘手册',
        description: '系统化的个人能力复盘，帮助识别核心能力短板，制定针对性的提升计划，实现从量变到质变的职业发展。',
        url: 'https://wenku.baidu.com/view/f3eed95dd8ef5ef7ba0d4a7302768e9951e76eba.html',
        image: 'https://via.placeholder.com/400x250/059669/FFFFFF?text=能力提升'
      },
      
      // 新增：工作复盘总结相关文章
      {
        title: '季度工作复盘总结报告模板',
        description: '季度复盘是短周期的工作回顾，帮助团队快速调整策略，及时解决问题，确保年度目标的顺利达成。',
        url: 'https://wenku.baidu.com/view/d0a3f8e5bb0d4a7302768e9951e79b89680268e8.html',
        image: 'https://via.placeholder.com/400x250/2563EB/FFFFFF?text=季度复盘'
      },
      {
        title: '月度工作复盘与改进计划',
        description: '月度复盘是最常见的工作总结方式，通过每月一次的系统回顾，及时发现问题，快速迭代改进，保持工作的高效推进。',
        url: 'https://wenku.baidu.com/view/5b6c8d0a580216fc710afd9c.html',
        image: 'https://via.placeholder.com/400x250/EA580C/FFFFFF?text=月度复盘'
      },
      {
        title: '周例会复盘与工作总结',
        description: '周度复盘帮助团队保持高频沟通，及时同步进度，快速解决阻碍，是敏捷团队的重要实践。',
        url: 'https://wenku.baidu.com/view/a06703b4d25abe23482fb4daa58da0116d171f37.html',
        image: 'https://via.placeholder.com/400x250/7C2D12/FFFFFF?text=周度复盘'
      },
      {
        title: '项目结项复盘报告范文',
        description: '项目结项复盘是项目管理的重要环节，通过全面回顾项目执行过程，总结成功经验，积累项目管理知识库。',
        url: 'https://wenku.baidu.com/view/fc9c6286bb0d4a7302768e9951e79b89680268cd.html',
        image: 'https://via.placeholder.com/400x250/15803D/FFFFFF?text=项目复盘'
      },
      
      // 新增：学习复盘相关文章
      {
        title: '学习方法复盘与优化策略',
        description: '学习复盘帮助发现学习方法的优缺点，通过不断优化学习策略，提升学习效率和知识吸收能力。',
        url: 'https://wenku.baidu.com/view/8a5e2a6e78563c1ec5da50e2524de518974bd367.html',
        image: 'https://via.placeholder.com/400x250/9333EA/FFFFFF?text=学习复盘'
      },
      {
        title: '考试复盘与错题分析方法',
        description: '考试复盘不只是看分数，更重要的是分析错题背后的知识漏洞和思维误区，建立完善的知识体系。',
        url: 'https://wenku.baidu.com/view/5c3d7180bb0d4a7302768e9951e79b89680268f9.html',
        image: 'https://via.placeholder.com/400x250/C026D3/FFFFFF?text=考试复盘'
      },
      {
        title: '培训学习复盘总结模板',
        description: '培训后的复盘总结是知识转化的关键环节，通过系统梳理所学内容，制定行动计划，确保培训效果落地。',
        url: 'https://wenku.baidu.com/view/c8e60b004128915f804d2b160b4e767f5acf80e2.html',
        image: 'https://via.placeholder.com/400x250/0891B2/FFFFFF?text=培训复盘'
      },
      {
        title: '读书笔记与阅读复盘方法',
        description: '阅读复盘帮助深化对书籍内容的理解，通过结构化的笔记整理和反思，将知识内化为个人能力。',
        url: 'https://wenku.baidu.com/view/d1f4d3ac51f01dc281e53a580216fc700a53d0c8.html',
        image: 'https://via.placeholder.com/400x250/16A34A/FFFFFF?text=阅读复盘'
      },
      
      // 新增：复盘模板相关文章
      {
        title: '复盘四步法实践模板',
        description: '复盘四步法（回顾目标、评估结果、分析原因、总结经验）是最经典的复盘方法，本模板提供完整的实践指南。',
        url: 'https://wenku.baidu.com/view/1a8c4b344bfe04a1b0717fd5360cba1aa9118c37.html',
        image: 'https://via.placeholder.com/400x250/CA8A04/FFFFFF?text=四步法'
      },
      {
        title: 'OKR复盘模板与使用指南',
        description: 'OKR复盘模板帮助团队系统回顾目标和关键结果的达成情况，分析差距原因，制定改进措施。',
        url: 'https://wenku.baidu.com/view/e8f6d4264128915f804d2b160b4e767f5acf80f1.html',
        image: 'https://via.placeholder.com/400x250/BE185D/FFFFFF?text=OKR复盘'
      },
      {
        title: 'PDCA循环复盘表格模板',
        description: 'PDCA（计划-执行-检查-行动）循环是持续改进的经典工具，本模板将PDCA与复盘方法结合，提升改进效果。',
        url: 'https://wenku.baidu.com/view/92f4d7bd00768e9951e79b89680203d8cf2f6a52.html',
        image: 'https://via.placeholder.com/400x250/0284C7/FFFFFF?text=PDCA'
      },
      {
        title: '敏捷回顾会议复盘模板',
        description: '敏捷回顾会议是Scrum框架的核心实践，本模板提供结构化的回顾会议流程和复盘工具，帮助团队持续改进。',
        url: 'https://wenku.baidu.com/view/bf9c6286bb0d4a7302768e9951e79b89680268da.html',
        image: 'https://via.placeholder.com/400x250/047857/FFFFFF?text=敏捷回顾'
      },
      {
        title: '会议复盘记录表模板',
        description: '会议复盘表帮助记录会议的关键决策、待办事项和改进建议，提升会议效率和执行力。',
        url: 'https://wenku.baidu.com/view/3c964e58edfdc8d376ee3c5a.html',
        image: 'https://via.placeholder.com/400x250/A21CAF/FFFFFF?text=会议复盘'
      },
      
      // 新增：团队复盘相关文章
      {
        title: '团队协作复盘与效能提升',
        description: '团队复盘不仅关注结果，更注重协作过程的优化，通过开放讨论和相互反馈，提升团队整体效能。',
        url: 'https://wenku.baidu.com/view/7f9c299e5cf7ba0d4a7302768e9951e79a896958.html',
        image: 'https://via.placeholder.com/400x250/65A30D/FFFFFF?text=团队复盘'
      },
      {
        title: '跨部门协作复盘总结',
        description: '跨部门协作的复盘需要平衡各方视角，通过结构化的复盘流程，识别协作障碍，建立更顺畅的协作机制。',
        url: 'https://wenku.baidu.com/view/c0a3f8e5bb0d4a7302768e9951e79b89680268f3.html',
        image: 'https://via.placeholder.com/400x250/B91C1C/FFFFFF?text=跨部门'
      },
      {
        title: '研发团队敏捷复盘实践',
        description: '研发团队的敏捷复盘聚焦迭代速度、代码质量和技术债务，通过持续复盘建立高效的研发流程。',
        url: 'https://wenku.baidu.com/view/6b6c8d0a580216fc710afd8f.html',
        image: 'https://via.placeholder.com/400x250/0D9488/FFFFFF?text=研发复盘'
      },
      
      // 新增：行业专项复盘文章
      {
        title: '销售业绩复盘与策略调整',
        description: '销售复盘通过分析业绩数据、客户反馈和市场变化，优化销售策略，提升业绩达成率。',
        url: 'https://wenku.baidu.com/view/d2f4d3ac51f01dc281e53a580216fc700a53d0d5.html',
        image: 'https://via.placeholder.com/400x250/7C3AED/FFFFFF?text=销售复盘'
      },
      {
        title: '产品迭代复盘与用户反馈分析',
        description: '产品迭代复盘关注用户体验和数据指标，通过系统分析用户反馈，指导产品优化方向。',
        url: 'https://wenku.baidu.com/view/f8f6d4264128915f804d2b160b4e767f5acf80e8.html',
        image: 'https://via.placeholder.com/400x250/DC2626/FFFFFF?text=产品复盘'
      },
      {
        title: '营销活动复盘与ROI分析',
        description: '营销活动复盘通过数据分析活动效果，评估投资回报率，优化营销资源配置和活动策略。',
        url: 'https://wenku.baidu.com/view/a8e60b004128915f804d2b160b4e767f5acf80f8.html',
        image: 'https://via.placeholder.com/400x250/059669/FFFFFF?text=营销复盘'
      }
    ];
  }
  
  return [
    {
      title: 'Harvard Business Review: Learning to Learn',
      description: 'Deep dive into how systematic reflection and review accelerate personal growth',
      url: 'https://hbr.org/2016/03/learning-to-learn',
      image: 'https://via.placeholder.com/400x250/4F46E5/FFFFFF?text=HBR'
    },
    {
      title: 'Reflective Practice: Key to Professional Development',
      description: 'Learn how structured reflection enhances professional skills and decision-making',
      url: 'https://www.mindtools.com/a6i8qh4/reflective-practice',
      image: 'https://via.placeholder.com/400x250/7C3AED/FFFFFF?text=Reflection'
    },
    {
      title: 'Startup Review Practice Guide',
      description: 'How Silicon Valley startup teams achieve rapid iteration through regular reviews',
      url: 'https://firstround.com/review/',
      image: 'https://via.placeholder.com/400x250/EC4899/FFFFFF?text=Startup'
    },
    {
      title: 'Agile Retrospective Best Practices',
      description: 'How agile teams continuously improve through effective retrospective meetings',
      url: 'https://www.atlassian.com/team-playbook/plays/retrospective',
      image: 'https://via.placeholder.com/400x250/10B981/FFFFFF?text=Agile'
    },
    {
      title: 'Atlassian Team Collaboration Guide',
      description: 'How world-class teams conduct efficient team reviews and collaboration',
      url: 'https://www.atlassian.com/agile/retrospectives',
      image: 'https://via.placeholder.com/400x250/F59E0B/FFFFFF?text=Team'
    },
    {
      title: 'Lessons Learned Management in Project Management',
      description: 'How to systematically collect, analyze, and apply project experience',
      url: 'https://www.pmi.org/learning/library/lessons-learned-next-level-communicating-7991',
      image: 'https://via.placeholder.com/400x250/EF4444/FFFFFF?text=PM'
    },
    {
      title: 'Forbes: 7 Habits of Personal Growth',
      description: 'How successful people achieve continuous growth through regular reflection',
      url: 'https://www.forbes.com/sites/forbescoachescouncil/2019/08/19/15-habits-of-highly-effective-people-who-know-how-to-manage-their-time/',
      image: 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=Growth'
    },
    {
      title: 'Leadership Development: Learning from Experience',
      description: 'How great leaders extract wisdom from every experience',
      url: 'https://hbr.org/2016/03/leaders-can-make-themselves-more-learning-oriented',
      image: 'https://via.placeholder.com/400x250/8B5CF6/FFFFFF?text=Leadership'
    },
    {
      title: 'Reflection Techniques for Productivity',
      description: 'Make work more efficient through scientific review methods',
      url: 'https://www.inc.com/jessica-stillman/science-says-this-simple-habit-can-make-you-22-percent-more-productive.html',
      image: 'https://via.placeholder.com/400x250/06B6D4/FFFFFF?text=Productivity'
    },
    {
      title: 'McKinsey: Organizational Learning & Knowledge Management',
      description: 'How top consulting firms build learning organizations',
      url: 'https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights',
      image: 'https://via.placeholder.com/400x250/14B8A6/FFFFFF?text=Strategy'
    }
  ];
}

function getMockVideos(lang: string = 'en') {
  if (lang === 'zh') {
    return [
      {
        title: '什么是系统化复盘？3分钟快速了解',
        channel: '成长思维',
        views: '50万',
        thumbnail: 'https://via.placeholder.com/400x225/DC2626/FFFFFF?text=系统复盘',
        url: 'https://www.youtube.com/results?search_query=系统化复盘'
      },
      {
        title: '联想柳传志：复盘方法论详解',
        channel: '管理智慧',
        views: '120万',
        thumbnail: 'https://via.placeholder.com/400x225/7C3AED/FFFFFF?text=柳传志',
        url: 'https://www.youtube.com/results?search_query=柳传志+复盘'
      },
      {
        title: '如何做好个人复盘？五步法实战',
        channel: '个人成长课堂',
        views: '80万',
        thumbnail: 'https://via.placeholder.com/400x225/059669/FFFFFF?text=复盘实战',
        url: 'https://www.youtube.com/results?search_query=个人复盘方法'
      },
      {
        title: '团队复盘会议怎么开？完整流程演示',
        channel: '敏捷教练',
        views: '65万',
        thumbnail: 'https://via.placeholder.com/400x225/F59E0B/FFFFFF?text=团队复盘',
        url: 'https://www.youtube.com/results?search_query=团队复盘会议'
      },
      {
        title: '年度复盘指南：如何总结一年的得失',
        channel: '时间管理大师',
        views: '95万',
        thumbnail: 'https://via.placeholder.com/400x225/EC4899/FFFFFF?text=年度总结',
        url: 'https://www.youtube.com/results?search_query=年度复盘'
      },
      {
        title: '项目复盘：经验教训萃取实战',
        channel: 'PMI中国',
        views: '45万',
        thumbnail: 'https://via.placeholder.com/400x225/3B82F6/FFFFFF?text=项目复盘',
        url: 'https://www.youtube.com/results?search_query=项目复盘'
      },
      {
        title: '系统思维与深度复盘',
        channel: '思维训练营',
        views: '70万',
        thumbnail: 'https://via.placeholder.com/400x225/8B5CF6/FFFFFF?text=系统思维',
        url: 'https://www.youtube.com/results?search_query=系统思维+复盘'
      },
      {
        title: 'OKR复盘：如何做好目标回顾',
        channel: 'OKR实践者',
        views: '55万',
        thumbnail: 'https://via.placeholder.com/400x225/06B6D4/FFFFFF?text=OKR',
        url: 'https://www.youtube.com/results?search_query=OKR复盘'
      },
      {
        title: '从失败中学习：复盘的艺术',
        channel: '领导力学院',
        views: '88万',
        thumbnail: 'https://via.placeholder.com/400x225/14B8A6/FFFFFF?text=失败学习',
        url: 'https://www.youtube.com/results?search_query=失败复盘'
      },
      {
        title: '敏捷回顾会：Scrum团队的复盘实践',
        channel: 'Scrum中文网',
        views: '60万',
        thumbnail: 'https://via.placeholder.com/400x225/EF4444/FFFFFF?text=敏捷回顾',
        url: 'https://www.youtube.com/results?search_query=敏捷回顾会'
      }
    ];
  }
  
  return [
    {
      title: 'TED Talk: The Power of Vulnerability',
      channel: 'TED',
      views: '2M',
      thumbnail: 'https://via.placeholder.com/400x225/DC2626/FFFFFF?text=TED',
      url: 'https://www.youtube.com/watch?v=iCvmsMzlF7o'
    },
    {
      title: 'How to Build a High-Performance Team',
      channel: 'Harvard Business Review',
      views: '500K',
      thumbnail: 'https://via.placeholder.com/400x225/7C3AED/FFFFFF?text=HBR',
      url: 'https://www.youtube.com/watch?v=3SWRwkJIkWQ'
    },
    {
      title: 'Agile Retrospectives: Making Good Teams Great',
      channel: 'Agile Academy',
      views: '1.2M',
      thumbnail: 'https://via.placeholder.com/400x225/059669/FFFFFF?text=Agile',
      url: 'https://www.youtube.com/watch?v=p4m1oM15RXY'
    },
    {
      title: 'Simon Sinek: Start With Why',
      channel: 'Simon Sinek',
      views: '3M',
      thumbnail: 'https://via.placeholder.com/400x225/F59E0B/FFFFFF?text=Leadership',
      url: 'https://www.youtube.com/watch?v=u4ZoJKF_VuA'
    },
    {
      title: 'Building a Psychologically Safe Workplace',
      channel: 'Stanford Graduate School',
      views: '800K',
      thumbnail: 'https://via.placeholder.com/400x225/EC4899/FFFFFF?text=Stanford',
      url: 'https://www.youtube.com/watch?v=LhoLuui9gX8'
    },
    {
      title: 'The McKinsey Way: Problem Solving',
      channel: 'McKinsey & Company',
      views: '650K',
      thumbnail: 'https://via.placeholder.com/400x225/3B82F6/FFFFFF?text=McKinsey',
      url: 'https://www.youtube.com/watch?v=lBKi5sDxqSM'
    },
    {
      title: '10 Proven Productivity Tips',
      channel: 'Productivity Game',
      views: '1.5M',
      thumbnail: 'https://via.placeholder.com/400x225/8B5CF6/FFFFFF?text=Productivity',
      url: 'https://www.youtube.com/watch?v=JZKzoUbk2Kg'
    },
    {
      title: 'The Futur: Personal Growth and Learning',
      channel: 'The Futur',
      views: '2.1M',
      thumbnail: 'https://via.placeholder.com/400x225/06B6D4/FFFFFF?text=Growth',
      url: 'https://www.youtube.com/watch?v=S6ImeaxCHJg'
    },
    {
      title: 'MIT: Introduction to Systems Thinking',
      channel: 'MIT OpenCourseWare',
      views: '450K',
      thumbnail: 'https://via.placeholder.com/400x225/14B8A6/FFFFFF?text=MIT',
      url: 'https://www.youtube.com/watch?v=_vS4b4qHGbI'
    },
    {
      title: 'What Makes a Team Innovative? Google Research',
      channel: 'Google for Startups',
      views: '900K',
      thumbnail: 'https://via.placeholder.com/400x225/EF4444/FFFFFF?text=Innovation',
      url: 'https://www.youtube.com/watch?v=v2PaZ8Nl2T4'
    }
  ];
}

export default resources;
