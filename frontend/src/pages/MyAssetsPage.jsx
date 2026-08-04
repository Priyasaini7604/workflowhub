import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const MyAssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // tracks which asset's button is loading
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    setLoading(true);
    try {
      const profileResponse = await axiosInstance.get("/employees/me/");
      setProfile(profileResponse.data);

      const assetsResponse = await axiosInstance.get("/assets/");
      const allAssets = assetsResponse.data.results || assetsResponse.data;
      const myAssets = allAssets.filter((a) => idsMatch(a.assigned_to?.id== profileResponse.data.id));
      setAssets(myAssets);
    } catch (err) {
      console.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (assetId, action) => {
    setActionLoading(assetId);
    setMessage("");
    try {
      await axiosInstance.post(`/assets/${assetId}/acknowledge/`, { action });
      setMessage(action === "accept" ? "Asset accepted." : "Asset rejected.");
      await fetchMyAssets(); // refresh list after action
    } catch (err) {
      setMessage(err.response?.data?.error || "Something went wrong, try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors = {
    available: { bg: "#064e3b", text: "#10b981" },
    pending_acknowledgment: { bg: "#78350f", text: "#fbbf24" },
    assigned: { bg: "#1e3a5f", text: "#3b82f6" },
    under_repair: { bg: "#451a03", text: "#f59e0b" },
    retired: { bg: "#1e293b", text: "#94a3b8" },
  };

  const pendingAssets = assets.filter(a => a.status === "pending_acknowledgment");
  const confirmedAssets = assets.filter(a => a.status !== "pending_acknowledgment");

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>My Assets</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Assets assigned to you</p>
      </div>

      {message && (
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{message}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "60px", textAlign: "center" }}>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>No assets assigned to you</p>
        </div>
      ) : (
        <>
          {/* Pending Acknowledgment section */}
          {pendingAssets.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#fbbf24", margin: "0 0 12px" }}>
                Pending Acknowledgment ({pendingAssets.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    style={{
                      background: "#0a1628",
                      border: "0.5px solid #78350f",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>
                        {asset.asset_id} — {asset.brand} {asset.model_name}
                      </p>
                      <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.asset_type}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleAcknowledge(asset.id, "accept")}
                        disabled={actionLoading === asset.id}
                        style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", opacity: actionLoading === asset.id ? 0.6 : 1 }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAcknowledge(asset.id, "reject")}
                        disabled={actionLoading === asset.id}
                        style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", opacity: actionLoading === asset.id ? 0.6 : 1 }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed / other assets table */}
          <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSET ID</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>TYPE</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>BRAND / MODEL</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>SERIAL NUMBER</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ISSUE DATE</th>
                </tr>
              </thead>
              <tbody>
                {confirmedAssets.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
                      No confirmed assets yet
                    </td>
                  </tr>
                ) : (
                  confirmedAssets.map((asset) => {
                    const statusStyle = statusColors[asset.status] || statusColors.assigned;
                    return (
                      <tr key={asset.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.asset_id}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.asset_type}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{asset.brand}</p>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.model_name}</p>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.serial_number || "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                            {asset.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.asset_issue_date || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MyAssetsPage;