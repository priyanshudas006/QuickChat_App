import React, { useEffect, useRef } from "react";
import assets, { messagesDummyData } from "../assets/chat-app-assets/assets";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {

  const scrollEnd = useRef()

  useEffect(()=>{
    if(scrollEnd.current){
      scrollEnd.current.scrollIntoView({behavior: 'smooth'})
    }
  },[])

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Header seection */}
      <div className="flex items-center gap-2 py-3 mx-4 border-b border-stone-500 ">
        <img src={assets.profile_martin} alt="" className="w-8 rounded-full" />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          Martin Johnson
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </p>
        <img onClick={()=> setSelectedUser(null)} src={assets.arrow_icon} alt="" className="md:hidden max-w-7" />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>
      {/* Chat section */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messagesDummyData.map((msg, index)=>(<div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== '680f50e4f10f3cd28382ecf9' && 'flex-row-reverse'}`}>
          {msg.image ? (
            <img src={msg.image} alt="" className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8"/>
          ):(
            <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 breake-all bg-violet-500/30 text-white ${msg.senderId === '680f50e4f10f3cd28382ecf9' ? 'rounded-br-none' : 'rounded-bl-none' }`}>{msg.text}</p>
          )}
          <div className="text-center text-xs">
            <img src={msg.senderId === '680f50e4f10f3cd28382ecf9'? assets.avatar_icon : assets.profile_martin} alt="" className="rounded-full w-7" />
            <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
          </div>
        </div>))}
        <div ref={scrollEnd}></div>
      </div>
      {/* bottom section */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
            <div className='flex-1 flex items-center bg-violet-500/15  px-4 py-2 rounded-full gap-2'>
              <input
                type="text"
                placeholder="Send a message"
                className="flex-1 text-sm bg-transparent border-none outline-none text-white placeholder-gray-400"
              />
              <input type="file" id="image" accept="image/png, image/jpeg" hidden />
              <label htmlFor="image" className="flex items-center justify-center">
                <img src={assets.gallery_icon} alt="" className="w-5 h-5 mr-2 cursor-pointer" />
              </label>
              <button type="submit" className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-500 hover:bg-purple-600 transition-colors">
                <img src={assets.send_button} alt="Send" className="w-5 h-5" />
              </button>
            </div>
      </div>
    </div>
  ): (<div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
    <img src={assets.logo_icon} className="max-w-16" />
    <p className="text-lg font-medium text-white ">Chat anytime, anywhere</p>
  </div>)
};

export default ChatContainer;
