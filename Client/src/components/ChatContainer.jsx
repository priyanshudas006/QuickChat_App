import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/chat-app-assets/assets";
import { formatMessageTime } from "../lib/utils";
import { AuthConext } from "../Context/AuthContext";
import axios from "axios";
import {
  Expand,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
} from "lucide-react";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const {
    authUser,
    socket,
    incomingCall,
    callStatus,
    activeCallUser,
    localStream,
    remoteStream,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    startVideoCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endVideoCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
  } = useContext(AuthConext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [voiceMessage, setVoiceMessage] = useState(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const scrollEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callPanelRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const [isCallExpanded, setIsCallExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const appendUniqueMessage = (message) => {
    setMessages((prev) => {
      if (prev.some((item) => String(item._id) === String(message?._id))) {
        return prev;
      }
      return [...prev, message];
    });
  };

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMessages = async () => {
    if (!selectedUser) return;

    try {
      const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!localVideoRef.current) return;
    localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  useEffect(() => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  useEffect(() => {
    if (callStatus === "ringing") {
      setIsCallExpanded(false);
      return;
    }

    if (["in-call", "calling", "connecting"].includes(callStatus)) {
      setIsCallExpanded(true);
      return;
    }

    if (callStatus === "idle") {
      setIsCallExpanded(true);
      setIsFullscreen(false);
    }
  }, [callStatus]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handler = (newMessage) => {
      const selectedId = String(selectedUser?._id || "");
      const senderId = String(newMessage?.senderId || "");
      const receiverId = String(newMessage?.receiverId || "");
      const myId = String(authUser?._id || "");

      const isIncomingForOpenChat =
        senderId === selectedId && receiverId === myId;
      const isOutgoingForOpenChat =
        senderId === myId && receiverId === selectedId;

      if (isIncomingForOpenChat || isOutgoingForOpenChat) {
        appendUniqueMessage(newMessage);
      }
    };

    socket.on("newMessage", handler);

    return () => socket.off("newMessage", handler);
  }, [socket, selectedUser, authUser?._id]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const sendMessage = async (e) => {
    e.preventDefault();
    if (isSendingMessage) return;
    if (!selectedUser || (!text.trim() && !image && !voiceMessage)) return;

    try {
      setIsSendingMessage(true);
      const payload = {};
      if (text.trim()) payload.text = text.trim();

      if (image) {
        const maxImageSize = 5 * 1024 * 1024;
        if (image.size > maxImageSize) {
          alert(
            `Image too large! Max size is 5MB. Your file is ${(image.size / 1024 / 1024).toFixed(2)}MB`,
          );
          return;
        }
        payload.image = await fileToBase64(image);
      }

      if (voiceMessage) {
        const maxAudioSize = 10 * 1024 * 1024;
        if (voiceMessage.size > maxAudioSize) {
          alert("Voice message is too large. Max size is 10MB.");
          return;
        }
        payload.audio = await fileToBase64(voiceMessage);
      }

      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, payload, {
        timeout: 30000,
      });

      if (!data.success) {
        alert(`Failed to send message: ${data.message}`);
        return;
      }

      appendUniqueMessage(data.newMessage);
      setText("");
      setImage(null);
      setVoiceMessage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("sendMessage error:", error);
      alert("Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (isRecordingVoice) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
          setVoiceMessage(file);
          setImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }

        recordingChunksRef.current = [];
        setIsRecordingVoice(false);
      };

      recorder.start();
      setVoiceMessage(null);
      setIsRecordingVoice(true);
    } catch (error) {
      console.error("startVoiceRecording error:", error);
      alert("Microphone permission is required for voice message.");
      setIsRecordingVoice(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const renderCallOverlay = () => {
    if (callStatus === "idle") return null;

    const isRinging = callStatus === "ringing";
    const isDialing = callStatus === "calling" || callStatus === "connecting";
    const callPeerName = activeCallUser?.fullName || "User";
    const shouldShowCompactIncoming = isRinging && !isCallExpanded;

    const toggleFullscreen = async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }
        if (callPanelRef.current?.requestFullscreen) {
          await callPanelRef.current.requestFullscreen();
        }
      } catch (error) {
        console.error("Fullscreen toggle error:", error);
      }
    };

    if (shouldShowCompactIncoming) {
      return (
        <div className="absolute bottom-4 right-4 z-30 w-[280px] rounded-xl border border-stone-600 bg-[#0f1020]/95 p-4 shadow-2xl">
          <p className="text-white text-sm font-semibold">Incoming video call</p>
          <p className="text-gray-300 text-sm mt-1 truncate">{callPeerName}</p>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsCallExpanded(true)}
              className="p-2 rounded-full bg-[#282142] text-white"
              title="Expand"
            >
              <Maximize2 size={16} />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={acceptIncomingCall}
                className="bg-green-500 p-2.5 rounded-full text-white"
                title="Accept call"
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                onClick={rejectIncomingCall}
                className="bg-red-500 p-2.5 rounded-full text-white"
                title="Reject call"
              >
                <PhoneOff size={16} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={callPanelRef}
        className="absolute inset-0 z-30 bg-gradient-to-b from-[#3d3f86]/95 via-[#1c1d3f]/95 to-[#101126]/95 p-4 md:p-6 flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium">
            {isRinging ? "Incoming video call" : `Video call with ${callPeerName}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="bg-[#282142] p-2 rounded-full text-white"
              title={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              <Expand size={16} />
            </button>
            {isRinging && (
              <button
                type="button"
                onClick={() => setIsCallExpanded(false)}
                className="bg-[#282142] p-2 rounded-full text-white"
                title="Minimize"
              >
                <Minimize2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex-1 rounded-xl overflow-hidden bg-[#1a1b3a] border border-stone-600">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
              {isRinging
                ? `${callPeerName} is calling...`
                : isDialing
                ? "Waiting for the other user to join..."
                : "Connecting call..."}
            </div>
          )}

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-3 right-3 w-32 md:w-40 aspect-video rounded-lg object-cover border border-gray-400 bg-[#181834]"
          />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          {isRinging ? (
            <>
              <button
                type="button"
                onClick={acceptIncomingCall}
                className="bg-green-500 p-3 rounded-full text-white"
                title="Accept call"
              >
                <Phone size={18} />
              </button>
              <button
                type="button"
                onClick={rejectIncomingCall}
                className="bg-red-500 p-3 rounded-full text-white"
                title="Reject call"
              >
                <PhoneOff size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMicrophone}
                className={`p-3 rounded-full text-white ${
                  isMicEnabled ? "bg-[#282142]" : "bg-amber-600"
                }`}
                title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`p-3 rounded-full text-white ${
                  isCameraEnabled ? "bg-[#282142]" : "bg-amber-600"
                }`}
                title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`p-3 rounded-full text-white ${
                  isScreenSharing ? "bg-blue-600" : "bg-[#282142]"
                }`}
                title={isScreenSharing ? "Stop screen share" : "Share screen"}
              >
                {isScreenSharing ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
              </button>
              <button
                type="button"
                onClick={() => endVideoCall(true)}
                className="bg-red-500 p-3 rounded-full text-white"
                title="End call"
              >
                <PhoneOff size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!selectedUser) {
    return (
      <div className="relative h-full w-full">
        <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full w-full px-4">
          <img src={assets.logo_icon} className="max-w-14 md:max-w-16" />
          <p className="text-lg font-medium text-white">
            Chat anytime, anywhere
          </p>
        </div>
        {renderCallOverlay()}
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 relative backdrop-blur-lg flex flex-col">
      <div className="flex items-center gap-2 py-3 px-4 border-b border-stone-500 flex-shrink-0">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white">
          {selectedUser.fullName}
        </p>
        <button
          type="button"
          onClick={() => startVideoCall(selectedUser)}
          disabled={Boolean(incomingCall) || callStatus !== "idle"}
          className={`p-2 rounded-full text-white ${
            incomingCall || callStatus !== "idle"
              ? "bg-gray-600/40 cursor-not-allowed"
              : "bg-green-600/80 hover:bg-green-600"
          }`}
          title="Start video call"
        >
          <Video size={16} />
        </button>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          className="md:hidden max-w-7 cursor-pointer"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex items-start justify-center pt-7 text-sm text-gray-300">
            Start a conversation
          </div>
        )}

        {messages.map((msg) => {
          const isMe = String(msg.senderId) === String(authUser._id);

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 mb-4 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <img
                  src={selectedUser.profilePic || assets.avatar_icon}
                  className="w-7 rounded-full"
                />
              )}

              {msg.image ? (
                <img src={msg.image} className="max-w-[230px] rounded-lg border" />
              ) : msg.audio ? (
                <div
                  className={`p-2 rounded-lg ${
                    isMe ? "bg-violet-500/40 rounded-br-none" : "bg-gray-500/30 rounded-bl-none"
                  }`}
                >
                  <audio controls src={msg.audio} className="max-w-[230px] h-9" />
                </div>
              ) : (
                <p
                  className={`p-2 max-w-[200px] text-white text-sm rounded-lg ${
                    isMe
                      ? "bg-violet-500/40 rounded-br-none"
                      : "bg-gray-500/30 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </p>
              )}

              <span className="text-xs text-gray-400">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={scrollEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="mt-auto flex-shrink-0 flex flex-col gap-2 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-stone-500"
      >
        {image && (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-violet-500">
            <img
              src={URL.createObjectURL(image)}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              X
            </button>
          </div>
        )}

        {voiceMessage && (
          <div className="relative rounded-lg overflow-hidden border border-cyan-500 p-2 bg-cyan-500/10 w-fit">
            <audio controls src={URL.createObjectURL(voiceMessage)} className="h-9" />
            <button
              type="button"
              onClick={() => setVoiceMessage(null)}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              X
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center bg-violet-500/15 px-4 py-2 rounded-full gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Send a message"
            className="flex-1 bg-transparent outline-none text-white"
            disabled={isSendingMessage}
          />

          <input
            ref={fileInputRef}
            type="file"
            hidden
            id="image"
            accept="image/png, image/jpeg"
            disabled={isSendingMessage}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImage(file);
              if (file) setVoiceMessage(null);
            }}
          />

          <label htmlFor="image" className="shrink-0">
            <img
              src={assets.gallery_icon}
              className="w-5 h-5 md:w-5 md:h-5 cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
            disabled={isSendingMessage}
            className={`shrink-0 p-1 rounded-full ${
              isRecordingVoice ? "text-red-400" : "text-white"
            } ${isSendingMessage ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isRecordingVoice ? "Stop recording" : "Record voice message"}
          >
            {isRecordingVoice ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="submit"
            disabled={isSendingMessage}
            className={`shrink-0 ${isSendingMessage ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <img
              src={assets.send_button}
              className="w-5 h-5 md:w-5 md:h-5 cursor-pointer"
            />
          </button>
        </div>
      </form>
      {renderCallOverlay()}
    </div>
  );
};

export default ChatContainer;
