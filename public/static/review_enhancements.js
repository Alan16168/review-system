/**
 * Review Enhancement Features - V9.0.0
 * 
 * This file contains three new features:
 * 1. Review Lock/Unlock functionality
 * 2. Allow Multiple Answers control
 * 3. Answer Comment functionality
 */

// ==================== 1. Lock/Unlock Functions ====================

/**
 * Toggle review lock status
 * @param {number} reviewId - Review ID
 * @param {boolean} currentLockStatus - Current lock status
 */
async function toggleReviewLock(reviewId, currentLockStatus) {
  const action = currentLockStatus ? 'unlock' : 'lock';
  const confirmMessage = currentLockStatus 
    ? (i18n.t('confirmUnlock') || '确定要解锁此复盘吗？解锁后可以编辑。')
    : (i18n.t('confirmLock') || '确定要锁定此复盘吗？锁定后将无法编辑。');
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    const response = await axios.put(`/api/reviews/${reviewId}/${action}`, {}, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (response.data) {
      const newLockStatus = response.data.is_locked === 'yes';
      showNotification(
        response.data.message || (newLockStatus ? i18n.t('lockSuccess') : i18n.t('unlockSuccess')),
        'success'
      );
      
      // Refresh page to update UI
      setTimeout(() => window.location.reload(), 1000);
    }
  } catch (error) {
    console.error('Toggle lock error:', error);
    showNotification(
      error.response?.data?.error || i18n.t('operationFailed'),
      'error'
    );
  }
}

/**
 * Update lock UI elements based on lock status
 * @param {boolean} isLocked - Whether review is locked
 */
function updateLockUI(isLocked) {
  const statusText = document.getElementById('lock-status-text');
  const btnText = document.getElementById('lock-btn-text');
  const btn = document.getElementById('toggle-lock-btn');
  const btnIcon = document.getElementById('lock-btn-icon');
  
  if (!statusText || !btnText || !btn || !btnIcon) {
    return;
  }
  
  if (isLocked) {
    statusText.textContent = i18n.t('lockedNoEdit') || '当前复盘已锁定，无法编辑';
    statusText.className = 'text-sm text-red-700 font-medium';
    btnText.textContent = i18n.t('unlock') || '解锁';
    btn.className = 'px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition flex items-center';
    btnIcon.className = 'fas fa-lock-open mr-2';
    
    // Disable all edit features
    disableEditFeatures();
  } else {
    statusText.textContent = i18n.t('unlockedCanEdit') || '当前复盘未锁定，可以编辑';
    statusText.className = 'text-sm text-green-700 font-medium';
    btnText.textContent = i18n.t('lock') || '锁定';
    btn.className = 'px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition flex items-center';
    btnIcon.className = 'fas fa-lock mr-2';
    
    // Enable edit features
    enableEditFeatures();
  }
}

/**
 * Disable all edit features when review is locked
 */
function disableEditFeatures() {
  // Disable edit buttons
  document.querySelectorAll('[onclick*="showEditReview"], [onclick*="deleteReview"], .edit-btn, .delete-btn, .save-btn').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.onclick = (e) => {
      e.preventDefault();
      showNotification(i18n.t('reviewIsLocked') || '复盘已锁定，无法编辑', 'warning');
    };
  });
  
  // Disable input fields
  document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), textarea, select').forEach(input => {
    input.disabled = true;
    input.classList.add('bg-gray-100', 'cursor-not-allowed');
  });
}

/**
 * Enable all edit features when review is unlocked
 */
function enableEditFeatures() {
  // Enable edit buttons
  document.querySelectorAll('[onclick*="showEditReview"], [onclick*="deleteReview"], .edit-btn, .delete-btn, .save-btn').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  });
  
  // Enable input fields
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.disabled = false;
    input.classList.remove('bg-gray-100', 'cursor-not-allowed');
  });
}

/**
 * Render lock status section HTML
 * @param {Object} review - Review data
 * @returns {string} HTML string
 */
