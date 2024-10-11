import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import registerRoomHandlers from './handlers/roomHandler'


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
const port = 3001



io.on("connection", async (socket) => {
  registerRoomHandlers(io, socket)
})

io.emit("hello", "everyone");

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});