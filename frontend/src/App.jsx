import React, { useState } from "react";
import { Banner } from "./components/Banner.jsx";
import { CONTENT } from "./data/content.js";

export function App() {
  const [offline, setOffline] = useState(false);

  return (
    <div className="repolens-app">
      {offline && (
        <Banner
          type="offline"
          message="Backend API offline. Operating in local GraphRAG fallback mode."
          onDismiss={() => setOffline(false)}
        />
      )}
      <header style={{ padding: "40px 20px", textAlign: "center" }}>
        <h1>{CONTENT.brand.name}</h1>
        <p style={{ color: "var(--foreground-muted)", marginTop: "10px" }}>
          {CONTENT.brand.tagline}
        </p>
      </header>
    </div>
  );
}

export default App;
