"use client";

import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { ChatContext } from "../context/chatcontext";
import { MessageSquarePlus, Trash2, ShieldCheck } from "lucide-react";

export default function ChatList() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { visibleChats = [], onlineUsers = [], addToDeletedUsers } = useContext(ChatContext);

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    if (savedName) setUsername(savedName);
  }, []);

  const openChat = (item) => {
    if (!item?.adduser) return;
    router.push(`/chatlist/${item.adduser}`);
  };

  const confirmDelete = (user, e) => {
    e.stopPropagation();
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleDelete = () => {
    addToDeletedUsers?.(selectedUser);
    setModalVisible(false);
    setSelectedUser(null);
  };

  const getAvatarBg = (name) => {
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-pink-600', 'bg-orange-600', 'bg-indigo-600'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E11] text-white">

      {/* --- SUB-HEADER --- */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0B0E11]">
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Recent Chats</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
            {onlineUsers.length} Online
          </span>
        </div>
      </div>

      {/* --- CHAT LIST --- */}
      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        {visibleChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 text-slate-600">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <MessageSquarePlus size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-[12px] opacity-60">Search for users to start chatting</p>
          </div>
        ) : (
          <div className="space-y-1">
            {visibleChats.map((item) => {
              const user = item.adduser || "Unknown";
              const isOnline = onlineUsers.includes(user);

              return (
                <div
                  key={user}
                  onClick={() => openChat(item)}
                  className="group flex items-center p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                >
                  {/* Avatar Section */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-xl font-bold shadow-2xl transform group-hover:rotate-3 transition-transform ${getAvatarBg(user)} text-white/90`}>
                      {user.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-[3px] border-[#0B0E11] rounded-full shadow-lg"></span>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 ml-4 min-w-0 border-b border-white/[0.03] pb-3 group-last:border-none">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-[16px] text-slate-100 truncate pr-2 group-hover:text-emerald-400 transition-colors">
                        {user}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap pt-1 uppercase tracking-tighter">
                        {item.time || "Just now"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-400 truncate max-w-[80%] font-medium group-hover:text-slate-300 transition-colors">
                        {item.lastMessage || "Click to send a message..."}
                      </p>

                      <div className="flex items-center gap-3">
                        {item.unreadCount > 0 && (
                          <span className="bg-emerald-500 text-[#0B0E11] text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/20 animate-bounce">
                            {item.unreadCount}
                          </span>
                        )}
                        <button
                          onClick={(e) => confirmDelete(user, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all rounded-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- FLOATING ACTION BUTTON --- */}
      <div className="fixed bottom-8 right-6 flex flex-col items-end gap-3">
        {/* Premium Badge if needed */}
        <div className="bg-[#1F2C33] px-3 py-1.5 rounded-lg border border-white/5 shadow-2xl mb-1 scale-90">
          <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
            <ShieldCheck size={12} /> PREMIUM ACTIVE
          </p>
        </div>
        <button
          onClick={() => router.push("/payment")}
          className="w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-[#121B22] rounded-[1.5rem] shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all active:scale-90 hover:rotate-6 group"
        >
          <MessageSquarePlus size={30} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* --- DELETE MODAL --- */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
          <div className="w-full max-w-sm bg-[#1F2C33] rounded-[2.5rem] p-8 shadow-2xl border border-white/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 rotate-12">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Delete Chat?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                This will permanently remove your conversation with <span className="text-white font-bold">{selectedUser}</span>.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
                onClick={handleDelete}
              >
                Yes, Delete Chat
              </button>
              <button
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all active:scale-95"
                onClick={() => setModalVisible(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}