#!/usr/bin/env node

/**
 * Script to add V9.0.0 translations to i18n.js
 * Run with: node add_i18n_translations.js
 */

const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'public/static/i18n.js');

// Read the file
let content = fs.readFileSync(i18nPath, 'utf8');

// Chinese translations to add
const zhTranslations = `
    // V9.0.0 - Review Enhancement Features
    'allowMultipleAnswers': '是否允许多个复盘答案',
    'allowMultipleAnswersHint': '选择"是"将显示答案组管理功能，允许创建多个答案集合',
    'allowMultipleAnswersYes': '允许多个答案',
    'allowMultipleAnswersNo': '只允许单个答案',
    'lockStatus': '锁定状态',
    'locked': '已锁定',
    'unlocked': '未锁定',
    'lock': '锁定',
    'unlock': '解锁',
    'lockSuccess': '锁定成功',
    'unlockSuccess': '解锁成功',
    'confirmLock': '确定要锁定此复盘吗？锁定后将无法编辑。',
    'confirmUnlock': '确定要解锁此复盘吗？解锁后可以编辑。',
    'lockedNoEdit': '当前复盘已锁定，无法编辑',
    'unlockedCanEdit': '当前复盘未锁定，可以编辑',
    'lockHint': '锁定后将无法编辑，但可以查看',
    'reviewIsLocked': '复盘已锁定，无法编辑',
    'answerComment': '答案评论',
    'addComment': '添加评论',
    'hasComment': '已有评论',
    'commentHint': '只有复盘创建者和答案创建者可以查看此评论',
    'commentSaved': '评论保存成功',
    'commentCannotBeEmpty': '评论内容不能为空',
    'enterComment': '输入评论内容...',
    'saveComment': '保存评论',
    'loadCommentFailed': '加载评论失败',
    'saveCommentFailed': '保存评论失败',
    'noCommentPermission': '您没有权限查看或编辑此评论',
    'lastUpdated': '最后更新',`;

// English translations to add
const enTranslations = `
    // V9.0.0 - Review Enhancement Features
    'allowMultipleAnswers': 'Allow Multiple Answers',
    'allowMultipleAnswersHint': 'Enable answer set management for creating multiple answer collections',
    'allowMultipleAnswersYes': 'Allow Multiple Answers',
    'allowMultipleAnswersNo': 'Single Answer Only',
    'lockStatus': 'Lock Status',
    'locked': 'Locked',
    'unlocked': 'Unlocked',
    'lock': 'Lock',
    'unlock': 'Unlock',
    'lockSuccess': 'Locked successfully',
    'unlockSuccess': 'Unlocked successfully',
    'confirmLock': 'Are you sure you want to lock this review? It cannot be edited after locking.',
    'confirmUnlock': 'Are you sure you want to unlock this review? It can be edited after unlocking.',
    'lockedNoEdit': 'This review is locked and cannot be edited',
    'unlockedCanEdit': 'This review is unlocked and can be edited',
    'lockHint': 'Once locked, the review cannot be edited but can still be viewed',
    'reviewIsLocked': 'Review is locked and cannot be edited',
    'answerComment': 'Answer Comment',
    'addComment': 'Add Comment',
    'hasComment': 'Has Comment',
    'commentHint': 'Only review creator and answer creator can view this comment',
    'commentSaved': 'Comment saved successfully',
    'commentCannotBeEmpty': 'Comment cannot be empty',
    'enterComment': 'Enter comment...',
    'saveComment': 'Save Comment',
    'loadCommentFailed': 'Failed to load comment',
    'saveCommentFailed': 'Failed to save comment',
    'noCommentPermission': 'You do not have permission to view or edit this comment',
    'lastUpdated': 'Last Updated',`;

// Find and replace for Chinese (zh)
const zhMarker = "'canEdit': '可编辑',";
if (content.includes(zhMarker)) {
  content = content.replace(
    zhMarker,
    zhMarker + zhTranslations
  );
  console.log('✅ Added Chinese translations');
} else {
  console.log('⚠️  Chinese marker not found');
}

// Find and replace for English (en) - find first occurrence after line 1000
const lines = content.split('\n');
let enInserted = false;
for (let i = 1000; i < lines.length; i++) {
  if (lines[i].includes("'canEdit': 'Can Edit',") && lines[i+1].includes("'readOnly': 'Read Only',") && !enInserted) {
    lines.splice(i + 2, 0, enTranslations);
    enInserted = true;
    console.log('✅ Added English translations');
    break;
  }
}

if (enInserted) {
  content = lines.join('\n');
} else {
  console.log('⚠️  English marker not found');
}

// Write back
fs.writeFileSync(i18nPath, content, 'utf8');
console.log('✅ i18n.js updated successfully');
