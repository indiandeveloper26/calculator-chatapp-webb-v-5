// "use client";

// import { ChatContext } from "@/app/context/chatcontext";
// import { useParams, useRouter } from "next/navigation";
// import { useContext, useEffect, useRef, useState } from "react";
// import { Mic, MicOff, PhoneOff, User } from "lucide-react";

// export default function AudioCallPage() {
//     const [localStream, setLocalStream] = useState(null);
//     const [remoteStream, setRemoteStream] = useState(null);
//     const [isMuted, setIsMuted] = useState(false);

//     const params = useParams();
//     const { id: ROOM_ID } = params; // Dynamic ID from URL

//     const pc = useRef(null);
//     const remoteAudioRef = useRef(null);

//     const { socket, incomingUser } = useContext(ChatContext);
//     const route = useRouter();

//     useEffect(() => {
//         if (!socket) return;

//         // 1. Peer Connection Initialize
//         const pcInstance = new RTCPeerConnection({
//             iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//         });
//         pc.current = pcInstance;

//         // 2. Audio Only Capture
//         navigator.mediaDevices.getUserMedia({
//             video: false, // Video Off
//             audio: true   // Audio On
//         })
//             .then(stream => {
//                 setLocalStream(stream);
//                 stream.getTracks().forEach(track => pc.current.addTrack(track, stream));
//             })
//             .catch(err => console.error("Media Error:", err));

//         // 3. Remote Audio Stream Handle
//         pc.current.ontrack = (event) => {
//             setRemoteStream(event.streams[0]);
//             if (remoteAudioRef.current) {
//                 remoteAudioRef.current.srcObject = event.streams[0];
//             }
//         };

//         // 4. Signaling Listeners (ISI PAGE PAR)
//         pc.current.onicecandidate = (e) => {
//             if (e.candidate) {
//                 socket.emit("webrtc-candidate", {
//                     roomId: ROOM_ID,
//                     candidate: e.candidate
//                 });
//             }
//         };

//         socket.on("webrtc-offer", async ({ sdp }) => {
//             if (!pc.current) return;
//             await pc.current.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
//             const answer = await pc.current.createAnswer();
//             await pc.current.setLocalDescription(answer);
//             socket.emit("webrtc-answer", { roomId: ROOM_ID, sdp: answer.sdp });
//         });

//         socket.on("webrtc-answer", async ({ sdp }) => {
//             if (pc.current.signalingState !== "stable") {
//                 await pc.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
//             }
//         });

//         socket.on("webrtc-candidate", async ({ candidate }) => {
//             try {
//                 if (pc.current) {
//                     await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
//                 }
//             } catch (err) { console.error("ICE Candidate Error:", err); }
//         });

//         socket.on("end-call", endCall);

//         // 5. Join and Create Offer
//         socket.emit("join-room", { roomId: ROOM_ID });

//         const timer = setTimeout(async () => {
//             if (pc.current && pc.current.signalingState === "stable") {
//                 const offer = await pc.current.createOffer();
//                 await pc.current.setLocalDescription(offer);
//                 socket.emit("webrtc-offer", { roomId: ROOM_ID, sdp: offer.sdp });
//             }
//         }, 1500);

//         return () => {
//             clearTimeout(timer);
//             cleanup();
//             socket.off("webrtc-offer");
//             socket.off("webrtc-answer");
//             socket.off("webrtc-candidate");
//             socket.off("end-call");
//         };
//     }, [socket, ROOM_ID]);

//     const toggleMic = () => {
//         const audioTrack = localStream?.getAudioTracks()[0];
//         if (audioTrack) {
//             audioTrack.enabled = !audioTrack.enabled;
//             setIsMuted(!audioTrack.enabled);
//         }
//     };

//     const cleanup = () => {
//         if (pc.current) {
//             pc.current.close();
//             pc.current = null;
//         }
//         if (localStream) {
//             localStream.getTracks().forEach(track => track.stop());
//         }
//     };

//     const endCall = () => {
//         cleanup();
//         route.push("/chatlist");
//     };

//     return (
//         <div className="relative h-screen w-full bg-[#0b0f1a] flex flex-col items-center justify-center text-white">

//             {/* Audio Output (Hidden) */}
//             <audio ref={remoteAudioRef} autoPlay playsInline />

//             {/* Caller UI */}
//             <div className="flex flex-col items-center gap-6">
//                 <div className={`w-40 h-40 bg-slate-800 rounded-full flex items-center justify-center border-4 ${remoteStream ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-blue-500 animate-pulse'}`}>
//                     <User size={80} className="text-slate-400" />
//                 </div>

//                 <div className="text-center">
//                     <h2 className="text-3xl font-bold">{incomingUser || "Connecting..."}</h2>
//                     <p className="text-slate-400 mt-2">
//                         {remoteStream ? "On Call" : "Calling..."}
//                     </p>
//                 </div>
//             </div>

//             {/* Call Controls */}
//             <div className="absolute bottom-16 flex gap-10">
//                 <button
//                     onClick={toggleMic}
//                     className={`p-5 rounded-full transition-all ${isMuted ? 'bg-red-500 shadow-lg' : 'bg-slate-700 hover:bg-slate-600'}`}
//                 >
//                     {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
//                 </button>

