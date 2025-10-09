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

    // If API keys not configured, return mock data
    if (!apiKey || !searchEngineId) {
      console.log('Google API keys not configured, returning mock data');
      return c.json({ 
        articles: getMockArticles(),
        source: 'mock'
      });
    }

    // Search for reflection and review related articles
    const queries = [
      'reflection practice learning',
      'team retrospective agile',
      'personal growth review'
    ];

    const allArticles: any[] = [];
    
    for (const query of queries) {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=4`;
      
      try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.items) {
          const articles = data.items.map((item: any) => ({
            title: item.title,
            description: item.snippet,
            url: item.link,
            image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || `https://via.placeholder.com/400x250/4F46E5/FFFFFF?text=${encodeURIComponent(item.title.substring(0, 20))}`
          }));
          allArticles.push(...articles);
        }
      } catch (error) {
        console.error('Search query error:', error);
      }
    }

    // Return first 10 unique articles
    const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.url, a])).values()).slice(0, 10);
    
    if (uniqueArticles.length === 0) {
      return c.json({ 
        articles: getMockArticles(),
        source: 'mock_fallback'
      });
    }

    return c.json({ 
      articles: uniqueArticles,
      source: 'google_search'
    });
  } catch (error) {
    console.error('Articles API error:', error);
    return c.json({ 
      articles: getMockArticles(),
      source: 'error_fallback'
    });
  }
});

// Get videos using YouTube Data API
resources.get('/videos', async (c) => {
  try {
    const apiKey = c.env.YOUTUBE_API_KEY;

    // If API key not configured, return mock data
    if (!apiKey) {
      console.log('YouTube API key not configured, returning mock data');
      return c.json({ 
        videos: getMockVideos(),
        source: 'mock'
      });
    }

    // Search for reflection and review related videos
    const queries = [
      'reflection learning TED',
      'team retrospective agile',
      'personal growth review'
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
        videos: getMockVideos(),
        source: 'mock_fallback'
      });
    }

    return c.json({ 
      videos: uniqueVideos,
      source: 'youtube_api'
    });
  } catch (error) {
    console.error('Videos API error:', error);
    return c.json({ 
      videos: getMockVideos(),
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
function getMockArticles() {
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

function getMockVideos() {
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
