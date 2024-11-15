import { Server, Socket } from "socket.io"

interface MemberList {
    owners: string[];
    players: string[];
    audience: string[];
}

interface MemberStatus {
    memberType: 'owner' | 'audience' | 'player' 
}

const createRoomName = (code: string) => (type: 'owner' | 'audience' | 'player') => {
    return `${code}-${type}`;
}

const createRoomCodes = (code: string) => {
    const getName = createRoomName(code);
    return {
        owner: getName('owner'),
        audience: getName('audience'),
        player: getName('player')
    };
}

const getMemberList = async (io: Server, roomCode: string) : Promise<MemberList> => {
    const roomCodeNames = createRoomCodes(roomCode)

    return {
        owners: (await io.in(roomCodeNames.owner).fetchSockets()).map((player) => player.id),
        players: (await io.in(roomCodeNames.player).fetchSockets()).map((player) => player.id),
        audience: (await io.in(roomCodeNames.audience).fetchSockets()).map((player) => player.id),
    }
}

const registerRoomHandlers = (io: Server, socket: Socket) => {

    const joinRoomAsOwner = async (roomCode: string) => {
        const roomCodeNames = createRoomCodes(roomCode)
        const ownerRoom = roomCodeNames.owner;

        if (io.sockets.adapter.rooms.get(roomCode))
        {
            const clients = io.sockets.adapter.rooms.get(ownerRoom)
            if (clients)
            {
                for (const client in clients) {
                    io.sockets.sockets.get(client)?.leave(ownerRoom)
                }
            }
        }
        socket.join(roomCode)
        socket.join(ownerRoom)
        io.to(roomCode).emit("memberList", await getMemberList(io, roomCode))
        const memberStatus: MemberStatus = {
            memberType: 'owner'
        }
        socket.emit("memberStatus", memberStatus)
    }

    const joinRoom = async (roomCode: string) => {
        const roomCodeNames = createRoomCodes(roomCode)
        const audienceRoom = roomCodeNames.audience;
        socket.join(roomCode)
        socket.join(audienceRoom)
        io.to(roomCode).emit("memberList", await getMemberList(io, roomCode))
    }

    const becomePlayer = async (roomCode: string) => {
        const roomCodeNames = createRoomCodes(roomCode)
        socket.leave(roomCodeNames.audience)
        socket.join(roomCodeNames.player)
        io.to(roomCode).emit("memberList", await getMemberList(io, roomCode))
        const memberStatus: MemberStatus = {
            memberType: 'player'
        }
        socket.emit("memberStatus", memberStatus)

    }

    const becomeAudience = async (roomCode: string) => {
        const roomCodeNames = createRoomCodes(roomCode)
        socket.leave(roomCodeNames.player)
        socket.join(roomCodeNames.audience)
        io.to(roomCode).emit("memberList", await getMemberList(io, roomCode))
        const memberStatus: MemberStatus = {
            memberType: 'audience'
        }
        socket.emit("memberStatus", memberStatus)
    }

    const demotePlayer = async (roomCode: string, memberId: string) => {
        const roomCodeNames = createRoomCodes(roomCode)
        const memberSocket = (await io.in(memberId).fetchSockets())[0]
        memberSocket.leave(roomCodeNames.player)
        memberSocket.join(roomCodeNames.audience)
        io.to(roomCode).emit("memberList", await getMemberList(io, roomCode))
        const memberStatus: MemberStatus = {
            memberType: 'audience'
        }
        memberSocket.emit("memberStatus", memberStatus)
    }

    socket.on("joinRoomAsOwner", joinRoomAsOwner)
    socket.on("joinRoom", joinRoom)
    socket.on("becomePlayer", becomePlayer)
    socket.on("becomeAudience", becomeAudience)
    socket.on("demotePlayer", demotePlayer)
}

export default registerRoomHandlers