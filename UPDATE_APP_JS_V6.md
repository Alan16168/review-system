# 更新 app.js 以使用新的 Review Editor v6.0.0

## 需要的更改

### 1. 替换所有 `showCreateReview()` 调用
将所有 `onclick="showCreateReview()"` 替换为 `onclick="showReviewEditor(null)"`

**位置:**
- Line 1076
- Line 1385  
- Line 1748

### 2. 替换所有 `showEditReview(id)` 调用
将所有 `onclick="showEditReview(${review.id})"` 替换为 `onclick="showReviewEditor(${review.id})"`

**位置:**
- Line 1325
- Line 1616
- Line 1830
- Line 3125

### 3. 可选：删除或注释旧函数
可以保留旧函数作为备份，或者完全删除：

**需要删除/注释的旧函数:**
- `showCreateReview()` (around line 1909)
- `showCreateReviewStep2()` (around line 2347)
- `handleStep1Submit()` (around line 2269)
- `handleCreateReview()` 
- `createBlankDraft()`
- `showEditReview()` (around line 3490)
- `handleEditReview()` (around line 4173)
- `handleEditReviewCancel()`

**注意:** 不要立即删除，先注释掉，测试新功能后再删除。

### 4. 保留的辅助函数
以下函数仍然需要（被新编辑器使用）：
- `showReviews()` - 返回复盘列表
- `showNotification()` - 显示通知
- `loadAnswerSets()` - 加载答案集（如果新编辑器调用它）
- 所有其他不相关的函数（团队、模板、用户等）

## 执行策略

### 阶段1：最小更改（推荐首先做这个）
1. 只修改入口调用（showCreateReview → showReviewEditor）
2. 保留所有旧函数
3. 测试新编辑器是否工作
4. 如果有问题，可以轻松回退

### 阶段2：清理代码（测试通过后）
1. 注释掉旧的创建/编辑函数
2. 测试确认没有引用错误
3. 完全删除旧代码

### 阶段3：优化（可选）
1. 整理代码结构
2. 添加更多注释
3. 性能优化

## 具体修改命令

使用sed批量替换（在Linux/Mac上）：

```bash
# 备份原文件
cp public/static/app.js public/static/app.js.backup.v5

# 替换 showCreateReview() 为 showReviewEditor(null)
sed -i 's/onclick="showCreateReview()"/onclick="showReviewEditor(null)"/g' public/static/app.js

# 替换 showEditReview(${review.id}) 为 showReviewEditor(${review.id})
sed -i 's/onclick="showEditReview(\${review\.id})"/onclick="showReviewEditor(${review.id})"/g' public/static/app.js
```

或手动编辑（更安全）：
1. 打开 public/static/app.js
2. 搜索 `showCreateReview()`，替换为 `showReviewEditor(null)`
3. 搜索 `showEditReview(${review.id})`，替换为 `showReviewEditor(${review.id})`
4. 保存文件

## 测试清单

### 创建功能测试
- [ ] 点击"创建复盘"按钮
- [ ] 显示新的编辑器UI（三个可折叠区域）
- [ ] 填写表头信息
- [ ] 保存后成功创建复盘
- [ ] 保存后自动返回列表

### 编辑功能测试
- [ ] 点击现有复盘的"编辑"按钮
- [ ] 显示新的编辑器UI（三个可折叠区域）
- [ ] 正确加载现有数据
- [ ] 可以修改内容
- [ ] 可以添加/删除答案
- [ ] 保存后成功更新
- [ ] 保存后自动返回列表

### 权限测试
- [ ] 创建者可以修改所有字段
- [ ] 非创建者只能修改答案
- [ ] template_id在编辑模式下不可修改

### UI测试
- [ ] 区域可以折叠/展开
- [ ] 按钮点击有反馈
- [ ] 表单验证工作正常
- [ ] 错误提示清晰
- [ ] 成功提示显示

### 兼容性测试
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] 移动端浏览器

## 回滚计划

如果新编辑器有问题：

```bash
# 恢复备份
cp public/static/app.js.backup.v5 public/static/app.js

# 重新构建
npm run build

# 重新部署
npm run deploy
```

## 注意事项

1. **备份:** 修改前一定要备份app.js
2. **渐进式:** 先改调用，不删除旧函数
3. **测试:** 每个阶段都要充分测试
4. **文档:** 记录所有更改
5. **版本:** 标记为 v6.0.0

## 预期结果

- ✅ 统一的创建和编辑界面
- ✅ 新的UI设计（三个可折叠区域）
- ✅ 更少的代码重复
- ✅ 更易维护
- ✅ 更好的用户体验
