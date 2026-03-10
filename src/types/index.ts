import type { Database } from "./database.types";

// ---- Table Row types (returned by SELECT queries) ----
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Household = Database["public"]["Tables"]["households"]["Row"];
export type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];
export type AdminHistory = Database["public"]["Tables"]["admin_history"]["Row"];
export type ChoreTemplate = Database["public"]["Tables"]["chore_templates"]["Row"];
export type ChoreInstance = Database["public"]["Tables"]["chore_instances"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Row"];
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementReaction = Database["public"]["Tables"]["announcement_reactions"]["Row"];
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];

// ---- Insert types (for creating new rows) ----
export type HouseholdInsert = Database["public"]["Tables"]["households"]["Insert"];
export type HouseholdMemberInsert = Database["public"]["Tables"]["household_members"]["Insert"];
export type ChoreTemplateInsert = Database["public"]["Tables"]["chore_templates"]["Insert"];
export type ChoreInstanceInsert = Database["public"]["Tables"]["chore_instances"]["Insert"];
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
export type ExpenseSplitInsert = Database["public"]["Tables"]["expense_splits"]["Insert"];
export type SettlementInsert = Database["public"]["Tables"]["settlements"]["Insert"];
export type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];
export type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"];
export type VoteInsert = Database["public"]["Tables"]["votes"]["Insert"];

// ---- Update types (for patching rows) ----
export type HouseholdUpdate = Database["public"]["Tables"]["households"]["Update"];
export type HouseholdMemberUpdate = Database["public"]["Tables"]["household_members"]["Update"];
export type ChoreTemplateUpdate = Database["public"]["Tables"]["chore_templates"]["Update"];
export type ChoreInstanceUpdate = Database["public"]["Tables"]["chore_instances"]["Update"];
export type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];
export type AnnouncementUpdate = Database["public"]["Tables"]["announcements"]["Update"];
export type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];

// ---- View types ----
export type CalendarEvent = Database["public"]["Views"]["calendar_events"]["Row"];

// ---- Enum types ----
export type MemberRole = Database["public"]["Enums"]["MemberRole"];
export type AdminHistoryReason = Database["public"]["Enums"]["AdminHistoryReason"];
export type Recurrence = Database["public"]["Enums"]["Recurrence"];
export type ChoreStatus = Database["public"]["Enums"]["ChoreStatus"];
export type SplitType = Database["public"]["Enums"]["SplitType"];
export type ProposalType = Database["public"]["Enums"]["ProposalType"];
export type ProposalStatus = Database["public"]["Enums"]["ProposalStatus"];
export type VoteChoice = Database["public"]["Enums"]["VoteChoice"];

// ---- Re-export Database for use in client generics ----
export type { Database };
