const EmptyState = ({
  icon,
  title = "Nothing here yet",
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: "6px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          background: "#0a1628",
          border: "0.5px solid #1e293b",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        {icon || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "22px", height: "22px" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="#475569"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      <p style={{ fontSize: "13px", fontWeight: 500, color: "#94a3b8", margin: 0 }}>
        {title}
      </p>

      {message && (
        <p style={{ fontSize: "12px", color: "#475569", margin: 0, maxWidth: "280px" }}>
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: "12px",
            background: "#1e3a5f",
            color: "#3b82f6",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;