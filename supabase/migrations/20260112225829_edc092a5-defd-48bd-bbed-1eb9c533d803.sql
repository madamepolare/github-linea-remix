-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.calculate_working_days(
  p_workspace_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_start_half_day BOOLEAN DEFAULT false,
  p_end_half_day BOOLEAN DEFAULT false
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days NUMERIC := 0;
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_is_holiday BOOLEAN;
BEGIN
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date)::INTEGER;
    
    -- Skip weekends (0 = Sunday, 6 = Saturday)
    IF v_day_of_week NOT IN (0, 6) THEN
      -- Check if it's a holiday
      SELECT EXISTS(
        SELECT 1 FROM public.french_holidays 
        WHERE workspace_id = p_workspace_id 
        AND holiday_date = v_current_date
        AND is_worked = false
      ) INTO v_is_holiday;
      
      IF NOT v_is_holiday THEN
        -- Count as working day
        IF v_current_date = p_start_date AND p_start_half_day THEN
          v_days := v_days + 0.5;
        ELSIF v_current_date = p_end_date AND p_end_half_day THEN
          v_days := v_days + 0.5;
        ELSE
          v_days := v_days + 1;
        END IF;
      END IF;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN v_days;
END;
$$;