import ReactDOMServer from "react-dom/server";
import App from "./App";

export function render(url: string, initialLang: "fr" | "mg" | "en") {
  return ReactDOMServer.renderToString(
    <App initialLang={initialLang} initialUrl={url} />
  );
}
