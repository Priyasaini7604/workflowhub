import axiosInstance from "../api/axiosInstance";

// GET list of documents for an employee
export const getEmployeeDocuments = (employeeId) =>
  axiosInstance.get(`/documents/${employeeId}/list/`);

// POST verify a single document by its own pk (NOT employee_id).
// Backend now accepts an explicit verification_status ('verified' or
// 'rejected') in the body — defaults to 'verified' if omitted, so existing
// callers with no body keep working exactly as before.
export const verifyDocument = (documentId) =>
  axiosInstance.post(`/documents/${documentId}/verify/`, {
    verification_status: "verified",
  });

// POST reject a single document by its own pk.
export const rejectDocument = (documentId) =>
  axiosInstance.post(`/documents/${documentId}/verify/`, {
    verification_status: "rejected",
  });

// GET all assets (role-based on backend), filtered client-side by employee
export const getAllAssets = () => axiosInstance.get(`/assets/`);