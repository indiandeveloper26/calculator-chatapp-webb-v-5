"use client";

import { ChatContext } from "@/app/context/chatcontext";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, User } from "lucide-react"; // Icons ke liye

export default function VideoCall() {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const pc = useRef(null);
    const { socket, incomingUser } = useContext(ChatContext);
    const route = useRouter();
    const ROOM_ID = incomingUser.roomId;

    // --- LOGIC REMAINS EXACTLY THE SAME ---
    useEffect(() => {
        if (!socket) return;
        const pcInstance = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pc.current = pcInstance;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                setLocalStream(stream);
                stream.getTracks().forEach(track => pc.current.addTrack(track, stream));
            })
            .catch(err => console.error("Error getting media:", err));

        pc.current.ontrack = (event) => { setRemoteStream(event.streams[0]); };
        pc.current.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("webrtc-candidate", { roomId: ROOM_ID, candidate: e.candidate });
            }
        };

        socket.on("webrtc-offer", async ({ sdp }) => {
            await pc.current.setRemoteDescription({ type: "offer", sdp });
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.emit("webrtc-answer", { roomId: ROOM_ID, sdp: answer.sdp });
        });

        socket.on("webrtc-answer", async ({ sdp }) => {
            await pc.current.setRemoteDescription({ type: "answer", sdp });
        });

        socket.on("webrtc-candidate", async ({ candidate }) => {
            try { await pc.current.addIceCandidate(candidate); } catch (err) { console.error(err); }
        });

        socket.on("end-call", endCall);
        socket.emit("join-room", { roomId: ROOM_ID });

        const timer = setTimeout(async () => {
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            socket.emit("webrtc-offer", { roomId: ROOM_ID, sdp: offer.sdp });
        }, 1000);

        return () => {
            clearTimeout(timer);
            pc.current?.close();
            localStream?.getTracks().forEach(track => track.stop());
            socket.off("webrtc-offer");
            socket.off("webrtc-answer");
            socket.off("webrtc-candidate");
            socket.off("end-call");
        };
    }, [socket]);

    const toggleMic = () => {
        const audioTrack = localStream?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const endCall = () => {
        route.push('/chatlist');
        pc.current?.close();
        localStream?.getTracks().forEach(track => track.stop());
        socket.emit("end-call", { roomId: ROOM_ID });
        setRemoteStream(null);
        setLocalStream(null);
    };

    // --- NEW ENHANCED UI ---
    return (
        <div className="relative h-screen w-full bg-[#0b0e11] overflow-hidden flex items-center justify-center">

            {/* 1. REMOTE VIDEO (Full Screen) */}
            <div className="absolute inset-0 z-0 bg-slate-900">
                {remoteStream ? (
                    <video
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        ref={video => { if (video && remoteStream) video.srcObject = remoteStream }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <User size={60} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 tracking-[0.2em] text-sm uppercase">Calling...</p>
                    </div>
                )}
            </div>

            {/* 2. LOCAL VIDEO (Floating PIP) */}
            <div className="absolute top-6 right-6 z-20 w-32 h-44 sm:w-48 sm:h-64 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-8 ring-black/10">
                <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    ref={video => { if (video && localStream) video.srcObject = localStream }}
                />
            </div>

            {/* 3. TOP INFO */}
            <div className="absolute top-8 left-8 z-10">
                <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-white/90 text-sm font-medium">Secure Call</span>
                </div>
            </div>

            {/* 4. BOTTOM CONTROLS (Modern Floating Bar) */}
            <div className="absolute bottom-10 z-30 flex items-center gap-6">
                {/* Mute Button */}
                <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all duration-300 active:scale-90 ${isMuted ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'} backdrop-blur-xl border border-white/10`}
                >
                    {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                </button>

                {/* End Call Button */}
                <button
                    onClick={endCall}
                    className="p-5 bg-[#ff3b30] hover:bg-[#ff453a] text-white rounded-full shadow-[0_0_30px_rgba(255,59,48,0.4)] transition-all duration-300 hover:scale-110 active:scale-90"
                >
                    <PhoneOff size={32} />
                </button>

                {/* Extra Placeholder Button (UI Balance) */}
                <button className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                    <Video size={24} />
                </button>
            </div>

            {/* Dark Overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        </div>
    );
}