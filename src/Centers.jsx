const SITES = [
  {
    name: "Salvation Army Carr P. Collins Center",
    address: "5302 Harry Hines Blvd, Dallas, TX 75235",
    note: "Has opened for inclement weather sheltering.",
  },
  {
    name: "Salvation Army Garland Corps Community Center",
    address: "451 W Avenue D, Garland, TX",
    note: "Has opened for inclement weather sheltering.",
  },
  {
    name: "Austin Street Center",
    address: "2929 Hickory St, Dallas, TX",
    note: "Runs the city's temporary weather shelter during freezes.",
  },
];

function mapsUrl(address) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address)
  );
}

export default function Centers() {
  return (
    <div className="card">
      <h2>Places to go for relief</h2>

      <p className="note">
        Dallas County only for now. Opening times change with the weather, so always
        call ahead.
      </p>

      <div className="alert">
        <strong>All Dallas libraries and recreation centers</strong> are open
        to the public as warming and cooling stations during business hours.
      </div>

      <div className="links">
        <a
          className="btn secondary"
          href="https://dallaslibrary2.org/hours.php"
          target="_blank"
          rel="noreferrer"
        >
          Library locations and hours
        </a>
        <a
          className="btn secondary"
          href="https://www.dallasparks.org/160/Recreation-Centers"
          target="_blank"
          rel="noreferrer"
        >
          Recreation center locations and hours
        </a>
      </div>

      <h2 style={{ marginTop: 24 }}>Shelters that open in extreme weather</h2>
      {SITES.map((s) => (
        <div className="site" key={s.name}>
          <strong>{s.name}</strong>
          <div>{s.address}</div>
          <div className="note">{s.note}</div>
          <a href={mapsUrl(s.address)} target="_blank" rel="noreferrer">
            Get directions
          </a>
        </div>
      ))}

      <h2 style={{ marginTop: 24 }}>Need help finding a place right now?</h2>
      <div className="links">
        <a className="btn secondary" href="tel:211">
          Call 211 (shelter and services)
        </a>
        <a className="btn secondary" href="tel:311">
          Call 311 (City of Dallas)
        </a>
      </div>
    </div>
  );
}