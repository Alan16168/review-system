# 系统复盘平台 (Review System Platform)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Alan16168/review-system?style=social)](https://github.com/Alan16168/review-system)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange)](https://review-system.pages.dev)

一个帮助个人和团队进行深度复盘的全栈 Web 应用系统，支持6种语言（简体中文、繁體中文、English、Français、日本語、Español）。

**🔗 GitHub 仓库**: https://github.com/Alan16168/review-system  
**🌐 在线演示**: https://review-system.pages.dev  
**🚀 最新部署**: https://review-system.pages.dev (2025-11-22 13:40 UTC)  
**🚀 部署 ID**: https://5c6a3486.review-system.pages.dev  
**🔧 修复版本**: V1.2.0 - 商城功能完整修复 + 分层定价系统  
**💳 订阅系统**: ✅ 完整的PayPal订阅支付功能（年费$20）  
**🛒 购物车系统**: ✅ 支持多商品结算，一次性支付所有订阅服务  
**✅ 当前版本**: V1.2.0 - 商城产品详情 + 分层定价 + 团队功能修复 (2025-11-22)  
**🔥 最新功能**: ✅ 商城产品详情404修复 + 根据会员等级动态显示价格 + 团队列表修复  
**💳 支付系统**: ✅ 支持写作模板/复盘模板/智能体等跨表产品购买 + 三级会员定价  
**🛠️ 错误处理**: ✅ 统一错误响应格式 + 详细日志记录 + 用户友好提示  
**🔐 权限控制**: ✅ 标准化认证中间件 + 购物车需登录 + 未登录用户保护  
**🛒 商城系统**: ✅ 智能体/写作模板/复盘模板/其他 四大分类 + 自动合并付费模板 + 分层定价  
**📝 模板系统**: ✅ 支持私人/团队/公开三种可见性级别 + 三级会员价格（普通/高级/超级）  
**📱 移动端**: ✅ 完整的汉堡菜单 + 手机优化布局  
**🌍 多语言**: ✅ 完整的6种语言支持（zh/zh-TW/en/fr/ja/es）  
**🔧 诊断工具**: https://review-system.pages.dev/diagnostic.html （缓存问题诊断）
**📱 移动端专属版**: https://review-system.pages.dev/mobile （触控优化界面）

---

## 📱 V8.7.0 新增 - 移动端专属应用 (2025-11-24)

**重大更新**: 全新打造的移动端专属应用界面！

**新增内容**:

**1. 移动端专属界面** ✅
- **独立路由**: `/mobile` - 完全独立于Web版的移动端应用
- **全新设计**: 
  - 类原生App体验，完全不同于Web版的响应式适配
  - 底部导航栏（首页、审查、团队、我的）
  - 手势支持（下拉刷新）
  - 触控优化（最小44px点击区域）
  - 渐变色卡片设计
  - 平滑过渡动画

**2. 移动端专属文件** ✅
- `public/static/mobile-app.js` (30KB) - 移动端专属逻辑
  - 独立的路由系统（不依赖Web版）
  - 优化的API调用（减少数据传输）
  - 触摸手势处理
  - 下拉刷新功能
- `public/static/mobile-styles.css` (15KB) - 移动端专属样式
  - 触控友好设计
  - 渐变色主题
  - 卡片式布局
  - 底部导航固定
  - iPhone刘海屏适配

**3. 同步所有最新功能（V8.5.0-V8.6.1）** ✅
- ✅ **V8.5.0**: 多层AI服务回退（Gemini → OpenAI → Claude → Genspark）
- ✅ **V8.5.1**: YouTube字幕提取重写（解析视频页面HTML）
- ✅ **V8.6.0**: 字幕预览功能（用户确认后再分析）
- ✅ **V8.6.1**: 复盘列表分类修复（名著/文档不显示在普通列表）

**4. 移动端特色功能** ✅
- **快速操作入口**: 首页四宫格快捷方式
  - 新建审查
  - 名著分析
  - 文档分析
  - 团队管理
- **智能加载**: Toast提示 + 全屏Loading动画
- **流畅交互**: 
  - 点击缩放反馈
  - 滑动流畅过渡
  - 自动隐藏滚动条
  - 防止误触
- **视觉优化**:
  - 渐变色主题（紫色渐变）
  - 圆角卡片设计
  - 阴影层次感
  - 图标+文字组合

**5. 移动端页面结构** ✅
```
移动端应用 (/mobile)
├── 登录页面
│   ├── 渐变色背景
│   ├── Logo动画
│   └── 大按钮输入
├── 首页
│   ├── 欢迎横幅
│   ├── 快速操作（四宫格）
│   └── 最近审查列表
├── 审查列表
│   ├── 状态过滤标签
│   ├── 卡片式展示
│   └── 下拉刷新
├── 名著分析
│   ├── 创建分析（文本/视频/PDF）
│   ├── 字幕预览确认
│   ├── AI分析结果展示
│   └── 多层AI服务支持
├── 团队管理
│   ├── 团队列表
│   └── 团队详情
└── 个人中心
    ├── 头像+信息
    ├── 功能菜单
    └── 退出登录
```

**6. 响应式适配** ✅
- **小屏幕**（<768px）: 全屏移动端界面
- **中屏幕**（≥768px）: 居中显示（最大500px宽度）
- **安全区域**: 自动适配iPhone刘海屏（safe-area-inset）

**访问方式**:
1. **直接访问**: https://review-system.pages.dev/mobile
2. **从Web版跳转**: 右下角浮动按钮（仅在手机端显示）

---

## 🔧 V8.6.1 修复 - 复盘列表分类问题 (2025-11-24)

**部署信息**:
- **部署时间**: 2025-11-24 06:00 UTC
- **部署 URL**: https://006498b5.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v8.6.1
- **Worker Bundle**: 392.42 kB

**核心修复**:

**1. 复盘列表分类混淆问题** ✅
- **问题**: "名著复盘"和"文档复盘"出现在"我的复盘"和"公开复盘"列表中
- **根本原因**: 
  - 获取复盘列表的 SQL 查询没有过滤 `review_type` 字段
  - 导致所有类型的复盘（普通、名著、文档）都混在一起显示
- **影响**: 用户在"我的复盘"页面看到不应该出现的名著复盘和文档复盘记录

**2. 解决方案** ✅
- **修复"我的复盘"列表** (`GET /api/reviews/`)
  ```sql
  -- 添加过滤条件
  AND (r.review_type IS NULL OR r.review_type NOT IN ('famous-book', 'document'))
  ```
- **修复"公开复盘"列表** (`GET /api/reviews/public`)
  ```sql
  -- 添加过滤条件
  AND (r.review_type IS NULL OR r.review_type NOT IN ('famous-book', 'document'))
  ```

**3. 复盘类型说明** ✅
- **普通复盘** (`review_type IS NULL` 或其他值)
  - 显示在"我的复盘"列表
  - 显示在"公开复盘"列表（如果是公开的）
  - 基于模板（灵魂9问、个人年复盘等）
- **名著复盘** (`review_type = 'famous-book'`)
  - **仅显示在"名著复盘"列表**
  - 不显示在"我的复盘"和"公开复盘"中
  - 通过 AI 分析书籍或视频生成
- **文档复盘** (`review_type = 'document'`)
  - **仅显示在"文档复盘"列表**
  - 不显示在"我的复盘"和"公开复盘"中
  - 通过 AI 分析文档生成

**技术实现**:
```typescript
// 修复前（错误）
const query = `
  SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
  FROM reviews r
  LEFT JOIN users u ON r.user_id = u.id
  LEFT JOIN teams t ON r.team_id = t.id
  WHERE r.user_id = ?
  ORDER BY r.updated_at DESC
`;

// 修复后（正确）
const query = `
  SELECT DISTINCT r.*, u.username as creator_name, t.name as team_name
  FROM reviews r
  LEFT JOIN users u ON r.user_id = u.id
  LEFT JOIN teams t ON r.team_id = t.id
  WHERE r.user_id = ?
  AND (r.review_type IS NULL OR r.review_type NOT IN ('famous-book', 'document'))
  ORDER BY r.updated_at DESC
`;
```

**用户体验改进**:
- ✅ "我的复盘"列表只显示普通复盘
- ✅ "公开复盘"列表只显示普通的公开复盘
- ✅ "名著复盘"列表只显示名著复盘
- ✅ "文档复盘"列表只显示文档复盘
- ✅ 四个列表完全独立，互不干扰

**测试验证**:
- ✅ 创建普通复盘 → 只在"我的复盘"显示
- ✅ 创建名著复盘 → 只在"名著复盘"显示
- ✅ 创建文档复盘 → 只在"文档复盘"显示
- ✅ 公开复盘 → 只在"公开复盘"显示（不包含名著和文档）

---

## 🔧 V8.6.0 功能增强 - 字幕预览确认功能 (2025-11-24)

**部署信息**:
- **部署时间**: 2025-11-24 05:30 UTC
- **部署 URL**: https://a1475463.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v8.6.0
- **Worker Bundle**: 392.25 kB

**核心功能**:

**1. 字幕预览与确认流程** ✅
- **问题**: 用户无法确认字幕是否正确就直接进入 AI 分析
- **解决方案**: 在 AI 分析前显示字幕预览界面，让用户确认
- **用户流程**:
  1. 输入 YouTube 视频链接
  2. 系统自动获取字幕
  3. **显示字幕预览界面**（新增）
  4. 用户确认字幕准确性
  5. 点击"确认并继续分析"
  6. AI 基于确认的字幕进行分析

**2. 字幕预览界面设计** ✅
- **视频信息卡片**: 
  - 视频标题、频道名称
  - 时长、观看次数、点赞数
  - 蓝色背景，清晰展示
- **字幕获取状态**:
  - 绿色成功提示卡片
  - 显示字幕语言（简体中文/繁体中文/English 等）
  - 显示字幕字数统计
- **字幕内容展示**:
  - 只读文本框，显示前 5000 字符
  - 等宽字体，便于阅读
  - 超过长度自动省略并提示
- **确认提示**:
  - 黄色警告卡片
  - 提醒用户检查字幕准确性
  - 说明可能的操作选项
- **操作按钮**:
  - "取消" - 返回表单
  - "确认并继续分析" - 开始 AI 分析

**3. 后端 API 优化** ✅
- **新增端点**: `POST /api/reviews/famous-books/get-transcript`
  - 专门用于获取字幕的独立端点
  - 返回完整的字幕数据和视频元数据
  - 不触发 AI 分析，仅获取字幕
- **响应数据结构**:
  ```typescript
  {
    hasTranscript: boolean,
    transcript: string,
    transcriptLanguage: string,
    transcriptLength: number,
    videoMetadata: {
      title: string,
      channelTitle: string,
      duration: string,
      viewCount: string,
      likeCount: string
    },
    videoId: string
  }
  ```

**4. 无字幕视频处理** ✅
- **友好提示**: 明确告知用户视频没有字幕
- **用户选择**: 
  - 可以取消操作
  - 或选择继续（仅基于元数据分析）
- **确认对话框**: 使用原生 confirm 对话框快速确认

**技术实现**:

```javascript
// 前端流程
async function analyzeFamousBook(inputType, content, language) {
  // 1. 获取字幕
  const transcriptResponse = await axios.post(
    '/api/reviews/famous-books/get-transcript', 
    { content }
  );
  
  // 2. 显示预览
  if (transcriptData.hasTranscript) {
    showTranscriptPreview(transcriptData, ...);
    return; // 等待用户确认
  }
  
  // 3. 用户点击"确认并继续分析"后
  continueWithAnalysis(...);
}

// 字幕预览界面
function showTranscriptPreview(transcriptData, ...) {
  // 显示视频信息
  // 显示字幕内容（前5000字符）
  // 显示确认按钮
}

// 继续分析
async function continueWithAnalysis(...) {
  // 调用 analyze API
  // 显示分析结果
}
```

**用户体验提升**:
- 🎯 **透明度**: 用户可以看到完整的字幕内容
- ✅ **质量控制**: 用户可以确认字幕是否正确
- 🚫 **避免浪费**: 字幕不准确时可以取消，避免无效分析
- 📊 **信息完整**: 显示视频元数据和字幕统计信息
- 💡 **友好提示**: 清晰的指引和建议

**测试验证**:
- ✅ YouTube 视频分析流程完整
- ✅ 字幕预览界面正常显示
- ✅ 用户确认后 AI 分析正常
- ✅ 无字幕视频显示友好提示
- ✅ 取消操作返回表单正常

---

## 🔧 V8.5.1 修复 - YouTube 字幕获取优化 (2025-11-24)

**部署信息**:
- **部署时间**: 2025-11-24 05:00 UTC
- **部署 URL**: https://6fb7bf64.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v8.5.1
- **Worker Bundle**: 390.06 kB

**核心修复**:

**1. YouTube 字幕获取完全重写** ✅
- **问题**: 字幕 API 调用失败，导致分析结果与视频内容完全无关
- **根本原因**: 
  - 直接调用 `youtube.com/api/timedtext` 需要签名和过期时间参数
  - 简单的 API 调用无法获取字幕数据
- **解决方案**: 
  - 解析 YouTube 视频页面，提取 `captionTracks` 数据
  - 获取完整的字幕 URL（包含签名和过期时间）
  - 支持多语言优先级：简体中文 → 繁体中文 → 中文 → 英文
  - 自动选择最佳可用字幕

**2. 字幕解析优化** ✅
- **XML 格式解析**: 正确解析 YouTube 字幕 XML 格式
- **HTML 实体解码**: 处理 `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;` 等实体
- **文本清理**: 移除换行符，合并空格，确保文本干净
- **字符统计**: 显示获取的字幕语言和字数

**3. 错误提示改进** ✅
- **明确原因**: 区分"视频没有字幕"和"字幕获取失败"
- **用户建议**: 提示使用带字幕的视频以获得更准确的分析
- **详细日志**: 记录字幕语言、字数等信息便于调试

**技术实现**:
```typescript
// 1. 获取视频页面
const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
const pageHtml = await videoPageResponse.text();

// 2. 提取字幕轨道
const captionTracksMatch = pageHtml.match(/"captionTracks":\[([^\]]+)\]/);
const captionTracks = JSON.parse('[' + captionTracksMatch[1] + ']');

// 3. 选择最佳字幕（优先中文）
const priorityLangs = ['zh-Hans', 'zh-Hant', 'zh', 'en'];
let selectedTrack = captionTracks.find(track => 
  priorityLangs.includes(track.languageCode)
);

// 4. 获取字幕内容
const transcriptResponse = await fetch(selectedTrack.baseUrl);
const transcriptXml = await transcriptResponse.text();

// 5. 解析 XML 并提取文本
const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
const transcript = Array.from(textMatches)
  .map(match => decodeHtmlEntities(match[1]))
  .join(' ');
```

**用户体验提升**:
- 🎯 **准确性大幅提升**: 分析结果基于真实的视频字幕内容
- 🌍 **多语言支持**: 自动选择最合适的字幕语言
- 📊 **透明度**: 显示使用的字幕语言和字数
- 💡 **友好提示**: 无字幕时给出明确建议

**测试结果**:
- ✅ 中文字幕视频：成功获取简体中文字幕
- ✅ 英文字幕视频：成功获取英文字幕
- ✅ 多语言字幕视频：按优先级选择最佳字幕
- ✅ 无字幕视频：显示友好提示信息
- ✅ 分析结果准确反映视频内容

---

## 🔧 V8.5.0 重大更新 - AI 服务多层降级策略 (2025-11-24)

**部署信息**:
- **部署时间**: 2025-11-24 04:30 UTC
- **部署 URL**: https://f0f085b3.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v8.5.0
- **Worker Bundle**: 389.49 kB

**核心改进**:

**1. 名著复盘/文档复盘 AI 服务多层降级** ✅
- **问题**: Gemini API 配额超限错误（429 Too Many Requests）导致功能完全不可用
- **解决方案**: 实现四层 AI 服务自动降级
  - **Tier 1 - Gemini API**: gemini-2.0-flash-exp（最快最便宜）
  - **Tier 2 - OpenAI API**: gpt-4o-mini（高质量备选）
  - **Tier 3 - Claude API**: claude-3-5-sonnet（Anthropic高质量）
  - **Tier 4 - Genspark API**: 最终后备方案
- **智能降级**: 当某个服务失败时自动尝试下一个，确保功能可用性
- **错误处理**: 详细的错误日志和用户友好提示

**2. YouTube 视频分析功能保留** ✅
- **三步 API 流程**: YouTube Data API → YouTube Transcript API → AI 分析
- **多语言字幕**: 优先中文字幕，回退英文
- **完整元数据**: 标题、描述、统计数据、字幕内容
- **AI 分析整合**: 使用多层降级策略分析视频内容

**3. 前端错误提示优化** ✅
- **详细错误列表**: 显示每个 AI 服务的失败原因
- **用户建议**: 提供明确的解决方案和建议
- **错误卡片设计**: 红色背景卡片，清晰展示错误信息
- **服务状态可见**: 用户可以看到系统尝试了哪些服务

**4. 环境变量类型定义更新** ✅
- **新增 API 密钥类型**:
  ```typescript
  type Bindings = {
    DB: D1Database;
    YOUTUBE_API_KEY?: string;
    GEMINI_API_KEY?: string;
    OPENAI_API_KEY?: string;    // 新增
    CLAUDE_API_KEY?: string;    // 新增
    GENSPARK_API_KEY?: string;
  };
  ```

**技术实现**:
- **降级策略**: 使用 try-catch 包裹每个 API 调用，失败时自动尝试下一个
- **错误收集**: 收集所有 API 的错误信息，便于调试
- **统一响应**: 所有 AI 服务返回统一的 JSON 格式 `{ result, source }`
- **服务标识**: 返回的 `source` 字段标识使用的 AI 服务（gemini/openai/claude/genspark）

**配置指南**:
1. **Gemini API**: 访问 https://ai.google.dev/ 获取 API 密钥
2. **OpenAI API**: 访问 https://platform.openai.com/api-keys 获取 API 密钥
3. **Claude API**: 访问 https://console.anthropic.com/ 获取 API 密钥
4. **Genspark API**: 联系管理员获取 API 密钥

**环境变量设置**:
```bash
# 使用 wrangler 设置环境变量
npx wrangler pages secret put GEMINI_API_KEY --project-name review-system
npx wrangler pages secret put OPENAI_API_KEY --project-name review-system
npx wrangler pages secret put CLAUDE_API_KEY --project-name review-system
npx wrangler pages secret put GENSPARK_API_KEY --project-name review-system
```

**用户体验提升**:
- 🚀 **高可用性**: 即使某个 AI 服务失败，系统仍可正常工作
- 💰 **成本优化**: 优先使用便宜的服务，失败时才使用高级服务
- 🔍 **透明度**: 用户可以看到系统使用了哪个 AI 服务
- 📊 **可观测性**: 详细的错误日志便于问题诊断

**测试验证**:
- ✅ Gemini API 配额超限时自动降级到 OpenAI
- ✅ 所有 AI 服务失败时显示友好错误提示
- ✅ YouTube 视频分析功能正常工作
- ✅ 前端错误提示清晰易懂
- ✅ 生产环境部署成功

---

## 🔧 V1.2.2 重大更新 - 下架状态视觉优化 + 智能排序 (2025-11-22)

**部署信息**:
- **部署时间**: 2025-11-22 15:00 UTC
- **部署 URL**: https://40209367.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v1.2.2
- **Worker Bundle**: 356.42 kB

**核心改进**:

**1. 智能体产品管理 - 视觉优化** ✅
- **下架状态变灰**: 下架产品行使用灰色背景(bg-gray-100)并降低透明度(opacity-60)
- **图标颜色调整**: 下架产品图标从彩色渐变改为灰色渐变(from-gray-400 to-gray-500)
- **文字颜色调整**: 产品名称从黑色变为灰色,描述文字颜色变浅
- **智能排序**: 上架产品排在前面,下架产品自动排在后面

**2. 写作模板管理 - 视觉优化** ✅
- **下架状态变灰**: 下架模板行使用灰色背景并降低透明度
- **图标颜色调整**: 下架模板图标颜色变为灰色(text-gray-400)
- **文字颜色调整**: 模板名称从黑色变为灰色(text-gray-500)
- **智能排序**: 活跃模板在前,禁用模板在后
- **状态切换**: 保留上架/下架按钮,功能完全正常

**3. 其他产品管理 - 视觉优化** ✅
- **统一风格**: 与智能体产品管理使用相同的视觉效果
- **智能排序**: 上架产品优先显示
- **变灰效果**: 下架产品清晰区分

**4. 复盘模板管理 - 无需修改** ✅
- **原因**: 复盘模板主要用于系统功能,不需要在管理界面变灰
- **状态切换**: 已有上架/下架按钮功能

**技术实现**:
- **排序算法**: 使用Array.sort()实现is_active优先排序
  ```javascript
  templates.sort((a, b) => {
    if (a.is_active === b.is_active) return 0;
    return a.is_active ? -1 : 1;
  });
  ```
- **动态CSS类**: 根据is_active状态动态添加bg-gray-100和opacity-60
- **条件渲染**: 使用三元运算符根据状态切换颜色类名
  ```javascript
  ${product.is_active ? 'text-gray-900' : 'text-gray-500'}
  ${product.is_active ? 'from-indigo-500 to-purple-600' : 'from-gray-400 to-gray-500'}
  ```

**用户体验提升**:
- 👁️ **视觉清晰**: 下架产品/模板一眼就能识别
- 📊 **优先级明确**: 活跃产品始终在列表顶部
- 🎨 **统一设计**: 所有管理界面使用一致的视觉语言
- ⚡ **操作便捷**: 状态切换按钮始终可用,可快速切换

**测试验证**:
- ✅ 智能体产品管理: 下架产品变灰并排在最后
- ✅ 写作模板管理: 下架模板变灰并排在最后
- ✅ 其他产品管理: 下架产品变灰并排在最后
- ✅ 所有界面: 状态切换功能正常工作
- ✅ 生产环境: 部署成功,功能验证通过

---

## 🔧 V1.2.1 重大更新 - 管理界面删除按钮改为状态切换 (2025-11-22)

**部署信息**:
- **部署时间**: 2025-11-22 14:30 UTC
- **部署 URL**: https://357dc48a.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v1.2.1
- **Worker Bundle**: 356.42 kB

**核心改进**:

**1. 商城产品管理界面优化** ✅
- **删除功能调整**: 移除删除按钮,仅保留状态切换功能
- **原因**: 避免误删产品,使用上架/下架机制更安全
- **功能**: 保留toggleProductStatus API,可以快速上架/下架产品

**2. 写作模板管理界面优化** ✅
- **删除按钮改为状态切换**: 将危险的删除操作改为上架/下架切换
- **按钮文本**: is_active=1显示"下架", is_active=0显示"上架"
- **图标**: 使用toggle-on/toggle-off图标,更直观
- **颜色**: 下架按钮黄色,上架按钮绿色
- **新增API**: POST /api/writing-templates/:id/toggle-status

**3. 复盘模板管理界面优化** ✅
- **删除按钮改为状态切换**: 保护复盘模板数据,避免误删
- **功能保持**: 所有编辑和管理字段功能不变
- **新增API**: POST /api/templates/:id/toggle-status
- **权限控制**: Premium用户只能切换自己的模板,管理员可切换所有模板

**4. 统一的状态切换术语** ✅
- **上架**: 代表启用状态(is_active=1),产品/模板对用户可见
- **下架**: 代表禁用状态(is_active=0),产品/模板对用户隐藏
- **确认提示**: 切换状态前弹出确认对话框,防止误操作
- **成功反馈**: 操作完成后显示友好的成功通知

**技术实现**:
- **前端修改**: public/static/app.js
  - 修改3个管理界面的按钮HTML
  - 新增toggleWritingTemplateStatus()和toggleTemplateStatus()函数
  - 统一使用toggle-on/toggle-off图标
- **后端新增**: 
  - src/routes/writing_templates.ts: POST /:id/toggle-status endpoint
  - src/routes/templates.ts: POST /:id/toggle-status endpoint
- **保留delete函数**: 为未来可能的需求保留,但UI层面不显示

**用户体验提升**:
- 💾 **数据安全**: 不再有误删产品/模板的风险
- 🔄 **可逆操作**: 下架后可随时重新上架
- 🎯 **操作清晰**: 按钮文本和颜色明确表达功能
- 📊 **状态管理**: 所有产品/模板统一使用is_active字段管理状态

**测试验证**:
- ✅ 商城产品管理:删除按钮已移除,状态切换正常
- ✅ 写作模板管理:状态切换按钮工作正常,API响应正确
- ✅ 复盘模板管理:状态切换按钮工作正常,权限控制正确
- ✅ 所有界面:状态切换后UI立即更新
- ✅ 生产环境:部署成功,功能验证通过

---

## 🔧 V1.2.0 重大更新 - 商城功能完整修复 + 分层定价系统 (2025-11-22)

**部署信息**:
- **部署时间**: 2025-11-22 13:40 UTC
- **部署 URL**: https://5c6a3486.review-system.pages.dev
- **主域名**: https://review-system.pages.dev (自动同步)
- **Git Tag**: v1.2.0
- **Worker Bundle**: 354.98 kB

**核心修复**:

**1. 商城产品详情404错误修复** ✅
- **问题**: 点击商城中的复盘模板和写作模板显示404错误
- **原因**: `/api/marketplace/products/:id` 端点只查询 marketplace_products 表，无法处理带前缀的产品ID
- **解决方案**:
  - 支持 `t_XX` 前缀（复盘模板，从 templates 表查询）
  - 支持 `wt_XX` 前缀（写作模板，从 ai_writing_templates 表查询）
  - 修复数据库列名问题（使用 `owner='public'` 和 `is_public=1`）
- **修复文件**: `src/routes/marketplace.ts`
- **Git commit**: 8741830

**2. 商城价格根据会员等级动态显示** ✅
- **问题**: 用户订阅等级修改后，商城价格显示不变
- **原因**: 用户信息缓存在 localStorage，后台修改后前端不更新
- **解决方案**:
  - 新增 `/api/auth/me` 端点获取最新用户信息
  - 新增 `refreshCurrentUser()` 函数刷新用户信息
  - 商城页面加载时自动刷新用户信息
- **价格策略**:
  - **普通会员 (free)**: 显示 price_user
  - **高级会员 (premium)**: 显示 price_premium
  - **超级会员 (super)**: 显示 price_super
- **修复文件**: 
  - `src/routes/auth.ts` (新增 /me 端点)
  - `public/static/app.js` (添加刷新逻辑)
- **Git commit**: 7155c25

**3. 团队列表查询错误修复** ✅
- **问题**: 点击"团队"菜单出现500错误
- **原因**: 查询使用不存在的 `t.is_public` 列
- **解决方案**: 移除 `WHERE t.is_public = 1` 条件，所有团队默认公开
- **修复文件**: `src/routes/teams.ts`
- **Git commit**: 6d325ef

**4. 分层定价系统完整实现** ✅
- **管理后台**: 支持编辑用户订阅等级（普通会员/高级会员/超级会员）
- **后端API**: 所有商城API返回三个价格字段
- **前端逻辑**: 根据 `currentUser.subscription_tier` 动态显示价格
- **i18n翻译**: 所有语言更新为"会员"命名（而非"用户"）

**测试验证**:
- ✅ 复盘模板产品详情正常显示（t_1, t_2 等）
- ✅ 写作模板产品详情正常显示（wt_1, wt_2 等）
- ✅ 不同订阅等级显示不同价格
- ✅ 团队列表正常显示
- ✅ 用户信息自动刷新

**技术改进**:
- 📊 **API扩展**: 支持跨表产品查询（templates + ai_writing_templates + marketplace_products）
- 🔄 **实时更新**: 用户信息自动从服务器刷新，确保数据最新
- 🔐 **权限控制**: `/api/auth/me` 端点需要认证
- 💾 **数据一致性**: localStorage 与服务器数据保持同步

---

## 🔧 V7.3.0 重大更新 - 智能体链接系统 + 认证修复 (2025-11-22)

**问题描述**:
1. 前端调用 `/api/marketplace/my-agents` 返回 401 Unauthorized
2. 数据库缺少智能体链接字段，无法存储激活链接
3. 前端没有验证 token 是否存在就发起 API 请求

**解决方案**:

**1. 数据库迁移 (0057) - 添加 agent_link 字段**:
```sql
-- 添加智能体链接字段
ALTER TABLE marketplace_products ADD COLUMN agent_link TEXT;

-- 更新现有产品的链接
UPDATE marketplace_products SET agent_link = '/ai-writing' WHERE id = 1;
UPDATE marketplace_products SET agent_link = '/file-processor' WHERE id = 10;
UPDATE marketplace_products SET agent_link = '/new-agent' WHERE id = 12;

-- 创建索引
CREATE INDEX idx_marketplace_products_agent_link ON marketplace_products(agent_link);
```

**2. API 更新 - 返回 agent_link**:
```typescript
// src/routes/marketplace.ts
const product = await c.env.DB.prepare(`
  SELECT description, image_url, features_json, agent_link
  FROM marketplace_products
  WHERE id = ?
`).bind(numericProductId).first();

agents.push({
  ...item,
  agent_link: product?.agent_link || null
});
```

**3. 前端修复 - 验证 token + 使用 agent_link**:
```javascript
// public/static/agents.js
async init() {
  // 验证 token 是否存在
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found, user not logged in');
    this.myAgents = [];
    this.render();
    return;
  }

  // 调用 API
  const response = await fetch('/api/marketplace/my-agents', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 转换数据，包含 agent_link
  this.myAgents = data.agents.map(agent => ({
    ...agent,
    agent_link: agent.agent_link || null
  }));
}

// 使用智能体
useAgent(agentId) {
  const agent = this.myAgents.find(a => a.id == agentId);
  
  if (agent.agent_link) {
    if (agent.agent_link.startsWith('/')) {
      // 内部路径
      if (agent.agent_link === '/ai-writing') {
        AIBooksManager.renderBooksPage();
      } else {
        showNotification(`${agent.name} 功能开发中...`, 'info');
      }
    } else {
      // 外部链接
      window.open(agent.agent_link, '_blank');
    }
  }
}
```

**修复效果**:
- ✅ 修复 401 认证错误
- ✅ 数据库支持智能体链接存储
- ✅ 前端正确验证登录状态
- ✅ 智能体可通过 agent_link 激活
- ✅ 支持内部路径和外部 URL
- ✅ 根据产品名称显示合适图标

**部署信息**:
- 新部署 URL: https://cab65917.review-system.pages.dev
- 部署时间: 2025-11-22 00:30 UTC
- Worker Bundle: 352.18 kB

---

## 🔧 V7.2.9 关键修复 - 前端加载真实购买数据 (2025-11-22)

**问题描述**:
- 虽然 API 返回了正确的购买数据，但前端页面仍只显示一个假的"AI写作"
- 用户购买的"新智能文件处理助手"和"新新智能体"不显示
- 前端 `agents.js` 使用硬编码的假数据，未从 API 加载

**根本原因分析**:
- `public/static/agents.js` 中的 `init()` 方法使用硬编码数据
- 未调用 `/api/marketplace/my-agents` API
- 导致无论购买什么产品，前端都只显示假的"AI写作"

**解决方案**:
```javascript
// 修改前：硬编码假数据
async init() {
  this.myAgents = [{ id: 1, name: 'AI写作', ... }];
  this.render();
}

// 修改后：从API加载真实数据
async init() {
  const response = await fetch('/api/marketplace/my-agents', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const data = await response.json();
  this.myAgents = data.agents.map(agent => ({
    id: agent.product_id,
    name: agent.product_name,
    description: agent.description,
    purchaseDate: agent.purchase_date,
    image_url: agent.image_url,
    ...
  }));
  this.render();
}
```

**修复效果**:
- ✅ 前端正确加载所有购买的智能体
- ✅ 显示产品名称、描述、购买日期等真实信息
- ✅ 支持产品图片显示
- ✅ 动态适配不同类型的智能体

**部署信息**:
- 新部署 URL: https://4a804912.review-system.pages.dev
- 部署时间: 2025-11-22 00:07 UTC
- 修改文件: public/static/agents.js

---

## 🔧 V7.2.8 紧急修复 - "我的智能体"显示问题 (2025-11-21)

**问题描述**:
- 用户购买智能体产品后，"我的智能体"页面仍然看不到购买的产品
- 购买记录已正确保存在 `user_purchases` 表中
- API 返回空数组，但应该显示购买的产品

**根本原因分析**:
- `user_purchases` 表中 `product_id` 是 TEXT 类型（如 "10", "12"）
- `/api/marketplace/my-agents` 端点查询 `marketplace_products` 时直接使用字符串 productId
- `marketplace_products.id` 是 INTEGER 类型
- SQLite 类型不匹配导致查询不到产品详情

**解决方案**:
```typescript
// 在 my-agents 端点中添加类型转换
const numericProductId = parseInt(productId.toString());
const product = await c.env.DB.prepare(`
  SELECT description, image_url, features_json
  FROM marketplace_products
  WHERE id = ?
`).bind(numericProductId).first();
```

**修复效果**:
- ✅ "我的智能体"页面正确显示购买的产品
- ✅ 产品描述、图片、功能等信息正确加载
- ✅ 购买日期和价格正确显示

**部署信息**:
- 新部署 URL: https://1de2d477.review-system.pages.dev
- 部署时间: 2025-11-21 23:40 UTC
- Worker Bundle: 352.12 kB

---

## 🔧 V7.2.7 重大修复 - 购买记录显示 + 完整支付流程 (2025-11-21)

**问题描述**:
1. 用户购买"新智能文件处理助手"后，不显示在"我的智能体"页面
2. 支付时出现 `D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT` 错误

**根本原因分析**:
1. **买家跟踪表外键约束错误**：
   - `product_buyers` 表的 `product_id` 字段为 `INTEGER` 类型，有外键约束指向 `marketplace_products.id`
   - 购物车中存储的 `product_id` 是字符串类型（如 `"1.0"`），导致类型不匹配
   - 插入买家记录时触发外键约束错误

**解决方案**:

**1. 数据库迁移 0056 - 修复所有买家表**:
```sql
-- 修复 product_buyers 表
CREATE TABLE product_buyers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,  -- 从 INTEGER 改为 TEXT
  user_email TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purchase_price REAL
  -- 移除外键约束
);

-- 同时修复 template_buyers 和 writing_template_buyers
-- 将所有 product_id/template_id 改为 TEXT 类型，无外键约束
```

**2. 代码修复 - 统一类型转换**:
```typescript
// 在 POST /cart 和 POST /cart/add 路由中
else {
  // Regular marketplace product
  product = await c.env.DB.prepare(
    'SELECT id, is_active FROM marketplace_products WHERE id = ?'
  ).bind(product_id).first();
  
  // Convert numeric product_id to string for consistent storage
  actualProductId = String(product_id);  // 添加此行
}
```

