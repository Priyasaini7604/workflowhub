// Shared table styling helpers — used across EmployeesPage, AssetsPage,
// UserManagementPage, and any future table-based page.
// Single source of truth: change once here, applies everywhere.

export const thStyle = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "11px",
  color: "#64748b",
  fontWeight: 500,
  letterSpacing: "0.8px",
};

export const tdMutedStyle = {
  padding: "14px 16px",
  fontSize: "12px",
  color: "#64748b",
};

export const badgeStyle = (colors) => ({
  background: colors.bg,
  color: colors.text,
  borderRadius: "20px",
  padding: "3px 10px",
  fontSize: "11px",
});

export const actionBtnStyle = (colors) => ({
  background: colors.bg,
  color: colors.text,
  border: "none",
  borderRadius: "6px",
  padding: "5px 10px",
  fontSize: "11px",
  cursor: "pointer",
});

// Shared button color pairs — same View/Edit colors used everywhere
export const viewBtnColors = { bg: "#1e3a5f", text: "#3b82f6" };
export const editBtnColors = { bg: "#064e3b", text: "#10b981" };
export const archiveBtnColors = { bg: "#451a03", text: "#f59e0b" };
export const dangerBtnColors = { bg: "#450a0a", text: "#fca5a5" };
export const neutralBtnColors = { bg: "#1e293b", text: "#94a3b8" };