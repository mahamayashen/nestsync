import {
  PrismaClient,
  MemberRole,
  Recurrence,
  ChoreStatus,
  SplitType,
  ProposalType,
  ProposalStatus,
  VoteChoice,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // NOTE: In production, users are created via the Supabase Auth trigger
  // (handle_new_user). For seeding, we create them directly.

  // 1. Create users
  const alice = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "alice@example.com",
      displayName: "Alice",
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000002",
      email: "bob@example.com",
      displayName: "Bob",
    },
  });

  const charlie = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000003",
      email: "charlie@example.com",
      displayName: "Charlie",
    },
  });

  // 2. Create household
  const household = await prisma.household.create({
    data: {
      name: "Apartment 4B",
      inviteCode: "A3K9M2X1",
      createdById: alice.id,
      timezone: "America/New_York",
    },
  });

  // 3. Create members (Alice is admin — household creator)
  const aliceMember = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      userId: alice.id,
      role: MemberRole.admin,
    },
  });

  const bobMember = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      userId: bob.id,
      role: MemberRole.member,
    },
  });

  const charlieMember = await prisma.householdMember.create({
    data: {
      householdId: household.id,
      userId: charlie.id,
      role: MemberRole.member,
    },
  });

  // 4. Admin history — Alice is the founding admin
  await prisma.adminHistory.create({
    data: {
      householdId: household.id,
      memberId: aliceMember.id,
      reason: "household_created",
    },
  });

  // 5. Chore templates
  const kitchenChore = await prisma.choreTemplate.create({
    data: {
      householdId: household.id,
      title: "Clean kitchen",
      description: "Wipe counters, wash dishes, sweep floor",
      points: 3,
      recurrence: Recurrence.weekly,
      assignedToId: bobMember.id,
      createdById: aliceMember.id,
    },
  });

  const trashChore = await prisma.choreTemplate.create({
    data: {
      householdId: household.id,
      title: "Take out trash",
      points: 1,
      recurrence: Recurrence.daily,
      assignedToId: charlieMember.id,
      createdById: aliceMember.id,
    },
  });

  // 6. Chore instances (batch-generated for next few days)
  await prisma.choreInstance.create({
    data: {
      templateId: kitchenChore.id,
      householdId: household.id,
      title: "Clean kitchen",
      points: 3,
      assignedToId: bobMember.id,
      dueDate: new Date("2026-03-15"),
      status: ChoreStatus.pending,
    },
  });

  // A completed chore — Bob completed it
  await prisma.choreInstance.create({
    data: {
      templateId: kitchenChore.id,
      householdId: household.id,
      title: "Clean kitchen",
      points: 3,
      assignedToId: bobMember.id,
      dueDate: new Date("2026-03-08"),
      status: ChoreStatus.completed,
      completedAt: new Date("2026-03-08T14:30:00Z"),
      completedById: bobMember.id,
    },
  });

  // A chore completed by someone other than the assignee (D23)
  await prisma.choreInstance.create({
    data: {
      templateId: trashChore.id,
      householdId: household.id,
      title: "Take out trash",
      points: 1,
      assignedToId: charlieMember.id,
      dueDate: new Date("2026-03-09"),
      status: ChoreStatus.completed,
      completedAt: new Date("2026-03-09T08:00:00Z"),
      completedById: aliceMember.id, // Alice did it for Charlie
    },
  });

  // 7. Expense with splits (D20: payer NOT in splits)
  const internetBill = await prisma.expense.create({
    data: {
      householdId: household.id,
      title: "March internet bill",
      amount: 90.0,
      paidById: aliceMember.id,
      splitType: SplitType.equal,
      category: "utilities",
      expenseDate: new Date("2026-03-01"),
    },
  });

  // Alice paid $90, split with herself + Bob + Charlie = $30 each
  // Only Bob and Charlie appear in splits (payer excluded, D20)
  await prisma.expenseSplit.createMany({
    data: [
      { expenseId: internetBill.id, memberId: bobMember.id, amount: 30.0 },
      {
        expenseId: internetBill.id,
        memberId: charlieMember.id,
        amount: 30.0,
      },
    ],
  });

  // Groceries — exact split mode
  const groceries = await prisma.expense.create({
    data: {
      householdId: household.id,
      title: "Weekly groceries",
      amount: 85.5,
      paidById: bobMember.id,
      splitType: SplitType.exact,
      category: "groceries",
      expenseDate: new Date("2026-03-05"),
    },
  });

  await prisma.expenseSplit.createMany({
    data: [
      { expenseId: groceries.id, memberId: aliceMember.id, amount: 40.0 },
      { expenseId: groceries.id, memberId: charlieMember.id, amount: 30.0 },
      // Bob absorbs the remaining $15.50 as the payer
    ],
  });

  // 8. Settlement — Charlie paid Alice back for internet
  await prisma.settlement.create({
    data: {
      householdId: household.id,
      fromMemberId: charlieMember.id,
      toMemberId: aliceMember.id,
      amount: 30.0,
      note: "Venmo for internet bill",
    },
  });

  // 9. Announcements
  await prisma.announcement.create({
    data: {
      householdId: household.id,
      authorId: aliceMember.id,
      content:
        "Welcome to Apartment 4B! Please check the chore board and keep track of shared expenses.",
      isPinned: true,
    },
  });

  await prisma.announcement.create({
    data: {
      householdId: household.id,
      authorId: bobMember.id,
      content: "I'll be out of town next weekend. Can someone cover my chores?",
    },
  });

  console.log("Seed data created successfully.");
  console.log(`  Household: ${household.name} (${household.inviteCode})`);
  console.log(`  Members: Alice (admin), Bob, Charlie`);
  console.log(`  Chore templates: 2, instances: 3`);
  console.log(`  Expenses: 2, settlements: 1`);
  console.log(`  Announcements: 2 (1 pinned)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
