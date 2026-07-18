import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { getEffectiveAssetStatus } from "../utils/assetStatus";

const statusColors = {
  available: { bg: "#064e3b", text: "#10b981" },
  assigned: { bg: "#1e3a5f", text: "#3b82f6" },
  under_repair: { bg: "#451a03", text: "#f59e0b" },
  retired: { bg: "#1e293b", text: "#94a3b8" },
};

const STATUS_FILTERS = [
  { key: "all", label: "All Stock", color: "#f1f5f9" },
  { key: "available", label: "Available", color: "#10b981" },
  { key: "under_repair", label: "Under Repair", color: "#f59e0b" },
  { key: "retired", label: "Retired", color: "#94a3b8" },
];

const StockOverviewPage = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/assets/");
      setAssets(response.data.results || response.data);
    } catch (err) {
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  // Stock Overview only tracks unassigned stock — assigned assets are shown
  // on the IT Assets / Employee Assets pages instead.
  const stockAssets = assets.filter((a) => getEffectiveAssetStatus(a) !== "assigned");

  const counts = {
    all: stockAssets.length,
    available: stockAssets.filter((a) => getEffectiveAssetStatus(a) === "available").length,
    under_repair: stockAssets.filter((a) => getEffectiveAssetStatus(a) === "under_repair").length,
    retired: stockAssets.filter((a) => getEffectiveAssetStatus(a) === "retired").length,
  };

  const filteredAssets = stockAssets
    .filter((a) => (statusFilter === "all" ? true : getEffectiveAssetStatus(a) === statusFilter))
    .filter(
      (a) =>
        a.asset_id?.toLowerCase().includes(search.toLowerCase()) ||
        a.asset_type?.toLowerCase().includes(search.toLowerCase()) ||
        a.brand?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Stock Overview</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Available, under repair and retired stock (assigned assets are on the Assets page)</p>
        </div>
        <button
          onClick={() => navigate("/assets/add")}
          style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
          + Add New Asset
        </button>
      </div>

      {/* Stat cards — click to filter */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {STATUS_FILTERS.map((s) => (
          <div
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            style={{
              background: "#0a1628",
              border: statusFilter === s.key ? `0.5px solid ${s.color}` : "0.5px solid #1e293b",
              borderRadius: "12px",
              padding: "18px",
              cursor: "pointer",
              transition: "border 0.15s",
            }}
          >
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{s.label.toUpperCase()}</p>
            <p style={{ fontSize: "26px", fontWeight: 500, color: s.color, margin: 0 }}>{loading ? "--" : counts[s.key]}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", maxWidth: "320px" }}>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by ID, type, brand..."
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

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading assets...</p>
        </div>
      ) : (
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #1e293b" }}>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Showing <span style={{ color: "#f1f5f9" }}>{filteredAssets.length}</span> {statusFilter !== "all" ? statusFilter.replace("_", " ") : ""} asset{filteredAssets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSET</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>TYPE</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>BRAND / MODEL</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
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
                          <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{asset.asset_id}</p>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.serial_number || "—"}</p>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.asset_type}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ fontSize: "12px", color: "#f1f5f9", margin: 0 }}>{asset.brand || "—"}</p>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.model_name || "—"}</p>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <button
                            onClick={() => navigate(`/assets/${asset.id}`)}
                            style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                            View
                          </button>
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

export default StockOverviewPage;