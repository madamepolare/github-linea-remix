-- Supprimer la contrainte unique qui empêche de planifier plusieurs créneaux pour une même tâche/utilisateur
ALTER TABLE public.task_schedules DROP CONSTRAINT unique_task_user_schedule;