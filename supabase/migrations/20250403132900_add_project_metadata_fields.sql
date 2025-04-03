-- Add description, view_type and color_tone fields to projects table
ALTER TABLE projects
ADD COLUMN description TEXT,
ADD COLUMN view_type TEXT,
ADD COLUMN color_tone TEXT;

-- Update RLS policies to include new fields
CREATE POLICY "Users can update own projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
