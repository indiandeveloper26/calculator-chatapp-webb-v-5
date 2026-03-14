"use client";

import { ChatContext } from "@/app/context/chatcontext";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, User } from "lucide-react";

export default function page() {

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);


    let params = useParams()

    const { id } = params;


    console.log('from user', id)

    const pc = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const { socket, myUsername, roomid, incomingUser } = useContext(ChatContext);
    const route = useRouter();

    console.log(`myusername${myUsername} and incomunername${incomingUser}`)

    // ✅ Dummy room id
    const ROOM_ID = roomid

    console.log('roomid same hai', roomid)

    useEffect(() => {

        if (!socket) return;

        const pcInstance = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        pc.current = pcInstance;

        // 🎥 CAMERA START
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
            .then(stream => {

                setLocalStream(stream);

                // ✅ local video instantly show
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                stream.getTracks().forEach(track =>
                    pc.current.addTrack(track, stream)
                );

            })
            .catch(err => console.error("Media Error:", err));

        // 🎥 REMOTE STREAM
        pc.current.ontrack = (event) => {

            setRemoteStream(event.streams[0]);

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }

        };

        // ❄️ ICE
        pc.current.onicecandidate = (e) => {

            if (e.candidate) {

                socket.emit("webrtc-candidate", {
                    roomId: ROOM_ID,
                    candidate: e.candidate
                });

            }

        };

        // 📞 OFFER
        socket.on("webrtc-offer", async ({ sdp }) => {

            await pc.current.setRemoteDescription({
                type: "offer",
                sdp
            });

            const answer = await pc.current.createAnswer();

            await pc.current.setLocalDescription(answer);

            socket.emit("webrtc-answer", {
                roomId: ROOM_ID,
                sdp: answer.sdp
            });

        });

        // ✅ ANSWER
        socket.on("webrtc-answer", async ({ sdp }) => {

            await pc.current.setRemoteDescription({
                type: "answer",
                sdp
            });

        });

        // ❄️ ICE RECEIVE
        socket.on("webrtc-candidate", async ({ candidate }) => {

            try {

                await pc.current.addIceCandidate(candidate);

            } catch (err) {

                console.log(err);

            }

        });

        socket.on("end-call", endCall);

        // 👥 JOIN ROOM
        socket.emit("join-room", { roomId: ROOM_ID });

        // 📞 CREATE OFFER
        const timer = setTimeout(async () => {

            const offer = await pc.current.createOffer();

            await pc.current.setLocalDescription(offer);

            socket.emit("webrtc-offer", {
                roomId: ROOM_ID,
                sdp: offer.sdp
            });

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
    const endCall = (shouldEmit = true) => {



        // close peer connection
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }

        // stop camera/mic
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // emit only if user pressed button


        setLocalStream(null);
        setRemoteStream(null);

        route.push("/chatlist");

    };

    return (

        <div className="relative h-screen w-full bg-black flex items-center justify-center">

            {/* Remote Video */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />

            {!remoteStream && (
                <div className="text-gray-400">Calling...</div>
            )}

            {/* Local Video */}
            <div className="absolute top-6 right-6 w-40 h-56 bg-black rounded-xl overflow-hidden border">

                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />

            </div>

            {/* Controls */}
            <div className="absolute bottom-10 flex gap-6">

                <button
                    onClick={toggleMic}
                    className="p-4 bg-gray-800 rounded-full"
                >
                    {isMuted ? <MicOff color="white" /> : <Mic color="white" />}
                </button>

                <button
                    onClick={endCall}
                    className="p-5 bg-red-600 rounded-full"
                >
                    <PhoneOff color="white" />
                </button>

                <button className="p-4 bg-gray-800 rounded-full">
                    <Video color="white" />
                </button>

            </div>

        </div>

    );

}