# 创建复盘时生成重复草稿问题修复文档

## 修复日期
2025-11-16

## 问题描述

用户报告在创建复盘时，系统会创建**两个复盘记录**：
1. 一个是用户选择的正确模板生成的复盘
2. 另一个是默认模板生成的额外复盘（重复）

这个问题导致：
- 数据库中存在冗余数据
- 复盘列表中出现重复记录
- 用户困惑，不知道哪个是正确的复盘

## 根本原因分析

### 问题代码流程

#### 1. 创建复盘的正常流程

**Step 1：用户填写表单并提交**
```javascript
// 文件：public/static/app.js，第 2234-2296 行
async function handleStep1Submit(e) {
  e.preventDefault();
  
  // 收集表单数据
  const title = document.getElementById('review-title').value;
  const templateId = parseInt(document.getElementById('review-template').value);
  // ... 其他字段
  
  // 创建草稿复盘 A（用户选择的模板）
  const response = await axios.post('/api/reviews', data);
  const newReviewId = response.data.id;
  
  // ❌ 问题：清除 currentDraftId
  currentDraftId = null;  // 这行代码导致了问题！
  
  // 标记为新创建的草稿
  window.newlyCreatedDraftId = newReviewId;
  
  // 跳转到编辑页面
  showEditReview(newReviewId);
}
```

**Step 2：跳转到编辑页面时触发自动保存**
```javascript
// 文件：public/static/app.js，第 8-20 行
async function autoSaveDraftBeforeNavigation() {
  if (currentView === 'create-review-step1' || currentView === 'create-review-step2') {
    try {
      await window.saveCurrentReviewDraft();
      // ↑ 这里会被调用
      showNotification(i18n.t('draftSaved'), 'success');
      return true;
    } catch (error) {
      console.error('Auto-save draft error:', error);
      return false;
    }
  }
  return false;
}
```

**Step 3：自动保存函数检查并创建新草稿**
```javascript
// 文件：public/static/app.js，第 23-90 行
window.saveCurrentReviewDraft = async function() {
  if (currentView === 'create-review-step1') {
    // 收集表单数据
    const title = titleElem.value.trim();
    const template_id = templateElem ? parseInt(templateElem.value) : 1;
    // ... 其他字段
    
    // ❌ 检查 currentDraftId
    if (currentDraftId) {
      // 更新现有草稿
      await axios.put(`/api/reviews/${currentDraftId}`, data);
    } else {
      // ❌ 问题：因为 currentDraftId 被清除了（设为 null）
      // 所以这里会创建第二个草稿 B（默认模板）
      const response = await axios.post('/api/reviews', data);
      currentDraftId = response.data.id;
    }
  }
}
```

### 时间线分析

```
时刻 T0: 用户填写表单
├─ 标题: "我的复盘"
├─ 模板: 自定义模板（ID: 5）
└─ 其他字段...

时刻 T100ms: 用户点击"创建并编辑"按钮
├─ handleStep1Submit() 执行
│   ├─ POST /api/reviews (template_id: 5)
│   ├─ 创建草稿 A（ID: 909090，使用模板 5）✅
│   ├─ currentDraftId = null  ← 问题：清除了 ID
│   └─ showEditReview(909090)
│
时刻 T150ms: 开始跳转到编辑页面
├─ currentView 从 'create-review-step1' 变为 'edit-review'
│
时刻 T200ms: 导航触发自动保存
├─ autoSaveDraftBeforeNavigation() 执行
│   └─ 检测到之前是 'create-review-step1'
│       └─ 调用 window.saveCurrentReviewDraft()
│
时刻 T250ms: 自动保存逻辑执行
├─ 检查 currentDraftId → null ❌
├─ 因为是 null，所以认为没有草稿
├─ POST /api/reviews (template_id: 1，默认模板)
├─ 创建草稿 B（ID: 909091，使用默认模板）❌
└─ currentDraftId = 909091
│
结果：
├─ 草稿 A（ID: 909090，用户选择的模板 5）✅
└─ 草稿 B（ID: 909091，默认模板 1）❌ 重复！
```

