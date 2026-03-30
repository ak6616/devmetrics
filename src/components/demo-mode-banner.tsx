export function DemoModeBanner() {
  if (process.env.DEMO_MODE !== "true") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "rgba(59, 130, 246, 0.95)",
        color: "white",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
        backdropFilter: "blur(4px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      🔒 Demo Mode — changes are not saved. This is a portfolio preview.
    </div>
  );
}
