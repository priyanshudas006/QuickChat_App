import User from "../models/user.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getUserSocketIds } from "../server.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUser = await User.find({ _id: { $ne: userId } }).select("-password");

    const unseenMessages = {};
    const promises = filteredUser.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    await Promise.all(promises);
    res.json({
      success: true,
      users: filteredUser,
      unseenMessages,
    });
  } catch (error) {
    console.log("Error fetching users for sidebar:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const selectedUserId = req.params.id;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });

    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
      },
      {
        seen: true,
      },
    );

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({
      success: true,
      message: "Message marked as seen",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          resource_type: "auto",
          folder: "quickchat_messages",
          timeout: 30000,
        });
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: "Failed to upload image: " + uploadError.message,
        });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl || null,
    });

    await newMessage.save();

    const messagePayload = {
      _id: newMessage._id,
      senderId: newMessage.senderId?.toString?.() || newMessage.senderId,
      receiverId: newMessage.receiverId?.toString?.() || newMessage.receiverId,
      text: newMessage.text,
      image: newMessage.image,
      createdAt: newMessage.createdAt,
      seen: newMessage.seen,
    };

    const receiverSocketIds = getUserSocketIds(receiverId);
    const senderSocketIds = getUserSocketIds(senderId);
    const targetSocketIds = new Set([...receiverSocketIds, ...senderSocketIds]);

    targetSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newMessage", messagePayload);
    });

    res.json({
      success: true,
      newMessage: messagePayload,
    });
  } catch (error) {
    console.log("SendMessage error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
