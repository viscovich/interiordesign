-- Add columns required for asynchronous image generation and tracking

ALTER TABLE public.projects
ADD COLUMN rendering_type TEXT,
ADD COLUMN color_tone TEXT,
ADD COLUMN view TEXT,
ADD COLUMN prompt TEXT,
ADD COLUMN input_user_object_ids UUID[],
ADD COLUMN generation_error TEXT;

-- Add constraint to ensure prompt is not null if we decide it's mandatory later
-- For now, allowing NULL based on initial plan, but can be changed.
-- ALTER TABLE public.projects ALTER COLUMN prompt SET NOT NULL;

-- Add indexes for potentially queried columns if needed (optional optimization)
-- CREATE INDEX IF NOT EXISTS idx_projects_stato_generazione ON public.projects(stato_generazione);

-- Update existing rows if necessary (e.g., set default status for old projects)
-- UPDATE public.projects SET stato_generazione = 'completed' WHERE stato_generazione IS NULL;

-- Note: The columns stato_generazione, model, size, quality were added previously by the user.
