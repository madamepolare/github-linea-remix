-- Table for roadmap items (features/modules)
CREATE TABLE public.roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'feature', -- 'module', 'feature', 'improvement', 'bugfix'
  status TEXT NOT NULL DEFAULT 'planned', -- 'delivered', 'in_progress', 'planned', 'vision'
  priority INTEGER DEFAULT 0,
  release_version TEXT,
  release_date DATE,
  quarter TEXT, -- 'Q1 2026', 'Q2 2026', etc.
  icon TEXT, -- lucide icon name
  color TEXT, -- color theme
  module_slug TEXT, -- link to existing module
  votes_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true, -- visible to all users
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for user ideas/suggestions
CREATE TABLE public.roadmap_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'feature', -- 'feature', 'improvement', 'integration', 'other'
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'approved', 'rejected', 'implemented'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  votes_count INTEGER DEFAULT 0,
  admin_notes TEXT, -- internal notes from admin
  converted_to_roadmap_id UUID REFERENCES public.roadmap_items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for votes on ideas
CREATE TABLE public.roadmap_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID REFERENCES public.roadmap_ideas(id) ON DELETE CASCADE,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  vote_type TEXT DEFAULT 'upvote', -- 'upvote', 'downvote'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_idea_vote UNIQUE(user_id, idea_id),
  CONSTRAINT unique_user_roadmap_vote UNIQUE(user_id, roadmap_item_id),
  CONSTRAINT vote_target_check CHECK (
    (idea_id IS NOT NULL AND roadmap_item_id IS NULL) OR
    (idea_id IS NULL AND roadmap_item_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roadmap_items (read by all workspace members, manage by admin/owner)
CREATE POLICY "Members can view roadmap items" ON public.roadmap_items
  FOR SELECT USING (
    workspace_id IS NULL OR -- global items
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = roadmap_items.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage roadmap items" ON public.roadmap_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = roadmap_items.workspace_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for roadmap_ideas
CREATE POLICY "Members can view ideas in their workspace" ON public.roadmap_ideas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = roadmap_ideas.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Members can create ideas" ON public.roadmap_ideas
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = roadmap_ideas.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own ideas" ON public.roadmap_ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ideas" ON public.roadmap_ideas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = roadmap_ideas.workspace_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for roadmap_votes
CREATE POLICY "Members can view votes" ON public.roadmap_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own votes" ON public.roadmap_votes
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_roadmap_items_workspace ON public.roadmap_items(workspace_id);
CREATE INDEX idx_roadmap_items_status ON public.roadmap_items(status);
CREATE INDEX idx_roadmap_ideas_workspace ON public.roadmap_ideas(workspace_id);
CREATE INDEX idx_roadmap_ideas_status ON public.roadmap_ideas(status);
CREATE INDEX idx_roadmap_votes_idea ON public.roadmap_votes(idea_id);
CREATE INDEX idx_roadmap_votes_item ON public.roadmap_votes(roadmap_item_id);

-- Trigger for updated_at
CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmap_ideas_updated_at
  BEFORE UPDATE ON public.roadmap_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update votes count
CREATE OR REPLACE FUNCTION public.update_roadmap_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    IF NEW IS NOT NULL AND NEW.idea_id IS NOT NULL THEN
      UPDATE public.roadmap_ideas 
      SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE idea_id = NEW.idea_id AND vote_type = 'upvote')
      WHERE id = NEW.idea_id;
    ELSIF OLD IS NOT NULL AND OLD.idea_id IS NOT NULL THEN
      UPDATE public.roadmap_ideas 
      SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE idea_id = OLD.idea_id AND vote_type = 'upvote')
      WHERE id = OLD.idea_id;
    END IF;
    
    IF NEW IS NOT NULL AND NEW.roadmap_item_id IS NOT NULL THEN
      UPDATE public.roadmap_items 
      SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE roadmap_item_id = NEW.roadmap_item_id AND vote_type = 'upvote')
      WHERE id = NEW.roadmap_item_id;
    ELSIF OLD IS NOT NULL AND OLD.roadmap_item_id IS NOT NULL THEN
      UPDATE public.roadmap_items 
      SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE roadmap_item_id = OLD.roadmap_item_id AND vote_type = 'upvote')
      WHERE id = OLD.roadmap_item_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_votes_count_trigger
  AFTER INSERT OR DELETE ON public.roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_roadmap_votes_count();