# 复盘系统功能增强实现文档

## 概述
本文档详细说明了三个新增功能的实现：
1. **是否允许多个复盘答案（allow_multiple_answers）**
2. **复盘锁定状态（is_locked）**
3. **答案评论功能（comment）**

## 一、后端实现 ✅ 已完成

### 1.1 数据库迁移
文件：`migrations/0067_add_review_enhancement_fields.sql`

**reviews表新增字段：**
- `allow_multiple_answers TEXT DEFAULT 'yes'` - 是否允许多个答案（'yes'/'no'）
- `is_locked TEXT DEFAULT 'no'` - 是否锁定（'yes'/'no'）
- `created_by INTEGER` - 创建者ID

**review_answers表新增字段：**
- `comment TEXT` - 评论内容
- `comment_updated_at DATETIME` - 评论更新时间

### 1.2 API端点

#### A. 锁定功能
```
PUT /api/reviews/:id/lock      - 锁定复盘（仅创建者可操作）
PUT /api/reviews/:id/unlock    - 解锁复盘（仅创建者可操作）
```

**权限检查：**
- 只有created_by用户或管理员可以锁定/解锁
- 锁定后：不允许编辑，但可以查看

#### B. 答案评论功能
```
POST /api/reviews/:reviewId/answers/:answerId/comment  - 添加/更新评论
GET  /api/reviews/:reviewId/answers/:answerId/comment  - 获取评论
```

**权限规则：**
- 复盘创建者：可以查看和编辑所有答案的评论
- 答案创建者：可以查看和编辑自己答案的评论
- 其他用户：看不到评论

#### C. 创建复盘API更新
`POST /api/reviews/` 新增参数：
- `allow_multiple_answers`: 'yes' | 'no' (default: 'yes')
- `is_locked`: 'yes' | 'no' (default: 'no')
- `created_by`: 自动设置为当前用户ID

#### D. 获取复盘API更新
`GET /api/reviews/:id` 返回增强字段：
```json
{
  "review": {
    "...existing_fields": "...",
    "is_creator": boolean,           // 是否是创建者
    "is_locked": boolean,             // 是否锁定
    "allow_multiple_answers": boolean, // 是否允许多答案
    "created_by": number,             // 创建者ID
    "created_by_username": string     // 创建者用户名
  },
  "answersByQuestion": {
    "1": [
      {
        "id": 123,
        "answer": "...",
        "comment": "...",              // 仅创建者和答案作者可见
        "comment_updated_at": "...",   // 仅创建者和答案作者可见
        "can_comment": boolean         // 是否可以评论
      }
    ]
  }
}
```

---

## 二、前端实现 🔨 待实现

### 2.1 创建复盘表单（位置：创建复盘页面）

**需要添加的UI元素：**

```html
<!-- 在创建复盘表单中添加此开关 -->
<div class="form-group">
  <label class="flex items-center space-x-2">
    <input 
      type="checkbox" 
      id="allowMultipleAnswers"
      checked
      class="w-4 h-4 text-blue-600"
    >
    <span data-i18n="review.allow_multiple_answers">是否允许多个复盘答案</span>
  </label>
  <p class="text-sm text-gray-500 mt-1" data-i18n="review.allow_multiple_answers_hint">
    选择"是"将显示答案组管理功能，允许创建多个答案集合
  </p>
</div>
```

**提交数据时：**
```javascript
const formData = {
  title: ...,
  description: ...,
  allow_multiple_answers: document.getElementById('allowMultipleAnswers').checked ? 'yes' : 'no',
  // ... other fields
};
```

---

### 2.2 查看复盘页面增强

#### A. 答案组管理显示控制

**当前逻辑：**
答案组管理功能始终显示

**修改后逻辑：**
```javascript
// 根据 review.allow_multiple_answers 控制显示
function renderReviewPage(reviewData) {
  const { review } = reviewData;
  
  // 如果不允许多答案，隐藏答案组管理区域
  if (!review.allow_multiple_answers) {
    document.getElementById('answer-set-management').style.display = 'none';
    document.getElementById('create-new-answer-set-btn').style.display = 'none';
  } else {
    document.getElementById('answer-set-management').style.display = 'block';
    document.getElementById('create-new-answer-set-btn').style.display = 'block';
  }
}
```

