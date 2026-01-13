-- Migration: User + invitation RLS enhancements
-- Purpose: allow admin user management, allow invited users to create profiles, and permit invite validation/update by token/email.
-- Run in Supabase SQL editor.

-- Users: allow self-insert and admin management
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Admins can manage all users'
    ) THEN
        CREATE POLICY "Admins can manage all users" ON users
            FOR ALL
            USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
            WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Invitation links: allow token validation and invitee completion
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'invitation_links' AND policyname = 'Token holders can validate invitations'
    ) THEN
        CREATE POLICY "Token holders can validate invitations" ON invitation_links
            FOR SELECT
            USING (used = false AND expires_at > NOW());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'invitation_links' AND policyname = 'Invitee can mark invitation used'
    ) THEN
        CREATE POLICY "Invitee can mark invitation used" ON invitation_links
            FOR UPDATE
            USING (
                auth.role() = 'authenticated'
                AND auth.jwt()->>'email' IS NOT NULL
                AND lower(auth.jwt()->>'email') = lower(email)
            )
            WITH CHECK (
                auth.role() = 'authenticated'
                AND auth.jwt()->>'email' IS NOT NULL
                AND lower(auth.jwt()->>'email') = lower(email)
            );
    END IF;
END $$;
