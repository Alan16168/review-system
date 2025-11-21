// 智能体商城页面管理
const AgentsPage = {
  currentView: 'marketplace', // marketplace 或 my-agents
  agents: [],
  myAgents: [],

  // 初始化
  async init() {
    await this.loadAgents();
    this.render();
  },

  // 加载智能体列表
  async loadAgents() {
    try {
      const response = await axios.get('/api/agents');
      this.agents = response.data.agents || [];
    } catch (error) {
      console.error('加载智能体列表失败:', error);
      showNotification('加载失败，请稍后重试', 'error');
    }
  },

  // 切换视图
  switchView(view) {
    this.currentView = view;
    this.render();
  },

  // 使用智能体
  useAgent(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      showNotification('智能体不存在', 'error');
      return;
    }

    if (agent.status === 'coming_soon') {
      showNotification('该智能体即将上线，敬请期待！', 'warning');
      return;
    }

    // 根据智能体类型跳转到相应页面
    if (agent.name === 'AI写作') {
      // 跳转到AI写作页面
      window.location.hash = '#ai-books';
    } else {
      showNotification(`正在启动 ${agent.name}...`, 'info');
    }
  },

  // 查看详情
  viewDetails(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;

    // 显示详情模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4">
              <div class="text-5xl">${agent.icon}</div>
              <div>
                <h2 class="text-2xl font-bold text-gray-800">${agent.name}</h2>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-sm text-gray-600">${agent.category}</span>
                  <span class="text-sm text-gray-400">•</span>
                  <div class="flex items-center">
                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                    <span class="text-sm font-medium">${agent.rating}</span>
                  </div>
                  <span class="text-sm text-gray-400">•</span>
                  <span class="text-sm text-gray-600">${agent.usageCount} 次使用</span>
                </div>
              </div>
            </div>
            <button onclick="this.closest('.fixed').remove()" 
              class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">简介</h3>
            <p class="text-gray-600 leading-relaxed">${agent.description}</p>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">主要功能</h3>
            <div class="grid grid-cols-2 gap-3">
              ${agent.features.map(feature => `
                <div class="flex items-center space-x-2 text-gray-700">
                  <i class="fas fa-check-circle text-green-500"></i>
                  <span>${feature}</span>
                </div>
              `).join('')}
            </div>
          </div>

          ${agent.status === 'active' ? `
            <button onclick="AgentsPage.useAgent(${agent.id}); this.closest('.fixed').remove();" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
              <i class="fas fa-play mr-2"></i>开始使用
            </button>
          ` : `
            <button disabled 
              class="w-full bg-gray-300 text-gray-500 py-3 rounded-lg cursor-not-allowed font-medium">
              <i class="fas fa-clock mr-2"></i>即将上线
            </button>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // 渲染智能体卡片
  renderAgentCard(agent) {
    const statusBadge = agent.status === 'active' 
      ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">可用</span>'
      : '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">即将上线</span>';

    return `
      <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="text-4xl group-hover:scale-110 transition-transform duration-300">
              ${agent.icon}
            </div>
            ${statusBadge}
          </div>
          
          <h3 class="text-xl font-bold text-gray-800 mb-2">${agent.name}</h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-2 h-10">${agent.description}</p>
          
          <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span class="flex items-center">
              <i class="fas fa-tag mr-1"></i>
              ${agent.category}
            </span>
            <span class="flex items-center">
              <i class="fas fa-users mr-1"></i>
              ${agent.usageCount}
            </span>
          </div>

          <div class="flex items-center space-x-2 mb-4">
            ${agent.features.slice(0, 3).map(feature => `
              <span class="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                ${feature}
              </span>
            `).join('')}
          </div>

          <div class="flex space-x-2">
            <button onclick="AgentsPage.viewDetails(${agent.id})" 
              class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
              <i class="fas fa-info-circle mr-1"></i>详情
            </button>
            ${agent.status === 'active' ? `
              <button onclick="AgentsPage.useAgent(${agent.id})" 
                class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                <i class="fas fa-play mr-1"></i>使用
              </button>
            ` : `
              <button disabled 
                class="flex-1 bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed text-sm font-medium">
                即将上线
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  // 渲染页面
  render() {
    const app = document.getElementById('app');
    
    // 分类智能体
    const activeAgents = this.agents.filter(a => a.status === 'active');
    const comingSoonAgents = this.agents.filter(a => a.status === 'coming_soon');
    const categories = [...new Set(this.agents.map(a => a.category))];

    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <!-- 导航栏 -->
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-8">
                <a href="#" onclick="window.location.reload()" class="text-xl font-bold text-blue-600">
                  <i class="fas fa-robot mr-2"></i>系统复盘平台
                </a>
                <div class="flex space-x-4">
                  <button onclick="AgentsPage.switchView('marketplace')"
                    class="px-3 py-2 text-sm font-medium ${this.currentView === 'marketplace' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}">
                    <i class="fas fa-store mr-2"></i>商城
                  </button>
                  <button onclick="AgentsPage.switchView('my-agents')"
                    class="px-3 py-2 text-sm font-medium ${this.currentView === 'my-agents' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}">
                    <i class="fas fa-robot mr-2"></i>我的智能体
                  </button>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <button onclick="window.location.hash='#dashboard'" 
                  class="text-gray-600 hover:text-gray-900">
                  <i class="fas fa-home mr-2"></i>返回首页
                </button>
              </div>
            </div>
          </div>
        </nav>

        <!-- 主要内容 -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          ${this.currentView === 'marketplace' ? `
            <!-- 商城视图 -->
            <div class="mb-8">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-store mr-2"></i>智能体商城
                  </h1>
                  <p class="text-gray-600">探索各种AI智能体，提升您的工作效率</p>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-sm text-gray-600">
                    共 <span class="font-bold text-blue-600">${this.agents.length}</span> 个智能体
                  </div>
                </div>
              </div>

              <!-- 分类标签 -->
              <div class="flex flex-wrap gap-2 mb-6">
                <button class="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                  全部
                </button>
                ${categories.map(cat => `
                  <button class="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100">
                    ${cat}
                  </button>
                `).join('')}
              </div>

              <!-- 推荐智能体 -->
              ${activeAgents.length > 0 ? `
                <div class="mb-12">
                  <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-star text-yellow-400 mr-2"></i>热门推荐
                  </h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${activeAgents.map(agent => this.renderAgentCard(agent)).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- 即将上线 -->
              ${comingSoonAgents.length > 0 ? `
                <div class="mb-12">
                  <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-clock text-yellow-500 mr-2"></i>即将上线
                  </h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${comingSoonAgents.map(agent => this.renderAgentCard(agent)).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : `
            <!-- 我的智能体视图 -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-800 mb-6">
                <i class="fas fa-robot mr-2"></i>我的智能体
              </h1>

              ${this.myAgents.length === 0 ? `
                <div class="bg-white rounded-lg shadow-md p-12 text-center">
                  <div class="text-6xl mb-4">🤖</div>
                  <h2 class="text-2xl font-bold text-gray-800 mb-2">noAgents</h2>
                  <p class="text-gray-600 mb-6">您还没有使用任何智能体</p>
                  <button onclick="AgentsPage.switchView('marketplace')" 
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium">
                    <i class="fas fa-store mr-2"></i>前往商城
                  </button>
                </div>
              ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${this.myAgents.map(agent => this.renderAgentCard(agent)).join('')}
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    `;
  }
};

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);
