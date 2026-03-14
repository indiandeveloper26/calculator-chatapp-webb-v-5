"use client";

import api from "@/app/apicall";
import { ChatContext } from "@/app/context/chatcontext";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Video,
    Phone,
    Send,
    Image as ImageIcon,
    MoreVertical,
    Mail,
    MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatRoom() {
    const { id } = useParams();
    const router = useRouter();
    const fileInputRef = useRef();
    const messagesEndRef = useRef();

    const {
        messages,
        myUsername,
        sendMessage,
        roomid, setroomid,
        onlineUsers,
        socket,
        typingUser,
    } = useContext(ChatContext);

    const [input, setInput] = useState("");
    const [previewImg, setPreviewImg] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);

    // Isko apne ChatRoom ke bilkul top par rakhein (baaki hooks ke saath)
    useEffect(() => {
        console.log("🔥 Hook Triggered! Total Messages:", messages);
        if (messages.length > 0) {
            console.log("📥 Full Messages Data:", messages);
        }
    }, [messages]); // Ensure yahan 'messages' hi likha ho
    const filtered = messages.filter(
        (m) =>
            (m.from === myUsername && m.to === id) ||
            (m.from === id && m.to === myUsername)
    );

    const isOnline = onlineUsers.includes(id);

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [filtered, typingUser]);



    // --- YOUR EXISTING LOGIC (PRESERVED) ---
    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(id, input.trim(), "text");
        setInput("");
    };

    const handleTyping = (text) => {
        setInput(text);
        if (text.trim()) socket.emit("typing", { from: myUsername, to: id });
    };

    const uploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        setUploadLoading(true);
        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.url) sendMessage(id, res.data.url, "image");
        } catch (err) { console.error(err); }
        finally { setUploadLoading(false); }
    };

    const handleVideoCall = () => {
        const roomId = `${myUsername}_${Date.now()}`;

        // 2. Server ko bhejein taaki receiver ko pata chale kaunsa room join karna hai
        socket.emit("call-user", {
            from: myUsername,
            to: id,
            callType: "video",
            roomId: roomId
        });

        setroomid(roomId)
        router.push(`/chatlist/videocall/${id}`);

    };

    const handleAudioCall = () => {
        const roomId = `${myUsername}_${Date.now()}`;

        socket.emit("call-user", {
            from: myUsername,
            to: id,
            callType: "audio",
            roomId: roomId
        });

        setroomid(roomId)
        router.push(`/chatlist/audiocall/${id}`);
    };

    const handleOTP = () => {
        console.log("OTP Sent to:", id);
    };

    return (
        <div className="flex flex-col h-screen bg-[#0B0E11] text-slate-100 overflow-hidden font-sans">

            {/* --- REFINED HEADER --- */}
            {/* --- REFINED HEADER --- */}
            <header className="flex items-center justify-between px-3 py-3 bg-[#121B22]/95 backdrop-blur-lg border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    {/* BACK BUTTON */}
                    <button
                        onClick={() => router.push('/chatlist')} // Specific path dena better rehta hai
                        className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 flex items-center justify-center"
                    >
                        <ChevronLeft size={28} className="text-emerald-500" />
                    </button>

                    {/* PROFILE & STATUS */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => console.log("User Profile Clicked")}>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white border border-white/10 shadow-md">
                                {id?.charAt(0).toUpperCase()}
                            </div>
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#121B22] rounded-full" />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <h2 className="font-bold text-[16px] leading-tight text-slate-100 truncate max-w-[120px]">
                                {id}
                            </h2>
                            <span className={`text-[11px] font-medium ${isOnline ? "text-emerald-400" : "text-slate-500"}`}>
                                {isOnline ? "online" : "offline"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- CALL ACTION BUTTONS --- */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleVideoCall}
                        className="p-2.5 text-slate-300 hover:text-emerald-400 hover:bg-white/5 rounded-full transition-all"
                        title="Video Call"
                    >
                        <Video size={22} />
                    </button>
                    <button
                        onClick={handleAudioCall}
                        className="p-2.5 text-slate-300 hover:text-emerald-400 hover:bg-white/5 rounded-full transition-all"
                        title="Audio Call"
                    >
                        <Phone size={20} />
                    </button>
                    <button
                        onClick={handleOTP}
                        className="p-2.5 text-slate-400 hover:bg-white/5 rounded-full transition-all"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* --- MESSAGES AREA --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[url('https://w0.peakpx.com/wallpaper/508/446/HD-wallpaper-whatsapp-dark-mode-doodle-pattern-whatsapp-messenger.jpg')] bg-repeat">
                {filtered.map((msg, i) => {
                    const isMine = msg.from === myUsername;
                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={i}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl shadow-md ${isMine
                                ? "bg-emerald-600 text-white rounded-tr-none"
                                : "bg-[#202C33] text-slate-100 rounded-tl-none border border-white/5"
                                }`}>
                                {msg.type === "image" ? (
                                    <img src={msg.message} className="rounded-lg max-w-full cursor-pointer hover:opacity-90" onClick={() => setPreviewImg(msg.message)} />
                                ) : (
                                    <p className="text-[14.5px] leading-snug">{msg.message}</p>
                                )}
                                <p className="text-[9px] mt-1 opacity-50 text-right font-bold tracking-tighter uppercase">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Typing Indicator */}
                <AnimatePresence>
                    {typingUser === id && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-[#202C33] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <footer className="p-3 bg-[#121B22] border-t border-white/5">
                <div className="max-w-4xl mx-auto flex items-center gap-2">
                    <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-slate-400 hover:bg-white/5 rounded-full transition-all">
                        <ImageIcon size={22} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={uploadImage} hidden />

                    <div className="flex-1 bg-[#202C33] rounded-2xl px-4 py-1.5 border border-white/5 focus-within:border-emerald-500/30 transition-all">
                        <input
                            value={input}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Message..."
                            className="w-full bg-transparent py-2 text-slate-100 text-sm outline-none placeholder:text-slate-500"
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`p-3 rounded-2xl transition-all ${input.trim() ? "bg-emerald-500 text-[#0B0E11] shadow-lg shadow-emerald-500/20 active:scale-95" : "bg-slate-800 text-slate-600"
                            }`}
                    >
                        <Send size={20} fill={input.trim() ? "currentColor" : "none"} />
                    </button>
                </div>
            </footer>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImg && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImg(null)} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
                        <img src={previewImg} className="max-w-full max-h-full rounded-lg shadow-2xl" />
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}