-- Insert admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT OR REPLACE INTO users (id, email, password_hash, username, role, language) VALUES 
  (1, 'admin@review.com', '$2b$10$BNkq1u956qI.m0fikNy5POeMN8qAvdxFkEx8qGuNbT/6Dk8SMHoge', 'Admin', 'admin', 'zh');

-- Insert premium user (password: premium123)
INSERT OR REPLACE INTO users (id, email, password_hash, username, role, language) VALUES 
  (2, 'premium@review.com', '$2b$10$meHOcVR4loG7cge9HFKbZumSANqsS7LuA75FkOy5GwzWmG1Jbrgse', 'Premium User', 'premium', 'en');

-- Insert normal user (password: user123)
INSERT OR REPLACE INTO users (id, email, password_hash, username, role, language) VALUES 
  (3, 'user@review.com', '$2b$10$txWTFkEfImnlbpt683gNeeaVwaWdU5RV9/GO2IY23/NKVz8BtBYm2', 'User', 'user', 'zh');

-- Insert a test team
INSERT OR IGNORE INTO teams (id, name, description, owner_id) VALUES 
  (1, '产品开发团队', '负责产品迭代和功能开发', 2);

-- Add team members
INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES 
  (1, 2),
  (1, 3);

-- Insert sample review
INSERT OR IGNORE INTO reviews (id, title, user_id, team_id, question1, question2, question3, question4, question5, question6, question7, question8, question9, status) VALUES 
  (1, 'Q1季度产品发布复盘', 2, 1, 
   '按时发布产品V2.0，提升用户满意度到85%', 
   '部分达成。产品按时发布，但用户满意度只达到82%', 
   '1. 开发流程顺畅，团队协作良好\n2. 技术架构稳定\n3. 用户反馈收集及时',
   '可以复制的经验：\n1. 每日站会制度\n2. 代码审查流程\n3. 用户反馈快速响应机制',
   '1. 部分功能未达用户预期\n2. 性能优化不足\n3. 文档更新滞后',
   '1. 需求分析不够深入\n2. 性能测试覆盖不足\n3. 资源分配不合理',
   '1. 加强需求调研和用户访谈\n2. 引入性能监控工具\n3. 合理规划人力资源\n4. 建立文档同步更新机制',
   '1. 用户需求理解是产品成功的关键\n2. 性能优化要贯穿整个开发周期\n3. 团队沟通效率直接影响项目进度',
   '1. 项目启动前进行充分的用户调研\n2. 建立完善的性能监控体系\n3. 每周进行进度和质量复盘\n4. 预留20%的时间用于优化和调整',
   'completed');

-- Add collaborators to the team review
INSERT OR IGNORE INTO review_collaborators (review_id, user_id, can_edit) VALUES 
  (1, 2, 1),
  (1, 3, 1);
