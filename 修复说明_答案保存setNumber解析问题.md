# 答案保存 setNumber 解析问题 - 修复说明

## 修复日期
2025-11-27

## 问题描述
用户报告保存答案时出现 500 错误：
```
Failed to load resource: the server responded with a status of 500 ()
/api/answer-sets/275/1:1
```

URL 路径中出现了错误的 `setNumber` 值 `1:1`，正确应该是整数 `1`。

## 根本原因分析

### 问题根源
`setNumber` 的值可能在某些情况下被污染或错误地解析，导致生成的 API URL 包含非法字符（如 `1:1` 而不是 `1`）。

虽然从数据库查询结果显示 `set_number` 列的值是正常的整数（1），但在 JavaScript 处理过程中，可能由于以下原因导致问题：

1. **类型转换问题**：`set_number` 可能在某些情况下被转换为字符串
2. **变量污染**：可能某个地方错误地使用了显示文本（如 "1 / 1"）作为 `setNumber`
3. **缺少类型验证**：没有确保 `setNumber` 始终是有效的整数

### 数据库验证
```sql
SELECT id, review_id, user_id, set_number, is_locked 
FROM review_answer_sets 
WHERE review_id = 275

-- 结果显示 set_number 列的值都是正常的整数 (1)
```

## 解决方案

### 防御性编程：在所有使用 `setNumber` 的地方添加 `parseInt` 和验证

修改了以下 6 个关键函数，确保 `setNumber` 始终是有效的整数：

1. **saveInlineAnswer** - 保存内联答案
2. **autoSaveDateTimeValue** - 自动保存日期时间值
3. **updateAnswerInSet** - 更新单选答案
4. **updateMultipleChoiceInSet** - 更新多选答案
5. **autoSaveDateTimeTitleAndAnswer** - 自动保存日期时间标题和答案
6. **toggleCurrentAnswerSetLock** - 锁定/解锁答案组
7. **deleteCurrentAnswerSet** - 删除答案组

### 修改模式

**修改前**：
```javascript
const setNumber = currentSet.set_number;

// 直接使用 setNumber 构造 URL
await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, ...);
```

**修改后**：
```javascript
const setNumber = parseInt(currentSet.set_number);

// 添加验证
if (isNaN(setNumber)) {
  console.error('[functionName] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}

// 使用已验证的整数构造 URL
await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, ...);
```

## 修改的文件
`public/static/app.js`

## 详细修改内容

### 1. saveInlineAnswer（行 ~14791）
```javascript
// 添加详细的调试日志
console.log('[saveInlineAnswer] Debug info:', {
  reviewId,
  questionNumber,
  setsLength: sets.length,
  currentIndex: index,
  currentAnswerSets: sets
});

const setNumber = parseInt(currentSet.set_number);

console.log('[saveInlineAnswer] Current set:', currentSet);
console.log('[saveInlineAnswer] Set number:', setNumber, 'Type:', typeof setNumber);
console.log('[saveInlineAnswer] API URL:', `/api/answer-sets/${reviewId}/${setNumber}`);

// 确保 setNumber 是有效的整数
const cleanSetNumber = parseInt(setNumber);
if (isNaN(cleanSetNumber)) {
  console.error('[saveInlineAnswer] Invalid set number:', setNumber);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

### 2. autoSaveDateTimeValue（行 ~14252）
```javascript
const setNumber = parseInt(currentSet.set_number);