**修复效果**:
- ✅ **完整支付流程**：用户 → 登录 → 添加购物车 → 结账 → 购买成功
- ✅ **购买记录创建**：`user_purchases` 和 `product_buyers` 表正确记录
- ✅ **购买产品显示**：`/api/marketplace/my-agents` 正确返回购买的智能体
- ✅ **类型一致性**：所有 product_id 统一为 TEXT 类型存储

**完整测试结果**:
```bash
# 用户：buyer001@test.com
# 购买产品：AI智能写作助手 (ID=1)

✅ Step 1: Login successful
✅ Step 2: Add to cart (product_id=1)
✅ Step 3: View cart (1 item)
✅ Step 4: Checkout successful (Purchase ID: 2)
✅ Step 5: Database verification
   - user_purchases: product_id="1" (TEXT)
   - product_buyers: product_id="1" (TEXT)
✅ Step 6: My agents API returns purchased agent
```

---

## 🔧 V7.2.6 重大修复 - 支付结账500错误 (2025-11-21)

**问题描述**: 
- 用户在商城添加商品到购物车后，点击"结账"按钮返回500错误
- 控制台显示："Failed to load resource: the server responded with a status of 500 ()"
- 支付流程完全无法使用

**根本原因分析**:
1. **POST /cart 路由不存在**：前端调用 `POST /api/marketplace/cart`，但后端只有 `POST /api/marketplace/cart/add` 路由
2. **user_purchases 表外键约束错误**：
   - `product_id` 字段类型为 `INTEGER`，但实际存储的是 `TEXT` 类型的产品ID（如 `wt_5`）
   - `product_id` 有外键约束指向 `marketplace_products.id`，但写作模板和复盘模板不在该表中
   - 导致插入购买记录时触发 `FOREIGN KEY constraint failed: SQLITE_CONSTRAINT` 错误

**解决方案**:

**1. 添加 POST /cart 路由别名**:
```typescript
// 在 src/routes/marketplace.ts 添加
app.post('/cart', async (c) => {
  // 完整的添加到购物车逻辑
  // 支持 wt_ (写作模板) 和 t_ (复盘模板) 前缀的产品ID
  // 验证产品是否存在、是否激活、是否已购买、是否已在购物车
});
```

**2. 数据库迁移 0055 - 修复 user_purchases 表结构**:
```sql
-- 创建新表，product_id 从 INTEGER 改为 TEXT
CREATE TABLE user_purchases_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,  -- 支持 wt_5, t_2 等前缀ID
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price_paid REAL NOT NULL,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'completed',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  -- 移除 product_id 外键约束，支持跨表引用
);

-- 迁移现有数据
INSERT INTO user_purchases_new SELECT * FROM user_purchases;

-- 替换旧表
DROP TABLE user_purchases;
ALTER TABLE user_purchases_new RENAME TO user_purchases;
```

**3. 增强错误日志**:
```typescript
// 在 checkout 端点添加详细日志
console.log('Checkout initiated by user:', user.id, user.email);
console.log('Cart items found:', cartItemsRaw.results?.length || 0);
console.log('Processing cart item:', productId);
console.log('Price to pay:', priceToPay, 'for tier:', user.subscription_tier);
console.log('Purchase created successfully, ID:', result.meta.last_row_id);
```

**修复效果**:
- ✅ **添加到购物车成功**：`POST /api/marketplace/cart` 正常工作
- ✅ **查看购物车成功**：显示所有商品信息和三级会员价格
- ✅ **结账支付成功**：创建购买记录，支持跨表产品（写作模板、复盘模板、智能体）
- ✅ **购物车清空**：结账后自动清空购物车
- ✅ **完整测试流程**：
  ```bash
  # 1. 登录
  # 2. 添加商品到购物车（wt_5 - 新传记写作模板）
  # 3. 查看购物车（显示1个商品，价格$3）
  # 4. 结账（成功创建购买记录）
  # 5. 验证数据库（user_purchases表中有记录，product_id="wt_5"）
  ```

**影响文件**:
- `src/routes/marketplace.ts` - 添加POST /cart路由别名（140行）
- `migrations/0055_fix_user_purchases_product_id.sql` - 数据库迁移脚本
- `test_checkout.sh` - 自动化测试脚本

**技术改进**:
- 📊 **数据模型更灵活**：支持 TEXT 类型的产品ID，可以跨表引用
- 🔍 **错误日志完善**：每个步骤都有详细日志，便于调试
- 🧪 **自动化测试**：test_checkout.sh 脚本可重复验证完整流程
- 🛡️ **用户验证**：在 checkout 端点开头验证用户是否已认证

**部署信息**:
- **Git Commit**: 5ce31c8
- **迁移状态**: ✅ Migration 0055 已应用到本地数据库
- **测试结果**: ✅ 完整支付流程通过测试
- **待部署**: 需要部署到生产环境并应用迁移

---

## 🔧 V7.2.5 紧急修复 - 商城错误 (2025-11-21)

**问题描述**: 
- 商城页面显示错误: `D1_ERROR: no such column: visibility at offset /6x: SQLITE_ERROR`

**问题原因**:
- 在V7.2.3中修改了WHERE条件从 `price > 0` 改为 `visibility = 'public'`
- 但 `templates` 表使用的字段名是 `owner` 而不是 `visibility`

**修复内容**:
- ✅ 将 `WHERE visibility = 'public'` 改为 `WHERE owner = 'public'`
- ✅ 本地测试验证通过
- ✅ 生产环境部署成功

**影响文件**: `src/routes/marketplace.ts`

---

## 🎨 V7.2.4 更新 - 购买者追踪系统 (2025-11-21)

**新增功能**:
1. **购买者追踪系统**: 在用户购买产品后，自动记录购买者邮箱到对应的购买者表
   - `template_buyers`: 记录复盘模板的购买者
   - `writing_template_buyers`: 记录写作模板的购买者
   - `product_buyers`: 记录智能体和其他商城产品的购买者

2. **导航菜单更新**: 将"商城"下的"MarketPlace商城"改为"所有商品"（支持中英日三种语言）

**技术实现**:
- ✅ 创建三个购买者追踪表，用于存储用户邮箱
- ✅ 更新checkout API，在购买后自动记录购买者信息
- ✅ 支持按产品类型分别存储到不同的表中
- ✅ 使用INSERT OR IGNORE防止重复记录
- ✅ 为所有表创建了性能索引

**数据库迁移**:
- 迁移文件: `0054_add_buyers_tracking.sql`
- 已应用到本地和生产数据库

**影响文件**:
- `public/static/i18n.js` - 更新翻译
- `src/routes/marketplace.ts` - 更新checkout逻辑
- `migrations/0054_add_buyers_tracking.sql` - 新增迁移

---

## 🎨 V7.2.2 更新 - 修复商城分类筛选 (2025-11-21)

**问题描述**:
1. 在商城中，点击"智能体"标签页，无法显示智能体产品（但"全部商品"中能显示）
2. 在商城中，点击"写作模板"标签页，无法显示写作模板产品（但"全部商品"中能显示）

**问题原因**:
- 前端筛选逻辑使用了错误的字段
- 原代码：`products.filter(p => p.category === this.currentCategory)`
- 问题：应该使用 `product_type` 字段，而不是 `category` 字段

**修改内容**:
- ✅ **修复筛选逻辑**:
  - 修改前：`products.filter(p => p.category === this.currentCategory)`
  - 修改后：`products.filter(p => p.product_type === this.currentCategory)`
  - 影响位置：`public/static/app.js` 第14619行

**筛选逻辑说明**:
| 标签页 | 筛选值 | 对应 product_type |
|--------|--------|-------------------|
| 全部商品 | all | (无筛选) |
| 智能体 | ai_service | ai_service |
| 写作模板 | writing_template | writing_template |
| 复盘模板 | review_template | review_template |
| 其他 | other | other |

**技术实现**:
- **前端更改**: `public/static/app.js`
  - 修改 `renderProducts()` 函数中的筛选条件
  - 使用 `product_type` 字段进行筛选，确保与数据库字段一致

**部署信息**:
- **部署URL**: https://0e8470ea.review-system.pages.dev
- **Git Commit**: b481b5c
- **Build时间**: 2.43s

**用户体验提升**:
- 🎯 智能体产品现在可以在"智能体"标签页中正确显示
- 📝 写作模板产品现在可以在"写作模板"标签页中正确显示
- 💡 所有分类筛选功能恢复正常，用户可以快速找到所需产品

---

## 🎨 V7.2.1 更新 - UI文本优化 (2025-11-21)

**用户需求**: 
1. 写作模板编辑中："AIAgent" 改为 "AI Agent"
2. 管理面板："智能体" 改为 "智能体配置"
3. 管理面板："AI 写作设置" 改为 "智能写作助手"，删除 "AI 智能写作助手设置" 字样

**修改内容**:
- ✅ **写作模板分类选项修正**:
  - 创建模板表单：`<option value="ai_agent">AIAgent</option>` → `<option value="ai_agent">AI Agent</option>`
  - 编辑模板表单：`AIAgent` → `AI Agent`
  - 影响位置：第15176行、第15519行
- ✅ **管理面板主标签重命名**:
  - `<i class="fas fa-robot mr-2"></i>智能体` → `<i class="fas fa-robot mr-2"></i>智能体配置`
  - 影响位置：第6381行
- ✅ **管理面板子标签重命名**:
  - `<i class="fas fa-robot mr-2"></i>AI 写作设置` → `<i class="fas fa-robot mr-2"></i>智能写作助手`
  - `<i class="fas fa-robot mr-2"></i>AI 智能写作助手设置` → `<i class="fas fa-robot mr-2"></i>智能写作助手`
  - 影响位置：第6514行、第13433行

**技术实现**:
- **前端更改**: `public/static/app.js`
  - 统一写作模板分类选项名称（带空格的"AI Agent"）
  - 优化管理面板标签名称，使其更清晰准确
  - 简化标题，去除冗余的"设置"字样

**部署信息**:
- **部署URL**: https://9aaafef2.review-system.pages.dev
- **Git Commit**: 280f140
- **Build时间**: 2.40s

**用户体验提升**:
- 🎯 分类选项格式统一，与其他选项保持一致
- 📝 管理面板标签名称更准确，"智能体配置"更明确功能
- 💡 简化冗余文字，"智能写作助手"比"AI 智能写作助手设置"更简洁

---

## 🎨 V7.2.0 更新 - 商城界面优化 + 购物车修复 (2025-11-21)

**用户需求**: 
1. 修改"MarketPlace 商城"标题为"商城"
2. 添加"写作模板"标签页
3. 修复"加入购物车"功能数据库错误

**修改内容**:
- ✅ **标题简化**: "MarketPlace 商城" → "商城"
  - 更简洁的页面标题
  - 修改国际化文件中的所有语言版本
- ✅ **新增"写作模板"标签页**:
  - 位置：在"智能体"和"复盘模板"之间
  - 图标：fas fa-pen
  - 筛选条件：product_type = 'writing_template'
- ✅ **修复购物车数据库错误**:
  - 错误信息：`D1_ERROR: no such column: product_id`
  - 原因：shopping_cart表使用了旧的表结构
  - 解决方案：创建新迁移文件0053_fix_shopping_cart_schema.sql
  - 新表结构：支持product_id字段（TEXT类型，支持模板ID如'wt_123'）

**技术实现**:
- **前端更改**:
  - `public/static/i18n.js`: 修改marketplaceTitle为"商城"
  - `public/static/app.js`: 添加"写作模板"筛选按钮
- **数据库迁移**:
  - `migrations/0053_fix_shopping_cart_schema.sql`: 重建shopping_cart表
  - 删除旧表结构（item_type, subscription_tier字段）
  - 创建新表结构（product_id, quantity字段）

**部署信息**:
- **部署URL**: https://632d8070.review-system.pages.dev
- **Git Commit**: f3a2eed
- **Build时间**: 2.09s
- **数据库迁移**: ✅ 本地应用成功

**用户体验提升**:
- 🎯 标题更简洁，减少冗余信息
- 📝 新增写作模板独立分类，便于查找
- 🛒 修复购物车功能，用户可正常添加商品
- 🔧 数据库结构更合理，支持多种产品类型

---

## 🎨 V7.1.1 更新 - 所有产品分类下拉选项英文化 (2025-11-21)

**用户需求**: 修改所有产品编辑界面的分类下拉选项为统一的英文选项

**修改内容**:
- ✅ **分类下拉选项完全英文化**: 
  - 旧选项: "AI Service", "Template", "Book Template"
  - 新选项: "AI Agent", "Writing Template", "Review Template", "Others"
- ✅ **默认值**: AI Agent (ai_service)
- ✅ **影响范围**:
  - 旧的创建产品模态框 showCreateProductModal (第14012-14015行)
  - 编辑产品模态框 editMarketplaceProduct (第14149-14152行)
  - 新的创建产品模态框 showCreateProductModalWithCategory (第14441-14444行)

**技术实现**:
- **前端更改**:
  - 修改 showCreateProductModal 函数：旧选项 → 新英文选项
  - 统一所有3处产品分类下拉选项
  - 保持value值一致：`ai_service`, `writing_template`, `review_template`, `other`

**部署信息**:
- **部署URL**: https://57ea3bdd.review-system.pages.dev
- **Git Commit**: 4705648
- **Build时间**: 2.04s

**用户体验提升**:
- 🎯 所有产品编辑界面选项统一
- 🌍 完全英文化，更专业国际化
- 💡 消除旧选项(AI Service, Template)的歧义

---

## 🎨 V7.1.0 更新 - 智能体分类下拉选项英文化 (2025-11-21)

**用户需求**: 修改智能体编辑界面的分类下拉选项为英文

**修改内容**:
- ✅ **分类下拉选项英文化**: 
  - "智能体 (AI Agent)" → "AI Agent"
  - "写作模板 (Writing Template)" → "Writing Template"
  - "复盘模板 (Review Template)" → "Review Template"
  - "其他产品 (Others)" → "Others"
- ✅ **默认值**: AI Agent (ai_service)
- ✅ **影响范围**:
  - 编辑产品模态框 (第14149-14152行)
  - 创建产品模态框 (第14441-14444行)

**技术实现**:
- **前端更改**:
  - 修改 editMarketplaceProduct 函数中的分类选项
  - 修改 showCreateProductModalWithCategory 函数中的分类选项
  - 保持原有value值不变，仅更改显示文本

**部署信息**:
- **部署URL**: https://be08f9ff.review-system.pages.dev
- **Git Commit**: e9c3c09
- **Build时间**: 2.25s

**用户体验提升**:
- 🎯 界面语言统一，更专业
- 🌍 英文选项更国际化
- 💡 简洁清晰的选项名称

---

## 🎨 V7.0.9 更新 - 菜单优化和界面清理 (2025-11-21)

**用户需求**: 优化管理面板菜单和主页界面

**修改内容**:
- ✅ **管理面板菜单优化**: "智能体" → "智能体设置"
  - 更明确的菜单名称，表明这是设置/配置页面
  - 与其他菜单命名风格保持一致
- ✅ **删除"AI智能写作助手" section**: 
  - 移除主页中的AI写作助手推广区域
  - 简化主页结构，减少视觉干扰
  - 功能仍可通过导航菜单访问

**技术实现**:
- **前端更改**:
  - 修改管理面板菜单标签 (Line 6408)
  - 删除AI写作助手CTA section (Lines 337-362, 共26行)
- **影响范围**:
  - 管理面板: 1个菜单标签更新
  - 主页: 删除1个完整的section

**部署信息**:
- **部署URL**: https://d4f36f6b.review-system.pages.dev
- **Git Commit**: d6b9642
- **Build时间**: 2.15s

**用户体验提升**:
- 🎯 菜单名称更清晰，用户能更快理解功能
- 📊 主页更简洁，减少信息过载
- 💡 专注于核心功能展示

---

## 🎨 V7.0.8 更新 - 写作模板表单优化 (2025-11-21)

**用户需求**: 优化"创建写作模板"表单界面

**修改内容**:
- ✅ **删除"英文名称"字段**: 简化表单,只保留中文模板名称
- ✅ **修改"分类"为"写作分类"**: 更明确的标签说明
- ✅ **新增"分类"字段**: 产品类型分类
  - AIAgent
  - Review Template
  - Writing Template (默认选中)
  - Others
- ✅ **调整表单布局**: 从3列改为2列网格布局,更清晰

**技术实现**:
- **前端更改**:
  - 删除英文名称输入框 (create 和 edit 模态框)
  - 删除英文说明输入框 (edit 模态框)
  - 新增 product_type 下拉选择器
  - "分类"改名为"写作分类"
  - 调整布局为2列: 产品分类 | 写作分类
  - 调整布局为2列: 图标 | 颜色
- **后端更改**:
  - POST /api/writing-templates: 支持 product_type 参数
  - PUT /api/writing-templates/:id: 支持 product_type 参数
  - 默认值: writing_template
- **数据库更改**:
  - Migration 0052: 添加 product_type 字段到 ai_writing_templates 表
  - CHECK 约束: ('ai_agent', 'review_template', 'writing_template', 'other')
  - 索引: idx_writing_templates_product_type

**部署信息**:
- **部署URL**: https://0c649313.review-system.pages.dev
- **Git Commit**: 4fb090b
- **迁移结果**: ✅ 3 queries executed, 11 rows written
- **Build时间**: 2.15s

**用户体验提升**:
- 🎯 表单更简洁,减少不必要的字段
- 📊 产品分类更清晰,便于管理
- 💡 默认选择"Writing Template",减少操作步骤

---

## 🎨 V7.0.7 更新 - 三级价格系统 + 产品分类重组 (2025-11-21)

**用户需求**: 
1. 为"复盘模板"和"写作模板"添加三级会员价格
2. 重组产品分类系统（review_template、writing_template、ai_service、other）
3. 移动菜单项位置（复盘模板从System移到Marketplace）

**实现的功能**:

**1. 复盘模板三级价格（templates表）**:
- ✅ 数据库: 添加 price_basic, price_premium, price_super 字段
- ✅ 后端API: templates CRUD接口全部支持三级价格
- ✅ 前端UI: 
  - 创建/编辑模板时输入三级价格（美元USD）
  - 列表显示: 普通(灰色), 高级(蓝色), 超级(紫色)
  - 价格格式化: $0.00 USD
- ✅ 数据迁移: Migration 0049成功应用（5 queries, 14 rows）

**2. 写作模板三级价格（ai_writing_templates表）**:
- ✅ 数据库: 添加 price_user, price_premium, price_super 字段
- ✅ 后端API: writing_templates CRUD接口全部支持三级价格
- ✅ 前端UI:
  - 创建/编辑模板时输入三级价格（美元USD）
  - 列表显示三级价格（不同颜色区分）
  - 价格格式化: $0.00 USD
- ✅ 数据迁移: Migration 0050成功应用（4 queries, 13 rows）

**3. 产品类型重组（marketplace_products表）**:
- ✅ 数据库: CHECK约束更新为 ('ai_service', 'writing_template', 'review_template', 'other')
- ✅ 数据迁移: 
  - 'template' → 'review_template'
  - 'book_template' → 'other'
  - 其他类型保持不变
- ✅ 迁移成功: Migration 0051成功应用（8 queries, 104 rows）

**4. 管理面板重组**:
- ✅ 商城管理（Marketplace）菜单:
  - 订阅管理
  - 智能体管理
  - **写作模板** (新增，调用loadWritingTemplates)
  - **复盘模板** (从System移动过来)
  - 其他产品管理
- ✅ AI设置（Agents）菜单:
  - **AI 写作设置** (保留，管理写作模板)
- ✅ 系统管理（System）菜单:
  - **复盘模板** (移除)

**5. 产品分类显示名称**:
- ✅ 智能体: AI Service / 智能体服务
- ✅ 写作模板: Writing Template / 写作模板
- ✅ 复盘模板: Review Template / 复盘模板
- ✅ 其他产品: Other / 其他

**技术实现**:
- **数据库迁移**:
  - 0049_add_template_tiered_pricing.sql: 复盘模板三级价格
  - 0050_add_writing_template_tiered_pricing.sql: 写作模板三级价格
  - 0051_update_product_type_constraint.sql: 产品类型约束更新 + 数据迁移
- **后端API**:
  - src/routes/templates.ts: 支持三级价格CRUD
  - src/routes/writing_templates.ts: 支持三级价格CRUD
- **前端UI**:
  - public/static/app.js: 
    - 管理面板菜单结构更新（Lines ~6548-6580）
    - 模板编辑表单更新（三级价格输入）
    - 模板列表显示更新（三级价格展示）
    - 写作模板集成（支持双上下文调用）

**部署信息**:
- **部署URL**: https://1d0ee485.review-system.pages.dev
- **Git Commit**: d0bd5a1 (feat: Add three-tier pricing system and reorganize product categories)
- **数据库迁移**: ✅ 所有3个迁移已应用到生产环境
- **Build时间**: 8.86s
- **状态**: ✅ 生产环境完全部署

**用户体验提升**:
- 💰 灵活的三级定价策略（普通/高级/超级会员）
- 📊 清晰的产品分类体系
- 🎯 直观的管理界面布局
- 💵 统一的美元定价（USD）

---

## 🎨 V7.0.6 更新 - 商城菜单顺序优化 (2025-11-21)

**用户需求**: 调整商城下拉菜单顺序

**修改内容**:
- ✅ 商城下拉菜单新顺序:
  1. **我的智能体** (常用功能，优先显示)
  2. **我的其他购买** (查看购买记录)
  3. **商城** (浏览和购买)

**用户体验优化**:
- 🎯 常用功能放在最前面
- 📱 更符合用户使用习惯
- 🔄 减少点击层级

**部署信息**:
- **部署URL**: https://8cefe59a.review-system.pages.dev
- **Git Commit**: 77f7a29
- **Build时间**: 2.28s

---

## 🎨 V7.0.5 更新 - UI优化 + 部署 (2025-11-21)

**用户需求**:
- 管理后台的"模板"标签改为"复盘模板"
- 部署所有修复到生产环境

**实施的更改**:
- ✅ 管理面板导航标签：从"模板管理"改为"复盘模板"
- ✅ 部署到Cloudflare Pages生产环境
- ✅ 包含V7.0.4所有修复（购物车认证、复盘模板整合、分类清晰化）
- ✅ 包含V7.0.4.1修复（购物车支持wt_前缀的复盘模板ID）

**部署信息**:
- **部署时间**: 2025-11-21
- **部署URL**: https://5598518b.review-system.pages.dev
- **Git Commit**: 7cdbe13
- **Build时间**: 2.19s
- **上传文件**: 14个文件 (1个新文件, 13个已存在)

**用户可见改进**:
- 🎯 管理后台命名更准确："复盘模板"而非"模板"
- 🛒 购物车完整支持复盘模板
- 🔐 未登录用户友好提示
- 📦 商城分类清晰（智能体/复盘模板/其他）

---

## 🛒 V7.0.4 更新 - MarketPlace商城修复 (2025-11-21)

**用户报告的问题** (截图反馈):

1. **点击"加入购物车"出错** - 500错误
2. **价格显示错误** - 显示$0
3. **分类不清晰** - 需要重新组织为：智能体、复盘模板、其他

**根本原因分析**:
- ❌ 购物车路由缺少认证中间件
- ❌ 前端未检查登录状态就调用购物车API
- ❌ 分类使用 `product_type` 和 `category` 字段不一致
- ❌ 没有整合 `templates` 表的付费模板
- ⚠️ 商品价格为0是数据问题（订阅制商品或未设置价格）

**实施的修复**:

**1. 购物车认证修复**:
```typescript
// 后端：添加认证中间件
app.use('/cart/*', authMiddleware);
app.use('/checkout', authMiddleware);

// 前端：添加登录检查
if (!currentUser) {
  showNotification('请先登录', 'error');
  showLogin();
  return;
}
```

**2. 复盘模板整合**:
```typescript
// 自动从 templates 表读取价格>0的模板
SELECT * FROM templates WHERE price > 0 AND is_active = 1
// 添加前缀 'wt_' 区分来源
{ id: 'wt_123', category: 'review_template', ... }
```

**3. 分类清晰化**:
- **智能体** (`ai_service`) - AI助手类产品 <i class="fas fa-robot"></i>
- **复盘模板** (`review_template`) - 价格>0的模板 <i class="fas fa-file-alt"></i>
- **其他** (`other`) - 其他商品 <i class="fas fa-box"></i>

**改进文件**:
- 更新: `src/routes/marketplace.ts` - 认证中间件 + 模板整合 (62行修改)
- 更新: `public/static/app.js` - 登录检查 + 分类更新 + ID类型修复 (6处修改)

**用户体验提升**:
- ✅ 未登录用户点击"加入购物车"显示友好提示
- ✅ 商城自动显示所有付费复盘模板
- ✅ 分类清晰：智能体、复盘模板、其他

**待处理事项**:
- ⚠️ **价格显示$0**: 数据库中商品价格为0（订阅制商品或未设置）
- ⚠️ **分类不匹配**: 数据库category字段需更新为 ai_service/review_template/other
- ⚠️ **复盘模板数据**: 当前所有templates价格都是0，更新价格后才会显示

**文档**:
- 📋 [完整修复报告](./FIX_MARKETPLACE_ISSUES_2025-11-21.md)

---

## 🔐 V7.0.3 更新 - 修复未登录用户访问错误 (2025-11-21)

**问题**: 未登录用户访问复盘详情时出现 JavaScript 错误

**错误信息**: `Cannot read properties of undefined (reading 'id')`

**根本原因**:
- ❌ 多个函数直接访问 `currentUser.id` 而未检查 `currentUser` 是否为 null
- ❌ 未登录用户访问页面时 `currentUser` 为 null
- ❌ 导致尝试读取 `null.id` 时抛出错误

**受影响的函数** (10个):
1. showReviewDetail (3处) - 查看复盘详情
2. showEditReview (1处) - 编辑复盘
3. showTeamDetail (1处) - 查看团队详情
4. loadKeywords (1处) - 加载关键词
5. handleAddKeyword (1处) - 添加关键词
6. handleEditKeyword (1处) - 编辑关键词
7. deleteKeyword (1处) - 删除关键词
8. toggleKeywordStatus (1处) - 切换关键词状态

**解决方案**:

**策略1**: 对查看类函数添加空值保护（允许未登录用户访问）
```javascript
// 修复前
const userAnswers = filterAnswersByPrivacy(q, allAnswers, currentUser.id, review.user_id);

// 修复后
const currentUserId = currentUser ? currentUser.id : null;
const userAnswers = filterAnswersByPrivacy(q, allAnswers, currentUserId, review.user_id);
```

**策略2**: 对需要认证的函数添加登录检查
```javascript
async function showEditReview(id) {
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  // ... 原有代码
}
```

**改进文件**:
- 更新: `public/static/app.js` - 修复 10 处 `currentUser` 访问

**用户体验提升**:
- ✅ 未登录用户可以正常查看公开复盘（不再抛出错误）
- ✅ 需要认证的功能显示友好的"请先登录"提示
- ✅ 避免 JavaScript 错误破坏用户体验

**文档**:
- 📋 [完整修复报告](./FIX_UNDEFINED_ID_ERROR_2025-11-21.md)

---

## 🔐 V7.0.2 更新 - 统一权限控制修复 (2025-11-21)

**问题**: marketplace 路由也出现 403 权限错误

**根本原因**:
- ❌ marketplace 使用自定义 `getUserFromToken` 函数
- ❌ 与 writing-templates 的认证机制不一致
- ❌ 导致未登录用户无法访问公开内容

**解决方案**:
- ✅ 移除自定义 `getUserFromToken` 函数
- ✅ 统一使用 authMiddleware 和 adminOnly 中间件
- ✅ 标准化所有路由的权限控制模式
- ✅ 确保公开 API 不需要认证

**改进文件**:
- 更新: `src/routes/marketplace.ts` - 移除 57 行，添加 20 行

**统一权限模式**:
| 路由 | GET (公开) | GET (管理员) | POST/PUT/DELETE |
|------|-----------|--------------|-----------------|
| `/api/marketplace/products` | ✅ 无需认证 | - | ❌ 需管理员 |
| `/api/marketplace/products/all` | - | ✅ 需管理员 | - |
| `/api/writing-templates` | ✅ 无需认证 | - | ❌ 需管理员 |

**Git Commit**: `6d86fa2` - fix: 修复 marketplace 403 权限错误

---

## 🔐 V7.0.1 更新 - 修复 403 权限错误 (2025-11-21)

**问题**: 更新写作模板时出现 403 Forbidden 错误

**根本原因**:
- ❌ writing-templates 路由缺少认证中间件
- ❌ checkAdminRole 无法获取用户信息
- ❌ 导致所有更新操作返回 403

**解决方案**:
- ✅ 为 GET 请求添加可选认证（支持公开访问）
- ✅ 为 POST/PUT/DELETE 强制要求管理员权限
- ✅ 使用 authMiddleware 和 adminOnly 中间件
- ✅ 移除重复的手动权限检查

**改进文件**:
- 更新: `src/routes/writing_templates.ts` - 添加认证和授权中间件

**权限矩阵**:
| 操作 | 认证 | 角色 |
|------|------|------|
| 查看模板 (GET) | 可选 | 无 |
| 创建/更新/删除 (POST/PUT/DELETE) | 必须 | admin |

**文档**:
- 📋 [完整修复报告](./FIX_403_WRITING_TEMPLATES_2025-11-21.md)

**Git Commit**: `e3dc43b` - fix: 修复 writing-templates 403 权限错误

---

## 🛡️ V7.0.0 更新 - 全局错误处理改进 (2025-11-21)

**问题**: 用户遇到 502 Bad Gateway 等技术性错误，不知道发生了什么。

**解决方案**: 
- ✅ **全局错误处理中间件** - 统一捕获和处理所有错误
- ✅ **友好的中文错误信息** - 从 "502 Bad Gateway" 到 "数据库操作失败，请稍后重试"
- ✅ **详细的错误日志** - 记录时间戳、用户、URL、堆栈跟踪等完整信息
- ✅ **统一错误响应格式** - 前端可以统一处理错误信息

**改进文件**:
- 新增: `src/middleware/errorHandler.ts` - 全局错误处理中间件
- 更新: `src/index.tsx` - 集成全局错误处理
- 更新: `src/routes/templates.ts` - 重构所有错误处理（10个catch块）

**用户体验提升**:
```
之前 ❌: Error: Internal server error (状态码: 502)
之后 ✅: 错误: 数据库操作失败，请稍后重试 (状态码: 500)
```

**文档**:
- 📋 [完整改进报告](./ERROR_HANDLING_IMPROVEMENT_2025-11-21.md)
- ⚡ [快速参考指南](./QUICK_FIX_ERROR_HANDLING.md)
- 📚 [502错误排查](./502_ERROR_GUIDE.md)

**Git Commit**: `9070215` - feat: 改进全局错误处理机制

---

## 🚀 曼哈顿计划 (Manhattan Project)

**Review System 商业化战略计划** - 3个月内实现年收入$449,724的Marketplace转型计划

📋 **完整计划**: [MANHATTAN_PROJECT.md](./MANHATTAN_PROJECT.md)  
⚡ **快速参考**: [MANHATTAN_PROJECT_QUICK_REF.md](./MANHATTAN_PROJECT_QUICK_REF.md)

**核心策略**:
- 🎯 **策略1**: 分层产品结构（免费模板 → 付费模板 → AI服务）
- 💳 **策略2**: 订阅制 + 信用点混合模式（4个订阅层级 + 灵活付费）
- 📊 **策略3**: AI使用量追踪 + 智能推荐系统

**收入目标**:
- 📈 月收入: $37,477
- 📈 年收入: $449,724
- 📈 付费转化率: 30%

**实施时间表**: 9-13周（3个月）
- ✅ Phase 1 (2-3周): **AI写作系统后端** (已完成 - 2025-11-19)
  - ✅ 数据库结构 (书籍/章节/小节/导出历史)
  - ✅ 3层订阅系统 (Free/$20/$120)
  - ✅ REST API (CRUD操作)
  - ✅ Gemini AI集成 (章节/小节/内容生成)
  - ✅ HTML导出功能
  - ⏳ 前端UI (待开发)
  - ⏳ 部署到测试环境 (待进行)
- ⏳ Phase 2 (3-4周): AI视频生成 + 富文本编辑器
- ⏳ Phase 3 (2-3周): 使用统计 + 优化
- ⏳ Phase 4 (2-3周): 企业功能 + Marketplace

---

## 🌟 项目概述

### 项目名称
**系统复盘平台** - Review System Platform

### 项目目标
- 帮助用户建立系统化的复盘习惯
- 通过"复盘灵魂9问"框架进行深度反思
- 支持个人复盘和团队协作复盘
- 提供完整的用户权限管理系统

### 核心功能
1. ✅ **营销主页（新增 V3）**
   - 精美的落地页设计
   - 学习资源库（10篇精选文章 + 10个视频教程）
   - 公司介绍和团队展示
   - 用户评价和社交媒体链接
   - 联系方式和服务条款
   - 完整的SEO优化结构

2. ✅ **用户认证系统**
   - **Google账号一键登录/注册（V3.3 完成配置 - V3.4）**
   - 传统邮箱密码注册和登录（V3.4 数据库修复）
   - 基于 JWT 的身份认证
   - 角色权限管理（管理员/高级用户/普通用户）

3. ✅ **复盘记录管理**
   - 创建、编辑、删除复盘记录
   - **模板系统（V4.0-V4.1.1, V6.7.0, V6.11.0）**：
     - 默认模板"灵魂9问"（10个问题）
     - "个人年复盘"模板（53个深度问题）
     - 两步创建流程（基本信息 → 填写问题）
     - **完整中英双语支持（V4.1.1）**
     - **问题属性增强（V6.7.0 新增）**：
       - 答案可见性：公开（所有人可见）/ 私人（仅回答者和创建者可见）
       - 是否必填：必填（不能为空）/ 可选（可以为空）
       - 支持创建更灵活的模板和复盘
     - **模板可见性控制（V6.11.0 新增）**：
       - 私人模板：仅创建者和管理员可见使用
       - 团队模板：团队成员、创建者和管理员可见使用
       - 公开模板：所有人可见使用（默认）
       - 支持创建专属的私人或团队模板
   - **复盘分类系统**：
     - 群体类型：个人/项目/团队
     - 时间类型：日/周/月/季/年复盘
   - **主人属性和访问控制（V4.3.0 新增）**：
     - **私有**：仅创建者可见和编辑
     - **团队**：团队成员可见；群体类型为"团队"时成员可协作
     - **公开**：所有人可见但仅创建者可编辑
     - 新增"公开的复盘"菜单展示所有公开复盘
   - 个人复盘和团队复盘
   - 复盘状态管理（草稿/已完成）
   - 复盘列表展示（带筛选和搜索）
   - 复盘详情查看
   - 协作者管理

