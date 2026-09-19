import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { getEffectiveAssetStatus } from "../utils/assetStatus";
import { statusColors } from "../constants/statusColors";
import EmptyState from "../components/EmptyState";

// Consolidated style constants
import { thStyle, tdMutedStyle, badgeStyle, actionBtnStyle, viewBtnColors, editBtnColors } from "../utils/tableStyles";



const AssetsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isITOnlyAssigned = user?.role === "it";

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAssets(1); // search change hone par page 1 pe reset
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const fetchAssets = async (pageNum = page) => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(
        `/assets/?search=${encodeURIComponent(search)}&page=${pageNum}`
      );
      const payload = response.data;
      setAssets(payload.results || payload);
      setCount(payload.count ?? (payload.results || payload).length);
      setPage(pageNum);
    } catch (err) {
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    fetchAssets(p);
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            {isITOnlyAssigned ? "Assigned Assets" : "IT Asset Management"}
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {isITOnlyAssigned ? "Assets currently assigned to employees" : "Manage all IT assets"}
          </p>
        </div>
        {!isITOnlyAssigned && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/assets/bulk-import")}
              style={{ background: "#0a1628", color: "#94a3b8", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              📤 Bulk Import
            </button>
            <button
              onClick={() => navigate("/assets/add")}
              style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              + Add Asset
            </button>
          </div>
        )}
      </div>

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

      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

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
                  <th style={thStyle}>ASSET</th>
                  <th style={thStyle}>TYPE</th>
                  <th style={thStyle}>BRAND / MODEL</th>
                  <th style={thStyle}>ASSIGNED TO</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title="No assets found"
                        message={
                          search
                            ? "Try a different search term."
                            : "Get started by adding your first asset."
                        }
                        actionLabel={!isITOnlyAssigned && !search ? "+ Add Asset" : undefined}
                        onAction={() => navigate("/assets/add")}
                      />
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
                        <td style={tdMutedStyle}>{asset.category_detail?.name || "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ fontSize: "12px", color: "#f1f5f9", margin: 0 }}>{asset.brand || "—"}</p>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.model_name || "—"}</p>
                        </td>
                        <td style={tdMutedStyle}>
                          {asset.assigned_to
                            ? `${asset.assigned_to.full_name || "—"} (${asset.assigned_to.employee_id || "—"})`
                            : "Unassigned"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={badgeStyle(statusStyle)}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => navigate(`/assets/${asset.id}`)}
                              style={actionBtnStyle(viewBtnColors)}>
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/assets/${asset.id}/edit`)}
                              style={actionBtnStyle(editBtnColors)}>
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

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "16px", borderTop: "0.5px solid #1e293b" }}>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                style={{ background: "#0a1628", color: page === 1 ? "#334155" : "#94a3b8", border: "0.5px solid #1e293b", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  style={{
                    background: p === page ? "#2563eb" : "#0a1628",
                    color: p === page ? "#eff6ff" : "#94a3b8",
                    border: "0.5px solid #1e293b",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}>
                  {p}
                </button>
              ))}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                style={{ background: "#0a1628", color: page === totalPages ? "#334155" : "#94a3b8", border: "0.5px solid #1e293b", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetsPage;