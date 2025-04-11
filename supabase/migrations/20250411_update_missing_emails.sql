
-- Update existing profiles with email from auth.users if email is missing
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id 
AND (profiles.email IS NULL OR profiles.email = '');
