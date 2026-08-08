import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";

const conditionColors = {
  new: { bg: "#064e3b", text: "#10b981" },
  good: { bg: "#1e3a5f", text: "#3b82f6" },
  fair: { bg: "#451a03", text: "#f59e0b" },
  damaged: { bg: "#1a0a0a", text: "#fca5a5" },
};
const transferReasonLabels = {
  reallocation: "Reallocation",
  damage: "Damage / Replacement",
  upgrade: "Upgrade",
  role_change: "Role Change",
  other: "Other",
};

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [transferForm, setTransferForm] = useState({ new_employee: "", transfer_reason: "", remarks: "" });
  const [transferError, setTransferError] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

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

  const openTransferModal = async () => {
    setTransferError("");
    setTransferForm({ new_employee: "", transfer_reason: "", remarks: "" });
    setShowTransferModal(true);
    try {
      const response = await axiosInstance.get("/employees/?all=true");
      const list = response.data.results || response.data;
      // Current holder ko dropdown se hata do — usi ko transfer nahi kar sakte
      setEmployees(list.filter((e) => e.id !== asset?.assigned_to?.id));
    } catch (err) {
      setTransferError("Failed to load employee list");
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.new_employee || !transferForm.transfer_reason) {
      setTransferError("Please select an employee and a reason");
      return;
    }
    setTransferLoading(true);
    setTransferError("");
    try {
      await axiosInstance.post(`/assets/${id}/transfer/`, transferForm);
      setShowTransferModal(false);
      fetchAsset();
      fetchHistory();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.non_field_errors?.[0] ||
        data?.new_employee?.[0] ||
        data?.transfer_reason?.[0] ||
        data?.detail ||
        "Failed to transfer asset";
      setTransferError(msg);
    } finally {
      setTransferLoading(false);
    }
  };

  const handlePrintLabel = () => {
  const printWindow = window.open('', '_blank', 'width=500,height=650');
  printWindow.document.write(`
    <html>
      <head>
        <title>${asset.asset_id} — Label</title>
        <style>
          @page { size: A4; margin: 0; }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .label {
            border: 2px dashed #999;
            border-radius: 12px;
            padding: 30px 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          img { width: 220px; height: 220px; margin-bottom: 14px; }
          .company { font-size: 13px; color: #555; letter-spacing: 1.5px; margin: 0 0 4px; }
          .asset-id { font-size: 24px; font-weight: bold; margin: 0 0 6px; }
          .model { font-size: 14px; color: #333; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${asset.qr_code_image}" alt="QR code" />
          <p class="company">MPRW RESEARCH</p>
          <p class="asset-id">${asset.asset_id}</p>
          <p class="model">${asset.brand || ''} ${asset.model_name || ''}</p>
          <p class="model">${asset.category_detail?.name || ''}</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
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
          {asset?.status === "assigned" && (
            <button
              onClick={openTransferModal}
              style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              🔁 Transfer
            </button>
          )}
          
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
            {asset?.category_detail?.name} — {asset?.asset_id}
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

      {/* QR Code */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>📱 QR Code</h3>
        {asset?.qr_code_image ? (
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <img
              src={asset.qr_code_image}
              alt={`QR code for ${asset.asset_id}`}
              style={{ width: "160px", height: "160px", background: "#fff", borderRadius: "8px", padding: "8px" }}
            />
            <div>
              <p style={fieldLabel}>GENERATED AT</p>
              <p style={{ ...fieldValue, marginBottom: "16px" }}>
                {asset.qr_generated_at ? new Date(asset.qr_generated_at).toLocaleString() : "—"}
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={asset.qr_code_image}
                  download={`${asset.asset_id}_qr.png`}
                  style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer", textDecoration: "none", display: "inline-block" }}
                >
                  ⬇️ Download
                </a>
                <button
  onClick={handlePrintLabel}
  style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
>
  🖨️ Print
</button>
                  
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>No QR code generated yet.</p>
        )}
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
            <p style={fieldValue}>{asset?.category_detail?.name || "—"}</p>
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
                <th style={{ padding: "10px 0", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>REASON</th>
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
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>
                    {transferReasonLabels[h.transfer_reason] || "—"}
                  </td>
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#64748b" }}>{h.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Transfer Modal */}
      {showTransferModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => !transferLoading && setShowTransferModal(false)}
        >
          <div
            style={{ ...sectionStyle, width: "420px", maxWidth: "90vw", margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={sectionTitleStyle}>🔁 Transfer Asset</h3>

            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px" }}>
              Currently with{" "}
              <span style={{ color: "#f1f5f9" }}>
                {asset?.assigned_to?.full_name || asset?.assigned_to?.employee_id || "—"}
              </span>
            </p>

            {transferError && (
              <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "#fca5a5", margin: 0 }}>{transferError}</p>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <p style={fieldLabel}>TRANSFER TO *</p>
              <select
                value={transferForm.new_employee}
                onChange={(e) => setTransferForm({ ...transferForm, new_employee: e.target.value })}
                style={{ width: "100%", background: "#060b14", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 12px", color: "#f1f5f9", fontSize: "13px" }}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || emp.employee_id} — {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <p style={fieldLabel}>REASON *</p>
              <select
                value={transferForm.transfer_reason}
                onChange={(e) => setTransferForm({ ...transferForm, transfer_reason: e.target.value })}
                style={{ width: "100%", background: "#060b14", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 12px", color: "#f1f5f9", fontSize: "13px" }}
              >
                <option value="">Select reason</option>
                {Object.entries(transferReasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={fieldLabel}>JUSTIFICATION NOTE (OPTIONAL)</p>
              <textarea
                value={transferForm.remarks}
                onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                rows={3}
                placeholder="e.g. Ravi moved to design team, laptop reassigned to Sita"
                style={{ width: "100%", background: "#060b14", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 12px", color: "#f1f5f9", fontSize: "13px", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowTransferModal(false)}
                disabled={transferLoading}
                style={{ background: "transparent", border: "0.5px solid #1e293b", color: "#64748b", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferLoading}
                style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: transferLoading ? "default" : "pointer", opacity: transferLoading ? 0.6 : 1 }}
              >
                {transferLoading ? "Transferring..." : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssetDetailPage;