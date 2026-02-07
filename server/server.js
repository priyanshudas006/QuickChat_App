import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import connectDB from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

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
