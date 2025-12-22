import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import * as whatsapp from "./whatsapp.tsx";
import * as tasks from "./tasks.tsx";
import * as reports from "./reports.tsx";
import * as subscription from "./subscription.tsx";

const app = new Hono();

// Create Supabase client for auth
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify auth and extract user ID
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.split(' ')[1];
  
  if (!accessToken) {
    console.log('Authorization failed: No token provided');
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user?.id) {
    console.log('Authorization failed:', { 
      error: error?.message,
      hasUser: !!user,
      userId: user?.id 
    });
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  console.log('User authenticated:', { userId: user.id, email: user.email });
  c.set('userId', user.id);
  c.set('userEmail', user.email);
  await next();
};

// Health check endpoint
app.get("/make-server-a2294ced/health", (c) => {
  return c.json({ status: "ok" });
});

// ============= AUTH ROUTES =============

// Sign up
app.post("/make-server-a2294ced/auth/signup", async (c) => {
  try {
    const { name, phoneOrEmail, password, role = 'user', inviteCode } = await c.req.json();

    console.log('📝 Signup request:', { name, phoneOrEmail, role, inviteCode });

    if (!name || !phoneOrEmail || !password) {
      console.log('❌ Missing required fields');
      return c.json({ error: 'Name, phone/email, and password are required' }, 400);
    }

    // Password strength validation
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    const supabase = getSupabaseClient();
    
    // Check if invite code is valid and get invitation details
    let inviteData = null;
    let adminTeamId = null;
    if (inviteCode) {
      inviteData = await kv.get(`invite:${inviteCode}`);
      if (!inviteData) {
        return c.json({ error: 'Invalid or expired invitation code' }, 400);
      }
      
      // Check if invite is expired (7 days)
      const expiresAt = new Date(inviteData.expiresAt);
      if (expiresAt < new Date()) {
        return c.json({ error: 'Invitation code has expired' }, 400);
      }
      
      // Get the admin who sent the invite to assign to their team
      adminTeamId = inviteData.teamId;
      console.log('✅ Valid invite code - joining team:', adminTeamId);
    }
    
    // Create a unique email from phone number if phone is provided
    // Format: +1234567890 becomes 1234567890@pocket.internal
    const isPhone = phoneOrEmail.startsWith('+');
    const email = isPhone ? `${phoneOrEmail.replace(/\+/g, '')}@pocket.internal` : phoneOrEmail;
    const phone = isPhone ? phoneOrEmail : undefined;
    
    // Check if user already exists
    console.log('Checking if user already exists with email:', email);
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u: any) => u.email === email);
    
    if (existingUser) {
      console.log('❌ User already exists with this phone/email:', email);
      
      // Check if they have a profile already
      const existingProfile = await kv.get(`users:profile:${existingUser.id}`);
      
      if (existingProfile) {
        return c.json({ 
          error: 'This phone number is already registered. Please go to the login page instead.',
          userExists: true
        }, 400);
      } else {
        // User exists in auth but no profile - this shouldn't happen, but let's handle it
        console.log('⚠️ User exists in auth but no profile - creating profile...');
        const userId = existingUser.id;
        const teamId = adminTeamId || `team-${userId.substring(0, 8)}`;
        
        const userProfile = {
          id: userId,
          name,
          email,
          phone,
          role,
          teamId,
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(`users:profile:${userId}`, userProfile);
        
        if (adminTeamId) {
          const team = await kv.get(`team:${adminTeamId}`);
          if (team && !team.members.includes(userId)) {
            team.members.push(userId);
            await kv.set(`team:${adminTeamId}`, team);
          }
          
          // Mark invite as used
          if (inviteCode && inviteData) {
            inviteData.used = true;
            inviteData.usedBy = userId;
            inviteData.usedAt = new Date().toISOString();
            await kv.set(`invite:${inviteCode}`, inviteData);
          }
        }
        
        console.log('✅ Profile created for existing auth user');
        return c.json({ user: userProfile, userId });
      }
    }
    
    // Create auth user
    console.log('Creating new Supabase auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name, phone }
    });

    if (authError) {
      console.log('❌ Signup auth error:', authError);
      // Handle duplicate email error
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return c.json({ 
          error: 'This phone number is already registered. Please use the login page instead.',
          userExists: true  
        }, 400);
      }
      return c.json({ error: `Signup failed: ${authError.message}` }, 400);
    }

    console.log('✅ Auth user created:', authData.user.id);

    const userId = authData.user.id;
    // If invited, join admin's team, otherwise create own team
    const teamId = adminTeamId || `team-${userId.substring(0, 8)}`;

    // Create user profile
    const userProfile = {
      id: userId,
      name,
      email,
      phone,
      role,
      teamId,
      status: 'Active', // Default status
      createdAt: new Date().toISOString(),
    };

    console.log('Saving user profile to KV store...');
    await kv.set(`users:profile:${userId}`, userProfile);

    // Create team if admin and not invited
    if (role === 'admin' && !inviteCode) {
      console.log('Creating team for admin user...');
      await kv.set(`team:${teamId}`, {
        id: teamId,
        name: `${name}'s Team`,
        adminId: userId,
        members: [userId],
        createdAt: new Date().toISOString(),
      });
    } else if (inviteCode && adminTeamId) {
      // Add user to existing team
      console.log('Adding user to existing team:', adminTeamId);
      const team = await kv.get(`team:${adminTeamId}`);
      if (team) {
        team.members = [...(team.members || []), userId];
        await kv.set(`team:${adminTeamId}`, team);
      }
      
      // Mark invite as used
      inviteData.used = true;
      inviteData.usedBy = userId;
      inviteData.usedAt = new Date().toISOString();
      await kv.set(`invite:${inviteCode}`, inviteData);
      console.log('✅ User added to team and invite marked as used');
    }

    console.log('✅ Signup completed successfully for:', phoneOrEmail);
    return c.json({ user: userProfile, userId });
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// Request password reset
app.post("/make-server-a2294ced/auth/reset-password", async (c) => {
  try {
    const { email } = await c.req.json();

    console.log('🔑 Password reset request for:', email);

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const supabase = getSupabaseClient();
    
    // Generate a password reset token (valid for 1 hour)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

    // Store reset token
    await kv.set(`password-reset:${resetToken}`, {
      email,
      expiresAt,
      used: false,
    });

    console.log('✅ Password reset token generated:', resetToken);

    // In production, you would send this via email
    // For now, we'll return it in the response
    // IMPORTANT: User should be informed that email server needs to be configured
    return c.json({ 
      success: true,
      message: 'Password reset instructions have been generated. In production, this would be sent via email.',
      resetToken, // Remove this in production
      resetUrl: `${c.req.url.split('/auth/reset-password')[0]}/reset?token=${resetToken}`
    });
  } catch (error: any) {
    console.error('�� Password reset error:', error);
    return c.json({ error: `Password reset failed: ${error.message}` }, 500);
  }
});

// Verify reset token
app.post("/make-server-a2294ced/auth/verify-reset-token", async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token) {
      return c.json({ error: 'Reset token is required' }, 400);
    }

    const resetData = await kv.get(`password-reset:${token}`);

    if (!resetData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    if (resetData.used) {
      return c.json({ error: 'This reset token has already been used' }, 400);
    }

    if (new Date(resetData.expiresAt) < new Date()) {
      await kv.del(`password-reset:${token}`);
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    return c.json({ valid: true, email: resetData.email });
  } catch (error: any) {
    console.error('❌ Verify reset token error:', error);
    return c.json({ error: `Verification failed: ${error.message}` }, 500);
  }
});

// Update password with reset token
app.post("/make-server-a2294ced/auth/update-password", async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    const resetData = await kv.get(`password-reset:${token}`);

    if (!resetData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    if (resetData.used) {
      return c.json({ error: 'This reset token has already been used' }, 400);
    }

    if (new Date(resetData.expiresAt) < new Date()) {
      await kv.del(`password-reset:${token}`);
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    const supabase = getSupabaseClient();

    // Get user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error listing users:', getUserError);
      return c.json({ error: 'Failed to find user' }, 500);
    }

    const user = users.users.find((u: any) => u.email === resetData.email);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return c.json({ error: `Failed to update password: ${updateError.message}` }, 500);
    }

    // Mark token as used
    await kv.set(`password-reset:${token}`, {
      ...resetData,
      used: true,
    });

    console.log('✅ Password updated successfully for:', resetData.email);

    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('❌ Update password error:', error);
    return c.json({ error: `Password update failed: ${error.message}` }, 500);
  }
});

