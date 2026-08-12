import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { apiRouter, setBroadcastHandler } from "./src/server/routes.js";
import { setupWebSocketServer } from "./src/server/ws.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = http.createServer(app);

// Mount API Router
app.use("/api", apiRouter);

// Setup WebSocket Server & Connect Broadcast Handler
const { broadcast } = setupWebSocketServer(server);
setBroadcastHandler(broadcast);

// Start Server with Vite Middleware in Dev or Static files in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor Logística iFood Express rodando na porta ${PORT}`);
    console.log(`🔒 Camada de Autenticação com Tokens Bearer & WebSocket Seguro Ativados`);
    console.log(`💾 Persistência de Dados Ativada em data/store.json`);
  });
}

startServer();
