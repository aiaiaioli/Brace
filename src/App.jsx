import { useState } from "react";

const DEVICES = [
  "Oxygen concentrator",
  "CPAP",
  "Home dialysis",
  "Refrigerated insulin",
  "Powered wheelchair",
];

const RELEVANT = [
  "winter storm", "ice storm", "freeze", "extreme cold", "wind chill",
  "excessive heat", "extreme heat", "heat advisory",
  "severe thunderstorm", "tornado", "hurricane", "tropical storm",
];

const LEVELS = [
  { name: "Low", color: "#2e7d32" },
  { name: "Watch", color: "#ef6c00" },
  { name: "Act Now", color: "#c62828" },
];

function readProfile() {
  try {
    const raw = localStorage.getItem("brace-profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRisk(alerts, profile) {
  let level = 0;
  for (const a of alerts) {
    const event = a.properties.event.toLowerCase();
    if (!RELEVANT.some((k) => event.includes(k))) continue;
    const sev = a.properties.severity;
    level = Math.max(level, sev === "Severe" || sev === "Extreme" ? 2 : 1);
  }
  // If they depend on devices and have under 12h of battery, bump the risk up one level
  if (level > 0 && profile.devices.length > 0 && profile.battery < 12) {
    level = Math.min(2, level + 1);
  }
  return level;
}

export default function App() {
  const saved = readProfile();
  const [zip, setZip] = useState(saved?.zip || "");
  const [devices, setDevices] = useState(saved?.devices || []);
  const [battery, setBattery] = useState(saved?.battery ?? 8);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleDevice(d) {
    setDevices((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
  }

  async function check() {
    setError("");
    setResult(null);
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a 5-digit ZIP code.");
      return;
    }
    const profile = { zip, devices, battery: Number(battery) };
    try {
      localStorage.setItem("brace-profile", JSON.stringify(profile));
    } catch {}
    setLoading(true);
    try {
      const z = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!z.ok) throw new Error("bad zip");
      const zdata = await z.json();
      const place = zdata.places[0];
      const res = await fetch(
        `https://api.weather.gov/alerts/active?point=${place.latitude},${place.longitude}`
      );
      const data = await res.json();
      setResult({
        alerts: data.features,
        level: getRisk(data.features, profile),
        place: `${place["place name"]}, ${place["state abbreviation"]}`,
      });
    } catch {
      setError("Couldn't load data. Check the ZIP and try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <h1>Brace</h1>
      <p style={{ background: "#fdecea", padding: 12, borderRadius: 8 }}>
        <strong>In an emergency, call 911.</strong> Brace is a planning tool,
        not medical advice.
      </p>

      <h2>Your profile</h2>
      <label>
        ZIP code{" "}
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          maxLength={5}
          inputMode="numeric"
          style={{ fontSize: 18, width: 100 }}
        />
      </label>

      <p>Devices you depend on:</p>
      {DEVICES.map((d) => (
        <div key={d}>
          <label style={{ fontSize: 18 }}>
            <input
              type="checkbox"
              checked={devices.includes(d)}
              onChange={() => toggleDevice(d)}
            />{" "}
            {d}
          </label>
        </div>
      ))}

      <p>
        <label>
          Backup battery hours{" "}
          <input
            type="number"
            min="0"
            value={battery}
            onChange={(e) => setBattery(e.target.value)}
            style={{ fontSize: 18, width: 80 }}
          />
        </label>
      </p>
      <p style={{ fontSize: 14, color: "#666" }}>
        Saved only in this browser. Never sent to a server.
      </p>

      <button
        onClick={check}
        style={{ fontSize: 20, padding: "12px 20px", width: "100%" }}
      >
        {loading ? "Checking..." : "Check my risk"}
      </button>

      {error && <p style={{ color: "#c62828" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              background: LEVELS[result.level].color,
              color: "white",
              padding: 20,
              borderRadius: 12,
              fontSize: 28,
              textAlign: "center",
            }}
          >
            {LEVELS[result.level].name}
            <div style={{ fontSize: 16 }}>{result.place}</div>
          </div>
          {result.alerts.length === 0 && <p>No active alerts for your area.</p>}
          {result.alerts.map((a) => (
            <p key={a.id}>{a.properties.headline}</p>
          ))}
        </div>
      )}
    </div>
  );
}