4. ✅ **团队协作功能**（高级用户专属）
   - 创建和管理团队
   - **通过邮箱邀请成员（V5.19 增强）**：
     - ✅ 支持邀请已注册用户（原功能）
     - ✅ **支持邀请未注册用户（V5.19 新增）**
     - ✅ 发送精美的HTML邀请邮件
     - ✅ 邀请链接有效期30天
     - ✅ 受邀者可选择注册或登录
     - ✅ 登录/注册后自动加入团队
   - 团队成员管理
   - 共享复盘记录
   - 协作编辑权限控制
   - **团队申请系统（V4.2 新增）**：
     - 公开/私有团队设置
     - 用户可申请加入公开团队
     - 团队创建者审批申请（确认/拒绝）
     - 三个Tab界面：我的团队、公开团队、待审批
     - 实时显示待审批申请数量
   - **团队协作复盘（V3.9）**：
     - 每个问题显示所有成员的答案（并列显示）
     - 成员独立编辑自己的答案
     - 创建者可删除其他成员的答案
     - 显示成员完成进度（X/9题）
     - 支持手动刷新查看最新答案

5. ✅ **管理后台**（管理员专属）
   - 用户管理（增删查改）
   - 角色权限调整
   - **增强通知系统（新增）**：
     - 群发通知给所有用户
     - 通过邮箱地址发送通知
     - 通过复选框选择用户发送
   - 系统统计数据

6. ✅ **国际化支持**
   - **5种语言支持（V6.11.6 完善）**：中文、英语、法语、日语、西班牙语
   - **自由切换的下拉菜单（V5.24.0, V6.11.5更新）**：所有页面统一5语言下拉选择器
   - 完整的语言切换功能（1146个翻译键）
   - 本地化存储用户语言偏好
   - **模板内容国际化（V4.1.1）**：模板名称、描述、问题全部支持中英双语
   - **服务端语言偏好持久化（V4.2.8 新增）**：
     - 系统默认英文版
     - 用户选择语言后自动保存到服务器
     - 登录后自动应用用户偏好的语言
     - 支持Google OAuth登录的语言设置
   - **支持的语言**：
     - 🇨🇳 中文 (zh) - Chinese
     - 🇬🇧 English (en) - 英语  
     - 🇫🇷 Français (fr) - 法语
     - 🇯🇵 日本語 (ja) - Japanese
     - 🇪🇸 Español (es) - Spanish

7. ✅ **用户设置页面**（V4.2.8 新增）
   - 点击导航栏用户名进入设置页面
   - **账号设置**：
     - 修改用户名
     - 修改邮箱地址
     - 选择语言偏好（中文/English）
   - **密码管理**：
     - 在设置页面直接修改密码
     - 需要验证当前密码
   - 设置自动同步到服务器和本地存储

## 🔗 访问链接

### 生产环境 ✅
- **应用 URL**: https://review-system.pages.dev
- **最新部署 ID**: https://f1b38de7.review-system.pages.dev
- **诊断工具**: https://review-system.pages.dev/diagnostic.html （缓存问题诊断）
- **GitHub 仓库**: https://github.com/Alan16168/review-system
- **版本**: ✅ **V7.0.3 - MarketPlace Modal Fix + AI Books Auth (2025-11-21)**
- **Git Commit**: bba5267 (docs: Add MarketPlace modal fix documentation)
- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages/view/review-system
- **状态**: ✅ 已成功部署到生产环境（Published）
- **部署日期**: 2025-11-21
- **部署 URL**: https://f1b38de7.review-system.pages.dev
- **主站 URL**: https://review-system.pages.dev (将自动更新)
- **数据库迁移**: ✅ Migration 0047 已应用（添加 is_admin 字段到 users 表）
- **功能状态**: ✅ MarketPlace 完整功能 + AI写作系统完全可用
- **最新更新**: ✅ **V7.0.3 - MarketPlace Modal Fix + AI Books Auth**（2025-11-21）
  - ✅ **MarketPlace产品模态框修复**:
    - 提升模态框z-index到9999，解决被遮挡问题
    - 统一字段名称为product-type，修复创建和编辑不一致
    - 修正产品类型选项与数据库定义一致
    - 修复handleUpdateProduct函数读取正确字段
  - ✅ **AI写作授权完整修复**:
    - 为7个API调用添加Authorization headers
    - 统一token存储键名为authToken
    - 解决500/401授权错误
    - AI生成章节、小节、内容功能完全可用
  - ✅ **完整文档**:
    - MARKETPLACE_MODAL_FIX.md - 模态框修复详细说明
    - AI_BOOKS_AUTH_FIX.md - 授权修复完整文档
    - TOKEN_FIX.md - Token一致性修复
  - **部署 URL**: https://f1b38de7.review-system.pages.dev
  - **Git commits**: da1f903 (modal fix), 22dc5a7 (auth fix), 1fb068e (token fix)

- **上一版本**: ✅ **V7.0.2 - MarketPlace 用户前端页面**（2025-11-20）
  - ✅ **用户前端 MarketPlace 商城页面**:
    - 完整的商品展示网格（卡片式布局）
    - 分类筛选器（全部/AI 智能体/模板/其他）
    - 商品卡片展示：图标、名称、描述、价格
    - 原价/折扣价显示
    - 销量统计显示
    - "立即购买"按钮（功能待开发）
  - ✅ **UI/UX 设计**:
    - 渐变背景商品头部（indigo to purple）
    - 圆形图标容器
    - 分类标签徽章
    - 价格突出显示（大字体）
    - 折扣省钱提示（绿色）
    - 响应式网格布局（1/2/3列）
  - ✅ **交互功能**:
    - 分类筛选按钮（高亮活跃状态）
    - 悬停阴影效果
    - 自动加载商品数据
    - 空状态提示
    - 错误处理和友好提示
  - ✅ **导航集成**:
    - 顶部导航栏 "商城" 按钮可用
    - 移动端汉堡菜单中的商城按钮可用
    - 修复 `MarketplaceManager is not defined` 错误
  - **技术实现**:
    - 创建 `MarketplaceManager` 对象（类似 AIBooksManager）
    - `renderMarketplacePage()` - 渲染主页面
    - `loadProducts()` - 从 API 加载商品
    - `filterByCategory()` - 分类筛选
    - `renderProducts()` - 动态渲染商品网格
    - `purchaseProduct()` - 购买功能（占位）
  - **部署 URL**: https://44c78fda.review-system.pages.dev
  - **Git commit**: 330fe0a

- **上一版本**: ✅ **V7.0.1 - MarketPlace 管理界面 + 后端 API 修复**（2025-11-20）
  - ✅ **管理后台新增 "MarketPlace 管理" 标签页**:
    - 完整的产品列表视图（表格展示）
    - 产品分类标签（AI 智能体、模板、其他）
    - 产品状态显示（上架中/已下架）
    - 销量统计显示
  - ✅ **完整的 CRUD 操作**:
    - 添加产品：模态框表单，支持所有字段
    - 编辑产品：加载现有数据，支持修改
    - 上架/下架：一键切换产品状态
    - 删除产品：带确认提示的删除功能
  - ✅ **产品字段支持**:
    - 产品名称、描述（必填）
    - 分类选择（AI 智能体/模板/其他）
    - 价格设置（¥ CNY）
    - 原价设置（可选，用于显示折扣）
    - 功能菜单标识（用于解锁对应功能）
    - 上架状态（默认上架）
  - ✅ **后端 API 修复**:
    - 修复 `src/routes/ai_books.ts`: 将硬编码 user ID=1 改为查找第一个管理员
    - 修复 `src/routes/marketplace.ts`: 同样修改为查找管理员用户
    - 解决生产数据库最小用户 ID=3 导致的 500 错误
    - AI Books API 现在返回正常（虽然书籍列表为空）
    - MarketPlace API 正常返回 8 个产品数据
  - ✅ **UI/UX 优化**:
    - 产品卡片图标（根据分类显示不同图标）
    - 分类标签颜色（紫色/蓝色/灰色）
    - 价格显示（折扣价/原价）
    - 响应式表格设计
    - 空状态提示（暂无产品）
  - ✅ **国际化支持**:
    - 所有界面文字支持中文显示
    - 产品管理相关的所有文本
  - **技术改进**:
    - 动态表单验证
    - 安全的数据清理（escapeHtml）
    - 完整的错误处理
    - 友好的用户提示
  - **部署 URL**: https://d8dcce73.review-system.pages.dev
  - **Git commit**: 298fccc

- **上一版本**: ✅ **V6.12.0 - 模板价格系统 + 繁體中文支持**（2025-11-18）
  - ✅ **模板价格系统**：
    - 数据库：添加 price 字段（REAL 类型，默认 0.0，单位 USD）
    - 后端 API：templates 创建/编辑/查询接口支持 price 参数
    - 价格验证：确保价格为非负数
    - 前端 UI：
      - 创建模板：添加价格输入框（$符号前缀，USD后缀）
      - 编辑模板：显示并可修改价格
      - 模板列表：新增价格列，免费模板显示绿色"免费"标签
    - i18n 翻译：所有6种语言添加 templatePrice 和 free 翻译键
  - ✅ **繁體中文语言支持**：
    - 添加完整的繁體中文翻译（zh-TW）：~785 行翻译
    - 使用 opencc-js 自动转换简体中文到繁體中文（台湾标准）
    - 语言选择器：所有下拉菜单添加"繁體中文"选项（位于"简体中文"下方）
    - 语言代码：zh-TW（台湾旗帜图标 🇹🇼）
    - 支持范围：完整的 UI 翻译，包括所有功能模块
  - ✅ **多语言增强**：
    - 从5种语言扩展到6种语言（zh/zh-TW/en/fr/ja/es）
    - 所有语言选择器统一更新
    - 后端 getLanguage() 函数支持 zh-TW 识别
  - **技术实现**：
    - Migration: `migrations/0040_add_template_price.sql`
    - Backend: `src/routes/templates.ts` 所有 CRUD 端点更新
    - Frontend: `public/static/app.js` 模板表单和列表更新
    - i18n: `public/static/i18n.js` 添加 zh-TW 完整翻译
    - 转换工具: `convert_zh_tw.cjs` 使用 opencc-js 自动转换
  - **部署 URL**: 待部署到 https://review-system.pages.dev
  - **开发测试 URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev

- **上一版本**: ✅ **V6.11.9 - 修复所有语言页尾翻译（2025-11-18）**
- **Git Commit**: 5307204 (修复法语、日语、西班牙语页尾翻译)
- **Cloudflare Dashboard**: https://dash.cloudflare.com/pages/view/review-system
- **状态**: ✅ 已成功部署到生产环境（Published）
- **部署日期**: 2025-11-18
- **部署时间**: 最新部署 - V6.11.5（AI 查询优化）
- **数据库迁移**: ✅ Migration 0036 已完全应用（所有迁移均已同步）
- **功能状态**: ✅ 打印功能完整 + 打印权限过滤 + 打印动态格式化 + 私人答案过滤 + 必填字段验证 + AI 查询功能（多平台搜索）
- **最新更新**: ✅ **V6.11.9 - 修复所有语言页尾翻译**（2025-11-18）
  - ✅ **法语页尾翻译完整**：添加所有缺失的法语页尾翻译键
    - product → Produit（产品）
    - company → Entreprise（公司）
    - legal → Légal（法律）
    - features → Fonctionnalités（功能）
    - pricing → Tarification（定价）
    - aboutUs → À propos（关于我们）
    - testimonials → Témoignages（用户评价）
    - contact → Contact（联系我们）
    - termsOfService → Conditions d'utilisation（服务条款）
    - privacyPolicy → Politique de confidentialité（隐私政策）
    - footerDescription → 完整的法语描述
  - ✅ **日语页尾翻译更新**：更新所有日语页尾翻译
    - footerDescription → 完整的日语描述
    - legal → 法的情報（法律信息）
    - termsOfService → 利用規約（服务条款）
    - privacyPolicy → プライバシーポリシー（隐私政策）
    - allRightsReserved → 全著作権所有（版权所有）
    - backToHome → ホームに戻る（返回主页）
    - lastUpdated → 最終更新（最后更新）
  - ✅ **西班牙语页尾翻译更新**：更新所有西班牙语页尾翻译
    - footerDescription → 完整的西班牙语描述
    - termsOfService → Términos de servicio（服务条款）
    - privacyPolicy → Política de privacidad（隐私政策）
    - allRightsReserved → Todos los derechos reservados（版权所有）
    - backToHome → Volver al inicio（返回主页）
    - lastUpdated → Última actualización（最后更新）
  - ✅ **验证范围**：所有5种语言（中文、英文、法语、日语、西班牙语）页尾完整翻译
  - ✅ **用户反馈**：修复法语版本页尾英文字段显示问题
  - **部署 URL**: 待部署
  - **Git commit**: 5307204

- **上一版本**: ✅ **V6.11.5 - AI 查询优化（自动启动 + 多平台搜索）**（2025-11-18）
  - ✅ **移除"开始 AI 查询"按钮**：页面加载时自动启动查询
  - ✅ **中文多平台搜索**：使用百度、知乎、简书、CSDN、掘金、SegmentFault、博客园等7个平台
  - ✅ **其他语言使用 Google**：英语、日语、西班牙语环境使用 Google 搜索
  - ✅ **关键词清理**：自动移除数据库关键词中的 "site:" 前缀
  - ✅ **智能加载**：只在首次打开标签时查询，使用 dataset.loaded 标志
  - ✅ **UI 简化**：更小的标题区域，移除多余按钮
  - ✅ **语言感知**：根据当前语言自动选择搜索引擎
  - **技术实现**：
    - 前端：修改 showResourceTab() 添加自动查询逻辑
    - 后端：generateMockAIArticles() 支持多平台 URL 生成
    - 中文平台轮询：每个结果使用不同平台，提供多样性
    - Google 搜索：非中文环境统一使用 Google，确保全球可访问
  - **部署 URL**: https://2e89f583.review-system.pages.dev
  - **Git commit**: 897ac44

- **上一版本**: ✅ **V6.11.4 - AI 查询功能（Gemini 集成）**（2025-11-18）
  - ✅ **添加第三个标签 "AI 查询"**：在学习资源库的"视频教程"旁边新增 AI 查询选项
  - ✅ **Google Gemini API 集成**：使用 Gemini 智能搜索相关文章
  - ✅ **基于关键词查询**：从数据库获取所有文章关键词，用逗号连接后发送给 AI
  - ✅ **专业提示词**：
    - "请作为专业的复盘专家，为我查找10篇关于（关键词）的文章"
    - "列出文章名字、简介、链接方式"
    - 要求文章来自知乎、简书、CSDN、公众号等中文平台
    - 返回 JSON 格式数据
  - ✅ **前端 UI 设计**：
    - 紫色渐变背景卡片（from-purple-50 to-indigo-50）
    - 机器人图标（fa-robot）
    - "开始 AI 查询"按钮（紫色到靛蓝渐变）
    - 加载状态：旋转的机器人图标 + "AI 正在分析中..."
    - 结果展示：编号卡片布局，每篇文章包含标题、简介、链接
    - 显示使用的关键词标签
    - "重新查询"按钮
  - ✅ **Mock 数据回退**：
    - API 密钥未配置或 API 调用失败时，生成基于关键词的模拟文章
    - 使用 10 个主题（方法论、案例分析、工具模板等）与关键词组合
    - 文章链接使用百度搜索（与现有文章保持一致）
  - ✅ **国际化支持**：新增 5 个翻译键 × 4 种语言（中文、英语、日语、西班牙语）
    - aiQuery: 'AI 查询'
    - loadingAIResults: 'AI 正在分析中...'
    - aiQueryPlaceholder: 'AI 将基于关键词为您查找相关文章...'
    - startAIQuery: '开始 AI 查询'
    - aiQueryError: 'AI 查询失败，请稍后重试'
  - ✅ **后端 API 端点**：
    - GET /api/resources/ai-query
    - 查询数据库获取活跃的文章关键词
    - 构建专业提示词并调用 Gemini API
    - 解析 JSON 响应（支持 markdown 代码块和纯 JSON）
    - 返回最多 10 篇文章
    - 错误处理和 mock 回退
  - ✅ **技术亮点**：
    - Gemini Pro 模型集成
    - JSON 响应智能解析（支持多种格式）
    - 优雅的错误处理和用户反馈
    - 响应式卡片设计，移动端友好
    - 与现有文章系统风格统一
  - **部署 URL**: https://00c0e59d.review-system.pages.dev
  - **Git commit**: f8db5ff

- **上一版本**: ✅ **V6.11.3 - 中文文章链接优化（使用百度搜索）**（2025-11-18）
  - ✅ **替换所有中文平台链接为百度搜索**：解决用户反馈的"所有链接都打不开"的问题
    - **V6.11.2问题**：使用知乎、简书、CSDN等平台的搜索链接，但用户反馈全部打不开
    - **问题原因**：
      1. 这些平台的搜索功能可能需要登录
      2. 某些平台有反爬虫保护或访问限制
      3. 用户在不同网络环境下访问结果不一致
      4. 测试: `curl -I "https://www.zhihu.com/search?q=复盘"` 返回 HTTP 405错误
    - **最终解决方案**：
      1. **统一使用百度搜索**：所有中文文章链接改为 `https://www.baidu.com/s?wd=关键词`
      2. **批量替换**：使用sed命令批量替换5个平台的链接
      3. **优势明显**：
         - ✅ 无需登录即可访问
         - ✅ 访问稳定可靠
         - ✅ 聚合多个平台的搜索结果
         - ✅ 用户可自主选择想看的文章
         - ✅ 在中国大陆访问速度快
    - **替换详情**：
      - 知乎搜索 → 百度搜索 (12个链接)
      - 简书搜索 → 百度搜索 (10个链接)
      - CSDN搜索 → 百度搜索 (8个链接)
      - 36氪搜索 → 百度搜索 (4个链接)
      - 掘金搜索 → 百度搜索 (4个链接)
      - **共计**: 38个文章链接全部更新
    - **测试验证**：
      - ✅ 生产环境测试：https://22614b85.review-system.pages.dev
      - ✅ 所有文章链接格式：`https://www.baidu.com/s?wd=关键词`
      - ✅ URL编码正确：中文参数使用百分比编码
      - ✅ 点击链接直接打开百度搜索结果页
      - ✅ 无需登录，无访问限制
    - **Git commit**: 00d0a40

- **上一版本**: ✅ **V6.11.2 - 中文文章链接修复（尝试使用中文平台）**（2025-11-18）
  - ⚠️ **问题**：使用知乎、简书、CSDN等平台的搜索链接，但用户反馈全部打不开
  - ❌ **已废弃**：此版本的方案不可行，已在V6.11.3中改用百度搜索
  - **Git commit**: 37c670c

- **上一版本**: ✅ **V6.11.1 - 关键词管理系统修复**（2025-11-18）
  - ✅ **视频关键词更新功能修复**：修复点击"更新视频"按钮后不使用最新数据库关键词的问题
    - **问题原因**：
      1. 后端API响应缺少 `language` 字段，导致前端显示 `language: undefined`
      2. `mock_fallback` 分支使用默认数据而不查询数据库关键词
      3. YouTube API 配置后返回0结果时进入 fallback 但不使用关键词
    - **解决方案**：
      1. 为所有API响应添加 `language` 字段（mock_with_keywords、mock_fallback、error_fallback）
      2. 修复 `mock_fallback` 分支以查询数据库关键词并生成基于关键词的内容
      3. 文章和视频端点均修复，确保关键词功能完整
    - **测试验证**：
      - ✅ 中文视频关键词：3个关键词 → 9个视频（3×3）
      - ✅ language 字段正确返回："zh"
      - ✅ 控制台日志："API fallback - using keywords: ..."
      - ✅ 用户可实时添加/编辑/删除关键词，更新后立即生效
    - **Git commit**: a635a00

- **上一版本**: ✅ **V6.10.0 - 真正的移动端汉堡菜单**（2025-11-17）
  - ✅ **实现完整的汉堡菜单**：真正的移动端导航体验
    - **桌面端**：保持原有的顶部导航栏（hidden md:flex）
    - **移动端**：显示汉堡菜单按钮（md:hidden）
    - **菜单结构**：
      - 右侧滑入式菜单（从右向左滑动）
      - 80%屏幕宽度，最大320px
      - 半透明黑色遮罩层
      - 平滑的300ms过渡动画
    - **菜单内容**：
      - 已登录用户：显示用户头像、用户名、角色
      - 导航项：Dashboard、我的复盘、公开复盘、团队、管理后台（根据权限）、购物车、用户设置
      - 未登录用户：资源、关于我们、用户评价、联系我们
      - 底部：登录/注册按钮（未登录）或退出登录（已登录）
      - 语言切换器：网格布局，4个语言选项
    - **交互功能**：
      - 点击汉堡按钮打开菜单
      - 点击×关闭按钮关闭菜单
      - 点击遮罩层关闭菜单
      - 点击任意菜单项后自动关闭
      - 菜单打开时禁止页面滚动
  - ✅ **优化Hero区域移动端布局**：
    - 标题字号响应式：3xl (mobile) → 4xl (sm) → 5xl (md) → 6xl (lg)
    - 副标题字号：base → lg → xl
    - 内容居中对齐（移动端）→ 左对齐（桌面端）
    - 按钮全宽（移动端）→ 自动宽度（桌面端）
    - 按钮垂直排列（移动端）→ 水平排列（桌面端）
    - Carousel高度：h-64 (mobile) → h-80 (sm) → h-96 (md+)
    - 间距优化：py-12 (mobile) → py-20 (desktop)
  - ✅ **Logo优化**：
    - 桌面端：显示完整 "系统复盘平台"
    - 移动端：显示简短 "Review System"
  - ✅ **JavaScript函数**：
    - `toggleMobileMenu()`: 切换菜单开关
    - `openMobileMenu()`: 打开菜单（带动画）
    - `closeMobileMenu()`: 关闭菜单（带动画）
    - `updateMobileCartCount()`: 同步购物车数量显示
  - **结果**：移动端现在拥有真正的汉堡菜单，体验类似原生APP
  - **备份**：V6.9.1版本已备份为 `v6.9.1-backup` 标签

- **上一版本**: ✅ **V6.9.1 - 修复英文版本国际化翻译**（2025-11-17）
  - ✅ **修复i18n Bug**：英文版本中用户评价区域显示日文的问题
    - **问题位置**：`public/static/i18n.js` 英文翻译第1227-1236行
    - **问题内容**：
      - `userTestimonials`: 'メッセージをお寄せください' （日文）
      - `welcomeToLeaveMessage`: 'メッセージをお寄せください' （日文）
      - 其他8个字段也使用了日文而非英文
    - **修复内容**：将所有日文翻译改为正确的英文
      - `userTestimonials`: 'User Testimonials'
      - `welcomeToLeaveMessage`: 'Welcome to Leave a Message'
      - `leaveYourMessage`: 'Leave Your Message'
      - `submitMessage`: 'Submit Message'
      - `yourName`: 'Your Name'
      - `yourRole`: 'Your Role'
      - `yourMessage`: 'Your Message'
      - `yourRating`: 'Your Rating'
      - `roleExample`: 'e.g., Product Manager, Entrepreneur, Student'
    - **结果**：英文版本现在显示正确的英文翻译
  - **文件修改**：
    - `public/static/i18n.js`：修复10个翻译条目
    - `package.json`：版本号 6.9.0 → 6.9.1
    - `README.md`：更新版本说明

- **上一版本**: ✅ **V6.9.0 - 全面移动端响应式界面**（2025-11-17）
  - ✅ **移动端优化**：全面的手机和平板自适应设计
    - **汉堡菜单**：移动端导航菜单（滑入式侧边栏）
    - **触摸友好**：所有按钮和输入框最小44px高度，符合触摸操作标准
    - **响应式布局**：
      - 自动单列布局（在768px以下）
      - 减少间距和内边距优化小屏显示
      - 全宽容器和卡片设计
    - **表格优化**：移动端表格转换为卡片视图
      - 桌面端显示传统表格
      - 移动端显示卡片样式，信息清晰易读
      - 隐藏次要列避免拥挤
    - **模态框适配**：95%宽度，最大90vh高度，滚动优化
    - **表单优化**：
      - 单列表单布局
      - 输入框字体16px防止iOS自动缩放
      - 优化表单间距和标签大小
    - **排版优化**：
      - 标题字号自动缩小（h1: 1.875rem, h2: 1.5rem）
      - 段落字号0.875rem
      - 打印预览字号缩小
    - **导航标签**：水平滚动，隐藏滚动条
    - **图片响应式**：自动最大100%宽度
    - **其他组件**：
      - Dashboard统计卡片优化
      - 团队成员卡片缩小头像
      - 通知项字号缩小
      - 搜索和过滤栏垂直布局
      - 分页按钮字号优化
      - 下拉菜单固定定位
      - Toast通知全宽显示
    - **文件修改**：
      - `public/static/styles.css`：新增400+行移动端响应式CSS
      - 包含所有主要组件的移动端优化
      - 使用media query @media (max-width: 768px)
    - **兼容性**：保持桌面端原有样式不变，仅在移动端生效
  - **结果**：系统现在在手机、平板、桌面设备上都能完美显示和操作

- **上一版本**: ✅ **V6.8.0 - 修复打印功能答案显示**（2025-11-17）
  - ✅ **修复关键Bug**：打印时答案显示"未填写"的问题
    - **问题**：打印功能中 `currentUser` 全局变量为 `null`
    - **原因**：代码依赖 `window.currentUser` 但在某些情况下该变量未初始化
    - **解决方案**：
      1. 优先从全局变量 `currentUser` 获取用户 ID
      2. 如果失败，从 `localStorage` 读取用户信息
      3. 如果仍然失败，假设当前用户是复盘创建者（兜底方案）
    - **结果**：打印功能现在能正确获取用户 ID，答案正常显示
  - ✅ **V6.7.9 优化**：修复creator_id字段错误
  - ✅ **修复关键Bug**：修正 review 对象的创建者 ID 字段名错误
    - **问题**：代码中使用了不存在的 `review.creator_id` 字段
    - **正确**：应该使用 `review.user_id` 字段
    - **影响范围**：修复了3处错误（查看、编辑、打印功能）
    - **结果**：现在创建者能正确看到所有私人问题的答案，其他用户只能看到自己的答案
  - ✅ **V6.7.8 优化**：调整私人问题权限逻辑
    - **复盘创建者**：可以看到所有用户的答案（便于管理和查看）
    - **其他用户**：只能看到自己的答案（保护隐私）
    - **公开问题**：所有用户都能看到所有答案（不变）
  - ✅ **V6.7.7 修复**：解决私人问题答案在打印中不显示的问题
    - **问题原因**：`filterAnswersByPrivacy()` 函数中的逻辑错误
    - **修复内容**：正确比较 `answer.user_id` 与 `reviewCreatorId`
  - ✅ **V6.7.6 修复**：解决打印预览中答案不显示的问题
    - **问题原因**：API 返回字符串键 `"1"`, `"2"` 但代码使用数字键查找
    - **解决方案**：使用 `String(question.question_number)` 确保键类型匹配
  - ✅ **打印权限过滤**：打印服务检查答案的 `owner` 属性
    - 公开问题（owner='public'）：显示所有人的答案
    - 私人问题（owner='private'）：仅显示当前用户和创建者的答案
    - 使用 `filterAnswersByPrivacy()` 函数确保权限正确性
  - ✅ **动态答案格式化**：根据实际内容长度显示答案
    - 移除固定高度限制，使用动态内容自适应
    - 添加 `word-wrap` 和 `overflow-wrap` 处理长文本
    - 添加 `page-break-inside: avoid` 避免问题被分页
    - 答案不再预留不必要的空白空间
  - ✨ **用户体验**：清晰区分必填和可选问题，避免误保存空答案
