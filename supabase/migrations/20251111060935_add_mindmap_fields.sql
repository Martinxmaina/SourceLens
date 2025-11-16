-- ============================================================================
-- ADD MINDMAP FIELDS TO NOTEBOOKS TABLE
-- ============================================================================

-- Add mindmap fields to notebooks table
ALTER TABLE public.notebooks
ADD COLUMN IF NOT EXISTS mindmap_data jsonb,
ADD COLUMN IF NOT EXISTS mindmap_generation_status text,
ADD COLUMN IF NOT EXISTS mindmap_updated_at timestamp with time zone;

-- Create index for mindmap generation status queries
CREATE INDEX IF NOT EXISTS idx_notebooks_mindmap_status ON public.notebooks(mindmap_generation_status);