**建议位置：**
在答案组管理区域HTML中添加条件渲染：
```javascript
if (review.allow_multiple_answers) {
  html += `
    <div id="answer-set-management" class="...">
      <!-- 答案组管理功能 -->
    </div>
  `;
}
```

#### B. 锁定状态开关

**位置：**
在复盘详情页顶部，"创建新答案组"按钮的上方

**HTML结构：**
```html
<div id="review-lock-section" style="display: none;" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="font-semibold text-yellow-800">
        <i class="fas fa-lock"></i>
        <span data-i18n="review.lock_status">锁定状态</span>
      </h3>
      <p class="text-sm text-yellow-700 mt-1">
        <span id="lock-status-text"></span>
      </p>
    </div>
    <button 
      id="toggle-lock-btn" 
      class="px-4 py-2 rounded hover:opacity-80 transition"
    >
      <i class="fas fa-lock-open mr-2"></i>
      <span id="lock-btn-text"></span>
    </button>
  </div>
</div>
```

**JavaScript逻辑：**
```javascript
function initializeLockFeature(review) {
  // 只有创建者才能看到锁定开关
  if (!review.is_creator) {
    document.getElementById('review-lock-section').style.display = 'none';
    return;
  }

  // 显示锁定区域
  document.getElementById('review-lock-section').style.display = 'block';
  
  // 更新UI状态
  updateLockUI(review.is_locked);
  
  // 绑定锁定/解锁按钮事件
  document.getElementById('toggle-lock-btn').addEventListener('click', async () => {
    await toggleReviewLock(review.id, review.is_locked);
  });
}

function updateLockUI(isLocked) {
  const statusText = document.getElementById('lock-status-text');
  const btnText = document.getElementById('lock-btn-text');
  const btn = document.getElementById('toggle-lock-btn');
  
  if (isLocked) {
    statusText.textContent = '当前复盘已锁定，无法编辑';
    btnText.textContent = '解锁';
    btn.className = 'px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600';
    btn.querySelector('i').className = 'fas fa-lock-open mr-2';
    
    // 禁用所有编辑功能
    disableEditFeatures();
  } else {
    statusText.textContent = '当前复盘未锁定，可以编辑';
    btnText.textContent = '锁定';
    btn.className = 'px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600';
    btn.querySelector('i').className = 'fas fa-lock mr-2';
    
    // 启用编辑功能
    enableEditFeatures();
  }
}

async function toggleReviewLock(reviewId, currentLockStatus) {
  const action = currentLockStatus ? 'unlock' : 'lock';
  
  try {
    const response = await fetch(`/api/reviews/${reviewId}/${action}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const newLockStatus = data.is_locked === 'yes';
      updateLockUI(newLockStatus);
      showToast(data.message, 'success');
      
      // 刷新页面以更新状态
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showToast(data.error || '操作失败', 'error');
    }
  } catch (error) {
    console.error('Toggle lock error:', error);
    showToast('网络错误，请稍后重试', 'error');
  }
}

function disableEditFeatures() {
  // 禁用所有编辑按钮和输入框
  document.querySelectorAll('.edit-btn, .delete-btn, .save-btn').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  });
  
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.disabled = true;
  });
}

function enableEditFeatures() {
  // 启用所有编辑按钮和输入框
  document.querySelectorAll('.edit-btn, .delete-btn, .save-btn').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  });
  
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.disabled = false;
  });
}
```

#### C. 答案评论功能

**位置：**
在每个答案显示区域的右侧或下方添加评论按钮

**HTML结构（在答案卡片中）：**
```html
<div class="answer-card">
  <div class="answer-content">
    <!-- 现有答案内容 -->
  </div>
  
  <!-- 评论区域 - 只对创建者或答案作者可见 -->
  <div class="answer-comment-section" data-answer-id="${answerId}" style="display: none;">
    <button class="comment-btn text-blue-600 hover:text-blue-800 text-sm">
      <i class="fas fa-comment-dots"></i>
      <span class="comment-indicator"></span>
    </button>
  </div>
</div>

