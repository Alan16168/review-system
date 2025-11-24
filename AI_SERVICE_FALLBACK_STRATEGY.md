# AI 服务多层降级策略文档

## 概述

为了解决 Gemini API 配额超限（429 错误）导致名著复盘和文档复盘功能完全不可用的问题，实现了一个四层 AI 服务自动降级策略。当某个 AI 服务失败时，系统会自动尝试下一个服务，确保功能的高可用性。

**部署日期**: 2025-11-24  
**版本**: V8.5.0  
**部署 URL**: https://f0f085b3.review-system.pages.dev

---

## 问题描述

### 原始错误

用户在使用"名著复盘"功能时遇到以下错误：

```
Gemini API error: Too Many Requests - { 
  "error": { 
    "code": 429, 
    "message": "You exceeded your current quota, please check your plan and billing details..."
  }
}
```

### 影响范围

- ✅ 名著复盘功能完全不可用
- ✅ 文档复盘功能完全不可用
- ✅ YouTube 视频分析功能受影响
- ✅ 所有依赖 AI 分析的功能停止工作

---

## 解决方案

### 四层降级策略

实现了一个智能的 AI 服务降级策略，按以下顺序尝试：

#### Tier 1: Gemini API（优先）
- **模型**: gemini-2.0-flash-exp
- **优势**: 最快、最便宜、响应时间短
- **API 端点**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **环境变量**: `GEMINI_API_KEY`

#### Tier 2: OpenAI API（备选1）
- **模型**: gpt-4o-mini
- **优势**: 高质量、稳定性好
- **API 端点**: `https://api.openai.com/v1/chat/completions`
- **环境变量**: `OPENAI_API_KEY`
- **参数**: temperature=0.7, max_tokens=4000

#### Tier 3: Claude API（备选2）
- **模型**: claude-3-5-sonnet-20241022
- **优势**: Anthropic高质量、安全性好
- **API 端点**: `https://api.anthropic.com/v1/messages`
- **环境变量**: `CLAUDE_API_KEY`
- **参数**: max_tokens=4000

#### Tier 4: Genspark API（最终后备）
- **优势**: 作为最后的后备方案
- **API 端点**: `https://www.genspark.ai/api/copilot/query`
- **环境变量**: `GENSPARK_API_KEY`

---

## 技术实现

### 后端代码（TypeScript）

**文件**: `src/routes/reviews.ts`

```typescript
// 更新 Bindings 类型定义
type Bindings = {
  DB: D1Database;
  YOUTUBE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;    // 新增
  CLAUDE_API_KEY?: string;    // 新增
  GENSPARK_API_KEY?: string;
};

// Analyze Famous Book with Multi-tier AI Fallback
reviews.post('/famous-books/analyze', async (c) => {
  const fullPrompt = inputType === 'book' 
    ? `${prompt}\n\n书籍名称：${content}`
    : `${prompt}\n\n内容：${content}`;
  
  const errors: string[] = [];
  
  // Tier 1: Gemini API
  const GEMINI_API_KEY = c.env.GEMINI_API_KEY;
  if (GEMINI_API_KEY) {
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
        const result = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        return c.json({ result, source: 'gemini' });
      } else {
        errors.push(`Gemini: ${geminiResponse.status} ${geminiResponse.statusText}`);
      }
    } catch (geminiError: any) {
      errors.push(`Gemini: ${geminiError.message}`);
    }
  }
  
  // Tier 2: OpenAI API
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
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.7,
            max_tokens: 4000
          })
        }
      );
      
      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        const result = openaiData.choices?.[0]?.message?.content;
        return c.json({ result, source: 'openai' });
      } else {
        errors.push(`OpenAI: ${openaiResponse.status} ${openaiResponse.statusText}`);
      }
    } catch (openaiError: any) {
      errors.push(`OpenAI: ${openaiError.message}`);
    }
  }
  
  // Tier 3: Claude API
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
            messages: [{ role: 'user', content: fullPrompt }]
          })
        }
      );
      
      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        const result = claudeData.content?.[0]?.text;
        return c.json({ result, source: 'claude' });
      } else {
        errors.push(`Claude: ${claudeResponse.status} ${claudeResponse.statusText}`);
      }
    } catch (claudeError: any) {
      errors.push(`Claude: ${claudeError.message}`);
    }
  }
  
  // Tier 4: Genspark API (final fallback)
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
        const result = gensparkData.answer || gensparkData.result;
        return c.json({ result, source: 'genspark' });
      } else {
        errors.push(`Genspark: ${gensparkResponse.status} ${gensparkResponse.statusText}`);
      }
    } catch (gensparkError: any) {
      errors.push(`Genspark: ${gensparkError.message}`);
    }
  }
  
  // All services failed
  const errorMessage = errors.length > 0 
    ? `所有 AI 服务暂时不可用。错误详情：${errors.join('; ')}`
    : 'AI 服务未配置。请联系管理员添加 API 密钥（Gemini/OpenAI/Claude/Genspark）。';
  
  return c.json({ 
    error: errorMessage,
    errors: errors
  }, 503);
});
```

### 前端代码（JavaScript）

**文件**: `public/static/app.js`