### 根本原因总结

1. **过早清除 currentDraftId**：
   - `handleStep1Submit` 在创建草稿后立即设置 `currentDraftId = null`
   - 目的是"防止冲突"，但这导致了自动保存无法识别已创建的草稿

2. **自动保存的触发时机**：
   - 在页面导航时会触发 `autoSaveDraftBeforeNavigation`
   - 这个函数会尝试保存当前页面的草稿数据
   - 因为 `currentDraftId` 为 null，所以创建了新的草稿

3. **缺少草稿 ID 的传递**：
   - 创建草稿后没有正确设置 `currentDraftId`
   - 导致后续的自动保存逻辑无法识别已存在的草稿

## 解决方案

### 核心修改：保留 currentDraftId

将 `currentDraftId = null` 改为 `currentDraftId = newReviewId`，确保自动保存能够识别已创建的草稿。

**修改位置**：`public/static/app.js`，第 2275-2297 行

#### 修改前：
```javascript
try {
  console.log('创建空白草稿复盘:', data);
  
  // Create empty draft review
  const response = await axios.post('/api/reviews', data);
  const newReviewId = response.data.id;
  
  console.log('草稿创建成功，ID:', newReviewId);
  showNotification(i18n.t('draftCreated') + ' (ID: ' + newReviewId + ')', 'success');
  
  // ❌ 问题：清除 currentDraftId，导致自动保存无法识别草稿
  currentDraftId = null;
  
  // Mark this as a newly created draft that hasn't been saved yet
  window.newlyCreatedDraftId = newReviewId;
  
  // Open in edit mode directly
  showEditReview(newReviewId);
} catch (error) {
  console.error('创建草稿失败:', error);
  showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
}
```

#### 修改后：
```javascript
try {
  console.log('创建空白草稿复盘:', data);
  
  // Create empty draft review
  const response = await axios.post('/api/reviews', data);
  const newReviewId = response.data.id;
  
  console.log('草稿创建成功，ID:', newReviewId);
  showNotification(i18n.t('draftCreated') + ' (ID: ' + newReviewId + ')', 'success');
  
  // ✅ 修复：保留 currentDraftId，防止自动保存创建重复草稿
  currentDraftId = newReviewId;
  console.log('已设置 currentDraftId:', currentDraftId, '防止自动保存创建重复草稿');
  
  // Mark this as a newly created draft that hasn't been saved yet
  window.newlyCreatedDraftId = newReviewId;
  
  // Open in edit mode directly
  showEditReview(newReviewId);
} catch (error) {
  console.error('创建草稿失败:', error);
  showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
}
```

### 工作原理

#### 修复后的时间线

```
时刻 T0: 用户填写表单
├─ 标题: "我的复盘"
├─ 模板: 自定义模板（ID: 5）
└─ 其他字段...

时刻 T100ms: 用户点击"创建并编辑"按钮
├─ handleStep1Submit() 执行
│   ├─ POST /api/reviews (template_id: 5)
│   ├─ 创建草稿 A（ID: 909090，使用模板 5）✅
│   ├─ currentDraftId = 909090  ← ✅ 修复：保留 ID
│   ├─ console.log('已设置 currentDraftId: 909090')
│   └─ showEditReview(909090)
│
时刻 T150ms: 开始跳转到编辑页面
├─ currentView 从 'create-review-step1' 变为 'edit-review'
│
时刻 T200ms: 导航触发自动保存
├─ autoSaveDraftBeforeNavigation() 执行
│   └─ 检测到之前是 'create-review-step1'
│       └─ 调用 window.saveCurrentReviewDraft()
│
时刻 T250ms: 自动保存逻辑执行
├─ 检查 currentDraftId → 909090 ✅
├─ 因为有值，所以更新现有草稿
├─ PUT /api/reviews/909090 (更新草稿 A)
└─ 不创建新草稿 ✅
│
结果：
└─ 草稿 A（ID: 909090，用户选择的模板 5）✅
   只有一个复盘记录！
```

### 逻辑流程对比

#### ❌ 修复前的逻辑

