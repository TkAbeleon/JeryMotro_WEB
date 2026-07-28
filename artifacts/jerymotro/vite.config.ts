import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
  const env = loadEnv(mode, workspaceRoot, "");

  const rawPort = env.PORT || process.env.PORT || "8080";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH || process.env.BASE_PATH || "/";

  // Read backend PORT directly from its .env
  let backendPort = "8081";
  try {
    const backendEnvPath = path.resolve(import.meta.dirname, "..", "api-server", ".env");
    if (fs.existsSync(backendEnvPath)) {
      const envContent = fs.readFileSync(backendEnvPath, "utf-8");
      const match = envContent.match(/^PORT\s*=\s*(\d+)/m);
      if (match) {
        backendPort = match[1];
      }
    }
  } catch (e) {
    console.warn("Could not read backend .env, defaulting to 8081", e);
  }

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      "import.meta.env.VITE_API_BACKEND_PORT": JSON.stringify(backendPort),
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    envDir: workspaceRoot,
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: env.VITE_API_PROXY_TARGET ? {
        "/jerymotro-api": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
        },
      } : undefined,
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: env.VITE_API_PROXY_TARGET ? {
        "/jerymotro-api": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
        },
      } : undefined,
    },
  };
});
