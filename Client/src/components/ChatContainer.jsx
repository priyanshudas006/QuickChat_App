import React from "react";
import assets, { messagesDummyData } from "../assets/chat-app-assets/assets";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  return selectedUser ? (
    <div className="h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-stone-500">
        
        <div className="flex items-center gap-3">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />

          <p className="flex items-center text-white font-medium">
            {selectedUser?.fullName}

            {/* Online Dot */}
            <span className="inline-block w-2 h-2 ml-2 rounded-full bg-green-500"></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Back Button (Mobile) */}
          <img
            onClick={() => setSelectedUser(null)}
            src={assets.arrow_icon}
            alt=""
            className="md:hidden max-w-7 cursor-pointer"
          />

          {/* Help Icon (Desktop) */}
          <img
            src={assets.help_icon}
            alt=""
            className="max-md:hidden max-w-5 cursor-pointer"
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto bg-white/10">
        {/* Chatting area */}
        {messagesDummyData.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${
              msg.senderId !== "680f5116f10f3cd28382ed02"
                ? "flex-row-reverse"
                : "justify-end"
            }`}
          >
            {msg.image ? (
              <img
                src={msg.image}
                alt=""
                className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8"
              />
            ) : (
              <p
                className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                  msg.senderId === "680f50e4f10f3cd28382ecf9"
                    ? "rounded-br-none"
                    : "rounded-bl-none"
                }`}
              >
                {msg.text}
              </p>
            )}
            <div className="text-center text-xs">
              <img
                src={
                  msg.senderId === "680f50e4f10f3cd28382ecf9"
                    ? assets.avatar_icon
                    : assets.avatar_icon_2
                }
                alt=""
                className="w-7 rounded-full"
              />
              <p className="text-gray-500">{msg.createdAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full">
      
      <img src={assets.logo_icon} alt="" className="max-w-16" />

      <p className="text-lg font-medium text-white">
        Chat anytime, anywhere
      </p>
    </div>
  );
};

export default ChatContainer;
