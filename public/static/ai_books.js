// ============================================================
// AI Writing System - Frontend
// Manhattan Project Phase 1
// ============================================================

const AIBooksManager = {
  currentBook: null,
  currentChapter: null,
  currentSection: null,
  
  // ============================================================
  // Initialize AI Books Manager
  // ============================================================
  init() {
    console.log('AI Books Manager initialized');
  },
  
  // ============================================================
  // Render AI Books Management Page
  // ============================================================
  renderBooksPage() {
    const content = `
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="mb-4">
            <button onclick="showHomePage()" class="text-gray-600 hover:text-gray-800 transition">
              <i class="fas fa-arrow-left mr-2"></i>返回首页
            </button>
          </div>
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-book-open mr-2 text-blue-600"></i>
                AI智能写作助手
              </h1>
              <p class="text-gray-600">创建、编辑和管理您的AI辅助书籍项目</p>
            </div>
            <button onclick="AIBooksManager.showCreateBookModal()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-plus mr-2"></i>创建新书
            </button>
          </div>
        </div>
        
        <!-- Books List -->
        <div id="books-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="flex items-center justify-center h-64">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
          </div>
        </div>
        
        <!-- Create Book Modal -->
        <div id="create-book-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                  <i class="fas fa-magic mr-2 text-blue-600"></i>创建新书
                </h2>
                <button onclick="AIBooksManager.hideCreateBookModal()" class="text-gray-500 hover:text-gray-700">
                  <i class="fas fa-times text-2xl"></i>
                </button>
              </div>
              
              <form id="create-book-form" onsubmit="AIBooksManager.createBook(event)" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    书名 <span class="text-red-500">*</span>
                    <span class="text-gray-500 text-xs ml-2">(最多50字)</span>
                  </label>
                  <input type="text" id="book-title" maxlength="50" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：人工智能实战指南">
                  <div class="text-xs text-gray-500 mt-1">
                    已输入 <span id="title-count">0</span>/50 字
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    主题描述 <span class="text-red-500">*</span>
                    <span class="text-gray-500 text-xs ml-2">(最多500字)</span>
                  </label>
                  <textarea id="book-description" maxlength="500" rows="4" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="详细描述您想创作的书籍主题、目标读者、核心内容等..."></textarea>
                  <div class="text-xs text-gray-500 mt-1">
                    已输入 <span id="description-count">0</span>/500 字
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">作者名称</label>
                  <input type="text" id="book-author"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="您的名字或笔名">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">目标字数</label>
                    <input type="number" id="book-word-count" value="50000" min="1000" max="500000"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">写作语言</label>
                    <select id="book-language"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">写作风格</label>
                    <select id="book-tone"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="professional">专业严谨</option>
                      <option value="casual">轻松随意</option>
                      <option value="academic">学术性</option>
                      <option value="storytelling">故事化</option>
                      <option value="inspirational">励志激励</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">目标读者</label>
                    <select id="book-audience"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="general">普通读者</option>
                      <option value="professionals">专业人士</option>
                      <option value="students">学生</option>
                      <option value="beginners">初学者</option>
                      <option value="advanced">高级用户</option>
                    </select>
                  </div>
                </div>

                <!-- Writing Template Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    写作模板
                    <span class="text-gray-500 text-xs ml-2">(可选，选择模板可提供更好的AI生成效果)</span>
                  </label>
                  <select id="book-template"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onchange="AIBooksManager.onTemplateChange()">
                    <option value="">不使用模板</option>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    <i class="fas fa-info-circle mr-1"></i>
                    选择模板后，将根据模板预设参数优化AI生成内容
                  </p>
                </div>

                <!-- Template Fields Container (will be populated when template is selected) -->
                <div id="template-fields-container" class="hidden">
                  <div class="border-t border-gray-200 pt-4 mt-2">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">
                      <i class="fas fa-clipboard-list mr-2"></i>模板字段
                    </h4>
                    <div id="template-fields" class="space-y-3">
                      <!-- Template fields will be dynamically inserted here -->
                    </div>
                  </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                  <button type="button" onclick="AIBooksManager.hideCreateBookModal()"
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    取消
                  </button>
                  <button type="submit"
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-check mr-2"></i>创建
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('app').innerHTML = content;
    
    // Add character counters
    document.getElementById('book-title').addEventListener('input', (e) => {
      document.getElementById('title-count').textContent = e.target.value.length;
    });
    
    document.getElementById('book-description').addEventListener('input', (e) => {
      document.getElementById('description-count').textContent = e.target.value.length;
    });
    
    // Load books
    this.loadBooks();
  },
  
  // ============================================================
  // Load user's books
  // ============================================================
  async loadBooks() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        document.getElementById('books-list').innerHTML = `
          <div class="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <i class="fas fa-exclamation-circle text-yellow-500 text-3xl mb-2"></i>
            <p class="text-yellow-700 mb-4">请先登录以使用 AI 写作功能</p>
            <button onclick="showLogin()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              前往登录
            </button>
          </div>
        `;
        return;
      }
      const response = await axios.get('/api/ai-books', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        this.renderBooksList(response.data.books);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      document.getElementById('books-list').innerHTML = `
        <div class="col-span-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
          <p class="text-red-700">加载书籍失败: ${error.response?.data?.message || error.message}</p>
        </div>
      `;
    }
  },
  
  // ============================================================
  // Render books list
  // ============================================================
  renderBooksList(books) {
    const container = document.getElementById('books-list');
    
    if (books.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <i class="fas fa-book text-gray-400 text-5xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">还没有任何书籍</h3>
          <p class="text-gray-600 mb-4">点击"创建新书"开始您的AI写作之旅</p>
          <button onclick="AIBooksManager.showCreateBookModal()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>创建第一本书
          </button>
        </div>
      `;
      return;
    }
    
    const statusColors = {
      'draft': 'bg-gray-100 text-gray-700',
      'generating': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'published': 'bg-purple-100 text-purple-700'
    };
    
    const statusLabels = {
      'draft': '草稿',
      'generating': '生成中',
      'completed': '已完成',
      'published': '已发布'
    };
    
    container.innerHTML = books.map(book => `
      <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-gray-800 flex-1">${book.title}</h3>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColors[book.status]}">
              ${statusLabels[book.status]}
            </span>
          </div>
          
          <p class="text-gray-600 text-sm mb-4 line-clamp-3">${book.description || '暂无描述'}</p>
          
          <div class="space-y-2 text-sm text-gray-600 mb-4">
            <div class="flex items-center">
              <i class="fas fa-file-word w-5 text-gray-400"></i>
              <span>字数: ${book.current_word_count?.toLocaleString() || 0}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-calendar w-5 text-gray-400"></i>
              <span>创建: ${new Date(book.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button onclick="AIBooksManager.openBook(${book.id})" 
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
              <i class="fas fa-edit mr-2"></i>编辑
            </button>
            <button onclick="AIBooksManager.deleteBook(${book.id})" 
              class="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  // ============================================================
  // Modal controls
  // ============================================================
  async showCreateBookModal() {
    document.getElementById('create-book-modal').classList.remove('hidden');
    // Load available writing templates
    await this.loadTemplatesForSelection();
  },

  async loadTemplatesForSelection() {
    try {
      const response = await axios.get('/api/writing-templates');
      const templates = response.data.templates || [];
      
      const templateSelect = document.getElementById('book-template');
      templateSelect.innerHTML = '<option value="">不使用模板</option>';
      
      templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = `${template.name} - ${template.description || ''}`;
        option.dataset.template = JSON.stringify(template);
        templateSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  },

  onTemplateChange() {
    const templateSelect = document.getElementById('book-template');
    const templateId = templateSelect.value;
    
    if (!templateId) {
      // Hide template fields if no template selected
      document.getElementById('template-fields-container').classList.add('hidden');
      return;
    }
    
    // Get selected template data
    const selectedOption = templateSelect.options[templateSelect.selectedIndex];
    const templateData = JSON.parse(selectedOption.dataset.template || '{}');
    
    // Apply template default settings
    if (templateData.default_tone) {
      document.getElementById('book-tone').value = templateData.default_tone;
    }
    if (templateData.default_audience) {
      document.getElementById('book-audience').value = templateData.default_audience;
    }
    if (templateData.default_language) {
      document.getElementById('book-language').value = templateData.default_language;
    }
    if (templateData.default_target_words) {
      document.getElementById('book-word-count').value = templateData.default_target_words;
    }
    
    // Load template fields
    this.loadTemplateFields(templateId);
  },

  async loadTemplateFields(templateId) {
    try {
      const response = await axios.get(`/api/writing-templates/${templateId}`);
      const template = response.data.template;
      const fields = template.fields || [];
      
      const fieldsContainer = document.getElementById('template-fields');
      const containerDiv = document.getElementById('template-fields-container');
      
      if (fields.length === 0) {
        containerDiv.classList.add('hidden');
        return;
      }
      
      containerDiv.classList.remove('hidden');
      fieldsContainer.innerHTML = '';
      
      fields.forEach(field => {
        const fieldHtml = this.renderTemplateField(field);
        fieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
      });
    } catch (error) {
      console.error('Error loading template fields:', error);
    }
  },

  renderTemplateField(field) {
    let inputHtml = '';
    
    switch (field.field_type) {
      case 'text':
        inputHtml = `
          <input type="text" 
                 id="template-field-${field.id}" 
                 ${field.is_required ? 'required' : ''}
                 placeholder="${field.placeholder || ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        `;
        break;
      case 'textarea':
        inputHtml = `
          <textarea id="template-field-${field.id}" 
                    rows="3"
                    ${field.is_required ? 'required' : ''}
                    placeholder="${field.placeholder || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
        `;
        break;
      case 'number':
        inputHtml = `
          <input type="number" 
                 id="template-field-${field.id}" 
                 ${field.is_required ? 'required' : ''}
                 ${field.min_length ? `min="${field.min_length}"` : ''}
                 ${field.max_length ? `max="${field.max_length}"` : ''}
                 placeholder="${field.placeholder || ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        `;
        break;
      case 'select':
        const options = field.options_json ? JSON.parse(field.options_json) : [];
        inputHtml = `
          <select id="template-field-${field.id}" 
                  ${field.is_required ? 'required' : ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">请选择...</option>
            ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
        break;
      default:
        inputHtml = `
          <input type="text" 
                 id="template-field-${field.id}" 
                 ${field.is_required ? 'required' : ''}
                 placeholder="${field.placeholder || ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        `;
    }
    
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          ${field.label}
          ${field.is_required ? '<span class="text-red-500">*</span>' : ''}
        </label>
        ${inputHtml}
        ${field.help_text ? `<p class="text-xs text-gray-500 mt-1">${field.help_text}</p>` : ''}
      </div>
    `;
  },
  
  hideCreateBookModal() {
    document.getElementById('create-book-modal').classList.add('hidden');
    document.getElementById('create-book-form').reset();
    document.getElementById('title-count').textContent = '0';
    document.getElementById('description-count').textContent = '0';
    document.getElementById('template-fields-container').classList.add('hidden');
  },
  
  // ============================================================
  // Create new book
  // ============================================================
  async createBook(event) {
    event.preventDefault();
    
    const title = document.getElementById('book-title').value.trim();
    const description = document.getElementById('book-description').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const wordCount = parseInt(document.getElementById('book-word-count').value);
    const language = document.getElementById('book-language').value;
    const tone = document.getElementById('book-tone').value;
    const audience = document.getElementById('book-audience').value;
    const templateId = document.getElementById('book-template').value || null;
    
    if (title.length > 50) {
      alert('书名不能超过50字');
      return;
    }
    
    if (description.length > 500) {
      alert('主题描述不能超过500字');
      return;
    }
    
    // Collect template field values if template is selected
    let templateMetadata = null;
    if (templateId) {
      templateMetadata = {};
      const templateFieldsContainer = document.getElementById('template-fields');
      if (templateFieldsContainer) {
        const fieldInputs = templateFieldsContainer.querySelectorAll('[id^="template-field-"]');
        fieldInputs.forEach(input => {
          const fieldId = input.id.replace('template-field-', '');
          templateMetadata[fieldId] = input.value;
        });
      }
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('请先登录以使用 AI 写作功能');
        window.location.href = '/';
        return;
      }
      const response = await axios.post('/api/ai-books', {
        title,
        description,
        author_name: author,
        target_word_count: wordCount,
        language,
        tone,
        audience,
        template_id: templateId,
        template_metadata: templateMetadata ? JSON.stringify(templateMetadata) : null
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        this.hideCreateBookModal();
        showNotification('书籍创建成功！', 'success');
        this.loadBooks();
      }
    } catch (error) {
      console.error('Error creating book:', error);
      alert('创建失败: ' + (error.response?.data?.message || error.message));
    }
  },
  
  // ============================================================
  // Open book editor
  // ============================================================
  async openBook(bookId) {
    try {
      console.log(`[openBook] Loading book ${bookId}...`);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/ai-books/${bookId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log(`[openBook] Book data received:`, response.data);
        // Merge book data with chapters and sections
        const chapters = response.data.chapters || [];
        const sections = response.data.sections || [];
        
        console.log(`[openBook] Found ${chapters.length} chapters and ${sections.length} sections`);
        
        // Assign sections to their respective chapters
        chapters.forEach(chapter => {
          chapter.sections = sections.filter(s => s.chapter_id === chapter.id);
        });
        
        this.currentBook = {
          ...response.data.book,
          chapters: chapters,
          sections: sections  // Keep global sections array for reference
        };
        
        console.log('[openBook] Calling renderBookEditor...');
        this.renderBookEditor();
        console.log('[openBook] renderBookEditor completed');
      }
    } catch (error) {
      console.error('[openBook] Error loading book:', error);
      alert('加载书籍失败: ' + (error.response?.data?.message || error.message));
    }
  },
  
  // ============================================================
  // Render book editor
  // ============================================================
  renderBookEditor() {
    const book = this.currentBook;
    console.log('[renderBookEditor] Rendering book editor for:', book.title);
    console.log('[renderBookEditor] Book has', book.chapters?.length || 0, 'chapters');
    
    const content = `
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <button onclick="AIBooksManager.renderBooksPage()" class="text-gray-600 hover:text-gray-800">
              <i class="fas fa-arrow-left mr-2"></i>返回书籍列表
            </button>
            <div class="flex space-x-2">
              <button onclick="AIBooksManager.showRegenerateModal()" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                <i class="fas fa-sync-alt mr-2"></i>重新生成
              </button>
              <button onclick="AIBooksManager.exportBook()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                <i class="fas fa-download mr-2"></i>导出HTML
              </button>
            </div>
          </div>
          
          <h1 class="text-3xl font-bold text-gray-800 mb-2">${book.title}</h1>
          <p class="text-gray-600">${book.description}</p>
          
          <div class="grid grid-cols-4 gap-4 mt-4">
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="text-xs text-blue-600 mb-1">总字数</div>
              <div class="text-2xl font-bold text-blue-700">${book.current_word_count?.toLocaleString() || 0}</div>
            </div>
            <div class="bg-green-50 rounded-lg p-3">
              <div class="text-xs text-green-600 mb-1">章节数</div>
              <div class="text-2xl font-bold text-green-700">${book.chapters?.length || 0}</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-3">
              <div class="text-xs text-purple-600 mb-1">目标字数</div>
              <div class="text-2xl font-bold text-purple-700">${book.target_word_count?.toLocaleString() || 0}</div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-3">
              <div class="text-xs text-yellow-600 mb-1">进度</div>
              <div class="text-2xl font-bold text-yellow-700">
                ${Math.round((book.current_word_count / book.target_word_count) * 100)}%
              </div>
            </div>
          </div>
        </div>
        
        <!-- Generate Chapters -->
        ${!book.chapters || book.chapters.length === 0 ? `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas fa-magic mr-2 text-blue-600"></i>生成章节大纲
          </h2>
          <p class="text-gray-600 mb-4">AI将根据您的书籍主题自动生成章节大纲</p>
          
          <div class="flex items-center space-x-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">章节数量</label>
              <input type="number" id="num-chapters" value="10" min="1" max="50"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex-1"></div>
            <button onclick="AIBooksManager.generateChapters()" 
              class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-wand-magic mr-2"></i>AI生成章节
            </button>
          </div>
        </div>
        ` : ''}
        
        <!-- Chapters List -->
        <div id="chapters-container">
          ${this.renderChaptersList()}
        </div>
      </div>
    `;
    
    console.log('[renderBookEditor] Updating DOM with new content...');
    document.getElementById('app').innerHTML = content;
    console.log('[renderBookEditor] DOM updated successfully');
  },
  
  // ============================================================
  // Render chapters list
  // ============================================================
  renderChaptersList() {
    const chapters = this.currentBook.chapters || [];
    
    if (chapters.length === 0) {
      return '';
    }
    
    return `
      <div class="space-y-4">
        ${chapters.map((chapter, index) => `
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold">
                  第${chapter.chapter_number}章: 
                  <span id="chapter-title-${chapter.id}">${chapter.title}</span>
                  <button onclick="AIBooksManager.editChapterTitle(${chapter.id})" 
                    class="ml-2 text-sm text-blue-200 hover:text-white">
                    <i class="fas fa-edit"></i>
                  </button>
                </h3>
                <div class="flex items-center space-x-2">
                  ${chapter.sections && chapter.sections.length > 0 ? `
                  <button onclick="AIBooksManager.regenerateSingleChapter(${chapter.id})" 
                    class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition text-sm"
                    title="重新生成此章节的小节">
                    <i class="fas fa-sync-alt mr-1"></i>重新生成
                  </button>
                  ` : ''}
                  <button onclick="AIBooksManager.toggleChapter(${chapter.id})" 
                    class="text-white hover:text-blue-100">
                    <i id="chapter-icon-${chapter.id}" class="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>
              <div class="mt-2">
                <div class="text-xs text-blue-200 mb-1">章节描述（写作关键点）：</div>
                <p id="chapter-description-${chapter.id}" class="text-blue-100 text-sm ${!chapter.description ? 'italic' : ''}">
                  ${chapter.description || '暂无描述 - 点击编辑添加写作关键点'}
                </p>
                <button onclick="AIBooksManager.editChapterDescription(${chapter.id})" 
                  class="mt-1 text-xs text-blue-200 hover:text-white">
                  <i class="fas fa-edit mr-1"></i>编辑描述
                </button>
              </div>
            </div>
            
            <div id="chapter-content-${chapter.id}" class="hidden p-6">
              <!-- Generate Sections -->
              ${!chapter.sections || chapter.sections.length === 0 ? `
              <div class="mb-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-3">生成小节</h4>
                <div class="flex items-center space-x-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">小节数量</label>
                    <input type="number" id="num-sections-${chapter.id}" value="5" min="1" max="20"
                      class="w-32 px-4 py-2 border border-gray-300 rounded-lg">
                  </div>
                  <div class="flex-1"></div>
                  <button onclick="AIBooksManager.generateSections(${chapter.id})" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    <i class="fas fa-wand-magic mr-2"></i>AI生成小节
                  </button>
                </div>
              </div>
              ` : `
              <!-- Sections List -->
              <div class="space-y-3">
                ${chapter.sections.map(section => `
                  <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <h5 class="font-semibold text-gray-800">
                          ${chapter.chapter_number}.${section.section_number} 
                          <span id="section-title-${section.id}">${section.title}</span>
                          <button onclick="AIBooksManager.editSectionTitle(${section.id})" 
                            class="ml-2 text-blue-600 hover:text-blue-800 transition text-sm" title="编辑标题">
                            <i class="fas fa-edit"></i>
                          </button>
                        </h5>
                        <div class="mt-2">
                          <div class="text-xs text-gray-500 mb-1">节描述（写作关键点）：</div>
                          <p class="text-sm text-gray-600" id="section-description-${section.id}">${section.description || '暂无描述 - 点击编辑添加写作关键点'}</p>
                          <button onclick="AIBooksManager.editSectionDescription(${section.id})" 
                            class="mt-1 text-blue-600 hover:text-blue-800 transition text-sm">
                            <i class="fas fa-edit mr-1"></i>编辑描述
                          </button>
                        </div>
                        <div class="text-xs text-gray-500 mt-2">
                          字数: ${section.current_word_count || 0} / ${section.target_word_count || 1000}
                        </div>
                      </div>
                      <div class="flex space-x-2">
                        ${section.content ? `
                        <button onclick="AIBooksManager.editSection(${section.id})" 
                          class="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
                          title="编辑内容">
                          <i class="fas fa-edit mr-1"></i>编辑
                        </button>
                        <button onclick="AIBooksManager.regenerateSectionContent(${section.id})" 
                          class="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition text-sm"
                          title="AI重新生成内容">
                          <i class="fas fa-sync-alt mr-1"></i>重新生成
                        </button>
                        ` : `
                        <button onclick="AIBooksManager.generateSectionContent(${section.id})" 
                          class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm">
                          <i class="fas fa-wand-magic mr-1"></i>生成
                        </button>
                        `}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  // ============================================================
  // Toggle chapter expansion
  // ============================================================
  toggleChapter(chapterId) {
    const content = document.getElementById(`chapter-content-${chapterId}`);
    const icon = document.getElementById(`chapter-icon-${chapterId}`);
    
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    } else {
      content.classList.add('hidden');
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  },
  
  // ============================================================
  // Edit chapter title
  // ============================================================
  async editChapterTitle(chapterId) {
    const chapter = (this.currentBook.chapters || []).find(c => c.id === chapterId);
    if (!chapter) return;
    
    const newTitle = prompt('请输入新的章节标题：', chapter.title);
    if (!newTitle || newTitle === chapter.title) return;
    
    try {
      const response = await axios.put(`/api/ai-books/${this.currentBook.id}/chapters/${chapterId}`, {
        title: newTitle
      });
      
      if (response.data.success) {
        chapter.title = newTitle;
        document.getElementById(`chapter-title-${chapterId}`).textContent = newTitle;
        showNotification('章节标题已更新', 'success');
      }
    } catch (error) {
      console.error('Error updating chapter title:', error);
      showNotification('更新失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  },
  
  // ============================================================
  // Edit chapter description
  // ============================================================
  async editChapterDescription(chapterId) {
    const chapter = (this.currentBook.chapters || []).find(c => c.id === chapterId);
    if (!chapter) return;
    
    const newDescription = prompt(
      '请输入章节描述（写作关键点）：\n这将帮助AI更好地生成小节内容。', 
      chapter.description || ''
    );
    
    if (newDescription === null) return;
    
    try {
      const response = await axios.put(`/api/ai-books/${this.currentBook.id}/chapters/${chapterId}`, {
        description: newDescription
      });
      
      if (response.data.success) {
        chapter.description = newDescription;
        const descElem = document.getElementById(`chapter-description-${chapterId}`);
        descElem.textContent = newDescription || '暂无描述 - 点击编辑添加写作关键点';
        descElem.className = `text-blue-100 text-sm ${!newDescription ? 'italic' : ''}`;
        showNotification('章节描述已更新', 'success');
      }
    } catch (error) {
      console.error('Error updating chapter description:', error);
      showNotification('更新失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  },
  
  // ============================================================
  // Regenerate single chapter
  // ============================================================
  async regenerateSingleChapter(chapterId) {
    const chapter = (this.currentBook.chapters || []).find(c => c.id === chapterId);
    if (!chapter) {
      showNotification('未找到章节', 'error');
      return;
    }
    
    // CRITICAL: Check if there are existing sections with generated content
    const hasGeneratedContent = chapter.sections && chapter.sections.some(s => s.content && s.content.trim().length > 0);
    
    if (hasGeneratedContent) {
      const confirmRegenerate = confirm(
        `⚠️ 警告：重新生成小节将会覆盖已有内容！\n\n` +
        `第${chapter.chapter_number}章当前有 ${chapter.sections.length} 个小节，其中部分小节已经生成了内容。\n\n` +
        `重新生成将：\n` +
        `1. 删除所有现有小节\n` +
        `2. 重新生成新的小节大纲\n` +
        `3. 已生成的内容将永久丢失\n\n` +
        `确定要继续吗？`
      );
      
      if (!confirmRegenerate) {
        showNotification('已取消重新生成操作', 'info');
        return;
      }
      
      // Double confirmation for safety
      const doubleConfirm = confirm(
        `⚠️ 最后确认\n\n` +
        `您即将删除第${chapter.chapter_number}章的所有小节和内容。\n` +
        `此操作不可撤销！\n\n` +
        `是否确定继续？`
      );
      
      if (!doubleConfirm) {
        showNotification('已取消重新生成操作', 'info');
        return;
      }
    } else if (chapter.sections && chapter.sections.length > 0) {
      // Sections exist but no content generated yet
      const confirmDelete = confirm(
        `⚠️ 第${chapter.chapter_number}章当前有 ${chapter.sections.length} 个小节（尚未生成内容）。\n\n` +
        `重新生成将删除这些小节大纲。\n\n` +
        `确定要继续吗？`
      );
      if (!confirmDelete) {
        return;
      }
    }
    
    // Prompt user for number of sections
    const numSectionsInput = prompt(
      `请输入要为"第${chapter.chapter_number}章: ${chapter.title}"生成的小节数量：\n\n` +
      `建议：3-10个小节\n` +
      `当前章节描述：${chapter.description || '无'}`,
      '5'
    );
    
    if (!numSectionsInput) {
      return; // User cancelled
    }
    
    const numSections = parseInt(numSectionsInput);
    
    if (isNaN(numSections) || numSections < 1 || numSections > 20) {
      showNotification('小节数量必须在1-20之间', 'warning');
      return;
    }
    
    // Build initial prompt for sections
    const book = this.currentBook;
    const initialPrompt = `你是一位专业的书籍内容规划专家。

书籍主题：${book.title}
主题描述：${book.description}

当前章节：第${chapter.chapter_number}章 - ${chapter.title}
章节描述：${chapter.description || '无'}

请为这个章节重新生成${numSections}个小节标题。

要求：
1. 每个小节标题50字以内
2. 小节内容要围绕章节主题展开
3. 小节之间要有逻辑关系和递进性
4. 请按照JSON格式返回：
{
  "sections": [
    {"number": 1, "title": "小节标题", "description": "小节简介（50字内）"},
    {"number": 2, "title": "小节标题", "description": "小节简介（50字内）"},
    ...
  ]
}

只返回JSON，不要其他说明文字。`;

    // Show editable prompt modal
    const finalPrompt = await window.showPromptEditor('编辑重新生成小节的Prompt', initialPrompt);
    
    if (!finalPrompt) {
      return; // User cancelled
    }
    
    try {
      showNotification(`🤖 AI正在为第${chapter.chapter_number}章重新生成${numSections}个小节...`, 'info');
      
      const token = localStorage.getItem('authToken');
      // Call API to regenerate sections
      const response = await axios.post(
        `/api/ai-books/${this.currentBook.id}/chapters/${chapterId}/regenerate-sections`,
        { 
          num_sections: numSections,
          prompt: finalPrompt 
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        // Update local chapter data with new sections
        chapter.sections = response.data.sections.map(s => ({
          ...s,
          sections: [] // Empty sections array for consistency
        }));
        
        // Refresh the entire book editor to show new sections
        this.renderBookEditor();
        
        showNotification(`✅ 第${chapter.chapter_number}章的小节已重新生成！共${response.data.sections.length}个小节。`, 'success');
      } else {
        throw new Error(response.data.error || '重新生成失败');
      }
    } catch (error) {
      console.error('Error regenerating sections:', error);
      const errorMsg = error.response?.data?.error || error.message || '重新生成小节失败';
      showNotification(`❌ ${errorMsg}`, 'error');
    }
  },
  
  // ============================================================
  // Edit section title
  // ============================================================
  async editSectionTitle(sectionId) {
    const section = this.findSectionById(sectionId);
    if (!section) {
      showNotification('未找到该小节', 'error');
      return;
    }
    
    const newTitle = prompt('编辑小节标题：', section.title);
    
    if (newTitle === null || newTitle === section.title) return;
    
    try {
      const response = await axios.put(`/api/ai-books/${this.currentBook.id}/sections/${sectionId}`, {
        title: newTitle,
        description: section.description,
        content: section.content || ''
      });
      
      if (response.data.success) {
        section.title = newTitle;
        document.getElementById(`section-title-${sectionId}`).textContent = newTitle;
        showNotification('小节标题已更新', 'success');
      }
    } catch (error) {
      console.error('Error updating section title:', error);
      showNotification('更新失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  },
  
  // ============================================================
  // Edit section description
  // ============================================================
  async editSectionDescription(sectionId) {
    const section = this.findSectionById(sectionId);
    if (!section) {
      showNotification('未找到该小节', 'error');
      return;
    }
    
    const newDescription = prompt(
      '编辑小节描述（写作关键点）：\n\n提示：请描述这一小节的核心要点、论述方向、重要概念等，AI会根据这些信息生成内容。',
      section.description || ''
    );
    
    if (newDescription === null) return;
    
    try {
      const response = await axios.put(`/api/ai-books/${this.currentBook.id}/sections/${sectionId}`, {
        title: section.title,
        description: newDescription,
        content: section.content || ''
      });
      
      if (response.data.success) {
        section.description = newDescription;
        const descElem = document.getElementById(`section-description-${sectionId}`);
        descElem.textContent = newDescription || '暂无描述 - 点击编辑添加写作关键点';
        descElem.className = `text-sm text-gray-600 ${!newDescription ? 'italic' : ''}`;
        showNotification('小节描述已更新', 'success');
      }
    } catch (error) {
      console.error('Error updating section description:', error);
      showNotification('更新失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  },
  
  // Helper function to find section by ID
  findSectionById(sectionId) {
    for (const chapter of this.currentBook.chapters) {
      if (chapter.sections) {
        const section = chapter.sections.find(s => s.id === sectionId);
        if (section) return section;
      }
    }
    return null;
  },
  
  // ============================================================
  // Show Regenerate Modal - Display original prompt (read-only) and book creation form
  // ============================================================
  showRegenerateModal() {
    if (!this.currentBook) {
      showNotification('未找到书籍信息', 'error');
      return;
    }
    
    const book = this.currentBook;
    
    // If no initial_prompt, show a default message
    const displayPrompt = book.initial_prompt || '（此书籍创建时未保存生成记录，这是新功能添加前创建的书籍）\n\n您仍然可以使用下方的参数重新生成章节。';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onclick="event.stopPropagation()">
        <div class="border-b border-gray-200 px-6 py-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-sync-alt mr-2 text-purple-600"></i>重新生成章节
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            <i class="fas fa-info-circle mr-1"></i>查看上次使用的AI Prompt（只读），并设置新的生成参数
          </p>
        </div>
        
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <!-- Original Prompt (Read-only) -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-history mr-1 text-blue-600"></i>上次使用的Prompt（只读）
            </label>
            <textarea readonly 
              class="w-full h-48 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 resize-none"
              >${displayPrompt}</textarea>
          </div>
          
          <!-- New Generation Settings -->
          <div class="border-t pt-6">
            <h4 class="text-lg font-bold text-gray-800 mb-4">
              <i class="fas fa-cog mr-2 text-purple-600"></i>新的生成参数
            </h4>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">书籍标题</label>
                <input type="text" id="regenerate-title" value="${book.title}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">书籍描述</label>
                <textarea id="regenerate-description" rows="3" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">${book.description || ''}</textarea>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">目标字数</label>
                  <input type="number" id="regenerate-word-count" value="${book.target_word_count}" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">章节数量</label>
                  <input type="number" id="regenerate-num-chapters" value="${book.chapters?.length || 10}" min="1" max="50"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">语气风格</label>
                  <select id="regenerate-tone" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="professional" ${book.tone === 'professional' ? 'selected' : ''}>专业</option>
                    <option value="casual" ${book.tone === 'casual' ? 'selected' : ''}>轻松</option>
                    <option value="academic" ${book.tone === 'academic' ? 'selected' : ''}>学术</option>
                    <option value="humorous" ${book.tone === 'humorous' ? 'selected' : ''}>幽默</option>
                    <option value="inspirational" ${book.tone === 'inspirational' ? 'selected' : ''}>励志</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">目标读者</label>
                  <select id="regenerate-audience" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="general" ${book.audience === 'general' ? 'selected' : ''}>一般读者</option>
                    <option value="professional" ${book.audience === 'professional' ? 'selected' : ''}>专业人士</option>
                    <option value="student" ${book.audience === 'student' ? 'selected' : ''}>学生</option>
                    <option value="beginner" ${book.audience === 'beginner' ? 'selected' : ''}>初学者</option>
                    <option value="expert" ${book.audience === 'expert' ? 'selected' : ''}>专家</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 bg-gray-50">
          <button onclick="this.closest('.fixed').remove()" 
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            <i class="fas fa-times mr-2"></i>取消
          </button>
          <button onclick="AIBooksManager.regenerateChapters()" 
            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <i class="fas fa-sync-alt mr-2"></i>开始重新生成
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // ============================================================
  // Regenerate chapters with new parameters
  // ============================================================
  async regenerateChapters() {
    const title = document.getElementById('regenerate-title').value.trim();
    const description = document.getElementById('regenerate-description').value.trim();
    const targetWordCount = parseInt(document.getElementById('regenerate-word-count').value);
    const numChapters = parseInt(document.getElementById('regenerate-num-chapters').value);
    const tone = document.getElementById('regenerate-tone').value;
    const audience = document.getElementById('regenerate-audience').value;
    
    if (!title) {
      showNotification('请输入书籍标题', 'warning');
      return;
    }
    
    if (numChapters < 1 || numChapters > 50) {
      showNotification('章节数量必须在1-50之间', 'warning');
      return;
    }
    
    // Check if there are existing chapters
    if (this.currentBook.chapters && this.currentBook.chapters.length > 0) {
      const confirmDelete = confirm(`⚠️ 重新生成将删除现有的${this.currentBook.chapters.length}个章节及其所有内容。\n\n确定要继续吗？`);
      if (!confirmDelete) {
        return;
      }
    }
    
    // Build new prompt
    const newPrompt = `你是一位专业的书籍大纲规划专家。

书籍主题：${title}
主题描述：${description}
目标字数：${targetWordCount}字
语气风格：${tone}
目标读者：${audience}

请为这本书生成${numChapters}个章节标题。

要求：
1. 每个章节标题50字以内
2. 章节标题要逻辑清晰，循序渐进
3. 请按照JSON格式返回，格式如下：
{
  "chapters": [
    {"number": 1, "title": "章节标题", "description": "章节简介（50字内）"},
    {"number": 2, "title": "章节标题", "description": "章节简介（50字内）"},
    ...
  ]
}

只返回JSON，不要其他说明文字。`;
    
    // Show editable prompt modal
    const finalPrompt = await window.showPromptEditor('编辑重新生成的Prompt', newPrompt);
    
    if (!finalPrompt) {
      return; // User cancelled
    }
    
    // Close regenerate modal
    document.querySelector('.fixed.inset-0').remove();
    
    try {
      showNotification(`🤖 AI正在重新生成${numChapters}个章节，预计需要10-30秒...`, 'info');
      
      // First, update book info
      await axios.put(`/api/ai-books/${this.currentBook.id}`, {
        title,
        description,
        target_word_count: targetWordCount,
        tone,
        audience
      });
      
      // Fetch latest book data to get current chapters
      const bookResponse = await axios.get(`/api/ai-books/${this.currentBook.id}`);
      const latestChapters = bookResponse.data.chapters || [];
      
      // Then delete existing chapters
      const token = localStorage.getItem('authToken');
      if (latestChapters.length > 0) {
        // Backend should cascade delete sections
        for (const chapter of latestChapters) {
          await axios.delete(`/api/ai-books/${this.currentBook.id}/chapters/${chapter.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }
      
      // Generate new chapters
      const response = await axios.post(
        `/api/ai-books/${this.currentBook.id}/generate-chapters`,
        { 
          num_chapters: numChapters,
          prompt: finalPrompt
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        showNotification(`✅ 成功重新生成${response.data.chapters.length}个章节！`, 'success');
        
        // Reload book data
        await this.openBook(this.currentBook.id);
      } else {
        throw new Error(response.data.error || '重新生成失败');
      }
    } catch (error) {
      console.error('Error regenerating chapters:', error);
      showNotification('重新生成失败: ' + (error.response?.data?.error || error.message), 'error');
    }
  },
  
  // ============================================================
  // Generate chapters (Level 1)
  // ============================================================
  async generateChapters() {
    const numChapters = parseInt(document.getElementById('num-chapters').value);
    
    if (numChapters < 1 || numChapters > 50) {
      showNotification('章节数量必须在1-50之间', 'warning');
      return;
    }
    
    // Build initial prompt
    const book = this.currentBook;
    const initialPrompt = `你是一位专业的书籍大纲规划专家。

书籍主题：${book.title}
主题描述：${book.description}
目标字数：${book.target_word_count}字
语气风格：${book.tone}
目标读者：${book.audience}

请为这本书生成${numChapters}个章节标题。

要求：
1. 每个章节标题50字以内
2. 章节标题要逻辑清晰，循序渐进
3. 请按照JSON格式返回，格式如下：
{
  "chapters": [
    {"number": 1, "title": "章节标题", "description": "章节简介（50字内）"},
    {"number": 2, "title": "章节标题", "description": "章节简介（50字内）"},
    ...
  ]
}

只返回JSON，不要其他说明文字。`;

    // Show editable prompt modal
    const finalPrompt = await window.showPromptEditor('编辑生成章节的Prompt', initialPrompt);
    
    if (!finalPrompt) {
      return; // User cancelled
    }
    
    // Disable button and show loading
    const button = event.target;
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI生成中...';
    
    try {
      showNotification(`🤖 AI正在生成${numChapters}个章节，预计需要10-30秒...`, 'info');
      
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `/api/ai-books/${this.currentBook.id}/generate-chapters`,
        { 
          num_chapters: numChapters,
          prompt: finalPrompt
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        showNotification(`✅ 成功生成${response.data.chapters.length}个章节！`, 'success');
        
        // Update current book with new chapters
        this.currentBook.chapters = response.data.chapters.map(ch => ({
          ...ch,
          sections: []
        }));
        
        // Re-render to show new chapters
        this.renderBookEditor();
      } else {
        throw new Error(response.data.error || '生成失败');
      }
    } catch (error) {
      console.error('Error generating chapters:', error);
      const errorMsg = error.response?.data?.error || error.message || '生成章节失败';
      showNotification(`❌ ${errorMsg}`, 'error');
      
      // Restore button
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  },
  
  // ============================================================
  // Generate sections (Level 2)
  // ============================================================
  async generateSections(chapterId) {
    const numSections = parseInt(document.getElementById(`num-sections-${chapterId}`).value);
    
    if (numSections < 1 || numSections > 20) {
      showNotification('小节数量必须在1-20之间', 'warning');
      return;
    }
    
    // Find chapter
    const chapter = (this.currentBook.chapters || []).find(c => c.id === chapterId);
    if (!chapter) {
      showNotification('未找到章节', 'error');
      return;
    }
    
    // Build initial prompt
    const book = this.currentBook;
    const initialPrompt = `你是一位专业的书籍内容规划专家。

书籍主题：${book.title}
主题描述：${book.description}

当前章节：第${chapter.chapter_number}章 - ${chapter.title}
章节描述：${chapter.description || '（无描述）'}

请为这个章节生成${numSections}个小节标题。

要求：
1. 每个小节标题50字以内
2. 小节内容要围绕章节主题展开
3. 请按照JSON格式返回：
{
  "sections": [
    {"number": 1, "title": "小节标题", "description": "小节简介（50字内）"},
    {"number": 2, "title": "小节标题", "description": "小节简介（50字内）"},
    ...
  ]
}

只返回JSON，不要其他说明文字。`;

    // Show editable prompt modal
    const finalPrompt = await window.showPromptEditor('编辑生成小节的Prompt', initialPrompt);
    
    if (!finalPrompt) {
      return; // User cancelled
    }
    
    try {
      showNotification(`🤖 AI正在生成${numSections}个小节，预计需要10-30秒...`, 'info');
      
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `/api/ai-books/${this.currentBook.id}/chapters/${chapterId}/generate-sections`,
        { 
          num_sections: numSections,
          prompt: finalPrompt
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        showNotification(`✅ 成功生成${response.data.sections.length}个小节！`, 'success');
        
        // Update chapter with new sections
        if (chapter) {
          chapter.sections = response.data.sections || [];
        }
        
        // Re-render to show new sections
        this.renderBookEditor();
      } else {
        throw new Error(response.data.error || '生成失败');
      }
    } catch (error) {
      console.error('Error generating sections:', error);
      const errorMsg = error.response?.data?.error || error.message || '生成小节失败';
      showNotification(`❌ ${errorMsg}`, 'error');
    }
  },
  
  // ============================================================
  // Generate section content (Level 3)
  // ============================================================
  async generateSectionContent(sectionId) {
    // Find section and chapter
    let section = null;
    let chapter = null;
    for (const c of this.currentBook.chapters || []) {
      section = (c.sections || []).find(s => s.id === sectionId);
      if (section) {
        chapter = c;
        break;
      }
    }
    
    if (!section || !chapter) {
      showNotification('未找到该小节', 'error');
      return;
    }
    
    // Ask for target word count
    const targetWords = prompt('请输入目标字数（建议1000-2000字）:', section.target_word_count || '1000');
    if (!targetWords) return;
    
    const targetWordsInt = parseInt(targetWords);
    if (isNaN(targetWordsInt) || targetWordsInt < 100 || targetWordsInt > 10000) {
      showNotification('❌ 字数必须在100-10000之间', 'error');
      return;
    }
    
    // Build initial prompt
    const book = this.currentBook;
    const minWords = Math.floor(targetWordsInt * 0.9);
    const maxWords = Math.ceil(targetWordsInt * 1.1);
    
    const initialPrompt = `你是一位专业的内容创作者。请严格按照字数要求生成内容。

【书籍信息】
书籍主题：${book.title}
主题描述：${book.description || '（无描述）'}

【章节信息】
章节：${chapter.title}
章节描述：${chapter.description || '（无描述）'}

【小节信息】
当前小节：${section.title}
小节描述：${section.description || '（无描述）'}

【核心任务】
请为这个小节生成${targetWordsInt}字左右的完整内容（允许误差±10%，即${minWords}-${maxWords}字）。

【内容要求】
1. ⚠️ 字数控制：生成内容必须在${minWords}-${maxWords}字范围内（不包含markdown标记符号）
2. 专业性：内容要专业、准确、有深度
3. 语言风格：${book.tone || '专业严谨'}
4. 目标读者：${book.audience || '专业人士'}
5. 结构完整：内容必须有完整的开头、正文和结尾，不能突然中断
6. 格式规范：使用Markdown格式，包含：
   - 适当的小标题（## 或 ###）
   - 段落分隔（空行）
   - 列表（有序或无序）
   - 重点标记（**粗体**）
7. 内容充实：可以包含案例、数据、分析、对比等

【特别要求 - 内容完整性】
- ⚠️ 【关键】内容必须完整，从头到尾一气呵成，不能中途停止
- ⚠️ 【关键】必须有明确的结论或总结段落，不能突然结束
- ⚠️ 【关键】最后一段必须是总结性质的收尾，给读者明确的结束感
- ✅ 如果接近字数上限，使用简洁但完整的方式收尾
- ✅ 每个小标题下的内容都要充分展开，不能只写一半
- ❌ 绝对不要包含"未完待续"、"下一节将"、"待续"等字样
- ❌ 绝对不要在列表中途停止或在句子中间停止
- ❌ 不要超出规定字数范围

【输出格式】
请直接输出完整的内容（纯文本+Markdown格式），不要JSON格式，不要前言说明，确保内容从开头到结尾都是完整的。`;

    // Show editable prompt modal
    const finalPrompt = await window.showPromptEditor('编辑生成内容的Prompt', initialPrompt);
    
    if (!finalPrompt) {
      return; // User cancelled
    }
    
    if (!confirm(`确定要生成约${targetWords}字的内容吗？\n\nAI将生成详细的专业内容，预计需要30-60秒。`)) {
      return;
    }
    
    try {
      showNotification(`🤖 AI正在生成约${targetWords}字的内容，请耐心等待...`, 'info');
      
      const token = localStorage.getItem('authToken');
      const apiUrl = `/api/ai-books/${this.currentBook.id}/sections/${sectionId}/generate-content`;
      console.log(`[generateSectionContent] Calling API: ${apiUrl}`);
      console.log(`[generateSectionContent] Request body:`, { 
        target_word_count: targetWordsInt,
        prompt_length: finalPrompt.length 
      });
      
      const response = await axios.post(apiUrl, { 
        target_word_count: targetWordsInt,
        prompt: finalPrompt
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`[generateSectionContent] Response status:`, response.status);
      console.log(`[generateSectionContent] Response data:`, response.data);
      
      if (response.data.success) {
        console.log(`[generateSectionContent] Generation successful! Word count: ${response.data.word_count}`);
        showNotification(`✅ 内容生成成功！实际生成${response.data.word_count}字`, 'success');
        // Reload book to show updated content and action buttons
        console.log('[generateSectionContent] Reloading book to refresh UI...');
        await this.openBook(this.currentBook.id);
        console.log('[generateSectionContent] Book reloaded successfully');
      } else {
        throw new Error(response.data.error || '生成失败');
      }
    } catch (error) {
      console.error('[generateSectionContent] Error occurred:', error);
      console.error('[generateSectionContent] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMsg = '生成内容失败';
      if (error.response) {
        errorMsg = error.response.data?.error || error.response.statusText || errorMsg;
        errorMsg += ` (HTTP ${error.response.status})`;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showNotification(`❌ ${errorMsg}`, 'error');
    }
  },
  
  // ============================================================
  // Regenerate section content (重新生成小节内容)
  // ============================================================
  async regenerateSectionContent(sectionId) {
    // Find section and chapter
    let section = null;
    let chapter = null;
    for (const c of this.currentBook.chapters || []) {
      section = (c.sections || []).find(s => s.id === sectionId);
      if (section) {
        chapter = c;
        break;
      }
    }
    
    if (!section || !chapter) {
      showNotification('未找到该小节', 'error');
      return;
    }
    
    // Confirm overwrite with double confirmation
    if (!confirm(`⚠️ 警告：重新生成将覆盖现有内容！\n\n当前内容：${section.current_word_count || 0}字\n\n确定要重新生成吗？原内容将永久丢失，无法恢复。`)) {
      return;
    }
    
    // Double confirmation
    if (!confirm(`⚠️ 最后确认\n\n您即将删除"${section.title}"的所有内容。\n此操作不可撤销！\n\n是否确定继续？`)) {
      return;
    }
    
    // Ask for target word count
    const targetWords = prompt('请输入目标字数（建议1000-2000字）:', section.target_word_count || '1000');
    if (!targetWords) return;
    
    const targetWordsInt = parseInt(targetWords);
    if (isNaN(targetWordsInt) || targetWordsInt < 100 || targetWordsInt > 10000) {
      showNotification('❌ 字数必须在100-10000之间', 'error');
      return;
    }
    
    // Build initial prompt
    const book = this.currentBook;
    const minWords = Math.floor(targetWordsInt * 0.9);
    const maxWords = Math.ceil(targetWordsInt * 1.1);
    
    const initialPrompt = `你是一位专业的内容创作者。请严格按照字数要求重新生成内容。

【书籍信息】
书籍主题：${book.title}
主题描述：${book.description || '（无描述）'}

【章节信息】
章节：${chapter.title}
章节描述：${chapter.description || '（无描述）'}

【小节信息】
当前小节：${section.title}
小节描述：${section.description || '（无描述）'}

【核心任务】
请为这个小节重新生成${targetWordsInt}字左右的完整内容（允许误差±10%，即${minWords}-${maxWords}字）。

【内容要求】
1. ⚠️ 字数控制：生成内容必须在${minWords}-${maxWords}字范围内（不包含markdown标记符号）
2. 专业性：内容要专业、准确、有深度
3. 语言风格：${book.tone || '专业严谨'}
4. 目标读者：${book.audience || '专业人士'}
5. 结构完整：内容必须有完整的开头、正文和结尾，不能突然中断
6. 格式规范：使用Markdown格式，包含适当的小标题、段落、列表、重点标记
7. 内容充实：可以包含案例、数据、分析、对比等
8. 创新角度：尽量提供新的视角和见解，不要与之前的内容雷同

【特别要求 - 内容完整性】
- ⚠️ 【关键】内容必须完整，从头到尾一气呵成，不能中途停止
- ⚠️ 【关键】必须有明确的结论或总结段落，不能突然结束
- ⚠️ 【关键】最后一段必须是总结性质的收尾，给读者明确的结束感
- ✅ 如果接近字数上限，使用简洁但完整的方式收尾
- ✅ 每个小标题下的内容都要充分展开，不能只写一半
- ❌ 绝对不要包含"未完待续"、"下一节将"、"待续"等字样
- ❌ 绝对不要在列表中途停止或在句子中间停止
- ❌ 不要超出规定字数范围

【输出格式】
请直接输出完整的内容（纯文本+Markdown格式），不要JSON格式，不要前言说明，确保内容从开头到结尾都是完整的。`;

    // Show editable prompt modal
    const finalPrompt = await window.showPromptEditor('编辑重新生成内容的Prompt', initialPrompt);
    
    if (!finalPrompt) {
      return; // User cancelled
    }
    
    try {
      showNotification(`🤖 AI正在重新生成约${targetWords}字的内容，请耐心等待...`, 'info');
      
      const token = localStorage.getItem('authToken');
      const apiUrl = `/api/ai-books/${this.currentBook.id}/sections/${sectionId}/generate-content`;
      console.log(`[regenerateSectionContent] Calling API: ${apiUrl}`);
      console.log(`[regenerateSectionContent] Request body:`, { 
        target_word_count: targetWordsInt,
        prompt_length: finalPrompt.length 
      });
      
      const response = await axios.post(apiUrl, { 
        target_word_count: targetWordsInt,
        prompt: finalPrompt
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`[regenerateSectionContent] Response status:`, response.status);
      console.log(`[regenerateSectionContent] Response data:`, response.data);
      
      if (response.data.success) {
        showNotification('✅ 内容重新生成成功！', 'success');
        // Reload book to show new content
        await this.openBook(this.currentBook.id);
      } else {
        throw new Error(response.data.error || '重新生成失败');
      }
    } catch (error) {
      console.error('[regenerateSectionContent] Error occurred:', error);
      console.error('[regenerateSectionContent] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMsg = '重新生成失败';
      if (error.response) {
        errorMsg = error.response.data?.error || error.response.statusText || errorMsg;
        errorMsg += ` (HTTP ${error.response.status})`;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showNotification(`❌ ${errorMsg}`, 'error');
    }
  },
  
  // ============================================================
  // Edit section content with TinyMCE Editor (支持表格和图片)
  // ============================================================
  async editSection(sectionId) {
    // Find the section
    const section = this.currentBook.sections.find(s => s.id === sectionId);
    if (!section) {
      alert('找不到该小节！');
      return;
    }
    
    // Detect if content is Markdown and convert to HTML
    let contentForEditor = section.content || '';
    let isMarkdownContent = false;
    if (contentForEditor && this.isMarkdown(contentForEditor)) {
      console.log('检测到 Markdown 格式，转换为 HTML...');
      contentForEditor = marked.parse(contentForEditor);
      isMarkdownContent = true;
      console.log('转换完成');
    }
    
    // Create modal HTML with TinyMCE Editor
    const modalHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="editSectionModal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2 text-blue-600"></i>
              编辑内容：${section.title || '第' + section.section_number + '节'}
            </h2>
            <button onclick="AIBooksManager.closeSectionEditor()" 
              class="text-gray-500 hover:text-gray-700 text-2xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Editor Container -->
          <div class="flex-1 overflow-y-auto px-6 py-4" style="max-height: calc(100vh - 250px);">
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-file-alt mr-1"></i>小节内容
              </label>
              <!-- TinyMCE Editor -->
              <textarea id="tinymceEditor" style="min-height: 500px;">${contentForEditor}</textarea>
              <div class="mt-3 flex justify-between items-center">
                <small class="text-gray-500">
                  <i class="fas fa-info-circle"></i>
                  支持富文本格式：<strong>表格</strong>、图片、标题、加粗、斜体、列表、链接等
                </small>
                <div class="flex items-center space-x-4">
                  <span class="text-sm text-gray-600">
                    <i class="fas fa-text-width mr-1"></i>当前字数：
                    <span id="currentWordCount" class="font-bold text-blue-600">
                      ${section.current_word_count || 0}
                    </span>
                  </span>
                  <span class="text-sm text-gray-600">
                    目标：<span class="font-medium">${section.target_word_count || 1000}</span> 字
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button onclick="AIBooksManager.closeSectionEditor()" 
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <i class="fas fa-times mr-2"></i>取消
            </button>
            <button id="saveSectionContentBtn"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-save mr-2"></i>保存内容
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Word count calculation function (supports Chinese and English)
    const calculateWordCount = (htmlContent) => {
      // Remove HTML tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      
      // Remove all whitespace
      const cleanText = text.replace(/\s+/g, '');
      
      // Count Chinese characters
      const chineseChars = cleanText.match(/[\u4e00-\u9fa5]/g);
      const chineseCount = chineseChars ? chineseChars.length : 0;
      
      // Count English words
      const nonChineseText = cleanText.replace(/[\u4e00-\u9fa5]/g, '');
      const englishWords = nonChineseText.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 0);
      const englishCount = englishWords.length;
      
      return chineseCount + englishCount;
    };
    
    // Initialize TinyMCE Editor with full features
    tinymce.init({
      selector: '#tinymceEditor',
      height: 500,
      language: 'zh_CN',
      promotion: false, // 隐藏域名警告和升级提示
      branding: false,  // 隐藏 "Powered by TinyMCE"
      menubar: 'file edit view insert format tools table',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | blocks | ' +
        'bold italic forecolor backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'table tabledelete | tableprops tablerowprops tablecellprops | ' +
        'tableinsertrowbefore tableinsertrowafter tabledeleterow | ' +
        'tableinsertcolbefore tableinsertcolafter tabledeletecol | ' +
        'image link | removeformat | code | help',
      table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
      table_appearance_options: true,
      table_grid: true,
      table_resize_bars: true,
      table_use_colgroups: true,
      content_style: 'body { font-family: "Microsoft YaHei", Arial, sans-serif; font-size: 14px; line-height: 1.8; }' +
        'table { border-collapse: collapse; width: 100%; }' +
        'table td, table th { border: 1px solid #ddd; padding: 8px; }' +
        'table th { background-color: #f2f2f2; font-weight: bold; }',
      // 图片处理：转换为 base64 嵌入
      images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          reject('图片读取失败');
        };
        reader.readAsDataURL(blobInfo.blob());
      }),
      automatic_uploads: true,
      file_picker_types: 'image',
      image_advtab: true,
      image_caption: true,
      // 更新字数统计
      setup: (editor) => {
        editor.on('init', () => {
          // 初始化时更新字数
          const content = editor.getContent();
          const wordCount = calculateWordCount(content);
          document.getElementById('currentWordCount').textContent = wordCount;
        });
        
        editor.on('input change', () => {
          const content = editor.getContent();
          const wordCount = calculateWordCount(content);
          document.getElementById('currentWordCount').textContent = wordCount;
        });
      }
    });
    
    // Save button handler
    document.getElementById('saveSectionContentBtn').addEventListener('click', async () => {
      const editor = tinymce.get('tinymceEditor');
      const htmlContent = editor.getContent();
      const textContent = editor.getContent({ format: 'text' }).trim();
      
      if (!textContent || textContent.length === 0) {
        showNotification('内容不能为空！', 'warning');
        return;
      }
      
      try {
        const saveBtn = document.getElementById('saveSectionContentBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        
        // Send HTML content to backend
        const response = await axios.put(
          `/api/ai-books/${this.currentBook.id}/sections/${sectionId}`,
          { content: htmlContent }
        );
        
        if (response.data) {
          showNotification('✅ 内容保存成功！', 'success');
          
          // Update local state
          section.content = htmlContent;
          section.current_word_count = calculateWordCount(htmlContent);
          
          // Close modal and cleanup TinyMCE
          this.closeSectionEditor();
          
          // Re-render book view
          await this.openBook(this.currentBook.id);
        }
      } catch (error) {
        console.error('Error saving content:', error);
        showNotification('保存失败: ' + (error.response?.data?.error || error.message), 'error');
        
        // Re-enable button
        const saveBtn = document.getElementById('saveSectionContentBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存内容';
      }
    });
  },
  
  // ============================================================
  // Close section editor and cleanup TinyMCE
  // ============================================================
  closeSectionEditor() {
    // Remove TinyMCE instance
    const editor = tinymce.get('tinymceEditor');
    if (editor) {
      editor.remove();
    }
    
    // Remove modal
    const modal = document.getElementById('editSectionModal');
    if (modal) {
      modal.remove();
    }
  },
  
  // ============================================================
  // Export book to HTML
  // ============================================================
  async exportBook() {
    alert('HTML导出功能即将推出！');
    // TODO: Implement HTML export
  },
  
  // ============================================================
  // Delete book
  // ============================================================
  async deleteBook(bookId) {
    if (!confirm('确定要删除这本书吗？此操作不可恢复！')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/ai-books/${bookId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      showNotification('书籍已删除', 'success');
      this.loadBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('删除失败: ' + (error.response?.data?.message || error.message));
    }
  },
  
  // ============================================================
  // Helper: Check if content is Markdown
  // ============================================================
  isMarkdown(content) {
    if (!content) return false;
    
    // Check for common Markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s+/m,        // Headers: # ## ###
      /\*\*.*?\*\*/,        // Bold: **text**
      /__.*?__/,            // Bold: __text__
      /\*.*?\*/,            // Italic: *text*
      /_.*?_/,              // Italic: _text_
      /^\s*[-*+]\s+/m,      // Unordered list: - * +
      /^\s*\d+\.\s+/m,      // Ordered list: 1. 2.
      /\[.*?\]\(.*?\)/,     // Links: [text](url)
      /!\[.*?\]\(.*?\)/,    // Images: ![alt](url)
      /^>\s+/m,             // Blockquote: >
      /`.*?`/,              // Inline code: `code`
      /^```/m               // Code block: ```
    ];
    
    // If content has HTML tags, it's already HTML
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return false;
    }
    
    // Check if at least 2 Markdown patterns match
    let matches = 0;
    for (const pattern of markdownPatterns) {
      if (pattern.test(content)) {
        matches++;
        if (matches >= 2) return true;
      }
    }
    
    return false;
  },
  
  // ============================================================
  // Helper: Escape HTML for safe insertion
  // ============================================================
  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
};

// Helper function for notifications
function showNotification(message, type = 'info') {
  const colors = {
    'info': 'bg-blue-600',
    'success': 'bg-green-600',
    'error': 'bg-red-600',
    'warning': 'bg-yellow-600'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
