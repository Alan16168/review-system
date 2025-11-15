/**
 * Review Editor Module v6.0.0
 * 统一的复盘创建和编辑功能
 * 
 * 架构：
 * - 单一函数处理创建和编辑
 * - 新UI设计（三个可折叠区域）
 * - 统一的保存逻辑
 */

// ============================================================================
// 全局状态管理
// ============================================================================

window.reviewEditor = {
  reviewId: null,           // null表示新建，有值表示编辑
  isCreator: true,          // 是否是创建者
  reviewData: {},           // 复盘数据
  template: null,           // 模板数据
  answerSets: [],           // 答案集数据
  currentAnswerSetIndex: 0, // 当前显示的答案集索引
  isDirty: false            // 是否有未保存的更改
};

// ============================================================================
// 主入口函数
// ============================================================================

/**
 * 显示复盘编辑器（统一的创建/编辑入口）
 * @param {number|null} reviewId - 复盘ID，null表示创建新复盘
 */
window.showReviewEditor = async function(reviewId = null) {
  console.log('[ReviewEditor] ========== 开始加载编辑器 ==========');
  console.log('[ReviewEditor] reviewId:', reviewId);
  
  currentView = 'review-editor';
  
  // 重置编辑器状态
  window.reviewEditor = {
    reviewId: reviewId,
    isCreator: true,
    reviewData: {},
    template: null,
    answerSets: [],
    currentAnswerSetIndex: 0,
    isDirty: false,
    collapsedSections: {
      header: false,
      answers: false,
      planTime: true  // 默认折叠计划时间区域
    }
  };
  
  try {
    if (reviewId) {
      // 编辑模式：加载现有复盘数据
      console.log('[ReviewEditor] 编辑模式 - 加载复盘数据, ID:', reviewId);
      await loadReviewData(reviewId);
      console.log('[ReviewEditor] 数据加载完成');
      console.log('[ReviewEditor] reviewData:', window.reviewEditor.reviewData);
      console.log('[ReviewEditor] template:', window.reviewEditor.template);
      console.log('[ReviewEditor] template.questions:', window.reviewEditor.template?.questions);
      console.log('[ReviewEditor] answerSets:', window.reviewEditor.answerSets);
    } else {
      // 创建模式：初始化空数据
      console.log('[ReviewEditor] 创建模式 - 初始化新复盘');
      await initializeNewReview();
    }
    
    // 渲染UI
    console.log('[ReviewEditor] 开始渲染UI...');
    renderReviewEditor();
    console.log('[ReviewEditor] ========== 编辑器加载完成 ==========');
    
  } catch (error) {
    console.error('[ReviewEditor] ========== 初始化失败 ==========');
    console.error('[ReviewEditor] 错误详情:', error);
    console.error('[ReviewEditor] 错误堆栈:', error.stack);
    showNotification(i18n.t('operationFailed') + ': ' + error.message, 'error');
    showReviews();
  }
};

// ============================================================================
// 数据加载和初始化
// ============================================================================

/**
 * 加载现有复盘数据（编辑模式）
 */
async function loadReviewData(reviewId) {
  try {
    console.log('[loadReviewData] 开始加载复盘数据...');
    const response = await axios.get(`/api/reviews/${reviewId}`);
    const data = response.data;
    
    console.log('[loadReviewData] API响应数据:', data);
    console.log('[loadReviewData] data.review:', data.review);
    console.log('[loadReviewData] data.questions:', data.questions);
    console.log('[loadReviewData] data.questions.length:', data.questions?.length);
    console.log('[loadReviewData] data.answersByQuestion:', data.answersByQuestion);
    
    // 存储基本数据
    window.reviewEditor.reviewData = {
      id: data.review.id,
      title: data.review.title,
      description: data.review.description,
      template_id: data.review.template_id,
      template_name: data.review.template_name,
      template_description: data.review.template_description,
      time_type: data.review.time_type,
      owner_type: data.review.owner_type,
      team_id: data.review.team_id,
      status: data.review.status,
      scheduled_at: data.review.scheduled_at,
      location: data.review.location,
      reminder_minutes: data.review.reminder_minutes || 60,
      created_at: data.review.created_at,
      updated_at: data.review.updated_at,
      creator_id: data.review.user_id
    };
    
    console.log('[loadReviewData] reviewData已存储:', window.reviewEditor.reviewData);
    
    // 存储模板数据（使用questions数据）
    window.reviewEditor.template = {
      id: data.review.template_id,
      name: data.review.template_name,
      description: data.review.template_description,
      questions: data.questions || []
    };
    
    console.log('[loadReviewData] template已存储:', window.reviewEditor.template);
    console.log('[loadReviewData] template.questions:', window.reviewEditor.template.questions);
    
    // 判断是否是创建者
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    window.reviewEditor.isCreator = (data.review.user_id === currentUser.id);
    
    console.log('[loadReviewData] 当前用户:', currentUser);
    console.log('[loadReviewData] isCreator:', window.reviewEditor.isCreator);
    
    // 加载答案集
    console.log('[loadReviewData] 开始加载答案集...');
    await loadAnswerSets(reviewId);
    console.log('[loadReviewData] 答案集加载完成');
    
  } catch (error) {
    console.error('[loadReviewData] 加载复盘数据失败:', error);
    console.error('[loadReviewData] 错误详情:', error.response?.data);
    throw error;
  }
}

