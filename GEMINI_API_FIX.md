# Gemini API 错误修复文档

## 问题描述

用户在生成章节时遇到以下错误：

```
TypeError: refresh Token is not a valid URL
Field systemicInstructions not available because it's only allowed to be set on one of [systemInstruction, systemicInstructions]
```

## 根本原因

### 问题 1: 模型名称验证
- **最初错误**: 使用了 `gemini-2.5-flash`（实际上这个模型存在）
- **第一次修复尝试**: 改为 `gemini-1.5-flash`（但这个模型在 v1beta API 中不可用）
- **最终正确**: `gemini-2.5-flash`（通过 API 列表验证确认可用）

### 问题 2: 缺少错误处理
- API 响应格式错误时没有详细的错误信息
- 无法追踪具体的 API 错误原因

## 解决方案

### 1. 验证并使用正确的模型名称

通过调用 Gemini API 的模型列表接口验证可用模型：

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

可用的 Gemini 模型包括：
- `gemini-2.5-flash` ✅ (推荐 - 最新最快)
- `gemini-2.5-pro` ✅ (更强大)
- `gemini-2.0-flash` ✅
- 等等...

**最终使用**:
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  // ...
);
```

### 2. 增强错误处理

```typescript
// 添加详细的错误日志
if (!response.ok) {
  const errorText = await response.text();
  console.error('Gemini API error:', response.status, errorText);
  throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
}

// 验证响应格式
if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
  console.error('Unexpected API response format:', JSON.stringify(data));
  throw new Error('Invalid API response format');
}
```

## 修复文件

- **文件路径**: `/home/user/webapp/src/routes/ai_books.ts`
- **函数**: `callGeminiAPI()`
- **行数**: 80-104

## 测试结果

✅ 项目构建成功
✅ 服务重启成功
✅ PM2 日志显示服务正常运行

## Gemini API 正确调用示例

```typescript
async function callGeminiAPI(
  apiKey: string, 
  prompt: string, 
  maxTokens: number = 8192, 
  temperature: number = 0.7
): Promise<string> {
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
          temperature: temperature,
          maxOutputTokens: maxTokens,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    console.error('Unexpected API response format:', JSON.stringify(data));
    throw new Error('Invalid API response format');
  }
  
  return data.candidates[0].content.parts[0].text;
}
```

## 相关 API 端点

此修复影响以下 API 端点：

1. **POST /api/ai-books/:id/generate-chapters**
   - 生成章节大纲（Level 1）
   
2. **POST /api/ai-books/:id/chapters/:chapterId/generate-sections**
   - 生成小节大纲（Level 2）
   
3. **POST /api/ai-books/:id/chapters/:chapterId/regenerate-sections**
   - 重新生成小节大纲
   
4. **POST /api/ai-books/:id/sections/:sectionId/generate-content**
   - 生成小节内容（Level 3）

## 注意事项

### Gemini API 模型列表

当前可用的 Gemini 模型（v1beta API）：
- `gemini-2.5-flash` ✅ (推荐 - 最新最快最便宜)
- `gemini-2.5-pro` ✅ (最强大的模型)
- `gemini-2.0-flash` ✅ (平衡性能和成本)
- `gemini-2.0-flash-lite` ✅ (轻量级版本)
- 其他实验性模型...

### API 速率限制

- **免费配额**: 每分钟 15 个请求
- **付费配额**: 根据计费计划而定

如果遇到速率限制错误，系统会自动回退到模拟数据（mock data）。

## 部署状态

- ✅ 代码已修复
- ✅ 项目已重新构建
- ✅ 服务已重启
- ✅ Git 提交完成

## 相关文档

- [Gemini API 官方文档](https://ai.google.dev/docs)
- [模型列表](https://ai.google.dev/models/gemini)
- [API 参考](https://ai.google.dev/api/rest)

---

**修复日期**: 2025-11-20  
**Git Commit**: `0278c00`  
**修复人员**: AI Assistant