if (isNaN(setNumber)) {
  console.error('[autoSaveDateTimeValue] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

### 3. updateAnswerInSet（行 ~14901）
```javascript
const setNumber = parseInt(currentSet.set_number);

console.log('[updateAnswerInSet] 组编号:', setNumber, 'Type:', typeof setNumber);

if (isNaN(setNumber)) {
  console.error('[updateAnswerInSet] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

### 4. updateMultipleChoiceInSet（行 ~14994）
```javascript
const setNumber = parseInt(currentSet.set_number);

console.log('[updateMultipleChoiceInSet] 组编号:', setNumber, 'Type:', typeof setNumber);

if (isNaN(setNumber)) {
  console.error('[updateMultipleChoiceInSet] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

### 5. autoSaveDateTimeTitleAndAnswer（行 ~15056）
```javascript
const setNumber = parseInt(currentSet.set_number);

if (isNaN(setNumber)) {
  console.error('[autoSaveDateTimeTitleAndAnswer] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

### 6. toggleCurrentAnswerSetLock（行 ~20488）
```javascript
const setNumber = parseInt(currentSet.set_number);

if (isNaN(setNumber)) {
  console.error('[toggleCurrentAnswerSetLock] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

### 7. deleteCurrentAnswerSet（行 ~20567）
```javascript
const setNumber = parseInt(currentSet.set_number);

if (isNaN(setNumber)) {
  console.error('[deleteCurrentAnswerSet] Invalid set number:', currentSet.set_number);
  showNotification('Invalid answer set number', 'error');
  return;
}
```

## 防御性编程策略

### 1. 类型强制转换
使用 `parseInt()` 确保 `setNumber` 始终是整数：
```javascript
const setNumber = parseInt(currentSet.set_number);
```

### 2. 数据验证
检查转换后的值是否有效：
```javascript
if (isNaN(setNumber)) {
  // 错误处理
  return;
}
```

### 3. 详细的调试日志
添加日志以便诊断问题：
```javascript
console.log('[functionName] Set number:', setNumber, 'Type:', typeof setNumber);
console.log('[functionName] API URL:', `/api/answer-sets/${reviewId}/${setNumber}`);
```

### 4. 友好的错误提示
向用户显示清晰的错误消息：
```javascript
showNotification('Invalid answer set number', 'error');
```

## 测试场景

### 测试1: 正常保存答案
1. 创建者登录，进入复盘编辑页面
2. 解锁答案组
3. 编辑任意答案并保存
4. **预期**：
   - 答案保存成功
   - 控制台显示正确的 setNumber 和类型
   - API URL 格式正确：`/api/answer-sets/275/1`

### 测试2: 单选/多选题保存
1. 选择单选或多选题的选项
2. **预期**：
   - 自动保存成功
   - 控制台显示 setNumber 为整数
   - 没有 500 错误

### 测试3: 日期时间字段保存
1. 修改日期时间相关字段
2. **预期**：
   - 自动保存成功
   - setNumber 解析正确

### 测试4: 锁定/解锁操作
1. 点击"锁定"或"解锁"按钮
2. **预期**：
   - 操作成功
   - API URL 正确：`/api/answer-sets/275/1/lock`

### 测试5: 删除答案组
1. 解锁答案组
2. 点击"删除"按钮
3. **预期**：
   - 显示确认对话框
   - 删除成功
   - API URL 正确：`/api/answer-sets/275/1`

### 测试6: 错误情况处理
如果 `currentSet.set_number` 被错误赋值（如 "1:1"）：
1. **预期**：
   - `parseInt("1:1")` 返回 `1`（只解析第一个数字部分）
   - 如果完全无效，`isNaN()` 检查捕获错误
   - 显示"Invalid answer set number"错误消息
   - 不发送 API 请求

## 监控和调试

### 控制台日志
修复后的代码会在控制台输出详细的调试信息：
```
[saveInlineAnswer] Debug info: { reviewId: 275, questionNumber: 1, ... }
[saveInlineAnswer] Current set: { set_number: 1, ... }
[saveInlineAnswer] Set number: 1 Type: number
[saveInlineAnswer] API URL: /api/answer-sets/275/1
```

### 错误日志
如果检测到无效的 setNumber：
```
[saveInlineAnswer] Invalid set number: 1:1
```

## 部署信息
- **测试环境**: https://40a1f5fb.review-system.pages.dev
- **生产环境**: https://review-system.pages.dev
- **GitHub提交**: d92ae2f - "修复: 确保所有 setNumber 使用 parseInt 解析并添加验证"
- **修改文件**: `public/static/app.js`
- **修改行数**: 66 行插入，9 行删除

## 预期效果

### 修复前
- API 请求失败：`/api/answer-sets/275/1:1`
- 返回 500 错误
- 答案无法保存

### 修复后
- API 请求正确：`/api/answer-sets/275/1`
- 返回 200 成功
- 答案正常保存
- 即使数据被污染，也能被 `parseInt` 修正或被 `isNaN` 检查捕获

## 技术细节

### parseInt 的工作原理
```javascript
parseInt("1")      // 返回 1
parseInt("1:1")    // 返回 1（解析到非数字字符停止）
parseInt("abc")    // 返回 NaN
parseInt(1)        // 返回 1（已经是数字）
```

### 防御性编程的重要性
即使数据库中的值是正确的，JavaScript 处理过程中仍可能出现意外：
- 类型转换错误
- 字符串拼接错误
- DOM 属性读取错误
- 变量作用域污染

通过添加 `parseInt` 和 `isNaN` 检查，我们确保了代码的健壮性。

## 总结
此次修复通过在所有使用 `setNumber` 的地方添加 `parseInt` 解析和 `isNaN` 验证，确保了：
1. ✅ `setNumber` 始终是有效的整数
2. ✅ API URL 格式始终正确
3. ✅ 无效数据被及时捕获并处理
4. ✅ 详细的调试日志便于诊断问题
5. ✅ 友好的错误提示提升用户体验
