import ReactDOMServer from "react-dom/server";
import App from "./App";

export function render(url: string, initialLang: "fr" | "mg" | "en") {
  // Mock window and location for server-side routing
  if (typeof global !== "undefined") {
    (global as any).window = {
      location: {
        pathname: url,
        protocol: "https:",
        hostname: "jerymotro.duckdns.org",
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    };
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }

  return ReactDOMServer.renderToString(<App initialLang={initialLang} />);
}
