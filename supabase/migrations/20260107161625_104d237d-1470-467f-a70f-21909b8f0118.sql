-- Add missing values to procedure_type enum
ALTER TYPE procedure_type ADD VALUE IF NOT EXISTS 'mapa';
ALTER TYPE procedure_type ADD VALUE IF NOT EXISTS 'ppp';
ALTER TYPE procedure_type ADD VALUE IF NOT EXISTS 'conception_realisation';
ALTER TYPE procedure_type ADD VALUE IF NOT EXISTS 'autre';