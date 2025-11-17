# 私人答案功能实现说明

## 当前实现状态

### ✅ 已完成
1. **数据库字段**: owner字段已添加到template_questions表
2. **后端API**: API正确返回owner字段
3. **前端UI**: 模板编辑时可以设置owner属性
4. **必填验证**: 已实现required字段的验证逻辑

### ⏳ 私人答案过滤 (待后续实现)

由于复盘查看和编辑的代码逻辑非常复杂，涉及多个组件和函数，私人答案的完整过滤需要：

1. **在多个显示函数中实现过滤**:
   - showReviewDetail() - 查看复盘详情
   - showEditReview() - 编辑复盘
   - renderAnswerSet() - 渲染答案集
   - 打印功能
   - 团队协作视图

2. **需要传递多个上下文信息**:
   - 当前用户ID
   - 复盘创建者ID
   - 每个答案的创建者ID
   - 问题的owner属性

3. **需要修改后端API**:
   - 在返回答案时附带user_id信息
   - 或者在后端直接进行权限过滤

## 建议的实现方案

### 方案1：后端过滤（推荐）

**优点**:
- 安全性高，前端无法绕过
- 逻辑集中在后端，易于维护
- 减少前端复杂度

**实现**:
在后端API中根据当前用户权限过滤答案：

```typescript
// src/routes/reviews.ts
async function getReviewAnswers(reviewId, userId) {
  // Get review to check creator
  const review = await db.get('SELECT creator_id FROM reviews WHERE id = ?', reviewId);
  
  // Get all answers
  const answers = await db.all('SELECT * FROM answers WHERE review_id = ?', reviewId);
  
  // Get questions with owner info
  const questions = await db.all('SELECT * FROM template_questions WHERE template_id = ?', review.template_id);
  
  // Filter private answers
  return answers.filter(answer => {
    const question = questions.find(q => q.question_number === answer.question_number);
    
    if (question.owner === 'private') {
      // Private: only show if user is answerer or review creator
      return answer.user_id === userId || review.creator_id === userId;
    }
    
    // Public: show to everyone
    return true;
  });
}
```

### 方案2：前端过滤（当前部分实现）

**优点**:
- 无需修改后端
- 可以立即实现部分功能

**缺点**:
- 安全性较低（技术用户可绕过）
- 需要在多处添加过滤逻辑
- 代码复杂度高

**当前状态**:
- 已添加验证函数框架
- 需要在每个显示答案的地方调用过滤函数

## 当前版本的功能

### V6.7.0 包含：
1. ✅ owner和required字段的数据库支持
2. ✅ 模板编辑界面的UI
3. ✅ 后端API的字段支持
4. ✅ 必填字段的提交验证
5. ⏳ 私人答案的视觉标识（可选）
6. ⏳ 私人答案的完整过滤（建议V6.8.0实现）

## 推荐实施路径

### Phase 1（当前V6.7.0）
- ✅ 基础功能：字段添加和UI
- ✅ 必填验证功能
- ⏳ 在问题列表显示私人标识（可选）

### Phase 2（V6.8.0）
- 后端实现权限过滤逻辑
- 前端调用已过滤的API
- 完整测试所有场景

### Phase 3（V6.9.0）
- 打印功能的权限过滤
- 导出功能的权限过滤
- 高级权限设置

## 临时方案

在完整实现私人答案过滤之前，可以：

1. **添加视觉提示**: 在私人问题旁显示锁图标
2. **用户教育**: 在UI中提示私人答案的特性
3. **逐步迁移**: 先在新功能中实现过滤，逐步扩展到所有场景

## 代码示例（供后续参考）

```javascript
// 前端过滤函数（已准备但未使用）
function filterPrivateAnswers(question, answers, currentUserId, reviewCreatorId) {
  if (question.owner !== 'private') {
    return answers; // Public question, show all answers
  }
  
  // Private question, filter answers
  return answers.filter(answer => {
    return answer.user_id === currentUserId || currentUserId === reviewCreatorId;
  });
}

// 显示私人答案提示
function getPrivateAnswerHint(question, totalCount, visibleCount) {
  if (question.owner === 'private' && totalCount > visibleCount) {
    const hiddenCount = totalCount - visibleCount;
    return `
      <div class="text-sm text-gray-500 italic mt-2">
        <i class="fas fa-lock mr-1"></i>
        ${i18n.t('privateAnswersHidden').replace('{count}', hiddenCount)}
      </div>
    `;
  }
  return '';
}
```

## 总结

当前版本 V6.7.0 **已完整实现**:
- ✅ 数据库支持
- ✅ 模板编辑UI
- ✅ 必填字段验证

**待后续版本实现**:
- ⏳ 私人答案的完整权限过滤（建议在后端实现）

这种分阶段实现的方式：
1. 确保每个版本都是稳定可用的
2. 避免一次性修改过多代码导致bug
3. 给用户时间适应新功能
4. 便于测试和调试
