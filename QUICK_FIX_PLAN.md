# 快速修复计划

## 问题分析

### 问题1: 私人答案仍然可见 ⚠️ 高优先级
**现状**: 所有答案都显示，没有根据owner字段过滤
**需要**: 在显示答案时检查权限

### 问题2: 可选字段也提示不能为空
**现状**: 已修复 - 验证逻辑只检查 required='yes'
**分析**: 可能是测试时字段设置错误，或者缓存问题

### 问题3: 必填字段点击取消可以跳过
**现状**: 取消按钮本就不应该验证
**建议**: 这是正确的行为，因为取消意味着放弃编辑

### 问题4: 时间字段默认值丢失
**现状**: 代码逻辑看起来正确
**需要**: 进一步调试

## 快速修复方案

### 方案A: 前端简单过滤（快速实现）

在显示答案时检查权限，隐藏无权查看的答案：

```javascript
function canViewAnswer(question, answer, currentUserId, reviewCreatorId) {
  // Public question: everyone can see
  if (question.owner === 'public') {
    return true;
  }
  
  // Private question: only answerer and review creator can see
  if (question.owner === 'private') {
    return answer.user_id === currentUserId || currentUserId === reviewCreatorId;
  }
  
  // Default: can view
  return true;
}
```

### 方案B: 后端过滤（安全但需要更多时间）

在后端API中过滤答案，前端直接显示。

## 推荐实施

由于需要快速修复，建议：
1. 实施前端过滤（方案A）
2. 在答案列表渲染时应用过滤
3. 显示"此答案为私人答案"的提示
