import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/chat-app-assets/assets";
import { AuthConext } from "../Context/AuthContext";
import axios from "axios";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();
  const { onlineUsers, logout } = useContext(AuthConext);

  const [users, setUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [search, setSearch] = useState("");

  /* Fetch users for sidebar */
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white flex flex-col ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />

          {/* Menu */}
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
            />

            <div className="absolute top-full right-0 z-20 w-32 p-4 rounded-md bg-[#282142] border border-gray-600 hidden group-hover:block">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-blue-400"
              >
                Edit Profile
              </p>

              <hr className="my-2 border-gray-500" />

              <p
                onClick={logout}
                className="cursor-pointer text-sm hover:text-red-400"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 px-4 py-2 mt-5">
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search here"
            className="bg-transparent outline-none text-xs text-white flex-1"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex flex-col gap-1 min-h-0 overflow-y-auto flex-1">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const unseenCount = unseenMessages[user._id];

          return (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`relative flex items-center gap-3 p-2 pl-4 rounded cursor-pointer ${
                selectedUser?._id === user._id
                  ? "bg-[#282142]/60"
                  : "hover:bg-[#282142]/30"
              }`}
            >
              <img
                src={user.profilePic || assets.avatar_icon}
                alt=""
                className="w-9 h-9 rounded-full"
              />

              <div className="flex flex-col">
                <p className="text-sm">{user.fullName}</p>
                <span
                  className={`text-xs ${
                    isOnline ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {unseenCount > 0 && (
                <span className="absolute right-4 top-4 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-violet-500">
                  {unseenCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;