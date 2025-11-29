# 字段类型对比：文本 vs 多行文本

## 📋 问题概述

用户询问："文本"（text）和"多行文本"（multiline_text）字段类型的区别是什么？

---

## 🔍 当前实现分析

### 数据库层面
两种类型在数据库中都是 `TEXT` 类型，区别仅在于 `question_type` 字段的值：
```sql
question_type TEXT DEFAULT 'text' CHECK(question_type IN (
  'text',           -- 文本
  'multiline_text', -- 多行文本
  ...
))
```

### 前端实现层面

**当前问题**：在现有代码中，`text` 和 `multiline_text` 的处理逻辑**完全相同**：

1. **编辑时的输入控件**：
   ```javascript
   // 两种类型都使用相同的 textarea
   <textarea rows="3" class="...">
   ```

2. **显示时的样式**：
   ```javascript
   // 两种类型都使用相同的显示样式
   <p class="whitespace-pre-wrap">{answer}</p>
   ```

3. **字符限制**：
   ```javascript
   // 两种类型都使用 answer_length 字段控制最大字符数
   maxlength="${question.answer_length || 50}"
   ```

---

## 💡 应该有的区别

根据字段命名和常见 UX 实践，这两种类型**应该**有以下区别：

| 特性 | 文本（text） | 多行文本（multiline_text） |
|------|------------|------------------------|
| **输入控件** | 单行输入框 `<input type="text">` | 多行文本框 `<textarea>` |
| **高度** | 固定单行 | 可调整高度（多行） |
| **适用场景** | 短文本（姓名、标题、关键词） | 长文本（描述、评论、详细说明） |
| **默认行数** | 1行 | 5-10行 |
| **用户体验** | 快速输入简短内容 | 舒适输入段落内容 |
| **换行支持** | 不支持换行 | 支持换行 |

---

## 🐛 现存问题

### 问题1：没有实际区别
目前 `text` 和 `multiline_text` 的实现完全相同，都使用 `<textarea rows="3">`，失去了区分的意义。

### 问题2：用户体验不佳
- `text` 类型使用 textarea（应该用 input）
- `multiline_text` 只有 3 行（应该更多行）
- 用户无法从界面感受到两者的区别

---

## ✅ 建议的修复方案

### 方案1：明确区分（推荐）

**文本（text）**：
```javascript
// 使用单行 input
<input type="text" 
       maxlength="${question.answer_length || 50}"
       class="w-full px-4 py-2 border rounded-lg"
       placeholder="${i18n.t('enterAnswer')}">
```

**多行文本（multiline_text）**：
```javascript
// 使用多行 textarea，至少 5 行
<textarea rows="5" 
          maxlength="${question.answer_length || 500}"
          class="w-full px-4 py-2 border rounded-lg resize-y"
          placeholder="${i18n.t('enterAnswer')}"></textarea>
```

### 方案2：调整默认值

| 类型 | 默认最大字符数 | 默认行数 | 输入控件 |
|------|--------------|---------|---------|
| text | 50 | 1 | input |
| multiline_text | 500 | 5-10 | textarea |

---

## 🎯 实际使用场景举例

### 文本（text）
- ✅ 姓名：张三
- ✅ 项目名称：Review System v10.0
- ✅ 关键词：bug, feature, performance
- ❌ 不适合：长段落描述

### 多行文本（multiline_text）
- ✅ 问题描述：用户反馈登录功能存在以下问题：\n1. 密码输入时无法显示/隐藏\n2. 忘记密码链接失效\n3. 第三方登录按钮显示不正常
- ✅ 复盘总结：本次sprint完成了5个功能点...(多行)
- ✅ 改进建议：建议在下个版本中...(段落)
- ❌ 不适合：单个关键词

---

## 📊 其他系统的实践

### GitHub Issues
- **Title** → 单行文本框（text）
- **Comment** → 大型多行文本框（multiline_text）

### Jira
- **Summary** → 单行文本框（text）
- **Description** → 富文本编辑器（multiline_text / markdown）

### Google Forms
- **短文本** → 单行输入框（text）
- **段落** → 多行文本框（multiline_text）

---

## 🚀 优先级和影响

### 优先级：中等
- 不影响功能，但影响用户体验
- 当前可以正常使用，但不够直观
- 应该在下个小版本中修复

### 影响范围：
- 前端：`public/static/app.js` 中的渲染逻辑
- 文件：约 3-5 处修改
- 用户：所有使用模板功能的用户

### 修复工作量：
- 估计：30-60 分钟
- 难度：简单
- 风险：低

---

## 🔧 修复计划

### 步骤1：修改编辑答案的输入控件
在 `editAnswerInSet()` 和 `editEmptyAnswerInSet()` 函数中：
- 检查 `question.question_type`
- 如果是 `text`，使用 `<input type="text">`
- 如果是 `multiline_text`，使用 `<textarea rows="8">`

### 步骤2：调整默认字符限制
- `text`: 默认 50 字符
- `multiline_text`: 默认 500 字符

### 步骤3：测试验证
- 创建两种类型的问题
- 验证输入体验
- 确认字符限制生效

---

## 📝 总结

### 当前状态
- ❌ `text` 和 `multiline_text` 实现完全相同
- ❌ 都使用 `<textarea rows="3">`
- ❌ 用户体验不够明确

### 应该的状态
- ✅ `text` 使用单行 `<input>`
- ✅ `multiline_text` 使用多行 `<textarea>`（5-10行）
- ✅ 字符限制有明显区别（50 vs 500）
- ✅ 用户能清晰感受到两者的区别

### 行动建议
1. **立即优化**：修改前端渲染逻辑，明确区分两种类型
2. **文档更新**：在用户文档中说明两种类型的使用场景
3. **版本规划**：纳入 v10.1.0 的改进项

---

**文档创建时间**: 2025-11-29  
**当前版本**: v10.0.0  
**建议修复版本**: v10.1.0
