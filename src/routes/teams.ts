import { Hono } from 'hono';
import { authMiddleware, premiumOrAdmin } from '../middleware/auth';
import { UserPayload } from '../utils/auth';

type Bindings = {
  DB: D1Database;
};

const teams = new Hono<{ Bindings: Bindings }>();

// All routes require authentication and premium/admin access
teams.use('/*', authMiddleware, premiumOrAdmin);

// Get all teams user is member of
teams.get('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;

    const query = `
      SELECT t.*, u.username as owner_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.id IN (SELECT team_id FROM team_members WHERE user_id = ?)
      ORDER BY t.created_at DESC
    `;

    const result = await c.env.DB.prepare(query).bind(user.id).all();

    return c.json({ teams: result.results || [] });
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

// Create team
teams.post('/', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Team name is required' }, 400);
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO teams (name, description, owner_id) VALUES (?, ?, ?)'
    ).bind(name, description || null, user.id).run();

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
    const { name, description } = await c.req.json();

    // Check if user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can update team' }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name || null, description || null, teamId).run();

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

// Add member to team
teams.post('/:id/members', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const { user_id } = await c.req.json();

    // Check if current user is the owner
    const team = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can add members' }, 403);
    }

    // Check if target user exists
    const targetUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(user_id).first();

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Default role is 'viewer' for new members
    const { role = 'viewer' } = await c.req.json();
    
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(teamId, user_id, role).run();

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

export default teams;
