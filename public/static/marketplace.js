// ============================================================
// Marketplace - Frontend
// Manhattan Project Phase 1
// ============================================================

const MarketplaceManager = {
  products: [],
  purchases: [],
  credits: null,
  currentProduct: null,
  
  // ============================================================
  // Initialize Marketplace
  // ============================================================
  init() {
    console.log('Marketplace Manager initialized');
  },
  
  // ============================================================
  // Render Marketplace Page
  // ============================================================
  async renderMarketplacePage() {
    const content = `
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-store mr-2 text-purple-600"></i>
                AI产品商城
              </h1>
              <p class="text-gray-600">探索AI写作模板、服务和积分包</p>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600">我的积分</div>
              <div id="credits-balance" class="text-3xl font-bold text-purple-600">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-lg mb-6">
          <div class="flex border-b">
            <button onclick="MarketplaceManager.showTab('products')" 
              id="tab-products"
              class="flex-1 px-6 py-4 text-center font-semibold border-b-2 border-purple-600 text-purple-600">
              <i class="fas fa-shopping-bag mr-2"></i>产品商城
            </button>
            <button onclick="MarketplaceManager.showTab('my-purchases')"
              id="tab-my-purchases"
              class="flex-1 px-6 py-4 text-center font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800">
              <i class="fas fa-history mr-2"></i>我的购买
            </button>
            <button onclick="MarketplaceManager.showTab('credits')"
              id="tab-credits"
              class="flex-1 px-6 py-4 text-center font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800">
              <i class="fas fa-coins mr-2"></i>积分管理
            </button>
          </div>
        </div>
        
        <!-- Tab Content -->
        <div id="tab-content">
          <div class="flex items-center justify-center h-64">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('app').innerHTML = content;
    
    // Load credits balance
    await this.loadCreditsBalance();
    
    // Show products tab by default
    this.showTab('products');
  },
  
  // ============================================================
  // Tab switching
  // ============================================================
  showTab(tabName) {
    // Update tab styles
    ['products', 'my-purchases', 'credits'].forEach(tab => {
      const button = document.getElementById(`tab-${tab}`);
      if (tab === tabName) {
        button.className = 'flex-1 px-6 py-4 text-center font-semibold border-b-2 border-purple-600 text-purple-600';
      } else {
        button.className = 'flex-1 px-6 py-4 text-center font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800';
      }
    });
    
    // Load tab content
    switch(tabName) {
      case 'products':
        this.loadProducts();
        break;
      case 'my-purchases':
        this.loadMyPurchases();
        break;
      case 'credits':
        this.loadCreditsPage();
        break;
    }
  },
  
  // ============================================================
  // Load credits balance
  // ============================================================
  async loadCreditsBalance() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/marketplace/credits/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        this.credits = response.data.credits;
        document.getElementById('credits-balance').innerHTML = `
          <i class="fas fa-coins text-yellow-500"></i>
          ${this.credits.balance.toLocaleString()}
        `;
      }
    } catch (error) {
      console.error('Error loading credits:', error);
      document.getElementById('credits-balance').innerHTML = `
        <span class="text-red-500 text-sm">加载失败</span>
      `;
    }
  },
  
  // ============================================================
  // Load products
  // ============================================================
  async loadProducts() {
    const container = document.getElementById('tab-content');
    container.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/marketplace/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        this.products = response.data.products;
        this.renderProducts();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
          <p class="text-red-700">加载产品失败: ${error.response?.data?.message || error.message}</p>
        </div>
      `;
    }
  },
  
  // ============================================================
  // Render products
  // ============================================================
  renderProducts() {
    const container = document.getElementById('tab-content');
    
    // Group products by type
    const productsByType = {
      'ai_service': [],
      'book_template': [],
      'template': []
    };
    
    this.products.forEach(product => {
      if (productsByType[product.product_type]) {
        productsByType[product.product_type].push(product);
      }
    });
    
    const typeLabels = {
      'ai_service': { title: 'AI服务与积分', icon: 'fa-robot', color: 'purple' },
      'book_template': { title: '书籍模板', icon: 'fa-book', color: 'blue' },
      'template': { title: '其他模板', icon: 'fa-file-alt', color: 'green' }
    };
    
    let html = '';
    
    Object.entries(productsByType).forEach(([type, products]) => {
      if (products.length === 0) return;
      
      const config = typeLabels[type];
      html += `
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas ${config.icon} mr-2 text-${config.color}-600"></i>
            ${config.title}
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${products.map(product => this.renderProductCard(product, config.color)).join('')}
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html || `
      <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <i class="fas fa-shopping-bag text-gray-400 text-5xl mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700">暂无产品</h3>
      </div>
    `;
  },
  
  // ============================================================
  // Render product card
  // ============================================================
  renderProductCard(product, color = 'purple') {
    // Parse metadata
    let metadata = {};
    try {
      metadata = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata || {};
    } catch (e) {
      metadata = {};
    }
    
    const isFree = product.price_usd === 0;
    const isSubscription = product.is_subscription;
    const creditsGrant = metadata.credits || 0;
    const bonusCredits = metadata.bonus || 0;
    
    return `
      <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden">
        ${product.is_featured ? `
        <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-center py-1 text-xs font-semibold">
          <i class="fas fa-star mr-1"></i>热门推荐
        </div>
        ` : ''}
        
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
          <p class="text-gray-600 text-sm mb-4 h-12 line-clamp-2">${product.description || ''}</p>
          
          ${creditsGrant > 0 ? `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-yellow-800 font-semibold">
                  <i class="fas fa-coins mr-1"></i>${creditsGrant.toLocaleString()} 积分
                </div>
                ${bonusCredits > 0 ? `
                <div class="text-yellow-600 text-xs mt-1">
                  <i class="fas fa-gift mr-1"></i>赠送 ${bonusCredits.toLocaleString()} 积分
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="flex items-end justify-between mb-4">
            <div>
              ${isFree ? `
              <div class="text-2xl font-bold text-green-600">免费</div>
              ` : `
              <div class="text-3xl font-bold text-${color}-600">
                $${product.price_usd.toFixed(2)}
              </div>
              ${isSubscription ? `
              <div class="text-xs text-gray-500">包含在订阅中</div>
              ` : ''}
              `}
            </div>
            <div class="text-right text-xs text-gray-500">
              <div><i class="fas fa-shopping-cart mr-1"></i>${product.purchase_count || 0} 次购买</div>
            </div>
          </div>
          
          <button onclick="MarketplaceManager.purchaseProduct(${product.id})" 
            class="w-full bg-${color}-600 text-white px-4 py-3 rounded-lg hover:bg-${color}-700 transition font-semibold">
            ${isFree ? '<i class="fas fa-download mr-2"></i>免费获取' : '<i class="fas fa-shopping-cart mr-2"></i>立即购买'}
          </button>
        </div>
      </div>
    `;
  },
  
  // ============================================================
  // Purchase product
  // ============================================================
  async purchaseProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      alert('产品不存在');
      return;
    }
    
    const isFree = product.price_usd === 0;
    
    if (isFree) {
      // Free product - direct purchase
      if (!confirm(`确定要获取"${product.name}"吗？`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/marketplace/purchase', {
          product_id: productId,
          payment_method: 'credits',
          quantity: 1
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          showNotification('获取成功！', 'success');
          await this.loadCreditsBalance();
          this.loadMyPurchases();
        }
      } catch (error) {
        console.error('Error purchasing product:', error);
        alert('获取失败: ' + (error.response?.data?.message || error.message));
      }
    } else {
      // Paid product - show payment modal
      this.showPaymentModal(product);
    }
  },
  
  // ============================================================
  // Show payment modal
  // ============================================================
  showPaymentModal(product) {
    // Parse metadata
    let metadata = {};
    try {
      metadata = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata || {};
    } catch (e) {
      metadata = {};
    }
    
    const creditsGrant = metadata.credits || 0;
    const bonusCredits = metadata.bonus || 0;
    
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-credit-card mr-2 text-purple-600"></i>购买确认
            </h2>
            <button onclick="document.getElementById('payment-modal').remove()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="font-bold text-gray-800 mb-2">${product.name}</h3>
            <p class="text-sm text-gray-600 mb-3">${product.description || ''}</p>
            
            ${creditsGrant > 0 ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
              <div class="text-yellow-800 font-semibold text-sm">
                <i class="fas fa-coins mr-1"></i>包含 ${creditsGrant.toLocaleString()} 积分
              </div>
              ${bonusCredits > 0 ? `
              <div class="text-yellow-600 text-xs mt-1">
                <i class="fas fa-gift mr-1"></i>额外赠送 ${bonusCredits.toLocaleString()} 积分
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <div class="text-3xl font-bold text-purple-600">
              $${product.price_usd.toFixed(2)} USD
            </div>
          </div>
          
          <div class="mb-6">
            <h4 class="font-semibold text-gray-800 mb-3">选择支付方式</h4>
            <div class="space-y-3">
              <button onclick="MarketplaceManager.payWithPayPal(${product.id})" 
                class="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition">
                <i class="fab fa-paypal mr-2"></i>PayPal 支付
              </button>
              <button onclick="MarketplaceManager.payWithCredits(${product.id})" 
                class="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition">
                <i class="fas fa-coins mr-2"></i>使用积分支付
              </button>
            </div>
          </div>
          
          <div class="text-center text-xs text-gray-500">
            <i class="fas fa-lock mr-1"></i>安全支付，由 PayPal 提供保障
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // ============================================================
  // Pay with PayPal
  // ============================================================
  async payWithPayPal(productId) {
    alert('PayPal支付集成即将推出！\n将使用现有的Shopping Cart系统进行处理。');
    // TODO: Integrate with existing shopping cart and PayPal payment routes
  },
  
  // ============================================================
  // Pay with credits (placeholder)
  // ============================================================
  async payWithCredits(productId) {
    alert('积分支付功能即将推出！');
    // TODO: Implement credits payment
  },
  
  // ============================================================
  // Load my purchases
  // ============================================================
  async loadMyPurchases() {
    const container = document.getElementById('tab-content');
    container.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/marketplace/my-purchases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        this.purchases = response.data.purchases;
        this.renderMyPurchases();
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
          <p class="text-red-700">加载购买记录失败: ${error.response?.data?.message || error.message}</p>
        </div>
      `;
    }
  },
  
  // ============================================================
  // Render my purchases
  // ============================================================
  renderMyPurchases() {
    const container = document.getElementById('tab-content');
    
    if (this.purchases.length === 0) {
      container.innerHTML = `
        <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <i class="fas fa-shopping-bag text-gray-400 text-5xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">还没有购买记录</h3>
          <p class="text-gray-600 mb-4">去商城看看有什么好东西吧</p>
          <button onclick="MarketplaceManager.showTab('products')" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
            <i class="fas fa-store mr-2"></i>浏览商城
          </button>
        </div>
      `;
      return;
    }
    
    const html = `
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">购买时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${this.purchases.map(purchase => {
              const typeLabels = {
                'ai_service': 'AI服务',
                'book_template': '书籍模板',
                'template': '模板'
              };
              
              const statusColors = {
                'completed': 'bg-green-100 text-green-800',
                'pending': 'bg-yellow-100 text-yellow-800',
                'failed': 'bg-red-100 text-red-800'
              };
              
              const statusLabels = {
                'completed': '已完成',
                'pending': '处理中',
                'failed': '失败'
              };
              
              return `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${purchase.product_name}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${typeLabels[purchase.product_type] || purchase.product_type}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${purchase.quantity}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">$${purchase.amount_usd.toFixed(2)}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${new Date(purchase.purchased_at).toLocaleDateString('zh-CN')}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[purchase.status]}">
                      ${statusLabels[purchase.status]}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  // ============================================================
  // Load credits page
  // ============================================================
  async loadCreditsPage() {
    const container = document.getElementById('tab-content');
    container.innerHTML = '<div class="flex items-center justify-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
    
    try {
      const token = localStorage.getItem('token');
      const [balanceResponse, transactionsResponse] = await Promise.all([
        axios.get('/api/marketplace/credits/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('/api/marketplace/credits/transactions?limit=20', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (balanceResponse.data.success && transactionsResponse.data.success) {
        this.credits = balanceResponse.data.credits;
        this.renderCreditsPage(transactionsResponse.data.transactions);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
          <p class="text-red-700">加载积分信息失败: ${error.response?.data?.message || error.message}</p>
        </div>
      `;
    }
  },
  
  // ============================================================
  // Render credits page
  // ============================================================
  renderCreditsPage(transactions) {
    const container = document.getElementById('tab-content');
    
    const html = `
      <div class="space-y-6">
        <!-- Credits Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-coins text-3xl"></i>
              <span class="text-sm font-semibold">当前余额</span>
            </div>
            <div class="text-4xl font-bold">${this.credits.balance.toLocaleString()}</div>
            <div class="text-yellow-100 text-sm mt-2">可用积分</div>
          </div>
          
          <div class="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-plus-circle text-3xl"></i>
              <span class="text-sm font-semibold">累计购买</span>
            </div>
            <div class="text-4xl font-bold">${this.credits.total_purchased.toLocaleString()}</div>
            <div class="text-green-100 text-sm mt-2">历史购买积分</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-chart-line text-3xl"></i>
              <span class="text-sm font-semibold">累计使用</span>
            </div>
            <div class="text-4xl font-bold">${this.credits.total_used.toLocaleString()}</div>
            <div class="text-purple-100 text-sm mt-2">历史使用积分</div>
          </div>
        </div>
        
        <!-- Transaction History -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">
              <i class="fas fa-history mr-2"></i>交易记录
            </h2>
          </div>
          
          ${transactions.length === 0 ? `
          <div class="p-12 text-center">
            <i class="fas fa-inbox text-gray-400 text-5xl mb-4"></i>
            <p class="text-gray-600">暂无交易记录</p>
          </div>
          ` : `
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">变动</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">余额</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${transactions.map(tx => {
                  const typeLabels = {
                    'purchase': '购买',
                    'usage': '使用',
                    'refund': '退款',
                    'bonus': '赠送',
                    'subscription_grant': '订阅赠送'
                  };
                  
                  const typeColors = {
                    'purchase': 'text-green-600',
                    'usage': 'text-red-600',
                    'refund': 'text-blue-600',
                    'bonus': 'text-purple-600',
                    'subscription_grant': 'text-yellow-600'
                  };
                  
                  const typeIcons = {
                    'purchase': 'fa-plus-circle',
                    'usage': 'fa-minus-circle',
                    'refund': 'fa-undo',
                    'bonus': 'fa-gift',
                    'subscription_grant': 'fa-crown'
                  };
                  
                  return `
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <i class="fas ${typeIcons[tx.transaction_type]} ${typeColors[tx.transaction_type]} mr-2"></i>
                          <span class="text-sm font-medium text-gray-900">${typeLabels[tx.transaction_type]}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">${tx.description}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                          ${tx.amount >= 0 ? '+' : ''}${tx.amount.toLocaleString()}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${tx.balance_after.toLocaleString()}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-500">${new Date(tx.created_at).toLocaleString('zh-CN')}</div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          `}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
};

// Export for global use
window.MarketplaceManager = MarketplaceManager;
