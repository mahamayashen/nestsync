-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "AdminHistoryReason" AS ENUM ('household_created', 'elected', 'auto_promoted', 'predecessor_left');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('one_time', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "ChoreStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('equal', 'exact');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('elect_admin', 'remove_member', 'custom');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('active', 'passed', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('yes', 'no');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "invite_code" VARCHAR(20) NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 10,
    "members_can_edit_own_chores" BOOLEAN NOT NULL DEFAULT true,
    "min_vote_participation" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "default_vote_duration_hours" INTEGER NOT NULL DEFAULT 48,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "reason" "AdminHistoryReason" NOT NULL,
    "proposal_id" UUID,

    CONSTRAINT "admin_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "recurrence" "Recurrence" NOT NULL,
    "assigned_to" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "chore_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID,
    "household_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "points" INTEGER NOT NULL,
    "assigned_to" UUID,
    "due_date" DATE NOT NULL,
    "status" "ChoreStatus" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMPTZ(6),
    "completed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chore_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_by" UUID NOT NULL,
    "split_type" "SplitType" NOT NULL DEFAULT 'equal',
    "category" VARCHAR(50),
    "expense_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_splits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expense_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "from_member" UUID NOT NULL,
    "to_member" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "emoji" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "type" "ProposalType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "target_member_id" UUID,
    "created_by" UUID NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'active',
    "eligible_voter_count" INTEGER NOT NULL,
    "min_participation_threshold" DOUBLE PRECISION NOT NULL,
    "voting_deadline" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proposal_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "vote" "VoteChoice" NOT NULL,
    "voted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "households_invite_code_key" ON "households"("invite_code");

-- CreateIndex
CREATE INDEX "household_members_household_id_idx" ON "household_members"("household_id");

-- CreateIndex
CREATE INDEX "chore_templates_household_id_idx" ON "chore_templates"("household_id");

-- CreateIndex
CREATE INDEX "chore_instances_household_id_due_date_idx" ON "chore_instances"("household_id", "due_date");

-- CreateIndex
CREATE INDEX "chore_instances_household_id_status_idx" ON "chore_instances"("household_id", "status");

-- CreateIndex
CREATE INDEX "chore_instances_assigned_to_status_idx" ON "chore_instances"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "expenses_household_id_idx" ON "expenses"("household_id");

-- CreateIndex
CREATE INDEX "expense_splits_expense_id_idx" ON "expense_splits"("expense_id");

-- CreateIndex
CREATE INDEX "expense_splits_member_id_idx" ON "expense_splits"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_splits_expense_id_member_id_key" ON "expense_splits"("expense_id", "member_id");

-- CreateIndex
CREATE INDEX "settlements_household_id_from_member_idx" ON "settlements"("household_id", "from_member");

-- CreateIndex
CREATE INDEX "settlements_household_id_to_member_idx" ON "settlements"("household_id", "to_member");

-- CreateIndex
CREATE INDEX "announcements_household_id_idx" ON "announcements"("household_id");

-- CreateIndex
CREATE INDEX "announcement_reactions_announcement_id_idx" ON "announcement_reactions"("announcement_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reactions_announcement_id_member_id_emoji_key" ON "announcement_reactions"("announcement_id", "member_id", "emoji");

-- CreateIndex
CREATE INDEX "proposals_household_id_status_idx" ON "proposals"("household_id", "status");

-- CreateIndex
CREATE INDEX "votes_proposal_id_idx" ON "votes"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_proposal_id_member_id_key" ON "votes"("proposal_id", "member_id");

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_history" ADD CONSTRAINT "admin_history_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_history" ADD CONSTRAINT "admin_history_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_history" ADD CONSTRAINT "admin_history_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_templates" ADD CONSTRAINT "chore_templates_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_templates" ADD CONSTRAINT "chore_templates_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_templates" ADD CONSTRAINT "chore_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "chore_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_from_member_fkey" FOREIGN KEY ("from_member") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_to_member_fkey" FOREIGN KEY ("to_member") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reactions" ADD CONSTRAINT "announcement_reactions_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reactions" ADD CONSTRAINT "announcement_reactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_target_member_id_fkey" FOREIGN KEY ("target_member_id") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- =============================================================================
-- PARTIAL UNIQUE INDEXES (Prisma cannot express WHERE clauses)
-- =============================================================================

-- D24: A user can only be an active member of ONE household at a time
CREATE UNIQUE INDEX "idx_members_one_active_household"
  ON "household_members" ("user_id")
  WHERE "left_at" IS NULL;

-- Prevent duplicate active memberships in the same household
CREATE UNIQUE INDEX "idx_members_no_duplicate_active"
  ON "household_members" ("household_id", "user_id")
  WHERE "left_at" IS NULL;

-- D27: Idempotency guard for chore instance batch generation
CREATE UNIQUE INDEX "idx_chore_instances_no_dupes"
  ON "chore_instances" ("template_id", "due_date")
  WHERE "status" = 'pending';

-- D11: Only one active admin-election proposal per household
CREATE UNIQUE INDEX "idx_proposals_one_active_election"
  ON "proposals" ("household_id")
  WHERE "type" = 'elect_admin' AND "status" = 'active';

-- =============================================================================
-- PARTIAL PERFORMANCE INDEXES (data plan Section 6)
-- =============================================================================

-- D29: Unassigned chores board
CREATE INDEX "idx_chore_instances_unassigned"
  ON "chore_instances" ("household_id")
  WHERE "assigned_to" IS NULL AND "status" = 'pending';

-- Expense calendar/list (non-deleted only)
CREATE INDEX "idx_expenses_calendar"
  ON "expenses" ("household_id", "expense_date")
  WHERE "deleted_at" IS NULL;

-- Expense category filter (non-deleted only)
CREATE INDEX "idx_expenses_category"
  ON "expenses" ("household_id", "category")
  WHERE "deleted_at" IS NULL;

-- Announcements feed (pinned first, then chronological, non-deleted only)
CREATE INDEX "idx_announcements_feed"
  ON "announcements" ("household_id", "is_pinned" DESC, "created_at" DESC)
  WHERE "deleted_at" IS NULL;

-- Active household members only
CREATE INDEX "idx_members_active"
  ON "household_members" ("household_id")
  WHERE "left_at" IS NULL;

-- Active chore templates (for batch generation)
CREATE INDEX "idx_templates_active"
  ON "chore_templates" ("household_id")
  WHERE "deleted_at" IS NULL;

-- =============================================================================
-- CHECK CONSTRAINTS
-- =============================================================================

ALTER TABLE "expenses"
  ADD CONSTRAINT "chk_expenses_amount_positive"
  CHECK ("amount" > 0);

ALTER TABLE "expense_splits"
  ADD CONSTRAINT "chk_expense_splits_amount_positive"
  CHECK ("amount" > 0);

ALTER TABLE "settlements"
  ADD CONSTRAINT "chk_settlements_amount_positive"
  CHECK ("amount" > 0);

ALTER TABLE "settlements"
  ADD CONSTRAINT "chk_settlements_different_members"
  CHECK ("from_member" != "to_member");

ALTER TABLE "announcements"
  ADD CONSTRAINT "chk_announcements_content_not_empty"
  CHECK (length("content") > 0);

-- =============================================================================
-- CALENDAR EVENTS VIEW (D28)
-- =============================================================================

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

-- Proposal deadlines (only active)
SELECT
  p."id" AS event_id,
  p."household_id",
  'proposal'::text AS event_type,
  p."title" AS event_title,
  p."voting_deadline"::date AS event_date,
  p."status"::text AS event_status,
  p."created_by" AS related_member_id,
  NULL::integer AS metadata_int,
  NULL::decimal AS metadata_decimal
FROM "proposals" p
WHERE p."status" = 'active';

-- =============================================================================
-- SUPABASE AUTH TRIGGER: sync auth.users → public.users
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_updated();

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- ---- USERS ----
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON "users" FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_select_household_members"
  ON "users" FOR SELECT
  USING (
    id IN (
      SELECT hm2.user_id FROM household_members hm2
      WHERE hm2.household_id IN (
        SELECT hm1.household_id FROM household_members hm1
        WHERE hm1.user_id = auth.uid() AND hm1.left_at IS NULL
      )
    )
  );

CREATE POLICY "users_update_own"
  ON "users" FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---- HOUSEHOLDS ----
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "households_select_member"
  ON "households" FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "households_insert_authenticated"
  ON "households" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "households_update_admin"
  ON "households" FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND left_at IS NULL
    )
  );

