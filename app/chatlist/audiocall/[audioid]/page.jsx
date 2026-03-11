"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContext } from "@/app/context/chatcontext";
import { Mic, MicOff, PhoneOff, User, MoreVertical, ShieldCheck, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AudioCall() {
    const { socket, myUsername, currentCall } = useContext(ChatContext);
    const { audioid } = useParams(); // opponent username
    const router = useRouter();

    const pc = useRef(null);
    const remoteAudioRef = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [callTime, setCallTime] = useState(0);

    // ✅ Testing ke liye Static Room ID
    const TEST_ROOM_ID = "123456";

    // ✅ WebRTC Logic (Preserved)
    const createPeer = () => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        peer.ontrack = (event) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("webrtc-candidate", {
                    to: audioid,
                    roomId: TEST_ROOM_ID, // Static ID use ki
                    candidate: event.candidate,
                });
            }
        };
        return peer;
    };

    useEffect(() => {
        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(stream);
            } catch (err) {
                console.error("🎙️ Mic permission error:", err);
            }
        };
        startStream();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on("webrtc-offer", async ({ from, sdp }) => {
            pc.current = createPeer();
            localStream?.getTracks().forEach((track) => pc.current.addTrack(track, localStream));
            await pc.current.setRemoteDescription({ type: "offer", sdp });
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.emit("webrtc-answer", { to: from, roomId: TEST_ROOM_ID, sdp: answer });
            setIsCallActive(true);
        });

        socket.on("webrtc-answer", async ({ from, sdp }) => {
            await pc.current.setRemoteDescription({ type: "answer", sdp });
            setIsCallActive(true);
        });

        socket.on("webrtc-candidate", async ({ candidate }) => {
            if (pc.current && candidate) {
                try { await pc.current.addIceCandidate(candidate); }
                catch (e) { console.error(e); }
            }
        });

        socket.on("end-call", () => endCall(false));

        return () => {
            socket.off("webrtc-offer");
            socket.off("webrtc-answer");
            socket.off("webrtc-candidate");
            socket.off("end-call");
        };
    }, [socket, localStream]);

    useEffect(() => {
        if (!localStream) return;
        if (currentCall?.from === myUsername) makeOffer();
    }, [localStream, currentCall]);

    const makeOffer = async () => {
        pc.current = createPeer();
        localStream.getTracks().forEach((track) => pc.current.addTrack(track, localStream));
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: audioid, roomId: TEST_ROOM_ID, sdp: offer });
        setIsCallActive(true);
    };

    const toggleMic = () => {
        const track = localStream?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    };

    const endCall = (emit = true) => {
        if (emit) socket.emit("end-call", { to: audioid, roomId: TEST_ROOM_ID });
        pc.current?.close();
        localStream?.getTracks().forEach((t) => t.stop());
        setIsCallActive(false);
        router.push(`/chatlist/${audioid}`);
    };

    useEffect(() => {
        if (!isCallActive) return;
        const timer = setInterval(() => setCallTime((p) => p + 1), 1000);
        return () => clearInterval(timer);
    }, [isCallActive]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="h-screen w-full bg-[#0B0E11] flex flex-col items-center justify-between py-16 px-6 overflow-hidden text-white font-sans relative">

            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />

            {/* Header Info */}
            <div className="flex flex-col items-center z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-8 backdrop-blur-xl"
                >
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">
                        End-to-End Encrypted
                    </p>
                </motion.div>

                <h1 className="text-4xl font-bold tracking-tight mb-3 capitalize">{audioid}</h1>

                <div className="flex items-center gap-2 text-slate-400">
                    {isCallActive ? (
                        <span className="text-xl font-mono text-emerald-400 tracking-wider">
                            {formatTime(callTime)}
                        </span>
                    ) : (
                        <span className="animate-pulse flex items-center gap-2 italic">
                            Connecting...
                        </span>
                    )}
                </div>
            </div>

            {/* Central Avatar & Wave Animation */}
            <div className="relative flex items-center justify-center scale-110">
                <AnimatePresence>
                    {isCallActive && !isMuted && (
                        <>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                className="absolute w-44 h-44 bg-emerald-500/20 rounded-full border border-emerald-500/30"
                            />
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.3 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.7, ease: "easeOut" }}
                                className="absolute w-44 h-44 bg-teal-500/10 rounded-full border border-teal-500/20"
                            />
                        </>
                    )}
                </AnimatePresence>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-tr from-[#1c1c1e] to-[#2c2c2e] p-1.5 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
                >
                    <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center overflow-hidden relative">
                        <User size={90} className="text-slate-700" />

                        {/* Speaker Indicator */}
                        {isCallActive && !isMuted && (
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute bottom-6 right-8 bg-emerald-500 p-2 rounded-full border-4 border-[#121214] shadow-lg"
                            >
                                <Volume2 size={16} className="text-white" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* Control Bar */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm bg-[#1c1c1e]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-5 flex items-center justify-around shadow-2xl z-20 relative ring-1 ring-white/5"
            >
                {/* Mute Button */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={toggleMic}
                        className={`p-5 rounded-full transition-all duration-300 active:scale-90 ${isMuted ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-white/5 text-white hover:bg-white/10"
                            }`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Mute</span>
                </div>

                {/* End Call Button */}
                <button
                    onClick={() => endCall(true)}
                    className="p-7 bg-[#ff3b30] text-white rounded-full shadow-[0_10px_30px_rgba(255,59,48,0.4)] hover:scale-110 active:scale-95 transition-all group"
                >
                    <PhoneOff size={32} className="group-hover:rotate-[135deg] transition-transform duration-300" />
                </button>

                {/* More/Speaker Button */}
                <div className="flex flex-col items-center gap-2">
                    <button className="p-5 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all active:scale-90">
                        <Volume2 size={24} />
                    </button>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Speaker</span>
                </div>
            </motion.div>

            {/* UI Polish: Bottom Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-transparent to-transparent pointer-events-none opacity-80" />
        </div>
    );
}