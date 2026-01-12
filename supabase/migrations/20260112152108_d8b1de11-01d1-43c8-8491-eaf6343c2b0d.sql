-- Fix the RLS policy for quick_tasks - the condition was referencing wrong column
DROP POLICY IF EXISTS "Users can view their own tasks or shared tasks" ON public.quick_tasks;

CREATE POLICY "Users can view their own tasks or shared tasks"
ON public.quick_tasks
FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.quick_task_shares WHERE quick_task_shares.quick_task_id = quick_tasks.id AND quick_task_shares.shared_with_user_id = auth.uid())
);