```
创建草稿 → 清除 ID (null) → 跳转 → 自动保存检查 ID
                  ↓
              ID 为 null
                  ↓
          创建新草稿（重复）❌
```

#### ✅ 修复后的逻辑

```
创建草稿 → 保留 ID (909090) → 跳转 → 自动保存检查 ID
                      ↓
                ID = 909090
                      ↓
              更新现有草稿 ✅
```

## 测试验证

### 测试场景 1：使用自定义模板创建复盘

**步骤**：
1. 点击"创建复盘"按钮
2. 填写标题："测试复盘"
3. 选择模板：自定义模板（ID: 5）
4. 点击"创建并编辑"按钮
5. 观察控制台日志
6. 检查复盘列表

**预期结果**：
```javascript
// 控制台日志
创建空白草稿复盘: {title: "测试复盘", template_id: 5, ...}
草稿创建成功，ID: 909090
已设置 currentDraftId: 909090 防止自动保存创建重复草稿  ← 新增日志
[showEditReview] 开始加载复盘 ID: 909090
```

**验证**：
- ✅ 只创建一个复盘记录（ID: 909090）
- ✅ 使用用户选择的模板（ID: 5）
- ✅ 复盘列表中只有一条记录

### 测试场景 2：使用默认模板创建复盘

**步骤**：
1. 点击"创建复盘"按钮
2. 填写标题："默认模板测试"
3. 使用默认模板（ID: 1）
4. 点击"创建并编辑"按钮
5. 观察控制台日志
6. 检查复盘列表

**预期结果**：
```javascript
// 控制台日志
创建空白草稿复盘: {title: "默认模板测试", template_id: 1, ...}
草稿创建成功，ID: 909091
已设置 currentDraftId: 909091 防止自动保存创建重复草稿
```

**验证**：
- ✅ 只创建一个复盘记录
- ✅ 使用默认模板（ID: 1）
- ✅ 没有重复记录

### 测试场景 3：快速创建多个复盘

**步骤**：
1. 创建第一个复盘："复盘 A"，模板 ID: 2
2. 立即返回列表
3. 创建第二个复盘："复盘 B"，模板 ID: 3
4. 立即返回列表
5. 检查复盘列表

**预期结果**：
```javascript
// 控制台日志（第一个复盘）
已设置 currentDraftId: 909092

// 控制台日志（第二个复盘）
已设置 currentDraftId: 909093
```

**验证**：
- ✅ 创建两个复盘记录（909092 和 909093）
- ✅ 每个复盘使用正确的模板
- ✅ 没有额外的重复记录

### 测试场景 4：创建复盘后立即编辑

**步骤**：
1. 创建新复盘并进入编辑页面
2. 填写问题答案
3. 点击"保存并退出"按钮
4. 检查复盘列表

**预期结果**：
- ✅ 只有一个复盘记录
- ✅ 答案已保存到该复盘
- ✅ 没有重复的草稿

## 相关代码说明

### currentDraftId 的作用

`currentDraftId` 是一个全局变量，用于跟踪当前正在编辑的草稿 ID。其主要作用：

1. **防止重复创建**：
   - 当用户在创建复盘流程中，系统会保存草稿
   - `currentDraftId` 记录已创建的草稿 ID
   - 后续的自动保存会更新这个草稿，而不是创建新的

2. **自动保存逻辑**：
   ```javascript
   if (currentDraftId) {
     // 更新现有草稿
     await axios.put(`/api/reviews/${currentDraftId}`, data);
   } else {
     // 创建新草稿
     const response = await axios.post('/api/reviews', data);
     currentDraftId = response.data.id;
   }
   ```

3. **生命周期管理**：
   - 创建新复盘时：`currentDraftId = newReviewId`
   - 保存并退出时：通过 `window.newlyCreatedDraftId` 判断是否清除
   - 导航到其他页面时：可能被清除或保留

### window.newlyCreatedDraftId 的作用

这是一个辅助标志，用于标记"刚创建但还没有被用户编辑保存过的草稿"。

