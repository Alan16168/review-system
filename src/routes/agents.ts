import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 获取所有智能体列表
app.get('/', async (c) => {
  try {
    // 这里返回静态数据，也可以从数据库读取
    const agents = [
      {
        id: 1,
        name: 'AI写作',
        icon: '✍️',
        description: '智能AI写作助手，支持多种文体创作，包括文章、博客、营销文案、社交媒体内容等。提供专业的写作建议和内容优化。',
        category: '内容创作',
        features: ['智能生成', '多种模板', '内容优化', '实时预览'],
        status: 'active',
        usageCount: 1234,
        rating: 4.8,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'AI翻译',
        icon: '🌐',
        description: '专业的多语言翻译助手，支持100+语言互译，提供精准的翻译结果和本地化建议。',
        category: '语言工具',
        features: ['多语言支持', '专业术语', '上下文理解', '批量翻译'],
        status: 'active',
        usageCount: 856,
        rating: 4.6,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'AI代码助手',
        icon: '💻',
        description: '智能编程助手，支持多种编程语言，提供代码生成、调试、优化等功能。',
        category: '开发工具',
        features: ['代码生成', '错误修复', '性能优化', '代码审查'],
        status: 'active',
        usageCount: 2341,
        rating: 4.9,
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'AI设计师',
        icon: '🎨',
        description: '创意设计助手，提供设计灵感、配色方案、布局建议等功能。',
        category: '设计工具',
        features: ['设计建议', '配色方案', '布局优化', '创意灵感'],
        status: 'coming_soon',
        usageCount: 0,
        rating: 0,
        created_at: new Date().toISOString()
      }
    ];

    return c.json({ agents });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 获取单个智能体详情
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // 这里返回静态数据
    const agent = {
      id,
      name: 'AI写作',
      icon: '✍️',
      description: '智能AI写作助手，支持多种文体创作',
      longDescription: `
        AI写作助手是一个强大的内容创作工具，利用先进的自然语言处理技术，帮助您快速生成高质量的文本内容。
        
        主要功能：
        - 🎯 多种写作模板：文章、博客、营销文案、社交媒体等
        - 🚀 智能内容生成：基于您的需求快速生成内容
        - ✨ 内容优化建议：提供专业的写作建议
        - 📊 实时预览：即时查看生成效果
        
        适用场景：
        - 博客文章创作
        - 营销文案撰写
        - 社交媒体内容
        - 产品描述生成
        - 邮件模板创建
      `,
      category: '内容创作',
      features: ['智能生成', '多种模板', '内容优化', '实时预览'],
      status: 'active',
      usageCount: 1234,
      rating: 4.8,
      reviews: [
        { user: '张三', rating: 5, comment: '非常好用的写作工具！' },
        { user: '李四', rating: 4, comment: '效果不错，值得推荐。' }
      ]
    };

    return c.json({ agent });
  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
