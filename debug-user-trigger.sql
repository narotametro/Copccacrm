-- Debug and fix the user creation trigger
-- Add error handling and logging

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_full_name TEXT;
  user_role TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract metadata with safe defaults
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  user_avatar := NEW.raw_user_meta_data->>'avatar_url';

  -- Insert with error handling
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      avatar_url,
      status
    )
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_role,
      user_avatar,
      'active'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Log successful creation (optional)
    RAISE LOG 'User profile created for: %', NEW.email;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test the function (optional)
-- SELECT handle_new_user(); -- This will fail but shows if function compiles