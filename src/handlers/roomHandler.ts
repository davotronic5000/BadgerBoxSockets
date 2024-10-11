import { Server, Socket } from "socket.io"

const registerRoomHandlers = (io: Server, socket: Socket) => {

    const joinRoom = async (roomCode: string) => {
        socket.join(roomCode)
        const players = (await io.in(roomCode).fetchSockets()).map((player) => player.id)
        io.to(roomCode).emit("playerList", players)
    }

    socket.on("joinRoom", joinRoom)
}

export default registerRoomHandlers