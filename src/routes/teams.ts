import { Hono } from 'hono';
import { authMiddleware, premiumOrAdmin } from '../middleware/auth';
import { UserPayload } from '../utils/auth';
import { sendEmail } from '../utils/email';

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
};

const teams = new Hono<{ Bindings: Bindings }>();

// Public endpoints (no auth required) must be defined before authMiddleware
// Verify team invitation token - public endpoint
teams.get('/invitations/verify/:token', async (c) => {
  try {
    const token = c.req.param('token');
    
    const invitation: any = await c.env.DB.prepare(`
      SELECT ti.*, t.name as team_name, t.description as team_description, 
             u.username as inviter_name
      FROM team_invitations ti
      JOIN teams t ON ti.team_id = t.id
      JOIN users u ON ti.inviter_id = u.id
      WHERE ti.token = ? AND ti.status = 'pending'
    `).bind(token).first();

    if (!invitation) {
      return c.json({ error: 'Invalid or expired invitation' }, 404);
    }

    // Check if invitation expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return c.json({ error: 'Invitation has expired' }, 400);
    }

    return c.json({
      team_id: invitation.team_id,
      team_name: invitation.team_name,
      team_description: invitation.team_description,
      invitee_email: invitation.invitee_email,
      role: invitation.role,
      inviter_name: invitation.inviter_name,
      expires_at: invitation.expires_at
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// All other routes require authentication
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

    // Delete related records first (those without ON DELETE CASCADE)
    // Delete team invitations
    await c.env.DB.prepare('DELETE FROM team_invitations WHERE team_id = ?').bind(teamId).run();
    
    // Delete team members (has ON DELETE CASCADE but delete explicitly for safety)
    await c.env.DB.prepare('DELETE FROM team_members WHERE team_id = ?').bind(teamId).run();
    
    // Delete team applications (has ON DELETE CASCADE)
    await c.env.DB.prepare('DELETE FROM team_applications WHERE team_id = ?').bind(teamId).run();
    
    // Finally delete the team (this will cascade delete reviews and other related data)
    await c.env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(teamId).run();

    return c.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper function to generate random token
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Add member to team (by user_id or email)
teams.post('/:id/members', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');
    const { user_id, email, role = 'viewer' } = await c.req.json();

    // Check if current user is the owner
    const team: any = await c.env.DB.prepare(
      'SELECT * FROM teams WHERE id = ? AND owner_id = ?'
    ).bind(teamId, user.id).first();

    if (!team) {
      return c.json({ error: 'Only owner can add members' }, 403);
    }

    // Validate role
    if (!['creator', 'viewer', 'operator'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be creator, viewer, or operator' }, 400);
    }

    // Find target user by ID or email
    let targetUser: any;
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

    // If user not found, create an invitation for non-member
    if (!targetUser) {
      // Create team invitation token
      const token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

      await c.env.DB.prepare(`
        INSERT INTO team_invitations (token, team_id, inviter_id, invitee_email, role, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(token, teamId, user.id, email, role, expiresAt.toISOString()).run();

      // Send invitation email for non-member
      const baseUrl = new URL(c.req.url).origin;
      const invitationUrl = `${baseUrl}/?team_invite=${token}`;

      try {
        await sendEmail(c.env.RESEND_API_KEY || '', {
          to: email,
          subject: `${user.username} invites you to join team "${team.name}" on Review System`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">🎉 You're Invited to Join a Team!</h2>
              <p>Hi there,</p>
              
              <p><strong>${user.username}</strong> has invited you to join the team <strong>"${team.name}"</strong> on Review System.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Team Information:</h3>
                <p><strong>Team Name:</strong> ${team.name}</p>
                <p><strong>Your Role:</strong> ${role}</p>
                ${team.description ? `<p><strong>Description:</strong> ${team.description}</p>` : ''}
                <p><strong>Invited By:</strong> ${user.username}</p>
              </div>

              <p>As a team member, you'll be able to:</p>
              <ul style="line-height: 1.8;">
                <li>Access team reviews and collaborate with other members</li>
                <li>Create and share reviews within the team</li>
                <li>Participate in team discussions</li>
              </ul>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation & Join
                </a>
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                This invitation link will expire in 30 days.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                If you don't have an account yet, you can register for free when you click the link above.
              </p>
            </div>
          `,
          text: `${user.username} invites you to join team "${team.name}" on Review System.\n\nYour role: ${role}\n\nAccept invitation: ${invitationUrl}\n\nThis link will expire in 30 days.`
        });
      } catch (emailError) {
        console.error('Failed to send team invitation email:', emailError);
      }

      return c.json({ 
        message: 'Invitation sent successfully',
        invitation_sent: true,
        email: email
      });
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

    // Send invitation email to the new member
    try {
      const baseUrl = new URL(c.req.url).origin;
      const teamUrl = `${baseUrl}/#teams`;
      
      await sendEmail(c.env.RESEND_API_KEY || '', {
        to: targetUser.email,
        subject: `You've been added to team "${team.name}" on Review System`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">🎉 Welcome to the Team!</h2>
            <p>Hi <strong>${targetUser.username}</strong>,</p>
            
            <p><strong>${user.username}</strong> has added you as a member of the team <strong>"${team.name}"</strong> on Review System.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Team Information:</h3>
              <p><strong>Team Name:</strong> ${team.name}</p>
              <p><strong>Your Role:</strong> ${role}</p>
              ${team.description ? `<p><strong>Description:</strong> ${team.description}</p>` : ''}
            </div>

            <p>You can now:</p>
            <ul style="line-height: 1.8;">
              <li>Access team reviews and collaborate with other members</li>
              <li>Create and share reviews within the team</li>
              <li>Participate in team discussions</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${teamUrl}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Team
              </a>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              If you have any questions, please contact us at support@ireviewsystem.com
            </p>
          </div>
        `,
        text: `Welcome to the Team!\\n\\n${user.username} has added you as a member of the team "${team.name}" on Review System.\\n\\nYour role: ${role}\\n\\nView your team: ${teamUrl}`
      });
      console.log(`✅ Team invitation email sent to ${targetUser.email}`);
    } catch (emailError) {
      console.error('Failed to send team invitation email:', emailError);
      // Don't fail the request if email fails
    }

    return c.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: errorMessage }, 500);
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

// Remove member from team (by team owner)
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

// Leave team (member can leave by themselves)
teams.post('/:id/leave', async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const teamId = c.req.param('id');

    // Check if user is a member of the team
    const membership: any = await c.env.DB.prepare(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, user.id).first();

    if (!membership) {
      return c.json({ error: 'You are not a member of this team' }, 404);
    }

    // Check if user is the team creator/owner
    const team: any = await c.env.DB.prepare(
      'SELECT owner_id FROM teams WHERE id = ?'
    ).bind(teamId).first();

    if (team && team.owner_id === user.id) {
      return c.json({ error: 'Team owner cannot leave the team. Please transfer ownership or delete the team.' }, 403);
    }

    // Remove user from team
    await c.env.DB.prepare(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, user.id).run();

    return c.json({ message: 'You have successfully left the team' });
  } catch (error) {
    console.error('Leave team error:', error);
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

// Accept team invitation (requires authentication)
teams.post('/invitations/accept/:token', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as UserPayload;
    const token = c.req.param('token');

    const invitation: any = await c.env.DB.prepare(`
      SELECT * FROM team_invitations
      WHERE token = ? AND status = 'pending'
    `).bind(token).first();

    if (!invitation) {
      return c.json({ error: 'Invalid or expired invitation' }, 404);
    }

    // Check if invitation expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return c.json({ error: 'Invitation has expired' }, 400);
    }

    // Check if user is already a member
    const existingMember = await c.env.DB.prepare(
      'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(invitation.team_id, user.id).first();

    if (existingMember) {
      return c.json({ error: 'You are already a member of this team' }, 400);
    }

    // Add user to team
    await c.env.DB.prepare(
      'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
    ).bind(invitation.team_id, user.id, invitation.role).run();

    // Update invitation status
    await c.env.DB.prepare(`
      UPDATE team_invitations 
      SET status = 'accepted', 
          accepted_at = datetime('now'), 
          accepted_by_user_id = ?
      WHERE id = ?
    `).bind(user.id, invitation.id).run();

    return c.json({ 
      message: 'Successfully joined the team',
      team_id: invitation.team_id,
      role: invitation.role
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default teams;
