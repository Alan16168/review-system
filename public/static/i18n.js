// Internationalization support
const translations = {
  zh: {
    // Auth
    'login': '登录',
    'register': '注册',
    'logout': '退出',
    'email': '邮箱',
    'password': '密码',
    'username': '用户名',
    'confirmPassword': '确认密码',
    'forgotPassword': '忘记密码？',
    'noAccount': '没有账号？',
    'haveAccount': '已有账号？',
    'clickRegister': '点击注册',
    'clickLogin': '点击登录',
    
    // Navigation
    'dashboard': '仪表板',
    'myReviews': '我的复盘',
    'teams': '团队',
    'admin': '管理后台',
    'profile': '个人资料',
    
    // Review
    'createReview': '创建复盘',
    'reviewTitle': '复盘主题',
    'personalReview': '个人复盘',
    'teamReview': '团队复盘',
    'selectTeam': '选择团队',
    'status': '状态',
    'draft': '草稿',
    'completed': '已完成',
    'createdAt': '创建时间',
    'updatedAt': '更新时间',
    'creator': '创建者',
    'team': '团队',
    'actions': '操作',
    'edit': '编辑',
    'delete': '删除',
    'view': '查看',
    'save': '保存',
    'cancel': '取消',
    'search': '搜索',
    'back': '返回',
    'all': '全部',
    'review': '复盘',
    'noAnswer': '未填写',
    'collaborators': '协作者',
    'canEdit': '可编辑',
    'readOnly': '只读',
    'teamReviewNote': '选择团队后，团队成员可以协作编辑',
    'teamCannotChange': '团队归属不可更改',
    
    // Nine Questions
    'nineQuestions': '复盘灵魂9问',
    'question1': '1. 我的目标是什么？',
    'question2': '2. 目标达成了吗？',
    'question3': '3. 哪些地方做得不错？',
    'question4': '4. 做的好的能否复制？',
    'question5': '5. 哪些地方出了问题？',
    'question6': '6. 出问题的原因是什么？',
    'question7': '7. 下次怎么避免与优化？',
    'question8': '8. 我学到了什么底层规律？',
    'question9': '9. 如果重新来一次，我们应该如何做？',
    
    // Teams
    'createTeam': '创建团队',
    'teamName': '团队名称',
    'teamDescription': '团队描述',
    'members': '成员',
    'owner': '拥有者',
    'addMember': '添加成员',
    'removeMember': '移除成员',
    'memberCount': '成员数量',
    
    // Admin
    'userManagement': '用户管理',
    'systemStats': '系统统计',
    'totalUsers': '总用户数',
    'totalReviews': '总复盘数',
    'totalTeams': '总团队数',
    'role': '角色',
    'userRole': '用户',
    'premiumRole': '高级用户',
    'adminRole': '管理员',
    'changeRole': '更改角色',
    
    // Messages
    'loginSuccess': '登录成功',
    'loginFailed': '登录失败',
    'registerSuccess': '注册成功',
    'registerFailed': '注册失败',
    'createSuccess': '创建成功',
    'updateSuccess': '更新成功',
    'deleteSuccess': '删除成功',
    'operationFailed': '操作失败',
    'confirmDelete': '确认删除？',
    'loading': '加载中...',
    'noData': '暂无数据',
    
    // System
    'systemTitle': '系统复盘平台',
    'systemSubtitle': '帮助个人和团队进行深度复盘，持续改进',
    'language': '语言',
    'switchLanguage': '切换语言',
  },
  en: {
    // Auth
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'email': 'Email',
    'password': 'Password',
    'username': 'Username',
    'confirmPassword': 'Confirm Password',
    'forgotPassword': 'Forgot Password?',
    'noAccount': "Don't have an account?",
    'haveAccount': 'Already have an account?',
    'clickRegister': 'Click to Register',
    'clickLogin': 'Click to Login',
    
    // Navigation
    'dashboard': 'Dashboard',
    'myReviews': 'My Reviews',
    'teams': 'Teams',
    'admin': 'Admin',
    'profile': 'Profile',
    
    // Review
    'createReview': 'Create Review',
    'reviewTitle': 'Review Title',
    'personalReview': 'Personal Review',
    'teamReview': 'Team Review',
    'selectTeam': 'Select Team',
    'status': 'Status',
    'draft': 'Draft',
    'completed': 'Completed',
    'createdAt': 'Created At',
    'updatedAt': 'Updated At',
    'creator': 'Creator',
    'team': 'Team',
    'actions': 'Actions',
    'edit': 'Edit',
    'delete': 'Delete',
    'view': 'View',
    'save': 'Save',
    'cancel': 'Cancel',
    'search': 'Search',
    'back': 'Back',
    'all': 'All',
    'review': 'Review',
    'noAnswer': 'Not answered',
    'collaborators': 'Collaborators',
    'canEdit': 'Can Edit',
    'readOnly': 'Read Only',
    'teamReviewNote': 'Team members can collaborate on editing after selecting a team',
    'teamCannotChange': 'Team affiliation cannot be changed',
    
    // Nine Questions
    'nineQuestions': 'Nine Key Review Questions',
    'question1': '1. What was my goal?',
    'question2': '2. Was the goal achieved?',
    'question3': '3. What went well?',
    'question4': '4. Can success be replicated?',
    'question5': '5. What went wrong?',
    'question6': '6. What caused the problems?',
    'question7': '7. How to avoid and optimize next time?',
    'question8': '8. What underlying principles did I learn?',
    'question9': '9. If I could do it again, what would I do?',
    
    // Teams
    'createTeam': 'Create Team',
    'teamName': 'Team Name',
    'teamDescription': 'Team Description',
    'members': 'Members',
    'owner': 'Owner',
    'addMember': 'Add Member',
    'removeMember': 'Remove Member',
    'memberCount': 'Member Count',
    
    // Admin
    'userManagement': 'User Management',
    'systemStats': 'System Statistics',
    'totalUsers': 'Total Users',
    'totalReviews': 'Total Reviews',
    'totalTeams': 'Total Teams',
    'role': 'Role',
    'userRole': 'User',
    'premiumRole': 'Premium',
    'adminRole': 'Admin',
    'changeRole': 'Change Role',
    
    // Messages
    'loginSuccess': 'Login successful',
    'loginFailed': 'Login failed',
    'registerSuccess': 'Registration successful',
    'registerFailed': 'Registration failed',
    'createSuccess': 'Created successfully',
    'updateSuccess': 'Updated successfully',
    'deleteSuccess': 'Deleted successfully',
    'operationFailed': 'Operation failed',
    'confirmDelete': 'Confirm delete?',
    'loading': 'Loading...',
    'noData': 'No data',
    
    // System
    'systemTitle': 'Review System Platform',
    'systemSubtitle': 'Help individuals and teams conduct deep reviews for continuous improvement',
    'language': 'Language',
    'switchLanguage': 'Switch Language',
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'zh';
  }

  t(key) {
    return translations[this.currentLang][key] || key;
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      window.location.reload();
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }
}

const i18n = new I18n();
