import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import assets from '../assets/chat-app-assets/assets';

const ProfilePage = () => {

  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const onSubmitHandler = (e) => {
    e.preventDefault();
    navigate('/')
  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={onSubmitHandler} className='p-12 flex flex-col gap-5 flex-1'>
          <h3 className='text-lg'>Profile details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3'>
            <input onChange={(e)=>setSelectedImg(e.target.files[0])} type="file" id="avatar" accept='.png, .jpg, .jpeg' hidden />
            <img src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon} alt="" className={`w-12 h-12 ${selectedImg && 'rounded-full'}`}/>
            upload profile image
          </label>
          <input
           onChange={(e)=>setName(e.target.value)}
           value={name}
           type="text" required placeholder='Your name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'/>
           <textarea onChange={(e)=>setBio(e.target.value)} value={bio} placeholder='write profile bio' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4}></textarea>
          <button type="submit" className='py-2 bg-gradient-to-r from-purple-400 to-violet-500 text-white rounded-full cursor-pointer'>Save Profile</button>
        </form>
        <img className='max-w-44 aspect-square rounded-full mx-8 max-sm:mt-10' src={assets.logo_icon} alt="" />
      </div>
    </div>
  )
}

export default ProfilePage