// Get user profile
app.get("/make-server-a2294ced/auth/profile", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');
    let profile = await kv.get(`users:profile:${userId}`);

    // Auto-create profile for OAuth users (Google, etc.)
    if (!profile) {
      console.log('⚠️ Profile not found for user:', userId, '- Auto-creating profile for OAuth user');
      
      const supabase = getSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      
      const teamId = `team-${userId.substring(0, 8)}`;
      
      profile = {
        id: userId,
        name: authUser?.user_metadata?.name || authUser?.user_metadata?.full_name || userEmail?.split('@')[0] || 'User',
        email: userEmail || authUser?.email,
        role: 'admin', // Default to admin for self-signup
        teamId,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      // Save profile
      await kv.set(`users:profile:${userId}`, profile);

      // Create team
      await kv.set(`team:${teamId}`, {
        id: teamId,
        name: `${profile.name}'s Team`,
        adminId: userId,
        members: [userId],
        createdAt: new Date().toISOString(),
      });

      console.log('✅ Auto-created profile for OAuth user:', profile.name);
    }

    return c.json({ user: profile });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return c.json({ error: `Failed to get profile: ${error.message}` }, 500);
  }
});

// Update user profile
app.put("/make-server-a2294ced/auth/profile", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const updates = await c.req.json();

    const profile = await kv.get(`users:profile:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      id: userId, // Prevent ID change
      email: profile.email, // Prevent email change
    };

    await kv.set(`users:profile:${userId}`, updatedProfile);

    return c.json({ user: updatedProfile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return c.json({ error: `Failed to update profile: ${error.message}` }, 500);
  }
});

// ============= USER MANAGEMENT ROUTES =============

// Get all users in team (admin only)
app.get("/make-server-a2294ced/users", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const currentUser = await kv.get(`users:profile:${userId}`);

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get all users with the same teamId
    const allProfiles = await kv.getByPrefix('users:profile:');
    const teamUsers = allProfiles.filter((profile: any) => profile.teamId === currentUser.teamId);

    return c.json({ users: teamUsers });
  } catch (error: any) {
    console.error('Get users error:', error);
    return c.json({ error: `Failed to get users: ${error.message}` }, 500);
  }
});

// Get team members count (public - for subscription)
app.get("/make-server-a2294ced/team/members", async (c) => {
  try {
    const teamId = c.req.query('teamId');
    
    if (!teamId) {
      return c.json({ error: 'Team ID required' }, 400);
    }

    // Get all users with the same teamId
    const allProfiles = await kv.getByPrefix('users:profile:');
    const teamUsers = allProfiles.filter((profile: any) => profile.teamId === teamId);

    return c.json(teamUsers);
  } catch (error: any) {
    console.error('Get team members error:', error);
    return c.json({ error: `Failed to get team members: ${error.message}` }, 500);
  }
});

// Add user to team (admin only)
app.post("/make-server-a2294ced/users", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, phone, password, role = 'user' } = await c.req.json();

    const currentUser = await kv.get(`users:profile:${userId}`);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    // Check if phone number is already registered
    const existingUser = await kv.get(`users:phone:${phone}`);
    if (existingUser) {
      return c.json({ error: 'This phone number is already registered' }, 400);
    }

    const supabase = getSupabaseClient();
    
    // Create auth user with phone as email (phone@pocketcrm.local)
    const syntheticEmail = `${phone.replace(/\+/g, '')}@pocketcrm.local`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (authError) {
      return c.json({ error: `Failed to create user: ${authError.message}` }, 400);
    }

    const newUserId = authData.user.id;

    // Create user profile with same team as admin
    const userProfile = {
      id: newUserId,
      name,
      phone,
      email: syntheticEmail,
      role,
      teamId: currentUser.teamId,
      status: 'Active', // Default status
      createdAt: new Date().toISOString(),
    };

    await kv.set(`users:profile:${newUserId}`, userProfile);
    await kv.set(`users:phone:${phone}`, newUserId);

    // Update team members
    const team = await kv.get(`team:${currentUser.teamId}`);
    if (team) {
      team.members.push(newUserId);
      await kv.set(`team:${currentUser.teamId}`, team);
    }

    return c.json({ user: userProfile });
  } catch (error: any) {
    console.error('Add user error:', error);
    return c.json({ error: `Failed to add user: ${error.message}` }, 500);
  }
});

// Delete user (admin only)
app.delete("/make-server-a2294ced/users/:targetUserId", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.param('targetUserId');

    const currentUser = await kv.get(`users:profile:${userId}`);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    if (userId === targetUserId) {
      return c.json({ error: 'Cannot delete yourself' }, 400);
    }

    // Delete user profile
    await kv.del(`users:profile:${targetUserId}`);

    // Delete all user data
    await kv.mdel([
      `aftersales:${targetUserId}`,
      `competitor:${targetUserId}`,
      `debt:${targetUserId}`,
      `sales:${targetUserId}`,
      `kpi:${targetUserId}`,
    ]);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return c.json({ error: `Failed to delete user: ${error.message}` }, 500);
  }
});

// ============= AFTER SALES ROUTES =============

// Get after sales records
app.get("/make-server-a2294ced/aftersales", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' data (admin only)
    if (fetchAll) {
      const user = await kv.get(`users:profile:${userId}`).catch(() => null);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 403);
      }

      console.log('Fetching all after sales records for all users (admin request)');
      const allUserProfiles = await kv.getByPrefix('users:profile:').catch(() => []);
      let allRecords: any[] = [];
      
      for (const u of allUserProfiles) {
        try {
          const userRecords = await kv.get(`aftersales:${u.id}`).catch(() => []) || [];
          const recordsWithUser = userRecords.map((r: any) => ({
            ...r,
            _userId: u.id,
            _userName: u.name,
            _userEmail: u.email,
          }));
          allRecords = [...allRecords, ...recordsWithUser];
        } catch (err) {
          console.error(`Error fetching after-sales for user ${u.id}:`, err);
          // Continue with other users
        }
      }
      
      console.log('All after sales records fetched:', allRecords.length, 'records from', allUserProfiles.length, 'users');
      return c.json({ records: allRecords });
    }

    // Regular single-user fetch
    const finalUserId = targetUserId || userId;
    console.log('🔍 AFTER SALES - Fetching records:', { 
      currentUserId: userId, 
      targetUserId, 
      finalUserId,
      kvKey: `aftersales:${finalUserId}`
    });
    const records = await kv.get(`aftersales:${finalUserId}`).catch(() => []) || [];
    // Add _userId to each record for consistency
    const recordsWithUserId = records.map((r: any) => ({
      ...r,
      _userId: finalUserId,
    }));
    console.log('✅ AFTER SALES - Records fetched:', {
      count: recordsWithUserId.length,
      finalUserId,
      sampleRecord: recordsWithUserId[0] ? { id: recordsWithUserId[0].id, customer: recordsWithUserId[0].customer } : null
    });
    return c.json({ records: recordsWithUserId });
  } catch (error: any) {
    console.error('Get after sales error:', error);
    // Return empty records instead of 500 error
    return c.json({ records: [] });
  }
});

// Create after sales record
app.post("/make-server-a2294ced/aftersales", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    
    console.log('Creating after sales record for user:', targetUserId);
    
    const record = await c.req.json();
    console.log('Received record data:', JSON.stringify(record, null, 2));

    const records = await kv.get(`aftersales:${targetUserId}`) || [];
    console.log('Current records count:', records.length);
    
    const newRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    console.log('Saving records, new count:', records.length);
    
    await kv.set(`aftersales:${targetUserId}`, records);
    console.log('Records saved successfully');

    // Log activity
    try {
      await logActivity(targetUserId, 'After Sales', 'Added new customer', `${record.customer}`, 'low');
      console.log('Activity logged successfully');
    } catch (activityError: any) {
      console.error('Failed to log activity (non-fatal):', activityError.message);
    }

    console.log('Returning new record with id:', newRecord.id);
    return c.json({ record: newRecord });
  } catch (error: any) {
    console.error('Create after sales error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return c.json({ error: `Failed to create record: ${error.message}` }, 500);
  }
});

// Update after sales record
app.put("/make-server-a2294ced/aftersales/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();

    console.log('🔄 Updating after-sales record:', {
      id,
      userId,
      targetUserId,
      key: `aftersales:${targetUserId}`
    });

    const records = await kv.get(`aftersales:${targetUserId}`) || [];
    console.log('📦 Found records:', records.length, 'Record IDs:', records.map((r: any) => r.id));
    
    const index = records.findIndex((r: any) => r.id === id);
    console.log('🔍 Record index:', index, 'Looking for ID:', id);

    if (index === -1) {
      console.error('❌ Record not found. Available IDs:', records.map((r: any) => r.id));
      return c.json({ error: 'Record not found' }, 404);
    }

    records[index] = {
      ...records[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`aftersales:${targetUserId}`, records);

    // Log activity
    await logActivity(targetUserId, 'After Sales', 'Updated customer', `${updates.customer || records[index].customer}`, 'low');

    return c.json({ record: records[index] });
  } catch (error: any) {
    console.error('Update after sales error:', error);
    return c.json({ error: `Failed to update record: ${error.message}` }, 500);
  }
});

// Delete after sales record
app.delete("/make-server-a2294ced/aftersales/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));

    console.log('🗑️ Deleting after-sales record:', {
      id,
      userId,
      targetUserId,
      key: `aftersales:${targetUserId}`
    });

    const records = await kv.get(`aftersales:${targetUserId}`) || [];
    console.log('📦 Found records:', records.length);
    
    const filteredRecords = records.filter((r: any) => r.id !== id);

    if (records.length === filteredRecords.length) {
      console.error('❌ Record not found');
      return c.json({ error: 'Record not found' }, 404);
    }
    
    console.log('✅ Record deleted, remaining:', filteredRecords.length);

    await kv.set(`aftersales:${targetUserId}`, filteredRecords);

    // Log activity
    await logActivity(targetUserId, 'After Sales', 'Deleted customer', `Record #${id}`, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete after sales error:', error);
    return c.json({ error: `Failed to delete record: ${error.message}` }, 500);
  }
});

