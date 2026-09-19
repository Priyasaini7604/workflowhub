/**
 * LifecycleStepper
 * -----------------
 * Visual stepper/timeline for an Employee's lifecycle stage.
 * Uses inline styles to match EmployeeDetailPage's existing tokens
 * (background #0a1628, border #1e293b, primary #3b82f6, muted #64748b)
 * rather than Tailwind classes, so it doesn't add to the CSS-mixing
 * issue already flagged in review.
 *
 * Backend source of truth: Employee.current_status
 *   candidate -> offer_sent -> joining_pending -> onboarding
 *   -> active -> notice_period -> offboarding -> exited
 *
 * Usage:
 *   <LifecycleStepper currentStatus={employee?.current_status} isArchived={employee?.is_archived} />
 *   <LifecycleStepper currentStatus={employee?.current_status} variant="compact" />
 */

const STAGES = [
  { key: "candidate", label: "Candidate" },
  { key: "offer_sent", label: "Offer Sent" },
  { key: "joining_pending", label: "Joining" },
  { key: "onboarding", label: "Onboarding" },
  { key: "active", label: "Active" },
  { key: "notice_period", label: "Notice Period" },
  { key: "offboarding", label: "Offboarding" },
  { key: "exited", label: "Exited" },
];

// Stages that should read as "caution / transitional" rather than plain progress
const WARNING_STAGES = new Set(["notice_period", "offboarding"]);
const TERMINAL_STAGE = "exited";

const COLORS = {
  done: "#3b82f6",
  doneBg: "#1e3a5f",
  current: "#3b82f6",
  currentBg: "#1e3a5f",
  warning: "#f59e0b",
  warningBg: "#451a03",
  terminal: "#64748b",
  terminalBg: "#1e293b",
  upcoming: "#334155",
  upcomingBg: "transparent",
  lineDone: "#3b82f6",
  lineUpcoming: "#1e293b",
  labelDone: "#f1f5f9",
  labelCurrent: "#f1f5f9",
  labelUpcoming: "#475569",
  labelTerminal: "#94a3b8",
};

function getStageIndex(status) {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function getStepState(stepIndex, currentIndex, isTerminal) {
  if (isTerminal) return "terminal";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

function dotStyle(state, isWarningCurrent, size) {
  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 600,
    flexShrink: 0,
    border: "2px solid",
    boxSizing: "border-box",
  };
  if (state === "terminal") {
    return { ...base, background: COLORS.terminalBg, borderColor: COLORS.terminal, color: "#cbd5e1" };
  }
  if (state === "done") {
    return { ...base, background: COLORS.doneBg, borderColor: COLORS.done, color: "#eff6ff" };
  }
  if (state === "current") {
    return isWarningCurrent
      ? { ...base, background: COLORS.warningBg, borderColor: COLORS.warning, color: "#fef3c7", boxShadow: "0 0 0 4px rgba(245,158,11,0.15)" }
      : { ...base, background: COLORS.currentBg, borderColor: COLORS.current, color: "#eff6ff", boxShadow: "0 0 0 4px rgba(59,130,246,0.15)" };
  }
  return { ...base, background: COLORS.upcomingBg, borderColor: COLORS.upcoming, color: "#475569" };
}

function labelColor(state, isWarningCurrent) {
  if (state === "terminal") return COLORS.labelTerminal;
  if (state === "done") return COLORS.labelDone;
  if (state === "current") return isWarningCurrent ? COLORS.warning : COLORS.labelCurrent;
  return COLORS.labelUpcoming;
}

function lineColor(state) {
  return state === "done" || state === "terminal" ? COLORS.lineDone : COLORS.lineUpcoming;
}

function stepGlyph(state, stepKey) {
  if (state === "terminal" && stepKey === "exited") return "✕";
  if (state === "done") return "✓";
  if (state === "current" && WARNING_STAGES.has(stepKey)) return "!";
  if (state === "current") return "•";
  return "";
}

export default function LifecycleStepper({ currentStatus, isArchived = false, variant = "full" }) {
  const currentIndex = getStageIndex(currentStatus);
  const isTerminal = currentStatus === TERMINAL_STAGE;
  const currentStage = STAGES[currentIndex];

  if (variant === "compact") {
    const pct = Math.max(Math.round((currentIndex / (STAGES.length - 1)) * 100), 6);
    const isWarning = WARNING_STAGES.has(currentStatus);
    const barColor = isTerminal ? COLORS.terminal : isWarning ? COLORS.warning : COLORS.done;

    return (
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: isTerminal ? COLORS.labelTerminal : isWarning ? COLORS.warning : "#3b82f6" }}>
            {currentStage.label}
          </span>
          {isArchived && (
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "1px 6px", borderRadius: "4px", background: "#1e293b", color: "#94a3b8" }}>
              Archived
            </span>
          )}
        </div>
        <div style={{ height: "5px", width: "100%", borderRadius: "999px", background: "#1e293b", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: "999px", background: barColor, transition: "width 0.3s" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>🔄 Lifecycle Progress</h3>
        {isArchived && (
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "2px 8px", borderRadius: "6px", background: "#1e293b", color: "#94a3b8", border: "0.5px solid #334155" }}>
            Archived
          </span>
        )}
      </div>

      {/* Horizontal row, wraps naturally on small screens */}
      <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", rowGap: "20px" }}>
        {STAGES.map((stage, i) => {
          const state = getStepState(i, currentIndex, isTerminal);
          const isWarningCurrent = state === "current" && WARNING_STAGES.has(stage.key);
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.key} style={{ display: "flex", alignItems: "flex-start", flex: isLast ? "0 0 auto" : "1 1 90px", minWidth: "70px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px" }}>
                <div style={dotStyle(state, isWarningCurrent, 26)}>{stepGlyph(state, stage.key)}</div>
                <span style={{ marginTop: "8px", fontSize: "11px", textAlign: "center", lineHeight: 1.3, color: labelColor(state, isWarningCurrent), fontWeight: state === "current" ? 600 : 400 }}>
                  {stage.label}
                </span>
              </div>
              {!isLast && (
                <div style={{ height: "2px", flex: 1, marginTop: "13px", marginLeft: "4px", marginRight: "4px", borderRadius: "2px", background: lineColor(state), minWidth: "16px" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}