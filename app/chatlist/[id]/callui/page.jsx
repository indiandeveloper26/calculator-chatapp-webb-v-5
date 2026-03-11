// // "use client";

// // import { ChatContext } from "@/app/context/chatcontext";
// // import socket from "@/app/socket";
// // import { useParams, useRouter } from "next/navigation";
// // import { useState, useEffect, useContext } from "react";

// // export default function CallingScreen() {

// //     let { id } = useParams()
// //     let router = useRouter()

// //     console.log('iddd', id)
// //     const callee = {
// //         name: "Sahil",
// //         avatar: "/img.png", // अपने public folder में रखें
// //     };
// //     const [callAccepted, setCallAccepted] = useState(false);
// //     const [callActive, setCallActive] = useState(true);
// //     const [mediaType, setMediaType] = useState("video"); // default video
// //     const [dots, setDots] = useState(".");



// //     let { socket, myUsername, callchek,
// //         setcallchek, } = useContext(ChatContext)

// //     // console.log(callchek,
// //     // )

// //     // URL से media type (video/audio) सेट करना




// //     useEffect(() => {
// //         const params = new URLSearchParams(window.location.search);
// //         const type = params.get("type");
// //         if (type === "audio") setMediaType("audio");
// //     }, []);

// //     // Blinking dots animation
// //     useEffect(() => {
// //         const interval = setInterval(() => {
// //             setDots((prev) => (prev.length < 3 ? prev + "." : "."));
// //         }, 500);
// //         return () => clearInterval(interval);
// //     }, []);

// //     // End Call function
// //     const handleEndCall = () => {

// //         // alert('endign call')
// //         socket.emit('end-call', { to: id, from: myUsername })
// //         setCallActive(false); // <-- Call Ended Screen दिखाने के लिए
// //         router.push(`/chatlist/${id}`);
// //     };

// //     if (!callActive)
// //         return (
// //             <div
// //                 style={{
// //                     width: "100vw",
// //                     height: "100vh",
// //                     display: "flex",
// //                     justifyContent: "center",
// //                     alignItems: "center",
// //                     backgroundColor: "#111",
// //                     color: "#fff",
// //                 }}
// //             >
// //                 <h2>Call Ended</h2>
// //             </div>
// //         );

// //     return (
// //         <div
// //             style={{
// //                 width: "100vw",
// //                 height: "100vh",
// //                 display: "flex",
// //                 flexDirection: "column",
// //                 justifyContent: "center",
// //                 alignItems: "center",
// //                 backgroundColor: "#000",
// //                 color: "#fff",
// //                 gap: "30px",
// //                 fontFamily: "sans-serif",
// //             }}
// //         >
// //             {!callAccepted ? (
// //                 // Outgoing Calling Screen
// //                 <>
// //                     <img
// //                         src={callee.avatar}
// //                         alt={callee.name}
// //                         style={{ width: "120px", height: "120px", borderRadius: "50%" }}
// //                     />
// //                     <h2>Calling {callee.name}{dots}</h2>
// //                     <p>Waiting for the user to accept the call</p>
// //                     <button
// //                         onClick={handleEndCall}
// //                         style={{
// //                             padding: "12px 30px",
// //                             backgroundColor: "red",
// //                             color: "#fff",
// //                             border: "none",
// //                             borderRadius: "50px",
// //                             cursor: "pointer",
// //                             fontWeight: "bold",
// //                             marginTop: "20px",
// //                         }}
// //                     >
// //                         Cancel Call
// //                     </button>
// //                 </>
// //             ) : (
// //                 // Call Accepted Screen
// //                 <>
// //                     <h2>In Call with {callee.name}</h2>

// //                     {mediaType === "video" ? (
// //                         <div
// //                             style={{
// //                                 width: "80%",
// //                                 height: "60%",
// //                                 backgroundColor: "#333",
// //                                 borderRadius: "12px",
// //                                 overflow: "hidden",
// //                             }}
// //                         >
// //                             <video
// //                                 autoPlay
// //                                 muted
// //                                 style={{ width: "100%", height: "100%", objectFit: "cover" }}
// //                             >
// //                                 <source src="/media/sample-video.mp4" type="video/mp4" />
// //                             </video>
// //                         </div>
// //                     ) : (
// //                         <audio autoPlay controls style={{ marginTop: "20px" }}>
// //                             <source src="/media/sample-audio.mp3" type="audio/mpeg" />
// //                         </audio>
// //                     )}

