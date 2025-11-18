-- Add French keywords to search_keywords table

-- Insert article keywords for French
INSERT OR IGNORE INTO search_keywords (keyword, language, type) VALUES 
  ('rétrospective de projet méthode', 'fr', 'article'),
  ('comment faire une rétrospective', 'fr', 'article'),
  ('révision systématique projet', 'fr', 'article'),
  ('meilleures pratiques rétrospective', 'fr', 'article'),
  ('apprentissage par l''expérience', 'fr', 'article');

-- Insert video keywords for French
INSERT OR IGNORE INTO search_keywords (keyword, language, type) VALUES 
  ('qu''est-ce qu''une rétrospective', 'fr', 'video'),
  ('comment faire rétrospective efficace', 'fr', 'video'),
  ('avantages de la rétrospective', 'fr', 'video');
