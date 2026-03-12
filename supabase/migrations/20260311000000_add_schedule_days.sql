-- Add schedule_days column for custom day-of-week scheduling.
-- Stores JS weekday numbers: 0=Sun, 1=Mon, ..., 6=Sat.
-- NULL means use legacy recurrence-based logic.
ALTER TABLE "chore_templates"
  ADD COLUMN "schedule_days" SMALLINT[];
