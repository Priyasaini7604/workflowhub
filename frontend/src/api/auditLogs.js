import axiosInstance from "../api/axiosInstance";

// GET all audit logs — backend does not support filtering by employee/model_name,
// so we fetch everything and filter client-side by matching model_name + object_id
// against the specific record IDs (tasks, checklist, documents) for the selected employee.
// NOTE: confirm the URL prefix below matches your project's urls.py mounting for the audit app.
export const getAuditLogs = () => axiosInstance.get(`/audit/`);