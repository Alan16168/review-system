# Release Notes - Version 10.0.0 🎉

**发布日期**: 2025-11-29  
**生产URL**: https://review-system.pages.dev  
**部署URL**: https://8e3d9ae2.review-system.pages.dev

---

## 🚀 重大更新

这是一个**重大版本发布**，包含多项关键功能改进和问题修复，显著提升了系统的可用性和用户体验。

---

## ✨ 新增功能

### 1. **权限系统重构**
- ✅ **所有用户都可以编辑自己的模板**（之前只有 Premium/Admin 可以）
- ✅ **基于归属的权限控制**（Admin 可编辑所有，用户只能编辑自己的）
- ✅ 移除了过于严格的 `premiumOrAdmin` 中间件
- ✅ 细粒度权限检查（每个端点独立验证归属）

**影响的端点**：
- `POST /api/templates/:id/questions` - 添加问题
- `PUT /api/templates/:templateId/questions/:questionId` - 更新问题
- `DELETE /api/templates/:templateId/questions/:questionId` - 删除问题
- `PUT /api/templates/:id/questions/reorder` - 重新排序问题

### 2. **答案组导航优化**
- ✅ **新答案组自动显示在最后**（例如：1/1 → 创建 → 2/2）
- ✅ **创建后自动导航到新记录**，无需手动切换
- ✅ **答案组按时间升序排列**（旧→新），符合时间顺序直觉
- ✅ 简化创建流程，移除弹窗，直接返回编辑界面

**用户体验**：
```
初始状态: 1/1 (旧记录)
↓ 点击"创建新答案组"
自动切换: 2/2 (新记录) ✅
点击"上一组": 1/2 (旧记录)
```

### 3. **会话管理增强**
- ✅ **Axios 响应拦截器**：自动捕获 401 错误
- ✅ **会话过期提示**：显示"会话已过期，请重新登录"
- ✅ **自动清理认证状态**：清除 token 和用户信息
- ✅ **多语言支持**：6种语言（中文、英文、日文、西班牙文、繁体中文、法文）

### 4. **数据库结构修复**
- ✅ **添加 `owner` 字段**：public/private 问题归属
- ✅ **添加 `required` 字段**：yes/no 必填标记
- ✅ **修复表结构**：解决了 500 Internal Server Error
- ✅ **数据迁移脚本**：0072_fix_extended_question_types.sql

---

## 🐛 问题修复

### 1. **401/403 权限错误**
- ❌ **问题**：普通用户编辑自己的模板时收到 "Unauthorized" 错误
- ✅ **修复**：改为基于归属的权限控制，用户可以编辑自己创建的模板
- 📄 **文档**：`FIX_PERMISSION_ISSUE.md`

### 2. **500 数据库错误**
- ❌ **问题**：编辑问题时返回 500 Internal Server Error
- ✅ **修复**：修复 `template_questions` 表结构，添加缺失的 `owner` 和 `required` 列
- 📄 **文档**：`SOLUTION_UNAUTHORIZED_500.md`, `HOTFIX_DATABASE_500.sql`

### 3. **答案组导航问题**
- ❌ **问题**：创建新答案组后，显示为 "1/2" 而不是 "2/2"
- ✅ **修复**：修改排序逻辑为升序，新记录显示在最后
- 📄 **文档**：`FEATURE_NEW_ANSWER_SET_NAVIGATION.md`

### 4. **会话过期处理**
- ❌ **问题**：Token 过期后，用户仍能操作但收到 401 错误
- ✅ **修复**：添加全局 401 拦截器，自动提示并跳转登录
- 📄 **文档**：`HOTFIX_V9.10.5.md`

---

## 🔧 技术改进

### 后端改进
```typescript
// 旧逻辑：角色检查
templates.put('/:id/questions/:id', premiumOrAdmin, async (c) => {
  // Premium/Admin 才能执行
});

// 新逻辑：归属检查
templates.put('/:id/questions/:id', async (c) => {
  const template = await getTemplate(id);
  if (user.role !== 'admin' && template.created_by !== user.id) {
    return c.json({ error: 'You can only edit your own templates' }, 403);
  }
});
```

