-- Add French language support to production search_keywords table

-- Step 1: Create backup of existing data
CREATE TABLE search_keywords_backup AS SELECT * FROM search_keywords;

-- Step 2: Drop the old table
DROP TABLE search_keywords;

-- Step 3: Create new table with French language support
CREATE TABLE search_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('zh', 'en', 'ja', 'es', 'fr')),
  type TEXT NOT NULL CHECK (type IN ('article', 'video')),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Restore data from backup
INSERT INTO search_keywords (id, keyword, language, type, is_active, created_at, updated_at)
SELECT id, keyword, language, type, is_active, created_at, updated_at FROM search_keywords_backup;

-- Step 5: Drop backup table
DROP TABLE search_keywords_backup;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_search_keywords_language ON search_keywords(language);
CREATE INDEX IF NOT EXISTS idx_search_keywords_type ON search_keywords(type);
CREATE INDEX IF NOT EXISTS idx_search_keywords_active ON search_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_search_keywords_lang_type ON search_keywords(language, type, is_active);

-- Step 7: Insert French article keywords
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('rétrospective de projet méthode', 'fr', 'article'),
  ('comment faire une rétrospective', 'fr', 'article'),
  ('révision systématique projet', 'fr', 'article'),
  ('meilleures pratiques rétrospective', 'fr', 'article'),
  ('apprentissage par l''expérience', 'fr', 'article');

-- Step 8: Insert French video keywords
INSERT INTO search_keywords (keyword, language, type) VALUES 
  ('qu''est-ce qu''une rétrospective', 'fr', 'video'),
  ('comment faire rétrospective efficace', 'fr', 'video'),
  ('avantages de la rétrospective', 'fr', 'video');
