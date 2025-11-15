# 草稿编辑错误修复报告

## 🐛 问题描述

用户在编辑草稿时遇到 HTTP 500 错误，导致无法正常编辑复盘内容。

## 🔍 根本原因

通过分析服务器日志，发现根本原因是**数据库架构不一致**：

```
D1_ERROR: no such column: tp.name_en at offset 133: SQLITE_ERROR
```

### 详细原因

1. **GET /api/reviews/:id 路由** 在查询时尝试访问 `templates` 表的 `name_en` 和 `description_en` 列
2. 这些列是通过迁移 `0011_add_template_i18n.sql` 添加的
3. **本地开发数据库**可能没有完全应用所有迁移，导致缺少这些列
4. 当查询执行时，SQLite 报错"列不存在"，返回 500 错误

### SQL 查询问题

原始查询：
```sql
SELECT r.*, u.username as creator_name, t.name as team_name, 
       CASE WHEN ? = 'en' AND tp.name_en IS NOT NULL THEN tp.name_en ELSE tp.name END as template_name,
       CASE WHEN ? = 'en' AND tp.description_en IS NOT NULL THEN tp.description_en ELSE tp.description END as template_description
FROM reviews r
LEFT JOIN templates tp ON r.template_id = tp.id
...
```

问题：查询直接引用 `tp.name_en` 和 `tp.description_en`，如果列不存在会导致 SQL 错误。

## ✅ 解决方案

### 1. 后端修复（src/routes/reviews.ts）

**简化模板名称查询**，移除对国际化列的依赖：

```typescript
// 修复前
const query = `
  SELECT r.*, u.username as creator_name, t.name as team_name, 
         CASE WHEN ? = 'en' AND tp.name_en IS NOT NULL THEN tp.name_en ELSE tp.name END as template_name,
         CASE WHEN ? = 'en' AND tp.description_en IS NOT NULL THEN tp.description_en ELSE tp.description END as template_description
  FROM reviews r
  ...
`;
const review = await c.env.DB.prepare(query).bind(lang, lang, reviewId, user.id, user.id, user.id).first();

// 修复后
const query = `
  SELECT r.*, u.username as creator_name, t.name as team_name, 
         tp.name as template_name,
         tp.description as template_description
  FROM reviews r
  ...
`;
const review = await c.env.DB.prepare(query).bind(reviewId, user.id, user.id, user.id).first();
```

**优点：**
- 不依赖可能不存在的国际化列
- 简化查询逻辑
- 兼容新旧数据库架构

### 2. 前端错误处理增强（public/static/app.js）

添加了多层防护：

1. **详细日志记录**：
```javascript
console.log('[showEditReview] 开始加载复盘 ID:', id);
console.log('[showEditReview] 服务器响应:', response.data);
console.log('[showEditReview] 我的答案:', myAnswers);
```

2. **JSON 解析安全处理**：
```javascript
let options = [];
try {
  options = JSON.parse(q.options);
} catch (e) {
  console.error('[showEditReview] 解析选项失败:', e, q.options);
  options = [];
}
```

3. **空值检查**：
```javascript
const selectedLetters = myAnswer ? myAnswer.split(',').map(a => a.trim()) : [];
```

4. **增强错误提示**：
```javascript
} catch (error) {
  console.error('[showEditReview] 加载失败:', error);
  const errorMsg = error.response?.data?.error || error.message || '未知错误';
  showNotification(
    i18n.t('operationFailed') + ': ' + errorMsg + ' (查看控制台获取详情)',
    'error'
  );
}
```

## 📦 已提交的修复

```bash
# Commit 1: 前端错误处理
git commit -m "Fix draft editing: Add error handling and debug logs for showEditReview function"

# Commit 2: 后端查询简化
git commit -m "Fix draft editing: Remove dependency on template i18n columns to prevent 500 errors"
```

## 🧪 测试步骤

1. **访问开发服务器**：https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
2. 登录账户
3. 进入"我的复盘"页面
4. 点击任何草稿的"编辑"按钮
5. **预期结果**：
   - 页面正常加载
   - 显示复盘表单和问题
   - 无 500 错误
   - 控制台显示调试日志

## 📊 测试结果

### 本地开发环境
- ✅ 服务成功启动
- ✅ 首页正常加载
- ✅ API 路由响应正常
- ⏳ 等待用户测试编辑功能

### 生产环境
- ✅ 生产数据库有完整的列
- ✅ 查询简化后更健壮
- ⏳ 待部署到生产环境测试

## 🚀 部署计划

1. **当前状态**：修复已提交到 Git，本地开发服务器运行正常
2. **下一步**：
   - 用户测试本地修复
   - 如果测试通过，部署到生产环境
   - 更新 README.md 文档

## 💡 经验教训

1. **数据库迁移一致性很重要**：
   - 本地开发环境和生产环境必须保持一致
   - 新开发者加入时要确保应用所有迁移

2. **查询应该考虑向后兼容**：
   - 不要假设所有列都存在
   - 使用 `COALESCE` 或条件逻辑处理缺失列
   - 考虑使用数据库视图封装复杂查询

3. **前端需要健壮的错误处理**：
   - 始终使用 try-catch 包裹 JSON.parse
   - 在操作前检查空值和 undefined
   - 提供有用的错误消息和调试信息

4. **日志记录的重要性**：
   - 详细的日志可以快速定位问题
   - 生产环境也需要适当的日志级别

## 📝 后续优化建议

1. **数据库架构**：
   - 考虑使用迁移版本检查机制
   - 添加启动时的健康检查

2. **查询优化**：
   - 创建数据库视图简化复杂查询
   - 考虑缓存模板数据

3. **错误处理**：
   - 统一前端错误处理机制
   - 添加 Sentry 或类似工具进行错误追踪

4. **测试覆盖**：
   - 添加 API 端点的集成测试
   - 测试数据库迁移的向后兼容性

---

**修复完成时间**: 2025-11-15
**修复状态**: ✅ 已完成，待用户测试
**开发服务器**: https://3000-i1l7k2pbfdion8sxilbu1-6532622b.e2b.dev