### 前端改进
```javascript
// 旧逻辑：降序排列（最新在前）
sets.sort((a, b) => dateB - dateA); // [新, 旧]

// 新逻辑：升序排列（最旧在前）
sets.sort((a, b) => dateA - dateB); // [旧, 新] ✅

// 创建后导航到最后
window.currentSetIndex = window.currentAnswerSets.length - 1;
```

### 数据库改进
```sql
-- 添加缺失的列
ALTER TABLE template_questions ADD COLUMN owner TEXT DEFAULT 'public';
ALTER TABLE template_questions ADD COLUMN required TEXT DEFAULT 'no';

-- 支持的问题类型（包含新增的4种）
CHECK(question_type IN (
  'text', 'multiline_text', 'number', 
  'single_choice', 'multiple_choice', 'dropdown',
  'time_with_text', 'markdown'
))
```

---

## ⚠️ 破坏性变更

### 1. **答案组排序顺序改变**
- **旧版本**：按创建时间降序（最新在前）
- **新版本**：按创建时间升序（最旧在前）
- **影响**：用户界面中答案组的显示顺序会反转
- **迁移**：自动生效，无需手动操作

### 2. **权限模型改变**
- **旧版本**：基于角色（Premium/Admin 可编辑所有）
- **新版本**：基于归属（用户只能编辑自己的）
- **影响**：Premium 用户不再能编辑其他人的模板
- **迁移**：Admin 角色不受影响，仍可编辑所有模板

---

## 📊 版本对比

| 功能 | v9.x | v10.0.0 |
|------|------|---------|
| 普通用户编辑自己的模板 | ❌ 403 Forbidden | ✅ 允许 |
| 新答案组显示位置 | 1/2（前面） | 2/2（后面） ✅ |
| 会话过期处理 | ❌ 无提示 | ✅ 自动提示+跳转 |
| 数据库结构 | ❌ 缺失列 | ✅ 完整 |
| 多语言支持 | ❌ 仅中文 | ✅ 6种语言 |

---

## 🎯 升级指南

### 自动升级（推荐）
- 直接访问 https://review-system.pages.dev
- 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
- 如有登录状态，请重新登录以刷新权限

### 数据库迁移
- ✅ **已自动执行**：数据库结构已在生产环境修复
- ✅ **数据完整性**：所有75条问题记录已验证
- ✅ **迁移脚本**：`migrations/0072_fix_extended_question_types.sql`

---

## 📋 测试清单

### 权限测试
- [x] 普通用户可以创建模板
- [x] 普通用户可以编辑自己的模板
- [x] 普通用户不能编辑他人的模板
- [x] Admin 可以编辑所有模板

### 答案组测试
- [x] 创建新答案组后自动导航到新记录
- [x] 新记录显示在最后（2/2, 3/3）
- [x] 旧记录按时间顺序排列
- [x] 导航按钮正常工作（上一组/下一组）

### 会话管理测试
- [x] Token 过期后显示提示
- [x] 自动清除认证状态
- [x] 自动跳转到登录页
- [x] 多语言提示正常显示

---

## 🔗 相关文档

- `FIX_PERMISSION_ISSUE.md` - 权限系统修复详情
- `FEATURE_NEW_ANSWER_SET_NAVIGATION.md` - 答案组导航功能
- `SOLUTION_UNAUTHORIZED_500.md` - 500错误解决方案
- `HOTFIX_V9.10.5.md` - 会话管理增强
- `HOTFIX_DATABASE_500.sql` - 数据库修复脚本

---

## 🎉 总结

v10.0.0 是一个**重大里程碑版本**，解决了多个关键问题，显著改善了用户体验：

✅ **权限系统更合理**：用户可以管理自己的模板  
✅ **导航更直观**：新记录在后面，符合时间顺序  
✅ **会话管理更完善**：过期自动提示  
✅ **数据库结构完整**：无 500 错误  
✅ **多语言支持**：国际化体验

**感谢使用 Review System！**

---

**部署信息**：
- 版本：10.0.0
- 生产URL：https://review-system.pages.dev
- 部署时间：2025-11-29
- Git 提交：dd3fc8c
