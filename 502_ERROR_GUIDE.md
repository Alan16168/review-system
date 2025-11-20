# 502 错误排查指南

## 问题描述

用户在生成内容时遇到 502 Bad Gateway 错误：

```
POST /api/ai-books/6/sections/76/generate-content 502 (Bad Gateway)
```

## 可能原因

### 1. Gemini API 超时

**最常见原因**: Gemini API 响应时间过长（超过 120 秒默认超时）

**症状**:
- 生成长内容（2000字+）时更容易出现
- 错误信息：502 Bad Gateway
- 后端日志可能显示超时

**解决方案**:
```typescript
// 增加超时时间配置（已在代码中）
// Wrangler 的默认超时是 30 秒，需要在配置中调整
```

### 2. API 速率限制

**原因**: Gemini API 免费配额用完或触发速率限制

**症状**:
- 短时间内多次生成
- 返回 429 或 502 错误
- 后端日志显示 "rate limit" 或 "quota exceeded"

**解决方案**:
- 等待几分钟后重试
- 使用付费 API key
- 实现请求队列和重试机制

### 3. 网络问题

**原因**: Cloudflare Workers 到 Gemini API 的网络连接问题

**症状**:
- 间歇性出现
- 重试后可能成功

**解决方案**:
- 自动重试（最多 3 次）
- 使用 fallback 机制

### 4. 浏览器缓存问题

**原因**: 浏览器缓存了旧的前端代码

**症状**:
- Prompt 编辑器不出现
- 功能表现异常
- 控制台有 JavaScript 错误

**解决方案**:
- 清除浏览器缓存
- 硬刷新页面（Ctrl+Shift+R）

## 诊断步骤

### 步骤 1: 检查后端日志

```bash
pm2 logs review-system --nostream --lines 100
```

查找：
- ✅ "Generating content: target=XXX words" - 请求已到达
- ✅ "Generated content: XXX words" - 生成成功
- ❌ "Gemini API error" - API 错误
- ❌ "timeout" - 超时错误
- ❌ "rate limit" - 速率限制

### 步骤 2: 检查浏览器控制台

按 F12 打开开发者工具，查看：
- Console 标签：JavaScript 错误
- Network 标签：请求状态码和响应时间

### 步骤 3: 测试 API 端点

```bash
# 测试生成内容
curl -X POST http://localhost:3000/api/ai-books/6/sections/76/generate-content \
  -H "Content-Type: application/json" \
  -d '{"target_word_count": 1000}' \
  -v
```

### 步骤 4: 检查 Gemini API 配额

访问 Google AI Studio，检查：
- API key 是否有效
- 配额是否用完
- 是否触发速率限制

## 用户操作指南

### 如果遇到 502 错误：

#### 方法 1: 清除缓存并重试

1. 按 `Ctrl + Shift + R` 硬刷新页面
2. 或清除浏览器缓存：
   - F12 → Application → Clear site data
3. 重新登录并重试

#### 方法 2: 减少字数重试

1. 如果设置了 2000 字或更多，尝试减少到 1000 字
2. 分多次生成，每次 1000 字
3. 后续可以编辑合并

#### 方法 3: 等待后重试

1. 可能是 API 速率限制
2. 等待 2-3 分钟
3. 再次尝试生成

#### 方法 4: 使用编辑功能

1. 如果生成失败
2. 使用"编辑"功能手动输入内容
3. 或复制粘贴其他来源的内容

## Prompt 编辑器问题

### 问题: Prompt 编辑器不出现

**原因**: 浏览器缓存了旧代码

**解决方案**:

1. **清除缓存** (最重要):
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

2. **检查 JavaScript 控制台**:
   - F12 → Console
   - 查看是否有错误：
     ```
     Uncaught TypeError: window.showPromptEditor is not a function
     ```

3. **强制刷新静态文件**:
   - F12 → Network 标签
   - 勾选 "Disable cache"
   - 刷新页面
   - 检查 `ai_books.js` 是否是最新版本

4. **使用无痕模式**:
   - Chrome: Ctrl + Shift + N
   - Firefox: Ctrl + Shift + P
   - 测试功能是否正常

### 验证 Prompt 编辑器