// ============= COMPETITOR INFORMATION ROUTES =============

// Get competitor information records
app.get("/make-server-a2294ced/competitor", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' data (admin only)
    if (fetchAll) {
      const user = await kv.get(`users:profile:${userId}`).catch(() => null);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 403);
      }

      const allUserProfiles = await kv.getByPrefix('users:profile:').catch(() => []);
      let allRecords: any[] = [];
      
      for (const u of allUserProfiles) {
        try {
          const userRecords = await kv.get(`competitor:${u.id}`).catch(() => []) || [];
          const recordsWithUser = userRecords.map((r: any) => ({
            ...r,
            _userId: u.id,
            _userName: u.name,
            _userEmail: u.email,
          }));
          allRecords = [...allRecords, ...recordsWithUser];
        } catch (err) {
          console.error(`Error fetching competitors for user ${u.id}:`, err);
        }
      }
      
      return c.json({ records: allRecords });
    }

    const finalUserId = targetUserId || userId;
    const records = await kv.get(`competitor:${finalUserId}`).catch(() => []) || [];
    // Add _userId to each record for consistency
    const recordsWithUserId = records.map((r: any) => ({
      ...r,
      _userId: finalUserId,
    }));
    return c.json({ records: recordsWithUserId });
  } catch (error: any) {
    console.error('Get competitor information error:', error);
    return c.json({ records: [] });
  }
});

// Create competitor information record
app.post("/make-server-a2294ced/competitor", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const record = await c.req.json();

    const records = await kv.get(`competitor:${targetUserId}`) || [];
    const newRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    await kv.set(`competitor:${targetUserId}`, records);

    // Log activity
    const itemName = record.type === 'product' ? record.productName : record.competitor;
    await logActivity(targetUserId, 'Competitor Information', `Added ${record.type || 'competitor'}`, itemName || 'New entry', 'medium');

    return c.json({ record: newRecord });
  } catch (error: any) {
    console.error('Create competitor error:', error);
    return c.json({ error: `Failed to create record: ${error.message}` }, 500);
  }
});

// Update competitor information record
app.put("/make-server-a2294ced/competitor/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();

    const records = await kv.get(`competitor:${targetUserId}`) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return c.json({ error: 'Record not found' }, 404);
    }

    records[index] = {
      ...records[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`competitor:${targetUserId}`, records);

    // Log activity
    const itemName = records[index].type === 'product' 
      ? (updates.productName || records[index].productName)
      : (updates.competitor || records[index].competitor);
    await logActivity(targetUserId, 'Competitor Information', `Updated ${records[index].type || 'competitor'}`, itemName || 'Entry', 'low');

    return c.json({ record: records[index] });
  } catch (error: any) {
    console.error('Update competitor error:', error);
    return c.json({ error: `Failed to update record: ${error.message}` }, 500);
  }
});

// Delete competitor information record
app.delete("/make-server-a2294ced/competitor/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));

    const records = await kv.get(`competitor:${targetUserId}`) || [];
    const filteredRecords = records.filter((r: any) => r.id !== id);

    if (records.length === filteredRecords.length) {
      return c.json({ error: 'Record not found' }, 404);
    }

    await kv.set(`competitor:${targetUserId}`, filteredRecords);

    // Log activity
    await logActivity(targetUserId, 'Competitor Intel', 'Deleted competitor', `Record #${id}`, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete competitor error:', error);
    return c.json({ error: `Failed to delete record: ${error.message}` }, 500);
  }
});

// ============= MY PRODUCTS ROUTES =============

// Get my products
app.get("/make-server-a2294ced/myproducts", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' data (admin only)
    if (fetchAll) {
      const user = await kv.get(`users:profile:${userId}`);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 403);
      }

      const allUserProfiles = await kv.getByPrefix('users:profile:');
      let allRecords: any[] = [];
      
      for (const u of allUserProfiles) {
        const userRecords = await kv.get(`myproducts:${u.id}`) || [];
        const recordsWithUser = userRecords.map((r: any) => ({
          ...r,
          _userId: u.id,
          _userName: u.name,
          _userEmail: u.email,
        }));
        allRecords = [...allRecords, ...recordsWithUser];
      }
      
      return c.json({ records: allRecords });
    }

    const finalUserId = targetUserId || userId;
    const records = await kv.get(`myproducts:${finalUserId}`) || [];
    // Add _userId to each record for consistency
    const recordsWithUserId = records.map((r: any) => ({
      ...r,
      _userId: finalUserId,
    }));
    return c.json({ records: recordsWithUserId });
  } catch (error: any) {
    console.error('Get my products error:', error);
    return c.json({ error: `Failed to get records: ${error.message}` }, 500);
  }
});

// Create my product
app.post("/make-server-a2294ced/myproducts", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const record = await c.req.json();

    const records = await kv.get(`myproducts:${targetUserId}`) || [];
    const newRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    await kv.set(`myproducts:${targetUserId}`, records);

    // Log activity
    await logActivity(targetUserId, 'Competitor Information', 'Added my product', newRecord.productName || 'New product', 'medium');

    return c.json({ record: newRecord });
  } catch (error: any) {
    console.error('Create my product error:', error);
    return c.json({ error: `Failed to create record: ${error.message}` }, 500);
  }
});

// Update my product
app.put("/make-server-a2294ced/myproducts/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();

    const records = await kv.get(`myproducts:${targetUserId}`) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return c.json({ error: 'Record not found' }, 404);
    }

    records[index] = {
      ...records[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`myproducts:${targetUserId}`, records);

    // Log activity
    await logActivity(targetUserId, 'Competitor Information', 'Updated my product', updates.productName || records[index].productName, 'low');

    return c.json({ record: records[index] });
  } catch (error: any) {
    console.error('Update my product error:', error);
    return c.json({ error: `Failed to update record: ${error.message}` }, 500);
  }
});

