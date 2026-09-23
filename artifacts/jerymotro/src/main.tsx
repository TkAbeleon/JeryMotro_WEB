import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Recover gracefully when a previously cached page references chunks
// that were removed by a newer static deployment.
if (typeof window !== "undefined") {
  const CHUNK_RELOAD_KEY = "jerymotro_chunk_reload_at";

  window.addEventListener("vite:preloadError", (event) => {
    const now = Date.now();
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);

    if (lastReload && now - lastReload < 10_000) {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return;
    }

    event.preventDefault();
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
