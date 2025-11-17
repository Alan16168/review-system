# 前端更新计划 - 添加 Owner 和 Required 字段UI

## 📋 需要修改的内容

### 1. 在问题表单中添加UI字段

**位置**: `showAddQuestionForm()` 函数中的表单HTML

**需要添加的HTML**（在 Answer Length 后面）:

```html
<!-- Answer Owner (答案可见性) -->
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    ${i18n.t('answerOwner')} *
  </label>
  <select id="question-owner" 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
    <option value="public">${i18n.t('answerOwnerPublic')}</option>
    <option value="private">${i18n.t('answerOwnerPrivate')}</option>
  </select>
  <p class="text-xs text-gray-500 mt-1">${i18n.t('answerOwnerHint')}</p>
</div>

<!-- Answer Required (是否必填) -->
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    ${i18n.t('answerRequired')} *
  </label>
  <select id="question-required" 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
    <option value="no">${i18n.t('answerRequiredNo')}</option>
    <option value="yes">${i18n.t('answerRequiredYes')}</option>
  </select>
  <p class="text-xs text-gray-500 mt-1">${i18n.t('answerRequiredHint')}</p>
</div>
```

### 2. 在数据收集函数中添加字段

**位置**: `collectQuestionFormData()` 函数的返回对象

**需要添加** (在 return data 之前):

```javascript
// Add owner and required fields (new in V6.7.0)
data.owner = document.getElementById('question-owner').value || 'public';
data.required = document.getElementById('question-required').value || 'no';
```

### 3. 在编辑表单中回填数据

**位置**: `showEditQuestionForm(questionId)` 函数

**需要添加** (在设置其他字段值之后):

```javascript
// Set owner and required values
document.getElementById('question-owner').value = question.owner || 'public';
document.getElementById('question-required').value = question.required || 'no';
```

### 4. 在问题列表中显示视觉指示器

**位置**: `renderQuestionsList()` 函数

**需要添加** (在问题类型标签后面):

```html
<!-- Show badges for private and required -->
${q.owner === 'private' ? `
  <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
    <i class="fas fa-lock mr-1"></i>${i18n.t('answerOwnerPrivate')}
  </span>
` : ''}
${q.required === 'yes' ? `
  <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
    <i class="fas fa-asterisk mr-1"></i>${i18n.t('answerRequiredYes')}
  </span>
` : ''}
```

## 📝 翻译文本状态

已在 `i18n.js` 中添加的翻译：

**中文**:
- answerOwner: '答案可见性'
- answerOwnerPublic: '公开'
- answerOwnerPrivate: '私人'
- answerOwnerHint: '公开：所有有权查看复盘的人均可见；私人：仅回答者和复盘创建者可见'
- answerRequired: '是否必填'
- answerRequiredYes: '必填'
- answerRequiredNo: '可选'
- answerRequiredHint: '必填：答案不能为空；可选：答案可以为空'

**英文**:
- answerOwner: 'Answer Visibility'
- answerOwnerPublic: 'Public'
- answerOwnerPrivate: 'Private'
- answerOwnerHint: 'Public: visible to all with review access; Private: only visible to answerer and review creator'
- answerRequired: 'Required'
- answerRequiredYes: 'Yes'
- answerRequiredNo: 'No'
- answerRequiredHint: 'Yes: answer cannot be empty; No: answer can be empty'

## 🔍 需要搜索的函数

1. `showAddQuestionForm()` - 添加问题表单 (~line 8240)
2. `showEditQuestionForm(questionId)` - 编辑问题表单 (~line 8350)
3. `collectQuestionFormData()` - 收集表单数据 (line 8448)
4. `renderQuestionsList()` - 渲染问题列表 (~line 7897)

## ⚠️ 注意事项

1. **app.js 文件很大**（11000+行），需要精确定位修改位置
2. **HTML字符串中的转义**：使用 `${i18n.t('key')}` 时需要在模板字符串中
3. **默认值**：owner 默认 'public'，required 默认 'no'
4. **向后兼容**：旧问题可能没有这些字段，需要使用 `|| 'public'` 和 `|| 'no'`

## 🎯 实施步骤

1. ✅ 数据库已修复（owner 和 required 字段已添加）
2. ✅ 后端API已更新（返回这两个字段）
3. ✅ 翻译文本已添加（i18n.js）
4. ⏳ 更新前端表单HTML（待完成）
5. ⏳ 更新数据收集函数（待完成）
6. ⏳ 更新编辑回填逻辑（待完成）
7. ⏳ 更新问题列表显示（待完成）
8. ⏳ 测试所有功能（待完成）

## 📦 预期结果

更新后，用户在模板编辑界面应该能够：

1. **创建问题时**：
   - 看到"答案可见性"下拉框（公开/私人）
   - 看到"是否必填"下拉框（可选/必填）
   - 看到对应的提示文字

2. **编辑问题时**：
   - 看到当前问题的 owner 和 required 值
   - 可以修改这些值

3. **查看问题列表时**：
   - 私人问题显示锁图标
   - 必填问题显示红色星号标记

4. **API调用**：
   - 创建/更新问题时发送 owner 和 required 字段
   - 后端保存到数据库
   - 查询时返回这些字段