// //                     <button
// //                         onClick={handleEndCall}
// //                         style={{
// //                             marginTop: "20px",
// //                             padding: "12px 30px",
// //                             backgroundColor: "red",
// //                             color: "#fff",
// //                             border: "none",
// //                             borderRadius: "50px",
// //                             cursor: "pointer",
// //                             fontWeight: "bold",
// //                         }}
// //                     >
// //                         End Call
// //                     </button>
// //                 </>
// //             )}
// //         </div>
// //     );
// // }














// "use client";

// import { useEffect, useRef, useState, useContext } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ChatContext } from "@/app/context/chatcontext";

// const configuration = {
//     iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//     ],
// };

// export default function CallingScreen() {
//     const { id } = useParams(); // caller username
//     const router = useRouter();

//     const { socket, myUsername } = useContext(ChatContext);

//     // 🔑 SAME ROOM ID (RN jaisa)
//     const roomId = [myUsername, id].sort().join("_");

//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const pcRef = useRef(null);

//     const [callAccepted, setCallAccepted] = useState(false);

//     // 1️⃣ INIT PEER
//     useEffect(() => {
//         pcRef.current = new RTCPeerConnection(configuration);

//         pcRef.current.ontrack = (event) => {
//             remoteVideoRef.current.srcObject = event.streams[0];
//         };

//         pcRef.current.onicecandidate = (event) => {
//             if (event.candidate) {
//                 socket.emit("webrtc-candidate", {
//                     roomId,
//                     candidate: event.candidate,
//                 });
//             }
//         };

//         socket.emit("join-room", { roomId });

//         socket.on("webrtc-offer", async ({ sdp }) => {
//             setCallAccepted(true);

//             await pcRef.current.setRemoteDescription({
//                 type: "offer",
//                 sdp,
//             });

//             const stream = await navigator.mediaDevices.getUserMedia({
//                 video: true,
//                 audio: true,
//             });

//             localVideoRef.current.srcObject = stream;
//             stream.getTracks().forEach(track =>
//                 pcRef.current.addTrack(track, stream)
//             );

//             const answer = await pcRef.current.createAnswer();
//             await pcRef.current.setLocalDescription(answer);

//             socket.emit("webrtc-answer", {
//                 roomId,
//                 sdp: answer.sdp,
//             });
//         });

//         socket.on("webrtc-candidate", async ({ candidate }) => {
//             await pcRef.current.addIceCandidate(candidate);
//         });

//         socket.on("end-call", () => {
//             endCall();
//         });

//         return () => {
//             socket.removeAllListeners();
//             pcRef.current?.close();
//         };
//     }, []);

//     // 2️⃣ END CALL
//     const endCall = () => {
//         socket.emit("end-call", { roomId });
//         pcRef.current?.close();
//         router.push(`/chatlist/${id}`);
//     };

//     return (
//         <div style={styles.container}>
//             {!callAccepted ? (
//                 <>
//                     <h2>Incoming Call...</h2>
//                     <p>{id} is calling you</p>

//                     <button style={styles.accept}>
//                         Waiting for connection...
//                     </button>

//                     <button style={styles.end} onClick={endCall}>
//                         Reject
//                     </button>
//                 </>
//             ) : (
//                 <>
//                     <h3>In Call with {id}</h3>

//                     <div style={styles.videoBox}>
//                         <video
//                             ref={remoteVideoRef}
//                             autoPlay
//                             playsInline
//                             style={styles.video}
//                         />
//                     </div>

//                     <video
//                         ref={localVideoRef}
//                         autoPlay
//                         muted
//                         playsInline
//                         style={styles.local}
//                     />

//                     <button style={styles.end} onClick={endCall}>
//                         End Call
//                     </button>
//                 </>
//             )}
//         </div>
//     );
// }

