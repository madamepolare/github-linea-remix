-- Recreate pg_net in the extensions schema (pg_net does not support ALTER EXTENSION .. SET SCHEMA)
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;