// ============ New Question Form Code with Choice Support ============

// Global variable to store current options being edited
let currentEditingOptions = [];

// Render questions list with question type badge
function renderQuestionsList() {
  if (!currentTemplateQuestions || currentTemplateQuestions.length === 0) {
    return `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-tasks text-4xl mb-4"></i>
        <p>${i18n.t('noQuestions')}</p>
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      ${currentTemplateQuestions.map((q, index) => {
        const typeLabel = q.question_type === 'single_choice' ? i18n.t('questionTypeSingleChoice') :
                         q.question_type === 'multiple_choice' ? i18n.t('questionTypeMultipleChoice') :
                         i18n.t('questionTypeText');
        const typeIcon = q.question_type === 'single_choice' ? 'fa-dot-circle' :
                        q.question_type === 'multiple_choice' ? 'fa-check-square' :
                        'fa-font';
        const typeColor = q.question_type === 'text' ? 'blue' : 'green';
        
        return `
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <span class="text-sm font-semibold text-indigo-600 mr-2">
                  Q${q.question_number}
                </span>
                <span class="px-2 py-1 text-xs rounded-full bg-${typeColor}-100 text-${typeColor}-700 mr-2">
                  <i class="fas ${typeIcon} mr-1"></i>${typeLabel}
                </span>
                <div class="flex space-x-2">
                  ${index > 0 ? `
                    <button onclick="moveQuestion(${q.id}, 'up')" 
                            class="text-gray-500 hover:text-gray-700" title="${i18n.t('moveUp')}">
                      <i class="fas fa-arrow-up"></i>
                    </button>
                  ` : ''}
                  ${index < currentTemplateQuestions.length - 1 ? `
                    <button onclick="moveQuestion(${q.id}, 'down')" 
                            class="text-gray-500 hover:text-gray-700" title="${i18n.t('moveDown')}">
                      <i class="fas fa-arrow-down"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="text-sm text-gray-900 mb-1">${escapeHtml(q.question_text)}</div>
              ${q.question_text_en ? `
                <div class="text-xs text-gray-500">${escapeHtml(q.question_text_en)}</div>
              ` : ''}
              ${(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && q.options ? `
                <div class="mt-2 text-xs">
                  <span class="text-gray-600">${i18n.t('choiceOptions')}:</span>
                  <div class="mt-1 space-y-1">
                    ${JSON.parse(q.options).map(opt => `
                      <div class="text-gray-700 flex items-center">
                        ${q.correct_answer && q.correct_answer.includes(opt.charAt(0)) ? 
                          '<i class="fas fa-star text-yellow-500 mr-1"></i>' : ''
                        }
                        ${escapeHtml(opt)}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${q.question_type === 'text' ? `
                <div class="text-xs text-indigo-600 mt-1">
                  <i class="fas fa-text-width mr-1"></i>${i18n.t('answerLength')}: ${q.answer_length || 50} ${i18n.t('charactersHint')}
                </div>
              ` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
              <button onclick="showEditQuestionForm(${q.id})" 
                      class="text-blue-600 hover:text-blue-900" title="${i18n.t('edit')}">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteQuestion(${q.id})" 
                      class="text-red-600 hover:text-red-900" title="${i18n.t('delete')}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
}

// Show add question form with question type selector
function showAddQuestionForm() {
  currentEditingOptions = ['A. ', 'B. ', 'C. ', 'D. ']; // Default options
  
  const form = document.createElement('div');
  form.id = 'question-form-container';
  form.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60] p-4';
  form.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h4 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-plus mr-2"></i>${i18n.t('addQuestion')}
        </h4>
        <form id="question-form" onsubmit="handleAddQuestion(event)">
          <div class="space-y-4">
            <!-- Question Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionType')} *
              </label>
              <select id="question-type" onchange="handleQuestionTypeChange()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="text">${i18n.t('questionTypeText')}</option>
                <option value="single_choice">${i18n.t('questionTypeSingleChoice')}</option>
                <option value="multiple_choice">${i18n.t('questionTypeMultipleChoice')}</option>
              </select>
            </div>
            
            <!-- Question Text -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextCn')} *
              </label>
              <textarea id="question-text" required rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextEn')}
              </label>
              <textarea id="question-text-en" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            
            <!-- Answer Length (for text type only) -->
            <div id="answer-length-container">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerLength')} *
              </label>
              <input type="number" id="question-answer-length" min="10" max="1000" value="50"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <p class="text-xs text-gray-500 mt-1">${i18n.t('maxCharacters')}: 10-1000 (${i18n.t('defaultValue')}: 50)</p>
            </div>
            
            <!-- Choice Options (for choice types only) -->
            <div id="options-container" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('choiceOptions')} *
              </label>
              <div id="options-list" class="space-y-2 mb-2">
                <!-- Options will be added here -->
              </div>
              <button type="button" onclick="addOption()" 
                      class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-plus mr-1"></i>${i18n.t('addOption')}
              </button>
            </div>
            
            <!-- Correct Answer (for choice types only) -->
            <div id="correct-answer-container" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('correctAnswer')} *
                <span class="text-xs text-gray-500">(${i18n.t('correctAnswerHint')})</span>
              </label>
              <div id="single-choice-answer" class="hidden space-y-2">
                <p class="text-xs text-gray-600 mb-2">${i18n.t('singleChoiceHint')}</p>
                <!-- Radio buttons will be added here -->
              </div>
              <div id="multiple-choice-answer" class="hidden space-y-2">
                <p class="text-xs text-gray-600 mb-2">${i18n.t('multipleChoiceHint')}</p>
                <!-- Checkboxes will be added here -->
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="closeQuestionForm()"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ${i18n.t('cancel')}
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              ${i18n.t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(form);
  
  // Initialize options display
  renderOptionsInputs();
}

// Show edit question form
function showEditQuestionForm(questionId) {
  const question = currentTemplateQuestions.find(q => q.id === questionId);
  if (!question) return;
  
  // Load existing options or create defaults
  if (question.options) {
    try {
      currentEditingOptions = JSON.parse(question.options);
    } catch (e) {
      currentEditingOptions = ['A. ', 'B. ', 'C. ', 'D. '];
    }
  } else {
    currentEditingOptions = ['A. ', 'B. ', 'C. ', 'D. '];
  }
  
  const form = document.createElement('div');
  form.id = 'question-form-container';
  form.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60] p-4';
  form.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h4 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-edit mr-2"></i>${i18n.t('editQuestion')}
        </h4>
        <form id="question-form" onsubmit="handleUpdateQuestion(event, ${questionId})">
          <div class="space-y-4">
            <!-- Question Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionType')} *
              </label>
              <select id="question-type" onchange="handleQuestionTypeChange()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="text" ${question.question_type === 'text' ? 'selected' : ''}>${i18n.t('questionTypeText')}</option>
                <option value="single_choice" ${question.question_type === 'single_choice' ? 'selected' : ''}>${i18n.t('questionTypeSingleChoice')}</option>
                <option value="multiple_choice" ${question.question_type === 'multiple_choice' ? 'selected' : ''}>${i18n.t('questionTypeMultipleChoice')}</option>
              </select>
            </div>
            
            <!-- Question Text -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextCn')} *
              </label>
              <textarea id="question-text" required rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(question.question_text)}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextEn')}
              </label>
              <textarea id="question-text-en" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(question.question_text_en || '')}</textarea>
            </div>
            
            <!-- Answer Length (for text type only) -->
            <div id="answer-length-container" class="${question.question_type === 'text' ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerLength')} *
              </label>
              <input type="number" id="question-answer-length" min="10" max="1000" value="${question.answer_length || 50}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <p class="text-xs text-gray-500 mt-1">${i18n.t('maxCharacters')}: 10-1000 (${i18n.t('defaultValue')}: 50)</p>
            </div>
            
            <!-- Choice Options (for choice types only) -->
            <div id="options-container" class="${question.question_type === 'text' ? 'hidden' : ''}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('choiceOptions')} *
              </label>
              <div id="options-list" class="space-y-2 mb-2">
                <!-- Options will be added here -->
              </div>
              <button type="button" onclick="addOption()" 
                      class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-plus mr-1"></i>${i18n.t('addOption')}
              </button>
            </div>
            
            <!-- Correct Answer (for choice types only) -->
            <div id="correct-answer-container" class="${question.question_type === 'text' ? 'hidden' : ''}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('correctAnswer')} *
                <span class="text-xs text-gray-500">(${i18n.t('correctAnswerHint')})</span>
              </label>
              <div id="single-choice-answer" class="${question.question_type === 'single_choice' ? '' : 'hidden'} space-y-2">
                <p class="text-xs text-gray-600 mb-2">${i18n.t('singleChoiceHint')}</p>
                <!-- Radio buttons will be added here -->
              </div>
              <div id="multiple-choice-answer" class="${question.question_type === 'multiple_choice' ? '' : 'hidden'} space-y-2">
                <p class="text-xs text-gray-600 mb-2">${i18n.t('multipleChoiceHint')}</p>
                <!-- Checkboxes will be added here -->
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="closeQuestionForm()"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ${i18n.t('cancel')}
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              ${i18n.t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(form);
  
  // Initialize options display
  renderOptionsInputs();
  
  // Set correct answer
  if (question.correct_answer) {
    setTimeout(() => {
      if (question.question_type === 'single_choice') {
        const radio = document.querySelector(`input[name="correct-answer-radio"][value="${question.correct_answer}"]`);
        if (radio) radio.checked = true;
      } else if (question.question_type === 'multiple_choice') {
        const answers = question.correct_answer.split(',');
        answers.forEach(ans => {
          const checkbox = document.querySelector(`.correct-answer-checkbox[value="${ans.trim()}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
    }, 100);
  }
}

// Handle question type change
function handleQuestionTypeChange() {
  const type = document.getElementById('question-type').value;
  const answerLengthContainer = document.getElementById('answer-length-container');
  const optionsContainer = document.getElementById('options-container');
  const correctAnswerContainer = document.getElementById('correct-answer-container');
  const singleChoiceAnswer = document.getElementById('single-choice-answer');
  const multipleChoiceAnswer = document.getElementById('multiple-choice-answer');
  
  if (type === 'text') {
    answerLengthContainer.classList.remove('hidden');
    optionsContainer.classList.add('hidden');
    correctAnswerContainer.classList.add('hidden');
  } else {
    answerLengthContainer.classList.add('hidden');
    optionsContainer.classList.remove('hidden');
    correctAnswerContainer.classList.remove('hidden');
    
    if (type === 'single_choice') {
      singleChoiceAnswer.classList.remove('hidden');
      multipleChoiceAnswer.classList.add('hidden');
    } else {
      singleChoiceAnswer.classList.add('hidden');
      multipleChoiceAnswer.classList.remove('hidden');
    }
    
    renderCorrectAnswerOptions();
  }
}

// Add new option
function addOption() {
  const letter = String.fromCharCode(65 + currentEditingOptions.length); // A, B, C, D...
  currentEditingOptions.push(`${letter}. `);
  renderOptionsInputs();
  renderCorrectAnswerOptions();
}

// Remove option
function removeOption(index) {
  currentEditingOptions.splice(index, 1);
  // Re-letter the options
  currentEditingOptions = currentEditingOptions.map((opt, i) => {
    const letter = String.fromCharCode(65 + i);
    const text = opt.substring(opt.indexOf('.') + 1).trim();
    return `${letter}. ${text}`;
  });
  renderOptionsInputs();
  renderCorrectAnswerOptions();
}

// Update option text
function updateOption(index, value) {
  const letter = String.fromCharCode(65 + index);
  currentEditingOptions[index] = `${letter}. ${value}`;
  renderCorrectAnswerOptions();
}

// Render option inputs
function renderOptionsInputs() {
  const optionsList = document.getElementById('options-list');
  if (!optionsList) return;
  
  optionsList.innerHTML = currentEditingOptions.map((opt, index) => {
    const letter = String.fromCharCode(65 + index);
    const text = opt.substring(opt.indexOf('.') + 1).trim();
    return `
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-700 w-6">${letter}.</span>
        <input type="text" 
               value="${escapeHtml(text)}"
               oninput="updateOption(${index}, this.value)"
               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
               placeholder="${i18n.t('optionPlaceholder')}">
        ${currentEditingOptions.length > 2 ? `
          <button type="button" onclick="removeOption(${index})" 
                  class="text-red-600 hover:text-red-800 px-2">
            <i class="fas fa-trash"></i>
          </button>
        ` : '<div class="w-8"></div>'}
      </div>
    `;
  }).join('');
}

// Render correct answer options
function renderCorrectAnswerOptions() {
  const type = document.getElementById('question-type')?.value;
  if (!type || type === 'text') return;
  
  const singleChoiceContainer = document.getElementById('single-choice-answer');
  const multipleChoiceContainer = document.getElementById('multiple-choice-answer');
  
  if (type === 'single_choice' && singleChoiceContainer) {
    singleChoiceContainer.innerHTML = `
      <p class="text-xs text-gray-600 mb-2">${i18n.t('singleChoiceHint')}</p>
      ${currentEditingOptions.map((opt, index) => {
        const letter = String.fromCharCode(65 + index);
        return `
          <label class="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="correct-answer-radio" value="${letter}" class="mr-2">
            <span class="text-sm">${escapeHtml(opt)}</span>
          </label>
        `;
      }).join('')}
    `;
  } else if (type === 'multiple_choice' && multipleChoiceContainer) {
    multipleChoiceContainer.innerHTML = `
      <p class="text-xs text-gray-600 mb-2">${i18n.t('multipleChoiceHint')}</p>
      ${currentEditingOptions.map((opt, index) => {
        const letter = String.fromCharCode(65 + index);
        return `
          <label class="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" class="correct-answer-checkbox" value="${letter}" class="mr-2">
            <span class="text-sm">${escapeHtml(opt)}</span>
          </label>
        `;
      }).join('')}
    `;
  }
}

// Collect form data
function collectQuestionFormData() {
  const type = document.getElementById('question-type').value;
  const data = {
    question_text: document.getElementById('question-text').value,
    question_text_en: document.getElementById('question-text-en').value || null,
    question_type: type
  };
  
  if (type === 'text') {
    data.answer_length = parseInt(document.getElementById('question-answer-length').value) || 50;
  } else {
    // Collect options
    const options = currentEditingOptions.filter(opt => {
      const text = opt.substring(opt.indexOf('.') + 1).trim();
      return text.length > 0;
    });
    
    if (options.length === 0) {
      throw new Error(i18n.t('choiceOptions') + ' is required');
    }
    
    data.options = JSON.stringify(options);
    
    // Collect correct answer
    if (type === 'single_choice') {
      const selected = document.querySelector('input[name="correct-answer-radio"]:checked');
      if (!selected) {
        throw new Error(i18n.t('correctAnswer') + ' is required');
      }
      data.correct_answer = selected.value;
    } else if (type === 'multiple_choice') {
      const checked = document.querySelectorAll('.correct-answer-checkbox:checked');
      if (checked.length === 0) {
        throw new Error(i18n.t('correctAnswer') + ' is required');
      }
      const answers = Array.from(checked).map(cb => cb.value);
      data.correct_answer = answers.join(',');
    }
  }
  
  return data;
}

// Handle add question with new fields
async function handleAddQuestion(e) {
  e.preventDefault();
  
  try {
    const data = collectQuestionFormData();
    await axios.post(`/api/templates/${currentEditingTemplate.id}/questions`, data);
    showNotification(i18n.t('questionAdded'), 'success');
    closeQuestionForm();
    await refreshQuestionsList();
  } catch (error) {
    const message = error.message || (error.response?.data?.error || error.message);
    showNotification(i18n.t('operationFailed') + ': ' + message, 'error');
  }
}

// Handle update question with new fields
async function handleUpdateQuestion(e, questionId) {
  e.preventDefault();
  
  try {
    const question = currentTemplateQuestions.find(q => q.id === questionId);
    const data = collectQuestionFormData();
    data.question_number = question.question_number;
    
    await axios.put(`/api/templates/${currentEditingTemplate.id}/questions/${questionId}`, data);
    showNotification(i18n.t('questionUpdated'), 'success');
    closeQuestionForm();
    await refreshQuestionsList();
  } catch (error) {
    const message = error.message || (error.response?.data?.error || error.message);
    showNotification(i18n.t('operationFailed') + ': ' + message, 'error');
  }
}