// const styles = {
//     container: {
//         width: "100vw",
//         height: "100vh",
//         backgroundColor: "#000",
//         color: "#fff",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "20px",
//     },
//     videoBox: {
//         width: "80%",
//         height: "60%",
//         backgroundColor: "#222",
//         borderRadius: "12px",
//         overflow: "hidden",
//     },
//     video: {
//         width: "100%",
//         height: "100%",
//         objectFit: "cover",
//     },
//     local: {
//         width: "160px",
//         height: "120px",
//         position: "absolute",
//         bottom: "100px",
//         right: "20px",
//         borderRadius: "8px",
//         border: "2px solid white",
//     },
//     accept: {
//         padding: "12px 30px",
//         backgroundColor: "green",
//         borderRadius: "50px",
//         color: "#fff",
//         border: "none",
//     },
//     end: {
//         padding: "12px 30px",
//         backgroundColor: "red",
//         borderRadius: "50px",
//         color: "#fff",
//         border: "none",
//     },
// };



"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatContext } from "@/app/context/chatcontext";
import { PhoneOff, Video, Phone, MicOff, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function page({ from, to, callType = "video" }) {
    const { socket } = useContext(ChatContext);
    const router = useRouter();
    const [dots, setDots] = useState(".");

    // Calling animation dots logic
    useEffect(() => {
        const i = setInterval(() => {
            setDots((d) => (d.length < 3 ? d + "." : "."));
        }, 500);
        return () => clearInterval(i);
    }, []);

    const handleCancel = () => {
        socket.emit("end-call", { to, from });
        router.back();
    };

    return (
        <div className="relative h-screen w-full bg-[#0b0e11] flex flex-col items-center justify-between py-20 overflow-hidden text-white">

            {/* --- Animated Background Ripples --- */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
                {[1, 2, 3].map((index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: index,
                            ease: "easeOut",
                        }}
                        className="absolute w-64 h-64 border border-emerald-500/30 rounded-full"
                    />
                ))}
            </div>

            {/* --- TOP SECTION: User Info --- */}
            <div className="z-10 flex flex-col items-center gap-4">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
                >
                    <span className="text-emerald-400 animate-pulse">●</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                        {callType === "video" ? "Outgoing Video Call" : "Outgoing Audio Call"}
                    </span>
                </motion.div>

                <div className="mt-8 flex flex-col items-center">
                    <h1 className="text-3xl font-bold tracking-tight">{to}</h1>
                    <p className="text-slate-400 text-lg font-medium mt-1">
                        Calling{dots}
                    </p>
                </div>
            </div>

            {/* --- MIDDLE SECTION: Avatar --- */}
            <div className="relative z-10">
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative"
                >
                    <div className="w-40 h-40 rounded-full border-4 border-emerald-500 p-1 shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]">
                        <img
                            src={`https://ui-avatars.com/api/?name=${to}&background=10b981&color=fff&size=200`}
                            alt="avatar"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </motion.div>

                {/* Small Call Type Overlay Icon */}
                <div className="absolute bottom-2 right-2 bg-emerald-500 p-2.5 rounded-full shadow-lg border-4 border-[#0b0e11]">
                    {callType === "video" ? <Video size={18} fill="white" /> : <Phone size={18} fill="white" />}
                </div>
            </div>

            {/* --- BOTTOM SECTION: Controls --- */}
            <div className="z-10 w-full max-w-md px-10">
                <div className="flex flex-col gap-10 items-center">

                    {/* Secondary Controls */}
                    <div className="flex justify-center gap-8 text-slate-400">
                        <button className="p-4 hover:bg-white/10 rounded-full transition-all">
                            <MicOff size={24} />
                        </button>
                        <button className="p-4 hover:bg-white/10 rounded-full transition-all">
                            <Volume2 size={24} />
                        </button>
                    </div>

                    {/* Main End Call Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCancel}
                        className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(239,68,68,0.5)] group"
                    >
                        <PhoneOff size={32} className="text-white group-hover:rotate-12 transition-transform" />
                    </motion.button>
                </div>
            </div>

            {/* Background Gradient Glow */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full h-64 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
}