-- ---- HOUSEHOLD_MEMBERS ----
ALTER TABLE "household_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_members_select"
  ON "household_members" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "household_members_insert_self"
  ON "household_members" FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "household_members_update_self"
  ON "household_members" FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "household_members_update_admin"
  ON "household_members" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND left_at IS NULL
    )
  );

-- ---- ADMIN_HISTORY ----
ALTER TABLE "admin_history" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_history_select_member"
  ON "admin_history" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- CHORE_TEMPLATES ----
ALTER TABLE "chore_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chore_templates_select_member"
  ON "chore_templates" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "chore_templates_insert_member"
  ON "chore_templates" FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "chore_templates_update_member"
  ON "chore_templates" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- CHORE_INSTANCES ----
ALTER TABLE "chore_instances" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chore_instances_select_member"
  ON "chore_instances" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "chore_instances_insert_member"
  ON "chore_instances" FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "chore_instances_update_member"
  ON "chore_instances" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- EXPENSES ----
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_member"
  ON "expenses" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "expenses_insert_member"
  ON "expenses" FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "expenses_update_member"
  ON "expenses" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- EXPENSE_SPLITS ----
ALTER TABLE "expense_splits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_splits_select_member"
  ON "expense_splits" FOR SELECT
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      WHERE e.household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