- **更新内容**:
  - ✨ **V6.7.0 - 问题属性增强**（功能更新 - 2025-11-16）：
    - **新增功能**: 为模板问题增加两个新属性
    - **答案可见性 (owner)**:
      - ✅ **公开 (public)**: 默认值，所有有权查看该复盘的人都可以看到此答案
      - ✅ **私人 (private)**: 只有回答问题的人和复盘创建者可以看到此答案
      - 适用场景：个人反思、敏感信息、私密内容
    - **是否必填 (required)**:
      - ✅ **可选 (no)**: 默认值，答案可以为空
      - ✅ **必填 (yes)**: 答案不能为空，提交时必须填写
      - 适用场景：核心问题、关键信息收集
    - **数据库更新**:
      - ✅ 迁移文件: `migrations/0035_add_owner_and_required_fields.sql`
      - ✅ 字段类型: TEXT with CHECK constraints
      - ✅ 索引: 为两个字段建立索引提升查询性能
      - ✅ 向后兼容: 所有现有问题自动设为 owner='public', required='no'
    - **后端API更新**:
      - ✅ `src/routes/templates.ts`: 支持创建、编辑、查询带新字段的问题
      - ✅ `src/routes/reviews.ts`: 查询复盘时返回问题的新属性
      - ✅ 完整的参数验证和默认值处理
    - **国际化支持**:
      - ✅ 中英文翻译: answerOwner, answerRequired 等8个新翻译条目
      - ✅ 提示文本: 详细说明每个选项的含义和用途
    - **文档**:
      - ✅ `CHANGELOG_OWNER_REQUIRED.md`: 详细更改日志
      - ✅ `TODO_FRONTEND_IMPLEMENTATION.md`: 前端实现指南（包含代码示例）
      - ✅ `SUMMARY.md`: 功能总结和业务逻辑说明
      - ✅ `VERIFICATION_REPORT.md`: 验证报告
    - **待实现**:
      - ⏳ 模板编辑UI: 添加 owner 和 required 选择器
      - ⏳ 复盘编辑: 必填验证和实时提示
      - ⏳ 复盘查看: 根据权限过滤私人答案
      - ⏳ 复盘打印: 权限过滤功能
    - **Git commits**: 7c04449, 3ce26c0, 88660a0, ef9ea27
  - 🐛 **V6.6.6 - 修复注册后URL参数残留问题**（用户体验修复 - 2025-11-16）：
    - **用户反馈**: "团队问题解决了，注册后第一次login会出现介绍人发过来的链接界面还是会出现"
    - **问题分析**:
      - **根本原因**: 用户通过邀请链接 `/?invite=token` 注册成功后，虽然清除了 `sessionStorage` 中的 `referral_token`
      - **遗留问题**: URL中仍然保留着 `?invite=token` 参数
      - **触发条件**: 当用户完成注册后第一次登录时，`checkAuth()` 检测到URL中的 `invite` 参数，再次显示邀请落地页
      - 即使登录成功清除了 `sessionStorage`，但URL参数仍然存在，导致页面刷新或重新访问时会再次显示邀请页面
    - **解决方案**:
      - ✅ **清除URL参数**: 在注册成功后调用 `window.history.replaceState({}, document.title, window.location.pathname)`
      - ✅ **保持URL简洁**: 将 `/?invite=token` 替换为 `/`，移除所有查询参数
      - ✅ **防止重复显示**: 确保注册后的登录流程不会再次触发邀请页面
      - ✅ **时机正确**: 在清除 `sessionStorage` 后、显示登录页面前执行URL清理
    - **修复代码**:
      ```javascript
      // 注册成功后
      sessionStorage.removeItem('referral_token');
      // 清除URL参数，防止再次显示邀请页面
      window.history.replaceState({}, document.title, window.location.pathname);
      showNotification(i18n.t('registerSuccess'), 'success');
      setTimeout(() => showLogin(), 1500);
      ```
    - **修复文件**:
      - `public/static/app.js`（修复 handleReferralRegister 函数，第10143-10155行）
    - **测试验证**:
      - ✅ 通过邀请链接 `/?invite=xxx` 访问
      - ✅ 点击"注册"按钮注册新账号
      - ✅ 注册成功后URL变为 `/`（无参数）
      - ✅ 登录后直接进入Dashboard，不再显示邀请页面
      - ✅ 刷新页面也不会显示邀请页面
    - **修复效果**: ✅ 用户通过邀请链接注册后，首次登录直接进入Dashboard，完全解决URL参数残留问题
    - **部署URL**: https://9ced8442.review-system.pages.dev
    - **Git commit**: 2be7465
  - 🐛 **V6.6.5 - 修复公开复盘团队权限**（权限控制修复 - 2025-11-16）：
    - **用户需求**: "请修复'公开复盘'的列表中，如果是'团队'属性的复盘，必须是'团队'成员才可以看到"
    - **问题分析**:
      - **根本原因**: `/api/reviews/public` 端点虽然检查了用户是否是团队成员，但只是将 `is_team_member` 标志添加到返回结果中
      - 未根据此标志过滤结果，导致所有 `owner_type='team'` 的复盘对所有用户可见
      - 违反了团队复盘的访问控制规则
    - **解决方案**:
      - ✅ **过滤团队复盘**: 在返回结果前，过滤掉用户不是成员的团队复盘
      - ✅ **保留公开复盘**: `owner_type='public'` 的复盘对所有认证用户可见
      - ✅ **团队成员检查**: 对于 `owner_type='team'` 的复盘，只有团队成员才能看到
      - ✅ **移除空结果**: 使用 `filter(r => r !== null)` 移除被过滤的复盘
    - **修复逻辑**:
      ```typescript
      // 旧逻辑：返回所有 owner_type IN ('public', 'team') 的复盘
      // 新逻辑：
      if (review.owner_type === 'team' && review.team_id) {
        // 检查团队成员资格
        const memberCheck = await c.env.DB.prepare(...);
        if (memberCheck) {
          return review; // 是成员，显示
        } else {
          return null;   // 不是成员，过滤掉
        }
      } else {
        // owner_type='public'，所有人可见
        return review;
      }
      ```
    - **修复文件**:
      - `src/routes/reviews.ts`（修复 `/public` 端点，第21-68行）
    - **测试验证**:
      - ✅ 用户A创建团队复盘（owner_type='team'）
      - ✅ 用户B（非团队成员）访问"公开复盘" → 看不到该复盘
      - ✅ 用户C（团队成员）访问"公开复盘" → 可以看到该复盘
      - ✅ 所有用户都能看到 owner_type='public' 的复盘
    - **修复效果**: ✅ 团队复盘现在正确限制为仅团队成员可见
    - **部署URL**: https://6b0f5373.review-system.pages.dev
    - **Git commit**: c18a0c8
  - 🐛 **V6.6.4 - 修复注册/登录后重定向问题**（用户体验修复 - 2025-11-16）：
    - **用户反馈问题**: "成功了，当客户新注册和login后出现上传图片的界面，需要点击login才进入正常界面"
    - **问题分析**:
      - **根本原因1**: 用户通过邀请链接注册成功后，`handleReferralRegister()` 调用 `showLogin()` 进入登录页
      - **根本原因2**: 用户登录后，`handleLogin()` 检测到 `sessionStorage` 中有 `referral_token`（第10114行存储）
      - **根本原因3**: 登录逻辑重定向回邀请页面：`window.location.href = /?invite=${referralToken}`（第1199行）
      - **根本原因4**: 页面重新加载后，`checkAuth()` 检测到URL中的 `inviteToken`，再次调用 `showInvitationLandingPage()`
      - 导致用户看到邀请落地页（显示"复盘内容预览"、"立即加入"、"注册"、"登录"按钮），需要再次点击"登录"才能进入正常界面
    - **解决方案**:
      - ✅ **清除referral_token**: 登录成功后立即调用 `sessionStorage.removeItem('referral_token')` 清除令牌
      - ✅ **直接进入Dashboard**: 改为调用 `showDashboard()` 而非重定向到邀请页面
      - ✅ **保留成功提示**: 显示"登录成功"通知后，1秒后自动进入Dashboard
      - ✅ **保持注册流程一致**: 注册成功后也清除令牌，显示登录页面供用户登录
    - **修复文件**:
      - `public/static/app.js`（修复 handleLogin 函数中的重定向逻辑，第1192-1203行）
    - **测试验证**:
      - ✅ 通过邀请链接注册 → 登录 → 直接进入Dashboard（无需二次登录）
      - ✅ 通过邀请链接注册 → 登录 → 看到"登录成功"提示 → 自动跳转Dashboard
      - ✅ 不再显示邀请落地页（"复盘内容预览"界面）
      - ✅ 用户体验流畅，无需重复点击登录按钮
    - **修复效果**: ✅ 用户通过邀请链接注册和登录后，直接进入正常界面，无需二次点击登录
    - **部署URL**: https://6b0f5373.review-system.pages.dev (合并到V6.6.5一起部署)
    - **Git commit**: 2dfbdd7 → b6c47bc → c18a0c8
  - 🐛 **V6.6.3 - 修复管理界面介绍人显示**（UI显示修复 - 2025-11-16）：
    - **用户反馈问题**: 编辑用户界面中"介绍人ID"字段显示错误，仍然显示 `dengalan@gmail.com` 而非实际介绍人
    - **问题分析**:
      - **根本原因1**: `/api/admin/users` 端点返回的用户对象**未包含 `referred_by` 字段**
      - **根本原因2**: 前端 `showEditUserModal` 函数中有硬编码默认值 `'dengalan@gmail.com'`
      - **根本原因3**: 当 `allUsers` 数组中找不到介绍人时，直接使用默认值而不是显示实际信息
    - **解决方案**:
      - ✅ **后端修复**: 在 `src/routes/admin.ts` 的用户列表 API 中添加 `referred_by` 和 `subscription_tier` 字段
      - ✅ **前端修复1**: 移除 `'dengalan@gmail.com'` 硬编码默认值
      - ✅ **前端修复2**: 无介绍人时显示"无"而非错误的默认值
      - ✅ **前端修复3**: 介绍人在 `allUsers` 中找不到时显示 `User ID: X`
    - **修复文件**:
      - `src/routes/admin.ts`（添加 referred_by 字段到 API 响应）
      - `public/static/app.js`（修复 showEditUserModal 函数逻辑）
    - **测试验证**:
      - ✅ 有介绍人的用户 → 显示介绍人邮箱（如 `123@123.com`）
      - ✅ 无介绍人的用户 → 显示"无"
      - ✅ 介绍人不在列表中 → 显示 `User ID: X`
    - **修复效果**: ✅ 管理界面现在正确显示用户的实际介绍人信息
    - **部署URL**: https://32d6a09a.review-system.pages.dev
    - **Git commit**: ac615ea
  - 🐛 **V6.6.2 - 修复介绍人ID传递问题**（关键Bug修复 - 2025-11-16）：
    - **用户反馈问题**: "介绍人ID不能正确传递到用户数据库，例如这个客户的介绍人应该是123@123.com，现在成了默认的dengalan@gmail.com"
    - **问题分析**:
      - **根本原因1 - 时区比较错误**: `auth.ts` 中验证邀请令牌时使用 `new Date()` 比较导致时区转换问题
      - **根本原因2 - 外键约束错误**: 在创建用户之前就尝试更新 `invitations.used_by_user_id = 0`，违反外键约束
      - **根本原因3 - 默认介绍人错误**: 当令牌验证失败时，强制设置 `referrerId = 4`（硬编码默认值）
      - 导致通过邀请链接注册的用户 `referred_by` 字段被设置为默认值而非实际介绍人
    - **解决方案**:
      - ✅ **修复时区比较**: 使用ISO字符串直接比较 (`nowUTC < expiresAtUTC`) 而非 Date 对象
      - ✅ **调整更新顺序**: 先验证令牌 → 创建用户 → 更新邀请记录（使用真实 user_id）
      - ✅ **移除硬编码默认值**: 删除 `referrerId = 4` 默认赋值，没有有效令牌时 `referred_by` 保持 NULL
      - ✅ **安全的数据库操作**: 只有验证成功的令牌才更新邀请状态
    - **修复文件**:
      - `src/routes/auth.ts`（注册流程中的介绍人逻辑）
    - **测试验证**:
      - ✅ 通过有效邀请令牌注册 → `referred_by` 正确设置为介绍人 ID
      - ✅ 不带令牌注册 → `referred_by` 为 NULL（无默认值）
      - ✅ 过期令牌注册 → `referred_by` 为 NULL，显示清晰的日志
      - ✅ 邀请记录正确标记为已使用 (`used_at`, `used_by_user_id`)
    - **修复效果**: ✅ 用户通过邀请链接注册时，介绍人ID现在正确传递到数据库
    - **Git commit**: 333280b
  - 🐛 **V6.6.1 - 修复邀请验证功能**（关键Bug修复 - 2025-11-16）：
    - **用户反馈问题**: "生成的邀请链接，马上使用也会说'邀请无效或过期'"
    - **问题分析**:
      - **根本原因**: 邀请验证时查询答案数据使用了错误的表结构
      - `review_answers`表已重构为使用`answer_set_id`而非直接`review_id`
      - SQL查询：`SELECT ra.* FROM review_answers ra WHERE ra.review_id = ?`
      - 错误：`D1_ERROR: no such column: ra.review_id`
    - **解决方案**:
      - ✅ 更新邀请验证SQL查询使用正确的表关联
      - ✅ 通过`review_answer_sets`表JOIN查询答案
      - ✅ 新查询：`SELECT ra.* FROM review_answer_sets ras INNER JOIN review_answers ra ON ras.id = ra.answer_set_id WHERE ras.review_id = ?`
      - ✅ 优化时间比较逻辑：使用ISO字符串直接比较避免时区问题
    - **修复文件**:
      - `src/routes/invitations.ts`（邀请验证查询逻辑）
      - `migrations/0032_remove_template_chinese_fields_production.sql`（修复语法错误）
    - **测试验证**:
      - ✅ 创建邀请链接成功
      - ✅ 立即使用邀请链接验证成功
      - ✅ 返回完整的复盘信息和答案数据
      - ✅ 不再显示"邀请无效或过期"错误
    - **修复效果**: ✅ 邀请功能完全正常，用户生成的邀请链接可以立即使用
    - **部署URL**: https://afd1a4dc.review-system.pages.dev
    - **Git commit**: 45be2da
  - 🔧 **V6.0.1-Phase2.4-RemoveChineseFields - 模板系统简化为英文单字段**（数据库重构 - 2025-11-15）：
    - **重构目标**: 简化模板和问题的数据结构，从中英双字段改为英文单字段
    - **数据库迁移**:
      - ✅ **本地数据库**: Migration 0032（重建表结构）
        - 删除 `name`/`name_en`、`description`/`description_en`、`question_text`/`question_text_en` 双字段
        - 使用单一字段 `name`、`description`、`question_text` 存储英文内容
        - 通过创建备份表 → 删除旧表 → 创建新表 → 迁移数据的方式完成
      - ✅ **生产数据库**: Migration 0033（直接执行SQL）
        - 生产环境数据已经是英文，直接删除 `_en` 后缀列
        - 使用 `PRAGMA foreign_keys = OFF/ON` 处理外键约束
        - 成功执行12个查询，读取1569行，写入274行
    - **前端UI改进**:
      - ✅ 简化模板创建/编辑表单：从4个字段减少到2个字段
        - 移除"中文名称"和"英文名称"分离
        - 统一为"模板名称"（name）
        - 移除"中文描述"和"英文描述"分离
        - 统一为"模板描述"（description）
      - ✅ 简化问题添加/编辑表单：
        - 移除 `question-text-cn-container` 和 `question-text-en-container` 双容器
        - 统一为 `question-text-container` 单容器
        - 更新 `handleQuestionTypeChange()` 逻辑适应单字段
      - ✅ 更新 `collectQuestionFormData()` 函数：
        - 移除 `question_text_en` 字段收集
        - time_with_text 类型使用 `question_text` 作为 `datetime_title`
    - **后端API简化** (`src/routes/templates.ts`):
      - ✅ 移除所有 `name_en`、`description_en`、`question_text_en` 字段引用
      - ✅ 简化SQL查询，移除 `CASE WHEN ? = 'en'` 语言判断逻辑
      - ✅ 更新CREATE/UPDATE操作，只处理单一字段
      - ✅ 保持向后兼容：前端其他模块的 fallback 逻辑仍然存在（如 `q.question_text_en || q.question_text`）
    - **技术优势**:
      - ✅ **简化数据模型**: 减少50%的字段数量
      - ✅ **减少维护成本**: 无需管理中英文两套内容
      - ✅ **提高性能**: 查询更简单，数据量更小
      - ✅ **保持国际化**: UI层面通过i18n.js继续支持4种语言
    - **Git commit**: 834a9d1 (包含 created_by 字段修复)
    - **部署状态**: ✅ 已部署到生产环境（修复版本）
    - **部署URL**: https://c1f18906.review-system.pages.dev
    - **主域名**: https://review-system.pages.dev (自动同步)
    - **修复内容**: 
      - ⚠️ **发现问题**: Migration 0032/0033 意外删除了 `created_by` 字段
      - ✅ **快速修复**: Migration 0034 添加 `created_by` 字段
      - ✅ **数据恢复**: 所有现有模板设置为 admin 用户所有（user_id = 1）
      - ✅ **功能恢复**: `/api/templates/admin/all` 端点现在正常工作
  - 🔄 **系统回滚到 V6.0.0-Phase2.3-AutoSave-Fix**（重要回滚 - 2025-11-15）：
    - **回滚原因**: 从简化版本（v5.99）回滚到功能完整的稳定版本
    - **回滚目标**: commit dfa973a - "Fix: Auto-save persistence - auto-create first answer set when needed"
    - **恢复的核心功能**:
      - ✅ **完整的答案集合系统（Answer Sets）**:
        - 支持为每个复盘创建多个答案组
        - 答案组导航功能（上一组/下一组按钮）
        - "创建新答案组"按钮
        - 统一的答案集合管理
      - ✅ **自动保存持久化**:
        - 首次编辑时自动创建答案集（无需手动点击）
        - 所有问题类型（文字、时间、单选、多选）支持自动保存
        - 数据持久化到数据库，刷新页面不丢失
      - ✅ **完整的问题类型支持**:
        - 文字型问题（text）
        - 时间+文字型问题（time_with_text）
        - 单选题（single_choice）
        - 多选题（multiple_choice）
      - ✅ **数据库完整架构**:
        - `review_answer_sets` 表：管理答案集合元数据
        - `review_answers` 表：存储具体答案（关联到answer_set_id）
        - Migration 0030：时间型问题和答案集合系统
    - **技术细节**:
      - 创建 `createFirstAnswerSetIfNeeded()` 辅助函数
      - 修改所有自动保存函数，自动创建答案集
      - 保持数据库Migration 0030不变（已在生产环境）
    - **用户体验**:
      - ✅ 支持多个答案组，可以记录不同时间点的答案
      - ✅ 答案自动保存，无需担心数据丢失
      - ✅ 完整的答案管理功能
    - **部署信息**:
      - 生产URL: https://review-system.pages.dev
      - 部署ID: https://cf36f475.review-system.pages.dev
      - Git commit: dfa973a
      - 强制推送到GitHub: `git push -f origin main`
  - 🎉 **V6.0.0-Phase2.1 - 时间型问题管理后台**（新功能 - 2025-11-13）：
    - **功能概述**: 管理后台完整支持创建和编辑 time_with_text 类型问题
    - **核心实现**:
      - ✅ **问题类型选择器**: 新增第4个选项"时间+文字型"
      - ✅ **时间型配置UI**: 包含3个字段：
        - 默认时间（datetime-local，可选）
        - 时间标题（text，必填，最多12字符）
        - 答案最大长度（number，50-500，默认200）
      - ✅ **动态显示逻辑**: 选择时间型后显示专用配置区域
      - ✅ **数据验证**: 
        - 时间标题必填且不超过12字符
        - 答案长度范围50-500
      - ✅ **国际化支持**: 新增9个翻译键 × 4语言 = 36个翻译
    - **技术实现**:
      - 修改 `handleQuestionTypeChange()` 函数支持时间型
      - 修改 `collectQuestionFormData()` 收集和验证时间型数据
      - 数据结构：`{datetime_value, datetime_title, datetime_answer_max_length}`
    - **翻译键**:
      - questionTypeTimeWithText: '时间+文字型' / 'Time + Text'
      - timeTypeDescription: 描述时间型问题的组成
      - defaultDatetime/datetimeTitle/answerMaxLength 及各自的提示文字
      - isRequired/maxLength: 验证消息翻译
    - **待完成（Phase 2.2-2.4）**:
      - ⏳ 编辑页面UI：显示和编辑时间型问题
      - ⏳ 答案集合集成：保存时间型答案
      - ⏳ Google日历：提取时间值并创建多个事件
    - **部署URL**: https://895e8e56.review-system.pages.dev
    - **提交commit**: f12d480
  - 🎉 **V6.0.1-UI-Refinements - UI布局优化**（用户体验改进 - 2025-11-13）：
    - **用户反馈**: 编辑复盘页面UI布局需要优化
    - **核心改进**:
      - ✅ **保存按钮移到编辑框内**: 从所有section外部移到Section 1（复盘表头）内部底部
      - ✅ **Google日历按钮移到字段区域内**: 从section顶部移到日历输入字段下方
      - ✅ **修改section标题**: "设置计划时间（可选）" → "规划复盘时间（可选）"
    - **UI改进细节**:
      - **保存按钮位置优化**:
        - 之前：在所有可折叠section外部的底部（用户编辑完需要滚动到最下方）
        - 之后：在Section 1内部底部（编辑表头信息后立即可见）
        - 好处：更符合用户操作习惯，减少滚动距离
      - **Google日历按钮位置优化**:
        - 之前：在Section 3顶部，日历字段上方（用户填写前就看到按钮）
        - 之后：在日历字段下方，带分隔线（用户填写完后自然看到）
        - 样式：改为全宽按钮（w-full），居中对齐，更醒目
        - 好处：按钮紧邻相关输入，操作流程更顺畅
      - **标题文案优化**:
        - 中文: "设置计划时间" → "规划复盘时间"（更准确描述功能）
        - English: "Schedule Review" → "Plan Review Time"
        - 日本語: "予定時刻を設定" → "レビュー時間を計画する"
        - Español: "Programar Revisión" → "Planificar Tiempo de Revisión"
    - **技术实现**:
      - 修改文件1: `public/static/app.js` (编辑页面UI结构)
      - 修改文件2: `public/static/i18n.js` (4语言标题翻译)
      - 保持功能完全一致，仅优化UI布局
    - **用户体验提升**:
      - ✅ 编辑流程更直观，按钮位置更合理
      - ✅ 减少不必要的滚动操作
      - ✅ 功能分组更清晰，操作更便捷
      - ✅ 标题文案更准确易懂
    - **部署URL**: https://0314b004.review-system.pages.dev
    - **提交commit**: 526e469
  - 🎉 **V6.0.0-Phase1-Modal-Fix - Modal自动预填充答案**（用户体验改进 - 2025-11-13）：
    - **用户反馈**: 编辑复盘时在主页面输入框填写答案，点击"创建新答案组"后modal显示空白
    - **问题分析**:
      - Modal dialog 是动态创建的，输入框也是新创建的
      - 主页面的输入框和modal输入框是**完全独立**的两组元素
      - 用户在主页面输入的内容不会自动传递到modal
      - 导致用户以为自己填写了答案，实际提交的是空答案
    - **解决方案**:
      - ✅ 在显示modal之前，**从主页面收集当前已输入的值**
      - ✅ **文字型问题**: 从 `new-answer-${questionNumber}` 输入框读取值
      - ✅ **单选题**: 从主页面的radio按钮读取选中值
      - ✅ **多选题**: 从主页面的checkbox读取选中值数组
      - ✅ **预填充到modal**: 将收集到的值设置为modal输入框的初始值
    - **技术实现**:
      - 新增 `currentValues` 对象收集主页面答案
      - 文字型问题：在 `<textarea>` 中预填充 `${escapeHtml(currentValue || '')}`
      - 单选题：在对应radio添加 `checked` 属性
      - 多选题：在对应checkbox添加 `checked` 属性
      - 新增提示文字："请回答所有问题以创建新的答案组"
    - **用户体验改进**:
      - ✅ 用户在主页面输入的答案自动显示在modal中
      - ✅ 用户可以在modal中继续编辑或修改
      - ✅ 避免误提交空答案的情况
      - ✅ 明确的提示指导用户操作
    - **国际化支持** (1键 × 4语言):
      - pleaseAnswerAllQuestions: '请回答所有问题以创建新的答案组' / 'Please answer all questions...'
    - **部署URL**: https://db978987.review-system.pages.dev
    - **提交commit**: 4d1dc4b
  - 🎉 **V6.0.0-Phase1-Critical-Fix - 修复答案创建SQLITE_ERROR**（关键修复 - 2025-11-13）：
    - **用户反馈**: 点击"创建新答案组"按钮显示错误："SQLITE_ERROR: no such column: answer_set_id"
    - **问题分析**: 
      - 生产数据库结构验证显示 answer_set_id 列存在 ✓
      - review_answer_sets 表存在并有数据 ✓
      - 但用户仍然看到"no such column"错误
      - **根本原因发现**: reviews.ts 中创建和更新复盘时的 INSERT 语句仍使用旧表结构
    - **问题根源**:
      - `/src/routes/reviews.ts` 第318、326、435、463行的 INSERT 语句
      - 这些语句直接使用 `(review_id, user_id, question_number, answer)`
      - 未使用新的 answer_set_id 架构
      - 导致插入失败并抛出"no such column: answer_set_id"错误
    - **解决方案**:
      - ✅ 移除所有直接 INSERT 语句
      - ✅ 统一使用 `saveMyAnswer()` 工具函数（正确处理 answer_set_id）
      - ✅ 统一使用 `deleteAnswer()` 工具函数（正确处理 answer_set_id）
      - ✅ 简化代码逻辑，避免直接操作数据库
    - **修复内容**:
      - 修复创建复盘时的答案保存（POST /api/reviews）
      - 修复更新复盘时的答案保存（PUT /api/reviews/:id）
      - 两处代码从42行简化到13行
      - 完全兼容新的 answer_sets 架构
    - **修复效果**:
      - ✅ 创建复盘时填写答案不再报错
      - ✅ 编辑复盘时修改答案不再报错
      - ✅ 答案正确关联到 answer_set_id
      - ✅ 与答案集合系统完美集成
    - **技术改进**:
      - 代码复用：使用现有工具函数替代重复SQL
      - 数据一致性：统一使用 answer_sets 架构
      - 可维护性：减少直接数据库操作，集中在工具函数
    - **部署URL**: https://a2b9f241.review-system.pages.dev
    - **提交commit**: bc419e9
  - 🎉 **V5.30.4 - Google日历功能最终修复成功！**（重大里程碑 - 2025-11-13）：
    - **用户确认**: "成功了" ✅
    - **功能状态**: 完全可用，已通过生产环境测试
    - **修复过程**（经历4个版本迭代）:
      - **V5.30.0**: 初始实现（编辑页面UI + 草稿管理）
      - **V5.30.1**: 改进错误提示（前端验证）
      - **V5.30.2**: 修复日期格式解析（添加秒数）
      - **V5.30.3**: 修复D1_TYPE_ERROR（reviewId类型转换）
      - **V5.30.4**: 最终修复（简化逻辑 + 安全类型转换）✅
    - **最终解决方案**:
      - ✅ 简化数据库查询：单一SQL语句，不使用复杂JOIN
      - ✅ 安全类型转换：使用`String()`和`Number()`强制转换
      - ✅ 移除复杂权限检查：避免undefined传播
      - ✅ 简化错误处理：不访问可能undefined的属性
    - **核心问题分析**:
      - **问题**: `D1_TYPE_ERROR: Type 'undefined' not supported`
      - **根因**: 在错误处理的catch块中访问`error.stack`等属性时，这些属性本身可能是undefined
      - **加剧因素**: 复杂的权限检查函数中多次数据库调用，增加了undefined传播风险
      - **解决**: 简化所有逻辑，使用安全的类型转换，移除可能产生undefined的代码路径
    - **功能验证**:
      - ✅ 创建复盘并设置计划时间 → 成功
      - ✅ 保存并进入编辑页面 → 成功
      - ✅ 点击"添加到Google日历"按钮 → 成功
      - ✅ 打开Google日历并预填信息 → 成功
    - **技术改进**:
      - 代码行数：从170行简化到约100行
      - 数据库查询：从3次减少到1次
      - 类型转换：全部使用显式转换函数
      - 错误处理：简化为安全的最小逻辑
    - **用户体验**:
      - ✅ 操作流程顺畅，无错误提示
      - ✅ Google日历自动填入所有信息
      - ✅ 支持4种语言界面
      - ✅ 所有认证用户均可使用
    - **部署URL**: https://6ac3a43d.review-system.pages.dev
  - ✅ **V6.0.0-Phase2-Backend - 时间型问题后端支持**（功能更新 - 2025-11-13）：
    - **功能概述**: 后端API完整支持time_with_text类型问题
    - **核心改动**:
      - ✅ **templates.ts更新**:
        - 支持接收和保存datetime_value（默认时间）、datetime_title（12字符标题）、datetime_answer_max_length字段
        - INSERT和UPDATE语句包含时间型字段
        - 允许在创建模板时定义时间型问题
      - ✅ **reviews.ts更新**:
        - 查询template_questions时返回datetime字段
        - 查询review_answers时返回datetime_value, datetime_title, datetime_answer
        - 前端可以接收完整的时间型问题和答案数据
      - ✅ **answer_sets.ts兼容**:
        - 答案集合API已支持时间型字段的存储
        - POST/PUT操作可以保存datetime相关数据
    - **待实施（前端）**:
      - ⏳ 管理后台：时间型问题创建UI
      - ⏳ 复盘编辑：时间型问题显示和编辑
      - ⏳ Google日历：时间型问题的日历集成
      - ⏳ 位置调整：Review级别日历按钮移到问题之前
    - **提交commit**: f11a07c
    - **部署URL**: https://review-system.pages.dev
  - ✅ **V6.0.0-Phase1-Fix - 修复 my-answer 端点**（关键Bug修复 - 2025-11-13）：
    - **问题**: POST `/api/reviews/:id/my-answer` 返回 "Internal server error"
    - **根本原因**: 旧的答案API端点仍在使用旧的表结构，未适配新的 answer_sets 架构
    - **修复内容**:
      - ✅ **saveMyAnswer 函数重构**:
        - 检查用户是否有 answer_set（`review_answer_sets` 表）
        - 如果没有，自动创建 `set_number=1` 的答案集
        - 将答案插入时关联到 `answer_set_id`
      - ✅ **所有查询更新为 JOIN 新结构**:
        - `getReviewAnswers()` - JOIN review_answer_sets
        - `getMyAnswer()` - JOIN review_answer_sets
        - `deleteAnswer()` - 使用子查询过滤 answer_set_id
        - `deleteAnswerById()` - 使用子查询验证用户权限
        - `getAnswerCompletionStatus()` - JOIN review_answer_sets
      - ✅ **reviews.ts 端点修复**:
        - POST `/api/reviews/:id/my-answer/:questionNumber` - 查询新增 `ras.user_id`
        - DELETE `/api/reviews/:id/answer/:answerId` - 验证查询改为 JOIN answer_sets
    - **数据兼容性**:
      - 自动处理没有 answer_set 的用户（首次创建答案时自动创建 set_number=1）
      - 保持与 answer_sets API 的数据一致性
    - **修复效果**: ✅ 用户现在可以正常创建、查看、删除答案，与 answer_sets 系统完美集成
    - **提交commit**: 1d7afae
    - **部署URL**: https://c0e95a76.review-system.pages.dev
  - ✅ **V6.0.0-Phase1 - 答案集合系统（阶段1）**（重大功能更新 - 2025-11-13）：
    - **功能概述**: 实现统一的答案集合管理系统，所有问题共享相同数量的答案组
    - **核心改动**:
      - ✅ **数据库重构**:
        - 新增 `review_answer_sets` 表：存储答案集合元数据（review_id, user_id, set_number）
        - 重构 `review_answers` 表：关联到 `answer_set_id` 而非直接关联 review_id
        - 新增 `system_config` 表：存储系统配置（日期格式、时间制式等）
        - 保留旧 `review_answers` 表为 `review_answers_legacy`（安全备份）
      - ✅ **后端API**（4个新端点）:
        - `GET /api/answer-sets/:reviewId` - 获取review的所有答案集合
        - `POST /api/answer-sets/:reviewId` - 创建新答案集合（为所有问题创建答案）
        - `PUT /api/answer-sets/:reviewId/:setNumber` - 更新指定答案集合
        - `DELETE /api/answer-sets/:reviewId/:setNumber` - 删除指定答案集合
      - ✅ **前端UI**:
        - 答案集合导航区域：显示"第 X/总数 组"，带左右箭头按钮
        - 统一的"创建新答案组"按钮：一次为所有问题创建答案
        - 每个问题下方新增"当前答案组的答案"显示区域
        - 自动加载并渲染答案集合
        - 导航按钮自动启用/禁用（第一组/最后一组）
      - ✅ **JavaScript核心函数**:
        - `loadAnswerSets(reviewId)` - 加载答案集合数据
        - `navigateToPreviousSet() / navigateToNextSet()` - 导航功能
        - `renderAnswerSet(reviewId)` - 渲染当前集合的答案
        - `createNewAnswerSet(reviewId)` - 创建新答案集合
        - `updateAnswerSetNavigation()` - 更新导航UI
      - ✅ **i18n支持**: 添加15个新翻译键 × 4种语言（中文、英语、日语、西班牙语）
    - **用户体验改进**:
      - 答案数量统一：所有问题始终拥有相同数量的答案组
      - 同步导航：切换答案组时，所有问题同步显示对应组的答案
      - 时间排序：答案组按创建时间排序（从早到晚）
      - 清晰提示：使用说明告知用户如何使用答案集合功能
    - **技术亮点**:
      - 数据库迁移兼容性：旧数据自动迁移到新结构（本地环境）
      - 生产环境安全部署：使用 `_production.sql` 版本，保留旧数据为备份
      - 全局状态管理：`window.currentAnswerSets` 和 `window.currentSetIndex`
      - 异步加载：页面加载时自动获取并渲染答案集合
    - **阶段1范围**:
      - ✅ 基础答案集合功能（创建、导航、显示）
      - ✅ 统一答案管理（所有问题共享集合编号）
      - ✅ 前后端完整集成
      - ⏳ 时间型问题支持（阶段2）
      - ⏳ Google日历按钮位置调整（阶段2）
      - ⏳ 管理后台配置界面（阶段3）
    - **已知限制**:
      - 旧的"添加新答案"按钮仍然存在（将在优化时移除）
      - 创建新答案组时从旧输入框读取内容（临时方案）
      - 时间型问题尚未实现UI组件
    - **数据库迁移文件**:
      - `migrations/0030_add_time_type_and_answer_sets.sql` - 本地开发版本
      - `migrations/0030_add_time_type_and_answer_sets_production.sql` - 生产安全版本
    - **提交commit**: 737fdf0 / 1c5c650
    - **部署URL**: https://review-system.pages.dev
  - ✅ **V5.30.5 - 修复日历数据同步和时区问题**（重要Bug修复 - 2025-11-13）：
    - **用户反馈问题1**: "按'Add To Google Calendar'要先存一次盘，目前是修改了日期和时间后，系统传送到Google是修改前已经存在系统的数据"
    - **问题分析1 - 数据不同步**:
      - 用户在编辑页面修改了计划时间和地点
      - 直接点击"添加到Google日历"按钮
      - 前端调用 `/api/calendar/link/:reviewId` 获取链接
      - 后端从数据库读取review数据，但用户刚才的修改尚未保存
      - 导致Google日历收到的是**旧数据**
    - **解决方案1 - 自动保存**:
      - ✅ 新增 `saveEditReviewSilently()` 函数：静默保存当前表单数据
      - ✅ 在 `addToGoogleCalendar()` 中，**先调用静默保存，再获取日历链接**
      - ✅ 确保Google日历始终使用**最新修改的数据**
      - ✅ 如果保存失败，提示用户并中断操作
    - **用户反馈问题2**: "要考虑时区问题，目前有时区转换，错了"
    - **问题分析2 - 时区错误**:
      - 用户输入本地时间："2025-11-13T14:00"（本地14:00）
      - 后端使用 `new Date("2025-11-13T14:00:00")` 解析（被理解为本地时间）
      - 然后使用 `toISOString()` 转换为UTC时间："2025-11-13T06:00:00Z"
      - Google日历收到UTC时间，在UTC+8时区显示为14:00（正确），但在其他时区会错误
      - **双重转换问题**：本地时间 → Date对象（本地） → UTC字符串 → Google解析
    - **解决方案2 - 使用本地时间格式**:
      - ✅ **不使用 `new Date()` 和 `toISOString()`**，避免时区转换
      - ✅ **直接使用字符串操作**格式化时间："2025-11-13T14:00:00" → "20251113T140000"
      - ✅ **不添加'Z'后缀**（'Z'表示UTC，无'Z'表示本地时间）
      - ✅ Google日历将时间解释为**用户的本地时区时间**
    - **技术细节**:
      - 修改文件1：`public/static/app.js`
        - 新增 `saveEditReviewSilently()` 函数（91行）
        - 修改 `addToGoogleCalendar()` 函数，添加自动保存逻辑
      - 修改文件2：`src/routes/calendar.ts`
        - 重写 `generateGoogleCalendarUrl()` 函数
        - 移除 `new Date()` 和 `toISOString()` 调用
        - 使用纯字符串操作和Date.UTC()计算结束时间
        - 时间格式：`YYYYMMDDTHHmmss`（无'Z'后缀 = 本地时间）
    - **时间格式对比**:
      - ❌ 旧版本：`20251113T140000Z`（UTC时间，会错误转换）
      - ✅ 新版本：`20251113T140000`（本地时间，正确显示）
    - **验证步骤**:
      1. 创建复盘，设置计划时间为14:00
      2. 保存后，修改时间为15:00（不保存）
      3. 点击"添加到Google日历"
      4. 应该看到15:00（最新修改的时间）
      5. 时区应该正确（不应该减8小时）
    - **提交commit**: aacbde8
    - **部署URL**: https://0ed8d9e9.review-system.pages.dev
  - ✅ **V5.30.2 - 修复日期格式解析问题**（关键Bug修复 - 2025-11-13）：
    - **用户反馈问题**: "点击'添加到Google日历'出现'操作失败: Failed to generate calendar link'"（500错误）
    - **问题分析**:
      - HTML5 `datetime-local` 输入框返回格式：`YYYY-MM-DDTHH:mm`（无秒数）
      - 数据库存储格式：`2025-11-14T21:36`（无秒数）
      - `new Date()` 在某些环境下可能无法正确解析这种格式
      - 导致 `startDate.getTime()` 返回 `NaN`
      - Google Calendar URL生成失败，抛出500错误
    - **解决方案**:
      - ✅ 自动标准化日期格式：检测格式中冒号数量
      - ✅ 如果只有1个冒号（HH:mm），自动添加`:00`变成（HH:mm:ss）
      - ✅ 添加日期有效性验证：`isNaN(startDate.getTime())`
      - ✅ 增强错误日志：输出原始参数、标准化后的值、完整堆栈
      - ✅ 添加try-catch包裹整个函数，防止未捕获异常
    - **技术细节**:
      - 修改文件：`src/routes/calendar.ts`（generateGoogleCalendarUrl函数）
      - 日期标准化逻辑：`colonCount === 1 ? normalizedTime + ':00' : normalizedTime`
      - 错误处理：捕获并记录详细参数信息
    - **测试建议**:
      - 使用review ID 88测试（scheduled_at: "2025-11-14T21:36"）
      - 应该可以正常生成Google Calendar链接
    - **部署URL**: https://bf0738d9.review-system.pages.dev
  - ✅ **V5.30.1 - Google日历按钮错误提示改进**（用户体验优化 - 2025-11-13）：
    - **用户反馈问题**: "按'add to Google Calendar'出错'Operation failed: Failed to generate calendar link'"
    - **问题分析**:
      - 后端API在scheduled_at为null时返回400错误："No scheduled time set for this review"
      - 前端错误提示不够友好，显示通用错误信息
      - 用户可能在未保存计划时间的情况下点击按钮
    - **解决方案**:
      - ✅ 前端添加验证逻辑：点击按钮前检查`edit-scheduled-at`输入框是否有值
      - ✅ 改进错误处理：捕获400状态码，显示友好提示
      - ✅ 新增翻译键`pleaseSetScheduledTime`（4语言）：
        - 中文：'请先设置计划时间并保存'
        - English: 'Please set scheduled time and save first'
        - 日本語: '予定時刻を設定して保存してください'
        - Español: 'Por favor establezca la hora programada y guarde primero'
    - **用户体验改进**:
      - ✅ 点击按钮时立即验证，无需等待API响应
      - ✅ 错误提示清晰明确，告诉用户具体操作步骤
      - ✅ 避免显示技术性错误信息
    - **技术实现**:
      - 修改文件：`public/static/app.js`（addToGoogleCalendar函数）
      - 修改文件：`public/static/i18n.js`（添加pleaseSetScheduledTime翻译）
    - **部署URL**: https://205fe950.review-system.pages.dev
  - ✅ **V5.30.0 - Google日历集成完整版 + 重复创建Bug修复**（UI增强 + Bug修复 - 2025-11-13）：
    - **用户反馈问题1**: "我需要在哪里可以找到'添加到Google日历'按钮"
    - **用户反馈问题2**: "点击'创建和编辑'后，如果按'cancel'按钮或者回退按钮，系统会出现两个一模一样的'复盘'记录"
    - **解决方案**:
      - **问题1解决 - 编辑页面添加日历功能**:
        - ✅ 在 `showEditReview()` 函数中添加完整的日历字段区域
        - ✅ 显示三个日历字段：计划时间（datetime-local）、地点（text）、提醒时间（select）
        - ✅ 所有字段使用 `review.scheduled_at`、`review.location`、`review.reminder_minutes` 填充当前值
        - ✅ 当设置了 `scheduled_at` 时，在字段区域顶部显示绿色"添加到Google日历"按钮
        - ✅ 按钮调用 `addToGoogleCalendar(reviewId)` 函数打开Google日历
        - ✅ 非创建者用户看到的日历字段为 disabled 状态（只读）
        - ✅ 修改 `handleEditReview()` 函数，保存时包含日历字段：
          - `scheduled_at`: 从 `edit-scheduled-at` input 获取
          - `location`: 从 `edit-location` input 获取
          - `reminder_minutes`: 从 `edit-reminder-minutes` select 获取
      - **问题2解决 - 防止重复创建草稿**:
        - ✅ 在 `handleStep1Submit()` 中创建草稿后，设置全局标记 `window.newlyCreatedDraftId`
        - ✅ 创建新函数 `handleEditReviewCancel(reviewId)`:
          - 检查 `window.newlyCreatedDraftId` 是否等于当前 reviewId
          - 如果是，调用 `DELETE /api/reviews/:id` 删除未保存的草稿
          - 显示"草稿已删除"通知
          - 跳转回复盘列表
        - ✅ 修改编辑页面的"返回"按钮：从 `showReviews()` 改为 `handleEditReviewCancel(${id})`
        - ✅ 修改编辑页面的"取消"按钮：从 `showReviews()` 改为 `handleEditReviewCancel(${id})`
        - ✅ 在 `handleEditReview()` 保存成功后清除 `window.newlyCreatedDraftId` 标记
    - **国际化支持** (1键 × 4语言 = 4个翻译):
      - draftDeleted: '草稿已删除' / 'Draft deleted' / '下書きが削除されました' / 'Borrador eliminado'
    - **用户体验改进**:
      - ✅ 编辑页面可以查看和修改所有日历字段
      - ✅ 有计划时间时，绿色按钮醒目提示可以添加到Google日历
      - ✅ Cancel/返回时不会留下空白草稿记录
      - ✅ 首次保存后，取消按钮不再删除复盘（已是完整记录）
    - **技术实现**:
      - 修改文件：`public/static/app.js`（编辑页面UI + Cancel处理逻辑）
      - 修改文件：`public/static/i18n.js`（添加 draftDeleted 翻译）
      - 无需后端API修改（DELETE /api/reviews/:id 已存在）
    - **测试说明**:
      - 场景1：创建复盘 → 填写日历字段 → 保存 → 编辑 → 看到日历字段和绿色按钮 ✅
      - 场景2：创建复盘 → 点击Cancel → 草稿自动删除，不会出现重复记录 ✅
      - 场景3：编辑已有复盘 → 修改日历字段 → 保存 → 成功更新 ✅
    - **部署URL**: https://a4298365.review-system.pages.dev
  - ✅ **V5.29.0 - Google日历集成（Phase 1: 链接生成）**（重大新功能 - 2025-11-13）：
    - **用户需求**: "可否链接用户自己的Google日历，把系统用户设定事件和时间、地点等信息放到用户自己的Google日历中去？"
    - **实现方案**: Phase 1 采用链接生成方式（无需OAuth授权）
    - **数据库变更** (Migration 0029):
      - 添加 `scheduled_at` 字段：计划时间（DATETIME类型）
      - 添加 `location` 字段：地点信息（TEXT类型）
      - 添加 `reminder_minutes` 字段：提前提醒时间（INTEGER，默认60分钟）
      - 创建索引：`idx_reviews_scheduled_at` 用于查询即将到来的复盘
    - **后端API新增**:
      - **GET /api/calendar/link/:reviewId**: 生成Google Calendar添加事件的URL
      - 权限检查：仅创建者、团队成员、协作者可访问
      - URL格式：`https://calendar.google.com/calendar/render?action=TEMPLATE&text=...`
      - 自动计算：事件默认持续1小时
    - **前端功能**:
      - **创建复盘表单新增字段**:
        - 📅 计划时间选择器（datetime-local input）
        - 📍 地点输入框（text input）
        - ⏰ 提醒时间下拉框（15/30/60/120/1440分钟）
      - **JavaScript函数**:
        - `addToGoogleCalendar(reviewId)`: 调用API获取日历链接并在新标签打开
      - **用户体验**:
        - 所有日历字段均为可选
        - 计划时间未设置时，API返回友好错误提示
        - 成功添加后显示"打开Google日历"通知
    - **国际化支持** (13键 × 4语言 = 52个翻译):
      - scheduledTime: '计划时间' / 'Scheduled Time' / '予定時刻' / 'Hora Programada'
      - location: '地点' / 'Location' / '場所' / 'Ubicación'
      - reminderBefore: '提前提醒' / 'Reminder Before' / 'リマインダー' / 'Recordatorio Antes'
      - addToGoogleCalendar: '添加到Google日历' / 'Add to Google Calendar'
      - ... 共13个翻译键
    - **技术实现**:
      - 新增路由文件：`src/routes/calendar.ts`
      - 日期格式：ISO 8601转换为Google Calendar格式（YYYYMMDDTHHmmssZ）
      - 权限复用：使用现有的复盘访问权限检查逻辑
      - 参数编码：使用URLSearchParams确保正确编码
    - **Phase 2 计划**（未来增强）:
      - OAuth 2.0 授权流程
      - 自动创建日历事件（无需用户手动确认）
      - 同步修改和删除事件
      - 批量添加定期复盘
      - 团队成员日历同步
    - **部署URL**: https://64881902.review-system.pages.dev
  - ✅ **V5.28.2 - 修复团队删除错误**（关键Bug修复 - 2025-11-12）：
    - **用户反馈**: "团队列表的删除功能出错'操作失败: Internal server error'"
    - **问题分析**:
      - 尝试删除有 team_invitations 关联记录的团队时失败
      - `team_invitations` 表的外键约束未设置 `ON DELETE CASCADE`
      - SQLite 抛出外键约束违反错误
    - **解决方案**:
      - 修改 DELETE /api/teams/:id 端点实现多步删除
      - **第1步**: 删除 team_invitations 记录（无 CASCADE）
      - **第2步**: 删除 team_members 记录（显式删除）
      - **第3步**: 删除 team_applications 记录（有 CASCADE 但显式删除）
      - **第4步**: 删除 team 本身（自动 CASCADE 到 reviews 等）
    - **技术细节**:
      - 在 `src/routes/teams.ts` 的 DELETE 端点添加三条 DELETE 语句
      - 按正确顺序删除：invitations → members → applications → team
      - 确保所有外键关联记录都被清理
    - **修复效果**:
      - ✅ 团队删除功能现在正常工作
      - ✅ 有邀请记录的团队可以成功删除
      - ✅ 有成员的团队可以成功删除
      - ✅ 有申请记录的团队可以成功删除
      - ✅ 所有关联数据正确清理
    - **部署URL**: https://6fe05488.review-system.pages.dev
  - ✅ **V5.28.2 - 修复团队删除错误**（关键Bug修复 - 2025-11-12）：
    - **用户反馈**: "团队列表的删除功能出错'操作失败: Internal server error'"
    - **问题分析**:
      - 尝试删除有 team_invitations 关联记录的团队时失败
      - `team_invitations` 表的外键约束未设置 `ON DELETE CASCADE`
      - SQLite 抛出外键约束违反错误
    - **解决方案**:
      - 修改 DELETE /api/teams/:id 端点实现多步删除
      - **第1步**: 删除 team_invitations 记录（无 CASCADE）
      - **第2步**: 删除 team_members 记录（显式删除）
      - **第3步**: 删除 team_applications 记录（有 CASCADE 但显式删除）
      - **第4步**: 删除 team 本身（自动 CASCADE 到 reviews 等）
    - **技术细节**:
      - 在 `src/routes/teams.ts` 的 DELETE 端点添加三条 DELETE 语句
      - 按正确顺序删除：invitations → members → applications → team
      - 确保所有外键关联记录都被清理
    - **修复效果**:
      - ✅ 团队删除功能现在正常工作
      - ✅ 有邀请记录的团队可以成功删除
      - ✅ 有成员的团队可以成功删除
      - ✅ 有申请记录的团队可以成功删除
      - ✅ 所有关联数据正确清理
    - **部署URL**: https://6fe05488.review-system.pages.dev
  - ✅ **V5.28.1 - 答案自动保存（移除保存按钮）**（用户体验优化 - 2025-11-12）：
    - **用户反馈**: "系统应自动保存，不需要客人使用'保存'按钮，请删除此按钮"
    - **核心改进**:
      - **移除每个答案的保存/取消按钮**: 简化界面，减少操作步骤
      - **实现失焦自动保存**: 用户输入答案后点击其他地方自动保存
      - **保留底部总保存按钮**: 用于保存整个复盘并返回列表
      - **友好提示**: 显示"输入完成后点击其他地方自动保存"
      - **成功反馈**: 显示"答案已自动保存"通知
    - **自动保存行为**:
      1. 用户点击"添加新答案"按钮
      2. 输入框展开，用户输入答案
      3. 用户点击其他地方或按Tab键（失焦事件）
      4. 系统自动调用API保存答案
      5. 答案立即显示在列表中
      6. 输入框自动关闭
    - **用户体验提升**:
      - ✅ 无需点击"保存"按钮，减少操作步骤
      - ✅ 界面更简洁，移除多余按钮
      - ✅ 自动保存更符合现代应用习惯
      - ✅ 提示清晰，用户知道如何触发保存
      - ✅ 空答案自动取消，无错误提示
    - **技术实现**:
      - 添加 `onblur` 事件到答案输入框
      - 创建 `autoSaveNewAnswer()` 函数处理自动保存
      - 空答案自动调用 `cancelNewAnswer()` 关闭输入框
      - 保持原有 API 调用逻辑不变
    - **国际化支持** (2键 × 4语言):
      - autoSaveOnBlur: '输入完成后点击其他地方自动保存' / 'Click elsewhere after typing to auto-save'
      - answerAutoSaved: '答案已自动保存' / 'Answer Auto-Saved'
    - **部署URL**: https://56fe89c0.review-system.pages.dev
  - ✅ **V5.28.0 - 简化创建流程（直接编辑）**（重大改进 - 2025-11-12）：
    - **用户建议**: "请把'下一步'直接换成'编辑'功能模块，就不会出现'上一步'的问题"
    - **核心改进** - 完全重构创建流程：
      - **取消两步流程**: 移除 Step1 → Step2 的导航结构
      - **直接进入编辑**: 填写基本信息后直接创建草稿并进入编辑模式
      - **统一界面**: 创建和编辑使用同一套界面（完整功能）
      - **移除导航问题**: 无需"上一步"/"下一步"，彻底解决导航相关问题
    - **新流程**:
      1. 点击"创建复盘" → 填写标题、描述、模板等基本信息
      2. 点击"创建并编辑" → 后端创建空白草稿
      3. **自动进入编辑模式** → 使用完整的编辑界面
      4. 填写答案（支持多答案、+/- 按钮、选择题等）
      5. 点击"保存并返回" → 完成创建
    - **旧流程对比** (V5.27.x):
      - Step1: 填写基本信息 → 点击"下一步"
      - Step2: 填写答案（简化界面） → 点击"上一步"（自动保存）
      - ❌ 问题: 草稿恢复复杂、界面不统一、导航混乱
    - **优势**:
      - ✅ **彻底解决导航问题**: 无"上一步"/"下一步"
      - ✅ **界面统一**: 编辑界面功能完整（多答案、+/- 按钮）
      - ✅ **流程简化**: 创建即编辑，逻辑清晰
      - ✅ **代码简化**: 移除 Step2 相关代码，维护更容易
      - ✅ **用户体验**: 更符合直觉，创建和编辑体验一致
    - **技术细节**:
      - 修改 `handleStep1Submit()`: 直接调用 POST /api/reviews 创建草稿
      - 创建后立即调用 `showEditReview(newReviewId)` 进入编辑模式
      - 移除 Step2 相关逻辑（保留代码供未来参考）
      - 按钮文字改为"创建并编辑"（4语言支持）
    - **国际化支持** (2键 × 4语言):
      - createAndEdit: '创建并编辑' / 'Create & Edit' / '作成して編集' / 'Crear y Editar'
      - draftCreated: '草稿已创建' / 'Draft Created' / '下書きが作成されました' / 'Borrador Creado'
    - **部署URL**: https://cc7fe383.review-system.pages.dev
  - ✅ **V5.27.3 - 自动保存草稿（无确认）**（用户体验优化 - 2025-11-12）：
    - **用户反馈**: "不要问客人是否存盘，请直接存盘"
    - **核心改进**:
      - **移除确认对话框**: 点击"上一步"不再弹出"是否保存草稿"提示
      - **自动保存**: 如果用户填写了任何答案，自动保存为草稿
      - **即时导航**: 保存后立即返回Step1，无延迟等待
      - **静默保存**: 显示"草稿已自动保存"提示，不打断用户流程
      - **容错处理**: 即使保存失败也返回Step1，显示错误提示
    - **用户体验提升**:
      - ✅ 无需确认，点击"上一步"自动保存
      - ✅ 流程更流畅，无对话框打断
      - ✅ 保存成功显示ID，失败显示错误
      - ✅ 即使失败也不阻止返回
    - **国际化支持** (1键 × 4语言):
      - autoSaveFailed: '自动保存失败' / 'Auto Save Failed' / '自動保存に失敗しました' / 'Error al Guardar Automáticamente'
    - **技术细节**:
      - 移除 `confirm()` 对话框
      - 移除 `setTimeout()` 延迟导航
      - 使用 `draftAutoSaved` 替代 `draftSaved` 提示
      - 失败时也返回Step1（之前会停留在Step2）
    - **部署URL**: https://6194e91e.review-system.pages.dev
  - ✅ **V5.27.2 - 修复草稿数据恢复**（关键功能修复 - 2025-11-12）：
    - **问题描述**: 用户反馈"保存草稿后再次点击'下一步'，表单是空白的，答案全部消失"
    - **根本原因**: 
      - showCreateReviewStep2() 函数没有加载草稿数据
      - 每次进入 Step2 都是全新的空白表单
      - 虽然草稿保存成功，但无法恢复，导致用户认为"没有保存"
    - **核心修复**:
      - **加载草稿数据**: 检测 currentDraftId → 调用 GET /api/reviews/:id → 提取用户答案
      - **恢复单选题**: 自动选中对应的 radio button
      - **恢复多选题**: 解析 "A,B,C" 格式，自动勾选对应的 checkboxes
      - **恢复文字题**: 
        - 清空默认空白输入框
        - 为每个保存的答案创建输入框（带/不带删除按钮）
        - 填充答案文本
      - **用户反馈**: 显示"草稿已恢复"提示 + 控制台详细日志
    - **技术细节**:
      - 使用 escapeHtml() 防止 XSS 攻击
      - 使用 insertAdjacentHTML() 动态创建输入框
      - 保持与手动添加相同的 HTML 结构
      - 支持所有题型：单选、多选、文字（单/多答案）
    - **国际化支持** (1键 × 4语言):
      - draftRestored: '草稿已恢复' / 'Draft Restored' / '下書きが復元されました' / 'Borrador Restaurado'
    - **用户体验提升**:
      - ✅ 保存草稿后再次进入 Step2，所有答案完整恢复
      - ✅ 单选题、多选题、文字题（包括多个答案）全部恢复
      - ✅ 明确的"草稿已恢复"提示，用户知道数据加载成功
      - ✅ 用户可以继续编辑草稿，不会丢失之前的工作
      - ✅ 真正实现了"草稿"功能的完整体验
    - **测试流程**:
      1. 创建复盘 → 填写部分答案 → 上一步并保存草稿
      2. 点击下一步 → ✅ 所有答案恢复显示
      3. 修改答案 → 上一步并保存 → 下一步 → ✅ 更新后的答案正确恢复
    - **部署URL**: https://1aef5553.review-system.pages.dev
  - ✅ **V5.27.1 - 增强草稿保存可见性**（用户体验改进 - 2025-11-12）：
    - **改进原因**: 用户反馈"点击保存后看不到草稿是否真的保存了"
    - **核心改进**:
      - **视觉反馈增强**: 
        - Step1 顶部显示黄色背景的草稿状态提示框
        - 明确显示"正在编辑草稿 (ID: xxx)"
        - 用户返回 Step1 时立即看到草稿状态
      - **成功提示改进**:
        - 通知信息包含草稿ID："草稿已保存 (ID: 123)"
        - 延长显示时间从500ms→1500ms，确保用户看到
        - 用户有充分时间确认保存成功
      - **调试能力增强**:
        - 添加详细控制台日志记录保存流程
        - 区分"创建新草稿"和"更新现有草稿"
        - 开发者和用户都能追踪保存状态
      - **数据验证**:
        - 保存前检查必需字段(title, template_id)
        - 数据不完整时显示明确错误提示
        - 防止无效草稿创建
    - **国际化支持** (3键 × 4语言 = 12个翻译):
      - editingDraft: '正在编辑草稿' / 'Editing Draft' / '下書きを編集中' / 'Editando Borrador'
      - draftAutoSaved: '您的更改会自动保存' / 'Your changes will be automatically saved'
      - pleaseCompleteBasicInfo: '请先完成基本信息填写' / 'Please complete basic information first'
    - **用户体验提升**:
      - ✅ 用户明确知道草稿已保存（看到ID）
      - ✅ 返回 Step1 时有醒目的状态提示
      - ✅ 不再怀疑"是否真的保存了"
      - ✅ 控制台日志帮助诊断问题
    - **部署URL**: https://dd2e24b1.review-system.pages.dev
  - ✅ **V5.27.0 - 修复草稿保存 + 支持创建时多答案**（功能增强与Bug修复 - 2025-11-12）：
    - **问题1**: 用户在"创建复盘"Step2填写答案后点击"上一步"，确认保存草稿后实际没有保存
    - **根本原因**: 
      - 成功保存后代码继续执行到 `showCreateReview()` 导航语句
      - 虽然有 `await` 等待API完成，但之后没有 `return` 阻止继续执行
      - 导致保存成功但立即导航，给用户造成没有保存的错觉
    - **修复方案**:
      - 在成功保存后添加显式 `return` 语句
      - 添加500ms延迟后再导航，让用户看到成功提示
      - 确保只在取消保存或无答案时才导航
    - **问题2**: 用户希望在"创建复盘"Step2就能添加多个文字答案，而不是只有编辑模式才能
    - **解决方案**:
      - Step2的文字题添加"添加另一个答案"按钮
      - 用户可以在创建时就为同一问题添加多个答案
      - 每个答案输入框都有删除按钮（最后一个除外）
      - 更改提示文字为"您可以为同一问题添加多个答案"
    - **后端API更新**:
      - POST /api/reviews: 支持接收答案数组 `{1: ["答案1", "答案2"], 2: "单个答案"}`
      - PUT /api/reviews/:id: 草稿更新时支持答案数组
      - 保持向后兼容性：单个答案仍为字符串，多个答案为数组
    - **前端功能增强**:
      - 新增 `addAnswerInputInCreate(questionNumber)` 函数：添加答案输入框
      - 新增 `removeAnswerInputInCreate(button)` 函数：删除答案输入框（至少保留一个）
      - 更新答案收集逻辑：使用 `data-question` 和 `data-answer-index` 属性
      - Step2提交和草稿保存都支持收集多个文字答案
    - **国际化支持**:
      - 新增3个翻译键 × 4语言 = 12个翻译
      - addAnotherAnswer: '添加另一个答案' / 'Add Another Answer' / '別の答えを追加' / 'Agregar Otra Respuesta'
      - canAddMultipleAnswers: '您可以为同一问题添加多个答案' / 'You can add multiple answers...' 等
      - mustKeepOneAnswer: '至少需要保留一个答案输入框' / 'Must keep at least one...' 等
    - **用户体验提升**:
      - ✅ 草稿保存真正生效，用户可以安心返回继续填写
      - ✅ 创建时就能添加多个答案，与编辑模式功能一致
      - ✅ UI清晰直观，+/- 按钮操作流畅
      - ✅ 保持至少一个输入框的约束，防止用户误删所有输入框
    - **技术细节**:
      - 使用 `textarea[data-question="${q.question_number}"]` 选择器收集所有答案
      - 答案数据结构：数组（多个）或字符串（单个）
      - 后端自动识别数组并循环插入多条记录
    - **测试验证**: ✅ 已完成创建、草稿保存、多答案添加删除功能测试
  - ✅ **V5.26.3 - 修复创建后返回页面**（用户体验修复 - 2025-11-12）：
    - **问题**: 创建复盘后返回的是工作台，而不是"我的复盘"列表
    - **用户期望**: 创建完成后应该看到"我的复盘"列表，能立即看到新创建的复盘
    - **修复方案**: 
      - 将返回目标从 `showDashboard()` 改为 `showReviews()`
      - 创建成功后直接跳转到"我的复盘"页面
      - 与编辑行为保持一致（编辑也返回"我的复盘"）
    - **用户体验提升**:
      - ✅ 用户可以立即看到新创建的复盘
      - ✅ 可以马上点击"编辑"添加更多答案
      - ✅ 行为一致性：创建和编辑都返回同一页面
    - **修复效果**: 用户体验更加直观和流畅
  - ✅ **V5.26.2 - 改进创建复盘UI**（用户体验优化 - 2025-11-12）：
    - **问题**: 用户反馈"创建复盘"使用旧版本编辑，无法添加多个答案和选择题
    - **优化方案**:
      - 文字题显示提示："保存后可在编辑模式中添加更多答案"
      - Placeholder文字改为"输入答案..."更简洁明了
      - 创建时提供单个输入框（第一个答案）
      - 保存后可在编辑模式使用"+"按钮添加更多答案
      - 选择题保持单选/多选UI（符合创建时的一次性填写逻辑）
    - **国际化支持**:
      - 新增2个翻译键 × 4语言 = 8个翻译
      - enterAnswer: '输入答案...' / 'Enter answer...' / '答えを入力...' / 'Ingrese respuesta...'
      - canAddMoreAnswersInEdit: 完整的4语言提示文字
    - **用户体验**:
      - ✅ 用户明确知道可以稍后添加更多答案
      - ✅ 创建流程保持简洁（不需要在创建时就添加多个答案）
      - ✅ 编辑模式提供完整的多答案功能
    - **修复效果**: 用户理解创建和编辑的区别，体验更加流畅
  - ✅ **V5.26.1 - 修复编辑保存错误**（关键Bug修复 - 2025-11-12）：
    - **问题**: 用户点击"编辑"/"保存"按钮时出现"操作失败: Internal server error"
    - **根本原因**: 
      - Migration 0028移除了review_answers表的UNIQUE约束以支持多答案功能
      - 但PUT /api/reviews/:id端点仍使用`ON CONFLICT(review_id, user_id, question_number)`子句
      - 导致SQL错误：UNIQUE约束不存在
    - **解决方案**:
      - 移除ON CONFLICT子句
      - 实现显式的SELECT-UPDATE-INSERT逻辑
      - 先检查答案是否存在，存在则UPDATE，不存在则INSERT
    - **影响范围**: 所有复盘的编辑和保存操作
    - **测试验证**:
      - ✅ 编辑复盘基本信息（标题、描述、状态）正常
      - ✅ 保存选择题答案正常
      - ✅ 保存文字题答案正常（通过专用API）
      - ✅ 多答案功能完整支持
    - **修复效果**: 用户现在可以正常编辑和保存复盘，无任何错误
  - ✅ **V5.24.0 - 增强语言切换器（4语言下拉菜单）**（用户体验重大升级）：
    - **核心改进**: 
      - 首页和导航栏统一使用4语言下拉菜单
      - 替换原有的简单切换按钮
      - 支持自由选择4种语言：🇨🇳中文、🇬🇧English、🇯🇵日本語、🇪🇸Español
    - **UI/UX优化**:
      - 下拉菜单显示国旗emoji + 语言名称
      - 当前选中语言蓝色高亮 + 复选标记✓
      - 点击外部区域自动关闭菜单
      - 响应式设计，移动端友好
    - **技术实现**:
      - `toggleLanguageMenu(menuId)` - 支持多个菜单实例
      - `handleLanguageSwitch(newLang, menuId)` - 智能语言切换
      - 两个独立菜单ID：`language-menu`（导航栏）和 `language-menu-home`（首页）
      - 防止重复切换到当前语言
    - **国际化修复**:
      - 新增 `answerCannotBeEmpty` 翻译键（4种语言）
      - 修复3处硬编码英文错误消息
      - 所有系统提示完全国际化
    - **测试验证**:
      - ✅ 首页语言切换器正常工作
      - ✅ 导航栏语言切换器正常工作
      - ✅ 4种语言自由切换
      - ✅ 语言偏好正确持久化
      - ✅ 所有菜单和提示正确翻译
    - **修复效果**: ✅ 用户体验大幅提升，语言切换更加直观和方便
  - ✅ **V5.23.6 - 智能模板删除功能**（用户反馈优化）：
    - **用户反馈**: 经过考虑，有复盘使用的模板不要完全删除，只禁用即可
    - **智能删除逻辑**: 
      - **有复盘使用的模板**: 只标记为禁用（is_active=0），保留在数据库中
      - **无复盘使用的模板**: 完全删除（从数据库中移除）
    - **模板列表优化**:
      - 排序规则：启用的模板在前，禁用的模板在后
      - ORDER BY: is_active DESC, is_default DESC, created_at DESC
      - 禁用模板背景色为灰色（bg-gray-100）
      - 禁用模板仍可编辑，可通过 is_active 复选框重新启用
    - **前端提示消息**:
      - 禁用模板：显示"模板已禁用（被X个复盘使用），可在列表中重新启用"（warning）
      - 删除模板：显示"模板删除成功"（success）
    - **国际化支持**: 
      - 新增 'templateDisabledDueToUsage' 翻译键
      - 删除 'templateDeletedWithReassign' 翻译键（不再重新分配）
    - **测试验证**:
      - ✅ 有复盘使用的模板：只禁用，不删除，affected_reviews=1
      - ✅ 无复盘使用的模板：完全删除，affected_reviews=0
      - ✅ 禁用模板显示为灰色背景，排列在后面
      - ✅ 禁用模板可通过编辑重新启用
    - **修复效果**: ✅ 模板删除更加智能和安全，符合用户实际需求
  - ✅ **V5.23.4 - 修复编辑功能的字段名错误**（关键修复）：
    - **问题**: 点击"编辑"按钮显示"操作失败: Internal server error"
    - **根本原因**: GET /api/reviews/:id 查询使用了错误的字段名 `max_length`，实际字段名是 `answer_length`
    - **错误**: `D1_ERROR: no such column: max_length`
    - **解决方案**: 将SQL查询中的 `max_length` 改为 `answer_length`
    - **修复效果**: ✅ 编辑功能现在可以正常工作，正确显示单选题/多选题/文字题
  - ✅ **V5.23.3 - 修复查看/编辑时的问题类型JOIN查询**（功能完善）：
    - **问题**: 编辑复盘时无法识别问题类型（单选/多选/文字）
    - **根本原因**: GET /api/reviews/:id 只查询了 question_number 和 question_text，没有查询 question_type、options、correct_answer
    - **解决方案**: 在SQL查询中添加 question_type、options、correct_answer、answer_length 字段
    - **修复效果**: ✅ 查看/编辑复盘时正确通过JOIN获取问题类型和参数，显示对应的UI
  - ✅ **V5.23.2 - 修复生产环境登录问题**（关键修复）：
    - **问题**: 生产环境无法登录，所有用户返回"Invalid credentials"错误
    - **根本原因**: 
      1. JWT_SECRET 硬编码在代码中，未从环境变量读取
      2. 生产数据库密码哈希被shell截断
    - **解决方案**:
      1. ✅ 修改 utils/auth.ts 支持从环境变量读取 JWT_SECRET
      2. ✅ 更新所有调用 generateToken 的地方传递 JWT_SECRET
      3. ✅ 更新 authMiddleware 使用环境变量中的 JWT_SECRET
      4. ✅ 添加 JWT_SECRET 到 Cloudflare Pages secrets
      5. ✅ 修复生产数据库中的密码哈希
    - **修复效果**: ✅ 所有用户现在可以成功登录生产环境
  - ✅ **V5.23.1 - 编辑复盘界面支持选择题**（用户体验改进）：
    - 修复"我的复盘"→"编辑"功能，现在可以正确识别单选题和多选题
    - 单选题：显示 Radio 按钮，可以选择一个答案，自动预选用户之前的答案
    - 多选题：显示 Checkbox，可以选择多个答案，自动预选用户之前的答案
    - 文字题：显示文本框（原有功能）
    - 适用范围：✅ "我的复盘" → "编辑"
  - ✅ **V5.23 - 三种问题类型支持**（重大新功能）：
    - **文字型（Text Type）**：传统的自由文本输入
    - **单选型（Single Choice）**：从A/B/C/D选项中选择一个正确答案
    - **多选型（Multiple Choice）**：从A/B/C/D选项中选择多个正确答案
  - ✅ **管理界面增强**：
    - 问题类型选择器（文字型/单选型/多选型）
    - 动态选项编辑器（添加/删除选项，自动重新编号）
    - 标准答案选择器（单选用radio，多选用checkbox）
    - 问题列表显示类型徽章和选项预览
  - ✅ **创建复盘界面**：
    - 文字型显示文本框
    - 单选型显示单选按钮（radio）
    - 多选型显示复选框（checkbox）
  - ✅ **查看复盘界面**：
    - 选择题以选项形式显示
    - 用户选择高亮显示
    - 正确答案用绿色/星标标识
    - 错误答案用红色标识
  - ✅ **数据库结构**：新增question_type, options, correct_answer字段
  - ✅ **完整的前后端实现**：13个新增国际化键，完整验证逻辑
  - ✅ **折叠/展开功能**：每个问题旁边新增折叠按钮，答案默认隐藏
  - ✅ **紧凑显示优化**：减少问题间距，使用边框分隔，更节省屏幕空间
  - ✅ **智能展开控制**：点击"展开"显示答案，点击"收起"隐藏答案
  - ✅ **双语支持**：完整的中英文国际化支持

