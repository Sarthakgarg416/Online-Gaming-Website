const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://localhost:3000", //chat
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("send_message", (data) => {
    console.log("📩 Message:", data);
    io.emit("receive_message", data); // Broadcast
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("🚀 Server running at http://localhost:4000");
});
