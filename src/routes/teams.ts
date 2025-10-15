import { Hono } from 'hono';
import { authMiddleware, premiumOrAdmin } from '../middleware/auth';
import { UserPayload } from '../utils/auth';

type Bindings = {
  DB: D1Database;
};

const teams = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
teams.use('/*', authMiddleware);

// Get all teams user is member of + public teams
teams.get('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    // Get teams user is member of
    const myTeamsQuery = `
      SELECT t.*, u.username as owner_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
        tm.role as my_role
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ?
      ORDER BY t.created_at DESC
    `;
    const myTeamsResult = await c.env.DB.prepare(myTeamsQuery).bind(user.id).all();

    // Get all public teams (including teams user is already in)
    const publicTeamsQuery = `
      SELECT t.*, u.username as owner_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
        (SELECT status FROM team_applications WHERE team_id = t.id AND user_id = ? AND status = 'pending') as application_status,
        (SELECT 1 FROM team_members WHERE team_id = t.id AND user_id = ?) as is_member
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.is_public = 1 
      ORDER BY t.created_at DESC
    `;
    const publicTeamsResult = await c.env.DB.prepare(publicTeamsQuery).bind(user.id, user.id).all();

    return c.json({ 
      myTeams: myTeamsResult.results || [],
      publicTeams: publicTeamsResult.results || []
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single team with members
teams.get('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');

    // Check if user is a member
    const isMember = await c.env.DB.prepare(
      'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, user.id).first();

    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const teamQuery = `
      SELECT t.*, u.username as owner_name
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.id = ?
    `;
    const team = await c.env.DB.prepare(teamQuery).bind(teamId).first();

    if (!team) {
      return c.json({ error: 'Team not found' }, 404);
    }

    // Get members with team roles
    const membersQuery = `
      SELECT u.id, u.email, u.username, u.role as user_role, tm.role as team_role, tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `;
    const members = await c.env.DB.prepare(membersQuery).bind(teamId).all();

    return c.json({
      team,
      members: members.results || []
    });
  } catch (error) {
    console.error('Get team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create team (premium/admin only)
teams.post('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    
    // Check if user has premium or admin role
    if (user.role !== 'premium' && user.role !== 'admin') {
      return c.json({ error: 'Only premium users and admins can create teams' }, 403);
    }
    
    const { name, description, isPublic } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Team name is required' }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO teams (name, description, owner_id, is_public) VALUES (?, ?, ?, ?)'
    ).bind(name, description || null, user.id, isPublic ? 1 : 0).run();

    const teamId = result.meta.last_row_id;

    // Add creator as member with 'creator' role
    await c.env.DB.prepare(
      'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(teamId, user.id, 'creator').run();

    return c.json({
      id: teamId,
      message: 'Team created successfully'
    }, 201);
  } catch (error) {
    console.error('Create team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update team
teams.put('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const { name, description, isPublic } = await c.req.json();

    // Check if user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can update team' }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description), is_public = COALESCE(?, is_public), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name || null, description || null, isPublic !== undefined ? (isPublic ? 1 : 0) : null, teamId).run();

    return c.json({ message: 'Team updated successfully' });
  } catch (error) {
    console.error('Update team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete team
teams.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');

    // Check if user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can delete team' }, 403);
    }

    await c.env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(teamId).run();

    return c.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add member to team (by user_id or email)
teams.post('/:id/members', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const { user_id, email, role = 'viewer' } = await c.req.json();

    // Check if current user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can add members' }, 403);
    }

    // Find target user by ID or email
    let targetUser;
    if (user_id) {
      targetUser = await c.env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(user_id).first();
    } else if (email) {
      targetUser = await c.env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(email).first();
    } else {
      return c.json({ error: 'User ID or email is required' }, 400);
    }

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if user is already a member
    const existingMember = await c.env.DB.prepare(
      'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, targetUser.id).first();

    if (existingMember) {
      return c.json({ error: 'User is already a member of this team' }, 400);
    }

    // Validate role
    if (!['creator', 'viewer', 'operator'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be creator, viewer, or operator' }, 400);
    }
    
    await c.env.DB.prepare(
      'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(teamId, targetUser.id, role).run();

    return c.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update member role in team
teams.put('/:id/members/:userId/role', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const targetUserId = c.req.param('userId');
    const { role } = await c.req.json();

    // Validate role
    if (!['creator', 'viewer', 'operator'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be creator, viewer, or operator' }, 400);
    }

    // Check if current user is the owner (only owner can change roles)
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can change member roles' }, 403);
    }

    // Don't allow changing owner's own role
    if (targetUserId === user.id.toString()) {
      return c.json({ error: 'Cannot change your own role' }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?'
    ).bind(role, teamId, targetUserId).run();

    return c.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update member role error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove member from team
teams.delete('/:id/members/:userId', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const targetUserId = c.req.param('userId');

    // Check if current user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can remove members' }, 403);
    }

    await c.env.DB.prepare(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, targetUserId).run();

    return c.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Apply to join a public team
teams.post('/:id/apply', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const { message } = await c.req.json();

    // Check if team exists and is public
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND is_public = 1'
    ).bind(teamId).first();

    if (!team) {
      return c.json({ error: 'Team not found or not public' }, 404);
    }

    // Check if already a member
    const isMember = await c.env.DB.prepare(
      'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, user.id).first();

    if (isMember) {
      return c.json({ error: 'You are already a member of this team' }, 400);
    }

    // Check if there's a pending application
    const pendingApp = await c.env.DB.prepare(
      'SELECT 1 FROM team_applications WHERE team_id = ? AND user_id = ? AND status = ?'
    ).bind(teamId, user.id, 'pending').first();

    if (pendingApp) {
      return c.json({ error: 'You already have a pending application' }, 400);
    }

    // Create application
    await c.env.DB.prepare(
      'INSERT INTO team_applications (team_id, user_id, message, status) VALUES (?, ?, ?, ?)'
    ).bind(teamId, user.id, message || '', 'pending').run();

    return c.json({ message: 'Application submitted successfully' }, 201);
  } catch (error) {
    console.error('Apply to team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get pending applications for teams owned by user
teams.get('/applications/pending', async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    const query = `
      SELECT ta.*, u.username, u.email, t.name as team_name
      FROM team_applications ta
      JOIN users u ON ta.user_id = u.id
      JOIN teams t ON ta.team_id = t.id
      WHERE t.owner_id = ? AND ta.status = 'pending'
      ORDER BY ta.applied_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id).all();

    return c.json({ applications: result.results || [] });
  } catch (error) {
    console.error('Get applications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Review application (approve or reject)
teams.post('/:id/applications/:applicationId/review', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const applicationId = c.req.param('applicationId');
    const { action } = await c.req.json();

    if (!['approve', 'reject'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    // Check if user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can review applications' }, 403);
    }

    // Get application
    const application = await c.env.DB.prepare(
      'SELECT * FROM team_applications WHERE id = ? AND team_id = ? AND status = ?'
    ).bind(applicationId, teamId, 'pending').first();

    if (!application) {
      return c.json({ error: 'Application not found or already reviewed' }, 404);
    }

    // Update application status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await c.env.DB.prepare(
      'UPDATE team_applications SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newStatus, user.id, applicationId).run();

    // If approved, add user to team
    if (action === 'approve') {
      await c.env.DB.prepare(
        'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
      ).bind(teamId, application.user_id, 'viewer').run();
    }

    return c.json({ 
      message: action === 'approve' ? 'Application approved' : 'Application rejected' 
    });
  } catch (error) {
    console.error('Review application error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default teams;
