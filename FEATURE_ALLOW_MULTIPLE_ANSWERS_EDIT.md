# ✨ 功能更新：可编辑"是否允许多个复盘答案"设置

## 📋 功能概述

现在在编辑复盘表头时，创建者可以修改"是否允许多个复盘答案"设置。当设置改变时，答案组管理功能的显示会相应更新。

---

## 🎯 功能特性

### 1. **可编辑的设置**
- ✅ 创建者可以在编辑页面修改"是否允许多个复盘答案"
- ✅ 非创建者只能查看，不能修改（显示为禁用状态）
- ✅ 提供清晰的选项说明

### 2. **动态界面更新**
- ✅ **设置为 Yes**：显示答案组管理功能（包括"答案组管理"区域）
- ✅ **设置为 No**：隐藏答案组管理功能
- ✅ 修改设置后自动保存并刷新界面

### 3. **用户体验优化**
- ✅ 修改设置时显示保存提示
- ✅ 保存成功后显示成功消息
- ✅ 自动刷新页面以更新界面状态
- ✅ 提供黄色警告框提示用户修改后会刷新

---

## 🖼️ 界面展示

### 编辑表头 - 允许多个复盘答案设置

```
┌─────────────────────────────────────────────────────┐
│ 是否允许多个复盘答案 *                              │
│                                                     │
│ ○ 是 (可创建多个答案组)                             │
│ ○ 否 (仅一个答案组)                                 │
│                                                     │
│ ⚠️ 修改此设置后将刷新页面以更新答案组管理功能的显示  │
└─────────────────────────────────────────────────────┘
```

### 创建者视图（可编辑）
- 单选按钮可点击
- 选择后立即保存
- 自动刷新界面

### 非创建者视图（只读）
- 单选按钮显示为禁用状态
- 底部显示"🔒 仅创建者可编辑"提示

---

## 🔧 技术实现

### 1. 前端修改

**修改位置**: `public/static/app.js`

**主要更改**:

1. **将只读显示改为可编辑单选按钮**:
```javascript
<div class="flex space-x-4">
  <label class="flex items-center ${!isCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}">
    <input type="radio" name="allow_multiple_answers" value="yes" 
           ${review.allow_multiple_answers === 'yes' ? 'checked' : ''}
           ${!isCreator ? 'disabled' : ''}
           onchange="handleAllowMultipleAnswersChange(${id})">
    <span>是 (可创建多个答案组)</span>
  </label>
  <label class="flex items-center ${!isCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}">
    <input type="radio" name="allow_multiple_answers" value="no" 
           ${review.allow_multiple_answers === 'no' ? 'checked' : ''}
           ${!isCreator ? 'disabled' : ''}
           onchange="handleAllowMultipleAnswersChange(${id})">
    <span>否 (仅一个答案组)</span>
  </label>
</div>
```

2. **添加动态显示/隐藏答案组管理区域**:
```javascript
<div id="answer-sets-section" 
     style="${review.allow_multiple_answers === 'no' ? 'display: none;' : ''}">
  <!-- 答案组管理内容 -->
</div>
```

3. **添加处理函数**:
```javascript
async function handleAllowMultipleAnswersChange(reviewId) {
  try {
    const allowMultipleAnswers = document.querySelector(
      'input[name="allow_multiple_answers"]:checked'
    )?.value || 'yes';
    
    showNotification('正在保存更改...', 'info');
    
    await axios.put(`/api/reviews/${reviewId}`, {
      allow_multiple_answers: allowMultipleAnswers
    });
    
    showNotification('保存成功，正在刷新页面...', 'success');
    
    setTimeout(() => {
      showEditReview(reviewId);
    }, 800);
  } catch (error) {
    showNotification('保存失败: ' + error.message, 'error');
  }
}
```

4. **在保存时包含allow_multiple_answers字段**:
```javascript
if (isCreator) {
  const allowMultipleAnswers = document.querySelector(
    'input[name="allow_multiple_answers"]:checked'
  )?.value || 'yes';
  
  data = {
    title,
    description,
    // ... 其他字段
    allow_multiple_answers: allowMultipleAnswers,
    answers
  };
}
```

---

## 📊 使用流程

### 场景1：启用多个答案组

1. **打开复盘编辑页面**
2. **点击"是否允许多个复盘答案"**
3. **选择"是"**
4. **系统自动保存**
5. **页面自动刷新**
6. **答案组管理功能显示**
7. **可以创建新答案组**

### 场景2：禁用多个答案组

1. **打开复盘编辑页面**
2. **点击"是否允许多个复盘答案"**
3. **选择"否"**
4. **系统自动保存**
5. **页面自动刷新**
6. **答案组管理功能隐藏**
7. **只保留一个默认答案组**