**使用场景**：
```javascript
// 创建草稿时设置
window.newlyCreatedDraftId = newReviewId;

// 保存并退出时检查
if (window.newlyCreatedDraftId == id) {
  delete window.newlyCreatedDraftId;
  console.log('[handleSaveAndExitReview] 已清除新建草稿标记');
}
```

**目的**：
- 区分"新创建的草稿"和"已经编辑过的草稿"
- 某些场景下可能需要特殊处理（如删除未保存的草稿）

## 为什么之前的代码要设置 `currentDraftId = null`

### 原始代码的意图

```javascript
// Clear currentDraftId to prevent conflicts
currentDraftId = null;
```

注释说明：清除 `currentDraftId` 以防止冲突。

### 可能的原因

1. **误解了 currentDraftId 的作用**：
   - 开发者可能认为创建新复盘后不应该再关联旧的草稿 ID
   - 但实际上，这个新创建的复盘本身就是草稿

2. **避免与之前的草稿混淆**：
   - 如果用户之前在创建流程中创建了草稿 A
   - 然后取消并重新创建草稿 B
   - 开发者可能想通过清除 ID 来区分这两个草稿

3. **逻辑不完整**：
   - 清除 ID 的逻辑没有考虑到后续的自动保存会被触发
   - 自动保存会检查 `currentDraftId`，发现为 null 后创建新草稿

### 正确的做法

- **保留 currentDraftId**：让自动保存能够识别并更新现有草稿
- **使用 window.newlyCreatedDraftId**：如果需要标记新创建的草稿

## 性能影响

### 修复前

- **数据库写入**：2次 POST（创建两个草稿）
- **存储空间**：浪费空间存储重复数据
- **用户体验**：列表中出现重复记录，用户困惑

### 修复后

- **数据库写入**：1次 POST + 1次 PUT（创建一个草稿 + 更新）
- **存储空间**：只存储一个草稿
- **用户体验**：列表中只有一条记录，清晰明了

### 对比表

| 指标 | 修复前 | 修复后 | 改善 |
|------|--------|--------|------|
| POST 请求数 | 2次 | 1次 | -50% |
| 创建的复盘数 | 2个 | 1个 | -50% |
| 数据库空间 | 2倍 | 1倍 | -50% |
| 重复数据 | 有 | 无 | ✅ |
| 用户体验 | 困惑 | 清晰 | ✅ |

## 部署信息

- **提交哈希**: `245e23f`
- **提交信息**: "修复创建复盘时生成重复草稿问题：设置currentDraftId防止自动保存创建新草稿"
- **部署时间**: 2025-11-16
- **生产环境**: https://675fcb54.review-system.pages.dev
- **GitHub**: https://github.com/Alan16168/review-system

## 总结

本次修复通过一个简单但关键的改动，解决了创建复盘时生成重复草稿的问题：

### 核心改动

```javascript
// 修改前
currentDraftId = null;  // ❌ 导致自动保存创建重复草稿

// 修改后
currentDraftId = newReviewId;  // ✅ 让自动保存更新现有草稿
```

### 修复效果

1. ✅ **消除重复数据**：不再创建额外的默认模板复盘
2. ✅ **减少数据库操作**：从 2 次 POST 减少到 1 次 POST + 1 次 PUT
3. ✅ **改善用户体验**：复盘列表干净清晰，没有重复记录
4. ✅ **保持功能完整**：自动保存功能正常工作，更新正确的草稿

### 关键学习点

1. **全局状态管理要谨慎**：`currentDraftId` 这样的全局变量要清楚其生命周期和作用
2. **不要过早清除状态**：在确认不再需要之前，保留必要的状态信息
3. **注释要准确**："prevent conflicts" 的注释误导了后续开发，应该详细说明为什么要这样做
4. **测试边界情况**：创建流程需要测试各种导航和保存场景

这次修复再次证明，有时候最大的 bug 是由最小的改动引起的。一个简单的 `currentDraftId = null` 导致了整个自动保存逻辑失效，创建了重复数据。通过保留 ID，让系统能够正确识别和更新草稿，问题得到彻底解决。
