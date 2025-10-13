// Global state
let currentUser = null;
let authToken = null;
let currentView = 'home';

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
  // Check if URL contains password reset token
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  
  if (resetToken) {
    // Show password reset page with token
    showResetPasswordWithToken();
    return;
  }
  
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
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
function showHomePage() {
  currentView = 'home';
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-white">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center cursor-pointer" onclick="showHomePage()">
              <i class="fas fa-brain text-indigo-600 text-2xl mr-2"></i>
              <span class="text-xl font-bold text-gray-800">${i18n.t('systemTitle')}</span>
            </div>
            <div class="hidden md:flex space-x-8">
              <a href="#resources" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('resources')}</a>
              <a href="#about" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('aboutUs')}</a>
              <a href="#testimonials" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('testimonials')}</a>
              <a href="#contact" class="text-gray-700 hover:text-indigo-600 transition">${i18n.t('contact')}</a>
            </div>
            <div class="flex items-center space-x-4">
              <button onclick="i18n.setLanguage(i18n.getCurrentLanguage() === 'zh' ? 'en' : 'zh')" 
                      class="text-sm text-gray-600 hover:text-indigo-600">
                <i class="fas fa-language mr-1"></i>
                ${i18n.getCurrentLanguage() === 'zh' ? 'EN' : '中文'}
              </button>
              ${currentUser ? `
                <span class="text-gray-700 font-medium">
                  <i class="fas fa-user-circle mr-1"></i>${escapeHtml(currentUser.username)}
                </span>
                <button onclick="showDashboard()" 
                        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                  <i class="fas fa-tachometer-alt mr-2"></i>${i18n.t('dashboard')}
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
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop" 
                       alt="Team collaboration" 
                       class="w-full h-full object-cover">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h3 class="text-xl font-bold mb-2">${i18n.t('carousel1Title')}</h3>
                    <p class="text-sm">${i18n.t('carousel1Desc')}</p>
                  </div>
                </div>
                <div class="carousel-slide">
                  <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop" 
                       alt="Personal growth" 
                       class="w-full h-full object-cover">
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <h3 class="text-xl font-bold mb-2">${i18n.t('carousel2Title')}</h3>
                    <p class="text-sm">${i18n.t('carousel2Desc')}</p>
                  </div>
                </div>
                <div class="carousel-slide">
                  <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop" 
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
              <div class="flex space-x-6">
                <div class="text-center">
                  <div class="text-3xl font-bold text-indigo-600">10K+</div>
                  <div class="text-sm text-gray-600">${i18n.t('activeUsers')}</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-indigo-600">50K+</div>
                  <div class="text-sm text-gray-600">${i18n.t('reviewsCreated')}</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-indigo-600">500+</div>
                  <div class="text-sm text-gray-600">${i18n.t('teamsActive')}</div>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <i class="fas fa-users text-indigo-600 text-9xl opacity-50"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- Team Section -->
      <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">${i18n.t('ourTeam')}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-white rounded-xl p-6 text-center shadow-lg">
              <div class="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-user-tie text-indigo-600 text-4xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">${i18n.t('founderName')}</h3>
              <p class="text-indigo-600 mb-3">${i18n.t('founderTitle')}</p>
              <p class="text-gray-600 text-sm">${i18n.t('founderBio')}</p>
            </div>
            <div class="bg-white rounded-xl p-6 text-center shadow-lg">
              <div class="w-24 h-24 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-code text-purple-600 text-4xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">${i18n.t('techLeadName')}</h3>
              <p class="text-purple-600 mb-3">${i18n.t('techLeadTitle')}</p>
              <p class="text-gray-600 text-sm">${i18n.t('techLeadBio')}</p>
            </div>
            <div class="bg-white rounded-xl p-6 text-center shadow-lg">
              <div class="w-24 h-24 bg-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-paint-brush text-pink-600 text-4xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">${i18n.t('designLeadName')}</h3>
              <p class="text-pink-600 mb-3">${i18n.t('designLeadTitle')}</p>
              <p class="text-gray-600 text-sm">${i18n.t('designLeadBio')}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section id="testimonials" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">${i18n.t('userTestimonials')}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-gray-50 rounded-xl p-6 shadow-lg">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-user text-indigo-600"></i>
                </div>
                <div>
                  <div class="font-bold text-gray-900">${i18n.t('testimonial1Name')}</div>
                  <div class="text-sm text-gray-600">${i18n.t('testimonial1Role')}</div>
                </div>
              </div>
              <div class="text-yellow-400 mb-2">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <p class="text-gray-600">${i18n.t('testimonial1Text')}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-6 shadow-lg">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-user text-purple-600"></i>
                </div>
                <div>
                  <div class="font-bold text-gray-900">${i18n.t('testimonial2Name')}</div>
                  <div class="text-sm text-gray-600">${i18n.t('testimonial2Role')}</div>
                </div>
              </div>
              <div class="text-yellow-400 mb-2">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <p class="text-gray-600">${i18n.t('testimonial2Text')}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-6 shadow-lg">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-user text-pink-600"></i>
                </div>
                <div>
                  <div class="font-bold text-gray-900">${i18n.t('testimonial3Name')}</div>
                  <div class="text-sm text-gray-600">${i18n.t('testimonial3Role')}</div>
                </div>
              </div>
              <div class="text-yellow-400 mb-2">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
              </div>
              <p class="text-gray-600">${i18n.t('testimonial3Text')}</p>
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
                    <div class="text-gray-600">contact@reviewsystem.com</div>
                  </div>
                </div>
                <div class="flex items-center mb-4">
                  <i class="fas fa-phone text-indigo-600 text-2xl mr-4"></i>
                  <div>
                    <div class="font-bold text-gray-900">${i18n.t('phone')}</div>
                    <div class="text-gray-600">+1 (555) 123-4567</div>
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

// Load Articles using API - Show 6 random articles, update 1 on refresh
async function loadArticles(refresh = false) {
  const articlesContent = document.getElementById('articles-content');
  
  try {
    // Fetch articles if not cached
    if (cachedArticles.length === 0) {
      const response = await axios.get('/api/resources/articles');
      const { articles, source } = response.data;
      cachedArticles = articles;
      console.log(`Articles loaded from: ${source}`);
    }
    
    // Initialize: Select 6 random articles
    if (!refresh || displayedArticles.length === 0) {
      // Shuffle and pick 6
      const shuffled = [...cachedArticles].sort(() => 0.5 - Math.random());
      displayedArticles = shuffled.slice(0, 6);
    } else {
      // Refresh: Replace 1 random article
      const randomIndex = Math.floor(Math.random() * displayedArticles.length);
      
      // Find an article not currently displayed
      const availableArticles = cachedArticles.filter(
        article => !displayedArticles.some(displayed => displayed.url === article.url)
      );
      
      if (availableArticles.length > 0) {
        const newArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
        displayedArticles[randomIndex] = newArticle;
      } else {
        // If all articles are shown, pick any random one
        displayedArticles[randomIndex] = cachedArticles[Math.floor(Math.random() * cachedArticles.length)];
      }
    }
    
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
          <i class="fas fa-sync-alt mr-1"></i>Update One Article
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

// Load Videos using API - Show 6 random videos, update 1 on refresh
async function loadVideos(refresh = false) {
  const videosContent = document.getElementById('videos-content');
  
  try {
    // Fetch videos if not cached
    if (cachedVideos.length === 0) {
      const response = await axios.get('/api/resources/videos');
      const { videos, source } = response.data;
      cachedVideos = videos;
      console.log(`Videos loaded from: ${source}`);
    }
    
    // Initialize: Select 6 random videos
    if (!refresh || displayedVideos.length === 0) {
      // Shuffle and pick 6
      const shuffled = [...cachedVideos].sort(() => 0.5 - Math.random());
      displayedVideos = shuffled.slice(0, 6);
    } else {
      // Refresh: Replace 1 random video
      const randomIndex = Math.floor(Math.random() * displayedVideos.length);
      
      // Find a video not currently displayed
      const availableVideos = cachedVideos.filter(
        video => !displayedVideos.some(displayed => displayed.url === video.url)
      );
      
      if (availableVideos.length > 0) {
        const newVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
        displayedVideos[randomIndex] = newVideo;
      } else {
        // If all videos are shown, pick any random one
        displayedVideos[randomIndex] = cachedVideos[Math.floor(Math.random() * cachedVideos.length)];
      }
    }
    
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
          <i class="fas fa-sync-alt mr-1"></i>Update One Video
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

// Show Terms of Service
function showTerms() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <button onclick="showHomePage()" class="mb-6 text-indigo-600 hover:text-indigo-800">
            <i class="fas fa-arrow-left mr-2"></i>${i18n.t('backToHome')}
          </button>
          <h1 class="text-4xl font-bold text-gray-900 mb-8">${i18n.t('termsOfService')}</h1>
          <div class="prose prose-lg max-w-none">
            <p class="text-gray-600 mb-4">${i18n.t('lastUpdated')}: 2024-10-08</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('terms1Title')}</h2>
            <p class="text-gray-600 mb-6">${i18n.t('terms1Text')}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('terms2Title')}</h2>
            <p class="text-gray-600 mb-6">${i18n.t('terms2Text')}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('terms3Title')}</h2>
            <p class="text-gray-600 mb-6">${i18n.t('terms3Text')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Show Privacy Policy
function showPrivacy() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <button onclick="showHomePage()" class="mb-6 text-indigo-600 hover:text-indigo-800">
            <i class="fas fa-arrow-left mr-2"></i>${i18n.t('backToHome')}
          </button>
          <h1 class="text-4xl font-bold text-gray-900 mb-8">${i18n.t('privacyPolicy')}</h1>
          <div class="prose prose-lg max-w-none">
            <p class="text-gray-600 mb-4">${i18n.t('lastUpdated')}: 2024-10-08</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('privacy1Title')}</h2>
            <p class="text-gray-600 mb-6">${i18n.t('privacy1Text')}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('privacy2Title')}</h2>
            <p class="text-gray-600 mb-6">${i18n.t('privacy2Text')}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">${i18n.t('privacy3Title')}</h2>
            <p class="text-gray-600 mb-6">${i18n.t('privacy3Text')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

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
          text: 'signup_with'
        }
      );
    }
  }, 100);
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
              <h1 class="text-2xl font-bold text-indigo-600 cursor-pointer" onclick="showHomePage()">
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
              <button onclick="showChangePassword()" class="text-gray-700 hover:text-indigo-600" title="${i18n.t('changePassword')}">
                <i class="fas fa-key"></i>
              </button>
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
                <option value="quarterly">${i18n.t('timeTypeQuarterly')}</option>
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
              <option value="quarterly">${i18n.t('timeTypeQuarterly')}</option>
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
                ${review.team_id ? `
                  <button onclick="showTeamReviewCollaboration(${review.id})" 
                          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-users mr-2"></i>${i18n.t('viewTeamAnswers')}
                  </button>
                ` : ''}
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

// Team Review Collaboration View
async function showTeamReviewCollaboration(id) {
  try {
    const [reviewResponse, teamAnswersResponse] = await Promise.all([
      axios.get(`/api/reviews/${id}`),
      axios.get(`/api/reviews/${id}/team-answers`)
    ]);
    
    const review = reviewResponse.data.review;
    const { answersByQuestion, completionStatus, currentUserId } = teamAnswersResponse.data;
    const isOwner = review.user_id === currentUserId;
    
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
              
              <!-- Completion Status -->
              <div class="border-t pt-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-3">
                  <i class="fas fa-check-circle mr-2 text-green-600"></i>${i18n.t('completionStatus')}
                </h3>
                <div class="flex flex-wrap gap-3">
                  ${completionStatus.map(member => `
                    <div class="flex items-center px-4 py-2 bg-gray-50 rounded-lg border ${
                      member.user_id === currentUserId ? 'border-indigo-500' : 'border-gray-200'
                    }">
                      <i class="fas fa-user-circle text-2xl text-gray-400 mr-2"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          ${escapeHtml(member.username)}${member.user_id === currentUserId ? ' (${i18n.t("myAnswer") || "我"})' : ''}
                        </div>
                        <div class="text-xs ${member.completed_count === 9 ? 'text-green-600' : 'text-gray-500'}">
                          <i class="fas ${member.completed_count === 9 ? 'fa-check-circle' : 'fa-clock'} mr-1"></i>
                          ${member.completed_count}/9 ${i18n.t('completed')}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Team Answers for Each Question -->
          <div class="space-y-6">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              const memberAnswers = answersByQuestion[num] || [];
              const myAnswer = memberAnswers.find(a => a.user_id === currentUserId);
              const otherAnswers = memberAnswers.filter(a => a.user_id !== currentUserId);
              
              return `
                <div class="bg-white rounded-lg shadow-md p-6">
                  <h2 class="text-xl font-bold text-gray-800 mb-4 border-b pb-3">
                    <i class="fas fa-question-circle mr-2 text-indigo-600"></i>${i18n.t('question' + num)}
                  </h2>
                  
                  <div class="space-y-4">
                    <!-- My Answer (Editable) -->
                    <div class="border-l-4 border-indigo-500 pl-4">
                      <div class="flex justify-between items-center mb-2">
                        <h3 class="text-sm font-semibold text-indigo-700">
                          <i class="fas fa-user-edit mr-1"></i>${i18n.t('myAnswer')}
                        </h3>
                        <span class="text-xs text-gray-500" id="save-status-${num}">
                          ${myAnswer ? '<i class="fas fa-check text-green-600 mr-1"></i>' + i18n.t('autoSaved') : ''}
                        </span>
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
                        <h3 class="text-sm font-semibold text-gray-700">
                          <i class="fas fa-users mr-1"></i>${i18n.t('memberAnswers')} (${otherAnswers.length})
                        </h3>
                        ${otherAnswers.map(answer => `
                          <div class="border-l-4 border-green-500 pl-4 bg-gray-50 p-3 rounded-r">
                            <div class="flex justify-between items-start mb-2">
                              <div class="flex items-center">
                                <i class="fas fa-user-circle text-lg text-gray-400 mr-2"></i>
                                <div>
                                  <span class="text-sm font-medium text-gray-900">${escapeHtml(answer.username)}</span>
                                  <span class="text-xs text-gray-500 ml-2">
                                    <i class="fas fa-clock mr-1"></i>${new Date(answer.updated_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              ${isOwner ? `
                                <button 
                                  onclick="handleDeleteTeamAnswer(${id}, ${answer.user_id}, ${num})"
                                  class="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded"
                                  title="${i18n.t('deleteAnswer')}"
                                >
                                  <i class="fas fa-trash mr-1"></i>${i18n.t('delete')}
                                </button>
                              ` : ''}
                            </div>
                            <p class="text-gray-800 whitespace-pre-wrap">${escapeHtml(answer.answer)}</p>
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
            }).join('')}
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
      showNotification(i18n.t('operationFailed') + ': Answer cannot be empty', 'error');
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

// Delete team answer (owner only)
async function handleDeleteTeamAnswer(reviewId, userId, questionNumber) {
  if (!confirm(i18n.t('confirmDeleteAnswer'))) {
    return;
  }
  
  try {
    await axios.delete(`/api/reviews/${reviewId}/answer/${userId}/${questionNumber}`);
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
                <option value="quarterly" ${review.time_type === 'quarterly' ? 'selected' : ''}>${i18n.t('timeTypeQuarterly')}</option>
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
            <h1 class="text-2xl font-bold text-indigo-600 cursor-pointer" onclick="showHomePage()">
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
