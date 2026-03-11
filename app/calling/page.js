"use client";
import React, { useContext, useEffect, useRef } from "react";
import { ChatContext } from "../context/chatcontext";
import { useRouter } from "next/navigation";
import { Phone, Video, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function IncomingCall() {
    const { incomingCall, setIncomingCall, incomingUser, myUsername, socket } = useContext(ChatContext);
    const router = useRouter();
    const audioRef = useRef(null);

    // Ye log check karne ke liye hai ki call aate hi data kya hai
    useEffect(() => {
        if (incomingCall) {
            console.log("📞 Incoming Call Data Received:", incomingCall);
        }
    }, [incomingCall]);

    useEffect(() => {
        if (incomingCall && incomingCall.from) {
            const audio = new Audio("/ringtone.mp3");
            audio.loop = true;
            audio.play().catch(err => console.log("Audio play failed:", err));
            audioRef.current = audio;
        } else {
            stopRingtone();
        }
        return () => stopRingtone();
    }, [incomingCall]);

    const stopRingtone = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    };

    const acceptCall = () => {
        if (!incomingCall) return;

        const callerId = incomingUser.from;
        const roomId = incomingCall.roomId;
        const type = incomingUser.callType || incomingCall.callType;

        stopRingtone();

        console.log('type call kaaa', type)

        // Server ko accept event bhejna
        socket.emit("accept-call", {
            from: myUsername,
            to: callerId,
            type: type,
            roomId: roomId
        });




        socket.emit("join-room", { roomId: roomId });

        // State clear karna
        setIncomingCall(null);

        // Navigation
        if (type === "video") {

            console.log('go vidoe call')
            router.push(`/chatlist/${callerId}/callui/videocall`);
        } else {
            router.push(`/chatlist/audiocall/${callerId}`);
            console.log('go auido call')
        }
    };

    const rejectCall = () => {
        stopRingtone();
        if (incomingCall?.from) {
            socket.emit("reject-call", { to: incomingCall.from });
        }
        setIncomingCall(null);
    };

    // Yahan check kijiye ki 'incomingCall' exist karta hai ya nahi
    if (!incomingCall) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                // Z-index ko max rakha hai (99999) taaki har cheez ke upar dikhe
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-[90%] max-w-sm bg-[#1c1c1e] rounded-[30px] p-8 border border-white/10 shadow-2xl text-center"
                >
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        {incomingCall.from?.charAt(0).toUpperCase()}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{incomingCall.from}</h2>
                    <p className="text-emerald-400 font-medium mb-8 animate-pulse">
                        {incomingCall.type === "video" ? "Incoming Video Call..." : "Incoming Audio Call..."}
                    </p>

                    <div className="flex justify-around items-center">
                        {/* Reject */}
                        <button
                            onClick={rejectCall}
                            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                        >
                            <X size={32} />
                        </button>

                        {/* Accept */}
                        <button
                            onClick={acceptCall}
                            className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        >
                            <Check size={32} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}