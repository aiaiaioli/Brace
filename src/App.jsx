import { useState } from "react";

export default function App() {
  const [alerts, setAlerts] = useState(null);

  async function load() {
    // Dallas lat/lon, hardcoded for now
    const res = await fetch(
      "https://api.weather.gov/alerts/active?point=32.7767,-96.7970"
    );
    const data = await res.json();
    setAlerts(data.features);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>GridReady</h1>
      <button onClick={load}>Check Dallas alerts</button>
      {alerts && alerts.length === 0 && <p>No active alerts.</p>}
      {alerts &&
        alerts.map((a) => (
          <p key={a.id}>{a.properties.headline}</p>
        ))}
    </div>
  );
}