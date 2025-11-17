// vite.config.ts (microfrontend "clinic")
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

// Só para documentação/clareza (não é usado diretamente)
const DEV_HOSTS = ["http://localhost:3000", "http://127.0.0.1:3000", "http://zappoint:3000"];

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "clinic",
      filename: "remoteEntry.js",
      exposes: {
        "./FuncionarioForm":
          "./src/components/Forms/UsuarioForm/FuncionarioForm.tsx",
        "./Cabecalho":
          "./src/components/Cabecalho/Cabecalho.tsx",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: "^18.2.0",
        } as any,
        "react-dom": {
          singleton: true,
          requiredVersion: "^18.2.0",
        } as any,
        "@mui/material": {
          singleton: true,
          requiredVersion: "^5.14.0",
        } as any,
        "@emotion/react": { singleton: true } as any,
        "@emotion/styled": { singleton: true } as any,
      },
    }),
  ],

  server: {
    // escuta em todas as interfaces (localhost, 127.0.0.1, zappoint, etc.)
    host: true,
    port: 5001,
    strictPort: true,

    // 🔥 CORS totalmente liberado no dev server do Vite
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },

    // 🔥 permite qualquer host bater nesse dev server
    allowedHosts: true,

    // HMR funcionando mesmo se você acessar via zappoint
    hmr: {
      host: "zappoint", // se preferir pode trocar pra "localhost"
      port: 5001,
      protocol: "ws",
    },
  },

  build: {
    target: "esnext",
    modulePreload: { polyfill: false }, // recomendação do vite-plugin-federation
    cssCodeSplit: true,
    minify: false, // facilita debug
  },
});
