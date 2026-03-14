// "use client"
// import { io } from "socket.io-client";

// // ✅ Socket instance
// const socket = io("https://chat-app-server-render-v-1.onrender.com", {
//     transports: ["websocket"],
//     autoConnect: false, // manual connect
// });

// export default socket;



"use client"
import { io } from "socket.io-client";

// ✅ Socket instance
// const socket = io("https://calculator-chatapp-server-v-2.onrender.com", {
// const socket = io("https://chat-app-server-render-v-1.onrender.com", {

//     transports: ["websocket"],
//     autoConnect: false, // manual connect
// });

// const socket = io("https://calculator-chatapp-server-v-4.onrender.com", {
const socket = io('http://192.168.31.144:4000', {
    transports: ["websocket"],
    autoConnect: false, // manual connect
});

export default socket;