// Delete my product
app.delete("/make-server-a2294ced/myproducts/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));

    const records = await kv.get(`myproducts:${targetUserId}`) || [];
    const filteredRecords = records.filter((r: any) => r.id !== id);

    if (records.length === filteredRecords.length) {
      return c.json({ error: 'Record not found' }, 404);
    }

    await kv.set(`myproducts:${targetUserId}`, filteredRecords);

    // Log activity
    await logActivity(targetUserId, 'Competitor Information', 'Deleted my product', `Record #${id}`, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete my product error:', error);
    return c.json({ error: `Failed to delete record: ${error.message}` }, 500);
  }
});

// ============= DEBT COLLECTION ROUTES =============

// Get debt collection records
app.get("/make-server-a2294ced/debt", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' data (admin only)
    if (fetchAll) {
      const user = await kv.get(`users:profile:${userId}`).catch(() => null);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 403);
      }

      const allUserProfiles = await kv.getByPrefix('users:profile:').catch(() => []);
      let allRecords: any[] = [];
      
      for (const u of allUserProfiles) {
        try {
          const userRecords = await kv.get(`debt:${u.id}`).catch(() => []) || [];
          const recordsWithUser = userRecords.map((r: any) => ({
            ...r,
            _userId: u.id,
            _userName: u.name,
            _userEmail: u.email,
          }));
          allRecords = [...allRecords, ...recordsWithUser];
        } catch (err) {
          console.error(`Error fetching debt for user ${u.id}:`, err);
        }
      }
      
      return c.json({ records: allRecords });
    }

    const finalUserId = targetUserId || userId;
    const records = await kv.get(`debt:${finalUserId}`).catch(() => []) || [];
    // Add _userId to each record for consistency
    const recordsWithUserId = records.map((r: any) => ({
      ...r,
      _userId: finalUserId,
    }));
    return c.json({ records: recordsWithUserId });
  } catch (error: any) {
    console.error('Get debt records error:', error);
    return c.json({ records: [] });
  }
});

// Create debt collection record
app.post("/make-server-a2294ced/debt", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const record = await c.req.json();

    const records = await kv.get(`debt:${targetUserId}`) || [];
    const newRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    await kv.set(`debt:${targetUserId}`, records);

    // Log activity based on priority
    const priority = record.daysOverdue > 60 ? 'critical' : record.daysOverdue > 30 ? 'high' : 'medium';
    await logActivity(targetUserId, 'Debt Collection', 'Added pending payment', `${record.customer} - $${record.amount}`, priority);

    return c.json({ record: newRecord });
  } catch (error: any) {
    console.error('Create debt record error:', error);
    return c.json({ error: `Failed to create record: ${error.message}` }, 500);
  }
});

// Update debt collection record
app.put("/make-server-a2294ced/debt/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();

    const records = await kv.get(`debt:${targetUserId}`) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return c.json({ error: 'Record not found' }, 404);
    }

    records[index] = {
      ...records[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`debt:${targetUserId}`, records);

    // Log activity
    await logActivity(targetUserId, 'Debt Collection', 'Updated payment', `${updates.customer || records[index].customer}`, 'medium');

    return c.json({ record: records[index] });
  } catch (error: any) {
    console.error('Update debt record error:', error);
    return c.json({ error: `Failed to update record: ${error.message}` }, 500);
  }
});

// Delete debt collection record
app.delete("/make-server-a2294ced/debt/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));

    const records = await kv.get(`debt:${targetUserId}`) || [];
    const filteredRecords = records.filter((r: any) => r.id !== id);

    if (records.length === filteredRecords.length) {
      return c.json({ error: 'Record not found' }, 404);
    }

    await kv.set(`debt:${targetUserId}`, filteredRecords);

    // Log activity
    await logActivity(targetUserId, 'Debt Collection', 'Resolved payment', `Record #${id}`, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete debt record error:', error);
    return c.json({ error: `Failed to delete record: ${error.message}` }, 500);
  }
});

// ============= SALES STRATEGIES ROUTES =============

// Get sales strategies records
app.get("/make-server-a2294ced/sales", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' data (admin only)
    if (fetchAll) {
      try {
        const user = await kv.get(`users:profile:${userId}`).catch(() => null);
        if (!user || user.role !== 'admin') {
          return c.json({ error: 'Unauthorized - Admin access required' }, 403);
        }

        const allUserProfiles = await kv.getByPrefix('users:profile:').catch(() => []);
        let allRecords: any[] = [];
        
        for (const u of allUserProfiles) {
          try {
            const userRecords = await kv.get(`sales:${u.id}`).catch(() => []) || [];
            const recordsWithUser = userRecords.map((r: any) => ({
              ...r,
              _userId: u.id,
              _userName: u.name,
              _userEmail: u.email,
            }));
            allRecords = [...allRecords, ...recordsWithUser];
          } catch (err) {
            console.error(`Error fetching sales for user ${u.id}:`, err);
            // Continue with other users
          }
        }
        
        return c.json({ records: allRecords });
      } catch (err) {
        console.error('Error in fetchAll mode:', err);
        return c.json({ records: [] });
      }
    }

    const finalUserId = targetUserId || userId;
    try {
      const records = await kv.get(`sales:${finalUserId}`).catch(() => []) || [];
      // Add _userId to each record for consistency
      const recordsWithUserId = records.map((r: any) => ({
        ...r,
        _userId: finalUserId,
      }));
      return c.json({ records: recordsWithUserId });
    } catch (kvError) {
      console.error(`KV store error for sales:${finalUserId}:`, kvError);
      return c.json({ records: [] });
    }
  } catch (error: any) {
    console.error('Get sales strategies error:', error);
    // Return empty records instead of 500 error to keep app working
    return c.json({ records: [] });
  }
});

// Create sales strategy record
app.post("/make-server-a2294ced/sales", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const record = await c.req.json();

    const records = await kv.get(`sales:${targetUserId}`) || [];
    const newRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    await kv.set(`sales:${targetUserId}`, records);

    // Log activity
    const strategyType = record.type === 'marketing' ? 'Marketing Strategy' : 'Sales Strategy';
    await logActivity(targetUserId, strategyType, 'Added new strategy', `${record.title || 'New strategy'}`, 'medium');

    return c.json({ record: newRecord });
  } catch (error: any) {
    console.error('Create sales strategy error:', error);
    return c.json({ error: `Failed to create record: ${error.message}` }, 500);
  }
});

// Update sales strategy record
app.put("/make-server-a2294ced/sales/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();

    const records = await kv.get(`sales:${targetUserId}`) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return c.json({ error: 'Record not found' }, 404);
    }

    records[index] = {
      ...records[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`sales:${targetUserId}`, records);

    // Log activity
    const strategyType = records[index].type === 'marketing' ? 'Marketing Strategy' : 'Sales Strategy';
    await logActivity(targetUserId, strategyType, 'Updated strategy', `${updates.title || records[index].title}`, 'low');

    return c.json({ record: records[index] });
  } catch (error: any) {
    console.error('Update sales strategy error:', error);
    return c.json({ error: `Failed to update record: ${error.message}` }, 500);
  }
});

// Delete sales strategy record
app.delete("/make-server-a2294ced/sales/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));

    const records = await kv.get(`sales:${targetUserId}`) || [];
    const filteredRecords = records.filter((r: any) => r.id !== id);

    if (records.length === filteredRecords.length) {
      return c.json({ error: 'Record not found' }, 404);
    }

    await kv.set(`sales:${targetUserId}`, filteredRecords);

    // Log activity
    const deletedRecord = records.find((r: any) => r.id === id);
    const strategyType = deletedRecord?.type === 'marketing' ? 'Marketing Strategy' : 'Sales Strategy';
    await logActivity(targetUserId, strategyType, 'Deleted strategy', `${deletedRecord?.title || 'Record #' + id}`, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete sales strategy error:', error);
    return c.json({ error: `Failed to delete record: ${error.message}` }, 500);
  }
});

// ============= KPI TRACKING ROUTES =============