### 开发环境
- **应用 URL**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
- **Git Commit**: ✅ V5.26.1 (修复编辑保存错误)
- **本地端口**: 3000 (PM2 管理)
- **数据库状态**: 
  - ✅ 本地数据库：已应用所有31个迁移（包括0028）
  - ✅ 编辑/保存功能已修复
  - ✅ 所有功能正常运行
- **更新内容**: 
  - ✅ **多答案功能 (V5.26.0 - 2025-11-12)**：
    - **用户需求**: 
      1. 为每个"复盘"的每个"问题"的"答案"增加日期时间字段记录答案创建时间
      2. 在编辑界面显示答案的创建时间
      3. 增加"+"按钮添加新答案，"-"按钮删除答案
      4. 支持每个问题多个答案
    - **数据库变更** (Migration 0028):
      - 移除 UNIQUE(review_id, user_id, question_number) 约束
      - 保留现有 created_at 字段（已存在）
      - 允许同一用户对同一问题创建多个答案
    - **后端API变更**:
      - POST /api/reviews/:id/my-answer/:questionNumber - 创建新答案（改为POST，总是INSERT）
      - DELETE /api/reviews/:id/answer/:answerId - 按答案ID删除
      - GET /api/reviews/:id - 返回答案时包含id和created_at字段
      - 新增 deleteAnswerById() 数据库工具函数
    - **前端UI变更**:
      - 编辑界面：显示所有已有答案，每个答案显示创建时间和删除按钮
      - 添加"+"按钮显示新答案输入框
      - 新答案输入框带有保存/取消按钮
      - 删除按钮需要确认，删除后立即从UI移除
      - 查看界面：显示所有答案及其创建时间（created_at）
    - **新增JavaScript函数**:
      - showNewAnswerInput() - 显示新答案输入框
      - cancelNewAnswer() - 取消添加新答案
      - addNewAnswer() - 调用API创建新答案并更新UI
      - deleteExistingAnswer() - 调用API删除答案并更新UI
      - formatDate() - 格式化日期时间显示
    - **国际化支持**:
      - 新增4个翻译键 × 4语言 = 16个翻译
      - enterNewAnswer（输入新答案）
      - addNewAnswer（添加新答案）
      - answerCreatedAt（创建于）
      - noAnswersYet（还没有答案）
    - **修复效果**: ✅ 用户现在可以为每个问题添加多个答案，每个答案显示创建时间，可以单独删除
  - ✅ **删除群体类型并优化团队选择 (V5.25.0 - 2025-11-12)**：
    - **数据库结构调整**：
      - 删除reviews表的group_type字段（个人/项目/团队分类）
      - 在time_type字段中新增'free'（自由复盘）选项
      - 迁移文件：0026_remove_group_type_and_add_free_time_type.sql
    - **前端界面优化**：
      - 移除创建复盘时的"群体类型"选择器 ✅
      - 移除编辑复盘时的"群体类型"选择器 ✅
      - 当"主人"设置为"团队"时，自动显示团队选择器 ✅
      - 简化表单，减少用户困惑 ✅
    - **时间类型增强**：
      - 新增"自由复盘"选项（中文：自由复盘，英文：Free Review）
      - 新增日语翻译：自由レビュー
      - 新增西班牙语翻译：Revisión Libre
    - **后端API更新**：
      - 从所有reviews查询中删除group_type字段
      - 从创建/更新接口中删除group_type参数
      - 优化数据库查询性能
    - **国际化支持**：
      - 删除groupType相关的16个翻译键（4语言 × 4键）
      - 添加timeTypeFree翻译键（4语言）
    - **代码清理**：
      - 删除810行旧代码，新增330行优化代码
      - 净减少480行代码，提升可维护性
    - **JavaScript语法错误修复**：
      - 修复loadTestimonials()函数中的HTML结构损坏
      - 移除testimonial card中错误插入的filter selector HTML
      - 修复review detail视图中的孤立代码片段（`</span>` + `` ` : ''}`）
      - 所有语法错误已修复，页面正常加载
    - **完整功能恢复**（修复Python脚本误删除）：
      - 恢复showLogin()和showRegister()函数 - 登录和注册页面
      - 恢复handleLogin()和handleRegister()函数 - 认证处理逻辑
      - 恢复showDashboard()函数 - 工作台页面
      - 恢复loadDashboardData()函数 - 工作台数据加载
      - 恢复renderRecentReviews()函数 - 工作台复盘列表渲染
      - 恢复changeDashboardPage()函数 - 工作台分页功能
      - 恢复showReviews()函数 - "我的复盘"页面
      - 移除group_type过滤器，保留status、search、timeType、ownerType过滤
    - **用户体验优化**：
      - 修复编辑复盘后返回页面 - 从工作台改为"我的复盘"页面
      - 保持用户操作上下文，避免混淆
    - **修复效果**: ✅ 用户现在可以正常登录、访问工作台、查看"我的复盘"页面，编辑后正确返回"我的复盘"，所有功能完全恢复
  - ✅ **翻译完善和导航优化 (V5.25.1 - 2025-11-12)**：
    - **日语翻译完善**：
      - 团队页面：チームメンバー、チームを退出、参加日等
      - 过滤器：時間タイプ、所有者、プライベート、チーム、公開
      - 时间类型：日次/週次/月次/四半期/年次/自由レビュー
    - **西班牙语翻译完善**：
      - 团队页面：Miembros del Equipo、Salir del Equipo、Fecha de Ingreso等
      - 过滤器：Tipo de Tiempo、Propietario、Privado、Equipo、Público
      - 时间类型：Diaria/Semanal/Mensual/Trimestral/Anual/Libre
    - **页面导航优化**：
      - 所有页面切换后自动滚动到顶部
      - 修复"取消"按钮后停留在页尾的问题
      - 适用于：我的复盘、工作台、公开的复盘
    - **修复效果**: ✅ 日语和西班牙语用户体验完全本地化，页面导航更加流畅 
  - ✅ **留言见证翻译修复 (V5.24.6 - 2025-11-11)**：
    - 修复68个留言见证部分翻译键（34日语 + 34西班牙语）
    - **日语翻译修复**：
      - "Leave Your Message" → "メッセージを残す" ✅
      - "Submit Message" → "メッセージを送信" ✅
      - "Product Manager" → "プロダクトマネージャー" ✅
      - "Entrepreneur" → "起業家" ✅
      - "Team Lead" → "チームリーダー" ✅
      - 所有时间戳（"25 days ago" → "25日前"）✅
      - 所有按钮和标签现在正确显示日语
    - **西班牙语翻译修复**：
      - "Leave Your Message" → "Deja tu Mensaje" ✅
      - "Submit Message" → "Enviar Mensaje" ✅
      - "Product Manager" → "Gerente de Producto" ✅
      - "Entrepreneur" → "Emprendedora" ✅
      - "Team Lead" → "Líder de Equipo" ✅
      - 所有时间戳（"25 days ago" → "25 días atrás"）✅
      - 所有按钮和标签现在正确显示西班牙语
    - **影响范围**：日语（1743-1780行）、西班牙语（2388-2425行）
    - 累计翻译修复：西班牙语138键 + 日语215键 + 本次68键 = **421个翻译键**
  - ✅ **剩余翻译完善 (V5.24.5 - 2025-11-11)**：
    - 修复50个翻译键（26个i18n + 24个新增键）+ 4个isPublic键
    - **关于我们区块**："About Our Company" → "Sobre Nuestra Empresa"/"私たちの会社について" ✅
    - **我们的团队**："Our Team" → "Nuestro Equipo"/"私たちのチーム" ✅
    - **联系我们**："Contact Us" → "Contáctenos"/"お問い合わせ" ✅
    - **团队页面标签**：全部使用i18n翻译（我的团队、公开团队、待审批）✅
    - **团队页面提示**：所有"暂无..."消息现在正确翻译 ✅
    - **推荐文区块**："Welcome to Leave a Message" 现在正确翻译 ✅
    - 西班牙语和日语用户体验现在接近100%本地化
  - ✅ **主页内容翻译完善 (V5.24.4 - 2025-11-11)**：
    - 修复40个主页内容翻译键（20西班牙语 + 20日语）
    - 主页标题现在根据语言变化：
      - 西班牙语："Construye Organizaciones de Aprendizaje..." ✅
      - 日语："体系的なレビューを通じて学習組織を構築する" ✅
    - 轮播图内容（3张幻灯片）现在完全本地化
    - 所有按钮（"开始"、"前往仪表板"）现在正确翻译
    - 资源区块（"学习资源"、"文章"、"视频"）现在正确翻译
    - 主页用户体验现在达到100%本地化
  - ✅ **日语翻译完善 (V5.24.3 - 2025-11-11)**：
    - 修复164个日语翻译键从英文到日语
    - "Public Reviews" → "公開レビュー" ✅
    - "User Management" → "ユーザー管理" ✅
    - "Template Management" → "テンプレート管理" ✅
    - 所有管理面板子菜单现在完全是日语
    - 所有认证页面、表格标题、按钮、消息现在完全是日语
    - 日语用户体验现在达到96%本地化
  - ✅ **西班牙语翻译完善 (V5.24.2 - 2025-11-11)**：
    - 修复87个西班牙语翻译键从英文到西班牙语
    - "Public Reviews" → "Revisiones Públicas" ✅
    - "User Management" → "Gestión de Usuarios" ✅
    - "Template Management" → "Gestión de Plantillas" ✅
    - 所有管理面板子菜单现在完全是西班牙语
    - 所有表格标题、按钮、消息现在完全是西班牙语
    - 西班牙语用户体验现在达到94%本地化
  - ✅ **导航栏统一 (V5.24.1 - 2025-11-11)**：
    - 统一所有页面使用单一 `renderNavigation()` 函数
    - 修复首页语言切换失效问题
    - "Public Review" 和 "Administration" 现在可以正确跟随语言切换
    - 移除重复的导航代码（减少134行代码）
    - 简化语言菜单点击处理器
  - ✅ **语言切换器增强 (V5.24.0)**：
    - 首页和导航栏统一使用4语言下拉菜单
    - 支持中文🇨🇳、英文🇬🇧、日文🇯🇵、西班牙文🇪🇸
    - 当前选中语言高亮显示（蓝色背景 + 复选标记）
    - 点击外部自动关闭下拉菜单
  - ✅ **消息国际化修复**：
    - 修复硬编码英文错误消息
    - 新增 `answerCannotBeEmpty` 翻译键（4种语言）

