












"use client";

import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import socket from "../socket";
import api from "../apicall";
import { useRouter } from "next/navigation";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [myUsername, setMyUsername] = useState("");
    const [messages, setMessages] = useState([]);
    const [chatList, setChatList] = useState([]);
    const [typingUser, setTypingUser] = useState(null);

    const [deletedUsers, setDeletedUsers] = useState([]);
    const [layouthide, setlayouthide] = useState(true)
    const [isPremium, setIsPremium] = useState(false);
    const [premiumExpiry, setPremiumExpiry] = useState(null);
    const [login, setLogin] = useState(false);
    const [activeChatRoom, setActiveChatRoom] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [incomingUser, setIncomingUser] = useState("");
    const [acceptedCall, setAcceptedCall] = useState(false);
    const [groupMessages, setGroupMessages] = useState({});
    const [callchek, setcallchek] = useState(true)
    const [userdata, setUserdata] = useState(null);
    const [setcurrenuser, setsetcurrenuser] = useState(null)
    const [roomid, setroomid] = useState(null)
    const typingTimeoutRef = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    let ruter = useRouter()

    // ✅ UUID generator
    const uuidv4 = () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    // ✅ Initialize user and socket
    useEffect(() => {

        console.log("socket connect check");

        if (!socket.connected) socket.connect();

        const name = localStorage.getItem("username");

        if (name) {
            setMyUsername(name);
            setLogin(true);

            socket.emit("setUsername", name);

            try {
                const savedList =
                    JSON.parse(localStorage.getItem(`chatlist_${name}`)) || [];
                const savedMsgs =
                    JSON.parse(localStorage.getItem(`messages_${name}`)) || [];
                const savedDeleted =
                    JSON.parse(localStorage.getItem(`deleted_${name}`)) || [];

                setChatList(savedList);
                setMessages(savedMsgs);
                setDeletedUsers(savedDeleted);
            } catch (err) {
                console.error("LocalStorage parsing error:", err);
            }
        }

    }, []);

    useEffect(() => {
        if (!socket) return;

        // 1. Jab aap login karte hain, server se puri list milti hai
        socket.on("onlineUsersList", (usersArray) => {
            console.log("Full online users list:", usersArray);
            setOnlineUsers(usersArray);
        });

        // 2. Jab koi naya user online aaye ya offline jaye
        socket.on("userStatus", ({ username, online }) => {
            setOnlineUsers((prevUsers) => {
                if (online) {
                    // Agar user online aaya aur list mein nahi hai, toh add karo
                    if (!prevUsers.includes(username)) {
                        return [...prevUsers, username];
                    }
                    return prevUsers;
                } else {
                    // Agar offline gaya, toh list se remove karo
                    return prevUsers.filter((u) => u !== username);
                }
            });
        });

        // Cleanup: Component unmount hone par listeners band karein
        return () => {
            socket.off("onlineUsersList");
            socket.off("userStatus");
        };
    }, [socket]);





    // ✅ Fetch userdata from API
    useEffect(() => {
        const fetchUserData = async () => {
            const username = localStorage.getItem("username");
            if (!username) return;

            try {
                const res = await api.post("/userdata", { myUsername: username });
                const user = res.data.dta;
                setUserdata(user);
                setMyUsername(username);
                localStorage.setItem("userdata", JSON.stringify(user));

                if (user.isPremium || user.premium) {
                    setIsPremium(true);
                    localStorage.setItem("isPremium", "true");
                    if (user.premiumExpiry) {
                        setPremiumExpiry(user.premiumExpiry);
                        localStorage.setItem("premiumExpiry", user.premiumExpiry);
                    }
                } else {
                    setIsPremium(false);
                    setPremiumExpiry(null);
                    localStorage.setItem("isPremium", "false");
                    localStorage.removeItem("premiumExpiry");
                }
            } catch (err) {
                // console.error("Error fetching user:",);
            }
        };
        fetchUserData();
    }, []);

    // ✅ Typing indicator
    useEffect(() => {
        const handleTyping = ({ from }) => {
            setTypingUser(from);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
        };
        socket.on("typing", handleTyping);
        return () => socket.off("typing", handleTyping);
    }, []);

    // ✅ Online/offline status
    useEffect(() => {
        const handleStatus = ({ username, online }) => {

            console.log('useronline', username)
            setOnlineUsers((prev) => {
                const filtered = prev.filter((u) => u !== username);
                return online ? [...filtered, username] : filtered;
            });
        };
        socket.on("userStatus", handleStatus);
        return () => socket.off("userStatus", handleStatus);
    }, []);

    useEffect(() => {

        const handleIncomingCall = ({ from, callType, to, roomId }) => {
            setIncomingUser({ from, callType, to, roomId });
            setIncomingCall(true);

            setroomid(roomId)

            console.log("📞 Incoming call:", from, roomId, callType);
        };

        const handleCallAccepted = ({ from, type }) => {
            console.log("✅ Call accepted by:", from, type);

            setAcceptedCall(true);
            setIncomingCall(false);

            if (type === "video") {
                ruter.push(`/chatlist/videocall/${from}`);
            } else if (type === "audio") {


                ruter.push(`/chatlist/audiocall/${from}`);
            }
        };

        const errror = ({ message, to }) => {
            console.log("⚠️ Call error:", message, to);
        };

        const callrejected = ({ by }) => {

            console.log('call reject kiya ', by)
            ruter.push(`/chatlist`);

        }

        const handleCallRejected = ({ by }) => {

            console.log("❌ Call end by:");

            setcallchek(false);
            setIncomingCall(false);
            setAcceptedCall(false);

            ruter.push(`/chatlist`);
        };

        socket.on("incoming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("call-end", handleCallRejected);
        socket.on("call-rejected", callrejected);
        socket.on("call-error", errror);

        return () => {
            socket.off("incoming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("call-end", handleCallRejected);
            socket.off("call-rejected", callrejected);
            socket.off("call-error", errror);
        };

    }, []); // ✅ dependency empty

    // ✅ Emit when user clicks video call
    const callUser = (to) => {
        if (!to || !myUsername) return;
        console.log("📤 Calling user:", to);
        socket.emit("call-user", { from: myUsername, to });
    };

    // ✅ Accept call
    const acceptCall = (from) => {
        if (!from || !myUsername) return;
        console.log("✅ Accepting call from:", from);
        socket.emit("accept-call", { from, to: myUsername });
        setIncomingCall(false);
        setAcceptedCall(true);
    };

    // ✅ Reject call
    const rejectCall = (from) => {
        if (!from || !myUsername) return;
        console.log("❌ Rejecting call from:", from);
        socket.emit("reject-call", { from, to: myUsername });
        setIncomingCall(false);
        setAcceptedCall(false);
    };

    // ✅ Handle incoming private messages
    const handleIncomingMessage = useCallback((msg) => {

        if (!msg.id) return;
        const { id, from, to, message, type, serverTimestamp, seen } = msg;
        const otherUser = from === myUsername ? to : from;



        console.log('private mess coming now', id, from, to, message, type, serverTimestamp, seen)

        setDeletedUsers((prev) => {
            if (prev.includes(otherUser)) {
                const updated = prev.filter((u) => u !== otherUser);
                localStorage.setItem(`deleted_${myUsername}`, JSON.stringify(updated));
                return updated;
            }
            return prev;
        });

        setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const updated = [...prev, msg];
            localStorage.setItem(`messages_${myUsername}`, JSON.stringify(updated));
            return updated;
        });

        setChatList((prev) => {

            console.log('setchatli ', prev)

            const index = prev.findIndex((c) => c.adduser === otherUser);
            let updated;
            if (index !== -1) {
                updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    lastMessage: type === "image" ? "📷 Photo" : message,
                    unreadCount: from === myUsername ? 0 : (updated[index].unreadCount || 0) + 1,
                };
                const [moved] = updated.splice(index, 1);
                updated.unshift(moved);
            } else {
                updated = [
                    { adduser: otherUser, lastMessage: type === "image" ? "📷 Photo" : message, unreadCount: from === myUsername ? 0 : 1 },
                    ...prev,
                ];
            }
            localStorage.setItem(`chatlist_${myUsername}`, JSON.stringify(updated));
            return updated;
        });
    }, [myUsername]);

    useEffect(() => {
        if (!myUsername) return;
        socket.on("privateMessage", handleIncomingMessage);
        return () => socket.off("privateMessage", handleIncomingMessage);
    }, [myUsername, handleIncomingMessage]);

    // ✅ Send private message
    const sendMessage = (to, message, type = "text") => {
        const payload = {
            id: uuidv4(),
            from: myUsername,
            to,
            message,
            type,
            timestamp: new Date().toISOString(),
            seen: false,
        };
        socket.emit("sendMessage", payload);
        handleIncomingMessage(payload);
    };

    // ✅ Group messages
    const sendGroupMessage = (groupId, username, text, type = "text") => {
        const payload = { groupId, username, message: text, type, timestamp: new Date().toISOString() };
        socket.emit("groupMessage", payload);
        setGroupMessages((prev) => {
            const prevMsgs = prev[groupId] || [];
            return { ...prev, [groupId]: [...prevMsgs, payload] };
        });
    };

    const joinGroup = (groupId) => socket.emit("joinGroup", { groupId, username: myUsername });
    const leaveGroup = (groupId) => {
        socket.emit("leaveGroup", { groupId, username: myUsername });
        setGroupMessages((prev) => ({ ...prev, [groupId]: [] }));
    };

    const markChatAsRead = (otherUser) => {
        setChatList((prev) => {
            const updated = prev.map((item) => (item.adduser === otherUser ? { ...item, unreadCount: 0 } : item));
            localStorage.setItem(`chatlist_${myUsername}`, JSON.stringify(updated));
            return updated;
        });
    };

    const addToDeletedUsers = (user) => {
        setDeletedUsers((prev) => {
            const updated = prev.includes(user) ? prev : [...prev, user];
            localStorage.setItem(`deleted_${myUsername}`, JSON.stringify(updated));
            return updated;
        });
    };

    const clearAll = () => {
        setMyUsername("");
        setMessages([]);
        setChatList([]);
        setTypingUser(null);
        setOnlineUsers([]);
        setDeletedUsers([]);
        setIsPremium(false);
        localStorage.clear();
    };

    const updatePremium = (status, expiryDate) => {
        setIsPremium(status);
        localStorage.setItem("isPremium", status ? "true" : "false");
        if (status && expiryDate) {
            setPremiumExpiry(expiryDate);
            localStorage.setItem("premiumExpiry", expiryDate);
        } else {
            setPremiumExpiry(null);
            localStorage.removeItem("premiumExpiry");
        }
    };

    const visibleChats = chatList.filter((c) => !deletedUsers.includes(c.adduser));

    return (
        <ChatContext.Provider
            value={{
                socket,
                myUsername,
                messages,
                visibleChats,
                typingUser,
                onlineUsers,
                deletedUsers,
                sendMessage,
                markChatAsRead,
                addToDeletedUsers,
                setMyUsername,
                setcurrenuser, setsetcurrenuser,
                clearAll,
                isPremium,
                updatePremium,
                incomingUser,
                onlineUsers,
                incomingCall,
                acceptedCall,
                premiumExpiry,
                groupMessages,
                joinGroup,
                sendGroupMessage,
                activeChatRoom,
                setActiveChatRoom,
                login,
                setLogin,
                leaveGroup,
                setIncomingCall,
                callchek,
                setcallchek,
                // 📞 added call functions
                callUser,
                acceptCall,
                layouthide,
                setlayouthide,
                roomid, setroomid,
                rejectCall,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
