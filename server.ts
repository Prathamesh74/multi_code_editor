import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // State for room management
  interface User {
    socketId: string;
    username: string;
    userId: string;
  }
  interface RoomState {
    code: string;
    language: string;
    drawHistory: any[];
    users: User[];
  }
  const rooms = new Map<string, RoomState>();
  const socketToRoom = new Map<string, string>();
  const socketToUser = new Map<string, string>();

  function setupSocketHandlers(io: Server) {
    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("room:join", ({ roomId, username, userId }: { roomId: string; username: string; userId: string }) => {
        console.log(`User ${username} (${userId}) joining room: ${roomId}`);
        
        // Cleanup previous room if user was in one
        const previousRoomId = socketToRoom.get(socket.id);
        if (previousRoomId && previousRoomId !== roomId) {
          socket.leave(previousRoomId);
          const prevRoom = rooms.get(previousRoomId);
          if (prevRoom) {
            prevRoom.users = prevRoom.users.filter(u => u.socketId !== socket.id);
            if (prevRoom.users.length === 0) {
              rooms.delete(previousRoomId);
            } else {
              io.to(previousRoomId).emit("user:left", { userId: socket.id, users: prevRoom.users });
            }
          }
        }

        socket.join(roomId);
        socketToRoom.set(socket.id, roomId);
        socketToUser.set(socket.id, username);

        if (!rooms.has(roomId)) {
          rooms.set(roomId, {
            code: '// Start coding here...',
            language: 'javascript',
            drawHistory: [],
            users: []
          });
        }
        
        const room = rooms.get(roomId)!;
        if (!room.users.find(u => u.socketId === socket.id)) {
          room.users.push({ socketId: socket.id, username, userId });
        }

        // Send current state to the joining user
        socket.emit("room:state", {
          code: room.code,
          language: room.language,
          drawHistory: room.drawHistory
        });

        // Notify everyone in the room including the sender
        io.to(roomId).emit("user:joined", { 
          users: room.users 
        });
        
        console.log(`User ${username} joined room: ${roomId}. Total users: ${room.users.length}`);
      });

      socket.on("code:change", ({ roomId, code }: { roomId: string; code: string }) => {
        const room = rooms.get(roomId);
        if (room) {
          room.code = code;
          socket.to(roomId).emit("code:update", code);
        }
      });

      socket.on("language:change", ({ roomId, language }: { roomId: string; language: string }) => {
        const room = rooms.get(roomId);
        if (room) {
          room.language = language;
          socket.to(roomId).emit("language:update", language);
        }
      });

      socket.on("draw:line", (data: any) => {
        const room = rooms.get(data.roomId);
        if (room) {
          room.drawHistory.push(data);
          socket.to(data.roomId).emit("draw:update", data);
        }
      });

      socket.on("draw:clear", (roomId: string) => {
        const room = rooms.get(roomId);
        if (room) {
          room.drawHistory = [];
          socket.to(roomId).emit("draw:cleared");
        }
      });

      socket.on("chat:send", (data: { roomId: string; username: string; message: string }) => {
        io.to(data.roomId).emit("chat:receive", {
          username: data.username,
          message: data.message,
          timestamp: new Date().toISOString()
        });
      });

      socket.on("disconnect", () => {
        const roomId = socketToRoom.get(socket.id);
        const username = socketToUser.get(socket.id);
        if (roomId) {
          const room = rooms.get(roomId);
          if (room) {
            room.users = room.users.filter((u) => u.socketId !== socket.id);
            
            if (room.users.length === 0) {
              rooms.delete(roomId);
            } else {
              io.to(roomId).emit("user:left", { users: room.users });
            }
            
            console.log(`User ${username} left room: ${roomId}. Remaining users: ${room.users.length}`);
          }
          
          socketToRoom.delete(socket.id);
          socketToUser.delete(socket.id);
        }
        console.log("User disconnected:", socket.id);
      });
    });
  }

  // Socket.io logic
  setupSocketHandlers(io);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/run", (req, res) => {
    const { code, language } = req.body;
    
    if (language !== 'javascript') {
      return res.status(400).json({ 
        output: `Error: Language '${language}' is not supported for direct execution. Use the frontend simulation.` 
      });
    }

    let output = `[JAVASCRIPT] Output:\n`;
    const log = (...args: any[]) => {
      output += args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ") + "\n";
    };

    const context = {
      console: {
        log: log,
        error: log,
        warn: log,
        info: log,
      },
    };

    try {
      const script = new vm.Script(code);
      vm.createContext(context);
      script.runInContext(context, { timeout: 1000 });
      res.json({ output: output || "Code executed successfully (no output)." });
    } catch (error: any) {
      res.json({ output: `Error: ${error.message}` });
    }
  });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);

        // Explicitly handle SPA fallback in dev mode for Express
        app.get("*", async (req, res, next) => {
            // Skip if it's an API or internal run route
            if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/run')) {
                return next();
            }
            
            try {
                const url = req.originalUrl;
                // Serve index.html for all other routes to support SPA routing
                const template = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CollabCanvas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
                const html = await vite.transformIndexHtml(url, template);
                res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
            } catch (e) {
                vite.ssrFixStacktrace(e as Error);
                next(e);
            }
        });
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
