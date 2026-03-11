"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams } from "next/navigation";
import { ChatContext } from "@/app/context/chatcontext";
import { useRouter } from "next/navigation";

export default function VideoCall() {

    const { socket, myUsername, currentCall } = useContext(ChatContext);

    const { videoid } = useParams(); // remote user
    const router = useRouter();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const pc = useRef(
        new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        })
    );

    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);

    // =========================
    // 1️⃣ Start Camera + Mic
    // =========================
    useEffect(() => {
        const startLocalStream = async () => {
            try {

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

                setLocalStream(stream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                stream.getTracks().forEach((track) => {
                    pc.current.addTrack(track, stream);
                });

            } catch (err) {
                console.log("Camera error:", err);
            }
        };

        startLocalStream();
    }, []);

    // =========================
    // 2️⃣ Peer Events
    // =========================
    useEffect(() => {

        if (!socket) return;

        pc.current.ontrack = (event) => {

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }

        };

        pc.current.onicecandidate = (event) => {

            if (event.candidate) {

                socket.emit("webrtc-candidate", {
                    to: videoid,
                    candidate: event.candidate
                });

            }

        };

        // ---------- OFFER ----------
        socket.on("webrtc-offer", async ({ from, sdp }) => {

            console.log("📞 Offer received");

            await pc.current.setRemoteDescription({
                type: "offer",
                sdp
            });

            const answer = await pc.current.createAnswer();

            await pc.current.setLocalDescription(answer);

            socket.emit("webrtc-answer", {
                to: from,
                sdp: answer.sdp
            });

        });

        // ---------- ANSWER ----------
        socket.on("webrtc-answer", async ({ sdp }) => {

            console.log("✅ Answer received");

            await pc.current.setRemoteDescription({
                type: "answer",
                sdp
            });

        });

        // ---------- ICE ----------
        socket.on("webrtc-candidate", async ({ candidate }) => {

            try {

                await pc.current.addIceCandidate(candidate);

            } catch (err) {
                console.log("ICE error:", err);
            }

        });

        // ---------- END CALL ----------
        socket.on("end-call", ({ by }) => {

            console.log("📴 Call ended by:", by);

            pc.current.close();

            localStream?.getTracks().forEach((t) => t.stop());

            router.push(`/chatlist/${videoid}`);

        });

        return () => {

            socket.off("webrtc-offer");
            socket.off("webrtc-answer");
            socket.off("webrtc-candidate");
            socket.off("end-call");

        };

    }, [localStream]);

    // =========================
    // 3️⃣ Caller creates offer
    // =========================
    useEffect(() => {

        if (currentCall?.from === myUsername && localStream) {

            const startCall = async () => {

                console.log("📞 Starting call");

                const offer = await pc.current.createOffer();

                await pc.current.setLocalDescription(offer);

                socket.emit("webrtc-offer", {
                    to: videoid,
                    sdp: offer.sdp
                });

            };

            startCall();

        }

    }, [localStream]);

    // =========================
    // 4️⃣ Toggle Mic
    // =========================
    const toggleMic = () => {

        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];

        if (audioTrack) {

            audioTrack.enabled = !audioTrack.enabled;

            setIsMuted(!isMuted);

        }

    };

    // =========================
    // 5️⃣ End Call
    // =========================
    const endCall = () => {

        pc.current.close();

        localStream?.getTracks().forEach((t) => t.stop());

        socket.emit("end-call", {
            to: videoid,
            by: myUsername
        });

        router.push(`/chatlist/${videoid}`);

    };

    // =========================
    // UI
    // =========================
    return (

        <div style={{ background: "#000", height: "100vh", position: "relative" }}>

            {/* Remote Video */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                }}
            />

            {/* Local Video */}
            <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                    width: 200,
                    height: 150,
                    position: "absolute",
                    top: 20,
                    right: 20,
                    border: "2px solid white",
                    borderRadius: 10
                }}
            />

            {/* End Call */}
            <button
                onClick={endCall}
                style={{
                    position: "absolute",
                    bottom: 50,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#ef4444",
                    color: "#fff",
                    padding: "12px 20px",
                    borderRadius: 50
                }}
            >
                End Call
            </button>

            {/* Mic Toggle */}
            <button
                onClick={toggleMic}
                style={{
                    position: "absolute",
                    bottom: 50,
                    left: 50,
                    background: "#1f2937",
                    color: "#fff",
                    padding: "12px 20px",
                    borderRadius: 50
                }}
            >
                {isMuted ? "Mic Off" : "Mic On"}
            </button>

        </div>
    );
}