### 测试账号
| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@review.com | admin123 | 全部功能 + 后台管理 |
| 高级用户 | premium@review.com | premium123 | 个人复盘 + 团队功能 |
| 普通用户 | user@review.com | user123 | 仅个人复盘 |

## 📊 数据架构

### 数据模型

#### 1. Users（用户表）
```sql
- id: 用户ID
- email: 邮箱（唯一）
- password_hash: 密码哈希
- username: 用户名
- role: 角色（admin/premium/user）
- language: 语言偏好（zh/en）
- created_at: 创建时间
- updated_at: 更新时间
```

#### 2. Reviews（复盘记录表）
```sql
- id: 复盘ID
- title: 复盘主题
- user_id: 创建者ID
- team_id: 团队ID（可选）
- group_type: 群体类型（personal/project/team）【新增】
- time_type: 时间类型（weekly/monthly/yearly）【新增】
- question1-9: 复盘灵魂9问的答案
- status: 状态（draft/completed）
- created_at: 创建时间
- updated_at: 更新时间
```

#### 3. Teams（团队表）
```sql
- id: 团队ID
- name: 团队名称
- description: 团队描述
- owner_id: 拥有者ID
- is_public: 是否公开（1/0）【V4.2 新增】
- created_at: 创建时间
- updated_at: 更新时间
```

#### 3a. Team Applications（团队申请表）【V4.2 新增】
```sql
- id: 申请ID
- team_id: 团队ID
- user_id: 申请用户ID
- status: 状态（pending/approved/rejected）
- message: 申请理由
- applied_at: 申请时间
- reviewed_at: 审批时间
- reviewed_by: 审批人ID
```

#### 4. Team Members（团队成员表）
```sql
- id: 记录ID
- team_id: 团队ID
- user_id: 用户ID
- joined_at: 加入时间
```

#### 5. Review Collaborators（复盘协作者表）
```sql
- id: 记录ID
- review_id: 复盘ID
- user_id: 用户ID
- can_edit: 编辑权限（1/0）
- added_at: 添加时间
```

#### 6. Notifications（通知表）【新增】
```sql
- id: 通知ID
- user_id: 接收用户ID
- title: 通知标题
- message: 通知内容
- is_read: 已读状态（0/1）
- created_at: 创建时间
```

#### 8. Shopping Cart（购物车表）【V5.15.2 新增】
```sql
- id: 购物车ID
- user_id: 用户ID
- item_type: 商品类型（upgrade/renewal）
- subscription_tier: 订阅级别（premium）
- price_usd: 价格（美元）
- duration_days: 订阅天数
- description: 商品描述（中文）
- description_en: 商品描述（英文）
- created_at: 创建时间
```

#### 7. Team Review Answers（团队答案表）【V3.9 新增】
```sql
- id: 记录ID
- review_id: 复盘ID
- user_id: 用户ID
- question_number: 问题编号（1-9）
- answer: 答案内容
- created_at: 创建时间
- updated_at: 更新时间
- UNIQUE(review_id, user_id, question_number): 每个用户对每个问题只能有一个答案
```

### 存储服务
- **Cloudflare D1 Database**: SQLite 全球分布式数据库
- **本地开发**: 使用 wrangler --local 模式的本地 SQLite

## 🎯 复盘灵魂9问

这是系统的核心框架，帮助用户进行深度复盘：

1. **我的目标是什么？** - 明确初始目标
2. **目标达成了吗？** - 评估完成情况
3. **哪些地方做得不错？** - 总结成功经验
4. **做的好的能否复制？** - 提炼可复制的方法
5. **哪些地方出了问题？** - 识别问题点
6. **出问题的原因是什么？** - 深度分析原因
7. **下次怎么避免与优化？** - 制定改进措施
8. **我学到了什么底层规律？** - 提炼底层逻辑
9. **如果重新来一次，我们应该如何做？** - 完整方案重构

## 🚀 技术栈

### 后端
- **Hono Framework**: 轻量级 Web 框架
- **Cloudflare Workers**: Edge 运行时
- **Cloudflare D1**: 分布式 SQLite 数据库
- **JWT**: 身份认证
- **bcryptjs**: 密码加密

### 前端
- **原生 JavaScript**: 无框架依赖
- **Tailwind CSS**: 样式框架（CDN）
- **Font Awesome**: 图标库（CDN）
- **Axios**: HTTP 客户端（CDN）

### 开发工具
- **Wrangler**: Cloudflare 开发工具
- **Vite**: 构建工具
- **PM2**: 进程管理
- **TypeScript**: 类型检查

## 📁 项目结构

```
webapp/
├── src/
│   ├── index.tsx              # 主应用入口
│   ├── routes/                # API 路由
│   │   ├── auth.ts           # 认证路由（注册/登录）
│   │   ├── reviews.ts        # 复盘记录路由
│   │   ├── teams.ts          # 团队管理路由
│   │   └── admin.ts          # 管理后台路由
│   ├── middleware/            # 中间件
│   │   └── auth.ts           # 认证中间件
│   └── utils/                 # 工具函数
│       ├── auth.ts           # 认证工具
│       └── db.ts             # 数据库工具
├── public/static/             # 静态文件
│   ├── app.js                # 前端应用逻辑
│   └── i18n.js               # 国际化配置
├── migrations/                # 数据库迁移
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_notifications.sql
│   └── 0003_add_review_types.sql  # 【新增】复盘分类字段
├── seed.sql                   # 种子数据
├── init-db.cjs               # 数据库初始化脚本
├── ecosystem.config.cjs      # PM2 配置
├── wrangler.json             # Cloudflare 配置
├── package.json              # 依赖配置
└── README.md                 # 本文档
```

## 🛠️ API 接口

### 认证相关

#### GET /api/auth/settings【V4.2.8 新增】
获取当前用户设置
```json
Headers: Authorization: Bearer {token}
Response: {
  "username": "用户名",
  "email": "user@example.com",
  "language": "zh"  // "zh" or "en"
}
```

#### PUT /api/auth/settings【V4.2.8 新增】
更新用户设置
```json
Headers: Authorization: Bearer {token}
Request: {
  "username": "新用户名",  // 可选
  "email": "newemail@example.com",  // 可选
  "language": "en"  // 可选，"zh" or "en"
}
Response: {
  "message": "Settings updated successfully",
  "user": { "id", "username", "email", "language", "role" }
}
```

#### POST /api/auth/change-password【V3.7 新增】
修改密码（需要认证）
```json
Headers: Authorization: Bearer {token}
Request: {
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
Response: {
  "message": "Password changed successfully"
}
```

#### POST /api/auth/reset-password【V3.7 新增】
重置密码（忘记密码）
```json
Request: {
  "email": "user@example.com",
  "newPassword": "new_password"
}
Response: {
  "message": "Password reset successfully"
}
```

#### POST /api/auth/register
注册新用户
```json
Request: {
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名"
}
Response: {
  "token": "jwt_token",
  "user": { "id", "email", "username", "role", "language" }
}
```

#### POST /api/auth/login
用户登录
```json
Request: {
  "email": "user@example.com",
  "password": "password123"
}
Response: {
  "token": "jwt_token",
  "user": { "id", "email", "username", "role", "language" }
}
```

#### POST /api/auth/google
Google OAuth 登录/注册
```json
Request: {
  "credential": "google_id_token"
}
Response: {
  "token": "jwt_token",
  "user": { "id", "email", "username", "role", "language" }
}
```

### 复盘记录相关

#### GET /api/reviews
获取用户可访问的所有复盘记录
```
Headers: Authorization: Bearer {token}
Response: {
  "reviews": [...]
}
```

#### GET /api/reviews/:id
获取单个复盘记录详情
```
Headers: Authorization: Bearer {token}
Response: {
  "review": {...},
  "collaborators": [...]
}
```

#### POST /api/reviews
创建新复盘记录
```json
Headers: Authorization: Bearer {token}
Request: {
  "title": "复盘主题",
  "team_id": 1,  // 可选，团队复盘时提供
  "group_type": "project",  // 【新增】群体类型：personal/project/team
  "time_type": "monthly",   // 【新增】时间类型：weekly/monthly/yearly
  "question1": "目标是...",
  "question2": "达成情况...",
  // ... question3-9
  "status": "draft"
}
Response: {
  "id": 1,
  "message": "Review created successfully"
}
```

#### PUT /api/reviews/:id
更新复盘记录
```json
Headers: Authorization: Bearer {token}
Request: {
  "title": "新标题",
  "group_type": "team",     // 【新增】可修改群体类型
  "time_type": "yearly",    // 【新增】可修改时间类型
  "question1": "更新的答案",
  "status": "completed"
}
Response: {
  "message": "Review updated successfully"
}
```

#### DELETE /api/reviews/:id
删除复盘记录（仅创建者）
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "Review deleted successfully"
}
```

#### POST /api/reviews/:id/collaborators
添加协作者（仅创建者）
```json
Headers: Authorization: Bearer {token}
Request: {
  "user_id": 2,
  "can_edit": true
}
Response: {
  "message": "Collaborator added successfully"
}
```

#### GET /api/reviews/:id/team-answers【V3.9 新增】
获取团队协作答案
```json
Headers: Authorization: Bearer {token}
Response: {
  "answersByQuestion": {
    "1": [
      {
        "user_id": 1,
        "username": "Alice",
        "email": "alice@example.com",
        "answer": "我的目标是...",
        "updated_at": "2025-10-13 10:30:00"
      }
    ]
  },
  "completionStatus": [
    {
      "user_id": 1,
      "username": "Alice",
      "completed_count": 9
    }
  ],
  "currentUserId": 1
}
```

#### PUT /api/reviews/:id/my-answer/:questionNumber【V3.9 新增】
保存我的答案
```json
Headers: Authorization: Bearer {token}
Request: {
  "answer": "这是我的回答..."
}
Response: {
  "message": "Answer saved successfully"
}
```

#### DELETE /api/reviews/:id/answer/:userId/:questionNumber【V3.9 新增】
删除成员答案（仅创建者）
```json
Headers: Authorization: Bearer {token}
Response: {
  "message": "Answer deleted successfully"
}
```

### 团队管理相关（需要 Premium/Admin 权限）

#### GET /api/teams
获取用户加入的所有团队
```
Headers: Authorization: Bearer {token}
Response: {
  "teams": [...]
}
```

#### GET /api/teams/:id
获取团队详情和成员列表
```
Headers: Authorization: Bearer {token}
Response: {
  "team": {...},
  "members": [...]
}
```

#### POST /api/teams
创建新团队
```json
Headers: Authorization: Bearer {token}
Request: {
  "name": "团队名称",
  "description": "团队描述"
}
Response: {
  "id": 1,
  "message": "Team created successfully"
}
```

#### PUT /api/teams/:id
更新团队信息（仅拥有者）
```json
Headers: Authorization: Bearer {token}
Request: {
  "name": "新名称",
  "description": "新描述"
}
Response: {
  "message": "Team updated successfully"
}
```

#### DELETE /api/teams/:id
删除团队（仅拥有者）
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "Team deleted successfully"
}
```

#### POST /api/teams/:id/members
添加团队成员（仅拥有者）
```json
Headers: Authorization: Bearer {token}
Request: {
  "user_id": 3
}
Response: {
  "message": "Member added successfully"
}
```

#### DELETE /api/teams/:id/members/:userId
移除团队成员（仅拥有者）
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "Member removed successfully"
}
```

### 管理后台相关（需要 Admin 权限）

#### POST /api/admin/users【V3.7 新增】
创建新用户（Admin 手动创建）
```json
Headers: Authorization: Bearer {token}
Request: {
  "email": "newuser@example.com",
  "password": "password123",
  "username": "用户名",
  "role": "user"  // user/premium/admin，可选，默认为 user
}
Response: {
  "message": "User created successfully",
  "user": {
    "id": 10,
    "email": "newuser@example.com",
    "username": "用户名",
    "role": "user"
  }
}
```

#### GET /api/admin/users
获取所有用户列表
```
Headers: Authorization: Bearer {token}
Response: {
  "users": [...]
}
```

#### PUT /api/admin/users/:id/role
修改用户角色
```json
Headers: Authorization: Bearer {token}
Request: {
  "role": "premium"  // user/premium/admin
}
Response: {
  "message": "User role updated successfully"
}
```

#### DELETE /api/admin/users/:id
删除用户
```
Headers: Authorization: Bearer {token}
Response: {
  "message": "User deleted successfully"
}
```

#### GET /api/admin/stats
获取系统统计数据
```
Headers: Authorization: Bearer {token}
Response: {
  "total_users": 10,
  "total_reviews": 25,
  "total_teams": 5,
  "users_by_role": [...]
}
```

#### POST /api/notifications/broadcast 【新增】
向所有用户群发通知
```json
Headers: Authorization: Bearer {token}
Request: {
  "title": "通知标题",
  "message": "通知内容"
}
Response: {
  "message": "Notification sent successfully",
  "recipient_count": 25
}
```

#### POST /api/notifications/send 【新增】
向指定用户发送通知（支持邮箱查找）
```json
Headers: Authorization: Bearer {token}
Request: {
  "user_ids": [2, 3, 5],  // 用户ID数组
  "title": "通知标题",
  "message": "通知内容"
}
Response: {
  "message": "Notification sent successfully",
  "recipient_count": 3
}
```

## 💻 本地开发

### 安装依赖
```bash
npm install
```

### 初始化数据库
```bash
node init-db.cjs
```

### 启动开发服务器
```bash
# 构建项目
npm run build

# 启动 PM2
pm2 start ecosystem.config.cjs

# 查看日志
pm2 logs review-system --nostream
```

### 测试 API
```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@review.com","password":"admin123"}'

# 获取复盘列表
curl -X GET http://localhost:3000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 使用指南

### 1. 注册和登录
- 访问应用主页
- 点击"注册"创建账号，或使用测试账号登录
- 系统支持中英文切换

### 2. 创建个人复盘
- 登录后点击"创建复盘"
- 填写复盘主题
- **选择群体类型**（个人/项目/团队）【新增】
- **选择时间类型**（周/月/年复盘）【新增】
- 选择团队（可选，仅限高级用户）
- 回答9个核心问题
- 保存为草稿或标记为完成

### 3. 团队复盘（高级用户）
- 创建或加入团队
- **通过邮箱邀请新成员**【新增】
- 在团队中创建复盘记录
- 团队成员可以共同编辑
- 添加协作者并设置编辑权限

### 4. 管理后台（管理员）
- 访问管理后台
- **用户管理标签页**：
  - 查看所有用户列表
  - 搜索和筛选用户
  - 调整用户角色权限
  - 删除用户账号
- **通知标签页【新增】**：
  - 群发通知给所有用户
  - 通过邮箱地址发送通知（逗号分隔多个邮箱）
  - 通过复选框选择用户发送通知
- **系统统计标签页**：
  - 查看用户数、复盘数、团队数
  - 用户角色分布统计

## 🚀 部署

### Cloudflare Pages 生产环境 ✅

**当前状态**: 已成功部署到生产环境

- **生产 URL**: https://review-system.pages.dev
- **项目名称**: review-system
- **数据库**: review-system-production (D1)
- **环境变量**: 已配置 4 个（Google OAuth + API Key）

### 快速部署命令

如需重新部署或更新：

```bash
# 1. 构建项目
npm run build

# 2. 部署到生产环境
npm run deploy:prod

# 3. 查看部署状态
npx wrangler pages deployment list --project-name review-system
```

### 详细部署文档

