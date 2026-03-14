'use client'

import { useEffect, useState, useContext } from "react";
import { ChatContext } from "../context/chatcontext";


export default function UsersList() {
    const { onlineUsers, socket } = useContext(ChatContext);
    const [onlineUserss, setOnlineUsers] = useState([]); // Online users ki array

    useEffect(() => {
        if (onlineUsers.length > 0) {
            console.log("--- Current Online Users List ---");
            onlineUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user}`);
            });
        }
    }, [onlineUsers]); // <--- Jab bhi list badlegi, ye chalega

    return (
        <div className="p-4 bg-gray-900 text-white rounded-lg">
            <h3 className="text-xl font-bold mb-4">Online Users ({onlineUsers.length})</h3>
            <ul className="space-y-2">
                {onlineUsers.map((user) => (
                    <li key={user} className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        {user}
                    </li>
                ))}
                {onlineUsers.length === 0 && (
                    <p className="text-gray-500">No one is online right now.</p>
                )}
            </ul>
        </div>
    );
}