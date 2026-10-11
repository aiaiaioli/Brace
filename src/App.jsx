import { useState } from "react";
import PowerOut from "./PowerOut";

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

const LEVELS = ["Low", "Watch", "Act Now"];

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
  const [plan, setPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [outage, setOutage] = useState(() => {
    try {
      return !!localStorage.getItem("brace-outage-start");
    } catch {
      return false;
    }
  });

  function toggleDevice(d) {
    setDevices((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
  }

  async function check() {
    setError("");
    setResult(null);
    setPlan("");
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

  async function getPlan() {
    setPlan("");
    setPlanLoading(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          place: result.place,
          level: LEVELS[result.level],
          devices,
          battery: Number(battery),
          alerts: result.alerts.map((a) => a.properties.headline),
        }),
      });
      const data = await res.json();
      setPlan(data.plan || "Couldn't build a plan right now. Try again.");
    } catch {
      setPlan("Couldn't build a plan right now. Try again.");
    }
    setPlanLoading(false);
  }

  if (outage) {
    return (
      <PowerOut
        battery={Number(battery)}
        devices={devices}
        onBack={() => setOutage(false)}
      />
    );
  }

  return (
    <>
      <div className="header">
        <h1>Brace</h1>
        <p>Be ready before the power goes out</p>
      </div>

      <div className="wrap">
        <div className="banner">
          <strong>In an emergency, call 911.</strong> Brace is a planning
          tool, not medical advice.
        </div>

        <button className="btn outage" onClick={() => setOutage(true)}>
          My power is out
        </button>

        <div className="card">
          <h2>Your profile</h2>

          <div className="field">
            <label className="label" htmlFor="zip">ZIP code</label>
            <input
              id="zip"
              className="input"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              maxLength={5}
              inputMode="numeric"
              placeholder="75201"
            />
          </div>

          <div className="field">
            <span className="label">Devices you depend on</span>
            <div className="chips">
              {DEVICES.map((d) => (
                <label
                  key={d}
                  className={"chip" + (devices.includes(d) ? " on" : "")}
                >
                  <input
                    type="checkbox"
                    checked={devices.includes(d)}
                    onChange={() => toggleDevice(d)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="battery">
              Backup battery hours
            </label>
            <input
              id="battery"
              className="input"
              type="number"
              min="0"
              value={battery}
              onChange={(e) => setBattery(e.target.value)}
            />
          </div>

          <p className="note">
            Your profile is saved only in this browser. The action plan sends
            your city, devices, and battery hours to an AI service to write
            your checklist. Brace doesn't store them.
          </p>

          <button className="btn" onClick={check} disabled={loading}>
            {loading ? "Checking..." : "Check my risk"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>

        {result && (
          <>
            <div className={"risk l" + result.level}>
              <div className="small">Your risk level</div>
              <div className="big">{LEVELS[result.level]}</div>
              <div className="place">{result.place}</div>
            </div>

            <div className="card">
              <h2>Weather alerts</h2>
              {result.alerts.length === 0 && <p>No active alerts for your area.</p>}
              {result.alerts.map((a) => (
                <div className="alert" key={a.id}>
                  {a.properties.headline}
                </div>
              ))}
              <button
                className="btn secondary"
                onClick={getPlan}
                disabled={planLoading}
              >
                {planLoading ? "Building your plan..." : "Get my action plan"}
              </button>
            </div>

            {plan && (
              <div className="card">
                <h2>Your action plan</h2>
                <div className="plan">{plan}</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}