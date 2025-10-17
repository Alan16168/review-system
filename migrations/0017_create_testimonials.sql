-- Create testimonials table for user reviews
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT,
  role TEXT NOT NULL,
  role_en TEXT,
  content TEXT NOT NULL,
  content_en TEXT,
  avatar_url TEXT,
  rating INTEGER DEFAULT 5 CHECK(rating >= 1 AND rating <= 5),
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_created ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials(display_order);

-- Insert default testimonials (3 samples)
INSERT INTO testimonials (name, name_en, role, role_en, content, content_en, rating, is_featured, display_order) VALUES
  ('张明', 'Ming Zhang', '产品经理', 'Product Manager', '这个系统帮助我们团队建立了持续改进的文化。通过定期复盘，我们的项目成功率提升了40%。', 'This system helped our team establish a culture of continuous improvement. Through regular reviews, our project success rate increased by 40%.', 5, 1, 1),
  ('李娜', 'Na Li', '创业者', 'Entrepreneur', '作为创业者，时间管理非常重要。系统化的复盘让我能够快速总结经验，避免重复犯错。', 'As an entrepreneur, time management is crucial. Systematic review helps me quickly summarize experiences and avoid repeating mistakes.', 5, 1, 2),
  ('王强', 'Qiang Wang', '团队负责人', 'Team Leader', '团队协作复盘功能非常实用，每个成员都能分享自己的想法，促进了团队的深度交流。', 'The team collaboration review feature is very practical. Every member can share their thoughts, promoting deep team communication.', 5, 1, 3);
