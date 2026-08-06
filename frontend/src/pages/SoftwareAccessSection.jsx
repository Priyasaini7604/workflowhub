import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";


const sectionStyle = {
  background: "#0a1628",
  border: "0.5px solid #1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "16px",
};

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#f1f5f9",
  margin: "0 0 20px",
  paddingBottom: "12px",
  borderBottom: "0.5px solid #1e293b",
};

const SoftwareAccessSection = ({ employeeId }) => {
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ software_name: "", access_level: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchAccess = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/access/?employee=${employeeId}`);
      setAccessList(res.data.results ||res.data);
    } catch (err) {
      setError("Failed to load software access");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [employeeId]);

  const handleGrant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await axiosInstance.post("/access/", {
        employee: employeeId,
        software_name: formData.software_name,
        access_level: formData.access_level,
      });
      setFormData({ software_name: "", access_level: "" });
      setShowForm(false);
      fetchAccess();
    } catch (err) {
      setError("Failed to grant access");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (accessId) => {
    if (!window.confirm("Revoke this access?")) return;
    try {
      await axiosInstance.patch(`/access/${accessId}/revoke/`, { status: "revoked" });
      fetchAccess();
    } catch (err) {
      setError("Failed to revoke access");
    }
  };

  return (
    <div style={sectionStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "0.5px solid #1e293b" }}>
        <h3 style={{ ...sectionTitleStyle, margin: 0, padding: 0, border: "none" }}>🔑 Software Access</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
        >
          {showForm ? "Cancel" : "+ Grant Access"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleGrant}
          style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Software name (e.g. Gmail)"
            value={formData.software_name}
            onChange={(e) => setFormData({ ...formData, software_name: e.target.value })}
            required
            style={{ flex: 1, minWidth: "150px", background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#f1f5f9" }}
          />
          <input
            type="text"
            placeholder="Access level (optional)"
            value={formData.access_level}
            onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
            style={{ flex: 1, minWidth: "150px", background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#f1f5f9" }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Granting..." : "Grant"}
          </button>
        </form>
      )}

      {error && (
        <p style={{ color: "#fca5a5", fontSize: "12px", marginBottom: "12px" }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
      ) : accessList.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "13px" }}>No software access granted yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {accessList.map((item) => {
            const statusStyle = StatusColors[item.status] || StatusColors.pending;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#0f1a2e",
                  border: "0.5px solid #1e293b",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div>
                  <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "0 0 2px", fontWeight: 500 }}>
                    {item.software_name}
                  </p>
                  {item.access_level && (
                    <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{item.access_level}</p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      borderRadius: "20px",
                      padding: "3px 10px",
                      fontSize: "11px",
                    }}
                  >
                    {item.status}
                  </span>
                  {item.status === "active" && (
                    <button
                      onClick={() => handleRevoke(item.id)}
                      style={{ background: "none", border: "none", color: "#f87171", fontSize: "12px", cursor: "pointer", padding: 0 }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SoftwareAccessSection;