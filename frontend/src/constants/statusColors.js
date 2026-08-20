// Single source of truth for status badge colors across the app.
// Import this instead of redefining statusColors locally in each page.

export const statusColors = {
  // employee / lifecycle
    // employee / lifecycle
  candidate: { bg: "var(--color-border)", text: "var(--color-text-faint)" },
  offer_sent: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  joining_pending: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  onboarding: { bg: "var(--color-accent-bg)", text: "var(--color-accent)" },
  active: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  notice_period: { bg: "var(--color-warning-bg-alt)", text: "var(--color-warning-text-alt)" },
  offboarding: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },
  exited: { bg: "var(--color-border)", text: "var(--color-text-faint)" },
  inactive: { bg: "var(--color-border)", text: "var(--color-text-faint)" },
  on_leave: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },

  // onboarding / offboarding
  pending: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  in_progress: { bg: "var(--color-accent-bg)", text: "var(--color-accent)" },
  scheduled: { bg: "var(--color-accent-bg)", text: "var(--color-accent)" },
  completed: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  verified: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  rejected: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text)" },
  failed: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text)" },
  waived: { bg: "var(--color-border)", text: "var(--color-text-faint)" },

  // assets
  available: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  assigned: { bg: "var(--color-accent-bg)", text: "var(--color-accent)" },
  pending_acknowledgment: { bg: "var(--color-warning-bg-alt)", text: "var(--color-warning-text-alt)" },
  pending_return: { bg: "var(--color-warning-bg-alt)", text: "#fb923c" },
  under_repair: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  retired: { bg: "var(--color-border)", text: "var(--color-text-faint)" },
  lost: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },
  reserved: { bg: "var(--color-reserved-bg)", text: "var(--color-reserved-text)" },

  // software access
  revoked: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },

  // user roles
  superadmin: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },
  hr: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  it: { bg: "var(--color-accent-bg)", text: "var(--color-accent)" },
  manager: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  employee: { bg: "var(--color-border)", text: "var(--color-text-faint)" },
};

export const actionColors = {
  create: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  update: { bg: "var(--color-accent-bg)", text: "var(--color-accent)" },
  delete: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text)" },
  view: { bg: "var(--color-border)", text: "var(--color-text-faint)" },
};