function renderLockStatusSection(review) {
  // Only show to creator
  if (!review.is_creator) {
    return '';
  }
  
  const isLocked = review.is_locked || false;
  const statusText = isLocked 
    ? (i18n.t('lockedNoEdit') || '当前复盘已锁定，无法编辑')
    : (i18n.t('unlockedCanEdit') || '当前复盘未锁定，可以编辑');
  const statusClass = isLocked ? 'text-red-700' : 'text-green-700';
  const btnText = isLocked ? (i18n.t('unlock') || '解锁') : (i18n.t('lock') || '锁定');
  const btnClass = isLocked 
    ? 'px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600'
    : 'px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600';
  const iconClass = isLocked ? 'fas fa-lock-open' : 'fas fa-lock';
  
  return `
    <div id="review-lock-section" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h3 class="font-semibold text-yellow-800 flex items-center mb-2">
            <i class="fas fa-shield-alt mr-2"></i>
            <span>${i18n.t('lockStatus') || '锁定状态'}</span>
          </h3>
          <p id="lock-status-text" class="text-sm ${statusClass} font-medium">
            ${statusText}
          </p>
          <p class="text-xs text-gray-600 mt-1">
            ${i18n.t('lockHint') || '锁定后将无法编辑，但可以查看'}
          </p>
        </div>
        <button 
          id="toggle-lock-btn" 
          onclick="toggleReviewLock(${review.id}, ${isLocked})"
          class="${btnClass} transition flex items-center"
        >
          <i id="lock-btn-icon" class="${iconClass} mr-2"></i>
          <span id="lock-btn-text">${btnText}</span>
        </button>
      </div>
    </div>
  `;
}

// ==================== 2. Multiple Answers Control ====================

/**
 * Check if answer set management should be shown
 * @param {Object} review - Review data
 * @returns {boolean}
 */
function shouldShowAnswerSetManagement(review) {
  // If allow_multiple_answers is undefined (old reviews), default to true
  if (review.allow_multiple_answers === undefined || review.allow_multiple_answers === null) {
    return true;
  }
  return review.allow_multiple_answers === true || review.allow_multiple_answers === 'yes';
}

// ==================== 3. Answer Comment Functions ====================

/**
 * Open comment modal for an answer
 * @param {number} reviewId - Review ID
 * @param {number} answerId - Answer ID
 */
