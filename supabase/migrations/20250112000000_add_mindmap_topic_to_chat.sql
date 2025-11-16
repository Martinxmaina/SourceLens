-- Add mindmap_topic column to n8n_chat_histories table
-- This allows tracking which mindmap node/topic each chat message relates to

ALTER TABLE public.n8n_chat_histories
ADD COLUMN IF NOT EXISTS mindmap_topic text;

-- Add index for efficient queries by session_id and mindmap_topic
CREATE INDEX IF NOT EXISTS idx_chat_histories_session_topic 
ON public.n8n_chat_histories(session_id, mindmap_topic);

-- Add comment for documentation
COMMENT ON COLUMN public.n8n_chat_histories.mindmap_topic IS 'The mindmap node label/topic that this chat message relates to. NULL for messages not triggered from mindmap nodes.';