**正确的流程**:
```
1. 点击"生成内容"
   ↓
2. 弹出：请输入目标字数
   ↓
3. 输入字数（如：1000）
   ↓
4. 弹出：Prompt 编辑器 ← 应该在这里出现！
   ↓
5. 显示完整的 Prompt 文本
   ↓
6. 可以编辑
   ↓
7. 点击"确定"
   ↓
8. 弹出：确认生成
   ↓
9. 开始生成
```

**如果没有步骤 4**:
- 说明浏览器缓存了旧代码
- 必须清除缓存
- 或使用无痕模式

## 完整性强调

### 新的 Prompt 模板（已更新）

```
【特别要求 - 内容完整性】
- ⚠️ 【关键】内容必须完整，从头到尾一气呵成，不能中途停止
- ⚠️ 【关键】必须有明确的结论或总结段落，不能突然结束
- ⚠️ 【关键】最后一段必须是总结性质的收尾，给读者明确的结束感
- ✅ 如果接近字数上限，使用简洁但完整的方式收尾
- ✅ 每个小标题下的内容都要充分展开，不能只写一半
- ❌ 绝对不要包含"未完待续"、"下一节将"、"待续"等字样
- ❌ 绝对不要在列表中途停止或在句子中间停止
- ❌ 不要超出规定字数范围

【输出格式】
请直接输出完整的内容（纯文本+Markdown格式），不要JSON格式，不要前言说明，确保内容从开头到结尾都是完整的。
```

### 强调要点

1. **三个⚠️【关键】标记**:
   - 内容必须完整
   - 必须有结论段落
   - 最后一段必须是收尾

2. **明确禁止**:
   - "未完待续"等字样
   - 列表中途停止
   - 句子中间停止

3. **输出格式强调**:
   - 确保从开头到结尾都是完整的

## 最佳实践

### 1. 分步生成

对于长内容：
- 第 1 次：生成 1000 字
- 查看效果和完整性
- 如满意，继续生成其他小节

### 2. 使用 Prompt 编辑器

- 根据实际情况调整 Prompt
- 如果内容经常不完整，加强完整性要求
- 可以指定结构：引言→正文→案例→总结

### 3. 监控生成质量

- 查看实际字数
- 检查是否有结尾
- 验证内容完整性
- 如有问题，使用"重新生成"

### 4. 手动调整

- 生成后使用"编辑"功能
- 补充不完整的部分
- 调整结构和格式
- 添加个性化内容

## 技术改进方向

### 短期改进

1. **增加超时配置**:
   ```typescript
   // 允许更长的生成时间
   const timeout = 180000; // 3 分钟
   ```

2. **实现重试机制**:
   ```typescript
   async function generateWithRetry(prompt, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await callGeminiAPI(prompt);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await sleep(2000 * (i + 1)); // 指数退避
       }
     }
   }
   ```

3. **前端错误处理**:
   ```javascript
   catch (error) {
     if (error.response?.status === 502) {
       showNotification('⚠️ 生成超时，请减少字数或稍后重试', 'error');
     } else {
       showNotification(`❌ ${error.message}`, 'error');
     }
   }
   ```

### 长期改进

1. **流式生成**: 使用 SSE 实时显示生成进度
2. **断点续传**: 支持从中断处继续生成
3. **本地缓存**: 缓存部分生成的内容
4. **质量评分**: 自动评估内容完整性

## 常见问题 FAQ

**Q1: 为什么有时候生成成功，有时候 502？**

A1: 可能原因：
- API 响应时间不稳定
- 网络波动
- 速率限制
- 内容复杂度不同

**Q2: Prompt 编辑器一直不出现怎么办？**

A2: 
1. 清除浏览器缓存（Ctrl+Shift+R）
2. 使用无痕模式测试
3. 检查浏览器控制台错误
4. 确认是最新版本的代码

**Q3: 生成的内容还是不完整怎么办？**

A3:
1. 在 Prompt 编辑器中进一步强调完整性
2. 减少字数要求
3. 使用"重新生成"多试几次
4. 手动使用"编辑"补充结尾

**Q4: 可以增加生成超时时间吗？**

A4: 
- Cloudflare Workers 免费版有 30 秒 CPU 时间限制
- 付费版可以增加到 30 秒
- 但 API 调用时间不计入 CPU 时间
- 主要受网络超时限制

---

**更新日期**: 2025-11-20  
**Git Commit**: 50fe5ea  
**相关文档**: TROUBLESHOOTING_404_502.md
