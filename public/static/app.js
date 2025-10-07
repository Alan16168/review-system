// Global state
let currentUser = null;
let authToken = null;
let currentView = 'login';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

function checkAuth() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    showDashboard();
  } else {
    showLogin();
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  currentUser = null;
  authToken = null;
  delete axios.defaults.headers.common['Authorization'];
  showLogin();
}

// ============ View Rendering ============

function showLogin() {
  currentView = 'login';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            <i class="fas fa-brain text-indigo-600 mr-2"></i>
            ${i18n.t('systemTitle')}
          </h1>
          <p class="text-gray-600">${i18n.t('systemSubtitle')}</p>
        </div>
        
        <div class="mb-6">
          <button onclick="i18n.setLanguage(i18n.getCurrentLanguage() === 'zh' ? 'en' : 'zh')" 
                  class="text-sm text-indigo-600 hover:text-indigo-800">
            <i class="fas fa-language mr-1"></i>
            ${i18n.getCurrentLanguage() === 'zh' ? 'English' : '中文'}
          </button>
        </div>

        <div id="auth-form">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">${i18n.t('email')}</label>
            <input type="email" id="login-email" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('email')}">
          </div>
          
          <div class="mb-6">
            <label class="block text-gray-700 mb-2">${i18n.t('password')}</label>
            <input type="password" id="login-password" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('password')}">
          </div>
          
          <button onclick="handleLogin()" 
                  class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition mb-4">
            ${i18n.t('login')}
          </button>
          
          <div class="text-center">
            <a href="#" onclick="showRegister(); return false;" class="text-indigo-600 hover:text-indigo-800">
              ${i18n.t('noAccount')} ${i18n.t('clickRegister')}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            <i class="fas fa-user-plus text-indigo-600 mr-2"></i>
            ${i18n.t('register')}
          </h1>
        </div>

        <div id="register-form">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">${i18n.t('username')}</label>
            <input type="text" id="register-username" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('username')}">
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">${i18n.t('email')}</label>
            <input type="email" id="register-email" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('email')}">
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">${i18n.t('password')}</label>
            <input type="password" id="register-password" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('password')}">
          </div>
          
          <button onclick="handleRegister()" 
                  class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition mb-4">
            ${i18n.t('register')}
          </button>
          
          <div class="text-center">
            <a href="#" onclick="showLogin(); return false;" class="text-indigo-600 hover:text-indigo-800">
              ${i18n.t('haveAccount')} ${i18n.t('clickLogin')}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showDashboard() {
  currentView = 'dashboard';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen">
      <!-- Navigation -->
      <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-8">
              <h1 class="text-2xl font-bold text-indigo-600">
                <i class="fas fa-brain mr-2"></i>${i18n.t('systemTitle')}
              </h1>
              <div class="hidden md:flex space-x-4">
                <button onclick="showDashboard()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  <i class="fas fa-home mr-1"></i>${i18n.t('dashboard')}
                </button>
                <button onclick="showReviews()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  <i class="fas fa-clipboard-list mr-1"></i>${i18n.t('myReviews')}
                </button>
                ${(currentUser.role === 'premium' || currentUser.role === 'admin') ? `
                  <button onclick="showTeams()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                    <i class="fas fa-users mr-1"></i>${i18n.t('teams')}
                  </button>
                ` : ''}
                ${currentUser.role === 'admin' ? `
                  <button onclick="showAdmin()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                    <i class="fas fa-cog mr-1"></i>${i18n.t('admin')}
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <button onclick="i18n.setLanguage(i18n.getCurrentLanguage() === 'zh' ? 'en' : 'zh')" 
                      class="text-gray-700 hover:text-indigo-600">
                <i class="fas fa-language mr-1"></i>
                ${i18n.getCurrentLanguage() === 'zh' ? 'EN' : '中文'}
              </button>
              <span class="text-gray-700">
                <i class="fas fa-user mr-1"></i>${currentUser.username}
                <span class="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">${currentUser.role}</span>
              </span>
              <button onclick="logout()" class="text-red-600 hover:text-red-800">
                <i class="fas fa-sign-out-alt mr-1"></i>${i18n.t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div id="dashboard-content">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 mb-1">${i18n.t('myReviews')}</p>
                  <p class="text-3xl font-bold text-indigo-600" id="review-count">-</p>
                </div>
                <i class="fas fa-clipboard-list text-4xl text-indigo-200"></i>
              </div>
            </div>
            
            ${(currentUser.role === 'premium' || currentUser.role === 'admin') ? `
              <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 mb-1">${i18n.t('teams')}</p>
                    <p class="text-3xl font-bold text-green-600" id="team-count">-</p>
                  </div>
                  <i class="fas fa-users text-4xl text-green-200"></i>
                </div>
              </div>
            ` : ''}
            
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 mb-1">${i18n.t('completed')}</p>
                  <p class="text-3xl font-bold text-purple-600" id="completed-count">-</p>
                </div>
                <i class="fas fa-check-circle text-4xl text-purple-200"></i>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">${i18n.t('myReviews')}</h2>
            <button onclick="showCreateReview()" 
                    class="mb-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
              <i class="fas fa-plus mr-2"></i>${i18n.t('createReview')}
            </button>
            <div id="recent-reviews"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  loadDashboardData();
}

// ============ API Handlers ============

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await axios.post('/api/auth/login', { email, password });
    authToken = response.data.token;
    currentUser = response.data.user;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    showDashboard();
  } catch (error) {
    alert(i18n.t('loginFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

async function handleRegister() {
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const response = await axios.post('/api/auth/register', { email, password, username });
    authToken = response.data.token;
    currentUser = response.data.user;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    showDashboard();
  } catch (error) {
    alert(i18n.t('registerFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

async function loadDashboardData() {
  try {
    const reviewsRes = await axios.get('/api/reviews');
    const reviews = reviewsRes.data.reviews;
    
    document.getElementById('review-count').textContent = reviews.length;
    document.getElementById('completed-count').textContent = 
      reviews.filter(r => r.status === 'completed').length;
    
    renderRecentReviews(reviews.slice(0, 5));
    
    if (currentUser.role === 'premium' || currentUser.role === 'admin') {
      const teamsRes = await axios.get('/api/teams');
      document.getElementById('team-count').textContent = teamsRes.data.teams.length;
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
  }
}

function renderRecentReviews(reviews) {
  const container = document.getElementById('recent-reviews');
  
  if (reviews.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-center py-4">${i18n.t('noData')}</p>`;
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('reviewTitle')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('status')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('updatedAt')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('actions')}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${reviews.map(review => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${review.title}</div>
                ${review.team_name ? `<div class="text-xs text-gray-500"><i class="fas fa-users mr-1"></i>${review.team_name}</div>` : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                  ${i18n.t(review.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(review.updated_at).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="showReviewDetail(${review.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-eye"></i> ${i18n.t('view')}
                </button>
                <button onclick="deleteReview(${review.id})" class="text-red-600 hover:text-red-900">
                  <i class="fas fa-trash"></i> ${i18n.t('delete')}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============ Reviews Page ============

async function showReviews() {
  currentView = 'reviews';
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-6 flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-clipboard-list mr-2"></i>${i18n.t('myReviews')}
          </h1>
          <button onclick="showCreateReview()" 
                  class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg">
            <i class="fas fa-plus mr-2"></i>${i18n.t('createReview')}
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-filter mr-1"></i>${i18n.t('status')}
              </label>
              <select id="filter-status" onchange="filterReviews()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="all">${i18n.t('all') || '全部'}</option>
                <option value="draft">${i18n.t('draft')}</option>
                <option value="completed">${i18n.t('completed')}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-search mr-1"></i>${i18n.t('search')}
              </label>
              <input type="text" id="search-input" oninput="filterReviews()" 
                     placeholder="${i18n.t('reviewTitle')}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-layer-group mr-1"></i>${i18n.t('groupType')}
              </label>
              <select id="filter-group-type" onchange="filterReviews()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="all">${i18n.t('all') || '全部'}</option>
                <option value="personal">${i18n.t('groupTypePersonal')}</option>
                <option value="project">${i18n.t('groupTypeProject')}</option>
                <option value="team">${i18n.t('groupTypeTeam')}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-calendar-alt mr-1"></i>${i18n.t('timeType')}
              </label>
              <select id="filter-time-type" onchange="filterReviews()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="all">${i18n.t('all') || '全部'}</option>
                <option value="daily">${i18n.t('timeTypeDaily')}</option>
                <option value="weekly">${i18n.t('timeTypeWeekly')}</option>
                <option value="monthly">${i18n.t('timeTypeMonthly')}</option>
                <option value="yearly">${i18n.t('timeTypeYearly')}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div id="reviews-container" class="bg-white rounded-lg shadow-md">
          <div class="p-8 text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p class="text-gray-600">${i18n.t('loading')}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadAllReviews();
}

let allReviews = [];

async function loadAllReviews() {
  try {
    const response = await axios.get('/api/reviews');
    allReviews = response.data.reviews;
    renderReviewsList(allReviews);
  } catch (error) {
    console.error('Load reviews error:', error);
    document.getElementById('reviews-container').innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function filterReviews() {
  const statusFilter = document.getElementById('filter-status').value;
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const groupTypeFilter = document.getElementById('filter-group-type').value;
  const timeTypeFilter = document.getElementById('filter-time-type').value;

  let filtered = allReviews.filter(review => {
    // Status filter
    if (statusFilter !== 'all' && review.status !== statusFilter) return false;
    
    // Search filter
    if (searchText && !review.title.toLowerCase().includes(searchText)) return false;
    
    // Group type filter
    if (groupTypeFilter !== 'all' && review.group_type !== groupTypeFilter) return false;
    
    // Time type filter
    if (timeTypeFilter !== 'all' && review.time_type !== timeTypeFilter) return false;
    
    return true;
  });

  renderReviewsList(filtered);
}

function renderReviewsList(reviews) {
  const container = document.getElementById('reviews-container');
  
  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center">
        <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">${i18n.t('noData')}</p>
        <button onclick="showCreateReview()" 
                class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          <i class="fas fa-plus mr-2"></i>${i18n.t('createReview')}
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('reviewTitle')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('status')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('creator')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('updatedAt')}
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('actions')}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${reviews.map(review => `
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(review.title)}</div>
                    ${review.team_name ? `
                      <div class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-users mr-1"></i>${escapeHtml(review.team_name)}
                      </div>
                    ` : `
                      <div class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-user mr-1"></i>${i18n.t('personalReview')}
                      </div>
                    `}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                  review.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }">
                  <i class="fas ${review.status === 'completed' ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
                  ${i18n.t(review.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(review.creator_name || 'Unknown')}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">
                  ${new Date(review.updated_at).toLocaleDateString()}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="showReviewDetail(${review.id})" 
                        class="text-indigo-600 hover:text-indigo-900 mr-3" title="${i18n.t('view')}">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="showEditReview(${review.id})" 
                        class="text-blue-600 hover:text-blue-900 mr-3" title="${i18n.t('edit')}">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteReview(${review.id})" 
                        class="text-red-600 hover:text-red-900" title="${i18n.t('delete')}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============ Create/Edit Review ============

async function showCreateReview() {
  currentView = 'create-review';
  const app = document.getElementById('app');
  
  // Load teams if premium user
  let teams = [];
  if (currentUser.role === 'premium' || currentUser.role === 'admin') {
    try {
      const response = await axios.get('/api/teams');
      teams = response.data.teams;
    } catch (error) {
      console.error('Load teams error:', error);
    }
  }
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mb-6">
          <button onclick="showReviews()" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back') || '返回'}
          </button>
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-plus-circle mr-2"></i>${i18n.t('createReview')}
          </h1>
        </div>

        <form id="review-form" class="bg-white rounded-lg shadow-md p-6 space-y-6">
          <!-- Basic Info -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('reviewTitle')} <span class="text-red-500">*</span>
            </label>
            <input type="text" id="review-title" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="${i18n.t('reviewTitle')}">
          </div>

          ${(currentUser.role === 'premium' || currentUser.role === 'admin') && teams.length > 0 ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('team')}
            </label>
            <select id="review-team" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">${i18n.t('personalReview')}</option>
              ${teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('')}
            </select>
            <p class="mt-1 text-xs text-gray-500">
              <i class="fas fa-info-circle mr-1"></i>${i18n.t('teamReviewNote') || '选择团队后，团队成员可以协作编辑'}
            </p>
          </div>
          ` : ''}

          <!-- Group Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('groupType')} <span class="text-red-500">*</span>
            </label>
            <select id="review-group-type" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="personal">${i18n.t('groupTypePersonal')}</option>
              <option value="project">${i18n.t('groupTypeProject')}</option>
              <option value="team">${i18n.t('groupTypeTeam')}</option>
            </select>
          </div>

          <!-- Time Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('timeType')} <span class="text-red-500">*</span>
            </label>
            <select id="review-time-type" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="daily">${i18n.t('timeTypeDaily')}</option>
              <option value="weekly">${i18n.t('timeTypeWeekly')}</option>
              <option value="monthly">${i18n.t('timeTypeMonthly')}</option>
              <option value="yearly">${i18n.t('timeTypeYearly')}</option>
            </select>
          </div>

          <!-- Nine Questions -->
          <div class="border-t pt-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-question-circle mr-2"></i>${i18n.t('nineQuestions')}
            </h2>
            
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('question' + num)}
                </label>
                <textarea id="question${num}" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                          placeholder="${i18n.t('question' + num)}"></textarea>
              </div>
            `).join('')}
          </div>

          <!-- Status -->
          <div class="border-t pt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('status')}
            </label>
            <div class="flex space-x-4">
              <label class="flex items-center cursor-pointer">
                <input type="radio" name="status" value="draft" checked
                       class="mr-2 text-indigo-600 focus:ring-indigo-500">
                <span class="text-sm text-gray-700">
                  <i class="fas fa-clock text-yellow-600 mr-1"></i>${i18n.t('draft')}
                </span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" name="status" value="completed"
                       class="mr-2 text-indigo-600 focus:ring-indigo-500">
                <span class="text-sm text-gray-700">
                  <i class="fas fa-check-circle text-green-600 mr-1"></i>${i18n.t('completed')}
                </span>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-4 pt-6 border-t">
            <button type="button" onclick="showReviews()" 
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ${i18n.t('cancel')}
            </button>
            <button type="submit" 
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg">
              <i class="fas fa-save mr-2"></i>${i18n.t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('review-form').addEventListener('submit', handleCreateReview);
}

async function handleCreateReview(e) {
  e.preventDefault();
  
  const title = document.getElementById('review-title').value;
  const teamId = document.getElementById('review-team')?.value || null;
  const groupType = document.getElementById('review-group-type').value;
  const timeType = document.getElementById('review-time-type').value;
  const status = document.querySelector('input[name="status"]:checked').value;
  
  const data = {
    title,
    team_id: teamId || null,
    group_type: groupType,
    time_type: timeType,
    status,
    question1: document.getElementById('question1').value,
    question2: document.getElementById('question2').value,
    question3: document.getElementById('question3').value,
    question4: document.getElementById('question4').value,
    question5: document.getElementById('question5').value,
    question6: document.getElementById('question6').value,
    question7: document.getElementById('question7').value,
    question8: document.getElementById('question8').value,
    question9: document.getElementById('question9').value,
  };

  try {
    await axios.post('/api/reviews', data);
    showNotification(i18n.t('createSuccess'), 'success');
    showReviews();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============ Review Detail & Edit ============

async function showReviewDetail(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review;
    const collaborators = response.data.collaborators || [];
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mb-6">
            <button onclick="showReviews()" class="text-indigo-600 hover:text-indigo-800 mb-4">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back') || '返回'}
            </button>
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                  ${escapeHtml(review.title)}
                </h1>
                <div class="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                  <span>
                    <i class="fas fa-user mr-1"></i>${escapeHtml(review.creator_name)}
                  </span>
                  <span>
                    <i class="fas fa-clock mr-1"></i>${new Date(review.created_at).toLocaleString()}
                  </span>
                  <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                    review.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }">
                    ${i18n.t(review.status)}
                  </span>
                  ${review.team_name ? `
                    <span class="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      <i class="fas fa-users mr-1"></i>${escapeHtml(review.team_name)}
                    </span>
                  ` : ''}
                  ${review.group_type ? `
                    <span class="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      <i class="fas fa-layer-group mr-1"></i>${i18n.t('groupType' + review.group_type.charAt(0).toUpperCase() + review.group_type.slice(1))}
                    </span>
                  ` : ''}
                  ${review.time_type ? `
                    <span class="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      <i class="fas fa-calendar-alt mr-1"></i>${i18n.t('timeType' + review.time_type.charAt(0).toUpperCase() + review.time_type.slice(1))}
                    </span>
                  ` : ''}
                </div>
              </div>
              <div class="flex space-x-2">
                <button onclick="showEditReview(${review.id})" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-edit mr-2"></i>${i18n.t('edit')}
                </button>
                <button onclick="deleteReview(${review.id})" 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <i class="fas fa-trash mr-2"></i>${i18n.t('delete')}
                </button>
              </div>
            </div>
          </div>

          <!-- Nine Questions Display -->
          <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 class="text-xl font-bold text-gray-800 border-b pb-3">
              <i class="fas fa-question-circle mr-2"></i>${i18n.t('nineQuestions')}
            </h2>
            
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
              <div class="border-l-4 border-indigo-500 pl-4 py-2">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">
                  ${i18n.t('question' + num)}
                </h3>
                <p class="text-gray-800 whitespace-pre-wrap">
                  ${escapeHtml(review['question' + num] || (i18n.t('noAnswer') || '未填写'))}
                </p>
              </div>
            `).join('')}
          </div>

          ${collaborators.length > 0 ? `
          <div class="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-users mr-2"></i>${i18n.t('collaborators') || '协作者'}
            </h2>
            <div class="space-y-2">
              ${collaborators.map(collab => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <i class="fas fa-user-circle text-2xl text-gray-400 mr-3"></i>
                    <div>
                      <div class="text-sm font-medium text-gray-900">${escapeHtml(collab.username)}</div>
                      <div class="text-xs text-gray-500">${escapeHtml(collab.email)}</div>
                    </div>
                  </div>
                  <span class="text-xs px-2 py-1 ${collab.can_edit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} rounded">
                    ${collab.can_edit ? i18n.t('canEdit') || '可编辑' : i18n.t('readOnly') || '只读'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showReviews();
  }
}

async function showEditReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review;
    
    // Load teams if premium user
    let teams = [];
    if (currentUser.role === 'premium' || currentUser.role === 'admin') {
      try {
        const teamsResponse = await axios.get('/api/teams');
        teams = teamsResponse.data.teams;
      } catch (error) {
        console.error('Load teams error:', error);
      }
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mb-6">
            <button onclick="showReviewDetail(${id})" class="text-indigo-600 hover:text-indigo-800 mb-4">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back') || '返回'}
            </button>
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>${i18n.t('edit')} ${i18n.t('review') || '复盘'}
            </h1>
          </div>

          <form id="edit-review-form" class="bg-white rounded-lg shadow-md p-6 space-y-6">
            <input type="hidden" id="review-id" value="${id}">
            
            <!-- Basic Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('reviewTitle')} <span class="text-red-500">*</span>
              </label>
              <input type="text" id="review-title" required value="${escapeHtml(review.title)}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>

            ${(currentUser.role === 'premium' || currentUser.role === 'admin') && teams.length > 0 ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('team')}
              </label>
              <select id="review-team" disabled
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                <option value="">${i18n.t('personalReview')}</option>
                ${teams.map(team => `
                  <option value="${team.id}" ${review.team_id == team.id ? 'selected' : ''}>
                    ${escapeHtml(team.name)}
                  </option>
                `).join('')}
              </select>
              <p class="mt-1 text-xs text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>${i18n.t('teamCannotChange') || '团队归属不可更改'}
              </p>
            </div>
            ` : ''}

            <!-- Group Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('groupType')} <span class="text-red-500">*</span>
              </label>
              <select id="review-group-type" required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="personal" ${review.group_type === 'personal' ? 'selected' : ''}>${i18n.t('groupTypePersonal')}</option>
                <option value="project" ${review.group_type === 'project' ? 'selected' : ''}>${i18n.t('groupTypeProject')}</option>
                <option value="team" ${review.group_type === 'team' ? 'selected' : ''}>${i18n.t('groupTypeTeam')}</option>
              </select>
            </div>

            <!-- Time Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('timeType')} <span class="text-red-500">*</span>
              </label>
              <select id="review-time-type" required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="daily" ${review.time_type === 'daily' ? 'selected' : ''}>${i18n.t('timeTypeDaily')}</option>
                <option value="weekly" ${review.time_type === 'weekly' ? 'selected' : ''}>${i18n.t('timeTypeWeekly')}</option>
                <option value="monthly" ${review.time_type === 'monthly' ? 'selected' : ''}>${i18n.t('timeTypeMonthly')}</option>
                <option value="yearly" ${review.time_type === 'yearly' ? 'selected' : ''}>${i18n.t('timeTypeYearly')}</option>
              </select>
            </div>

            <!-- Nine Questions -->
            <div class="border-t pt-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-question-circle mr-2"></i>${i18n.t('nineQuestions')}
              </h2>
              
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    ${i18n.t('question' + num)}
                  </label>
                  <textarea id="question${num}" rows="3"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                            placeholder="${i18n.t('question' + num)}">${escapeHtml(review['question' + num] || '')}</textarea>
                </div>
              `).join('')}
            </div>

            <!-- Status -->
            <div class="border-t pt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('status')}
              </label>
              <div class="flex space-x-4">
                <label class="flex items-center cursor-pointer">
                  <input type="radio" name="status" value="draft" ${review.status === 'draft' ? 'checked' : ''}
                         class="mr-2 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">
                    <i class="fas fa-clock text-yellow-600 mr-1"></i>${i18n.t('draft')}
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input type="radio" name="status" value="completed" ${review.status === 'completed' ? 'checked' : ''}
                         class="mr-2 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">
                    <i class="fas fa-check-circle text-green-600 mr-1"></i>${i18n.t('completed')}
                  </span>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-4 pt-6 border-t">
              <button type="button" onclick="showReviewDetail(${id})" 
                      class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ${i18n.t('cancel')}
              </button>
              <button type="submit" 
                      class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg">
                <i class="fas fa-save mr-2"></i>${i18n.t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('edit-review-form').addEventListener('submit', handleEditReview);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showReviews();
  }
}

async function handleEditReview(e) {
  e.preventDefault();
  
  const id = document.getElementById('review-id').value;
  const title = document.getElementById('review-title').value;
  const groupType = document.getElementById('review-group-type').value;
  const timeType = document.getElementById('review-time-type').value;
  const status = document.querySelector('input[name="status"]:checked').value;
  
  const data = {
    title,
    group_type: groupType,
    time_type: timeType,
    status,
    question1: document.getElementById('question1').value,
    question2: document.getElementById('question2').value,
    question3: document.getElementById('question3').value,
    question4: document.getElementById('question4').value,
    question5: document.getElementById('question5').value,
    question6: document.getElementById('question6').value,
    question7: document.getElementById('question7').value,
    question8: document.getElementById('question8').value,
    question9: document.getElementById('question9').value,
  };

  try {
    await axios.put(`/api/reviews/${id}`, data);
    showNotification(i18n.t('updateSuccess'), 'success');
    showReviewDetail(id);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============ Helper Functions ============

function renderNavigation() {
  return `
    <nav class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-8">
            <h1 class="text-2xl font-bold text-indigo-600 cursor-pointer" onclick="showDashboard()">
              <i class="fas fa-brain mr-2"></i>${i18n.t('systemTitle')}
            </h1>
            <div class="hidden md:flex space-x-4">
              <button onclick="showDashboard()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                <i class="fas fa-home mr-1"></i>${i18n.t('dashboard')}
              </button>
              <button onclick="showReviews()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                <i class="fas fa-clipboard-list mr-1"></i>${i18n.t('myReviews')}
              </button>
              ${(currentUser.role === 'premium' || currentUser.role === 'admin') ? `
                <button onclick="showTeams()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  <i class="fas fa-users mr-1"></i>${i18n.t('teams')}
                </button>
              ` : ''}
              ${currentUser.role === 'admin' ? `
                <button onclick="showAdmin()" class="text-gray-700 hover:text-indigo-600 px-3 py-2">
                  <i class="fas fa-cog mr-1"></i>${i18n.t('admin')}
                </button>
              ` : ''}
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button onclick="i18n.setLanguage(i18n.getCurrentLanguage() === 'zh' ? 'en' : 'zh')" 
                    class="text-gray-700 hover:text-indigo-600">
              <i class="fas fa-language mr-1"></i>
              ${i18n.getCurrentLanguage() === 'zh' ? 'EN' : '中文'}
            </button>
            <span class="text-gray-700">
              <i class="fas fa-user mr-1"></i>${currentUser.username}
              <span class="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">${currentUser.role}</span>
            </span>
            <button onclick="logout()" class="text-red-600 hover:text-red-800">
              <i class="fas fa-sign-out-alt mr-1"></i>${i18n.t('logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ============ Teams Management ============

async function showTeams() {
  currentView = 'teams';
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-6 flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-users mr-2"></i>${i18n.t('teamList')}
          </h1>
          <button onclick="showCreateTeam()" 
                  class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg">
            <i class="fas fa-plus mr-2"></i>${i18n.t('createTeam')}
          </button>
        </div>

        <div id="teams-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p class="text-gray-600">${i18n.t('loading')}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadTeams();
}

async function loadTeams() {
  try {
    const response = await axios.get('/api/teams');
    const teams = response.data.teams;
    renderTeamsList(teams);
  } catch (error) {
    console.error('Load teams error:', error);
    document.getElementById('teams-container').innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function renderTeamsList(teams) {
  const container = document.getElementById('teams-container');
  
  if (teams.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg mb-4">${i18n.t('noData')}</p>
        <button onclick="showCreateTeam()" 
                class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          <i class="fas fa-plus mr-2"></i>${i18n.t('createTeam')}
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = teams.map(team => `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 cursor-pointer card-hover" 
         onclick="showTeamDetail(${team.id})">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-800 mb-2">
            ${escapeHtml(team.name)}
          </h3>
          ${team.description ? `
            <p class="text-sm text-gray-600 mb-3">${escapeHtml(team.description)}</p>
          ` : ''}
        </div>
        ${team.owner_id === currentUser.id ? `
          <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
            ${i18n.t('teamOwner')}
          </span>
        ` : ''}
      </div>
      
      <div class="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
        <div>
          <i class="fas fa-user mr-1"></i>
          <span>${escapeHtml(team.owner_name)}</span>
        </div>
        <div>
          <i class="fas fa-users mr-1"></i>
          <span>${team.member_count} ${i18n.t('members')}</span>
        </div>
      </div>
      
      <div class="mt-4 flex space-x-2">
        <button onclick="event.stopPropagation(); showTeamDetail(${team.id})" 
                class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">
          <i class="fas fa-eye mr-1"></i>${i18n.t('view')}
        </button>
        ${team.owner_id === currentUser.id ? `
          <button onclick="event.stopPropagation(); deleteTeam(${team.id})" 
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

async function showCreateTeam() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="mb-6">
          <button onclick="showTeams()" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back')}
          </button>
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-plus-circle mr-2"></i>${i18n.t('createTeam')}
          </h1>
        </div>

        <form id="create-team-form" class="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('teamName')} <span class="text-red-500">*</span>
            </label>
            <input type="text" id="team-name" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="${i18n.t('teamName')}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('teamDescription')}
            </label>
            <textarea id="team-description" rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                      placeholder="${i18n.t('teamDescription')}"></textarea>
          </div>

          <div class="flex justify-end space-x-4 pt-6 border-t">
            <button type="button" onclick="showTeams()" 
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ${i18n.t('cancel')}
            </button>
            <button type="submit" 
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg">
              <i class="fas fa-save mr-2"></i>${i18n.t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('create-team-form').addEventListener('submit', handleCreateTeam);
}

async function handleCreateTeam(e) {
  e.preventDefault();
  
  const name = document.getElementById('team-name').value;
  const description = document.getElementById('team-description').value;

  try {
    await axios.post('/api/teams', { name, description });
    showNotification(i18n.t('createSuccess'), 'success');
    showTeams();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showTeamDetail(teamId) {
  try {
    const response = await axios.get(`/api/teams/${teamId}`);
    const team = response.data.team;
    const members = response.data.members || [];
    
    const isOwner = team.owner_id === currentUser.id;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mb-6">
            <button onclick="showTeams()" class="text-indigo-600 hover:text-indigo-800 mb-4">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back')}
            </button>
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                  ${escapeHtml(team.name)}
                </h1>
                ${team.description ? `
                  <p class="text-gray-600">${escapeHtml(team.description)}</p>
                ` : ''}
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    <i class="fas fa-user mr-1"></i>${escapeHtml(team.owner_name)}
                  </span>
                  <span>
                    <i class="fas fa-calendar mr-1"></i>${new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              ${isOwner ? `
                <button onclick="deleteTeam(${teamId})" 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <i class="fas fa-trash mr-2"></i>${i18n.t('dissolveTeam')}
                </button>
              ` : `
                <button onclick="leaveTeam(${teamId})" 
                        class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  <i class="fas fa-sign-out-alt mr-2"></i>${i18n.t('leaveTeam')}
                </button>
              `}
            </div>
          </div>

          <!-- Invite Member Section (Owner Only) -->
          ${isOwner ? `
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-user-plus mr-2"></i>${i18n.t('inviteMember')}
            </h2>
            <form id="invite-member-form" class="flex space-x-4">
              <input type="email" id="member-email" required
                     class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="${i18n.t('memberEmail')}">
              <button type="submit" 
                      class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <i class="fas fa-paper-plane mr-2"></i>${i18n.t('inviteMember')}
              </button>
            </form>
          </div>
          ` : ''}

          <!-- Members List -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-users mr-2"></i>${i18n.t('teamMembers')} (${members.length})
            </h2>
            <div class="space-y-3">
              ${members.map(member => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <i class="fas fa-user text-indigo-600"></i>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">${escapeHtml(member.username)}</div>
                      <div class="text-sm text-gray-500">${escapeHtml(member.email)}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="text-xs px-2 py-1 ${
                      member.role === 'admin' ? 'bg-red-100 text-red-800' :
                      member.role === 'premium' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    } rounded-full">
                      ${i18n.t(member.role + 'Role')}
                    </span>
                    ${member.id === team.owner_id ? `
                      <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        ${i18n.t('teamOwner')}
                      </span>
                    ` : isOwner ? `
                      <button onclick="removeMember(${teamId}, ${member.id})" 
                              class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-user-minus"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    if (isOwner) {
      document.getElementById('invite-member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('member-email').value;
        await inviteMember(teamId, email);
      });
    }
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showTeams();
  }
}

async function inviteMember(teamId, email) {
  try {
    // First, find user by email
    const usersResponse = await axios.get('/api/admin/users');
    const user = usersResponse.data.users.find(u => u.email === email);
    
    if (!user) {
      showNotification(i18n.t('userNotFound'), 'error');
      return;
    }

    await axios.post(`/api/teams/${teamId}/members`, { user_id: user.id });
    showNotification(i18n.t('inviteSuccess'), 'success');
    showTeamDetail(teamId);
  } catch (error) {
    if (error.response?.status === 403) {
      showNotification(i18n.t('alreadyMember'), 'error');
    } else {
      showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    }
  }
}

async function removeMember(teamId, userId) {
  if (!confirm(i18n.t('confirmDelete'))) return;
  
  try {
    await axios.delete(`/api/teams/${teamId}/members/${userId}`);
    showNotification(i18n.t('deleteSuccess'), 'success');
    showTeamDetail(teamId);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function deleteTeam(teamId) {
  if (!confirm(i18n.t('confirmDelete') + ' ' + i18n.t('dissolveTeam') + '?')) return;
  
  try {
    await axios.delete(`/api/teams/${teamId}`);
    showNotification(i18n.t('deleteSuccess'), 'success');
    showTeams();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function leaveTeam(teamId) {
  if (!confirm(i18n.t('confirmDelete') + ' ' + i18n.t('leaveTeam') + '?')) return;
  
  try {
    await axios.delete(`/api/teams/${teamId}/members/${currentUser.id}`);
    showNotification(i18n.t('deleteSuccess'), 'success');
    showTeams();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============ Admin Panel ============

async function showAdmin() {
  currentView = 'admin';
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">
          <i class="fas fa-cog mr-2"></i>${i18n.t('adminPanel')}
        </h1>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-md mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              <button onclick="showAdminTab('users')" 
                      class="admin-tab active py-4 px-1 border-b-2 font-medium text-sm"
                      data-tab="users">
                <i class="fas fa-users mr-2"></i>${i18n.t('userManagement')}
              </button>
              <button onclick="showAdminTab('notifications')" 
                      class="admin-tab py-4 px-1 border-b-2 font-medium text-sm"
                      data-tab="notifications">
                <i class="fas fa-bell mr-2"></i>${i18n.t('sendNotification')}
              </button>
              <button onclick="showAdminTab('stats')" 
                      class="admin-tab py-4 px-1 border-b-2 font-medium text-sm"
                      data-tab="stats">
                <i class="fas fa-chart-bar mr-2"></i>${i18n.t('systemStats')}
              </button>
            </nav>
          </div>
        </div>

        <!-- Tab Content -->
        <div id="admin-content"></div>
      </div>
    </div>
  `;

  // Add tab styles
  const style = document.createElement('style');
  style.textContent = `
    .admin-tab {
      border-color: transparent;
      color: #6b7280;
    }
    .admin-tab:hover {
      border-color: #d1d5db;
      color: #111827;
    }
    .admin-tab.active {
      border-color: #4f46e5;
      color: #4f46e5;
    }
  `;
  document.head.appendChild(style);

  showAdminTab('users');
}

async function showAdminTab(tab) {
  // Update active tab
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  const content = document.getElementById('admin-content');
  
  switch(tab) {
    case 'users':
      await showUsersManagement(content);
      break;
    case 'notifications':
      showNotificationsPanel(content);
      break;
    case 'stats':
      await showStatsPanel(content);
      break;
  }
}

async function showUsersManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-users mr-2"></i>${i18n.t('userList')}
        </h2>
        <div class="flex space-x-2">
          <input type="text" id="search-users" placeholder="${i18n.t('search')}"
                 class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 oninput="filterUsers()">
        </div>
      </div>
      <div id="users-table">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
        </div>
      </div>
    </div>
  `;

  await loadUsersTable();
}

let allUsers = [];

async function loadUsersTable() {
  try {
    const response = await axios.get('/api/admin/users');
    allUsers = response.data.users;
    renderUsersTable(allUsers);
  } catch (error) {
    document.getElementById('users-table').innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function filterUsers() {
  const searchText = document.getElementById('search-users').value.toLowerCase();
  const filtered = allUsers.filter(user => 
    user.email.toLowerCase().includes(searchText) ||
    user.username.toLowerCase().includes(searchText)
  );
  renderUsersTable(filtered);
}

function renderUsersTable(users) {
  const container = document.getElementById('users-table');
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              <input type="checkbox" id="select-all" onchange="toggleSelectAll(this)" 
                     class="rounded text-indigo-600">
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('username')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('email')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('role')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('createdAt')}</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${i18n.t('actions')}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${users.map(user => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <input type="checkbox" class="user-checkbox rounded text-indigo-600" value="${user.id}">
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <i class="fas fa-user text-indigo-600 text-sm"></i>
                  </div>
                  <div class="font-medium text-gray-900">${escapeHtml(user.username)}</div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">${escapeHtml(user.email)}</td>
              <td class="px-6 py-4">
                <select class="text-sm px-2 py-1 border border-gray-300 rounded"
                        onchange="updateUserRole(${user.id}, this.value)"
                        ${user.id === currentUser.id ? 'disabled' : ''}>
                  <option value="user" ${user.role === 'user' ? 'selected' : ''}>${i18n.t('userRole')}</option>
                  <option value="premium" ${user.role === 'premium' ? 'selected' : ''}>${i18n.t('premiumRole')}</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>${i18n.t('adminRole')}</option>
                </select>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                ${new Date(user.created_at).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 text-right text-sm">
                ${user.id !== currentUser.id ? `
                  <button onclick="deleteUser(${user.id})" 
                          class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                  </button>
                ` : `
                  <span class="text-gray-400">${i18n.t('self') || '自己'}</span>
                `}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function toggleSelectAll(checkbox) {
  document.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.checked = checkbox.checked;
  });
}

async function updateUserRole(userId, newRole) {
  try {
    await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
    showNotification(i18n.t('updateSuccess'), 'success');
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    await loadUsersTable();
  }
}

async function deleteUser(userId) {
  if (!confirm(i18n.t('confirmDelete'))) return;
  
  try {
    await axios.delete(`/api/admin/users/${userId}`);
    showNotification(i18n.t('deleteSuccess'), 'success');
    await loadUsersTable();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

function showNotificationsPanel(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Broadcast to All -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-bullhorn mr-2"></i>${i18n.t('broadcastMessage')}
        </h2>
        <form id="broadcast-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('notificationTitle')} <span class="text-red-500">*</span>
            </label>
            <input type="text" id="broadcast-title" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="${i18n.t('notificationTitle')}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('notificationMessage')} <span class="text-red-500">*</span>
            </label>
            <textarea id="broadcast-message" required rows="4"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                      placeholder="${i18n.t('notificationMessage')}"></textarea>
          </div>
          <button type="submit" 
                  class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-lg">
            <i class="fas fa-paper-plane mr-2"></i>${i18n.t('sendToAll')}
          </button>
        </form>
      </div>

      <!-- Send to Selected -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-envelope mr-2"></i>${i18n.t('sendToSelected')}
        </h2>
        
        <!-- Tabs for selection methods -->
        <div class="flex border-b mb-4">
          <button onclick="switchNotificationTab('email')" id="tab-email"
                  class="px-4 py-2 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600">
            <i class="fas fa-at mr-1"></i>${i18n.t('sendByEmail')}
          </button>
          <button onclick="switchNotificationTab('selection')" id="tab-selection"
                  class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            <i class="fas fa-check-square mr-1"></i>${i18n.t('sendBySelection')}
          </button>
        </div>
        
        <form id="selected-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('notificationTitle')} <span class="text-red-500">*</span>
            </label>
            <input type="text" id="selected-title" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="${i18n.t('notificationTitle')}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('notificationMessage')} <span class="text-red-500">*</span>
            </label>
            <textarea id="selected-message" required rows="4"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                      placeholder="${i18n.t('notificationMessage')}"></textarea>
          </div>
          
          <!-- Email Input (shown by default) -->
          <div id="email-input-section">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('recipientEmails')} <span class="text-red-500">*</span>
            </label>
            <textarea id="recipient-emails" rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                      placeholder="${i18n.t('recipientEmailsPlaceholder')}"></textarea>
            <p class="mt-1 text-xs text-gray-500">
              <i class="fas fa-info-circle mr-1"></i>${i18n.t('recipientEmailsPlaceholder')}
            </p>
          </div>
          
          <!-- Selection Note (hidden by default) -->
          <div id="selection-note-section" style="display: none;">
            <p class="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <i class="fas fa-info-circle mr-1"></i>
              ${i18n.t('selectUsersNote') || '请先在用户管理标签页选择要发送通知的用户'}
            </p>
          </div>
          
          <button type="submit" 
                  class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-lg">
            <i class="fas fa-paper-plane mr-2"></i>${i18n.t('sendToSelected')}
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('broadcast-form').addEventListener('submit', handleBroadcast);
  document.getElementById('selected-form').addEventListener('submit', handleSendToSelected);
}

function switchNotificationTab(tab) {
  const emailTab = document.getElementById('tab-email');
  const selectionTab = document.getElementById('tab-selection');
  const emailSection = document.getElementById('email-input-section');
  const selectionSection = document.getElementById('selection-note-section');
  
  if (tab === 'email') {
    emailTab.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
    emailTab.classList.remove('text-gray-600');
    selectionTab.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
    selectionTab.classList.add('text-gray-600');
    emailSection.style.display = 'block';
    selectionSection.style.display = 'none';
  } else {
    selectionTab.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
    selectionTab.classList.remove('text-gray-600');
    emailTab.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
    emailTab.classList.add('text-gray-600');
    emailSection.style.display = 'none';
    selectionSection.style.display = 'block';
  }
}

async function handleBroadcast(e) {
  e.preventDefault();
  
  const title = document.getElementById('broadcast-title').value;
  const message = document.getElementById('broadcast-message').value;

  try {
    const response = await axios.post('/api/notifications/broadcast', { title, message });
    showNotification(`${i18n.t('notificationSent')}: ${response.data.recipient_count} ${i18n.t('users') || '用户'}`, 'success');
    document.getElementById('broadcast-form').reset();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function handleSendToSelected(e) {
  e.preventDefault();
  
  const title = document.getElementById('selected-title').value;
  const message = document.getElementById('selected-message').value;
  
  // Check which tab is active
  const emailSection = document.getElementById('email-input-section');
  const isEmailMode = emailSection.style.display !== 'none';
  
  if (isEmailMode) {
    // Send by email addresses
    const emailsText = document.getElementById('recipient-emails').value.trim();
    if (!emailsText) {
      showNotification(i18n.t('recipientEmails') + ' ' + (i18n.t('required') || '不能为空'), 'error');
      return;
    }
    
    // Parse emails (split by comma or newline)
    const emails = emailsText.split(/[,\n]/).map(e => e.trim()).filter(e => e);
    if (emails.length === 0) {
      showNotification(i18n.t('recipientEmails') + ' ' + (i18n.t('invalid') || '格式无效'), 'error');
      return;
    }
    
    try {
      // First, find user IDs by emails
      const usersResponse = await axios.get('/api/admin/users');
      const allUsers = usersResponse.data.users;
      
      const userIds = [];
      const notFoundEmails = [];
      
      for (const email of emails) {
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          userIds.push(user.id);
        } else {
          notFoundEmails.push(email);
        }
      }
      
      if (userIds.length === 0) {
        showNotification(i18n.t('userNotFound') + ': ' + emails.join(', '), 'error');
        return;
      }
      
      // Send notification to found users
      const response = await axios.post('/api/notifications/send', {
        user_ids: userIds,
        title,
        message
      });
      
      let successMsg = `${i18n.t('notificationSent')}: ${response.data.recipient_count} ${i18n.t('users') || '用户'}`;
      if (notFoundEmails.length > 0) {
        successMsg += ` (${i18n.t('userNotFound')}: ${notFoundEmails.join(', ')})`;
      }
      
      showNotification(successMsg, notFoundEmails.length > 0 ? 'warning' : 'success');
      document.getElementById('selected-form').reset();
    } catch (error) {
      showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    }
  } else {
    // Send by user selection
    const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked'))
      .map(cb => parseInt(cb.value));

    if (selectedUsers.length === 0) {
      showNotification(i18n.t('noUsersSelected') || i18n.t('selectUsers'), 'error');
      return;
    }

    try {
      const response = await axios.post('/api/notifications/send', {
        user_ids: selectedUsers,
        title,
        message
      });
      showNotification(`${i18n.t('notificationSent')}: ${response.data.recipient_count} ${i18n.t('users') || '用户'}`, 'success');
      document.getElementById('selected-form').reset();
    } catch (error) {
      showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    }
  }
}

async function showStatsPanel(container) {
  container.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
    </div>
  `;

  try {
    const response = await axios.get('/api/admin/stats');
    const stats = response.data;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 mb-1">${i18n.t('totalUsers')}</p>
              <p class="text-3xl font-bold text-indigo-600">${stats.total_users}</p>
            </div>
            <i class="fas fa-users text-4xl text-indigo-200"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 mb-1">${i18n.t('totalReviews')}</p>
              <p class="text-3xl font-bold text-green-600">${stats.total_reviews}</p>
            </div>
            <i class="fas fa-clipboard-list text-4xl text-green-200"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 mb-1">${i18n.t('totalTeams')}</p>
              <p class="text-3xl font-bold text-purple-600">${stats.total_teams}</p>
            </div>
            <i class="fas fa-users text-4xl text-purple-200"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          ${i18n.t('usersByRole') || '用户角色分布'}
        </h2>
        <div class="space-y-3">
          ${stats.users_by_role.map(item => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center">
                <span class="px-3 py-1 text-sm ${
                  item.role === 'admin' ? 'bg-red-100 text-red-800' :
                  item.role === 'premium' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                } rounded-full mr-3">
                  ${i18n.t(item.role + 'Role')}
                </span>
              </div>
              <div class="text-2xl font-bold text-gray-800">${item.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

async function deleteReview(id) {
  if (!confirm(i18n.t('confirmDelete'))) return;
  
  try {
    await axios.delete(`/api/reviews/${id}`);
    alert(i18n.t('deleteSuccess'));
    loadDashboardData();
  } catch (error) {
    alert(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}
