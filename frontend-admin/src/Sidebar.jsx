// src/Sidebar.jsx
export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "dashboard", label: "Главная" },
    { key: "clubmap", label: "Карта клуба" },
  ];

  return (
    <div style={{
      width: 200, background: "#f0f0f0", padding: 20,
      display: "flex", flexDirection: "column"
    }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            marginBottom: 10,
            padding: 10,
            fontWeight: activeTab === tab.key ? "bold" : "normal",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
