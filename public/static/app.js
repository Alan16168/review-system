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

function showReviews() {
  // Will be implemented - shows full review list
  alert('Reviews page - coming soon');
}

function showTeams() {
  // Will be implemented - shows teams management
  alert('Teams page - coming soon');
}

function showAdmin() {
  // Will be implemented - shows admin panel
  alert('Admin page - coming soon');
}

function showCreateReview() {
  // Will be implemented - shows create review form
  alert('Create review form - coming soon');
}

function showReviewDetail(id) {
  // Will be implemented - shows review detail and edit
  alert('Review detail page - coming soon for ID: ' + id);
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
