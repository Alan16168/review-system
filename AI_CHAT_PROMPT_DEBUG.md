# AI对话Prompt调试信息

## 当前Prompt结构

### 完整Prompt模板

```
作为系统复盘资深专家，回答以下问题：

【用户问题】
{用户的实际问题}

【输出要求】
请以JSON格式输出，包含以下字段：
1. "perspectives": 数组，包含2-3个不同角度的回答（每个角度包含 "title" 和 "content" 字段）
2. "nextQuestions": 数组，包含3个用户可能会问的下一个问题

示例格式：
{
  "perspectives": [
    {
      "title": "角度一标题",
      "content": "从这个角度的详细回答..."
    },
    {
      "title": "角度二标题", 
      "content": "从这个角度的详细回答..."
    }
  ],
  "nextQuestions": [
    "预测的问题1",
    "预测的问题2",
    "预测的问题3"
  ]
}

请只返回JSON数据，不要其他解释文字。
```

### 实际测试示例

**用户问题**: "项目复盘的核心步骤是什么？"

**实际发送的Prompt**:
```
作为系统复盘资深专家，回答以下问题：

【用户问题】
项目复盘的核心步骤是什么？

【输出要求】
请以JSON格式输出，包含以下字段：
1. "perspectives": 数组，包含2-3个不同角度的回答（每个角度包含 "title" 和 "content" 字段）
2. "nextQuestions": 数组，包含3个用户可能会问的下一个问题

示例格式：
{
  "perspectives": [
    {
      "title": "角度一标题",
      "content": "从这个角度的详细回答..."
    },
    {
      "title": "角度二标题", 
      "content": "从这个角度的详细回答..."
    }
  ],
  "nextQuestions": [
    "预测的问题1",
    "预测的问题2",
    "预测的问题3"
  ]
}

请只返回JSON数据，不要其他解释文字。
```

## 当前遇到的问题

### API权限问题

**错误信息**: `Gemini API error: 403`

**可能原因**:
1. 当前使用的GOOGLE_API_KEY没有启用Gemini API权限
2. API Key可能只有其他Google服务的权限（如YouTube Data API、Custom Search API）
3. 需要单独的Gemini API Key

### 解决方案

#### 方案1: 获取专用的Gemini API Key（推荐）

1. 访问 Google AI Studio: https://makersuite.google.com/app/apikey
2. 创建新的API Key，专门用于Gemini API
3. 在 `.dev.vars` 文件中添加：
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. 重启服务：
   ```bash
   npm run build
   pm2 restart review-system
   ```

#### 方案2: 启用现有API Key的Gemini权限

1. 访问 Google Cloud Console: https://console.cloud.google.com
2. 进入"API和服务" > "库"
3. 搜索"Generative Language API"或"Gemini API"
4. 点击"启用"
5. 确保API Key有此API的权限

#### 方案3: 继续使用Mock数据（临时方案）

如果暂时无法获取有效的Gemini API Key，系统会自动使用Mock数据：
- Mock数据也提供2-3个角度的回答
- Mock数据也包含3个预测问题
- 功能完整可用，只是回答内容是预设的

## 调试日志功能

系统现在会在控制台输出详细的调试信息：

### 1. Prompt日志
```
==================== AI Chat Prompt ====================
{完整的Prompt内容}
========================================================
```

### 2. Gemini响应日志
```
==================== Gemini Response ====================
Status: 200
AI Text: {AI返回的原始文本}
=========================================================
```

### 3. 解析结果日志
```
==================== Parsed Result ====================
{解析后的JSON对象}
=======================================================
```

### 查看日志命令
```bash
# 查看最新日志
pm2 logs review-system --nostream --lines 100

# 实时查看日志
pm2 logs review-system

# 只查看错误日志
pm2 logs review-system --err --nostream --lines 50
```

## Prompt优化建议

### 当前Prompt的优点

1. ✅ **结构清晰**: 明确区分用户问题和输出要求
2. ✅ **格式明确**: 提供详细的JSON格式示例
3. ✅ **角色定位**: "系统复盘资深专家"明确了AI的角色
4. ✅ **多角度回答**: 要求2-3个不同角度的回答
5. ✅ **预测功能**: 要求预测用户的下一个问题

### 可能的改进方向

如果回答质量仍然不够好，可以考虑以下改进：

#### 1. 增强专家背景描述
```
你是一位拥有20年企业管理经验的系统复盘资深专家，
擅长从方法论、实践经验、工具应用等多个维度进行深度分析。
请回答以下问题：
```

#### 2. 明确回答要求
```
【回答要求】
- 每个角度的回答应该包含具体的方法、步骤或案例
- 回答应该具有实践指导意义，而非泛泛而谈
- 总字数控制在300-500字
```

#### 3. 指定角度类型
```
【输出要求】
请从以下3个角度回答：
1. 方法论角度：介绍系统化的方法和框架
2. 实践经验角度：分享实际应用中的注意事项和技巧
3. 工具应用角度：推荐具体的工具和使用场景
```

#### 4. 添加示例回答
在Prompt中添加一个完整的示例回答，展示期望的质量和深度。

## Mock数据 vs 真实AI响应对比

### Mock数据示例
```json
{
  "answer": "**从方法论角度**\n针对\"如何做好项目复盘？\"这个问题...",
  "nextQuestions": [
    "如何建立有效的复盘机制？",
    "复盘过程中常见的误区有哪些？",
    "如何确保复盘结果能够落地执行？"
  ],
  "source": "mock"
}
```

### 期望的Gemini响应
```json
{
  "answer": "**从方法论角度**\n项目复盘的核心方法是AAR(After Action Review)...[详细内容]\n\n**从实践经验角度**\n在实际复盘中，我们发现...[具体案例和经验]\n\n**从工具应用角度**\n推荐使用以下工具...[具体工具和使用方法]",
  "nextQuestions": [
    "AAR方法的具体步骤是什么？",
    "如何让团队成员积极参与复盘？",
    "复盘结果如何与绩效考核结合？"
  ],
  "source": "gemini_ai"
}
```

## 下一步行动

1. **获取有效的Gemini API Key** - 这是获得高质量回答的关键
2. **测试实际响应** - 使用有效的API Key测试Prompt效果
3. **根据响应优化Prompt** - 基于实际效果调整Prompt内容
4. **收集用户反馈** - 了解用户对回答质量的评价
5. **持续迭代** - 根据反馈不断优化Prompt

## 技术说明

### API端点
```
POST /api/resources/ai-chat
Content-Type: application/json
X-Language: zh

{
  "question": "用户的问题"
}
```

### 响应格式
```json
{
  "answer": "格式化后的多角度回答",
  "nextQuestions": ["问题1", "问题2", "问题3"],
  "source": "gemini_ai" | "mock" | "error_fallback"
}
```

### source字段说明
- `gemini_ai`: 成功从Gemini API获取的响应
- `mock`: 未配置API Key，使用Mock数据
- `error_fallback`: API调用失败，降级到Mock数据

## 联系方式

如有问题或建议，请查看项目文档或联系开发团队。