// Get KPI tracking records
app.get("/make-server-a2294ced/kpi", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' data (admin only)
    if (fetchAll) {
      const user = await kv.get(`users:profile:${userId}`).catch(() => null);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 403);
      }

      const allUserProfiles = await kv.getByPrefix('users:profile:').catch(() => []);
      let allRecords: any[] = [];
      
      for (const u of allUserProfiles) {
        try {
          const userRecords = await kv.get(`kpi:${u.id}`).catch(() => []) || [];
          const recordsWithUser = userRecords.map((r: any) => ({
            ...r,
            _userId: u.id,
            _userName: u.name,
            _userEmail: u.email,
          }));
          allRecords = [...allRecords, ...recordsWithUser];
        } catch (err) {
          console.error(`Error fetching KPI for user ${u.id}:`, err);
        }
      }
      
      return c.json({ records: allRecords });
    }

    const finalUserId = targetUserId || userId;
    const records = await kv.get(`kpi:${finalUserId}`).catch(() => []) || [];
    // Add _userId to each record for consistency
    const recordsWithUserId = records.map((r: any) => ({
      ...r,
      _userId: finalUserId,
    }));
    return c.json({ records: recordsWithUserId });
  } catch (error: any) {
    console.error('Get KPI records error:', error);
    return c.json({ records: [] });
  }
});

// Create KPI tracking record
app.post("/make-server-a2294ced/kpi", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const record = await c.req.json();

    const records = await kv.get(`kpi:${targetUserId}`) || [];
    const newRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    await kv.set(`kpi:${targetUserId}`, records);

    // Log activity
    await logActivity(targetUserId, 'KPI Tracking', 'Added KPI metric', `${record.name || record.metric || 'New KPI'}`, 'low');

    return c.json({ record: newRecord });
  } catch (error: any) {
    console.error('Create KPI record error:', error);
    return c.json({ error: `Failed to create record: ${error.message}` }, 500);
  }
});

// Update KPI tracking record
app.put("/make-server-a2294ced/kpi/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();

    const records = await kv.get(`kpi:${targetUserId}`) || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return c.json({ error: 'Record not found' }, 404);
    }

    records[index] = {
      ...records[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`kpi:${targetUserId}`, records);

    // Log activity
    await logActivity(targetUserId, 'KPI Tracking', 'Updated KPI metric', `${updates.name || updates.metric || records[index].name || records[index].metric || 'KPI'}`, 'low');

    return c.json({ record: records[index] });
  } catch (error: any) {
    console.error('Update KPI record error:', error);
    return c.json({ error: `Failed to update record: ${error.message}` }, 500);
  }
});

// Delete KPI tracking record
app.delete("/make-server-a2294ced/kpi/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = parseInt(c.req.param('id'));

    const records = await kv.get(`kpi:${targetUserId}`) || [];
    const filteredRecords = records.filter((r: any) => r.id !== id);

    if (records.length === filteredRecords.length) {
      return c.json({ error: 'Record not found' }, 404);
    }

    await kv.set(`kpi:${targetUserId}`, filteredRecords);

    // Log activity
    await logActivity(targetUserId, 'KPI Tracking', 'Deleted KPI metric', `Record #${id}`, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete KPI record error:', error);
    return c.json({ error: `Failed to delete record: ${error.message}` }, 500);
  }
});

// ============= INTEGRATIONS ROUTES =============

// Get integrations
app.get("/make-server-a2294ced/integrations", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;

    const integrations = await kv.get(`integrations:${targetUserId}`) || [];
    return c.json({ integrations });
  } catch (error: any) {
    console.error('Get integrations error:', error);
    return c.json({ error: `Failed to get integrations: ${error.message}` }, 500);
  }
});

