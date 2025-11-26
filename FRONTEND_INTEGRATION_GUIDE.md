# V9.0.0 前端集成指南

## 概述
本文档说明如何将新的前端功能集成到现有HTML页面中。

## 已完成文件
- ✅ `public/static/review_enhancements.js` - 核心功能函数
- ✅ `public/static/i18n.js` - 国际化翻译（已更新）

## 集成步骤

### 步骤 1：在HTML中引入新的JavaScript文件

**需要修改的文件**：
- `src/index.tsx` (如果有 HTML 模板)
- 或者任何包含复盘页面的 HTML 模板

**添加以下script标签**（在 `</body>` 之前）：

```html
<!-- Review Enhancement Features V9.0.0 -->
<script src="/static/review_enhancements.js"></script>
```

**注意**：确保此 script 标签在 i18n.js 和 app.js 之后加载。

### 步骤 2：修改 showReviewDetail 函数

**文件**：`public/static/app.js`
**函数**：`showReviewDetail(id, readOnly = false)` (约第5637行)

#### 2.1 添加锁定状态区域

在"复盘表头"区域之后，"Dynamic Questions Display"之前添加锁定状态UI：

```javascript
// 在 line 5849 (<!-- Dynamic Questions Display --> 之前) 添加:

${renderLockStatusSection(review)}
${renderCommentModal()}

```

#### 2.2 在答案显示中添加评论按钮

在答案卡片的HTML中（约第5976行附近），添加评论按钮：

```javascript
// 在 line 5983 (answerDisplay 之后) 添加:
answerDisplay +
renderCommentButton(ans, reviewId) +
'</div>';
```

#### 2.3 控制答案组管理显示

在答案组管理相关HTML前添加条件判断（需要查找"创建新答案组"按钮的位置）:

```javascript
// 伪代码示例:
${shouldShowAnswerSetManagement(review) ? `
  <!-- 答案组管理UI -->
  <div id="answer-set-management">
    <!-- 现有的答案组管理代码 -->
  </div>
` : ''}
```

#### 2.4 初始化锁定状态

在函数末尾（渲染完成后），添加：

```javascript
// 在 showReviewDetail 函数的最后，try 块结束前添加:

// Initialize lock UI if review is locked
if (review.is_locked) {
  setTimeout(() => {
    updateLockUI(true);
  }, 100);
}
```

### 步骤 3：修改创建复盘表单

**文件**：`public/static/app.js`
**函数**：`showCreateReview()` 或类似的创建表单函数

#### 3.1 在表单中添加"允许多个答案"开关

在模板选择字段之后添加：

```html
<!-- 允许多个答案开关 -->
<div class="mb-4">
  <label class="flex items-center space-x-2 cursor-pointer">
    <input 
      type="checkbox" 
      id="allowMultipleAnswers"
      checked
      class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
    >
    <span class="text-sm font-medium text-gray-700" data-i18n="allowMultipleAnswers">
      是否允许多个复盘答案
    </span>
  </label>
  <p class="mt-1 ml-6 text-xs text-gray-500" data-i18n="allowMultipleAnswersHint">
    选择"是"将显示答案组管理功能，允许创建多个答案集合
  </p>
</div>
```

#### 3.2 在提交时包含新字段

在创建复盘的数据对象中添加：

```javascript
const reviewData = {
  title: document.getElementById('title').value,
  description: document.getElementById('description').value,
  template_id: selectedTemplateId,
  team_id: selectedTeamId,
  owner_type: selectedOwnerType,
  // V9.0.0 新增字段
  allow_multiple_answers: document.getElementById('allowMultipleAnswers').checked ? 'yes' : 'no',
  // 其他字段...
};
```

### 步骤 4：修改团队协作查看页面

**文件**：`public/static/app.js`
**函数**：`showTeamReviewCollaboration(id)` (约第6053行)

在这个函数中也需要添加类似的锁定状态和评论功能。

### 步骤 5：CSS样式（如果需要）

评论弹窗的样式已经在 `review_enhancements.js` 中使用Tailwind CSS类定义。如果需要自定义样式，可以在 `public/static/styles.css` 中添加：

```css
/* Comment Modal Custom Styles */
.comment-modal-overlay {
  backdrop-filter: blur(2px);
}

.comment-btn {
  transition: all 0.2s ease;
}

.comment-btn:hover {
  transform: translateX(2px);
}
```

## 完整的集成代码示例

### 示例 1：完整的 showReviewDetail 修改