<!-- 评论弹窗 -->
<div id="comment-modal" class="modal hidden">
  <div class="modal-content max-w-2xl">
    <div class="modal-header">
      <h3 data-i18n="review.answer_comment">答案评论</h3>
      <button class="close-btn">&times;</button>
    </div>
    <div class="modal-body">
      <textarea 
        id="comment-text" 
        rows="4" 
        class="w-full border rounded p-2"
        placeholder="输入评论..."
      ></textarea>
      <div class="mt-2 text-xs text-gray-500">
        * 只有复盘创建者和答案创建者可以查看此评论
      </div>
    </div>
    <div class="modal-footer">
      <button id="save-comment-btn" class="btn-primary">保存评论</button>
      <button class="btn-secondary close-btn">取消</button>
    </div>
  </div>
</div>
```

**JavaScript逻辑：**
```javascript
function renderAnswerWithComment(answer, reviewId) {
  const html = `
    <div class="answer-card" data-answer-id="${answer.id}">
      <!-- 答案内容 -->
      <div class="answer-content">
        ${answer.answer}
      </div>
      
      <!-- 评论按钮 - 只有有权限的用户才能看到 -->
      ${answer.can_comment ? `
        <div class="mt-2">
          <button 
            class="comment-btn text-sm text-blue-600 hover:text-blue-800"
            data-answer-id="${answer.id}"
            data-review-id="${reviewId}"
          >
            <i class="fas fa-comment-dots"></i>
            ${answer.comment ? `
              <span class="text-green-600">(已有评论)</span>
            ` : `
              <span>添加评论</span>
            `}
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  return html;
}

// 初始化评论功能
function initializeCommentFeature() {
  // 绑定评论按钮点击事件
  document.querySelectorAll('.comment-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const answerId = e.currentTarget.dataset.answerId;
      const reviewId = e.currentTarget.dataset.reviewId;
      await openCommentModal(reviewId, answerId);
    });
  });
}

async function openCommentModal(reviewId, answerId) {
  // 获取现有评论
  try {
    const response = await fetch(`/api/reviews/${reviewId}/answers/${answerId}/comment`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 显示评论弹窗
      const modal = document.getElementById('comment-modal');
      const commentText = document.getElementById('comment-text');
      
      commentText.value = data.comment || '';
      modal.classList.remove('hidden');
      
      // 保存按钮事件
      document.getElementById('save-comment-btn').onclick = async () => {
        await saveComment(reviewId, answerId, commentText.value);
      };
    }
  } catch (error) {
    console.error('Load comment error:', error);
  }
}