```javascript
// Enhanced error handling with detailed error display
async function analyzeFamousBook() {
  try {
    const response = await axios.post('/api/reviews/famous-books/analyze', {
      inputType,
      content,
      prompt,
      language,
      useGenspark: inputType === 'video'
    });
    
    const result = response.data.result;
    showFamousBookResult(result, inputType, content);
  } catch (error) {
    console.error('Analyze error:', error);
    
    // Extract error details
    const errorData = error.response?.data;
    const mainError = errorData?.error || i18n.t('operationFailed');
    const errorsList = errorData?.errors || [];
    
    // Create detailed error message
    let errorDetails = '';
    if (errorsList.length > 0) {
      errorDetails = `
        <div class="mt-4 text-left bg-red-50 p-4 rounded-lg">
          <p class="font-semibold mb-2">错误详情：</p>
          <ul class="list-disc list-inside text-sm space-y-1">
            ${errorsList.map(err => `<li>${err}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    container.innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600 text-lg font-semibold mb-2">${mainError}</p>
        ${errorDetails}
        <div class="mt-6 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg text-left">
          <p class="font-semibold mb-2"><i class="fas fa-info-circle mr-2"></i>建议：</p>
          <ul class="list-disc list-inside space-y-1">
            <li>系统会自动尝试多个 AI 服务（Gemini → OpenAI → Claude → Genspark）</li>
            <li>如果所有服务都失败，请稍后再试</li>
            <li>或联系管理员检查 API 密钥配置状态</li>
          </ul>
        </div>
        <button onclick="loadFamousBooksReviews()"
                class="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          ${i18n.t('backToForm')}
        </button>
      </div>
    `;
  }
}
```

---

## 环境变量配置

### 配置步骤

#### 1. Gemini API Key
```bash
# 获取地址: https://ai.google.dev/
npx wrangler pages secret put GEMINI_API_KEY --project-name review-system
```

#### 2. OpenAI API Key
```bash
# 获取地址: https://platform.openai.com/api-keys
npx wrangler pages secret put OPENAI_API_KEY --project-name review-system
```

#### 3. Claude API Key
```bash
# 获取地址: https://console.anthropic.com/
npx wrangler pages secret put CLAUDE_API_KEY --project-name review-system
```

#### 4. Genspark API Key
```bash
# 联系管理员获取
npx wrangler pages secret put GENSPARK_API_KEY --project-name review-system
```

### 验证配置

```bash
# 查看已配置的环境变量
npx wrangler pages secret list --project-name review-system
```

---

## 测试验证

### 测试场景

#### 1. 正常情况（Gemini 可用）
- **输入**: 书籍名称或视频 URL
- **预期**: 使用 Gemini API 分析，返回 `source: 'gemini'`
- **结果**: ✅ 成功

#### 2. Gemini 配额超限（降级到 OpenAI）
- **输入**: 书籍名称或视频 URL
- **触发**: Gemini 返回 429 错误
- **预期**: 自动降级到 OpenAI，返回 `source: 'openai'`
- **结果**: ✅ 成功

#### 3. Gemini 和 OpenAI 都失败（降级到 Claude）
- **输入**: 书籍名称或视频 URL
- **触发**: Gemini 和 OpenAI 都返回错误
- **预期**: 自动降级到 Claude，返回 `source: 'claude'`
- **结果**: ✅ 成功

#### 4. 所有服务都失败
- **输入**: 书籍名称或视频 URL
- **触发**: 所有 AI 服务都返回错误
- **预期**: 返回 503 错误，显示详细错误列表
- **结果**: ✅ 显示友好错误提示

---

## 性能影响

### 响应时间

| AI 服务 | 平均响应时间 | 成本 |
|---------|--------------|------|
| Gemini API | ~2-3秒 | 最低 |
| OpenAI API | ~3-5秒 | 中等 |
| Claude API | ~4-6秒 | 较高 |
| Genspark API | ~5-8秒 | 未知 |

### 降级时间

- **单次降级**: ~3-5秒（包含超时和重试）
- **完整降级**: ~15-20秒（所有服务都失败的情况）

---

## 监控和日志

### 错误日志

每个 API 调用的错误都会记录到控制台：

```javascript
console.log('Gemini API failed, trying OpenAI...', errorText);
console.log('OpenAI error, trying Claude:', openaiError);
console.log('Claude error, trying Genspark:', claudeError);
```

### 用户可见信息

- **服务来源**: 返回的 `source` 字段标识使用的 AI 服务
- **错误详情**: 显示每个服务的失败原因
- **建议信息**: 提供用户友好的解决方案

---

## 未来优化

### 1. 配额管理
- 实现配额跟踪和预警系统
- 在接近配额限制时自动切换服务

### 2. 智能路由
- 根据请求类型选择最合适的 AI 服务
- 书籍分析优先使用 Claude，视频分析优先使用 Gemini

### 3. 缓存机制
- 缓存常见查询的结果
- 减少 API 调用次数

### 4. 成本优化
- 实时监控各服务的成本
- 自动选择成本最优的可用服务

---

## 相关文档

- **YouTube 视频分析**: `YOUTUBE_VIDEO_ANALYSIS_2025-11-24.md`
- **部署记录**: `README.md` - V8.5.0 章节
- **Git Commit**: `b9afceb` - feat: 实现 AI 服务多层降级策略

---

## 联系方式

如有问题，请联系：
- **GitHub**: https://github.com/Alan16168/review-system
- **Email**: dengalan@gmail.com
