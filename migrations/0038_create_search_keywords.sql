-- Create search_keywords table for managing article and video search keywords
CREATE TABLE IF NOT EXISTS search_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('zh', 'en', 'ja', 'es')),
  type TEXT NOT NULL CHECK (type IN ('article', 'video')),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_keywords_language ON search_keywords(language);
CREATE INDEX IF NOT EXISTS idx_search_keywords_type ON search_keywords(type);
CREATE INDEX IF NOT EXISTS idx_search_keywords_active ON search_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_search_keywords_lang_type ON search_keywords(language, type, is_active);

-- Insert initial article keywords for Chinese
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('site:wenku.baidu.com 复盘', 'zh', 'article'),
  ('site:wenku.baidu.com 系统复盘', 'zh', 'article'),
  ('site:wenku.baidu.com 如何复盘', 'zh', 'article'),
  ('site:wenku.baidu.com 复盘的方法', 'zh', 'article'),
  ('site:wenku.baidu.com 如何进行系统复盘', 'zh', 'article');

-- Insert initial article keywords for English
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('systematic review reflection', 'en', 'article'),
  ('how to conduct retrospective', 'en', 'article'),
  ('after action review method', 'en', 'article'),
  ('project review best practices', 'en', 'article'),
  ('learning from experience', 'en', 'article');

-- Insert initial article keywords for Japanese
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('プロジェクト振り返り 方法', 'ja', 'article'),
  ('チーム レトロスペクティブ', 'ja', 'article'),
  ('業務改善 振り返り', 'ja', 'article'),
  ('アジャイル ふりかえり', 'ja', 'article'),
  ('学習 振り返り 方法', 'ja', 'article');

-- Insert initial article keywords for Spanish
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('revisión sistemática proyecto', 'es', 'article'),
  ('retrospectiva de equipo método', 'es', 'article'),
  ('cómo hacer revisión de proyectos', 'es', 'article'),
  ('mejores prácticas retrospectiva', 'es', 'article'),
  ('aprendizaje de experiencias', 'es', 'article');

-- Insert initial video keywords for Chinese
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('什么是系统化的复盘', 'zh', 'video'),
  ('如何系统性复盘', 'zh', 'video'),
  ('系统性复盘的优势', 'zh', 'video');

-- Insert initial video keywords for English
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('what is systematic review reflection', 'en', 'video'),
  ('how to conduct systematic retrospective', 'en', 'video'),
  ('benefits of systematic review', 'en', 'video');

-- Insert initial video keywords for Japanese
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('プロジェクト振り返りとは', 'ja', 'video'),
  ('効果的な振り返り方法', 'ja', 'video'),
  ('レトロスペクティブのメリット', 'ja', 'video');

-- Insert initial video keywords for Spanish
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('qué es retrospectiva sistemática', 'es', 'video'),
  ('cómo hacer retrospectiva efectiva', 'es', 'video'),
  ('beneficios de revisión sistemática', 'es', 'video');
