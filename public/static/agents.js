// 智能体页面管理 - 我的智能体
const AgentsPage = {
  myAgents: [],

  // 初始化 - 从API加载我的智能体
  async init() {
    try {
      // 从API获取购买的智能体
      const response = await fetch('/api/marketplace/my-agents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      
      if (data.success && data.agents) {
        // 转换API数据为前端格式
        this.myAgents = data.agents.map(agent => ({
          id: agent.product_id,
          name: agent.product_name,
          icon: '🤖', // 默认图标，可以根据产品类型设置
          description: agent.description || '暂无描述',
          category: 'AI工具',
          features: this.parseFeatures(agent.features_json),
          status: 'owned',
          purchaseDate: agent.purchase_date ? agent.purchase_date.split(' ')[0] : '未知',
          usageCount: 0, // 可以后续从统计API获取
          rating: 4.8, // 可以后续从评分API获取
          image_url: agent.image_url
        }));
      } else {
        this.myAgents = [];
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      showNotification('加载智能体失败', 'error');
      this.myAgents = [];
    }
    
    this.render();
  },

  // 解析功能特性JSON
  parseFeatures(featuresJson) {
    if (!featuresJson) return ['智能AI', '高效便捷'];
    
    try {
      const features = JSON.parse(featuresJson);
      if (Array.isArray(features)) {
        return features;
      }
      return ['智能AI', '高效便捷'];
    } catch (e) {
      return ['智能AI', '高效便捷'];
    }
  },

  // 使用智能体
  useAgent(agentId) {
    const agent = this.myAgents.find(a => a.id == agentId);
    if (!agent) {
      showNotification('智能体不存在', 'error');
      return;
    }

    // 根据智能体名称跳转到相应页面
    if (agent.name.includes('AI写作') || agent.name.includes('写作助手')) {
      // 跳转到AI写作页面
      AIBooksManager.renderBooksPage();
    } else if (agent.name.includes('文件处理') || agent.name.includes('文件助手')) {
      // 文件处理智能体
      showNotification(`${agent.name} 功能开发中...`, 'info');
    } else {
      // 其他智能体
      showNotification(`正在启动 ${agent.name}...`, 'info');
      // TODO: 根据产品ID跳转到对应功能页面
    }
  },

  // 渲染智能体产品卡片 - 类似MarketPlace风格
  renderAgentProductCard(agent) {
    return `
      <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
        <!-- 产品头部 -->
        <div class="relative">
          ${agent.image_url ? `
            <div class="h-48 overflow-hidden">
              <img src="${agent.image_url}" alt="${agent.name}" class="w-full h-full object-cover">
            </div>
          ` : `
            <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center h-48 flex items-center justify-center">
              <div class="text-6xl">${agent.icon}</div>
            </div>
          `}
          <span class="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
            已购买
          </span>
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
