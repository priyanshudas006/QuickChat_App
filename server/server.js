import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import connectDB from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    "http://localhost:5174",
    "http://localhost:5173",
    "https://quick-chat-app-beta-lake.vercel.app",
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header) and configured origins
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: false,
};

export const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length ? allowedOrigins : "*",
    },
})

export const userSocketMap = {};

const getConnectedUserIds = () =>
  Object.keys(userSocketMap).filter(
    (userId) => userSocketMap[userId] && userSocketMap[userId].size > 0,
  );

export const getUserSocketIds = (userId) => {
  const key = String(userId || "");
  return userSocketMap[key] ? Array.from(userSocketMap[key]) : [];
};

io.on("connection", (socket)=>{
    const userId = String(socket.handshake.query.userId || "");
    console.log("New client connected with userId:", userId);

    if(userId){
        if (!userSocketMap[userId]) {
            userSocketMap[userId] = new Set();
        }
        userSocketMap[userId].add(socket.id);
    }

    io.emit("getOnlineUsers", getConnectedUserIds());

    socket.on("disconnect", ()=>{
        console.log("Client disconnected with userId:", userId);
        if (userSocketMap[userId]) {
            userSocketMap[userId].delete(socket.id);
            if (userSocketMap[userId].size === 0) {
                delete userSocketMap[userId];
            }
        }
        io.emit("getOnlineUsers", getConnectedUserIds());
    })
})

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors(corsOptions));

app.use("/api/status", (req, res) => {
    res.send("Server is running");
})
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
