import axiosInstance from "../api/axiosInstance";

// GET list of documents for an employee
export const getEmployeeDocuments = (employeeId) =>
  axiosInstance.get(`/documents/${employeeId}/list/`);

// POST verify a single document by its own pk (NOT employee_id)
// Note: verification_status is hardcoded to 'verified' on the backend,
// so no body is required — just hit the endpoint.
export const verifyDocument = (documentId) =>
  axiosInstance.post(`/documents/${documentId}/verify/`);

// GET all assets (role-based on backend), filtered client-side by employee
export const getAllAssets = () => axiosInstance.get(`/assets/`);