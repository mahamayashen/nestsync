-- Fix proposal deadline date on calendar: use household timezone for
-- the date cast so the proposal shows on the correct local day.
-- Previously, voting_deadline::date used UTC, causing proposals to
-- appear a day late for users in western timezones.

CREATE OR REPLACE VIEW "calendar_events" AS

-- Chore instances (excluding cancelled)
SELECT
  ci."id" AS event_id,
  ci."household_id",
  'chore'::text AS event_type,
  ci."title" AS event_title,
  ci."due_date" AS event_date,
  ci."status"::text AS event_status,
  ci."assigned_to" AS related_member_id,
  ci."points" AS metadata_int,
  NULL::decimal AS metadata_decimal
FROM "chore_instances" ci
WHERE ci."status" != 'cancelled'

UNION ALL

-- Expenses (excluding soft-deleted)
SELECT
  e."id" AS event_id,
  e."household_id",
  'expense'::text AS event_type,
  e."title" AS event_title,
  e."expense_date" AS event_date,
  'active'::text AS event_status,
  e."paid_by" AS related_member_id,
  NULL::integer AS metadata_int,
  e."amount" AS metadata_decimal
FROM "expenses" e
WHERE e."deleted_at" IS NULL

UNION ALL

-- Proposal deadlines (only active) — use household timezone for date
SELECT
  p."id" AS event_id,
  p."household_id",
  'proposal'::text AS event_type,
  p."title" AS event_title,
  (p."voting_deadline" AT TIME ZONE h."timezone")::date AS event_date,
  p."status"::text AS event_status,
  p."created_by" AS related_member_id,
  NULL::integer AS metadata_int,
  NULL::decimal AS metadata_decimal
FROM "proposals" p
JOIN "households" h ON h."id" = p."household_id"
WHERE p."status" = 'active';
