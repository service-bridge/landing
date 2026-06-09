import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChunkErrorBoundary, reloadOnce } from "./components/ChunkErrorBoundary";
import "./index.css";

// A stale index.html (cached across a deploy) points at chunk hashes that no
// longer exist. Vite fires `vite:preloadError` when such a chunk fails to
// load; reload once to fetch the fresh index and its correct chunk refs.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadOnce();
});

const root = document.getElementById("root");

if (!root) {
  throw new Error("Landing root element '#root' was not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChunkErrorBoundary>
      <App />
    </ChunkErrorBoundary>
  </React.StrictMode>
);
