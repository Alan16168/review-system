// Mobile App V8.6.1 - 移动端专属应用
// 包含 V8.5.0-V8.6.1 的所有最新功能

// ==================== 全局变量 ====================
let currentUser = null;
let currentTeam = null;
let currentReview = null;
let currentView = 'home'; // home, reviews, teams, profile
let allReviews = [];
let allTeams = [];
let refreshing = false;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeMobileApp();
});

async function initializeMobileApp() {
  console.log('Initializing Mobile App V8.6.1');
  
  // 检查登录状态
  await checkAuthStatus();
  
  // 设置底部导航
  setupBottomNavigation();
  
  // 设置下拉刷新
  setupPullToRefresh();
  
  // 显示首页
  showHomeView();
  
  // 添加返回按钮处理
  setupBackButton();
}

// ==================== 认证相关 ====================
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showLoginView();
    return false;
  }
  
  try {
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    currentUser = response.data.user;
    updateUserProfile();
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    showLoginView();
    return false;
  }
}

async function handleLogin() {
  const username = document.getElementById('mobile-username').value.trim();
  const password = document.getElementById('mobile-password').value.trim();
  
  if (!username || !password) {
    showToast('请输入用户名和密码', 'error');
    return;
  }
  
  try {
    const response = await axios.post('/api/auth/login', { username, password });
    
    localStorage.setItem('token', response.data.token);
    currentUser = response.data.user;
    
    showToast('登录成功！', 'success');
    
    // 延迟一下再跳转，让用户看到成功消息
    setTimeout(() => {
      updateUserProfile();
      showHomeView();
    }, 500);
    
  } catch (error) {
    console.error('Login failed:', error);
    showToast(error.response?.data?.error || '登录失败', 'error');
  }
}

async function handleLogout() {
  if (!confirm('确定要退出登录吗？')) {
    return;
  }
  
  localStorage.removeItem('token');
  currentUser = null;
  currentTeam = null;
  showToast('已退出登录', 'success');
  showLoginView();
}

