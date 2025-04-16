-- Add description column to user_objects table
ALTER TABLE public.user_objects
ADD COLUMN description TEXT;

-- Optional: Add a comment to the column
COMMENT ON COLUMN public.user_objects.description IS 'AI-generated description of the object based on its image.';