async function saveComment(reviewId, answerId, commentText) {
  try {
    const response = await fetch(`/api/reviews/${reviewId}/answers/${answerId}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: commentText })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('评论保存成功', 'success');
      closeCommentModal();
      // 更新评论指示器
      updateCommentIndicator(answerId, commentText);
    } else {
      showToast(data.error || '保存失败', 'error');
    }
  } catch (error) {
    console.error('Save comment error:', error);
    showToast('网络错误', 'error');
  }
}

function closeCommentModal() {
  document.getElementById('comment-modal').classList.add('hidden');
}

function updateCommentIndicator(answerId, commentText) {
  const btn = document.querySelector(`[data-answer-id="${answerId}"].comment-btn`);
  if (btn) {
    const indicator = btn.querySelector('.comment-indicator') || btn.querySelector('span');
    if (commentText) {
      indicator.textContent = '(已有评论)';
      indicator.classList.add('text-green-600');
    } else {
      indicator.textContent = '添加评论';
      indicator.classList.remove('text-green-600');
    }
  }
}
```

---

## 三、国际化文本

需要在 i18n 文件中添加以下键值对：

```javascript
// zh (简体中文)
{
  "review": {
    "allow_multiple_answers": "是否允许多个复盘答案",
    "allow_multiple_answers_hint": "选择"是"将显示答案组管理功能，允许创建多个答案集合",
    "lock_status": "锁定状态",
    "locked": "已锁定",
    "unlocked": "未锁定",
    "lock": "锁定",
    "unlock": "解锁",
    "lock_success": "锁定成功",
    "unlock_success": "解锁成功",
    "locked_no_edit": "此复盘已锁定，无法编辑",
    "answer_comment": "答案评论",
    "add_comment": "添加评论",
    "has_comment": "已有评论",
    "comment_hint": "只有复盘创建者和答案创建者可以查看此评论",
    "comment_saved": "评论保存成功"
  }
}

// en (English)
{
  "review": {
    "allow_multiple_answers": "Allow Multiple Answers",
    "allow_multiple_answers_hint": "Enable answer set management for creating multiple answer collections",
    "lock_status": "Lock Status",
    "locked": "Locked",
    "unlocked": "Unlocked",
    "lock": "Lock",
    "unlock": "Unlock",
    "lock_success": "Locked successfully",
    "unlock_success": "Unlocked successfully",
    "locked_no_edit": "This review is locked and cannot be edited",
    "answer_comment": "Answer Comment",
    "add_comment": "Add Comment",
    "has_comment": "Has Comment",
    "comment_hint": "Only review creator and answer creator can view this comment",
    "comment_saved": "Comment saved successfully"
  }
}
```

---

## 四、测试清单

### 4.1 创建复盘测试
- [ ] 创建复盘时选择"允许多个答案"
- [ ] 创建复盘时选择"不允许多个答案"
- [ ] 验证数据库中字段值正确

### 4.2 查看复盘测试
- [ ] 允许多答案的复盘显示答案组管理
- [ ] 不允许多答案的复盘隐藏答案组管理
- [ ] 创建者可以看到锁定开关
- [ ] 非创建者看不到锁定开关

### 4.3 锁定功能测试
- [ ] 创建者可以锁定复盘
- [ ] 创建者可以解锁复盘
- [ ] 锁定后禁用所有编辑功能
- [ ] 锁定后仍可查看内容
- [ ] 非创建者无法锁定/解锁

### 4.4 评论功能测试
- [ ] 复盘创建者可以对所有答案添加评论
- [ ] 答案创建者可以查看自己答案的评论
- [ ] 答案创建者可以编辑自己答案的评论
- [ ] 其他用户看不到评论按钮
- [ ] 评论保存后正确显示

### 4.5 权限测试
- [ ] 管理员拥有所有权限
- [ ] 普通用户只能操作自己创建的复盘
- [ ] 团队成员按规则有相应权限

---

## 五、部署步骤

### 5.1 本地测试
1. 应用数据库迁移：
```bash
npx wrangler d1 migrations apply review-system-production --local
```

2. 启动本地开发服务器：
```bash
npm run build
pm2 start ecosystem.config.cjs
```

3. 测试所有功能

### 5.2 生产部署
1. 应用生产数据库迁移：
```bash
npx wrangler d1 migrations apply review-system-production
```

2. 部署到Cloudflare Pages：
```bash
npm run build
npx wrangler pages deploy dist --project-name review-system
```

3. 验证所有功能正常工作

---

## 六、注意事项

1. **向后兼容性**：
   - 代码包含fallback逻辑，即使数据库未迁移也能正常运行
   - 旧复盘默认 allow_multiple_answers='yes'，保持现有行为

2. **性能考虑**：
   - 评论查询只在需要时执行
   - 权限检查在API层完成，减少前端复杂度

3. **用户体验**：
   - 锁定状态有明确的视觉反馈
   - 评论功能不影响现有查看体验
   - 所有操作都有成功/失败提示

4. **安全性**：
   - 所有权限检查在后端完成
   - 前端只控制UI显示，不能绕过权限
   - 评论内容经过转义防止XSS

---

## 七、文件清单

### 后端文件（已完成）
- ✅ `migrations/0067_add_review_enhancement_fields.sql` - 数据库迁移
- ✅ `src/routes/reviews.ts` - API路由更新

### 前端文件（待更新）
- ⏳ `public/static/app.js` - 主要逻辑实现
- ⏳ i18n 翻译文件 - 添加新的文本

### 文档文件
- ✅ `REVIEW_ENHANCEMENT_IMPLEMENTATION.md` - 本实现文档

---

**实现优先级：**
1. 高优先级：锁定功能（影响数据安全）
2. 中优先级：答案多选控制（影响用户体验）
3. 中优先级：评论功能（增强协作）

**预计工作量：**
- 前端开发：4-6小时
- 测试：2-3小时
- 部署验证：1小时
- 总计：7-10小时
