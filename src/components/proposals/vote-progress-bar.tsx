"use client";

interface VoteProgressBarProps {
  yesCount: number;
  noCount: number;
  eligibleVoterCount: number;
  participationThreshold: number;
}

export function VoteProgressBar({
  yesCount,
  noCount,
  eligibleVoterCount,
  participationThreshold,
}: VoteProgressBarProps) {
  const totalVotes = yesCount + noCount;
  const remaining = eligibleVoterCount - totalVotes;

  const yesPct =
    eligibleVoterCount > 0 ? (yesCount / eligibleVoterCount) * 100 : 0;
  const noPct =
    eligibleVoterCount > 0 ? (noCount / eligibleVoterCount) * 100 : 0;
  const remainPct =
    eligibleVoterCount > 0 ? (remaining / eligibleVoterCount) * 100 : 100;

  // Quorum line position
  const quorumPct = participationThreshold * 100;

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="relative h-3 rounded-full bg-surface-secondary overflow-hidden">
        {/* Yes */}
        {yesPct > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-success rounded-l-full transition-all duration-500"
            style={{ width: `${yesPct}%` }}
          />
        )}
        {/* No */}
        {noPct > 0 && (
          <div
            className="absolute inset-y-0 bg-error transition-all duration-500"
            style={{ left: `${yesPct}%`, width: `${noPct}%` }}
          />
        )}
        {/* Quorum indicator line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-text-muted/60 z-10"
          style={{ left: `${quorumPct}%` }}
          title={`Quorum: ${Math.round(quorumPct)}% participation needed`}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          {yesCount} Yes
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-error inline-block" />
          {noCount} No
        </span>
        {remaining > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-surface-secondary inline-block border border-border-light" />
            {remaining} Remaining
          </span>
        )}
        <span className="ml-auto text-text-muted/60">
          Quorum: {Math.round(quorumPct)}%
        </span>
      </div>
    </div>
  );
}
