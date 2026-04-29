
ALTER TYPE diagnostico_status ADD VALUE IF NOT EXISTS 'aguardando_aprovacao';
ALTER TYPE diagnostico_status ADD VALUE IF NOT EXISTS 'liberado';
ALTER TYPE diagnostico_status ADD VALUE IF NOT EXISTS 'reprovado';