/**
 * 初始化新复盘（创建模式）
 */
async function initializeNewReview() {
  try {
    // 加载模板列表
    const response = await axios.get('/api/templates');
    console.log('[initializeNewReview] 模板API响应:', response.data);
    
    // API返回 { templates: [...] }
    const templatesData = response.data.templates || [];
    window.currentTemplates = templatesData;
    console.log('[initializeNewReview] 加载了', templatesData.length, '个模板');
    
    // 加载团队列表
    const teamsResponse = await axios.get('/api/teams');
    console.log('[initializeNewReview] 团队API响应:', teamsResponse.data);
    
    // API返回 { myTeams: [...] }
    const teamsData = teamsResponse.data.myTeams || [];
    window.currentTeams = teamsData;
    console.log('[initializeNewReview] 加载了', teamsData.length, '个团队');
    
    // 初始化默认数据
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    window.reviewEditor.reviewData = {
      title: '',
      description: '',
      template_id: 1,  // 默认模板
      time_type: 'year',
      owner_type: 'private',
      team_id: null,
      status: 'draft',
      scheduled_at: null,
      location: '',
      reminder_minutes: 60,
      creator_id: currentUser.id
    };
    
    // 加载默认模板
    if (window.currentTemplates.length > 0) {
      window.reviewEditor.template = window.currentTemplates[0];
    }
    
    window.reviewEditor.isCreator = true;
    window.reviewEditor.answerSets = [];
    
  } catch (error) {
    console.error('[ReviewEditor] 初始化新复盘失败:', error);
    throw error;
  }
}

/**
 * 加载答案集
 */
async function loadAnswerSets(reviewId) {
  try {
    console.log('[loadAnswerSets] 开始加载答案集, reviewId:', reviewId);
    const response = await axios.get(`/api/answer-sets/${reviewId}`);
    console.log('[loadAnswerSets] API响应:', response.data);
    
    // 后端返回 { sets: [...] }
    window.reviewEditor.answerSets = response.data.sets || [];
    
    console.log('[loadAnswerSets] 答案集已加载:', window.reviewEditor.answerSets.length, '个');
    console.log('[loadAnswerSets] 答案集详情:', window.reviewEditor.answerSets);
    
    // 设置当前答案集索引
    if (window.reviewEditor.answerSets.length > 0) {
      window.reviewEditor.currentAnswerSetIndex = 0;
      console.log('[loadAnswerSets] 当前答案集索引:', window.reviewEditor.currentAnswerSetIndex);
    }
    
  } catch (error) {
    console.error('[loadAnswerSets] 加载答案集失败:', error);
    console.error('[loadAnswerSets] 错误详情:', error.response?.data);
    // 不阻断流程，答案集可能为空
    window.reviewEditor.answerSets = [];
  }
}

// ============================================================================
// UI渲染
// ============================================================================

/**
 * 渲染复盘编辑器
 */