// Create integration
app.post("/make-server-a2294ced/integrations", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const integration = await c.req.json();

    const integrations = await kv.get(`integrations:${targetUserId}`) || [];
    const newIntegration = {
      ...integration,
      id: integration.id || `int-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    integrations.push(newIntegration);
    await kv.set(`integrations:${targetUserId}`, integrations);

    // Log activity
    await logActivity(targetUserId, 'Integration', 'Connected integration', `${integration.name}`, 'medium');

    return c.json({ integration: newIntegration });
  } catch (error: any) {
    console.error('Create integration error:', error);
    return c.json({ error: `Failed to create integration: ${error.message}` }, 500);
  }
});

// Update integration
app.put("/make-server-a2294ced/integrations/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = c.req.param('id');
    const updates = await c.req.json();

    const integrations = await kv.get(`integrations:${targetUserId}`) || [];
    const index = integrations.findIndex((i: any) => i.id === id);

    if (index === -1) {
      return c.json({ error: 'Integration not found' }, 404);
    }

    integrations[index] = {
      ...integrations[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`integrations:${targetUserId}`, integrations);

    // Log activity
    await logActivity(targetUserId, 'Integration', 'Updated integration', `${updates.name || integrations[index].name}`, 'low');

    return c.json({ integration: integrations[index] });
  } catch (error: any) {
    console.error('Update integration error:', error);
    return c.json({ error: `Failed to update integration: ${error.message}` }, 500);
  }
});

// Delete integration
app.delete("/make-server-a2294ced/integrations/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = c.req.param('id');

    const integrations = await kv.get(`integrations:${targetUserId}`) || [];
    const deletedIntegration = integrations.find((i: any) => i.id === id);
    const filteredIntegrations = integrations.filter((i: any) => i.id !== id);

    if (integrations.length === filteredIntegrations.length) {
      return c.json({ error: 'Integration not found' }, 404);
    }

    await kv.set(`integrations:${targetUserId}`, filteredIntegrations);

    // Log activity
    await logActivity(targetUserId, 'Integration', 'Disconnected integration', `${deletedIntegration?.name || id}`, 'medium');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete integration error:', error);
    return c.json({ error: `Failed to delete integration: ${error.message}` }, 500);
  }
});

// Sync integration
app.post("/make-server-a2294ced/integrations/:id/sync", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = c.req.param('id');

    const integrations = await kv.get(`integrations:${targetUserId}`) || [];
    const index = integrations.findIndex((i: any) => i.id === id);

    if (index === -1) {
      return c.json({ error: 'Integration not found' }, 404);
    }

    // Update last sync time
    integrations[index] = {
      ...integrations[index],
      lastSync: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`integrations:${targetUserId}`, integrations);

    // Log activity
    await logActivity(targetUserId, 'Integration', 'Synced integration', `${integrations[index].name}`, 'low');

    return c.json({ integration: integrations[index] });
  } catch (error: any) {
    console.error('Sync integration error:', error);
    return c.json({ error: `Failed to sync integration: ${error.message}` }, 500);
  }
});

// ============= ACTIVITIES ROUTES =============

// Get activities
app.get("/make-server-a2294ced/activities", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId');
    const fetchAll = c.req.query('all') === 'true';

    // If fetchAll is requested, get all users' activities (admin only)
    if (fetchAll) {
      const user = await kv.get(`users:profile:${userId}`);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Unauthorized - Admin access required' }, 403);
      }

      const allUserProfiles = await kv.getByPrefix('users:profile:');
      let allActivities: any[] = [];
      
      for (const u of allUserProfiles) {
        const userActivities = await kv.get(`activities:${u.id}`) || [];
        const activitiesWithUser = userActivities.map((a: any) => ({
          ...a,
          _userId: u.id,
          _userName: u.name,
          _userEmail: u.email,
        }));
        allActivities = [...allActivities, ...activitiesWithUser];
      }
      
      // Return latest 50 activities across all users
      const sortedActivities = allActivities
        .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 50);

      return c.json({ activities: sortedActivities });
    }

    const finalUserId = targetUserId || userId;
    const activities = await kv.get(`activities:${finalUserId}`) || [];
    
    // Return latest 50 activities
    const sortedActivities = activities
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 50);

    return c.json({ activities: sortedActivities });
  } catch (error: any) {
    console.error('Get activities error:', error);
    return c.json({ error: `Failed to get activities: ${error.message}` }, 500);
  }
});

// ============= REPORTS ROUTES =============

// AI function to analyze report content
async function analyzeReportContent(content: string) {
  // Simulate AI analysis - in a real app, this would call an AI service
  const insights = {
    aftersales: [] as string[],
    kpi: [] as string[],
    competitors: [] as string[],
    sales: [] as string[],
    marketing: [] as string[],
    debt: [] as string[],
  };

  const lowercaseContent = content.toLowerCase();

  // After-sales insights
  if (lowercaseContent.includes('customer') || lowercaseContent.includes('satisfaction') || lowercaseContent.includes('service')) {
    insights.aftersales.push('Customer satisfaction metrics identified in report');
    if (lowercaseContent.includes('rating') || lowercaseContent.includes('score')) {
      insights.aftersales.push('Performance ratings detected');
    }
  }

  // KPI insights
  if (lowercaseContent.includes('revenue') || lowercaseContent.includes('mrr') || lowercaseContent.includes('target')) {
    insights.kpi.push('Revenue and target metrics found');
  }
  if (lowercaseContent.includes('retention') || lowercaseContent.includes('churn')) {
    insights.kpi.push('Customer retention data identified');
  }

  // Competitor insights
  if (lowercaseContent.includes('competitor') || lowercaseContent.includes('market share') || lowercaseContent.includes('pricing')) {
    insights.competitors.push('Competitive intelligence data detected');
    if (lowercaseContent.includes('price') || lowercaseContent.includes('discount') || lowercaseContent.includes('promotion')) {
      insights.competitors.push('Pricing and promotional strategies found');
    }
  }

  // Sales insights
  if (lowercaseContent.includes('sales') || lowercaseContent.includes('pipeline') || lowercaseContent.includes('deal')) {
    insights.sales.push('Sales pipeline and deal information identified');
  }
  if (lowercaseContent.includes('upsell') || lowercaseContent.includes('cross-sell')) {
    insights.sales.push('Upsell opportunities detected');
  }

  // Marketing insights
  if (lowercaseContent.includes('campaign') || lowercaseContent.includes('marketing') || lowercaseContent.includes('lead')) {
    insights.marketing.push('Marketing campaign data found');
  }
  if (lowercaseContent.includes('roi') || lowercaseContent.includes('conversion')) {
    insights.marketing.push('ROI and conversion metrics identified');
  }

  // Debt collection insights
  if (lowercaseContent.includes('debt') || lowercaseContent.includes('payment') || lowercaseContent.includes('overdue')) {
    insights.debt.push('Payment and debt collection data detected');
    if (lowercaseContent.includes('outstanding') || lowercaseContent.includes('recovery')) {
      insights.debt.push('Outstanding balances and recovery metrics found');
    }
  }

  return Object.entries(insights)
    .filter(([_, items]) => items.length > 0)
    .map(([module, items]) => ({ module: module as any, insights: items }));
}

// Get all reports
app.get("/make-server-a2294ced/reports", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;

    const reports = await kv.get(`reports:${targetUserId}`) || [];
    
    // Get user profile for creator names
    const enrichedReports = await Promise.all(
      reports.map(async (report: any) => {
        const creatorProfile = await kv.get(`users:profile:${report.createdBy}`);
        return {
          ...report,
          createdByName: creatorProfile?.name || 'Unknown User',
        };
      })
    );

    return c.json({ reports: enrichedReports });
  } catch (error: any) {
    console.error('Get reports error:', error);
    return c.json({ error: `Failed to get reports: ${error.message}` }, 500);
  }
});

// Create report
app.post("/make-server-a2294ced/reports", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const { type, title, content, fileName, fileSize } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    const reports = await kv.get(`reports:${targetUserId}`) || [];
    
    // Get user profile for creator name
    const creatorProfile = await kv.get(`users:profile:${userId}`);
    
    const newReport = {
      id: `report-${Date.now()}`,
      type: type || 'quick',
      title,
      content,
      fileName,
      fileSize,
      status: 'processing',
      createdBy: userId,
      createdByName: creatorProfile?.name || 'Unknown User',
      createdAt: new Date().toISOString(),
    };

    reports.push(newReport);
    await kv.set(`reports:${targetUserId}`, reports);

    // Analyze report in background (simulate async processing)
    const insights = await analyzeReportContent(content);
    
    // Update report with insights
    const reportIndex = reports.findIndex((r: any) => r.id === newReport.id);
    if (reportIndex !== -1) {
      reports[reportIndex] = {
        ...reports[reportIndex],
        status: 'processed',
        insights,
      };
      await kv.set(`reports:${targetUserId}`, reports);

      // Log activities for each module with insights
      for (const insight of insights) {
        const moduleNames: Record<string, string> = {
          aftersales: 'After Sales',
          kpi: 'KPI',
          competitors: 'Competitors',
          sales: 'Sales Strategy',
          marketing: 'Marketing Strategy',
          debt: 'Debt Collection',
        };
        
        await logActivity(
          targetUserId,
          moduleNames[insight.module] || insight.module,
          `Report insights: ${title}`,
          insight.insights[0] || 'New insights from report',
          'medium'
        );
      }

      // Log overall report creation
      await logActivity(targetUserId, 'Report', `Created ${type} report`, title, 'low');
    }

    return c.json({ report: reports[reportIndex] });
  } catch (error: any) {
    console.error('Create report error:', error);
    return c.json({ error: `Failed to create report: ${error.message}` }, 500);
  }
});

// Update report
app.put("/make-server-a2294ced/reports/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = c.req.param('id');
    const updates = await c.req.json();

    const reports = await kv.get(`reports:${targetUserId}`) || [];
    const index = reports.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Re-analyze if content changed
    let insights = reports[index].insights;
    if (updates.content && updates.content !== reports[index].content) {
      insights = await analyzeReportContent(updates.content);
      
      // Log new activities for updated insights
      for (const insight of insights) {
        const moduleNames: Record<string, string> = {
          aftersales: 'After Sales',
          kpi: 'KPI',
          competitors: 'Competitors',
          sales: 'Sales Strategy',
          marketing: 'Marketing Strategy',
          debt: 'Debt Collection',
        };
        
        await logActivity(
          targetUserId,
          moduleNames[insight.module] || insight.module,
          `Updated report insights: ${updates.title || reports[index].title}`,
          insight.insights[0] || 'Updated insights from report',
          'medium'
        );
      }
    }

    reports[index] = {
      ...reports[index],
      ...updates,
      id, // Prevent ID change
      insights,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`reports:${targetUserId}`, reports);

    // Log activity
    await logActivity(targetUserId, 'Report', 'Updated report', updates.title || reports[index].title, 'low');

    return c.json({ report: reports[index] });
  } catch (error: any) {
    console.error('Update report error:', error);
    return c.json({ error: `Failed to update report: ${error.message}` }, 500);
  }
});

// Delete report
app.delete("/make-server-a2294ced/reports/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const id = c.req.param('id');

    const reports = await kv.get(`reports:${targetUserId}`) || [];
    const deletedReport = reports.find((r: any) => r.id === id);
    const filteredReports = reports.filter((r: any) => r.id !== id);

    if (reports.length === filteredReports.length) {
      return c.json({ error: 'Report not found' }, 404);
    }

    await kv.set(`reports:${targetUserId}`, filteredReports);

    // Log activity
    await logActivity(targetUserId, 'Report', 'Deleted report', deletedReport?.title || id, 'low');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete report error:', error);
    return c.json({ error: `Failed to delete report: ${error.message}` }, 500);
  }
});

// Helper function to log activity
async function logActivity(userId: string, category: string, action: string, details: string, priority: string) {
  try {
    const activities = await kv.get(`activities:${userId}`) || [];
    
    const newActivity = {
      id: Date.now(),
      time: new Date().toISOString(),
      category,
      action,
      details,
      priority,
    };

    activities.push(newActivity);

    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100);
    }

    await kv.set(`activities:${userId}`, activities);
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

// ============= WHATSAPP API ROUTES =============

// Send WhatsApp message
app.post("/make-server-a2294ced/whatsapp/send", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { to, message, type, templateName, templateParams } = await c.req.json();

    if (!to || !message) {
      return c.json({ error: 'Phone number and message are required' }, 400);
    }

    console.log('📱 WhatsApp send request:', { to, messageLength: message.length, type });

    const result = await whatsapp.sendWhatsAppMessage({
      to,
      message,
      type,
      templateName,
      templateParams,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Log activity
    await logActivity(userId, 'WhatsApp', 'Sent message', `To ${to}`, 'medium');

    return c.json(result);
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return c.json({ error: `Failed to send WhatsApp message: ${error.message}` }, 500);
  }
});

// Send bulk WhatsApp messages
app.post("/make-server-a2294ced/whatsapp/send-bulk", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { messages } = await c.req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Messages array is required' }, 400);
    }

    console.log('📱 WhatsApp bulk send request:', { count: messages.length });

    const results = await whatsapp.sendBulkWhatsAppMessages(messages);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Log activity
    await logActivity(userId, 'WhatsApp', 'Sent bulk messages', `${successCount} sent, ${failCount} failed`, 'high');

    return c.json({ 
      results,
      summary: {
        total: messages.length,
        success: successCount,
        failed: failCount,
      }
    });
  } catch (error: any) {
    console.error('WhatsApp bulk send error:', error);
    return c.json({ error: `Failed to send bulk WhatsApp messages: ${error.message}` }, 500);
  }
});

// Validate WhatsApp number
app.post("/make-server-a2294ced/whatsapp/validate", authMiddleware, async (c) => {
  try {
    const { phone } = await c.req.json();

    if (!phone) {
      return c.json({ error: 'Phone number is required' }, 400);
    }

    const isValid = whatsapp.isValidWhatsAppNumber(phone);
    const formatted = whatsapp.formatWhatsAppNumber(phone);

    return c.json({ 
      isValid,
      formatted: isValid ? formatted : null,
      original: phone,
    });
  } catch (error: any) {
    console.error('WhatsApp validate error:', error);
    return c.json({ error: `Failed to validate number: ${error.message}` }, 500);
  }
});

// Send template message
app.post("/make-server-a2294ced/whatsapp/send-template", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { to, templateName, params } = await c.req.json();

    if (!to || !templateName) {
      return c.json({ error: 'Phone number and template name are required' }, 400);
    }

    console.log('📱 WhatsApp template send request:', { to, templateName, params });

    const result = await whatsapp.sendWhatsAppTemplate(to, templateName, params || []);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Log activity
    await logActivity(userId, 'WhatsApp', 'Sent template message', `${templateName} to ${to}`, 'medium');

    return c.json(result);
  } catch (error: any) {
    console.error('WhatsApp template send error:', error);
    return c.json({ error: `Failed to send template message: ${error.message}` }, 500);
  }
});

// ============= COMPANY SETTINGS ROUTES =============

// Get company settings
app.get("/make-server-a2294ced/company/settings", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Get user's team
    const user = await kv.get(`users:profile:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Get team-specific settings
    const settings = await kv.get(`company:settings:${user.teamId}`) || {
      companyName: '',
      showCompanyName: true,
    };
    return c.json({ settings });
  } catch (error: any) {
    console.error('Get company settings error:', error);
    return c.json({ error: `Failed to get settings: ${error.message}` }, 500);
  }
});

