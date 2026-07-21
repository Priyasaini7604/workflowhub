// The backend's `status` field on an Asset is not reliably kept in sync with
// the `assigned_to` field — an asset can have assigned_to set to an employee
// while status still says "available". To avoid showing wrong counts across
// the app (Stock Overview, IT Assets, Dashboard, Reports), we compute the
// "effective" status here instead of trusting the raw status field directly.
//
// Priority: retired > under_repair > assigned (has assigned_to) > available.
export const getEffectiveAssetStatus = (asset) => {
  if (asset.status === "retired") return "retired";
  if (asset.status === "under_repair") return "under_repair";
  if (asset.assigned_to) return "assigned";
  return "available";
};