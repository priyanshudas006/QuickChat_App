import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/chat-app-assets/assets";
import { formatMessageTime } from "../lib/utils";
import { AuthConext } from "../Context/AuthContext";
import axios from "axios";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const { authUser, socket } = useContext(AuthConext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const scrollEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const appendUniqueMessage = (message) => {
    setMessages((prev) => {
      if (prev.some((item) => String(item._id) === String(message?._id))) {
        return prev;
      }
      return [...prev, message];
    });
  };

  /* Auto scroll */
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Fetch messages when user changes */
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

  /* Listen for real-time messages with specific handler reference to avoid duplicates */
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

  /* Send message */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text && !image) return;

    try {
      // If image is selected, validate and read it first
      if (image) {
        // Validate image size (max 5MB)
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
        if (image.size > MAX_IMAGE_SIZE) {
          alert(`Image too large! Max size is 5MB. Your file is ${(image.size / 1024 / 1024).toFixed(2)}MB`);
          setImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const reader = new FileReader();
        
        // Create a promise to handle FileReader's async nature
        const imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(image);
        });

        try {
          console.log("Sending message with image (size:", (image.size / 1024).toFixed(2) + "KB)");
          const { data } = await axios.post(
            `/api/messages/send/${selectedUser._id}`,
            { text, image: imageBase64 },
            { timeout: 30000 }
          );

          if (data.success) {
            console.log("Message sent successfully with image:", data.newMessage);
            appendUniqueMessage(data.newMessage);
            setText("");
            setImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          } else {
            console.error("Failed to send message:", data.message);
            alert("Failed to send message: " + data.message);
          }
        } catch (err) {
          console.error("Error sending message with image:", err);
          const errorMsg = err.response?.data?.message || err.message || "Network error";
          alert("Error sending image: " + errorMsg);
        }
      } else {
        try {
          console.log("Sending text message...");
          const { data } = await axios.post(
            `/api/messages/send/${selectedUser._id}`,
            { text }
          );

          if (data.success) {
            console.log("Message sent successfully:", data.newMessage);
            appendUniqueMessage(data.newMessage);
            setText("");
          } else {
            console.error("Failed to send message:", data.message);
            alert("Failed to send message: " + data.message);
          }
        } catch (err) {
          console.error("Error sending message:", err);
          alert("Error sending message: " + (err.response?.data?.message || err.message));
        }
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      alert("An unexpected error occurred");
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full w-full">
        <img src={assets.logo_icon} className="max-w-16" />
        <p className="text-lg font-medium text-white">
          Chat anytime, anywhere
        </p>
      </div>
    );
  }

  return (
    <div className="h-full relative backdrop-blur-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 py-3 px-4 border-b border-stone-500 flex-shrink-0">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white">
          {selectedUser.fullName}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          className="md:hidden max-w-7 cursor-pointer"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
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
                <img
                  src={msg.image}
                  className="max-w-[230px] rounded-lg border"
                />
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

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex-shrink-0 flex flex-col gap-3 p-3 border-t border-stone-500"
      >
        {/* Image Preview */}
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
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 flex items-center bg-violet-500/15 px-4 py-2 rounded-full gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Send a message"
            className="flex-1 bg-transparent outline-none text-white"
          />

          <input
            ref={fileInputRef}
            type="file"
            hidden
            id="image"
            accept="image/png, image/jpeg"
            onChange={(e) => setImage(e.target.files[0])}
          />

          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              className="w-5 cursor-pointer"
            />
          </label>

          <button type="submit">
            <img
              src={assets.send_button}
              className="w-5 cursor-pointer"
            />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatContainer; 
