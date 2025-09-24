// src/App.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import ClubMap from "./ClubMap";
import SchedulePage from "./SchedulePage";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, padding: 20 }}>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "clubmap" && <ClubMap />}
        {activeTab === "schedule" && <SchedulePage />}
      </div>
    </div>
  );
}
