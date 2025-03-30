-- supabase/migrations/20250330003950_add_object_tables.sql

-- 1. Create user_objects table
CREATE TABLE public.user_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    object_name TEXT NOT NULL,
    object_type TEXT NOT NULL, -- User-selected category (e.g., 'Refrigerator', 'Chair')
    asset_url TEXT NOT NULL, -- URL to the object image in Supabase Storage/S3
    thumbnail_url TEXT, -- Optional URL for a smaller thumbnail
    dimensions TEXT, -- Optional dimensions (e.g., '70" x 36"')
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for frequent lookups
CREATE INDEX idx_user_objects_user_id ON public.user_objects(user_id);
CREATE INDEX idx_user_objects_user_id_type ON public.user_objects(user_id, object_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own objects
CREATE POLICY "Allow users to view their own objects"
ON public.user_objects FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own objects
CREATE POLICY "Allow users to insert their own objects"
ON public.user_objects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own objects
CREATE POLICY "Allow users to update their own objects"
ON public.user_objects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own objects
CREATE POLICY "Allow users to delete their own objects"
ON public.user_objects FOR DELETE
USING (auth.uid() = user_id);


-- 2. Create image_objects table
CREATE TABLE public.image_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Assuming 'projects' table holds the generated images
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Denormalized for easier querying/RLS
    object_name TEXT NOT NULL, -- Name identified by Gemini (e.g., 'Refrigerator')
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX idx_image_objects_project_id ON public.image_objects(project_id);
CREATE INDEX idx_image_objects_user_id ON public.image_objects(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.image_objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view objects associated with their projects/user ID
CREATE POLICY "Allow users to view objects for their projects"
ON public.image_objects FOR SELECT
USING (auth.uid() = user_id); -- Assuming user_id matches the project owner

-- Users can insert objects for their projects
CREATE POLICY "Allow users to insert objects for their projects"
ON public.image_objects FOR INSERT
WITH CHECK (auth.uid() = user_id); -- Check against the user_id being inserted

-- Users can delete objects for their projects (optional, maybe only backend should delete?)
CREATE POLICY "Allow users to delete objects for their projects"
ON public.image_objects FOR DELETE
USING (auth.uid() = user_id);


-- Grant permissions (similar to previous migration)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_objects TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.image_objects TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role; -- Ensure future sequences are covered
