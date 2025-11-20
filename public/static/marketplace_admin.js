// MarketPlace Admin Management
// Handles product and writing template management for administrators

const MarketplaceAdmin = {
  currentView: 'products', // 'products' or 'templates'
  products: [],
  templates: [],
  currentProduct: null,
  currentTemplate: null,

  // ============================================================
  // Initialize
  // ============================================================
  async init() {
    console.log('[MarketplaceAdmin] Initializing...');
    
    // Load initial data
    await this.loadProducts();
    await this.loadTemplates();
    
    // Render initial view
    this.renderProductList();
    
    console.log('[MarketplaceAdmin] Initialized successfully');
  },

  // ============================================================
  // Switch View
  // ============================================================
  switchView(view) {
    this.currentView = view;
    
    // Update active tab
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.remove('active', 'border-b-2', 'border-blue-600', 'text-blue-600');
      tab.classList.add('text-gray-600');
    });
    
    const activeTab = document.querySelector(`[onclick="MarketplaceAdmin.switchView('${view}')"]`);
    if (activeTab) {
      activeTab.classList.add('active', 'border-b-2', 'border-blue-600', 'text-blue-600');
      activeTab.classList.remove('text-gray-600');
    }
    
    // Render appropriate view
    if (view === 'products') {
      this.renderProductList();
    } else if (view === 'templates') {
      this.renderTemplateList();
    }
  },

  // ============================================================
  // Load Products
  // ============================================================
  async loadProducts() {
    try {
      const response = await axios.get('/api/marketplace/products');
      if (response.data.success) {
        this.products = response.data.products || [];
        console.log('[MarketplaceAdmin] Loaded products:', this.products.length);
      }
    } catch (error) {
      console.error('[MarketplaceAdmin] Error loading products:', error);
      showNotification('❌ 加载产品失败', 'error');
    }
  },

  // ============================================================
  // Load Templates
  // ============================================================
  async loadTemplates() {
    try {
      const response = await axios.get('/api/writing-templates');
      if (response.data.success) {
        this.templates = response.data.templates || [];
        console.log('[MarketplaceAdmin] Loaded templates:', this.templates.length);
      }
    } catch (error) {
      console.error('[MarketplaceAdmin] Error loading templates:', error);
      showNotification('❌ 加载模板失败', 'error');
    }
  },

  // ============================================================
  // Render Product List
  // ============================================================
  renderProductList() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    // Group products by type
    const productsByType = {
      'ai_service': this.products.filter(p => p.product_type === 'ai_service'),
      'book_template': this.products.filter(p => p.product_type === 'book_template'),
      'template': this.products.filter(p => p.product_type === 'template')
    };

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-shopping-bag mr-2"></i>产品管理
          </h2>
          <button onclick="MarketplaceAdmin.showProductForm()" 
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>添加产品
          </button>
        </div>
      </div>

      <!-- AI Services -->
      ${productsByType.ai_service.length > 0 ? `
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-700 mb-4">
            <i class="fas fa-robot mr-2"></i>AI 智能服务
          </h3>
          <div class="grid grid-cols-1 gap-4">
            ${productsByType.ai_service.map(product => this.renderProductCard(product)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Book Templates -->
      ${productsByType.book_template.length > 0 ? `
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-700 mb-4">
            <i class="fas fa-book mr-2"></i>书籍模板
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${productsByType.book_template.map(product => this.renderProductCard(product)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Other Templates -->
      ${productsByType.template.length > 0 ? `
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-700 mb-4">
            <i class="fas fa-file-alt mr-2"></i>其他模板
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${productsByType.template.map(product => this.renderProductCard(product)).join('')}
          </div>
        </div>
      ` : ''}

      ${this.products.length === 0 ? `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-6xl mb-4"></i>
          <p class="text-xl">暂无产品</p>
          <button onclick="MarketplaceAdmin.showProductForm()" 
            class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            添加第一个产品
          </button>
        </div>
      ` : ''}
    `;
  },

  // ============================================================
  // Render Product Card
  // ============================================================
  renderProductCard(product) {
    const statusBadge = product.is_active 
      ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">启用</span>'
      : '<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">禁用</span>';
    
    const featuredBadge = product.is_featured
      ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded ml-2">精选</span>'
      : '';

    const priceBadge = product.is_free
      ? '<span class="text-green-600 font-bold">免费</span>'
      : product.is_subscription
      ? `<span class="text-blue-600 font-bold">订阅 $${product.price_usd}/月</span>`
      : `<span class="text-gray-800 font-bold">$${product.price_usd}</span>`;

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-800">
              ${product.name}
              ${featuredBadge}
            </h4>
            ${product.name_en ? `<p class="text-sm text-gray-500">${product.name_en}</p>` : ''}
          </div>
          <div class="flex items-center space-x-2">
            ${statusBadge}
          </div>
        </div>

        ${product.description ? `
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
        ` : ''}

        <div class="flex items-center justify-between mb-3">
          <div>
            ${priceBadge}
          </div>
          <div class="text-sm text-gray-500">
            <i class="fas fa-shopping-cart mr-1"></i>${product.purchase_count || 0} 次购买
          </div>
        </div>

        ${product.category ? `
          <div class="mb-3">
            <span class="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
              ${this.getCategoryLabel(product.category)}
            </span>
          </div>
        ` : ''}

        <div class="flex space-x-2">
          <button onclick="MarketplaceAdmin.showProductForm(${product.id})"
            class="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 transition text-sm">
            <i class="fas fa-edit mr-1"></i>编辑
          </button>
          <button onclick="MarketplaceAdmin.toggleProductStatus(${product.id}, ${!product.is_active})"
            class="bg-gray-50 text-gray-600 px-3 py-2 rounded hover:bg-gray-100 transition text-sm">
            <i class="fas fa-${product.is_active ? 'eye-slash' : 'eye'} mr-1"></i>
            ${product.is_active ? '禁用' : '启用'}
          </button>
          <button onclick="MarketplaceAdmin.deleteProduct(${product.id})"
            class="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition text-sm">
            <i class="fas fa-trash mr-1"></i>删除
          </button>
        </div>
      </div>
    `;
  },

  // ============================================================
  // Get Category Label
  // ============================================================
  getCategoryLabel(category) {
    const labels = {
      'ai_tools': 'AI工具',
      'templates': '模板',
      'credits': '信用点',
      'general': '通用',
      'business': '商业',
      'technical': '技术',
      'fiction': '小说'
    };
    return labels[category] || category;
  },

  // ============================================================
  // Show Product Form (Create/Edit)
  // ============================================================
  async showProductForm(productId = null) {
    let product = null;
    
    if (productId) {
      product = this.products.find(p => p.id === productId);
      if (!product) {
        showNotification('❌ 产品不存在', 'error');
        return;
      }
    }

    const isEdit = !!product;
    const formTitle = isEdit ? '编辑产品' : '添加产品';

    const formHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
        onclick="if(event.target===this) MarketplaceAdmin.closeProductForm()">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-800">${formTitle}</h3>
            <button onclick="MarketplaceAdmin.closeProductForm()" 
              class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <form id="productForm" class="p-6 space-y-4">
            <!-- Basic Info -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  产品类型 <span class="text-red-500">*</span>
                </label>
                <select name="product_type" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">选择类型</option>
                  <option value="ai_service" ${product?.product_type === 'ai_service' ? 'selected' : ''}>AI 智能服务</option>
                  <option value="book_template" ${product?.product_type === 'book_template' ? 'selected' : ''}>书籍模板</option>
                  <option value="template" ${product?.product_type === 'template' ? 'selected' : ''}>其他模板</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    产品名称（中文） <span class="text-red-500">*</span>
                  </label>
                  <input type="text" name="name" required
                    value="${product?.name || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="输入产品名称">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    产品名称（英文）
                  </label>
                  <input type="text" name="name_en"
                    value="${product?.name_en || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Product Name">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  产品描述（中文）
                </label>
                <textarea name="description" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="输入产品描述">${product?.description || ''}</textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  产品描述（英文）
                </label>
                <textarea name="description_en" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Product Description">${product?.description_en || ''}</textarea>
              </div>
            </div>

            <!-- Pricing -->
            <div class="border-t pt-4 space-y-4">
              <h4 class="font-semibold text-gray-800">定价设置</h4>
              
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    价格（USD）
                  </label>
                  <input type="number" name="price_usd" step="0.01" min="0"
                    value="${product?.price_usd || '0.00'}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    信用点成本
                  </label>
                  <input type="number" name="credits_cost" min="0"
                    value="${product?.credits_cost || '0'}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    排序顺序
                  </label>
                  <input type="number" name="sort_order" min="0"
                    value="${product?.sort_order || '0'}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
              </div>

              <div class="flex items-center space-x-6">
                <label class="flex items-center space-x-2">
                  <input type="checkbox" name="is_free" value="1"
                    ${product?.is_free ? 'checked' : ''}
                    class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                  <span class="text-sm text-gray-700">免费产品</span>
                </label>

                <label class="flex items-center space-x-2">
                  <input type="checkbox" name="is_subscription" value="1"
                    ${product?.is_subscription ? 'checked' : ''}
                    class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                  <span class="text-sm text-gray-700">订阅服务</span>
                </label>
              </div>

              <div id="subscriptionTierDiv" style="display: ${product?.is_subscription ? 'block' : 'none'}">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  订阅等级
                </label>
                <select name="subscription_tier"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">选择等级</option>
                  <option value="premium" ${product?.subscription_tier === 'premium' ? 'selected' : ''}>Premium</option>
                  <option value="super" ${product?.subscription_tier === 'super' ? 'selected' : ''}>Super</option>
                </select>
              </div>
            </div>

            <!-- Categorization -->
            <div class="border-t pt-4 space-y-4">
              <h4 class="font-semibold text-gray-800">分类和标签</h4>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    分类
                  </label>
                  <select name="category"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">选择分类</option>
                    <option value="ai_tools" ${product?.category === 'ai_tools' ? 'selected' : ''}>AI工具</option>
                    <option value="templates" ${product?.category === 'templates' ? 'selected' : ''}>模板</option>
                    <option value="credits" ${product?.category === 'credits' ? 'selected' : ''}>信用点</option>
                    <option value="business" ${product?.category === 'business' ? 'selected' : ''}>商业</option>
                    <option value="technical" ${product?.category === 'technical' ? 'selected' : ''}>技术</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    标签（逗号分隔）
                  </label>
                  <input type="text" name="tags"
                    value="${product?.tags || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ai, writing, template">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    图片 URL
                  </label>
                  <input type="url" name="image_url"
                    value="${product?.image_url || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://...">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    演示 URL
                  </label>
                  <input type="url" name="demo_url"
                    value="${product?.demo_url || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://...">
                </div>
              </div>
            </div>

            <!-- Status -->
            <div class="border-t pt-4 flex items-center space-x-6">
              <label class="flex items-center space-x-2">
                <input type="checkbox" name="is_active" value="1"
                  ${product?.is_active !== false ? 'checked' : ''}
                  class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">启用产品</span>
              </label>

              <label class="flex items-center space-x-2">
                <input type="checkbox" name="is_featured" value="1"
                  ${product?.is_featured ? 'checked' : ''}
                  class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">设为精选</span>
              </label>
            </div>

            <!-- Submit Buttons -->
            <div class="border-t pt-4 flex space-x-3">
              <button type="submit"
                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-save mr-2"></i>${isEdit ? '保存更改' : '创建产品'}
              </button>
              <button type="button" onclick="MarketplaceAdmin.closeProductForm()"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add form to page
    const formContainer = document.createElement('div');
    formContainer.id = 'productFormModal';
    formContainer.innerHTML = formHTML;
    document.body.appendChild(formContainer);

    // Add subscription checkbox handler
    document.querySelector('input[name="is_subscription"]').addEventListener('change', (e) => {
      document.getElementById('subscriptionTierDiv').style.display = e.target.checked ? 'block' : 'none';
    });

    // Add form submit handler
    document.getElementById('productForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProduct(productId, new FormData(e.target));
    });
  },

  // ============================================================
  // Close Product Form
  // ============================================================
  closeProductForm() {
    const modal = document.getElementById('productFormModal');
    if (modal) {
      modal.remove();
    }
  },

  // ============================================================
  // Save Product
  // ============================================================
  async saveProduct(productId, formData) {
    try {
      // Convert FormData to JSON
      const data = {};
      for (const [key, value] of formData.entries()) {
        if (key === 'is_free' || key === 'is_subscription' || key === 'is_active' || key === 'is_featured') {
          data[key] = true;
        } else if (key === 'price_usd' || key === 'credits_cost' || key === 'sort_order') {
          data[key] = parseFloat(value) || 0;
        } else {
          data[key] = value || null;
        }
      }

      // Set false for unchecked checkboxes
      if (!data.is_free) data.is_free = false;
      if (!data.is_subscription) data.is_subscription = false;
      if (!data.is_active) data.is_active = false;
      if (!data.is_featured) data.is_featured = false;

      const url = productId 
        ? `/api/marketplace/products/${productId}`
        : '/api/marketplace/products';
      
      const method = productId ? 'put' : 'post';
      
      const response = await axios[method](url, data);
      
      if (response.data.success) {
        showNotification(`✅ 产品${productId ? '更新' : '创建'}成功`, 'success');
        this.closeProductForm();
        await this.loadProducts();
        this.renderProductList();
      } else {
        showNotification(`❌ ${response.data.error || '操作失败'}`, 'error');
      }
    } catch (error) {
      console.error('[MarketplaceAdmin] Error saving product:', error);
      showNotification(`❌ ${error.response?.data?.error || '保存失败'}`, 'error');
    }
  },

  // ============================================================
  // Toggle Product Status
  // ============================================================
  async toggleProductStatus(productId, newStatus) {
    try {
      const response = await axios.put(`/api/marketplace/products/${productId}`, {
        is_active: newStatus
      });
      
      if (response.data.success) {
        showNotification(`✅ 产品状态已更新`, 'success');
        await this.loadProducts();
        this.renderProductList();
      }
    } catch (error) {
      console.error('[MarketplaceAdmin] Error toggling status:', error);
      showNotification('❌ 更新状态失败', 'error');
    }
  },

  // ============================================================
  // Delete Product
  // ============================================================
  async deleteProduct(productId) {
    if (!confirm('确定要删除此产品吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/marketplace/products/${productId}`);
      
      if (response.data.success) {
        showNotification('✅ 产品已删除', 'success');
        await this.loadProducts();
        this.renderProductList();
      }
    } catch (error) {
      console.error('[MarketplaceAdmin] Error deleting product:', error);
      showNotification('❌ 删除失败', 'error');
    }
  },

  // ============================================================
  // Render Template List (TODO: Implement similar to products)
  // ============================================================
  renderTemplateList() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    container.innerHTML = `
      <div class="mb-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-file-alt mr-2"></i>写作模板管理
          </h2>
          <button onclick="MarketplaceAdmin.showTemplateForm()" 
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus mr-2"></i>添加模板
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${this.templates.map(template => this.renderTemplateCard(template)).join('')}
      </div>

      ${this.templates.length === 0 ? `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-6xl mb-4"></i>
          <p class="text-xl">暂无写作模板</p>
        </div>
      ` : ''}
    `;
  },

  // ============================================================
  // Render Template Card
  // ============================================================
  renderTemplateCard(template) {
    const categoryIcons = {
      'general': 'book',
      'business': 'briefcase',
      'technical': 'code',
      'fiction': 'feather',
      'academic': 'graduation-cap'
    };

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h4 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-${categoryIcons[template.category] || 'book'} mr-2 text-${template.color || 'blue'}-600"></i>
              ${template.name}
            </h4>
            ${template.name_en ? `<p class="text-sm text-gray-500">${template.name_en}</p>` : ''}
          </div>
        </div>

        ${template.description ? `
          <p class="text-gray-600 text-sm mb-3">${template.description}</p>
        ` : ''}

        <div class="flex items-center justify-between mb-3">
          <span class="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
            ${this.getCategoryLabel(template.category)}
          </span>
          <span class="text-sm text-gray-500">
            ${template.field_count || 0} 个字段
          </span>
        </div>

        <div class="flex space-x-2">
          <button onclick="MarketplaceAdmin.showTemplateForm(${template.id})"
            class="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 transition text-sm">
            <i class="fas fa-edit mr-1"></i>编辑
          </button>
          <button onclick="MarketplaceAdmin.manageTemplateFields(${template.id})"
            class="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded hover:bg-green-100 transition text-sm">
            <i class="fas fa-list mr-1"></i>字段
          </button>
        </div>
      </div>
    `;
  },

  // ============================================================
  // Show Template Form
  // ============================================================
  showTemplateForm(templateId = null) {
    showNotification('ℹ️ 模板编辑功能开发中...', 'info');
    // TODO: Implement template form similar to product form
  },

  // ============================================================
  // Manage Template Fields
  // ============================================================
  manageTemplateFields(templateId) {
    showNotification('ℹ️ 字段管理功能开发中...', 'info');
    // TODO: Implement field management interface
  }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('admin-content')) {
    MarketplaceAdmin.init();
  }
});
