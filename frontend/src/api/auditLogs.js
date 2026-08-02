import axiosInstance from "../api/axiosInstance";

// GET audit logs scoped to specific records (model_name + list of object IDs).
// Used by pages like Onboarding/Offboarding timelines.
export const getAuditLogsFor = (modelName, objectIds) => {
  if (!objectIds || objectIds.length === 0) {
    return Promise.resolve({ data: { results: [] } });
  }
  return axiosInstance.get(
    `/audit/record/?model_name=${modelName}&object_id__in=${objectIds.join(",")}`
  );
};

// GET general/unfiltered audit logs — SuperAdmin only (backend enforces this).
// Kept for AuditLogsPage.jsx which needs the full browsable list.
export const getAuditLogs = () => axiosInstance.get(`/audit/`);