CREATE POLICY "expense_splits_insert_member"
  ON "expense_splits" FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e
      WHERE e.household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

-- ---- SETTLEMENTS ----
ALTER TABLE "settlements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_select_member"
  ON "settlements" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "settlements_insert_member"
  ON "settlements" FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "settlements_update_member"
  ON "settlements" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- ANNOUNCEMENTS ----
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_member"
  ON "announcements" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "announcements_insert_member"
  ON "announcements" FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "announcements_update_member"
  ON "announcements" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- ANNOUNCEMENT_REACTIONS ----
ALTER TABLE "announcement_reactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcement_reactions_select_member"
  ON "announcement_reactions" FOR SELECT
  USING (
    announcement_id IN (
      SELECT a.id FROM announcements a
      WHERE a.household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

CREATE POLICY "announcement_reactions_insert_member"
  ON "announcement_reactions" FOR INSERT
  WITH CHECK (
    announcement_id IN (
      SELECT a.id FROM announcements a
      WHERE a.household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

CREATE POLICY "announcement_reactions_delete_own"
  ON "announcement_reactions" FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- PROPOSALS ----
ALTER TABLE "proposals" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_select_member"
  ON "proposals" FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "proposals_insert_member"
  ON "proposals" FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "proposals_update_member"
  ON "proposals" FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- ---- VOTES ----
ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes_select_member"
  ON "votes" FOR SELECT
  USING (
    proposal_id IN (
      SELECT p.id FROM proposals p
      WHERE p.household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

CREATE POLICY "votes_insert_member"
  ON "votes" FOR INSERT
  WITH CHECK (
    proposal_id IN (
      SELECT p.id FROM proposals p
      WHERE p.household_id IN (
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

-- =============================================================================
-- SUPABASE REALTIME (D19)
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE "chore_instances";
ALTER PUBLICATION supabase_realtime ADD TABLE "votes";
ALTER PUBLICATION supabase_realtime ADD TABLE "proposals";
ALTER PUBLICATION supabase_realtime ADD TABLE "announcements";
ALTER PUBLICATION supabase_realtime ADD TABLE "announcement_reactions";
ALTER PUBLICATION supabase_realtime ADD TABLE "expenses";
ALTER PUBLICATION supabase_realtime ADD TABLE "settlements";
ALTER PUBLICATION supabase_realtime ADD TABLE "household_members";