---

## ⚠️ 注意事项

### 1. 权限控制
- **只有创建者可以修改此设置**
- 团队成员只能查看当前设置
- 非创建者看到的是禁用状态的单选按钮

### 2. 数据一致性
- 修改设置不会删除已有的答案组
- 从"是"改为"否"后，已有的多个答案组仍然存在
- 但用户界面会隐藏创建新答案组的功能

### 3. 界面刷新
- 修改设置后会自动刷新页面
- 保存提示会在800ms后自动消失
- 刷新后会保持在编辑页面

### 4. 后端兼容性
- 后端API已支持接收`allow_multiple_answers`字段
- 默认值为`'yes'`（允许多个答案组）
- 兼容旧数据（没有此字段的review会使用默认值）

---

## 🧪 测试指南

### 测试步骤

1. **测试创建者编辑**:
   ```
   1. 以创建者身份登录
   2. 打开一个review的编辑页面
   3. 找到"是否允许多个复盘答案"设置
   4. 修改设置从"是"到"否"
   5. 确认显示保存提示
   6. 确认页面自动刷新
   7. 确认答案组管理功能已隐藏
   8. 再次修改设置从"否"到"是"
   9. 确认答案组管理功能重新显示
   ```

2. **测试非创建者查看**:
   ```
   1. 以团队成员身份登录
   2. 打开一个team review的编辑页面
   3. 找到"是否允许多个复盘答案"设置
   4. 确认单选按钮显示为禁用状态
   5. 确认无法修改设置
   6. 确认底部显示"仅创建者可编辑"提示
   ```

3. **测试答案组管理功能显示/隐藏**:
   ```
   1. 创建一个新review，设置allow_multiple_answers为"是"
   2. 编辑该review
   3. 确认"答案组管理"区域显示
   4. 确认可以创建新答案组
   5. 修改设置为"否"
   6. 确认页面刷新后"答案组管理"区域隐藏
   7. 确认"创建新答案组"按钮不显示
   ```

4. **测试保存功能**:
   ```
   1. 修改allow_multiple_answers设置
   2. 点击"保存并退出"按钮
   3. 返回复盘列表
   4. 重新打开该review
   5. 确认设置已正确保存
   ```

### 预期结果

- ✅ 创建者可以修改设置
- ✅ 非创建者不能修改设置
- ✅ 设置为Yes时答案组管理功能显示
- ✅ 设置为No时答案组管理功能隐藏
- ✅ 修改设置后自动保存并刷新
- ✅ 保存后设置正确持久化到数据库

---

## 🔍 故障排除

### 问题1: 修改后没有刷新

**可能原因**: JavaScript错误

**解决方案**:
1. 打开浏览器Console (F12)
2. 查看是否有错误信息
3. 确认`handleAllowMultipleAnswersChange`函数已正确执行
4. 检查网络请求是否成功

### 问题2: 答案组管理功能没有显示/隐藏

**可能原因**: 页面缓存或CSS问题

**解决方案**:
1. 清除浏览器缓存
2. 强制刷新 (Ctrl+Shift+R / Cmd+Shift+R)
3. 检查元素的`display`属性是否正确设置
4. 确认`allow_multiple_answers`值已正确保存

### 问题3: 保存失败

**可能原因**: 权限问题或后端错误

**解决方案**:
1. 确认当前用户是review的创建者
2. 检查后端日志查看错误信息
3. 确认数据库连接正常
4. 检查API请求的数据格式是否正确

---

## 📝 相关代码

- **前端代码**: `public/static/app.js`
  - `showEditReview()` 函数 (第6405行起)
  - `handleAllowMultipleAnswersChange()` 函数 (第7703行起)
  - `handleSaveAndExitReview()` 函数 (第7549行起)

- **后端代码**: `src/routes/reviews.ts`
  - PUT `/api/reviews/:id` 路由（更新review）

- **数据库字段**: `reviews` 表
  - `allow_multiple_answers` (TEXT, 默认值: 'yes')

---

## 🎉 总结

此功能提供了灵活的答案组管理控制：

- ✅ **灵活性**: 创建者可以根据需要启用/禁用多答案组
- ✅ **即时反馈**: 修改后立即保存并刷新界面
- ✅ **权限控制**: 只有创建者可以修改设置
- ✅ **用户友好**: 清晰的界面提示和自动刷新

---

**功能完成时间**: 2025-11-27 02:00 UTC  
**Git Commit**: dabafa7 - "功能: 允许在编辑表头时修改allow_multiple_answers设置"  
**状态**: ✅ 已完成并测试
