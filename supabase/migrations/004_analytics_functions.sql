-- supabase/migrations/004_analytics_functions.sql

CREATE OR REPLACE FUNCTION get_visit_type_distribution()
RETURNS TABLE(type text, cnt bigint)
LANGUAGE SQL
STABLE
AS $$
  SELECT type, COUNT(*) as cnt
  FROM appointments
  WHERE appointment_date >= date_trunc('year', NOW())
  GROUP BY type
  ORDER BY cnt DESC;
$$;