//                 <button
//                     onClick={endCall}
//                     className="p-6 bg-red-600 hover:bg-red-700 rounded-full shadow-xl transition-transform active:scale-95"
//                 >
//                     <PhoneOff size={32} />
//                 </button>
//             </div>
//         </div>
//     );
// }
"use client";

import { ChatContext } from "@/app/context/chatcontext";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, User } from "lucide-react";

export default function AudioCallPage() {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [seconds, setSeconds] = useState(0);

    const pc = useRef(null);
    const remoteAudioRef = useRef(null);
    const timerRef = useRef(null);

    // Context se data nikalna
    const { socket, incomingUser, roomid } = useContext(ChatContext);
    const router = useRouter();

    // Agar context mein roomId hai toh wo use karein, warna fallback ID
    const ROOM_ID = roomid
    // User ka naam dikhane ke liye 'from' property use karein
    const callerName = incomingUser?.from || "Unknown User";

    // 1. Timer Logic
    useEffect(() => {
        if (remoteStream) {
            timerRef.current = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setSeconds(0);
        }
        return () => clearInterval(timerRef.current);
    }, [remoteStream]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 2. WebRTC Logic
    useEffect(() => {
        if (!socket) return;

        const pcInstance = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        pc.current = pcInstance;

        // Mic Access
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then(stream => {
                setLocalStream(stream);
                stream.getTracks().forEach(track => {
                    if (pc.current) pc.current.addTrack(track, stream);
                });
            })
            .catch(err => console.error("Mic Access Error:", err));

        // Remote Track Receive
        pc.current.ontrack = (event) => {
            console.log("Remote track received");
            setRemoteStream(event.streams[0]);
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
            }
        };

        // ICE Candidate
        pc.current.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit("webrtc-candidate", { roomId: ROOM_ID, candidate: e.candidate });
            }
        };

        // Signaling Listeners
        socket.on("webrtc-offer", async ({ sdp }) => {
            if (!pc.current) return;
            try {
                await pc.current.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                socket.emit("webrtc-answer", { roomId: ROOM_ID, sdp: answer.sdp });
            } catch (e) { console.error("Offer Error", e); }
        });

        socket.on("webrtc-answer", async ({ sdp }) => {
            if (pc.current && pc.current.signalingState !== "stable") {
                try {
                    await pc.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
                } catch (e) { console.error("Answer Error", e); }
            }
        });

        socket.on("webrtc-candidate", async ({ candidate }) => {
            try {
                if (pc.current) await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) { console.error("ICE Error", err); }
        });

        socket.on("end-call", endCall);

        // Join Room
        socket.emit("join-room", { roomId: ROOM_ID });

        // Negotiation Logic
        const negTimer = setTimeout(async () => {
            if (pc.current && pc.current.signalingState === "stable" && !remoteStream) {
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);
                socket.emit("webrtc-offer", { roomId: ROOM_ID, sdp: offer.sdp });
            }
        }, 1500);

        return () => {
            clearTimeout(negTimer);
            cleanup();
            socket.off("webrtc-offer");
            socket.off("webrtc-answer");
            socket.off("webrtc-candidate");
            socket.off("end-call");
        };
    }, [socket, ROOM_ID]); // ROOM_ID dependency add kari hai

    const toggleMic = () => {
        const audioTrack = localStream?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const cleanup = () => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    };

    const endCall = () => {
        cleanup();
        router.push("/chatlist");
    };

    return (
        <div className="relative h-screen w-full bg-[#0b0f1a] flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Background Animation */}
            {remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="absolute w-[350px] h-[350px] border border-blue-500 rounded-full animate-ping"></div>
                    <div className="absolute w-[550px] h-[550px] border border-blue-400 rounded-full animate-pulse"></div>
                </div>
            )}

            {/* Hidden Audio Element */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* User Avatar */}
                <div className={`w-44 h-44 bg-slate-800 rounded-full flex items-center justify-center border-4 transition-all duration-700 shadow-2xl ${remoteStream ? 'border-green-500 scale-105 shadow-green-900/20' : 'border-blue-500 animate-pulse'}`}>
                    <User size={100} className="text-slate-500" />
                </div>

                <div className="text-center">
                    {/* FIX: Object ki jagah 'callerName' (string) render ho raha hai */}
                    <h2 className="text-3xl font-bold tracking-tight">{callerName}</h2>

                    <div className="mt-3 h-10 flex flex-col items-center">
                        {remoteStream ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in">
                                <span className="text-green-400 font-mono text-2xl tracking-[0.2em]">{formatTime(seconds)}</span>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-1">Connected</span>
                            </div>
                        ) : (
                            <p className="text-slate-400 animate-pulse tracking-widest uppercase text-sm">Calling...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-16 flex gap-12 z-10 items-center">
                <button onClick={toggleMic} className={`p-5 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500 shadow-lg' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    {isMuted ? <MicOff size={30} /> : <Mic size={30} />}
                </button>
                <button onClick={endCall} className="p-7 bg-red-600 hover:bg-red-500 rounded-full shadow-2xl group transition-all transform active:scale-95">
                    <PhoneOff size={36} className="group-hover:rotate-[135deg] transition-transform duration-500" />
                </button>
            </div>
        </div>
    );
}