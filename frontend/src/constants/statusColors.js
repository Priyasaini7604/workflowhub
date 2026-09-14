export const statusColors = {
  // employee / lifecycle
  candidate: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },
  offer_sent: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  joining_pending: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  onboarding: { bg: "var(--color-accent-bg)", text: "#3b82f6" },
  active: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  notice_period: { bg: "var(--color-warning-bg-alt)", text: "var(--color-warning-text-alt)" },
  offboarding: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },
  exited: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },
  inactive: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },
  on_leave: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },

  // onboarding / offboarding tasks
  pending: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  in_progress: { bg: "var(--color-teal-bg)", text: "var(--color-teal-text)" },
  scheduled: { bg: "var(--color-indigo-bg)", text: "var(--color-indigo-text)" },
  completed: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  verified: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  rejected: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text)" },
  failed: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text)" },
  waived: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },

  // assets
  available: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  assigned: { bg: "var(--color-teal-bg)", text: "var(--color-teal-text)" },
  pending_acknowledgment: { bg: "var(--color-yellow-bg)", text: "var(--color-yellow-text)" },
  pending_return: { bg: "var(--color-warning-bg-alt)", text: "#fb923c" },
  under_repair: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  retired: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },
  lost: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },
  reserved: { bg: "var(--color-purple-bg)", text: "var(--color-purple-text)" },

  // software access
  revoked: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },

  // user roles
  superadmin: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text-soft)" },
  hr: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  it: { bg: "var(--color-accent-bg)", text: "#3b82f6" },
  manager: { bg: "var(--color-warning-bg)", text: "var(--color-warning-text)" },
  employee: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },
};

export const actionColors = {
  create: { bg: "var(--color-success-bg)", text: "var(--color-success-text)" },
  update: { bg: "var(--color-teal-bg)", text: "var(--color-teal-text)" },
  delete: { bg: "var(--color-danger-bg)", text: "var(--color-danger-text)" },
  view: { bg: "var(--color-neutral-bg)", text: "var(--color-neutral-text)" },
  bulk_import: { bg: "var(--color-purple-bg)", text: "var(--color-purple-text)" },
};