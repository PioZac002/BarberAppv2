-- publicTeamController queries b.job_title and b.certifications, but the
-- original schema never created them, so every barber profile returned 500
-- and the Team tab could not open anyone. Add them where they were always
-- assumed to be.
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS job_title      VARCHAR(120);
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- existing rows get the default the controller was already falling back to
UPDATE barbers SET job_title = 'Barber' WHERE job_title IS NULL;
