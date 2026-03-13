"use client";

import { Star, Check, PaperPlaneTilt, TrendUp, TrendDown, Minus, Fire, Timer } from "@phosphor-icons/react";

/* ── Fake data for demos ─────────────────────────────────────────── */
const CHORES = [
  { title: "Take out trash", member: "Alice", points: 5, done: false },
  { title: "Wash dishes", member: "Bob", points: 3, done: true },
  { title: "Vacuum living room", member: "Alice", points: 4, done: false },
  { title: "Clean bathroom", member: "Charlie", points: 6, done: true },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [10, 11, 12, 13, 14, 15, 16];
const TODAY_IDX = 3; // Thursday 13

/* ── Reusable chip renderer ──────────────────────────────────────── */
function Chip({
  title,
  member,
  points,
  done,
  completedStyle,
}: {
  title: string;
  member: string;
  points: number;
  done: boolean;
  completedStyle: string;
}) {
  const baseStyle = "bg-[#6FA4AF1A] text-[#6FA4AF] border-[#6FA4AF33]";
  return (
    <div
      className={`text-xs px-2 py-1.5 rounded-lg border truncate ${baseStyle} ${
        done ? completedStyle : ""
      }`}
    >
      <div className="flex items-center gap-1 min-w-0">
        {done && <Check className="w-3 h-3 flex-shrink-0" />}
        <span className="truncate font-medium">{title}</span>
        <span className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          <Star className="w-2.5 h-2.5" />
          {points}
        </span>
      </div>
      <p className="truncate opacity-70 mt-0.5">{member}</p>
    </div>
  );
}

/* ── Mini calendar column ────────────────────────────────────────── */
function CalendarCol({
  dayName,
  dayNum,
  isToday,
  headerBg,
  cellBg,
  headerText,
  events,
  completedStyle,
}: {
  dayName: string;
  dayNum: number;
  isToday: boolean;
  headerBg: string;
  cellBg: string;
  headerText: string;
  events: typeof CHORES;
  completedStyle: string;
}) {
  return (
    <div className={`flex flex-col ${cellBg}`}>
      <div
        className={`px-2 py-2 text-center border-b border-[#E5E7EB] ${headerBg}`}
      >
        <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">
          {dayName}
        </p>
        <p className={`text-lg font-bold ${headerText}`}>{dayNum}</p>
      </div>
      <div className="flex-1 p-1.5 space-y-1 min-h-[140px]">
        {events.map((e, i) => (
          <Chip key={i} {...e} completedStyle={completedStyle} />
        ))}
      </div>
    </div>
  );
}

/* ── Feed textbox demo ───────────────────────────────────────────── */
function FeedDemo({
  label,
  containerCls,
  textareaCls,
  btnCls,
}: {
  label: string;
  containerCls: string;
  textareaCls: string;
  btnCls: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#1E293B] mb-2">{label}</h4>
      <div className={`rounded-xl border p-4 ${containerCls}`}>
        <textarea
          readOnly
          placeholder="Share an update with your household..."
          rows={2}
          className={`w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder:text-[#94A3B8] focus:outline-none ${textareaCls}`}
        />
        <div className="flex justify-end mt-2">
          <button
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white ${btnCls}`}
          >
            <PaperPlaneTilt size={14} weight="fill" /> Post
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ───────────────────────────────────────────────────── */
export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#F4E9D7] p-6 space-y-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#1E293B] font-heading">
          Design Proposals
        </h1>
        <p className="text-[#64748B] mt-1">
          Compare color options for calendar &quot;today&quot; highlight,
          completed task visibility, and feed textbox styling.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  SECTION 1: Calendar Today Highlight                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-bold text-[#1E293B] mb-1">
          1. Calendar &quot;Today&quot; Highlight
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          Current: teal (bg-primary-light). Proposals use sage and terracotta.
        </p>

        <div className="space-y-6">
          {/* Option A: Current (Teal) */}
          <div>
            <h3 className="text-sm font-semibold text-[#6FA4AF] mb-2">
              A) Current — Teal
            </h3>
            <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-[#E5E7EB] bg-white">
              {DAYS.map((day, i) => (
                <CalendarCol
                  key={day}
                  dayName={day}
                  dayNum={DATES[i]}
                  isToday={i === TODAY_IDX}
                  headerBg={
                    i === TODAY_IDX ? "bg-[#6FA4AF1A]" : "bg-[#B8C4A91A]"
                  }
                  cellBg={i === TODAY_IDX ? "bg-[#6FA4AF0D]" : "bg-white"}
                  headerText={
                    i === TODAY_IDX ? "text-[#6FA4AF]" : "text-[#1E293B]"
                  }
                  events={i === TODAY_IDX ? CHORES : i % 2 === 0 ? CHORES.slice(0, 2) : []}
                  completedStyle="opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Option B: Sage */}
          <div>
            <h3 className="text-sm font-semibold text-[#7A8A6E] mb-2">
              B) Sage (#B8C4A9) — Soft & natural
            </h3>
            <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-[#E5E7EB] bg-white">
              {DAYS.map((day, i) => (
                <CalendarCol
                  key={day}
                  dayName={day}
                  dayNum={DATES[i]}
                  isToday={i === TODAY_IDX}
                  headerBg={
                    i === TODAY_IDX ? "bg-[#B8C4A940]" : "bg-[#B8C4A91A]"
                  }
                  cellBg={i === TODAY_IDX ? "bg-[#B8C4A920]" : "bg-white"}
                  headerText={
                    i === TODAY_IDX ? "text-[#6B7D5E]" : "text-[#1E293B]"
                  }
                  events={i === TODAY_IDX ? CHORES : i % 2 === 0 ? CHORES.slice(0, 2) : []}
                  completedStyle="opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Option C: Terracotta */}
          <div>
            <h3 className="text-sm font-semibold text-[#D97D55] mb-2">
              C) Terracotta (#D97D55) — Warm & attention-grabbing
            </h3>
            <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-[#E5E7EB] bg-white">
              {DAYS.map((day, i) => (
                <CalendarCol
                  key={day}
                  dayName={day}
                  dayNum={DATES[i]}
                  isToday={i === TODAY_IDX}
                  headerBg={
                    i === TODAY_IDX ? "bg-[#D97D5530]" : "bg-[#B8C4A91A]"
                  }
                  cellBg={i === TODAY_IDX ? "bg-[#D97D5515]" : "bg-white"}
                  headerText={
                    i === TODAY_IDX ? "text-[#C06A42]" : "text-[#1E293B]"
                  }
                  events={i === TODAY_IDX ? CHORES : i % 2 === 0 ? CHORES.slice(0, 2) : []}
                  completedStyle="opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Option D: Gold */}
          <div>
            <h3 className="text-sm font-semibold text-[#C9971E] mb-2">
              D) Gold (#E9B63B) — Bright & cheerful
            </h3>
            <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-[#E5E7EB] bg-white">
              {DAYS.map((day, i) => (
                <CalendarCol
                  key={day}
                  dayName={day}
                  dayNum={DATES[i]}
                  isToday={i === TODAY_IDX}
                  headerBg={
                    i === TODAY_IDX ? "bg-[#E9B63B30]" : "bg-[#B8C4A91A]"
                  }
                  cellBg={i === TODAY_IDX ? "bg-[#E9B63B15]" : "bg-white"}
                  headerText={
                    i === TODAY_IDX ? "text-[#B8941E]" : "text-[#1E293B]"
                  }
                  events={i === TODAY_IDX ? CHORES : i % 2 === 0 ? CHORES.slice(0, 2) : []}
                  completedStyle="opacity-50"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  SECTION 2: Completed Task Styling                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-bold text-[#1E293B] mb-1">
          2. Completed Task Visibility
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          Current: opacity-50 makes done tasks too faint. Here are clearer
          alternatives.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* A: Current (opacity-50) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">
              A) Current — opacity-50
            </h4>
            <div className="space-y-2">
              {CHORES.map((c, i) => (
                <Chip key={i} {...c} completedStyle="opacity-50" />
              ))}
            </div>
          </div>

          {/* B: opacity-70 (more visible) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">
              B) opacity-70 — More visible
            </h4>
            <div className="space-y-2">
              {CHORES.map((c, i) => (
                <Chip key={i} {...c} completedStyle="opacity-70" />
              ))}
            </div>
          </div>

          {/* C: Sage/green tint for completed */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">
              C) Green tint — Success feel
            </h4>
            <div className="space-y-2">
              {CHORES.map((c, i) => (
                <Chip
                  key={i}
                  {...c}
                  completedStyle="!bg-[#B8C4A930] !text-[#5C7A4A] !border-[#B8C4A960]"
                />
              ))}
            </div>
          </div>

          {/* D: Strikethrough + lighter */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">
              D) Strikethrough + opacity-70
            </h4>
            <div className="space-y-2">
              {CHORES.map((c, i) => (
                <Chip
                  key={i}
                  {...c}
                  completedStyle="opacity-70 line-through"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  SECTION 3: Feed Textbox Styling                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-bold text-[#1E293B] mb-1">
          3. Feed Textbox Color
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          Current: white container with cream textarea. Proposals add warmth.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* A: Current */}
          <FeedDemo
            label="A) Current — White + Cream"
            containerCls="bg-white border-[#E5E7EB]"
            textareaCls="bg-[#F4E9D7] border-[#E5E7EB] text-[#1E293B]"
            btnCls="bg-[#6FA4AF] hover:bg-[#5B8F9A]"
          />

          {/* B: Sage tinted */}
          <FeedDemo
            label="B) Sage tint — Natural & calm"
            containerCls="bg-[#B8C4A918] border-[#B8C4A940]"
            textareaCls="bg-white border-[#B8C4A940] text-[#1E293B]"
            btnCls="bg-[#6FA4AF] hover:bg-[#5B8F9A]"
          />

          {/* C: Warm cream container */}
          <FeedDemo
            label="C) Warm cream — Cozy feel"
            containerCls="bg-[#F4E9D7] border-[#D9C9AA]"
            textareaCls="bg-white border-[#E5E7EB] text-[#1E293B]"
            btnCls="bg-[#D97D55] hover:bg-[#C06A42]"
          />

          {/* D: Terracotta accent border */}
          <FeedDemo
            label="D) Terracotta accent — Warm & distinct"
            containerCls="bg-white border-[#D97D5540] border-l-[3px] border-l-[#D97D55]"
            textareaCls="bg-[#FDF8F4] border-[#E5E7EB] text-[#1E293B]"
            btnCls="bg-[#D97D55] hover:bg-[#C06A42]"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  SECTION 4: Weekly Trend Card States                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-bold text-[#1E293B] mb-1">
          4. Weekly Trend Card — All States
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          The third stat card on My Page shows week-over-week point comparison.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Positive */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[#B8C4A9]/15 p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-[#16A34A] mb-3 uppercase tracking-wider">Points Up</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B8C4A91A] rounded-lg flex items-center justify-center">
                <TrendUp className="w-4 h-4 text-[#16A34A]" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">+3 pts</p>
                <p className="text-sm text-[#64748B]">
                  vs last week <span className="text-[#94A3B8]">(8 pts)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Negative */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[#B8C4A9]/15 p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-[#DC2626] mb-3 uppercase tracking-wider">Points Down</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B8C4A91A] rounded-lg flex items-center justify-center">
                <TrendDown className="w-4 h-4 text-[#DC2626]" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">-2 pts</p>
                <p className="text-sm text-[#64748B]">
                  vs last week <span className="text-[#94A3B8]">(3 pts)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Same */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[#B8C4A9]/15 p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">No Change</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B8C4A91A] rounded-lg flex items-center justify-center">
                <Minus className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">Same</p>
                <p className="text-sm text-[#64748B]">
                  vs last week <span className="text-[#94A3B8]">(5 pts)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full row of all 3 stat cards together */}
        <h3 className="text-sm font-semibold text-[#1E293B] mt-6 mb-3">Full row preview (as it appears on My Page):</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Streak */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[#D97D55]/15 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D97D551A] rounded-lg flex items-center justify-center">
                <Fire className="w-4 h-4 text-[#D97D55]" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">3 <span className="text-base font-normal text-[#64748B]">days</span></p>
                <p className="text-sm text-[#64748B]">My streak</p>
              </div>
            </div>
          </div>

          {/* On-time rate */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[#6FA4AF]/15 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6FA4AF1A] rounded-lg flex items-center justify-center">
                <Timer className="w-4 h-4 text-[#6FA4AF]" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">100%</p>
                <p className="text-sm text-[#64748B]">On-time rate (5/5)</p>
              </div>
            </div>
          </div>

          {/* Trend — negative example */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[#B8C4A9]/15 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B8C4A91A] rounded-lg flex items-center justify-center">
                <TrendDown className="w-4 h-4 text-[#DC2626]" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">-2 pts</p>
                <p className="text-sm text-[#64748B]">
                  vs last week <span className="text-[#94A3B8]">(3 pts)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center text-sm text-[#94A3B8] pb-8">
        Pick your preferred option for each section and I&apos;ll apply them.
      </footer>
    </div>
  );
}
