// 智能体页面管理 - 我的智能体
const AgentsPage = {
  myAgents: [],

  // 初始化 - 直接显示我的智能体（AI写作）
  async init() {
    // 设置已购买的智能体 - AI写作
    this.myAgents = [
      {
        id: 1,
        name: 'AI写作',
        icon: '✍️',
        description: '智能AI写作助手，支持多种文体创作，包括文章、博客、营销文案、社交媒体内容等。提供专业的写作建议和内容优化。',
        category: '内容创作',
        features: ['智能生成', '多种模板', '内容优化', '实时预览'],
        status: 'owned', // 已拥有
        purchaseDate: '2025-11-21',
        usageCount: 1234,
        rating: 4.8
      }
    ];
    this.render();
  },

  // 使用智能体
  useAgent(agentId) {
    const agent = this.myAgents.find(a => a.id === agentId);
    if (!agent) {
      showNotification('智能体不存在', 'error');
      return;
    }

    // 根据智能体类型跳转到相应页面
    if (agent.name === 'AI写作') {
      // 跳转到AI写作页面
      AIBooksManager.renderBooksPage();
    } else {
      showNotification(`正在启动 ${agent.name}...`, 'info');
    }
  },

  // 渲染智能体产品卡片 - 类似MarketPlace风格
  renderAgentProductCard(agent) {
    return `
      <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
        <!-- 产品头部 -->
        <div class="relative">
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center">
            <div class="text-6xl mb-2">${agent.icon}</div>
            <span class="inline-block px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              已购买
            </span>
          </div>
        </div>

        <!-- 产品信息 -->
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${agent.name}</h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-3">${agent.description}</p>
          
          <!-- 分类和评分 -->
          <div class="flex items-center justify-between text-sm mb-4 pb-4 border-b">
            <span class="flex items-center text-gray-600">
              <i class="fas fa-tag mr-2 text-indigo-600"></i>
              ${agent.category}
            </span>
            <div class="flex items-center">
              <i class="fas fa-star text-yellow-400 mr-1"></i>
              <span class="font-medium text-gray-700">${agent.rating}</span>
            </div>
          </div>

          <!-- 功能特性 -->
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              ${agent.features.map(feature => `
                <span class="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">
                  ${feature}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b">
            <span class="flex items-center">
              <i class="fas fa-calendar mr-1"></i>
              购买日期: ${agent.purchaseDate}
            </span>
            <span class="flex items-center">
              <i class="fas fa-chart-line mr-1"></i>
              使用 ${agent.usageCount} 次
            </span>
          </div>

          <!-- 使用按钮 -->
          <button onclick="AgentsPage.useAgent(${agent.id})" 
            class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md hover:shadow-lg">
            <i class="fas fa-play mr-2"></i>使用
          </button>
        </div>
      </div>
    `;
  },

  // 渲染页面
  render() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}

        <!-- 主要内容 -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <!-- 页面标题 -->
            <div class="mb-6">
              <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-robot mr-2 text-indigo-600"></i>我的智能体
              </h1>
              <p class="text-gray-600">管理您已购买的AI智能体，随时启动使用</p>
            </div>

            ${this.myAgents.length === 0 ? `
              <!-- 空状态 -->
              <div class="bg-white rounded-lg shadow-md p-12 text-center">
                <div class="text-6xl mb-4">🤖</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">暂无智能体</h2>
                <p class="text-gray-600 mb-6">您还没有购买任何智能体</p>
                <button onclick="MarketplaceManager.renderMarketplacePage()" 
                  class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
                  <i class="fas fa-store mr-2"></i>前往商城
                </button>
              </div>
            ` : `
              <!-- 智能体列表 -->
              <div class="mb-4 flex items-center justify-between">
                <div class="text-sm text-gray-600">
                  共 <span class="font-bold text-indigo-600">${this.myAgents.length}</span> 个智能体
                </div>
                <button onclick="MarketplaceManager.renderMarketplacePage()" 
                  class="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  <i class="fas fa-plus-circle mr-1"></i>购买更多
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.myAgents.map(agent => this.renderAgentProductCard(agent)).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
};

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);
