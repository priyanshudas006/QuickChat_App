import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/chat-app-assets/assets";
import { AuthConext } from "../Context/AuthContext";
import axios from "axios";

const RightSidebar = ({ selectedUser }) => {
  const { onlineUsers, authUser, socket } = useContext(AuthConext);
  const [sharedMedia, setSharedMedia] = useState([]);
  const selectedUserId = selectedUser?._id;
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  const loadSharedMedia = async () => {
    if (!selectedUserId) {
      setSharedMedia([]);
      return;
    }
    try {
      const { data } = await axios.get(`/api/messages/${selectedUserId}`);
      if (data.success) {
        const mediaMessages = (data.messages || [])
          .filter((msg) => Boolean(msg.image))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSharedMedia(mediaMessages);
      }
    } catch (error) {
      console.error("Failed to load shared media:", error);
      setSharedMedia([]);
    }
  };

  useEffect(() => {
    loadSharedMedia();
  }, [selectedUserId]);

  useEffect(() => {
    if (!socket || !selectedUserId) return;

    const handleNewMessage = (newMessage) => {
      const selectedId = String(selectedUserId);
      const myId = String(authUser?._id || "");
      const senderId = String(newMessage?.senderId || "");
      const receiverId = String(newMessage?.receiverId || "");

      const isForCurrentChat =
        (senderId === selectedId && receiverId === myId) ||
        (senderId === myId && receiverId === selectedId);

      if (isForCurrentChat && newMessage?.image) {
        setSharedMedia((prev) => {
          if (prev.some((item) => String(item._id) === String(newMessage._id))) {
            return prev;
          }
          return [newMessage, ...prev];
        });
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUserId, authUser?._id]);

  if (!selectedUser) {
    return (
      <div className="bg-[#8185B2]/10 h-full p-5 rounded-l-xl text-white max-md:hidden flex flex-col" />
    );
  }

  return (
    <div className="bg-[#8185B2]/10 h-full p-5 rounded-l-xl text-white overflow-y-auto max-md:hidden flex flex-col">
      {/* User Info */}
      <div className="flex flex-col items-center gap-3 pt-5 pb-5 border-b border-gray-600">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt={selectedUser.fullName}
          className="w-20 h-20 rounded-full object-cover"
        />

        <div className="text-center">
          <p className="text-lg font-medium">{selectedUser.fullName}</p>
          <span className={`text-xs ${isOnline ? "text-green-400" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {selectedUser.bio && (
          <p className="text-sm text-gray-400 text-center px-2">
            {selectedUser.bio}
          </p>
        )}
      </div>

      {/* Media placeholder */}
      <div className="mt-5">
        <p className="text-sm text-gray-400 mb-3">Shared Media</p>

        {sharedMedia.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-8">
            No media shared yet
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sharedMedia.map((msg) => (
              <a
                key={msg._id}
                href={msg.image}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={msg.image}
                  alt="shared media"
                  className="w-full h-24 object-cover rounded-md border border-gray-600"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