function updateUserProfile() {
  if (!currentUser) return;
  
  const profileTab = document.getElementById('profile-content');
  if (profileTab) {
    profileTab.innerHTML = `
      <div class="mobile-profile-header">
        <div class="mobile-avatar">
          ${currentUser.username.charAt(0).toUpperCase()}
        </div>
        <div class="mobile-profile-info">
          <div class="mobile-profile-name">${escapeHtml(currentUser.username)}</div>
          <div class="mobile-profile-role">${currentUser.role === 'admin' ? '管理员' : '用户'}</div>
        </div>
      </div>
      
      <div class="mobile-menu-section">
        <div class="mobile-menu-title">我的数据</div>
        <div class="mobile-menu-item" onclick="showMyReviews()">
          <i class="fas fa-file-alt"></i>
          <span>我的审查</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-menu-item" onclick="showFamousBooksReviews()">
          <i class="fas fa-book"></i>
          <span>名著分析</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-menu-item" onclick="showDocumentAnalysis()">
          <i class="fas fa-file-pdf"></i>
          <span>文档分析</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
      
      <div class="mobile-menu-section">
        <div class="mobile-menu-title">团队管理</div>
        <div class="mobile-menu-item" onclick="showMyTeams()">
          <i class="fas fa-users"></i>
          <span>我的团队</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
      
      <div class="mobile-menu-section">
        <div class="mobile-menu-title">设置</div>
        <div class="mobile-menu-item" onclick="handleLogout()">
          <i class="fas fa-sign-out-alt"></i>
          <span>退出登录</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
  }
}

// ==================== 视图切换 ====================
function showLoginView() {
  const app = document.getElementById('mobile-app');
  app.innerHTML = `
    <div class="mobile-login-container">
      <div class="mobile-login-header">
        <div class="mobile-app-logo">📝</div>
        <h1 class="mobile-app-title">审查系统</h1>
        <p class="mobile-app-subtitle">移动端 V8.6.1</p>
      </div>
      
      <div class="mobile-login-form">
        <div class="mobile-input-group">
          <i class="fas fa-user"></i>
          <input type="text" id="mobile-username" placeholder="用户名" />
        </div>
        
        <div class="mobile-input-group">
          <i class="fas fa-lock"></i>
          <input type="password" id="mobile-password" placeholder="密码" />
        </div>
        
        <button class="mobile-btn-primary mobile-btn-block" onclick="handleLogin()">
          <i class="fas fa-sign-in-alt"></i>
          登录
        </button>
        
        <div class="mobile-login-tips">
          <p>💡 使用您的账号登录</p>
        </div>
      </div>
    </div>
  `;
  
  // 回车登录
  document.getElementById('mobile-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
}

function showHomeView() {
  currentView = 'home';
  updateBottomNavigation();
  
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-home-header">
      <h1>欢迎回来</h1>
      <p>${currentUser ? escapeHtml(currentUser.username) : '游客'}</p>
    </div>
    
    <div class="mobile-quick-actions">
      <div class="mobile-quick-action" onclick="showCreateReview()">
        <div class="mobile-quick-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-plus"></i>
        </div>
        <span>新建审查</span>
      </div>
      
      <div class="mobile-quick-action" onclick="showFamousBooksReviews()">
        <div class="mobile-quick-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-book"></i>
        </div>
        <span>名著分析</span>
      </div>
      
      <div class="mobile-quick-action" onclick="showDocumentAnalysis()">
        <div class="mobile-quick-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-file-pdf"></i>
        </div>
        <span>文档分析</span>
      </div>
      
      <div class="mobile-quick-action" onclick="showMyTeams()">
        <div class="mobile-quick-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <i class="fas fa-users"></i>
        </div>
        <span>团队管理</span>
      </div>
    </div>
    
    <div class="mobile-section">
      <div class="mobile-section-header">
        <h2>最近审查</h2>
        <a onclick="showMyReviews()">查看全部</a>
      </div>
      <div id="recent-reviews-list"></div>
    </div>
  `;
  
  loadRecentReviews();
}

async function loadRecentReviews() {
  try {
    const response = await axios.get('/api/reviews', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    const reviews = response.data.slice(0, 5); // 只显示最近5条
    const container = document.getElementById('recent-reviews-list');
    
    if (reviews.length === 0) {
      container.innerHTML = '<div class="mobile-empty-state"><p>暂无审查记录</p></div>';
      return;
    }
    
    container.innerHTML = reviews.map(review => `
      <div class="mobile-card" onclick="showReviewDetail(${review.id})">
        <div class="mobile-card-header">
          <h3>${escapeHtml(review.title)}</h3>
          <span class="mobile-badge ${getStatusClass(review.status)}">${getStatusText(review.status)}</span>
        </div>
        <div class="mobile-card-meta">
          <span><i class="far fa-calendar"></i> ${formatDate(review.created_at)}</span>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load recent reviews failed:', error);
  }
}

// ==================== 审查列表视图 ====================
async function showMyReviews() {
  currentView = 'reviews';
  updateBottomNavigation();
  
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-page-header">
      <button class="mobile-back-btn" onclick="showHomeView()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>我的审查</h1>
      <button class="mobile-icon-btn" onclick="showCreateReview()">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    
    <div class="mobile-filter-tabs">
      <button class="mobile-filter-tab active" data-filter="all" onclick="filterReviews('all')">全部</button>
      <button class="mobile-filter-tab" data-filter="pending" onclick="filterReviews('pending')">待审查</button>
      <button class="mobile-filter-tab" data-filter="approved" onclick="filterReviews('approved')">已通过</button>
      <button class="mobile-filter-tab" data-filter="rejected" onclick="filterReviews('rejected')">已拒绝</button>
    </div>
    
    <div id="reviews-list" class="mobile-list"></div>
  `;
  
  loadAllReviews();
}

async function loadAllReviews() {
  showLoading();
  
  try {
    const response = await axios.get('/api/reviews', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    allReviews = response.data;
    displayReviews(allReviews);
    
  } catch (error) {
    console.error('Load reviews failed:', error);
    showToast('加载失败', 'error');
  } finally {
    hideLoading();
  }
}

function displayReviews(reviews) {
  const container = document.getElementById('reviews-list');
  
  if (reviews.length === 0) {
    container.innerHTML = '<div class="mobile-empty-state"><p>暂无审查记录</p></div>';
    return;
  }
  
  container.innerHTML = reviews.map(review => `
    <div class="mobile-card" onclick="showReviewDetail(${review.id})">
      <div class="mobile-card-header">
        <h3>${escapeHtml(review.title)}</h3>
        <span class="mobile-badge ${getStatusClass(review.status)}">${getStatusText(review.status)}</span>
      </div>
      <p class="mobile-card-description">${escapeHtml(review.description || '无描述')}</p>
      <div class="mobile-card-meta">
        <span><i class="far fa-calendar"></i> ${formatDate(review.created_at)}</span>
        <span><i class="far fa-user"></i> ${escapeHtml(review.creator_name || '未知')}</span>
      </div>
    </div>
  `).join('');
}

function filterReviews(status) {
  // 更新选中状态
  document.querySelectorAll('.mobile-filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // 过滤审查
  if (status === 'all') {
    displayReviews(allReviews);
  } else {
    const filtered = allReviews.filter(r => r.status === status);
    displayReviews(filtered);
  }
}

// ==================== 名著分析 (V8.5.0-V8.6.1) ====================
async function showFamousBooksReviews() {
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-page-header">
      <button class="mobile-back-btn" onclick="showHomeView()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>名著分析</h1>
      <button class="mobile-icon-btn" onclick="showCreateFamousBook()">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    
    <div id="famous-books-list" class="mobile-list"></div>
  `;
  
  loadFamousBooksReviews();
}

async function loadFamousBooksReviews() {
  showLoading();
  
  try {
    const response = await axios.get('/api/reviews/famous-books', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    const reviews = response.data;
    const container = document.getElementById('famous-books-list');
    
    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty-state">
          <i class="fas fa-book" style="font-size: 48px; opacity: 0.3;"></i>
          <p>暂无名著分析</p>
          <button class="mobile-btn-primary" onclick="showCreateFamousBook()">
            <i class="fas fa-plus"></i> 创建分析
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = reviews.map(review => `
      <div class="mobile-card" onclick="showFamousBookDetail(${review.id})">
        <div class="mobile-card-header">
          <h3>${escapeHtml(review.title)}</h3>
        </div>
        ${review.ai_analysis ? `
          <p class="mobile-card-description">${escapeHtml(review.ai_analysis.substring(0, 100))}...</p>
        ` : ''}
        <div class="mobile-card-meta">
          <span><i class="far fa-calendar"></i> ${formatDate(review.created_at)}</span>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load famous books failed:', error);
    showToast('加载失败', 'error');
  } finally {
    hideLoading();
  }
}

function showCreateFamousBook() {
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-page-header">
      <button class="mobile-back-btn" onclick="showFamousBooksReviews()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>创建名著分析</h1>
    </div>
    
    <div class="mobile-form">
      <div class="mobile-form-section">
        <label class="mobile-form-label">输入类型</label>
        <div class="mobile-segmented-control">
          <button class="mobile-segment active" data-type="text" onclick="switchInputType('text')">文本</button>
          <button class="mobile-segment" data-type="video" onclick="switchInputType('video')">视频</button>
          <button class="mobile-segment" data-type="pdf" onclick="switchInputType('pdf')">PDF</button>
        </div>
      </div>
      
      <div id="input-section-text" class="mobile-form-section">
        <label class="mobile-form-label">文本内容</label>
        <textarea id="famous-book-text" rows="8" placeholder="粘贴文本内容..."></textarea>
      </div>
      
      <div id="input-section-video" class="mobile-form-section" style="display: none;">
        <label class="mobile-form-label">YouTube视频链接</label>
        <input type="url" id="famous-book-video" placeholder="https://youtube.com/watch?v=..." />
        <p class="mobile-form-hint">💡 系统会自动提取字幕并预览</p>
      </div>
      
      <div id="input-section-pdf" class="mobile-form-section" style="display: none;">
        <label class="mobile-form-label">上传PDF文件</label>
        <input type="file" id="famous-book-pdf" accept=".pdf" />
      </div>
      
      <div class="mobile-form-section">
        <label class="mobile-form-label">分析提示（可选）</label>
        <input type="text" id="famous-book-prompt" placeholder="例如：分析主题思想和人物性格" />
      </div>
      
      <div class="mobile-form-section">
        <label class="mobile-form-label">输出语言</label>
        <select id="famous-book-language">
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁体中文</option>
          <option value="en">English</option>
        </select>
      </div>
      
      <div class="mobile-form-actions">
        <button class="mobile-btn-secondary" onclick="showFamousBooksReviews()">取消</button>
        <button class="mobile-btn-primary" onclick="submitFamousBookAnalysis()">
          <i class="fas fa-magic"></i> 开始分析
        </button>
      </div>
    </div>
  `;
}

function switchInputType(type) {
  // 更新按钮状态
  document.querySelectorAll('.mobile-segment').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // 显示对应输入区域
  document.getElementById('input-section-text').style.display = type === 'text' ? 'block' : 'none';
  document.getElementById('input-section-video').style.display = type === 'video' ? 'block' : 'none';
  document.getElementById('input-section-pdf').style.display = type === 'pdf' ? 'block' : 'none';
}

async function submitFamousBookAnalysis() {
  const activeType = document.querySelector('.mobile-segment.active').dataset.type;
  const prompt = document.getElementById('famous-book-prompt').value.trim();
  const language = document.getElementById('famous-book-language').value;
  
  let content = '';
  
  if (activeType === 'text') {
    content = document.getElementById('famous-book-text').value.trim();
  } else if (activeType === 'video') {
    content = document.getElementById('famous-book-video').value.trim();
  } else if (activeType === 'pdf') {
    const fileInput = document.getElementById('famous-book-pdf');
    if (!fileInput.files || !fileInput.files[0]) {
      showToast('请选择PDF文件', 'error');
      return;
    }
    // PDF上传需要额外处理
    showToast('PDF上传功能开发中', 'info');
    return;
  }
  
  if (!content) {
    showToast('请输入内容', 'error');
    return;
  }
  
  // V8.6.0: 如果是视频，先获取字幕预览
  if (activeType === 'video' && (content.includes('youtube.com') || content.includes('youtu.be'))) {
    await getVideoTranscriptPreview(content, prompt, language);
    return;
  }
  
  // 直接分析
  await performAnalysis(activeType, content, prompt, language);
}

// V8.6.0: 字幕预览功能
async function getVideoTranscriptPreview(videoUrl, prompt, language) {
  showLoading('正在获取视频字幕...');
  
  try {
    const response = await axios.post('/api/reviews/famous-books/get-transcript', {
      content: videoUrl
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    const data = response.data;
    
    if (!data.hasTranscript) {
      showToast('无法获取视频字幕', 'error');
      return;
    }
    
    // 显示字幕预览
    showTranscriptPreview(data, videoUrl, prompt, language);
    
  } catch (error) {
    console.error('Get transcript failed:', error);
    showToast(error.response?.data?.error || '获取字幕失败', 'error');
  } finally {
    hideLoading();
  }
}

function showTranscriptPreview(data, videoUrl, prompt, language) {
  const { transcript, transcriptLanguage, transcriptLength, videoMetadata } = data;
  
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-page-header">
      <button class="mobile-back-btn" onclick="showCreateFamousBook()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>字幕预览</h1>
    </div>
    
    <div class="mobile-form">
      ${videoMetadata ? `
        <div class="mobile-video-info">
          <h3>${escapeHtml(videoMetadata.title)}</h3>
          <div class="mobile-video-meta">
            <span><i class="fas fa-user"></i> ${escapeHtml(videoMetadata.channelTitle)}</span>
            <span><i class="fas fa-clock"></i> ${escapeHtml(videoMetadata.duration)}</span>
          </div>
        </div>
      ` : ''}
      
      <div class="mobile-transcript-info">
        <span><i class="fas fa-language"></i> ${getLanguageName(transcriptLanguage)}</span>
        <span><i class="fas fa-file-alt"></i> ${transcriptLength.toLocaleString()} 字</span>
      </div>
      
      <div class="mobile-form-section">
        <label class="mobile-form-label">字幕内容</label>
        <textarea readonly rows="12">${escapeHtml(transcript.substring(0, 5000))}${transcript.length > 5000 ? '\n\n...(内容过长，已截断)' : ''}</textarea>
      </div>
      
      <div class="mobile-form-actions">
        <button class="mobile-btn-secondary" onclick="showCreateFamousBook()">返回修改</button>
        <button class="mobile-btn-primary" onclick="continueWithAnalysis('video', '${videoUrl.replace(/'/g, "\\'")}', '${prompt.replace(/'/g, "\\'")}', '${language}')">
          <i class="fas fa-magic"></i> 确认并分析
        </button>
      </div>
    </div>
  `;
}

async function continueWithAnalysis(inputType, content, prompt, language) {
  await performAnalysis(inputType, content, prompt, language);
}

// V8.5.0-V8.5.1: 多层AI服务分析
async function performAnalysis(inputType, content, prompt, language) {
  showLoading('AI分析中，请稍候...');
  
  try {
    const response = await axios.post('/api/reviews/famous-books/analyze', {
      inputType,
      content,
      prompt,
      language
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    const result = response.data;
    
    // 显示分析结果
    showAnalysisResult(result);
    
    showToast(`分析完成！使用了 ${result.source || 'AI'} 服务`, 'success');
    
  } catch (error) {
    console.error('Analysis failed:', error);
    
    const errorData = error.response?.data;
    let errorMessage = errorData?.error || '分析失败';
    
    // V8.5.0: 显示详细错误信息
    if (errorData?.errors && errorData.errors.length > 0) {
      errorMessage += '\n\n错误详情：\n' + errorData.errors.join('\n');
    }
    
    showToast(errorMessage, 'error');
  } finally {
    hideLoading();
  }
}

function showAnalysisResult(result) {
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-page-header">
      <button class="mobile-back-btn" onclick="showFamousBooksReviews()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>分析结果</h1>
      <button class="mobile-icon-btn" onclick="shareAnalysis()">
        <i class="fas fa-share-alt"></i>
      </button>
    </div>
    
    <div class="mobile-result-container">
      <div class="mobile-result-header">
        <div class="mobile-result-badge">
          <i class="fas fa-check-circle"></i> 分析完成
        </div>
        <div class="mobile-result-source">
          使用服务: ${result.source || 'AI'}
        </div>
      </div>
      
      <div class="mobile-result-content">
        ${result.result ? formatAnalysisText(result.result) : '<p>暂无分析结果</p>'}
      </div>
      
      <div class="mobile-form-actions">
        <button class="mobile-btn-secondary" onclick="showCreateFamousBook()">
          <i class="fas fa-redo"></i> 重新分析
        </button>
        <button class="mobile-btn-primary" onclick="showFamousBooksReviews()">
          <i class="fas fa-check"></i> 完成
        </button>
      </div>
    </div>
  `;
}

// ==================== 底部导航 ====================
function setupBottomNavigation() {
  const nav = document.getElementById('mobile-bottom-nav');
  if (!nav) return;
  
  nav.innerHTML = `
    <button class="mobile-nav-item active" data-view="home" onclick="showHomeView()">
      <i class="fas fa-home"></i>
      <span>首页</span>
    </button>
    <button class="mobile-nav-item" data-view="reviews" onclick="showMyReviews()">
      <i class="fas fa-file-alt"></i>
      <span>审查</span>
    </button>
    <button class="mobile-nav-item" data-view="teams" onclick="showMyTeams()">
      <i class="fas fa-users"></i>
      <span>团队</span>
    </button>
    <button class="mobile-nav-item" data-view="profile" onclick="showProfileView()">
      <i class="fas fa-user"></i>
      <span>我的</span>
    </button>
  `;
}

function updateBottomNavigation() {
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.view === currentView) {
      item.classList.add('active');
    }
  });
}

function showProfileView() {
  currentView = 'profile';
  updateBottomNavigation();
  
  const content = document.getElementById('mobile-content');
  content.innerHTML = '<div id="profile-content"></div>';
  
  updateUserProfile();
}

async function showMyTeams() {
  currentView = 'teams';
  updateBottomNavigation();
  
  const content = document.getElementById('mobile-content');
  content.innerHTML = `
    <div class="mobile-page-header">
      <h1>我的团队</h1>
      <button class="mobile-icon-btn" onclick="showCreateTeam()">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <div id="teams-list" class="mobile-list"></div>
  `;
  
  loadTeams();
}

async function loadTeams() {
  showLoading();
  
  try {
    const response = await axios.get('/api/teams', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    allTeams = response.data;
    const container = document.getElementById('teams-list');
    
    if (allTeams.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty-state">
          <i class="fas fa-users" style="font-size: 48px; opacity: 0.3;"></i>
          <p>暂无团队</p>
          <button class="mobile-btn-primary" onclick="showCreateTeam()">
            <i class="fas fa-plus"></i> 创建团队
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = allTeams.map(team => `
      <div class="mobile-card" onclick="showTeamDetail(${team.id})">
        <div class="mobile-card-header">
          <h3>${escapeHtml(team.name)}</h3>
        </div>
        <p class="mobile-card-description">${escapeHtml(team.description || '无描述')}</p>
        <div class="mobile-card-meta">
          <span><i class="fas fa-user"></i> ${escapeHtml(team.creator_name || '未知')}</span>
          <span><i class="fas fa-users"></i> ${team.member_count || 0} 成员</span>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load teams failed:', error);
    showToast('加载失败', 'error');
  } finally {
    hideLoading();
  }
}

// ==================== 下拉刷新 ====================
function setupPullToRefresh() {
  let startY = 0;
  let pullDistance = 0;
  const threshold = 80;
  
  const content = document.getElementById('mobile-content');
  
  content.addEventListener('touchstart', (e) => {
    if (content.scrollTop === 0 && !refreshing) {
      startY = e.touches[0].pageY;
    }
  });
  
  content.addEventListener('touchmove', (e) => {
    if (startY === 0 || refreshing) return;
    
    pullDistance = e.touches[0].pageY - startY;
    
    if (pullDistance > 0 && content.scrollTop === 0) {
      e.preventDefault();
      
      // 添加视觉反馈
      if (pullDistance > threshold) {
        content.style.transform = `translateY(${Math.min(pullDistance * 0.5, 100)}px)`;
      }
    }
  });
  
  content.addEventListener('touchend', async () => {
    if (pullDistance > threshold && !refreshing) {
      refreshing = true;
      await refreshCurrentView();
    }
    
    content.style.transform = '';
    startY = 0;
    pullDistance = 0;
    refreshing = false;
  });
}

async function refreshCurrentView() {
  showToast('刷新中...', 'info');
  
  if (currentView === 'home') {
    await loadRecentReviews();
  } else if (currentView === 'reviews') {
    await loadAllReviews();
  } else if (currentView === 'teams') {
    await loadTeams();
  }
  
  showToast('刷新完成', 'success');
}

// ==================== 返回按钮处理 ====================
function setupBackButton() {
  // 监听浏览器返回
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      currentView = e.state.view;
      updateBottomNavigation();
    }
  });
  
  // 保存状态
  history.pushState({ view: 'home' }, '', '');
}

// ==================== 工具函数 ====================
function showLoading(message = '加载中...') {
  const loading = document.getElementById('mobile-loading');
  if (loading) {
    loading.querySelector('.mobile-loading-text').textContent = message;
    loading.classList.add('show');
  }
}

function hideLoading() {
  const loading = document.getElementById('mobile-loading');
  if (loading) {
    loading.classList.remove('show');
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `mobile-toast mobile-toast-${type}`;
  
  const icon = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  }[type] || 'info-circle';
  
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

function getStatusClass(status) {
  const classes = {
    pending: 'mobile-badge-warning',
    approved: 'mobile-badge-success',
    rejected: 'mobile-badge-danger',
    in_progress: 'mobile-badge-info'
  };
  return classes[status] || 'mobile-badge-default';
}

function getStatusText(status) {
  const texts = {
    pending: '待审查',
    approved: '已通过',
    rejected: '已拒绝',
    in_progress: '进行中'
  };
  return texts[status] || status;
}

function getLanguageName(code) {
  const names = {
    'zh-Hans': '简体中文',
    'zh-Hant': '繁体中文',
    'zh': '中文',
    'en': 'English'
  };
  return names[code] || code;
}

function formatAnalysisText(text) {
  // 简单的Markdown格式化
  return text
    .split('\n')
    .map(line => {
      // 标题
      if (line.startsWith('# ')) {
        return `<h2>${escapeHtml(line.substring(2))}</h2>`;
      }
      if (line.startsWith('## ')) {
        return `<h3>${escapeHtml(line.substring(3))}</h3>`;
      }
      // 列表
      if (line.startsWith('- ')) {
        return `<li>${escapeHtml(line.substring(2))}</li>`;
      }
      // 空行
      if (line.trim() === '') {
        return '<br>';
      }
      // 普通段落
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join('');
}

// 导出函数供HTML调用
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.showHomeView = showHomeView;
window.showMyReviews = showMyReviews;
window.showFamousBooksReviews = showFamousBooksReviews;
window.showCreateFamousBook = showCreateFamousBook;
window.showDocumentAnalysis = showDocumentAnalysis;
window.showMyTeams = showMyTeams;
window.showProfileView = showProfileView;
window.switchInputType = switchInputType;
window.submitFamousBookAnalysis = submitFamousBookAnalysis;
window.continueWithAnalysis = continueWithAnalysis;
window.filterReviews = filterReviews;

// 文档分析（占位）
function showDocumentAnalysis() {
  showToast('文档分析功能开发中', 'info');
}

console.log('Mobile App V8.6.1 Loaded');
