import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getEffectiveAssetStatus } from "../utils/assetStatus";
import { statusColors } from "../constants/statusColors";

const AssetsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // IT role permanently sees only assigned assets on this page.
  // Super Admin still sees everything (they need the full picture to assign/retire).
  const isITOnlyAssigned = user?.role === "it";

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAssets();
    }, 400); // typing rukne ke 400ms baad hi call jaaye

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const fetchAssets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(
        `/assets/?search=${encodeURIComponent(search)}`
      );
      setAssets(response.data.results || response.data);
    } catch (err) {
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  // Text search ab backend pe hota hai (query param se).
  // Yahan sirf IT-role ka client-side visibility filter reh gaya hai.
  const filteredAssets = assets.filter((asset) => {
    if (!isITOnlyAssigned) return true;
    const status = getEffectiveAssetStatus(asset);
    return (
      status === "assigned" ||
      status === "pending_acknowledgment" ||
      status === "pending_return"
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            {isITOnlyAssigned ? "Assigned Assets" : "IT Asset Management"}
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {isITOnlyAssigned ? "Assets currently assigned to employees" : "Manage all IT assets"}
          </p>
        </div>
        <button
          onClick={() => navigate("/assets/add")}
          style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
          + Add Asset
        </button>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", maxWidth: "320px" }}>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by ID, brand, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#f1f5f9" }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading assets...</p>
        </div>
      ) : (
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSET</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>TYPE</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>BRAND / MODEL</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSIGNED TO</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
                      No assets found
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const effectiveStatus = getEffectiveAssetStatus(asset);
                    const statusStyle = statusColors[effectiveStatus] || statusColors.available;
                    return (
                      <tr key={asset.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", background: "#064e3b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{asset.asset_id}</p>
                              <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.serial_number || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.category_detail?.name || "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ fontSize: "12px", color: "#f1f5f9", margin: 0 }}>{asset.brand || "—"}</p>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.model_name || "—"}</p>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>
                          {asset.assigned_to
                            ? `${asset.assigned_to.full_name || "—"} (${asset.assigned_to.employee_id || "—"})`
                            : "Unassigned"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => navigate(`/assets/${asset.id}`)}
                              style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/assets/${asset.id}/edit`)}
                              style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;