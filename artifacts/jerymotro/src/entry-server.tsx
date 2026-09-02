// Mock window and document before importing React code so Leaflet/browser-only modules don't crash Node on import.
if (typeof global !== "undefined") {
  const domMock = {
    location: {
      pathname: "/",
      protocol: "https:",
      hostname: "jerymotro.duckdns.org",
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  };
  (global as any).window = domMock;
  (global as any).document = {
    createElement: () => ({ style: {} }),
    documentElement: { style: {} },
  };
  Object.defineProperty(global, "navigator", {
    value: { userAgent: "node" },
    writable: true,
    configurable: true,
  });
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

import ReactDOMServer from "react-dom/server";
import App from "./App";

export function render(url: string, initialLang: "fr" | "mg" | "en") {
  return ReactDOMServer.renderToString(
    <App initialLang={initialLang} initialUrl={url} />
  );
}
