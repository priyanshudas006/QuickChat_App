import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/chat-app-assets/assets";
import { AuthConext } from "../Context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthConext);

  const [selectedImg, setSelectedImg] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");

  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedImg) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImg);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImg]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const payload = {
      fullName: name.trim(),
      bio: bio.trim(),
    };

    if (!selectedImg) {
      await updateProfile(payload);
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      await updateProfile({
        ...payload,
        profilePic: reader.result,
      });
      navigate("/");
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={onSubmitHandler}
          className="p-12 flex flex-col gap-5 flex-1"
        >
          <h3 className="text-lg">Profile details</h3>

          <label htmlFor="avatar" className="flex items-center gap-3">
            <input
              id="avatar"
              type="file"
              accept=".png,.jpg,.jpeg"
              hidden
              onChange={(e) => setSelectedImg(e.target.files[0])}
            />
            <img
              src={preview || authUser?.profilePic || assets.avatar_icon} // ✅ Fixed: falls back to existing profilePic
              className="w-12 h-12 rounded-full object-cover"
            />
            Upload profile image
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write profile bio"
            rows={4}
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <button
            type="submit"
            className="py-2 bg-gradient-to-r from-purple-400 to-violet-500 text-white rounded-full"
          >
            Save Profile
          </button>
        </form>

        <img
          src={authUser?.profilePic || assets.logo_icon}
          className="max-w-44 aspect-square rounded-full mx-8 max-sm:mt-10 object-cover"
        />
      </div>
    </div>
  );
};

export default ProfilePage;