import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        clinic: "http://localhost:5001/assets/remoteEntry.js",
      },
      shared: {
        react: {
          requiredVersion: "^18.2.0",
          singleton: true,
        } as any,
        "react-dom": {
          requiredVersion: "^18.2.0",
          singleton: true,
        } as any,
        "@mui/material": { singleton: true } as any,
        "@emotion/react": { singleton: true } as any,
        "@emotion/styled": { singleton: true } as any,
      },
    }),
  ],
  server: {
    host: true,
    port: 3000,

    // 👇 libera os hosts que podem acessar o dev server
    allowedHosts: ["zappoint", "localhost"],

    // 👇 opcional mas recomendado pra HMR funcionar bonitinho com o novo host
    hmr: {
      host: "zappoint",
      port: 3000,
      protocol: "ws",
    },
  },
  build: {
    target: "esnext",
  },
});