async function openCommentModal(reviewId, answerId) {
  try {
    // Fetch existing comment
    const response = await axios.get(`/api/reviews/${reviewId}/answers/${answerId}/comment`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = response.data;
    
    // Show modal
    const modal = document.getElementById('comment-modal');
    const commentText = document.getElementById('comment-text');
    const commentInfo = document.getElementById('comment-info');
    
    if (!modal || !commentText) {
      console.error('Comment modal elements not found');
      return;
    }
    
    // Set current comment
    commentText.value = data.comment || '';
    
    // Show last update time if exists
    if (data.commentUpdatedAt && commentInfo) {
      commentInfo.textContent = `${i18n.t('lastUpdated') || '最后更新'}: ${new Date(data.commentUpdatedAt).toLocaleString()}`;
      commentInfo.classList.remove('hidden');
    } else if (commentInfo) {
      commentInfo.classList.add('hidden');
    }
    
    // Store IDs for save function
    modal.dataset.reviewId = reviewId;
    modal.dataset.answerId = answerId;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
  } catch (error) {
    console.error('Load comment error:', error);
    if (error.response?.status === 403) {
      showNotification(i18n.t('noCommentPermission') || '您没有权限查看此评论', 'error');
    } else {
      showNotification(i18n.t('loadCommentFailed') || '加载评论失败', 'error');
    }
  }
}

/**
 * Save answer comment
 */
async function saveAnswerComment() {
  const modal = document.getElementById('comment-modal');
  const commentText = document.getElementById('comment-text');
  
  if (!modal || !commentText) {
    return;
  }
  
  const reviewId = modal.dataset.reviewId;
  const answerId = modal.dataset.answerId;
  const comment = commentText.value.trim();
  
  if (!comment) {
    showNotification(i18n.t('commentCannotBeEmpty') || '评论内容不能为空', 'warning');
    return;
  }
  
  try {
    const response = await axios.post(
      `/api/reviews/${reviewId}/answers/${answerId}/comment`,
      { comment },
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data) {
      showNotification(
        response.data.message || i18n.t('commentSaved') || '评论保存成功',
        'success'
      );
      closeCommentModal();
      
      // Update comment indicator
      updateCommentIndicator(answerId, comment);
    }
  } catch (error) {
    console.error('Save comment error:', error);
    if (error.response?.status === 403) {
      showNotification(i18n.t('noCommentPermission') || '您没有权限编辑此评论', 'error');
    } else {
      showNotification(
        error.response?.data?.error || i18n.t('saveCommentFailed') || '保存评论失败',
        'error'
      );
    }
  }
}

/**
 * Close comment modal
 */
function closeCommentModal() {
  const modal = document.getElementById('comment-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    // Clear data
    const commentText = document.getElementById('comment-text');
    if (commentText) {
      commentText.value = '';
    }
  }
}

/**
 * Update comment indicator after saving
 * @param {number} answerId - Answer ID
 * @param {string} comment - Comment text
 */
function updateCommentIndicator(answerId, comment) {
  const btn = document.querySelector(`[data-answer-id="${answerId}"].comment-btn`);
  if (btn) {
    const indicator = btn.querySelector('.comment-indicator');
    if (indicator) {
      if (comment && comment.trim()) {
        indicator.textContent = i18n.t('hasComment') || '已有评论';
        indicator.className = 'comment-indicator text-green-600 font-semibold';
      } else {
        indicator.textContent = i18n.t('addComment') || '添加评论';
        indicator.className = 'comment-indicator text-gray-600';
      }
    }
  }
}

/**
 * Render comment button for an answer
 * @param {Object} answer - Answer data
 * @param {number} reviewId - Review ID
 * @returns {string} HTML string
 */
function renderCommentButton(answer, reviewId) {
  // Only show if user has permission
  if (!answer.can_comment) {
    return '';
  }
  
  const hasComment = answer.comment && answer.comment.trim();
  const btnText = hasComment ? (i18n.t('hasComment') || '已有评论') : (i18n.t('addComment') || '添加评论');
  const textClass = hasComment ? 'text-green-600 font-semibold' : 'text-gray-600';
  
  return `
    <button 
      class="comment-btn mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
      data-answer-id="${answer.id}"
      data-review-id="${reviewId}"
      onclick="openCommentModal(${reviewId}, ${answer.id})"
    >
      <i class="fas fa-comment-dots mr-1"></i>
      <span class="comment-indicator ${textClass}">${btnText}</span>
    </button>
  `;
}

/**
 * Render comment modal HTML
 * @returns {string} HTML string
 */
function renderCommentModal() {
  return `
    <!-- Comment Modal -->
    <div id="comment-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div class="flex justify-between items-center p-6 border-b">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-comment-dots mr-2"></i>${i18n.t('answerComment') || '答案评论'}
          </h3>
          <button onclick="closeCommentModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-6">
          <textarea 
            id="comment-text" 
            rows="6" 
            class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="${i18n.t('enterComment') || '输入评论内容...'}"
          ></textarea>
          <p class="mt-2 text-xs text-gray-500">
            <i class="fas fa-info-circle mr-1"></i>
            ${i18n.t('commentHint') || '只有复盘创建者和答案创建者可以查看此评论'}
          </p>
          <p id="comment-info" class="mt-2 text-xs text-gray-600 hidden">
            <!-- Last update time will be displayed here -->
          </p>
        </div>
        <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button 
            onclick="closeCommentModal()" 
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            ${i18n.t('cancel') || '取消'}
          </button>
          <button 
            onclick="saveAnswerComment()" 
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <i class="fas fa-save mr-2"></i>${i18n.t('saveComment') || '保存评论'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==================== Utility Functions ====================

/**
 * Get authentication token
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const lang = i18n.getCurrentLanguage();
  return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

console.log('✅ Review Enhancement Features Loaded (V9.0.0)');