// Update company settings (admin only)
app.put("/make-server-a2294ced/company/settings", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Check if user is admin
    const user = await kv.get(`users:profile:${userId}`);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const updates = await c.req.json();
    
    // Get team-specific settings
    const currentSettings = await kv.get(`company:settings:${user.teamId}`) || {};
    
    const newSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    // Save team-specific settings
    await kv.set(`company:settings:${user.teamId}`, newSettings);

    // Log activity
    await logActivity(userId, 'Settings', 'Updated company settings', `Company: ${updates.companyName || 'N/A'}`, 'medium');

    return c.json({ settings: newSettings });
  } catch (error: any) {
    console.error('Update company settings error:', error);
    return c.json({ error: `Failed to update settings: ${error.message}` }, 500);
  }
});

// ============= INVITATIONS ROUTES =============

// Generate invitation code
app.post("/make-server-a2294ced/invitations/generate", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Check if user is admin
    const user = await kv.get(`users:profile:${userId}`);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const { email, phone, name, role } = await c.req.json();
    
    // Generate unique invite code
    const inviteCode = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const invitation = {
      code: inviteCode,
      email: email || '',
      phone: phone || '',
      name,
      role,
      createdBy: userId,
      teamId: user.teamId, // Important: Store admin's team ID
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      used: false,
    };

    // Store invitation with code as key for easy lookup
    await kv.set(`invite:${inviteCode}`, invitation);
    
    // Also store in invitations list for admin to view
    const invitations = await kv.get('invitations') || [];
    invitations.push(invitation);
    await kv.set('invitations', invitations);

    // Log activity
    await logActivity(userId, 'User Management', 'Generated invitation', `For ${name} (${role})`, 'low');

    return c.json({ inviteCode, invitation });
  } catch (error: any) {
    console.error('Generate invitation error:', error);
    return c.json({ error: `Failed to generate invitation: ${error.message}` }, 500);
  }
});

// Send invitation email
app.post("/make-server-a2294ced/invitations/email", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Check if user is admin
    const user = await kv.get(`users:profile:${userId}`);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const { email, name, role, inviteLink } = await c.req.json();

    // Get team-specific company settings for personalization
    const companySettings = await kv.get(`company:settings:${user.teamId}`) || {};
    const companyName = companySettings.companyName || 'Pocket';

    // Send actual email via email service
    const { sendInvitationEmail } = await import('./email-service.tsx');
    
    try {
      const emailSent = await sendInvitationEmail({
        to: email,
        recipientName: name,
        inviterName: user.name || 'Team Admin',
        companyName: companyName,
        role: role,
        inviteLink: inviteLink,
        expiryDays: 7,
      });

      if (emailSent) {
        console.log('✅ Invitation email sent successfully to:', email);
      } else {
        console.warn('⚠️ Email service not configured. Email was not sent.');
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send invitation email:', emailError);
      // Don't fail the whole request - still log the activity
    }

    // Log activity
    await logActivity(userId, 'User Management', 'Sent email invitation', `To ${email}`, 'low');

    return c.json({ 
      success: true, 
      message: 'Invitation email sent successfully',
      emailConfigured: !!Deno.env.get('RESEND_API_KEY')
    });
  } catch (error: any) {
    console.error('Send invitation email error:', error);
    return c.json({ error: `Failed to send invitation: ${error.message}` }, 500);
  }
});

// Verify invitation code
app.get("/make-server-a2294ced/invitations/verify/:code", async (c) => {
  try {
    const code = c.req.param('code');
    
    // Look up invitation by code
    const invitation = await kv.get(`invite:${code}`);

    if (!invitation) {
      return c.json({ error: 'Invalid invitation code' }, 404);
    }

    if (invitation.used) {
      return c.json({ error: 'Invitation code has already been used' }, 400);
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    if (now > expiresAt) {
      return c.json({ error: 'Invitation code has expired' }, 400);
    }

    return c.json({ invitation: { name: invitation.name, email: invitation.email, phone: invitation.phone, role: invitation.role } });
  } catch (error: any) {
    console.error('Verify invitation error:', error);
    return c.json({ error: `Failed to verify invitation: ${error.message}` }, 500);
  }
});

// ============= TASK MANAGEMENT ROUTES =============

// Get all tasks (admin sees all, users see their own)
app.get("/make-server-a2294ced/tasks", authMiddleware, async (c) => {
  try {
    const currentUserId = c.get('userId');
    const currentUser = await kv.get(`users:profile:${currentUserId}`);
    
    if (!currentUser) {
      console.error('User not found in KV store:', currentUserId);
      return c.json({ error: 'User not found' }, 404);
    }

    // Get query parameters for filtering by specific user
    const filterUserId = c.req.query('userId');
    const all = c.req.query('all') === 'true';

    console.log('📋 Task fetch request:', { 
      currentUserId, 
      currentUserRole: currentUser.role,
      filterUserId, 
      all 
    });

    // Determine which tasks to fetch
    let allTasks = [];
    try {
      allTasks = await kv.getByPrefix('tasks:');
      console.log('Total tasks in system:', allTasks.length);
    } catch (kvError: any) {
      console.error('KV store error when fetching tasks:', kvError);
      return c.json({ success: true, records: [] });
    }

    // Filter tasks based on role and parameters
    let filteredTasks = allTasks;
    
    if (currentUser.role === 'admin') {
      // Admin can see all tasks or filter by specific user
      if (filterUserId && !all) {
        console.log('Admin filtering tasks for user:', filterUserId);
        filteredTasks = allTasks.filter((task: any) => 
          task.assignedTo === filterUserId || task.assignedBy === filterUserId
        );
      } else if (!all && !filterUserId) {
        // If no userId specified and not "all", show admin's own tasks
        filteredTasks = allTasks.filter((task: any) => 
          task.assignedTo === currentUserId || task.assignedBy === currentUserId
        );
      }
      // else if all=true, show all tasks (filteredTasks = allTasks)
    } else {
      // Regular users only see their own tasks
      console.log('User fetching own tasks. UserId:', currentUserId);
      filteredTasks = allTasks.filter((task: any) => 
        task.assignedTo === currentUserId || task.assignedBy === currentUserId
      );
    }
    
    console.log('Filtered tasks count:', filteredTasks.length);
    
    return c.json({ 
      success: true, 
      records: filteredTasks.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return c.json({ error: `Failed to get tasks: ${error.message}` }, 500);
  }
});

// Get tasks by user (with query parameter)
app.get("/make-server-a2294ced/tasks/user/:userId", authMiddleware, async (c) => {
  return await tasks.getTasksByUser(c);
});

// Get task statistics
app.get("/make-server-a2294ced/tasks/stats", authMiddleware, async (c) => {
  return await tasks.getTaskStats(c);
});

// Create task (admin only)
app.post("/make-server-a2294ced/tasks", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`users:profile:${userId}`);
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    return await tasks.createTask(c);
  } catch (error: any) {
    console.error('Create task error:', error);
    return c.json({ error: `Failed to create task: ${error.message}` }, 500);
  }
});

