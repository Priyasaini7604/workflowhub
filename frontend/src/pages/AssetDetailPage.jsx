import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const statusColors = {
  available: { bg: "#064e3b", text: "#10b981" },
  assigned: { bg: "#1e3a5f", text: "#3b82f6" },
  pending_return: { bg: "#78350f", text: "#fb923c" }, 
  under_repair: { bg: "#451a03", text: "#f59e0b" },
  retired: { bg: "#1e293b", text: "#94a3b8" },
};

const conditionColors = {
  new: { bg: "#064e3b", text: "#10b981" },
  good: { bg: "#1e3a5f", text: "#3b82f6" },
  fair: { bg: "#451a03", text: "#f59e0b" },
  damaged: { bg: "#1a0a0a", text: "#fca5a5" },
};

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAsset();
    fetchHistory();
  }, [id]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/assets/${id}/`);
      setAsset(response.data);
    } catch (err) {
      setError("Failed to load asset details");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get(`/assets/${id}/history/`);
      setHistory(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this asset?")) return;
    try {
      await axiosInstance.patch(`/assets/${id}/archive/`);
      navigate("/assets");
    } catch (err) {
      setError("Failed to archive asset");
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <p style={{ color: "#64748b", fontSize: "13px" }}>Loading asset details...</p>
    </div>
  );

  if (error) return (
    <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px" }}>
      <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
    </div>
  );

  const statusStyle = statusColors[asset?.status] || statusColors.available;
  const conditionStyle = conditionColors[asset?.condition] || conditionColors.good;

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

  const fieldLabel = {
    fontSize: "11px",
    color: "#64748b",
    margin: "0 0 4px",
    letterSpacing: "0.8px",
  };

  const fieldValue = {
    fontSize: "13px",
    color: "#f1f5f9",
    margin: 0,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/assets")}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
          >
            ← Back
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Asset Detail</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>View asset information</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate(`/assets/${id}/edit`)}
            style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleArchive}
            style={{ background: "#451a03", color: "#f59e0b", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            🗄️ Archive
          </button>
        </div>
      </div>

      {/* Asset Profile Card */}
      <div style={{ ...sectionStyle, display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "64px", height: "64px", background: "#064e3b", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "28px" }} fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            {asset?.brand} {asset?.model_name}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>
            {asset?.asset_type} — {asset?.asset_id}
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
              {asset?.status}
            </span>
            <span style={{ background: conditionStyle.bg, color: conditionStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
              {asset?.condition}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>💻 Asset Information</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>ASSET ID</p>
            <p style={fieldValue}>{asset?.asset_id || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>ASSET TYPE</p>
            <p style={fieldValue}>{asset?.asset_type || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>BRAND</p>
            <p style={fieldValue}>{asset?.brand || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>MODEL NAME</p>
            <p style={fieldValue}>{asset?.model_name || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>SERIAL NUMBER</p>
            <p style={fieldValue}>{asset?.serial_number || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>WARRANTY EXPIRY</p>
            <p style={fieldValue}>{asset?.warranty_expiry_date || "—"}</p>
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>👤 Assignment Information</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>ASSIGNED TO</p>
            <p style={fieldValue}>
  {asset?.assigned_to 
    ? asset.assigned_to.full_name 
      ? `${asset.assigned_to.full_name} — ${asset.assigned_to.designation}`
      : `${asset.assigned_to.employee_id} — ${asset.assigned_to.designation}`
    : "Unassigned"}
</p>
          </div>
          <div>
            <p style={fieldLabel}>ISSUE DATE</p>
            <p style={fieldValue}>{asset?.asset_issue_date || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>RETURN DATE</p>
            <p style={fieldValue}>{asset?.asset_return_date || "—"}</p>
          </div>
        </div>
      </div>

      {/* Allocation History */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>📋 Allocation History</h3>
        {history.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No allocation history found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                <th style={{ padding: "10px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>EMPLOYEE</th>
                <th style={{ padding: "10px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSIGNED DATE</th>
                <th style={{ padding: "10px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>RETURNED DATE</th>
                <th style={{ padding: "10px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#f1f5f9" }}>
                    {/* h.employee is a nested object ({id, full_name, employee_id, ...}),
                        not a plain ID — render its name, not the object itself. */}
                    {h.employee?.full_name || h.employee?.employee_id || "—"}
                  </td>
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{h.assigned_date}</td>
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{h.returned_date || "—"}</td>
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{h.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default AssetDetailPage;