function renderReviewEditor() {
  const app = document.getElementById('app');
  const editor = window.reviewEditor;
  const data = editor.reviewData;
  const isEdit = (editor.reviewId !== null);
  
  console.log('[renderReviewEditor] 开始渲染编辑器');
  console.log('[renderReviewEditor] 模式:', isEdit ? '编辑' : '创建');
  console.log('[renderReviewEditor] 折叠状态:', editor.collapsedSections);
  
  const pageTitle = isEdit ? i18n.t('editReview') : i18n.t('createReview');
  
  // 根据创建/编辑模式显示不同的按钮文字
  const saveButtonText = isEdit ? i18n.t('saveAndExit') : i18n.t('createAndContinue');
  
  app.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button onclick="handleReviewEditorBack()" 
                  class="text-indigo-600 hover:text-indigo-800 flex items-center">
            <i class="fas fa-arrow-left mr-2"></i>
            ${i18n.t('back')}
          </button>
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-edit mr-2"></i>
            ${pageTitle}
          </h1>
        </div>
        <button onclick="handleSaveReview()" 
                class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg flex items-center">
          <i class="fas ${isEdit ? 'fa-save' : 'fa-arrow-right'} mr-2"></i>
          ${saveButtonText}
        </button>
      </div>
      
      <form id="review-editor-form" onsubmit="handleSaveReview(event)" class="space-y-4">
        <!-- Section 1: Review Header -->
        ${renderReviewHeaderSection()}
        
        <!-- Section 2: Answer Sets Management (仅编辑模式显示) -->
        ${isEdit ? renderAnswerSetsSection() : ''}
        
        <!-- Section 3: Plan Review Time -->
        ${renderPlanTimeSection()}
      </form>
    </div>
  `;
  
  // 绑定事件监听器
  attachEditorEventListeners();
}

/**
 * 渲染 Review Header 区域
 */
function renderReviewHeaderSection() {
  const editor = window.reviewEditor;
  const data = editor.reviewData;
  const isCollapsed = editor.collapsedSections.header;
  const isEdit = (editor.reviewId !== null);
  const isCreator = editor.isCreator;
  
  // 只有创建者或新建时才能编辑表头
  const canEditHeader = isCreator || !isEdit;
  const disabled = canEditHeader ? '' : 'disabled';
  
  return `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Section Header -->
      <div class="section-header section-header-purple px-6 py-4">
        <div class="flex items-center space-x-3">
          <i class="fas fa-heading text-indigo-700"></i>
          <h2 class="text-lg font-semibold text-indigo-900">
            ${i18n.t('reviewHeader')}
          </h2>
        </div>
      </div>
      
      <!-- Section Content -->
      <div id="section-header" class="p-6 space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('title')} <span class="text-red-500">*</span>
          </label>
          <input type="text" 
                 id="review-title" 
                 name="title"
                 value="${data.title || ''}"
                 ${disabled}
                 required
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 placeholder="${i18n.t('enterTitle')}">
        </div>
        
        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('description')}
          </label>
          <textarea id="review-description" 
                    name="description"
                    ${disabled}
                    rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="${i18n.t('enterDescription')}">${data.description || ''}</textarea>
        </div>
        
        <!-- Template Selection (only for new review) -->
        ${!isEdit ? renderTemplateSelect() : renderTemplateDisplay()}
        
        <!-- Time Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('timeType')} <span class="text-red-500">*</span>
          </label>
          <select id="review-time-type" 
                  name="time_type"
                  ${disabled}
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="year" ${data.time_type === 'year' ? 'selected' : ''}>${i18n.t('year')}</option>
            <option value="quarter" ${data.time_type === 'quarter' ? 'selected' : ''}>${i18n.t('quarter')}</option>
            <option value="month" ${data.time_type === 'month' ? 'selected' : ''}>${i18n.t('month')}</option>
            <option value="week" ${data.time_type === 'week' ? 'selected' : ''}>${i18n.t('week')}</option>
            <option value="day" ${data.time_type === 'day' ? 'selected' : ''}>${i18n.t('day')}</option>
            <option value="project" ${data.time_type === 'project' ? 'selected' : ''}>${i18n.t('project')}</option>
            <option value="event" ${data.time_type === 'event' ? 'selected' : ''}>${i18n.t('event')}</option>
          </select>
        </div>
        
        <!-- Owner Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('ownerType')} <span class="text-red-500">*</span>
          </label>
          <select id="review-owner-type" 
                  name="owner_type"
                  ${disabled}
                  onchange="handleOwnerTypeChange()"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="private" ${data.owner_type === 'private' ? 'selected' : ''}>${i18n.t('ownerTypePrivate')}</option>
            <option value="team" ${data.owner_type === 'team' ? 'selected' : ''}>${i18n.t('ownerTypeTeam')}</option>
            <option value="public" ${data.owner_type === 'public' ? 'selected' : ''}>${i18n.t('ownerTypePublic')}</option>
          </select>
        </div>
        
        <!-- Team Selection (if owner_type is team) -->
        <div id="team-select-container" style="display: ${data.owner_type === 'team' ? 'block' : 'none'}">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('selectTeam')} <span class="text-red-500">*</span>
          </label>
          <select id="review-team" 
                  name="team_id"
                  ${disabled}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">${i18n.t('pleaseSelect')}</option>
            ${Array.isArray(window.currentTeams) ? window.currentTeams.map(team => `
              <option value="${team.id}" ${data.team_id == team.id ? 'selected' : ''}>
                ${team.name}
              </option>
            `).join('') : ''}
          </select>
        </div>
        
        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('status')} <span class="text-red-500">*</span>
          </label>
          <div class="flex space-x-4">
            <label class="inline-flex items-center">
              <input type="radio" 
                     name="status" 
                     value="draft" 
                     ${data.status === 'draft' || !isEdit ? 'checked' : ''}
                     ${disabled}
                     class="form-radio text-indigo-600">
              <span class="ml-2">${i18n.t('draft')}</span>
            </label>
            <label class="inline-flex items-center">
              <input type="radio" 
                     name="status" 
                     value="in_progress" 
                     ${data.status === 'in_progress' ? 'checked' : ''}
                     ${disabled}
                     class="form-radio text-indigo-600">
              <span class="ml-2">${i18n.t('inProgress')}</span>
            </label>
            <label class="inline-flex items-center">
              <input type="radio" 
                     name="status" 
                     value="completed" 
                     ${data.status === 'completed' ? 'checked' : ''}
                     ${disabled}
                     class="form-radio text-indigo-600">
              <span class="ml-2">${i18n.t('completed')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染模板选择（创建模式）
 */
function renderTemplateSelect() {
  const templates = window.currentTemplates || [];
  const currentTemplateId = window.reviewEditor.reviewData.template_id || 1;
  
  // 验证 templates 是数组
  if (!Array.isArray(templates)) {
    console.error('[renderTemplateSelect] templates is not an array:', templates);
    return `
      <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        模板数据加载失败，请刷新页面重试
      </div>
    `;
  }
  
  if (templates.length === 0) {
    console.warn('[renderTemplateSelect] No templates available');
    return `
      <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
        <i class="fas fa-exclamation-circle mr-2"></i>
        暂无可用模板
      </div>
    `;
  }
  
  return `
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        ${i18n.t('template')} <span class="text-red-500">*</span>
      </label>
      <select id="review-template" 
              name="template_id"
              onchange="handleTemplateChange()"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        ${templates.map(template => `
          <option value="${template.id}" ${template.id == currentTemplateId ? 'selected' : ''}>
            ${template.name}
          </option>
        `).join('')}
      </select>
      <div id="template-info" class="mt-2 text-sm text-gray-600"></div>
    </div>
  `;
}

/**
 * 渲染模板显示（编辑模式 - 不可更改）
 */
function renderTemplateDisplay() {
  const template = window.reviewEditor.template;
  if (!template) return '';
  
  return `
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        ${i18n.t('template')}
      </label>
      <div class="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="font-medium text-gray-900">${template.name}</span>
          <span class="text-xs text-gray-500">
            <i class="fas fa-lock mr-1"></i>
            ${i18n.t('cannotModifyTemplate')}
          </span>
        </div>
        ${template.description ? `
          <p class="mt-2 text-sm text-gray-600">${template.description}</p>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * 渲染 Answer Sets Management 区域
 */
function renderAnswerSetsSection() {
  const editor = window.reviewEditor;
  const isEdit = (editor.reviewId !== null);
  
  // 创建模式下不显示答案区域（需要先保存后才能填写答案）
  if (!isEdit) {
    return `
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="section-header section-header-green px-6 py-4">
          <div class="flex items-center space-x-3">
            <i class="fas fa-layer-group text-green-700"></i>
            <h2 class="text-lg font-semibold text-green-900">
              ${i18n.t('answerSetsManagement')}
            </h2>
          </div>
        </div>
        <div class="p-6 text-center text-gray-500">
          <i class="fas fa-info-circle text-2xl mb-2"></i>
          <p>${i18n.t('saveFirstToAddAnswers')}</p>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Section Header -->
      <div class="section-header section-header-green px-6 py-4">
        <div class="flex items-center space-x-3">
          <i class="fas fa-layer-group text-green-700"></i>
          <h2 class="text-lg font-semibold text-green-900">
            ${i18n.t('answerSetsManagement')}
          </h2>
          ${editor.answerSets.length > 0 ? `
            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              ${editor.answerSets.length} ${i18n.t('sets')}
            </span>
          ` : ''}
        </div>
      </div>
      
      <!-- Section Content -->
      <div id="section-answers" class="p-6">
        ${renderAnswerSetsContent()}
      </div>
    </div>
  `;
}

/**
 * 渲染答案集内容
 */
function renderAnswerSetsContent() {
  const editor = window.reviewEditor;
  const template = editor.template;
  
  if (!template || !template.questions || template.questions.length === 0) {
    return `
      <div class="text-center text-gray-500 py-8">
        <i class="fas fa-question-circle text-4xl mb-3"></i>
        <p>${i18n.t('noQuestionsInTemplate')}</p>
      </div>
    `;
  }
  
  // 按问题编号分组答案
  const answersByQuestion = {};
  if (editor.answerSets.length > 0) {
    const currentSet = editor.answerSets[editor.currentAnswerSetIndex];
    if (currentSet && currentSet.answers) {
      currentSet.answers.forEach(answer => {
        if (!answersByQuestion[answer.question_number]) {
          answersByQuestion[answer.question_number] = [];
        }
        answersByQuestion[answer.question_number].push(answer);
      });
    }
  }
  
  return `
    <!-- Answer Set Navigation -->
    ${editor.answerSets.length > 1 ? renderAnswerSetNavigation() : ''}
    
    <!-- Questions and Answers -->
    <div class="space-y-6">
      ${template.questions.map(question => renderQuestion(question, answersByQuestion[question.question_number] || [])).join('')}
    </div>
  `;
}

/**
 * 渲染答案集导航
 */
function renderAnswerSetNavigation() {
  const editor = window.reviewEditor;
  const currentIndex = editor.currentAnswerSetIndex;
  const totalSets = editor.answerSets.length;
  
  return `
    <div class="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
      <button type="button"
              onclick="navigateAnswerSet(-1)"
              ${currentIndex === 0 ? 'disabled' : ''}
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <div class="text-center">
        <div class="text-sm text-gray-600">${i18n.t('answerSet')}</div>
        <div class="text-lg font-semibold text-gray-900">
          ${currentIndex + 1} / ${totalSets}
        </div>
      </div>
      
      <button type="button"
              onclick="navigateAnswerSet(1)"
              ${currentIndex === totalSets - 1 ? 'disabled' : ''}
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
}

/**
 * 渲染单个问题和答案
 */
function renderQuestion(question, answers) {
  const questionTypeIcon = {
    'text': 'fa-align-left',
    'single_choice': 'fa-dot-circle',
    'multiple_choice': 'fa-check-square'
  };
  
  const icon = questionTypeIcon[question.question_type] || 'fa-question';
  
  return `
    <div class="border border-gray-200 rounded-lg p-4">
      <!-- Question -->
      <div class="flex items-start space-x-3 mb-4">
        <div class="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <span class="text-indigo-600 font-semibold text-sm">${question.question_number}</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <i class="fas ${icon} text-gray-400"></i>
            <h3 class="font-medium text-gray-900">${question.question_text}</h3>
          </div>
          ${question.question_type === 'text' ? renderTextQuestion(question, answers) : renderChoiceQuestion(question, answers)}
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染文本类型问题
 */
function renderTextQuestion(question, answers) {
  return `
    <div class="space-y-3">
      <!-- Existing Answers -->
      ${answers.map(answer => `
        <div class="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
          <div class="flex-1">
            <p class="text-gray-700">${escapeHtml(answer.answer)}</p>
            <p class="text-xs text-gray-500 mt-1">
              ${new Date(answer.created_at).toLocaleString()}
            </p>
          </div>
          <button type="button"
                  onclick="deleteAnswerConfirm(${answer.id})"
                  class="text-red-600 hover:text-red-800">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('')}
      
      <!-- Add New Answer -->
      <div class="flex space-x-2">
        <input type="text"
               id="new-answer-${question.question_number}"
               placeholder="${i18n.t('enterAnswer')}"
               class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        <button type="button"
                onclick="addNewAnswer(${question.question_number})"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <i class="fas fa-plus mr-2"></i>
          ${i18n.t('add')}
        </button>
      </div>
    </div>
  `;
}

/**
 * 渲染选择类型问题
 */
function renderChoiceQuestion(question, answers) {
  const selectedAnswers = answers.map(a => a.answer);
  const isSingleChoice = (question.question_type === 'single_choice');
  
  // 解析 options - 可能是 JSON 字符串或数组
  let options = [];
  if (question.options) {
    if (typeof question.options === 'string') {
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        console.error('[renderChoiceQuestion] 解析 options 失败:', e, question.options);
        options = [];
      }
    } else if (Array.isArray(question.options)) {
      options = question.options;
    } else {
      console.error('[renderChoiceQuestion] options 类型错误:', typeof question.options, question.options);
      options = [];
    }
  }
  
  return `
    <div class="space-y-2">
      ${options.length > 0 ? options.map((option, index) => {
        const optionValue = String.fromCharCode(65 + index); // A, B, C, ...
        const isChecked = selectedAnswers.includes(optionValue);
        const inputType = isSingleChoice ? 'radio' : 'checkbox';
        const inputName = `question-${question.question_number}`;
        
        return `
          <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="${inputType}"
                   name="${inputName}"
                   value="${optionValue}"
                   ${isChecked ? 'checked' : ''}
                   onchange="handleChoiceChange(${question.question_number})"
                   class="form-${inputType} text-indigo-600">
            <span class="flex-1 text-gray-700">${optionValue}. ${option}</span>
          </label>
        `;
      }).join('') : '<p class="text-gray-500 text-sm">暂无选项</p>'}
    </div>
  `;
}

/**
 * 渲染 Plan Review Time 区域
 */
function renderPlanTimeSection() {
  const editor = window.reviewEditor;
  const data = editor.reviewData;
  const isCreator = editor.isCreator;
  const disabled = isCreator ? '' : 'disabled';
  
  // 格式化日期时间为 datetime-local 格式
  const scheduledAt = data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : '';
  
  return `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Section Header -->
      <div class="section-header section-header-blue px-6 py-4">
        <div class="flex items-center space-x-3">
          <i class="fas fa-calendar-alt text-blue-700"></i>
          <h2 class="text-lg font-semibold text-blue-900">
            ${i18n.t('planReviewTime')} <span class="text-sm font-normal text-gray-600">(${i18n.t('optional')})</span>
          </h2>
        </div>
      </div>
      
      <!-- Section Content -->
      <div id="section-planTime" class="p-6 space-y-4">
        <!-- Scheduled Time -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-clock mr-2"></i>
            ${i18n.t('scheduledTime')}
          </label>
          <input type="datetime-local"
                 id="review-scheduled-at"
                 name="scheduled_at"
                 value="${scheduledAt}"
                 ${disabled}
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        </div>
        
        <!-- Location -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-map-marker-alt mr-2"></i>
            ${i18n.t('location')}
          </label>
          <input type="text"
                 id="review-location"
                 name="location"
                 value="${data.location || ''}"
                 ${disabled}
                 placeholder="${i18n.t('enterLocation')}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        </div>
        
        <!-- Reminder -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-bell mr-2"></i>
            ${i18n.t('reminderBefore')}
          </label>
          <select id="review-reminder-minutes"
                  name="reminder_minutes"
                  ${disabled}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="15" ${data.reminder_minutes == 15 ? 'selected' : ''}>15 ${i18n.t('minutes')}</option>
            <option value="30" ${data.reminder_minutes == 30 ? 'selected' : ''}>30 ${i18n.t('minutes')}</option>
            <option value="60" ${data.reminder_minutes == 60 ? 'selected' : ''}>1 ${i18n.t('hour')}</option>
            <option value="120" ${data.reminder_minutes == 120 ? 'selected' : ''}>2 ${i18n.t('hours')}</option>
            <option value="1440" ${data.reminder_minutes == 1440 ? 'selected' : ''}>1 ${i18n.t('day')}</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 绑定编辑器事件监听器
 */
function attachEditorEventListeners() {
  console.log('[attachEditorEventListeners] ========== 开始绑定事件 ==========');
  
  // 表单输入变化监听（标记为脏数据）
  const form = document.getElementById('review-editor-form');
  if (form) {
    form.addEventListener('input', () => {
      window.reviewEditor.isDirty = true;
    });
    console.log('[attachEditorEventListeners] ✓ 表单输入监听已绑定');
  } else {
    console.warn('[attachEditorEventListeners] ⚠️ 未找到表单元素 #review-editor-form');
  }
  
  // 模板选择变化
  const templateSelect = document.getElementById('review-template');
  if (templateSelect) {
    templateSelect.addEventListener('change', handleTemplateChange);
    // 初始化模板信息显示
    handleTemplateChange();
    console.log('[attachEditorEventListeners] ✓ 模板选择监听已绑定');
  }
  
  // Section 折叠功能使用 inline onclick，无需绑定事件
  console.log('[attachEditorEventListeners] ========== 所有事件绑定完成 ==========');
}

/**
 * 处理返回按钮
 */
window.handleReviewEditorBack = function() {
  const editor = window.reviewEditor;
  
  if (editor.isDirty) {
    if (!confirm(i18n.t('unsavedChangesWarning'))) {
      return;
    }
  }
  
  showReviews();
};

/**
 * 处理区域折叠/展开 - 已禁用（改用背景色区分）
 */
// window.toggleSection = function(sectionName) {
  console.log('[toggleSection] ========== 🎯 函数被调用！ ==========');
  console.log('[toggleSection] 参数 sectionName:', sectionName);
  
  const editor = window.reviewEditor;
  
  if (!editor) {
    console.error('[toggleSection] ❌ window.reviewEditor 不存在！');
    alert('错误：编辑器对象不存在');
    return;
  }
  
  console.log('[toggleSection] 开始折叠操作');
  console.log('[toggleSection] 点击区域:', sectionName);
  console.log('[toggleSection] 当前折叠状态:', editor.collapsedSections[sectionName]);
  
  // 切换状态
  editor.collapsedSections[sectionName] = !editor.collapsedSections[sectionName];
  const isCollapsed = editor.collapsedSections[sectionName];
  
  console.log('[toggleSection] 新的折叠状态:', isCollapsed);
  
  // 找到 section content
  const sectionContent = document.getElementById(`section-${sectionName}`);
  console.log('[toggleSection] 找到section-content:', !!sectionContent);
  
  if (!sectionContent) {
    console.error('[toggleSection] ❌ 未找到元素 #section-' + sectionName);
    return;
  }
  
  // 应用折叠/展开
  if (isCollapsed) {
    console.log('[toggleSection] 🔽 折叠区域');
    sectionContent.classList.add('section-collapsed');
  } else {
    console.log('[toggleSection] 🔼 展开区域');
    sectionContent.classList.remove('section-collapsed');
  }
  
  console.log('[toggleSection] 当前classes:', sectionContent.className);
  console.log('[toggleSection] 计算后的样式 - maxHeight:', window.getComputedStyle(sectionContent).maxHeight);
  console.log('[toggleSection] 计算后的样式 - opacity:', window.getComputedStyle(sectionContent).opacity);
  
  // 找到并更新箭头图标
  // 使用更可靠的方式：通过父元素查找
  const parentCard = sectionContent.parentElement;
  if (!parentCard) {
    console.error('[toggleSection] ❌ 未找到父元素');
    return;
  }
  
  const sectionHeader = parentCard.querySelector('.section-header');
  console.log('[toggleSection] 找到section-header:', !!sectionHeader);
  
  if (sectionHeader) {
    const icon = sectionHeader.querySelector('.fa-chevron-up, .fa-chevron-down');
    console.log('[toggleSection] 找到图标:', !!icon);
    
    if (icon) {
      if (isCollapsed) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        console.log('[toggleSection] ⬇️ 箭头改为向下');
      } else {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        console.log('[toggleSection] ⬆️ 箭头改为向上');
      }
      console.log('[toggleSection] 图标classes:', icon.className);
    }
  }
  
  console.log('[toggleSection] ========== 折叠操作完成 ==========');
}; */

// 折叠功能已禁用 - 现在使用不同背景色区分不同工作区

/**
 * 处理所有者类型变化
 */
window.handleOwnerTypeChange = function() {
  const ownerType = document.getElementById('review-owner-type').value;
  const teamContainer = document.getElementById('team-select-container');
  
  if (teamContainer) {
    teamContainer.style.display = (ownerType === 'team') ? 'block' : 'none';
  }
};

/**
 * 处理模板选择变化
 */
function handleTemplateChange() {
  const templateSelect = document.getElementById('review-template');
  if (!templateSelect) return;
  
  const templateId = parseInt(templateSelect.value);
  const template = window.currentTemplates.find(t => t.id === templateId);
  
  if (template) {
    window.reviewEditor.reviewData.template_id = templateId;
    window.reviewEditor.template = template;
    
    // 更新模板信息显示
    const templateInfo = document.getElementById('template-info');
    if (templateInfo) {
      if (template.description) {
        const questionCount = template.questions ? template.questions.length : 0;
        templateInfo.textContent = `${template.description} (${questionCount} ${i18n.t('questions')})`;
        templateInfo.style.display = 'block';
      } else {
        templateInfo.style.display = 'none';
      }
    }
  }
}

/**
 * 处理选择题变化（单选/多选）
 */
function handleChoiceChange(questionNumber) {
  window.reviewEditor.isDirty = true;
  console.log(`[ReviewEditor] 问题 ${questionNumber} 的答案已更改`);
}

/**
 * 添加新答案
 */
window.addNewAnswer = async function(questionNumber) {
  const input = document.getElementById(`new-answer-${questionNumber}`);
  if (!input) return;
  
  const answer = input.value.trim();
  if (!answer) {
    showNotification(i18n.t('pleaseEnterAnswer'), 'warning');
    return;
  }
  
  const editor = window.reviewEditor;
  const reviewId = editor.reviewId;
  
  if (!reviewId) {
    showNotification(i18n.t('pleaseCreateReviewFirst'), 'error');
    return;
  }
  
  try {
    console.log('[ReviewEditor] 添加答案:', questionNumber, answer);
    
    await axios.post(`/api/reviews/${reviewId}/answers`, {
      question_number: questionNumber,
      answer: answer
    });
    
    showNotification(i18n.t('answerAdded'), 'success');
    input.value = '';
    
    // 重新加载答案集
    await loadAnswerSets(reviewId);
    
    // 重新渲染答案区域
    const answerSection = document.getElementById('section-answers');
    if (answerSection) {
      answerSection.innerHTML = renderAnswerSetsContent();
    }
    
  } catch (error) {
    console.error('[ReviewEditor] 添加答案失败:', error);
    showNotification(i18n.t('operationFailed') + ': ' + error.message, 'error');
  }
}

/**
 * 删除答案（带确认）
 */
window.deleteAnswerConfirm = function(answerId) {
  if (!confirm(i18n.t('confirmDeleteAnswer'))) {
    return;
  }
  
  deleteAnswer(answerId);
};

/**
 * 删除答案
 */
async function deleteAnswer(answerId) {
  const editor = window.reviewEditor;
  const reviewId = editor.reviewId;
  
  try {
    console.log('[ReviewEditor] 删除答案:', answerId);
    
    await axios.delete(`/api/reviews/${reviewId}/answers/${answerId}`);
    
    showNotification(i18n.t('answerDeleted'), 'success');
    
    // 重新加载答案集
    await loadAnswerSets(reviewId);
    
    // 重新渲染答案区域
    const answerSection = document.getElementById('section-answers');
    if (answerSection) {
      answerSection.innerHTML = renderAnswerSetsContent();
    }
    
  } catch (error) {
    console.error('[ReviewEditor] 删除答案失败:', error);
    showNotification(i18n.t('operationFailed') + ': ' + error.message, 'error');
  }
}

/**
 * 导航答案集
 */
window.navigateAnswerSet = function(direction) {
  const editor = window.reviewEditor;
  const newIndex = editor.currentAnswerSetIndex + direction;
  
  if (newIndex < 0 || newIndex >= editor.answerSets.length) {
    return;
  }
  
  editor.currentAnswerSetIndex = newIndex;
  
  // 重新渲染答案区域
  const answerSection = document.getElementById('section-answers');
  if (answerSection) {
    answerSection.innerHTML = renderAnswerSetsContent();
  }
};

// ============================================================================
// 保存功能
// ============================================================================

/**
 * 处理保存复盘
 */
async function handleSaveReview(event) {
  if (event) {
    event.preventDefault();
  }
  
  const editor = window.reviewEditor;
  const isEdit = (editor.reviewId !== null);
  
  try {
    // 收集表单数据
    const formData = collectFormData();
    
    // 验证数据
    if (!validateReviewData(formData)) {
      return;
    }
    
    console.log('[ReviewEditor] 保存数据:', formData);
    
    if (isEdit) {
      // 更新现有复盘
      await updateReview(editor.reviewId, formData);
      
      // 保存成功，返回列表
      setTimeout(() => {
        window.reviewEditor.isDirty = false;
        showReviews();
        window.scrollTo(0, 0);
      }, 800);
    } else {
      // 创建新复盘
      const newReviewId = await createReview(formData);
      
      // 创建成功后，自动进入编辑模式
      showNotification(i18n.t('reviewCreated'), 'success');
      
      setTimeout(() => {
        window.reviewEditor.isDirty = false;
        // 调用编辑器，传入新创建的复盘ID
        showReviewEditor(newReviewId);
        window.scrollTo(0, 0);
      }, 800);
    }
    
  } catch (error) {
    console.error('[ReviewEditor] 保存失败:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

/**
 * 收集表单数据
 */
function collectFormData() {
  const editor = window.reviewEditor;
  const isCreator = editor.isCreator;
  
  const data = {};
  
  // 只有创建者可以修改基本信息
  if (isCreator || !editor.reviewId) {
    data.title = document.getElementById('review-title')?.value || '';
    data.description = document.getElementById('review-description')?.value || null;
    data.time_type = document.getElementById('review-time-type')?.value || 'year';
    data.owner_type = document.getElementById('review-owner-type')?.value || 'personal';
    data.status = document.querySelector('input[name="status"]:checked')?.value || 'draft';
    
    // 团队ID
    if (data.owner_type === 'team') {
      data.team_id = document.getElementById('review-team')?.value || null;
    }
    
    // 模板ID（只在创建时）
    if (!editor.reviewId) {
      data.template_id = parseInt(document.getElementById('review-template')?.value || 1);
    }
    
    // 计划时间
    const scheduledAt = document.getElementById('review-scheduled-at')?.value;
    data.scheduled_at = scheduledAt || null;
    
    data.location = document.getElementById('review-location')?.value || null;
    data.reminder_minutes = parseInt(document.getElementById('review-reminder-minutes')?.value || 60);
  }
  
  // 收集选择题答案
  if (editor.reviewId && editor.template) {
    const answers = {};
    
    editor.template.questions.forEach(q => {
      if (q.question_type === 'single_choice') {
        const selected = document.querySelector(`input[name="question-${q.question_number}"]:checked`);
        if (selected) {
          answers[q.question_number] = selected.value;
        }
      } else if (q.question_type === 'multiple_choice') {
        const checked = document.querySelectorAll(`input[name="question-${q.question_number}"]:checked`);
        if (checked.length > 0) {
          answers[q.question_number] = Array.from(checked).map(cb => cb.value).join(',');
        }
      }
    });
    
    if (Object.keys(answers).length > 0) {
      data.answers = answers;
    }
  }
  
  return data;
}

/**
 * 验证复盘数据
 */
function validateReviewData(data) {
  // 标题必填
  if (!data.title || data.title.trim() === '') {
    showNotification(i18n.t('titleRequired'), 'error');
    document.getElementById('review-title')?.focus();
    return false;
  }
  
  // 如果是团队类型，team_id必填
  if (data.owner_type === 'team' && !data.team_id) {
    showNotification(i18n.t('pleaseSelectTeam'), 'error');
    document.getElementById('review-team')?.focus();
    return false;
  }
  
  return true;
}

/**
 * 创建新复盘
 */
async function createReview(data) {
  console.log('[ReviewEditor] 创建新复盘:', data);
  
  const response = await axios.post('/api/reviews', data);
  const newReviewId = response.data.id;
  
  console.log('[ReviewEditor] 复盘创建成功, ID:', newReviewId);
  
  return newReviewId;
}

/**
 * 更新复盘
 */
async function updateReview(reviewId, data) {
  console.log('[ReviewEditor] 更新复盘:', reviewId, data);
  
  // IMPORTANT: 确保不发送 template_id
  if (data.template_id) {
    delete data.template_id;
  }
  
  await axios.put(`/api/reviews/${reviewId}`, data);
  
  console.log('[ReviewEditor] 复盘更新成功');
  
  showNotification(i18n.t('updateSuccess'), 'success');
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * HTML转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// 导出（如果使用模块系统）
// ============================================================================

console.log('[ReviewEditor] Module v6.0.0 loaded');