```javascript
async function showReviewDetail(id, readOnly = false) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review;
    const questions = response.data.questions || [];
    const answersByQuestion = response.data.answersByQuestion || {};
    
    // ... 现有代码 ...
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <!-- 现有的标题和返回按钮 -->
          
          <!-- V9.0.0: 锁定状态区域 -->
          ${renderLockStatusSection(review)}
          
          <!-- 现有的复盘表头 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <!-- ... -->
          </div>
          
          <!-- 现有的问题和答案显示 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            ${questions.map(q => {
              const answers = answersByQuestion[q.question_number] || [];
              return `
                <div class="border-b py-3">
                  <h3>${q.question_text}</h3>
                  <div>
                    ${answers.map(ans => `
                      <div class="answer-card">
                        ${ans.answer}
                        <!-- V9.0.0: 评论按钮 -->
                        ${renderCommentButton(ans, review.id)}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      
      <!-- V9.0.0: 评论弹窗 -->
      ${renderCommentModal()}
    `;
    
    // V9.0.0: 初始化锁定状态
    if (review.is_locked) {
      setTimeout(() => updateLockUI(true), 100);
    }
    
  } catch (error) {
    // 错误处理
  }
}
```

### 示例 2：创建复盘表单完整代码

```javascript
async function showCreateReview() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">创建复盘</h1>
      
      <form id="createReviewForm" class="bg-white rounded-lg shadow-md p-6">
        <!-- 标题 -->
        <div class="mb-4">
          <label>标题</label>
          <input type="text" id="title" class="..." />
        </div>
        
        <!-- 模板选择 -->
        <div class="mb-4">
          <!-- ... -->
        </div>
        
        <!-- V9.0.0: 允许多个答案 -->
        <div class="mb-4">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              id="allowMultipleAnswers"
              checked
              class="w-4 h-4 text-blue-600"
            >
            <span data-i18n="allowMultipleAnswers">是否允许多个复盘答案</span>
          </label>
          <p class="mt-1 ml-6 text-xs text-gray-500" data-i18n="allowMultipleAnswersHint">
            选择"是"将显示答案组管理功能
          </p>
        </div>
        
        <!-- 提交按钮 -->
        <button type="submit">创建</button>
      </form>
    </div>
  `;
  
  // 表单提交处理
  document.getElementById('createReviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      title: document.getElementById('title').value,
      allow_multiple_answers: document.getElementById('allowMultipleAnswers').checked ? 'yes' : 'no',
      // 其他字段...
    };
    
    try {
      const response = await axios.post('/api/reviews/', data);
      showNotification('创建成功', 'success');
      showReviews();
    } catch (error) {
      showNotification('创建失败', 'error');
    }
  });
}
```

## 测试清单

### 功能测试
- [ ] 创建复盘时可以选择允许/不允许多个答案
- [ ] 查看复盘时，创建者可以看到锁定开关
- [ ] 查看复盘时，非创建者看不到锁定开关
- [ ] 点击锁定按钮，复盘被成功锁定
- [ ] 锁定后，所有编辑按钮被禁用
- [ ] 点击解锁按钮，复盘被成功解锁
- [ ] 解锁后，编辑按钮恢复可用
- [ ] 有权限的用户可以看到评论按钮
- [ ] 点击评论按钮，弹出评论弹窗
- [ ] 可以成功保存评论
- [ ] 评论保存后，按钮文本变为"已有评论"
- [ ] 无权限的用户看不到评论按钮

### UI测试
- [ ] 锁定状态区域显示正常
- [ ] 评论弹窗样式正确
- [ ] 评论按钮图标显示正确
- [ ] 移动端显示正常
- [ ] 多语言切换正常

### 兼容性测试
- [ ] 旧复盘（无新字段）正常显示
- [ ] 新复盘（有新字段）正常工作
- [ ] Chrome 浏览器测试通过
- [ ] Firefox 浏览器测试通过
- [ ] Safari 浏览器测试通过
- [ ] 移动端浏览器测试通过

## 注意事项

1. **Script加载顺序**：
   - i18n.js → app.js → review_enhancements.js

2. **权限判断**：
   - 锁定功能：只有 review.is_creator === true 才显示
   - 评论功能：只有 answer.can_comment === true 才显示

3. **错误处理**：
   - 所有API调用都应该有 try-catch
   - 403错误应该显示友好的权限提示

4. **用户体验**：
   - 锁定/解锁操作需要确认弹窗
   - 所有操作完成后应该有Toast提示
   - 评论保存后自动关闭弹窗

5. **性能优化**：
   - 评论按需加载，不影响页面初始加载速度
   - 锁定状态判断在前端完成，减少API调用

## 下一步

集成完成后，请进行以下操作：

1. 本地测试所有功能
2. 修复发现的问题
3. 构建项目：`npm run build`
4. 部署到测试环境
5. 完整的端到端测试
6. 部署到生产环境

## 联系方式

如有问题，请参考：
- `REVIEW_ENHANCEMENT_IMPLEMENTATION.md` - 详细实现文档
- `DEPLOYMENT_V9.0.0.md` - 部署文档
- `IMPLEMENTATION_SUMMARY_V9.0.0.md` - 实现总结

---

**文档版本**: V1.0
**创建日期**: 2025-11-26
**更新日期**: 2025-11-26
