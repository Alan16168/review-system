// Global state
let currentUser = null;
let authToken = null;
let currentView = 'home';
let currentDraftId = null; // Track the draft ID to avoid creating duplicates

// ============================================================================
// Global Modal Utilities
// ============================================================================

// Close modal by removing it from DOM
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}

// Close modal when clicking on backdrop (not on modal content)
function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
}

// ============================================================================
// Helper function to auto-save draft before navigation
async function autoSaveDraftBeforeNavigation() {
  if (currentView === 'create-review-step1' || currentView === 'create-review-step2') {
    try {
      await window.saveCurrentReviewDraft();
      showNotification(i18n.t('draftSaved'), 'success');
      return true; // Draft saved
    } catch (error) {
      console.error('Auto-save draft error:', error);
      return false; // Save failed, but continue
    }
  }
  return false; // No draft to save
}

// Global function to save current review draft before language switch
window.saveCurrentReviewDraft = async function() {
  // Check if user is in create-review-step1 or create-review-step2
  if (currentView === 'create-review-step1') {
    // Step 1: Collect form data and save to server
    const titleElem = document.getElementById('review-title');
    const descriptionElem = document.getElementById('review-description');
    const templateElem = document.getElementById('review-template');
      const timeTypeElem = document.getElementById('review-time-type');
    const statusElems = document.querySelectorAll('input[name="status"]');
    
    // Check if title is filled
    if (!titleElem || !titleElem.value.trim()) {
      // No title, can't save draft
      return Promise.resolve();
    }
    
    const title = titleElem.value.trim();
    const description = descriptionElem ? descriptionElem.value.trim() : '';
    const template_id = templateElem ? parseInt(templateElem.value) : 1;
      
    // Get team ID
    let team_id = null;
    const teamElem = document.getElementById('review-team');
    team_id = teamElem && teamElem.value ? parseInt(teamElem.value) : null;
    const time_type = timeTypeElem ? timeTypeElem.value : 'daily';
    
    let status = 'draft';
    statusElems.forEach(elem => {
      if (elem.checked) status = elem.value;
    });
    
    // Check if we already saved a draft for this session
    if (currentDraftId) {
      // Update existing draft instead of creating new one
      const data = {
        title,
        description: description || null,
        status: 'draft',
        answers: {}
      };
      
      try {
        await axios.put(`/api/reviews/${currentDraftId}`, data);
        return Promise.resolve();
      } catch (error) {
        console.error('Failed to update draft from step 1:', error);
        return Promise.reject(error);
      }
    } else {
      // Create new draft
      const data = {
        title,
        description: description || null,
        template_id,
        team_id,
        status: 'draft',
        answers: {}
      };
      
      try {
        const response = await axios.post('/api/reviews', data);
        currentDraftId = response.data.id; // Store draft ID
        return Promise.resolve();
      } catch (error) {
        console.error('Failed to save draft from step 1:', error);
        return Promise.reject(error);
      }
    }
  }
  
  if (currentView === 'create-review-step2') {
    // Step 2: Save as draft to server
    const template = window.currentSelectedTemplate;
    const reviewData = window.createReviewData;
    
    if (!template || !reviewData) {
      return Promise.resolve();
    }
    
    // Collect answers
    const answers = {};
    if (template.questions) {
      template.questions.forEach(q => {
        const answerElem = document.getElementById(`question${q.question_number}`);
        if (answerElem && answerElem.value.trim()) {
          answers[q.question_number] = answerElem.value.trim();
        }
      });
    }
    
    // Check if we already saved a draft for this session
    if (currentDraftId) {
      // Update existing draft
      const data = {
        title: reviewData.title,
        description: reviewData.description || null,
        time_type: reviewData.time_type,
        status: 'draft',
        answers
      };
      
      try {
        await axios.put(`/api/reviews/${currentDraftId}`, data);
        return Promise.resolve();
      } catch (error) {
        console.error('Failed to update draft from step 2:', error);
        return Promise.reject(error);
      }
    } else {
      // Create new draft
      const data = {
        ...reviewData,
        answers,
        status: 'draft'
      };
      
      try {
        const response = await axios.post('/api/reviews', data);
        currentDraftId = response.data.id; // Store draft ID
        return Promise.resolve();
      } catch (error) {
        console.error('Failed to save draft from step 2:', error);
        return Promise.reject(error);
      }
    }
  }
  
  return Promise.resolve();
};

// Global cache for learning resources
let cachedArticles = [];
let displayedArticles = [];
let cachedVideos = [];
let displayedVideos = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

async function checkAuth() {
  // Load dynamic UI settings first to ensure custom titles are available
  await loadDynamicUISettings();
  
  // Check if we should show home page after reload (e.g., after language change)
  const showHomeAfterReload = sessionStorage.getItem('showHomeAfterReload');
  if (showHomeAfterReload) {
    sessionStorage.removeItem('showHomeAfterReload');
    // Force showing home page
    currentView = 'home';
  }
  
  // Check if URL contains password reset token or invitation token
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const inviteToken = urlParams.get('invite');
  const teamInviteToken = urlParams.get('team_invite');
  
  // Check team invitation token first (highest priority)
  if (teamInviteToken) {
    showTeamInvitationLandingPage(teamInviteToken);
    return;
  }
  
  // Check review invitation token
  if (inviteToken) {
    showInvitationLandingPage(inviteToken);
    return;
  }
  
  if (resetToken) {
    // Show password reset page with token
    showResetPasswordWithToken();
    return;
  }
  
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  // Always set language header based on current i18n language
  axios.defaults.headers.common['X-Language'] = i18n.getCurrentLanguage();
  
  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);
    window.currentUser = currentUser;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // If showHomeAfterReload flag is set or on home page, show home page
    if (showHomeAfterReload || currentView === 'home') {
      showHomePage();
    } else {
      showDashboard();
    }
  } else {
    // Show home page by default for unauthenticated users
    showHomePage();
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  currentUser = null;
  window.currentUser = null;
  authToken = null;
  delete axios.defaults.headers.common['Authorization'];
  showHomePage();
}

// Refresh current user info from server
async function refreshCurrentUser() {
  if (!authToken) return;
  
  try {
    const response = await axios.get('/api/auth/me');
    if (response.data.user) {
      currentUser = response.data.user;
      window.currentUser = currentUser;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  } catch (error) {
    console.error('Failed to refresh user info:', error);
    // If token is invalid, logout
    if (error.response && error.response.status === 401) {
      logout();
    }
  }
}

// ============ View Rendering ============

// Home Page (Landing Page)
async function showHomePage() {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
  currentView = 'home';
  const app = document.getElementById('app');
  
  // Debug: Check if systemTitle is set correctly
  console.log('[HomePage] systemTitle =', i18n.t('systemTitle'));
  
  app.innerHTML = `
    <div class="min-h-screen bg-white">
      ${renderNavigation()}

      <!-- Hero Section with Carousel -->
      <section class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 md:py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <!-- Left: Text Content -->
            <div class="text-center md:text-left">
              <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
                ${i18n.t('heroTitle')}
              </h1>
              <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8">
                ${i18n.t('heroSubtitle')}
              </p>
              <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                ${!currentUser ? `
                  <button onclick="showRegister()" 
                          class="bg-indigo-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-indigo-700 transition text-base sm:text-lg w-full sm:w-auto">
                    <i class="fas fa-rocket mr-2"></i>${i18n.t('getStarted')}
                  </button>
                  <button onclick="showLogin()" 
                          class="bg-white text-indigo-600 px-6 sm:px-8 py-3 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition text-base sm:text-lg w-full sm:w-auto">
                    ${i18n.t('login')}
                  </button>
                ` : `
                  <button onclick="showDashboard()" 
                          class="bg-indigo-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-indigo-700 transition text-base sm:text-lg w-full sm:w-auto">
                    <i class="fas fa-tachometer-alt mr-2"></i>${i18n.t('goToDashboard')}
                  </button>
                `}
              </div>
            </div>
            
            <!-- Right: Image Carousel -->
            <div class="relative mt-8 md:mt-0">
              <div id="carousel" class="relative h-64 sm:h-80 md:h-96 bg-white rounded-2xl shadow-2xl overflow-hidden">
                <!-- Carousel slides -->
                <div class="carousel-slide active">
                  <img src="https://cdn1.genspark.ai/user-upload-image/5_generated/0d286e2a-265b-45ff-8e44-52c7805f8bcf.jpeg" 
                       alt="Team collaboration" 
                       class="w-full h-full object-cover">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h3 class="text-xl font-bold mb-2">${i18n.t('carousel1Title')}</h3>
                    <p class="text-sm">${i18n.t('carousel1Desc')}</p>
                  </div>
                </div>
                <div class="carousel-slide">
                  <img src="https://cdn1.genspark.ai/user-upload-image/5_generated/b1529f16-e0ea-4887-a34b-4e85c169db9e.jpeg" 
                       alt="Personal growth" 
                       class="w-full h-full object-cover">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h3 class="text-xl font-bold mb-2">${i18n.t('carousel2Title')}</h3>
                    <p class="text-sm">${i18n.t('carousel2Desc')}</p>
                  </div>
                </div>
                <div class="carousel-slide">
                  <img src="https://cdn1.genspark.ai/user-upload-image/5_generated/02a827eb-8008-4c6d-9ef5-99223c52a331.jpeg" 
                       alt="Strategy planning" 
                       class="w-full h-full object-cover">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h3 class="text-xl font-bold mb-2">${i18n.t('carousel3Title')}</h3>
                    <p class="text-sm">${i18n.t('carousel3Desc')}</p>
                  </div>
                </div>
                
                <!-- Navigation arrows -->
                <button onclick="changeSlide(-1)" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center transition">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button onclick="changeSlide(1)" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center transition">
                  <i class="fas fa-chevron-right"></i>
                </button>
                
                <!-- Dots indicator -->
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  <button onclick="goToSlide(0)" class="carousel-dot active w-3 h-3 rounded-full bg-white"></button>
                  <button onclick="goToSlide(1)" class="carousel-dot w-3 h-3 rounded-full bg-white/50"></button>
                  <button onclick="goToSlide(2)" class="carousel-dot w-3 h-3 rounded-full bg-white/50"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Resources Section -->
      <section id="resources" class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">
            ${i18n.t('learningResources')}
          </h2>
          
          <!-- Tabs -->
          <div class="flex justify-center mb-8 space-x-4 flex-wrap">
            <button onclick="showResourceTab('articles')" id="tab-articles"
                    class="px-6 py-3 rounded-lg font-medium transition active-tab">
              <i class="fas fa-book mr-2"></i>${i18n.t('articles')}
            </button>
            <button onclick="showResourceTab('videos')" id="tab-videos"
                    class="px-6 py-3 rounded-lg font-medium transition inactive-tab">
              <i class="fas fa-video mr-2"></i>${i18n.t('videos')}
            </button>
            <button onclick="showResourceTab('ai-query')" id="tab-ai-query"
                    class="px-6 py-3 rounded-lg font-medium transition inactive-tab">
              <i class="fas fa-robot mr-2"></i>${i18n.t('aiQuery')}
            </button>
            ${(currentUser && (currentUser.role === 'premium' || currentUser.role === 'admin')) ? `
            <button onclick="openAIChat()" id="btn-ai-chat"
                    class="px-6 py-3 rounded-lg font-medium transition bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700">
              <i class="fas fa-comments mr-2"></i>${i18n.t('aiChat')}
            </button>
            ` : ''}
          </div>

          <!-- Articles Tab -->
          <div id="articles-content" class="tab-content max-w-4xl mx-auto">
            <div class="space-y-2">
              <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${i18n.t('loadingArticles')}</p>
              </div>
            </div>
          </div>

          <!-- Videos Tab -->
          <div id="videos-content" class="tab-content hidden max-w-4xl mx-auto">
            <div class="space-y-2">
              <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${i18n.t('loadingVideos')}</p>
              </div>
            </div>
          </div>

          <!-- AI Query Tab -->
          <div id="ai-query-content" class="tab-content hidden max-w-4xl mx-auto">
            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6">
              <div class="flex items-center gap-3">
                <i class="fas fa-robot text-2xl text-purple-600"></i>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">${i18n.t('aiQuery')}</h3>
                  <p class="text-sm text-gray-600">${i18n.t('aiQueryPlaceholder')}</p>
                </div>
              </div>
            </div>
            <div id="ai-results" class="space-y-2">
              <!-- AI结果将显示在这里 -->
            </div>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section id="about" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-4xl font-bold text-gray-900 mb-6">${i18n.t('aboutCompany')}</h2>
              <p class="text-lg text-gray-600 mb-4">${i18n.t('aboutCompanyText1')}</p>
              <p class="text-lg text-gray-600 mb-6">${i18n.t('aboutCompanyText2')}</p>
            </div>
            <div class="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 h-96 flex items-center justify-center overflow-hidden">
              <img src="https://cdn1.genspark.ai/user-upload-image/5_generated/e3a7c65c-8929-4568-9be3-3920f47db181.jpeg" 
                   alt="Team collaboration illustration" 
                   class="w-full h-full object-contain">
            </div>
          </div>
        </div>
      </section>

      <!-- Team Section -->
      <section class="py-16 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-4xl font-bold text-gray-900 mb-8">${i18n.t('teamIntro')}</h2>
          <div class="bg-white rounded-xl p-8 shadow-lg">
            <div class="w-28 h-28 bg-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <i class="fas fa-users text-indigo-600 text-5xl"></i>
            </div>
            <p id="team-description-text" class="text-xl text-gray-700 leading-relaxed">
              ${i18n.t('teamDescription') || '本软件由 GoGlobal AI 团队制作'}
            </p>
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section id="testimonials" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center mb-12">
            <h2 class="text-4xl font-bold text-gray-900">${i18n.t('userTestimonials')}</h2>
            <button onclick="showPublicMessageModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center">
              <i class="fas fa-plus mr-2"></i>${i18n.t('leaveYourMessage')}
            </button>
          </div>
          <div id="testimonials-container" class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Testimonials will be loaded dynamically -->
            <div class="col-span-3 text-center text-gray-500">
              <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
              <p>${i18n.t('loading') || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section id="contact" class="py-16 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">${i18n.t('contactUs')}</h2>
          <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg p-12 text-center">
            <div class="w-20 h-20 bg-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <i class="fas fa-envelope text-white text-3xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('email')}</h3>
            <a id="contact-email-link" href="mailto:ireviewsystem@hotmail.com" 
               class="text-2xl text-indigo-600 hover:text-indigo-700 font-semibold transition">
              <span id="contact-email-text">ireviewsystem@hotmail.com</span>
            </a>
            <p class="mt-6 text-gray-600">${i18n.t('emailUsAnytime') || '随时通过邮件与我们联系'}</p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 class="font-bold text-lg mb-4">${i18n.t('systemTitle')}</h3>
              <p class="text-gray-400 text-sm">${i18n.t('footerDescription')}</p>
            </div>
            <div>
              <h3 class="font-bold text-lg mb-4">${i18n.t('product')}</h3>
              <ul class="space-y-2 text-gray-400 text-sm">
                <li><a href="#" class="hover:text-white transition">${i18n.t('features')}</a></li>
                <li><a href="#" onclick="showPricingPlans(); return false;" class="hover:text-white transition">${i18n.t('pricingPlans')}</a></li>
                <li><a href="#resources" class="hover:text-white transition">${i18n.t('resources')}</a></li>
              </ul>
            </div>
            <div>
              <h3 class="font-bold text-lg mb-4">${i18n.t('company')}</h3>
              <ul class="space-y-2 text-gray-400 text-sm">
                <li><a href="#about" class="hover:text-white transition">${i18n.t('aboutUs')}</a></li>
                <li><a href="#testimonials" class="hover:text-white transition">${i18n.t('testimonials')}</a></li>
                <li><a href="#contact" class="hover:text-white transition">${i18n.t('contact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 class="font-bold text-lg mb-4">${i18n.t('legal')}</h3>
              <ul class="space-y-2 text-gray-400 text-sm">
                <li><a href="#" onclick="showTerms(); return false;" class="hover:text-white transition">${i18n.t('termsOfService')}</a></li>
                <li><a href="#" onclick="showPrivacy(); return false;" class="hover:text-white transition">${i18n.t('privacyPolicy')}</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 ${i18n.t('systemTitle')}. ${i18n.t('allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Load resources after page render
  loadArticles();
  loadTestimonials();
  
  // Initialize carousel
  initCarousel();
  
  // Apply dynamic UI settings after DOM is ready
  await applyUISettingsToDOM();
}

// Carousel functionality
let currentSlide = 0;
let carouselInterval;

function initCarousel() {
  // Auto-advance slides every 5 seconds
  carouselInterval = setInterval(() => {
    changeSlide(1);
  }, 5000);
}

function changeSlide(direction) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  
  if (!slides.length) return;
  
  // Remove active class from current slide
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  dots[currentSlide].classList.add('bg-white/50');
  dots[currentSlide].classList.remove('bg-white');
  
  // Calculate new slide index
  currentSlide = (currentSlide + direction + slides.length) % slides.length;
  
  // Add active class to new slide
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  dots[currentSlide].classList.remove('bg-white/50');
  dots[currentSlide].classList.add('bg-white');
  
  // Reset auto-advance timer
  clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    changeSlide(1);
  }, 5000);
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  
  if (!slides.length) return;
  
  // Remove active class from current slide
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  dots[currentSlide].classList.add('bg-white/50');
  dots[currentSlide].classList.remove('bg-white');
  
  // Set new slide index
  currentSlide = index;
  
  // Add active class to new slide
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  dots[currentSlide].classList.remove('bg-white/50');
  dots[currentSlide].classList.add('bg-white');
  
  // Reset auto-advance timer
  clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    changeSlide(1);
  }, 5000);
}

// Resource Tab Switching
function showResourceTab(tab) {
  const articlesTab = document.getElementById('tab-articles');
  const videosTab = document.getElementById('tab-videos');
  const aiQueryTab = document.getElementById('tab-ai-query');
  const articlesContent = document.getElementById('articles-content');
  const videosContent = document.getElementById('videos-content');
  const aiQueryContent = document.getElementById('ai-query-content');

  // Reset all tabs to inactive
  articlesTab.className = 'px-6 py-3 rounded-lg font-medium transition inactive-tab';
  videosTab.className = 'px-6 py-3 rounded-lg font-medium transition inactive-tab';
  aiQueryTab.className = 'px-6 py-3 rounded-lg font-medium transition inactive-tab';
  
  // Hide all content
  articlesContent.classList.add('hidden');
  videosContent.classList.add('hidden');
  aiQueryContent.classList.add('hidden');

  // Show selected tab
  if (tab === 'articles') {
    articlesTab.className = 'px-6 py-3 rounded-lg font-medium transition active-tab';
    articlesContent.classList.remove('hidden');
  } else if (tab === 'videos') {
    videosTab.className = 'px-6 py-3 rounded-lg font-medium transition active-tab';
    videosContent.classList.remove('hidden');
    if (!videosContent.dataset.loaded) {
      loadVideos();
    }
  } else if (tab === 'ai-query') {
    aiQueryTab.className = 'px-6 py-3 rounded-lg font-medium transition active-tab';
    aiQueryContent.classList.remove('hidden');
    // Auto-start AI query when tab is shown (only if not already loaded)
    if (!aiQueryContent.dataset.loaded) {
      startAIQuery();
      aiQueryContent.dataset.loaded = 'true';
    }
  }
}

// Load Articles using API - Show 6 random articles, update all 6 on refresh
async function loadArticles(refresh = false) {
  const articlesContent = document.getElementById('articles-content');
  
  try {
    // Always fetch fresh articles when refreshing, or fetch if not cached
    if (refresh || cachedArticles.length === 0) {
      const currentLang = i18n.getCurrentLanguage();
      console.log(`Loading articles with language: ${currentLang}, refresh: ${refresh}`);
      const response = await axios.get('/api/resources/articles');
      const { articles, source, language, keywords } = response.data;
      cachedArticles = articles;
      console.log(`Articles loaded from: ${source}, language: ${language}, count: ${articles.length}`);
      if (keywords && keywords.length > 0) {
        console.log(`Using keywords: ${keywords.join(', ')}`);
      }
    }
    
    // Select 6 random articles (refresh all 6 when clicking update)
    const shuffled = [...cachedArticles].sort(() => 0.5 - Math.random());
    displayedArticles = shuffled.slice(0, 6);
    
    // Render all 6 articles
    articlesContent.innerHTML = `
      <div class="grid grid-cols-1 gap-3">
        ${displayedArticles.map(article => `
          <a href="${article.url}" target="_blank" class="flex items-center gap-3 bg-white rounded-lg shadow hover:shadow-lg transition p-3 group">
            <div class="flex-shrink-0">
              <i class="fas fa-file-alt text-2xl text-indigo-600 group-hover:text-indigo-700"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm text-gray-900 truncate group-hover:text-indigo-600 transition">${escapeHtml(article.title)}</h3>
              <p class="text-xs text-gray-500 truncate">${escapeHtml(article.description)}</p>
            </div>
            <div class="flex-shrink-0">
              <i class="fas fa-external-link-alt text-gray-400 group-hover:text-indigo-600 transition"></i>
            </div>
          </a>
        `).join('')}
      </div>
      <div class="text-center mt-4">
        <button onclick="loadArticles(true)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition">
          <i class="fas fa-sync-alt mr-1"></i>${i18n.t('updateArticles') || 'Update Articles'}
        </button>
      </div>
    `;
    
    articlesContent.dataset.loaded = 'true';
  } catch (error) {
    console.error('Failed to load articles:', error);
    articlesContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-gray-600">${i18n.t('loadError')}</p>
      </div>
    `;
  }
}

// Load Videos using API - Show 6 random videos, update all 6 on refresh
async function loadVideos(refresh = false) {
  const videosContent = document.getElementById('videos-content');
  
  try {
    // Always fetch fresh videos when refreshing, or fetch if not cached
    if (refresh || cachedVideos.length === 0) {
      const currentLang = i18n.getCurrentLanguage();
      console.log(`Loading videos with language: ${currentLang}, refresh: ${refresh}`);
      const response = await axios.get('/api/resources/videos');
      const { videos, source, language, keywords } = response.data;
      cachedVideos = videos;
      console.log(`Videos loaded from: ${source}, language: ${language}, count: ${videos.length}`);
      if (keywords && keywords.length > 0) {
        console.log(`Using keywords: ${keywords.join(', ')}`);
      }
    }
    
    // Select 6 random videos (refresh all 6 when clicking update)
    const shuffled = [...cachedVideos].sort(() => 0.5 - Math.random());
    displayedVideos = shuffled.slice(0, 6);
    
    // Render all 6 videos
    videosContent.innerHTML = `
      <div class="grid grid-cols-1 gap-3">
        ${displayedVideos.map(video => `
          <a href="${video.url}" target="_blank" class="flex items-center gap-3 bg-white rounded-lg shadow hover:shadow-lg transition p-3 group">
            <div class="flex-shrink-0">
              <i class="fas fa-play-circle text-2xl text-red-600 group-hover:text-red-700"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm text-gray-900 truncate group-hover:text-red-600 transition">${escapeHtml(video.title)}</h3>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span class="truncate"><i class="fas fa-user-circle mr-1"></i>${escapeHtml(video.channel)}</span>
                <span class="flex-shrink-0"><i class="fas fa-eye mr-1"></i>${video.views}</span>
              </div>
            </div>
            <div class="flex-shrink-0">
              <i class="fas fa-external-link-alt text-gray-400 group-hover:text-red-600 transition"></i>
            </div>
          </a>
        `).join('')}
      </div>
      <div class="text-center mt-4">
        <button onclick="loadVideos(true)" class="text-red-600 hover:text-red-800 text-sm font-medium transition">
          <i class="fas fa-sync-alt mr-1"></i>${i18n.t('updateVideos') || 'Update Videos'}
        </button>
      </div>
    `;
    
    videosContent.dataset.loaded = 'true';
  } catch (error) {
    console.error('Failed to load videos:', error);
    videosContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-gray-600">${i18n.t('loadError')}</p>
      </div>
    `;
  }
}

// Start AI Query - Get keywords and query Gemini for article recommendations
async function startAIQuery() {
  const aiResults = document.getElementById('ai-results');
  
  try {
    // Show loading state
    aiResults.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-robot fa-spin text-5xl text-purple-600 mb-4"></i>
        <p class="text-gray-600 text-lg">${i18n.t('loadingAIResults')}</p>
        <p class="text-gray-500 text-sm mt-2">AI 正在分析关键词并搜索相关文章...</p>
      </div>
    `;
    
    // Get current language
    const currentLang = localStorage.getItem('language') || 'zh';
    
    // Call AI query API with language parameter
    const response = await axios.get(`/api/resources/ai-query?lang=${currentLang}`);
    const { articles, keywords } = response.data;
    
    if (!articles || articles.length === 0) {
      aiResults.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">暂无结果</p>
        </div>
      `;
      return;
    }
    
    // Display AI-generated articles
    aiResults.innerHTML = `
      <div class="bg-white rounded-lg p-4 mb-4">
        <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <i class="fas fa-tags text-purple-600"></i>
          <span>基于关键词: <strong>${keywords.join(', ')}</strong></span>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-3">
        ${articles.map((article, index) => `
          <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                ${index + 1}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 mb-2">${escapeHtml(article.title)}</h3>
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${escapeHtml(article.description || article.summary)}</p>
                ${article.url ? `
                  <a href="${article.url}" target="_blank" class="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium">
                    <i class="fas fa-external-link-alt"></i>
                    <span>查看文章</span>
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="text-center mt-6">
        <button onclick="startAIQuery()" class="text-purple-600 hover:text-purple-800 text-sm font-medium transition">
          <i class="fas fa-sync-alt mr-1"></i>重新查询
        </button>
      </div>
    `;
  } catch (error) {
    console.error('AI query failed:', error);
    aiResults.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
        <p class="text-gray-600">${i18n.t('aiQueryError')}</p>
        <button onclick="startAIQuery()" class="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
          <i class="fas fa-redo mr-2"></i>重试
        </button>
      </div>
    `;
  }
}

// Format testimonial time for display
function formatTestimonialTime(created_at) {
  if (!created_at) return '';
  
  const now = new Date();
  const createdDate = new Date(created_at);
  const diffMs = now - createdDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Format: YYYY-MM-DD HH:MM
  const year = createdDate.getFullYear();
  const month = String(createdDate.getMonth() + 1).padStart(2, '0');
  const day = String(createdDate.getDate()).padStart(2, '0');
  const hours = String(createdDate.getHours()).padStart(2, '0');
  const minutes = String(createdDate.getMinutes()).padStart(2, '0');
  
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
  
  // Relative time
  let relativeTime = '';
  if (diffMins < 1) {
    relativeTime = i18n.t('justNow');
  } else if (diffMins < 60) {
    relativeTime = `${diffMins} ${i18n.t('minutesAgo')}`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours} ${i18n.t('hoursAgo')}`;
  } else if (diffDays < 30) {
    relativeTime = `${diffDays} ${i18n.t('daysAgo')}`;
  } else {
    relativeTime = formattedDate;
  }
  
  return `<span title="${formattedDate}">${relativeTime}</span>`;
}

// Load Testimonials from API - Show latest 3 testimonials
async function loadTestimonials() {
  const testimonialsContainer = document.getElementById('testimonials-container');
  
  try {
    const lang = localStorage.getItem('language') || 'en';
    const response = await axios.get('/api/testimonials/latest', {
      headers: { 'X-Language': lang }
    });
    const { testimonials } = response.data;
    
    if (!testimonials || testimonials.length === 0) {
      testimonialsContainer.innerHTML = `
        <div class="col-span-3 text-center py-12">
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-12">
            <i class="fas fa-comments text-6xl text-indigo-400 mb-4"></i>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${i18n.t('noTestimonials')}</h3>
            <p class="text-gray-600 mb-6">${i18n.t('beFirstToLeave')}</p>
            <button onclick="showPublicMessageModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition inline-flex items-center">
              <i class="fas fa-edit mr-2"></i>${i18n.t('leaveYourMessage')}
            </button>
          </div>
        </div>
      `;
      return;
    }
    
    const bgColors = ['bg-indigo-100', 'bg-purple-100', 'bg-pink-100'];
    const textColors = ['text-indigo-600', 'text-purple-600', 'text-pink-600'];
    
    testimonialsContainer.innerHTML = testimonials.map((testimonial, index) => {
      const bgColor = bgColors[index % 3];
      const textColor = textColors[index % 3];
      const stars = '★'.repeat(testimonial.rating) + '☆'.repeat(5 - testimonial.rating);
      
      return `
        <div class="bg-gray-50 rounded-xl p-6 shadow-lg">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mr-3">
              ${testimonial.avatar_url ? 
                `<img src="${testimonial.avatar_url}" alt="${escapeHtml(testimonial.name)}" class="w-12 h-12 rounded-full object-cover">` :
                `<i class="fas fa-user ${textColor}"></i>`
              }
            </div>
            <div class="flex-1">
              <div class="font-bold text-gray-900">${escapeHtml(testimonial.name)}</div>
              <div class="text-sm text-gray-600">${escapeHtml(testimonial.role)}</div>
              <div class="text-xs text-gray-500 mt-1">
                <i class="far fa-clock mr-1"></i>${formatTestimonialTime(testimonial.created_at)}
              </div>
            </div>
          </div>
          <div class="text-yellow-400 mb-2" style="letter-spacing: 2px;">
            ${stars}
          </div>
          <p class="text-gray-600">${escapeHtml(testimonial.content)}</p>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Failed to load testimonials:', error);
    testimonialsContainer.innerHTML = `
      <div class="col-span-3 text-center py-8 text-red-500">
        <i class="fas fa-exclamation-circle text-4xl mb-3"></i>
        <p>${i18n.t('loadError') || 'Failed to load testimonials'}</p>
      </div>
    `;
  }
}

// Show Login Page
function showLogin() {
  currentView = 'login';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onclick="showHomePage()" class="mb-4 text-indigo-600 hover:text-indigo-800 text-sm">
          <i class="fas fa-arrow-left mr-2"></i>${i18n.t('backToHome')}
        </button>
        
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
          <!-- Google Sign-In Button -->
          <div class="mb-6">
            <div id="google-signin-button"></div>
          </div>
          
          <!-- Divider -->
          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">${i18n.t('orDivider')}</span>
            </div>
          </div>
          
          <!-- Email/Password Login -->
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
          
          <div class="text-center space-y-2">
            <div>
              <a href="#" onclick="showForgotPassword(); return false;" class="text-sm text-gray-600 hover:text-indigo-600">
                ${i18n.t('forgotPassword')}
              </a>
            </div>
            <div>
              <a href="#" onclick="showRegister(); return false;" class="text-indigo-600 hover:text-indigo-800">
                ${i18n.t('noAccount')} ${i18n.t('clickRegister')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Initialize Google Sign-In button after DOM is ready
  setTimeout(() => {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com',
        callback: handleGoogleLogin
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 400,
          text: 'continue_with'
        }
      );
    }
  }, 100);
}

// Show Register Page
function showRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onclick="showHomePage()" class="mb-4 text-indigo-600 hover:text-indigo-800 text-sm">
          <i class="fas fa-arrow-left mr-2"></i>${i18n.t('backToHome')}
        </button>
        
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            <i class="fas fa-user-plus text-indigo-600 mr-2"></i>
            ${i18n.t('register')}
          </h1>
        </div>

        <div id="register-form">
          <!-- Google Sign-In Button -->
          <div class="mb-6">
            <div id="google-register-button"></div>
          </div>
          
          <!-- Divider -->
          <div class="relative mb-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">${i18n.t('orDivider')}</span>
            </div>
          </div>
          
          <!-- Email/Password Registration -->
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
          
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">${i18n.t('confirmPassword')}</label>
            <input type="password" id="register-confirm-password" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('confirmPassword')}">
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
  
  // Initialize Google Sign-In button after DOM is ready
  setTimeout(() => {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '78785931273-pse627aasv4h50mcc1cschj5cvtqr88f.apps.googleusercontent.com',
        callback: handleGoogleLogin
      });
      google.accounts.id.renderButton(
        document.getElementById('google-register-button'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 400,
          text: 'continue_with'
        }
      );
    }
  }, 100);
}

// Show Dashboard
async function showDashboard(tab = 'my-reviews') {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
  currentView = 'dashboard';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Tab Navigation -->
        <div class="bg-white rounded-lg shadow-md mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              <button onclick="showDashboard('my-reviews')" 
                      id="tab-my-reviews"
                      class="tab-button ${tab === 'my-reviews' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                             whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
                <i class="fas fa-clipboard-list mr-2"></i>${i18n.t('myReviews')}
              </button>
              <button onclick="showDashboard('public-reviews')" 
                      id="tab-public-reviews"
                      class="tab-button ${tab === 'public-reviews' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                             whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
                <i class="fas fa-globe mr-2"></i>${i18n.t('publicReviews')}
              </button>
              ${currentUser && (currentUser.role === 'admin' || (currentUser.subscription_tier && currentUser.subscription_tier !== 'free')) ? `
              <button onclick="showDashboard('famous-books')" 
                      id="tab-famous-books"
                      class="tab-button ${tab === 'famous-books' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                             whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
                <i class="fas fa-book mr-2"></i>${i18n.t('famousBookReview') || 'Famous Book Review'}
              </button>
              <button onclick="showDashboard('documents')" 
                      id="tab-documents"
                      class="tab-button ${tab === 'documents' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                             whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
                <i class="fas fa-file-alt mr-2"></i>${i18n.t('documentsReview') || 'Documents Review'}
              </button>
              ` : ''}
            </nav>
          </div>
        </div>

        <!-- Tab Content -->
        <div id="dashboard-content">
          ${tab === 'my-reviews' ? `
          <!-- Stats Cards -->
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
            
            <div class="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition" onclick="showTeams()">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 mb-1">${i18n.t('teams')}</p>
                  <p class="text-3xl font-bold text-green-600" id="team-count">-</p>
                </div>
                <i class="fas fa-users text-4xl text-green-200"></i>
              </div>
            </div>
            
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

          <!-- Reviews List with Filters -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-gray-800">${i18n.t('myReviews')}</h2>
              <button onclick="showCreateReview()" 
                      class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                <i class="fas fa-plus mr-2"></i>${i18n.t('createReview')}
              </button>
            </div>
            
            <!-- Filters Section -->
            <div class="bg-white rounded-lg shadow-md p-4 mb-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Status Filter -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-filter mr-1"></i>${i18n.t('status')}
                  </label>
                  <select id="dashboard-filter-status" 
                          onchange="filterDashboardReviews()" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="all">${i18n.t('all')}</option>
                    <option value="draft">${i18n.t('draft')}</option>
                    <option value="completed">${i18n.t('completed')}</option>
                  </select>
                </div>
                
                <!-- Search Input -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-search mr-1"></i>${i18n.t('search')}
                  </label>
                  <input id="dashboard-search-input" 
                         type="text" 
                         oninput="filterDashboardReviews()" 
                         placeholder="${i18n.t('searchPlaceholder') || '搜索标题...'}"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                
                <!-- Time Type Filter -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-clock mr-1"></i>${i18n.t('timeType')}
                  </label>
                  <select id="dashboard-filter-time-type" 
                          onchange="filterDashboardReviews()" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="all">${i18n.t('all')}</option>
                    <option value="daily">${i18n.t('daily')}</option>
                    <option value="weekly">${i18n.t('weekly')}</option>
                    <option value="monthly">${i18n.t('monthly')}</option>
                    <option value="quarterly">${i18n.t('quarterly')}</option>
                    <option value="yearly">${i18n.t('yearly')}</option>
                    <option value="project">${i18n.t('project')}</option>
                  </select>
                </div>
                
                <!-- Owner Type Filter -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-user-tag mr-1"></i>${i18n.t('ownerType')}
                  </label>
                  <select id="dashboard-filter-owner-type" 
                          onchange="filterDashboardReviews()" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="all">${i18n.t('all')}</option>
                    <option value="personal">${i18n.t('personal')}</option>
                    <option value="team">${i18n.t('team')}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Reviews Container -->
            <div id="dashboard-reviews-container" class="bg-white rounded-lg shadow-md">
              <div class="p-8 text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${i18n.t('loading')}</p>
              </div>
            </div>
          </div>
          ` : tab === 'public-reviews' ? `
          <!-- Public Reviews Tab Content -->
          <div class="mb-6">
            <div class="mb-4">
              <p class="text-gray-600">
                ${i18n.t('publicReviewsDesc') || '查看所有公开的复盘，供学习和参考'}
              </p>
            </div>

            <!-- Public Reviews List -->
            <div id="public-reviews-container" class="bg-white rounded-lg shadow-md">
              <div class="p-8 text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${i18n.t('loading')}</p>
              </div>
            </div>
          </div>
          ` : tab === 'famous-books' ? `
          <!-- Famous Book Review Tab Content -->
          <div class="mb-6">
            <div class="mb-4">
              <p class="text-gray-600">
                ${i18n.t('famousBookReviewDesc') || '名著复盘 - 经典著作的深度分析和思考'}
              </p>
            </div>

            <!-- Famous Book Reviews List -->
            <div id="famous-books-container" class="bg-white rounded-lg shadow-md">
              <div class="p-8 text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${i18n.t('loading')}</p>
              </div>
            </div>
          </div>
          ` : tab === 'documents' ? `
          <!-- Documents Review Tab Content -->
          <div class="mb-6">
            <div class="mb-4">
              <p class="text-gray-600">
                ${i18n.t('documentsReviewDesc') || '文档复盘 - 重要文档和资料的整理归纳'}
              </p>
            </div>

            <!-- Documents Reviews List -->
            <div id="documents-container" class="bg-white rounded-lg shadow-md">
              <div class="p-8 text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${i18n.t('loading')}</p>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  if (tab === 'my-reviews') {
    await loadDashboardData();
  } else if (tab === 'public-reviews') {
    await loadPublicReviews();
  } else if (tab === 'famous-books') {
    await loadFamousBooksReviews();
  } else if (tab === 'documents') {
    await loadDocumentsReviews();
  }
  window.scrollTo(0, 0); // Scroll to top of page
}

// Handle Login
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await axios.post('/api/auth/login', { email, password });
    authToken = response.data.token;
    currentUser = response.data.user;
    window.currentUser = currentUser;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    // Set user's preferred language
    if (currentUser.language) {
      i18n.setLanguage(currentUser.language);
    }
    
    // Check if there's a pending team invitation to accept
    const teamInviteToken = sessionStorage.getItem('team_invite_token');
    if (teamInviteToken) {
      sessionStorage.removeItem('team_invite_token');
      await acceptTeamInvitation(teamInviteToken);
      return;
    }
    
    // Check if there's a pending review invitation (referral)
    const referralToken = sessionStorage.getItem('referral_token');
    if (referralToken) {
      // Clear the token - user has successfully registered/logged in
      sessionStorage.removeItem('referral_token');
      // Show success message and go to dashboard
      showNotification(i18n.t('loginSuccess') || '登录成功', 'success');
      // Go directly to dashboard, don't redirect back to invitation page
      setTimeout(() => {
        showDashboard();
      }, 1000);
      return;
    }
    
    showDashboard();
  } catch (error) {
    alert(i18n.t('loginFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

// Handle Register
async function handleRegister() {
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  // Validate inputs
  if (!username || !email || !password || !confirmPassword) {
    alert(i18n.t('fillAllFields'));
    return;
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    alert(i18n.t('passwordMismatch'));
    return;
  }

  // Check password length
  if (password.length < 6) {
    alert(i18n.t('passwordTooShort'));
    return;
  }

  try {
    const response = await axios.post('/api/auth/register', { email, password, username });
    authToken = response.data.token;
    currentUser = response.data.user;
    window.currentUser = currentUser;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    // Set user's preferred language
    if (currentUser.language) {
      i18n.setLanguage(currentUser.language);
    }
    
    // Check if there's a pending team invitation to accept
    const teamInviteToken = sessionStorage.getItem('team_invite_token');
    if (teamInviteToken) {
      sessionStorage.removeItem('team_invite_token');
      await acceptTeamInvitation(teamInviteToken);
    } else {
      showDashboard();
    }
  } catch (error) {
    alert(i18n.t('registerFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

// Dashboard Data Management
let dashboardReviews = [];
let dashboardCurrentPage = 1;
const dashboardItemsPerPage = 5;

async function loadDashboardData() {
  try {
    const reviewsRes = await axios.get('/api/reviews');
    dashboardReviews = reviewsRes.data.reviews || [];
    
    const reviewCountEl = document.getElementById('review-count');
    const completedCountEl = document.getElementById('completed-count');
    const teamCountEl = document.getElementById('team-count');
    
    if (reviewCountEl) {
      reviewCountEl.textContent = dashboardReviews.length;
    }
    if (completedCountEl) {
      completedCountEl.textContent = dashboardReviews.filter(r => r.status === 'completed').length;
    }
    
    dashboardCurrentPage = 1; // Reset to first page
    renderDashboardReviewsList(dashboardReviews);
    
    // Load teams data for all users
    try {
      const teamsRes = await axios.get('/api/teams');
      const myTeamsCount = teamsRes.data.myTeams ? teamsRes.data.myTeams.length : 0;
      if (teamCountEl) {
        teamCountEl.textContent = myTeamsCount;
      }
    } catch (error) {
      console.error('Load teams error:', error);
      if (teamCountEl) {
        teamCountEl.textContent = '0';
      }
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
    const container = document.getElementById('dashboard-reviews-container');
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center">
          <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
          <p class="text-red-600">${i18n.t('operationFailed')}</p>
        </div>
      `;
    }
    // Set defaults on error
    const reviewCountEl = document.getElementById('review-count');
    const completedCountEl = document.getElementById('completed-count');
    const teamCountEl = document.getElementById('team-count');
    if (reviewCountEl) reviewCountEl.textContent = '0';
    if (completedCountEl) completedCountEl.textContent = '0';
    if (teamCountEl) teamCountEl.textContent = '0';
  }
}

// Filter dashboard reviews based on filters
function filterDashboardReviews() {
  const statusFilter = document.getElementById('dashboard-filter-status')?.value || 'all';
  const searchText = document.getElementById('dashboard-search-input')?.value.toLowerCase() || '';
  const timeTypeFilter = document.getElementById('dashboard-filter-time-type')?.value || 'all';
  const ownerTypeFilter = document.getElementById('dashboard-filter-owner-type')?.value || 'all';

  let filtered = dashboardReviews.filter(review => {
    // Status filter
    if (statusFilter !== 'all' && review.status !== statusFilter) return false;
    
    // Search filter
    if (searchText && !review.title.toLowerCase().includes(searchText)) return false;
    
    // Time type filter
    if (timeTypeFilter !== 'all' && review.time_type !== timeTypeFilter) return false;
    
    // Owner type filter
    if (ownerTypeFilter !== 'all' && review.owner_type !== ownerTypeFilter) return false;
    
    return true;
  });

  dashboardCurrentPage = 1; // Reset to first page when filtering
  renderDashboardReviewsList(filtered);
}

function changeDashboardPage(newPage, reviews) {
  dashboardCurrentPage = newPage;
  renderDashboardReviewsList(reviews);
}

// Render dashboard reviews list with pagination (full-featured)
function renderDashboardReviewsList(reviews) {
  const container = document.getElementById('dashboard-reviews-container');
  if (!container) return;
  
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

  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / dashboardItemsPerPage);
  const startIndex = (dashboardCurrentPage - 1) * dashboardItemsPerPage;
  const endIndex = startIndex + dashboardItemsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  // Store reviews for pagination
  window.dashboardCurrentReviews = reviews;

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('reviewTitle')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('creator') || '创建者'}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('ownerType')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('status')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('updatedAt')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('actions')}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${paginatedReviews.map(review => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(review.title)}</div>
                ${review.team_name ? `<div class="text-xs text-gray-500"><i class="fas fa-users mr-1"></i>${escapeHtml(review.team_name)}</div>` : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                  <span class="text-sm text-gray-700">${escapeHtml(review.creator_name || 'Unknown')}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${renderOwnerTypeBadge(review.owner_type)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                  ${i18n.t(review.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-700">
                    <i class="fas fa-edit text-xs mr-1"></i>
                    ${new Date(review.updated_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  ${review.created_at ? `
                    <span class="text-xs text-gray-400 mt-1">
                      <i class="fas fa-plus-circle text-xs mr-1"></i>
                      ${new Date(review.created_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  ` : ''}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="showReviewDetail(${review.id}, true)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-eye"></i> ${i18n.t('view')}
                </button>
                <button onclick="showEditReview(${review.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                  <i class="fas fa-edit"></i> ${i18n.t('edit')}
                </button>
                <button onclick="printReview(${review.id})" class="text-green-600 hover:text-green-900 mr-3">
                  <i class="fas fa-print"></i> ${i18n.t('print')}
                </button>
                <button onclick="showInviteModal(${review.id})" class="text-purple-600 hover:text-purple-900 mr-3">
                  <i class="fas fa-user-plus"></i> ${i18n.t('invite')}
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
    
    <!-- Pagination -->
    ${totalPages > 1 ? `
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button onclick="changeDashboardPage(${dashboardCurrentPage - 1}, window.dashboardCurrentReviews)" 
                  ${dashboardCurrentPage === 1 ? 'disabled' : ''}
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${dashboardCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            ${i18n.t('previousPage') || '上一页'}
          </button>
          <button onclick="changeDashboardPage(${dashboardCurrentPage + 1}, window.dashboardCurrentReviews)" 
                  ${dashboardCurrentPage === totalPages ? 'disabled' : ''}
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${dashboardCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            ${i18n.t('nextPage') || '下一页'}
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              ${i18n.t('showing') || '显示'} 
              <span class="font-medium">${startIndex + 1}</span>
              ${i18n.t('to') || '到'}
              <span class="font-medium">${Math.min(endIndex, reviews.length)}</span>
              ${i18n.t('of') || '共'}
              <span class="font-medium">${reviews.length}</span>
              ${i18n.t('results') || '条结果'}
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button onclick="changeDashboardPage(${dashboardCurrentPage - 1}, window.dashboardCurrentReviews)" 
                      ${dashboardCurrentPage === 1 ? 'disabled' : ''}
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${dashboardCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fas fa-chevron-left"></i>
              </button>
              ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                <button onclick="changeDashboardPage(${page}, window.dashboardCurrentReviews)"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                          page === dashboardCurrentPage 
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }">
                  ${page}
                </button>
              `).join('')}
              <button onclick="changeDashboardPage(${dashboardCurrentPage + 1}, window.dashboardCurrentReviews)" 
                      ${dashboardCurrentPage === totalPages ? 'disabled' : ''}
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${dashboardCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fas fa-chevron-right"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

// Show My Reviews Page
async function showReviews() {
  // Only auto-save if coming from create review page AND not just completed a save
  // Skip auto-save if currentView is already changed (e.g., 'completing-review')
  if (currentView === 'create-review-step1' || currentView === 'create-review-step2') {
    await autoSaveDraftBeforeNavigation();
  }
  
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
                <i class="fas fa-calendar-alt mr-1"></i>${i18n.t('timeType')}
              </label>
              <select id="filter-time-type" onchange="filterReviews()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="all">${i18n.t('all') || '全部'}</option>
                <option value="daily">${i18n.t('timeTypeDaily')}</option>
                <option value="weekly">${i18n.t('timeTypeWeekly')}</option>
                <option value="monthly">${i18n.t('timeTypeMonthly')}</option>
                <option value="quarterly">${i18n.t('timeTypeQuarterly')}</option>
                <option value="yearly">${i18n.t('timeTypeYearly')}</option>
                <option value="free">${i18n.t('timeTypeFree')}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-shield-alt mr-1"></i>${i18n.t('ownerType')}
              </label>
              <select id="filter-owner-type" onchange="filterReviews()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="all">${i18n.t('all') || '全部'}</option>
                <option value="private">${i18n.t('ownerTypePrivate')}</option>
                <option value="team">${i18n.t('ownerTypeTeam')}</option>
                <option value="public">${i18n.t('ownerTypePublic')}</option>
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
  window.scrollTo(0, 0); // Scroll to top of page
}

// Show Public Reviews page
async function showPublicReviews() {
  currentView = 'public-reviews';
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-globe mr-2"></i>${i18n.t('publicReviews')}
          </h1>
          <p class="text-gray-600 mt-2">
            ${i18n.t('publicReviewsDesc') || '查看所有公开的复盘，供学习和参考'}
          </p>
        </div>

        <!-- Public Reviews List -->
        <div id="public-reviews-container" class="bg-white rounded-lg shadow-md">
          <div class="p-8 text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
            <p class="text-gray-600">${i18n.t('loading')}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadPublicReviews();
  window.scrollTo(0, 0); // Scroll to top of page
}

let publicReviews = [];

async function loadPublicReviews() {
  try {
    const response = await axios.get('/api/reviews/public');
    publicReviews = response.data.reviews;
    renderPublicReviewsList(publicReviews);
  } catch (error) {
    console.error('Load public reviews error:', error);
    document.getElementById('public-reviews-container').innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function renderPublicReviewsList(reviews) {
  const container = document.getElementById('public-reviews-container');
  
  if (!reviews || reviews.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-600">${i18n.t('noPublicReviews') || '暂无公开的复盘'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('reviewTitle')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('creator')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('ownerType')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('status')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('updatedAt')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('actions')}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${reviews.map(review => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      ${escapeHtml(review.title)}
                    </div>
                    ${review.team_name ? `
                      <div class="text-xs text-gray-500">
                        <i class="fas fa-users mr-1"></i>${escapeHtml(review.team_name)}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(review.creator_name)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${renderOwnerTypeBadge(review.owner_type)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  review.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }">
                  ${i18n.t(review.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-700">
                    <i class="fas fa-edit text-xs mr-1"></i>
                    ${new Date(review.updated_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  ${review.created_at ? `
                    <span class="text-xs text-gray-400 mt-1">
                      <i class="fas fa-plus-circle text-xs mr-1"></i>
                      ${new Date(review.created_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  ` : ''}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="showReviewDetail(${review.id}, true)" 
                        class="text-indigo-600 hover:text-indigo-900">
                  <i class="fas fa-eye"></i> ${i18n.t('view')}
                </button>
                <button onclick="printReview(${review.id})" 
                        class="text-blue-600 hover:text-blue-900">
                  <i class="fas fa-print"></i> ${i18n.t('print')}
                </button>
                ${canEditReview(review) ? `
                  <button onclick="showEditReview(${review.id})" 
                          class="text-green-600 hover:text-green-900">
                    <i class="fas fa-edit"></i> ${i18n.t('edit')}
                  </button>
                ` : ''}
                ${canDeleteReview(review) ? `
                  <button onclick="deletePublicReview(${review.id})" 
                          class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> ${i18n.t('delete')}
                  </button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Check if current user can edit a review
function canEditReview(review) {
  if (!currentUser) return false;
  
  // Admin can edit any review
  if (currentUser.role === 'admin') return true;
  
  // Creator can edit their own review
  if (review.user_id === currentUser.id) return true;
  
  // Team members can edit team reviews
  // This includes:
  // 1. Reviews created by team (has team_id)
  // 2. User is a member of that team (is_team_member flag from API)
  if (review.team_id && review.is_team_member) {
    return true;
  }
  
  return false;
}

// Check if current user can delete a review
function canDeleteReview(review) {
  if (!currentUser) return false;
  
  // Admin can delete any review
  if (currentUser.role === 'admin') return true;
  
  // Creator can delete their own review
  if (review.user_id === currentUser.id) return true;
  
  return false;
}

async function deletePublicReview(reviewId) {
  if (!confirm(i18n.t('confirmDeleteReview') || '确认删除此复盘吗？此操作不可撤销。')) {
    return;
  }
  
  try {
    await axios.delete(`/api/reviews/${reviewId}`);
    showNotification(i18n.t('deleteSuccess') || '删除成功', 'success');
    // Reload the public reviews list
    await loadPublicReviews();
  } catch (error) {
    console.error('Failed to delete review:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// TinyMCE helper function removed - now using simple textarea editors
// All rich text editing functionality has been replaced with plain text textarea
// for better performance and clearer content display

// Load Famous Books Reviews (Premium feature)
async function loadFamousBooksReviews() {
  try {
    const response = await axios.get('/api/reviews/famous-books');
    const reviews = response.data.reviews;
    renderFamousBooksReviewsList(reviews);
  } catch (error) {
    console.error('Load famous books reviews error:', error);
    document.getElementById('famous-books-container').innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${error.response?.data?.error || i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function renderFamousBooksReviewsList(reviews) {
  const container = document.getElementById('famous-books-container');
  
  // Always show "New Review" button at the top
  const hasReviews = reviews && reviews.length > 0;
  
  if (!hasReviews) {
    // Show create form with "New Review" button
    container.innerHTML = `
      <div class="mb-4 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-book mr-2"></i>${i18n.t('famousBookReview')}
        </h3>
        <button onclick="showFamousBookForm()" 
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>${i18n.t('createNew')}
        </button>
      </div>
      <div class="p-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            <i class="fas fa-book mr-2"></i>${i18n.t('createFamousBookReview')}
          </h3>
        </div>
        
        <form id="famous-book-form" class="space-y-6">
          <!-- Type Selection: Video or Book -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              ${i18n.t('videoOrBook')} <span class="text-red-600">*</span>
            </label>
            <div class="flex space-x-6">
              <label class="flex items-center cursor-pointer">
                <input type="radio" name="input-type" value="video" checked
                       class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                       onchange="toggleFamousBookInputType()">
                <span class="ml-2 text-sm text-gray-700">${i18n.t('videoLink')}</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" name="input-type" value="book"
                       class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                       onchange="toggleFamousBookInputType()">
                <span class="ml-2 text-sm text-gray-700">${i18n.t('bookName')}</span>
              </label>
            </div>
          </div>

          <!-- Video Link Input (shown by default) -->
          <div id="video-link-input">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('videoLink')} <span class="text-red-600">*</span>
            </label>
            <input type="url" id="video-link"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('videoLinkPlaceholder')}"
                   required>
          </div>

          <!-- Book Name Input (hidden by default) -->
          <div id="book-name-input" style="display: none;">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('bookName')} <span class="text-red-600">*</span>
            </label>
            <input type="text" id="book-name"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('bookNamePlaceholder')}">
          </div>

          <!-- Word Count Requirement -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('wordCountRequirement')} <span class="text-red-600">*</span>
            </label>
            <input type="number" id="word-count" min="500" max="10000" step="100"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('wordCountPlaceholder')}"
                   required>
          </div>

          <!-- Application Scenario -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('applicationScenario')} <span class="text-red-600">*</span>
            </label>
            <select id="application-scenario"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required>
              <option value="">${i18n.t('selectScenario')}</option>
              <option value="workplace">${i18n.t('scenarioWorkplace')}</option>
              <option value="entrepreneurship">${i18n.t('scenarioEntrepreneurship')}</option>
              <option value="personal-growth">${i18n.t('scenarioPersonalGrowth')}</option>
              <option value="financial-planning">${i18n.t('scenarioFinancialPlanning')}</option>
            </select>
          </div>

          <!-- Output Language -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('outputLanguage')} <span class="text-red-600">*</span>
            </label>
            <select id="output-language"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required>
              <option value="">${i18n.t('selectLanguage')}</option>
              <option value="en">${i18n.t('langEnglish')}</option>
              <option value="fr">${i18n.t('langFrench')}</option>
              <option value="es">${i18n.t('langSpanish')}</option>
              <option value="zh-CN">${i18n.t('langChineseSimplified')}</option>
              <option value="zh-TW">${i18n.t('langChineseTraditional')}</option>
              <option value="ja">${i18n.t('langJapanese')}</option>
            </select>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-3">
            <button type="submit"
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-magic mr-2"></i>${i18n.t('generatePrompt')}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Attach form submit handler
    document.getElementById('famous-book-form').addEventListener('submit', handleFamousBookFormSubmit);
    return;
  }

  container.innerHTML = `
    <div class="mb-4 flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">
        <i class="fas fa-book mr-2"></i>${i18n.t('famousBookReview')}
      </h3>
      <button onclick="showFamousBookForm()" 
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        <i class="fas fa-plus mr-2"></i>${i18n.t('createNew')}
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('reviewTitle')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('creator')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('status')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('updatedAt')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('actions')}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${reviews.map(review => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <i class="fas fa-book text-amber-600 mr-2"></i>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      ${escapeHtml(review.title)}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(review.creator_name)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  review.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }">
                  ${review.status === 'published' ? i18n.t('published') : i18n.t('draft')}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(review.updated_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td class="px-6 py-4 text-sm font-medium">
                <div class="flex space-x-2">
                  <button onclick="viewFamousBookReview(${review.id})" 
                          class="text-indigo-600 hover:text-indigo-900"
                          title="${i18n.t('view')}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button onclick="editFamousBookReview(${review.id})" 
                          class="text-blue-600 hover:text-blue-900"
                          title="${i18n.t('edit')}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="downloadFamousBookReview(${review.id})" 
                          class="text-green-600 hover:text-green-900"
                          title="${i18n.t('download')}">
                    <i class="fas fa-download"></i>
                  </button>
                  <button onclick="deleteFamousBookReview(${review.id})" 
                          class="text-red-600 hover:text-red-900"
                          title="${i18n.t('delete')}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Load Documents Reviews (Premium feature)
async function loadDocumentsReviews() {
  try {
    const response = await axios.get('/api/reviews/documents');
    const reviews = response.data.reviews;
    renderDocumentsReviewsList(reviews);
  } catch (error) {
    console.error('Load documents reviews error:', error);
    document.getElementById('documents-container').innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${error.response?.data?.error || i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function renderDocumentsReviewsList(reviews) {
  const container = document.getElementById('documents-container');
  
  // Always show "New Review" button at the top
  const hasReviews = reviews && reviews.length > 0;
  
  if (!hasReviews) {
    // Show create form with "New Review" button
    container.innerHTML = `
      <div class="mb-4 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-file-alt mr-2"></i>${i18n.t('documentReview')}
        </h3>
        <button onclick="showDocumentForm()" 
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>${i18n.t('createNew')}
        </button>
      </div>
      <div class="p-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            <i class="fas fa-file-alt mr-2"></i>${i18n.t('createDocumentReview')}
          </h3>
        </div>
        
        <form id="document-form" class="space-y-6">
          <!-- File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('uploadDocument')} <span class="text-red-600">*</span>
            </label>
            <div class="flex items-center space-x-4">
              <label class="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                <div class="text-center">
                  <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                  <p class="text-sm text-gray-600">${i18n.t('uploadDocumentHint')}</p>
                  <p class="text-xs text-gray-500 mt-1" id="file-name">${i18n.t('selectFile')}</p>
                </div>
                <input type="file" id="document-file" accept=".pdf,.doc,.docx,.txt" class="hidden" required onchange="updateFileName()">
              </label>
            </div>
          </div>

          <!-- Word Count Requirement -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('wordCountRequirement')} <span class="text-red-600">*</span>
            </label>
            <input type="number" id="doc-word-count" min="500" max="10000" step="100"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('wordCountPlaceholder')}"
                   required>
          </div>

          <!-- Application Scenario -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('applicationScenario')} <span class="text-red-600">*</span>
            </label>
            <select id="doc-application-scenario"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required>
              <option value="">${i18n.t('selectScenario')}</option>
              <option value="workplace">${i18n.t('scenarioWorkplace')}</option>
              <option value="entrepreneurship">${i18n.t('scenarioEntrepreneurship')}</option>
              <option value="personal-growth">${i18n.t('scenarioPersonalGrowth')}</option>
              <option value="financial-planning">${i18n.t('scenarioFinancialPlanning')}</option>
            </select>
          </div>

          <!-- Output Language -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('outputLanguage')} <span class="text-red-600">*</span>
            </label>
            <select id="doc-output-language"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required>
              <option value="">${i18n.t('selectLanguage')}</option>
              <option value="en">${i18n.t('langEnglish')}</option>
              <option value="fr">${i18n.t('langFrench')}</option>
              <option value="es">${i18n.t('langSpanish')}</option>
              <option value="zh-CN">${i18n.t('langChineseSimplified')}</option>
              <option value="zh-TW">${i18n.t('langChineseTraditional')}</option>
              <option value="ja">${i18n.t('langJapanese')}</option>
            </select>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-3">
            <button type="submit"
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-magic mr-2"></i>${i18n.t('generatePrompt')}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Attach form submit handler
    document.getElementById('document-form').addEventListener('submit', handleDocumentFormSubmit);
    
    // Setup drag and drop functionality for file upload
    setupDocumentFileDragDrop();
    return;
  }

  container.innerHTML = `
    <div class="mb-4 flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">
        <i class="fas fa-file-alt mr-2"></i>${i18n.t('documentReview')}
      </h3>
      <button onclick="showDocumentForm()" 
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        <i class="fas fa-plus mr-2"></i>${i18n.t('createNew')}
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('reviewTitle')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('creator')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('status')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('updatedAt')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('actions')}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${reviews.map(review => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <i class="fas fa-file-alt text-blue-600 mr-2"></i>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      ${escapeHtml(review.title)}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(review.creator_name)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  review.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }">
                  ${i18n.t(review.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(review.updated_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td class="px-6 py-4 text-sm font-medium">
                <div class="flex space-x-2">
                  <button onclick="showReviewDetail(${review.id}, true)" 
                          class="text-indigo-600 hover:text-indigo-900"
                          title="${i18n.t('view')}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button onclick="editDocumentReview(${review.id})" 
                          class="text-blue-600 hover:text-blue-900"
                          title="${i18n.t('edit')}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="downloadDocumentReview(${review.id})" 
                          class="text-green-600 hover:text-green-900"
                          title="${i18n.t('download')}">
                    <i class="fas fa-download"></i>
                  </button>
                  <button onclick="deleteDocumentReview(${review.id})" 
                          class="text-red-600 hover:text-red-900"
                          title="${i18n.t('delete')}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Toggle Famous Book input type (video or book)
function toggleFamousBookInputType() {
  const inputType = document.querySelector('input[name="input-type"]:checked').value;
  const videoLinkInput = document.getElementById('video-link-input');
  const bookNameInput = document.getElementById('book-name-input');
  const videoLink = document.getElementById('video-link');
  const bookName = document.getElementById('book-name');
  
  if (inputType === 'video') {
    videoLinkInput.style.display = 'block';
    bookNameInput.style.display = 'none';
    videoLink.required = true;
    bookName.required = false;
    bookName.value = '';
  } else {
    videoLinkInput.style.display = 'none';
    bookNameInput.style.display = 'block';
    videoLink.required = false;
    bookName.required = true;
    videoLink.value = '';
  }
}

// Handle Famous Book form submission
async function handleFamousBookFormSubmit(e) {
  e.preventDefault();
  
  const inputType = document.querySelector('input[name="input-type"]:checked').value;
  const videoLink = document.getElementById('video-link').value;
  const bookName = document.getElementById('book-name').value;
  const wordCount = document.getElementById('word-count').value;
  const scenario = document.getElementById('application-scenario').value;
  const language = document.getElementById('output-language').value;
  
  const formData = {
    inputType,
    content: inputType === 'video' ? videoLink : bookName,
    wordCount: parseInt(wordCount),
    scenario,
    language
  };
  
  // Generate and show prompt editor
  showFamousBookPromptEditor(formData);
}

// Generate Prompt template for Famous Book
function generateFamousBookPrompt(formData) {
  const scenarioMap = {
    'workplace': i18n.t('scenarioWorkplace'),
    'entrepreneurship': i18n.t('scenarioEntrepreneurship'),
    'personal-growth': i18n.t('scenarioPersonalGrowth'),
    'financial-planning': i18n.t('scenarioFinancialPlanning')
  };
  
  const languageMap = {
    'en': i18n.t('langEnglish'),
    'fr': i18n.t('langFrench'),
    'es': i18n.t('langSpanish'),
    'zh-CN': i18n.t('langChineseSimplified'),
    'zh-TW': i18n.t('langChineseTraditional'),
    'ja': i18n.t('langJapanese')
  };
  
  const contentType = formData.inputType === 'video' ? '视频' : '书';
  const scenarioText = scenarioMap[formData.scenario] || formData.scenario;
  const languageText = languageMap[formData.language] || formData.language;
  
  const videoNote = formData.inputType === 'video' ? 
    `\n\n视频链接：${formData.content}\n\n【系统提示】如果这是 YouTube 视频，系统会自动获取视频标题、描述和其他元数据来辅助分析。请基于这些信息进行深入分析。\n` : 
    `\n\n书名：${formData.content}\n`;
  
  return `你是一名知识架构师，请帮我结构化榨干一本${contentType}的核心内容，输出一份 ${formData.wordCount} 字的复盘文档，覆盖以下结构：${videoNote}

【核心主题与核心观点】
- 这本${contentType}在解决什么问题？
- 作者的核心论点是什么？
- 有哪些支撑观点的关键证据或案例？

【关键概念与框架】
- ${contentType}中提出了哪些重要概念？
- 是否有可复用的思维框架或方法论？
- 这些概念之间的逻辑关系是什么？

【应用场景与实践建议】
针对${scenarioText}场景：
- 可以从中提炼出哪些可落地的行动建议？
- 有哪些需要避免的误区或陷阱？
- 如何将这些知识应用到实际工作/生活中？

【启发与思考】
- 这本${contentType}改变了你对哪些问题的看法？
- 还有哪些延伸阅读或相关资源？

${formData.inputType === 'video' ? `视频链接：${formData.content}` : `书名：${formData.content}`}

请用${languageText}输出。`;
}

// Show Famous Book Prompt Editor
function showFamousBookPromptEditor(formData) {
  const container = document.getElementById('famous-books-container');
  const prompt = generateFamousBookPrompt(formData);
  
  container.innerHTML = `
    <div class="p-6">
      <div class="mb-6 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-edit mr-2"></i>${i18n.t('editPrompt')}
        </h3>
        <button onclick="loadFamousBooksReviews()"
                class="text-sm text-gray-600 hover:text-gray-900">
          <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToForm')}
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('promptTemplate')}
          </label>
          <textarea id="prompt-editor"
                    rows="20"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    >${prompt}</textarea>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button onclick="loadFamousBooksReviews()"
                  class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <i class="fas fa-times mr-2"></i>${i18n.t('cancel')}
          </button>
          <button onclick="analyzeFamousBook('${formData.inputType}', '${formData.content.replace(/'/g, "\\'")}', '${formData.language}')"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-magic mr-2"></i>${i18n.t('generateAnalysis')}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Analyze Famous Book with Genspark/Gemini API
async function analyzeFamousBook(inputType, content, language) {
  const prompt = document.getElementById('prompt-editor').value;
  const container = document.getElementById('famous-books-container');
  
  // For video input, first get and show transcript
  if (inputType === 'video' && (content.includes('youtube.com') || content.includes('youtu.be'))) {
    // Show loading state
    container.innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
        <p class="text-gray-600">正在获取视频字幕...</p>
        <p class="text-sm text-gray-500 mt-2">请稍候，这可能需要几秒钟</p>
      </div>
    `;
    
    try {
      const transcriptResponse = await axios.post('/api/reviews/famous-books/get-transcript', {
        content
      });
      
      const transcriptData = transcriptResponse.data;
      
      if (transcriptData.hasTranscript) {
        // Show transcript preview and ask for confirmation
        showTranscriptPreview(transcriptData, inputType, content, prompt, language);
        return;
      } else {
        // No transcript, show warning and continue
        const confirmContinue = confirm('此视频没有可用的字幕。分析将仅基于视频标题和描述进行。\n\n是否继续？');
        if (!confirmContinue) {
          loadFamousBooksReviews();
          return;
        }
      }
    } catch (error) {
      console.error('Get transcript error:', error);
      // Continue with analysis even if transcript fetch fails
    }
  }
  
  // Show loading state for analysis
  container.innerHTML = `
    <div class="p-8 text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
      <p class="text-gray-600">${i18n.t('analyzing')}</p>
      <p class="text-sm text-gray-500 mt-2">${inputType === 'video' ? 'Using AI for video analysis...' : 'Using Gemini AI for book analysis...'}</p>
    </div>
  `;
  
  try {
    const response = await axios.post('/api/reviews/famous-books/analyze', {
      inputType,
      content,
      prompt,
      language,
      useGenspark: inputType === 'video' // Use Genspark for videos
    });
    
    const result = response.data.result;
    showFamousBookResult(result, inputType, content);
  } catch (error) {
    console.error('Analyze error:', error);
    
    // Extract error details
    const errorData = error.response?.data;
    const mainError = errorData?.error || i18n.t('operationFailed');
    const errorsList = errorData?.errors || [];
    
    // Create detailed error message
    let errorDetails = '';
    if (errorsList.length > 0) {
      errorDetails = '<div class="mt-4 text-left bg-red-50 p-4 rounded-lg"><p class="font-semibold mb-2">错误详情：</p><ul class="list-disc list-inside text-sm space-y-1">';
      errorsList.forEach(err => {
        errorDetails += `<li>${err}</li>`;
      });
      errorDetails += '</ul></div>';
    }
    
    container.innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600 text-lg font-semibold mb-2">${mainError}</p>
        ${errorDetails}
        <div class="mt-6 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg text-left">
          <p class="font-semibold mb-2"><i class="fas fa-info-circle mr-2"></i>建议：</p>
          <ul class="list-disc list-inside space-y-1">
            <li>系统会自动尝试多个 AI 服务（Gemini → OpenAI → Claude → Genspark）</li>
            <li>如果所有服务都失败，请稍后再试</li>
            <li>或联系管理员检查 API 密钥配置状态</li>
          </ul>
        </div>
        <button onclick="loadFamousBooksReviews()"
                class="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          ${i18n.t('backToForm')}
        </button>
      </div>
    `;
  }
}

// Show Transcript Preview (for user confirmation)
function showTranscriptPreview(transcriptData, inputType, content, prompt, language) {
  const container = document.getElementById('famous-books-container');
  const { transcript, transcriptLanguage, transcriptLength, videoMetadata } = transcriptData;
  
  // Escape HTML for display
  const escapedTranscript = escapeHtml(transcript);
  
  // Language name mapping
  const langNames = {
    'zh-Hans': '简体中文',
    'zh-Hant': '繁体中文',
    'zh': '中文',
    'en': 'English',
    'ja': '日本語',
    'unknown': '未知'
  };
  
  const langName = langNames[transcriptLanguage] || transcriptLanguage;
  
  container.innerHTML = `
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-closed-captioning mr-2"></i>视频字幕预览
        </h3>
        
        ${videoMetadata ? `
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 class="font-semibold text-gray-900 mb-2">
              <i class="fas fa-video mr-2"></i>${escapeHtml(videoMetadata.title)}
            </h4>
            <div class="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div><i class="fas fa-user mr-2"></i>频道：${escapeHtml(videoMetadata.channelTitle)}</div>
              <div><i class="fas fa-clock mr-2"></i>时长：${escapeHtml(videoMetadata.duration)}</div>
              <div><i class="fas fa-eye mr-2"></i>观看：${escapeHtml(videoMetadata.viewCount)}</div>
              <div><i class="fas fa-thumbs-up mr-2"></i>点赞：${escapeHtml(videoMetadata.likeCount)}</div>
            </div>
          </div>
        ` : ''}
        
        <div class="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <div class="flex items-center mb-2">
            <i class="fas fa-check-circle text-green-600 mr-2"></i>
            <span class="font-semibold text-green-800">字幕获取成功</span>
          </div>
          <div class="text-sm text-gray-700">
            <span class="font-semibold">语言：</span>${langName} &nbsp;|&nbsp; 
            <span class="font-semibold">字数：</span>${transcriptLength.toLocaleString()} 字符
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            字幕内容（前 5000 字符）
          </label>
          <textarea readonly
                    rows="15"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
          >${escapedTranscript.substring(0, 5000)}${transcriptLength > 5000 ? '\n\n... （字幕内容较长，已省略部分内容）' : ''}</textarea>
          <p class="mt-2 text-xs text-gray-500">
            <i class="fas fa-info-circle mr-1"></i>
            请确认字幕内容与视频相关。AI 将基于此字幕内容进行分析。
          </p>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
          <div class="flex items-start">
            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-1"></i>
            <div class="text-sm text-gray-700">
              <p class="font-semibold mb-1">确认字幕准确性</p>
              <p>请检查字幕内容是否与视频相关。如果字幕内容不正确或不完整，可以：</p>
              <ul class="list-disc list-inside mt-2 ml-2 space-y-1">
                <li>取消操作，尝试使用其他视频</li>
                <li>继续分析，但结果可能不够准确</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="loadFamousBooksReviews()"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <i class="fas fa-times mr-2"></i>取消
        </button>
        <button onclick="continueWithAnalysis('${inputType}', '${content.replace(/'/g, "\\'")}', '${escapeHtml(prompt).replace(/'/g, "\\'")}', '${language}')"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-check mr-2"></i>确认并继续分析
        </button>
      </div>
    </div>
  `;
}

// Continue with AI analysis after transcript confirmation
async function continueWithAnalysis(inputType, content, prompt, language) {
  const container = document.getElementById('famous-books-container');
  
  // Show loading state
  container.innerHTML = `
    <div class="p-8 text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
      <p class="text-gray-600">${i18n.t('analyzing')}</p>
      <p class="text-sm text-gray-500 mt-2">AI 正在分析视频内容...</p>
      <p class="text-xs text-gray-400 mt-2">这可能需要 30-60 秒</p>
    </div>
  `;
  
  try {
    const response = await axios.post('/api/reviews/famous-books/analyze', {
      inputType,
      content,
      prompt,
      language,
      useGenspark: inputType === 'video'
    });
    
    const result = response.data.result;
    showFamousBookResult(result, inputType, content);
  } catch (error) {
    console.error('Analyze error:', error);
    
    // Extract error details
    const errorData = error.response?.data;
    const mainError = errorData?.error || i18n.t('operationFailed');
    const errorsList = errorData?.errors || [];
    
    // Create detailed error message
    let errorDetails = '';
    if (errorsList.length > 0) {
      errorDetails = '<div class="mt-4 text-left bg-red-50 p-4 rounded-lg"><p class="font-semibold mb-2">错误详情：</p><ul class="list-disc list-inside text-sm space-y-1">';
      errorsList.forEach(err => {
        errorDetails += `<li>${err}</li>`;
      });
      errorDetails += '</ul></div>';
    }
    
    container.innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600 text-lg font-semibold mb-2">${mainError}</p>
        ${errorDetails}
        <div class="mt-6 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg text-left">
          <p class="font-semibold mb-2"><i class="fas fa-info-circle mr-2"></i>建议：</p>
          <ul class="list-disc list-inside space-y-1">
            <li>系统会自动尝试多个 AI 服务（Gemini → OpenAI → Claude → Genspark）</li>
            <li>如果所有服务都失败，请稍后再试</li>
            <li>或联系管理员检查 API 密钥配置状态</li>
          </ul>
        </div>
        <button onclick="loadFamousBooksReviews()"
                class="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          ${i18n.t('backToForm')}
        </button>
      </div>
    `;
  }
}

// Show Famous Book Analysis Result
function showFamousBookResult(result, inputType, content) {
  const container = document.getElementById('famous-books-container');
  
  // Escape HTML for textarea
  const escapedResult = escapeHtml(result);
  
  container.innerHTML = `
    <div class="p-6">
      <div class="mb-6 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-file-alt mr-2"></i>${i18n.t('analysisResult')}
        </h3>
        <button onclick="loadFamousBooksReviews()"
                class="text-sm text-gray-600 hover:text-gray-900">
          <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToForm')}
        </button>
      </div>
      
      <div class="mb-6">
        <textarea id="result-textarea" rows="25"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm">${escapedResult}</textarea>
        <p class="mt-2 text-sm text-gray-500">
          <i class="fas fa-info-circle mr-1"></i>
          您可以编辑分析结果，保存后将自动格式化
        </p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="exportDocument('word')"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <i class="fas fa-file-word mr-2"></i>${i18n.t('exportWord')}
        </button>
        <button onclick="exportDocument('pdf')"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <i class="fas fa-file-pdf mr-2"></i>${i18n.t('exportPDF')}
        </button>
        <button onclick="saveFamousBookReview('${inputType}', '${content.replace(/'/g, "\\'")}')"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-save mr-2"></i>${i18n.t('saveReview')}
        </button>
      </div>
    </div>
  `;
}

// Export document (placeholder)
function exportDocument(format) {
  alert(`${format.toUpperCase()} 导出功能开发中...`);
}

// Save Famous Book Review
async function saveFamousBookReview(inputType, content) {
  try {
    const textarea = document.getElementById('result-textarea');
    
    if (!textarea) {
      showNotification('编辑器未找到，请刷新页面重试', 'error');
      return;
    }
    
    const plainText = textarea.value;
    
    if (!plainText.trim()) {
      showNotification('内容不能为空', 'error');
      return;
    }
    
    // Convert plain text to HTML with proper formatting
    const htmlContent = plainText
      .split('\n\n')
      .map(para => {
        const lines = para.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) return '';
        return '<p>' + lines.map(line => escapeHtml(line)).join('<br>') + '</p>';
      })
      .filter(p => p)
      .join('\n');
    
    const response = await axios.post('/api/reviews/famous-books/save', {
      title: inputType === 'video' ? `视频分析：${content.substring(0, 50)}...` : `书籍分析：${content}`,
      content: htmlContent,
      inputType,
      source: content
    });
    
    showNotification(i18n.t('operationSuccess'), 'success');
    loadFamousBooksReviews();
  } catch (error) {
    console.error('Save error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

// Update file name display
function updateFileName() {
  const fileInput = document.getElementById('document-file');
  const fileNameDisplay = document.getElementById('file-name');
  
  if (fileInput.files.length > 0) {
    fileNameDisplay.textContent = `${i18n.t('fileSelected')}: ${fileInput.files[0].name}`;
    fileNameDisplay.classList.add('text-indigo-600', 'font-medium');
  } else {
    fileNameDisplay.textContent = i18n.t('selectFile');
    fileNameDisplay.classList.remove('text-indigo-600', 'font-medium');
  }
}

// Setup drag and drop functionality for document file upload
function setupDocumentFileDragDrop() {
  const fileInput = document.getElementById('document-file');
  const dropZone = fileInput?.parentElement;
  
  if (!dropZone || !fileInput) {
    console.error('File input or drop zone not found');
    return;
  }
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight drop zone when file is dragged over
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight(e) {
    dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
  }
  
  function unhighlight(e) {
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
  }
  
  // Handle dropped files
  dropZone.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      // Update the file input with the dropped file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      fileInput.files = dataTransfer.files;
      
      // Update the file name display
      updateFileName();
      
      console.log('File dropped:', files[0].name);
    }
  }
}

// Handle Document form submission
async function handleDocumentFormSubmit(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('document-file');
  const wordCount = document.getElementById('doc-word-count').value;
  const scenario = document.getElementById('doc-application-scenario').value;
  const language = document.getElementById('doc-output-language').value;
  
  if (!fileInput.files.length) {
    showNotification(i18n.t('selectFile'), 'error');
    return;
  }
  
  const file = fileInput.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  // Show loading state
  showNotification(i18n.t('readingFile') || '正在读取文件...', 'info');
  
  try {
    let fileContent = '';
    
    if (fileExtension === 'txt') {
      // Plain text file
      fileContent = await readTextFile(file);
    } else if (fileExtension === 'pdf') {
      // PDF file
      fileContent = await readPDFFile(file);
    } else if (fileExtension === 'doc' || fileExtension === 'docx') {
      // Word document
      fileContent = await readWordFile(file);
    } else {
      showNotification(i18n.t('unsupportedFileType') || '不支持的文件类型', 'error');
      return;
    }
    
    console.log('File parsed successfully:', {
      fileName: file.name,
      fileType: fileExtension,
      contentLength: fileContent?.length || 0,
      contentPreview: fileContent?.substring(0, 200) + '...'
    });
    
    if (!fileContent || fileContent.trim().length === 0) {
      console.error('Empty file content detected');
      showNotification(i18n.t('emptyFileContent') || '文件内容为空，请检查文件是否损坏或为空白文档', 'error');
      return;
    }
    
    const formData = {
      fileName: file.name,
      fileContent,
      wordCount: parseInt(wordCount),
      scenario,
      language
    };
    
    // Generate and show prompt editor
    showDocumentPromptEditor(formData);
  } catch (error) {
    console.error('File reading error:', error);
    showNotification(error.message || (i18n.t('fileReadError') || '文件读取失败'), 'error');
  }
}

// Read plain text file
function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

// Read PDF file using PDF.js
async function readPDFFile(file) {
  try {
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
      // Load PDF.js dynamically
      await loadPDFJS();
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF reading error:', error);
    console.error('PDF error details:', {
      message: error.message,
      stack: error.stack,
      fileName: file?.name,
      fileSize: file?.size
    });
    throw new Error((i18n.t('pdfReadError') || 'PDF文件读取失败') + ': ' + error.message);
  }
}

// Read Word document using Mammoth.js
async function readWordFile(file) {
  try {
    // Check if Mammoth.js is loaded
    if (typeof mammoth === 'undefined') {
      // Load Mammoth.js dynamically
      await loadMammothJS();
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages && result.messages.length > 0) {
      console.warn('Word document conversion warnings:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Word reading error:', error);
    throw new Error((i18n.t('wordReadError') || 'Word文件读取失败') + ': ' + error.message);
  }
}

// Load PDF.js library dynamically
function loadPDFJS() {
  return new Promise((resolve, reject) => {
    if (typeof pdfjsLib !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

// Load Mammoth.js library dynamically
function loadMammothJS() {
  return new Promise((resolve, reject) => {
    if (typeof mammoth !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Mammoth.js'));
    document.head.appendChild(script);
  });
}

// Generate Prompt template for Document
function generateDocumentPrompt(formData) {
  const scenarioMap = {
    'workplace': i18n.t('scenarioWorkplace'),
    'entrepreneurship': i18n.t('scenarioEntrepreneurship'),
    'personal-growth': i18n.t('scenarioPersonalGrowth'),
    'financial-planning': i18n.t('scenarioFinancialPlanning')
  };
  
  const languageMap = {
    'en': i18n.t('langEnglish'),
    'fr': i18n.t('langFrench'),
    'es': i18n.t('langSpanish'),
    'zh-CN': i18n.t('langChineseSimplified'),
    'zh-TW': i18n.t('langChineseTraditional'),
    'ja': i18n.t('langJapanese')
  };
  
  const scenarioText = scenarioMap[formData.scenario] || formData.scenario;
  const languageText = languageMap[formData.language] || formData.language;
  
  return `你是一名文档分析专家，请帮我深度分析这份文档，输出一份 ${formData.wordCount} 字的复盘文档，覆盖以下结构：

【文档概要】
- 文档的主题和目的是什么？
- 核心内容和关键信息是什么？
- 文档的结构和逻辑是怎样的？

【关键要点提取】
- 最重要的结论和发现是什么？
- 有哪些关键数据、证据或案例？
- 哪些观点需要特别关注？

【应用场景与实践建议】
针对${scenarioText}场景：
- 如何将文档中的知识应用到实际中？
- 有哪些可落地的行动建议？
- 需要避免哪些误区或风险？

【总结与启发】
- 这份文档最大的价值是什么？
- 对当前工作/学习有什么启发？
- 还需要补充哪些相关信息？

请用${languageText}输出。`;
}

// Show Document Prompt Editor
function showDocumentPromptEditor(formData) {
  const container = document.getElementById('documents-container');
  const prompt = generateDocumentPrompt(formData);
  
  // Store file content for later use
  window.currentDocumentData = formData;
  
  container.innerHTML = `
    <div class="p-6">
      <div class="mb-6 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-edit mr-2"></i>${i18n.t('editPrompt')}
        </h3>
        <button onclick="loadDocumentsReviews()"
                class="text-sm text-gray-600 hover:text-gray-900">
          <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToForm')}
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('promptTemplate')}
          </label>
          <textarea id="doc-prompt-editor"
                    rows="18"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    >${prompt}</textarea>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button onclick="loadDocumentsReviews()"
                  class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <i class="fas fa-times mr-2"></i>${i18n.t('cancel')}
          </button>
          <button onclick="analyzeDocument()"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-magic mr-2"></i>${i18n.t('generateAnalysis')}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Analyze Document with Gemini API
async function analyzeDocument() {
  const prompt = document.getElementById('doc-prompt-editor').value;
  const container = document.getElementById('documents-container');
  const formData = window.currentDocumentData;
  
  if (!formData) {
    showNotification('Document data not found', 'error');
    return;
  }
  
  // Show loading state
  container.innerHTML = `
    <div class="p-8 text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
      <p class="text-gray-600">${i18n.t('analyzing')}</p>
    </div>
  `;
  
  try {
    const response = await axios.post('/api/reviews/documents/analyze', {
      fileName: formData.fileName,
      fileContent: formData.fileContent,
      prompt,
      language: formData.language
    });
    
    const result = response.data.result;
    showDocumentResult(result, formData.fileName);
  } catch (error) {
    console.error('Analyze error:', error);
    container.innerHTML = `
      <div class="p-8 text-center">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${error.response?.data?.error || i18n.t('operationFailed')}</p>
        <button onclick="loadDocumentsReviews()"
                class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          ${i18n.t('backToForm')}
        </button>
      </div>
    `;
  }
}

// Show Document Analysis Result
function showDocumentResult(result, fileName) {
  const container = document.getElementById('documents-container');
  
  // Escape HTML for textarea
  const escapedResult = escapeHtml(result);
  
  container.innerHTML = `
    <div class="p-6">
      <div class="mb-6 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-file-alt mr-2"></i>${i18n.t('analysisResult')}
        </h3>
        <button onclick="loadDocumentsReviews()"
                class="text-sm text-gray-600 hover:text-gray-900">
          <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToForm')}
        </button>
      </div>
      
      <div class="mb-6">
        <textarea id="doc-result-textarea" rows="25"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm">${escapedResult}</textarea>
        <p class="mt-2 text-sm text-gray-500">
          <i class="fas fa-info-circle mr-1"></i>
          您可以编辑分析结果，保存后将自动格式化
        </p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="exportDocument('word')"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <i class="fas fa-file-word mr-2"></i>${i18n.t('exportWord')}
        </button>
        <button onclick="exportDocument('pdf')"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <i class="fas fa-file-pdf mr-2"></i>${i18n.t('exportPDF')}
        </button>
        <button onclick="saveDocumentReview('${fileName.replace(/'/g, "\\'")}')"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-save mr-2"></i>${i18n.t('saveReview')}
        </button>
      </div>
    </div>
  `;
}

// Save Document Review
async function saveDocumentReview(fileName) {
  try {
    const textarea = document.getElementById('doc-result-textarea');
    
    if (!textarea) {
      showNotification('编辑器未找到，请刷新页面重试', 'error');
      return;
    }
    
    const plainText = textarea.value;
    
    if (!plainText.trim()) {
      showNotification('内容不能为空', 'error');
      return;
    }
    
    // Convert plain text to HTML with proper formatting
    const content = plainText
      .split('\n\n')
      .map(para => {
        const lines = para.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) return '';
        return '<p>' + lines.map(line => escapeHtml(line)).join('<br>') + '</p>';
      })
      .filter(p => p)
      .join('\n');
    
    const response = await axios.post('/api/reviews/documents/save', {
      title: `文档分析：${fileName}`,
      content: content,
      fileName
    });
    
    showNotification(i18n.t('operationSuccess'), 'success');
    loadDocumentsReviews();
  } catch (error) {
    console.error('Save error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

// Show Document Form (for creating new document review)
function showDocumentForm() {
  // Show the creation form directly
  const container = document.getElementById('documents-container');
  
  container.innerHTML = `
    <div class="mb-4 flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">
        <i class="fas fa-file-alt mr-2"></i>${i18n.t('documentReview')}
      </h3>
      <button onclick="loadDocumentsReviews()" 
              class="text-sm text-gray-600 hover:text-gray-900">
        <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToList') || 'Back to List'}
      </button>
    </div>
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          <i class="fas fa-file-alt mr-2"></i>${i18n.t('createDocumentReview')}
        </h3>
      </div>
      
      <form id="document-form" class="space-y-6">
        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('uploadDocument')} <span class="text-red-600">*</span>
          </label>
          <div class="flex items-center space-x-4">
            <label class="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
              <div class="text-center">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                <p class="text-sm text-gray-600">${i18n.t('uploadDocumentHint')}</p>
                <p class="text-xs text-gray-500 mt-1" id="file-name">${i18n.t('selectFile')}</p>
              </div>
              <input type="file" id="document-file" accept=".pdf,.doc,.docx,.txt" class="hidden" required onchange="updateFileName()">
            </label>
          </div>
        </div>

        <!-- Word Count Requirement -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('wordCountRequirement')} <span class="text-red-600">*</span>
          </label>
          <input type="number" id="doc-word-count" min="500" max="10000" step="100"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 placeholder="${i18n.t('wordCountPlaceholder')}"
                 required>
        </div>

        <!-- Application Scenario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('applicationScenario')} <span class="text-red-600">*</span>
          </label>
          <select id="doc-application-scenario"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required>
            <option value="">${i18n.t('selectScenario')}</option>
            <option value="workplace">${i18n.t('scenarioWorkplace')}</option>
            <option value="entrepreneurship">${i18n.t('scenarioEntrepreneurship')}</option>
            <option value="personal-growth">${i18n.t('scenarioPersonalGrowth')}</option>
            <option value="financial-planning">${i18n.t('scenarioFinancialPlanning')}</option>
          </select>
        </div>

        <!-- Output Language -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('outputLanguage')} <span class="text-red-600">*</span>
          </label>
          <select id="doc-output-language"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required>
            <option value="">${i18n.t('selectLanguage')}</option>
            <option value="en">${i18n.t('langEnglish')}</option>
            <option value="fr">${i18n.t('langFrench')}</option>
            <option value="es">${i18n.t('langSpanish')}</option>
            <option value="zh-CN">${i18n.t('langChineseSimplified')}</option>
            <option value="zh-TW">${i18n.t('langChineseTraditional')}</option>
            <option value="ja">${i18n.t('langJapanese')}</option>
          </select>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-3">
          <button type="submit"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-magic mr-2"></i>${i18n.t('generatePrompt')}
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Attach form submit handler
  document.getElementById('document-form').addEventListener('submit', handleDocumentFormSubmit);
  
  // Setup drag and drop functionality for file upload
  setupDocumentFileDragDrop();
}

// Edit Document Review
async function editDocumentReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review || response.data;
    
    const container = document.getElementById('documents-container');
    container.innerHTML = `
      <div class="p-6">
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">
            <i class="fas fa-edit mr-2"></i>${i18n.t('edit')} - ${escapeHtml(review.title)}
          </h3>
          <button onclick="loadDocumentsReviews()"
                  class="text-sm text-gray-600 hover:text-gray-900">
            <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToList') || 'Back to List'}
          </button>
        </div>
        
        <form id="edit-document-form" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('reviewTitle')}
            </label>
            <input type="text" id="edit-title" value="${escapeHtml(review.title)}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('content')}
            </label>
            <textarea id="edit-doc-editor" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                      rows="20"
                      required></textarea>
            <p class="mt-2 text-sm text-gray-500">
              <i class="fas fa-info-circle mr-1"></i>
              支持纯文本编辑，保存后将自动格式化为段落
            </p>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="loadDocumentsReviews()"
                    class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fas fa-times mr-2"></i>${i18n.t('cancel')}
            </button>
            <button type="submit"
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-save mr-2"></i>${i18n.t('save')}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Convert HTML to plain text AFTER rendering the textarea
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = review.description || '';
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Set the textarea value
    const textarea = document.getElementById('edit-doc-editor');
    if (textarea) {
      textarea.value = plainText;
    }
    
    // Attach form submit handler (simple textarea only, no TinyMCE)
    document.getElementById('edit-document-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const title = document.getElementById('edit-title').value;
        const plainText = document.getElementById('edit-doc-editor').value;
        
        // Convert plain text to HTML with proper formatting
        const content = plainText
          .split('\n\n')
          .map(para => {
            const lines = para.trim().split('\n').filter(line => line.trim());
            if (lines.length === 0) return '';
            return '<p>' + lines.map(line => escapeHtml(line)).join('<br>') + '</p>';
          })
          .filter(p => p)
          .join('\n');
        
        await axios.put(`/api/reviews/${id}`, {
          title,
          description: content
        });
        
        showNotification(i18n.t('operationSuccess'), 'success');
        loadDocumentsReviews();
      } catch (error) {
        console.error('Update error:', error);
        showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
      }
    });
  } catch (error) {
    console.error('Edit error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

// Download Document Review
async function downloadDocumentReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review || response.data;
    
    // Create a Blob with the content
    const content = `${review.title}\n\n${review.description || ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${review.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(i18n.t('operationSuccess'), 'success');
  } catch (error) {
    console.error('Download error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

// Delete Document Review
async function deleteDocumentReview(id) {
  if (!confirm(i18n.t('confirmDelete') || 'Are you sure you want to delete this review?')) {
    return;
  }
  
  try {
    await axios.delete(`/api/reviews/${id}`);
    showNotification(i18n.t('operationSuccess'), 'success');
    loadDocumentsReviews();
  } catch (error) {
    console.error('Delete error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

// Famous Book Review Actions
function showFamousBookForm() {
  // Always show the creation form
  const container = document.getElementById('famous-books-container');
  
  container.innerHTML = `
    <div class="mb-4 flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">
        <i class="fas fa-book mr-2"></i>${i18n.t('famousBookReview')}
      </h3>
      <button onclick="loadFamousBooksReviews()" 
              class="text-sm text-gray-600 hover:text-gray-900">
        <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToList')}
      </button>
    </div>
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          <i class="fas fa-book mr-2"></i>${i18n.t('createFamousBookReview')}
        </h3>
      </div>
      
      <form id="famous-book-form" class="space-y-6">
        <!-- Type Selection: Video or Book -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            ${i18n.t('videoOrBook')} <span class="text-red-600">*</span>
          </label>
          <div class="flex space-x-6">
            <label class="flex items-center cursor-pointer">
              <input type="radio" name="input-type" value="video" checked
                     class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                     onchange="toggleFamousBookInputType()">
              <span class="ml-2 text-sm text-gray-700">${i18n.t('videoLink')}</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input type="radio" name="input-type" value="book"
                     class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                     onchange="toggleFamousBookInputType()">
              <span class="ml-2 text-sm text-gray-700">${i18n.t('bookName')}</span>
            </label>
          </div>
        </div>

        <!-- Video Link Input (shown by default) -->
        <div id="video-link-input">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('videoLink')} <span class="text-red-600">*</span>
          </label>
          <input type="url" id="video-link"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 placeholder="${i18n.t('videoLinkPlaceholder')}"
                 required>
        </div>

        <!-- Book Name Input (hidden by default) -->
        <div id="book-name-input" style="display: none;">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('bookName')} <span class="text-red-600">*</span>
          </label>
          <input type="text" id="book-name"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 placeholder="${i18n.t('bookNamePlaceholder')}">
        </div>

        <!-- Word Count Requirement -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('wordCountRequirement')} <span class="text-red-600">*</span>
          </label>
          <input type="number" id="word-count" min="500" max="10000" step="100"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                 placeholder="${i18n.t('wordCountPlaceholder')}"
                 required>
        </div>

        <!-- Application Scenario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('applicationScenario')} <span class="text-red-600">*</span>
          </label>
          <select id="application-scenario"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required>
            <option value="">${i18n.t('selectScenario')}</option>
            <option value="workplace">${i18n.t('scenarioWorkplace')}</option>
            <option value="entrepreneurship">${i18n.t('scenarioEntrepreneurship')}</option>
            <option value="personal-growth">${i18n.t('scenarioPersonalGrowth')}</option>
            <option value="financial-planning">${i18n.t('scenarioFinancialPlanning')}</option>
          </select>
        </div>

        <!-- Output Language -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ${i18n.t('outputLanguage')} <span class="text-red-600">*</span>
          </label>
          <select id="output-language"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required>
            <option value="">${i18n.t('selectLanguage')}</option>
            <option value="en">${i18n.t('langEnglish')}</option>
            <option value="fr">${i18n.t('langFrench')}</option>
            <option value="es">${i18n.t('langSpanish')}</option>
            <option value="zh-CN">${i18n.t('langChineseSimplified')}</option>
            <option value="zh-TW">${i18n.t('langChineseTraditional')}</option>
            <option value="ja">${i18n.t('langJapanese')}</option>
          </select>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-3">
          <button type="button" onclick="loadFamousBooksReviews()"
                  class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <i class="fas fa-times mr-2"></i>${i18n.t('cancel')}
          </button>
          <button type="submit"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-magic mr-2"></i>${i18n.t('generatePrompt')}
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Attach form submit handler
  document.getElementById('famous-book-form').addEventListener('submit', handleFamousBookFormSubmit);
}

async function viewFamousBookReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    // API returns { review: {...}, questions: [...], ... }
    const review = response.data.review || response.data;
    
    const container = document.getElementById('famous-books-container');
    container.innerHTML = `
      <div class="p-6">
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">
            <i class="fas fa-book mr-2"></i>${escapeHtml(review.title)}
          </h3>
          <button onclick="loadFamousBooksReviews()"
                  class="text-sm text-gray-600 hover:text-gray-900">
            <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToList') || 'Back to List'}
          </button>
        </div>
        <div class="prose max-w-none">
          ${review.description || '<p>暂无内容</p>'}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('View error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

async function editFamousBookReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review || response.data;
    
    console.log('Edit review - Response:', response.data);
    console.log('Edit review - Review object:', review);
    console.log('Edit review - Description:', review.description);
    
    const container = document.getElementById('famous-books-container');
    container.innerHTML = `
      <div class="p-6">
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">
            <i class="fas fa-edit mr-2"></i>${i18n.t('edit')} - ${escapeHtml(review.title)}
          </h3>
          <button onclick="loadFamousBooksReviews()"
                  class="text-sm text-gray-600 hover:text-gray-900">
            <i class="fas fa-arrow-left mr-1"></i>${i18n.t('backToList')}
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Title Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('reviewTitle')} <span class="text-red-600">*</span>
            </label>
            <input type="text" id="edit-title" value="${escapeHtml(review.title)}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   required>
          </div>
          
          <!-- Content Editor (Simple Textarea) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('content')}
            </label>
            <textarea id="edit-content-textarea" rows="20"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                      placeholder="${i18n.t('enterContent') || '请输入内容...'}"></textarea>
            <p class="mt-2 text-sm text-gray-500">
              <i class="fas fa-info-circle mr-1"></i>
              支持纯文本编辑，保存后将自动格式化为段落
            </p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3">
            <button onclick="loadFamousBooksReviews()"
                    class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fas fa-times mr-2"></i>${i18n.t('cancel')}
            </button>
            <button onclick="updateFamousBookReview(${id})"
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-save mr-2"></i>${i18n.t('saveChanges')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Convert HTML to plain text AFTER rendering the textarea
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = review.description || '';
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Set the textarea value
    const textarea = document.getElementById('edit-content-textarea');
    if (textarea) {
      textarea.value = plainText;
    }
  } catch (error) {
    console.error('Edit error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

async function updateFamousBookReview(id) {
  try {
    const title = document.getElementById('edit-title').value;
    const textarea = document.getElementById('edit-content-textarea');
    
    if (!textarea) {
      showNotification('编辑器未找到，请刷新页面重试', 'error');
      return;
    }
    
    const plainText = textarea.value;
    
    if (!title.trim()) {
      showNotification(i18n.t('titleRequired') || 'Title is required', 'error');
      return;
    }
    
    if (!plainText.trim()) {
      showNotification('内容不能为空', 'error');
      return;
    }
    
    // Convert plain text to HTML with proper formatting
    // Split by double newlines for paragraphs, single newlines for line breaks
    const content = plainText
      .split('\n\n')
      .map(para => {
        const lines = para.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) return '';
        return '<p>' + lines.map(line => escapeHtml(line)).join('<br>') + '</p>';
      })
      .filter(p => p)
      .join('\n');
    
    // Use dedicated famous-books endpoint for better permission control
    await axios.put(`/api/reviews/famous-books/${id}`, {
      title: title,
      content: content
    });
    
    showNotification(i18n.t('operationSuccess'), 'success');
    loadFamousBooksReviews();
  } catch (error) {
    console.error('Update error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

async function downloadFamousBookReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data;
    
    // Create a Blob with the content
    const content = `${review.title}\n\n${review.description || ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${review.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(i18n.t('operationSuccess'), 'success');
  } catch (error) {
    console.error('Download error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

async function deleteFamousBookReview(id) {
  if (!confirm(i18n.t('confirmDelete') || 'Are you sure you want to delete this review?')) {
    return;
  }
  
  try {
    await axios.delete(`/api/reviews/${id}`);
    showNotification(i18n.t('operationSuccess'), 'success');
    loadFamousBooksReviews();
  } catch (error) {
    console.error('Delete error:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed'), 'error');
  }
}

let allReviews = [];
let currentPage = 1;
const itemsPerPage = 5;

async function loadAllReviews() {
  try {
    const response = await axios.get('/api/reviews');
    allReviews = response.data.reviews;
    currentPage = 1; // Reset to first page
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
  const timeTypeFilter = document.getElementById('filter-time-type').value;
  const ownerTypeFilter = document.getElementById('filter-owner-type').value;

  let filtered = allReviews.filter(review => {
    // Status filter
    if (statusFilter !== 'all' && review.status !== statusFilter) return false;
    
    // Search filter
    if (searchText && !review.title.toLowerCase().includes(searchText)) return false;
    
    // Group type filter
      
    // Time type filter
    if (timeTypeFilter !== 'all' && review.time_type !== timeTypeFilter) return false;
    
    // Owner type filter
    if (ownerTypeFilter !== 'all' && review.owner_type !== ownerTypeFilter) return false;
    
    return true;
  });

  currentPage = 1; // Reset to first page when filtering
  renderReviewsList(filtered);
}

function changePage(newPage, reviews) {
  currentPage = newPage;
  renderReviewsList(reviews);
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

  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  // Store reviews for pagination
  window.currentReviews = reviews;

  container.innerHTML = `
    <!-- Mobile Card View (hidden on desktop) -->
    <div class="md:hidden space-y-4">
      ${paginatedReviews.map(review => `
        <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">${escapeHtml(review.title)}</h3>
              ${review.team_name ? `<p class="text-sm text-gray-500"><i class="fas fa-users mr-1"></i>${escapeHtml(review.team_name)}</p>` : ''}
            </div>
            <span class="px-2 py-1 text-xs rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
              ${i18n.t(review.status)}
            </span>
          </div>
          
          <div class="space-y-2 text-sm mb-4">
            <div class="flex items-center text-gray-600">
              <i class="fas fa-user-circle w-5 mr-2"></i>
              <span>${escapeHtml(review.creator_name || 'Unknown')}</span>
            </div>
            <div class="flex items-center">
              ${renderOwnerTypeBadge(review.owner_type)}
            </div>
            <div class="flex items-center text-gray-500 text-xs">
              <i class="fas fa-clock w-5 mr-2"></i>
              <span>${new Date(review.updated_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-2">
            <button onclick="showReviewDetail(${review.id}, true)" 
                    class="flex items-center justify-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm">
              <i class="fas fa-eye mr-2"></i>${i18n.t('view')}
            </button>
            <button onclick="showEditReview(${review.id})" 
                    class="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm">
              <i class="fas fa-edit mr-2"></i>${i18n.t('edit')}
            </button>
            <button onclick="printReview(${review.id})" 
                    class="flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm">
              <i class="fas fa-print mr-2"></i>${i18n.t('print')}
            </button>
            <button onclick="showInviteModal(${review.id})" 
                    class="flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm">
              <i class="fas fa-user-plus mr-2"></i>${i18n.t('invite')}
            </button>
            <button onclick="deleteReview(${review.id})" 
                    class="col-span-2 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">
              <i class="fas fa-trash mr-2"></i>${i18n.t('delete')}
            </button>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Desktop Table View (hidden on mobile) -->
    <div class="hidden md:block overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('reviewTitle')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('creator') || '创建者'}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('ownerType')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('status')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('updatedAt')}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('actions')}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${paginatedReviews.map(review => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(review.title)}</div>
                ${review.team_name ? `<div class="text-xs text-gray-500"><i class="fas fa-users mr-1"></i>${escapeHtml(review.team_name)}</div>` : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                  <span class="text-sm text-gray-700">${escapeHtml(review.creator_name || 'Unknown')}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${renderOwnerTypeBadge(review.owner_type)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                  ${i18n.t(review.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-700">
                    <i class="fas fa-edit text-xs mr-1"></i>
                    ${new Date(review.updated_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  ${review.created_at ? `
                    <span class="text-xs text-gray-400 mt-1">
                      <i class="fas fa-plus-circle text-xs mr-1"></i>
                      ${new Date(review.created_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  ` : ''}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="showReviewDetail(${review.id}, true)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-eye"></i> ${i18n.t('view')}
                </button>
                <button onclick="showEditReview(${review.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                  <i class="fas fa-edit"></i> ${i18n.t('edit')}
                </button>
                <button onclick="printReview(${review.id})" class="text-green-600 hover:text-green-900 mr-3">
                  <i class="fas fa-print"></i> ${i18n.t('print')}
                </button>
                <button onclick="showInviteModal(${review.id})" class="text-purple-600 hover:text-purple-900 mr-3">
                  <i class="fas fa-user-plus"></i> ${i18n.t('invite')}
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
    
    <!-- Pagination -->
    ${totalPages > 1 ? `
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button onclick="changePage(${currentPage - 1}, window.currentReviews)" 
                  ${currentPage === 1 ? 'disabled' : ''}
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            ${i18n.t('previousPage') || '上一页'}
          </button>
          <button onclick="changePage(${currentPage + 1}, window.currentReviews)" 
                  ${currentPage === totalPages ? 'disabled' : ''}
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            ${i18n.t('nextPage') || '下一页'}
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              ${i18n.t('showing') || '显示'} 
              <span class="font-medium">${startIndex + 1}</span>
              ${i18n.t('to') || '到'}
              <span class="font-medium">${Math.min(endIndex, reviews.length)}</span>
              ${i18n.t('of') || '共'}
              <span class="font-medium">${reviews.length}</span>
              ${i18n.t('results') || '条结果'}
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button onclick="changePage(${currentPage - 1}, window.currentReviews)" 
                      ${currentPage === 1 ? 'disabled' : ''}
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fas fa-chevron-left"></i>
              </button>
              ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                <button onclick="changePage(${page}, window.currentReviews)"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                          page === currentPage 
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }">
                  ${page}
                </button>
              `).join('')}
              <button onclick="changePage(${currentPage + 1}, window.currentReviews)" 
                      ${currentPage === totalPages ? 'disabled' : ''}
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
                <i class="fas fa-chevron-right"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

// ============ Create/Edit Review ============

// Step 1: Basic info and template selection
async function showCreateReview(preservedData = null) {
  try {
    // Only reset draft ID when starting completely new review (not when coming back from step 2)
    if (!preservedData) {
      currentDraftId = null;
    }
    const app = document.getElementById('app');
    
    // Load templates
    let templates = [];
    try {
      const response = await axios.get('/api/templates');
      templates = response.data.templates;
      if (!templates || templates.length === 0) {
        showNotification(i18n.t('noTemplates') + '. ' + i18n.t('contactAdminForUpgrade'), 'error');
        return;
      }
    } catch (error) {
      console.error('Load templates error:', error);
      showNotification(i18n.t('operationFailed') + ': ' + i18n.t('noTemplates'), 'error');
      return;
    }
    
    // Load teams for all users (needed for team review creation)
    let teams = [];
    try {
      const response = await axios.get('/api/teams');
      // Get user's teams (teams where user is a member)
      teams = response.data.myTeams || [];
    } catch (error) {
      console.error('Load teams error:', error);
      teams = [];
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
          ${currentDraftId ? `
            <div class="mt-3 px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <p class="text-sm text-yellow-800">
                <i class="fas fa-save mr-2"></i>
                <strong>${i18n.t('editingDraft') || '正在编辑草稿'}</strong> (ID: ${currentDraftId})
                <br>
                <span class="text-xs">${i18n.t('draftAutoSaved') || '您的更改会自动保存'}</span>
              </p>
            </div>
          ` : ''}
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('reviewDescription')}
            </label>
            <textarea id="review-description" rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                      placeholder="${i18n.t('reviewDescriptionPlaceholder')}"></textarea>
          </div>

          <!-- Template Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('template')} <span class="text-red-500">*</span>
            </label>
            <select id="review-template" required onchange="handleTemplateChangeStep1()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              ${templates.map(template => `
                <option value="${template.id}" ${template.is_default ? 'selected' : ''}>
                  ${escapeHtml(template.name)}${template.is_default ? ` (${i18n.t('defaultTemplate')})` : ''}
                </option>
              `).join('')}
            </select>
            <p class="mt-1 text-xs text-gray-500">
              <i class="fas fa-info-circle mr-1"></i>${i18n.t('templateCannotChange')}
            </p>
            <div id="template-info" class="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p class="text-sm text-gray-700"></p>
            </div>
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
              <option value="quarterly">${i18n.t('timeTypeQuarterly')}</option>
              <option value="yearly">${i18n.t('timeTypeYearly')}</option>
              <option value="free">${i18n.t('timeTypeFree')}</option>
            </select>
          </div>

          <!-- Owner Type (Access Control) -->
          <div class="border-t pt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('ownerType')} <span class="text-red-500">*</span>
            </label>
            <select id="review-owner-type" required onchange="handleOwnerTypeChange()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="private">${i18n.t('ownerTypePrivate')}</option>
              <option value="team">${i18n.t('ownerTypeTeam')}</option>
              <option value="public">${i18n.t('ownerTypePublic')}</option>
            </select>
            <div class="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p class="text-xs text-gray-700 space-y-1">
                <span class="block"><strong>${i18n.t('ownerTypePrivate')}:</strong> ${i18n.t('ownerTypePrivateDesc')}</span>
                <span class="block"><strong>${i18n.t('ownerTypeTeam')}:</strong> ${i18n.t('ownerTypeTeamDesc')}</span>
                <span class="block"><strong>${i18n.t('ownerTypePublic')}:</strong> ${i18n.t('ownerTypePublicDesc')}</span>
              </p>
            </div>
          </div>

          <!-- Team Selection (shown when owner type is 'team') -->
          <div id="owner-team-selector" style="display: none;">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('team')} <span class="text-red-500">*</span>
            </label>
            ${teams.length > 0 ? `
              <select id="review-team"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">${i18n.t('selectTeam')}</option>
                ${teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('')}
              </select>
              <p class="mt-1 text-xs text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>${i18n.t('teamReviewNote') || '选择团队后，团队成员可以协作编辑'}
              </p>
            ` : `
              <div class="w-full px-4 py-3 border border-amber-300 bg-amber-50 rounded-lg">
                <p class="text-sm text-amber-800">
                  <i class="fas fa-exclamation-triangle mr-2"></i>${i18n.t('noTeamsYet')}
                </p>
                <p class="text-xs text-amber-600 mt-2">
                  ${i18n.t('pleaseGoToTeamsPage')} <button onclick="showTeams()" class="text-indigo-600 hover:underline font-medium">${i18n.t('teamsPage')}</button> ${i18n.t('applyOrCreateTeam')}
                </p>
              </div>
            `}
          </div>

          <!-- Calendar Integration (Optional) -->
          <div class="border-t pt-6">
            <div class="mb-4 flex items-center">
              <i class="fas fa-calendar-plus text-indigo-600 mr-2"></i>
              <h3 class="text-lg font-medium text-gray-800">${i18n.t('scheduleReview')} (${i18n.t('optional')})</h3>
            </div>
            
            <div class="space-y-4">
              <!-- Scheduled Time -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-clock mr-1"></i>${i18n.t('scheduledTime')}
                </label>
                <input type="datetime-local" id="review-scheduled-at"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <p class="mt-1 text-xs text-gray-500">
                  <i class="fas fa-info-circle mr-1"></i>${i18n.t('selectDateTime')}
                </p>
              </div>

              <!-- Location -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-map-marker-alt mr-1"></i>${i18n.t('location')}
                </label>
                <input type="text" id="review-location"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="${i18n.t('enterLocation')}">
              </div>

              <!-- Reminder -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-bell mr-1"></i>${i18n.t('reminderMinutes')}
                </label>
                <select id="review-reminder-minutes"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="15">15 ${i18n.t('minutes')}</option>
                  <option value="30">30 ${i18n.t('minutes')}</option>
                  <option value="60" selected>60 ${i18n.t('minutes')}</option>
                  <option value="120">120 ${i18n.t('minutes')}</option>
                  <option value="1440">1 ${i18n.t('day') || '天'}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Allow Multiple Answers -->
          <div class="border-t pt-6">
            <div class="flex items-start">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-list-check mr-1"></i>${i18n.t('allowMultipleAnswers')}
                </label>
                <p class="text-xs text-gray-500 mb-3">
                  <i class="fas fa-info-circle mr-1"></i>${i18n.t('allowMultipleAnswersHint')}
                </p>
              </div>
            </div>
            <div class="flex space-x-4">
              <label class="flex items-center cursor-pointer">
                <input type="radio" name="allow_multiple_answers" value="yes" checked
                       class="mr-2 text-indigo-600 focus:ring-indigo-500">
                <span class="text-sm text-gray-700">
                  <i class="fas fa-check-circle text-green-600 mr-1"></i>${i18n.t('yes')}
                </span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" name="allow_multiple_answers" value="no"
                       class="mr-2 text-indigo-600 focus:ring-indigo-500">
                <span class="text-sm text-gray-700">
                  <i class="fas fa-times-circle text-red-600 mr-1"></i>${i18n.t('no')}
                </span>
              </label>
            </div>
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
              <i class="fas fa-edit mr-2"></i>${i18n.t('createAndEdit') || '创建并编辑'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('review-form').addEventListener('submit', handleStep1Submit);
  
  // Store templates and teams in global variable for access
  window.currentTemplates = templates;
  window.currentTeams = teams;
  
  // Initialize with default template
  handleTemplateChangeStep1();
  
  // Restore preserved data if coming back from step 2
  if (preservedData) {
    // Restore form values
    if (preservedData.title) {
      document.getElementById('review-title').value = preservedData.title;
    }
    if (preservedData.description) {
      document.getElementById('review-description').value = preservedData.description;
    }
    if (preservedData.template_id) {
      document.getElementById('review-template').value = preservedData.template_id;
      handleTemplateChangeStep1(); // Update template info
    }
    if (preservedData.owner_type) {
      document.getElementById('review-owner-type').value = preservedData.owner_type;
      handleOwnerTypeChange(); // Show/hide team selector
    }
    if (preservedData.team_id && preservedData.owner_type === 'team') {
      const teamSelect = document.getElementById('review-team');
      if (teamSelect) {
        teamSelect.value = preservedData.team_id;
      }
    }
    if (preservedData.time_type) {
      document.getElementById('review-time-type').value = preservedData.time_type;
    }
    if (preservedData.owner_type) {
      document.getElementById('review-owner-type').value = preservedData.owner_type;
    }
    if (preservedData.status) {
      const statusRadio = document.querySelector(`input[name="status"][value="${preservedData.status}"]`);
      if (statusRadio) {
        statusRadio.checked = true;
      }
    }
  }
  
  // Set currentView only after everything is successfully rendered and initialized
  currentView = 'create-review-step1';
  
  } catch (error) {
    console.error('Show create review error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + error.message, 'error');
    showReviews(); // Fall back to reviews list
  }
}

// Handle template selection change in step 1
function handleOwnerTypeChange() {
  const ownerType = document.getElementById('review-owner-type').value;
  const teamSelector = document.getElementById('owner-team-selector');
  
  if (teamSelector) {
    if (ownerType === 'team') {
      teamSelector.style.display = 'block';
      // Make team selection required
      const teamSelect = document.getElementById('review-team');
      if (teamSelect) {
        teamSelect.setAttribute('required', 'required');
      }
    } else {
      teamSelector.style.display = 'none';
      // Remove required attribute
      const teamSelect = document.getElementById('review-team');
      if (teamSelect) {
        teamSelect.removeAttribute('required');
        teamSelect.value = ''; // Clear selection
      }
    }
  }
}

// ========== FIX: Handle owner type change in edit mode with team validation ==========
function handleOwnerTypeChangeInEdit(reviewId, teams) {
  const ownerTypeSelect = document.getElementById('review-owner-type');
  if (!ownerTypeSelect) return;
  
  const ownerType = ownerTypeSelect.value;
  const currentReview = window.currentEditReview;
  
  // Check if team selection is needed
  if (ownerType === 'team') {
    // Check if user has any teams
    if (!teams || teams.length === 0) {
      // Show warning
      showNotification(
        i18n.t('noTeamsAvailable') || '您还没有加入任何团队，无法将复盘设置为团队所有',
        'warning'
      );
      
      // Revert to original value
      if (currentReview) {
        setTimeout(() => {
          ownerTypeSelect.value = currentReview.owner_type || 'private';
        }, 100);
      }
      return;
    }
    
    // Show team information in a non-editable way
    // Since team_id cannot be changed after creation, we just display current team
    console.log('[handleOwnerTypeChangeInEdit] Team mode selected, but team cannot be changed');
  }
}

async function handleTemplateChangeStep1() {
  try {
    const templateSelect = document.getElementById('review-template');
    if (!templateSelect) return;
    
    const templateId = parseInt(templateSelect.value);
    const template = window.currentTemplates.find(t => t.id === templateId);
    
    if (!template) return;
    
    // Update template info
    const templateInfo = document.getElementById('template-info');
    if (!templateInfo) return;
    
    const templateInfoPara = templateInfo.querySelector('p');
    if (!templateInfoPara) return;
    
    if (template.description) {
      const questionCount = template.questions ? template.questions.length : 0;
      templateInfoPara.textContent = template.description + `\n\n${i18n.t('questionCount') || '共'}${questionCount}${i18n.t('questions') || '个问题'}`;
      templateInfo.style.display = 'block';
    } else {
      templateInfo.style.display = 'none';
    }
  } catch (error) {
    console.error('Handle template change error:', error);
  }
}

// Handle step 1 form submission
async function handleStep1Submit(e) {
  e.preventDefault();
  
  const title = document.getElementById('review-title').value;
  const description = document.getElementById('review-description').value;
  const templateId = parseInt(document.getElementById('review-template').value);
  
  // Get team ID based on owner type
  let teamId = null;
  const ownerType = document.getElementById('review-owner-type').value;
  
  if (ownerType === 'team') {
    teamId = document.getElementById('review-team')?.value || null;
    if (!teamId) {
      showNotification(i18n.t('pleaseSelectTeam') || '请选择团队', 'error');
      return;
    }
  }
  
  const timeType = document.getElementById('review-time-type').value;
  const status = document.querySelector('input[name="status"]:checked').value;
  
  // Get allow_multiple_answers field
  const allowMultipleAnswers = document.querySelector('input[name="allow_multiple_answers"]:checked')?.value || 'yes';
  
  // Get calendar fields (optional)
  const scheduledAt = document.getElementById('review-scheduled-at').value || null;
  const location = document.getElementById('review-location').value || null;
  const reminderMinutes = parseInt(document.getElementById('review-reminder-minutes').value) || 60;
  
  // Create draft review first, then open in edit mode
  const data = {
    title,
    description,
    template_id: templateId,
    team_id: teamId || null,
    time_type: timeType,
    owner_type: ownerType,
    status: 'draft', // Always create as draft first
    scheduled_at: scheduledAt,
    location: location,
    reminder_minutes: reminderMinutes,
    allow_multiple_answers: allowMultipleAnswers
  };
  
  try {
    console.log('创建空白草稿复盘:', data);
    
    // Create empty draft review
    const response = await axios.post('/api/reviews', data);
    const newReviewId = response.data.id;
    
    console.log('草稿创建成功，ID:', newReviewId);
    showNotification(i18n.t('draftCreated') + ' (ID: ' + newReviewId + ')', 'success');
    
    // IMPORTANT: Set currentDraftId to prevent autoSaveDraftBeforeNavigation from creating a duplicate
    currentDraftId = newReviewId;
    console.log('已设置 currentDraftId:', currentDraftId, '防止自动保存创建重复草稿');
    
    // Mark this as a newly created draft that hasn't been saved yet
    window.newlyCreatedDraftId = newReviewId;
    
    // Open in edit mode directly
    showEditReview(newReviewId);
  } catch (error) {
    console.error('创建草稿失败:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Step 2: Fill in questions based on template
async function showCreateReviewStep2(template) {
  currentView = 'create-review-step2';
  const app = document.getElementById('app');
  
  const reviewData = window.createReviewData;
  
  // Load draft answers if editing existing draft
  let draftAnswers = {};
  if (currentDraftId) {
    try {
      console.log('加载草稿数据 ID:', currentDraftId);
      const response = await axios.get(`/api/reviews/${currentDraftId}`);
      const answersByQuestion = response.data.answersByQuestion || {};
      
      // Get current user
      const userResponse = await axios.get('/api/auth/me');
      const currentUser = userResponse.data.user;
      
      // Extract user's answers
      Object.keys(answersByQuestion).forEach(qNum => {
        const questionAnswers = answersByQuestion[qNum] || [];
        const myAnswers = questionAnswers.filter(a => a.user_id === currentUser.id);
        if (myAnswers.length > 0) {
          draftAnswers[qNum] = myAnswers.map(a => a.answer);
        }
      });
      
      console.log('草稿答案已加载:', draftAnswers);
    } catch (error) {
      console.error('加载草稿失败:', error);
      // Continue anyway - user can still fill the form
    }
  }
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="mb-6">
          <button onclick="handlePreviousWithConfirmation()" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back') || '返回'}
          </button>
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-plus-circle mr-2"></i>${i18n.t('createReview')} - ${i18n.t('step') || '步骤'} 2/2
          </h1>
          <p class="text-sm text-gray-600 mt-2">
            ${i18n.t('reviewTitle')}: ${escapeHtml(reviewData.title)} | ${i18n.t('template')}: ${escapeHtml(template.name)}
          </p>
        </div>

        <!-- Template Description -->
        ${template.description ? `
        <div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
          <h3 class="text-sm font-semibold text-blue-800 mb-2">
            <i class="fas fa-info-circle mr-2"></i>${i18n.t('templateDescription')}
          </h3>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(template.description)}</p>
        </div>
        ` : ''}

        <form id="questions-form" class="space-y-6">
          <!-- Dynamic Questions -->
          ${(template.questions && template.questions.length > 0) ? template.questions.map(q => {
            // Render based on question type
            if (q.question_type === 'single_choice' && q.options) {
              const options = JSON.parse(q.options);
              return `
                <div class="bg-white rounded-lg shadow-md p-6">
                  <label class="block text-sm font-medium text-gray-700 mb-3">
                    ${q.question_number}. ${escapeHtml(q.question_text)}
                    ${q.question_text_en ? `<span class="text-xs text-gray-500 block mt-1">${escapeHtml(q.question_text_en)}</span>` : ''}
                  </label>
                  <div class="space-y-2">
                    ${options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      return `
                        <label class="flex items-start p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="radio" name="question${q.question_number}" value="${letter}" 
                                 class="mt-1 mr-3 flex-shrink-0">
                          <span class="text-sm text-gray-900">${escapeHtml(opt)}</span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            } else if (q.question_type === 'multiple_choice' && q.options) {
              const options = JSON.parse(q.options);
              return `
                <div class="bg-white rounded-lg shadow-md p-6">
                  <label class="block text-sm font-medium text-gray-700 mb-3">
                    ${q.question_number}. ${escapeHtml(q.question_text)}
                    ${q.question_text_en ? `<span class="text-xs text-gray-500 block mt-1">${escapeHtml(q.question_text_en)}</span>` : ''}
                    <span class="text-xs text-indigo-600 block mt-1">${i18n.t('multipleChoiceHint')}</span>
                  </label>
                  <div class="space-y-2">
                    ${options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      return `
                        <label class="flex items-start p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" name="question${q.question_number}" value="${letter}" 
                                 class="mt-1 mr-3 flex-shrink-0">
                          <span class="text-sm text-gray-900">${escapeHtml(opt)}</span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            } else {
              // Default text type - support multiple answers during creation
              return `
                <div class="bg-white rounded-lg shadow-md p-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    ${q.question_number}. ${escapeHtml(q.question_text)}
                    ${q.question_text_en ? `<span class="text-xs text-gray-500 block mt-1">${escapeHtml(q.question_text_en)}</span>` : ''}
                  </label>
                  
                  <!-- Answer inputs container -->
                  <div id="answers-container-create-${q.question_number}" class="space-y-3 mb-3">
                    <!-- First answer input (always present) -->
                    <div class="answer-input-group relative">
                      <textarea data-question="${q.question_number}" data-answer-index="0" rows="4"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                                placeholder="${i18n.t('enterAnswer') || '输入答案...'}"></textarea>
                    </div>
                  </div>
                  
                  <!-- Add another answer button -->
                  <button type="button" 
                          onclick="addAnswerInputInCreate(${q.question_number})"
                          class="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <i class="fas fa-plus-circle mr-2"></i>${i18n.t('addAnotherAnswer') || '添加另一个答案'}
                  </button>
                  
                  <p class="mt-2 text-xs text-gray-500">
                    <i class="fas fa-info-circle mr-1"></i>${i18n.t('canAddMultipleAnswers') || '您可以为同一问题添加多个答案'}
                  </p>
                </div>
              `;
            }
          }).join('') : '<p class="text-gray-500 text-center py-4">' + (i18n.t('noQuestions') || '暂无问题') + '</p>'}

          <!-- Actions -->
          <div class="flex justify-between space-x-4 pt-6 border-t bg-white rounded-lg shadow-md p-6 sticky bottom-0">
            <button type="button" onclick="handlePreviousWithConfirmation()" 
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('previous') || '上一步'}
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

  document.getElementById('questions-form').addEventListener('submit', handleStep2Submit);
  
  // Store template for later use
  window.currentSelectedTemplate = template;
  
  // Restore draft answers if available
  if (Object.keys(draftAnswers).length > 0) {
    console.log('恢复草稿答案到表单...');
    
    template.questions.forEach(q => {
      const qNum = q.question_number;
      const savedAnswers = draftAnswers[qNum];
      
      if (!savedAnswers || savedAnswers.length === 0) return;
      
      if (q.question_type === 'single_choice') {
        // Restore single choice answer
        const answerValue = savedAnswers[0]; // e.g., "A", "B", "C"
        const radio = document.querySelector(`input[name="question${qNum}"][value="${answerValue}"]`);
        if (radio) {
          radio.checked = true;
          console.log(`恢复单选题 ${qNum}: ${answerValue}`);
        }
      } else if (q.question_type === 'multiple_choice') {
        // Restore multiple choice answers
        const answerValues = savedAnswers[0].split(','); // e.g., "A,B,C"
        answerValues.forEach(val => {
          const checkbox = document.querySelector(`input[name="question${qNum}"][value="${val.trim()}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
        console.log(`恢复多选题 ${qNum}: ${answerValues.join(', ')}`);
      } else {
        // Restore text answers (multiple answers supported)
        const container = document.getElementById(`answers-container-create-${qNum}`);
        if (!container) return;
        
        // Clear existing inputs
        container.innerHTML = '';
        
        // Add input for each saved answer
        savedAnswers.forEach((answerText, index) => {
          const isFirst = index === 0;
          const inputHtml = isFirst ? `
            <div class="answer-input-group relative">
              <textarea data-question="${qNum}" data-answer-index="${index}" rows="4"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                        placeholder="${i18n.t('enterAnswer') || '输入答案...'}">${escapeHtml(answerText)}</textarea>
            </div>
          ` : `
            <div class="answer-input-group relative">
              <div class="flex gap-2">
                <textarea data-question="${qNum}" data-answer-index="${index}" rows="4"
                          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                          placeholder="${i18n.t('enterAnswer') || '输入答案...'}">${escapeHtml(answerText)}</textarea>
                <button type="button" 
                        onclick="removeAnswerInputInCreate(this)"
                        class="self-start px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          `;
          container.insertAdjacentHTML('beforeend', inputHtml);
        });
        
        console.log(`恢复文字题 ${qNum}: ${savedAnswers.length} 个答案`);
      }
    });
    
    showNotification(i18n.t('draftRestored') || '草稿已恢复', 'success');
  }
}

// Helper function: Add another answer input in create mode
function addAnswerInputInCreate(questionNumber) {
  const container = document.getElementById(`answers-container-create-${questionNumber}`);
  const currentInputs = container.querySelectorAll('.answer-input-group');
  const nextIndex = currentInputs.length;
  
  const newInputHtml = `
    <div class="answer-input-group relative">
      <div class="flex gap-2">
        <textarea data-question="${questionNumber}" data-answer-index="${nextIndex}" rows="4"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="${i18n.t('enterAnswer') || '输入答案...'}"></textarea>
        <button type="button" 
                onclick="removeAnswerInputInCreate(this)"
                class="self-start px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', newInputHtml);
}

// Helper function: Remove answer input in create mode
function removeAnswerInputInCreate(button) {
  const inputGroup = button.closest('.answer-input-group');
  const container = inputGroup.parentElement;
  
  // Don't allow removing if it's the last input
  const remainingInputs = container.querySelectorAll('.answer-input-group');
  if (remainingInputs.length <= 1) {
    showNotification(i18n.t('mustKeepOneAnswer') || '至少需要保留一个答案输入框', 'warning');
    return;
  }
  
  inputGroup.remove();
}

// Handle step 2 form submission (save review)
async function handleStep2Submit(e) {
  e.preventDefault();
  
  // Prevent duplicate submission
  if (window.isSubmitting) {
    return;
  }
  window.isSubmitting = true;
  
  const template = window.currentSelectedTemplate;
  const reviewData = window.createReviewData;
  
  // V6.7.0: Validate required fields before submission
  const requiredErrors = [];
  if (template && template.questions) {
    template.questions.forEach(q => {
      // Check if this question is required
      if (q.required === 'yes') {
        let hasAnswer = false;
        
        if (q.question_type === 'single_choice') {
          const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
          hasAnswer = !!selected;
        } else if (q.question_type === 'multiple_choice') {
          const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
          hasAnswer = checked.length > 0;
        } else {
          // Text type
          const answerInputs = document.querySelectorAll(`textarea[data-question="${q.question_number}"]`);
          for (const input of answerInputs) {
            if (input.value.trim()) {
              hasAnswer = true;
              break;
            }
          }
        }
        
        if (!hasAnswer) {
          requiredErrors.push(`${i18n.t('question') || '问题'} ${q.question_number}: ${q.question_text}`);
        }
      }
    });
  }
  
  // If there are required field errors, show them and stop submission
  if (requiredErrors.length > 0) {
    window.isSubmitting = false;
    const errorMessage = `${i18n.t('requiredFieldsNotFilled') || '以下必填项未填写'}:\n\n${requiredErrors.join('\n')}`;
    alert(errorMessage);
    return;
  }
  
  // Collect answers dynamically
  const answers = {};
  if (template && template.questions) {
    template.questions.forEach(q => {
      if (q.question_type === 'single_choice') {
        // Get selected radio button
        const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
        if (selected) {
          answers[q.question_number] = selected.value; // "A" or "B" etc.
        }
      } else if (q.question_type === 'multiple_choice') {
        // Get all checked checkboxes
        const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
        if (checked.length > 0) {
          const selectedValues = Array.from(checked).map(cb => cb.value);
          answers[q.question_number] = selectedValues.join(','); // "A,B,C"
        }
      } else {
        // Text type - collect all answer inputs for this question
        const answerInputs = document.querySelectorAll(`textarea[data-question="${q.question_number}"]`);
        const answerTexts = [];
        
        answerInputs.forEach(input => {
          const text = input.value.trim();
          if (text) {
            answerTexts.push(text);
          }
        });
        
        // Store as array if multiple answers, or single value if one answer
        if (answerTexts.length > 0) {
          answers[q.question_number] = answerTexts.length === 1 ? answerTexts[0] : answerTexts;
        }
      }
    });
  }
  
  const data = {
    ...reviewData,
    answers
  };

  try {
    // Check if we have a draft ID from previous save
    if (currentDraftId) {
      // Update existing draft instead of creating new one
      await axios.put(`/api/reviews/${currentDraftId}`, data);
      showNotification(i18n.t('reviewSavedSuccessfully') || '复盘保存成功！', 'success');
    } else {
      // Create new review
      const response = await axios.post('/api/reviews', data);
      // Don't set currentDraftId here - we're completing the review, not drafting
      showNotification(i18n.t('reviewCreatedSuccessfully') || '复盘创建成功！', 'success');
    }
    
    // CRITICAL: Clear draft ID and change view BEFORE returning to reviews
    // This prevents autoSaveDraftBeforeNavigation() from saving again
    currentDraftId = null;
    currentView = 'completing-review'; // Temporary state to prevent auto-save
    
    // Return to My Reviews list after a short delay to show notification
    setTimeout(() => {
      showReviews();
      window.scrollTo(0, 0);
    }, 500);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  } finally {
    window.isSubmitting = false;
  }
}

// Handle "Previous" button - auto save draft without confirmation
async function handlePreviousWithConfirmation() {
  // Check if user has filled any answers
  const template = window.currentSelectedTemplate;
  let hasAnswers = false;
  
  if (template && template.questions) {
    for (const q of template.questions) {
      if (q.question_type === 'single_choice') {
        const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
        if (selected) {
          hasAnswers = true;
          break;
        }
      } else if (q.question_type === 'multiple_choice') {
        const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
        if (checked.length > 0) {
          hasAnswers = true;
          break;
        }
      } else {
        // Text type - check all answer inputs for this question
        const answerInputs = document.querySelectorAll(`textarea[data-question="${q.question_number}"]`);
        for (const input of answerInputs) {
          if (input.value.trim()) {
            hasAnswers = true;
            break;
          }
        }
        if (hasAnswers) break;
      }
    }
  }
  
  if (hasAnswers) {
    // Auto save draft without asking
    try {
        const reviewData = window.createReviewData;
        const answers = {};
        
        // Collect answers
        if (template && template.questions) {
          template.questions.forEach(q => {
            if (q.question_type === 'single_choice') {
              const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
              if (selected) {
                answers[q.question_number] = selected.value;
              }
            } else if (q.question_type === 'multiple_choice') {
              const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
              if (checked.length > 0) {
                const selectedValues = Array.from(checked).map(cb => cb.value);
                answers[q.question_number] = selectedValues.join(',');
              }
            } else {
              // Text type - collect all answer inputs for this question
              const answerInputs = document.querySelectorAll(`textarea[data-question="${q.question_number}"]`);
              const answerTexts = [];
              
              answerInputs.forEach(input => {
                const text = input.value.trim();
                if (text) {
                  answerTexts.push(text);
                }
              });
              
              // Store as array if multiple answers, or single value if one answer
              if (answerTexts.length > 0) {
                answers[q.question_number] = answerTexts.length === 1 ? answerTexts[0] : answerTexts;
              }
            }
          });
        }
        
        const data = {
          ...reviewData,
          status: 'draft', // Force to draft
          answers
        };
        
        // Validate data before saving
        console.log('自动保存草稿:', data);
        
        if (!data.title || !data.template_id) {
          showNotification(i18n.t('pleaseCompleteBasicInfo') || '请先完成基本信息填写', 'error');
          return;
        }
        
        // Save or update draft
        if (currentDraftId) {
          console.log('更新现有草稿 ID:', currentDraftId);
          const response = await axios.put(`/api/reviews/${currentDraftId}`, data);
          console.log('草稿更新成功:', response.data);
          showNotification(i18n.t('draftAutoSaved') + ' (ID: ' + currentDraftId + ')', 'success');
        } else {
          console.log('创建新草稿');
          const response = await axios.post('/api/reviews', data);
          currentDraftId = response.data.id;
          console.log('新草稿创建成功，ID:', currentDraftId);
          showNotification(i18n.t('draftAutoSaved') + ' (ID: ' + currentDraftId + ')', 'success');
        }
        
        // Navigate back immediately after save
        showCreateReview(window.createReviewData);
        return;
      } catch (error) {
        console.error('自动保存草稿失败:', error);
        showNotification(i18n.t('autoSaveFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
        // Still go back even if save failed
        showCreateReview(window.createReviewData);
        return;
      }
  }
  
  // Go back to step 1 (if no answers)
  showCreateReview(window.createReviewData);
}

// Old handleCreateReview function removed - now using two-step process

// ============ Print Review ============

async function printReview(reviewId) {
  try {
    // Fetch review data
    const response = await axios.get(`/api/reviews/${reviewId}`);
    const review = response.data.review;
    const questions = response.data.questions || [];
    const answersByQuestion = response.data.answersByQuestion || {};
    
    // V6.7.12: Get current user ID - use response data directly instead of global variable
    // The response already contains the review creator's user_id
    // For privacy filtering, we need current logged-in user's ID
    const reviewCreatorId = review.user_id;
    let currentUserId = null;
    
    // Method 1: Try global currentUser variable (set during login)
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
      currentUserId = currentUser.id;
      console.log('[printReview] Got currentUserId from global variable:', currentUserId);
    }
    
    // Method 2: Try localStorage as fallback
    if (!currentUserId) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          currentUserId = user.id;
          console.log('[printReview] Got currentUserId from localStorage:', currentUserId);
        }
      } catch (error) {
        console.error('[printReview] Failed to get user from localStorage:', error);
      }
    }
    
    // Method 3: As last resort, assume current user is the review creator
    // This is safe because only users with access can view the review
    if (!currentUserId) {
      console.warn('[printReview] Could not determine currentUserId, assuming user is review creator');
      currentUserId = reviewCreatorId;
    }
    
    console.log('[printReview] V6.7.12 User info:', {
      currentUserId: currentUserId,
      reviewCreatorId: reviewCreatorId,
      isCreator: currentUserId === reviewCreatorId
    });
    
    // Create printable content
    let printContent = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${i18n.t('printReview')} - ${review.title}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Microsoft YaHei', 'SimSun';
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #4F46E5;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          h2 {
            color: #6366F1;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
          }
          .meta-info {
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .meta-item {
            margin: 8px 0;
          }
          .meta-label {
            font-weight: bold;
            color: #6B7280;
            display: inline-block;
            width: 100px;
          }
          .description-section {
            background: #EEF2FF;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #6366F1;
          }
          .description-content {
            color: #374151;
            line-height: 1.8;
            white-space: pre-wrap;
            margin-top: 10px;
          }
          .question {
            background: #F9FAFB;
            padding: 15px;
            border-left: 4px solid #4F46E5;
            margin-bottom: 20px;
            border-radius: 4px;
            page-break-inside: avoid;
          }
          .question-title {
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 10px;
            font-size: 1.1em;
          }
          .answer {
            padding: 10px 15px;
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 4px;
            margin-top: 10px;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .answer-header {
            font-size: 0.9em;
            color: #6B7280;
            margin-bottom: 5px;
          }
          .button-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
          }
          .print-button {
            background: #4F46E5;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.3s;
          }
          .print-button:hover {
            background: #4338CA;
          }
          @media print {
            .button-container { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="button-container no-print">
          <button class="print-button" onclick="window.print()">
            <i class="fas fa-print"></i> ${i18n.t('print')}
          </button>
        </div>
        
        <h1>${review.title}</h1>
        
        <div class="meta-info">
          <div class="meta-item">
            <span class="meta-label">${i18n.t('status')}:</span>
            <span>${i18n.t(review.status)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${i18n.t('type')}:</span>
            <span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${i18n.t('createdAt')}:</span>
            <span>${new Date(review.created_at).toLocaleString()}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${i18n.t('updatedAt')}:</span>
            <span>${new Date(review.updated_at).toLocaleString()}</span>
          </div>
        </div>
        
        ${review.template_description ? `
        <div class="description-section">
          <h2>${i18n.t('reviewDescription') || '复盘说明'}</h2>
          <div class="description-content">${review.template_description}</div>
        </div>
        ` : ''}
    `;
    
    // Add questions and answers
    questions.forEach((question, index) => {
      printContent += `
        <div class="question">
          <div class="question-title">${index + 1}. ${question.question_text}</div>
      `;
      
      // V6.7.0: Apply privacy filtering based on owner attribute
      // V6.7.5: Fix data type mismatch - API returns string keys, ensure we use string
      const questionKey = String(question.question_number);
      const allAnswers = answersByQuestion[questionKey] || [];
      
      console.log(`[printReview] Question ${questionKey}:`, {
        questionText: question.question_text,
        owner: question.owner,
        allAnswersCount: allAnswers.length,
        allAnswers: allAnswers
      });
      
      const filteredAnswers = filterAnswersByPrivacy(question, allAnswers, currentUserId, reviewCreatorId);
      
      console.log(`[printReview] After filtering:`, {
        filteredAnswersCount: filteredAnswers.length,
        filteredAnswers: filteredAnswers
      });
      
      if (filteredAnswers.length > 0) {
        filteredAnswers.forEach(answer => {
          const answerText = answer.answer || '';
          console.log(`[printReview] Rendering answer:`, {
            username: answer.username,
            answerLength: answerText.length,
            answerPreview: answerText.substring(0, 50)
          });
          
          printContent += `
            <div class="answer">
              ${answer.username ? `<div class="answer-header"><strong>${answer.username}</strong> - ${new Date(answer.updated_at).toLocaleString()}</div>` : ''}
              <div>${answerText || i18n.t('noAnswer')}</div>
            </div>
          `;
        });
      } else {
        console.log(`[printReview] No filtered answers for question ${questionKey}`);
        printContent += `
          <div class="answer">
            <div>${i18n.t('noAnswer')}</div>
          </div>
        `;
      }
      
      printContent += `</div>`;
    });
    
    printContent += `
        <div class="button-container no-print">
          <button class="print-button" onclick="window.print()">
            <i class="fas fa-print"></i> ${i18n.t('print')}
          </button>
        </div>
      </body>
      </html>
    `;
    
    // Open print window
    console.log('[printReview] Opening print window...');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('[printReview] Failed to open print window - popup blocked?');
      alert('打印窗口被阻止，请允许弹出窗口');
      return;
    }
    
    console.log('[printReview] Writing content to print window...');
    printWindow.document.write(printContent);
    printWindow.document.close();
    console.log('[printReview] Print window ready');
    
    // Trigger print dialog after content loads
    printWindow.onload = function() {
      printWindow.focus();
    };
    
  } catch (error) {
    console.error('[printReview] Error occurred:', error);
    console.error('[printReview] Error stack:', error.stack);
    alert('打印出错: ' + error.message);
    showToast(i18n.t('printError') || 'Failed to generate print preview', 'error');
  }
}

// V6.7.6: Expose printReview to global scope for debugging
console.log('[printReview] Function defined and available:', typeof printReview);

// ============ Review Detail & Edit ============

// Toggle answer visibility in review detail page
function toggleAnswer(questionId) {
  const answerDiv = document.getElementById(questionId);
  const icon = document.getElementById('icon-' + questionId);
  const text = document.getElementById('text-' + questionId);
  
  if (answerDiv && icon && text) {
    if (answerDiv.classList.contains('hidden')) {
      // Expand
      answerDiv.classList.remove('hidden');
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
      text.textContent = i18n.t('collapse') || '收起';
    } else {
      // Collapse
      answerDiv.classList.add('hidden');
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
      text.textContent = i18n.t('expand') || '展开';
    }
  }
}

async function showReviewDetail(id, readOnly = false) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review;
    const questions = response.data.questions || [];
    const answersByQuestion = response.data.answersByQuestion || {};
    const collaborators = response.data.collaborators || [];
    
    // If it's a team review or has multiple contributors, redirect to collaboration view
    // Check if there are answers from multiple users
    const hasMultipleContributors = Object.values(answersByQuestion).some(answers => 
      Array.isArray(answers) && answers.length > 1
    );
    
    if ((review.team_id || hasMultipleContributors) && !readOnly) {
      showTeamReviewCollaboration(id);
      return;
    }
    
    // Otherwise, show regular review detail (for personal reviews)
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mb-6">
            <button onclick="${review.review_type === 'document' ? 'loadDocumentsReviews()' : review.review_type === 'famous-book' ? 'loadFamousBooksReviews()' : 'showReviews()'}" class="text-indigo-600 hover:text-indigo-800 mb-4">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back') || '返回'}
            </button>
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                  ${readOnly ? '<i class="fas fa-eye mr-2 text-indigo-600"></i>' : ''}${escapeHtml(review.title)}
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
                  ${review.time_type ? `
                    <span class="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      <i class="fas fa-calendar-alt mr-1"></i>${i18n.t('timeType' + review.time_type.charAt(0).toUpperCase() + review.time_type.slice(1))}
                    </span>
                  ` : ''}
                  ${review.template_name ? `
                    <span class="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                      <i class="fas fa-file-alt mr-1"></i>${escapeHtml(review.template_name)}
                    </span>
                  ` : ''}
                </div>
              </div>
              ${!readOnly ? `
              <div class="flex space-x-2">
                <button onclick="showEditReview(${review.id})" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-edit mr-2"></i>${i18n.t('edit')}
                </button>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Review Header Information (Collapsible) -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <button type="button" onclick="toggleSection('review-header-section')" 
                    class="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors">
              <h3 class="text-lg font-semibold text-gray-800">
                <i class="fas fa-info-circle mr-2"></i>${i18n.t('reviewHeader') || '复盘表头'}
              </h3>
              <i class="fas fa-chevron-down text-gray-600" id="icon-review-header-section"></i>
            </button>
            <div id="review-header-section" class="hidden">
              <div class="p-6 pt-0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  ${i18n.t('reviewTitle')}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  ${escapeHtml(review.title)}
                </div>
              </div>
              
              <!-- Owner Type -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  ${i18n.t('ownerType')}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  ${renderOwnerTypeBadge(review.owner_type)}
                </div>
              </div>
              
              <!-- Time Type -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  ${i18n.t('timeType')}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <i class="fas fa-calendar-alt mr-2 text-orange-600"></i>${i18n.t('timeType' + (review.time_type ? review.time_type.charAt(0).toUpperCase() + review.time_type.slice(1) : 'Daily'))}
                </div>
              </div>
              
              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  ${i18n.t('status')}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    review.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }">
                    ${i18n.t(review.status)}
                  </span>
                </div>
              </div>
              
              ${review.team_name ? `
              <!-- Team -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  ${i18n.t('team')}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <i class="fas fa-users mr-2 text-green-600"></i>${escapeHtml(review.team_name)}
                </div>
              </div>
              ` : ''}
              
              ${review.template_name ? `
              <!-- Template -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  ${i18n.t('template')}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <i class="fas fa-file-alt mr-2 text-indigo-600"></i>${escapeHtml(review.template_name)}
                </div>
              </div>
              ` : ''}
              
              <!-- Scheduled Time (Always show) -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  <i class="fas fa-clock mr-1"></i>${i18n.t('scheduledTime') || '计划时间'}
                </label>
                <div class="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  ${review.scheduled_at ? `
                    <i class="fas fa-calendar-check mr-2 text-yellow-600"></i>${new Date(review.scheduled_at).toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  ` : `
                    <i class="fas fa-question-circle mr-2 text-gray-500"></i><span class="text-gray-500">${i18n.t('notDetermined') || '未确定'}</span>
                  `}
                </div>
              </div>
              
              ${review.location ? `
              <!-- Location -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  <i class="fas fa-map-marker-alt mr-1"></i>${i18n.t('location') || '地点'}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <i class="fas fa-location-dot mr-2 text-red-600"></i>${escapeHtml(review.location)}
                </div>
              </div>
              ` : ''}
              
              ${review.reminder_minutes ? `
              <!-- Reminder -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  <i class="fas fa-bell mr-1"></i>${i18n.t('reminderMinutes') || '提醒时间'}
                </label>
                <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <i class="fas fa-bell mr-2 text-purple-600"></i>${review.reminder_minutes} ${i18n.t('minutes') || '分钟'}
                </div>
              </div>
              ` : ''}
            </div>
            
            ${review.description ? `
            <div class="mt-4 pt-4 border-t">
              <label class="block text-sm font-medium text-gray-600 mb-1">
                ${i18n.t('reviewDescription')}
              </label>
              <div class="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(review.description)}</p>
              </div>
            </div>
            ` : ''}
            </div>
          </div>
        </div>

          <!-- Dynamic Questions Display -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
              <i class="fas fa-question-circle mr-2"></i>${review.template_name ? escapeHtml(review.template_name) : i18n.t('nineQuestions')}
            </h2>
            
            ${questions.length > 0 ? questions.map(q => {
              const allAnswers = answersByQuestion[q.question_number] || [];
              // V6.7.0: Filter answers based on privacy settings
              const currentUserId = currentUser ? currentUser.id : null;
              const userAnswers = filterAnswersByPrivacy(q, allAnswers, currentUserId, review.user_id);
              const myAnswer = currentUserId ? userAnswers.find(a => a.user_id === currentUserId) : null;
              const questionId = `question-${q.question_number}`;
              const hiddenCount = allAnswers.length - userAnswers.length;
              
              return `
                <div class="border-b border-gray-200 py-3 last:border-b-0">
                  <div class="flex justify-between items-start">
                    <h3 class="text-sm font-semibold text-gray-700 flex-1">
                      ${q.question_number}. ${escapeHtml(q.question_text)}
                    </h3>
                    <button 
                      onclick="toggleAnswer('${questionId}')"
                      class="ml-3 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center"
                      id="toggle-btn-${questionId}"
                    >
                      <i class="fas fa-chevron-down mr-1" id="icon-${questionId}"></i>
                      <span id="text-${questionId}">${i18n.t('expand') || '展开'}</span>
                    </button>
                  </div>
                  
                  <div id="${questionId}" class="hidden mt-2">
                    ${userAnswers.length > 0 ? (() => {
                      // Group answers by username
                      const groupedByUser = {};
                      userAnswers.forEach(ans => {
                        const username = ans.username || 'Unknown';
                        if (!groupedByUser[username]) {
                          groupedByUser[username] = [];
                        }
                        groupedByUser[username].push(ans);
                      });
                      
                      // Sort groups by username alphabetically
                      const sortedUsers = Object.keys(groupedByUser).sort((a, b) => {
                        return a.localeCompare(b, 'zh-CN');
                      });
                      
                      // Generate HTML for each user group
                      return sortedUsers.map(username => {
                        const userAnswersList = groupedByUser[username];
                        const answerCount = userAnswersList.length;
                        const groupId = 'user-group-detail-' + q.question_number + '-' + username.replace(/[^a-zA-Z0-9]/g, '');
                        const isCurrentUser = userAnswersList.some(a => a.is_mine);
                        
                        // Sort user's answers by created_at (newest first)
                        userAnswersList.sort((a, b) => {
                          const dateA = new Date(a.created_at || a.updated_at).getTime();
                          const dateB = new Date(b.created_at || b.updated_at).getTime();
                          return dateB - dateA;
                        });
                        
                        // Determine if should be collapsed by default
                        const shouldCollapse = answerCount > 1;
                        const initialClass = shouldCollapse ? 'hidden' : '';
                        const initialIcon = shouldCollapse ? 'fa-chevron-down' : 'fa-chevron-up';
                        const initialText = shouldCollapse ? (i18n.t('expand') || '展开') : (i18n.t('collapse') || '收起');
                        
                        // Build user badge
                        const userBadge = isCurrentUser ? ' <span class="text-indigo-600">(' + (i18n.t("myAnswer") || "我") + ')</span>' : '';
                        
                        // Build collapse button
                        const collapseButton = answerCount > 1 ?
                          '<button onclick="toggleUserGroup(\'' + groupId + '\')" class="px-3 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100 transition-colors" id="toggle-btn-' + groupId + '">' +
                            '<i class="fas ' + initialIcon + ' mr-1"></i>' +
                            '<span id="toggle-text-' + groupId + '">' + initialText + '</span>' +
                          '</button>' : '';
                        
                        // Build answers HTML
                        const answersHtml = userAnswersList.map((ans, idx) => {
                          // Render based on question type
                          let answerDisplay = '';
                          if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
                            if (q.options) {
                              const options = JSON.parse(q.options);
                              const selectedLetters = ans.answer.split(',').map(a => a.trim());
                              const correctLetters = q.correct_answer ? q.correct_answer.split(',').map(a => a.trim()) : [];
                              
                              answerDisplay = '<div class="space-y-2">' +
                                options.map((opt, optIdx) => {
                                  const letter = String.fromCharCode(65 + optIdx);
                                  const isSelected = selectedLetters.includes(letter);
                                  const isCorrect = correctLetters.includes(letter);
                                  
                                  let bgColor = 'bg-white';
                                  let borderColor = 'border-gray-300';
                                  let icon = '';
                                  
                                  if (isSelected && isCorrect) {
                                    bgColor = 'bg-green-50';
                                    borderColor = 'border-green-400';
                                    icon = '<i class="fas fa-check-circle text-green-600 mr-2"></i>';
                                  } else if (isSelected && !isCorrect) {
                                    bgColor = 'bg-red-50';
                                    borderColor = 'border-red-400';
                                    icon = '<i class="fas fa-times-circle text-red-600 mr-2"></i>';
                                  } else if (!isSelected && isCorrect) {
                                    icon = '<i class="fas fa-star text-yellow-500 mr-2"></i>';
                                  }
                                  
                                  return '<div class="flex items-center p-2 border rounded ' + borderColor + ' ' + bgColor + '">' +
                                    icon +
                                    '<span class="text-sm ' + (isSelected ? 'font-medium' : '') + '">' + escapeHtml(opt) + '</span>' +
                                  '</div>';
                                }).join('') +
                              '</div>';
                            } else {
                              answerDisplay = '<div class="text-sm">' + escapeHtml(ans.answer) + '</div>';
                            }
                          } else {
                            answerDisplay = '<div class="text-sm leading-relaxed">' + escapeHtml(ans.answer) + '</div>';
                          }
                          
                          const latestBadge = (idx === 0 && answerCount > 1) ?
                            '<span class="ml-2 text-xs font-semibold text-blue-600"><i class="fas fa-star mr-1"></i>' + (i18n.t('latest') || '最新') + '</span>' : '';
                          
                          return '<div class="text-gray-800 bg-gray-50 p-3 rounded border ' + (ans.is_mine ? 'border-indigo-200' : 'border-gray-200') + ' mt-2">' +
                            '<div class="flex justify-between items-center mb-2">' +
                              '<span class="text-xs text-gray-600 font-medium">' +
                                '<i class="fas fa-clock mr-1"></i>' + formatDate(ans.created_at || ans.updated_at) +
                                latestBadge +
                              '</span>' +
                            '</div>' +
                            answerDisplay +
                            renderCommentButton(ans, review.id) +
                          '</div>';
                        }).join('');
                        
                        return '<div class="border border-gray-300 rounded-lg overflow-hidden mt-2 ' + (isCurrentUser ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50') + '">' +
                          '<div class="flex justify-between items-center p-3 ' + (isCurrentUser ? 'bg-indigo-100 border-b border-indigo-200' : 'bg-green-50 border-b border-gray-300') + '">' +
                            '<div class="flex items-center">' +
                              '<i class="fas fa-user-circle text-lg ' + (isCurrentUser ? 'text-indigo-600' : 'text-gray-600') + ' mr-2"></i>' +
                              '<span class="text-xs font-medium text-gray-700">' +
                                escapeHtml(username) + userBadge +
                                ' <span class="text-gray-500">(' + answerCount + ' ' + (answerCount === 1 ? i18n.t('answer') || '个答案' : i18n.t('answers') || '个答案') + ')</span>' +
                              '</span>' +
                            '</div>' +
                            collapseButton +
                          '</div>' +
                          '<div id="' + groupId + '" class="p-2 ' + initialClass + '">' +
                            answersHtml +
                          '</div>' +
                        '</div>';
                      }).join('');
                    })() : `
                      <div class="text-gray-500 text-sm bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                        ${i18n.t('noAnswer') || '未填写'}
                      </div>
                    `}
                    ${hiddenCount > 0 ? `
                      <div class="text-sm text-gray-500 italic mt-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <i class="fas fa-lock mr-1"></i>
                        ${i18n.t('privateAnswersHidden').replace('{count}', hiddenCount)}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('') : '<p class="text-gray-500 text-center py-4">' + (i18n.t('noQuestions') || '暂无问题') + '</p>'}
          </div>

          ${(collaborators && collaborators.length > 0) ? `
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

          <!-- Comment Modal -->
          ${renderCommentModal()}
        </div>
      </div>
    `;
    
    // Lock UI is initialized via inline event handlers in renderLockStatusSection
    // No separate initialization needed
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showReviews();
  }
}

// Team Review Collaboration View
async function showTeamReviewCollaboration(id) {
  try {
    const [reviewResponse, allAnswersResponse] = await Promise.all([
      axios.get(`/api/reviews/${id}`),
      axios.get(`/api/reviews/${id}/all-answers`)
    ]);
    
    const review = reviewResponse.data.review;
    const questions = reviewResponse.data.questions || [];
    const { answersByQuestion, completionStatus, currentUserId } = allAnswersResponse.data;
    const isOwner = review.user_id === currentUserId;
    const totalQuestions = questions.length;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-7xl mx-auto px-4 py-8">
          <div class="mb-6">
            <button onclick="showReviewDetail(${id})" class="text-indigo-600 hover:text-indigo-800 mb-4">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back')}
            </button>
            
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-users mr-2 text-green-600"></i>${escapeHtml(review.title)}
                  </h1>
                  <p class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>${i18n.t('refreshToSeeUpdates')}
                  </p>
                </div>
                <button onclick="location.reload()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <i class="fas fa-sync-alt mr-2"></i>${i18n.t('refresh') || '刷新'}
                </button>
              </div>
              
              ${review.description ? `
              <!-- Review Description -->
              <div class="border-t pt-4 mb-4">
                <div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                  <h3 class="text-sm font-semibold text-blue-800 mb-2">
                    <i class="fas fa-info-circle mr-2"></i>${i18n.t('reviewDescription')}
                  </h3>
                  <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(review.description)}</p>
                </div>
              </div>
              ` : ''}
              
              <!-- Completion Status -->
              <div class="border-t pt-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-3">
                  <i class="fas fa-check-circle mr-2 text-green-600"></i>${i18n.t('completionStatus')}
                </h3>
                <div class="flex flex-wrap gap-3">
                  ${(completionStatus && completionStatus.length > 0) ? completionStatus.map(member => `
                    <div class="flex items-center px-4 py-2 bg-gray-50 rounded-lg border ${
                      member.user_id === currentUserId ? 'border-indigo-500' : 'border-gray-200'
                    }">
                      <i class="fas fa-user-circle text-2xl text-gray-400 mr-2"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          ${escapeHtml(member.username)}${member.user_id === currentUserId ? ` (${i18n.t("myAnswer") || "我"})` : ''}
                        </div>
                        <div class="text-xs ${member.completed_count === totalQuestions ? 'text-green-600' : 'text-gray-500'}">
                          <i class="fas ${member.completed_count === totalQuestions ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
                          ${member.completed_count}/${totalQuestions} ${i18n.t('completed')}
                        </div>
                      </div>
                    </div>
                  `).join('') : '<p class="text-gray-500 text-center py-4">' + (i18n.t('noMembers') || '暂无成员') + '</p>'}
                </div>
              </div>
            </div>
          </div>

          <!-- Team Answers for Each Question -->
          <div class="space-y-6">
            ${(questions && questions.length > 0) ? questions.map(q => {
              const num = q.question_number;
              const memberAnswers = answersByQuestion[num] || [];
              
              return `
                <div class="bg-white rounded-lg shadow-md p-6">
                  <h2 class="text-xl font-bold text-gray-800 mb-4 border-b pb-3">
                    <i class="fas fa-question-circle mr-2 text-indigo-600"></i>${num}. ${escapeHtml(q.question_text)}
                  </h2>
                  
                  <div class="space-y-4">
                    ${memberAnswers.length > 0 ? `
                      <!-- All Answers Grouped by Username -->
                      <div class="space-y-3">
                        ${(() => {
                          // Group ALL answers by username (including current user)
                          const groupedByUser = {};
                          memberAnswers.forEach(answer => {
                            const username = answer.username || 'Unknown';
                            if (!groupedByUser[username]) {
                              groupedByUser[username] = [];
                            }
                            groupedByUser[username].push(answer);
                          });
                          
                          // Sort groups by username alphabetically
                          const sortedUsers = Object.keys(groupedByUser).sort((a, b) => {
                            return a.localeCompare(b, 'zh-CN'); // Alphabetical order with Chinese support
                          });
                          
                          // Generate HTML for each user group
                          return sortedUsers.map(username => {
                            const userAnswers = groupedByUser[username];
                            const groupId = 'user-group-' + num + '-' + username.replace(/[^a-zA-Z0-9]/g, '');
                            const answerCount = userAnswers.length;
                            const isCurrentUser = userAnswers.some(a => a.user_id === currentUserId);
                            // Check if this user is a former team member
                            const isFormerMember = userAnswers.some(a => a.is_current_team_member === false);
                            
                            // Sort user's answers by created_at (newest first)
                            userAnswers.sort((a, b) => {
                              const dateA = new Date(a.created_at || a.updated_at).getTime();
                              const dateB = new Date(b.created_at || b.updated_at).getTime();
                              return dateB - dateA; // Descending order (newest first)
                            });
                            
                            // Determine if should be collapsed by default (if more than 1 answer)
                            const shouldCollapse = answerCount > 1;
                            const initialClass = shouldCollapse ? 'hidden' : '';
                            const initialIcon = shouldCollapse ? 'fa-chevron-down' : 'fa-chevron-up';
                            const initialText = shouldCollapse ? (i18n.t('expand') || '展开') : (i18n.t('collapse') || '收起');
                            
                            // Build user badge
                            const userBadge = isCurrentUser ? ' <span class="text-indigo-600">(' + (i18n.t("myAnswer") || "我") + ')</span>' : '';
                            const formerMemberBadge = isFormerMember ? ' <span class="ml-2 px-2 py-0.5 text-xs bg-yellow-400 text-yellow-900 rounded-full"><i class="fas fa-exclamation-triangle mr-1"></i>' + (i18n.t('formerTeamMember') || '此队员已离开团队') + '</span>' : '';
                            
                            // Build collapse button HTML
                            const collapseButton = answerCount > 1 ? 
                              '<button onclick="toggleUserGroup(\'' + groupId + '\')" class="px-3 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100 transition-colors" id="toggle-btn-' + groupId + '">' +
                                '<i class="fas ' + initialIcon + ' mr-1"></i>' +
                                '<span id="toggle-text-' + groupId + '">' + initialText + '</span>' +
                              '</button>' : '';
                            
                            // Build answers HTML with red styling for former members
                            const answersHtml = userAnswers.map((answer, idx) => {
                              const isOwner = answer.user_id === currentUserId;
                              const latestBadge = (idx === 0 && answerCount > 1) ? 
                                '<span class="ml-2 text-xs font-semibold ' + (isFormerMember ? 'text-red-600' : 'text-blue-600') + '"><i class="fas fa-star mr-1"></i>' + (i18n.t('latest') || '最新') + '</span>' : '';
                              const deleteButton = isOwner && !isFormerMember ? 
                                '<button onclick="handleDeleteMyAnswer(' + id + ', ' + num + ', ' + answer.id + ')" class="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded ml-2" title="' + i18n.t('deleteAnswer') + '">' +
                                  '<i class="fas fa-trash"></i>' +
                                '</button>' : '';
                              
                              const borderColor = isFormerMember ? 'border-red-500' : (isOwner ? 'border-indigo-500' : 'border-blue-400');
                              const bgColor = isFormerMember ? 'bg-red-100' : (isOwner ? 'bg-indigo-50' : 'bg-blue-50');
                              const textColor = isFormerMember ? 'text-red-900' : 'text-gray-800';
                              const timeColor = isFormerMember ? 'text-red-600' : (isOwner ? 'text-gray-500' : 'text-blue-600');
                              
                              return '<div class="border-l-4 ' + borderColor + ' ' + bgColor + ' pl-4 p-3 rounded-r">' +
                                '<div class="flex justify-between items-start mb-2">' +
                                  '<div class="flex-1">' +
                                    '<span class="text-xs ' + timeColor + '">' +
                                      '<i class="fas fa-clock mr-1"></i>' + new Date(answer.created_at || answer.updated_at).toLocaleString() +
                                    '</span>' +
                                    latestBadge +
                                  '</div>' +
                                  deleteButton +
                                '</div>' +
                                '<p class="' + textColor + ' whitespace-pre-wrap">' + escapeHtml(answer.answer) + '</p>' +
                              '</div>';
                            }).join('');
                            
                            const containerBg = isFormerMember ? 'bg-red-50 border-red-300' : (isCurrentUser ? 'bg-indigo-50 border-indigo-300' : 'bg-blue-50 border-blue-300');
                            const headerBg = isFormerMember ? 'bg-red-100 border-b border-red-200' : (isCurrentUser ? 'bg-indigo-100 border-b border-indigo-200' : 'bg-blue-100 border-b border-blue-200');
                            const iconColor = isFormerMember ? 'text-red-600' : (isCurrentUser ? 'text-indigo-600' : 'text-blue-600');
                            
                            return '<div class="border rounded-lg overflow-hidden ' + containerBg + '">' +
                              '<!-- Group Header with Collapse/Expand Button -->' +
                              '<div class="flex justify-between items-center p-3 ' + headerBg + '">' +
                                '<div class="flex items-center flex-wrap">' +
                                  '<i class="fas fa-user-circle text-xl ' + iconColor + ' mr-2"></i>' +
                                  '<div>' +
                                    '<span class="text-sm font-semibold ' + (isFormerMember ? 'text-red-800' : 'text-gray-800') + '">' +
                                      escapeHtml(username) + userBadge + formerMemberBadge +
                                    '</span>' +
                                    '<span class="text-xs ' + (isFormerMember ? 'text-red-600' : 'text-gray-500') + ' ml-2">' +
                                      '(' + answerCount + ' ' + (answerCount === 1 ? i18n.t('answer') || '个答案' : i18n.t('answers') || '个答案') + ')' +
                                    '</span>' +
                                  '</div>' +
                                '</div>' +
                                collapseButton +
                              '</div>' +
                              '<!-- User\'s Answers (Collapsible if more than 1) -->' +
                              '<div id="' + groupId + '" class="space-y-3 p-3 ' + initialClass + '">' +
                                answersHtml +
                              '</div>' +
                            '</div>';
                          }).join('');
                        })()}
                      </div>
                    ` : `
                      <div class="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p class="text-sm">${i18n.t('noAnswers') || '暂无答案'}</p>
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('') : '<p class="text-gray-500 text-center py-8">' + (i18n.t('noQuestions') || '暂无问题') + '</p>'}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showReviewDetail(id);
  }
}

// Toggle user group collapse/expand
function toggleUserGroup(groupId) {
  const groupDiv = document.getElementById(groupId);
  const toggleBtn = document.getElementById('toggle-btn-' + groupId);
  const toggleText = document.getElementById('toggle-text-' + groupId);
  const icon = toggleBtn.querySelector('i');
  
  if (!groupDiv || !toggleText || !icon) return;
  
  if (groupDiv.classList.contains('hidden')) {
    // Expand
    groupDiv.classList.remove('hidden');
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
    toggleText.textContent = i18n.t('collapse') || '收起';
  } else {
    // Collapse
    groupDiv.classList.add('hidden');
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
    toggleText.textContent = i18n.t('expand') || '展开';
  }
}

// Save team answer
async function handleSaveTeamAnswer(reviewId, questionNumber) {
  try {
    const answer = document.getElementById(`my-answer-${questionNumber}`).value;
    
    if (!answer || answer.trim() === '') {
      showNotification(i18n.t('operationFailed') + ': ' + i18n.t('answerCannotBeEmpty'), 'error');
      return;
    }
    
    await axios.put(`/api/reviews/${reviewId}/my-answer/${questionNumber}`, { answer });
    
    // Show save status
    const statusEl = document.getElementById(`save-status-${questionNumber}`);
    if (statusEl) {
      statusEl.innerHTML = '<i class="fas fa-check text-green-600 mr-1"></i>' + i18n.t('autoSaved');
    }
    
    showNotification(i18n.t('answerSaved'), 'success');
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Delete my own answer (each user can only delete their own answers)
async function handleDeleteMyAnswer(reviewId, questionNumber, answerId) {
  if (!confirm(i18n.t('confirmDeleteAnswer'))) {
    return;
  }
  
  try {
    // If answerId is provided, delete specific answer; otherwise delete all answers for this question
    if (answerId) {
      await axios.delete(`/api/reviews/${reviewId}/answer/${answerId}`);
    } else {
      await axios.delete(`/api/reviews/${reviewId}/my-answer/${questionNumber}`);
    }
    showNotification(i18n.t('answerDeleted'), 'success');
    
    // Reload the page to show updated data
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showEditReview(id) {
  try {
    // Check if user is logged in
    if (!currentUser) {
      showNotification('请先登录', 'error');
      showLogin();
      return;
    }
    
    console.log('[showEditReview] 开始加载复盘 ID:', id);
    const response = await axios.get(`/api/reviews/${id}`);
    console.log('[showEditReview] 服务器响应:', response.data);
    
    const review = response.data.review;
    const questions = response.data.questions || [];
    const answersByQuestion = response.data.answersByQuestion || {};
    
    // Store review globally for use in other functions
    window.currentEditReview = review;
    
    console.log('[showEditReview] 复盘信息:', review);
    console.log('[showEditReview] 问题数量:', questions.length);
    console.log('[showEditReview] 答案数据:', answersByQuestion);
    
    // Extract current user's answers for editing
    const myAnswers = {};
    Object.keys(answersByQuestion).forEach(qNum => {
      const userAnswers = answersByQuestion[qNum] || [];
      // For choice-type questions, take the first answer
      // For text-type questions, there can be multiple answers (handled separately)
      const myAnswer = userAnswers.find(a => a.user_id === currentUser.id);
      if (myAnswer && myAnswer.answer) {
        myAnswers[qNum] = myAnswer.answer;
      }
    });
    
    console.log('[showEditReview] 我的答案:', myAnswers);
    console.log('[showEditReview] 所有答案:', answersByQuestion);
    
    // Check if current user is the creator
    const isCreator = currentUser.id === review.user_id;
    
    // Load teams if premium user
    let teams = [];
    if (currentUser.role === 'premium' || currentUser.role === 'admin') {
      try {
        const teamsResponse = await axios.get('/api/teams');
        teams = teamsResponse.data.teams || teamsResponse.data.myTeams || [];
      } catch (error) {
        console.error('Load teams error:', error);
        teams = [];
      }
    }
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="mb-6">
            <button onclick="handleEditReviewCancel(${id})" class="text-indigo-600 hover:text-indigo-800 mb-4">
              <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back') || '返回'}
            </button>
            <div class="flex justify-between items-center">
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-edit mr-2"></i>${i18n.t('edit')} ${i18n.t('review') || '复盘'}
              </h1>
              <button onclick="handleSaveAndExitReview(${id})" 
                      class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg transition-all duration-200 flex items-center space-x-2">
                <i class="fas fa-save"></i>
                <span>${i18n.t('saveAndExit') || '保存并退出'}</span>
              </button>
            </div>
          </div>

          <form id="edit-review-form" class="bg-white rounded-lg shadow-md p-6 space-y-4">
            <input type="hidden" id="review-id" value="${id}">
            
            ${!isCreator ? `
            <div class="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
              <p class="text-sm text-gray-700">
                <i class="fas fa-info-circle mr-2"></i>${i18n.t('onlyCreatorCanEditProperties') || '只有创建者可以修改复盘属性，团队成员只能编辑答案内容'}
              </p>
            </div>
            ` : ''}
            
            <!-- ========== Section 1: Review Header (Collapsible) ========== -->
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <button type="button" onclick="toggleSection('header-section')" 
                      class="w-full flex justify-between items-center p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <h3 class="text-lg font-semibold text-indigo-900">
                  <i class="fas fa-heading mr-2"></i>${i18n.t('reviewHeader') || '复盘表头'}
                </h3>
                <i class="fas fa-chevron-down text-indigo-600"></i>
              </button>
              <div id="header-section" class="hidden">
                <div class="p-6 space-y-4 bg-white">
            
            <!-- Basic Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('reviewTitle')} <span class="text-red-500">*</span>
              </label>
              <input type="text" id="review-title" required value="${escapeHtml(review.title)}"
                     ${!isCreator ? 'disabled' : ''}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}">
              ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('reviewDescription')}
              </label>
              <textarea id="review-description" rows="3"
                        ${!isCreator ? 'disabled' : ''}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}"
                        placeholder="${i18n.t('reviewDescriptionPlaceholder')}">${escapeHtml(review.description || '')}</textarea>
              ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
            </div>

            <!-- Template Info (Read-only) -->
            ${review.template_name ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('template')}
              </label>
              <div class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <div class="flex items-center">
                  <i class="fas fa-file-alt text-indigo-600 mr-2"></i>
                  <span class="text-gray-800 font-medium">${escapeHtml(review.template_name)}</span>
                </div>
                ${review.template_description ? `
                  <p class="text-xs text-gray-600 mt-1 ml-6">${escapeHtml(review.template_description)}</p>
                ` : ''}
              </div>
              <p class="mt-1 text-xs text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>${i18n.t('templateCannotChange')}
              </p>
            </div>
            ` : ''}

            <!-- Time Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('timeType')} <span class="text-red-500">*</span>
              </label>
              <select id="review-time-type" required
                      ${!isCreator ? 'disabled' : ''}
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}">
                <option value="daily" ${review.time_type === 'daily' ? 'selected' : ''}>${i18n.t('timeTypeDaily')}</option>
                <option value="weekly" ${review.time_type === 'weekly' ? 'selected' : ''}>${i18n.t('timeTypeWeekly')}</option>
                <option value="monthly" ${review.time_type === 'monthly' ? 'selected' : ''}>${i18n.t('timeTypeMonthly')}</option>
                <option value="quarterly" ${review.time_type === 'quarterly' ? 'selected' : ''}>${i18n.t('timeTypeQuarterly')}</option>
                <option value="yearly" ${review.time_type === 'yearly' ? 'selected' : ''}>${i18n.t('timeTypeYearly')}</option>
                <option value="free" ${review.time_type === 'free' ? 'selected' : ''}>${i18n.t('timeTypeFree')}</option>
              </select>
              ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
            </div>

            <!-- Owner Type (Access Control) -->
            <div class="border-t pt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('ownerType')} <span class="text-red-500">*</span>
              </label>
              <select id="review-owner-type" required
                      ${!isCreator ? 'disabled' : ''}
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}">
                <option value="private" ${(review.owner_type === 'private' || !review.owner_type) ? 'selected' : ''}>${i18n.t('ownerTypePrivate')}</option>
                <option value="team" ${review.owner_type === 'team' ? 'selected' : ''}>${i18n.t('ownerTypeTeam')}</option>
                <option value="public" ${review.owner_type === 'public' ? 'selected' : ''}>${i18n.t('ownerTypePublic')}</option>
              </select>
              ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
              ${isCreator ? `
              <div class="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <p class="text-xs text-gray-700 space-y-1">
                  <span class="block"><strong>${i18n.t('ownerTypePrivate')}:</strong> ${i18n.t('ownerTypePrivateDesc')}</span>
                  <span class="block"><strong>${i18n.t('ownerTypeTeam')}:</strong> ${i18n.t('ownerTypeTeamDesc')}</span>
                  <span class="block"><strong>${i18n.t('ownerTypePublic')}:</strong> ${i18n.t('ownerTypePublicDesc')}</span>
                </p>
              </div>
              ` : ''}
            </div>

            <!-- Team Selection (shown when owner type is 'team') -->
            ${(currentUser.role === 'premium' || currentUser.role === 'admin') && review.owner_type === 'team' && teams && teams.length > 0 ? `
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

            <!-- Allow Multiple Answers (Editable by Creator) -->
            <div class="border-t pt-4 mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-list-check mr-1"></i>${i18n.t('allowMultipleAnswers') || '是否允许多个复盘答案'} ${isCreator ? '<span class="text-red-500">*</span>' : ''}
              </label>
              <div class="flex space-x-4">
                <label class="flex items-center ${!isCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}">
                  <input type="radio" name="allow_multiple_answers" value="yes" 
                         ${review.allow_multiple_answers === 'yes' ? 'checked' : ''}
                         ${!isCreator ? 'disabled' : ''}
                         class="mr-2 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">
                    <i class="fas fa-check-circle text-green-600 mr-1"></i>${i18n.t('yes') || '是'}
                    <span class="text-xs text-gray-500 ml-1">(${i18n.t('canCreateMultipleSets') || '可创建多个答案组'})</span>
                  </span>
                </label>
                <label class="flex items-center ${!isCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}">
                  <input type="radio" name="allow_multiple_answers" value="no" 
                         ${review.allow_multiple_answers === 'no' || !review.allow_multiple_answers ? 'checked' : ''}
                         ${!isCreator ? 'disabled' : ''}
                         class="mr-2 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">
                    <i class="fas fa-times-circle text-red-600 mr-1"></i>${i18n.t('no') || '否'}
                    <span class="text-xs text-gray-500 ml-1">(${i18n.t('singleSetOnly') || '仅一个答案组'})</span>
                  </span>
                </label>
              </div>
              <p class="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                <span class="text-xs text-gray-700">
                  ${i18n.t('allowMultipleAnswersChangeHint') || '修改此设置后，请点击"保存并退出"按钮保存更改。保存后页面将刷新以更新答案组管理功能。'}
                </span>
              </p>
              ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
            </div>

            <!-- Status -->
            <div class="border-t pt-4 mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('status')}
              </label>
              <div class="flex space-x-4">
                <label class="flex items-center ${!isCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}">
                  <input type="radio" name="status" value="draft" ${review.status === 'draft' ? 'checked' : ''}
                         ${!isCreator ? 'disabled' : ''}
                         class="mr-2 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">
                    <i class="fas fa-clock text-yellow-600 mr-1"></i>${i18n.t('draft')}
                  </span>
                </label>
                <label class="flex items-center ${!isCreator ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}">
                  <input type="radio" name="status" value="completed" ${review.status === 'completed' ? 'checked' : ''}
                         ${!isCreator ? 'disabled' : ''}
                         class="mr-2 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">
                    <i class="fas fa-check-circle text-green-600 mr-1"></i>${i18n.t('completed')}
                  </span>
                </label>
              </div>
              ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
            </div>
            
                </div>
              </div>
            </div>
            <!-- End of Section 1: Header -->

            <!-- ========== Section 2: Answer Sets & Questions (Collapsible) ========== -->
            <div class="border border-gray-200 rounded-lg overflow-hidden" id="answer-sets-section">
              <button type="button" onclick="toggleSection('answers-section')" 
                      class="w-full flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 transition-colors">
                <h3 class="text-lg font-semibold text-green-900">
                  <i class="fas fa-layer-group mr-2"></i>${i18n.t('answerSetsManagement') || '答案组管理'}
                </h3>
                <i class="fas fa-chevron-down text-green-600"></i>
              </button>
              <div id="answers-section" class="hidden">
                <div class="p-6 space-y-4 bg-white">

            <!-- Answer Sets Management (Phase 1) -->
            <div class="border-t pt-6 mb-6" id="answer-sets-management">
              <div class="mb-4">
                <h3 class="text-lg font-medium text-gray-800 mb-2">
                  <i class="fas fa-layer-group mr-2"></i>${i18n.t('answerSetsManagement') || '答案组管理'}
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                  ${review.allow_multiple_answers === 'yes' 
                    ? (i18n.t('answerSetsDesc') || '您可以为所有问题创建多组答案，使用箭头在不同答案组之间导航')
                    : (i18n.t('singleSetDesc') || '当前复盘只允许一个答案组')}
                </p>
              </div>
              
              <!-- Answer Set Navigation -->
              <div id="answer-set-navigation" class="mb-4"></div>
              
              <!-- Action Buttons Row: Create New Answer Set + Delete + Lock/Unlock Current Set -->
              <!-- All users can see buttons, but availability depends on ownership and lock status -->
              <div class="flex gap-3 mb-4">
                ${review.allow_multiple_answers === 'yes' ? `
                  <!-- Create New Answer Set Button (all users can create their own answer set) -->
                  <button type="button" 
                          onclick="createNewAnswerSet(${id})"
                          class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg transition-colors">
                    <i class="fas fa-plus-circle mr-2"></i>${i18n.t('createNewSet')}
                  </button>
                ` : ''}
                
                <!-- Delete Current Answer Set Button (only owner of the set can delete, must be unlocked) -->
                <button type="button" 
                        id="delete-answer-set-btn"
                        onclick="deleteCurrentAnswerSet(${id})"
                        class="${review.allow_multiple_answers === 'yes' ? '' : 'flex-1'} px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-colors disabled:opacity-50"
                        disabled>
                  <i class="fas fa-trash-alt mr-2"></i>${i18n.t('delete') || '删除'}
                </button>
                
                <!-- Lock/Unlock Current Answer Set Button (only owner of the set can lock/unlock) -->
                <button type="button" 
                        id="toggle-answer-set-lock-btn"
                        onclick="toggleCurrentAnswerSetLock(${id})"
                        class="${review.allow_multiple_answers === 'yes' ? '' : 'flex-1'} px-6 py-3 bg-gray-400 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50"
                        disabled>
                  <i id="answer-set-lock-icon" class="fas fa-lock mr-2"></i>
                  <span id="answer-set-lock-text">${i18n.t('lock') || '锁定'}</span>
                </button>
              </div>
              <p class="text-xs text-gray-500 mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                ${i18n.t('answerSetHint') || '所有团队成员可查看所有答案组。只有答案组创建者可以编辑/删除/锁定自己的答案组。锁定后不可编辑。'}
              </p>
            </div>

            <!-- Dynamic Questions -->
            <div class="border-t pt-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-question-circle mr-2"></i>${review.template_name ? escapeHtml(review.template_name) : i18n.t('nineQuestions')}
              </h2>
              
              ${questions.length > 0 ? questions.map(q => {
                // Render based on question type
                if (q.question_type === 'single_choice' && q.options) {
                  let options = [];
                  try {
                    options = JSON.parse(q.options);
                  } catch (e) {
                    console.error('[showEditReview] 解析选项失败:', e, q.options);
                    options = [];
                  }
                  const myAnswer = myAnswers[q.question_number] || '';
                  return `
                    <div class="mb-6">
                      <label class="block text-sm font-medium text-gray-700 mb-3">
                        ${q.question_number}. ${escapeHtml(q.question_text)}
                        ${q.question_text_en ? `<span class="text-xs text-gray-500 block mt-1">${escapeHtml(q.question_text_en)}</span>` : ''}
                      </label>
                      <!-- Answer display container for answer sets -->
                      <div id="answer-display-${q.question_number}">
                        <div class="space-y-2">
                          ${options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return `
                              <label class="flex items-start p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="question${q.question_number}" value="${letter}" 
                                       ${myAnswer === letter ? 'checked' : ''}
                                       class="mt-1 mr-3 flex-shrink-0">
                                <span class="text-sm text-gray-900">${escapeHtml(opt)}</span>
                              </label>
                            `;
                          }).join('')}
                        </div>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>${i18n.t('onlyEditOwnAnswers') || '您只能编辑自己的答案'}
                      </p>
                    </div>
                  `;
                } else if (q.question_type === 'multiple_choice' && q.options) {
                  let options = [];
                  try {
                    options = JSON.parse(q.options);
                  } catch (e) {
                    console.error('[showEditReview] 解析选项失败:', e, q.options);
                    options = [];
                  }
                  const myAnswer = myAnswers[q.question_number] || '';
                  const selectedLetters = myAnswer ? myAnswer.split(',').map(a => a.trim()) : [];
                  return `
                    <div class="mb-6">
                      <label class="block text-sm font-medium text-gray-700 mb-3">
                        ${q.question_number}. ${escapeHtml(q.question_text)}
                        ${q.question_text_en ? `<span class="text-xs text-gray-500 block mt-1">${escapeHtml(q.question_text_en)}</span>` : ''}
                        <span class="text-xs text-indigo-600 block mt-1">${i18n.t('multipleChoiceHint')}</span>
                      </label>
                      <!-- Answer display container for answer sets -->
                      <div id="answer-display-${q.question_number}">
                        <div class="space-y-2">
                          ${options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return `
                              <label class="flex items-start p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" name="question${q.question_number}" value="${letter}" 
                                       ${selectedLetters.includes(letter) ? 'checked' : ''}
                                       class="mt-1 mr-3 flex-shrink-0">
                                <span class="text-sm text-gray-900">${escapeHtml(opt)}</span>
                              </label>
                            `;
                          }).join('')}
                        </div>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>${i18n.t('onlyEditOwnAnswers') || '您只能编辑自己的答案'}
                      </p>
                    </div>
                  `;
                } else if (q.question_type === 'time_with_text') {
                  // Time with text type - with auto-save time input
                  const allAnswers = answersByQuestion[q.question_number] || [];
                  // V6.7.0: Filter answers based on privacy settings
                  const currentUserId = currentUser ? currentUser.id : null;
                  const userAnswers = filterAnswersByPrivacy(q, allAnswers, currentUserId, review.user_id);
                  const myAnswersList = currentUserId ? userAnswers.filter(a => a.user_id === currentUserId) : [];
                  
                  // Get datetime value from first answer if exists
                  const existingDatetime = myAnswersList.length > 0 && myAnswersList[0].datetime_value 
                    ? myAnswersList[0].datetime_value.slice(0, 16) 
                    : (q.datetime_value ? q.datetime_value.slice(0, 16) : '');
                  
                  return `
                    <div class="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <!-- 1. 标题显示 -->
                      <div class="mb-3">
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          ${q.question_number}. ${i18n.t('title') || '标题'}
                        </label>
                        <div class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800">
                          ${q.question_text_en ? escapeHtml(q.question_text_en) : escapeHtml(q.question_text)}
                        </div>
                      </div>
                      
                      <!-- 2. 时间输入框 (可编辑，自动保存) -->
                      <div class="mb-3">
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          <i class="fas fa-clock mr-1"></i>${i18n.t('time') || '时间'}
                        </label>
                        <input type="datetime-local" 
                               id="time-input-${q.question_number}"
                               value="${existingDatetime}"
                               onchange="autoSaveTimeValue(${id}, ${q.question_number})"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      </div>
                      
                      <!-- 3. Google日历按钮 -->
                      <div class="mb-3">
                        <button type="button" 
                                onclick="addTimeQuestionToCalendar(${id}, ${q.question_number})"
                                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                          <i class="fas fa-calendar-plus mr-2"></i>${i18n.t('addToGoogleCalendar') || '加入Google日历'}
                        </button>
                      </div>
                      
                      <!-- 4. 答案编辑区 (Answer Sets) - 不显示"答案"标签 -->
                      <div>
                        <div id="answer-display-${q.question_number}">
                          <div class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-info-circle mr-1"></i>${i18n.t('noAnswerSetsYet') || '还没有答案组，点击下方"创建新答案组"按钮开始'}
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                } else {
                  // Default text type - show only question (no question_text label)
                  const allAnswers = answersByQuestion[q.question_number] || [];
                  // V6.7.0: Filter answers based on privacy settings
                  const currentUserId = currentUser ? currentUser.id : null;
                  const userAnswers = filterAnswersByPrivacy(q, allAnswers, currentUserId, review.user_id);
                  const myAnswersList = currentUserId ? userAnswers.filter(a => a.user_id === currentUserId) : [];
                  
                  return `
                    <div class="mb-6">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${q.question_number}. ${i18n.t('question')}: ${q.question_text_en ? escapeHtml(q.question_text_en) : escapeHtml(q.question_text)}
                      </label>
                      
                      <!-- Answer Set Display Area (Phase 1) -->
                      <div id="answer-display-${q.question_number}" class="mt-3">
                        <div class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg">
                          <i class="fas fa-info-circle mr-1"></i>${i18n.t('noAnswerSetsYet') || '还没有答案组，点击下方"创建新答案组"按钮开始'}
                        </div>
                      </div>
                    </div>
                  `;
                }
              }).join('') : '<p class="text-gray-500 text-center py-4">' + (i18n.t('noQuestions') || '暂无问题') + '</p>'}
            </div>
            
                </div>
              </div>
            </div>
            <!-- End of Section 2: Answers -->

            <!-- ========== Section 3: Google Calendar Integration (Collapsible) ========== -->
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <button type="button" onclick="toggleSection('calendar-section')" 
                      class="w-full flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                <h3 class="text-lg font-semibold text-blue-900">
                  <i class="fas fa-calendar-plus mr-2"></i>${i18n.t('scheduleReview')} (${i18n.t('optional')})
                </h3>
                <i class="fas fa-chevron-down text-blue-600"></i>
              </button>
              <div id="calendar-section" class="hidden">
                <div class="p-6 space-y-4 bg-white">

              <div class="space-y-4">
                <!-- Scheduled Time -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-clock mr-1"></i>${i18n.t('scheduledTime')}
                  </label>
                  <input type="datetime-local" id="edit-scheduled-at"
                         value="${review.scheduled_at ? review.scheduled_at.slice(0, 16) : ''}"
                         ${!isCreator ? 'disabled' : ''}
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}">
                  ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
                </div>

                <!-- Location -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-map-marker-alt mr-1"></i>${i18n.t('location')}
                  </label>
                  <input type="text" id="edit-location"
                         value="${escapeHtml(review.location || '')}"
                         ${!isCreator ? 'disabled' : ''}
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}"
                         placeholder="${i18n.t('enterLocation')}">
                  ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
                </div>

                <!-- Reminder -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-bell mr-1"></i>${i18n.t('reminderMinutes')}
                  </label>
                  <select id="edit-reminder-minutes"
                          ${!isCreator ? 'disabled' : ''}
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ${!isCreator ? 'bg-gray-100 cursor-not-allowed' : ''}">
                    <option value="15" ${review.reminder_minutes == 15 ? 'selected' : ''}>15 ${i18n.t('minutes')}</option>
                    <option value="30" ${review.reminder_minutes == 30 ? 'selected' : ''}>30 ${i18n.t('minutes')}</option>
                    <option value="60" ${review.reminder_minutes == 60 || !review.reminder_minutes ? 'selected' : ''}>60 ${i18n.t('minutes')}</option>
                    <option value="120" ${review.reminder_minutes == 120 ? 'selected' : ''}>120 ${i18n.t('minutes')}</option>
                    <option value="1440" ${review.reminder_minutes == 1440 ? 'selected' : ''}>1 ${i18n.t('day')}</option>
                  </select>
                  ${!isCreator ? `<p class="mt-1 text-xs text-gray-500"><i class="fas fa-lock mr-1"></i>${i18n.t('onlyCreatorCanEdit') || '仅创建者可编辑'}</p>` : ''}
                </div>
                
                <!-- Add to Google Calendar Button (Inside calendar fields - Always visible) -->
                <div class="pt-4 border-t">
                  <button type="button" onclick="addToGoogleCalendar(${id})" 
                          class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                    <i class="fas fa-calendar-plus mr-2"></i>${i18n.t('addToGoogleCalendar')}
                  </button>
                </div>
              </div>
            </div>
            
                </div>
              </div>
            </div>
            <!-- End of Section 3: Calendar -->



          </form>
        </div>
      </div>
    `;

    document.getElementById('edit-review-form').addEventListener('submit', handleEditReview);
    
    // Store questions and creator status in global variable for access
    window.currentEditQuestions = questions;
    window.currentEditIsCreator = isCreator;
    
    // ========== FIX: Auto-save header fields on change ==========
    if (isCreator) {
      const autoSaveHeaderFields = async () => {
        try {
          const title = document.getElementById('review-title')?.value;
          const description = document.getElementById('review-description')?.value;
          const timeType = document.getElementById('review-time-type')?.value;
          const ownerType = document.getElementById('review-owner-type')?.value;
          const status = document.querySelector('input[name="status"]:checked')?.value;
          const scheduledAt = document.getElementById('edit-scheduled-at')?.value || null;
          const location = document.getElementById('edit-location')?.value || null;
          const reminderMinutes = parseInt(document.getElementById('edit-reminder-minutes')?.value) || 60;
          
          const data = {
            title,
            description: description || null,
            time_type: timeType,
            owner_type: ownerType,
            status,
            scheduled_at: scheduledAt,
            location: location,
            reminder_minutes: reminderMinutes
          };
          
          await axios.put(`/api/reviews/${id}`, data);
          
          // Show subtle save indicator
          const savedTime = new Date().toLocaleTimeString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          console.log('[Auto-save] Review header updated at', savedTime);
        } catch (error) {
          console.error('[Auto-save] Failed to save header:', error);
        }
      };
      
      // Add change event listeners with debouncing
      let saveTimeout;
      const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(autoSaveHeaderFields, 1000); // Save after 1 second of no changes
      };
      
      document.getElementById('review-title')?.addEventListener('input', debouncedSave);
      document.getElementById('review-description')?.addEventListener('input', debouncedSave);
      document.getElementById('review-time-type')?.addEventListener('change', debouncedSave);
      document.getElementById('review-owner-type')?.addEventListener('change', (e) => {
        handleOwnerTypeChangeInEdit(id, teams);
        debouncedSave();
      });
      document.querySelectorAll('input[name="status"]').forEach(radio => {
        radio.addEventListener('change', debouncedSave);
      });
      document.getElementById('edit-scheduled-at')?.addEventListener('change', debouncedSave);
      document.getElementById('edit-location')?.addEventListener('input', debouncedSave);
      document.getElementById('edit-reminder-minutes')?.addEventListener('change', debouncedSave);
      
      // Note: allow_multiple_answers has its own handler (handleAllowMultipleAnswersChange)
      // that saves and refreshes the page, so no need for auto-save here
    }
    
    // ========== FIX: Initialize team selection visibility based on current owner_type ==========
    handleOwnerTypeChangeInEdit(id, teams);
    
    // Load and render answer sets (Phase 1)
    console.log('[showEditReview] About to load answer sets. Current user:', {
      id: window.currentUser?.id,
      role: window.currentUser?.role,
      username: window.currentUser?.username
    });
    loadAnswerSets(id).then(() => {
      console.log('[showEditReview] Answer sets loaded:', window.currentAnswerSets.length);
      if (window.currentAnswerSets.length > 0) {
        renderAnswerSet(id);
      } else {
        updateAnswerSetNavigation(id, 0, 0);
      }
    }).catch(err => {
      console.error('[showEditReview] 加载答案集失败:', err);
    });
  } catch (error) {
    console.error('[showEditReview] 加载失败:', error);
    console.error('[showEditReview] 错误详情:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    const errorMsg = error.response?.data?.error || error.message || '未知错误';
    showNotification(
      i18n.t('operationFailed') + ': ' + errorMsg + ' (查看控制台获取详情)',
      'error'
    );
    showReviews();
  }
}

// Helper function to show new answer input
function showNewAnswerInput(questionNumber) {
  const section = document.getElementById(`new-answer-section-${questionNumber}`);
  const btn = document.getElementById(`add-answer-btn-${questionNumber}`);
  
  if (section && btn) {
    section.classList.remove('hidden');
    btn.classList.add('hidden');
    
    // Focus on textarea
    const textarea = document.getElementById(`new-answer-${questionNumber}`);
    if (textarea) {
      textarea.focus();
    }
  }
}

// Helper function to cancel new answer input
function cancelNewAnswer(questionNumber) {
  const section = document.getElementById(`new-answer-section-${questionNumber}`);
  const btn = document.getElementById(`add-answer-btn-${questionNumber}`);
  const textarea = document.getElementById(`new-answer-${questionNumber}`);
  
  if (section && btn && textarea) {
    section.classList.add('hidden');
    btn.classList.remove('hidden');
    textarea.value = ''; // Clear textarea
  }
}

// Helper function to add new answer
// Auto-save new answer on blur (when user clicks away)
async function autoSaveNewAnswer(reviewId, questionNumber) {
  const textarea = document.getElementById(`new-answer-${questionNumber}`);
  const answer = textarea ? textarea.value.trim() : '';
  
  // If empty, just hide the input section
  if (!answer) {
    cancelNewAnswer(questionNumber);
    return;
  }
  
  // Save the answer automatically
  try {
    console.log('自动保存新答案:', questionNumber, answer);
    
    // Call API to create new answer
    const response = await axios.post(`/api/reviews/${reviewId}/my-answer/${questionNumber}`, {
      answer: answer
    });
    
    const newAnswer = response.data.answer;
    
    // Add new answer to the UI
    const container = document.getElementById(`answers-container-${questionNumber}`);
    if (container) {
      // Remove "no answers" message if exists
      const noAnswersMsg = container.querySelector('.text-gray-400');
      if (noAnswersMsg) {
        noAnswersMsg.remove();
      }
      
      // Add new answer element
      const answerHtml = `
        <div class="answer-item relative border border-gray-300 rounded-lg p-3 bg-white" data-answer-id="${newAnswer.id}">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-gray-500">
              <i class="fas fa-clock mr-1"></i>${i18n.t('answerCreatedAt')}: ${formatDate(newAnswer.created_at)}
            </span>
            <button type="button" 
                    onclick="deleteExistingAnswer(${reviewId}, ${newAnswer.id}, ${questionNumber})"
                    class="text-red-600 hover:text-red-800 text-sm">
              <i class="fas fa-trash-alt mr-1"></i>${i18n.t('delete')}
            </button>
          </div>
          <div class="text-sm text-gray-800 whitespace-pre-wrap">${escapeHtml(answer)}</div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', answerHtml);
    }
    
    // Reset form
    cancelNewAnswer(questionNumber);
    
    showNotification(i18n.t('answerAutoSaved') || '答案已自动保存', 'success');
  } catch (error) {
    console.error('自动保存答案失败:', error);
    showNotification(i18n.t('autoSaveFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function addNewAnswer(reviewId, questionNumber) {
  try {
    const textarea = document.getElementById(`new-answer-${questionNumber}`);
    const answer = textarea ? textarea.value.trim() : '';
    
    if (!answer) {
      // If answer is empty, close input and show "no answers" message
      console.log(`[addNewAnswer] Q${questionNumber}: Answer is empty, closing input and showing empty state`);
      
      // Close the input section
      cancelNewAnswer(questionNumber);
      
      // Check if there are any existing answers
      const container = document.getElementById(`answers-container-${questionNumber}`);
      if (container) {
        const existingAnswers = container.querySelectorAll('.border-l-4');
        
        // If no existing answers, show "no answers yet" message
        if (existingAnswers.length === 0) {
          container.innerHTML = `
            <div class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg">
              <i class="fas fa-info-circle mr-1"></i>${i18n.t('noAnswersYet') || '此组暂无答案 (点击添加)'}
            </div>
          `;
        }
      }
      
      return;
    }
    
    // Call API to create new answer (changed from PUT to POST)
    const response = await axios.post(`/api/reviews/${reviewId}/my-answer/${questionNumber}`, {
      answer: answer
    });
    
    const newAnswer = response.data.answer;
    
    // Add new answer to the UI
    const container = document.getElementById(`answers-container-${questionNumber}`);
    if (container) {
      // Remove "no answers" message if exists
      const noAnswersMsg = container.querySelector('.text-gray-400');
      if (noAnswersMsg) {
        noAnswersMsg.remove();
      }
      
      // Add new answer element
      const answerHtml = `
        <div class="answer-item relative border border-gray-300 rounded-lg p-3 bg-white" data-answer-id="${newAnswer.id}">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-gray-500">
              <i class="fas fa-clock mr-1"></i>${i18n.t('answerCreatedAt')}: ${formatDate(newAnswer.created_at)}
            </span>
            <button type="button" 
                    onclick="deleteExistingAnswer(${reviewId}, ${newAnswer.id}, ${questionNumber})"
                    class="text-red-600 hover:text-red-800 text-sm">
              <i class="fas fa-trash-alt mr-1"></i>${i18n.t('delete')}
            </button>
          </div>
          <div class="text-sm text-gray-800 whitespace-pre-wrap">${escapeHtml(answer)}</div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', answerHtml);
    }
    
    // Reset form
    cancelNewAnswer(questionNumber);
    
    showNotification(i18n.t('answerSaved') || '答案已保存', 'success');
  } catch (error) {
    console.error('Add answer error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Helper function to delete existing answer
async function deleteExistingAnswer(reviewId, answerId, questionNumber) {
  if (!confirm(i18n.t('confirmDeleteAnswer') || '确定要删除这个答案吗？')) {
    return;
  }
  
  try {
    // Call new API endpoint to delete by answer ID
    await axios.delete(`/api/reviews/${reviewId}/answer/${answerId}`);
    
    // Remove from UI
    const answerElement = document.querySelector(`.answer-item[data-answer-id="${answerId}"]`);
    if (answerElement) {
      answerElement.remove();
    }
    
    // Check if no answers left, show "no answers" message
    const container = document.getElementById(`answers-container-${questionNumber}`);
    if (container && container.children.length === 0) {
      container.innerHTML = `
        <div class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg">
          <i class="fas fa-info-circle mr-1"></i>${i18n.t('noAnswersYet')}
        </div>
      `;
    }
    
    showNotification(i18n.t('answerDeleted') || '答案已删除', 'success');
  } catch (error) {
    console.error('Delete answer error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// V6.7.0: Validate required questions before submission
// IMPORTANT: This function should ONLY be called with choice-type questions
// Text and time_with_text questions are managed separately through answer sets
function validateRequiredQuestions(questions, answers) {
  console.log('[validateRequiredQuestions] Starting validation...');
  console.log('[validateRequiredQuestions] Questions to check:', questions.length);
  console.log('[validateRequiredQuestions] Answers provided:', Object.keys(answers).length);
  
  const errors = [];
  
  questions.forEach(q => {
    console.log(`[validateRequiredQuestions] Q${q.question_number}: type=${q.question_type}, required=${q.required}`);
    
    // DOUBLE CHECK: Skip text and time_with_text questions even if accidentally passed in
    if (q.question_type === 'text' || q.question_type === 'time_with_text') {
      console.log(`[validateRequiredQuestions] Q${q.question_number} SKIPPED - text/time type should not be validated here`);
      return; // Skip this question
    }
    
    // Only validate if marked as required
    if (q.required === 'yes') {
      const answer = answers[q.question_number];
      console.log(`[validateRequiredQuestions] Q${q.question_number} is REQUIRED, answer=`, answer);
      
      // Check if answer is empty (only for choice questions)
      let isEmpty = false;
      
      if (!answer) {
        isEmpty = true;
      } else if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
        // Choice type: check answer field (could be string or in answer object)
        const answerValue = typeof answer === 'string' ? answer : answer.answer;
        isEmpty = !answerValue || answerValue.trim() === '';
      }
      
      console.log(`[validateRequiredQuestions] Q${q.question_number} isEmpty=${isEmpty}`);
      
      if (isEmpty) {
        console.log(`[validateRequiredQuestions] Q${q.question_number} FAILED validation!`);
        errors.push({
          questionNumber: q.question_number,
          questionText: q.question_text
        });
      }
    }
  });
  
  console.log('[validateRequiredQuestions] Validation complete, errors:', errors.length);
  return errors;
}

// V6.7.0: Show required fields error notification
function showRequiredFieldsError(errors) {
  const errorMessages = errors.map(err => 
    `<strong>Q${err.questionNumber}:</strong> ${escapeHtml(err.questionText)}`
  ).join('<br>');
  
  showNotification(
    `<div class="text-left">${i18n.t('requiredFieldsEmpty')}:<br><br>${errorMessages}</div>`,
    'error',
    8000 // Show for 8 seconds
  );
}

// V6.7.0: Check if current user can view this answer (for private questions)
function canViewAnswer(question, answer, currentUserId, reviewCreatorId) {
  // Public question: everyone can see
  if (!question.owner || question.owner === 'public') {
    return true;
  }
  
  // Private question: only answerer and review creator can see
  if (question.owner === 'private') {
    return answer.user_id === currentUserId || currentUserId === reviewCreatorId;
  }
  
  // Default: can view
  return true;
}

// V6.7.0: Filter answers based on privacy settings
function filterAnswersByPrivacy(question, answers, currentUserId, reviewCreatorId) {
  if (!question.owner || question.owner === 'public') {
    return answers; // Public question, show all answers
  }
  
  // Private question:
  // - If current user is review creator: show all answers
  // - Otherwise: show only current user's own answers
  if (currentUserId === reviewCreatorId) {
    return answers; // Review creator sees all answers
  } else {
    return answers.filter(answer => answer.user_id === currentUserId); // Others see only their own
  }
}

async function handleEditReview(e) {
  e.preventDefault();
  
  const id = document.getElementById('review-id').value;
  const isCreator = window.currentEditIsCreator;
  
  // Collect answers for choice-type questions only
  // Note: Text-type answers are now managed through addNewAnswer() function
  const answers = {};
  const questions = window.currentEditQuestions || [];
  
  console.log('[handleEditReview] 开始收集答案，问题数量:', questions.length);
  
  if (questions.length > 0) {
    questions.forEach(q => {
      if (q.question_type === 'single_choice') {
        // Get selected radio button
        const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
        if (selected) {
          answers[q.question_number] = selected.value; // "A" or "B" etc.
          console.log(`[handleEditReview] 单选题 ${q.question_number}: ${selected.value}`);
        } else {
          console.log(`[handleEditReview] 单选题 ${q.question_number}: 未选择`);
        }
      } else if (q.question_type === 'multiple_choice') {
        // Get all checked checkboxes
        const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
        if (checked.length > 0) {
          const selectedValues = Array.from(checked).map(cb => cb.value);
          answers[q.question_number] = selectedValues.join(','); // "A,B,C"
          console.log(`[handleEditReview] 多选题 ${q.question_number}: ${selectedValues.join(',')}`);
        } else {
          console.log(`[handleEditReview] 多选题 ${q.question_number}: 未选择`);
        }
      }
      // Skip text type - these are managed through the multiple answers UI
    });
  }
  
  console.log('[handleEditReview] 收集到的答案:', answers);
  
  // Build data object based on permissions
  let data;
  if (isCreator) {
    // Creator can edit everything
    const title = document.getElementById('review-title').value;
    const description = document.getElementById('review-description').value;
      const timeType = document.getElementById('review-time-type').value;
    const ownerType = document.getElementById('review-owner-type').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    
    // Get calendar fields
    const scheduledAt = document.getElementById('edit-scheduled-at').value || null;
    const location = document.getElementById('edit-location').value || null;
    const reminderMinutes = parseInt(document.getElementById('edit-reminder-minutes').value) || 60;
    
    data = {
      title,
      description: description || null,
      time_type: timeType,
      owner_type: ownerType,
      status,
      scheduled_at: scheduledAt,
      location: location,
      reminder_minutes: reminderMinutes,
      answers
    };
  } else {
    // Non-creator can only edit answers
    data = {
      answers
    };
  }

  // V6.7.0: Validate required questions before submission
  // Note: ONLY validate choice-type questions here
  // Text-type and time_with_text questions are managed through answer sets system
  // and should NOT be validated here even if marked as required
  if (Object.keys(answers).length > 0) {
    // Filter to ONLY choice questions - explicitly exclude text and time_with_text
    const choiceQuestions = questions.filter(q => 
      q.question_type === 'single_choice' || q.question_type === 'multiple_choice'
    );
    
    console.log('[handleEditReview] Validating choice questions only:', choiceQuestions.length);
    
    if (choiceQuestions.length > 0) {
      const validationErrors = validateRequiredQuestions(choiceQuestions, answers);
      if (validationErrors.length > 0) {
        showRequiredFieldsError(validationErrors);
        return; // Stop submission
      }
    } else {
      console.log('[handleEditReview] No choice questions to validate, skipping validation');
    }
  } else {
    console.log('[handleEditReview] No answers collected, skipping validation');
  }

  try {
    console.log('开始保存复盘，ID:', id);
    console.log('保存数据:', JSON.stringify(data, null, 2));
    
    const response = await axios.put(`/api/reviews/${id}`, data);
    
    console.log('保存成功！服务器响应:', response.data);
    
    // Get current timestamp for display
    const savedTime = new Date().toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Show success notification with timestamp
    showNotification(
      i18n.t('updateSuccess') + ' - ' + savedTime,
      'success'
    );
    
    // Clear newly created draft flag on successful save
    if (window.newlyCreatedDraftId == id) {
      delete window.newlyCreatedDraftId;
      console.log('已清除新建草稿标记');
    }
    
    console.log('准备返回复盘列表...');
    
    // Delay slightly to ensure notification is visible before navigating
    setTimeout(() => {
      try {
        console.log('执行返回复盘列表...');
        showReviews(); // Return to My Reviews page
        window.scrollTo(0, 0); // Scroll to top
        console.log('已返回复盘列表');
      } catch (navError) {
        console.error('返回列表失败:', navError);
        // Force navigation even if error
        window.location.hash = '#reviews';
        location.reload();
      }
    }, 800); // 800ms delay to show success message
    
  } catch (error) {
    console.error('保存复盘失败！');
    console.error('错误详情:', error);
    console.error('错误响应:', error.response);
    console.error('错误数据:', error.response?.data);
    
    const errorMessage = error.response?.data?.error || error.message || '未知错误';
    showNotification(
      i18n.t('operationFailed') + ': ' + errorMessage,
      'error'
    );
  }
}

// Handle cancel button in edit review form
async function handleEditReviewCancel(reviewId) {
  // If this is a newly created draft that hasn't been saved yet, delete it
  if (window.newlyCreatedDraftId == reviewId) {
    try {
      await axios.delete(`/api/reviews/${reviewId}`);
      delete window.newlyCreatedDraftId;
      showNotification(i18n.t('draftDeleted') || '草稿已删除', 'info');
    } catch (error) {
      console.error('Failed to delete draft:', error);
      // Continue to show reviews page even if delete fails
    }
  }
  
  showReviews();
}

// Handle "Save and Exit" button - combines save and exit functionality
async function handleSaveAndExitReview(id) {
  // Prevent duplicate saves (debounce mechanism)
  if (window.isSavingAndExiting) {
    console.log('[handleSaveAndExitReview] 已有保存操作正在进行，忽略重复调用');
    return;
  }
  
  window.isSavingAndExiting = true;
  console.log('[handleSaveAndExitReview] 设置保存锁，防止重复保存');
  
  const isCreator = window.currentEditIsCreator;
  
  // Collect answers for choice-type questions only
  const answers = {};
  const questions = window.currentEditQuestions || [];
  
  console.log('[handleSaveAndExitReview] 开始收集答案，问题数量:', questions.length);
  
  if (questions.length > 0) {
    questions.forEach(q => {
      if (q.question_type === 'single_choice') {
        // Get selected radio button
        const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
        if (selected) {
          answers[q.question_number] = selected.value;
          console.log(`[handleSaveAndExitReview] 单选题 ${q.question_number}: ${selected.value}`);
        } else {
          console.log(`[handleSaveAndExitReview] 单选题 ${q.question_number}: 未选择`);
        }
      } else if (q.question_type === 'multiple_choice') {
        // Get all checked checkboxes
        const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
        if (checked.length > 0) {
          const selectedValues = Array.from(checked).map(cb => cb.value);
          answers[q.question_number] = selectedValues.join(',');
          console.log(`[handleSaveAndExitReview] 多选题 ${q.question_number}: ${selectedValues.join(',')}`);
        } else {
          console.log(`[handleSaveAndExitReview] 多选题 ${q.question_number}: 未选择`);
        }
      }
    });
  }
  
  console.log('[handleSaveAndExitReview] 收集到的答案:', answers);
  
  // Build data object based on permissions
  let data;
  // Variables for checking if allow_multiple_answers changed (declare outside if block)
  let allowMultipleAnswers = 'yes';
  let originalAllowMultipleAnswers = 'yes';
  let allowMultipleAnswersChanged = false;

  if (isCreator) {
    // Creator can edit everything
    const title = document.getElementById('review-title').value;
    const description = document.getElementById('review-description').value;
    const timeType = document.getElementById('review-time-type').value;
    const ownerType = document.getElementById('review-owner-type').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    
    // Get calendar fields
    const scheduledAt = document.getElementById('edit-scheduled-at').value || null;
    const location = document.getElementById('edit-location').value || null;
    const reminderMinutes = parseInt(document.getElementById('edit-reminder-minutes').value) || 60;
    
    // Get allow_multiple_answers field
    allowMultipleAnswers = document.querySelector('input[name="allow_multiple_answers"]:checked')?.value || 'yes';
    
    // Check if allow_multiple_answers has changed
    originalAllowMultipleAnswers = window.currentEditReview?.allow_multiple_answers || 'yes';
    allowMultipleAnswersChanged = allowMultipleAnswers !== originalAllowMultipleAnswers;
    
    console.log('[handleSaveAndExitReview] allow_multiple_answers检查:', {
      original: originalAllowMultipleAnswers,
      new: allowMultipleAnswers,
      changed: allowMultipleAnswersChanged
    });
    
    data = {
      title,
      description: description || null,
      time_type: timeType,
      owner_type: ownerType,
      status,
      scheduled_at: scheduledAt,
      location: location,
      reminder_minutes: reminderMinutes,
      allow_multiple_answers: allowMultipleAnswers,
      answers
    };
  } else {
    // Non-creator can only edit answers
    data = {
      answers
    };
  }
  

  try {
    console.log('[handleSaveAndExitReview] 开始保存复盘，ID:', id);
    console.log('[handleSaveAndExitReview] 保存数据:', JSON.stringify(data, null, 2));
    
    const response = await axios.put(`/api/reviews/${id}`, data);
    
    console.log('[handleSaveAndExitReview] 保存成功！服务器响应:', response.data);
    
    // Get current timestamp for display
    const savedTime = new Date().toLocaleString(i18n.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Check if we need to refresh the edit page (when allow_multiple_answers changed)
    const needsRefresh = allowMultipleAnswersChanged;
    
    // Show success notification
    if (needsRefresh) {
      showNotification(
        i18n.t('saveSuccessRefreshing') || '保存成功！由于修改了答案组设置，正在刷新页面...',
        'success'
      );
    } else {
      showNotification(
        i18n.t('saveAndExitSuccess') || '保存成功，正在退出编辑...',
        'success'
      );
    }
    
    // Clear newly created draft flag on successful save
    if (window.newlyCreatedDraftId == id) {
      delete window.newlyCreatedDraftId;
      console.log('[handleSaveAndExitReview] 已清除新建草稿标记');
    }
    
    console.log('[handleSaveAndExitReview] 准备' + (needsRefresh ? '刷新编辑页面' : '返回复盘列表') + '...');
    
    // Navigate immediately after save (shorter delay than original)
    setTimeout(() => {
      try {
        // Release the save lock before navigation
        window.isSavingAndExiting = false;
        console.log('[handleSaveAndExitReview] 释放保存锁');
        
        if (needsRefresh) {
          // If allow_multiple_answers changed, refresh the edit page
          console.log('[handleSaveAndExitReview] 执行刷新编辑页面...');
          showEditReview(id);
          window.scrollTo(0, 0); // Scroll to top
          console.log('[handleSaveAndExitReview] 已刷新编辑页面');
        } else {
          // Otherwise, return to My Reviews page
          console.log('[handleSaveAndExitReview] 执行返回复盘列表...');
          showReviews();
          window.scrollTo(0, 0); // Scroll to top
          console.log('[handleSaveAndExitReview] 已返回复盘列表');
        }
      } catch (navError) {
        console.error('[handleSaveAndExitReview] 导航失败:', navError);
        // Release the save lock even on error
        window.isSavingAndExiting = false;
        // Force navigation even if error
        if (needsRefresh) {
          location.reload();
        } else {
          window.location.hash = '#reviews';
          location.reload();
        }
      }
    }, 500); // Shorter delay for immediate exit
    
  } catch (error) {
    console.error('[handleSaveAndExitReview] 保存复盘失败！');
    console.error('[handleSaveAndExitReview] 错误详情:', error);
    console.error('[handleSaveAndExitReview] 错误响应:', error.response);
    console.error('[handleSaveAndExitReview] 错误数据:', error.response?.data);
    
    // Release the save lock on error
    window.isSavingAndExiting = false;
    console.log('[handleSaveAndExitReview] 保存失败，释放保存锁');
    
    const errorMessage = error.response?.data?.error || error.message || '未知错误';
    showNotification(
      i18n.t('operationFailed') + ': ' + errorMessage,
      'error'
    );
  }
}

// ============ Helper Functions ============

// Format date to localized string
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Unified navigation bar for all pages (logged in and logged out)
function renderNavigation() {
  return `
    <nav class="bg-white shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center cursor-pointer" onclick="showHomePage()">
            <i class="fas fa-brain text-indigo-600 text-2xl mr-2"></i>
            <span class="text-xl font-bold text-gray-800 hidden sm:inline">${i18n.t('systemTitle')}</span>
            <span class="text-lg font-bold text-gray-800 sm:hidden">Review System</span>
          </div>
          
          <!-- Mobile Menu Toggle Button -->
          <button onclick="toggleMobileMenu()" class="md:hidden text-gray-700 hover:text-indigo-600 p-2">
            <i class="fas fa-bars text-2xl"></i>
          </button>
          
          <!-- Desktop Navigation -->
          <div class="hidden md:flex space-x-8">
            ${currentUser ? `
              <button onclick="showDashboard()" class="text-gray-700 hover:text-indigo-600 transition">
                <i class="fas fa-home mr-1"></i>${i18n.t('dashboard')}
              </button>
              <button onclick="showTeams()" class="text-gray-700 hover:text-indigo-600 transition">
                <i class="fas fa-users mr-1"></i>${i18n.t('teams')}
              </button>
              <div class="relative inline-block">
                <button onclick="toggleDropdown('marketplace-dropdown')" class="text-gray-700 hover:text-indigo-600 transition flex items-center">
                  <i class="fas fa-store mr-1"></i>${i18n.t('marketplace')}
                  <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="marketplace-dropdown" class="hidden absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                  <button onclick="AgentsPage.init(); toggleDropdown('marketplace-dropdown');" class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">
                    <i class="fas fa-robot mr-2"></i>${i18n.t('myAgents')}
                  </button>
                  <button onclick="MarketplaceManager.renderMyPurchasesPage(); toggleDropdown('marketplace-dropdown');" class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">
                    <i class="fas fa-shopping-bag mr-2"></i>${i18n.t('myOtherPurchases')}
                  </button>
                  <button onclick="MarketplaceManager.renderMarketplacePage(); toggleDropdown('marketplace-dropdown');" class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">
                    <i class="fas fa-store mr-2"></i>${i18n.t('marketplaceStore')}
                  </button>
                </div>
              </div>
              ${currentUser.role === 'premium' || currentUser.role === 'admin' ? `
                <button onclick="showAdmin()" class="text-gray-700 hover:text-indigo-600 transition">
                  <i class="fas fa-cog mr-1"></i>${i18n.t('admin')}
                </button>
              ` : ''}
            ` : `
              <a href="#resources" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('resources')}</a>
              <a href="#about" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('aboutUs')}</a>
              <a href="#testimonials" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('testimonials')}</a>
              <a href="#contact" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('contact')}</a>
            `}
          </div>
          <div class="flex items-center space-x-4">
            <!-- Language Switcher Dropdown -->
            <div class="relative inline-block">
              <button onclick="toggleLanguageMenu('language-menu')" 
                      class="text-gray-600 hover:text-indigo-600 flex items-center px-2 py-1 rounded-lg hover:bg-gray-100 text-sm">
                <i class="fas fa-language mr-2"></i>
                <span class="font-medium">${
                  i18n.getCurrentLanguage() === 'en' ? 'English' :
                  i18n.getCurrentLanguage() === 'fr' ? 'Français' :
                  i18n.getCurrentLanguage() === 'es' ? 'Español' :
                  i18n.getCurrentLanguage() === 'zh' ? '简体中文' :
                  i18n.getCurrentLanguage() === 'zh-TW' ? '繁體中文' :
                  '日本語'
                }</span>
                <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </button>
              <div id="language-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                <button onclick="handleLanguageSwitch('en', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'en' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇬🇧</span>
                  <span>English</span>
                  ${i18n.getCurrentLanguage() === 'en' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('fr', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'fr' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇫🇷</span>
                  <span>Français</span>
                  ${i18n.getCurrentLanguage() === 'fr' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('es', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'es' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇪🇸</span>
                  <span>Español</span>
                  ${i18n.getCurrentLanguage() === 'es' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('zh', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'zh' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇨🇳</span>
                  <span>简体中文</span>
                  ${i18n.getCurrentLanguage() === 'zh' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('zh-TW', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'zh-TW' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇹🇼</span>
                  <span>繁體中文</span>
                  ${i18n.getCurrentLanguage() === 'zh-TW' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('ja', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'ja' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇯🇵</span>
                  <span>日本語</span>
                  ${i18n.getCurrentLanguage() === 'ja' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
              </div>
            </div>
            ${currentUser ? `
              <button onclick="showCart()" class="relative text-gray-700 hover:text-indigo-600">
                <i class="fas fa-shopping-cart text-xl"></i>
                <span id="cart-count" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
              </button>
              <button onclick="showUserSettings()" class="text-gray-700 hover:text-indigo-600 cursor-pointer">
                <i class="fas fa-user mr-1"></i>${escapeHtml(currentUser.username)}
                <span class="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">${currentUser.role}</span>
              </button>
              <button onclick="logout()" class="text-red-600 hover:text-red-800">
                <i class="fas fa-sign-out-alt mr-1"></i>${i18n.t('logout')}
              </button>
            ` : `
              <button onclick="showLogin()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                <i class="fas fa-sign-in-alt mr-2"></i>${i18n.t('login')}
              </button>
            `}
          </div>
        </div>
      </div>
      
      <!-- Mobile Menu Overlay -->
      <div id="mobile-menu" class="hidden fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onclick="closeMobileMenu()">
        <div class="fixed right-0 top-0 bottom-0 w-80 max-w-[80%] bg-white shadow-xl transform transition-transform duration-300" onclick="event.stopPropagation()">
          <!-- Mobile Menu Header -->
          <div class="flex justify-between items-center p-4 border-b">
            <span class="text-lg font-bold text-gray-800">${i18n.t('systemTitle')}</span>
            <button onclick="closeMobileMenu()" class="text-gray-600 hover:text-gray-900 p-2">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Mobile Menu Items -->
          <div class="overflow-y-auto h-[calc(100vh-64px)]">
            ${currentUser ? `
              <!-- Logged In User Menu -->
              <div class="p-4 border-b bg-indigo-50">
                <div class="flex items-center mb-2">
                  <i class="fas fa-user-circle text-2xl text-indigo-600 mr-3"></i>
                  <div>
                    <div class="font-medium text-gray-900">${escapeHtml(currentUser.username)}</div>
                    <div class="text-xs text-indigo-600 font-medium">${currentUser.role}</div>
                  </div>
                </div>
              </div>
              
              <div class="py-2">
                <button onclick="showDashboard(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center text-gray-700">
                  <i class="fas fa-home w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('dashboard')}</span>
                </button>
                <button onclick="showTeams(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center text-gray-700">
                  <i class="fas fa-users w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('teams')}</span>
                </button>
                <button onclick="MarketplaceManager.renderMarketplacePage(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center text-gray-700">
                  <i class="fas fa-store w-6 text-indigo-600"></i>
                  <span class="ml-3">商城</span>
                </button>
                ${currentUser.role === 'premium' || currentUser.role === 'admin' ? `
                  <button onclick="showAdmin(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center text-gray-700">
                    <i class="fas fa-cog w-6 text-indigo-600"></i>
                    <span class="ml-3">${i18n.t('admin')}</span>
                  </button>
                ` : ''}
                <button onclick="showCart(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center text-gray-700">
                  <i class="fas fa-shopping-cart w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('cart')}</span>
                  <span id="mobile-cart-count" class="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
                </button>
                <button onclick="showUserSettings(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center text-gray-700">
                  <i class="fas fa-cog w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('userSettings')}</span>
                </button>
              </div>
              
              <div class="border-t py-2">
                <button onclick="logout(); closeMobileMenu();" class="w-full text-left px-6 py-3 hover:bg-red-50 flex items-center text-red-600">
                  <i class="fas fa-sign-out-alt w-6"></i>
                  <span class="ml-3">${i18n.t('logout')}</span>
                </button>
              </div>
            ` : `
              <!-- Guest User Menu -->
              <div class="py-2">
                <a href="#resources" onclick="closeMobileMenu()" class="block px-6 py-3 hover:bg-gray-100 text-gray-700">
                  <i class="fas fa-book w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('resources')}</span>
                </a>
                <a href="#about" onclick="closeMobileMenu()" class="block px-6 py-3 hover:bg-gray-100 text-gray-700">
                  <i class="fas fa-info-circle w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('aboutUs')}</span>
                </a>
                <a href="#testimonials" onclick="closeMobileMenu()" class="block px-6 py-3 hover:bg-gray-100 text-gray-700">
                  <i class="fas fa-comments w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('testimonials')}</span>
                </a>
                <a href="#contact" onclick="closeMobileMenu()" class="block px-6 py-3 hover:bg-gray-100 text-gray-700">
                  <i class="fas fa-envelope w-6 text-indigo-600"></i>
                  <span class="ml-3">${i18n.t('contact')}</span>
                </a>
              </div>
              
              <div class="border-t py-4 px-6">
                <button onclick="showLogin(); closeMobileMenu();" class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition mb-3">
                  <i class="fas fa-sign-in-alt mr-2"></i>${i18n.t('login')}
                </button>
                <button onclick="showRegister(); closeMobileMenu();" class="w-full bg-white text-indigo-600 px-4 py-3 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition">
                  <i class="fas fa-user-plus mr-2"></i>${i18n.t('register')}
                </button>
              </div>
            `}
            
            <!-- Language Switcher in Mobile Menu -->
            <div class="border-t py-3 px-6">
              <div class="text-sm font-medium text-gray-600 mb-2">${i18n.t('language')}</div>
              <div class="grid grid-cols-2 gap-2">
                <button onclick="handleLanguageSwitch('zh'); closeMobileMenu();" class="px-3 py-2 rounded-lg text-sm ${i18n.getCurrentLanguage() === 'zh' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}">
                  <span class="mr-1">🇨🇳</span>中文
                </button>
                <button onclick="handleLanguageSwitch('en'); closeMobileMenu();" class="px-3 py-2 rounded-lg text-sm ${i18n.getCurrentLanguage() === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}">
                  <span class="mr-1">🇬🇧</span>English
                </button>
                <button onclick="handleLanguageSwitch('ja'); closeMobileMenu();" class="px-3 py-2 rounded-lg text-sm ${i18n.getCurrentLanguage() === 'ja' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}">
                  <span class="mr-1">🇯🇵</span>日本語
                </button>
                <button onclick="handleLanguageSwitch('es'); closeMobileMenu();" class="px-3 py-2 rounded-lg text-sm ${i18n.getCurrentLanguage() === 'es' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}">
                  <span class="mr-1">🇪🇸</span>Español
                </button>
              </div>
            </div>
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

// Helper function to render owner_type badge
function renderOwnerTypeBadge(ownerType) {
  const ownerTypeConfig = {
    'private': {
      icon: 'fa-lock',
      color: 'bg-gray-100 text-gray-800',
      label: i18n.t('ownerTypePrivate')
    },
    'team': {
      icon: 'fa-users',
      color: 'bg-blue-100 text-blue-800',
      label: i18n.t('ownerTypeTeam')
    },
    'public': {
      icon: 'fa-globe',
      color: 'bg-green-100 text-green-800',
      label: i18n.t('ownerTypePublic')
    }
  };
  
  const config = ownerTypeConfig[ownerType] || ownerTypeConfig['private'];
  
  return `
    <span class="px-2 py-1 text-xs rounded-full ${config.color} inline-flex items-center">
      <i class="fas ${config.icon} mr-1"></i>
      ${config.label}
    </span>
  `;
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

// Handle language switch with data preservation
function toggleLanguageMenu(menuId = 'language-menu') {
  const menu = document.getElementById(menuId);
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Generic dropdown toggle function
function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdowns = document.querySelectorAll('[id$="-dropdown"]');
  dropdowns.forEach(dropdown => {
    if (!dropdown.classList.contains('hidden')) {
      const button = event.target.closest(`button[onclick*="${dropdown.id}"]`);
      if (!dropdown.contains(event.target) && !button) {
        dropdown.classList.add('hidden');
      }
    }
  });
});

// Close language menu when clicking outside
document.addEventListener('click', function(event) {
  // All pages now use unified navigation with single 'language-menu' ID
  const menu = document.getElementById('language-menu');
  
  if (menu && !menu.classList.contains('hidden')) {
    const button = event.target.closest(`button[onclick*="language-menu"]`);
    if (!menu.contains(event.target) && !button) {
      menu.classList.add('hidden');
    }
  }
});

async function handleLanguageSwitch(newLang, menuId = 'language-menu') {
  // Hide language menu
  const menu = document.getElementById(menuId);
  if (menu) {
    menu.classList.add('hidden');
  }
  
  // Don't switch if already on this language
  if (newLang === i18n.getCurrentLanguage()) {
    return;
  }
  
  // Check if user is in the middle of creating a review
  if (currentView === 'create-review-step1' || currentView === 'create-review-step2') {
    // Show confirmation dialog
    const confirmed = confirm(i18n.t('confirmLanguageSwitch'));
    if (!confirmed) {
      return;
    }
    
    // Show saving notification
    showNotification(i18n.t('savingDraft'), 'info');
    
    try {
      // Save draft if in step 2
      if (currentView === 'create-review-step2') {
        await window.saveCurrentReviewDraft();
        showNotification(i18n.t('draftSaved'), 'success');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      showNotification(i18n.t('operationFailed'), 'error');
      return;
    }
  }
  
  // Show switching notification
  showNotification(i18n.t('switchingLanguage'), 'info');
  
  // Save language preference to backend if user is logged in
  if (currentUser && authToken) {
    try {
      await axios.put('/api/auth/settings', { language: newLang });
      currentUser.language = newLang;
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }
  
  // Small delay to show notification
  setTimeout(() => {
    i18n.switchLanguage(newLang);
    // Note: i18n.switchLanguage() will reload the page, which updates everything
    // No need to manually update navigation here as page reload handles it
  }, 500);
}

// ============ Teams Management ============

async function showTeams() {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
  currentView = 'teams';
  const app = document.getElementById('app');
  
  // Check if user can create teams (premium or admin only)
  const canCreateTeam = currentUser && (currentUser.role === 'premium' || currentUser.role === 'admin');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-6 flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-users mr-2"></i>${i18n.t('teamList')}
          </h1>
          ${canCreateTeam ? `
            <button onclick="showCreateTeam()" 
                    class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg">
              <i class="fas fa-plus mr-2"></i>${i18n.t('createTeam')}
            </button>
          ` : `
            <div class="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              <i class="fas fa-info-circle mr-2"></i>${i18n.t('premiumFeature')}
            </div>
          `}
        </div>

        <!-- Tab Navigation -->
        <div class="mb-6 border-b border-gray-200">
          <nav class="flex space-x-8">
            <button onclick="switchTeamsTab('my')" id="tab-my" 
                    class="teams-tab py-4 px-1 border-b-2 border-indigo-600 font-medium text-indigo-600">
              ${i18n.t('myTeams')}
            </button>
            <button onclick="switchTeamsTab('public')" id="tab-public" 
                    class="teams-tab py-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700">
              ${i18n.t('publicTeams')}
            </button>
            <button onclick="switchTeamsTab('applications')" id="tab-applications" 
                    class="teams-tab py-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700">
              ${i18n.t('pendingApplications')} <span id="pending-count" class="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1"></span>
            </button>
          </nav>
        </div>

        <!-- My Teams Tab -->
        <div id="teams-my" class="teams-tab-content">
          <div id="my-teams-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-12">
              <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p class="text-gray-600">${i18n.t('loading')}</p>
            </div>
          </div>
        </div>

        <!-- Public Teams Tab -->
        <div id="teams-public" class="teams-tab-content hidden">
          <div id="public-teams-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-12">
              <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p class="text-gray-600">${i18n.t('loading')}</p>
            </div>
          </div>
        </div>

        <!-- Applications Tab -->
        <div id="teams-applications" class="teams-tab-content hidden">
          <div id="applications-container" class="space-y-4">
            <div class="text-center py-12">
              <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p class="text-gray-600">${i18n.t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadTeams();
}

async function loadTeams() {
  try {
    const [teamsResponse, applicationsResponse] = await Promise.all([
      axios.get('/api/teams'),
      axios.get('/api/teams/applications/pending').catch(() => ({ data: { applications: [] } }))
    ]);
    
    const myTeams = teamsResponse.data.myTeams || [];
    const publicTeams = teamsResponse.data.publicTeams || [];
    const applications = applicationsResponse.data.applications || [];
    
    renderMyTeamsList(myTeams);
    renderPublicTeamsList(publicTeams);
    renderApplicationsList(applications);
    
    // Update pending count badge
    const pendingCount = document.getElementById('pending-count');
    if (pendingCount) {
      pendingCount.textContent = applications.length || '';
      pendingCount.style.display = applications.length > 0 ? 'inline-block' : 'none';
    }
  } catch (error) {
    console.error('Load teams error:', error);
    document.getElementById('my-teams-container').innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
        <p class="text-red-600">${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function renderMyTeamsList(teams) {
  const container = document.getElementById('my-teams-container');
  
  if (teams.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg mb-4">你还没有加入任何团队</p>
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
        <div class="flex flex-col space-y-1">
          ${team.is_public ? `
            <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full text-center">
              公开
            </span>
          ` : `
            <span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full text-center">
              私有
            </span>
          `}
          ${team.my_role === 'creator' ? `
            <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full text-center">
              ${i18n.t('teamOwner')}
            </span>
          ` : ''}
        </div>
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

function renderPublicTeamsList(teams) {
  const container = document.getElementById('public-teams-container');
  
  if (teams.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">${i18n.t('noPublicTeams')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = teams.map(team => `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-800 mb-2">
            ${escapeHtml(team.name)}
          </h3>
          ${team.description ? `
            <p class="text-sm text-gray-600 mb-3">${escapeHtml(team.description)}</p>
          ` : ''}
        </div>
      </div>
      
      <div class="flex items-center justify-between text-sm text-gray-500 border-t pt-3 mb-4">
        <div>
          <i class="fas fa-user mr-1"></i>
          <span>${escapeHtml(team.owner_name)}</span>
        </div>
        <div>
          <i class="fas fa-users mr-1"></i>
          <span>${team.member_count} ${i18n.t('members')}</span>
        </div>
      </div>
      
      ${team.is_member ? `
        <button onclick="showTeamDetail(${team.id})" 
                class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
          <i class="fas fa-check-circle mr-1"></i>已加入 - 查看详情
        </button>
      ` : team.application_status === 'pending' ? `
        <button disabled class="w-full bg-gray-400 text-white px-4 py-2 rounded text-sm cursor-not-allowed">
          <i class="fas fa-clock mr-1"></i>申请审批中
        </button>
      ` : `
        <button onclick="applyToTeam(${team.id})" 
                class="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">
          <i class="fas fa-paper-plane mr-1"></i>申请加入
        </button>
      `}
    </div>
  `).join('');
}

function renderApplicationsList(applications) {
  const container = document.getElementById('applications-container');
  
  if (applications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">暂无待审批申请</p>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-semibold text-lg text-gray-800">${escapeHtml(app.username)}</h3>
          <p class="text-sm text-gray-600 mt-1">申请加入: ${escapeHtml(app.team_name)}</p>
          <p class="text-sm text-gray-500 mt-2">${app.message ? escapeHtml(app.message) : '无申请理由'}</p>
          <p class="text-xs text-gray-400 mt-2">
            <i class="fas fa-clock mr-1"></i>${new Date(app.applied_at).toLocaleString('zh-CN')}
          </p>
        </div>
        <div class="flex space-x-2 ml-4">
          <button onclick="reviewApplication(${app.team_id}, ${app.id}, 'approve')" 
                  class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            <i class="fas fa-check mr-1"></i>确认
          </button>
          <button onclick="reviewApplication(${app.team_id}, ${app.id}, 'reject')" 
                  class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
            <i class="fas fa-times mr-1"></i>拒绝
          </button>
        </div>
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

          <div>
            <label class="flex items-center">
              <input type="checkbox" id="team-is-public" class="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
              <span class="text-sm font-medium text-gray-700">${i18n.t('isPublic')}</span>
            </label>
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
  const isPublic = document.getElementById('team-is-public').checked;

  try {
    await axios.post('/api/teams', { name, description, isPublic });
    showNotification(i18n.t('createSuccess'), 'success');
    showTeams();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showTeamDetail(teamId) {
  try {
    // Check if user is logged in
    if (!currentUser) {
      showNotification('请先登录', 'error');
      showLogin();
      return;
    }
    
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
                      <div class="text-xs text-gray-400 mt-1">
                        ${i18n.t('joinedAt')}: ${new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <!-- User System Role -->
                    <span class="text-xs px-2 py-1 ${
                      member.user_role === 'admin' ? 'bg-red-100 text-red-800' :
                      member.user_role === 'premium' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    } rounded-full">
                      ${i18n.t(member.user_role + 'Role')}
                    </span>
                    
                    <!-- Team Role -->
                    ${isOwner && member.id !== team.owner_id ? `
                      <select onchange="changeMemberRole(${teamId}, ${member.id}, this.value)"
                              class="text-xs px-2 py-1 border rounded ${
                                member.team_role === 'creator' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                member.team_role === 'operator' ? 'bg-green-50 text-green-800 border-green-300' :
                                'bg-gray-50 text-gray-800 border-gray-300'
                              }">
                        <option value="viewer" ${member.team_role === 'viewer' ? 'selected' : ''}>
                          ${i18n.t('roleViewer')}
                        </option>
                        <option value="operator" ${member.team_role === 'operator' ? 'selected' : ''}>
                          ${i18n.t('roleOperator')}
                        </option>
                        <option value="creator" ${member.team_role === 'creator' ? 'selected' : ''}>
                          ${i18n.t('roleCreator')}
                        </option>
                      </select>
                    ` : `
                      <span class="text-xs px-2 py-1 ${
                        member.team_role === 'creator' ? 'bg-blue-100 text-blue-800' :
                        member.team_role === 'operator' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      } rounded-full" title="${
                        member.team_role === 'creator' ? i18n.t('creatorPermissions') :
                        member.team_role === 'operator' ? i18n.t('operatorPermissions') :
                        i18n.t('viewerPermissions')
                      }">
                        ${i18n.t('role' + member.team_role.charAt(0).toUpperCase() + member.team_role.slice(1))}
                      </span>
                    `}
                    
                    ${member.id === team.owner_id ? `
                      <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        <i class="fas fa-crown mr-1"></i>${i18n.t('teamOwner')}
                      </span>
                    ` : isOwner ? `
                      <button onclick="removeMember(${teamId}, ${member.id})" 
                              class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-user-minus"></i>
                      </button>
                    ` : member.id === currentUser.id ? `
                      <button onclick="leaveTeam(${teamId})" 
                              class="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                        <i class="fas fa-sign-out-alt mr-1"></i>${i18n.t('leaveTeam')}
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
    // Add member by email (backend will find user)
    await axios.post(`/api/teams/${teamId}/members`, { email });
    showNotification(i18n.t('inviteSuccess'), 'success');
    showTeamDetail(teamId);
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    if (error.response?.status === 404) {
      showNotification(i18n.t('userNotFound'), 'error');
    } else if (error.response?.status === 400 && errorMsg.includes('already a member')) {
      showNotification(i18n.t('alreadyMember'), 'error');
    } else {
      showNotification(i18n.t('operationFailed') + ': ' + errorMsg, 'error');
    }
  }
}

async function changeMemberRole(teamId, userId, newRole) {
  try {
    await axios.put(`/api/teams/${teamId}/members/${userId}/role`, { role: newRole });
    showNotification(i18n.t('roleUpdated'), 'success');
    showTeamDetail(teamId);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showTeamDetail(teamId); // Refresh to revert select value
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
  // Show custom confirmation dialog
  const confirmMessage = i18n.t('confirmLeaveTeam') || 'Are you sure you want to leave this team? You will lose access to all team reviews and resources.';
  if (!confirm(confirmMessage)) return;
  
  try {
    // Use new leave team endpoint
    await axios.post(`/api/teams/${teamId}/leave`);
    showNotification(i18n.t('leaveTeamSuccess') || 'Successfully left the team', 'success');
    showTeams();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============ Admin Panel ============

// Global state for admin panel navigation
let currentAdminCategory = 'system';
let currentAdminSubTab = 'users';

async function showAdmin() {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
  currentView = 'admin';
  const app = document.getElementById('app');
  
  // Set default category and subtab based on user role
  if (currentUser.role === 'admin') {
    currentAdminCategory = 'system';
    currentAdminSubTab = 'users';
  } else {
    currentAdminCategory = 'system';
    currentAdminSubTab = 'templates';
  }
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${renderNavigation()}
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">
          <i class="fas fa-cog mr-2"></i>${i18n.t('adminPanel')}
        </h1>

        <!-- Category Tabs (Level 1) -->
        <div class="bg-white rounded-lg shadow-md mb-6">
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6" aria-label="Categories">
              ${currentUser.role === 'admin' ? `
                <button onclick="showAdminCategory('system')" 
                        class="admin-category-tab active py-4 px-1 border-b-2 font-medium text-base"
                        data-category="system">
                  <i class="fas fa-cogs mr-2"></i>系统
                </button>
                <button onclick="showAdminCategory('agents')" 
                        class="admin-category-tab py-4 px-1 border-b-2 font-medium text-base"
                        data-category="agents">
                  <i class="fas fa-robot mr-2"></i>智能体配置
                </button>
                <button onclick="showAdminCategory('marketplace')" 
                        class="admin-category-tab py-4 px-1 border-b-2 font-medium text-base"
                        data-category="marketplace">
                  <i class="fas fa-store mr-2"></i>商城管理
                </button>
              ` : `
                <button onclick="showAdminCategory('system')" 
                        class="admin-category-tab active py-4 px-1 border-b-2 font-medium text-base"
                        data-category="system">
                  <i class="fas fa-cogs mr-2"></i>系统
                </button>
              `}
            </nav>
          </div>
        </div>

        <!-- Sub-Tabs Container (Level 2) -->
        <div id="admin-subtabs-container" class="bg-white rounded-lg shadow-md mb-6">
          <!-- Sub-tabs will be dynamically rendered here -->
        </div>

        <!-- Tab Content -->
        <div id="admin-content"></div>
      </div>
    </div>
  `;

  // Add tab styles
  const style = document.createElement('style');
  style.textContent = `
    .admin-category-tab {
      border-color: transparent;
      color: #6b7280;
    }
    .admin-category-tab:hover {
      border-color: #d1d5db;
      color: #111827;
    }
    .admin-category-tab.active {
      border-color: #4f46e5;
      color: #4f46e5;
    }
    .admin-subtab {
      border-color: transparent;
      color: #6b7280;
      font-size: 0.875rem;
    }
    .admin-subtab:hover {
      border-color: #d1d5db;
      color: #111827;
    }
    .admin-subtab.active {
      border-color: #4f46e5;
      color: #4f46e5;
    }
  `;
  document.head.appendChild(style);

  // Show default category
  showAdminCategory(currentAdminCategory);
}

// Show admin category and render its sub-tabs
function showAdminCategory(category) {
  currentAdminCategory = category;
  
  // Update active category tab
  document.querySelectorAll('.admin-category-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  const categoryBtn = document.querySelector(`[data-category="${category}"]`);
  if (categoryBtn) {
    categoryBtn.classList.add('active');
  }
  
  // Render sub-tabs based on category
  const subtabsContainer = document.getElementById('admin-subtabs-container');
  let subtabsHTML = '';
  let defaultSubTab = '';
  
  switch(category) {
    case 'system':
      defaultSubTab = currentUser.role === 'admin' ? 'users' : 'templates';
      subtabsHTML = `
        <div class="border-b border-gray-200">
          <nav class="flex space-x-6 px-6" aria-label="Sub-tabs">
            ${currentUser.role === 'admin' ? `
              <button onclick="showAdminSubTab('users')" 
                      class="admin-subtab active py-3 px-1 border-b-2 font-medium"
                      data-subtab="users">
                <i class="fas fa-users mr-2"></i>${i18n.t('userManagement')}
              </button>
              <button onclick="showAdminSubTab('notifications')" 
                      class="admin-subtab py-3 px-1 border-b-2 font-medium"
                      data-subtab="notifications">
                <i class="fas fa-bell mr-2"></i>${i18n.t('sendNotification')}
              </button>
              <button onclick="showAdminSubTab('stats')" 
                      class="admin-subtab py-3 px-1 border-b-2 font-medium"
                      data-subtab="stats">
                <i class="fas fa-chart-bar mr-2"></i>${i18n.t('systemStats')}
              </button>
              <button onclick="showAdminSubTab('testimonials')" 
                      class="admin-subtab py-3 px-1 border-b-2 font-medium"
                      data-subtab="testimonials">
                <i class="fas fa-comments mr-2"></i>${i18n.t('testimonialsManagement') || '留言'}
              </button>
              <button onclick="showAdminSubTab('publicReviews')" 
                      class="admin-subtab py-3 px-1 border-b-2 font-medium"
                      data-subtab="publicReviews">
                <i class="fas fa-globe mr-2"></i>公开复盘
              </button>
              <button onclick="showAdminSubTab('keywords')" 
                      class="admin-subtab py-3 px-1 border-b-2 font-medium"
                      data-subtab="keywords">
                <i class="fas fa-key mr-2"></i>${i18n.t('keywordsManagement')}
              </button>
              <button onclick="showAdminSubTab('uiSettings')" 
                      class="admin-subtab py-3 px-1 border-b-2 font-medium"
                      data-subtab="uiSettings">
                <i class="fas fa-palette mr-2"></i>${i18n.t('uiSettings')}
              </button>
            ` : ''}
          </nav>
        </div>
      `;
      break;
      
    case 'agents':
      defaultSubTab = 'aiSettings';
      subtabsHTML = `
        <div class="border-b border-gray-200">
          <nav class="flex space-x-6 px-6" aria-label="Sub-tabs">
            <button onclick="showAdminSubTab('aiSettings')" 
                    class="admin-subtab active py-3 px-1 border-b-2 font-medium"
                    data-subtab="aiSettings">
              <i class="fas fa-robot mr-2"></i>智能写作助手
            </button>
          </nav>
        </div>
      `;
      break;
      
    case 'marketplace':
      defaultSubTab = 'subscription';
      subtabsHTML = `
        <div class="border-b border-gray-200">
          <nav class="flex space-x-6 px-6" aria-label="Sub-tabs">
            <button onclick="showAdminSubTab('subscription')" 
                    class="admin-subtab active py-3 px-1 border-b-2 font-medium"
                    data-subtab="subscription">
              <i class="fas fa-credit-card mr-2"></i>订阅
            </button>
            <button onclick="showAdminSubTab('marketplace-agents')" 
                    class="admin-subtab py-3 px-1 border-b-2 font-medium"
                    data-subtab="marketplace-agents">
              <i class="fas fa-robot mr-2"></i>智能体
            </button>
            <button onclick="showAdminSubTab('writing-templates')" 
                    class="admin-subtab py-3 px-1 border-b-2 font-medium"
                    data-subtab="writing-templates">
              <i class="fas fa-file-alt mr-2"></i>写作模板
            </button>
            <button onclick="showAdminSubTab('templates')" 
                    class="admin-subtab py-3 px-1 border-b-2 font-medium"
                    data-subtab="templates">
              <i class="fas fa-clipboard-list mr-2"></i>复盘模板
            </button>
            <button onclick="showAdminSubTab('marketplace-other')" 
                    class="admin-subtab py-3 px-1 border-b-2 font-medium"
                    data-subtab="marketplace-other">
              <i class="fas fa-box mr-2"></i>其他产品
            </button>
            <button onclick="showAdminSubTab('payment-history')" 
                    class="admin-subtab py-3 px-1 border-b-2 font-medium"
                    data-subtab="payment-history">
              <i class="fas fa-receipt mr-2"></i>支付历史
            </button>
          </nav>
        </div>
      `;
      break;
  }
  
  subtabsContainer.innerHTML = subtabsHTML;
  
  // Show default sub-tab
  showAdminSubTab(defaultSubTab);
}

// Show admin sub-tab content
async function showAdminSubTab(subtab) {
  currentAdminSubTab = subtab;
  
  // Update active sub-tab
  document.querySelectorAll('.admin-subtab').forEach(btn => {
    btn.classList.remove('active');
  });
  const subtabBtn = document.querySelector(`[data-subtab="${subtab}"]`);
  if (subtabBtn) {
    subtabBtn.classList.add('active');
  }

  const content = document.getElementById('admin-content');
  
  switch(subtab) {
    case 'users':
      await showUsersManagement(content);
      break;
    case 'templates':
      await showTemplatesManagement(content);
      break;
    case 'notifications':
      showNotificationsPanel(content);
      break;
    case 'stats':
      await showStatsPanel(content);
      break;
    case 'testimonials':
      await showTestimonialsManagement(content);
      break;
    case 'publicReviews':
      await showPublicReviewsManagement(content);
      break;
    case 'subscription':
      await showSubscriptionManagement(content);
      break;
    case 'keywords':
      await showKeywordsManagement(content);
      break;
    case 'uiSettings':
      await showUISettingsManagement(content);
      break;
    case 'aiSettings':
      await showAISettingsManagement(content);
      break;
    case 'marketplace-agents':
      await showMarketplaceAgentsManagement(content);
      break;
    case 'writing-templates':
      await loadWritingTemplates();
      break;
    case 'marketplace-other':
      await showMarketplaceOtherManagement(content);
      break;
    case 'payment-history':
      await showPaymentHistoryManagement(content);
      break;
  }
}

// Legacy function for backward compatibility
async function showAdminTab(tab) {
  // Map old tab names to new structure
  const tabMapping = {
    'users': ['system', 'users'],
    'templates': ['marketplace', 'templates'],
    'notifications': ['system', 'notifications'],
    'stats': ['system', 'stats'],
    'testimonials': ['system', 'testimonials'],
    'publicReviews': ['system', 'publicReviews'],
    'keywords': ['system', 'keywords'],
    'aiSettings': ['agents', 'aiSettings'],
    'subscription': ['marketplace', 'subscription'],
    'marketplace': ['marketplace', 'subscription']
  };
  
  if (tabMapping[tab]) {
    const [category, subtab] = tabMapping[tab];
    showAdminCategory(category);
    // showAdminSubTab will be called automatically by showAdminCategory
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
          <button onclick="showCreateUserModal()" 
                  class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            <i class="fas fa-plus mr-2"></i>${i18n.t('createUser')}
          </button>
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
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">${i18n.t('reviewCount') || '复盘数'}</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">${i18n.t('templateCount') || '模板数'}</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">${i18n.t('loginCount') || '登录次数'}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('expiryDate') || '有效期限'}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('lastLogin') || '最后登录'}</th>
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
                <span class="px-2 py-1 text-xs rounded-full ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                  user.role === 'premium' ? 'bg-purple-100 text-purple-800' : 
                  'bg-gray-100 text-gray-800'
                }">
                  ${i18n.t(user.role + 'Role')}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <i class="fas fa-clipboard-list mr-1"></i>
                  ${user.review_count || 0}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <i class="fas fa-file-alt mr-1"></i>
                  ${user.template_count || 0}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <i class="fas fa-sign-in-alt mr-1"></i>
                  ${user.login_count || 0}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                ${(() => {
                  if (!user.subscription_expires_at) {
                    return `<span class="text-gray-400">${i18n.t('forever') || '永久'}</span>`;
                  }
                  const expiryDate = new Date(user.subscription_expires_at);
                  const year = expiryDate.getFullYear();
                  // Check if it's a special "forever" date (year 9999)
                  if (year >= 9999) {
                    return `<span class="text-gray-400">${i18n.t('forever') || '永久'}</span>`;
                  }
                  return `<span class="text-gray-900 font-medium">${expiryDate.toLocaleDateString()}</span>`;
                })()}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                ${user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '<span class="text-gray-400">No</span>'}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                ${new Date(user.created_at).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 text-right text-sm">
                <div class="flex justify-end space-x-2">
                  <button onclick="showEditUserModal(${user.id})" 
                          class="text-blue-600 hover:text-blue-900"
                          title="${i18n.t('editUser')}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="showResetPasswordModal(${user.id})" 
                          class="text-orange-600 hover:text-orange-900"
                          title="${i18n.t('resetUserPassword')}">
                    <i class="fas fa-key"></i>
                  </button>
                  ${user.id !== currentUser.id ? `
                    <button onclick="deleteUser(${user.id})" 
                            class="text-red-600 hover:text-red-900"
                            title="${i18n.t('delete')}">
                      <i class="fas fa-trash"></i>
                    </button>
                  ` : ''}
                </div>
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
          
          <!-- User Selection Section (hidden by default) -->
          <div id="selection-note-section" style="display: none;">
            <div class="space-y-4">
              <!-- Quick Select by Role -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  <i class="fas fa-users-cog mr-2"></i>${i18n.t('quickSelectByRole') || '按角色快速选择'}
                </label>
                <div class="flex flex-wrap gap-2">
                  <button type="button" onclick="selectUsersByRole('all')" 
                          class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                    <i class="fas fa-users mr-1"></i>${i18n.t('selectAll') || '全选'}
                  </button>
                  <button type="button" onclick="selectUsersByRole('admin')" 
                          class="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                    <i class="fas fa-user-shield mr-1"></i>${i18n.t('adminRole') || '管理员'}
                  </button>
                  <button type="button" onclick="selectUsersByRole('premium')" 
                          class="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700">
                    <i class="fas fa-star mr-1"></i>${i18n.t('premiumRole') || '高级用户'}
                  </button>
                  <button type="button" onclick="selectUsersByRole('user')" 
                          class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                    <i class="fas fa-user mr-1"></i>${i18n.t('userRole') || '普通用户'}
                  </button>
                  <button type="button" onclick="selectUsersByRole('none')" 
                          class="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                    <i class="fas fa-times mr-1"></i>${i18n.t('clearSelection') || '清除选择'}
                  </button>
                </div>
              </div>
              
              <!-- User List -->
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <span class="text-sm font-medium text-gray-700">
                    <i class="fas fa-list mr-2"></i>${i18n.t('userList') || '用户列表'}
                  </span>
                  <span id="selected-count" class="text-sm text-indigo-600 ml-2">
                    (${i18n.t('selected') || '已选择'}: 0)
                  </span>
                </div>
                <div id="notification-user-list" class="max-h-64 overflow-y-auto">
                  <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i>${i18n.t('loading') || '加载中...'}
                  </div>
                </div>
              </div>
            </div>
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
  
  // Load users list when panel is shown
  loadNotificationUsersList();
}

let notificationUsers = [];

async function loadNotificationUsersList() {
  try {
    const response = await axios.get('/api/admin/users');
    notificationUsers = response.data.users;
    renderNotificationUsersList();
  } catch (error) {
    console.error('Failed to load users:', error);
    document.getElementById('notification-user-list').innerHTML = `
      <div class="text-center py-4 text-red-500">
        <i class="fas fa-exclamation-circle mr-2"></i>${i18n.t('loadFailed') || '加载失败'}
      </div>
    `;
  }
}

function renderNotificationUsersList() {
  const container = document.getElementById('notification-user-list');
  
  if (notificationUsers.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <i class="fas fa-inbox mr-2"></i>${i18n.t('noUsers') || '暂无用户'}
      </div>
    `;
    return;
  }
  
  const getRoleBadge = (role) => {
    const badges = {
      admin: '<span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"><i class="fas fa-user-shield mr-1"></i>管理员</span>',
      premium: '<span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full"><i class="fas fa-star mr-1"></i>高级用户</span>',
      user: '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"><i class="fas fa-user mr-1"></i>普通用户</span>'
    };
    return badges[role] || badges.user;
  };
  
  container.innerHTML = `
    <div class="divide-y divide-gray-200">
      ${notificationUsers.map(user => `
        <label class="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" 
                 class="notification-user-checkbox rounded text-indigo-600 mr-3" 
                 value="${user.id}"
                 data-role="${user.role}"
                 onchange="updateSelectedCount()">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900">${escapeHtml(user.username)}</div>
                <div class="text-sm text-gray-500">${escapeHtml(user.email)}</div>
              </div>
              <div>
                ${getRoleBadge(user.role)}
              </div>
            </div>
          </div>
        </label>
      `).join('')}
    </div>
  `;
  
  updateSelectedCount();
}

function selectUsersByRole(role) {
  const checkboxes = document.querySelectorAll('.notification-user-checkbox');
  
  checkboxes.forEach(cb => {
    if (role === 'all') {
      cb.checked = true;
    } else if (role === 'none') {
      cb.checked = false;
    } else {
      cb.checked = cb.dataset.role === role;
    }
  });
  
  updateSelectedCount();
}

function updateSelectedCount() {
  const selected = document.querySelectorAll('.notification-user-checkbox:checked').length;
  const countEl = document.getElementById('selected-count');
  if (countEl) {
    countEl.textContent = `(${i18n.t('selected') || '已选择'}: ${selected})`;
  }
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
    const selectedUsers = Array.from(document.querySelectorAll('.notification-user-checkbox:checked'))
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
      // Clear selections
      document.querySelectorAll('.notification-user-checkbox').forEach(cb => cb.checked = false);
      updateSelectedCount();
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

// Testimonials Management (Admin only)
async function showTestimonialsManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-comments mr-2"></i>${i18n.t('testimonialsManagement') || '留言管理'}
        </h2>
        <button onclick="showCreateTestimonialModal()" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-plus mr-2"></i>${i18n.t('addTestimonial') || '添加留言'}
        </button>
      </div>
      <div id="testimonials-table">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
        </div>
      </div>
    </div>
  `;
  
  await loadTestimonialsTable();
}

async function loadTestimonialsTable() {
  const testimonialsTable = document.getElementById('testimonials-table');
  
  try {
    const response = await axios.get('/api/testimonials/admin/all');
    const { testimonials } = response.data;
    
    if (testimonials.length === 0) {
      testimonialsTable.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-comments text-4xl mb-3"></i>
          <p>${i18n.t('noTestimonials') || '暂无留言'}</p>
        </div>
      `;
      return;
    }
    
    testimonialsTable.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('name') || '姓名'}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('role') || '角色'}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('content') || '内容'}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('rating') || '评分'}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('featured') || '精选'}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('order') || '排序'}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${i18n.t('actions') || '操作'}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${testimonials.map(t => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">${escapeHtml(t.name)}</div>
                  ${t.name_en ? `<div class="text-xs text-gray-500">${escapeHtml(t.name_en)}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">${escapeHtml(t.role)}</div>
                  ${t.role_en ? `<div class="text-xs text-gray-500">${escapeHtml(t.role_en)}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate">${escapeHtml(t.content)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-yellow-400">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.is_featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${t.is_featured ? (i18n.t('yes') || '是') : (i18n.t('no') || '否')}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${t.display_order}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onclick="showEditTestimonialModal(${t.id})" 
                          class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteTestimonial(${t.id})" 
                          class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load testimonials:', error);
    testimonialsTable.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-circle text-4xl mb-3"></i>
        <p>${i18n.t('loadError') || '加载失败'}</p>
      </div>
    `;
  }
}

function showCreateTestimonialModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">
        <i class="fas fa-plus-circle mr-2"></i>${i18n.t('addTestimonial') || '添加留言'}
      </h3>
      <form id="create-testimonial-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('name') || '姓名'} (中文) *</label>
            <input type="text" id="testimonial-name" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('name') || '姓名'} (English)</label>
            <input type="text" id="testimonial-name-en"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('role') || '角色'} (中文) *</label>
            <input type="text" id="testimonial-role" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('role') || '角色'} (English)</label>
            <input type="text" id="testimonial-role-en"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('content') || '内容'} (中文) *</label>
          <textarea id="testimonial-content" required rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('content') || '内容'} (English)</label>
          <textarea id="testimonial-content-en" rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('rating') || '评分'} *</label>
            <select id="testimonial-rating" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="5">5 ★★★★★</option>
              <option value="4">4 ★★★★☆</option>
              <option value="3">3 ★★★☆☆</option>
              <option value="2">2 ★★☆☆☆</option>
              <option value="1">1 ★☆☆☆☆</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('displayOrder') || '显示顺序'}</label>
            <input type="number" id="testimonial-order" value="0" min="0"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          <div class="flex items-end">
            <label class="flex items-center">
              <input type="checkbox" id="testimonial-featured" class="mr-2">
              <span class="text-sm font-medium text-gray-700">${i18n.t('featured') || '设为精选'}</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" onclick="this.closest('.fixed').remove()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            ${i18n.t('cancel') || '取消'}
          </button>
          <button type="submit" 
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            ${i18n.t('create') || '创建'}
          </button>
        </div>
      </form>
    </div>
  `;
  
  modal.querySelector('#create-testimonial-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createTestimonial(modal);
  });
  
  document.body.appendChild(modal);
}

async function createTestimonial(modal) {
  const submitBtn = modal.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
  
  try {
    const data = {
      name: document.getElementById('testimonial-name').value,
      name_en: document.getElementById('testimonial-name-en').value || null,
      role: document.getElementById('testimonial-role').value,
      role_en: document.getElementById('testimonial-role-en').value || null,
      content: document.getElementById('testimonial-content').value,
      content_en: document.getElementById('testimonial-content-en').value || null,
      rating: parseInt(document.getElementById('testimonial-rating').value),
      display_order: parseInt(document.getElementById('testimonial-order').value),
      is_featured: document.getElementById('testimonial-featured').checked
    };
    
    await axios.post('/api/testimonials/admin', data);
    
    showNotification(i18n.t('testimonialCreated') || '留言创建成功', 'success');
    modal.remove();
    await loadTestimonialsTable();
  } catch (error) {
    console.error('Failed to create testimonial:', error);
    showNotification(error.response?.data?.error || (i18n.t('operationFailed') || '操作失败'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function showEditTestimonialModal(id) {
  try {
    const response = await axios.get(`/api/testimonials/admin/${id}`);
    const t = response.data.testimonial;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-edit mr-2"></i>${i18n.t('editTestimonial') || '编辑留言'}
        </h3>
        <form id="edit-testimonial-form" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('name') || '姓名'} (中文) *</label>
              <input type="text" id="edit-testimonial-name" value="${escapeHtml(t.name)}" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('name') || '姓名'} (English)</label>
              <input type="text" id="edit-testimonial-name-en" value="${escapeHtml(t.name_en || '')}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('role') || '角色'} (中文) *</label>
              <input type="text" id="edit-testimonial-role" value="${escapeHtml(t.role)}" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('role') || '角色'} (English)</label>
              <input type="text" id="edit-testimonial-role-en" value="${escapeHtml(t.role_en || '')}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('content') || '内容'} (中文) *</label>
            <textarea id="edit-testimonial-content" required rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(t.content)}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('content') || '内容'} (English)</label>
            <textarea id="edit-testimonial-content-en" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(t.content_en || '')}</textarea>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('rating') || '评分'} *</label>
              <select id="edit-testimonial-rating" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="5" ${t.rating === 5 ? 'selected' : ''}>5 ★★★★★</option>
                <option value="4" ${t.rating === 4 ? 'selected' : ''}>4 ★★★★☆</option>
                <option value="3" ${t.rating === 3 ? 'selected' : ''}>3 ★★★☆☆</option>
                <option value="2" ${t.rating === 2 ? 'selected' : ''}>2 ★★☆☆☆</option>
                <option value="1" ${t.rating === 1 ? 'selected' : ''}>1 ★☆☆☆☆</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18n.t('displayOrder') || '显示顺序'}</label>
              <input type="number" id="edit-testimonial-order" value="${t.display_order}" min="0"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div class="flex items-end">
              <label class="flex items-center">
                <input type="checkbox" id="edit-testimonial-featured" ${t.is_featured ? 'checked' : ''} class="mr-2">
                <span class="text-sm font-medium text-gray-700">${i18n.t('featured') || '设为精选'}</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              ${i18n.t('cancel') || '取消'}
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              ${i18n.t('save') || '保存'}
            </button>
          </div>
        </form>
      </div>
    `;
    
    modal.querySelector('#edit-testimonial-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateTestimonial(id, modal);
    });
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Failed to load testimonial:', error);
    showNotification(i18n.t('loadError') || '加载失败', 'error');
  }
}

async function updateTestimonial(id, modal) {
  const submitBtn = modal.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
  
  try {
    const data = {
      name: document.getElementById('edit-testimonial-name').value,
      name_en: document.getElementById('edit-testimonial-name-en').value || null,
      role: document.getElementById('edit-testimonial-role').value,
      role_en: document.getElementById('edit-testimonial-role-en').value || null,
      content: document.getElementById('edit-testimonial-content').value,
      content_en: document.getElementById('edit-testimonial-content-en').value || null,
      rating: parseInt(document.getElementById('edit-testimonial-rating').value),
      display_order: parseInt(document.getElementById('edit-testimonial-order').value),
      is_featured: document.getElementById('edit-testimonial-featured').checked
    };
    
    await axios.put(`/api/testimonials/admin/${id}`, data);
    
    showNotification(i18n.t('testimonialUpdated') || '留言更新成功', 'success');
    modal.remove();
    await loadTestimonialsTable();
  } catch (error) {
    console.error('Failed to update testimonial:', error);
    showNotification(error.response?.data?.error || (i18n.t('operationFailed') || '操作失败'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function deleteTestimonial(id) {
  if (!confirm(i18n.t('confirmDelete') || '确定要删除这条留言吗？')) return;
  
  try {
    await axios.delete(`/api/testimonials/admin/${id}`);
    showNotification(i18n.t('testimonialDeleted') || '留言删除成功', 'success');
    await loadTestimonialsTable();
  } catch (error) {
    console.error('Failed to delete testimonial:', error);
    showNotification(error.response?.data?.error || (i18n.t('operationFailed') || '操作失败'), 'error');
  }
}

async function deleteReview(id) {
  if (!confirm(i18n.t('confirmDelete'))) return;
  
  try {
    await axios.delete(`/api/reviews/${id}`);
    showNotification(i18n.t('deleteSuccess'), 'success');
    
    // Refresh the current view
    if (currentView === 'reviews') {
      await loadAllReviews();
    } else if (currentView === 'dashboard') {
      await loadDashboardData();
    } else {
      // For other views like review detail, go back to reviews list
      await showReviews();
    }
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Google Login Handler
async function handleGoogleLogin(response) {
  try {
    console.log('Google login response received');
    
    // Send Google credential to backend
    const result = await axios.post('/api/auth/google', {
      credential: response.credential
    });

    // Store token and user info (consistent with email login)
    authToken = result.data.token;
    currentUser = result.data.user;
    window.currentUser = currentUser;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    console.log('Google login successful:', currentUser);
    
    // Set user's preferred language
    if (currentUser.language) {
      i18n.setLanguage(currentUser.language);
    }
    
    // Redirect to dashboard
    showDashboard();
  } catch (error) {
    console.error('Google login error:', error);
    alert(i18n.t('loginFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

// ============ Change Password ============
function showChangePassword() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onclick="showDashboard()" class="mb-4 text-indigo-600 hover:text-indigo-800 text-sm">
          <i class="fas fa-arrow-left mr-2"></i>${i18n.t('back')}
        </button>
        
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-key text-indigo-600 mr-2"></i>${i18n.t('changePassword')}
        </h2>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">${i18n.t('currentPassword')}</label>
          <input type="password" id="current-password" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('currentPassword')}">
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">${i18n.t('newPassword')}</label>
          <input type="password" id="new-password" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('newPassword')}">
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">${i18n.t('confirmNewPassword')}</label>
          <input type="password" id="confirm-new-password" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('confirmNewPassword')}">
        </div>
        
        <button onclick="handleChangePassword()" 
                class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
          ${i18n.t('changePassword')}
        </button>
      </div>
    </div>
  `;
}

async function handleChangePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-new-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert(i18n.t('operationFailed') + ': All fields are required');
    return;
  }

  if (newPassword.length < 6) {
    alert(i18n.t('operationFailed') + ': Password must be at least 6 characters');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert(i18n.t('operationFailed') + ': New passwords do not match');
    return;
  }

  try {
    await axios.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    alert(i18n.t('passwordChanged'));
    showDashboard();
  } catch (error) {
    console.error('Change password error:', error);
    alert(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

// ============ Forgot Password ============
// Step 1: Request Password Reset (Send Email)
function showForgotPassword() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onclick="showLogin()" class="mb-4 text-indigo-600 hover:text-indigo-800 text-sm">
          <i class="fas fa-arrow-left mr-2"></i>${i18n.t('backToLogin')}
        </button>
        
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-envelope text-indigo-600 mr-2"></i>${i18n.t('requestPasswordReset')}
        </h2>
        <p class="text-gray-600 text-sm mb-6">
          ${i18n.t('enterEmail')}. ${i18n.t('checkEmailForReset')}.
        </p>
        
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">${i18n.t('email')}</label>
          <input type="email" id="reset-email" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('email')}"
                 onkeypress="if(event.key === 'Enter') handleRequestPasswordReset()">
        </div>
        
        <button onclick="handleRequestPasswordReset()" 
                class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition mb-4">
          <i class="fas fa-paper-plane mr-2"></i>${i18n.t('sendResetLink')}
        </button>
        
        <div class="text-center">
          <button onclick="showLogin()" class="text-sm text-gray-600 hover:text-indigo-600">
            ${i18n.t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleRequestPasswordReset() {
  const email = document.getElementById('reset-email').value;

  if (!email) {
    alert(i18n.t('operationFailed') + ': Email is required');
    return;
  }

  try {
    await axios.post('/api/auth/request-password-reset', { email });
    
    alert(i18n.t('resetLinkSent') + '\n\n' + i18n.t('checkEmailForReset'));
    showLogin();
  } catch (error) {
    console.error('Request password reset error:', error);
    alert(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

// Step 2: Reset Password with Token (From Email Link)
function showResetPasswordWithToken() {
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    alert(i18n.t('resetTokenInvalid'));
    showLogin();
    return;
  }
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-key text-indigo-600 mr-2"></i>${i18n.t('setNewPassword')}
        </h2>
        <p class="text-gray-600 text-sm mb-6">
          Please enter your new password.
        </p>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">${i18n.t('newPassword')}</label>
          <input type="password" id="reset-new-password" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('newPassword')}">
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">${i18n.t('confirmNewPassword')}</label>
          <input type="password" id="reset-confirm-password" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('confirmNewPassword')}"
                 onkeypress="if(event.key === 'Enter') handleResetPassword('${token}')">
        </div>
        
        <button onclick="handleResetPassword('${token}')" 
                class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition mb-4">
          ${i18n.t('resetPassword')}
        </button>
        
        <div class="text-center">
          <button onclick="showLogin()" class="text-sm text-gray-600 hover:text-indigo-600">
            ${i18n.t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleResetPassword(token) {
  const newPassword = document.getElementById('reset-new-password').value;
  const confirmPassword = document.getElementById('reset-confirm-password').value;

  if (!newPassword || !confirmPassword) {
    alert(i18n.t('operationFailed') + ': All fields are required');
    return;
  }

  if (newPassword.length < 6) {
    alert(i18n.t('operationFailed') + ': Password must be at least 6 characters');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert(i18n.t('operationFailed') + ': Passwords do not match');
    return;
  }

  try {
    await axios.post('/api/auth/reset-password', {
      token,
      newPassword
    });
    
    alert(i18n.t('passwordReset') + '\n\nYou can now login with your new password.');
    showLogin();
  } catch (error) {
    console.error('Reset password error:', error);
    const errorMsg = error.response?.data?.error || error.message;
    alert(i18n.t('operationFailed') + ': ' + errorMsg);
    
    // If token is invalid/expired, redirect to forgot password page
    if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
      showForgotPassword();
    }
  }
}

// ============ Create User (Admin) ============
function showCreateUserModal() {
  const modalHtml = `
    <div id="create-user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         onclick="if(event.target === this) closeCreateUserModal()">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-user-plus text-indigo-600 mr-2"></i>${i18n.t('createUser')}
        </h3>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">${i18n.t('email')}</label>
          <input type="email" id="new-user-email" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('email')}">
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">${i18n.t('username')}</label>
          <input type="text" id="new-user-username" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('username')}">
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">${i18n.t('password')}</label>
          <input type="password" id="new-user-password" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('password')}">
        </div>
        
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">${i18n.t('role')}</label>
          <select id="new-user-role" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="user">${i18n.t('userRole')}</option>
            <option value="premium">${i18n.t('premiumRole')}</option>
            <option value="admin">${i18n.t('adminRole')}</option>
          </select>
        </div>
        
        <div class="flex space-x-4">
          <button onclick="handleCreateUser()" 
                  class="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
            ${i18n.t('createUser')}
          </button>
          <button onclick="closeCreateUserModal()" 
                  class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition">
            ${i18n.t('cancel')}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeCreateUserModal() {
  const modal = document.getElementById('create-user-modal');
  if (modal) {
    modal.remove();
  }
}

async function handleCreateUser() {
  const email = document.getElementById('new-user-email').value;
  const username = document.getElementById('new-user-username').value;
  const password = document.getElementById('new-user-password').value;
  const role = document.getElementById('new-user-role').value;

  if (!email || !username || !password) {
    alert(i18n.t('operationFailed') + ': All fields are required');
    return;
  }

  if (password.length < 6) {
    alert(i18n.t('operationFailed') + ': Password must be at least 6 characters');
    return;
  }

  try {
    await axios.post('/api/admin/users', {
      email,
      username,
      password,
      role
    });
    
    alert(i18n.t('createSuccess'));
    closeCreateUserModal();
    await loadUsersTable();
  } catch (error) {
    console.error('Create user error:', error);
    alert(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message));
  }
}

// Switch between team tabs
function switchTeamsTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.teams-tab').forEach(btn => {
    btn.classList.remove('border-indigo-600', 'text-indigo-600');
    btn.classList.add('border-transparent', 'text-gray-500');
  });
  document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-500');
  document.getElementById(`tab-${tab}`).classList.add('border-indigo-600', 'text-indigo-600');
  
  // Update content visibility
  document.querySelectorAll('.teams-tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById(`teams-${tab}`).classList.remove('hidden');
}

// Apply to join a public team
async function applyToTeam(teamId) {
  const message = prompt('请输入申请理由（可选）:');
  if (message === null) return; // User cancelled
  
  try {
    await axios.post(`/api/teams/${teamId}/apply`, { message });
    showNotification('申请已提交，请等待团队管理员审批', 'success');
    await loadTeams(); // Refresh to update button state
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Review team application (approve or reject)
async function reviewApplication(teamId, applicationId, action) {
  const actionText = action === 'approve' ? '确认' : '拒绝';
  if (!confirm(`确定要${actionText}此申请吗？`)) return;
  
  try {
    await axios.post(`/api/teams/${teamId}/applications/${applicationId}/review`, { action });
    showNotification(action === 'approve' ? '已批准申请' : '已拒绝申请', 'success');
    await loadTeams(); // Refresh applications list
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============ User Settings ============

async function showUserSettings() {
  currentView = 'user-settings';
  
  try {
    // Load current user settings from backend
    const response = await axios.get('/api/auth/settings');
    const settings = response.data;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-6">
              <i class="fas fa-user-cog text-indigo-600 mr-3"></i>${i18n.t('userSettings')}
            </h2>
            
            <!-- Account Settings Section -->
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                <i class="fas fa-id-card text-indigo-500 mr-2"></i>${i18n.t('accountSettings')}
              </h3>
              
              <div class="space-y-4">
                <!-- Username -->
                <div>
                  <label class="block text-gray-700 font-medium mb-2">
                    <i class="fas fa-user mr-2"></i>${i18n.t('username')}
                  </label>
                  <input type="text" id="settings-username" value="${settings.username}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <!-- Email -->
                <div>
                  <label class="block text-gray-700 font-medium mb-2">
                    <i class="fas fa-envelope mr-2"></i>${i18n.t('email')}
                  </label>
                  <input type="email" id="settings-email" value="${settings.email}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <!-- Language Preference -->
                <div>
                  <label class="block text-gray-700 font-medium mb-2">
                    <i class="fas fa-language mr-2"></i>${i18n.t('languagePreference')}
                  </label>
                  <select id="settings-language" 
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="zh" ${settings.language === 'zh' ? 'selected' : ''}>${i18n.t('chinese')}</option>
                    <option value="en" ${settings.language === 'en' ? 'selected' : ''}>${i18n.t('english')}</option>
                    <option value="ja" ${settings.language === 'ja' ? 'selected' : ''}>${i18n.t('japanese')}</option>
                    <option value="es" ${settings.language === 'es' ? 'selected' : ''}>${i18n.t('spanish')}</option>
                  </select>
                </div>
              </div>
              
              <!-- Save Button -->
              <div class="mt-6">
                <button onclick="handleSaveSettings()" 
                        class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
                  <i class="fas fa-save mr-2"></i>${i18n.t('saveChanges')}
                </button>
              </div>
            </div>
            
            <!-- User Level Management Section -->
            <div class="mt-8">
              <h3 class="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                <i class="fas fa-star text-yellow-500 mr-2"></i>${i18n.t('userLevelManagement') || '用户级别管理'}
              </h3>
              
              <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-indigo-200">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Current Level -->
                    <div>
                      <p class="text-sm text-gray-600 mb-1">${i18n.t('currentLevel') || '当前级别'}</p>
                      <p class="text-2xl font-bold ${
                        settings.subscription_tier === 'super' ? 'text-orange-600' : 
                        settings.subscription_tier === 'premium' ? 'text-yellow-600' : 
                        'text-gray-700'
                      }">
                        <i class="fas ${
                          settings.subscription_tier === 'super' ? 'fa-gem' : 
                          settings.subscription_tier === 'premium' ? 'fa-crown' : 
                          'fa-user-circle'
                        } mr-2"></i>
                        ${
                          settings.subscription_tier === 'super' ? (i18n.t('superMember') || '超级会员') :
                          settings.subscription_tier === 'premium' ? (i18n.t('premiumMember') || '高级会员') : 
                          (i18n.t('freeUser') || '免费用户')
                        }
                      </p>
                    </div>
                    
                    <!-- Expiry Date -->
                    <div>
                      <p class="text-sm text-gray-600 mb-1">${i18n.t('expiryDate') || '有效期'}</p>
                      <p class="text-xl font-semibold text-gray-800">
                        ${settings.subscription_expires_at 
                          ? new Date(settings.subscription_expires_at).toLocaleDateString() 
                          : (i18n.t('forever') || '永久')}
                      </p>
                      ${(settings.subscription_tier === 'premium' || settings.subscription_tier === 'super') && settings.subscription_expires_at && settings.subscription_expires_at !== '9999-12-31 23:59:59' ? `
                        <p class="text-xs text-gray-500 mt-1">
                          ${(() => {
                            const daysLeft = Math.ceil((new Date(settings.subscription_expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                            return daysLeft > 0 ? (i18n.t('daysRemaining') || '剩余天数') + ': ' + daysLeft : (i18n.t('expired') || '已过期');
                          })()}
                        </p>
                      ` : ''}
                    </div>
                    
                    <!-- Action Button -->
                    <div class="flex items-center justify-end">
                      <button onclick="showUpgradeModal()" 
                              class="bg-gradient-to-r ${
                                (settings.subscription_tier === 'premium' || settings.subscription_tier === 'super') 
                                  ? 'from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' 
                                  : 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                              } text-white px-8 py-3 rounded-lg transition font-semibold shadow-lg transform hover:scale-105">
                        <i class="fas ${
                          (settings.subscription_tier === 'premium' || settings.subscription_tier === 'super') 
                            ? 'fa-sync-alt' 
                            : 'fa-arrow-up'
                        } mr-2"></i>
                        ${
                          (settings.subscription_tier === 'premium' || settings.subscription_tier === 'super') 
                            ? (i18n.t('renew') || '续费') 
                            : (i18n.t('upgrade') || '升级')
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Password Change Section -->
            <div class="mt-8">
              <h3 class="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                <i class="fas fa-key text-indigo-500 mr-2"></i>${i18n.t('changePassword')}
              </h3>
              
              <div class="space-y-4">
                <!-- Current Password -->
                <div>
                  <label class="block text-gray-700 font-medium mb-2">
                    ${i18n.t('currentPassword')}
                  </label>
                  <input type="password" id="settings-current-password" 
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="${i18n.t('currentPassword')}">
                </div>
                
                <!-- New Password -->
                <div>
                  <label class="block text-gray-700 font-medium mb-2">
                    ${i18n.t('newPassword')}
                  </label>
                  <input type="password" id="settings-new-password" 
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="${i18n.t('newPassword')}">
                </div>
                
                <!-- Confirm New Password -->
                <div>
                  <label class="block text-gray-700 font-medium mb-2">
                    ${i18n.t('confirmNewPassword')}
                  </label>
                  <input type="password" id="settings-confirm-password" 
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                         placeholder="${i18n.t('confirmNewPassword')}">
                </div>
              </div>
              
              <!-- Change Password Button -->
              <div class="mt-6">
                <button onclick="handleChangePasswordFromSettings()" 
                        class="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-semibold">
                  <i class="fas fa-lock mr-2"></i>${i18n.t('changePassword')}
                </button>
              </div>
            </div>
            
            <!-- Back Button -->
            <div class="mt-8">
              <button onclick="showDashboard()" 
                      class="text-indigo-600 hover:text-indigo-800 font-medium">
                <i class="fas fa-arrow-left mr-2"></i>${i18n.t('backToHome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load settings error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
    showDashboard();
  }
}

async function handleSaveSettings() {
  const username = document.getElementById('settings-username').value.trim();
  const email = document.getElementById('settings-email').value.trim();
  const language = document.getElementById('settings-language').value;
  
  if (!username || !email) {
    showNotification(i18n.t('fillAllFields'), 'error');
    return;
  }
  
  try {
    const response = await axios.put('/api/auth/settings', {
      username,
      email,
      language
    });
    
    // Update currentUser with new data
    currentUser = response.data.user;
    window.currentUser = currentUser;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    showNotification(i18n.t('settingsUpdated'), 'success');
    
    // If language changed, reload to apply new language and show home page
    if (language !== i18n.getCurrentLanguage()) {
      setTimeout(() => {
        // Set flag to show home page after reload
        sessionStorage.setItem('showHomeAfterReload', 'true');
        i18n.setLanguage(language);
      }, 1000);
    } else {
      // Refresh the settings page to show updated data
      setTimeout(() => {
        showUserSettings();
      }, 1000);
    }
  } catch (error) {
    console.error('Save settings error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function handleChangePasswordFromSettings() {
  const currentPassword = document.getElementById('settings-current-password').value;
  const newPassword = document.getElementById('settings-new-password').value;
  const confirmPassword = document.getElementById('settings-confirm-password').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification(i18n.t('fillAllFields'), 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification(i18n.t('passwordMismatch'), 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification(i18n.t('passwordTooShort'), 'error');
    return;
  }
  
  try {
    await axios.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    showNotification(i18n.t('passwordChanged'), 'success');
    
    // Clear password fields
    document.getElementById('settings-current-password').value = '';
    document.getElementById('settings-new-password').value = '';
    document.getElementById('settings-confirm-password').value = '';
  } catch (error) {
    console.error('Change password error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Handle upgrade to premium account
// ============ Template Management Functions ============

let allTemplates = [];
let currentEditingTemplate = null;

// Wrapper function for navigation menu to show templates management page
function showTemplatesManagementPage() {
  const container = document.getElementById('main-content');
  container.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">
          <i class="fas fa-th-list mr-3"></i>${i18n.t('templateManagement')}
        </h1>
        <p class="text-gray-600 mt-2">${i18n.t('templateManagementDesc') || '管理复盘模板和问题'}</p>
      </div>
      <div id="templates-container"></div>
    </div>
  `;
  showTemplatesManagement(document.getElementById('templates-container'));
}

async function showTemplatesManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-clipboard-list mr-2"></i>${i18n.t('templateManagement')}
        </h2>
        <button onclick="showCreateTemplateModal()" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-plus mr-2"></i>创建复盘模板
        </button>
      </div>
      <div id="templates-table">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
        </div>
      </div>
    </div>
  `;

  await loadTemplatesTable();
}

async function loadTemplatesTable() {
  try {
    const response = await axios.get('/api/templates/admin/all');
    allTemplates = response.data.templates;
    renderTemplatesTable(allTemplates);
  } catch (error) {
    document.getElementById('templates-table').innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>${i18n.t('operationFailed')}</p>
      </div>
    `;
  }
}

function renderTemplatesTable(templates) {
  const container = document.getElementById('templates-table');
  
  if (!templates || templates.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-clipboard-list text-4xl mb-4"></i>
        <p>${i18n.t('noTemplates')}</p>
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
              ${i18n.t('templateName')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('type') || '类型'}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('creator') || '创建者'}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('questionCount')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('templatePrice')} (普通/高级/超级)
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('templateOwner')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('isDefault')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('status')}
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${i18n.t('actions')}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${templates.map(template => `
            <tr class="${!template.is_active ? 'bg-gray-100' : ''}">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(template.name)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${template.creator_role === 'admin' || !template.creator_name ? 
                  `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    <i class="fas fa-crown mr-1"></i>${i18n.t('systemTemplate')}
                  </span>` : 
                  `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <i class="fas fa-user mr-1"></i>${i18n.t('userTemplate')}
                  </span>`
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                  <span class="text-sm text-gray-700">${escapeHtml(template.creator_name || i18n.t('system'))}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">${template.question_count}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  ${(template.price_basic > 0 || template.price_premium > 0 || template.price_super > 0) ? 
                    `<div class="flex flex-col space-y-1">
                      <span class="text-xs text-gray-600">普通: $${parseFloat(template.price_basic || 0).toFixed(2)}</span>
                      <span class="text-xs text-blue-600">高级: $${parseFloat(template.price_premium || 0).toFixed(2)}</span>
                      <span class="text-xs text-purple-600">超级: $${parseFloat(template.price_super || 0).toFixed(2)}</span>
                    </div>` : 
                    `<span class="text-green-600">${i18n.t('free')}</span>`}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  template.owner === 'private' ? 'bg-red-100 text-red-800' : 
                  template.owner === 'team' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }">
                  ${template.owner ? i18n.t('templateOwner' + template.owner.charAt(0).toUpperCase() + template.owner.slice(1)) : i18n.t('templateOwnerPublic')}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${template.is_default ? 
                  `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    <i class="fas fa-check mr-1"></i>${i18n.t('yes')}
                  </span>` : 
                  `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    ${i18n.t('no')}
                  </span>`
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${template.is_active ? 
                  `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${i18n.t('active')}
                  </span>` : 
                  `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    ${i18n.t('inactive')}
                  </span>`
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-3">
                  <button onclick="showManageQuestionsModal(${template.id})" 
                          class="text-gray-600 hover:text-gray-900" title="${i18n.t('manageQuestions')}">
                    <i class="fas fa-list"></i>
                  </button>
                  <button onclick="showEditTemplateModal(${template.id})" 
                          class="text-blue-600 hover:text-blue-900" title="${i18n.t('edit')}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="toggleTemplateStatus(${template.id}, ${template.is_active})" 
                          class="${template.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}" 
                          title="${template.is_active ? '下架' : '上架'}">
                    <i class="fas fa-power-off"></i>
                  </button>
                  <button onclick="copyReviewTemplate(${template.id})" 
                          class="text-purple-600 hover:text-purple-900" title="复制">
                    <i class="fas fa-copy"></i>
                  </button>
                  <button onclick="downloadReviewTemplate(${template.id})" 
                          class="text-indigo-600 hover:text-indigo-900" title="下载">
                    <i class="fas fa-download"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showCreateTemplateModal() {
  const modal = document.createElement('div');
  modal.id = 'template-modal';
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-plus mr-2"></i>创建复盘模板
          </h3>
          <button onclick="closeTemplateModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form id="template-form" onsubmit="handleCreateTemplate(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateName')} *
              </label>
              <input type="text" id="template-name" required
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateDescription')}
              </label>
              <textarea id="template-description" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templatePrice')}
              </label>
              
              <!-- 普通会员价 -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  普通会员价
                </label>
                <div class="flex items-center">
                  <span class="text-gray-600 mr-2">$</span>
                  <input type="number" id="template-price-basic" min="0" step="0.01" value="0"
                         class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                         placeholder="0.00">
                  <span class="text-gray-600 ml-2">USD</span>
                </div>
              </div>
              
              <!-- 高级会员价 -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  高级会员价
                </label>
                <div class="flex items-center">
                  <span class="text-gray-600 mr-2">$</span>
                  <input type="number" id="template-price-premium" min="0" step="0.01" value="0"
                         class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                         placeholder="0.00">
                  <span class="text-gray-600 ml-2">USD</span>
                </div>
              </div>
              
              <!-- 超级会员价 -->
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  超级会员价
                </label>
                <div class="flex items-center">
                  <span class="text-gray-600 mr-2">$</span>
                  <input type="number" id="template-price-super" min="0" step="0.01" value="0"
                         class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                         placeholder="0.00">
                  <span class="text-gray-600 ml-2">USD</span>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateOwner')}
              </label>
              <select id="template-owner" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="public">
                  ${i18n.t('templateOwnerPublic')}
                </option>
                <option value="team">
                  ${i18n.t('templateOwnerTeam')}
                </option>
                <option value="private">
                  ${i18n.t('templateOwnerPrivate')}
                </option>
              </select>
              <p class="mt-1 text-xs text-gray-500">${i18n.t('templateOwnerDescription')}</p>
            </div>
            ${currentUser.role === 'admin' ? `
              <div class="flex items-center">
                <input type="checkbox" id="template-is-default"
                       class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500">
                <label for="template-is-default" class="ml-2 text-sm text-gray-700">
                  ${i18n.t('isDefault')}
                </label>
              </div>
            ` : ''}
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="closeTemplateModal()"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ${i18n.t('cancel')}
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              ${i18n.t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function handleCreateTemplate(e) {
  e.preventDefault();
  
  const isDefaultCheckbox = document.getElementById('template-is-default');
  const priceBasic = parseFloat(document.getElementById('template-price-basic').value) || 0;
  const pricePremium = parseFloat(document.getElementById('template-price-premium').value) || 0;
  const priceSuper = parseFloat(document.getElementById('template-price-super').value) || 0;
  const data = {
    name: document.getElementById('template-name').value,
    description: document.getElementById('template-description').value || null,
    price_basic: priceBasic,
    price_premium: pricePremium,
    price_super: priceSuper,
    is_default: isDefaultCheckbox ? isDefaultCheckbox.checked : false,
    owner: document.getElementById('template-owner').value
  };

  try {
    await axios.post('/api/templates', data);
    showNotification(i18n.t('templateCreated'), 'success');
    closeTemplateModal();
    await loadTemplatesTable();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showEditTemplateModal(templateId) {
  try {
    const response = await axios.get(`/api/templates/admin/${templateId}`);
    const template = response.data.template;
    currentEditingTemplate = template;
    
    const modal = document.createElement('div');
    modal.id = 'template-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>${i18n.t('editTemplate')}
            </h3>
            <button onclick="closeTemplateModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form id="template-form" onsubmit="handleUpdateTemplate(event, ${templateId})">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templateName')} *
                </label>
                <input type="text" id="template-name" required value="${escapeHtml(template.name)}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templateDescription')}
                </label>
                <textarea id="template-description" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(template.description || '')}</textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templatePrice')}
                </label>
                
                <!-- 普通会员价 -->
                <div class="mb-3">
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    普通会员价
                  </label>
                  <div class="flex items-center">
                    <span class="text-gray-600 mr-2">$</span>
                    <input type="number" id="template-price-basic" min="0" step="0.01" value="${template.price_basic || 0}"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                           placeholder="0.00">
                    <span class="text-gray-600 ml-2">USD</span>
                  </div>
                </div>
                
                <!-- 高级会员价 -->
                <div class="mb-3">
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    高级会员价
                  </label>
                  <div class="flex items-center">
                    <span class="text-gray-600 mr-2">$</span>
                    <input type="number" id="template-price-premium" min="0" step="0.01" value="${template.price_premium || 0}"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                           placeholder="0.00">
                    <span class="text-gray-600 ml-2">USD</span>
                  </div>
                </div>
                
                <!-- 超级会员价 -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    超级会员价
                  </label>
                  <div class="flex items-center">
                    <span class="text-gray-600 mr-2">$</span>
                    <input type="number" id="template-price-super" min="0" step="0.01" value="${template.price_super || 0}"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                           placeholder="0.00">
                    <span class="text-gray-600 ml-2">USD</span>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templateOwner')}
                </label>
                <select id="template-owner" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="public" ${(template.owner === 'public' || !template.owner) ? 'selected' : ''}>
                    ${i18n.t('templateOwnerPublic')}
                  </option>
                  <option value="team" ${template.owner === 'team' ? 'selected' : ''}>
                    ${i18n.t('templateOwnerTeam')}
                  </option>
                  <option value="private" ${template.owner === 'private' ? 'selected' : ''}>
                    ${i18n.t('templateOwnerPrivate')}
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500">${i18n.t('templateOwnerDescription')}</p>
              </div>
              ${currentUser.role === 'admin' ? `
                <div class="flex items-center">
                  <input type="checkbox" id="template-is-default" ${template.is_default ? 'checked' : ''}
                         class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500">
                  <label for="template-is-default" class="ml-2 text-sm text-gray-700">
                    ${i18n.t('isDefault')}
                  </label>
                </div>
              ` : ''}
              <div class="flex items-center">
                <input type="checkbox" id="template-is-active" ${template.is_active ? 'checked' : ''}
                       class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500">
                <label for="template-is-active" class="ml-2 text-sm text-gray-700">
                  ${i18n.t('active')}
                </label>
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" onclick="closeTemplateModal()"
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
    document.body.appendChild(modal);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function handleUpdateTemplate(e, templateId) {
  e.preventDefault();
  
  const isDefaultCheckbox = document.getElementById('template-is-default');
  const priceBasic = parseFloat(document.getElementById('template-price-basic').value) || 0;
  const pricePremium = parseFloat(document.getElementById('template-price-premium').value) || 0;
  const priceSuper = parseFloat(document.getElementById('template-price-super').value) || 0;
  
  const data = {
    name: document.getElementById('template-name').value,
    description: document.getElementById('template-description').value || null,
    price_basic: priceBasic,
    price_premium: pricePremium,
    price_super: priceSuper,
    is_default: isDefaultCheckbox ? isDefaultCheckbox.checked : false,
    is_active: document.getElementById('template-is-active').checked,
    owner: document.getElementById('template-owner').value
  };

  try {
    await axios.put(`/api/templates/${templateId}`, data);
    showNotification(i18n.t('templateUpdated'), 'success');
    closeTemplateModal();
    await loadTemplatesTable();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Toggle template status (is_active)
async function toggleTemplateStatus(templateId, currentStatus) {
  const action = currentStatus ? '下架' : '上架';
  if (!confirm(`确定要${action}这个复盘模板吗？`)) return;

  try {
    const response = await axios.post(`/api/templates/${templateId}/toggle-status`);
    showNotification(response.data.message || `✅ 模板已${action}！`, 'success');
    await loadTemplatesTable();
  } catch (error) {
    console.error('Error toggling template status:', error);
    showNotification('操作失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Helper function: Copy review template
async function copyReviewTemplate(templateId) {
  if (!confirm('确定要复制这个模板吗？')) return;
  
  try {
    showNotification('正在复制模板...', 'info');
    
    // Get template details including questions
    const response = await axios.get(`/api/templates/${templateId}`);
    const template = response.data.template;
    
    // Create a copy with modified name
    const copyData = {
      name: `${template.name} (副本)`,
      description: template.description,
      owner: template.owner,
      is_default: 0,
      is_public: template.is_public,
      is_active: 1,
      price_basic: template.price_basic,
      price_premium: template.price_premium,
      price_super: template.price_super,
      questions: template.questions || []
    };
    
    await axios.post('/api/templates', copyData);
    showNotification('✅ 模板复制成功！', 'success');
    await loadTemplatesTable();
  } catch (error) {
    console.error('Copy template error:', error);
    showNotification('复制失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Helper function: Download review template
async function downloadReviewTemplate(templateId) {
  try {
    const response = await axios.get(`/api/templates/${templateId}`);
    const template = response.data.template;
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('✅ 模板已下载！', 'success');
  } catch (error) {
    console.error('Download template error:', error);
    showNotification('下载失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function deleteTemplate(templateId) {
  if (!confirm(i18n.t('confirmDeleteTemplate'))) {
    return;
  }

  try {
    const response = await axios.delete(`/api/templates/${templateId}`);
    const disabled = response.data.disabled || false;
    const affectedReviews = response.data.affected_reviews || 0;
    
    if (disabled) {
      // Template was disabled (soft delete)
      showNotification(
        (i18n.t('templateDisabledDueToUsage') || '模板已禁用（被{count}个复盘使用），可在列表中重新启用')
          .replace('{count}', affectedReviews), 
        'warning'
      );
    } else {
      // Template was permanently deleted
      showNotification(i18n.t('templateDeleted'), 'success');
    }
    await loadTemplatesTable();
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    if (errorMsg.includes('default')) {
      showNotification(i18n.t('cannotDeleteDefault'), 'error');
    } else {
      showNotification(i18n.t('operationFailed') + ': ' + errorMsg, 'error');
    }
  }
}

function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) {
    modal.remove();
  }
  currentEditingTemplate = null;
}

// Question Management Functions

let currentTemplateQuestions = [];
let currentEditingOptions = []; // Global variable to store options being edited

async function showManageQuestionsModal(templateId) {
  try {
    const response = await axios.get(`/api/templates/admin/${templateId}`);
    const template = response.data.template;
    currentEditingTemplate = template;
    currentTemplateQuestions = template.questions || [];
    
    const modal = document.createElement('div');
    modal.id = 'questions-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-tasks mr-2"></i>${i18n.t('manageQuestions')}: ${escapeHtml(template.name)}
            </h3>
            <button onclick="closeQuestionsModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="mb-4">
            <button onclick="showAddQuestionForm()" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <i class="fas fa-plus mr-2"></i>${i18n.t('addQuestion')}
            </button>
          </div>
          
          <div id="questions-list">
            ${renderQuestionsList()}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

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
                         q.question_type === 'time_with_text' ? i18n.t('questionTypeTimeWithText') :
                         i18n.t('questionTypeText');
        const typeIcon = q.question_type === 'single_choice' ? 'fa-dot-circle' :
                        q.question_type === 'multiple_choice' ? 'fa-check-square' :
                        q.question_type === 'time_with_text' ? 'fa-clock' :
                        'fa-font';
        const typeColor = q.question_type === 'text' ? 'blue' : 
                         q.question_type === 'time_with_text' ? 'purple' : 
                         'green';
        
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
                <option value="multiline_text">${i18n.t('questionTypeMultilineText')}</option>
                <option value="number">${i18n.t('questionTypeNumber')}</option>
                <option value="single_choice">${i18n.t('questionTypeSingleChoice')}</option>
                <option value="multiple_choice">${i18n.t('questionTypeMultipleChoice')}</option>
                <option value="dropdown">${i18n.t('questionTypeDropdown')}</option>
                <option value="time_with_text">${i18n.t('questionTypeTimeWithText')}</option>
                <option value="markdown">${i18n.t('questionTypeMarkdown')}</option>
              </select>
            </div>
            
            <!-- Question Text -->
            <div id="question-text-container">
              <label id="question-text-label" class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionText')} *
              </label>
              <textarea id="question-text" required rows="3"
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
            
            <!-- Answer Owner (V6.7.0: 答案可见性) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerOwner')} *
              </label>
              <select id="question-owner" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="public">${i18n.t('answerOwnerPublic')}</option>
                <option value="private">${i18n.t('answerOwnerPrivate')}</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">${i18n.t('answerOwnerHint')}</p>
            </div>
            
            <!-- Answer Required (V6.7.0: 是否必填) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerRequired')} *
              </label>
              <select id="question-required" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="no">${i18n.t('answerRequiredNo')}</option>
                <option value="yes">${i18n.t('answerRequiredYes')}</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">${i18n.t('answerRequiredHint')}</p>
            </div>
            
            <!-- Time Type Fields (for time_with_text only) -->
            <div id="time-type-container" class="hidden">
              <div class="space-y-4">
                <p class="text-sm text-gray-700 font-medium">
                  <i class="fas fa-info-circle mr-1"></i>${i18n.t('timeTypeDescription')}
                </p>
                
                <!-- Default Datetime -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-clock mr-1"></i>${i18n.t('defaultDatetime')}
                  </label>
                  <input type="datetime-local" id="question-datetime-value" 
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('defaultDatetimeHint')}</p>
                </div>
                
                <!-- Datetime Title (max 12 chars) - HIDDEN per requirements -->
                <div style="display: none;">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-tag mr-1"></i>${i18n.t('datetimeTitle')} *
                  </label>
                  <input type="text" id="question-datetime-title" maxlength="12" 
                         placeholder="${i18n.t('datetimeTitlePlaceholder')}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('datetimeTitleHint')}</p>
                </div>
                
                <!-- Answer Max Length -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-text-width mr-1"></i>${i18n.t('answerMaxLength')} *
                  </label>
                  <input type="number" id="question-datetime-answer-max-length" min="50" max="500" value="200"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('answerMaxLengthHint')}</p>
                </div>
              </div>
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
  
  // Initialize form state based on question type
  handleQuestionTypeChange();
}

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
                <option value="multiline_text" ${question.question_type === 'multiline_text' ? 'selected' : ''}>${i18n.t('questionTypeMultilineText')}</option>
                <option value="number" ${question.question_type === 'number' ? 'selected' : ''}>${i18n.t('questionTypeNumber')}</option>
                <option value="single_choice" ${question.question_type === 'single_choice' ? 'selected' : ''}>${i18n.t('questionTypeSingleChoice')}</option>
                <option value="multiple_choice" ${question.question_type === 'multiple_choice' ? 'selected' : ''}>${i18n.t('questionTypeMultipleChoice')}</option>
                <option value="dropdown" ${question.question_type === 'dropdown' ? 'selected' : ''}>${i18n.t('questionTypeDropdown')}</option>
                <option value="time_with_text" ${question.question_type === 'time_with_text' ? 'selected' : ''}>${i18n.t('questionTypeTimeWithText')}</option>
                <option value="markdown" ${question.question_type === 'markdown' ? 'selected' : ''}>${i18n.t('questionTypeMarkdown')}</option>
              </select>
            </div>
            
            <!-- Question Text -->
            <div id="question-text-container">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionText')} *
              </label>
              <textarea id="question-text" required rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(question.question_text)}</textarea>
            </div>
            
            <!-- Answer Length (for text-based types) -->
            <div id="answer-length-container" class="${['text', 'multiline_text', 'number', 'markdown'].includes(question.question_type) ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerLength')} *
              </label>
              <input type="number" id="question-answer-length" min="10" max="1000" value="${question.answer_length || 50}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <p class="text-xs text-gray-500 mt-1">${i18n.t('maxCharacters')}: 10-1000 (${i18n.t('defaultValue')}: 50)</p>
            </div>
            
            <!-- Answer Owner (V6.7.0: 答案可见性) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerOwner')} *
              </label>
              <select id="question-owner" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="public" ${(question.owner || 'public') === 'public' ? 'selected' : ''}>${i18n.t('answerOwnerPublic')}</option>
                <option value="private" ${(question.owner || 'public') === 'private' ? 'selected' : ''}>${i18n.t('answerOwnerPrivate')}</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">${i18n.t('answerOwnerHint')}</p>
            </div>
            
            <!-- Answer Required (V6.7.0: 是否必填) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerRequired')} *
              </label>
              <select id="question-required" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="no" ${(question.required || 'no') === 'no' ? 'selected' : ''}>${i18n.t('answerRequiredNo')}</option>
                <option value="yes" ${(question.required || 'no') === 'yes' ? 'selected' : ''}>${i18n.t('answerRequiredYes')}</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">${i18n.t('answerRequiredHint')}</p>
            </div>
            
            <!-- Time Type Fields (for time_with_text only) -->
            <div id="time-type-container" class="${question.question_type === 'time_with_text' ? '' : 'hidden'}">
              <div class="space-y-4">
                <p class="text-sm text-gray-700 font-medium">
                  <i class="fas fa-info-circle mr-1"></i>${i18n.t('timeTypeDescription')}
                </p>
                
                <!-- Default Datetime -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-clock mr-1"></i>${i18n.t('defaultDatetime')}
                  </label>
                  <input type="datetime-local" id="question-datetime-value" 
                         value="${question.datetime_value ? question.datetime_value.slice(0, 16) : ''}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('defaultDatetimeHint')}</p>
                </div>
                
                <!-- Datetime Title (max 12 chars) - HIDDEN per requirements -->
                <div style="display: none;">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-tag mr-1"></i>${i18n.t('datetimeTitle')} *
                  </label>
                  <input type="text" id="question-datetime-title" maxlength="12" 
                         value="${escapeHtml(question.datetime_title || '')}"
                         placeholder="${i18n.t('datetimeTitlePlaceholder')}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('datetimeTitleHint')}</p>
                </div>
                
                <!-- Answer Max Length -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-text-width mr-1"></i>${i18n.t('answerMaxLength')} *
                  </label>
                  <input type="number" id="question-datetime-answer-max-length" min="50" max="500" 
                         value="${question.datetime_answer_max_length || 200}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('answerMaxLengthHint')}</p>
                </div>
              </div>
            </div>
            
            <!-- Choice Options (for choice types only) -->
            <div id="options-container" class="${['single_choice', 'multiple_choice', 'dropdown'].includes(question.question_type) ? '' : 'hidden'}">
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
            <div id="correct-answer-container" class="${['single_choice', 'multiple_choice', 'dropdown'].includes(question.question_type) ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('correctAnswer')} *
                <span class="text-xs text-gray-500">(${i18n.t('correctAnswerHint')})</span>
              </label>
              <div id="single-choice-answer" class="${['single_choice', 'dropdown'].includes(question.question_type) ? '' : 'hidden'} space-y-2">
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
  
  // Render correct answer options for choice questions
  renderCorrectAnswerOptions();
  
  // Set correct answer
  if (question.correct_answer) {
    setTimeout(() => {
      if (question.question_type === 'single_choice' || question.question_type === 'dropdown') {
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
  
  // Initialize form state based on question type
  handleQuestionTypeChange();
}

// Handle question type change
function handleQuestionTypeChange() {
  const type = document.getElementById('question-type')?.value;
  if (!type) return;
  
  const answerLengthContainer = document.getElementById('answer-length-container');
  const timeTypeContainer = document.getElementById('time-type-container');
  const optionsContainer = document.getElementById('options-container');
  const correctAnswerContainer = document.getElementById('correct-answer-container');
  const singleChoiceAnswer = document.getElementById('single-choice-answer');
  const multipleChoiceAnswer = document.getElementById('multiple-choice-answer');
  
  // Get containers and labels for dynamic field management
  const questionTextContainer = document.getElementById('question-text-container');
  const questionTextLabel = document.getElementById('question-text-label');
  
  // Null checks for all elements
  if (!answerLengthContainer || !timeTypeContainer || !optionsContainer || 
      !correctAnswerContainer || !singleChoiceAnswer || !multipleChoiceAnswer || 
      !questionTextContainer || !questionTextLabel) {
    console.warn('[handleQuestionTypeChange] Some required elements are missing');
    return;
  }
  
  // Hide all type-specific containers first
  answerLengthContainer.classList.add('hidden');
  timeTypeContainer.classList.add('hidden');
  optionsContainer.classList.add('hidden');
  correctAnswerContainer.classList.add('hidden');
  
  // Show question text container for all types
  questionTextContainer.classList.remove('hidden');
  
  if (type === 'text' || type === 'multiline_text' || type === 'number' || type === 'markdown') {
    // Text-based types: Show answer length field
    answerLengthContainer.classList.remove('hidden');
    questionTextLabel.textContent = i18n.t('question') + ' *';
  } else if (type === 'time_with_text') {
    // Time type: Label as "标题"
    timeTypeContainer.classList.remove('hidden');
    questionTextLabel.textContent = i18n.t('title') + ' *';
  } else if (type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown') {
    // Choice types: Show options and correct answer fields
    optionsContainer.classList.remove('hidden');
    correctAnswerContainer.classList.remove('hidden');
    questionTextLabel.textContent = i18n.t('questionText') + ' *';
    
    if (type === 'single_choice' || type === 'dropdown') {
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
  if (!type || type === 'text' || type === 'multiline_text' || type === 'number' || type === 'markdown') return;
  
  const singleChoiceContainer = document.getElementById('single-choice-answer');
  const multipleChoiceContainer = document.getElementById('multiple-choice-answer');
  
  if ((type === 'single_choice' || type === 'dropdown') && singleChoiceContainer) {
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
  const typeElement = document.getElementById('question-type');
  const questionTextElement = document.getElementById('question-text');
  
  if (!typeElement || !questionTextElement) {
    throw new Error('Required form elements are missing');
  }
  
  const type = typeElement.value;
  
  // Collect owner and required values
  const ownerElement = document.getElementById('question-owner');
  const requiredElement = document.getElementById('question-required');
  
  // Use actual value or default (handle empty string properly)
  const owner = ownerElement ? (ownerElement.value || 'public') : 'public';
  const required = requiredElement ? (requiredElement.value || 'no') : 'no';
  
  const data = {
    question_text: questionTextElement.value,
    question_type: type,
    // V6.7.0: Add owner and required fields
    owner: owner,
    required: required
  };
  
  // Handle text-based types (text, multiline_text, number, markdown)
  if (type === 'text' || type === 'multiline_text' || type === 'number' || type === 'markdown') {
    data.answer_length = parseInt(document.getElementById('question-answer-length').value) || 50;
  } else if (type === 'time_with_text') {
    // Collect time type fields
    const datetimeValue = document.getElementById('question-datetime-value').value;
    // Use question_text as datetime title
    const datetimeTitle = document.getElementById('question-text').value.trim() || '时间';
    const answerMaxLength = parseInt(document.getElementById('question-datetime-answer-max-length').value) || 200;
    
    // Validate answer max length (50-500)
    if (answerMaxLength < 50 || answerMaxLength > 500) {
      throw new Error(i18n.t('answerMaxLength') + ' must be between 50 and 500');
    }
    
    data.datetime_value = datetimeValue || null;
    data.datetime_title = datetimeTitle;
    data.datetime_answer_max_length = answerMaxLength;
  } else if (type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown') {
    // Collect options for choice types (single_choice, multiple_choice, dropdown)
    const options = currentEditingOptions.filter(opt => {
      const text = opt.substring(opt.indexOf('.') + 1).trim();
      return text.length > 0;
    });
    
    if (options.length === 0) {
      throw new Error(i18n.t('choiceOptions') + ' is required');
    }
    
    data.options = JSON.stringify(options);
    
    // Collect correct answer
    if (type === 'single_choice' || type === 'dropdown') {
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

async function deleteQuestion(questionId) {
  if (!confirm(i18n.t('confirmDeleteQuestion'))) {
    return;
  }

  try {
    await axios.delete(`/api/templates/${currentEditingTemplate.id}/questions/${questionId}`);
    showNotification(i18n.t('questionDeleted'), 'success');
    await refreshQuestionsList();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function moveQuestion(questionId, direction) {
  const index = currentTemplateQuestions.findIndex(q => q.id === questionId);
  if (index === -1) return;
  
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= currentTemplateQuestions.length) return;
  
  // Swap question numbers
  const questions = [...currentTemplateQuestions];
  const tempNumber = questions[index].question_number;
  questions[index].question_number = questions[newIndex].question_number;
  questions[newIndex].question_number = tempNumber;
  
  // Update on server
  try {
    await axios.put(`/api/templates/${currentEditingTemplate.id}/questions/reorder`, {
      questions: questions.map(q => ({ id: q.id, question_number: q.question_number }))
    });
    await refreshQuestionsList();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function refreshQuestionsList() {
  try {
    const response = await axios.get(`/api/templates/admin/${currentEditingTemplate.id}`);
    currentTemplateQuestions = response.data.template.questions || [];
    document.getElementById('questions-list').innerHTML = renderQuestionsList();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

function closeQuestionForm() {
  const form = document.getElementById('question-form-container');
  if (form) {
    form.remove();
  }
}

function closeQuestionsModal() {
  const modal = document.getElementById('questions-modal');
  if (modal) {
    modal.remove();
  }
  currentEditingTemplate = null;
  currentTemplateQuestions = [];
}

// ============ User Management Functions ============

async function showEditUserModal(userId) {
  try {
    // Find user from allUsers
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
      showNotification(i18n.t('operationFailed') + ': User not found', 'error');
      return;
    }
    
    // Find referrer email from user_id
    let referrerEmail = '';
    let referrerDisplay = i18n.t('none') || '无';
    
    if (user.referred_by) {
      const referrer = allUsers.find(u => u.id === user.referred_by);
      if (referrer) {
        referrerEmail = referrer.email;
        referrerDisplay = referrer.email;
      } else {
        // Referrer not found in allUsers, show ID
        referrerDisplay = `User ID: ${user.referred_by}`;
      }
    }
    
    // Format dates for display
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toISOString().slice(0, 16);
    };
    
    const modal = document.createElement('div');
    modal.id = 'user-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>${i18n.t('editUser')}
            </h3>
            <button onclick="closeUserModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form id="user-form" onsubmit="handleUpdateUser(event, ${userId})">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Username -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('username')} *
                </label>
                <input type="text" id="user-username" required value="${escapeHtml(user.username)}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
              
              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('email')} *
                </label>
                <input type="email" id="user-email" required value="${escapeHtml(user.email)}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
              
              <!-- Role -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('role')} *
                </label>
                <select id="user-role" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="user" ${user.role === 'user' ? 'selected' : ''}>${i18n.t('userRole')}</option>
                  <option value="premium" ${user.role === 'premium' ? 'selected' : ''}>${i18n.t('premiumRole')}</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>${i18n.t('adminRole')}</option>
                </select>
              </div>
              
              <!-- Language -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('language')}
                </label>
                <select id="user-language"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="en" ${user.language === 'en' ? 'selected' : ''}>English</option>
                  <option value="fr" ${user.language === 'fr' ? 'selected' : ''}>Français</option>
                  <option value="es" ${user.language === 'es' ? 'selected' : ''}>Español</option>
                  <option value="zh" ${user.language === 'zh' ? 'selected' : ''}>简体中文</option>
                  <option value="zh-TW" ${user.language === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                  <option value="ja" ${user.language === 'ja' ? 'selected' : ''}>日本語</option>
                </select>
              </div>
              
              <!-- Subscription Tier -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('subscriptionTier') || '订阅等级'}
                </label>
                <select id="user-subscription-tier"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="free" ${(user.subscription_tier || 'free') === 'free' ? 'selected' : ''}>${i18n.t('freePlan')}</option>
                  <option value="premium" ${user.subscription_tier === 'premium' ? 'selected' : ''}>${i18n.t('premiumPlan')}</option>
                  <option value="super" ${user.subscription_tier === 'super' ? 'selected' : ''}>${i18n.t('superPlan')}</option>
                </select>
              </div>
              
              <!-- Subscription Expires At -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('subscriptionExpires') || '订阅到期时间'}
                </label>
                <input type="datetime-local" id="user-subscription-expires" 
                       value="${formatDate(user.subscription_expires_at)}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <p class="text-xs text-gray-500 mt-1">${i18n.t('leaveEmptyForNever') || '留空表示永不过期'}</p>
              </div>
              
              <!-- Referred By -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('referredBy') || '介绍人邮箱'}
                </label>
                <input type="text" id="user-referred-by" 
                       value="${escapeHtml(referrerDisplay)}"
                       placeholder="${i18n.t('none') || '无'}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                       readonly
                       title="${i18n.t('referrerEmailReadonly') || '介绍人邮箱（只读）'}">
              </div>
              
              <!-- Login Count (Read-only display) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('loginCount') || '登录次数'}
                </label>
                <input type="number" id="user-login-count" 
                       value="${user.login_count || 0}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50">
              </div>
              
              <!-- Last Login At (Read-only) -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('lastLoginAt') || '最后登录时间'}
                </label>
                <input type="text" 
                       value="${user.last_login_at ? new Date(user.last_login_at).toLocaleString() : i18n.t('never') || '从未登录'}"
                       readonly
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
              </div>
              
              <!-- Created At (Read-only) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('createdAt') || '创建时间'}
                </label>
                <input type="text" 
                       value="${new Date(user.created_at).toLocaleString()}"
                       readonly
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
              </div>
              
              <!-- Updated At (Read-only) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('updatedAt') || '更新时间'}
                </label>
                <input type="text" 
                       value="${new Date(user.updated_at).toLocaleString()}"
                       readonly
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button type="button" onclick="closeUserModal()"
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
    document.body.appendChild(modal);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function handleUpdateUser(e, userId) {
  e.preventDefault();
  
  console.log('[handleUpdateUser] Starting update for user ID:', userId);
  
  const subscriptionExpiresValue = document.getElementById('user-subscription-expires').value;
  const referredByEmail = document.getElementById('user-referred-by').value;
  const loginCountValue = document.getElementById('user-login-count').value;
  
  // Find referrer user_id from email
  let referredById = null;
  if (referredByEmail) {
    const referrer = allUsers.find(u => u.email === referredByEmail);
    if (referrer) {
      referredById = referrer.id;
    } else {
      // Default to dengalan@gmail.com if email not found
      const defaultReferrer = allUsers.find(u => u.email === 'dengalan@gmail.com');
      referredById = defaultReferrer ? defaultReferrer.id : null;
    }
  }
  
  const data = {
    username: document.getElementById('user-username').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value,
    language: document.getElementById('user-language').value,
    subscription_tier: document.getElementById('user-subscription-tier').value,
    subscription_expires_at: subscriptionExpiresValue ? new Date(subscriptionExpiresValue).toISOString() : null,
    referred_by: referredById,
    login_count: loginCountValue ? parseInt(loginCountValue) : 0
  };

  console.log('[handleUpdateUser] Data to send:', data);

  try {
    console.log('[handleUpdateUser] Sending PUT request...');
    const response = await axios.put(`/api/admin/users/${userId}`, data);
    console.log('[handleUpdateUser] Response received:', response.data);
    
    showNotification(i18n.t('userUpdated') || '用户已更新', 'success');
    
    console.log('[handleUpdateUser] Closing modal...');
    closeUserModal();
    
    console.log('[handleUpdateUser] Reloading user table...');
    await loadUsersTable();
    
    console.log('[handleUpdateUser] Update complete!');
  } catch (error) {
    console.error('[handleUpdateUser] Error occurred:', error);
    console.error('[handleUpdateUser] Error response:', error.response?.data);
    
    const errorMsg = error.response?.data?.error || error.message;
    if (errorMsg.includes('Email already') || errorMsg.includes('already in use')) {
      showNotification(i18n.t('emailInUse') || '邮箱已被使用', 'error');
    } else {
      showNotification((i18n.t('operationFailed') || '操作失败') + ': ' + errorMsg, 'error');
    }
  }
}

function closeUserModal() {
  const modal = document.getElementById('user-modal');
  if (modal) {
    modal.remove();
  }
}

async function showResetPasswordModal(userId) {
  try {
    // Find user from allUsers
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
      showNotification(i18n.t('operationFailed') + ': User not found', 'error');
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'reset-password-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-key mr-2"></i>${i18n.t('resetUserPassword')}
            </h3>
            <button onclick="closeResetPasswordModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
            <div class="flex items-start">
              <i class="fas fa-exclamation-triangle text-yellow-500 mt-1 mr-2"></i>
              <div class="text-sm text-gray-700">
                <p class="font-semibold mb-1">${i18n.t('userInfo')}:</p>
                <p><strong>${i18n.t('username')}:</strong> ${escapeHtml(user.username)}</p>
                <p><strong>${i18n.t('email')}:</strong> ${escapeHtml(user.email)}</p>
              </div>
            </div>
          </div>
          
          <form id="reset-password-form" onsubmit="handleAdminResetPassword(event, ${userId})">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('newPassword')} *
                </label>
                <input type="password" id="reset-new-password" required minlength="6"
                       placeholder="${i18n.t('passwordMinLength') || '至少6个字符'}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <p class="text-xs text-gray-500 mt-1">${i18n.t('passwordMinLength') || '密码至少6个字符'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('confirmNewPassword')} *
                </label>
                <input type="password" id="reset-confirm-password" required minlength="6"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" onclick="closeResetPasswordModal()"
                      class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ${i18n.t('cancel')}
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                <i class="fas fa-key mr-2"></i>${i18n.t('resetPassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function handleAdminResetPassword(e, userId) {
  e.preventDefault();
  
  const newPassword = document.getElementById('reset-new-password').value;
  const confirmPassword = document.getElementById('reset-confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    showNotification(i18n.t('passwordMismatch') || '两次输入的密码不一致', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification(i18n.t('passwordMinLength') || '密码至少6个字符', 'error');
    return;
  }

  try {
    await axios.put(`/api/admin/users/${userId}/reset-password`, { newPassword });
    showNotification(i18n.t('passwordResetSuccess'), 'success');
    closeResetPasswordModal();
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

function closeResetPasswordModal() {
  const modal = document.getElementById('reset-password-modal');
  if (modal) {
    modal.remove();
  }
}

// Public Message Modal Functions
function showPublicMessageModal() {
  const modal = document.createElement('div');
  modal.id = 'public-message-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-pen-to-square mr-2 text-indigo-600"></i>${i18n.t('leaveYourMessage')}
          </h2>
          <button onclick="closePublicMessageModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
      </div>
      
      <div class="p-6">
        <form id="public-message-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-user mr-2"></i>${i18n.t('yourName')}*
            </label>
            <input type="text" id="public-name" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('yourName')}">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-briefcase mr-2"></i>${i18n.t('yourRole')}
            </label>
            <input type="text" id="public-role"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="${i18n.t('roleExample')}">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-comment mr-2"></i>${i18n.t('yourMessage')}*
            </label>
            <textarea id="public-content" required rows="6"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="${i18n.t('yourMessage')}"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-star mr-2"></i>${i18n.t('yourRating')}
            </label>
            <select id="public-rating" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★☆ (4)</option>
              <option value="3">★★★☆☆ (3)</option>
              <option value="2">★★☆☆☆ (2)</option>
              <option value="1">★☆☆☆☆ (1)</option>
            </select>
          </div>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
              <i class="fas fa-info-circle mr-2"></i>
              ${i18n.t('messageWillBeReviewed') || 'Your message will be reviewed by administrators before being published.'}
            </p>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" onclick="closePublicMessageModal()" 
                    class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              ${i18n.t('cancel')}
            </button>
            <button type="submit"
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <i class="fas fa-paper-plane mr-2"></i>${i18n.t('submitMessage')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle form submission
  document.getElementById('public-message-form').addEventListener('submit', submitPublicMessage);
}

async function submitPublicMessage(e) {
  e.preventDefault();
  
  const name = document.getElementById('public-name').value.trim();
  const role = document.getElementById('public-role').value.trim();
  const content = document.getElementById('public-content').value.trim();
  const rating = parseInt(document.getElementById('public-rating').value);
  
  if (!name || !content) {
    showNotification(i18n.t('pleaseComplete') || 'Please complete all required fields', 'error');
    return;
  }
  
  try {
    const response = await axios.post('/api/testimonials/public', {
      name,
      role: role || 'Visitor',
      content,
      rating
    });
    
    showNotification(response.data.message || i18n.t('messageSubmitted') || 'Message submitted successfully!', 'success');
    closePublicMessageModal();
    
    // Reload testimonials after a short delay
    setTimeout(() => {
      loadTestimonials();
    }, 1000);
  } catch (error) {
    console.error('Failed to submit message:', error);
    showNotification(i18n.t('operationFailed') || 'Failed to submit message', 'error');
  }
}

function closePublicMessageModal() {
  const modal = document.getElementById('public-message-modal');
  if (modal) {
    modal.remove();
  }
}

// ============ Public Reviews Management (Admin Panel) ============

async function showPublicReviewsManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-globe mr-2"></i>${i18n.t('publicReviewsManagement') || '公开复盘管理'}
        </h2>
      </div>
      <div id="public-reviews-table-container">
        <div class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
      </div>
    </div>
  `;
  
  await loadPublicReviewsTable();
}

async function loadPublicReviewsTable() {
  const tableContainer = document.getElementById('public-reviews-table-container');
  
  try {
    const response = await axios.get('/api/reviews/public');
    const reviews = response.data.reviews || [];
    
    if (reviews.length === 0) {
      tableContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-3"></i>
          <p>${i18n.t('noPublicReviews') || '暂无公开复盘'}</p>
        </div>
      `;
      return;
    }
    
    tableContainer.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('title')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('creator')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('team')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('status')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('createdAt')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${reviews.map(review => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${review.id}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  <a href="#" onclick="viewReview(${review.id}); return false;" class="text-indigo-600 hover:text-indigo-900">
                    ${escapeHtml(review.title)}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(review.creator_name || 'N/A')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(review.team_name || '-')}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    review.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    review.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }">
                    ${i18n.t(review.status) || review.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(review.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onclick="adminEditPublicReview(${review.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit mr-1"></i>${i18n.t('edit')}
                  </button>
                  <button onclick="adminDeletePublicReview(${review.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash mr-1"></i>${i18n.t('delete')}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load public reviews:', error);
    tableContainer.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-circle text-4xl mb-3"></i>
        <p>${i18n.t('loadError') || '加载失败'}</p>
      </div>
    `;
  }
}

async function adminEditPublicReview(reviewId) {
  // Redirect to review edit page
  window.location.hash = '';
  await new Promise(resolve => setTimeout(resolve, 100));
  showEditReview(reviewId);
}

async function adminDeletePublicReview(reviewId) {
  if (!confirm(i18n.t('confirmDeleteReview') || '确认删除此复盘吗？此操作不可撤销。')) {
    return;
  }
  
  try {
    await axios.delete(`/api/reviews/${reviewId}`);
    showNotification(i18n.t('deleteSuccess') || '删除成功', 'success');
    await loadPublicReviewsTable();
  } catch (error) {
    console.error('Failed to delete review:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ==================== Payment & Subscription Functions ====================

// Show upgrade modal for free users
async function showUpgradeModal() {
  try {
    // Get current user info and subscription config
    const [userResponse, configResponse] = await Promise.all([
      axios.get('/api/auth/settings'),
      axios.get('/api/payment/subscription/info')
    ]);
    
    const user = userResponse.data;
    const { premium, super: superPlan } = configResponse.data;
    const isRenewal = user.subscription_tier === 'premium' || user.subscription_tier === 'super';
    
    // Determine prices based on user type
    const premiumPrice = isRenewal ? premium.renewal_price : premium.price;
    const superPrice = isRenewal ? superPlan.renewal_price : superPlan.price;
    
    // Create modal HTML
    const modalHtml = `
      <div id="upgrade-selection-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold">
                <i class="fas fa-crown mr-2"></i>
                ${isRenewal ? (i18n.t('renewSubscription') || '续费会员') : (i18n.t('upgradeToMember') || '升级会员')}
              </h2>
              <button onclick="closeUpgradeSelectionModal()" class="text-white hover:text-gray-200 transition">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="p-6 space-y-4">
            <p class="text-gray-600 text-center mb-6">
              ${i18n.t('selectMembershipPlan') || '请选择您要购买的会员套餐'}
            </p>
            
            <!-- Premium Plan -->
            <div class="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition cursor-pointer bg-gradient-to-br from-purple-50 to-indigo-50"
                 onclick="addSubscriptionToCart('premium', ${premiumPrice})">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-purple-700 mb-2">
                    <i class="fas fa-star mr-2"></i>
                    ${i18n.t('premiumMember') || '高级会员'}
                  </h3>
                  <p class="text-sm text-gray-600">${premium.description || '享受高级功能和服务'}</p>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold text-purple-600">$${premiumPrice}</div>
                  <div class="text-sm text-gray-500">${i18n.t('perYear') || '/ 年'}</div>
                </div>
              </div>
              <div class="flex items-center justify-between pt-4 border-t border-purple-200">
                <span class="text-sm text-gray-600">
                  <i class="fas fa-calendar-alt mr-2"></i>
                  ${i18n.t('validFor365Days') || '有效期 365 天'}
                </span>
                <button class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold">
                  <i class="fas fa-shopping-cart mr-2"></i>
                  ${i18n.t('select') || '选择'}
                </button>
              </div>
            </div>
            
            <!-- Super Plan -->
            <div class="border-2 border-yellow-200 rounded-lg p-6 hover:border-yellow-400 transition cursor-pointer bg-gradient-to-br from-yellow-50 to-orange-50"
                 onclick="addSubscriptionToCart('super', ${superPrice})">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-yellow-700 mb-2">
                    <i class="fas fa-gem mr-2"></i>
                    ${i18n.t('superMember') || '超级会员'}
                  </h3>
                  <p class="text-sm text-gray-600">${superPlan.description || '尊享顶级功能和专属服务'}</p>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold text-yellow-600">$${superPrice}</div>
                  <div class="text-sm text-gray-500">${i18n.t('perYear') || '/ 年'}</div>
                </div>
              </div>
              <div class="flex items-center justify-between pt-4 border-t border-yellow-200">
                <span class="text-sm text-gray-600">
                  <i class="fas fa-calendar-alt mr-2"></i>
                  ${i18n.t('validFor365Days') || '有效期 365 天'}
                </span>
                <button class="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition font-semibold">
                  <i class="fas fa-shopping-cart mr-2"></i>
                  ${i18n.t('select') || '选择'}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
            <p class="text-sm text-gray-500 text-center">
              <i class="fas fa-info-circle mr-2"></i>
              ${i18n.t('addToCartNote') || '选择后将添加到购物车，您可以继续选购其他商品后统一结算'}
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to page
    const existingModal = document.getElementById('upgrade-selection-modal');
    if (existingModal) {
      existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
  } catch (error) {
    console.error('Show upgrade modal error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Close upgrade selection modal
function closeUpgradeSelectionModal() {
  const modal = document.getElementById('upgrade-selection-modal');
  if (modal) {
    modal.remove();
  }
}

// Add selected subscription to cart
async function addSubscriptionToCart(tier, price) {
  try {
    const isRenewal = currentUser.subscription_tier === 'premium' || currentUser.subscription_tier === 'super';
    const serviceTitle = tier === 'premium' 
      ? (i18n.t('premiumMember') || '高级会员')
      : (i18n.t('superMember') || '超级会员');
    
    // Add to cart
    await axios.post('/api/cart', {
      item_type: 'subscription',
      subscription_tier: tier,
      price_usd: price,
      duration_days: 365,
      description: serviceTitle + (isRenewal ? ' (续费)' : ' (升级)'),
      description_en: `${tier === 'premium' ? 'Premium' : 'Super'} Member ${isRenewal ? '(Renewal)' : '(Upgrade)'}`
    });
    
    showNotification(i18n.t('addedToCart') || '已添加到购物车', 'success');
    
    // Update cart count
    await updateCartCount();
    
    // Close modal
    closeUpgradeSelectionModal();
    
  } catch (error) {
    console.error('Add to cart error:', error);
    if (error.response?.data?.error === 'Item already in cart') {
      showNotification(i18n.t('itemAlreadyInCart') || '该商品已在购物车中', 'info');
    } else {
      showNotification(i18n.t('operationFailed') || '操作失败', 'error');
    }
  }
}

// closeUpgradeModal function removed - no longer needed as we add to cart directly

// Show renew subscription modal for premium users - Add to cart
async function showRenewModal() {
  try {
    // Get subscription config
    const configResponse = await axios.get('/api/payment/subscription/info');
    const { premium } = configResponse.data;
    
    // For renewal, use renewal_price (or fallback to regular price)
    const price = premium.renewal_price || premium.price;
    const serviceTitle = i18n.t('renewalService') || '续费服务';
    
    // Add renewal service to cart
    // Note: item_type must be 'subscription' or 'product' (database constraint)
    await axios.post('/api/cart', {
      item_type: 'subscription',  // Fixed: must be 'subscription', not 'renewal'
      subscription_tier: 'premium',
      price_usd: price,
      duration_days: 365,
      description: serviceTitle + ' (续费)',
      description_en: 'Premium Renewal Service'
    });
    
    showNotification(i18n.t('addedToCart') || '已添加到购物车', 'success');
    
    // Update cart count
    await updateCartCount();
    
  } catch (error) {
    console.error('Add renewal to cart error:', error);
    if (error.response?.data?.error === 'Item already in cart') {
      showNotification(i18n.t('itemAlreadyInCart') || '该商品已在购物车中', 'info');
    } else {
      showNotification(i18n.t('operationFailed') || '操作失败', 'error');
    }
  }
}

// closeRenewModal function removed - no longer needed as we add to cart directly

// Show subscription management page (in admin panel for subscription settings)
async function showSubscriptionManagement(container) {
  try {
    // Get subscription config
    const configResponse = await axios.get('/api/admin/subscription/config');
    const configs = configResponse.data.configs || [];
    const premiumConfig = configs.find(c => c.tier === 'premium');
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-cog mr-2"></i>${i18n.t('pricingSettings') || '订阅价格设置'}
        </h3>
        <form onsubmit="handleUpdateSubscriptionConfig(event)" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('annualPrice') || '高级会员年费（美元）'}
              </label>
              <input type="number" step="0.01" id="premium-price" value="${premiumConfig?.price_usd || 20}" 
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <p class="text-xs text-gray-500 mt-1">${i18n.t('newUserUpgradePrice') || '新用户升级价格'}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('renewalPrice') || '高级会员续费费用（美元）'}
              </label>
              <input type="number" step="0.01" id="renewal-price" value="${premiumConfig?.renewal_price_usd || 20}" 
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <p class="text-xs text-gray-500 mt-1">${i18n.t('existingUserRenewalPrice') || '现有用户续费价格'}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                超级会员年费（美元）
              </label>
              <input type="number" step="0.01" id="super-price" value="${premiumConfig?.super_price_usd || 2}" 
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <p class="text-xs text-gray-500 mt-1">新用户升级至超级会员价格</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                超级会员续费费用（美元）
              </label>
              <input type="number" step="0.01" id="super-renewal-price" value="${premiumConfig?.super_renewal_price_usd || 2}" 
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <p class="text-xs text-gray-500 mt-1">现有超级会员续费价格</p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('duration') || '时长（天）'}
            </label>
            <input type="number" id="premium-duration" value="${premiumConfig?.duration_days || 365}" 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <button type="submit" class="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
            <i class="fas fa-save mr-2"></i>${i18n.t('updatePricing') || '更新价格'}
          </button>
        </form>
      </div>
    `;
  } catch (error) {
    console.error('Show subscription management error:', error);
    container.innerHTML = `<p class="text-red-500">${i18n.t('operationFailed') || '操作失败'}</p>`;
  }
}

async function handleUpdateSubscriptionConfig(e) {
  e.preventDefault();
  
  try {
    const price = document.getElementById('premium-price').value;
    const renewalPrice = document.getElementById('renewal-price').value;
    const superPrice = document.getElementById('super-price').value;
    const superRenewalPrice = document.getElementById('super-renewal-price').value;
    const duration = document.getElementById('premium-duration').value;
    
    await axios.put('/api/admin/subscription/config/premium', {
      price_usd: parseFloat(price),
      renewal_price_usd: parseFloat(renewalPrice),
      super_price_usd: parseFloat(superPrice),
      super_renewal_price_usd: parseFloat(superRenewalPrice),
      duration_days: parseInt(duration),
      description: '高级会员年费',
      description_en: 'Premium Annual Subscription',
      is_active: 1
    });
    
    showNotification(i18n.t('updateSuccess') || '更新成功', 'success');
    // Refresh the page to show updated values
    showAdmin();
  } catch (error) {
    console.error('Update subscription config error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// ============ Shopping Cart Functions ============

// Update cart count badge
async function updateCartCount() {
  try {
    const response = await axios.get('/api/cart');
    const count = response.data.count || 0;
    const badge = document.getElementById('cart-count');
    
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Update cart count error:', error);
  }
}

// Show shopping cart modal
async function showCart() {
  try {
    // 使用统一的购物车API (支持订阅和产品)
    const response = await axios.get('/api/cart');
    const items = response.data.cart_items || [];
    
    // 为每个商品计算用户应付价格
    items.forEach(item => {
      let userPrice = item.price_user || 0;
      if (currentUser && currentUser.subscription_tier) {
        if (currentUser.subscription_tier === 'super') {
          userPrice = item.price_super || item.price_user || 0;
        } else if (currentUser.subscription_tier === 'premium') {
          userPrice = item.price_premium || item.price_user || 0;
        }
      }
      item.user_price = userPrice;
    });
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'cart-modal';
    
    // Calculate total using user's price tier
    const total = items.reduce((sum, item) => sum + parseFloat(item.user_price || 0), 0);
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="bg-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 class="text-2xl font-bold">
            <i class="fas fa-shopping-cart mr-2"></i>${i18n.t('shoppingCart') || '购物车'}
          </h2>
          <button onclick="closeCart()" class="text-white hover:text-gray-200 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-6">
          ${items.length === 0 ? `
            <div class="text-center py-12">
              <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 text-lg">${i18n.t('cartEmpty') || '购物车是空的'}</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${items.map(item => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <i class="fas fa-box text-indigo-500 text-xl mr-3"></i>
                      <h3 class="font-semibold text-lg text-gray-800">
                        ${item.name || item.product_name}
                      </h3>
                    </div>
                    <p class="text-sm text-gray-600 ml-8">
                      ${item.description || ''}
                    </p>
                  </div>
                  <div class="flex items-center space-x-4">
                    <span class="text-2xl font-bold text-indigo-600">$${item.user_price}</span>
                    <button onclick="removeFromCart(${item.cart_id})" 
                            class="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        
        <!-- Footer -->
        ${items.length > 0 ? `
          <div class="border-t border-gray-200 p-6 bg-gray-50">
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg font-semibold text-gray-700">${i18n.t('cartTotal') || '总计'}:</span>
              <span class="text-3xl font-bold text-indigo-600">$${total.toFixed(2)}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <button onclick="clearCart()" 
                      class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold">
                <i class="fas fa-trash mr-2"></i>${i18n.t('clearCart') || '清空购物车'}
              </button>
              <button onclick="proceedToCheckout()" 
                      class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-lg">
                <i class="fas fa-credit-card mr-2"></i>${i18n.t('checkout') || '结算'}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCart();
      }
    });
    
  } catch (error) {
    console.error('Show cart error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Close cart modal
function closeCart() {
  const modal = document.getElementById('cart-modal');
  if (modal) {
    modal.remove();
  }
}

// Remove item from cart
async function removeFromCart(cartId) {
  try {
    await axios.delete(`/api/cart/${cartId}`);
    showNotification(i18n.t('removeFromCart') || '已从购物车移除', 'success');
    closeCart();
    await MarketplaceManager.updateCartCount();
    // Reopen cart to show updated list
    setTimeout(() => showCart(), 300);
  } catch (error) {
    console.error('Remove from cart error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Clear entire cart
async function clearCart() {
  try {
    if (!confirm(i18n.t('confirmClearCart') || '确定要清空购物车吗？')) {
      return;
    }
    
    // Get all cart items
    const cartResponse = await axios.get('/api/cart');
    const items = cartResponse.data.cart_items || [];
    
    // Delete each item
    for (const item of items) {
      await axios.delete(`/api/cart/${item.cart_id}`);
    }
    
    showNotification(i18n.t('cartCleared') || '购物车已清空', 'success');
    closeCart();
    await MarketplaceManager.updateCartCount();
  } catch (error) {
    console.error('Clear cart error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Proceed to checkout with marketplace API
async function proceedToCheckout() {
  try {
    // Get cart items
    const cartResponse = await axios.get('/api/cart');
    const items = cartResponse.data.cart_items || [];
    
    if (items.length === 0) {
      showNotification(i18n.t('cartEmpty') || '购物车是空的', 'error');
      return;
    }
    
    // 为每个商品计算用户应付价格
    items.forEach(item => {
      let userPrice = item.price_user || 0;
      if (currentUser && currentUser.subscription_tier) {
        if (currentUser.subscription_tier === 'super') {
          userPrice = item.price_super || item.price_user || 0;
        } else if (currentUser.subscription_tier === 'premium') {
          userPrice = item.price_premium || item.price_user || 0;
        }
      }
      item.user_price = userPrice;
    });
    
    // Close cart modal
    closeCart();
    
    // Show checkout modal with PayPal - use user's tiered pricing
    const total = items.reduce((sum, item) => sum + parseFloat(item.user_price), 0);
    
    const checkoutModal = document.createElement('div');
    checkoutModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    checkoutModal.id = 'checkout-modal';
    
    checkoutModal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-credit-card text-indigo-600 mr-2"></i>${i18n.t('checkout') || '结算'}
        </h2>
        
        <div class="mb-6">
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <p class="text-sm text-gray-600 mb-2">${i18n.t('orderSummary') || '订单摘要'}:</p>
            ${items.map(item => `
              <div class="flex justify-between text-sm mb-1">
                <span>${item.name || item.product_name}</span>
                <span class="font-semibold">$${item.user_price}</span>
              </div>
            `).join('')}
            <div class="border-t border-gray-300 mt-3 pt-3 flex justify-between font-bold text-lg">
              <span>${i18n.t('total') || '总计'}:</span>
              <span class="text-indigo-600">$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- PayPal Button Container -->
          <div id="paypal-checkout-button" class="mb-4"></div>
          
          <!-- Loading indicator while PayPal initializes -->
          <div id="paypal-loading" class="text-center py-4">
            <i class="fas fa-spinner fa-spin text-indigo-600 text-2xl mb-2"></i>
            <p class="text-sm text-gray-600">${i18n.t('loadingPayPal') || '正在加载PayPal...'}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <button onclick="closeCheckout()" class="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold">
            <i class="fas fa-times mr-2"></i>${i18n.t('cancel') || '取消'}
          </button>
          <button onclick="confirmCheckout()" id="confirm-checkout-btn" class="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg">
            <i class="fas fa-check mr-2"></i>${i18n.t('confirmPayment') || '确认支付'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(checkoutModal);
    
    // Store cart items globally for confirmCheckout function
    window.currentCheckoutItems = items;
    
    // Always hide loading indicator after a short delay (whether PayPal loads or not)
    setTimeout(() => {
      const loadingEl = document.getElementById('paypal-loading');
      if (loadingEl) loadingEl.style.display = 'none';
    }, 2000);
    
    // Initialize PayPal button
    if (window.paypal) {
      try {
        paypal.Buttons({
          createOrder: async () => {
            try {
              // Get cart items from global variable
              const checkoutItems = window.currentCheckoutItems;
              if (!checkoutItems || checkoutItems.length === 0) {
                throw new Error('No items in checkout');
              }
              
              // Create order with cart items
              const orderResponse = await axios.post('/api/payment/cart/create-order', {
                items: checkoutItems.map(item => ({
                  id: item.id,
                  tier: item.subscription_tier,
                  item_type: item.item_type,
                  price_usd: item.price_usd || item.price_user || item.user_price,
                  duration_days: item.duration_days
                }))
              });
              return orderResponse.data.orderId;
            } catch (error) {
              console.error('Create order error:', error);
              showNotification(i18n.t('paymentFailed') || '支付失败', 'error');
              throw error;
            }
          },
          onApprove: async (data) => {
            try {
              showNotification(i18n.t('processingPayment') || '正在处理支付...', 'info');
              
              // Capture payment
              const captureResponse = await axios.post('/api/payment/cart/capture-order', {
                orderId: data.orderID
              });
              
              showNotification(i18n.t('paymentSuccess') || '支付成功！', 'success');
              closeCheckout();
              
              // Clear cart
              await axios.delete('/api/cart');
              await updateCartCount();
              
              // IMPORTANT: Refresh user info from server before reload
              // This updates the user role and subscription status in localStorage
              try {
                const userResponse = await axios.get('/api/auth/settings');
                const updatedUser = userResponse.data;
                // Update localStorage with new user info
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                currentUser = updatedUser;
                window.currentUser = currentUser;
              } catch (err) {
                console.error('Failed to refresh user info:', err);
              }
              
              // Reload page to show updated menu and permissions
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } catch (error) {
              console.error('Capture order error:', error);
              showNotification(i18n.t('paymentFailed') || '支付失败', 'error');
            }
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            showNotification(i18n.t('paymentFailed') || '支付失败', 'error');
          }
        }).render('#paypal-checkout-button').then(() => {
          // Hide loading indicator after PayPal button renders successfully
          const loadingEl = document.getElementById('paypal-loading');
          if (loadingEl) loadingEl.style.display = 'none';
          
          // Keep both buttons visible - users can choose PayPal or direct payment
          console.log('PayPal button rendered successfully');
        }).catch((err) => {
          console.error('PayPal button render error:', err);
          // Keep the confirm button visible if PayPal fails
          const loadingEl = document.getElementById('paypal-loading');
          if (loadingEl) loadingEl.style.display = 'none';
        });
      } catch (error) {
        console.error('PayPal initialization error:', error);
        const loadingEl = document.getElementById('paypal-loading');
        if (loadingEl) loadingEl.style.display = 'none';
      }
    } else {
      console.warn('PayPal SDK not loaded');
      // PayPal not loaded, hide loading indicator
      const loadingEl = document.getElementById('paypal-loading');
      if (loadingEl) loadingEl.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Checkout error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Close checkout modal
function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.remove();
  }
  // Clean up global variable
  delete window.currentCheckoutItems;
}

// Confirm checkout - creates test payment (sandbox mode)
async function confirmCheckout() {
  try {
    const items = window.currentCheckoutItems;
    if (!items || items.length === 0) {
      showNotification(i18n.t('cartEmpty') || '购物车是空的', 'error');
      return;
    }
    
    // Show confirmation dialog - use user_price (tiered pricing)
    const total = items.reduce((sum, item) => sum + parseFloat(item.user_price || 0), 0).toFixed(2);
    if (!confirm(i18n.t('confirmPayment') + '?\n\n' + (i18n.t('total') || '总计') + ': $' + total)) {
      return;
    }
    
    // Disable button to prevent double-click
    const confirmBtn = document.getElementById('confirm-checkout-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (i18n.t('processing') || '处理中...');
    }
    
    showNotification(i18n.t('processingPayment') || '正在处理支付...', 'info');
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Process marketplace checkout
    const checkoutResponse = await axios.post('/api/marketplace/checkout');
    
    showNotification(i18n.t('paymentSuccess') || '支付成功！', 'success');
    closeCheckout();
    
    // Update cart count
    await MarketplaceManager.updateCartCount();
    
    // Refresh the current page to show updated purchases
    setTimeout(() => {
      if (currentView === 'marketplace') {
        MarketplaceManager.renderMarketplacePage();
      } else {
        window.location.reload();
      }
    }, 1500);
    
  } catch (error) {
    console.error('Confirm checkout error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Unknown error';
    showNotification(i18n.t('paymentFailed') || '支付失败: ' + errorMessage, 'error');
    
    const confirmBtn = document.getElementById('confirm-checkout-btn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-check mr-2"></i>' + (i18n.t('confirmPayment') || '确认支付');
    }
  }
}

// Initialize cart count on page load
if (currentUser && authToken) {
  updateCartCount();
}

// ============ Invitation System ============

let currentInvitation = null;

async function showInviteModal(reviewId) {
  try {
    // Create invitation
    const response = await axios.post('/api/invitations/create', { review_id: reviewId });
    currentInvitation = response.data;

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'invite-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-user-plus mr-2 text-purple-600"></i>${i18n.t('inviteToReview')}
            </h2>
            <button onclick="closeInviteModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- Invitation Link -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('invitationLink')}
            </label>
            <div class="flex items-center space-x-2">
              <input type="text" id="invitation-url" value="${currentInvitation.url}" readonly
                     class="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
              <button onclick="copyInvitationLink()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition whitespace-nowrap">
                <i class="fas fa-copy mr-2"></i>${i18n.t('copyLink')}
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-clock mr-1"></i>${i18n.t('invitationExpires')}
            </p>
          </div>

          <!-- QR Code -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('qrCode')}
            </label>
            <div class="flex justify-center p-4 bg-gray-50 rounded-lg">
              <div id="qrcode"></div>
            </div>
          </div>

          <!-- Email Form -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ${i18n.t('sendByEmail')}
            </label>
            <textarea id="invitation-emails" rows="3"
                      placeholder="${i18n.t('emailPlaceholder')}"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            <button onclick="sendInvitationEmails()" 
                    class="mt-3 w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-paper-plane mr-2"></i>${i18n.t('sendInvitation')}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Generate QR Code using QRCode.js CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.onload = () => {
      new QRCode(document.getElementById('qrcode'), {
        text: currentInvitation.url,
        width: 200,
        height: 200
      });
    };
    document.head.appendChild(script);

  } catch (error) {
    console.error('Failed to create invitation:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

function closeInviteModal() {
  const modal = document.getElementById('invite-modal');
  if (modal) {
    modal.remove();
  }
  currentInvitation = null;
}

function copyInvitationLink() {
  const input = document.getElementById('invitation-url');
  input.select();
  document.execCommand('copy');
  showNotification(i18n.t('linkCopied'), 'success');
}

async function sendInvitationEmails() {
  const emailsText = document.getElementById('invitation-emails').value.trim();
  if (!emailsText) {
    showNotification(i18n.t('emailAddresses') + ' ' + i18n.t('required'), 'error');
    return;
  }

  // Parse emails (split by comma, semicolon, or newline)
  const emails = emailsText.split(/[,;\n]/).map(e => e.trim()).filter(e => e);
  
  if (emails.length === 0) {
    showNotification(i18n.t('emailAddresses') + ' ' + i18n.t('required'), 'error');
    return;
  }

  try {
    const response = await axios.post('/api/invitations/send-email', {
      token: currentInvitation.token,
      emails: emails
    });

    showNotification(i18n.t('invitationSent') + ` (${response.data.success_count})`, 'success');
    document.getElementById('invitation-emails').value = '';
  } catch (error) {
    console.error('Failed to send invitation emails:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showInvitationLandingPage(token) {
  try {
    const response = await axios.get(`/api/invitations/verify/${token}`);
    const { review, referrer } = response.data;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
        <div class="max-w-4xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">
              <i class="fas fa-gift mr-3 text-purple-600"></i>${i18n.t('joinSharedReview')}
            </h1>
            <p class="text-gray-600">
              <i class="fas fa-user-circle mr-2"></i>
              ${i18n.t('invitedBy')}: <strong>${escapeHtml(referrer?.username || 'Unknown')}</strong>
            </p>
          </div>

          <!-- Review Preview Card -->
          <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${escapeHtml(review.title)}</h2>
                <p class="text-sm text-gray-600">
                  <i class="fas fa-user mr-1"></i> ${escapeHtml(review.creator_name)}
                  <span class="mx-2">•</span>
                  <i class="fas fa-calendar mr-1"></i> ${new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            ${review.description ? `
              <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <p class="text-gray-700">${escapeHtml(review.description)}</p>
              </div>
            ` : ''}

            <!-- Review Answers Preview (first 3) -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">
                <i class="fas fa-list-ul mr-2"></i>${i18n.t('reviewContent')} 
                <span class="text-sm text-gray-500">(${i18n.t('preview')})</span>
              </h3>
              ${response.data.answers.slice(0, 3).map((answer, index) => `
                <div class="border-l-4 border-indigo-500 pl-4 py-2">
                  <p class="font-medium text-gray-700 mb-1">
                    ${index + 1}. ${escapeHtml(answer.question_text || answer.question_text_en || 'Question')}
                  </p>
                  <p class="text-gray-600">${escapeHtml(answer.answer || '')}</p>
                </div>
              `).join('')}
              ${response.data.answers.length > 3 ? `
                <p class="text-center text-gray-500 italic">
                  ... ${i18n.t('andMore')} ${response.data.answers.length - 3} ${i18n.t('questions')}
                </p>
              ` : ''}
            </div>
          </div>

          <!-- CTA Card -->
          <div class="bg-white rounded-lg shadow-xl p-8 text-center">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
              ${i18n.t('joinNow')}
            </h3>
            <p class="text-gray-600 mb-6">
              ${i18n.t('registerToViewFullReview') || '注册账号以查看完整复盘内容'}
            </p>
            <button onclick="showRegisterWithReferral('${token}')" 
                    class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition transform hover:scale-105 shadow-lg">
              <i class="fas fa-user-plus mr-2"></i>${i18n.t('register')}
            </button>
            <div class="mt-6 flex justify-center">
              <a href="https://review-system.pages.dev/" 
                 class="inline-block bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition transform hover:scale-105 shadow">
                <i class="fas fa-sign-in-alt mr-2"></i>${i18n.t('login')}
              </a>
            </div>
            <p class="mt-4 text-xs text-gray-400">
              ${i18n.t('haveAccount')} 
            </p>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to verify invitation:', error);
    showNotification(i18n.t('invitationInvalid') || '邀请链接无效或已过期', 'error');
    setTimeout(() => showHomePage(), 2000);
  }
}

function showRegisterWithReferral(token) {
  // Store referral token
  sessionStorage.setItem('referral_token', token);
  // Show register page
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800">${i18n.t('register')}</h2>
          <p class="text-gray-600 mt-2">${i18n.t('joinReviewSystem') || '加入复盘系统'}</p>
        </div>
        
        <form id="register-form" class="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('username')}</label>
            <input type="text" id="register-username" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('email')}</label>
            <input type="email" id="register-email" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('password')}</label>
            <input type="password" id="register-password" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('confirmPassword')}</label>
            <input type="password" id="register-confirm-password" required
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <button type="submit" 
                  class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
            ${i18n.t('register')}
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', handleReferralRegister);
}

function showLoginWithReferral(token) {
  // Store referral token
  sessionStorage.setItem('referral_token', token);
  // Show login page
  showLogin();
}

async function handleReferralRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const referralToken = sessionStorage.getItem('referral_token');

  if (password !== confirmPassword) {
    showNotification(i18n.t('passwordMismatch') || '密码不匹配', 'error');
    return;
  }

  try {
    const response = await axios.post('/api/auth/register', {
      email,
      password,
      username,
      referral_token: referralToken
    });

    // Clear referral token
    sessionStorage.removeItem('referral_token');
    
    // Clear any stored auth data - user should login manually
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.currentUser = null;
    authToken = null;
    axios.defaults.headers.common['Authorization'] = '';
    
    // Clear URL parameters to prevent showing invitation page again
    window.history.replaceState({}, document.title, window.location.pathname);
    
    showNotification(i18n.t('registerSuccess'), 'success');
    setTimeout(() => showLogin(), 1500);
  } catch (error) {
    console.error('Register error:', error);
    showNotification(i18n.t('registerFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Team Invitation Landing Page
async function showTeamInvitationLandingPage(token) {
  try {
    const response = await axios.get(`/api/teams/invitations/verify/${token}`);
    const { team_id, team_name, team_description, role, inviter_name, invitee_email } = response.data;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div class="max-w-3xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">
              <i class="fas fa-users mr-3 text-blue-600"></i>${i18n.t('teamInvitation') || '团队邀请'}
            </h1>
            <p class="text-gray-600">
              <i class="fas fa-user-circle mr-2"></i>
              ${i18n.t('invitedBy') || '邀请人'}: <strong>${escapeHtml(inviter_name)}</strong>
            </p>
          </div>

          <!-- Team Info Card -->
          <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <i class="fas fa-users text-4xl text-blue-600"></i>
              </div>
              <h2 class="text-3xl font-bold text-gray-800 mb-2">${escapeHtml(team_name)}</h2>
              ${team_description ? `
                <p class="text-gray-600 mt-4">${escapeHtml(team_description)}</p>
              ` : ''}
            </div>

            <div class="border-t border-gray-200 pt-6 mt-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-center p-4 bg-blue-50 rounded-lg">
                  <i class="fas fa-envelope text-blue-600 text-2xl mr-3"></i>
                  <div>
                    <p class="text-sm text-gray-600">${i18n.t('invitedEmail') || '受邀邮箱'}</p>
                    <p class="font-medium text-gray-800">${escapeHtml(invitee_email)}</p>
                  </div>
                </div>
                <div class="flex items-center p-4 bg-indigo-50 rounded-lg">
                  <i class="fas fa-user-tag text-indigo-600 text-2xl mr-3"></i>
                  <div>
                    <p class="text-sm text-gray-600">${i18n.t('yourRole') || '您的角色'}</p>
                    <p class="font-medium text-gray-800">${escapeHtml(role)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 class="font-semibold text-gray-800 mb-3">
                <i class="fas fa-check-circle text-green-600 mr-2"></i>${i18n.t('teamMemberBenefits') || '团队成员权益'}
              </h3>
              <ul class="space-y-2 text-gray-700">
                <li><i class="fas fa-check text-green-500 mr-2"></i>${i18n.t('accessTeamReviews') || '访问团队复盘内容'}</li>
                <li><i class="fas fa-check text-green-500 mr-2"></i>${i18n.t('collaborateWithMembers') || '与团队成员协作'}</li>
                <li><i class="fas fa-check text-green-500 mr-2"></i>${i18n.t('shareYourReviews') || '分享您的复盘'}</li>
                <li><i class="fas fa-check text-green-500 mr-2"></i>${i18n.t('participateDiscussions') || '参与团队讨论'}</li>
              </ul>
            </div>
          </div>

          <!-- CTA Card -->
          <div class="bg-white rounded-lg shadow-xl p-8 text-center">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
              ${i18n.t('readyToJoin') || '准备加入团队？'}
            </h3>
            <p class="text-gray-600 mb-6">
              ${i18n.t('loginOrRegisterToAccept') || '登录或注册以接受邀请'}
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button onclick="showLoginForTeamInvite('${token}')" 
                      class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition transform hover:scale-105 shadow-lg">
                <i class="fas fa-sign-in-alt mr-2"></i>${i18n.t('login') || '登录'}
              </button>
              <button onclick="showRegisterForTeamInvite('${token}')" 
                      class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 shadow-lg">
                <i class="fas fa-user-plus mr-2"></i>${i18n.t('register') || '注册'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to verify team invitation:', error);
    showNotification(i18n.t('invitationInvalid') || '邀请链接无效或已过期', 'error');
    setTimeout(() => showHomePage(), 2000);
  }
}

// Show login page and store team invitation token
function showLoginForTeamInvite(token) {
  sessionStorage.setItem('team_invite_token', token);
  showLogin();
}

// Show register page and store team invitation token
function showRegisterForTeamInvite(token) {
  sessionStorage.setItem('team_invite_token', token);
  showRegister();
}

// Accept team invitation after login/register
async function acceptTeamInvitation(token) {
  try {
    const response = await axios.post(`/api/teams/invitations/accept/${token}`);
    const { team_id, role } = response.data;
    
    showNotification(i18n.t('teamJoinSuccess') || '成功加入团队！', 'success');
    
    // Redirect to teams page after 1.5 seconds
    setTimeout(() => {
      showTeamsManagement();
    }, 1500);
  } catch (error) {
    console.error('Failed to accept team invitation:', error);
    showNotification(
      i18n.t('teamJoinFailed') || '加入团队失败：' + (error.response?.data?.error || error.message), 
      'error'
    );
    // Still show dashboard even if invitation acceptance fails
    setTimeout(() => showDashboard(), 2000);
  }
}

// ========================================
// Google Calendar Integration
// ========================================

/**
 * Add review to Google Calendar
 * @param {number} reviewId - Review ID
 */
async function addToGoogleCalendar(reviewId) {
  try {
    console.log('Adding review to Google Calendar:', reviewId);
    
    // Check if scheduled_at is set in the form
    const scheduledAtInput = document.getElementById('edit-scheduled-at');
    if (scheduledAtInput && !scheduledAtInput.value) {
      showNotification(i18n.t('pleaseSetScheduledTime') || '请先设置计划时间并保存', 'error');
      return;
    }
    
    // STEP 1: Save current form data first to ensure data is up-to-date
    const saveResult = await saveEditReviewSilently(reviewId);
    if (!saveResult) {
      showNotification(i18n.t('saveFailed') || '保存失败，请重试', 'error');
      return;
    }
    
    // STEP 2: Get calendar link from backend (with updated data)
    const response = await axios.get(`/api/calendar/link/${reviewId}`);
    const calendarUrl = response.data.url;
    
    // STEP 3: Open Google Calendar in new tab
    window.open(calendarUrl, '_blank');
    
    showNotification(i18n.t('openGoogleCalendar'), 'success');
  } catch (error) {
    console.error('Failed to add to Google Calendar:', error);
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    
    // More user-friendly error message
    if (error.response?.status === 400) {
      showNotification(i18n.t('pleaseSetScheduledTime') || '请先设置计划时间并保存', 'error');
    } else {
      showNotification(i18n.t('operationFailed') + ': ' + errorMsg, 'error');
    }
  }
}

// Helper function to save review without showing notification
async function saveEditReviewSilently(reviewId) {
  try {
    const isCreator = window.currentEditIsCreator;
    
    // Collect answers for choice-type questions
    const answers = {};
    const questions = window.currentEditQuestions || [];
    if (questions.length > 0) {
      questions.forEach(q => {
        if (q.question_type === 'single_choice') {
          const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
          if (selected) {
            answers[q.question_number] = selected.value;
          }
        } else if (q.question_type === 'multiple_choice') {
          const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
          if (checked.length > 0) {
            const selectedValues = Array.from(checked).map(cb => cb.value);
            answers[q.question_number] = selectedValues.join(',');
          }
        }
      });
    }
    
    // Build data object
    let data;
    if (isCreator) {
      const title = document.getElementById('review-title').value;
      const description = document.getElementById('review-description').value;
      const timeType = document.getElementById('review-time-type').value;
      const ownerType = document.getElementById('review-owner-type').value;
      const status = document.querySelector('input[name="status"]:checked').value;
      
      // Get calendar fields
      const scheduledAt = document.getElementById('edit-scheduled-at').value || null;
      const location = document.getElementById('edit-location').value || null;
      const reminderMinutes = parseInt(document.getElementById('edit-reminder-minutes').value) || 60;
      
      data = {
        title,
        description: description || null,
        time_type: timeType,
        owner_type: ownerType,
        status,
        scheduled_at: scheduledAt,
        location: location,
        reminder_minutes: reminderMinutes,
        answers
      };
    } else {
      data = { answers };
    }
    
    await axios.put(`/api/reviews/${reviewId}`, data);
    return true;
  } catch (error) {
    console.error('Silent save failed:', error);
    return false;
  }
}

// Auto-save time value for time_with_text questions
async function autoSaveTimeValue(reviewId, questionNumber) {
  try {
    const timeInput = document.getElementById(`time-input-${questionNumber}`);
    const datetimeValue = timeInput ? timeInput.value : null;
    
    if (!datetimeValue) {
      return; // Don't save if time is empty
    }
    
    // Get current answer sets
    let sets = window.currentAnswerSets || [];
    let index = window.currentSetIndex || 0;
    
    // If no answer sets exist, create one first
    if (sets.length === 0) {
      await createFirstAnswerSetIfNeeded(reviewId);
      sets = window.currentAnswerSets || [];
      index = window.currentSetIndex || 0;
    }
    
    // If still no answer sets, show error
    if (sets.length === 0) {
      showNotification('Failed to create answer set', 'error');
      return;
    }
    
    // Update current answer set's datetime_value
    const currentSet = sets[index];
    const setNumber = parseInt(currentSet.set_number);
    const currentAnswer = currentSet.answers.find(a => a.question_number === questionNumber);
    
    // Check if answer set is locked
    if (currentSet.is_locked === 'yes') {
      console.error('[autoSaveDateTimeValue] Answer set is locked');
      showNotification(i18n.t('answerSetIsLocked') || '当前答案组已锁定，无法编辑。请先解锁。', 'warning');
      return;
    }
    
    if (isNaN(setNumber)) {
      console.error('[autoSaveDateTimeValue] Invalid set number:', currentSet.set_number);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    // Call API to update the datetime_value in current set
    await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, {
      answers: {
        [questionNumber]: {
          answer: currentAnswer?.answer || '',
          datetime_value: datetimeValue
        }
      }
    });
    
    showNotification(i18n.t('timeSaved') || '时间已自动保存', 'success');
    
    // Reload answer sets to refresh display, keep current index
    await loadAnswerSets(reviewId, true);
    renderAnswerSet(reviewId);
  } catch (error) {
    console.error('Auto-save time value error:', error);
    showNotification(i18n.t('autoSaveFailed') || '自动保存失败', 'error');
  }
}

// Add time-type question to Google Calendar
async function addTimeQuestionToCalendar(reviewId, questionNumber) {
  try {
    console.log(`Adding time question ${questionNumber} to Google Calendar`);
    
    // 1. Get the datetime input value
    const datetimeInput = document.getElementById(`time-input-${questionNumber}`);
    if (!datetimeInput || !datetimeInput.value) {
      showNotification(i18n.t('pleaseSetScheduledTime') || '请先选择时间', 'warning');
      return;
    }
    
    // 2. Get question data from current questions
    const questions = window.currentEditQuestions || [];
    const question = questions.find(q => q.question_number === questionNumber);
    if (!question) {
      showNotification(i18n.t('operationFailed') || '操作失败', 'error');
      return;
    }
    
    // 3. Prepare calendar event data
    const title = question.question_text || question.question_text_en || '复盘事项';
    const datetimeStr = datetimeInput.value; // Format: "YYYY-MM-DDTHH:mm"
    
    // CRITICAL: DO NOT use new Date() to avoid timezone conversion
    // Format datetime for Google Calendar (YYYYMMDDTHHMMSS) WITHOUT 'Z' suffix
    // This keeps it as local time which Google Calendar interprets correctly
    const formatLocalTimeForGoogle = (dateTimeStr) => {
      // Add seconds if missing
      const normalized = dateTimeStr.length === 16 ? dateTimeStr + ':00' : dateTimeStr;
      // Input: "YYYY-MM-DDTHH:mm:ss"
      // Output: "YYYYMMDDTHHmmss"
      return normalized.replace(/[-:]/g, '');
    };
    
    const startTime = formatLocalTimeForGoogle(datetimeStr);
    
    // Calculate end time (1 hour later) without timezone conversion
    const [datePart, timePart] = datetimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create date in UTC context to avoid timezone issues during calculation
    const startDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Format end time back to local format
    const pad = (num) => String(num).padStart(2, '0');
    const endTime = 
      `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}` +
      `T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}${pad(endDate.getUTCSeconds())}`;
    
    // 4. Generate Google Calendar URL
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.append('action', 'TEMPLATE');
    calendarUrl.searchParams.append('text', title);
    calendarUrl.searchParams.append('dates', `${startTime}/${endTime}`);
    calendarUrl.searchParams.append('details', `复盘 ID: ${reviewId}\n问题: ${title}`);
    
    // 5. Open in new window
    window.open(calendarUrl.toString(), '_blank');
    
    showNotification(i18n.t('calendarEventCreated') || '日历事件已创建', 'success');
  } catch (error) {
    console.error('Failed to add time question to calendar:', error);
    showNotification(i18n.t('operationFailed') + ': ' + error.message, 'error');
  }
}

// ============ Answer Sets Management (Phase 1) ============

// Global state for answer sets
window.currentAnswerSets = [];
window.currentSetIndex = 0;

/**
 * Load answer sets for a review
 */
async function loadAnswerSets(reviewId, keepCurrentIndex = false, mode = 'edit') {
  const response = await axios.get(`/api/answer-sets/${reviewId}?mode=${mode}`);
  const oldIndex = window.currentSetIndex || 0;

  // Update review metadata (creator, allow_multiple_answers, team_id) for permission checks
  const reviewMeta = response.data.review || {};
  if (!window.currentEditReview) {
    window.currentEditReview = {};
  }
  if (reviewMeta) {
    if (reviewMeta.user_id !== undefined && reviewMeta.user_id !== null) {
      window.currentEditReview.user_id = Number(reviewMeta.user_id);
    }
    if (reviewMeta.allow_multiple_answers !== undefined && reviewMeta.allow_multiple_answers !== null) {
      window.currentEditReview.allow_multiple_answers = reviewMeta.allow_multiple_answers;
    }
    if (reviewMeta.team_id !== undefined) {
      window.currentEditReview.team_id = reviewMeta.team_id;
    }
  }
  // Store lightweight meta for other components (fallback source)
  const metaCreatorId = window.currentEditReview?.user_id ?? (reviewMeta.user_id != null ? Number(reviewMeta.user_id) : null) ?? window.answerSetsMeta?.review_creator_id ?? null;
  window.answerSetsMeta = {
    review_creator_id: metaCreatorId,
    allow_multiple_answers: window.currentEditReview?.allow_multiple_answers ?? reviewMeta.allow_multiple_answers ?? window.answerSetsMeta?.allow_multiple_answers ?? 'yes',
    team_id: window.currentEditReview?.team_id ?? reviewMeta.team_id ?? window.answerSetsMeta?.team_id ?? null
  };
  
  // Sort answer sets by created_at in descending order (newest first)
  let sets = response.data.sets || [];
  sets = sets.map(set => ({
    ...set,
    user_id: set.user_id != null ? Number(set.user_id) : set.user_id,
    set_number: set.set_number != null ? Number(set.set_number) : set.set_number,
    is_locked: set.is_locked || 'no'
  }));
  sets.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
  
  window.currentAnswerSets = sets;
  
  // If keepCurrentIndex is true, maintain the current index (if valid)
  if (keepCurrentIndex && oldIndex >= 0 && oldIndex < window.currentAnswerSets.length) {
    window.currentSetIndex = oldIndex;
  } else {
    // Otherwise, reset to first set or -1 if no sets
    window.currentSetIndex = window.currentAnswerSets.length > 0 ? 0 : -1;
  }
  
  return window.currentAnswerSets;
}

/**
 * Navigate to previous answer set
 */
function navigateToPreviousSet(reviewId) {
  if (window.currentSetIndex > 0) {
    window.currentSetIndex--;
    renderAnswerSet(reviewId);
  }
}

/**
 * Navigate to next answer set
 */
function navigateToNextSet(reviewId) {
  if (window.currentSetIndex < window.currentAnswerSets.length - 1) {
    window.currentSetIndex++;
    renderAnswerSet(reviewId);
  }
}

/**
 * Render current answer set in the UI
 */
function renderAnswerSet(reviewId) {
  const sets = window.currentAnswerSets;
  const index = window.currentSetIndex;
  
  if (index < 0 || index >= sets.length) {
    // No sets available - show empty state
    updateAnswerSetNavigation(reviewId, 0, 0);
    return;
  }
  
  const currentSet = sets[index];
  const questions = window.currentEditQuestions || [];
  
  // Check if current answer set is from a former team member
  const isFormerMember = currentSet && currentSet.is_current_team_member === false;
  
  // Update navigation display
  updateAnswerSetNavigation(reviewId, index + 1, sets.length);
  
  // Apply red background styling to all question containers if former member
  const questionsContainer = document.querySelector('.border-t.pt-6');
  if (questionsContainer) {
    if (isFormerMember) {
      questionsContainer.classList.add('bg-red-50', 'border-red-200', 'rounded-lg', 'p-4');
      questionsContainer.classList.remove('bg-white');
    } else {
      questionsContainer.classList.remove('bg-red-50', 'border-red-200', 'rounded-lg', 'p-4');
      questionsContainer.classList.add('bg-white');
    }
  }
  
  // Set flag to prevent auto-save during rendering
  window.isRenderingAnswerSet = true;
  console.log('[renderAnswerSet] Starting render, flag set to TRUE, set index:', index);
  console.log('[renderAnswerSet] Current set:', currentSet);
  console.log('[renderAnswerSet] isFormerMember:', isFormerMember);
  console.log('[renderAnswerSet] Questions count:', questions.length);
  console.log('[renderAnswerSet] Questions:', questions);
  
  // Update answer displays for each question
  questions.forEach(q => {
    console.log('[renderAnswerSet] Processing question:', q.question_number, 'type:', q.question_type);
    const answer = currentSet.answers.find(a => a.question_number === q.question_number);
    const answerText = answer ? answer.answer : '';
    
    // Update answer display element
    const answerElement = document.getElementById(`answer-display-${q.question_number}`);
    console.log('[renderAnswerSet] answerElement for question', q.question_number, ':', answerElement ? 'found' : 'NOT FOUND');
    if (!answerElement) {
      console.warn('[renderAnswerSet] Skipping question', q.question_number, '- answerElement not found');
      return;
    }
    
    // Handle different question types
    console.log('[renderAnswerSet] Question', q.question_number, 'has options:', q.options ? 'YES' : 'NO');
    if (q.question_type === 'single_choice' && q.options) {
      console.log('[renderAnswerSet] Rendering single_choice for question', q.question_number);
      // Render single choice with radio buttons
      const options = JSON.parse(q.options);
      // DO NOT use onchange in HTML - we'll add event listeners after rendering
      answerElement.innerHTML = `
        <div class="space-y-2">
          ${options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isChecked = answerText === letter;
            const bgColor = isFormerMember ? (isChecked ? 'bg-red-100 border-red-400' : 'bg-red-50 border-red-200') : (isChecked ? 'bg-blue-50 border-blue-400' : 'border-gray-300');
            const textColor = isFormerMember ? 'text-red-900' : 'text-gray-900';
            return `
              <label class="flex items-start p-3 border rounded-lg ${isFormerMember ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'} ${bgColor}">
                <input type="radio" 
                       name="set-question${q.question_number}" 
                       value="${letter}" 
                       ${isChecked ? 'checked' : ''}
                       ${isFormerMember ? 'disabled' : ''}
                       data-question-number="${q.question_number}"
                       data-review-id="${reviewId}"
                       class="mt-1 mr-3 flex-shrink-0 answer-set-radio">
                <span class="text-sm ${textColor}">${escapeHtml(opt)}</span>
              </label>
            `;
          }).join('')}
        </div>
        ${answer ? `
          <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'} mt-2">
            <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
          </p>
        ` : ''}
      `;
    } else if (q.question_type === 'multiple_choice' && q.options) {
      console.log('[renderAnswerSet] Rendering multiple_choice for question', q.question_number);
      // Render multiple choice with checkboxes
      const options = JSON.parse(q.options);
      const selectedLetters = answerText ? answerText.split(',').map(a => a.trim()) : [];
      // DO NOT use onchange in HTML - we'll add event listeners after rendering
      answerElement.innerHTML = `
        <div class="space-y-2">
          ${options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isChecked = selectedLetters.includes(letter);
            const bgColor = isFormerMember ? (isChecked ? 'bg-red-100 border-red-400' : 'bg-red-50 border-red-200') : (isChecked ? 'bg-blue-50 border-blue-400' : 'border-gray-300');
            const textColor = isFormerMember ? 'text-red-900' : 'text-gray-900';
            return `
              <label class="flex items-start p-3 border rounded-lg ${isFormerMember ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'} ${bgColor}">
                <input type="checkbox" 
                       name="set-question${q.question_number}" 
                       value="${letter}" 
                       ${isChecked ? 'checked' : ''}
                       ${isFormerMember ? 'disabled' : ''}
                       data-question-number="${q.question_number}"
                       data-review-id="${reviewId}"
                       class="mt-1 mr-3 flex-shrink-0 answer-set-checkbox">
                <span class="text-sm ${textColor}">${escapeHtml(opt)}</span>
              </label>
            `;
          }).join('')}
        </div>
        ${answer ? `
          <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'} mt-2">
            <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
          </p>
        ` : ''}
      `;
    } else if (q.question_type === 'time_with_text') {
      // Render time with text type - no "answer" label, just show the answer with edit button (hidden when locked)
      const isLocked = currentSet.is_locked === 'yes';
      console.log('[renderAnswerSet] time_with_text - Question:', q.question_number, 'isLocked:', isLocked, 'currentSet.is_locked:', currentSet.is_locked);
      
      let contentHtml = '';
      if (answerText) {
        const editButtonHtml = !isLocked && !isFormerMember ? `
                <button type="button" 
                        onclick="editAnswerInSet(${reviewId}, ${q.question_number})"
                        class="absolute top-2 right-2 px-3 py-1 bg-white border border-indigo-300 rounded text-xs text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500 transition-colors">
                  <i class="fas fa-edit mr-1"></i>${i18n.t('edit')}
                </button>
              ` : '';
        const bgColor = isFormerMember ? 'bg-red-100' : 'bg-blue-50';
        const borderColor = isFormerMember ? 'border-red-500' : 'border-blue-500';
        const textColor = isFormerMember ? 'text-red-900' : 'text-gray-700';
        contentHtml = `
            <div class="relative">
              <div class="p-3 ${bgColor} border-l-4 ${borderColor} rounded-r-lg ${isLocked || isFormerMember ? '' : 'pr-20'}">
                <p class="text-sm ${textColor} whitespace-pre-wrap">${escapeHtml(answerText)}</p>
              </div>
              ${editButtonHtml}
            </div>
          `;
      } else {
        if (isLocked || isFormerMember) {
          const noAnswerBg = isFormerMember ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300';
          const noAnswerText = isFormerMember ? 'text-red-400' : 'text-gray-400';
          contentHtml = `
              <div class="${noAnswerText} text-sm italic p-3 ${noAnswerBg} rounded-lg border-2 border-dashed">
                <i class="fas fa-lock mr-1"></i>${i18n.t('noAnswerInThisSet')}
              </div>
            `;
        } else {
          contentHtml = `
              <div onclick="editEmptyAnswerInSet(${reviewId}, ${q.question_number})" 
                   class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400">
                <i class="fas fa-plus-circle mr-1"></i>${i18n.t('noAnswerInThisSet')} <span class="text-xs">(${i18n.t('clickToAdd')})</span>
              </div>
            `;
        }
      }
      
      const timestampHtml = answer ? `
            <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'}">
              <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
            </p>
          ` : '';
      
      answerElement.innerHTML = `
        <div class="space-y-3">
          ${contentHtml}
          ${timestampHtml}
        </div>
      `;
      
      // Update the time input field with datetime_value from current answer set
      const timeInput = document.getElementById(`time-input-${q.question_number}`);
      if (timeInput && answer && answer.datetime_value) {
        timeInput.value = answer.datetime_value.slice(0, 16);
      } else if (timeInput) {
        // Clear time input if no datetime_value in this set
        timeInput.value = '';
      }
    } else {
      // Default text type - show answer with edit button (hidden when locked)
      const isLocked = currentSet.is_locked === 'yes';
      console.log('[renderAnswerSet] default text - Question:', q.question_number, 'isLocked:', isLocked, 'currentSet.is_locked:', currentSet.is_locked, 'answerText:', answerText ? 'exists' : 'empty');
      if (answerText) {
        const editButtonHtml = !isLocked && !isFormerMember ? `
              <button type="button" 
                      onclick="editAnswerInSet(${reviewId}, ${q.question_number})"
                      class="absolute top-2 right-2 px-3 py-1 bg-white border border-indigo-300 rounded text-xs text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500 transition-colors">
                <i class="fas fa-edit mr-1"></i>${i18n.t('edit')}
              </button>
            ` : '';
        const bgColor = isFormerMember ? 'bg-red-100' : 'bg-blue-50';
        const borderColor = isFormerMember ? 'border-red-500' : 'border-blue-500';
        const textColor = isFormerMember ? 'text-red-900' : 'text-gray-700';
        const timestampColor = isFormerMember ? 'text-red-600' : 'text-gray-500';
        answerElement.innerHTML = `
          <div class="relative">
            <div class="p-3 ${bgColor} border-l-4 ${borderColor} rounded-r-lg ${isLocked || isFormerMember ? '' : 'pr-20'}">
              <p class="text-sm ${textColor} whitespace-pre-wrap">${escapeHtml(answerText)}</p>
              <p class="text-xs ${timestampColor} mt-2">
                <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
              </p>
            </div>
            ${editButtonHtml}
          </div>
        `;
      } else {
        if (isLocked || isFormerMember) {
          const noAnswerBg = isFormerMember ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300';
          const noAnswerText = isFormerMember ? 'text-red-400' : 'text-gray-400';
          answerElement.innerHTML = `
            <div class="${noAnswerText} text-sm italic p-3 ${noAnswerBg} rounded-lg border-2 border-dashed">
              <i class="fas fa-lock mr-1"></i>${i18n.t('noAnswerInThisSet')}
            </div>
          `;
        } else {
          answerElement.innerHTML = `
            <div onclick="editEmptyAnswerInSet(${reviewId}, ${q.question_number})" 
                 class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400">
              <i class="fas fa-plus-circle mr-1"></i>${i18n.t('noAnswerInThisSet')} <span class="text-xs">(${i18n.t('clickToAdd')})</span>
            </div>
          `;
        }
      }
    }
  });
  
  // Now that rendering is complete, attach event listeners to radio and checkbox inputs
  // This ensures events are only triggered by user interactions, not programmatic changes
  
  // Attach listeners to radio buttons (single choice)
  const radioButtons = document.querySelectorAll('.answer-set-radio');
  console.log('[renderAnswerSet] Found', radioButtons.length, 'radio buttons');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', function(e) {
      console.log('[Radio Change] Event triggered, isRenderingAnswerSet:', window.isRenderingAnswerSet);
      if (window.isRenderingAnswerSet) {
        console.log('[Radio Change] Blocked during rendering');
        return;
      }
      const reviewId = parseInt(this.getAttribute('data-review-id'));
      const questionNumber = parseInt(this.getAttribute('data-question-number'));
      const value = this.value;
      console.log('[Radio Change] User interaction detected:', { reviewId, questionNumber, value });
      console.log('[Radio Change] Calling updateAnswerInSet...');
      updateAnswerInSet(reviewId, questionNumber, value);
    });
  });
  
  // Attach listeners to checkboxes (multiple choice)
  const checkboxes = document.querySelectorAll('.answer-set-checkbox');
  console.log('[renderAnswerSet] Found', checkboxes.length, 'checkboxes');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function(e) {
      console.log('[Checkbox Change] Event triggered, isRenderingAnswerSet:', window.isRenderingAnswerSet);
      if (window.isRenderingAnswerSet) {
        console.log('[Checkbox Change] Blocked during rendering');
        return;
      }
      const reviewId = parseInt(this.getAttribute('data-review-id'));
      const questionNumber = parseInt(this.getAttribute('data-question-number'));
      console.log('[Checkbox Change] User interaction detected:', { reviewId, questionNumber });
      console.log('[Checkbox Change] Calling updateMultipleChoiceInSet...');
      updateMultipleChoiceInSet(reviewId, questionNumber);
    });
  });
  
  // Clear the rendering flag immediately after attaching event listeners
  // Since we're now using addEventListener instead of inline onchange, 
  // we don't need to worry about delayed events
  window.isRenderingAnswerSet = false;
  console.log('[renderAnswerSet] Rendering complete, flag set to FALSE');
  
  // Update lock button to reflect current answer set's lock status
  const isLocked = currentSet.is_locked === 'yes';
  const currentUserId = window.currentUser?.id;
  // Use loose equality to handle string vs number comparison
  const isOwnSet = currentSet && currentSet.user_id == currentUserId;
  console.log('[renderAnswerSet] Final lock status check:');
  console.log('  - currentSet.is_locked:', currentSet.is_locked);
  console.log('  - typeof currentSet.is_locked:', typeof currentSet.is_locked);
  console.log('  - isLocked (=== "yes"):', isLocked);
  console.log('  - currentSet.user_id:', currentSet.user_id, 'type:', typeof currentSet.user_id);
  console.log('  - currentUserId:', currentUserId, 'type:', typeof currentUserId);
  console.log('  - isOwnSet:', isOwnSet);
  console.log('  - Full currentSet object:', JSON.stringify(currentSet, null, 2));
  updateAnswerSetLockButton(isLocked);
  updateAnswerEditability(isLocked, isOwnSet);
  
  // Store current set index for lock function
  window.currentAnswerSetIndex = index;
}

/**
 * Update answer set navigation display
 */
function updateAnswerSetNavigation(reviewId, currentNum, totalNum) {
  const navElement = document.getElementById('answer-set-navigation');
  if (!navElement) return;
  
  // Check if multiple answer sets are allowed
  const allowMultipleAnswers = window.currentEditReview?.allow_multiple_answers === 'yes';
  
  const hasPrev = currentNum > 1;
  const hasNext = currentNum < totalNum;
  
  // Get current answer set info
  const currentSet = totalNum > 0 && currentNum > 0 ? window.currentAnswerSets[currentNum-1] : null;
  const currentUserId = window.currentUser?.id;
  const isLocked = currentSet?.is_locked === 'yes';
  const isOwnSet = currentSet && currentSet.user_id === currentUserId;
  const isFormerMember = currentSet && currentSet.is_current_team_member === false;
  
  // If allow_multiple_answers is 'no', hide navigation buttons
  if (!allowMultipleAnswers) {
    navElement.innerHTML = `
      <div class="flex items-center justify-center p-4 ${isFormerMember ? 'bg-red-50 border-2 border-red-200' : 'bg-indigo-50'} rounded-lg mb-4">
        <div class="text-center">
          <p class="text-sm ${isFormerMember ? 'text-red-700' : 'text-gray-600'}">${i18n.t('answerSet') || '答案组'}</p>
          <p class="text-xl font-bold ${isFormerMember ? 'text-red-600' : 'text-indigo-600'}">${currentNum} / ${totalNum}</p>
          ${currentSet ? `
            <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'} mt-1 ${isFormerMember ? 'bg-red-100 px-3 py-1 rounded-md inline-block' : ''}">
              <i class="fas fa-user mr-1"></i>${escapeHtml(currentSet.username || 'Unknown')}
              ${isFormerMember ? `<span class="ml-2 px-2 py-0.5 text-xs bg-yellow-400 text-yellow-900 rounded-full"><i class="fas fa-exclamation-triangle mr-1"></i>${i18n.t('formerTeamMember') || '此队员已离开团队'}</span>` : ''}
            </p>
            <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'}">
              <i class="fas fa-clock mr-1"></i>${currentSet.created_at || ''}
            </p>
            ${isLocked ? `<span class="inline-block px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full mt-1"><i class="fas fa-lock mr-1"></i>${i18n.t('locked') || '已锁定'}</span>` : ''}
          ` : ''}
        </div>
      </div>
    `;
    return;
  }
  
  // If allow_multiple_answers is 'yes', show full navigation with buttons
  navElement.innerHTML = `
    <div class="flex items-center justify-between p-4 ${isFormerMember ? 'bg-red-50 border-2 border-red-200' : 'bg-indigo-50'} rounded-lg mb-4">
      <button onclick="navigateToPreviousSet(${reviewId})" 
              ${!hasPrev ? 'disabled' : ''}
              class="px-4 py-2 bg-white border ${isFormerMember ? 'border-red-300' : 'border-gray-300'} rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <i class="fas fa-arrow-left mr-2"></i>${i18n.t('previousSet') || '上一组'}
      </button>
      
      <div class="text-center">
        <p class="text-sm ${isFormerMember ? 'text-red-700' : 'text-gray-600'}">${i18n.t('answerSet') || '答案组'}</p>
        <p class="text-xl font-bold ${isFormerMember ? 'text-red-600' : 'text-indigo-600'}">${currentNum} / ${totalNum}</p>
        ${currentSet ? `
          <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'} mt-1 ${isFormerMember ? 'bg-red-100 px-3 py-1 rounded-md inline-block' : ''}">
            <i class="fas fa-user mr-1"></i>${escapeHtml(currentSet.username || 'Unknown')}
            ${isOwnSet && !isFormerMember ? '<span class="text-green-600 ml-1">(You)</span>' : ''}
            ${isFormerMember ? `<span class="ml-2 px-2 py-0.5 text-xs bg-yellow-400 text-yellow-900 rounded-full"><i class="fas fa-exclamation-triangle mr-1"></i>${i18n.t('formerTeamMember') || '此队员已离开团队'}</span>` : ''}
          </p>
          <p class="text-xs ${isFormerMember ? 'text-red-600' : 'text-gray-500'}">
            <i class="fas fa-clock mr-1"></i>${currentSet.created_at || ''}
          </p>
          ${isLocked ? `<span class="inline-block px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full mt-1"><i class="fas fa-lock mr-1"></i>${i18n.t('locked') || '已锁定'}</span>` : ''}
        ` : ''}
      </div>
      
      <button onclick="navigateToNextSet(${reviewId})" 
              ${!hasNext ? 'disabled' : ''}
              class="px-4 py-2 bg-white border ${isFormerMember ? 'border-red-300' : 'border-gray-300'} rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        ${i18n.t('nextSet') || '下一组'}<i class="fas fa-arrow-right ml-2"></i>
      </button>
    </div>
  `;
  
  // Update lock button state after navigation update
  if (currentSet) {
    updateAnswerSetLockButton(isLocked);
  }
}

/**
 * Show inline editor for empty answer in current set
 */
async function editEmptyAnswerInSet(reviewId, questionNumber) {
  const answerElement = document.getElementById(`answer-display-${questionNumber}`);
  if (!answerElement) return;
  
  // Replace placeholder with inline editor
  answerElement.innerHTML = `
    <div class="space-y-2">
      <textarea id="inline-answer-${questionNumber}" 
                class="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                rows="3"
                placeholder="${i18n.t('enterAnswer')}"
                autofocus></textarea>
      <div class="flex justify-end space-x-2">
        <button type="button" onclick="cancelInlineAnswerEdit(${reviewId}, ${questionNumber})" 
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
          ${i18n.t('cancel')}
        </button>
        <button type="button" onclick="saveInlineAnswer(${reviewId}, ${questionNumber})" 
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          <i class="fas fa-save mr-1"></i>${i18n.t('save')}
        </button>
      </div>
    </div>
  `;
  
  // Focus on textarea
  const textarea = document.getElementById(`inline-answer-${questionNumber}`);
  if (textarea) {
    textarea.focus();
  }
}

/**
 * Cancel inline answer edit
 */
function cancelInlineAnswerEdit(reviewId, questionNumber) {
  // Re-render the current answer set to restore original state
  renderAnswerSet(reviewId);
}

/**
 * Save inline answer to current set
 */
async function saveInlineAnswer(reviewId, questionNumber) {
  const textarea = document.getElementById(`inline-answer-${questionNumber}`);
  const answer = textarea ? textarea.value.trim() : '';
  
  // Check if this question is required
  const questions = window.currentEditQuestions || [];
  const question = questions.find(q => q.question_number === questionNumber);
  
  if (!answer) {
    console.log(`[saveInlineAnswer] Q${questionNumber}: Answer is empty, checking required status`);
    console.log(`[saveInlineAnswer] Question:`, question);
    console.log(`[saveInlineAnswer] Required:`, question?.required);
    
    // Check if this is a required question
    if (question && question.required === 'yes') {
      // Required question - show error and keep editing
      showNotification(i18n.t('thisQuestionRequired') || '此问题必须回答', 'error');
      // Keep the textarea focused so user can continue editing
      if (textarea) {
        textarea.focus();
      }
      return;
    }
    
    // Optional question (required='no' or not set) - save empty value
    console.log(`[saveInlineAnswer] Q${questionNumber}: Optional question, saving empty value`);
  }
  
  try {
    const sets = window.currentAnswerSets || [];
    const index = window.currentSetIndex || 0;
    
    console.log('[saveInlineAnswer] Debug info:', {
      reviewId,
      questionNumber,
      setsLength: sets.length,
      currentIndex: index,
      currentAnswerSets: sets
    });
    
    if (sets.length === 0) {
      showNotification('No answer set found', 'error');
      return;
    }
    
    const currentSet = sets[index];
    const setNumber = currentSet.set_number;
    
    console.log('[saveInlineAnswer] Current set:', currentSet);
    console.log('[saveInlineAnswer] Set number:', setNumber, 'Type:', typeof setNumber);
    console.log('[saveInlineAnswer] Lock status:', currentSet.is_locked);
    console.log('[saveInlineAnswer] API URL:', `/api/answer-sets/${reviewId}/${setNumber}`);
    
    // OWNERSHIP CHECK
    // In edit mode (default), backend already filters to return only current user's answer sets
    // So if we have a currentSet here in edit mode, it MUST belong to current user
    // We only need to verify this for safety
    
    const currentUserId = window.currentUser?.id;
    
    console.log('[saveInlineAnswer] Ownership debug:', {
      currentSetUserId: currentSet?.user_id,
      currentSetUserIdType: typeof currentSet?.user_id,
      currentUserId: currentUserId,
      currentUserIdType: typeof currentUserId,
      hasCurrentUser: !!window.currentUser,
      strictComparison: currentSet?.user_id === currentUserId,
      looseComparison: currentSet?.user_id == currentUserId,
      currentUserFull: window.currentUser
    });
    
    console.log('[saveInlineAnswer] Comparison details:', {
      leftSide: currentSet?.user_id,
      rightSide: currentUserId,
      leftType: typeof currentSet?.user_id,
      rightType: typeof currentUserId,
      areEqual: currentSet?.user_id == currentUserId
    });
    
    // Use loose equality to handle string vs number comparison
    let isOwnSet = currentSet && currentSet.user_id == currentUserId;
    
    // FALLBACK: If user_id is missing from currentSet (possible backend issue),
    // and we're in edit mode, assume it's the user's own set since backend filtered it
    if (!isOwnSet && !currentSet.user_id && currentUserId) {
      console.warn('[saveInlineAnswer] currentSet.user_id is missing, assuming ownership (edit mode)');
      isOwnSet = true;
    }
    
    console.log('[saveInlineAnswer] Final ownership result:', isOwnSet);
    
    // TEMPORARY: Disable ownership check to allow editing
    // This is a workaround while investigating why backend returns other users' answer sets
    if (!isOwnSet) {
      console.warn('[saveInlineAnswer] OWNERSHIP CHECK FAILED - but allowing save anyway (temporary workaround)');
      console.warn('[saveInlineAnswer] currentSet belongs to user_id:', currentSet?.user_id);
      console.warn('[saveInlineAnswer] current logged in user_id:', currentUserId);
      console.warn('[saveInlineAnswer] This should be investigated - backend should filter answer sets in edit mode!');
      // TEMPORARILY COMMENTED OUT to allow save:
      // showNotification(i18n.t('onlyOwnerCanEditAnswers') || '只能编辑自己的答案组', 'warning');
      // return;
    }
    
    // Check if answer set is locked
    if (currentSet.is_locked === 'yes') {
      console.error('[saveInlineAnswer] Answer set is locked');
      showNotification(i18n.t('answerSetIsLocked') || '当前答案组已锁定，无法编辑。请先解锁。', 'warning');
      return;
    }
    
    // Ensure setNumber is a valid integer
    const cleanSetNumber = parseInt(setNumber);
    if (isNaN(cleanSetNumber)) {
      console.error('[saveInlineAnswer] Invalid set number:', setNumber);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    // For all question types, just save the answer text
    let answerData = answer;
    
    // Call API to update the answer in current set
    const response = await axios.put(`/api/answer-sets/${reviewId}/${cleanSetNumber}`, {
      answers: {
        [questionNumber]: answerData
      }
    });
    
    if (response.data) {
      showNotification(i18n.t('answerSaved') || '答案已保存', 'success');
      
      // Reload answer sets to refresh display, keep current index
      await loadAnswerSets(reviewId, true);
      
      // Only re-render the specific question that was saved
      // Don't call renderAnswerSet() which re-renders ALL questions
      renderSingleAnswer(reviewId, questionNumber);
    }
  } catch (error) {
    console.error('Save inline answer error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

/**
 * Update single choice answer in current set
 */
async function updateAnswerInSet(reviewId, questionNumber, value) {
  console.log('[updateAnswerInSet] 函数被调用！', { reviewId, questionNumber, value });
  console.log('[updateAnswerInSet] isRenderingAnswerSet:', window.isRenderingAnswerSet);
  
  // Prevent auto-save during rendering
  if (window.isRenderingAnswerSet) {
    console.log('[updateAnswerInSet] Skipping save during render');
    return;
  }
  
  console.log('[updateAnswerInSet] 开始保存流程...');
  
  // V6.7.0: Check if this is a required question and value is empty
  const questions = window.currentEditQuestions || [];
  const question = questions.find(q => q.question_number === questionNumber);
  
  if (!value && question && question.required === 'yes') {
    console.log(`[updateAnswerInSet] Q${questionNumber}: Required question, cannot save empty value`);
    showNotification(i18n.t('thisQuestionRequired') || '此问题必须回答', 'error');
    return;
  }
  
  try {
    let sets = window.currentAnswerSets || [];
    let index = window.currentSetIndex || 0;
    
    console.log('[updateAnswerInSet] 答案组数量:', sets.length);
    console.log('[updateAnswerInSet] 当前索引:', index);
    
    // If no answer sets exist, create one first
    if (sets.length === 0) {
      console.log('[updateAnswerInSet] No answer sets found, creating first set...');
      await createFirstAnswerSetIfNeeded(reviewId);
      // Reload sets after creation
      sets = window.currentAnswerSets || [];
      index = window.currentSetIndex || 0;
      
      if (sets.length === 0) {
        showNotification(i18n.t('autoSaveFailed') || '自动保存失败', 'error');
        return;
      }
    }
    
    const currentSet = sets[index];
    const setNumber = parseInt(currentSet.set_number);
    
    console.log('[updateAnswerInSet] 当前答案组:', currentSet);
    console.log('[updateAnswerInSet] 组编号:', setNumber, 'Type:', typeof setNumber);
    console.log('[updateAnswerInSet] 锁定状态:', currentSet.is_locked);
    console.log('[updateAnswerInSet] 准备调用 API，值为:', value, '(类型:', typeof value, ')');
    
    // OWNERSHIP CHECK
    const currentUserId = window.currentUser?.id;
    let isOwnSet = currentSet && currentSet.user_id == currentUserId;
    
    // FALLBACK: If user_id missing and we're in edit mode, assume ownership
    if (!isOwnSet && !currentSet.user_id && currentUserId) {
      console.warn('[updateAnswerInSet] user_id missing, assuming ownership (edit mode)');
      isOwnSet = true;
    }
    
    console.log('[updateAnswerInSet] Ownership check:', {
      currentSetUserId: currentSet?.user_id,
      currentUserId: currentUserId,
      isOwnSet: isOwnSet
    });
    
    if (!isOwnSet) {
      console.warn('[updateAnswerInSet] OWNERSHIP CHECK FAILED - but allowing save anyway (temporary)');
      // TEMPORARILY COMMENTED OUT:
      // showNotification(i18n.t('onlyOwnerCanEditAnswers') || '只能编辑自己的答案组', 'warning');
      // return;
    }
    
    // Check if answer set is locked
    if (currentSet.is_locked === 'yes') {
      console.error('[updateAnswerInSet] Answer set is locked');
      showNotification(i18n.t('answerSetIsLocked') || '当前答案组已锁定，无法编辑。请先解锁。', 'warning');
      return;
    }
    
    if (isNaN(setNumber)) {
      console.error('[updateAnswerInSet] Invalid set number:', currentSet.set_number);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    // V6.7.0: Allow empty string to be saved (user wants to clear the answer)
    // Call API to update the answer in current set
    const response = await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, {
      answers: {
        [questionNumber]: value || ''  // Explicitly send empty string if value is falsy
      }
    });
    
    console.log('[updateAnswerInSet] API 响应:', response.data);
    
    if (response.data) {
      showNotification(i18n.t('choiceSaved') || '选项已自动保存', 'success');
      console.log('[updateAnswerInSet] 保存成功！重新加载答案组...');
      
      // Reload answer sets to refresh the in-memory data
      // DO NOT re-render immediately to avoid triggering new change events
      await loadAnswerSets(reviewId, true);
      console.log('[updateAnswerInSet] 答案组已重新加载');
    }
  } catch (error) {
    console.error('[updateAnswerInSet] 保存失败！', error);
    console.error('[updateAnswerInSet] 错误详情:', error.response?.data);
    showNotification(i18n.t('autoSaveFailed') || '自动保存失败', 'error');
  }
}

/**
 * Update multiple choice answer in current set
 */
async function updateMultipleChoiceInSet(reviewId, questionNumber) {
  console.log('[updateMultipleChoiceInSet] 函数被调用！', { reviewId, questionNumber });
  console.log('[updateMultipleChoiceInSet] isRenderingAnswerSet:', window.isRenderingAnswerSet);
  
  // Prevent auto-save during rendering
  if (window.isRenderingAnswerSet) {
    console.log('[updateMultipleChoiceInSet] Skipping save during render');
    return;
  }
  
  console.log('[updateMultipleChoiceInSet] 开始保存流程...');
  
  try {
    const checked = document.querySelectorAll(`input[name="set-question${questionNumber}"]:checked`);
    const values = Array.from(checked).map(cb => cb.value);
    const answer = values.join(',');
    
    console.log('[updateMultipleChoiceInSet] 选中的值:', values);
    console.log('[updateMultipleChoiceInSet] 答案字符串:', answer);
    
    // V6.7.0: Check if this is a required question and answer is empty
    const questions = window.currentEditQuestions || [];
    const question = questions.find(q => q.question_number === questionNumber);
    
    if (!answer && question && question.required === 'yes') {
      console.log(`[updateMultipleChoiceInSet] Q${questionNumber}: Required question, cannot save empty value`);
      showNotification(i18n.t('thisQuestionRequired') || '此问题必须回答', 'error');
      return;
    }
    
    let sets = window.currentAnswerSets || [];
    let index = window.currentSetIndex || 0;
    
    console.log('[updateMultipleChoiceInSet] 答案组数量:', sets.length);
    console.log('[updateMultipleChoiceInSet] 当前索引:', index);
    
    // If no answer sets exist, create one first
    if (sets.length === 0) {
      console.log('[updateMultipleChoiceInSet] 没有答案组，创建第一个...');
      await createFirstAnswerSetIfNeeded(reviewId);
      sets = window.currentAnswerSets || [];
      index = window.currentSetIndex || 0;
    }
    
    // Check again after creation attempt
    if (sets.length === 0) {
      console.error('[updateMultipleChoiceInSet] 创建答案组失败');
      showNotification('Failed to create answer set', 'error');
      return;
    }
    
    const currentSet = sets[index];
    const setNumber = parseInt(currentSet.set_number);
    
    console.log('[updateMultipleChoiceInSet] 当前答案组:', currentSet);
    console.log('[updateMultipleChoiceInSet] 组编号:', setNumber, 'Type:', typeof setNumber);
    console.log('[updateMultipleChoiceInSet] 锁定状态:', currentSet.is_locked);
    console.log('[updateMultipleChoiceInSet] 准备调用 API...');
    
    // OWNERSHIP CHECK
    const currentUserId = window.currentUser?.id;
    let isOwnSet = currentSet && currentSet.user_id == currentUserId;
    
    // FALLBACK: If user_id missing and we're in edit mode, assume ownership
    if (!isOwnSet && !currentSet.user_id && currentUserId) {
      console.warn('[updateMultipleChoiceInSet] user_id missing, assuming ownership (edit mode)');
      isOwnSet = true;
    }
    
    console.log('[updateMultipleChoiceInSet] Ownership check:', {
      currentSetUserId: currentSet?.user_id,
      currentUserId: currentUserId,
      isOwnSet: isOwnSet
    });
    
    if (!isOwnSet) {
      console.warn('[updateMultipleChoiceInSet] OWNERSHIP CHECK FAILED - but allowing save anyway (temporary)');
      // TEMPORARILY COMMENTED OUT:
      // showNotification(i18n.t('onlyOwnerCanEditAnswers') || '只能编辑自己的答案组', 'warning');
      // return;
    }
    
    // Check if answer set is locked
    if (currentSet.is_locked === 'yes') {
      console.error('[updateMultipleChoiceInSet] Answer set is locked');
      showNotification(i18n.t('answerSetIsLocked') || '当前答案组已锁定，无法编辑。请先解锁。', 'warning');
      return;
    }
    
    if (isNaN(setNumber)) {
      console.error('[updateMultipleChoiceInSet] Invalid set number:', currentSet.set_number);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    // Call API to update the answer in current set
    const response = await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, {
      answers: {
        [questionNumber]: answer
      }
    });
    
    console.log('[updateMultipleChoiceInSet] API 响应:', response.data);
    
    if (response.data) {
      showNotification(i18n.t('choiceSaved') || '选项已自动保存', 'success');
      console.log('[updateMultipleChoiceInSet] 保存成功！重新加载答案组...');
      
      // Reload answer sets to refresh the in-memory data
      // DO NOT re-render immediately to avoid triggering new change events
      await loadAnswerSets(reviewId, true);
      console.log('[updateMultipleChoiceInSet] 答案组已重新加载');
    }
  } catch (error) {
    console.error('[updateMultipleChoiceInSet] 保存失败！', error);
    console.error('[updateMultipleChoiceInSet] 错误详情:', error.response?.data);
    showNotification(i18n.t('autoSaveFailed') || '自动保存失败', 'error');
  }
}

/**
 * Update time value in current set (for time_with_text questions)
 */
async function updateTimeValueInSet(reviewId, questionNumber) {
  try {
    const timeInput = document.getElementById(`set-time-${questionNumber}`);
    const datetimeValue = timeInput ? timeInput.value : null;
    
    let sets = window.currentAnswerSets || [];
    let index = window.currentSetIndex || 0;
    
    // If no answer sets exist, create one first
    if (sets.length === 0) {
      await createFirstAnswerSetIfNeeded(reviewId);
      sets = window.currentAnswerSets || [];
      index = window.currentSetIndex || 0;
    }
    
    // Check again after creation attempt
    if (sets.length === 0) {
      showNotification('Failed to create answer set', 'error');
      return;
    }
    
    const currentSet = sets[index];
    const setNumber = parseInt(currentSet.set_number);
    const currentAnswer = currentSet.answers.find(a => a.question_number === questionNumber);
    
    // Check if answer set is locked
    if (currentSet.is_locked === 'yes') {
      console.error('[autoSaveDateTimeTitleAndAnswer] Answer set is locked');
      showNotification(i18n.t('answerSetIsLocked') || '当前答案组已锁定，无法编辑。请先解锁。', 'warning');
      return;
    }
    
    if (isNaN(setNumber)) {
      console.error('[autoSaveDateTimeTitleAndAnswer] Invalid set number:', currentSet.set_number);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    // Call API to update the datetime_value in current set
    const response = await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, {
      answers: {
        [questionNumber]: {
          answer: currentAnswer?.answer || '',
          datetime_value: datetimeValue
        }
      }
    });
    
    if (response.data) {
      showNotification(i18n.t('timeSaved') || '时间已自动保存', 'success');
      
      // Reload answer sets to refresh display, keep current index
      await loadAnswerSets(reviewId, true);
      renderAnswerSet(reviewId);
    }
  } catch (error) {
    console.error('Update time value error:', error);
    showNotification(i18n.t('autoSaveFailed') || '自动保存失败', 'error');
  }
}

/**
 * Edit existing answer in set (show inline editor)
 */
function editAnswerInSet(reviewId, questionNumber) {
  const answerElement = document.getElementById(`answer-display-${questionNumber}`);
  if (!answerElement) return;
  
  const sets = window.currentAnswerSets || [];
  const index = window.currentSetIndex || 0;
  const currentSet = sets[index];
  const answer = currentSet.answers.find(a => a.question_number === questionNumber);
  const currentText = answer ? answer.answer : '';
  
  // Check if this is a time_with_text question
  const questions = window.currentEditQuestions || [];
  const question = questions.find(q => q.question_number === questionNumber);
  
  if (question?.question_type === 'time_with_text') {
    // For time questions, edit without "answer" label
    answerElement.innerHTML = `
      <div class="space-y-3">
        <textarea id="inline-answer-${questionNumber}" 
                  class="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                  rows="3"
                  maxlength="${question.datetime_answer_max_length || 200}"
                  placeholder="${i18n.t('enterAnswer')}"
                  autofocus>${escapeHtml(currentText)}</textarea>
        <p class="text-xs text-gray-500">${i18n.t('maxCharacters')}: ${question.datetime_answer_max_length || 200}</p>
        <div class="flex justify-end space-x-2">
          <button type="button" onclick="cancelInlineAnswerEdit(${reviewId}, ${questionNumber})" 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
            ${i18n.t('cancel')}
          </button>
          <button type="button" onclick="saveInlineAnswer(${reviewId}, ${questionNumber})" 
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <i class="fas fa-save mr-1"></i>${i18n.t('save')}
          </button>
        </div>
      </div>
    `;
  } else {
    // For regular text questions
    answerElement.innerHTML = `
      <div class="space-y-2">
        <textarea id="inline-answer-${questionNumber}" 
                  class="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                  rows="3"
                  placeholder="${i18n.t('enterAnswer')}"
                  autofocus>${escapeHtml(currentText)}</textarea>
        <div class="flex justify-end space-x-2">
          <button type="button" onclick="cancelInlineAnswerEdit(${reviewId}, ${questionNumber})" 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
            ${i18n.t('cancel')}
          </button>
          <button type="button" onclick="saveInlineAnswer(${reviewId}, ${questionNumber})" 
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <i class="fas fa-save mr-1"></i>${i18n.t('save')}
          </button>
        </div>
      </div>
    `;
  }
  
  // Focus on textarea
  setTimeout(() => {
    const textarea = document.getElementById(`inline-answer-${questionNumber}`);
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, 100);
}

/**
 * Render single answer display after saving (without affecting other questions)
 */
function renderSingleAnswer(reviewId, questionNumber) {
  const sets = window.currentAnswerSets;
  const index = window.currentSetIndex;
  
  if (index < 0 || index >= sets.length) {
    return;
  }
  
  const currentSet = sets[index];
  const questions = window.currentEditQuestions || [];
  const q = questions.find(question => question.question_number === questionNumber);
  
  if (!q) {
    console.warn(`[renderSingleAnswer] Question ${questionNumber} not found`);
    return;
  }
  
  const answer = currentSet.answers.find(a => a.question_number === q.question_number);
  const answerText = answer ? answer.answer : '';
  
  // Update answer display element
  const answerElement = document.getElementById(`answer-display-${q.question_number}`);
  if (!answerElement) {
    console.warn(`[renderSingleAnswer] Answer element for question ${q.question_number} not found`);
    return;
  }
  
  // Handle different question types (same logic as renderAnswerSet)
  if (q.question_type === 'time_with_text') {
    // Render time with text type
    answerElement.innerHTML = `
      <div class="space-y-3">
        ${answerText ? `
          <div class="relative">
            <div class="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg pr-20">
              <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(answerText)}</p>
            </div>
            <button type="button" 
                    onclick="editAnswerInSet(${reviewId}, ${q.question_number})"
                    class="absolute top-2 right-2 px-3 py-1 bg-white border border-indigo-300 rounded text-xs text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500 transition-colors">
              <i class="fas fa-edit mr-1"></i>${i18n.t('edit')}
            </button>
          </div>
        ` : `
          <div onclick="editEmptyAnswerInSet(${reviewId}, ${q.question_number})" 
               class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400">
            <i class="fas fa-plus-circle mr-1"></i>${i18n.t('noAnswerInThisSet')} <span class="text-xs">(${i18n.t('clickToAdd')})</span>
          </div>
        `}
        ${answer ? `
          <p class="text-xs text-gray-500">
            <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
          </p>
        ` : ''}
      </div>
    `;
    
    // Update the time input field with datetime_value from current answer set
    const timeInput = document.getElementById(`time-input-${q.question_number}`);
    if (timeInput && answer && answer.datetime_value) {
      timeInput.value = answer.datetime_value.slice(0, 16);
    } else if (timeInput) {
      timeInput.value = '';
    }
  } else {
    // Default text type - show answer with edit button
    if (answerText) {
      answerElement.innerHTML = `
        <div class="relative">
          <div class="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg pr-20">
            <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(answerText)}</p>
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
            </p>
          </div>
          <button type="button" 
                  onclick="editAnswerInSet(${reviewId}, ${q.question_number})"
                  class="absolute top-2 right-2 px-3 py-1 bg-white border border-indigo-300 rounded text-xs text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500 transition-colors">
            <i class="fas fa-edit mr-1"></i>${i18n.t('edit')}
          </button>
        </div>
      `;
    } else {
      answerElement.innerHTML = `
        <div onclick="editEmptyAnswerInSet(${reviewId}, ${q.question_number})" 
             class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400">
          <i class="fas fa-plus-circle mr-1"></i>${i18n.t('noAnswerInThisSet')} <span class="text-xs">(${i18n.t('clickToAdd')})</span>
        </div>
      `;
    }
  }
}

/**
 * Create a new answer set for all questions
 */
async function createNewAnswerSet(reviewId) {
  try {
    const questions = window.currentEditQuestions || [];
    
    // Debug: log questions to see what data we have
    console.log('[createNewAnswerSet] Questions:', questions);
    questions.forEach(q => {
      if (q.question_type === 'time_with_text') {
        console.log(`[createNewAnswerSet] Time question ${q.question_number}:`, {
          datetime_value: q.datetime_value,
          datetime_title: q.datetime_title,
          datetime_answer_max_length: q.datetime_answer_max_length
        });
      }
    });
    
    if (questions.length === 0) {
      showNotification('No questions found', 'error');
      return;
    }
    
    // Pre-collect current values from the edit page
    const currentValues = {};
    questions.forEach(q => {
      if (q.question_type === 'text') {
        // Try to get value from new answer input box (if visible)
        const newAnswerBox = document.getElementById(`new-answer-${q.question_number}`);
        if (newAnswerBox && newAnswerBox.value.trim()) {
          currentValues[q.question_number] = newAnswerBox.value.trim();
        }
      } else if (q.question_type === 'single_choice') {
        const selected = document.querySelector(`input[name="question${q.question_number}"]:checked`);
        if (selected) {
          currentValues[q.question_number] = selected.value;
        }
      } else if (q.question_type === 'multiple_choice') {
        const checked = document.querySelectorAll(`input[name="question${q.question_number}"]:checked`);
        if (checked.length > 0) {
          currentValues[q.question_number] = Array.from(checked).map(cb => cb.value);
        }
      }
    });

    // Show modal to collect answers for all questions
    const modalHtml = `
      <div id="answer-set-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              <i class="fas fa-plus-circle mr-2"></i>${i18n.t('createNewSet') || '创建新答案组'}
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              ${i18n.t('pleaseAnswerAllQuestions') || '请回答所有问题以创建新的答案组'}
            </p>
            <div class="mt-2 space-y-4 max-h-96 overflow-y-auto">
              ${questions.map(q => {
                const currentValue = currentValues[q.question_number];
                return `
                <div class="border-b pb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    ${q.question_number}. ${escapeHtml(q.question_text)}
                    ${q.required === 'yes' ? '<span class="text-red-500 ml-1">*</span>' : ''}
                  </label>
                  ${q.question_type === 'single_choice' && q.options ? `
                    <div class="space-y-2">
                      ${JSON.parse(q.options).map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isChecked = currentValue === letter ? 'checked' : '';
                        return `
                          <label class="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name="modal-q${q.question_number}" value="${letter}" ${isChecked} class="mr-2">
                            <span class="text-sm">${escapeHtml(opt)}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  ` : q.question_type === 'multiple_choice' && q.options ? `
                    <div class="space-y-2">
                      ${JSON.parse(q.options).map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isChecked = currentValue && currentValue.includes(letter) ? 'checked' : '';
                        return `
                          <label class="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" name="modal-q${q.question_number}" value="${letter}" ${isChecked} class="mr-2">
                            <span class="text-sm">${escapeHtml(opt)}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  ` : q.question_type === 'time_with_text' ? `
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          <i class="fas fa-clock mr-1"></i>${escapeHtml(q.datetime_title || q.question_text_en || q.question_text || '时间')}
                        </label>
                        <input type="datetime-local" id="modal-datetime-${q.question_number}"
                               value="${q.datetime_value ? q.datetime_value.slice(0, 16) : ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          <i class="fas fa-pen mr-1"></i>${i18n.t('answer') || '答案'}
                        </label>
                        <textarea id="modal-answer-${q.question_number}" rows="3"
                                  maxlength="${q.datetime_answer_max_length || 200}"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                  placeholder="${i18n.t('enterAnswer') || '输入答案...'}">${escapeHtml(currentValue || '')}</textarea>
                        <p class="text-xs text-gray-500 mt-1">${i18n.t('maxCharacters')}: ${q.datetime_answer_max_length || 200}</p>
                      </div>
                    </div>
                  ` : `
                    <textarea id="modal-answer-${q.question_number}" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              placeholder="${i18n.t('enterAnswer') || '输入答案...'}">${escapeHtml(currentValue || '')}</textarea>
                  `}
                </div>
              `;
              }).join('')}
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" onclick="closeAnswerSetModal()" 
                      class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                ${i18n.t('cancel')}
              </button>
              <button type="button" onclick="submitNewAnswerSet(${reviewId})" 
                      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-check mr-2"></i>${i18n.t('create')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Failed to show answer set modal:', error);
    showNotification(i18n.t('operationFailed') + ': ' + error.message, 'error');
  }
}

function closeAnswerSetModal() {
  const modal = document.getElementById('answer-set-modal');
  if (modal) modal.remove();
}

// Toggle section visibility (for collapsible sections)
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const button = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
  
  if (section && button) {
    const isHidden = section.classList.contains('hidden');
    
    if (isHidden) {
      section.classList.remove('hidden');
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
      }
    } else {
      section.classList.add('hidden');
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
      }
    }
  }
}

/**
 * Helper function: Create first answer set if none exists
 * This is called by auto-save functions to ensure there's always an answer set to save to
 */
async function createFirstAnswerSetIfNeeded(reviewId) {
  try {
    const questions = window.currentEditQuestions || [];
    
    if (questions.length === 0) {
      console.error('No questions found for review');
      return;
    }
    
    // Build initial empty answers object
    const answers = {};
    questions.forEach(q => {
      if (q.question_type === 'text' || q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
        answers[q.question_number] = {
          answer: ''
        };
      } else if (q.question_type === 'time_with_text') {
        const datetimeTitle = q.datetime_title || q.question_text_en || q.question_text || '时间';
        answers[q.question_number] = {
          answer: '',
          datetime_value: q.datetime_value || null,
          datetime_title: datetimeTitle,
          datetime_answer: ''
        };
      }
    });
    
    // V6.7.0: Validate required questions before submission
    const validationErrors = validateRequiredQuestions(questions, answers);
    if (validationErrors.length > 0) {
      showRequiredFieldsError(validationErrors);
      return; // Stop submission
    }
    
    // Create new answer set via API
    const response = await axios.post(`/api/answer-sets/${reviewId}`, { answers });
    
    if (response.data.success) {
      // Reload answer sets to get the new set
      await loadAnswerSets(reviewId);
      
      // Set current index to the newly created set (should be the only one or the last one)
      window.currentSetIndex = (window.currentAnswerSets?.length || 1) - 1;
      
      console.log('First answer set created successfully');
      return true;
    }
  } catch (error) {
    console.error('Failed to create first answer set:', error);
    return false;
  }
}

async function submitNewAnswerSet(reviewId) {
  try {
    const questions = window.currentEditQuestions || [];
    const answers = {};
    
    // V6.7.0: Collect all answers first
    questions.forEach(q => {
      if (q.question_type === 'text') {
        const textarea = document.getElementById(`modal-answer-${q.question_number}`);
        answers[q.question_number] = {
          answer: textarea ? textarea.value.trim() : ''
        };
      } else if (q.question_type === 'single_choice') {
        const selected = document.querySelector(`input[name="modal-q${q.question_number}"]:checked`);
        answers[q.question_number] = {
          answer: selected ? selected.value : ''
        };
      } else if (q.question_type === 'multiple_choice') {
        const checked = document.querySelectorAll(`input[name="modal-q${q.question_number}"]:checked`);
        const values = Array.from(checked).map(cb => cb.value);
        answers[q.question_number] = {
          answer: values.join(',')
        };
      } else if (q.question_type === 'time_with_text') {
        const datetimeInput = document.getElementById(`modal-datetime-${q.question_number}`);
        const textarea = document.getElementById(`modal-answer-${q.question_number}`);
        // Use question_text_en or question_text as fallback for datetime_title
        const datetimeTitle = q.datetime_title || q.question_text_en || q.question_text || '时间';
        answers[q.question_number] = {
          answer: textarea ? textarea.value.trim() : '',
          datetime_value: datetimeInput ? datetimeInput.value : (q.datetime_value || null),
          datetime_title: datetimeTitle,
          datetime_answer: textarea ? textarea.value.trim() : ''
        };
      }
    });
    
    // V6.7.0: Validate required fields before submission
    const requiredErrors = [];
    questions.forEach(q => {
      if (q.required === 'yes') {
        const answer = answers[q.question_number];
        const answerText = answer ? answer.answer : '';
        
        if (!answerText || answerText.trim() === '') {
          requiredErrors.push(`${i18n.t('question') || '问题'} ${q.question_number}: ${q.question_text}`);
        }
      }
    });
    
    // If there are required field errors, show them and stop submission
    if (requiredErrors.length > 0) {
      const errorMessage = `${i18n.t('requiredFieldsNotFilled') || '以下必填项未填写'}:\n\n${requiredErrors.join('\n')}`;
      alert(errorMessage);
      return;
    }
    
    // Create new answer set
    const response = await axios.post(`/api/answer-sets/${reviewId}`, { answers });
    
    if (response.data.success) {
      closeAnswerSetModal();
      showNotification(i18n.t('answerSetCreated') || '答案组已创建', 'success');
      
      // Reload answer sets to get the updated list
      try {
        await loadAnswerSets(reviewId);
        
        // Navigate to the new set (last one)
        window.currentSetIndex = window.currentAnswerSets.length - 1;
        renderAnswerSet(reviewId);
      } catch (loadError) {
        console.error('Failed to reload answer sets after creation:', loadError);
        // Answer set was created successfully, but reload failed
        // Just reload the entire edit page to ensure consistency
        showEditReview(reviewId);
      }
    }
  } catch (error) {
    console.error('Failed to create answer set:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============================================
// Mobile Menu Control Functions
// ============================================

function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    if (mobileMenu.classList.contains('hidden')) {
      openMobileMenu();
    } else {
      closeMobileMenu();
    }
  }
}

function openMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.classList.remove('hidden');
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    
    // Animate menu slide in
    setTimeout(() => {
      const menuContent = mobileMenu.querySelector('div > div');
      if (menuContent) {
        menuContent.style.transform = 'translateX(0)';
      }
    }, 10);
  }
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    const menuContent = mobileMenu.querySelector('div > div');
    if (menuContent) {
      menuContent.style.transform = 'translateX(100%)';
    }
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      mobileMenu.classList.add('hidden');
      // Restore body scroll
      document.body.style.overflow = '';
    }, 300);
  }
}

// Update cart count in mobile menu
function updateMobileCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const mobileCartCount = document.getElementById('mobile-cart-count');
  const desktopCartCount = document.getElementById('cart-count');
  
  if (cart.length > 0) {
    if (mobileCartCount) {
      mobileCartCount.textContent = cart.length;
      mobileCartCount.classList.remove('hidden');
    }
    if (desktopCartCount) {
      desktopCartCount.textContent = cart.length;
      desktopCartCount.classList.remove('hidden');
    }
  } else {
    if (mobileCartCount) {
      mobileCartCount.classList.add('hidden');
    }
    if (desktopCartCount) {
      desktopCartCount.classList.add('hidden');
    }
  }
}

// Keywords Management Functions
async function showKeywordsManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-key mr-2"></i>${i18n.t('keywordsManagement')}
        </h2>
        <button onclick="showAddKeywordModal()" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-plus mr-2"></i>${i18n.t('addKeyword')}
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('language')}</label>
          <select id="filter-language" onchange="filterKeywords()" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">${i18n.t('all')}</option>
            <option value="en">English</option>
            <option value="fr">Français (French)</option>
            <option value="es">Español (Spanish)</option>
            <option value="zh">简体中文 (Simplified Chinese)</option>
            <option value="zh-TW">繁體中文 (Traditional Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('keywordType')}</label>
          <select id="filter-type" onchange="filterKeywords()" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">${i18n.t('all')}</option>
            <option value="article">${i18n.t('articleKeyword')}</option>
            <option value="video">${i18n.t('videoKeyword')}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('keywordStatus')}</label>
          <select id="filter-status" onchange="filterKeywords()" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">${i18n.t('all')}</option>
            <option value="1">${i18n.t('keywordActive')}</option>
            <option value="0">${i18n.t('keywordInactive')}</option>
          </select>
        </div>
      </div>

      <!-- Keywords Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('keyword')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('language')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('keywordType')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('keywordStatus')}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="keywords-table-body" class="bg-white divide-y divide-gray-200">
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2"></i>${i18n.t('loading')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  await loadKeywords();
}

let allKeywords = [];

async function loadKeywords() {
  console.log('Loading keywords...');
  try {
    // Check if user is logged in
    if (!currentUser) {
      showNotification('请先登录', 'error');
      showLogin();
      return;
    }
    
    const response = await axios.get('/api/keywords', {
      headers: {
        'X-User-ID': currentUser.id,
        'X-User-Role': currentUser.role
      }
    });

    allKeywords = response.data.keywords || [];
    console.log('Loaded keywords:', allKeywords.length);
    
    // Set default language filter to current language after data is loaded
    const currentLang = i18n.getCurrentLanguage();
    console.log('Current language:', currentLang); // Debug log
    const filterLangSelect = document.getElementById('filter-language');
    if (filterLangSelect && currentLang) {
      filterLangSelect.value = currentLang;
      console.log('Set filter to:', currentLang); // Debug log
    }
    
    // Apply filter to display keywords
    filterKeywords();
  } catch (error) {
    console.error('Failed to load keywords:', error);
    const errorMsg = i18n.t('loadError') || '加载失败';
    showNotification(errorMsg, 'error');
    // Display empty state on error
    const tbody = document.getElementById('keywords-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-4 text-center text-red-500">
            ${errorMsg}
          </td>
        </tr>
      `;
    }
  }
}

function displayKeywords(keywords) {
  const tbody = document.getElementById('keywords-table-body');
  
  if (keywords.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
          ${i18n.t('noData')}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = keywords.map(kw => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${kw.id}</td>
      <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(kw.keyword)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${kw.language === 'zh' ? '中文' : kw.language === 'en' ? 'English' : kw.language === 'fr' ? 'Français' : kw.language === 'ja' ? '日本語' : kw.language === 'es' ? 'Español' : kw.language}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          kw.type === 'article' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }">
          ${kw.type === 'article' ? i18n.t('articleKeyword') : i18n.t('videoKeyword')}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          kw.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">
          ${kw.is_active ? i18n.t('keywordActive') : i18n.t('keywordInactive')}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button onclick="toggleKeywordStatus(${kw.id})" 
                class="text-yellow-600 hover:text-yellow-900" 
                title="${i18n.t('toggleStatus') || '切换状态'}">
          <i class="fas fa-toggle-${kw.is_active ? 'on' : 'off'}"></i>
        </button>
        <button onclick="showEditKeywordModal(${kw.id})" 
                class="text-indigo-600 hover:text-indigo-900" 
                title="${i18n.t('edit') || '编辑'}">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteKeyword(${kw.id})" 
                class="text-red-600 hover:text-red-900" 
                title="${i18n.t('delete') || '删除'}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterKeywords() {
  const languageEl = document.getElementById('filter-language');
  const typeEl = document.getElementById('filter-type');
  const statusEl = document.getElementById('filter-status');
  
  // If elements don't exist, display all keywords
  if (!languageEl || !typeEl || !statusEl) {
    console.log('Filter elements not found, displaying all keywords');
    displayKeywords(allKeywords || []);
    return;
  }
  
  const language = languageEl.value;
  const type = typeEl.value;
  const status = statusEl.value;

  const filtered = (allKeywords || []).filter(kw => {
    if (language && kw.language !== language) return false;
    if (type && kw.type !== type) return false;
    if (status !== '' && kw.is_active !== parseInt(status)) return false;
    return true;
  });

  console.log('Filtering keywords:', { total: allKeywords?.length, filtered: filtered.length, language, type, status });
  displayKeywords(filtered);
}

function showAddKeywordModal() {
  const modalHtml = `
    <div id="keyword-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         onclick="if(event.target === this) closeKeywordModal()">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('addKeyword')}</h2>
        <form id="add-keyword-form" onsubmit="handleAddKeyword(event)">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('keyword')}</label>
            <input type="text" id="keyword-text" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="${i18n.t('keyword')}">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('language')}</label>
            <select id="keyword-language" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="en">English</option>
              <option value="fr">Français (French)</option>
              <option value="es">Español (Spanish)</option>
              <option value="zh">简体中文 (Simplified Chinese)</option>
              <option value="zh-TW">繁體中文 (Traditional Chinese)</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('keywordType')}</label>
            <select id="keyword-type" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="article">${i18n.t('articleKeyword')}</option>
              <option value="video">${i18n.t('videoKeyword')}</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="flex items-center">
              <input type="checkbox" id="keyword-active" checked
                     class="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
              <span class="text-sm font-medium text-gray-700">${i18n.t('keywordActive')}</span>
            </label>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="closeKeywordModal()" 
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
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeKeywordModal() {
  const modal = document.getElementById('keyword-modal');
  if (modal) {
    modal.remove();
  }
}

async function handleAddKeyword(event) {
  event.preventDefault();
  event.stopPropagation();
  
  // Check if user is logged in
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  const keyword = document.getElementById('keyword-text').value;
  const language = document.getElementById('keyword-language').value;
  const type = document.getElementById('keyword-type').value;
  const is_active = document.getElementById('keyword-active').checked ? 1 : 0;

  try {
    await axios.post('/api/keywords', {
      keyword,
      language,
      type,
      is_active
    }, {
      headers: {
        'X-User-ID': currentUser.id,
        'X-User-Role': currentUser.role
      }
    });

    // Close modal first
    closeKeywordModal();
    showNotification(i18n.t('keywordAddedSuccess') || '关键词添加成功', 'success');
    await loadKeywords();
  } catch (error) {
    console.error('Failed to add keyword:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed') || '操作失败', 'error');
  }
}

function showEditKeywordModal(id) {
  const keyword = allKeywords.find(kw => kw.id === id);
  if (!keyword) return;

  const modalHtml = `
    <div id="keyword-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         onclick="if(event.target === this) closeKeywordModal()">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('editKeyword')}</h2>
        <form id="edit-keyword-form" onsubmit="handleEditKeyword(event, ${id})">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('keyword')}</label>
            <input type="text" id="edit-keyword-text" value="${escapeHtml(keyword.keyword)}" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('language')}</label>
            <select id="edit-keyword-language" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="en" ${keyword.language === 'en' ? 'selected' : ''}>English</option>
              <option value="fr" ${keyword.language === 'fr' ? 'selected' : ''}>Français (French)</option>
              <option value="es" ${keyword.language === 'es' ? 'selected' : ''}>Español (Spanish)</option>
              <option value="zh" ${keyword.language === 'zh' ? 'selected' : ''}>简体中文 (Simplified Chinese)</option>
              <option value="zh-TW" ${keyword.language === 'zh-TW' ? 'selected' : ''}>繁體中文 (Traditional Chinese)</option>
              <option value="ja" ${keyword.language === 'ja' ? 'selected' : ''}>日本語 (Japanese)</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('keywordType')}</label>
            <select id="edit-keyword-type" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="article" ${keyword.type === 'article' ? 'selected' : ''}>${i18n.t('articleKeyword')}</option>
              <option value="video" ${keyword.type === 'video' ? 'selected' : ''}>${i18n.t('videoKeyword')}</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="flex items-center">
              <input type="checkbox" id="edit-keyword-active" ${keyword.is_active ? 'checked' : ''}
                     class="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
              <span class="text-sm font-medium text-gray-700">${i18n.t('keywordActive')}</span>
            </label>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="closeKeywordModal()" 
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
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function handleEditKeyword(event, id) {
  event.preventDefault();
  event.stopPropagation();
  
  // Check if user is logged in
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  const keyword = document.getElementById('edit-keyword-text').value;
  const language = document.getElementById('edit-keyword-language').value;
  const type = document.getElementById('edit-keyword-type').value;
  const is_active = document.getElementById('edit-keyword-active').checked ? 1 : 0;

  try {
    await axios.put(`/api/keywords/${id}`, {
      keyword,
      language,
      type,
      is_active
    }, {
      headers: {
        'X-User-ID': currentUser.id,
        'X-User-Role': currentUser.role
      }
    });

    // Close modal first
    closeKeywordModal();
    showNotification(i18n.t('keywordUpdatedSuccess') || '关键词更新成功', 'success');
    await loadKeywords();
  } catch (error) {
    console.error('Failed to update keyword:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed') || '操作失败', 'error');
  }
}

async function deleteKeyword(id) {
  // Check if user is logged in
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  const confirmMessage = i18n.t('confirmDeleteKeyword') || '确定要删除此关键词吗？';
  if (!confirm(confirmMessage)) return;

  try {
    await axios.delete(`/api/keywords/${id}`, {
      headers: {
        'X-User-ID': currentUser.id,
        'X-User-Role': currentUser.role
      }
    });

    const successMessage = i18n.t('keywordDeletedSuccess') || '关键词删除成功';
    showNotification(successMessage, 'success');
    
    // Force reload keywords list
    console.log('Keyword deleted, reloading list...');
    await loadKeywords();
  } catch (error) {
    console.error('Failed to delete keyword:', error);
    const errorMessage = error.response?.data?.error || i18n.t('operationFailed') || '操作失败';
    showNotification(errorMessage, 'error');
  }
}

async function toggleKeywordStatus(id) {
  // Check if user is logged in
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  try {
    await axios.patch(`/api/keywords/${id}/toggle`, {}, {
      headers: {
        'X-User-ID': currentUser.id,
        'X-User-Role': currentUser.role
      }
    });

    showNotification(i18n.t('keywordStatusToggled') || '关键词状态已切换', 'success');
    await loadKeywords();
  } catch (error) {
    console.error('Failed to toggle keyword status:', error);
    showNotification(error.response?.data?.error || i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// ==================== UI Settings Management ====================

async function showUISettingsManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-palette mr-2"></i>${i18n.t('uiSettings')}
        </h2>
      </div>

      <!-- Language Selector -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">${i18n.t('language')}</label>
        <select id="ui-settings-language" onchange="loadUISettings()" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="zh">简体中文 (Simplified Chinese)</option>
          <option value="zh-TW">繁體中文 (Traditional Chinese)</option>
          <option value="en">English</option>
          <option value="fr">Français (French)</option>
          <option value="es">Español (Spanish)</option>
          <option value="ja">日本語 (Japanese)</option>
        </select>
      </div>

      <!-- UI Settings Form -->
      <form id="ui-settings-form" onsubmit="saveUISettings(event)" class="space-y-6">
        <!-- System Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-heading mr-2"></i>${i18n.t('uiSystemTitle')}
          </label>
          <input type="text" id="ui-system-title" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('uiSystemTitle')}">
          <p class="mt-1 text-sm text-gray-500">${i18n.t('displayedInHeader') || '显示在页面头部和浏览器标签页'}</p>
        </div>

        <!-- Homepage Hero Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-star mr-2"></i>${i18n.t('uiHomepageHeroTitle')}
          </label>
          <input type="text" id="ui-hero-title" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('uiHomepageHeroTitle')}">
          <p class="mt-1 text-sm text-gray-500">${i18n.t('mainTitleOnHomepage') || '首页主标题'}</p>
        </div>

        <!-- Homepage Hero Subtitle -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-align-center mr-2"></i>${i18n.t('uiHomepageHeroSubtitle')}
          </label>
          <input type="text" id="ui-hero-subtitle" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('uiHomepageHeroSubtitle')}">
          <p class="mt-1 text-sm text-gray-500">${i18n.t('subtitleOnHomepage') || '首页副标题'}</p>
        </div>

        <!-- About Us Content -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-info-circle mr-2"></i>${i18n.t('uiAboutUsContent')}
          </label>
          <textarea id="ui-about-us" required rows="4"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="${i18n.t('uiAboutUsContent')}"></textarea>
          <p class="mt-1 text-sm text-gray-500">${i18n.t('aboutUsSectionContent') || '关于我们部分的内容'}</p>
        </div>

        <!-- Footer Company Info -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-building mr-2"></i>${i18n.t('uiFooterCompanyInfo')}
          </label>
          <input type="text" id="ui-footer-info" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('uiFooterCompanyInfo')}">
          <p class="mt-1 text-sm text-gray-500">${i18n.t('footerCopyrightInfo') || '页脚版权信息'}</p>
        </div>

        <!-- Team Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-users mr-2"></i>${i18n.t('uiTeamDescription')}
          </label>
          <textarea id="ui-team-description" required rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="${i18n.t('uiTeamDescription')}"></textarea>
          <p class="mt-1 text-sm text-gray-500">${i18n.t('teamIntroText') || '团队介绍文字'}</p>
        </div>

        <!-- Contact Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-envelope mr-2"></i>${i18n.t('uiContactEmail')}
          </label>
          <input type="email" id="ui-contact-email" required
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="${i18n.t('uiContactEmail')}">
          <p class="mt-1 text-sm text-gray-500">${i18n.t('contactEmailDesc') || '联系邮箱地址'}</p>
        </div>

        <!-- Terms of Service -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-file-contract mr-2"></i>${i18n.t('uiTermsOfService')}
          </label>
          <textarea id="ui-terms-of-service" required rows="6" maxlength="500"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="${i18n.t('uiTermsOfService')}"></textarea>
          <p class="mt-1 text-sm text-gray-500">
            <span id="terms-char-count">0</span>/500 ${i18n.t('maxCharacters') || '字符'}
          </p>
        </div>

        <!-- Privacy Policy -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-shield-alt mr-2"></i>${i18n.t('uiPrivacyPolicy')}
          </label>
          <textarea id="ui-privacy-policy" required rows="10" maxlength="800"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="${i18n.t('uiPrivacyPolicy')}"></textarea>
          <p class="mt-1 text-sm text-gray-500">
            <span id="privacy-char-count">0</span>/800 ${i18n.t('maxCharacters') || '字符'}
          </p>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
          <button type="submit" 
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <i class="fas fa-save mr-2"></i>${i18n.t('save')}
          </button>
        </div>
      </form>

      <!-- Loading Overlay -->
      <div id="ui-settings-loading" class="hidden absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
        <i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
      </div>
    </div>
  `;

  // Set current language as default
  const currentLang = i18n.getCurrentLanguage();
  const langSelect = document.getElementById('ui-settings-language');
  if (langSelect && currentLang) {
    langSelect.value = currentLang;
  }

  await loadUISettings();
}

let currentUISettings = {};

async function loadUISettings() {
  console.log('Loading UI settings...');
  try {
    // Check if user is logged in
    if (!currentUser) {
      showNotification('请先登录', 'error');
      showLogin();
      return;
    }

    const language = document.getElementById('ui-settings-language')?.value || 'zh';
    
    // Show loading
    const loadingEl = document.getElementById('ui-settings-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');

    // Fetch all UI settings
    const response = await axios.get('/api/system-settings/category/ui', {
      headers: {
        'X-User-ID': currentUser.id,
        'X-User-Role': currentUser.role
      }
    });

    const settings = response.data.settings || [];
    console.log('Loaded UI settings:', settings.length);
    
    // Store settings
    currentUISettings = {};
    settings.forEach(setting => {
      currentUISettings[setting.setting_key] = setting;
    });

    // Populate form with current language values
    populateUISettingsForm(language);

    // Hide loading
    if (loadingEl) loadingEl.classList.add('hidden');
  } catch (error) {
    console.error('Failed to load UI settings:', error);
    const errorMsg = i18n.t('loadError') || '加载失败';
    showNotification(errorMsg, 'error');
    
    // Hide loading
    const loadingEl = document.getElementById('ui-settings-loading');
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

function populateUISettingsForm(language) {
  // Helper function to get language-specific value
  const getValue = (key) => {
    const setting = currentUISettings[key];
    if (!setting) return '';
    
    // Try to parse as JSON for multi-language support
    try {
      const parsed = JSON.parse(setting.setting_value);
      return parsed[language] || parsed['zh'] || setting.setting_value;
    } catch {
      // If not JSON, return raw value
      return setting.setting_value;
    }
  };

  // Helper function to safely set element value
  const safeSetValue = (elementId, value) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = value || '';
    }
  };

  // Populate form fields with safety checks
  safeSetValue('ui-system-title', getValue('ui_system_title'));
  safeSetValue('ui-hero-title', getValue('ui_homepage_hero_title'));
  safeSetValue('ui-hero-subtitle', getValue('ui_homepage_hero_subtitle'));
  safeSetValue('ui-about-us', getValue('ui_about_us_content'));
  safeSetValue('ui-footer-info', getValue('ui_footer_company_info'));
  safeSetValue('ui-team-description', getValue('ui_team_description'));
  safeSetValue('ui-contact-email', getValue('ui_contact_email'));
  
  // Terms and privacy with character count
  const termsValue = getValue('ui_terms_of_service');
  const privacyValue = getValue('ui_privacy_policy');
  
  const termsEl = document.getElementById('ui-terms-of-service');
  const privacyEl = document.getElementById('ui-privacy-policy');
  
  if (termsEl) {
    termsEl.value = termsValue;
    updateCharCount('terms');
    // Add input event listener for character count
    termsEl.addEventListener('input', () => updateCharCount('terms'));
  }
  
  if (privacyEl) {
    privacyEl.value = privacyValue;
    updateCharCount('privacy');
    // Add input event listener for character count
    privacyEl.addEventListener('input', () => updateCharCount('privacy'));
  }
}

/**
 * Update character count for terms/privacy fields
 */
function updateCharCount(fieldType) {
  const field = document.getElementById(`ui-${fieldType === 'terms' ? 'terms-of-service' : 'privacy-policy'}`);
  const counter = document.getElementById(`${fieldType}-char-count`);
  
  if (field && counter) {
    counter.textContent = field.value.length;
  }
}

async function saveUISettings(event) {
  event.preventDefault();
  event.stopPropagation();
  
  // Check if user is logged in
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }

  const language = document.getElementById('ui-settings-language').value;
  
  // Get form values
  const formValues = {
    'ui_system_title': document.getElementById('ui-system-title').value,
    'ui_homepage_hero_title': document.getElementById('ui-hero-title').value,
    'ui_homepage_hero_subtitle': document.getElementById('ui-hero-subtitle').value,
    'ui_about_us_content': document.getElementById('ui-about-us').value,
    'ui_footer_company_info': document.getElementById('ui-footer-info').value,
    'ui_team_description': document.getElementById('ui-team-description').value,
    'ui_contact_email': document.getElementById('ui-contact-email').value,
    'ui_terms_of_service': document.getElementById('ui-terms-of-service').value,
    'ui_privacy_policy': document.getElementById('ui-privacy-policy').value
  };

  // Show loading
  const loadingEl = document.getElementById('ui-settings-loading');
  if (loadingEl) loadingEl.classList.remove('hidden');

  try {
    // Prepare batch update data
    const updates = [];
    
    for (const [key, value] of Object.entries(formValues)) {
      const setting = currentUISettings[key];
      if (!setting) continue;
      
      // Try to parse existing value as JSON
      let newValue;
      try {
        const parsed = JSON.parse(setting.setting_value);
        // Update the specific language
        parsed[language] = value;
        newValue = JSON.stringify(parsed);
      } catch {
        // If not JSON, create new JSON object
        newValue = JSON.stringify({ [language]: value });
      }
      
      updates.push({
        key: key,
        value: newValue
      });
    }

    // Batch update
    await axios.put('/api/system-settings/batch/update', 
      { settings: updates },
      {
        headers: {
          'X-User-ID': currentUser.id,
          'X-User-Role': currentUser.role
        }
      }
    );

    const successMsg = (typeof i18n !== 'undefined' && i18n.t) ? i18n.t('saveSuccess') : '保存成功';
    showNotification(successMsg, 'success');
    
    // Reload settings
    await loadUISettings();
    
    // Reload dynamic UI settings to update i18n translations globally
    await loadDynamicUISettings();
    
    // Update page title immediately
    const systemTitle = i18n.t('systemTitle');
    if (systemTitle) {
      document.title = systemTitle;
      const pageTitleEl = document.getElementById('page-title');
      if (pageTitleEl) {
        pageTitleEl.textContent = systemTitle;
      }
    }
    
    // IMPORTANT: Re-render current view to reflect changes
    // This ensures all i18n.t() calls get the updated translations
    showNotification('界面设置已更新，正在刷新页面...', 'success');
    
    // Wait a moment for notification to be visible
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Re-render the current view
    if (currentView === 'home') {
      await showHomePage();
    } else if (currentView === 'dashboard') {
      await showDashboard();
    } else if (currentView === 'admin') {
      await showAdmin();
    } else if (currentView === 'my-documents') {
      await showMyDocuments();
    } else {
      // Default to home page if view unknown
      await showHomePage();
    }
  } catch (error) {
    console.error('Failed to save UI settings:', error);
    const errorMsg = error.response?.data?.error || (typeof i18n !== 'undefined' && i18n.t ? i18n.t('saveFailed') : '保存失败');
    showNotification(errorMsg, 'error');
  } finally {
    // Hide loading
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

// ==================== AI Chat Functions ====================

let aiChatHistory = [];

function openAIChat() {
  // Create modal if it doesn't exist
  if (!document.getElementById('ai-chat-modal')) {
    const modalHtml = `
      <div id="ai-chat-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
            <div class="flex items-center gap-3">
              <i class="fas fa-robot text-2xl"></i>
              <div>
                <h3 class="text-lg font-bold">${i18n.t('aiChatTitle')}</h3>
                <p class="text-xs opacity-90">${i18n.t('aiThinking').replace(i18n.t('aiThinking').split('...')[0], '在线服务')}</p>
              </div>
            </div>
            <button onclick="closeAIChat()" class="text-white hover:text-gray-200 transition">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Chat Messages -->
          <div id="ai-chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            <div class="text-center text-gray-500 text-sm">
              <i class="fas fa-comments text-3xl mb-2"></i>
              <p>${i18n.t('aiChatPlaceholder')}</p>
            </div>
          </div>
          
          <!-- Predicted Questions -->
          <div id="ai-predicted-questions" class="px-6 py-3 bg-white border-t border-gray-200 hidden">
            <p class="text-xs text-gray-600 mb-2">${i18n.t('nextQuestions')}</p>
            <div id="predicted-questions-list" class="flex flex-wrap gap-2"></div>
          </div>
          
          <!-- Input Area -->
          <div class="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div class="flex gap-2">
              <input type="text" id="ai-chat-input" placeholder="${i18n.t('aiChatPlaceholder')}"
                     class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     onkeypress="handleAIChatKeyPress(event)">
              <button onclick="sendAIQuestion()" id="ai-send-btn"
                      class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-paper-plane mr-2"></i>${i18n.t('sendQuestion')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
  
  document.getElementById('ai-chat-modal').classList.remove('hidden');
}

function closeAIChat() {
  document.getElementById('ai-chat-modal').classList.add('hidden');
}

function handleAIChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendAIQuestion();
  }
}

async function sendAIQuestion(questionText = null) {
  const input = document.getElementById('ai-chat-input');
  const question = questionText || input.value.trim();
  
  if (!question) {
    showNotification(i18n.t('aiChatPlaceholder'), 'warning');
    return;
  }
  
  // Clear input and disable button
  input.value = '';
  const sendBtn = document.getElementById('ai-send-btn');
  sendBtn.disabled = true;
  
  // Add user message to chat
  addMessageToChat('user', question);
  
  // Show loading message
  const loadingId = addMessageToChat('ai', `<i class="fas fa-spinner fa-spin mr-2"></i>${i18n.t('aiThinking')}`, true);
  
  try {
    const response = await axios.post('/api/resources/ai-chat', 
      { question },
      {
        headers: {
          'X-Language': i18n.language
        }
      }
    );
    
    // Remove loading message
    removeMessageFromChat(loadingId);
    
    // Add AI response
    const answer = response.data.answer || '抱歉，我现在无法回答这个问题。';
    const nextQuestions = response.data.nextQuestions || [];
    
    addMessageToChat('ai', answer);
    
    // Show predicted questions
    if (nextQuestions.length > 0) {
      showPredictedQuestions(nextQuestions);
    }
    
  } catch (error) {
    console.error('AI chat error:', error);
    removeMessageFromChat(loadingId);
    addMessageToChat('ai', `<i class="fas fa-exclamation-triangle mr-2"></i>${i18n.t('aiChatError')}`);
  } finally {
    sendBtn.disabled = false;
  }
}

function addMessageToChat(sender, content, isLoading = false) {
  const messagesContainer = document.getElementById('ai-chat-messages');
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const messageClass = sender === 'user' 
    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ml-auto' 
    : 'bg-white border border-gray-200 text-gray-800';
  
  const messageHtml = `
    <div id="${messageId}" class="flex ${sender === 'user' ? 'justify-end' : 'justify-start'}">
      <div class="${messageClass} rounded-2xl px-4 py-3 max-w-[80%] shadow-sm">
        ${sender === 'ai' ? '<i class="fas fa-robot mr-2 text-purple-600"></i>' : ''}
        <span class="whitespace-pre-wrap">${content}</span>
      </div>
    </div>
  `;
  
  messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageId;
}

function removeMessageFromChat(messageId) {
  const message = document.getElementById(messageId);
  if (message) {
    message.remove();
  }
}

function showPredictedQuestions(questions) {
  const container = document.getElementById('ai-predicted-questions');
  const questionsList = document.getElementById('predicted-questions-list');
  
  questionsList.innerHTML = '';
  questions.forEach(q => {
    const questionBtn = document.createElement('button');
    questionBtn.className = 'px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition border border-purple-200';
    questionBtn.innerHTML = `<i class="fas fa-comment-dots mr-1"></i>${q}`;
    questionBtn.onclick = () => {
      sendAIQuestion(q);
      container.classList.add('hidden');
    };
    questionsList.appendChild(questionBtn);
  });
  
  container.classList.remove('hidden');
}

// ============================================================
// Prompt Editing Modal - Global utility for editing AI prompts
// ============================================================
window.showPromptEditor = function(title, initialPrompt, onConfirm) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    };
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col';
    modal.onclick = (e) => e.stopPropagation();
    
    modal.innerHTML = `
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-edit mr-2 text-blue-600"></i>${title}
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          <i class="fas fa-info-circle mr-1"></i>您可以编辑下方的Prompt，调整后点击"确认生成"
        </p>
      </div>
      
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <textarea id="prompt-editor" 
          class="w-full h-full min-h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="在此编辑AI Prompt...">${initialPrompt}</textarea>
      </div>
      
      <div class="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 bg-gray-50">
        <button id="cancel-prompt" 
          class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
          <i class="fas fa-times mr-2"></i>取消
        </button>
        <button id="confirm-prompt" 
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-check mr-2"></i>确认生成
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Focus textarea
    const textarea = modal.querySelector('#prompt-editor');
    textarea.focus();
    textarea.setSelectionRange(0, 0);
    
    // Cancel button
    modal.querySelector('#cancel-prompt').onclick = () => {
      overlay.remove();
      resolve(null);
    };
    
    // Confirm button
    modal.querySelector('#confirm-prompt').onclick = () => {
      const editedPrompt = textarea.value.trim();
      if (!editedPrompt) {
        showNotification('Prompt不能为空', 'warning');
        return;
      }
      overlay.remove();
      resolve(editedPrompt);
    };
    
    // ESC key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEscape);
        resolve(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
};

// ============================================================================
// AI Settings Management
// ============================================================================
// Global variable to track active tab
let currentAISettingsTab = 'parameters';

async function showAISettingsManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-robot mr-2"></i>智能写作助手
          </h2>
        </div>
        <button id="save-settings-btn" onclick="saveCurrentTabSettings(event)" 
                class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-save mr-2"></i>保存设置
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex space-x-8">
          <button onclick="switchAISettingsTab('parameters')" 
                  id="tab-parameters"
                  class="tab-button py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            <i class="fas fa-cogs mr-2"></i>参数
          </button>
          <button onclick="switchAISettingsTab('templates')" 
                  id="tab-templates"
                  class="tab-button py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            <i class="fas fa-file-alt mr-2"></i>写作模板
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div id="ai-settings-content">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p class="text-gray-600">加载中...</p>
        </div>
      </div>
    </div>
  `;

  // Load initial tab content
  await switchAISettingsTab('parameters');
}

async function switchAISettingsTab(tab) {
  currentAISettingsTab = tab;
  
  // Update tab styles
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('border-indigo-600', 'text-indigo-600');
    btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
  });
  
  const activeTab = document.getElementById(`tab-${tab}`);
  if (activeTab) {
    activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    activeTab.classList.add('border-indigo-600', 'text-indigo-600');
  }
  
  // Update save button visibility
  const saveBtn = document.getElementById('save-settings-btn');
  if (tab === 'parameters') {
    saveBtn.style.display = 'block';
  } else {
    saveBtn.style.display = 'none';
  }
  
  // Load tab content
  if (tab === 'parameters') {
    await loadAISettings();
  } else if (tab === 'templates') {
    await loadWritingTemplates();
  }
}

async function saveCurrentTabSettings(event) {
  if (currentAISettingsTab === 'parameters') {
    await saveAISettings(event);
  }
}

async function loadAISettings() {
  try {
    const response = await axios.get('/api/system-settings/category/ai_writing');
    const settings = response.data.settings;

    const contentDiv = document.getElementById('ai-settings-content');
    contentDiv.innerHTML = `
      <div class="space-y-6">
        <!-- Max Output Tokens Setting -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <label class="block text-lg font-semibold text-gray-800 mb-2">
                <i class="fas fa-cogs mr-2 text-indigo-600"></i>
                最大输出 Token 数量
              </label>
              <p class="text-sm text-gray-600 mb-4">
                控制 AI 生成内容的最大长度。Token 数量越大，可以生成的内容越长。
              </p>
            </div>
            <span class="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              核心参数
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Token 数量
              </label>
              <input 
                type="number" 
                id="ai_max_output_tokens" 
                value="${getSettingValue(settings, 'ai_max_output_tokens')}"
                min="1000"
                max="8192"
                step="512"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-mono"
                oninput="updateTokenPreview(this.value)"
              >
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                范围：1000 - 8192（Gemini API 上限）
              </p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h4 class="text-sm font-medium text-gray-700 mb-3">
                <i class="fas fa-calculator mr-2 text-green-600"></i>
                预估生成能力
              </h4>
              <div id="token-preview" class="space-y-2">
                <!-- Will be populated by JS -->
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="text-sm font-medium text-blue-800 mb-2">
              <i class="fas fa-lightbulb mr-2"></i>Token 与字数关系
            </h4>
            <div class="text-sm text-blue-700 space-y-1">
              <p>• <strong>中文内容</strong>：1 个中文字 ≈ 2-3 tokens</p>
              <p>• <strong>英文内容</strong>：1 个英文单词 ≈ 1-2 tokens</p>
              <p>• <strong>2048 tokens</strong>：约 700-1000 中文字</p>
              <p>• <strong>8192 tokens</strong>：约 2700-4000 中文字</p>
            </div>
          </div>
        </div>

        <!-- Temperature Setting -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <label class="block text-lg font-semibold text-gray-800 mb-2">
            <i class="fas fa-thermometer-half mr-2 text-orange-600"></i>
            创意度 (Temperature)
          </label>
          <p class="text-sm text-gray-600 mb-4">
            控制 AI 生成内容的随机性和创意性。值越高越有创意，值越低越稳定一致。
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <input 
                type="range" 
                id="ai_temperature" 
                value="${getSettingValue(settings, 'ai_temperature')}"
                min="0"
                max="1"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                oninput="updateTemperatureDisplay(this.value)"
              >
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>保守 (0)</span>
                <span id="temperature-value" class="font-mono text-lg text-indigo-600">${getSettingValue(settings, 'ai_temperature')}</span>
                <span>创意 (1)</span>
              </div>
            </div>

            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h4 class="text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                推荐设置
              </h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p>• <strong>0.3-0.5</strong>：专业文档、技术文章</p>
                <p>• <strong>0.7</strong>：一般内容（推荐）</p>
                <p>• <strong>0.8-1.0</strong>：创意写作、营销文案</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Default Word Count Setting -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <label class="block text-lg font-semibold text-gray-800 mb-2">
            <i class="fas fa-text-width mr-2 text-purple-600"></i>
            默认目标字数
          </label>
          <p class="text-sm text-gray-600 mb-4">
            创建新小节时的默认字数设置。
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input 
                type="number" 
                id="ai_default_word_count" 
                value="${getSettingValue(settings, 'ai_default_word_count')}"
                min="100"
                max="5000"
                step="100"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-mono"
              >
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                范围：100 - 5000 字
              </p>
            </div>

            <div class="col-span-2 bg-white rounded-lg p-4 border border-gray-200">
              <h4 class="text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-book-open mr-2 text-green-600"></i>
                字数建议
              </h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p>• <strong>500-1000 字</strong>：简介、概述性内容</p>
                <p>• <strong>1000-2000 字</strong>：标准文章长度（推荐）</p>
                <p>• <strong>2000-3000 字</strong>：深度分析、详细说明</p>
                <p class="text-orange-600">⚠️ 超过 3000 字可能受 Token 限制影响</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Enabled Toggle -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <label class="block text-lg font-semibold text-gray-800 mb-2">
                <i class="fas fa-power-off mr-2 text-green-600"></i>
                启用 AI 写作功能
              </label>
              <p class="text-sm text-gray-600">
                全局开关，关闭后用户将无法使用 AI 写作助手功能。
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                id="ai_enabled" 
                ${getSettingValue(settings, 'ai_enabled') === 'true' ? 'checked' : ''}
                class="sr-only peer"
              >
              <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <i class="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-3"></i>
            <div class="flex-1 text-sm text-yellow-800">
              <p class="font-medium mb-1">重要提示</p>
              <ul class="list-disc list-inside space-y-1">
                <li>修改这些设置将影响所有用户的 AI 内容生成</li>
                <li>建议在非高峰期修改，并提前通知用户</li>
                <li>修改后立即生效，无需重启服务</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize preview
    updateTokenPreview(getSettingValue(settings, 'ai_max_output_tokens'));
  } catch (error) {
    console.error('Error loading AI settings:', error);
    document.getElementById('ai-settings-content').innerHTML = `
      <div class="text-center py-12 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p class="text-lg font-medium">加载设置失败</p>
        <p class="text-sm mt-2">${error.response?.data?.error || error.message}</p>
      </div>
    `;
  }
}

function getSettingValue(settings, key) {
  const setting = settings.find(s => s.setting_key === key);
  return setting ? setting.setting_value : '';
}

function updateTokenPreview(tokens) {
  const tokenNum = parseInt(tokens) || 8192;
  const minChars = Math.floor(tokenNum / 3);
  const maxChars = Math.floor(tokenNum / 2);
  
  document.getElementById('token-preview').innerHTML = `
    <div class="flex items-center justify-between py-2 border-b border-gray-200">
      <span class="text-sm text-gray-600">中文字数范围：</span>
      <span class="text-sm font-mono font-medium text-gray-800">${minChars} - ${maxChars} 字</span>
    </div>
    <div class="flex items-center justify-between py-2 border-b border-gray-200">
      <span class="text-sm text-gray-600">推荐目标字数：</span>
      <span class="text-sm font-mono font-medium text-indigo-600">${Math.floor((minChars + maxChars) / 2)} 字</span>
    </div>
    <div class="flex items-center justify-between py-2">
      <span class="text-sm text-gray-600">生成速度：</span>
      <span class="text-sm font-medium text-gray-800">${Math.ceil(tokenNum / 100)} - ${Math.ceil(tokenNum / 50)} 秒</span>
    </div>
  `;
}

function updateTemperatureDisplay(value) {
  document.getElementById('temperature-value').textContent = parseFloat(value).toFixed(1);
}

async function saveAISettings(event) {
  try {
    const maxTokens = document.getElementById('ai_max_output_tokens').value;
    const temperature = document.getElementById('ai_temperature').value;
    const defaultWordCount = document.getElementById('ai_default_word_count').value;
    const enabled = document.getElementById('ai_enabled').checked;

    // Validate
    const tokensNum = parseInt(maxTokens);
    if (tokensNum < 1000 || tokensNum > 8192) {
      showNotification('Token 数量必须在 1000-8192 之间', 'error');
      return;
    }

    const tempNum = parseFloat(temperature);
    if (tempNum < 0 || tempNum > 1) {
      showNotification('创意度必须在 0-1 之间', 'error');
      return;
    }

    const wordCountNum = parseInt(defaultWordCount);
    if (wordCountNum < 100 || wordCountNum > 5000) {
      showNotification('默认字数必须在 100-5000 之间', 'error');
      return;
    }

    // Show loading
    const saveBtn = event ? event.target : document.querySelector('.save-ai-settings-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
    }

    // Batch update - use correct endpoint
    const response = await axios.put('/api/system-settings/batch/update', {
      settings: [
        { key: 'ai_max_output_tokens', value: maxTokens },
        { key: 'ai_temperature', value: temperature },
        { key: 'ai_default_word_count', value: defaultWordCount },
        { key: 'ai_enabled', value: enabled ? '1' : '0' }
      ]
    });

    if (response.data.success) {
      showNotification('✅ AI 设置已保存！', 'success');
      if (saveBtn) {
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存设置';
        }, 1000);
      }
    }
  } catch (error) {
    console.error('Error saving AI settings:', error);
    showNotification('保存失败: ' + (error.response?.data?.error || error.message), 'error');
    const saveBtn = event ? event.target : document.querySelector('.save-ai-settings-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存设置';
    }
  }
}

// ============================================================
// MarketPlace Management
// ============================================================

async function showMarketplaceManagement(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-store mr-2"></i>MarketPlace 产品管理
          </h2>
          <p class="text-sm text-gray-600 mt-1">管理市场中的产品和服务</p>
        </div>
        <button onclick="showCreateProductModal()" 
                class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-plus mr-2"></i>添加产品
        </button>
      </div>

      <!-- Loading State -->
      <div id="marketplace-products-list">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p class="text-gray-600">加载产品列表中...</p>
        </div>
      </div>
    </div>
  `;

  await loadMarketplaceProducts();
}

async function loadMarketplaceProducts() {
  try {
    const response = await axios.get('/api/marketplace/products/all');
    const products = response.data.products || [];

    const container = document.getElementById('marketplace-products-list');
    
    if (products.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i class="fas fa-box-open text-gray-400 text-5xl mb-4"></i>
          <p class="text-gray-600 text-lg mb-2">暂无产品</p>
          <p class="text-gray-500 text-sm">点击上方"添加产品"按钮创建第一个产品</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销量</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${products.map(product => `
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12 bg-gradient-to-br ${product.is_active ? 'from-indigo-500 to-purple-600' : 'from-gray-400 to-gray-500'} rounded-lg flex items-center justify-center">
                      <i class="fas fa-${getCategoryIcon(product.product_type)} text-white text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium ${product.is_active ? 'text-gray-900' : 'text-gray-500'}">${product.name}</div>
                      <div class="text-sm ${product.is_active ? 'text-gray-500' : 'text-gray-400'}">${(product.description || '').substring(0, 50)}...</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(product.product_type)}">
                    ${getCategoryName(product.product_type)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-xs text-gray-900">
                    <div>普通: <span class="font-semibold">$${product.price_user || 0}</span></div>
                    <div>高级: <span class="font-semibold">$${product.price_premium || 0}</span></div>
                    <div>超级: <span class="font-semibold">$${product.price_super || 0}</span></div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.is_active ? '上架中' : '已下架'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${product.sales_count || 0} 笔
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onclick="editMarketplaceProduct(${product.id})" 
                          class="text-indigo-600 hover:text-indigo-900">
                    <i class="fas fa-edit"></i> 编辑
                  </button>
                  <button onclick="toggleProductStatus(${product.id}, ${product.is_active})" 
                          class="text-${product.is_active ? 'yellow' : 'green'}-600 hover:text-${product.is_active ? 'yellow' : 'green'}-900">
                    <i class="fas fa-${product.is_active ? 'pause' : 'play'}-circle"></i> ${product.is_active ? '下架' : '上架'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading marketplace products:', error);
    document.getElementById('marketplace-products-list').innerHTML = `
      <div class="text-center py-12 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>加载失败: ${error.response?.data?.error || error.message}</p>
      </div>
    `;
  }
}

function getCategoryIcon(category) {
  const icons = {
    'ai_service': 'robot',
    'writing_template': 'file-alt',
    'review_template': 'clipboard-list',
    'template': 'file-alt',  // legacy
    'book_template': 'book',  // legacy
    'other': 'box'
  };
  return icons[category] || 'box';
}

function getCategoryName(category) {
  // Direct Chinese names
  const names = {
    'ai_service': '智能体',
    'writing_template': '写作模板',
    'review_template': '复盘模板',
    'template': '模板',  // legacy
    'book_template': '书籍模板',  // legacy
    'other': '其他'
  };
  return names[category] || category;
}

function getCategoryBadgeColor(category) {
  const colors = {
    'ai_service': 'bg-purple-100 text-purple-800',
    'writing_template': 'bg-blue-100 text-blue-800',
    'review_template': 'bg-green-100 text-green-800',
    'template': 'bg-blue-100 text-blue-800',  // legacy
    'book_template': 'bg-green-100 text-green-800',  // legacy
    'other': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}

function showCreateProductModal() {
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-plus-circle mr-2 text-indigo-600"></i>添加新产品
        </h3>
        <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form onsubmit="handleCreateProduct(event)" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
          <input type="text" id="product-name" required
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="例如：AI 智能写作助手">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">产品描述 *</label>
          <textarea id="product-description" required rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="详细描述产品功能和特点"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">智能体链接</label>
          <input type="text" id="product-agent-link"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="例如：/ai-writing 或 https://example.com">
          <p class="text-xs text-gray-500 mt-1">用户点击"使用"按钮后跳转的链接（内部路径或外部URL）</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
          <select id="product-type" required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="ai_service">AI Agent</option>
            <option value="writing_template">Writing Template</option>
            <option value="review_template">Review Template</option>
            <option value="other">Others</option>
          </select>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">定价设置 *</label>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">普通会员价 ($)</label>
              <input type="number" id="product-price-user" required min="0" step="0.01"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="9.99">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">高级会员价 ($)</label>
              <input type="number" id="product-price-premium" required min="0" step="0.01"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="7.99">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">超级会员价 ($)</label>
              <input type="number" id="product-price-super" required min="0" step="0.01"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="5.99">
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <input type="checkbox" id="product-is-active" checked
                 class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
          <label for="product-is-active" class="text-sm text-gray-700">立即上架销售</label>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onclick="closeProductModal()"
                  class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <i class="fas fa-save mr-2"></i>创建产品
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
}

async function handleCreateProduct(e) {
  e.preventDefault();

  const data = {
    product_type: document.getElementById('product-type').value,
    name: document.getElementById('product-name').value,
    description: document.getElementById('product-description').value,
    agent_link: document.getElementById('product-agent-link').value || null,
    price_user: parseFloat(document.getElementById('product-price-user').value),
    price_premium: parseFloat(document.getElementById('product-price-premium').value),
    price_super: parseFloat(document.getElementById('product-price-super').value),
    is_active: document.getElementById('product-is-active').checked
  };

  try {
    await axios.post('/api/marketplace/products', data);
    showNotification(i18n.t('productCreated') || '✅ 产品创建成功！', 'success');
    closeProductModal();
    
    // Reload the appropriate product list based on current sub-tab
    await reloadMarketplaceProducts();
  } catch (error) {
    console.error('Error creating product:', error);
    showNotification((i18n.t('operationFailed') || '创建失败') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Helper function to reload the correct marketplace product list
async function reloadMarketplaceProducts() {
  // Check current admin sub-tab
  if (currentAdminSubTab === 'marketplace-agents') {
    await loadMarketplaceProductsByCategory('ai_service');
  } else if (currentAdminSubTab === 'marketplace-writing-templates') {
    await loadMarketplaceProductsByCategory('writing_template');
  } else if (currentAdminSubTab === 'marketplace-other') {
    await loadMarketplaceProductsByCategory('other');
  } else if (currentAdminSubTab === 'subscription') {
    // Subscription tab uses the old showSubscriptionManagement
    // No need to reload here as it manages differently
  } else if (currentAdminSubTab === 'templates') {
    // Templates tab - reload the templates management
    const content = document.getElementById('admin-content');
    await showTemplatesManagement(content);
  } else {
    // Fallback to load all products (for old marketplace management)
    await loadMarketplaceProducts();
  }
}

async function editMarketplaceProduct(productId) {
  try {
    const response = await axios.get(`/api/marketplace/products/${productId}`);
    const product = response.data.product;

    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-edit mr-2 text-indigo-600"></i>编辑产品
          </h3>
          <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onsubmit="handleUpdateProduct(event, ${productId})" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
            <input type="text" id="product-name" required value="${product.name}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">产品描述 *</label>
            <textarea id="product-description" required rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${product.description}</textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">智能体链接</label>
            <input type="text" id="product-agent-link" value="${product.agent_link || ''}"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="例如：/ai-writing 或 https://example.com">
            <p class="text-xs text-gray-500 mt-1">用户点击"使用"按钮后跳转的链接（内部路径或外部URL）</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
            <select id="product-type" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="ai_service" ${product.product_type === 'ai_service' ? 'selected' : ''}>AI Agent</option>
              <option value="writing_template" ${product.product_type === 'writing_template' ? 'selected' : ''}>Writing Template</option>
              <option value="review_template" ${product.product_type === 'review_template' ? 'selected' : ''}>Review Template</option>
              <option value="other" ${product.product_type === 'other' ? 'selected' : ''}>Others</option>
            </select>
          </div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">定价设置 *</label>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-600 mb-1">普通会员价 ($)</label>
                <input type="number" id="product-price-user" required min="0" step="0.01" value="${product.price_user || 0}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="9.99">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">高级会员价 ($)</label>
                <input type="number" id="product-price-premium" required min="0" step="0.01" value="${product.price_premium || 0}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="7.99">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">超级会员价 ($)</label>
                <input type="number" id="product-price-super" required min="0" step="0.01" value="${product.price_super || 0}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="5.99">
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input type="checkbox" id="product-is-active" ${product.is_active ? 'checked' : ''}
                   class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
            <label for="product-is-active" class="text-sm text-gray-700">上架销售</label>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onclick="closeProductModal()"
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              取消
            </button>
            <button type="submit"
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <i class="fas fa-save mr-2"></i>保存修改
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error loading product:', error);
    showNotification('加载失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function handleUpdateProduct(e, productId) {
  e.preventDefault();

  const data = {
    name: document.getElementById('product-name').value,
    description: document.getElementById('product-description').value,
    product_type: document.getElementById('product-type').value,
    agent_link: document.getElementById('product-agent-link').value || null,
    price_user: parseFloat(document.getElementById('product-price-user').value),
    price_premium: parseFloat(document.getElementById('product-price-premium').value),
    price_super: parseFloat(document.getElementById('product-price-super').value),
    is_active: document.getElementById('product-is-active').checked
  };

  try {
    await axios.put(`/api/marketplace/products/${productId}`, data);
    showNotification('✅ 产品更新成功！', 'success');
    closeProductModal();
    await reloadMarketplaceProducts();
  } catch (error) {
    console.error('Error updating product:', error);
    showNotification('更新失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function toggleProductStatus(productId, currentStatus) {
  const action = currentStatus ? i18n.t('unpublish') || '下架' : i18n.t('publish') || '上架';
  if (!confirm((currentStatus ? i18n.t('confirmUnpublishProduct') : i18n.t('confirmPublishProduct')) || `确定要${action}这个产品吗？`)) return;

  try {
    const response = await axios.post(`/api/marketplace/products/${productId}/toggle-status`);
    showNotification(response.data.message || `✅ 产品已${action}！`, 'success');
    await reloadMarketplaceProducts();
  } catch (error) {
    console.error('Error toggling product status:', error);
    showNotification((i18n.t('operationFailed') || '操作失败') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function deleteMarketplaceProduct(productId) {
  if (!confirm('确定要删除这个产品吗？此操作不可恢复！')) return;

  try {
    await axios.delete(`/api/marketplace/products/${productId}`);
    showNotification('✅ 产品已删除！', 'success');
    await reloadMarketplaceProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    showNotification('删除失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.remove();
}

// ============================================================
// Marketplace Management - Split by Product Type
// ============================================================

// 智能体产品管理
async function showMarketplaceAgentsManagement(container) {
  await showMarketplaceProductsByCategory(container, 'ai_service', '智能体产品管理', 'robot');
}

// 写作模板产品管理
async function showMarketplaceWritingTemplatesManagement(container) {
  await showMarketplaceProductsByCategory(container, 'writing_template', '写作模板产品管理', 'file-alt');
}

// 其他产品管理
async function showMarketplaceOtherManagement(container) {
  await showMarketplaceProductsByCategory(container, 'other', '其他产品管理', 'box');
}

// 支付历史管理
async function showPaymentHistoryManagement(container) {
  try {
    // Get all successful payment records (subscriptions + product purchases)
    const response = await axios.get('/api/admin/all-payments');
    const payments = response.data.payments || [];
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-receipt mr-2"></i>支付历史
            </h2>
            <p class="text-sm text-gray-600 mt-1">查看所有成功的支付记录</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">总支付记录数</p>
            <p class="text-2xl font-bold text-indigo-600">${payments.length}</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户账号</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付时间</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${payments.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>暂无支付记录</p>
                  </td>
                </tr>
              ` : payments.map(payment => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.type === 'subscription' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }">
                      ${payment.type === 'subscription' ? '订阅' : '产品'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${payment.product_name || '未知产品'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${payment.username || payment.email || '未知用户'}</div>
                    ${payment.email && payment.username ? `<div class="text-xs text-gray-500">${payment.email}</div>` : ''}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">$${payment.amount_usd.toFixed(2)}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${new Date(payment.payment_date).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    })}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Show payment history error:', error);
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <p class="text-red-500">
          <i class="fas fa-exclamation-circle mr-2"></i>
          加载支付历史失败: ${error.response?.data?.error || error.message}
        </p>
      </div>
    `;
  }
}

// Generic function to show products by category
async function showMarketplaceProductsByCategory(container, category, title, icon) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-${icon} mr-2"></i>${title}
          </h2>
          <p class="text-sm text-gray-600 mt-1">管理${title.replace('管理', '')}产品</p>
        </div>
        <button onclick="showCreateProductModalWithCategory('${category}')" 
                class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-plus mr-2"></i>添加产品
        </button>
      </div>

      <!-- Loading State -->
      <div id="marketplace-products-list">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p class="text-gray-600">加载产品列表中...</p>
        </div>
      </div>
    </div>
  `;

  await loadMarketplaceProductsByCategory(category);
}

// Load products filtered by category
async function loadMarketplaceProductsByCategory(category) {
  try {
    const response = await axios.get('/api/marketplace/products/all');
    const allProducts = response.data.products || [];
    
    // Filter products by category
    let products = allProducts.filter(p => p.product_type === category);
    
    // Sort products: active products first, then inactive products
    products.sort((a, b) => {
      if (a.is_active === b.is_active) return 0;
      return a.is_active ? -1 : 1;
    });

    const container = document.getElementById('marketplace-products-list');
    
    if (products.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i class="fas fa-box-open text-gray-400 text-5xl mb-4"></i>
          <p class="text-gray-600 text-lg mb-2">暂无产品</p>
          <p class="text-gray-500 text-sm">点击上方"添加产品"按钮创建第一个产品</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销量</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${products.map(product => `
              <tr class="${!product.is_active ? 'bg-gray-100 opacity-60' : ''} hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12 bg-gradient-to-br ${product.is_active ? 'from-indigo-500 to-purple-600' : 'from-gray-400 to-gray-500'} rounded-lg flex items-center justify-center">
                      <i class="fas fa-${getCategoryIcon(product.product_type)} text-white text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium ${product.is_active ? 'text-gray-900' : 'text-gray-500'}">${product.name}</div>
                      <div class="text-sm ${product.is_active ? 'text-gray-500' : 'text-gray-400'}">${(product.description || '').substring(0, 50)}...</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-xs text-gray-900">
                    <div>普通: <span class="font-semibold">$${product.price_user || 0}</span></div>
                    <div>高级: <span class="font-semibold">$${product.price_premium || 0}</span></div>
                    <div>超级: <span class="font-semibold">$${product.price_super || 0}</span></div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.is_active ? '上架中' : '已下架'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${product.sales_count || 0} 笔
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onclick="editMarketplaceProduct(${product.id})" 
                          class="text-indigo-600 hover:text-indigo-900">
                    <i class="fas fa-edit"></i> 编辑
                  </button>
                  <button onclick="toggleProductStatus(${product.id}, ${product.is_active})" 
                          class="text-${product.is_active ? 'yellow' : 'green'}-600 hover:text-${product.is_active ? 'yellow' : 'green'}-900">
                    <i class="fas fa-${product.is_active ? 'pause' : 'play'}-circle"></i> ${product.is_active ? '下架' : '上架'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading marketplace products:', error);
    document.getElementById('marketplace-products-list').innerHTML = `
      <div class="text-center py-12 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>加载失败: ${error.response?.data?.error || error.message}</p>
      </div>
    `;
  }
}

// Create product with pre-selected category
function showCreateProductModalWithCategory(preselectedCategory) {
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-plus-circle mr-2 text-indigo-600"></i>添加新产品
        </h3>
        <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form onsubmit="handleCreateProduct(event)" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
          <input type="text" id="product-name" required
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="例如：AI 智能写作助手">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">产品描述 *</label>
          <textarea id="product-description" required rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="详细描述产品功能和特点"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
          <select id="product-type" required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="ai_service" ${preselectedCategory === 'ai_service' ? 'selected' : ''}>AI Agent</option>
            <option value="writing_template" ${preselectedCategory === 'writing_template' ? 'selected' : ''}>Writing Template</option>
            <option value="review_template" ${preselectedCategory === 'review_template' ? 'selected' : ''}>Review Template</option>
            <option value="other" ${preselectedCategory === 'other' ? 'selected' : ''}>Others</option>
          </select>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">定价设置 *</label>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">普通会员价 ($)</label>
              <input type="number" id="product-price-user" required min="0" step="0.01"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="9.99">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">高级会员价 ($)</label>
              <input type="number" id="product-price-premium" required min="0" step="0.01"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="7.99">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">超级会员价 ($)</label>
              <input type="number" id="product-price-super" required min="0" step="0.01"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="5.99">
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <input type="checkbox" id="product-is-active" checked
                 class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
          <label for="product-is-active" class="text-sm text-gray-700">立即上架销售</label>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onclick="closeProductModal()"
                  class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <i class="fas fa-save mr-2"></i>创建产品
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================================
// MarketPlace User Frontend
// ============================================================

const MarketplaceManager = {
  async renderMarketplacePage() {
    // Auto-save draft before leaving create review page
    await autoSaveDraftBeforeNavigation();
    
    // Refresh current user info to get latest subscription_tier
    if (currentUser && authToken) {
      await refreshCurrentUser();
    }
    
    currentView = 'marketplace';
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        
        <div class="max-w-7xl mx-auto px-4 py-8">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
              <i class="fas fa-store mr-3 text-indigo-600"></i>${i18n.t('marketplaceTitle')}
            </h1>
            <p class="text-gray-600">${i18n.t('marketplaceSubtitle')}</p>
          </div>

          <!-- Category Filters -->
          <div class="mb-6 flex flex-wrap gap-3">
            <button onclick="MarketplaceManager.filterByCategory('all')" 
                    class="category-filter-btn active px-4 py-2 rounded-lg font-medium transition"
                    data-category="all">
              <i class="fas fa-th mr-2"></i>全部商品
            </button>
            <button onclick="MarketplaceManager.filterByCategory('ai_service')" 
                    class="category-filter-btn px-4 py-2 rounded-lg font-medium transition"
                    data-category="ai_service">
              <i class="fas fa-robot mr-2"></i>智能体
            </button>
            <button onclick="MarketplaceManager.filterByCategory('writing_template')" 
                    class="category-filter-btn px-4 py-2 rounded-lg font-medium transition"
                    data-category="writing_template">
              <i class="fas fa-pen mr-2"></i>写作模板
            </button>
            <button onclick="MarketplaceManager.filterByCategory('review_template')" 
                    class="category-filter-btn px-4 py-2 rounded-lg font-medium transition"
                    data-category="review_template">
              <i class="fas fa-file-alt mr-2"></i>复盘模板
            </button>
            <button onclick="MarketplaceManager.filterByCategory('other')" 
                    class="category-filter-btn px-4 py-2 rounded-lg font-medium transition"
                    data-category="other">
              <i class="fas fa-box mr-2"></i>其他
            </button>
          </div>

          <!-- Products Grid -->
          <div id="marketplace-products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-12 col-span-full">
              <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p class="text-gray-600">加载商品中...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles for category filter buttons
    const style = document.createElement('style');
    style.textContent = `
      .category-filter-btn {
        background: white;
        border: 2px solid #e5e7eb;
        color: #6b7280;
      }
      .category-filter-btn:hover {
        border-color: #818cf8;
        color: #4f46e5;
      }
      .category-filter-btn.active {
        background: linear-gradient(to right, #6366f1, #8b5cf6);
        border-color: #6366f1;
        color: white;
      }
    `;
    document.head.appendChild(style);

    await this.loadProducts();
  },

  currentCategory: 'all',
  allProducts: [],

  async loadProducts() {
    try {
      const response = await axios.get('/api/marketplace/products');
      this.allProducts = response.data.products || [];
      this.renderProducts();
    } catch (error) {
      console.error('Error loading marketplace products:', error);
      document.getElementById('marketplace-products-grid').innerHTML = `
        <div class="col-span-full text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
          <p class="text-red-700">加载失败: ${error.response?.data?.error || error.message}</p>
        </div>
      `;
    }
  },

  filterByCategory(category) {
    this.currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    this.renderProducts();
  },

  renderProducts() {
    const container = document.getElementById('marketplace-products-grid');
    
    // Filter products
    let products = this.allProducts.filter(p => p.is_active);
    if (this.currentCategory !== 'all') {
      // Use product_type for filtering, not category
      products = products.filter(p => p.product_type === this.currentCategory);
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i class="fas fa-box-open text-gray-400 text-5xl mb-4"></i>
          <p class="text-gray-600 text-lg">暂无商品</p>
        </div>
      `;
      return;
    }

    // If "all" category is selected, render by category groups
    if (this.currentCategory === 'all') {
      const categoryOrder = ['ai_service', 'review_template', 'writing_template', 'other'];
      const categoryLabels = {
        'ai_service': '智能体',
        'review_template': '复盘模板',
        'writing_template': '写作模板',
        'other': '其他产品'
      };
      const categoryIcons = {
        'ai_service': 'robot',
        'review_template': 'file-alt',
        'writing_template': 'pen',
        'other': 'box'
      };
      
      // Group products by type
      const productsByType = {};
      products.forEach(p => {
        const type = p.product_type || 'other';
        if (!productsByType[type]) {
          productsByType[type] = [];
        }
        productsByType[type].push(p);
      });
      
      // Render categorized products
      let html = '';
      categoryOrder.forEach(type => {
        const categoryProducts = productsByType[type] || [];
        if (categoryProducts.length > 0) {
          html += `
            <div class="col-span-full mb-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-${categoryIcons[type]} mr-3 text-indigo-600"></i>
                ${categoryLabels[type] || type}
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${categoryProducts.map(product => this.renderProductCard(product)).join('')}
              </div>
            </div>
          `;
        }
      });
      
      container.innerHTML = html;
    } else {
      // Single category view - render as grid
      container.innerHTML = `
        <div class="col-span-full">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${products.map(product => this.renderProductCard(product)).join('')}
          </div>
        </div>
      `;
    }
  },

  renderProductCard(product) {
    const isLoggedIn = !!currentUser;
    // 根据用户会员等级显示相应价格
    let displayPrice = product.price_user || 0;
    if (isLoggedIn && currentUser.subscription_tier) {
      if (currentUser.subscription_tier === 'super') {
        displayPrice = product.price_super || product.price_user || 0;
      } else if (currentUser.subscription_tier === 'premium') {
        displayPrice = product.price_premium || product.price_user || 0;
      }
    }
    
    return `
      <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden cursor-pointer"
           onclick="MarketplaceManager.showProductDetails('${product.id}')">
        <!-- Product Header with Icon -->
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center">
          <div class="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-${this.getCategoryIcon(product.category || product.product_type)} text-indigo-600 text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">${product.name}</h3>
          <span class="inline-block px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full">
            ${this.getCategoryName(product.category || product.product_type)}
          </span>
        </div>

        <!-- Product Body -->
        <div class="p-6">
          <p class="text-gray-600 mb-4 line-clamp-3">${product.description || ''}</p>
          
          <!-- Price -->
          <div class="mb-4">
            <div class="flex items-end gap-2">
              <span class="text-3xl font-bold text-indigo-600">$${displayPrice}</span>
            </div>
          </div>

          <!-- Sales Count -->
          <div class="flex items-center text-sm text-gray-500 mb-4">
            <i class="fas fa-shopping-cart mr-2"></i>
            ${i18n.t('sold')} ${product.purchase_count || 0} ${i18n.t('items')}
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button onclick="event.stopPropagation(); MarketplaceManager.addToCart('${product.id}')" 
                    class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition">
              <i class="fas fa-cart-plus mr-2"></i>${i18n.t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  getCategoryIcon(category) {
    const icons = {
      'ai_service': 'robot',
      'review_template': 'file-alt',
      'writing_template': 'pen',
      'template': 'file-alt',
      'book_template': 'book',
      'other': 'box'
    };
    return icons[category] || 'box';
  },

  getCategoryName(category) {
    const names = {
      'ai_service': '智能体',
      'review_template': '复盘模板',
      'writing_template': '写作模板',
      'template': '模板',
      'book_template': '书籍模板',
      'other': '其他'
    };
    return names[category] || '其他';
  },

  async addToCart(productId) {
    // Check if user is logged in
    if (!currentUser) {
      showNotification('请先登录', 'error');
      showLogin();
      return;
    }
    
    try {
      await axios.post('/api/marketplace/cart/add', { product_id: productId });
      showNotification(i18n.t('productAddedToCart') || '已加入购物车', 'success');
      await this.updateCartCount();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to add to cart', 'error');
    }
  },

  async updateCartCount() {
    try {
      // 使用统一的购物车API
      const response = await axios.get('/api/cart');
      const count = response.data.count || 0;
      const badge = document.getElementById('cart-count');
      if (badge) {
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
      }
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  },

  async showProductDetails(productId) {
    try {
      const response = await axios.get(`/api/marketplace/products/${productId}`);
      const product = response.data.product;
      
      // 根据用户会员等级显示相应价格
      let displayPrice = product.price_user || 0;
      if (currentUser && currentUser.subscription_tier) {
        if (currentUser.subscription_tier === 'super') {
          displayPrice = product.price_super || product.price_user || 0;
        } else if (currentUser.subscription_tier === 'premium') {
          displayPrice = product.price_premium || product.price_user || 0;
        }
      }
      
      // Show modal with product details
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-2xl font-bold">${product.name}</h2>
              <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
            <p class="text-gray-600 mb-4">${product.description}</p>
            <div class="mb-4">
              <span class="text-3xl font-bold text-indigo-600">$${displayPrice}</span>
            </div>
            <div class="flex gap-3">
              <button onclick="MarketplaceManager.addToCart('${product.id}'); this.closest('.fixed').remove();" 
                      class="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
                ${i18n.t('addToCart')}
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (error) {
      showNotification('Failed to load product details', 'error');
    }
  },

  async renderMyAgentsPage() {
    await autoSaveDraftBeforeNavigation();
    currentView = 'my-agents';
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        <div class="max-w-7xl mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-6">
            <i class="fas fa-robot mr-3 text-indigo-600"></i>${i18n.t('myAgents')}
          </h1>
          <div id="my-agents-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-12 col-span-full">
              <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p class="text-gray-600">${i18n.t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    await this.loadMyAgents();
  },

  async loadMyAgents() {
    try {
      const response = await axios.get('/api/marketplace/my-agents');
      const agents = response.data.agents || [];
      const container = document.getElementById('my-agents-grid');
      
      if (agents.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <i class="fas fa-robot text-gray-400 text-5xl mb-4"></i>
            <p class="text-gray-600 text-lg">${i18n.t('noAgents') || '暂无智能体'}</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = agents.map(agent => `
        <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6">
          <h3 class="text-xl font-bold mb-2">${agent.product_name}</h3>
          <p class="text-gray-600 mb-4">${agent.description || ''}</p>
          <div class="text-sm text-gray-500 mb-4">
            ${i18n.t('purchaseDate')}: ${new Date(agent.purchase_date).toLocaleDateString()}
          </div>
          <button onclick="alert('Agent functionality coming soon')" 
                  class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
            <i class="fas fa-play mr-2"></i>${i18n.t('run') || '运行'}
          </button>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading agents:', error);
      document.getElementById('my-agents-grid').innerHTML = `
        <div class="col-span-full text-center py-12 bg-red-50 rounded-lg">
          <p class="text-red-700">${error.response?.data?.error || error.message}</p>
        </div>
      `;
    }
  },

  async renderMyPurchasesPage() {
    await autoSaveDraftBeforeNavigation();
    currentView = 'my-purchases';
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        ${renderNavigation()}
        <div class="max-w-7xl mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-6">
            <i class="fas fa-shopping-bag mr-3 text-indigo-600"></i>${i18n.t('myOtherPurchases')}
          </h1>
          <div id="my-purchases-list">
            <div class="text-center py-12">
              <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p class="text-gray-600">${i18n.t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    await this.loadMyPurchases();
  },

  async loadMyPurchases() {
    try {
      const response = await axios.get('/api/marketplace/my-purchases');
      const purchases = response.data.purchases || [];
      const container = document.getElementById('my-purchases-list');
      
      if (purchases.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <i class="fas fa-shopping-bag text-gray-400 text-5xl mb-4"></i>
            <p class="text-gray-600 text-lg">${i18n.t('noPurchases') || '暂无购买记录'}</p>
            <p class="text-gray-500 text-sm mt-2">您还没有购买除"智能体"外的其他产品</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = `
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('productName') || '产品名称'}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('category') || '类别'}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('price') || '价格'}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('purchaseDate') || '购买日期'}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${purchases.map(purchase => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${purchase.product_name || '未知产品'}</div>
                    <div class="text-sm text-gray-500">${purchase.description || ''}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${this.getCategoryName(purchase.product_type || 'other')}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    $${purchase.price_paid || '0.00'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error('Error loading purchases:', error);
      document.getElementById('my-purchases-list').innerHTML = `
        <div class="text-center py-12 bg-red-50 rounded-lg">
          <p class="text-red-700">${error.response?.data?.error || error.message}</p>
        </div>
      `;
    }
  }
};

// ============================================================================
// Writing Templates Management (AI Settings - Templates Tab)
// ============================================================================

async function loadWritingTemplates() {
  // Check if we're in ai-settings-content (from AI Settings page) or admin-content (from Marketplace)
  let contentDiv = document.getElementById('ai-settings-content');
  if (!contentDiv) {
    contentDiv = document.getElementById('admin-content');
  }
  
  contentDiv.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-file-alt mr-2"></i>写作模板管理
        </h2>
        <button onclick="showCreateWritingTemplateModal()" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-plus mr-2"></i>创建模板
        </button>
      </div>
      <div id="writing-templates-table">
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
        </div>
      </div>
    </div>
  `;
  
  await loadWritingTemplatesTable();
}

async function loadWritingTemplatesTable() {
  try {
    // Admin mode: show all templates including inactive ones
    const response = await axios.get('/api/writing-templates?show_all=true');
    const templates = response.data.templates || [];
    renderWritingTemplatesTable(templates);
  } catch (error) {
    document.getElementById('writing-templates-table').innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>加载模板失败</p>
      </div>
    `;
  }
}

function renderWritingTemplatesTable(templates) {
  const container = document.getElementById('writing-templates-table');
  
  if (!templates || templates.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-file-alt text-4xl mb-4"></i>
        <p>暂无写作模板</p>
      </div>
    `;
    return;
  }
  
  // Sort templates: active templates first, then inactive templates
  templates.sort((a, b) => {
    if (a.is_active === b.is_active) return 0;
    return a.is_active ? -1 : 1;
  });
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模板名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建者</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">问题数量</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格 (普通/高级/超)</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模板可见性</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">默认模板</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${templates.map(template => `
            <tr class="${!template.is_active ? 'bg-gray-100 opacity-60' : ''}">
              <!-- 模板名称 -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(template.name)}</div>
              </td>
              
              <!-- 类型 -->
              <td class="px-6 py-4 whitespace-nowrap">
                ${template.owner_type === 'system' || !template.creator_name ? 
                  `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-purple-100 text-purple-800">系统模板</span>` : 
                  `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-blue-100 text-blue-800">用户模板</span>`
                }
              </td>
              
              <!-- 创建者 -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                  <span class="text-sm text-gray-700">${escapeHtml(template.creator_name || '系统')}</span>
                </div>
              </td>
              
              <!-- 问题数量 -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="text-sm text-gray-900">${template.field_count || 0}</span>
              </td>
              
              <!-- 价格 -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">
                  ${(template.price_user > 0 || template.price_premium > 0 || template.price_super > 0) ? 
                    `<div>
                      <span class="text-gray-700">普通: $${parseFloat(template.price_user || 0).toFixed(2)}</span><br>
                      <span class="text-blue-600">高级: $${parseFloat(template.price_premium || 0).toFixed(2)}</span><br>
                      <span class="text-purple-600">超: $${parseFloat(template.price_super || 0).toFixed(2)}</span>
                    </div>` : 
                    `<span class="text-gray-500">-</span>`}
                </div>
              </td>
              
              <!-- 模板可见性 -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm ${template.is_public ? 'text-green-600' : 'text-gray-600'}">
                  ${template.is_public ? '公开' : '私有'}
                </span>
              </td>
              
              <!-- 默认模板 -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                ${template.is_featured ? 
                  `<i class="fas fa-check text-green-600"></i>` : 
                  `<i class="fas fa-times text-gray-400"></i>`
                }
              </td>
              
              <!-- 状态 -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm ${template.is_active ? 'text-green-600' : 'text-gray-500'}">
                  ${template.is_active ? '启用' : '禁用'}
                </span>
              </td>
              
              <!-- 操作 -->
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-3">
                  <button onclick="showManageWritingTemplateFields(${template.id})" 
                          class="text-gray-600 hover:text-gray-900" title="管理字段">
                    <i class="fas fa-list"></i>
                  </button>
                  <button onclick="showEditWritingTemplateModal(${template.id})" 
                          class="text-blue-600 hover:text-blue-900" title="编辑">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="toggleWritingTemplateStatus(${template.id}, ${template.is_active})" 
                          class="${template.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}" 
                          title="${template.is_active ? '下架' : '上架'}">
                    <i class="fas fa-power-off"></i>
                  </button>
                  <button onclick="copyWritingTemplate(${template.id})" 
                          class="text-purple-600 hover:text-purple-900" title="复制">
                    <i class="fas fa-copy"></i>
                  </button>
                  <button onclick="downloadWritingTemplate(${template.id})" 
                          class="text-indigo-600 hover:text-indigo-900" title="下载">
                    <i class="fas fa-download"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Helper function: Copy writing template
async function copyWritingTemplate(templateId) {
  if (!confirm('确定要复制这个模板吗？')) return;
  
  try {
    showNotification('正在复制模板...', 'info');
    const response = await axios.get(`/api/writing-templates/${templateId}`);
    const template = response.data.template;
    
    // Create a copy with modified name
    const copyData = {
      ...template,
      name: `${template.name} (副本)`,
      is_featured: 0,
      is_active: 1
    };
    delete copyData.id;
    delete copyData.created_at;
    delete copyData.updated_at;
    
    await axios.post('/api/writing-templates', copyData);
    showNotification('✅ 模板复制成功！', 'success');
    await loadWritingTemplatesTable();
  } catch (error) {
    console.error('Copy template error:', error);
    showNotification('复制失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// Helper function: Download writing template
async function downloadWritingTemplate(templateId) {
  try {
    const response = await axios.get(`/api/writing-templates/${templateId}`);
    const template = response.data.template;
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('✅ 模板已下载！', 'success');
  } catch (error) {
    console.error('Download template error:', error);
    showNotification('下载失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

function showCreateWritingTemplateModal() {
  const modalHtml = `
    <div id="writing-template-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeModalOnBackdrop(event, 'writing-template-modal')">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-file-alt mr-2 text-indigo-600"></i>
            创建写作模板
          </h3>
          <button onclick="closeModal('writing-template-modal')" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <!-- Modal Content -->
        <form onsubmit="submitWritingTemplate(event)" class="p-6 space-y-4">
          <!-- Basic Info -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              模板名称 <span class="text-red-600">*</span>
            </label>
            <input type="text" id="template-name" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   placeholder="例如：商业书籍模板">
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              模板说明 <span class="text-red-600">*</span>
            </label>
            <textarea id="template-description" required rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="描述此模板的用途和特点..."></textarea>
          </div>



          <!-- Product Type and Category -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                分类 <span class="text-red-600">*</span>
              </label>
              <select id="template-product-type" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="ai_agent">AI Agent</option>
                <option value="review_template">Review Template</option>
                <option value="writing_template" selected>Writing Template</option>
                <option value="other">Others</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                写作分类 <span class="text-red-600">*</span>
              </label>
              <select id="template-category" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="general">通用</option>
                <option value="business">商业</option>
                <option value="technical">技术</option>
                <option value="academic">学术</option>
                <option value="fiction">小说</option>
                <option value="biography">传记</option>
                <option value="education">教育</option>
                <option value="marketing">营销</option>
                <option value="self_help">自我提升</option>
                <option value="custom">自定义</option>
              </select>
            </div>
          </div>

          <!-- Icon and Color -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                图标
              </label>
              <input type="text" id="template-icon" value="book"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="book">
              <p class="text-xs text-gray-500 mt-1">FontAwesome图标名</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                颜色
              </label>
              <select id="template-color"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="blue">蓝色</option>
                <option value="green">绿色</option>
                <option value="red">红色</option>
                <option value="yellow">黄色</option>
                <option value="purple">紫色</option>
                <option value="pink">粉色</option>
                <option value="gray">灰色</option>
              </select>
            </div>
          </div>

          <!-- Pricing Settings -->
          <div class="border-t border-gray-200 pt-4 mt-4">
            <h4 class="font-medium text-gray-800 mb-3">价格设置</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- 普通会员价 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  普通会员价 ($)
                </label>
                <input type="number" id="template-price-user" min="0" step="0.01" value="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="0.00">
              </div>
              
              <!-- 高级会员价 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  高级会员价 ($)
                </label>
                <input type="number" id="template-price-premium" min="0" step="0.01" value="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="0.00">
              </div>
              
              <!-- 超级会员价 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  超级会员价 ($)
                </label>
                <input type="number" id="template-price-super" min="0" step="0.01" value="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="0.00">
              </div>
            </div>
          </div>

          <!-- Default Settings -->
          <div class="border-t border-gray-200 pt-4 mt-4">
            <h4 class="font-medium text-gray-800 mb-3">默认设置</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  语气
                </label>
                <select id="template-tone"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="professional">专业</option>
                  <option value="casual">轻松</option>
                  <option value="academic">学术</option>
                  <option value="creative">创意</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  受众
                </label>
                <select id="template-audience"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="general">一般读者</option>
                  <option value="expert">专业人士</option>
                  <option value="beginner">初学者</option>
                  <option value="children">儿童</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  语言
                </label>
                <select id="template-language"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="zh">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  目标字数
                </label>
                <input type="number" id="template-target-words" value="50000" min="1000" step="1000"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>
          </div>

          <!-- Visibility Settings -->
          <div class="border-t border-gray-200 pt-4 mt-4">
            <h4 class="font-medium text-gray-800 mb-3">可见性设置</h4>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" id="template-public" class="mr-2">
                <span class="text-sm text-gray-700">公开模板（所有用户可见）</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="template-featured" class="mr-2">
                <span class="text-sm text-gray-700">推荐模板（在模板列表中优先显示）</span>
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onclick="closeModal('writing-template-modal')"
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              <i class="fas fa-times mr-2"></i>取消
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <i class="fas fa-check mr-2"></i>创建模板
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitWritingTemplate(event) {
  event.preventDefault();

  try {
    const templateData = {
      name: document.getElementById('template-name').value,
      description: document.getElementById('template-description').value,
      product_type: document.getElementById('template-product-type').value,
      category: document.getElementById('template-category').value,
      icon: document.getElementById('template-icon').value || 'book',
      color: document.getElementById('template-color').value || 'blue',
      price_user: parseFloat(document.getElementById('template-price-user').value) || 0,
      price_premium: parseFloat(document.getElementById('template-price-premium').value) || 0,
      price_super: parseFloat(document.getElementById('template-price-super').value) || 0,
      default_tone: document.getElementById('template-tone').value,
      default_audience: document.getElementById('template-audience').value,
      default_language: document.getElementById('template-language').value,
      default_target_words: parseInt(document.getElementById('template-target-words').value),
      is_public: document.getElementById('template-public').checked,
      is_featured: document.getElementById('template-featured').checked
    };

    const response = await axios.post('/api/writing-templates', templateData);

    if (response.data.success) {
      showNotification('✅ 写作模板创建成功！', 'success');
      closeModal('writing-template-modal');
      await loadWritingTemplatesTable(); // Reload templates list
    }
  } catch (error) {
    console.error('Error creating template:', error);
    let errorMsg = error.response?.data?.error || error.message;
    
    // Provide more user-friendly error messages
    if (error.response?.status === 403) {
      errorMsg = '创建模板需要管理员权限。请联系系统管理员。';
    }
    
    showNotification('创建失败: ' + errorMsg, 'error');
  }
}

async function viewWritingTemplate(templateId) {
  try {
    const response = await axios.get(`/api/writing-templates/${templateId}`);
    const template = response.data.template;

    const modalHtml = `
      <div id="view-template-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeModalOnBackdrop(event, 'view-template-modal')">
        <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-${template.icon || 'book'} mr-2 text-${template.color || 'blue'}-600"></i>
              ${template.name}
            </h3>
            <button onclick="closeModal('view-template-modal')" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- Modal Content -->
          <div class="p-6 space-y-6">
            <!-- Template Info -->
            <div>
              <h4 class="font-medium text-gray-800 mb-2">模板说明</h4>
              <p class="text-gray-600">${template.description || '暂无说明'}</p>
              ${template.description_en ? `<p class="text-gray-500 text-sm mt-1">${template.description_en}</p>` : ''}
            </div>

            <!-- Metadata -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p class="text-sm text-gray-600">分类</p>
                <p class="font-medium">${template.category}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">创建者</p>
                <p class="font-medium">${template.creator_name || '系统'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">使用次数</p>
                <p class="font-medium">${template.usage_count || 0}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">可见性</p>
                <p class="font-medium">${template.is_public ? '公开' : '私有'}</p>
              </div>
            </div>

            <!-- Default Settings -->
            <div>
              <h4 class="font-medium text-gray-800 mb-3">默认设置</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white border border-gray-200 p-3 rounded-lg">
                  <p class="text-xs text-gray-600 mb-1">语气</p>
                  <p class="font-medium">${template.default_tone}</p>
                </div>
                <div class="bg-white border border-gray-200 p-3 rounded-lg">
                  <p class="text-xs text-gray-600 mb-1">受众</p>
                  <p class="font-medium">${template.default_audience}</p>
                </div>
                <div class="bg-white border border-gray-200 p-3 rounded-lg">
                  <p class="text-xs text-gray-600 mb-1">语言</p>
                  <p class="font-medium">${template.default_language}</p>
                </div>
                <div class="bg-white border border-gray-200 p-3 rounded-lg">
                  <p class="text-xs text-gray-600 mb-1">目标字数</p>
                  <p class="font-medium">${template.default_target_words?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <!-- Template Fields -->
            ${template.fields && template.fields.length > 0 ? `
              <div>
                <h4 class="font-medium text-gray-800 mb-3">自定义字段 (${template.fields.length})</h4>
                <div class="space-y-2">
                  ${template.fields.map(field => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div class="flex-1">
                        <p class="font-medium text-gray-800">${field.label}</p>
                        <p class="text-sm text-gray-600">类型: ${field.field_type} ${field.is_required ? ' • 必填' : ''}</p>
                        ${field.help_text ? `<p class="text-xs text-gray-500 mt-1">${field.help_text}</p>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : '<p class="text-gray-500 text-center py-4">此模板暂无自定义字段</p>'}
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end p-6 border-t border-gray-200">
            <button onclick="closeModal('view-template-modal')"
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              关闭
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Error viewing template:', error);
    showNotification('加载模板详情失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showEditWritingTemplateModal(templateId) {
  try {
    const response = await axios.get(`/api/writing-templates/${templateId}`);
    const template = response.data.template;
    
    const modalHtml = `
      <div id="writing-template-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeModalOnBackdrop(event, 'writing-template-modal')">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2 text-indigo-600"></i>
              编辑写作模板
            </h3>
            <button onclick="closeModal('writing-template-modal')" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- Modal Content -->
          <form onsubmit="submitEditWritingTemplate(event, ${templateId})" class="p-6 space-y-4">
            <!-- Basic Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                模板名称 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="template-name" required value="${escapeHtml(template.name)}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="例如：商业书籍模板">
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                模板说明 <span class="text-red-600">*</span>
              </label>
              <textarea id="template-description" required rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="描述此模板的用途和特点...">${escapeHtml(template.description || '')}</textarea>
            </div>



            <!-- Product Type and Category -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  分类 <span class="text-red-600">*</span>
                </label>
                <select id="template-product-type" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="ai_agent" ${template.product_type === 'ai_agent' ? 'selected' : ''}>AI Agent</option>
                  <option value="review_template" ${template.product_type === 'review_template' ? 'selected' : ''}>Review Template</option>
                  <option value="writing_template" ${template.product_type === 'writing_template' || !template.product_type ? 'selected' : ''}>Writing Template</option>
                  <option value="other" ${template.product_type === 'other' ? 'selected' : ''}>Others</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  写作分类 <span class="text-red-600">*</span>
                </label>
                <select id="template-category" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="general" ${template.category === 'general' ? 'selected' : ''}>通用</option>
                  <option value="business" ${template.category === 'business' ? 'selected' : ''}>商业</option>
                  <option value="technical" ${template.category === 'technical' ? 'selected' : ''}>技术</option>
                  <option value="academic" ${template.category === 'academic' ? 'selected' : ''}>学术</option>
                  <option value="fiction" ${template.category === 'fiction' ? 'selected' : ''}>小说</option>
                  <option value="biography" ${template.category === 'biography' ? 'selected' : ''}>传记</option>
                  <option value="education" ${template.category === 'education' ? 'selected' : ''}>教育</option>
                  <option value="marketing" ${template.category === 'marketing' ? 'selected' : ''}>营销</option>
                  <option value="self_help" ${template.category === 'self_help' ? 'selected' : ''}>自我提升</option>
                  <option value="custom" ${template.category === 'custom' ? 'selected' : ''}>自定义</option>
                </select>
              </div>
            </div>

            <!-- Icon and Color -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  图标
                </label>
                <input type="text" id="template-icon" value="${template.icon || 'book'}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="book">
                <p class="text-xs text-gray-500 mt-1">FontAwesome图标名</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  颜色
                </label>
                <select id="template-color"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="blue" ${template.color === 'blue' ? 'selected' : ''}>蓝色</option>
                  <option value="green" ${template.color === 'green' ? 'selected' : ''}>绿色</option>
                  <option value="red" ${template.color === 'red' ? 'selected' : ''}>红色</option>
                  <option value="yellow" ${template.color === 'yellow' ? 'selected' : ''}>黄色</option>
                  <option value="purple" ${template.color === 'purple' ? 'selected' : ''}>紫色</option>
                  <option value="pink" ${template.color === 'pink' ? 'selected' : ''}>粉色</option>
                  <option value="gray" ${template.color === 'gray' ? 'selected' : ''}>灰色</option>
                </select>
              </div>
            </div>

            <!-- Default Settings -->
            <div class="border-t border-gray-200 pt-4 mt-4">
              <h4 class="font-medium text-gray-800 mb-3">默认设置</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    语气
                  </label>
                  <select id="template-tone"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="professional" ${template.default_tone === 'professional' ? 'selected' : ''}>专业</option>
                    <option value="casual" ${template.default_tone === 'casual' ? 'selected' : ''}>轻松</option>
                    <option value="academic" ${template.default_tone === 'academic' ? 'selected' : ''}>学术</option>
                    <option value="creative" ${template.default_tone === 'creative' ? 'selected' : ''}>创意</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    受众
                  </label>
                  <select id="template-audience"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="general" ${template.default_audience === 'general' ? 'selected' : ''}>一般读者</option>
                    <option value="expert" ${template.default_audience === 'expert' ? 'selected' : ''}>专业人士</option>
                    <option value="beginner" ${template.default_audience === 'beginner' ? 'selected' : ''}>初学者</option>
                    <option value="children" ${template.default_audience === 'children' ? 'selected' : ''}>儿童</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    语言
                  </label>
                  <select id="template-language"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="zh" ${template.default_language === 'zh' ? 'selected' : ''}>简体中文</option>
                    <option value="zh-TW" ${template.default_language === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                    <option value="en" ${template.default_language === 'en' ? 'selected' : ''}>English</option>
                    <option value="ja" ${template.default_language === 'ja' ? 'selected' : ''}>日本語</option>
                    <option value="es" ${template.default_language === 'es' ? 'selected' : ''}>Español</option>
                    <option value="fr" ${template.default_language === 'fr' ? 'selected' : ''}>Français</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    目标字数
                  </label>
                  <input type="number" id="template-target-words" value="${template.default_target_words || 50000}" min="1000" step="1000"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
              </div>
            </div>

            <!-- Pricing Settings -->
            <div class="border-t border-gray-200 pt-4 mt-4">
              <h4 class="font-medium text-gray-800 mb-3">价格设置</h4>
              <div class="space-y-3">
                <!-- 普通会员价 -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    普通会员价
                  </label>
                  <div class="flex items-center">
                    <span class="text-gray-600 mr-2">$</span>
                    <input type="number" id="template-price-user" min="0" step="0.01" value="${template.price_user || 0}"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                           placeholder="0.00">
                    <span class="text-gray-600 ml-2">USD</span>
                  </div>
                </div>
                
                <!-- 高级会员价 -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    高级会员价
                  </label>
                  <div class="flex items-center">
                    <span class="text-gray-600 mr-2">$</span>
                    <input type="number" id="template-price-premium" min="0" step="0.01" value="${template.price_premium || 0}"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                           placeholder="0.00">
                    <span class="text-gray-600 ml-2">USD</span>
                  </div>
                </div>
                
                <!-- 超级会员价 -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    超级会员价
                  </label>
                  <div class="flex items-center">
                    <span class="text-gray-600 mr-2">$</span>
                    <input type="number" id="template-price-super" min="0" step="0.01" value="${template.price_super || 0}"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                           placeholder="0.00">
                    <span class="text-gray-600 ml-2">USD</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visibility Settings -->
            <div class="border-t border-gray-200 pt-4 mt-4">
              <h4 class="font-medium text-gray-800 mb-3">可见性设置</h4>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" id="template-public" ${template.is_public ? 'checked' : ''} class="mr-2">
                  <span class="text-sm text-gray-700">公开模板（所有用户可见）</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" id="template-featured" ${template.is_featured ? 'checked' : ''} class="mr-2">
                  <span class="text-sm text-gray-700">推荐模板（在模板列表中优先显示）</span>
                </label>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onclick="closeModal('writing-template-modal')"
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                <i class="fas fa-times mr-2"></i>取消
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <i class="fas fa-check mr-2"></i>保存更改
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Error loading template for edit:', error);
    showNotification('加载模板失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function submitEditWritingTemplate(event, templateId) {
  event.preventDefault();

  try {
    const templateData = {
      name: document.getElementById('template-name').value,
      description: document.getElementById('template-description').value,
      product_type: document.getElementById('template-product-type').value,
      category: document.getElementById('template-category').value,
      icon: document.getElementById('template-icon').value || 'book',
      color: document.getElementById('template-color').value || 'blue',
      default_tone: document.getElementById('template-tone').value,
      default_audience: document.getElementById('template-audience').value,
      default_language: document.getElementById('template-language').value,
      default_target_words: parseInt(document.getElementById('template-target-words').value),
      is_public: document.getElementById('template-public').checked,
      is_featured: document.getElementById('template-featured').checked,
      price_user: parseFloat(document.getElementById('template-price-user').value) || 0,
      price_premium: parseFloat(document.getElementById('template-price-premium').value) || 0,
      price_super: parseFloat(document.getElementById('template-price-super').value) || 0
    };

    const response = await axios.put(`/api/writing-templates/${templateId}`, templateData);

    if (response.data.success) {
      showNotification('✅ 写作模板更新成功！', 'success');
      closeModal('writing-template-modal');
      await loadWritingTemplatesTable();
    }
  } catch (error) {
    console.error('Error updating template:', error);
    let errorMsg = error.response?.data?.error || error.message;
    
    if (error.response?.status === 403) {
      errorMsg = '更新模板需要管理员权限。请联系系统管理员。';
    }
    
    showNotification('更新失败: ' + errorMsg, 'error');
  }
}

// Toggle writing template status (is_active)
async function toggleWritingTemplateStatus(templateId, currentStatus) {
  const action = currentStatus ? '下架' : '上架';
  if (!confirm(`确定要${action}这个写作模板吗？`)) return;

  try {
    console.log(`[DEBUG] Toggling template ${templateId} status. Current: ${currentStatus}, Action: ${action}`);
    console.log(`[DEBUG] Sending POST request to: /api/writing-templates/${templateId}/toggle-status`);
    
    const response = await axios.post(`/api/writing-templates/${templateId}/toggle-status`);
    
    console.log('[DEBUG] Response:', response.data);
    showNotification(response.data.message || `✅ 模板已${action}！`, 'success');
    await loadWritingTemplatesTable();
  } catch (error) {
    console.error('[ERROR] Toggle template status failed:', error);
    console.error('[ERROR] Error response:', error.response);
    showNotification('操作失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function deleteWritingTemplate(templateId, templateName) {
  if (!confirm(`确定要删除模板"${templateName}"吗？此操作不可撤销。`)) {
    return;
  }

  try {
    const response = await axios.delete(`/api/writing-templates/${templateId}`);

    if (response.data.success) {
      showNotification('✅ 模板删除成功！', 'success');
      await loadWritingTemplatesTable(); // Reload templates list
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    showNotification('删除失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

// ============================================================================
// Field Management Functions
// ============================================================================

let currentTemplateFields = [];
let currentEditingTemplateId = null;

async function showManageWritingTemplateFields(templateId) {
  try {
    const response = await axios.get(`/api/writing-templates/${templateId}`);
    const template = response.data.template;
    currentEditingTemplateId = templateId;
    currentTemplateFields = template.fields || [];
    
    const modalHtml = `
      <div id="fields-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold text-gray-800">
                <i class="fas fa-tasks mr-2"></i>管理字段: ${escapeHtml(template.name)}
              </h3>
              <button onclick="closeFieldsModal()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div class="mb-4">
              <button onclick="showAddFieldForm()" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                <i class="fas fa-plus mr-2"></i>添加字段
              </button>
            </div>
            
            <div id="fields-list">
              ${renderFieldsList()}
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Error loading fields:', error);
    showNotification('加载字段失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

function renderFieldsList() {
  if (!currentTemplateFields || currentTemplateFields.length === 0) {
    return `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-tasks text-4xl mb-4"></i>
        <p>暂无字段</p>
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      ${currentTemplateFields.map((field, index) => {
        const typeLabel = {
          'text': '文本',
          'textarea': '多行文本',
          'number': '数字',
          'select': '下拉选择',
          'radio': '单选',
          'checkbox': '多选',
          'date': '日期',
          'markdown': 'Markdown'
        }[field.field_type] || field.field_type;
        
        const typeIcon = {
          'text': 'fa-font',
          'textarea': 'fa-align-left',
          'number': 'fa-hashtag',
          'select': 'fa-list',
          'radio': 'fa-dot-circle',
          'checkbox': 'fa-check-square',
          'date': 'fa-calendar',
          'markdown': 'fa-file-code'
        }[field.field_type] || 'fa-font';
        
        return `
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <span class="text-sm font-semibold text-indigo-600 mr-2">
                  F${field.sort_order || index + 1}
                </span>
                <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 mr-2">
                  <i class="fas ${typeIcon} mr-1"></i>${typeLabel}
                </span>
                ${field.is_required ? `
                  <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 mr-2">
                    <i class="fas fa-asterisk mr-1"></i>必填
                  </span>
                ` : ''}
                <div class="flex space-x-2">
                  ${index > 0 ? `
                    <button onclick="moveField(${field.id}, 'up')" 
                            class="text-gray-500 hover:text-gray-700" title="上移">
                      <i class="fas fa-arrow-up"></i>
                    </button>
                  ` : ''}
                  ${index < currentTemplateFields.length - 1 ? `
                    <button onclick="moveField(${field.id}, 'down')" 
                            class="text-gray-500 hover:text-gray-700" title="下移">
                      <i class="fas fa-arrow-down"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="text-sm text-gray-900 mb-1">
                <strong>${escapeHtml(field.label)}</strong>
                ${field.label_en ? `<span class="text-gray-500 ml-2">(${escapeHtml(field.label_en)})</span>` : ''}
              </div>
              <div class="text-xs text-gray-600">
                字段键: <code class="bg-gray-100 px-1 py-0.5 rounded">${field.field_key}</code>
              </div>
              ${field.help_text ? `
                <div class="text-xs text-gray-500 mt-1">${escapeHtml(field.help_text)}</div>
              ` : ''}
              ${(field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'checkbox') && field.options_json ? `
                <div class="mt-2 text-xs">
                  <span class="text-gray-600">选项:</span>
                  <div class="mt-1 space-y-1">
                    ${JSON.parse(field.options_json).map(opt => `
                      <div class="text-gray-700">• ${escapeHtml(opt)}</div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
            <div class="flex space-x-2 ml-4">
              <button onclick="showEditFieldForm(${field.id})" 
                      class="text-blue-600 hover:text-blue-800" title="编辑">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteField(${field.id})" 
                      class="text-red-600 hover:text-red-800" title="删除">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  `;
}

function showAddFieldForm() {
  const formHtml = `
    <div id="field-form-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onclick="closeModalOnBackdrop(event, 'field-form-modal')">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-bold text-gray-800">
              <i class="fas fa-plus mr-2"></i>添加字段
            </h4>
            <button onclick="closeModal('field-form-modal')" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form onsubmit="submitAddField(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                字段类型 <span class="text-red-600">*</span>
              </label>
              <select id="field-type" required onchange="handleFieldTypeChange()"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="text">文本</option>
                <option value="textarea">多行文本</option>
                <option value="number">数字</option>
                <option value="select">下拉选择</option>
                <option value="radio">单选</option>
                <option value="checkbox">多选</option>
                <option value="date">日期</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                问题 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="field-placeholder" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="请输入问题...">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                使用说明
              </label>
              <textarea id="field-help-text" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="描述此字段的用途..."></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                答案长度
              </label>
              <input type="number" id="field-answer-length"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="例如：500">
            </div>
            
            <div id="options-container" style="display:none;">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                选项（每行一个）
              </label>
              <textarea id="field-options" rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="选项1\n选项2\n选项3"></textarea>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="field-required" class="mr-2">
              <label for="field-required" class="text-sm text-gray-700">
                必填字段
              </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onclick="closeModal('field-form-modal')"
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                添加
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', formHtml);
}

function handleFieldTypeChange() {
  const fieldType = document.getElementById('field-type').value;
  const optionsContainer = document.getElementById('options-container');
  
  if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
    optionsContainer.style.display = 'block';
  } else {
    optionsContainer.style.display = 'none';
  }
}

async function submitAddField(event) {
  event.preventDefault();
  
  try {
    const fieldType = document.getElementById('field-type').value;
    const optionsText = document.getElementById('field-options').value;
    let options = null;
    
    if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
      options = optionsText.split('\n').filter(o => o.trim());
    }
    
    const answerLength = document.getElementById('field-answer-length').value;
    
    const fieldData = {
      field_key: document.getElementById('field-placeholder').value.replace(/\s+/g, '_').toLowerCase(),
      field_type: fieldType,
      label: document.getElementById('field-placeholder').value,
      label_en: null,
      placeholder: null,
      help_text: document.getElementById('field-help-text').value || null,
      options_json: options,
      is_required: document.getElementById('field-required').checked,
      sort_order: currentTemplateFields.length + 1,
      answer_length: answerLength ? parseInt(answerLength) : null
    };
    
    const response = await axios.post(`/api/writing-templates/${currentEditingTemplateId}/fields`, fieldData);
    
    if (response.data.success) {
      showNotification('✅ 字段添加成功！', 'success');
      closeModal('field-form-modal');
      
      // Reload fields
      const templateResponse = await axios.get(`/api/writing-templates/${currentEditingTemplateId}`);
      currentTemplateFields = templateResponse.data.template.fields || [];
      document.getElementById('fields-list').innerHTML = renderFieldsList();
    }
  } catch (error) {
    console.error('Error adding field:', error);
    showNotification('添加失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showEditFieldForm(fieldId) {
  const field = currentTemplateFields.find(f => f.id === fieldId);
  if (!field) return;
  
  const formHtml = `
    <div id="field-form-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onclick="closeModalOnBackdrop(event, 'field-form-modal')">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>编辑字段
            </h4>
            <button onclick="closeModal('field-form-modal')" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form onsubmit="submitEditField(event, ${fieldId})" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                字段类型 <span class="text-red-600">*</span>
              </label>
              <select id="field-type" required onchange="handleFieldTypeChange()"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="text" ${field.field_type === 'text' ? 'selected' : ''}>文本</option>
                <option value="textarea" ${field.field_type === 'textarea' ? 'selected' : ''}>多行文本</option>
                <option value="number" ${field.field_type === 'number' ? 'selected' : ''}>数字</option>
                <option value="select" ${field.field_type === 'select' ? 'selected' : ''}>下拉选择</option>
                <option value="radio" ${field.field_type === 'radio' ? 'selected' : ''}>单选</option>
                <option value="checkbox" ${field.field_type === 'checkbox' ? 'selected' : ''}>多选</option>
                <option value="date" ${field.field_type === 'date' ? 'selected' : ''}>日期</option>
                <option value="markdown" ${field.field_type === 'markdown' ? 'selected' : ''}>Markdown</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                问题 <span class="text-red-600">*</span>
              </label>
              <input type="text" id="field-placeholder" required value="${escapeHtml(field.label)}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="请输入问题...">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                使用说明
              </label>
              <textarea id="field-help-text" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="描述此字段的用途...">${escapeHtml(field.help_text || '')}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                答案长度
              </label>
              <input type="number" id="field-answer-length" value="${field.answer_length || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="例如：500">
            </div>
            
            <div id="options-container" style="display:${field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'checkbox' ? 'block' : 'none'};">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                选项（每行一个）
              </label>
              <textarea id="field-options" rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="选项1\n选项2\n选项3">${field.options_json ? JSON.parse(field.options_json).join('\n') : ''}</textarea>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="field-required" ${field.is_required ? 'checked' : ''} class="mr-2">
              <label for="field-required" class="text-sm text-gray-700">
                必填字段
              </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onclick="closeModal('field-form-modal')"
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', formHtml);
}

async function submitEditField(event, fieldId) {
  event.preventDefault();
  
  try {
    const fieldType = document.getElementById('field-type').value;
    const optionsText = document.getElementById('field-options').value;
    let options = null;
    
    if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
      options = optionsText.split('\n').filter(o => o.trim());
    }
    
    const answerLength = document.getElementById('field-answer-length').value;
    
    const fieldData = {
      field_key: document.getElementById('field-placeholder').value.replace(/\s+/g, '_').toLowerCase(),
      field_type: fieldType,
      label: document.getElementById('field-placeholder').value,
      label_en: null,
      placeholder: null,
      help_text: document.getElementById('field-help-text').value || null,
      options_json: options,
      is_required: document.getElementById('field-required').checked,
      answer_length: answerLength ? parseInt(answerLength) : null
    };
    
    const response = await axios.put(`/api/writing-templates/${currentEditingTemplateId}/fields/${fieldId}`, fieldData);
    
    if (response.data.success) {
      showNotification('✅ 字段更新成功！', 'success');
      closeModal('field-form-modal');
      
      // Reload fields
      const templateResponse = await axios.get(`/api/writing-templates/${currentEditingTemplateId}`);
      currentTemplateFields = templateResponse.data.template.fields || [];
      document.getElementById('fields-list').innerHTML = renderFieldsList();
    }
  } catch (error) {
    console.error('Error updating field:', error);
    showNotification('更新失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function deleteField(fieldId) {
  if (!confirm('确定要删除此字段吗？')) {
    return;
  }
  
  try {
    const response = await axios.delete(`/api/writing-templates/${currentEditingTemplateId}/fields/${fieldId}`);
    
    if (response.data.success) {
      showNotification('✅ 字段删除成功！', 'success');
      
      // Reload fields
      const templateResponse = await axios.get(`/api/writing-templates/${currentEditingTemplateId}`);
      currentTemplateFields = templateResponse.data.template.fields || [];
      document.getElementById('fields-list').innerHTML = renderFieldsList();
    }
  } catch (error) {
    console.error('Error deleting field:', error);
    showNotification('删除失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function moveField(fieldId, direction) {
  const currentIndex = currentTemplateFields.findIndex(f => f.id === fieldId);
  if (currentIndex === -1) return;
  
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= currentTemplateFields.length) return;
  
  try {
    // Update sort orders
    const updates = [
      { id: currentTemplateFields[currentIndex].id, sort_order: targetIndex + 1 },
      { id: currentTemplateFields[targetIndex].id, sort_order: currentIndex + 1 }
    ];
    
    for (const update of updates) {
      await axios.put(`/api/writing-templates/${currentEditingTemplateId}/fields/${update.id}`, {
        sort_order: update.sort_order
      });
    }
    
    showNotification('✅ 字段顺序已更新！', 'success');
    
    // Reload fields
    const templateResponse = await axios.get(`/api/writing-templates/${currentEditingTemplateId}`);
    currentTemplateFields = templateResponse.data.template.fields || [];
    document.getElementById('fields-list').innerHTML = renderFieldsList();
  } catch (error) {
    console.error('Error moving field:', error);
    showNotification('移动失败: ' + (error.response?.data?.error || error.message), 'error');
  }
}

function closeFieldsModal() {
  const modal = document.getElementById('fields-modal');
  if (modal) {
    modal.remove();
  }
  currentEditingTemplateId = null;
  currentTemplateFields = [];
}

// ==================== Dynamic UI Settings ====================

/**
 * Load UI settings from system_settings and override i18n translations
 * This allows administrators to customize UI text through the admin panel
 */
async function loadDynamicUISettings() {
  try {
    // Fetch UI settings from API (no authentication required for public settings)
    const response = await axios.get('/api/system-settings/category/ui');
    const settings = response.data.settings || [];
    
    if (settings.length === 0) return;
    
    // Get current language
    const currentLang = (typeof i18n !== 'undefined' && i18n.getCurrentLanguage) 
      ? i18n.getCurrentLanguage() 
      : 'zh';
    
    // Map of setting keys to i18n translation keys
    const keyMapping = {
      'ui_system_title': 'systemTitle',
      'ui_homepage_hero_title': 'heroTitle',
      'ui_homepage_hero_subtitle': 'heroSubtitle',
      'ui_about_us_content': 'aboutCompanyText1',
      'ui_footer_company_info': null, // Handle separately
      'ui_team_description': 'teamDescription', // Add to i18n
      'ui_contact_email': null // Handle separately
    };
    
    // Override i18n translations with values from system_settings
    settings.forEach(setting => {
      const i18nKey = keyMapping[setting.setting_key];
      if (!i18nKey) return;
      
      try {
        // Try to parse as JSON (multi-language support)
        const parsed = JSON.parse(setting.setting_value);
        const value = parsed[currentLang] || parsed['zh'] || setting.setting_value;
        
        // Override global translations object (used by i18n.t())
        if (typeof translations !== 'undefined' && translations[currentLang]) {
          console.log(`[Dynamic UI] Setting ${i18nKey} = "${value}"`);
          translations[currentLang][i18nKey] = value;
        }
      } catch {
        // If not JSON, use raw value
        if (typeof translations !== 'undefined' && translations[currentLang]) {
          console.log(`[Dynamic UI] Setting ${i18nKey} = "${setting.setting_value}" (raw)`);
          translations[currentLang][i18nKey] = setting.setting_value;
        }
      }
    });
    
    // Update page title if systemTitle was customized
    if (typeof i18n !== 'undefined' && i18n.t) {
      const systemTitle = i18n.t('systemTitle');
      if (systemTitle) {
        document.title = systemTitle;
        const pageTitleEl = document.getElementById('page-title');
        if (pageTitleEl) {
          pageTitleEl.textContent = systemTitle;
        }
      }
    }
    
    // Update footer company info
    const footerSetting = settings.find(s => s.setting_key === 'ui_footer_company_info');
    if (footerSetting) {
      try {
        const parsed = JSON.parse(footerSetting.setting_value);
        const footerText = parsed[currentLang] || parsed['zh'] || footerSetting.setting_value;
        updateFooterInfo(footerText);
      } catch {
        updateFooterInfo(footerSetting.setting_value);
      }
    }
    
    // Update team description
    const teamSetting = settings.find(s => s.setting_key === 'ui_team_description');
    if (teamSetting) {
      try {
        const parsed = JSON.parse(teamSetting.setting_value);
        const teamText = parsed[currentLang] || parsed['zh'] || teamSetting.setting_value;
        updateTeamDescription(teamText);
      } catch {
        updateTeamDescription(teamSetting.setting_value);
      }
    }
    
    // Update contact email
    const emailSetting = settings.find(s => s.setting_key === 'ui_contact_email');
    if (emailSetting) {
      try {
        const parsed = JSON.parse(emailSetting.setting_value);
        const emailText = parsed[currentLang] || parsed['zh'] || emailSetting.setting_value;
        updateContactEmail(emailText);
      } catch {
        updateContactEmail(emailSetting.setting_value);
      }
    }
    
    console.log('Dynamic UI settings loaded successfully');
  } catch (error) {
    console.error('Failed to load dynamic UI settings:', error);
    // Fail silently - use default i18n translations
  }
}

/**
 * Update footer company information
 */
function updateFooterInfo(text) {
  // Find footer element and update it
  const footerElements = document.querySelectorAll('footer p, footer .text-gray-400');
  footerElements.forEach(el => {
    if (el.textContent.includes('©') || el.textContent.includes('版权')) {
      el.textContent = text;
    }
  });
}

/**
 * Update team description text
 */
function updateTeamDescription(text) {
  const teamDescEl = document.getElementById('team-description-text');
  if (teamDescEl) {
    teamDescEl.textContent = text;
  }
}

/**
 * Update contact email
 */
function updateContactEmail(email) {
  const emailTextEl = document.getElementById('contact-email-text');
  const emailLinkEl = document.getElementById('contact-email-link');
  
  if (emailTextEl) {
    emailTextEl.textContent = email;
  }
  
  if (emailLinkEl) {
    emailLinkEl.href = `mailto:${email}`;
  }
}

/**
 * Apply UI settings to DOM after page rendering
 * This ensures dynamic settings are applied even after page content is rendered
 */
async function applyUISettingsToDOM() {
  try {
    // Fetch UI settings from API
    const response = await axios.get('/api/system-settings/category/ui');
    const settings = response.data.settings || [];
    
    if (settings.length === 0) return;
    
    // Get current language
    const currentLang = (typeof i18n !== 'undefined' && i18n.getCurrentLanguage) 
      ? i18n.getCurrentLanguage() 
      : 'zh';
    
    // Update contact email
    const emailSetting = settings.find(s => s.setting_key === 'ui_contact_email');
    if (emailSetting) {
      try {
        const parsed = JSON.parse(emailSetting.setting_value);
        const emailText = parsed[currentLang] || parsed['zh'] || emailSetting.setting_value;
        updateContactEmail(emailText);
      } catch {
        updateContactEmail(emailSetting.setting_value);
      }
    }
    
    // Update team description
    const teamDescSetting = settings.find(s => s.setting_key === 'ui_team_description');
    if (teamDescSetting) {
      try {
        const parsed = JSON.parse(teamDescSetting.setting_value);
        const teamText = parsed[currentLang] || parsed['zh'] || teamDescSetting.setting_value;
        updateTeamDescription(teamText);
      } catch {
        updateTeamDescription(teamDescSetting.setting_value);
      }
    }
    
    console.log('UI settings applied to DOM successfully');
  } catch (error) {
    console.error('Failed to apply UI settings to DOM:', error);
  }
}

// Note: Dynamic UI settings are now loaded in checkAuth() to ensure
// they are applied before rendering any page content

// ==================== Legal Documents & Pricing ====================

/**
 * Show Terms of Service modal
 */
async function showTerms() {
  try {
    const response = await axios.get('/api/system-settings/category/ui');
    const settings = response.data.settings || [];
    const termsSetting = settings.find(s => s.setting_key === 'ui_terms_of_service');
    
    const currentLang = (typeof i18n !== 'undefined' && i18n.getCurrentLanguage) 
      ? i18n.getCurrentLanguage() 
      : 'zh';
    
    let termsText = '加载中...';
    if (termsSetting) {
      try {
        const parsed = JSON.parse(termsSetting.setting_value);
        termsText = parsed[currentLang] || parsed['zh'] || termsSetting.setting_value;
      } catch {
        termsText = termsSetting.setting_value;
      }
    }
    
    const modalHtml = `
      <div id="terms-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           onclick="if(event.target === this) closeModal('terms-modal')">
        <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-file-contract mr-2"></i>${i18n.t('termsOfService')}
            </h2>
            <button onclick="closeModal('terms-modal')" class="text-white hover:text-gray-200 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          <div class="p-8 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div class="prose prose-sm max-w-none">
              <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${termsText}</p>
            </div>
          </div>
          <div class="bg-gray-50 p-4 text-center text-sm text-gray-600">
            <p>${i18n.t('lastUpdated') || '最后更新'}: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Failed to load terms:', error);
    showNotification('加载失败', 'error');
  }
}

/**
 * Show Privacy Policy modal
 */
async function showPrivacy() {
  try {
    const response = await axios.get('/api/system-settings/category/ui');
    const settings = response.data.settings || [];
    const privacySetting = settings.find(s => s.setting_key === 'ui_privacy_policy');
    
    const currentLang = (typeof i18n !== 'undefined' && i18n.getCurrentLanguage) 
      ? i18n.getCurrentLanguage() 
      : 'zh';
    
    let privacyText = '加载中...';
    if (privacySetting) {
      try {
        const parsed = JSON.parse(privacySetting.setting_value);
        privacyText = parsed[currentLang] || parsed['zh'] || privacySetting.setting_value;
      } catch {
        privacyText = privacySetting.setting_value;
      }
    }
    
    const modalHtml = `
      <div id="privacy-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           onclick="if(event.target === this) closeModal('privacy-modal')">
        <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-shield-alt mr-2"></i>${i18n.t('privacyPolicy')}
            </h2>
            <button onclick="closeModal('privacy-modal')" class="text-white hover:text-gray-200 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          <div class="p-8 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div class="prose prose-sm max-w-none">
              <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${privacyText}</p>
            </div>
          </div>
          <div class="bg-gray-50 p-4 text-center text-sm text-gray-600">
            <p>${i18n.t('lastUpdated') || '最后更新'}: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Failed to load privacy policy:', error);
    showNotification('加载失败', 'error');
  }
}

/**
 * Show Pricing Plans modal
 */
async function showPricingPlans() {
  try {
    // Fetch subscription config from API
    const response = await axios.get('/api/subscription/config');
    const plans = response.data.plans || [];
    
    // Find premium and super plans
    const premiumPlan = plans.find(p => p.tier === 'premium') || {};
    const superPlan = plans.find(p => p.tier === 'super') || {};
    
    const modalHtml = `
      <div id="pricing-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           onclick="if(event.target === this) closeModal('pricing-modal')">
        <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-tags mr-2"></i>${i18n.t('pricingPlans')}
            </h2>
            <button onclick="closeModal('pricing-modal')" class="text-white hover:text-gray-200 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          <div class="p-8 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 高级会员 -->
              <div class="border-2 border-indigo-500 rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div class="text-center mb-2">
                  <span class="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">推荐</span>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">高级会员</h3>
                <div class="space-y-3 mb-6">
                  <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-700 font-medium">年费（首次购买）</span>
                    <span class="text-2xl font-bold text-indigo-600">$${premiumPlan.price_usd || 2}</span>
                  </div>
                  <div class="flex justify-between items-center py-2">
                    <span class="text-gray-700 font-medium">续费费用（年费）</span>
                    <span class="text-2xl font-bold text-green-600">$${premiumPlan.renewal_price_usd || 2}</span>
                  </div>
                </div>
                <ul class="space-y-2 mb-6 text-sm">
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">创建团队功能</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">邀请团队成员</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">无限复盘次数</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">全部模板访问</span>
                  </li>
                </ul>
              </div>
              
              <!-- 超级会员 -->
              <div class="border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <div class="text-center mb-2">
                  <span class="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">高级</span>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">超级会员</h3>
                <div class="space-y-3 mb-6">
                  <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-700 font-medium">年费（首次购买）</span>
                    <span class="text-2xl font-bold text-purple-600">$${superPlan.price_usd || 2}</span>
                  </div>
                  <div class="flex justify-between items-center py-2">
                    <span class="text-gray-700 font-medium">续费费用（年费）</span>
                    <span class="text-2xl font-bold text-green-600">$${superPlan.renewal_price_usd || 2}</span>
                  </div>
                </div>
                <ul class="space-y-2 mb-6 text-sm">
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">包含高级会员所有功能</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">AI 智能写作助手</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">AI 内容生成</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                    <span class="text-gray-700">更多高级功能</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="mt-6 text-center text-sm text-gray-600">
              <p><i class="fas fa-info-circle mr-1"></i>所有价格以美元（USD）计算，有效期为365天</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('Failed to load pricing plans:', error);
    showNotification('加载价格方案失败', 'error');
  }
}

// closeModal function already defined at line 12

/**
 * Add subscription to cart
 */
async function addToCart(tier, price) {
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  try {
    // Add subscription to cart
    await axios.post('/api/cart/add', {
      item_type: 'subscription',
      item_id: tier,
      item_name: tier === 'premium' ? '高级会员年费' : '超级会员年费',
      price_usd: price,
      quantity: 1
    });
    
    showNotification('已加入购物车', 'success');
    await updateCartCount();
  } catch (error) {
    console.error('Add to cart error:', error);
    showNotification(error.response?.data?.error || '加入购物车失败', 'error');
  }
}

/**
 * Quick subscribe - Direct payment
 */
async function quickSubscribe(tier, price) {
  if (!currentUser) {
    showNotification('请先登录', 'error');
    showLogin();
    return;
  }
  
  // Show confirmation dialog
  const tierName = tier === 'premium' ? '高级会员' : '超级会员';
  const confirmed = confirm(`确认订阅${tierName}吗？\n\n价格：$${price}\n有效期：365天`);
  
  if (!confirmed) {
    return;
  }
  
  try {
    // Create order directly
    const orderResponse = await axios.post('/api/payment/subscription/order', {
      tier: tier,
      price_usd: price
    });
    
    const orderId = orderResponse.data.order_id;
    const paypalOrderId = orderResponse.data.paypal_order_id;
    
    // Show PayPal payment dialog
    showPayPalPayment(orderId, paypalOrderId, tier);
  } catch (error) {
    console.error('Quick subscribe error:', error);
    showNotification(error.response?.data?.error || '订阅失败', 'error');
  }
}

/**
 * Show PayPal payment dialog
 */
function showPayPalPayment(orderId, paypalOrderId, tier) {
  const modalHtml = `
    <div id="payment-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onclick="if(event.target === this) closeModal('payment-modal')">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-credit-card mr-2"></i>完成支付
        </h2>
        <div class="mb-6">
          <p class="text-gray-600 mb-2">订阅类型：${tier === 'premium' ? '高级会员' : '超级会员'}</p>
          <p class="text-gray-600 mb-4">订单号：${orderId}</p>
        </div>
        <div id="paypal-button-container"></div>
        <button onclick="closeModal('payment-modal')" 
                class="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
          取消
        </button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Initialize PayPal button
  if (typeof paypal !== 'undefined') {
    paypal.Buttons({
      createOrder: function() {
        return paypalOrderId;
      },
      onApprove: async function(data) {
        try {
          // Capture payment
          const response = await axios.post('/api/payment/subscription/capture', {
            order_id: orderId,
            paypal_order_id: data.orderID
          });
          
          if (response.data.success) {
            closeModal('payment-modal');
            showNotification('支付成功！您的订阅已激活', 'success');
            
            // Reload user data to reflect subscription update
            const userResponse = await axios.get('/api/auth/me');
            currentUser = userResponse.data.user;
            window.currentUser = currentUser;
            
            // Refresh the page if on dashboard
            if (currentView === 'dashboard') {
              showDashboard();
            }
          }
        } catch (error) {
          console.error('Payment capture error:', error);
          showNotification(error.response?.data?.error || '支付失败', 'error');
        }
      },
      onError: function(err) {
        console.error('PayPal error:', err);
        showNotification('支付出错，请重试', 'error');
      }
    }).render('#paypal-button-container');
  } else {
    showNotification('PayPal 未加载，请刷新页面重试', 'error');
  }
}

// ============================================================================
// Answer Set Lock/Unlock Functions
// ============================================================================

/**
 * Toggle lock status of current answer set
 * @param {number} reviewId - Review ID
 */
async function toggleCurrentAnswerSetLock(reviewId) {
  try {
    // Get current answer set info
    if (!window.currentAnswerSets || window.currentAnswerSets.length === 0) {
      showNotification(i18n.t('noAnswerSetsToLock') || '没有答案组可以锁定', 'warning');
      return;
    }
    
    const currentIndex = window.currentAnswerSetIndex || 0;
    const currentSet = window.currentAnswerSets[currentIndex];
    const isAdmin = window.currentUser?.role === 'admin';
    
    if (!currentSet) {
      showNotification(i18n.t('cannotFindCurrentSet') || '无法找到当前答案组', 'error');
      return;
    }
    
    const isLocked = currentSet.is_locked === 'yes';
    const action = isLocked ? 'unlock' : 'lock';
    const setNumber = parseInt(currentSet.set_number);
    
    if (isNaN(setNumber)) {
      console.error('[toggleCurrentAnswerSetLock] Invalid set number:', currentSet.set_number);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    console.log('[toggleCurrentAnswerSetLock] Request', {
      reviewId,
      setNumber,
      isLocked,
      isAdmin,
      setOwner: currentSet?.user_id
    });
    
    // Confirm action - NEW: Locking affects entire batch (all users' answer sets with same set_number)
    const confirmMessage = isLocked
      ? (i18n.t('confirmUnlockBatch') || `确定要解锁答案组批次 ${setNumber} 吗？这将解锁所有成员的第 ${setNumber} 组答案，解锁后可以编辑。`)
      : (i18n.t('confirmLockBatch') || `确定要锁定答案组批次 ${setNumber} 吗？这将锁定所有成员的第 ${setNumber} 组答案，锁定后将无法编辑。`);
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // Call API
    const response = await axios.put(`/api/answer-sets/${reviewId}/${setNumber}/${action}`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      showNotification(
        response.data.message || (isLocked ? i18n.t('unlockSuccess') : i18n.t('lockSuccess')),
        'success'
      );
      
      // Update current set's lock status
      currentSet.is_locked = response.data.is_locked;
      
      // Update lock button UI
      updateAnswerSetLockButton(response.data.is_locked === 'yes');
      
      const currentUserIdNum = window.currentUser?.id != null ? Number(window.currentUser.id) : null;
      const setOwnerIdNum = currentSet?.user_id != null ? Number(currentSet.user_id) : null;
      const isOwnSet = currentUserIdNum != null && setOwnerIdNum === currentUserIdNum;
      // Update answer edit UI (only owners can edit; admins maintain read-only fields)
      updateAnswerEditability(response.data.is_locked === 'yes', isOwnSet);
      
      // Re-render answer set to show/hide edit buttons
      renderAnswerSet(reviewId);
    }
  } catch (error) {
    console.error('Toggle answer set lock error:', error);
    showNotification(
      error.response?.data?.error || i18n.t('operationFailed'),
      'error'
    );
  }
}

/**
 * Delete current answer set
 * @param {number} reviewId - Review ID
 */
async function deleteCurrentAnswerSet(reviewId) {
  try {
    // Get current answer set info
    if (!window.currentAnswerSets || window.currentAnswerSets.length === 0) {
      showNotification(i18n.t('noAnswerSetsToDelete') || '没有答案组可以删除', 'warning');
      return;
    }
    
    const currentIndex = window.currentAnswerSetIndex || 0;
    const currentSet = window.currentAnswerSets[currentIndex];
    const isAdmin = window.currentUser?.role === 'admin';
    
    if (!currentSet) {
      showNotification(i18n.t('cannotFindCurrentSet') || '无法找到当前答案组', 'error');
      return;
    }
    
    // Check if answer set is locked (admins can bypass)
    if (currentSet.is_locked === 'yes' && !isAdmin) {
      showNotification(i18n.t('unlockToDelete') || '请先解锁答案组才能删除', 'warning');
      return;
    }
    
    const setNumber = parseInt(currentSet.set_number);
    
    if (isNaN(setNumber)) {
      console.error('[deleteCurrentAnswerSet] Invalid set number:', currentSet.set_number);
      showNotification('Invalid answer set number', 'error');
      return;
    }
    
    const totalSets = window.currentAnswerSets.length;
    const isSingleSet = totalSets === 1;
    const allowMultipleAnswers = window.currentEditReview?.allow_multiple_answers === 'yes';
    
    // Prepare confirmation message
    let confirmMessage;
    if (isSingleSet && !allowMultipleAnswers) {
      // Single answer set in single-answer mode
      confirmMessage = i18n.t('confirmDeleteSingleAnswerSet') || 
        '这是单一的答案复盘，删除后将清空所有答案内容。是否确定删除？';
    } else if (isSingleSet) {
      // Last remaining answer set in multi-answer mode
      confirmMessage = i18n.t('confirmDeleteLastAnswerSet') || 
        `这是最后一个答案组，删除后将清空所有答案内容。是否确定删除答案组 ${setNumber}？`;
    } else {
      // Multiple answer sets exist
      confirmMessage = i18n.t('confirmDeleteAnswerSet') || 
        `确定要删除答案组 ${setNumber} 吗？此操作不可恢复。`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // Call API to delete
    const ownerId = currentSet?.user_id != null ? Number(currentSet.user_id) : null;
    const deleteConfig = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    if (ownerId !== null) {
      deleteConfig.params = { ownerId };
    }

    const response = await axios.delete(`/api/answer-sets/${reviewId}/${setNumber}`, deleteConfig);
    
    if (response.data.success) {
      showNotification(
        i18n.t('deleteAnswerSetSuccess') || '答案组删除成功',
        'success'
      );
      
      // Remove deleted set from local array
      window.currentAnswerSets.splice(currentIndex, 1);
      
      // If no answer sets left, reload the review to show empty state
      if (window.currentAnswerSets.length === 0) {
        // Reload review data
        await loadReviewForEditing(reviewId);
        return;
      }
      
      // Navigate to previous set if we deleted the last one, otherwise stay on same index
      const newIndex = currentIndex >= window.currentAnswerSets.length 
        ? window.currentAnswerSets.length - 1 
        : currentIndex;
      
      window.currentAnswerSetIndex = newIndex;
      
      // Re-render with the new current set
      renderAnswerSet(reviewId);
      updateAnswerSetNavigation(
        reviewId, 
        newIndex + 1, 
        window.currentAnswerSets.length
      );
    }
  } catch (error) {
    console.error('Delete answer set error:', error);
    showNotification(
      error.response?.data?.error || i18n.t('deleteAnswerSetFailed') || '删除答案组失败',
      'error'
    );
  }
}

/**
 * Update lock button UI based on lock status
 * @param {boolean} isLocked - Whether current answer set is locked
 */
function updateAnswerSetLockButton(isLocked) {
  const btn = document.getElementById('toggle-answer-set-lock-btn');
  const icon = document.getElementById('answer-set-lock-icon');
  const text = document.getElementById('answer-set-lock-text');
  const deleteBtn = document.getElementById('delete-answer-set-btn');
  
  if (!btn || !icon || !text) return;
  
  // Get current answer set and check ownership
  const sets = window.currentAnswerSets || [];
  const index = window.currentSetIndex || 0;
  const currentSet = sets[index];
  const currentUserId = window.currentUser?.id;
  let reviewCreatorId = window.currentEditReview?.user_id;

  if (reviewCreatorId == null && window.answerSetsMeta?.review_creator_id != null) {
    reviewCreatorId = window.answerSetsMeta.review_creator_id;
  }
  if (reviewCreatorId == null && window.currentReview?.user_id != null) {
    reviewCreatorId = window.currentReview.user_id;
  }
  if (reviewCreatorId == null && window.currentReview?.created_by != null) {
    reviewCreatorId = window.currentReview.created_by;
  }
  if (reviewCreatorId == null && window.currentReviewDetail?.user_id != null) {
    reviewCreatorId = window.currentReviewDetail.user_id;
  }

  const currentUserIdNum = currentUserId != null ? Number(currentUserId) : null;
  const reviewCreatorIdNum = reviewCreatorId != null ? Number(reviewCreatorId) : null;
  const currentSetOwnerId = currentSet?.user_id != null ? Number(currentSet.user_id) : null;
  const isAdmin = window.currentUser?.role === 'admin';

  // Fallback: if still missing, log for debugging
  if (reviewCreatorIdNum == null) {
    console.warn('[updateAnswerSetLockButton] Could not determine review creator ID.', {
      currentEditReview: window.currentEditReview,
      answerSetsMeta: window.answerSetsMeta,
      currentReview: window.currentReview,
      currentReviewDetail: window.currentReviewDetail
    });
  }
  
  // Check if current user is the review creator (not answer set owner)
  const isReviewCreator = reviewCreatorIdNum != null && currentUserIdNum != null && reviewCreatorIdNum === currentUserIdNum;
  // Check if current user owns this answer set
  const isOwnSet = currentSetOwnerId != null && currentUserIdNum != null && currentSetOwnerId === currentUserIdNum;
  
  console.log('[updateAnswerSetLockButton] Permission check:', {
    currentUserId,
    reviewCreatorId,
    isReviewCreator,
    isAdmin,
    currentSetUserId: currentSet?.user_id,
    isOwnSet,
    isLocked
  });
  
  // Lock/Unlock button: enabled for REVIEW CREATOR or ADMIN
  // Locking affects the entire set_number batch (all users' answer sets with same set_number)
  if (isReviewCreator || isAdmin) {
    btn.disabled = false;
    
    if (isLocked) {
      // Show unlock button (green)
      btn.className = 'px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors';
      icon.className = 'fas fa-lock-open mr-2';
      text.textContent = i18n.t('unlock') || '解锁';
      btn.title = i18n.t('unlockBatchHint') || '解锁此批次的所有答案组';
    } else {
      // Show lock button (red)
      btn.className = 'px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors';
      icon.className = 'fas fa-lock mr-2';
      text.textContent = i18n.t('lock') || '锁定';
      btn.title = i18n.t('lockBatchHint') || '锁定此批次的所有答案组';
    }
  } else {
    // Not review creator or admin: disable lock/unlock button
    btn.disabled = true;
    btn.className = 'px-6 py-3 bg-gray-400 text-white rounded-lg shadow-lg transition-colors opacity-50 cursor-not-allowed';
    icon.className = 'fas fa-lock mr-2';
    text.textContent = i18n.t('lock') || '锁定';
    btn.title = i18n.t('onlyReviewCreatorOrAdminCanLock') || '只有复盘创建者或管理员可以锁定/解锁';
  }
  
  // Delete button logic
  if (deleteBtn) {
    const baseClass = (window.currentEditReview?.allow_multiple_answers === 'yes' ? '' : 'flex-1 ') + 'px-6 py-3 text-white rounded-lg shadow-lg transition-colors';
    
    if (isAdmin) {
      deleteBtn.disabled = false;
      deleteBtn.title = i18n.t('adminDeleteHint') || '管理员可删除任何答案组';
      deleteBtn.className = baseClass + ' bg-red-600 hover:bg-red-700';
    } else if (!isOwnSet) {
      // Not the owner of this answer set
      deleteBtn.disabled = true;
      deleteBtn.title = i18n.t('onlyOwnerCanDelete') || '只能删除自己的答案组';
      deleteBtn.className = baseClass + ' bg-gray-400 opacity-50 cursor-not-allowed';
    } else if (isLocked) {
      // Own answer set but locked
      deleteBtn.disabled = true;
      deleteBtn.title = i18n.t('unlockToDelete') || '请先解锁答案组才能删除';
      deleteBtn.className = baseClass + ' bg-gray-400 opacity-50 cursor-not-allowed';
    } else {
      // Own answer set and unlocked - ENABLE DELETE
      deleteBtn.disabled = false;
      deleteBtn.title = i18n.t('deleteOwnAnswerSet') || '删除自己的答案组';
      deleteBtn.className = baseClass + ' bg-red-600 hover:bg-red-700';
    }
  }
}

/**
 * Update answer editability based on lock status and ownership
 * @param {boolean} isLocked - Whether current answer set is locked
 * @param {boolean} isOwnSet - Whether current user owns this answer set
 */
function updateAnswerEditability(isLocked, isOwnSet = true) {
  // Disable if locked OR not owned by current user
  const shouldDisable = isLocked || !isOwnSet;
  
  if (shouldDisable) {
    // Disable all answer inputs and edit buttons
    document.querySelectorAll('#edit-review-form input, #edit-review-form textarea, #edit-review-form select').forEach(input => {
      // Don't disable the review-level fields (title, description, etc.)
      const isAnswerField = input.closest('[id^="answer-display-"]') || 
                           input.id.startsWith('question') ||
                           input.id.startsWith('inline-answer-') ||
                           input.id.startsWith('time-input-');
      if (isAnswerField) {
        input.disabled = true;
        input.classList.add('bg-gray-100', 'cursor-not-allowed');
      }
    });
    
    // Disable edit-related buttons
    document.querySelectorAll('button[onclick*="editEmptyAnswerInSet"], button[onclick*="updateMultipleChoiceInSet"]').forEach(btn => {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      const originalOnclick = btn.onclick;
      btn.onclick = (e) => {
        e.preventDefault();
        if (isLocked) {
          showNotification(i18n.t('answerSetIsLocked') || '当前答案组已锁定，无法编辑', 'warning');
        } else {
          showNotification(i18n.t('onlyOwnerCanEditAnswers') || '只能编辑自己的答案组', 'warning');
        }
      };
    });
  } else {
    // Enable all answer inputs and edit buttons
    document.querySelectorAll('#edit-review-form input, #edit-review-form textarea, #edit-review-form select').forEach(input => {
      const isAnswerField = input.closest('[id^="answer-display-"]') || 
                           input.id.startsWith('question') ||
                           input.id.startsWith('inline-answer-') ||
                           input.id.startsWith('time-input-');
      if (isAnswerField) {
        input.disabled = false;
        input.classList.remove('bg-gray-100', 'cursor-not-allowed');
      }
    });
    
    // Enable edit-related buttons
    document.querySelectorAll('button[onclick*="editEmptyAnswerInSet"], button[onclick*="updateMultipleChoiceInSet"]').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    });
  }
}
