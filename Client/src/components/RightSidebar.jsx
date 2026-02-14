import React, { useContext } from "react";
import assets from "../assets/chat-app-assets/assets";
import { AuthConext } from "../Context/AuthContext";

const RightSidebar = ({ selectedUser, setSelectedUser }) => {
  const { onlineUsers, logout } = useContext(AuthConext);

  if (!selectedUser) {
    return (
      <div className="bg-[#8185B2]/10 h-full p-5 rounded-l-xl text-white max-md:hidden flex flex-col" />
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);

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
        <p className="text-xs text-gray-500 text-center mt-8">
          No media shared yet
        </p>
      </div>
    </div>
  );
};

export default RightSidebar;