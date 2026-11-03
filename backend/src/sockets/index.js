import { interviewSocket } from "./interview.socket.js";

export function initSockets(io) {

  io.on("connection", async (socket) => {

    console.log("User connected:", socket.id);

    await interviewSocket(socket);

    socket.on("disconnect", () => {

      console.log("User disconnected");

    });

  });

}