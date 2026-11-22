import React from "react";

export function Banner({ type = "info", message, onDismiss }) {
  if (!message) return null;

  const bgStyles = {
    offline: "var(--surface-dark)",
    error: "#4a0c17",
    warning: "var(--forest-sage-700)",
    info: "var(--forest-sage-800)",
  };

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: bgStyles[type] || "var(--surface-dark)",
        color: "var(--foreground-on-dark)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-muted)",
        fontSize: "0.85rem",
        letterSpacing: "0.04em",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: type === "offline" ? "var(--pale-sage-300)" : "var(--accent)",
          }}
        />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            color: "var(--foreground-on-dark-muted)",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            border: "1px solid var(--border-muted)",
            padding: "2px 8px",
            borderRadius: "3px",
          }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