- **部署成功记录**: [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)
- **完整部署指南**: [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
- **自定义域名设置**: [CUSTOM_DOMAIN_SETUP.md](CUSTOM_DOMAIN_SETUP.md)

### 自定义域名绑定

如果您有自己的域名，可以绑定到 Cloudflare Pages：

```bash
# 绑定您的域名
npx wrangler pages domain add yourdomain.com --project-name review-system

# 详细步骤请查看: CUSTOM_DOMAIN_SETUP.md
```

**优势**:
- ✅ 完全免费（包括 SSL 证书）
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 无限带宽和请求
- ✅ 支持多个域名

## 🔄 当前完成功能

✅ 用户认证系统（注册、登录、JWT）
✅ 角色权限管理（管理员/高级用户/普通用户）
✅ 个人复盘记录 CRUD
✅ 复盘列表页面（带筛选、搜索、分类、分页）
✅ 复盘创建表单（支持个人和团队复盘）
✅ 复盘编辑功能（完整的9问编辑）
✅ 复盘详情页面（展示9问回答和协作者）
✅ 团队创建和管理
✅ 团队复盘协作
✅ 复盘协作者管理
✅ 管理后台（用户管理、统计数据）
✅ **复盘分类系统（群体类型 + 时间类型）** 【V2 新增】
✅ **增强通知系统（邮箱发送 + 选择发送）** 【V2 新增】
✅ **团队邀请和权限系统（创造者/操作者/观察者）** 【V2 新增】
✅ **营销主页和资源库** 【V3 新增】
✅ **资源链接修复（文章和视频直接可访问）** 【V3.1 修复】
✅ **Logo点击返回首页功能** 【V3.1 新增】
✅ **紧凑的资源列表样式** 【V3.2 优化】
✅ **首页显示登录用户名** 【V3.2 新增】
✅ **Google账号一键登录/注册** 【V3.3 新增】
✅ **团队协作复盘功能** 【V3.9 新增】
✅ **复盘列表分页功能（每页5条，支持上一页/下一页）** 【V4.1.2 新增】
✅ **团队成员退出权限（成员可主动退出团队）** 【V4.1.2 新增】
✅ 中英双语支持
✅ 响应式前端界面
✅ API 接口完整实现
✅ 数据库设计和迁移

## 🔜 推荐下一步开发

### 前端增强
1. ~~完善复盘详情页面~~ ✅ 已完成
   - ~~显示完整的9问回答~~ ✅
   - ~~编辑表单界面~~ ✅
   - ~~协作者管理界面~~ ✅

2. 团队管理页面
   - 团队列表展示
   - 成员管理界面
   - 团队复盘筛选

3. 管理后台界面
   - 用户管理表格
   - 统计数据可视化
   - 角色权限修改界面

### 功能扩展
4. 复盘模板功能
   - 预设复盘模板
   - 自定义问题集
   - 模板分享

5. 数据导出
   - PDF 导出复盘记录
   - Excel 批量导出
   - 数据分析报告

6. 通知系统
   - 团队协作通知
   - 复盘提醒
   - 邮件通知

7. 搜索和筛选
   - 全文搜索
   - 标签系统
   - 高级筛选

### 优化改进
8. 性能优化
   - 分页加载
   - 缓存策略
   - 图片优化

9. 安全增强
   - 密码强度要求
   - 登录失败限制
   - CSRF 保护

10. 用户体验
    - 加载动画
    - 错误提示优化
    - 响应式设计完善

## 📄 部署状态

- **平台**: Cloudflare Pages
- **生产环境**: ✅ 已发布 (https://review-system.pages.dev) - **V6.0.0-Phase1 最新生产部署**
- **GitHub 仓库**: ✅ 已开源 (https://github.com/Alan16168/review-system)
- **开发环境**: ✅ 运行中 (https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev)
- **技术栈**: Hono + TypeScript + Cloudflare D1
- **数据库**: ✅ review-system-production (D1) + 答案集合系统 (review_answer_sets + review_answers)
- **Google OAuth**: ✅ 已配置并启用
- **Google API**: ✅ 已配置（YouTube + Custom Search）
- **Google Calendar Integration**: ✅ 已完成并部署（V5.30.5）
- **Answer Sets System**: ✅ 阶段1已完成并部署（V6.0.0-Phase1 - 统一答案管理）
- **PayPal Integration**: ✅ 升级和续费都添加到购物车，统一结算
- **环境变量**: ✅ 已配置 4 个生产环境变量
- **自定义域名**: ⏳ 待绑定（完全免费）
- **许可证**: MIT License
- **最后更新**: 2025-11-13 16:28 UTC
- **当前版本**: V6.0.0-Phase1-Fix（答案集合系统完整修复）✅ 已发布到生产环境

## 📝 许可证

MIT License

---

**开发者**: Claude AI Assistant  
**创建日期**: 2025-10-07  
**当前版本**: V5.24.0  

**V5.22.1 更新内容** (2025-11-10):
- 🐛 **修复折叠/展开功能不工作的Bug**（关键修复）：
  - **问题**: 点击"展开"按钮没有反应，答案无法显示
  - **根本原因**: toggleAnswer函数被定义在HTML模板内的`<script>`标签中
    - 函数在模板字符串内部，导致作用域问题
    - 无法正确访问i18n对象
    - 每次渲染页面时重复定义
  - **解决方案**:
    - ✅ 将toggleAnswer函数移到全局作用域
    - ✅ 在showReviewDetail函数之前定义
    - ✅ 添加DOM元素null检查，提高健壮性
    - ✅ 移除HTML模板中的`<script>`标签
  - **修复效果**:
    - ✅ 点击"展开"按钮正常显示答案
    - ✅ 点击"收起"按钮正常隐藏答案
    - ✅ 图标正确切换（↓ ⇄ ↑）
    - ✅ 按钮文字正确更新（展开 ⇄ 收起）
- ✅ **部署状态**: 已成功部署到生产环境（https://b6026eea.review-system.pages.dev）

**V5.22 更新内容** (2025-11-10):
- 📁 **复盘查看页面折叠/展开功能**（用户体验重大改进）：
  - **问题**: 查看复盘时所有答案强制显示，页面很长，需要大量滚动
  - **用户需求**: 
    1. 每个问题旁边增加折叠按钮
    2. 答案默认隐藏（折叠状态）
    3. 点击按钮展开/收起答案
    4. 减少空白，更紧凑显示
  - **解决方案**:
    - ✅ 新增"展开/收起"按钮（蓝色圆角，带图标）
    - ✅ 答案默认隐藏（hidden class）
    - ✅ 点击展开：显示答案，图标从↓变为↑，文字从"展开"变为"收起"
    - ✅ 点击收起：隐藏答案，图标从↑变为↓，文字从"收起"变为"展开"
    - ✅ 每个问题独立控制，互不影响
  - **紧凑显示优化**:
    - ✅ 移除问题间大间距（space-y-6 → 无间距）
    - ✅ 使用底部边框分隔问题（border-b）
    - ✅ 减小内边距（py-2 → py-3）
    - ✅ 优化答案卡片样式（更紧凑的padding）
    - ✅ 调整字体大小（text-sm）
  - **JavaScript实现**:
    - 新增 toggleAnswer() 函数控制折叠/展开
    - 使用 classList 操作隐藏/显示
    - 动态更新图标和文字
  - **国际化支持**:
    - 新增翻译键：expand（展开/Expand）
    - 新增翻译键：collapse（收起/Collapse）
  - **修复效果**:
    - ✅ 页面更简洁，一次可看到更多问题
    - ✅ 按需查看答案，减少滚动
    - ✅ 用户体验大幅提升
- ✅ **部署状态**: 已成功部署到生产环境（https://07f88720.review-system.pages.dev）

**V5.21 更新内容** (2025-11-10):
- 🔧 **修复团队邀请验证端点**（关键修复）：
  - **问题**: 点击邮件中的"Accept Invitation & Join"链接显示"Invitation link is invalid or expired"错误
  - **根本原因**: 验证端点 `/api/teams/invitations/verify/:token` 被authMiddleware保护，需要登录才能访问
  - **解决方案**:
    - 将公开验证端点定义移到 `teams.use('/*', authMiddleware)` 之前
    - 删除重复的验证端点定义（原在line 648-686）
    - 确保未登录用户可以验证邀请链接
  - **修复效果**:
    - ✅ 邀请链接现在正常工作
    - ✅ 返回团队详细信息（team_name, inviter_name, role等）
    - ✅ 用户可以看到团队邀请落地页
    - ✅ 登录/注册后自动加入团队
- 🧹 **代码优化**:
  - 删除重复的验证端点代码
  - 清理冗余逻辑
  - 改进端点注释和文档
- 📊 **测试验证**:
  - ✅ 测试token: K4vck3Q2ithmw78Wu7wyr9QUkRF8FfHf
  - ✅ API响应成功返回团队信息
  - ✅ 邀请邮件链接格式: `/?team_invite={token}`
  - ✅ 完整流程已验证（从邮件→验证→登录→加入团队）
- ✅ **部署状态**: 已成功部署到生产环境（https://ddd815d0.review-system.pages.dev）

**V5.18.3 更新内容** (2025-11-10):
- 🔄 **邀请注册流程优化**（用户体验改进）：
  - **问题**: 用户通过邀请链接注册后，自动登录进入工作台
  - **用户反馈**: 希望注册后返回登录界面，让用户手动登录
  - **解决方案**:
    - 注册成功后清除所有认证数据（token、currentUser）
    - 显示友好的成功消息："注册成功！请使用您的账号登录"
    - 1.5秒后自动跳转到登录界面
  - **修复效果**:
    - ✅ 用户注册完成后看到成功提示
    - ✅ 自动跳转到登录界面
    - ✅ 需要手动输入账号密码登录
    - ✅ 更符合传统的注册-登录流程
- ✅ **部署状态**: 已成功部署到生产环境（https://5bd14541.review-system.pages.dev）

**V5.18.2 更新内容** (2025-11-10):
- 🐛 **修复三个关键Bug**（重要修复）：
  1. **注册后页面显示"Operation failed"错误**：
     - **问题**: 新用户注册后，工作台页面显示"Operation failed"
     - **根本原因**: `loadDashboardData()` 异步调用未被await，且元素可能不存在时访问导致错误
     - **解决方案**: 
       - 在 `showDashboard()` 中使用 `await loadDashboardData()`
       - 为所有DOM元素访问添加null检查
       - 为空数据设置默认值（显示0而不是错误）
     - **修复效果**: ✅ 新用户注册后正常显示工作台，统计数据显示0
  
  2. **邀请邮件发送失败**：
     - **问题**: 点击"发送邮件"按钮后邮件未发送
     - **根本原因**: `sendEmail()` 函数签名不匹配，传入参数格式错误
     - **解决方案**: 修改 `src/routes/invitations.ts` 中的邮件发送调用，使用正确的对象参数格式
     - **修复效果**: ✅ 邀请邮件现在能够成功发送到指定邮箱
  
  3. **团队成员邀请邮件未发送**：
     - **问题**: 在团队中添加成员时，成员未收到通知邮件
     - **根本原因**: 该功能完全不存在
     - **解决方案**: 
       - 在 `src/routes/teams.ts` 中添加 `sendEmail` 导入
       - 在添加成员后发送精美的HTML欢迎邮件
       - 邮件包含团队信息、成员角色和访问链接
     - **修复效果**: ✅ 新成员现在会收到团队邀请通知邮件
- ✅ **部署状态**: 已成功部署到生产环境（https://2e1446aa.review-system.pages.dev）

**V5.18.1 更新内容** (2025-11-10):
- 🐛 **修复邀请链接显示错误**（关键Bug修复）：
  - **问题**: 点击邀请链接显示"Invitation link is invalid or expired"
  - **根本原因**: 两个独立的问题
    1. 后端API错误：review_answers表JOIN使用错误的列名（question_id应该是question_number）
    2. 前端初始化顺序：checkAuth()函数在检查邀请token之前就渲染了其他页面
  - **解决方案**:
    1. 修复后端：src/routes/invitations.ts中的SQL JOIN从 `ra.question_id = tq.id` 改为 `ra.question_number = tq.question_number`
    2. 修复前端：将邀请token检查移到checkAuth()函数最开始，作为最高优先级
    3. 移除冗余代码：删除重复的checkInvitationToken()函数和初始化代码
  - **修复效果**:
    - ✅ 邀请链接现在正确显示邀请落地页
    - ✅ 复盘内容和答案正确加载
    - ✅ 注册按钮和邀请人信息正常显示
    - ✅ 页面初始化流程更加清晰
- ✅ **部署状态**: 已成功部署到生产环境（https://adb591f0.review-system.pages.dev）

**V5.18.0 更新内容** (2025-11-10):
- 🎁 **完整的邀请系统**（重大新功能）：
  - **核心功能**：用户可邀请他人加入Review System并分享复盘内容
  - **邀请按钮**：在复盘列表（工作台、我的复盘）每行添加紫色"邀请"按钮
  - **邀请模态框**：点击邀请按钮打开模态框，提供三种分享方式：
    - ✅ 邀请链接：生成唯一邀请URL，30天有效期，一键复制
    - ✅ 二维码：自动生成QR Code，方便移动端扫描分享
    - ✅ 邮件邀请：支持发送到多个email地址（逗号分隔）
  - **邀请落地页**：精美的邀请页面，包含：
    - 复盘内容预览（显示前3个问题）
    - 邀请人信息展示
    - 注册CTA按钮（渐变紫色）
  - **介绍人追踪系统**：
    - users表新增 `referred_by` 字段（存储介绍人user_id）
    - 所有现有用户默认介绍人：dengalan@gmail.com (user_id=4)
    - 新用户注册时自动记录介绍人
  - **注册集成**：
    - 通过邀请链接注册自动设置介绍人关系
    - 邀请token验证和使用追踪
    - sessionStorage存储referral_token
- 📊 **数据库架构**：
  - 新增 `invitations` 表：token, review_id, referrer_id, expires_at, used_at等
  - users表新增 `referred_by` 列
  - 创建索引优化查询性能
- 🔌 **后端API**（3个新端点）：
  - POST /api/invitations/create - 生成邀请链接
  - POST /api/invitations/send-email - 发送邀请邮件
  - GET /api/invitations/verify/:token - 验证邀请并返回复盘内容
  - 修改 POST /api/auth/register 支持 referral_token 参数
- 🌐 **国际化**：新增20+个翻译键（invite, invitationLink, qrCode, sendByEmail等）
- 🎨 **UI/UX优化**：
  - 邀请按钮使用紫色主题，与删除红色、编辑蓝色区分
  - 二维码使用QRCode.js CDN库生成
  - 邀请落地页使用渐变背景和卡片设计
  - 精美的HTML邮件模板
- ✅ **部署状态**: 已成功部署到生产环境（https://be8529a4.review-system.pages.dev）

**V5.17.0 更新内容** (2025-11-10):
- 📊 **管理后台用户列表增强**（新增功能）：
  - **新增"有效期限"列**：显示用户订阅到期日期（subscription_expires_at）
  - **列位置**：插入在"最后登录"和"创建时间"列之间
  - **智能显示逻辑**：
    - ✅ Premium 用户：显示实际到期日期（如：2026-10-09，黑色加粗字体）
    - ✅ Admin 用户（年份=9999）：显示"永久"（灰色字体）
    - ✅ 未订阅用户（NULL）：显示"永久"（灰色字体）
  - **国际化支持**：
    - 中文：有效期限、永久
    - 英文：Expiry Date、Forever
  - **数据来源**：users 表的 subscription_expires_at 字段
- 🎨 **用户体验改进**：
  - 管理员可以清晰看到每个用户的实际订阅到期日期
  - 便于管理和追踪订阅到期时间
  - 与用户设置页面的订阅信息保持一致
- 🐛 **关键修复**：
  - 修复前端显示逻辑：正确区分永久权限和订阅到期
  - **修复后端API**：在 `/api/admin/users` 返回数据中添加 `subscription_expires_at` 字段
  - 修复所有用户都显示"Forever"的根本问题
- ✅ **部署状态**: 已成功部署到生产环境（https://519cada7.review-system.pages.dev）

**V5.16.1 更新内容** (2025-11-09):
- 🐛 **关键Bug修复**（用户权限刷新问题）：
  - **问题**: 用户升级或续费后，虽然数据库角色已更新，但前端菜单没有显示高级用户功能
  - **症状**: 升级后看不到"团队"菜单，需要手动刷新页面
  - **根本原因**: localStorage中的currentUser没有更新
  - **解决方案**: 支付成功后自动调用 /api/auth/settings 刷新用户信息
  - **修复效果**: ✅ 升级后立即显示所有高级用户功能，无需手动刷新
- 🔄 **PayPal环境切换**: 从Sandbox测试环境切换到Live生产环境，支持真实支付
- 📝 **新增文档**: USER_UPGRADE_PERMISSION_FIX.md、PAYPAL_LIVE_DEPLOYMENT.md等4份文档
- ✅ **部署状态**: 已成功部署（https://d184c872.review-system.pages.dev）

**V5.16.0 更新内容** (2025-11-09):
- 🛒 **购物车结算确认按钮**（核心功能完善）：
  - **新增"确认支付"按钮**：结算界面右下角蓝色按钮
  - **支付方式选择**：
    - PayPal按钮：标准的PayPal支付流程（推荐）
    - 确认支付按钮：备用的直接支付方式（测试环境）
  - **加载体验优化**：
    - 显示"正在加载PayPal..."加载指示器
    - PayPal加载成功后自动隐藏加载指示器
    - 2秒超时确保加载指示器不会一直显示
  - **防止重复操作**：
    - 点击确认按钮后自动禁用，显示"处理中..."
    - 防止用户重复点击导致多次支付
  - **智能支付流程**：
    - 点击确认支付显示确认对话框（显示总金额）
    - 创建PayPal订单
    - 捕获支付并更新用户订阅
    - 清空购物车并刷新页面
  - **按钮布局优化**：
    - 左侧：取消按钮（灰色）
    - 右侧：确认支付按钮（蓝色）
    - 两个按钮并排显示，操作更直观
- 🌐 **新增7个国际化翻译**：
  - confirmPayment: 确认支付 / Confirm Payment
  - loadingPayPal: 正在加载PayPal... / Loading PayPal...
  - processing: 处理中... / Processing...
  - redirectingToPayPal: 正在跳转到PayPal... / Redirecting to PayPal...
  - pleaseUsePayPalButton: 请使用PayPal按钮完成支付
  - paypalNotLoaded: PayPal未加载，请刷新页面
  - orderSummary: 订单摘要 / Order Summary
- 🔧 **代码优化**：
  - 改进PayPal按钮初始化逻辑
  - 增强错误处理和日志记录
  - 简化按钮显示/隐藏逻辑
  - 添加全局 currentCheckoutItems 变量管理购物车数据
- 💳 **PayPal配置**：
  - 生产环境已配置 PAYPAL_CLIENT_ID
  - 生产环境已配置 PAYPAL_CLIENT_SECRET
  - 生产环境已配置 PAYPAL_MODE=sandbox
  - PayPal SDK正确加载并显示Client ID
- ✅ **部署状态**: 已成功部署到生产环境（https://ec91d0ed.review-system.pages.dev）
- 💾 **备份完成**: 项目备份已上传（review-system-shopping-cart-complete.tar.gz）

**V5.15.3 更新内容** (2025-11-09):
- 🔄 **续费按钮改进**（用户体验统一）：
  - **变更前**: 高级用户点击"续费"按钮，直接显示 PayPal 支付模态框
  - **变更后**: 点击"续费"按钮，将续费服务添加到购物车
  - **统一行为**: 升级和续费按钮现在行为完全一致，都是添加到购物车
  - **用户体验**: 用户可以先将服务添加到购物车，稍后统一结算
  - **智能价格**: 续费使用 `renewal_price`（续费价格），升级使用 `price`（标准价格）
- 🐛 **Bug修复**（关键修复）：
  - **问题**: 点击"续费"按钮显示"操作失败"
  - **原因**: `showRenewModal` 函数调用了不必要的 `/api/auth/settings` API
  - **解决**: 移除不需要的 API 调用，只获取订阅配置信息
  - **影响**: 高级用户现在可以正常点击续费按钮并添加到购物车
- 🛒 **购物车使用流程**：
  1. 免费用户点击"升级"→ 添加升级服务到购物车
  2. 高级用户点击"续费"→ 添加续费服务到购物车
  3. 点击购物车图标 → 查看所有商品
  4. 点击"结算"按钮 → PayPal 一次性支付所有商品
- 💾 **代码优化**：
  - 移除 `closeUpgradeModal()` 函数（不再需要）
  - 移除 `closeRenewModal()` 函数（不再需要）
  - 简化 `showRenewModal()` 函数逻辑（直接添加到购物车）
  - 移除不必要的 API 调用
  - 减少 100+ 行冗余代码
- ✅ **部署状态**: 已成功部署到生产环境（https://c50cc22d.review-system.pages.dev）

**V5.15.2 更新内容** (2025-11-09):
- 🛒 **购物车系统**（核心新功能）：
  - **完整的购物车CRUD**：创建、查看、删除单个商品、清空购物车
  - **购物车UI组件**：
    - 导航栏购物车图标 + 商品数量徽章（红色圆形，显示商品数量）
    - 购物车模态框显示商品列表（商品名称、价格、天数、删除按钮）
    - 商品总价计算和显示
    - "结算"按钮跳转到PayPal支付
  - **数据库表**：新增 shopping_cart 表（Migration 0022）
    - 字段：user_id, item_type, subscription_tier, price_usd, duration_days, description
    - 支持中英双语商品描述（description 和 description_en）
  - **后端API**：
    - GET /api/cart - 获取用户购物车
    - POST /api/cart - 添加商品到购物车（防止重复添加）
    - DELETE /api/cart/:id - 删除单个商品
    - DELETE /api/cart - 清空购物车
    - GET /api/cart/total - 获取购物车总价
- 💳 **PayPal多商品结算**（核心功能扩展）：
  - **购物车支付端点**：
    - POST /api/payment/cart/create-order - 创建购物车订单
    - POST /api/payment/cart/capture-order - 完成购物车支付
  - **多商品订单创建**：
    - 从购物车读取所有商品
    - 创建包含多个item的PayPal订单
    - 显示商品明细和总价
  - **支付成功处理**：
    - 更新用户 role 为 premium
    - 计算并设置 subscription_expires_at（从当前到期日期延长，或从今天开始）
    - 为每个购物车商品创建支付记录
    - 清空购物车
    - 显示成功通知并刷新页面
- 🔄 **升级按钮行为改进**（用户体验优化）：
  - **旧行为**：点击"升级"按钮直接显示PayPal支付模态框
  - **新行为**：点击"升级"按钮添加商品到购物车
  - **智能识别**：
    - role='user' → 添加 upgrade 商品（使用 premium.price）
    - role='premium' → 添加 renewal 商品（使用 premium.renewal_price）
  - **防止重复**：同一类型商品不能重复添加到购物车
  - **用户反馈**：添加成功显示通知，更新购物车徽章数量
- 🌐 **国际化支持**：新增18个购物车相关翻译键
  - shoppingCart（购物车）
  - addToCart（添加到购物车）
  - removeFromCart（从购物车移除）
  - clearCart（清空购物车）
  - cartEmpty（购物车是空的）
  - checkout（结算）
  - itemAlreadyInCart（该商品已在购物车中）
  - addedToCart（已添加到购物车）
  - removedFromCart（已从购物车移除）
  - cartCleared（购物车已清空）
  - viewCart（查看购物车）
  - proceedToCheckout（前往结算）
  - checkoutProcessing（正在处理支付）
  - emptyCartMessage（您的购物车是空的...）
  - continueShopping（继续购物）
  - upgradeService（升级服务）
  - renewalService（续费服务）
  - cartPaymentSuccess（购物车支付成功）
- 🐛 **Bug修复**：
  - 修复 showUpgradeModal 函数的重复 try-catch 块
  - 确保购物车徽章只在有商品时显示
  - 优化购物车数据同步逻辑
- 📊 **数据库迁移**：0022_create_shopping_cart.sql
- ✅ **部署状态**: 已成功部署到生产环境（https://6db9e254.review-system.pages.dev）

**V5.14.0 更新内容** (2025-11-09):
- 🔧 **修复团队复盘访问权限**（核心Bug修复）：
  - **问题**: 团队成员在"我的复盘"中能看到团队复盘，但点击"查看/编辑/打印"时提示"Review not found or access denied"
  - **根本原因**: GET /api/reviews/:id 的WHERE条件仍然使用旧逻辑，只检查 `owner_type='team'`
  - **解决方案**: 修改查询条件为：
    - `r.user_id = ?` (创建者)
    - `r.team_id IS NOT NULL AND EXISTS (team_members)` (团队成员)
    - `r.owner_type = 'public'` (公开复盘)
    - `EXISTS (review_collaborators)` (协作者)
  - **修复效果**:
    - ✅ 团队成员现在可以成功查看团队复盘详情
    - ✅ 团队成员可以编辑团队复盘
    - ✅ 团队成员可以打印团队复盘
    - ✅ 与"我的复盘"列表权限完全一致
- 💳 **完整的用户级别管理系统**（核心新功能）：
  - **用户级别管理区域**: 
    - 位置：用户设置页面
    - 显示对象：role='user' 和 role='premium'（管理员不显示）
    - 标题："用户级别管理"
  - **免费用户 (role='user') 显示**:
    - 当前级别：免费用户（灰色用户图标）
    - 有效期：永久 (Forever)
    - 功能按钮：升级（紫色渐变）
    - 点击升级：打开PayPal支付模态框
  - **高级用户 (role='premium') 显示**:
    - 当前级别：高级用户（金色Crown图标）
    - 有效期：具体到期日期 (如：2025-12-09)
    - 剩余天数：动态计算剩余天数
    - 功能按钮：续费（绿色渐变）
    - 点击续费：打开PayPal支付模态框
  - **PayPal支付模态框**:
    - 智能识别升级/续费场景
    - 升级：显示"升级到高级用户"标题 + 功能列表
    - 续费：显示"续费订阅"标题 + 当前到期日期 + 延长说明
    - 显示价格：默认$20（可在管理后台配置）
    - 显示期限：365天
    - PayPal按钮：直接支付
    - 支付成功：自动更新用户级别 + 设置到期日期
- 🎨 **UI/UX优化**:
  - 三栏网格布局：当前级别 | 有效期 | 操作按钮
  - 蓝色渐变背景卡片
  - 不同角色不同颜色主题
  - 按钮悬停动画效果（scale-105）
- 🌐 **国际化增强**:
  - 新增13个翻译键（中英双语）
  - 完整的升级/续费流程翻译
  - 日期和天数动态计算显示
- 📊 **后端支持**:
  - 使用现有的 /api/payment/subscription/* API
  - 支付成功后自动设置 subscription_expires_at
  - 续费时从当前到期日期延长365天
- ✅ **部署状态**: 已成功部署到生产环境（https://79acc64f.review-system.pages.dev）

**V5.13.0 更新内容** (2025-11-09):
- 📋 **修正"我的复盘"列表显示**（核心Bug修复）：
  - **问题**: 团队成员在"我的复盘"中看不到所属团队的复盘
  - **根本原因**: 查询逻辑过于严格，只包含 owner_type='team' 的复盘
  - **解决方案**: 修改查询逻辑，包含所有满足以下条件的复盘：
    1. 用户创建的复盘（任何owner_type）
    2. 有team_id且用户是团队成员的复盘（任何owner_type）
    3. 用户是协作者的复盘
  - **修复效果**:
    - ✅ 团队成员现在可以在"我的复盘"中看到团队的所有复盘
    - ✅ 可以查看、编辑和打印团队复盘
    - ✅ 不再遗漏任何团队创建的review
- 👤 **用户升级功能**（新增功能）：
  - **用户管理区域**: role='user'的用户在设置页面新增"用户管理"部分
  - **当前级别显示**: 显示"免费用户"标识和说明
  - **升级按钮**: 提供"升级账户"按钮，点击后显示联系管理员升级的提示
  - **UI设计**: 
    - 渐变紫色背景卡片，醒目的crown图标
    - 说明升级后的高级功能（创建团队、邀请成员、团队协作）
    - 悬停动画效果
  - **权限说明**: 清晰解释升级到高级用户的好处
- 📊 **后端API优化** (src/routes/reviews.ts):
  - GET /api/reviews 查询逻辑简化
  - 使用 `r.team_id IS NOT NULL` 检查团队复盘
  - 排除 owner_type='public' 的复盘（公开复盘在专用页面显示）
- 🌐 **国际化增强**:
  - 新增 'upgradeAccount': '升级账户' / 'Upgrade Account'
  - 新增 'upgradeToPremiumDesc': 升级功能说明
  - 新增 'upgradeToPremiumConfirm': 升级确认对话框文本
  - 新增 'contactAdminForUpgrade': 联系管理员提示
- ✅ **部署状态**: 已成功部署到生产环境（https://9b77147c.review-system.pages.dev）

**V5.12.0 更新内容** (2025-11-09):
- 🗑️ **删除订阅管理功能**（用户要求）：
  - 完全移除用户设置页面的订阅管理区域
  - 移除升级、续约按钮和订阅信息显示
  - 简化用户设置界面，只保留账号设置和密码管理
- 👥 **修正团队成员权限**（核心Bug修复）：
  - **问题**: 团队成员无法编辑、查看和打印团队创建的review
  - **根本原因**: 前端权限检查逻辑过于复杂，依赖group_type和owner_type
  - **解决方案**:
    1. **后端API增强**: 
       - GET /api/reviews 返回每个review的 is_team_member 标志
       - GET /api/reviews/:id 返回 is_team_member 标志
       - GET /api/reviews/public 已有 is_team_member 标志
    2. **前端权限简化**:
       - canEditReview() 逻辑简化为: 管理员 OR 创建者 OR (有team_id且is_team_member)
       - 移除对group_type和owner_type的复杂判断
       - 统一使用is_team_member标志判断团队成员身份
  - **修复效果**:
    - ✅ 团队成员现在可以编辑团队的review（显示编辑按钮）
    - ✅ 团队成员可以查看团队的review详情
    - ✅ 团队成员可以打印团队的review
    - ✅ 权限逻辑统一，不再有边界情况
- 📊 **数据库查询优化**: 
  - 所有review列表查询统一添加团队成员检查
  - 使用Promise.all并行查询，提升性能
- ✅ **部署状态**: 已成功部署到生产环境（https://ad35b6f0.review-system.pages.dev）

**V5.11.0 更新内容** (2025-11-09):
- 💳 **PayPal订阅支付系统术语更新**（用户体验优化）：
  - **订阅管理显示优化**：
    - ✅ role='admin'（管理员）不显示订阅管理区域
    - ✅ role='premium'（高级用户）显示订阅管理
    - ✅ subscription_tier显示为"高级用户"（中文）或"Premium User"（英文）
    - ✅ 续约按钮文字改为"续约"（中文）/"Renew"（英文）
    - ✅ 到期日期prominently显示
  - **国际化翻译更新**：
    - 新增 'premiumUser': '高级用户' / 'Premium User'
    - 新增 'freeUser': '免费用户' / 'Free User'
    - 修改 'renewSubscription': '续约' / 'Renew'（原为'续费订阅'/'Renew Subscription'）
  - **数据同步**：subscription_tier始终与role字段保持同步
  - **到期计算**：默认365天从注册日或最后支付日起算
- 🎨 **前端UI优化**：
  - 用户设置页面订阅管理区域根据角色智能显示/隐藏
  - 高级用户看到完整订阅信息和续约按钮
  - 管理员不看到订阅管理（管理员不需要订阅）
- 📊 **后端逻辑**：
  - 支付成功后同时更新 role='premium' 和 subscription_tier='premium'
  - 订阅过期后同时降级 role='user' 和 subscription_tier='free'
  - 确保两个字段永远保持一致
- ✅ **部署状态**: 已成功部署到生产环境（https://9fb312fe.review-system.pages.dev）

**V5.20 更新内容** (2025-11-10):
- 🎨 **管理后台用户编辑功能增强**（全面升级）：
  - **背景**: 原先只能编辑用户名、邮箱、角色三个字段，其他用户信息无法修改
  - **新增可编辑字段**:
    - ✅ 语言偏好（中文/英文）
    - ✅ 订阅等级（免费/高级）
    - ✅ 订阅到期时间（可留空表示永不过期）
    - ✅ 介绍人ID（推荐人用户ID）
    - ✅ 登录次数（可手动调整）
  - **新增只读显示字段**:
    - 📖 最后登录时间（格式化显示）
    - 📖 账号创建时间（格式化显示）
    - 📖 最后更新时间（格式化显示）
  - **UI优化**:
    - 采用响应式两列网格布局
    - 移动端自动切换为单列
    - 支持模态框内滚动
    - 只读字段灰色背景区分
  - **后端增强**:
    - PUT /api/admin/users/:id 接受所有新字段
    - 添加字段验证（语言、订阅等级）
    - 动态SQL构建，只更新变化的字段
  - **测试场景**:
    - ✅ 修改用户语言偏好
    - ✅ 调整订阅等级和到期时间
    - ✅ 设置介绍人关系
    - ✅ 查看登录统计信息
- 📝 **复盘邀请页面优化**（用户体验提升）：
  - **页面标题更新**:
    - 中文：'查看分享的复盘' → '加入分享的复盘'
    - 英文：'View Shared Review' → 'Join Shared Review'
    - 更准确反映用户将要执行的动作
  - **登录按钮优化**:
    - 将小文本链接"点击登录"替换为醒目按钮
    - 白色背景 + 靛蓝边框的轮廓按钮样式
    - 添加登录图标，提升视觉识别度
    - 按钮链接到主站：https://ireviewsystem.com
    - 悬停效果和缩放动画
  - **视觉层次改进**:
    - 注册按钮保持主要操作样式（紫色渐变）
    - 登录按钮作为次要操作（白色轮廓）
    - "已有账号？"提示文字缩小为灰色辅助文本
    - 更清晰的操作引导
- 🎯 **完整的中英双语支持**:
  - 新增i18n翻译键：订阅等级、介绍人ID、登录次数、最后登录时间等
  - 所有新增UI元素完整支持中英文切换
- ✅ **部署状态**: 已成功部署到生产环境（https://17ff7a05.review-system.pages.dev）

**V5.19 更新内容** (2025-11-10):
- 🎉 **团队邀请系统增强 - 支持邀请未注册用户**（重大功能升级）：
  - **背景**: 原系统只能邀请已注册的用户，当邀请新用户时显示"User not found"错误
  - **新功能**:
    - ✅ 邀请任何邮箱地址加入团队，无论是否已注册
    - ✅ 系统自动检测邮箱是否已注册：
      - 已注册用户：立即添加到团队 + 发送欢迎邮件
      - 未注册用户：创建邀请令牌 + 发送邀请邮件
    - ✅ 发送精美的HTML邀请邮件，包含：
      - 团队信息（名称、描述、邀请人）
      - 用户角色说明（Creator/Viewer/Operator）
      - 团队成员权益列表
      - 接受邀请按钮（跳转到专属邀请页面）
    - ✅ 受邀者访问邀请链接后：
      - 显示精美的团队邀请落地页
      - 可选择"登录"或"注册"按钮
      - 登录/注册成功后自动加入团队
      - 自动跳转到团队管理页面
    - ✅ 邀请链接有效期30天
    - ✅ 完整的中英双语支持
  - **数据库变更**:
    - 新增 `team_invitations` 表：
      - token: 32位随机字符串（唯一索引）
      - team_id, inviter_id, invitee_email, role
      - status: pending/accepted
      - expires_at, accepted_at, accepted_by_user_id
  - **后端实现**:
    - `/api/teams/:id/members` POST: 增强逻辑支持非成员邀请
    - `/api/teams/invitations/verify/:token` GET: 验证邀请令牌
    - `/api/teams/invitations/accept/:token` POST: 接受邀请
  - **前端实现**:
    - `showTeamInvitationLandingPage()`: 展示团队邀请页面
    - `acceptTeamInvitation()`: 登录/注册后自动接受邀请
    - URL参数 `?team_invite=<token>` 触发邀请流程
  - **测试场景**:
    - ✅ 邀请已注册用户 → 立即加入 + 收到欢迎邮件
    - ✅ 邀请未注册用户 → 收到邀请邮件 → 注册 → 自动加入团队
    - ✅ 邀请未注册用户 → 收到邀请邮件 → 登录已有账号 → 自动加入团队
    - ✅ 邀请链接过期 → 显示友好错误提示
- 🐛 **修复数据库迁移错误**:
  - 修复 `0014_unify_answer_tables_safe.sql` 和 `0014_unify_answer_tables_v2.sql`
  - 移除对不存在的 `team_review_answers` 表的引用
  - 确保 `npm run db:reset` 命令正常运行
- 🎯 **用户体验提升**:
  - 团队管理员可以自由邀请任何人加入团队
  - 新用户可以通过邀请链接快速了解团队并注册
  - 整个流程无缝衔接，无需手动操作
- ✅ **部署状态**: 待部署到生产环境

**V5.10.2 更新内容** (2025-10-17):
- 🔐 **修复团队成员编辑公开复盘权限**（关键权限修复）：
  - **问题**: 公开复盘（owner_type='public' 且 group_type='team'）的团队成员无法看到"编辑"按钮
  - **原因**: 
    1. 后端 `/api/reviews/public` 端点未返回团队成员信息
    2. 前端 `canEditReview()` 无法判断当前用户是否为团队成员
  - **解决方案**:
    1. **后端修复**: 为每个复盘查询 team_members 表，返回 `is_team_member` 标志
    2. **前端修复**: 检查 `is_team_member` 标志判断编辑权限
  - **权限规则**（完整）:
    - ✅ 管理员: 可以编辑任何公开复盘
    - ✅ 创建者: 可以编辑自己的公开复盘
    - ✅ 团队成员: 可以编辑团队的公开复盘（group_type='team' 或 owner_type='team'）
    - ❌ 其他用户: 无法编辑（按钮隐藏）
  - **测试场景**:
    - ✅ 公开 + 团队类型 + 团队成员 = 显示编辑按钮
    - ✅ 公开 + 个人类型 + 非创建者 = 隐藏编辑按钮
    - ✅ 团队主人 + 团队成员 = 显示编辑按钮
- 🎯 **用户体验改进**: 团队成员现在可以正常编辑团队的公开复盘
- ✅ **部署状态**: 已成功部署到生产环境（https://42279336.review-system.pages.dev）

**V5.10.1 更新内容** (2025-10-17):
- 🐛 **修复公开复盘编辑按钮**（关键Bug修复）：
  - **问题**: "公开的复盘"页面点击"编辑"按钮无响应
  - **原因**: 按钮调用不存在的 `viewReview()` 函数
  - **解决**: 将函数调用改为正确的 `showEditReview()` 函数
  - **影响范围**: 两处修复
    1. 公开的复盘列表页面（renderPublicReviewsList）
    2. 管理员面板公开复盘管理（adminEditPublicReview）
  - **测试验证**: 
    - ✅ 创建者可以编辑自己的公开复盘
    - ✅ 管理员可以编辑任何公开复盘
    - ✅ 团队成员可以编辑团队公开复盘
- 🎯 **用户体验改进**: 用户现在可以正常编辑公开复盘，功能完全恢复
- ✅ **部署状态**: 已成功部署到生产环境（https://5b29d4df.review-system.pages.dev）

**V5.6.6 更新内容** (2025-10-16):
- 👥 **团队介绍更新**（品牌优化）：
  - **精简团队展示**: 从3人精简为2人
  - **核心团队成员**:
    - **Alan** - 创始人 & CEO
      - 18年企业管理经验
      - 致力于推动组织学习和知识管理
    - **Helen** - 设计负责人
      - 平台设计师
      - 追求极致的用户体验
  - **UI优化**:
    - 布局从3列改为2列居中显示
    - 增大头像尺寸和图标（w-28 h-28，text-5xl）
    - 增加卡片内边距（p-8）
    - 增大标题字体（text-2xl）
    - 使用 max-w-4xl 限制最大宽度，视觉更集中
  - **国际化支持**: 中英双语完整更新
- ✅ **部署状态**: 已成功部署到生产环境（https://0889b0b4.review-system.pages.dev）

**V5.6.5 更新内容** (2025-10-16):
- 📚 **大幅扩充文章池**（用户体验改进 - 核心功能增强）：
  - **问题**: 用户反馈"只有很局限的12篇文章，每次更新看到的都差不多"
  - **解决方案**: 将百度文库文章从10篇扩充到35篇（增加250%）
  - **文章分类**:
    - 年度复盘类（3篇）：年度工作总结、个人年度成长、企业经营分析
    - 个人复盘类（3篇）：个人工作总结、职场自我复盘、能力提升手册
    - 工作复盘类（4篇）：季度/月度/周度复盘、项目结项总结
    - 学习复盘类（4篇）：学习方法优化、考试分析、培训总结、读书笔记
    - 复盘模板类（5篇）：四步法、OKR、PDCA、敏捷回顾、会议记录
    - 团队复盘类（3篇）：团队协作、跨部门协作、研发敏捷实践
    - 行业专项类（3篇）：销售业绩、产品迭代、营销活动ROI分析
  - **用户体验提升**:
    - 每次点击"更新文章"按钮能看到更丰富多样的内容
    - 前端从35篇文章中随机选择6篇展示
    - 大大降低重复率，提升学习资源的价值
  - **数据来源**: 所有文章链接均来自真实的百度文库，已验证可访问
- 🔍 **搜索关键词**: 使用5组不同关键词搜索百度文库：
  - "site:wenku.baidu.com 年度复盘"
  - "site:wenku.baidu.com 个人复盘"
  - "site:wenku.baidu.com 工作复盘总结"
  - "site:wenku.baidu.com 学习复盘"
  - "site:wenku.baidu.com 复盘模板"
- ✅ **部署状态**: 已成功部署到生产环境（https://14ea9059.review-system.pages.dev）

**V5.6.0 更新内容** (2025-10-16):
- 🌍 **语言智能学习资源**（核心功能增强）：
  - **根据用户语言搜索内容**：
    - 中文用户：从互联网搜索中文文章和从YouTube搜索中文视频
    - 英文用户：从互联网搜索英文文章和从YouTube搜索英文视频
  - **系统复盘主题搜索**：
    - 中文搜索词：'什么是系统化的复盘'、'如何系统性复盘'、'系统性复盘的优势'
    - 英文搜索词：'what is systematic review reflection'、'how to conduct systematic retrospective'、'benefits of systematic review'
  - **一次更新全部资源**：
    - 按钮文字更新："Update One Article" → "更新文章 / Update Articles"
    - 按钮文字更新："Update One Video" → "更新视频 / Update Videos"
    - 点击更新时刷新全部6篇文章或6个视频（不再只更新1个）
    - 每次点击都从API获取最新内容
- 📚 **Mock数据增强**：
  - 新增10篇中文系统复盘主题文章（知乎、36氪、联想等）
  - 新增10个中文系统复盘主题视频（柳传志、敏捷回顾等）
  - 英文Mock数据保持专业性（HBR、TED、McKinsey等）
- 🔌 **后端API增强**：
  - GET /api/resources/articles：自动检测X-Language请求头
  - GET /api/resources/videos：自动检测X-Language请求头
  - 根据语言参数返回对应语言的搜索结果
  - Mock数据函数支持语言参数（lang: 'zh' | 'en'）
- 🎨 **前端优化**：
  - 简化loadArticles/loadVideos逻辑
  - 更新时总是获取最新API数据
  - 按钮文字支持国际化（i18n.t）
- 🌐 **国际化**：新增 'updateArticles'（更新文章）、'updateVideos'（更新视频）翻译

**V5.5.1 更新内容** (2025-10-16):
- 🐛 **修复首页导航菜单问题**（关键Bug修复）：
  - **问题诊断**：高级用户在首页看不到"团队"和"管理后台"按钮
  - **根本原因**：首页使用自定义导航栏，没有使用标准的 renderNavigation() 函数
  - **用户体验问题**：用户必须先点击"团队"才能看到完整的导航菜单
  - **解决方案**：
    - 修改首页导航栏，根据登录状态显示不同菜单
    - **已登录用户**：显示完整应用菜单（工作台、我的复盘、公开的复盘、团队、管理后台）
    - **游客用户**：显示营销页面链接（资源、关于、评价、联系）
    - 高级用户和管理员在首页可以直接看到"管理后台"按钮
  - **UI优化**：
    - 右侧导航增加用户设置和退出按钮
    - 显示用户名和角色标签（与其他页面一致）
    - 移除重复的"工作台"按钮
- ✅ **修复状态**：高级用户现在在首页就能同时看到"团队"和"管理后台"按钮

**V5.5.0 更新内容** (2025-10-16):
- 🏷️ **导航栏改名**：
  - "仪表板"改名为"工作台"（Dashboard → Workbench）
  - 更符合中文用户的使用习惯
- 👑 **系统模版限制**（核心功能）：
  - **系统模版定义**：只有管理员创建的模版才能设置为"默认"
  - **权限控制**：
    - ✅ 管理员可以创建系统模版并设为默认
    - ✅ 高级用户只能创建用户模版，不能设为默认
    - ❌ 高级用户无法设置模版为默认（UI隐藏选项，后端验证阻止）
  - **模版类型标识**：
    - 新增"类型"列显示模版分类
    - 系统模版：紫色标签 + 👑 皇冠图标
    - 用户模版：蓝色标签 + 👤 用户图标
  - **后端验证**：
    - 创建模版时只允许管理员设置 is_default=true
    - 更新模版时只允许管理员修改 is_default 标志
    - 非管理员用户尝试设置默认会被忽略（保持现有值）
  - **前端UI优化**：
    - 创建/编辑模版对话框：非管理员不显示"默认"复选框
    - 模版列表：显示类型标签区分系统/用户模版
    - 基于 creator_role 判断模版类型（admin = 系统模版）
- 🌐 **国际化增强**：
  - 新增翻译：systemTemplate（系统模版）、userTemplate（用户模版）、type（类型）
  - 中英双语完整支持
- 📊 **API增强**：
  - templates/admin/all 新增 creator_role 字段返回
  - 前端可根据创建者角色判断模版类型

**V5.4.0 更新内容** (2025-10-16):
- 👥 **模版所有权系统**（核心功能扩展）：
  - **数据库扩展**：templates 表新增 created_by 列追踪创建者
  - **权限分级**：
    - ✅ 高级用户只能创建和编辑自己的模版
    - ✅ 管理员可以创建和编辑所有用户的模版
    - ❌ 高级用户尝试编辑他人模版返回 403 Forbidden
  - **列表过滤**：
    - 高级用户只看到自己创建的模版
    - 管理员看到所有模版并显示创建者信息
  - **UI增强**：
    - 模版列表新增"创建者"列显示用户名
    - 创建者为空时显示"系统"
  - **所有权验证**：
    - 模版 CRUD 操作全部加入所有权检查
    - 问题管理操作继承模版所有权规则
- 📊 **数据库迁移**：0016_add_template_creator.sql（新增 created_by 列）
- 🌐 **国际化**：新增 creator（创建者）、system（系统）翻译

**V5.1.0 更新内容** (2025-10-16):
- 🎯 **模板管理系统**（管理后台新增功能）：
  - **管理面板新增"模板管理"Tab**：Admin可完整管理所有模板
  - **模板CRUD操作**：
    - ✅ 创建新模板（支持中英双语）
    - ✅ 编辑模板信息（名称、描述、默认、启用状态）
    - ✅ 删除模板（智能软删除保护）
    - ✅ 查看所有模板列表（含问题数量）
  - **问题管理功能**：
    - ✅ 添加新问题（支持中英双语）
    - ✅ 编辑问题内容
    - ✅ 删除问题
    - ✅ 问题排序（上移/下移）
  - **保护机制**：
    - ✅ 默认模板不能删除
    - ✅ 使用中的模板只能禁用（软删除）
    - ✅ 自动管理默认模板标记
  - **用户界面**：
    - ✅ 清晰的表格布局
    - ✅ 模态对话框编辑
    - ✅ 颜色标签区分状态
    - ✅ 即时反馈和刷新
- 🔧 **Bug修复**：
  - ✅ 修复编辑复盘保存后返回错误页面（现在返回仪表板）
- 🌍 **国际化增强**：
  - 新增40+个模板管理相关翻译（中英文）
- 📊 **API增强**：
  - 新增9个Admin专用API端点
  - 完整的模板和问题管理接口

**V5.0.0 更新内容** (2025-10-16):
- 🔄 **多用户答案系统**（重大架构变更）：
  - **核心变化**：每个问题现在支持多个用户独立记录答案
  - **权限规则**：
    - ✅ 每个用户只能编辑自己的答案
    - ✅ 创建者只能修改复盘基本属性（标题、说明、群体类型、时间类型、主人）
    - ❌ 创建者**不能**修改其他用户的答案
    - ❌ 团队成员**不能**修改其他用户的答案
  - **适用范围**：所有复盘（个人、项目、团队）都使用统一的多用户答案系统
- 📊 **数据库架构重构**（Migration 0014）：
  - 统一使用 `review_answers` 表支持多用户
  - 添加 `user_id` 字段到 `review_answers`
  - 迁移数据从 `team_review_answers` 到 `review_answers`
  - 删除废弃的 `team_review_answers` 表
  - 新增唯一约束：`(review_id, user_id, question_number)`
- 🔌 **后端API更新**：
  - **GET /api/reviews/:id**: 返回 `answersByQuestion`（按问题分组的多用户答案）
  - **PUT /api/reviews/:id**: 
    - 只有创建者可以修改基本属性
    - 所有用户只能修改自己的答案
  - **GET /api/reviews/:id/all-answers**: 获取所有用户的答案（替代 `/team-answers`）
  - **PUT /api/reviews/:id/my-answer/:questionNumber**: 保存当前用户的答案
  - **DELETE /api/reviews/:id/my-answer/:questionNumber**: 删除当前用户自己的答案
- 🎨 **前端界面优化**：
  - 复盘详情页：显示所有用户的答案，每个答案显示用户名和时间
  - 团队协作页：展示多用户答案，标注"我的答案"
  - 编辑页面：
    - 创建者无法修改其他用户的答案
    - 团队成员只能编辑自己的答案
    - 基本属性仅创建者可编辑（其他人显示禁用状态）
  - 移除创建者删除其他用户答案的按钮
  - 新增"删除我的答案"功能（每个用户可删除自己的答案）
- 🌐 **国际化支持**：
  - 新增翻译键：`onlyEditOwnAnswers`, `cannotEditOthersAnswers`
  - 中英双语提示信息
- ✅ **向后兼容**：现有复盘数据自动迁移到新架构，无需手动干预

**V4.3.4 更新内容** (2025-10-16):
- 🐛 **彻底修复重复保存问题**（关键Bug修复）：
  - **问题诊断**：用户报告V4.3.3仍然存在重复保存
  - **根本原因**：`showReviews()`函数开头无条件调用`autoSaveDraftBeforeNavigation()`
  - **执行流程**：
    1. 用户点击"保存" → `handleStep2Submit`执行保存（第一次）
    2. 设置`currentView = 'completing-review'`防止auto-save
    3. 调用`showReviews()`
    4. `showReviews()`开头无条件调用`autoSaveDraftBeforeNavigation()`
    5. 虽然`currentView`已改，但时序问题可能导致重复保存
  - **解决方案**：
    - 修改`showReviews()`函数，添加条件检查
    - 只有当`currentView`是`'create-review-step1'`或`'create-review-step2'`时才auto-save
    - 如果`currentView`已被改为`'completing-review'`，跳过auto-save
    - 修复Step 2顶部的"返回"按钮也使用确认对话框
  - **测试验证**：
    - ✅ 点击"保存"只执行一次POST/PUT
    - ✅ 不会在`showReviews()`时再次保存
    - ✅ 数据库中只有一条记录

**V4.3.3 更新内容** (2025-10-16):
- 🐛 **彻底修复重复保存问题**（核心Bug修复 - 关键）：
  - **根本原因**：`showReviews()`函数在开始时调用`autoSaveDraftBeforeNavigation()`，导致第二次保存
  - **保存流程分析**：
    1. 用户点击"保存"按钮
    2. `handleStep2Submit()`执行保存（第一次保存）✅
    3. 调用`showReviews()`跳转到复盘列表
    4. `showReviews()`开头检测到`currentView === 'create-review-step2'`
    5. 触发`autoSaveDraftBeforeNavigation()`（第二次保存）❌
    6. 结果：数据库中出现两个相同记录
  - **解决方案**（关键修复）：
    - 在`handleStep2Submit()`中，保存成功后立即设置`currentView = 'completing-review'`
    - 这样`showReviews()`调用`autoSaveDraftBeforeNavigation()`时会跳过保存
    - 移除Step 1到Step 2的自动保存逻辑
    - "下一步"按钮只切换界面，不保存
    - "保存"按钮是唯一的保存触发点
    - 保存后清除`currentDraftId`并更改视图状态
- 📝 **返回按钮智能确认**（用户体验改进）：
  - **问题2**：点击"返回"按钮会自动保存，用户无法控制
  - **解决方案**：
    - 检测用户是否已填写答案
    - 如果有答案，显示确认对话框询问用户
    - 用户可选择："确定"保存草稿，或"取消"直接返回不保存
    - 如果没有答案，直接返回Step 1
    - 新增`handlePreviousWithConfirmation()`函数处理逻辑
- 🌐 **国际化支持**：新增翻译键`saveBeforeGoingBack`（中英双语确认对话框文本）
- ✅ **测试场景**：
  - ✅ 点击"下一步"不会保存
  - ✅ 点击"保存"只保存一次
  - ✅ 点击"返回"有填写答案时会询问
  - ✅ 点击"返回"无答案时直接返回
  - ✅ 不会再出现重复记录

**V4.3.2 更新内容** (2025-10-16):
- 📊 **显示主人属性**（用户体验改进）：
  - 在所有复盘列表中显示主人属性列（owner_type）
  - **仪表板复盘列表**：新增"主人"列，显示私有/团队/公开标签
  - **我的复盘列表**：新增"主人"列和筛选器
  - **公开的复盘列表**：新增"主人"列
  - 使用颜色标签区分：
    - 私有（灰色 + 🔒锁图标）
    - 团队（蓝色 + 👥用户组图标）
    - 公开（绿色 + 🌐地球图标）
- 🔍 **主人属性筛选**（新增功能）：
  - 在"我的复盘"页面新增主人属性筛选下拉框
  - 支持按私有/团队/公开筛选复盘记录
  - 与现有的状态、群体类型、时间类型筛选器配合使用
- 🐛 **修复重复保存问题**（核心Bug修复）：
  - **问题**：创建复盘时点击"保存"按钮会保存两次
  - **原因**：Next按钮触发自动保存草稿，Save按钮再次创建新记录
  - **解决方案**：
    - `handleStep2Submit()` 检查 `currentDraftId`
    - 如果存在草稿ID：使用 PUT 更新现有草稿
    - 如果无草稿ID：使用 POST 创建新记录
    - 清除 `currentDraftId` 防止重复更新
  - **状态**：✅ 完全修复，不会再重复保存
- 🎨 **新增辅助函数**：
  - `renderOwnerTypeBadge(ownerType)` 生成主人属性标签
  - 统一的颜色方案和图标
  - 支持国际化（中英文自动切换）
- 🌐 **国际化支持**：使用现有的 ownerType、ownerTypePrivate、ownerTypeTeam、ownerTypePublic 翻译键

**V4.3.1 更新内容** (2025-10-16):
- 🐛 **修复导航菜单问题**：
  - 在用户设置页面的导航菜单添加"公开的复盘"选项
  - 确保所有页面的导航菜单保持一致
- 🐛 **修复重复提交问题**：
  - 添加 `isSubmitting` 标志防止重复提交
  - 修复创建"公开"复盘时可能出现的重复保存问题
  - 使用 try-finally 确保标志正确重置

**V4.3.0 更新内容** (2025-10-16):
- 🔒 **复盘主人属性和访问控制**（核心功能扩展）：
  - 新增`owner_type`字段：私有(private)、团队(team)、公开(public)
  - **私有**：仅创建者可见和编辑
  - **团队**：团队成员可见；群体类型为"团队"时成员可协作
  - **公开**：所有人可见但仅创建者可编辑
- 🌐 **公开的复盘功能**（新增页面）：
  - 主菜单新增"公开的复盘"选项
  - 展示所有owner_type为"公开"的复盘
  - 用户可查看所有公开复盘，供学习和参考
- 📝 **创建和编辑表单增强**：
  - 新增"主人"选择器（私有/团队/公开）
  - 提供详细说明帮助用户理解各选项
  - 自动验证（团队主人需要选择团队）
- 🔐 **后端访问控制**：
  - 基于owner_type实现多层权限控制
  - GET /api/reviews: 根据owner_type和group_type过滤
  - GET /api/reviews/public: 新端点获取所有公开复盘
  - PUT /api/reviews/:id: 根据owner_type限制编辑权限
  - 团队答案API：支持团队协作访问控制
- 📊 **数据库更新**：
  - 新增owner_type字段（默认'private'）
  - 新增索引idx_reviews_owner_type优化查询
  - 自动更新历史数据（有team_id的设为'team'）
- 🌍 **国际化支持**：
  - 新增中英文翻译：主人、私有、团队、公开
  - 新增公开复盘页面的翻译
  - 新增访问控制说明的翻译

**V4.2.11 更新内容** (2025-10-15):
- 🎨 **统一仪表板和我的复盘版面**（用户体验改进）：
  - 调整"我的复盘"列表表头顺序与仪表板完全一致
  - 列顺序：标题、创建者、状态、更新时间、操作
  - 简化表格样式，统一视觉效果
  - 两个页面现在使用相同的布局和列顺序
- 👁️ **修复"我的复盘"/"查看"功能**（核心功能修复）：
  - 查看按钮现在传递readOnly=true参数
  - 查看模式完全只读，不显示编辑按钮
  - 修复查看页面可以编辑的问题
- 🐛 **修复编辑功能的teams undefined错误**（核心稳定性修复）：
  - **根本原因**：showEditReview函数中teams变量可能为undefined
  - **影响范围**：仪表板和我的复盘的"编辑"按钮都会触发此错误
  - **修复方案**：
    - API调用添加完整后备：`teams = teamsResponse.data.teams || teamsResponse.data.myTeams || []`
    - catch块明确设置：`teams = []`
    - 模板检查增强：`&& teams && teams.length > 0`
  - **错误信息**：`Cannot read properties of undefined (reading 'length')`
  - **状态**：✅ 完全修复，不会再出现
- 📊 **数据来源分析**：
  - 发现API可能返回`teams`或`myTeams`字段
  - 现在两个字段都有后备处理
  - 确保teams变量永远是数组，即使API失败

**V4.2.10.1 更新内容** (2025-10-15):
- 🛡️ **全面增强数组访问安全性**（核心稳定性修复）：
  - 为所有数组.map()调用添加双重安全检查
  - 检查内容：`(array && array.length > 0)`
  - 修复区域：
    - `collaborators` 数组（复盘协作者列表）
    - `questions` 数组（团队协作视图）
    - `completionStatus` 数组（成员完成状态）
  - 所有数组访问都添加else分支，显示友好提示
- 🎯 **防止所有可能的undefined错误**：
  - `Cannot read properties of undefined (reading 'length')`
  - `Cannot read properties of null (reading 'map')`
  - 任何数组为undefined/null导致的页面崩溃
- ✅ **问题确认**：
  - 仪表板已显示创建者列（使用同一个renderRecentReviews函数）
  - 编辑功能已全面加固，不会再出现undefined错误
- 📝 **代码质量**：防御性编程，确保在任何数据异常情况下都能优雅降级

**V4.2.10 更新内容** (2025-10-15):
- 📋 **添加创建者列到复盘列表**（用户体验改进）：
  - 在"我的复盘"页面的表格中新增"创建者"列
  - 显示在标题和状态列之间
  - 显示 review.creator_name，如果为空则显示 "Unknown"
  - 使用 fas fa-user-circle 图标增强视觉效果
  - 支持国际化（i18n.t('creator') || '创建者'）
- 🐛 **修复编辑功能的undefined错误**（稳定性修复）：
  - 问题：点击"我的复盘"→"编辑"时出现 `Cannot read properties of undefined (reading 'length')` 错误
  - 根本原因：showCreateReviewStep2() 函数在第2091行直接调用 template.questions.map() 而没有检查是否为 undefined
  - 解决方案：添加空值检查 `(template.questions && template.questions.length > 0)`
  - 添加友好的空状态提示："暂无问题"（支持国际化）
  - 使用三元运算符根据检查结果显示问题列表或提示
- ✅ **代码质量提升**：
  - 检查并确认其他所有 template.questions 访问都已有适当的null检查
  - 防止类似的 undefined 错误在其他地方发生
  - 增强了系统的健壮性和用户体验
- 📝 **新增文档**：CREATOR_COLUMN_FIX.md（完整的问题分析和解决方案文档）

**V4.2.9 更新内容** (2025-10-15):
- 📧 **通知系统邮件发送功能**（核心修复）：
  - **问题**: 管理面板的"发送通知"功能只保存到数据库，不发送邮件
  - **修复**: 集成Resend邮件服务，实现真正的邮件发送
  - **广播通知**: 向所有用户发送通知，包括数据库记录和邮件
  - **定向发送**: 向选定用户发送通知，包括数据库记录和邮件
  - **专业模板**: 使用精美的HTML邮件模板
  - **统计反馈**: 返回邮件发送成功/失败数量
  - **错误处理**: 完善的错误日志和异常处理
- 🔧 **技术改进**:
  - 修改 `src/routes/notifications.ts` 集成邮件发送
  - 使用 `utils/email.ts` 的 `sendEmail()` 函数
  - 添加 `RESEND_API_KEY` 环境变量检查
  - HTML邮件模板包含品牌样式和结构
  - 纯文本邮件作为备用
- ✅ **修复问题**: 管理员发送通知后，用户现在可以收到邮件

**V4.2.8 更新内容** (2025-10-15):
- 👤 **用户设置页面**（核心新功能）：
  - 点击导航栏用户名进入个人设置页面
  - **账号设置区域**：
    - 修改用户名（实时更新到系统）
    - 修改邮箱地址（验证邮箱唯一性）
    - 选择语言偏好：中文/English（保存到服务器）
  - **密码管理区域**：
    - 直接在设置页面修改密码
    - 需要验证当前密码才能修改
    - 密码强度验证（至少6个字符）
  - 精美的UI设计，分区清晰，操作方便
- 🌍 **语言偏好持久化**（核心功能）：
  - 系统默认英文版（首次访问）
  - 用户切换语言时自动保存偏好到服务器
  - 登录后自动应用用户的语言偏好
  - 支持所有登录方式：邮箱登录、注册、Google OAuth
  - 手动切换语言时实时同步到后端
- 📊 **数据库字段利用**：
  - users表中的language字段（zh/en）已存在
  - 新增API利用现有字段实现语言偏好功能
- 🔌 **新增API接口**：
  - GET /api/auth/settings（获取用户设置）
  - PUT /api/auth/settings（更新用户设置）
  - 支持部分更新（username/email/language可选）
- 🎨 **前端优化**：
  - 修改renderNavigation()使用户名可点击
  - 新增showUserSettings()函数显示设置页面
  - 新增handleSaveSettings()处理设置保存
  - 新增handleChangePasswordFromSettings()处理密码修改
  - 修改handleLanguageSwitch()自动保存语言偏好
  - 修改三个登录函数自动应用语言偏好
- 🌐 **国际化支持**：新增8个翻译键（userSettings, accountSettings, languagePreference, saveChanges, settingsUpdated, chinese, english, selectLanguage）
- ✅ **实现需求**：完成用户请求的语言偏好持久化和用户设置页面功能

**V4.2.7 更新内容** (2025-10-15):
- 🔗 **修复密码重置链接404错误**（关键修复）：
  - 问题：邮件中的 `/reset-password?token=xxx` 路径在 SPA 中返回404
  - 解决：修改为根路径 `/?token=xxx`，通过 URL 参数传递 token
  - 前端正确检测 token 参数并显示重置密码表单
- 📧 **邮箱注册验证**：
  - 解释未注册邮箱无法收到重置邮件的原因（安全设计）
  - 提供清晰的用户指引和解决方案
- 📝 **新增问题解决文档**：
  - 创建 `PASSWORD_RESET_ISSUES_RESOLVED.md` 详细说明
  - 包含问题分析、解决方案、测试验证、用户指南
- ✅ **修复问题**：用户点击邮件中的密码重置链接显示404错误

**V4.2.6 更新内容** (2025-10-15):
- 🔑 **更新 Resend API Key**（关键修复）：
  - 诊断问题：Resend Logs显示403错误（API Key权限问题）
  - 更新解决：配置新的有效 API Key 到 Cloudflare Pages
  - 验证测试：使用真实邮箱和测试账号验证邮件发送成功
  - 创建详细的更新指南文档（RESEND_API_KEY_UPDATE.md）
- ✅ **邮件功能恢复**：密码重置邮件现在可以正常发送
- 📝 **新增文档**：完整的 API Key 更新和故障排查指南

**V4.2.5 更新内容** (2025-10-15):
- 📧 **密码重置邮件修复**（核心修复）：
  - 修改发件地址从 `noreply@resend.dev` 到 `onboarding@resend.dev`
  - 使用 Resend 官方测试域名确保邮件能够发送
  - 增强邮件发送错误日志，记录详细的失败信息
  - 邮件发送成功时记录邮件ID便于追踪
- 📝 **新增排查文档**：
  - 创建 `PASSWORD_RESET_TROUBLESHOOTING.md` 详细排查指南
  - 包含常见问题、解决方案、测试方法
  - 提供自定义域名配置指引
- ✅ **修复问题**：用户请求密码重置后收不到邮件的问题

**V4.2.4 更新内容** (2025-10-14):
- 🔄 **Previous按钮数据保留**（核心修复）：
  - 修改showCreateReview()函数，添加可选参数preservedData
  - 从Step 2点击Previous返回Step 1时自动恢复所有表单数据
  - 保留用户输入的标题、说明、模板选择、群体类型、团队选择、时间类型、状态
  - 自动恢复UI状态（团队选择器的显示/隐藏）
  - 自动更新模板描述信息
- 🎯 **用户体验改进**：
  - 用户可以自由在Step 1和Step 2之间切换而不丢失数据
  - 支持修改Step 1的信息后继续填写Step 2
  - 防止因误操作返回导致的数据丢失
- ✅ **修复问题**：从Step 2点击Previous返回Step 1时表单数据被清空的问题

**V4.2.3 更新内容** (2025-10-14):
- 🌍 **国际化修复**（核心修复）：
  - 修复英文环境下显示中文提示的bug
  - 新增4个翻译键：noTeamsYet, pleaseGoToTeamsPage, teamsPage, applyOrCreateTeam
  - 替换团队选择器中的硬编码中文文本为i18n函数调用
  - 中文提示："你还没有加入任何团队" → 英文："You haven't joined any teams yet"
  - 中文提示："请先前往 团队页面 申请加入公开团队或创建新团队" → 英文："Please go to Teams page to apply for public teams or create new teams"
- ✅ **修复问题**：英文用户在创建团队复盘时看到中文提示语的问题

**V4.2.2 更新内容** (2025-10-14):
- 🔓 **普通用户团队访问修复**（核心修复）：
  - 移除团队路由的全局premiumOrAdmin中间件
  - 普通用户现在可以正常访问团队页面
  - 仅在创建团队时检查premium/admin权限
  - 修复"操作失败"错误提示
- 🎯 **导航按钮可见性**：
  - 仪表板页面的"团队"按钮现在对所有用户可见
  - 确保所有角色都能方便访问团队功能
- 🐛 **修复邮箱邀请功能**：
  - 修改后端支持通过email参数查找用户
  - 简化前端邀请逻辑，直接发送email
  - 移除对admin API的依赖
- 🚫 **修复"Draft saved"假阳性**：
  - 将currentView赋值移到showCreateReview函数末尾
  - 仅在所有初始化成功后设置currentView
  - 防止验证失败时触发自动保存
- 🛠️ **创建复盘页面加载修复**：
  - 为handleTemplateChangeStep1添加全面错误处理
  - 添加所有DOM元素的null检查
  - 防止未捕获异常导致页面无法打开
- ✅ **修复问题**：
  - 普通用户无法访问团队页面
  - 高级用户无法邀请团队成员
  - admin/premium用户点击"创建复盘"无响应
  - 导航离开时显示虚假"Draft saved"通知

**V4.1.2 更新内容** (2025-10-14):
- 🔄 **智能语言切换**（核心功能）：
  - 切换语言前自动保存当前创建的复盘内容
  - 在创建复盘过程中切换语言会显示确认对话框
  - 第一步和第二步都会自动保存为草稿到服务器
  - 显示保存状态通知（正在保存、已保存、正在切换）
  - 防止用户在创建复盘时因切换语言而丢失数据
- 🛡️ **数据保护机制**：
  - 新增 saveCurrentReviewDraft() 全局函数（支持Step 1和Step 2）
  - 新增 handleLanguageSwitch() 处理器
  - 所有语言切换按钮统一使用新处理器
  - **草稿生命周期管理**（Bug修复）：
    - 新增 currentDraftId 全局变量追踪草稿ID
    - 防止重复创建草稿（多次切换语言时更新同一草稿）
    - 开始新复盘时重置 currentDraftId
    - 完成复盘提交后清除 currentDraftId
- 🚀 **导航自动保存**（新增功能）：
  - 所有导航按钮（主页、仪表板、我的复盘、团队、管理后台）在离开创建复盘页面前自动保存草稿
  - 新增 autoSaveDraftBeforeNavigation() 辅助函数统一处理自动保存
  - 修改 5 个导航函数：showHomePage(), showDashboard(), showReviews(), showTeams(), showAdmin()
  - 防止用户在创建复盘时因点击导航按钮而丢失数据
- 📄 **复盘列表分页功能**（新增功能）：
  - 每页显示 5 条复盘记录
  - 超过 5 条时自动显示分页控件
  - 支持"上一页"/"下一页"按钮导航
  - 显示当前页码和总页数
  - 显示当前显示范围（显示 X 到 Y 共 Z 条结果）
  - 响应式设计：移动端显示简化版分页，桌面端显示完整页码
  - 筛选和搜索后自动重置到第一页
- 👥 **智能团队选择器**（新增功能）：
  - 当"群体类型"选择"团队"时，自动显示团队选择下拉框
  - 显示用户所属的所有团队列表
  - 选择"个人"或"项目"时自动隐藏团队选择器
  - 选择"团队"时团队选择变为必填项
  - 防止忘记选择团队导致的创建失败
- 🚪 **成员退出团队功能**（新增功能）：
  - 团队成员可以在团队详情页面主动退出团队
  - 在成员列表中，每个成员（除拥有者外）都有"退出团队"按钮
  - 点击后需要确认操作，防止误操作
  - 退出后自动返回团队列表页面
  - 团队拥有者无法退出，只能解散团队
- 🌐 **新增国际化键**：confirmLanguageSwitch, savingDraft, draftSaved, switchingLanguage, previousPage, nextPage, showing, to, of, results, pleaseSelectTeam
- ✅ **修复问题**：
  - V4.1.2初始版本：切换语言时未保存的复盘内容丢失
  - **V4.1.2 Bug修复 #1**：
    - 修复Step 1切换语言后草稿不出现在"我的复盘"列表的问题
    - 修复多次切换语言会创建多个草稿副本的问题
    - 确保草稿正确保存到服务器并可在列表中查看
  - **V4.1.2 Bug修复 #2**：
    - 修复点击导航按钮（主页、仪表板等）时未保存草稿导致数据丢失的问题
    - 现在所有导航操作都会自动保存草稿
  - **V4.1.2 Bug修复 #3**：
    - 修复删除复盘后页面不自动刷新的问题
    - 删除后根据当前视图自动刷新列表（我的复盘/仪表板）
    - 使用友好的通知提示替代传统 alert 弹窗

**V4.1.1 更新内容** (2025-10-14):
- 🌍 **模板内容国际化**（核心修复）：
  - 新增 name_en、description_en 字段到 templates 表
  - 新增 question_text_en 字段到 template_questions 表
  - 全部53个"个人年复盘"问题翻译为英文
  - 全部10个"灵魂9问"问题翻译为英文
  - 后端API自动根据用户语言返回对应内容（X-Language header）
  - 前端自动发送语言偏好到所有API请求
- 📊 **新增数据库迁移**：0011_add_template_i18n.sql
- 🔌 **API增强**：
  - templates.ts: 支持语言参数，返回对应语言的模板内容
  - reviews.ts: 返回对应语言的模板名称和描述
- 🎨 **用户体验改进**：英文用户不再看到中文模板内容
- ✅ **修复问题**：修复V4.1中英文系统显示中文模板内容的bug

**V4.1 更新内容** (2025-10-13):
- 📝 **两步创建复盘流程**：
  - 第一步：填写基本信息（标题、描述、团队、模板选择）
  - 第二步：根据模板填写问题（支持1-100+问题）
  - 模板选择时实时预览（显示描述和问题数量）
- 📋 **新增"个人年复盘"模板**：
  - 53个深度年度反思问题
  - 涵盖：过去回顾、成就总结、挑战分析、目标规划
  - 适合年度总结和新年规划
- 💾 **数据库优化**：
  - 新增 0010_add_yearly_review_template.sql 迁移
  - 支持动态数量的问题（不限于9个）

**V4.0 更新内容** (2025-10-13):
- 📋 **模板系统**（核心新功能）：
  - 创建复盘时可选择模板
  - 默认模板"灵魂9问"（10个问题）
  - 模板创建后不可更改
  - 不同模板可以有不同数量的问题
- 📊 **数据库重构**：
  - 新增 templates 表（存储模板信息）
  - 新增 template_questions 表（存储模板问题）
  - 新增 review_answers 表（动态存储答案）
  - reviews 表新增 template_id 字段
  - 自动迁移现有数据到新结构
- 🔌 **新增API路由**：
  - GET /api/templates（获取所有模板）
  - GET /api/templates/:id（获取单个模板详情）
- 🎨 **前端界面重构**：
  - 创建复盘表单新增模板选择
  - 动态渲染问题数量（1-100+问题）
  - 复盘详情页显示模板名称标签
  - 编辑页面显示模板信息（只读）

**V3.9 更新内容** (2025-10-13):
- 🤝 **团队协作复盘功能**（核心新功能）：
  - 多人并列答题：每个问题显示所有团队成员的答案
  - 权限控制：成员只能编辑自己的答案，创建者可以删除他人答案
  - 自动保存：答案修改后自动保存，无需提交
  - 完成状态：显示每个成员的完成进度（已完成X/9题）
  - 手动刷新：支持刷新页面查看最新答案
- 📊 **新增数据表**：team_review_answers（团队答案表）
- 🔌 **新增API接口**：
  - GET /api/reviews/:id/team-answers（获取团队答案）
  - PUT /api/reviews/:id/my-answer/:questionNumber（保存我的答案）
  - DELETE /api/reviews/:id/answer/:userId/:questionNumber（删除答案）
- 🎨 **前端界面优化**：
  - 新增"查看团队答案"按钮（团队复盘详情页）
  - 完整的团队协作答题界面（并列显示、自动保存、完成状态）
- 🌐 **国际化支持**：新增17个翻译键（中英双语）

**V3.8 更新内容** (2025-10-10):
- 🔒 **安全的忘记密码功能**（修复 V3.7 安全漏洞）：
  - 两步密码重置流程（请求重置 → 邮件验证 → 设置新密码）
  - 集成 Resend 邮件服务，发送专业的重置邮件
  - 密码重置令牌系统（1小时过期、一次性使用）
  - 防止邮箱枚举攻击
  - 精美的 HTML 邮件模板
  - 完整的安全验证流程
- 📧 **新增 Resend 配置文档**：完整的邮件服务配置指南
- 🛡️ **安全特性增强**：令牌管理、过期机制、防攻击措施

**V3.7 更新内容** (2025-10-09):
- 🔐 **用户密码管理**：
  - 登录后用户可修改密码（需验证当前密码）
  - 登录界面增加"忘记密码"功能（通过邮箱重置密码）
  - 密码强度验证（至少6个字符）
- 👥 **Admin 新增用户功能**：
  - Admin 可在管理界面手动创建用户
  - 支持设置用户邮箱、用户名、密码和角色
  - 创建后立即可用

**V3.6 更新内容** (2025-10-09):
- 📚 **学习资源展示优化**：
  - **初始加载**：精选文章和视频教程各显示 6 条随机记录
  - **智能更新**：点击"更新"按钮时，只替换其中 1 条随机记录（保留其他 5 条）
  - **缓存机制**：减少 API 调用，提升性能
  - **内容丰富**：相比 V3.5（1条）增加到 6 条，内容更丰富
  - **动态刷新**：每次点击都看到新内容，不会完全重新加载

**V3.5 更新内容** (2025-10-09):
- 🌍 **默认语言改为英文**：首次访问时默认显示英文界面（用户可手动切换中文）
- 📚 **学习资源优化**：
  - 精选文章和视频教程改为每次只显示一条随机记录
  - 添加"加载另一篇/另一个"按钮，点击可刷新显示新的随机内容
  - 减少页面加载量，提升用户体验

**V3.4 更新内容** (2025-10-09):
- 🐛 **修复数据库配置问题**：
  - 修复 wrangler.json 数据库配置（database_name 不匹配）
  - 成功应用所有数据库迁移（5个迁移文件）
  - 导入种子数据，创建测试账号
  - 邮箱登录功能恢复正常 ✅
- 🔧 **修复Google登录按钮显示**：
  - 改用手动初始化 Google Sign-In 按钮
  - 修复前端页面渲染后按钮不显示的问题
  - 统一 authToken 存储方式（与邮箱登录一致）
- 🔑 **配置Google API Key**：
  - 配置 GOOGLE_API_KEY: AIzaSyAsXAObY7qWBlnO0aXZYXbInYXfUnbiHKs
  - 配置 YOUTUBE_API_KEY（同一密钥）
  - 启用真实 YouTube 视频数据获取
- 📄 **更新文档**：
  - 添加 POST /api/auth/google API 文档
  - 更新部署状态和版本信息

**V3.3 更新内容** (2025-10-08):
- 🔐 **Google账号登录**：
  - 集成Google OAuth 2.0认证
  - 支持Google账号一键登录和注册
  - 自动创建用户账号（首次登录）
  - 通过邮箱关联现有账号（已注册用户）
  - 在登录和注册页面添加Google按钮
  - 完整的配置文档（GOOGLE_OAUTH_SETUP.md）
  - 环境变量示例文件（.dev.vars.example）

**V3.2 更新内容** (2025-10-08):
- 🎨 **优化资源展示**：
  - 将"精选文章"改为紧凑的列表样式，每条占用更少空间
  - 将"视频教程"改为紧凑的列表样式，移除大图预览
  - 调整为单列布局，最大宽度限制，提升阅读体验
- ✨ **首页用户名显示**：登录后返回首页时，在"仪表板"按钮旁显示用户名

**V3.1 更新内容** (2025-10-08):
- 🐛 **修复资源链接问题**：
  - 修复"精选文章"所有文章链接，确保可直接访问
  - 修复"视频教程"链接，使用直接的YouTube视频watch链接而非搜索链接
- ✨ **Logo点击功能**：点击系统标题或logo可返回首页（适用于登录前后所有界面）

**V3.0 更新内容** (2025-10-08):
- ✨ 完整的营销主页（Hero + 资源 + 关于 + 团队 + 评价 + 联系）
- ✨ 学习资源库（10篇文章 + 10个视频）
- ✨ 团队成员三级权限系统（创造者/操作者/观察者）
- ✨ 季复盘时间类型
- ✨ 权限限制：只有Premium和Admin可创建团队
- ✨ 完整的法律页面（服务条款 + 隐私政策）
- ✨ 首页英雄区3张图片轮播功能

**V2.0 更新内容** (2025-10-07):
- ✨ 复盘分类系统（群体类型 + 时间类型）
- ✨ 增强通知系统（邮箱发送 + 选择发送）
- ✨ 团队邮箱邀请功能
�
  - 将"精选文章"改为紧凑的列表样式，每条占用更少空间
  - 将"视频教程"改为紧凑的列表样式，移除大图预览
  - 调整为单列布局，最大宽度限制，提升阅读体验
- ✨ **首页用户名显示**：登录后返回首页时，在"仪表板"按钮旁显示用户名

**V3.1 更新内容** (2025-10-08):
- 🐛 **修复资源链接问题**：
  - 修复"精选文章"所有文章链接，确保可直接访问
  - 修复"视频教程"链接，使用直接的YouTube视频watch链接而非搜索链接
- ✨ **Logo点击功能**：点击系统标题或logo可返回首页（适用于登录前后所有界面）

**V3.0 更新内容** (2025-10-08):
- ✨ 完整的营销主页（Hero + 资源 + 关于 + 团队 + 评价 + 联系）
- ✨ 学习资源库（10篇文章 + 10个视频）
- ✨ 团队成员三级权限系统（创造者/操作者/观察者）
- ✨ 季复盘时间类型
- ✨ 权限限制：只有Premium和Admin可创建团队
- ✨ 完整的法律页面（服务条款 + 隐私政策）
- ✨ 首页英雄区3张图片轮播功能

**V2.0 更新内容** (2025-10-07):
- ✨ 复盘分类系统（群体类型 + 时间类型）
- ✨ 增强通知系统（邮箱发送 + 选择发送）
- ✨ 团队邮箱邀请功能
 首页英雄区3张图片轮播功能

**V2.0 更新内容** (2025-10-07):
- ✨ 复盘分类系统（群体类型 + 时间类型）
- ✨ 增强通知系统（邮箱发送 + 选择发送）
- ✨ 团队邮箱邀请功能
�题或logo可返回首页（适用于登录前后所有界面）

**V3.0 更新内容** (2025-10-08):
- ✨ 完整的营销主页（Hero + 资源 + 关于 + 团队 + 评价 + 联系）
- ✨ 学习资源库（10篇文章 + 10个视频）
- ✨ 团队成员三级权限系统（创造者/操作者/观察者）
- ✨ 季复盘时间类型
- ✨ 权限限制：只有Premium和Admin可创建团队
- ✨ 完整的法律页面（服务条款 + 隐私政策）
- ✨ 首页英雄区3张图片轮播功能

**V2.0 更新内容** (2025-10-07):
- ✨ 复盘分类系统（群体类型 + 时间类型）
- ✨ 增强通知系统（邮箱发送 + 选择发送）
- ✨ 团队邮箱邀请功能
 首页英雄区3张图片轮播功能

**V2.0 更新内容** (2025-10-07):
- ✨ 复盘分类系统（群体类型 + 时间类型）
- ✨ 增强通知系统（邮箱发送 + 选择发送）
- ✨ 团队邮箱邀请功能