// Update task (both admin and user can update)
app.put("/make-server-a2294ced/tasks/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`users:profile:${userId}`);
    const taskId = parseInt(c.req.param('id'));
    const task = await kv.get(`tasks:${taskId}`);

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Admin can update any task, users can only update their own tasks
    if (user.role !== 'admin' && task.assignedTo !== userId) {
      return c.json({ error: 'Unauthorized - You can only update your own tasks' }, 403);
    }

    return await tasks.updateTask(c);
  } catch (error: any) {
    console.error('Update task error:', error);
    return c.json({ error: `Failed to update task: ${error.message}` }, 500);
  }
});

// Update task status (quick status update)
app.patch("/make-server-a2294ced/tasks/:id/status", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    console.log('🔐 Task status update - User ID:', userId, 'Type:', typeof userId);
    
    const user = await kv.get(`users:profile:${userId}`);
    console.log('👤 User found:', user ? `${user.name} (${user.role})` : 'NOT FOUND');
    
    if (!user) {
      console.error('❌ User not found in database:', userId);
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    const taskId = parseInt(c.req.param('id'));
    console.log('📋 Task ID:', taskId);
    
    const task = await kv.get(`tasks:${taskId}`);
    console.log('📋 Task found:', task ? `${task.title} (assignedTo: ${task.assignedTo}, type: ${typeof task.assignedTo})` : 'NOT FOUND');

    if (!task) {
      console.error('❌ Task not found:', taskId);
      return c.json({ success: false, error: 'Task not found' }, 404);
    }

    // Compare as strings - task.assignedTo should be UUID string
    const taskAssignedTo = String(task.assignedTo);
    const currentUserId = String(userId);
    
    console.log('🔍 Comparing:', {
      userRole: user.role,
      taskAssignedTo: taskAssignedTo,
      currentUserId: currentUserId,
      match: taskAssignedTo === currentUserId,
      isAdmin: user.role === 'admin'
    });
    
    // Both admin and assigned user can update status
    if (user.role !== 'admin' && taskAssignedTo !== currentUserId) {
      console.error('❌ Unauthorized - not admin and not assigned to this task');
      return c.json({ success: false, error: 'Unauthorized - You can only update your own tasks' }, 403);
    }

    console.log('✅ Authorization passed, updating task...');
    return await tasks.updateTaskStatus(c);
  } catch (error: any) {
    console.error('❌ Update task status error:', error);
    return c.json({ success: false, error: `Failed to update task status: ${error.message}` }, 500);
  }
});

// Delete task (admin only)
app.delete("/make-server-a2294ced/tasks/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await kv.get(`users:profile:${userId}`);
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    return await tasks.deleteTask(c);
  } catch (error: any) {
    console.error('Delete task error:', error);
    return c.json({ error: `Failed to delete task: ${error.message}` }, 500);
  }
});

// ==================== REPORT HISTORY ENDPOINTS ====================

// Save a generated report
app.post("/make-server-a2294ced/reports", authMiddleware, async (c) => {
  try {
    return await reports.saveReport(c);
  } catch (error: any) {
    console.error('Save report error:', error);
    return c.json({ error: `Failed to save report: ${error.message}` }, 500);
  }
});

// Get all reports for current user or team
app.get("/make-server-a2294ced/reports", authMiddleware, async (c) => {
  try {
    return await reports.getReports(c);
  } catch (error: any) {
    console.error('Get reports error:', error);
    return c.json([]);
  }
});

// Get a specific report by ID
app.get("/make-server-a2294ced/reports/:id", authMiddleware, async (c) => {
  try {
    return await reports.getReport(c);
  } catch (error: any) {
    console.error('Get report error:', error);
    return c.json({ error: `Failed to get report: ${error.message}` }, 500);
  }
});

// Delete a report
app.delete("/make-server-a2294ced/reports/:id", authMiddleware, async (c) => {
  try {
    return await reports.deleteReport(c);
  } catch (error: any) {
    console.error('Delete report error:', error);
    return c.json({ error: `Failed to delete report: ${error.message}` }, 500);
  }
});

// ============= AI REPORTS ROUTES =============

// Get all AI reports for a user
app.get("/make-server-a2294ced/ai-reports", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    
    console.log('Fetching AI reports for user:', targetUserId);
    
    const reports = await kv.get(`ai-reports:${targetUserId}`) || [];
    console.log('AI reports fetched:', reports.length, 'reports');
    
    return c.json(reports);
  } catch (error: any) {
    console.error('Get AI reports error:', error);
    return c.json([]);
  }
});

// Save an AI report
app.post("/make-server-a2294ced/ai-reports", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const { date, period, insights, metrics } = await c.req.json();
    
    console.log('Saving AI report:', { date, period, userId: targetUserId });
    
    const reports = await kv.get(`ai-reports:${targetUserId}`) || [];
    
    // Check if report for this date/period already exists
    const existingIndex = reports.findIndex((r: any) => r.date === date && r.period === period);
    
    const report = {
      date,
      period,
      insights,
      metrics,
      createdAt: existingIndex >= 0 ? reports[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
      console.log('Updated existing report');
    } else {
      reports.push(report);
      console.log('Created new report');
    }
    
    await kv.set(`ai-reports:${targetUserId}`, reports);
    
    return c.json({ success: true, report });
  } catch (error: any) {
    console.error('Save AI report error:', error);
    return c.json({ error: `Failed to save report: ${error.message}` }, 500);
  }
});

// Delete an AI report
app.delete("/make-server-a2294ced/ai-reports/:date/:period", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const targetUserId = c.req.query('userId') || userId;
    const date = c.req.param('date');
    const period = c.req.param('period');
    
    console.log('Deleting AI report:', { date, period, userId: targetUserId });
    
    const reports = await kv.get(`ai-reports:${targetUserId}`) || [];
    const filteredReports = reports.filter((r: any) => !(r.date === date && r.period === period));
    
    await kv.set(`ai-reports:${targetUserId}`, filteredReports);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete AI report error:', error);
    return c.json({ error: `Failed to delete report: ${error.message}` }, 500);
  }
});

// ============= SUBSCRIPTION ROUTES =============

// Initialize subscription
app.post("/make-server-a2294ced/subscription/initialize", subscription.initializeSubscription);

// Get subscription status
app.get("/make-server-a2294ced/subscription/status", subscription.getSubscriptionStatus);

// Process payment
app.post("/make-server-a2294ced/subscription/payment", subscription.processPayment);

// Get payment history
app.get("/make-server-a2294ced/subscription/payments", subscription.getPaymentHistory);

// Admin: Get all subscriptions
app.get("/make-server-a2294ced/admin/subscriptions", subscription.getAllSubscriptions);

// Admin: Update subscription status
app.put("/make-server-a2294ced/admin/subscription/status", subscription.updateSubscriptionStatus);

// Admin: Update payment status
app.put("/make-server-a2294ced/admin/payment/status", subscription.updatePaymentStatus);

Deno.serve(app.fetch);