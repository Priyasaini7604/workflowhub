import { useState, useEffect } from "react";

/**
 * Generic advanced filter drawer — multi-select checkboxes, free-text
 * (comma-separated) fields, and date ranges, all in one right-side panel.
 * Reusable across screens (Audit Logs, Asset Reports, etc.) by passing a
 * different `filters` config.
 *
 * filters config shape:
 * [
 *   { key: "status", label: "Status", type: "multiselect", options: ["a","b"] },
 *   { key: "department", label: "Department", type: "text", placeholder: "IT, HR" },
 *   { key: "dateRange", label: "Date Range", type: "daterange" },
 * ]
 *
 * appliedValues shape (per key, matching type):
 *   multiselect -> array of selected strings, e.g. []
 *   text        -> string, e.g. ""
 *   daterange   -> { from: "", to: "" }
 *
 * onApply(values) is called with the full new values object when the user
 * clicks "Apply Filters". Nothing is committed to the parent until then —
 * closing the drawer without applying discards in-progress edits.
 */
const FilterDrawer = ({ isOpen, onClose, filters, appliedValues, onApply }) => {
  const [draft, setDraft] = useState(appliedValues);

  useEffect(() => {
    if (isOpen) setDraft(appliedValues);
  }, [isOpen, appliedValues]);

  if (!isOpen) return null;

  const toggleMultiValue = (key, option) => {
    setDraft((prev) => {
      const current = prev[key] || [];
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  };

  const setTextValue = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setDateValue = (key, part, value) => {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [part]: value },
    }));
  };

  const handleClearAll = () => {
    const cleared = {};
    filters.forEach((f) => {
      if (f.type === "multiselect") cleared[f.key] = [];
      else if (f.type === "daterange") cleared[f.key] = { from: "", to: "" };
      else cleared[f.key] = "";
    });
    setDraft(cleared);
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "340px",
          maxWidth: "90vw",
          background: "#0a1628",
          borderLeft: "0.5px solid #1e293b",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "0.5px solid #1e293b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: "15px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: "18px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {filters.map((f) => (
            <div key={f.key} style={{ marginBottom: "22px" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  fontWeight: 500,
                  letterSpacing: "0.8px",
                  margin: "0 0 10px",
                }}
              >
                {f.label.toUpperCase()}
              </p>

              {f.type === "multiselect" &&
                f.options.map((opt) => {
                  const checked = (draft[f.key] || []).includes(opt);
                  return (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 0",
                        fontSize: "13px",
                        color: "#cbd5e1",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiValue(f.key, opt)}
                        style={{ accentColor: "#2563eb", width: "14px", height: "14px" }}
                      />
                      {opt}
                    </label>
                  );
                })}

              {f.type === "text" && (
                <input
                  type="text"
                  value={draft[f.key] || ""}
                  placeholder={f.placeholder || ""}
                  onChange={(e) => setTextValue(f.key, e.target.value)}
                  style={{
                    width: "100%",
                    background: "#060b14",
                    border: "0.5px solid #1e293b",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    fontSize: "13px",
                    color: "#f1f5f9",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}

              {f.type === "daterange" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="date"
                    value={(draft[f.key] && draft[f.key].from) || ""}
                    onChange={(e) => setDateValue(f.key, "from", e.target.value)}
                    style={{
                      flex: 1,
                      background: "#060b14",
                      border: "0.5px solid #1e293b",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      color: "#f1f5f9",
                      outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                  <input
                    type="date"
                    value={(draft[f.key] && draft[f.key].to) || ""}
                    onChange={(e) => setDateValue(f.key, "to", e.target.value)}
                    style={{
                      flex: 1,
                      background: "#060b14",
                      border: "0.5px solid #1e293b",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      color: "#f1f5f9",
                      outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "0.5px solid #1e293b",
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={handleClearAll}
            style={{
              flex: 1,
              background: "#0f172a",
              border: "0.5px solid #1e293b",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "13px",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 1,
              background: "#2563eb",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#eff6ff",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

// How many filter groups currently have a value set — used for the badge
// on the "Filters" trigger button.
export const countActiveFilters = (values, filters) => {
  let count = 0;
  filters.forEach((f) => {
    const v = values[f.key];
    if (f.type === "multiselect") {
      if (v && v.length > 0) count += 1;
    } else if (f.type === "daterange") {
      if (v && (v.from || v.to)) count += 1;
    } else {
      if (v) count += 1;
    }
  });
  return count;
};

// Converts drawer values into flat query-param key/value pairs.
// multiselect -> comma-joined string under its own key (backend does .split(',')).
// text        -> passed through as-is under its own key.
// daterange   -> always emitted as `date_from` / `date_to` (fixed names,
//                since a screen only ever has one active date range at a time).
export const buildFilterParams = (values, filters) => {
  const params = {};
  filters.forEach((f) => {
    const v = values[f.key];
    if (f.type === "multiselect" && v && v.length > 0) {
      params[f.key] = v.join(",");
    } else if (f.type === "text" && v) {
      params[f.key] = v;
    } else if (f.type === "daterange" && v) {
      if (v.from) params.date_from = v.from;
      if (v.to) params.date_to = v.to;
    }
  });
  return params;
};

export default FilterDrawer;