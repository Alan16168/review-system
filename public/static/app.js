// Global state
let currentUser = null;
let authToken = null;
let currentView = 'home';
let currentDraftId = null; // Track the draft ID to avoid creating duplicates

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

function checkAuth() {
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
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // If on home page, stay on home; otherwise show dashboard
    if (currentView === 'home') {
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
  authToken = null;
  delete axios.defaults.headers.common['Authorization'];
  showHomePage();
}

// ============ View Rendering ============

// Home Page (Landing Page)
async function showHomePage() {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
  currentView = 'home';
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-white">
      ${renderNavigation()}

      <!-- Hero Section with Carousel -->
      <section class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <!-- Left: Text Content -->
            <div>
              <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                ${i18n.t('heroTitle')}
              </h1>
              <p class="text-xl text-gray-600 mb-8">
                ${i18n.t('heroSubtitle')}
              </p>
              <div class="flex space-x-4">
                ${!currentUser ? `
                  <button onclick="showRegister()" 
                          class="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition text-lg">
                    <i class="fas fa-rocket mr-2"></i>${i18n.t('getStarted')}
                  </button>
                  <button onclick="showLogin()" 
                          class="bg-white text-indigo-600 px-8 py-3 rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition text-lg">
                    ${i18n.t('login')}
                  </button>
                ` : `
                  <button onclick="showDashboard()" 
                          class="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition text-lg">
                    <i class="fas fa-tachometer-alt mr-2"></i>${i18n.t('goToDashboard')}
                  </button>
                `}
              </div>
            </div>
            
            <!-- Right: Image Carousel -->
            <div class="relative">
              <div id="carousel" class="relative h-96 bg-white rounded-2xl shadow-2xl overflow-hidden">
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
          <div class="flex justify-center mb-8 space-x-4">
            <button onclick="showResourceTab('articles')" id="tab-articles"
                    class="px-6 py-3 rounded-lg font-medium transition active-tab">
              <i class="fas fa-book mr-2"></i>${i18n.t('articles')}
            </button>
            <button onclick="showResourceTab('videos')" id="tab-videos"
                    class="px-6 py-3 rounded-lg font-medium transition inactive-tab">
              <i class="fas fa-video mr-2"></i>${i18n.t('videos')}
            </button>
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
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">${i18n.t('ourTeam')}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div class="bg-white rounded-xl p-8 text-center shadow-lg">
              <div class="w-28 h-28 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-user-tie text-indigo-600 text-5xl"></i>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">${i18n.t('founderName')}</h3>
              <p class="text-indigo-600 mb-3 font-semibold">${i18n.t('founderTitle')}</p>
              <p class="text-gray-600">${i18n.t('founderBio')}</p>
            </div>
            <div class="bg-white rounded-xl p-8 text-center shadow-lg">
              <div class="w-28 h-28 bg-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-paint-brush text-pink-600 text-5xl"></i>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">${i18n.t('designLeadName')}</h3>
              <p class="text-pink-600 mb-3 font-semibold">${i18n.t('designLeadTitle')}</p>
              <p class="text-gray-600">${i18n.t('designLeadBio')}</p>
            </div>
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
      <section id="contact" class="py-16 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">${i18n.t('contactUs')}</h2>
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <div class="flex items-center mb-4">
                  <i class="fas fa-envelope text-indigo-600 text-2xl mr-4"></i>
                  <div>
                    <div class="font-bold text-gray-900">${i18n.t('email')}</div>
                    <div class="text-gray-600">ireviewsystem@hotmail.com</div>
                  </div>
                </div>
                <div class="flex items-center mb-4">
                  <i class="fas fa-phone text-indigo-600 text-2xl mr-4"></i>
                  <div>
                    <div class="font-bold text-gray-900">${i18n.t('phone')}</div>
                    <div class="text-gray-600">+1 (778)-883-9266</div>
                  </div>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-map-marker-alt text-indigo-600 text-2xl mr-4"></i>
                  <div>
                    <div class="font-bold text-gray-900">${i18n.t('address')}</div>
                    <div class="text-gray-600">${i18n.t('addressText')}</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 mb-4">${i18n.t('followUs')}</h3>
                <div class="flex space-x-4">
                  <a href="#" class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition">
                    <i class="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" class="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white hover:bg-sky-600 transition">
                    <i class="fab fa-twitter"></i>
                  </a>
                  <a href="#" class="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white hover:opacity-90 transition">
                    <i class="fab fa-instagram"></i>
                  </a>
                  <a href="#" class="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition">
                    <i class="fab fa-linkedin-in"></i>
                  </a>
                  <a href="#" class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition">
                    <i class="fab fa-youtube"></i>
                  </a>
                </div>
              </div>
            </div>
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
                <li><a href="#" class="hover:text-white transition">${i18n.t('pricing')}</a></li>
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
  const articlesContent = document.getElementById('articles-content');
  const videosContent = document.getElementById('videos-content');

  if (tab === 'articles') {
    articlesTab.className = 'px-6 py-3 rounded-lg font-medium transition active-tab';
    videosTab.className = 'px-6 py-3 rounded-lg font-medium transition inactive-tab';
    articlesContent.classList.remove('hidden');
    videosContent.classList.add('hidden');
  } else {
    articlesTab.className = 'px-6 py-3 rounded-lg font-medium transition inactive-tab';
    videosTab.className = 'px-6 py-3 rounded-lg font-medium transition active-tab';
    articlesContent.classList.add('hidden');
    videosContent.classList.remove('hidden');
    if (!videosContent.dataset.loaded) {
      loadVideos();
    }
  }
}

// Load Articles using API - Show 6 random articles, update all 6 on refresh
async function loadArticles(refresh = false) {
  const articlesContent = document.getElementById('articles-content');
  
  try {
    // Always fetch fresh articles when refreshing, or fetch if not cached
    if (refresh || cachedArticles.length === 0) {
      const response = await axios.get('/api/resources/articles');
      const { articles, source } = response.data;
      cachedArticles = articles;
      console.log(`Articles loaded from: ${source}`);
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
      const response = await axios.get('/api/resources/videos');
      const { videos, source } = response.data;
      cachedVideos = videos;
      console.log(`Videos loaded from: ${source}`);
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
async function showDashboard() {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
  currentView = 'dashboard';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen">
      ${renderNavigation()}

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div id="dashboard-content">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition" onclick="showReviews()">
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
  
  await loadDashboardData();
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
      // Keep the token and view the shared review
      showNotification(i18n.t('loginSuccess') || '登录成功', 'success');
      setTimeout(() => {
        // The referral token handler will be processed by the invitation system
        window.location.href = `/?invite=${referralToken}`;
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
    renderRecentReviews(dashboardReviews);
    
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
    // Set defaults on error
    const reviewCountEl = document.getElementById('review-count');
    const completedCountEl = document.getElementById('completed-count');
    const teamCountEl = document.getElementById('team-count');
    if (reviewCountEl) reviewCountEl.textContent = '0';
    if (completedCountEl) completedCountEl.textContent = '0';
    if (teamCountEl) teamCountEl.textContent = '0';
    // Still render empty reviews list
    dashboardReviews = [];
    renderRecentReviews(dashboardReviews);
  }
}

function changeDashboardPage(newPage) {
  dashboardCurrentPage = newPage;
  renderRecentReviews(dashboardReviews);
}

function renderRecentReviews(reviews) {
  const container = document.getElementById('recent-reviews');
  
  if (!container) return;
  
  if (reviews.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-center py-4">${i18n.t('noData')}</p>`;
    return;
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / dashboardItemsPerPage);
  const startIndex = (dashboardCurrentPage - 1) * dashboardItemsPerPage;
  const endIndex = startIndex + dashboardItemsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);
  
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
                ${new Date(review.updated_at).toLocaleString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="showReviewDetail(${review.id})" class="text-indigo-600 hover:text-indigo-900">
                  <i class="fas fa-eye"></i> ${i18n.t('view')}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- Pagination -->
      ${totalPages > 1 ? `
        <div class="flex justify-center items-center mt-4 space-x-2">
          <button onclick="changeDashboardPage(${dashboardCurrentPage - 1})" 
                  ${dashboardCurrentPage === 1 ? 'disabled' : ''}
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
            ${i18n.t('previousPage') || '上一页'}
          </button>
          <span class="text-gray-700">
            ${i18n.t('page') || '第'} ${dashboardCurrentPage} / ${totalPages} ${i18n.t('pages') || '页'}
          </span>
          <button onclick="changeDashboardPage(${dashboardCurrentPage + 1})" 
                  ${dashboardCurrentPage === totalPages ? 'disabled' : ''}
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
            ${i18n.t('nextPage') || '下一页'}
          </button>
        </div>
      ` : ''}
    </div>
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
                ${new Date(review.updated_at).toLocaleString()}
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
                ${new Date(review.updated_at).toLocaleDateString()}
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
              ${i18n.t('selectTeam')} <span class="text-red-500">*</span>
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
    reminder_minutes: reminderMinutes
  };
  
  try {
    console.log('创建空白草稿复盘:', data);
    
    // Create empty draft review
    const response = await axios.post('/api/reviews', data);
    const newReviewId = response.data.id;
    
    console.log('草稿创建成功，ID:', newReviewId);
    showNotification(i18n.t('draftCreated') + ' (ID: ' + newReviewId + ')', 'success');
    
    // Clear currentDraftId to prevent conflicts
    currentDraftId = null;
    
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
      showNotification(i18n.t('updateSuccess'), 'success');
    } else {
      // Create new review
      const response = await axios.post('/api/reviews', data);
      // Don't set currentDraftId here - we're completing the review, not drafting
      showNotification(i18n.t('createSuccess'), 'success');
    }
    
    // CRITICAL: Clear draft ID and change view BEFORE returning to reviews
    // This prevents autoSaveDraftBeforeNavigation() from saving again
    currentDraftId = null;
    currentView = 'completing-review'; // Temporary state to prevent auto-save
    
    showReviews(); // Return to My Reviews list
    window.scrollTo(0, 0); // Scroll to top
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
      
      const answers = answersByQuestion[question.question_number] || [];
      if (answers.length > 0) {
        answers.forEach(answer => {
          printContent += `
            <div class="answer">
              ${answer.username ? `<div class="answer-header"><strong>${answer.username}</strong> - ${new Date(answer.updated_at).toLocaleString()}</div>` : ''}
              <div>${answer.answer || i18n.t('noAnswer')}</div>
            </div>
          `;
        });
      } else {
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
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Trigger print dialog after content loads
    printWindow.onload = function() {
      printWindow.focus();
    };
    
  } catch (error) {
    console.error('Print error:', error);
    showToast(i18n.t('printError') || 'Failed to generate print preview', 'error');
  }
}

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
            <button onclick="showReviews()" class="text-indigo-600 hover:text-indigo-800 mb-4">
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

          ${review.description ? `
          <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <h3 class="text-sm font-semibold text-blue-800 mb-2">
              <i class="fas fa-info-circle mr-2"></i>${i18n.t('reviewDescription')}
            </h3>
            <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(review.description)}</p>
          </div>
          ` : ''}

          <!-- Dynamic Questions Display -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
              <i class="fas fa-question-circle mr-2"></i>${review.template_name ? escapeHtml(review.template_name) : i18n.t('nineQuestions')}
            </h2>
            
            ${questions.length > 0 ? questions.map(q => {
              const userAnswers = answersByQuestion[q.question_number] || [];
              const myAnswer = userAnswers.find(a => a.user_id === currentUser.id);
              const questionId = `question-${q.question_number}`;
              
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
                    ${userAnswers.length > 0 ? userAnswers.map(ans => {
                      // Render based on question type
                      let answerDisplay = '';
                      if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
                        // For choice questions, show selected options with highlighting
                        if (q.options) {
                          const options = JSON.parse(q.options);
                          const selectedLetters = ans.answer.split(',').map(a => a.trim());
                          const correctLetters = q.correct_answer ? q.correct_answer.split(',').map(a => a.trim()) : [];
                          
                          answerDisplay = `
                            <div class="space-y-2">
                              ${options.map((opt, idx) => {
                                const letter = String.fromCharCode(65 + idx);
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
                                  // Show correct answer that was not selected
                                  icon = '<i class="fas fa-star text-yellow-500 mr-2"></i>';
                                }
                                
                                return `
                                  <div class="flex items-center p-2 border rounded ${borderColor} ${bgColor}">
                                    ${icon}
                                    <span class="text-sm ${isSelected ? 'font-medium' : ''}">${escapeHtml(opt)}</span>
                                  </div>
                                `;
                              }).join('')}
                            </div>
                          `;
                        } else {
                          answerDisplay = `<div class="text-sm">${escapeHtml(ans.answer)}</div>`;
                        }
                      } else {
                        // Text type - regular display
                        answerDisplay = `<div class="text-sm leading-relaxed">${escapeHtml(ans.answer)}</div>`;
                      }
                      
                      return `
                        <div class="text-gray-800 bg-gray-50 p-3 rounded border ${
                          ans.is_mine ? 'border-indigo-200' : 'border-gray-200'
                        } mt-2">
                          <div class="flex justify-between items-center mb-2">
                            <span class="text-xs text-gray-600 font-medium">
                              <i class="fas fa-user-circle mr-1"></i>${escapeHtml(ans.username)}${ans.is_mine ? ` <span class="text-indigo-600">(${i18n.t('myAnswer') || '我'})</span>` : ''}
                            </span>
                            <span class="text-xs text-gray-500">
                              <i class="fas fa-clock mr-1"></i>${i18n.t('answerCreatedAt')}: ${formatDate(ans.created_at || ans.updated_at)}
                            </span>
                          </div>
                          ${answerDisplay}
                        </div>
                      `;
                    }).join('') : `
                      <div class="text-gray-500 text-sm bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                        ${i18n.t('noAnswer') || '未填写'}
                      </div>
                    `}
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
        </div>
      </div>
    `;
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
              const myAnswer = memberAnswers.find(a => a.user_id === currentUserId);
              const otherAnswers = memberAnswers.filter(a => a.user_id !== currentUserId);
              
              return `
                <div class="bg-white rounded-lg shadow-md p-6">
                  <h2 class="text-xl font-bold text-gray-800 mb-4 border-b pb-3">
                    <i class="fas fa-question-circle mr-2 text-indigo-600"></i>${num}. ${escapeHtml(q.question_text)}
                  </h2>
                  
                  <div class="space-y-4">
                    <!-- My Answer (Editable) -->
                    <div class="border-l-4 border-indigo-500 pl-4">
                      <div class="flex justify-between items-center mb-2">
                        <h3 class="text-sm font-semibold text-indigo-700">
                          <i class="fas fa-user-edit mr-1"></i>${i18n.t('myAnswer')}
                        </h3>
                        <div class="flex items-center space-x-2">
                          <span class="text-xs text-gray-500" id="save-status-${num}">
                            ${myAnswer ? '<i class="fas fa-check text-green-600 mr-1"></i>' + i18n.t('autoSaved') : ''}
                          </span>
                          ${myAnswer ? `
                            <button 
                              onclick="handleDeleteMyAnswer(${id}, ${num})"
                              class="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded"
                              title="${i18n.t('deleteAnswer')}"
                            >
                              <i class="fas fa-trash mr-1"></i>${i18n.t('delete')}
                            </button>
                          ` : ''}
                        </div>
                      </div>
                      <textarea 
                        id="my-answer-${num}"
                        rows="4"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                        placeholder="${i18n.t('answerPlaceholder')}"
                        onchange="handleSaveTeamAnswer(${id}, ${num})"
                      >${myAnswer ? escapeHtml(myAnswer.answer) : ''}</textarea>
                    </div>
                    
                    ${otherAnswers.length > 0 ? `
                      <!-- Other Members' Answers (Readonly) -->
                      <div class="space-y-3 pt-2">
                        ${otherAnswers.map(answer => `
                          <div class="border-l-4 border-green-500 pl-4 bg-gray-50 p-3 rounded-r">
                            <div class="flex justify-between items-start mb-2">
                              <div class="flex items-center">
                                <i class="fas fa-user-circle text-lg text-gray-400 mr-2"></i>
                                <div>
                                  <span class="text-sm font-semibold text-gray-700">
                                    <i class="fas fa-users mr-1"></i>${i18n.t('memberAnswers')} - ${escapeHtml(answer.username)}
                                  </span>
                                  <span class="text-xs text-gray-500 ml-2">
                                    <i class="fas fa-clock mr-1"></i>${new Date(answer.updated_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p class="text-gray-800 whitespace-pre-wrap">${escapeHtml(answer.answer)}</p>
                            <p class="text-xs text-gray-500 mt-2">
                              <i class="fas fa-lock mr-1"></i>${i18n.t('cannotEditOthersAnswers') || '不能修改其他成员的答案'}
                            </p>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div class="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p class="text-sm">${i18n.t('noMemberAnswers')}</p>
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
async function handleDeleteMyAnswer(reviewId, questionNumber) {
  if (!confirm(i18n.t('confirmDeleteAnswer'))) {
    return;
  }
  
  try {
    await axios.delete(`/api/reviews/${reviewId}/my-answer/${questionNumber}`);
    showNotification(i18n.t('answerDeleted'), 'success');
    
    // Reload the page to show updated data
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

async function showEditReview(id) {
  try {
    const response = await axios.get(`/api/reviews/${id}`);
    const review = response.data.review;
    const questions = response.data.questions || [];
    const answersByQuestion = response.data.answersByQuestion || {};
    
    // Extract current user's answers for editing
    const myAnswers = {};
    Object.keys(answersByQuestion).forEach(qNum => {
      const userAnswers = answersByQuestion[qNum] || [];
      const myAnswer = userAnswers.find(a => a.user_id === currentUser.id);
      if (myAnswer) {
        myAnswers[qNum] = myAnswer.answer;
      }
    });
    
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
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>${i18n.t('edit')} ${i18n.t('review') || '复盘'}
            </h1>
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

            ${(currentUser.role === 'premium' || currentUser.role === 'admin') && teams && teams.length > 0 ? `
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
            <div class="border border-gray-200 rounded-lg overflow-hidden">
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
            <div class="border-t pt-6 mb-6">
              <div class="mb-4">
                <h3 class="text-lg font-medium text-gray-800 mb-2">
                  <i class="fas fa-layer-group mr-2"></i>${i18n.t('answerSetsManagement') || '答案组管理'}
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                  ${i18n.t('answerSetsDesc') || '您可以为所有问题创建多组答案，使用箭头在不同答案组之间导航'}
                </p>
              </div>
              
              <!-- Answer Set Navigation -->
              <div id="answer-set-navigation" class="mb-4"></div>
              
              <!-- Create New Answer Set Button -->
              <button type="button" 
                      onclick="createNewAnswerSet(${id})"
                      class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg transition-colors mb-4">
                <i class="fas fa-plus-circle mr-2"></i>${i18n.t('createNewSet')}
              </button>
              
              <div class="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>${i18n.t('howToUse') || '使用方法'}:</strong> 
                ${i18n.t('answerSetsInstructions') || '1. 点击"创建新答案组"会为所有问题创建一组新答案 2. 使用箭头按钮在不同答案组之间切换查看 3. 每个问题的答案数量将保持一致'}
              </div>
            </div>

            <!-- Dynamic Questions -->
            <div class="border-t pt-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-question-circle mr-2"></i>${review.template_name ? escapeHtml(review.template_name) : i18n.t('nineQuestions')}
              </h2>
              
              ${questions.length > 0 ? questions.map(q => {
                // Render based on question type
                if (q.question_type === 'single_choice' && q.options) {
                  const options = JSON.parse(q.options);
                  const myAnswer = myAnswers[q.question_number] || '';
                  return `
                    <div class="mb-6">
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
                                     ${myAnswer === letter ? 'checked' : ''}
                                     class="mt-1 mr-3 flex-shrink-0">
                              <span class="text-sm text-gray-900">${escapeHtml(opt)}</span>
                            </label>
                          `;
                        }).join('')}
                      </div>
                      <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>${i18n.t('onlyEditOwnAnswers') || '您只能编辑自己的答案'}
                      </p>
                    </div>
                  `;
                } else if (q.question_type === 'multiple_choice' && q.options) {
                  const options = JSON.parse(q.options);
                  const myAnswer = myAnswers[q.question_number] || '';
                  const selectedLetters = myAnswer.split(',').map(a => a.trim());
                  return `
                    <div class="mb-6">
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
                                     ${selectedLetters.includes(letter) ? 'checked' : ''}
                                     class="mt-1 mr-3 flex-shrink-0">
                              <span class="text-sm text-gray-900">${escapeHtml(opt)}</span>
                            </label>
                          `;
                        }).join('')}
                      </div>
                      <p class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>${i18n.t('onlyEditOwnAnswers') || '您只能编辑自己的答案'}
                      </p>
                    </div>
                  `;
                } else {
                  // Default text type - support multiple answers
                  const userAnswers = answersByQuestion[q.question_number] || [];
                  const myAnswersList = userAnswers.filter(a => a.user_id === currentUser.id);
                  
                  return `
                    <div class="mb-6">
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${q.question_number}. ${escapeHtml(q.question_text)}
                        ${q.question_text_en ? `<span class="text-xs text-gray-500 block mt-1">${escapeHtml(q.question_text_en)}</span>` : ''}
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
                         value="${review.scheduled_at ? new Date(review.scheduled_at).toISOString().slice(0, 16) : ''}"
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

            <!-- Save/Cancel Buttons (Outside all sections) -->
            <div class="flex justify-end space-x-4 pt-6 border-t mt-6">
              <button type="button" onclick="handleEditReviewCancel(${id})" 
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
    
    // Store questions and creator status in global variable for access
    window.currentEditQuestions = questions;
    window.currentEditIsCreator = isCreator;
    
    // Load and render answer sets (Phase 1)
    loadAnswerSets(id).then(() => {
      if (window.currentAnswerSets.length > 0) {
        renderAnswerSet(id);
      } else {
        updateAnswerSetNavigation(id, 0, 0);
      }
    });
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
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
      showNotification(i18n.t('answerCannotBeEmpty') || '答案不能为空', 'error');
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

async function handleEditReview(e) {
  e.preventDefault();
  
  const id = document.getElementById('review-id').value;
  const isCreator = window.currentEditIsCreator;
  
  // Collect answers for choice-type questions only
  // Note: Text-type answers are now managed through addNewAnswer() function
  const answers = {};
  const questions = window.currentEditQuestions || [];
  if (questions.length > 0) {
    questions.forEach(q => {
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
      }
      // Skip text type - these are managed through the multiple answers UI
    });
  }
  
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

  try {
    await axios.put(`/api/reviews/${id}`, data);
    showNotification(i18n.t('updateSuccess'), 'success');
    
    // Clear newly created draft flag on successful save
    if (window.newlyCreatedDraftId == id) {
      delete window.newlyCreatedDraftId;
    }
    
    showReviews(); // Return to My Reviews page
    window.scrollTo(0, 0); // Scroll to top
  } catch (error) {
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
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
            <span class="text-xl font-bold text-gray-800">${i18n.t('systemTitle')}</span>
          </div>
          <div class="hidden md:flex space-x-8">
            ${currentUser ? `
              <button onclick="showDashboard()" class="text-gray-700 hover:text-indigo-600 transition">
                <i class="fas fa-home mr-1"></i>${i18n.t('dashboard')}
              </button>
              <button onclick="showReviews()" class="text-gray-700 hover:text-indigo-600 transition">
                <i class="fas fa-clipboard-list mr-1"></i>${i18n.t('myReviews')}
              </button>
              <button onclick="showPublicReviews()" class="text-gray-700 hover:text-indigo-600 transition">
                <i class="fas fa-globe mr-1"></i>${i18n.t('publicReviews')}
              </button>
              <button onclick="showTeams()" class="text-gray-700 hover:text-indigo-600 transition">
                <i class="fas fa-users mr-1"></i>${i18n.t('teams')}
              </button>
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
                  i18n.getCurrentLanguage() === 'zh' ? '中文' :
                  i18n.getCurrentLanguage() === 'en' ? 'English' :
                  i18n.getCurrentLanguage() === 'ja' ? '日本語' :
                  'Español'
                }</span>
                <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </button>
              <div id="language-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                <button onclick="handleLanguageSwitch('zh', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'zh' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇨🇳</span>
                  <span>中文</span>
                  ${i18n.getCurrentLanguage() === 'zh' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('en', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'en' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇬🇧</span>
                  <span>English</span>
                  ${i18n.getCurrentLanguage() === 'en' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('ja', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'ja' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇯🇵</span>
                  <span>日本語</span>
                  ${i18n.getCurrentLanguage() === 'ja' ? '<i class="fas fa-check ml-auto"></i>' : ''}
                </button>
                <button onclick="handleLanguageSwitch('es', 'language-menu')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm ${i18n.getCurrentLanguage() === 'es' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'}">
                  <span class="mr-2">🇪🇸</span>
                  <span>Español</span>
                  ${i18n.getCurrentLanguage() === 'es' ? '<i class="fas fa-check ml-auto"></i>' : ''}
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

async function showAdmin() {
  // Auto-save draft before leaving create review page
  await autoSaveDraftBeforeNavigation();
  
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
              ${currentUser.role === 'admin' ? `
                <button onclick="showAdminTab('users')" 
                        class="admin-tab active py-4 px-1 border-b-2 font-medium text-sm"
                        data-tab="users">
                  <i class="fas fa-users mr-2"></i>${i18n.t('userManagement')}
                </button>
              ` : ''}
              <button onclick="showAdminTab('templates')" 
                      class="admin-tab ${currentUser.role === 'premium' ? 'active' : ''} py-4 px-1 border-b-2 font-medium text-sm"
                      data-tab="templates">
                <i class="fas fa-clipboard-list mr-2"></i>${i18n.t('templateManagement')}
              </button>
              ${currentUser.role === 'admin' ? `
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
                <button onclick="showAdminTab('testimonials')" 
                        class="admin-tab py-4 px-1 border-b-2 font-medium text-sm"
                        data-tab="testimonials">
                  <i class="fas fa-comments mr-2"></i>${i18n.t('testimonialsManagement') || '留言管理'}
                </button>
                <button onclick="showAdminTab('publicReviews')" 
                        class="admin-tab py-4 px-1 border-b-2 font-medium text-sm"
                        data-tab="publicReviews">
                  <i class="fas fa-globe mr-2"></i>${i18n.t('publicReviewsManagement') || '公开复盘管理'}
                </button>
                <button onclick="showAdminTab('subscription')" 
                        class="admin-tab py-4 px-1 border-b-2 font-medium text-sm"
                        data-tab="subscription">
                  <i class="fas fa-credit-card mr-2"></i>${i18n.t('subscriptionManagement') || '订阅管理'}
                </button>
              ` : ''}
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

  // Show appropriate default tab based on user role
  if (currentUser.role === 'admin') {
    showAdminTab('users');
  } else {
    showAdminTab('templates');
  }
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
            ${settings.role !== 'admin' ? `
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
                      <p class="text-2xl font-bold ${settings.role === 'premium' ? 'text-yellow-600' : 'text-gray-700'}">
                        <i class="fas ${settings.role === 'premium' ? 'fa-crown' : 'fa-user-circle'} mr-2"></i>
                        ${settings.role === 'premium' ? (i18n.t('premiumUser') || '高级用户') : (i18n.t('freeUser') || '免费用户')}
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
                      ${settings.role === 'premium' && settings.subscription_expires_at && settings.subscription_expires_at !== '9999-12-31 23:59:59' ? `
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
                              class="bg-gradient-to-r ${settings.role === 'premium' ? 'from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' : 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'} text-white px-8 py-3 rounded-lg transition font-semibold shadow-lg transform hover:scale-105">
                        <i class="fas ${settings.role === 'premium' ? 'fa-sync-alt' : 'fa-arrow-up'} mr-2"></i>
                        ${settings.role === 'premium' ? (i18n.t('renew') || '续费') : (i18n.t('upgrade') || '升级')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}
            
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
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    showNotification(i18n.t('settingsUpdated'), 'success');
    
    // If language changed, reload to apply new language
    if (language !== i18n.getCurrentLanguage()) {
      setTimeout(() => {
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
          <i class="fas fa-plus mr-2"></i>${i18n.t('createTemplate')}
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
                ${template.name_en ? `<div class="text-xs text-gray-500">${escapeHtml(template.name_en)}</div>` : ''}
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
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="showManageQuestionsModal(${template.id})" 
                        class="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="${i18n.t('manageQuestions')}">
                  <i class="fas fa-tasks"></i>
                </button>
                <button onclick="showEditTemplateModal(${template.id})" 
                        class="text-blue-600 hover:text-blue-900 mr-3"
                        title="${i18n.t('edit')}">
                  <i class="fas fa-edit"></i>
                </button>
                ${!template.is_default ? `
                  <button onclick="deleteTemplate(${template.id})" 
                          class="text-red-600 hover:text-red-900"
                          title="${i18n.t('delete')}">
                    <i class="fas fa-trash"></i>
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

function showCreateTemplateModal() {
  const modal = document.createElement('div');
  modal.id = 'template-modal';
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-plus mr-2"></i>${i18n.t('createTemplate')}
          </h3>
          <button onclick="closeTemplateModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form id="template-form" onsubmit="handleCreateTemplate(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateNameCn')} *
              </label>
              <input type="text" id="template-name" required
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateNameEn')}
              </label>
              <input type="text" id="template-name-en"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateDescriptionCn')}
              </label>
              <textarea id="template-description" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('templateDescriptionEn')}
              </label>
              <textarea id="template-description-en" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
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
  const data = {
    name: document.getElementById('template-name').value,
    name_en: document.getElementById('template-name-en').value || null,
    description: document.getElementById('template-description').value || null,
    description_en: document.getElementById('template-description-en').value || null,
    is_default: isDefaultCheckbox ? isDefaultCheckbox.checked : false
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
                  ${i18n.t('templateNameCn')} *
                </label>
                <input type="text" id="template-name" required value="${escapeHtml(template.name)}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templateNameEn')}
                </label>
                <input type="text" id="template-name-en" value="${escapeHtml(template.name_en || '')}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templateDescriptionCn')}
                </label>
                <textarea id="template-description" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(template.description || '')}</textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('templateDescriptionEn')}
                </label>
                <textarea id="template-description-en" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(template.description_en || '')}</textarea>
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
  const data = {
    name: document.getElementById('template-name').value,
    name_en: document.getElementById('template-name-en').value || null,
    description: document.getElementById('template-description').value || null,
    description_en: document.getElementById('template-description-en').value || null,
    is_default: isDefaultCheckbox ? isDefaultCheckbox.checked : false,
    is_active: document.getElementById('template-is-active').checked
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
                         i18n.t('questionTypeText');
        const typeIcon = q.question_type === 'single_choice' ? 'fa-dot-circle' :
                        q.question_type === 'multiple_choice' ? 'fa-check-square' :
                        'fa-font';
        const typeColor = q.question_type === 'text' ? 'blue' : 'green';
        
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
                <option value="single_choice">${i18n.t('questionTypeSingleChoice')}</option>
                <option value="multiple_choice">${i18n.t('questionTypeMultipleChoice')}</option>
              </select>
            </div>
            
            <!-- Question Text -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextCn')} *
              </label>
              <textarea id="question-text" required rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextEn')}
              </label>
              <textarea id="question-text-en" rows="3"
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
                <option value="single_choice" ${question.question_type === 'single_choice' ? 'selected' : ''}>${i18n.t('questionTypeSingleChoice')}</option>
                <option value="multiple_choice" ${question.question_type === 'multiple_choice' ? 'selected' : ''}>${i18n.t('questionTypeMultipleChoice')}</option>
                <option value="time_with_text" ${question.question_type === 'time_with_text' ? 'selected' : ''}>${i18n.t('questionTypeTimeWithText')}</option>
              </select>
            </div>
            
            <!-- Question Text -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextCn')} *
              </label>
              <textarea id="question-text" required rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(question.question_text)}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('questionTextEn')}
              </label>
              <textarea id="question-text-en" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">${escapeHtml(question.question_text_en || '')}</textarea>
            </div>
            
            <!-- Answer Length (for text type only) -->
            <div id="answer-length-container" class="${question.question_type === 'text' ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('answerLength')} *
              </label>
              <input type="number" id="question-answer-length" min="10" max="1000" value="${question.answer_length || 50}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <p class="text-xs text-gray-500 mt-1">${i18n.t('maxCharacters')}: 10-1000 (${i18n.t('defaultValue')}: 50)</p>
            </div>
            
            <!-- Time Type Fields (for time_with_text only) -->
            <div id="time-type-container" class="${question.question_type === 'time_with_text' ? '' : 'hidden'}">
              <div class="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm text-blue-800 font-medium">
                  <i class="fas fa-info-circle mr-1"></i>${i18n.t('timeTypeDescription')}
                </p>
                
                <!-- Default Datetime -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-clock mr-1"></i>${i18n.t('defaultDatetime')}
                  </label>
                  <input type="datetime-local" id="question-datetime-value" 
                         value="${question.datetime_value ? new Date(question.datetime_value).toISOString().slice(0, 16) : ''}"
                         class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <p class="text-xs text-gray-500 mt-1">${i18n.t('defaultDatetimeHint')}</p>
                </div>
                
                <!-- Datetime Title (max 12 chars) -->
                <div>
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
            <div id="options-container" class="${question.question_type === 'text' ? 'hidden' : ''}">
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
            <div id="correct-answer-container" class="${question.question_type === 'text' ? 'hidden' : ''}">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ${i18n.t('correctAnswer')} *
                <span class="text-xs text-gray-500">(${i18n.t('correctAnswerHint')})</span>
              </label>
              <div id="single-choice-answer" class="${question.question_type === 'single_choice' ? '' : 'hidden'} space-y-2">
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
  
  // Set correct answer
  if (question.correct_answer) {
    setTimeout(() => {
      if (question.question_type === 'single_choice') {
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
}

// Handle question type change
function handleQuestionTypeChange() {
  const type = document.getElementById('question-type').value;
  const answerLengthContainer = document.getElementById('answer-length-container');
  const timeTypeContainer = document.getElementById('time-type-container');
  const optionsContainer = document.getElementById('options-container');
  const correctAnswerContainer = document.getElementById('correct-answer-container');
  const singleChoiceAnswer = document.getElementById('single-choice-answer');
  const multipleChoiceAnswer = document.getElementById('multiple-choice-answer');
  
  // Hide all type-specific containers first
  answerLengthContainer.classList.add('hidden');
  timeTypeContainer.classList.add('hidden');
  optionsContainer.classList.add('hidden');
  correctAnswerContainer.classList.add('hidden');
  
  if (type === 'text') {
    answerLengthContainer.classList.remove('hidden');
  } else if (type === 'time_with_text') {
    timeTypeContainer.classList.remove('hidden');
  } else { // single_choice or multiple_choice
    optionsContainer.classList.remove('hidden');
    correctAnswerContainer.classList.remove('hidden');
    
    if (type === 'single_choice') {
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
  if (!type || type === 'text') return;
  
  const singleChoiceContainer = document.getElementById('single-choice-answer');
  const multipleChoiceContainer = document.getElementById('multiple-choice-answer');
  
  if (type === 'single_choice' && singleChoiceContainer) {
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
  const type = document.getElementById('question-type').value;
  const data = {
    question_text: document.getElementById('question-text').value,
    question_text_en: document.getElementById('question-text-en').value || null,
    question_type: type
  };
  
  if (type === 'text') {
    data.answer_length = parseInt(document.getElementById('question-answer-length').value) || 50;
  } else if (type === 'time_with_text') {
    // Collect time type fields
    const datetimeValue = document.getElementById('question-datetime-value').value;
    const datetimeTitle = document.getElementById('question-datetime-title').value.trim();
    const answerMaxLength = parseInt(document.getElementById('question-datetime-answer-max-length').value) || 200;
    
    // Validate datetime title (required, max 12 chars)
    if (!datetimeTitle) {
      throw new Error(i18n.t('datetimeTitle') + ' ' + i18n.t('isRequired'));
    }
    if (datetimeTitle.length > 12) {
      throw new Error(i18n.t('datetimeTitle') + ' ' + i18n.t('maxLength') + ': 12');
    }
    
    // Validate answer max length (50-500)
    if (answerMaxLength < 50 || answerMaxLength > 500) {
      throw new Error(i18n.t('answerMaxLength') + ' must be between 50 and 500');
    }
    
    data.datetime_value = datetimeValue || null;
    data.datetime_title = datetimeTitle;
    data.datetime_answer_max_length = answerMaxLength;
  } else {
    // Collect options for single_choice and multiple_choice
    const options = currentEditingOptions.filter(opt => {
      const text = opt.substring(opt.indexOf('.') + 1).trim();
      return text.length > 0;
    });
    
    if (options.length === 0) {
      throw new Error(i18n.t('choiceOptions') + ' is required');
    }
    
    data.options = JSON.stringify(options);
    
    // Collect correct answer
    if (type === 'single_choice') {
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
                  <option value="zh" ${user.language === 'zh' ? 'selected' : ''}>中文</option>
                  <option value="en" ${user.language === 'en' ? 'selected' : ''}>English</option>
                  <option value="ja" ${user.language === 'ja' ? 'selected' : ''}>日本語</option>
                  <option value="es" ${user.language === 'es' ? 'selected' : ''}>Español</option>
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
                  ${i18n.t('referredBy') || '介绍人ID'}
                </label>
                <input type="number" id="user-referred-by" 
                       value="${user.referred_by || ''}"
                       placeholder="${i18n.t('enterReferrerUserId') || '输入介绍人的用户ID'}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
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
  
  const subscriptionExpiresValue = document.getElementById('user-subscription-expires').value;
  const referredByValue = document.getElementById('user-referred-by').value;
  const loginCountValue = document.getElementById('user-login-count').value;
  
  const data = {
    username: document.getElementById('user-username').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value,
    language: document.getElementById('user-language').value,
    subscription_tier: document.getElementById('user-subscription-tier').value,
    subscription_expires_at: subscriptionExpiresValue ? new Date(subscriptionExpiresValue).toISOString() : null,
    referred_by: referredByValue ? parseInt(referredByValue) : null,
    login_count: loginCountValue ? parseInt(loginCountValue) : 0
  };

  try {
    await axios.put(`/api/admin/users/${userId}`, data);
    showNotification(i18n.t('userUpdated'), 'success');
    closeUserModal();
    await loadUsersTable();
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    if (errorMsg.includes('Email already') || errorMsg.includes('already in use')) {
      showNotification(i18n.t('emailInUse'), 'error');
    } else {
      showNotification(i18n.t('operationFailed') + ': ' + errorMsg, 'error');
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
          
          <form id="reset-password-form" onsubmit="handleResetPassword(event, ${userId})">
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

async function handleResetPassword(e, userId) {
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
    const { premium } = configResponse.data;
    const isRenewal = user.role === 'premium';
    
    // Determine price based on user type
    const price = isRenewal ? premium.renewal_price : premium.price;
    const itemType = isRenewal ? 'renewal' : 'upgrade';
    const serviceTitle = isRenewal ? (i18n.t('renewalService') || '续费服务') : (i18n.t('upgradeService') || '升级服务');
    
    // Add to cart
    await axios.post('/api/cart', {
      item_type: itemType,
      subscription_tier: 'premium',
      price_usd: price,
      duration_days: 365,
      description: serviceTitle,
      description_en: isRenewal ? 'Renewal Service' : 'Upgrade Service'
    });
    
    showNotification(i18n.t('addedToCart') || '已添加到购物车', 'success');
    
    // Update cart count
    await updateCartCount();
    
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
    await axios.post('/api/cart', {
      item_type: 'renewal',
      subscription_tier: 'premium',
      price_usd: price,
      duration_days: 365,
      description: serviceTitle,
      description_en: 'Renewal Service'
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
    
    // Get payments
    const paymentsResponse = await axios.get('/api/admin/payments');
    const payments = paymentsResponse.data.payments || [];
    
    container.innerHTML = `
      <div class="mb-8">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-cog mr-2"></i>${i18n.t('pricingSettings') || '价格设置'}
        </h3>
        <div class="bg-white rounded-lg shadow p-6">
          <form onsubmit="handleUpdateSubscriptionConfig(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('annualPrice') || '高级用户年费（美元）'}
                </label>
                <input type="number" step="0.01" id="premium-price" value="${premiumConfig?.price_usd || 20}" 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <p class="text-xs text-gray-500 mt-1">${i18n.t('newUserUpgradePrice') || '新用户升级价格'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ${i18n.t('renewalPrice') || '高级用户续费费用（美元）'}
                </label>
                <input type="number" step="0.01" id="renewal-price" value="${premiumConfig?.renewal_price_usd || 20}" 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <p class="text-xs text-gray-500 mt-1">${i18n.t('existingUserRenewalPrice') || '现有用户续费价格'}</p>
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
      </div>
      
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-receipt mr-2"></i>${i18n.t('paymentHistory') || '支付历史'}
        </h3>
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('user') || '用户'}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('amount') || '金额'}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('status') || '状态'}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${i18n.t('paymentDate') || '支付日期'}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${payments.map(p => `
                <tr>
                  <td class="px-6 py-4 text-sm text-gray-900">${p.username || p.email}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">$${p.amount_usd}</td>
                  <td class="px-6 py-4 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${
                      p.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                      p.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }">
                      ${p.payment_status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
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
    const duration = document.getElementById('premium-duration').value;
    
    await axios.put('/api/admin/subscription/config/premium', {
      price_usd: parseFloat(price),
      renewal_price_usd: parseFloat(renewalPrice),
      duration_days: parseInt(duration),
      description: '高级用户年费',
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
    const response = await axios.get('/api/cart');
    const items = response.data.items || [];
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'cart-modal';
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + parseFloat(item.price_usd), 0);
    
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
                      <i class="fas ${item.item_type === 'upgrade' ? 'fa-arrow-up text-purple-500' : 'fa-sync-alt text-green-500'} text-xl mr-3"></i>
                      <h3 class="font-semibold text-lg text-gray-800">
                        ${i18n.getCurrentLanguage() === 'en' && item.description_en ? item.description_en : item.description}
                      </h3>
                    </div>
                    <p class="text-sm text-gray-600 ml-8">
                      <i class="fas fa-crown text-yellow-500 mr-1"></i>
                      ${i18n.t('premiumUser') || '高级用户'} - ${item.duration_days} ${i18n.t('days') || '天'}
                    </p>
                  </div>
                  <div class="flex items-center space-x-4">
                    <span class="text-2xl font-bold text-indigo-600">$${item.price_usd}</span>
                    <button onclick="removeFromCart(${item.id})" 
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
async function removeFromCart(itemId) {
  try {
    await axios.delete(`/api/cart/${itemId}`);
    showNotification(i18n.t('removeFromCart') || '已从购物车移除', 'success');
    closeCart();
    await updateCartCount();
    // Reopen cart to show updated list
    setTimeout(() => showCart(), 300);
  } catch (error) {
    console.error('Remove from cart error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Clear entire cart
async function clearCart() {
  if (!confirm(i18n.t('confirmClearCart') || '确定要清空购物车吗？')) {
    return;
  }
  
  try {
    await axios.delete('/api/cart');
    showNotification(i18n.t('clearCart') || '购物车已清空', 'success');
    closeCart();
    await updateCartCount();
  } catch (error) {
    console.error('Clear cart error:', error);
    showNotification(i18n.t('operationFailed') || '操作失败', 'error');
  }
}

// Proceed to checkout with PayPal
async function proceedToCheckout() {
  try {
    // Get cart items
    const cartResponse = await axios.get('/api/cart');
    const items = cartResponse.data.items || [];
    
    if (items.length === 0) {
      showNotification(i18n.t('cartEmpty') || '购物车是空的', 'error');
      return;
    }
    
    // Close cart modal
    closeCart();
    
    // Show checkout modal with PayPal
    const total = items.reduce((sum, item) => sum + parseFloat(item.price_usd), 0);
    
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
                <span>${i18n.getCurrentLanguage() === 'en' && item.description_en ? item.description_en : item.description}</span>
                <span class="font-semibold">$${item.price_usd}</span>
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
              // Create order with cart items
              const orderResponse = await axios.post('/api/payment/cart/create-order', {
                items: items.map(item => ({
                  id: item.id,
                  tier: item.subscription_tier,
                  item_type: item.item_type,
                  price_usd: item.price_usd,
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
    
    // Show confirmation dialog
    if (!confirm(i18n.t('confirmPayment') + '?\n\n' + (i18n.t('total') || '总计') + ': $' + items.reduce((sum, item) => sum + parseFloat(item.price_usd), 0).toFixed(2))) {
      return;
    }
    
    // Disable button to prevent double-click
    const confirmBtn = document.getElementById('confirm-checkout-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (i18n.t('processing') || '处理中...');
    }
    
    showNotification(i18n.t('processingPayment') || '正在处理支付...', 'info');
    
    // Create PayPal order
    const orderResponse = await axios.post('/api/payment/cart/create-order', {
      items: items.map(item => ({
        id: item.id,
        tier: item.subscription_tier,
        item_type: item.item_type,
        price_usd: item.price_usd,
        duration_days: item.duration_days
      }))
    });
    
    const orderId = orderResponse.data.orderId;
    
    // In a real scenario, we would redirect to PayPal
    // For testing in sandbox mode, we'll simulate a successful payment
    // In production, you MUST use the PayPal button or redirect to PayPal approval URL
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Note: In production, this capture should only happen after PayPal approval
    // This is a simplified flow for testing purposes
    const captureResponse = await axios.post('/api/payment/cart/capture-order', {
      orderId: orderId
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
    } catch (err) {
      console.error('Failed to refresh user info:', err);
    }
    
    // Reload page to show updated menu and permissions
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Confirm checkout error:', error);
    showNotification(i18n.t('paymentFailed') || '支付失败: ' + (error.response?.data?.error || error.message), 'error');
    
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
    authToken = null;
    axios.defaults.headers.common['Authorization'] = '';
    
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

// ============ Answer Sets Management (Phase 1) ============

// Global state for answer sets
window.currentAnswerSets = [];
window.currentSetIndex = 0;

/**
 * Load answer sets for a review
 */
async function loadAnswerSets(reviewId, keepCurrentIndex = false) {
  const response = await axios.get(`/api/answer-sets/${reviewId}`);
  const oldIndex = window.currentSetIndex || 0;
  
  window.currentAnswerSets = response.data.sets || [];
  
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
  
  // Update navigation display
  updateAnswerSetNavigation(reviewId, index + 1, sets.length);
  
  // Update answer displays for each question
  questions.forEach(q => {
    const answer = currentSet.answers.find(a => a.question_number === q.question_number);
    const answerText = answer ? answer.answer : '';
    
    // Update answer display element
    const answerElement = document.getElementById(`answer-display-${q.question_number}`);
    if (answerElement) {
      answerElement.innerHTML = answerText ? 
        `<div class="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
           <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(answerText)}</p>
           <p class="text-xs text-gray-500 mt-2">
             <i class="fas fa-clock mr-1"></i>${i18n.t('answeredAt')}: ${formatDate(answer.created_at)}
           </p>
         </div>` :
        `<div onclick="editEmptyAnswerInSet(${reviewId}, ${q.question_number})" 
              class="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400">
           <i class="fas fa-plus-circle mr-1"></i>${i18n.t('noAnswerInThisSet')} <span class="text-xs">(${i18n.t('clickToAdd')})</span>
         </div>`;
    }
  });
}

/**
 * Update answer set navigation display
 */
function updateAnswerSetNavigation(reviewId, currentNum, totalNum) {
  const navElement = document.getElementById('answer-set-navigation');
  if (!navElement) return;
  
  const hasPrev = currentNum > 1;
  const hasNext = currentNum < totalNum;
  
  navElement.innerHTML = `
    <div class="flex items-center justify-between p-4 bg-indigo-50 rounded-lg mb-4">
      <button onclick="navigateToPreviousSet(${reviewId})" 
              ${!hasPrev ? 'disabled' : ''}
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <i class="fas fa-arrow-left mr-2"></i>${i18n.t('previousSet') || '上一组'}
      </button>
      
      <div class="text-center">
        <p class="text-sm text-gray-600">${i18n.t('answerSet') || '答案组'}</p>
        <p class="text-xl font-bold text-indigo-600">${currentNum} / ${totalNum}</p>
        ${totalNum > 0 ? `<p class="text-xs text-gray-500 mt-1">${i18n.t('createdAt')}: ${window.currentAnswerSets[currentNum-1]?.created_at || ''}</p>` : ''}
      </div>
      
      <button onclick="navigateToNextSet(${reviewId})" 
              ${!hasNext ? 'disabled' : ''}
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        ${i18n.t('nextSet') || '下一组'}<i class="fas fa-arrow-right ml-2"></i>
      </button>
    </div>
  `;
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
  
  if (!answer) {
    showNotification(i18n.t('answerCannotBeEmpty') || '答案不能为空', 'error');
    return;
  }
  
  try {
    const sets = window.currentAnswerSets || [];
    const index = window.currentSetIndex || 0;
    
    if (sets.length === 0) {
      showNotification('No answer set found', 'error');
      return;
    }
    
    const currentSet = sets[index];
    const setNumber = currentSet.set_number;
    
    // Call API to update the answer in current set
    const response = await axios.put(`/api/answer-sets/${reviewId}/${setNumber}`, {
      answers: {
        [questionNumber]: answer
      }
    });
    
    if (response.data) {
      showNotification(i18n.t('answerSaved') || '答案已保存', 'success');
      
      // Reload answer sets to refresh display, keep current index
      await loadAnswerSets(reviewId, true);
      renderAnswerSet(reviewId);
    }
  } catch (error) {
    console.error('Save inline answer error:', error);
    showNotification(i18n.t('operationFailed') + ': ' + (error.response?.data?.error || error.message), 'error');
  }
}

/**
 * Create a new answer set for all questions
 */
async function createNewAnswerSet(reviewId) {
  try {
    const questions = window.currentEditQuestions || [];
    
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

async function submitNewAnswerSet(reviewId) {
  try {
    const questions = window.currentEditQuestions || [];
    const answers = {};
    
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
      }
    });
    
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
