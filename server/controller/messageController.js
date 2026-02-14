import User from "../models/user.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";
import { userSocketMap, io } from "../server.js";


export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUser = await User.find({ _id: { $ne: userId } }).select(
      "-password",
    );

    // count number of messages not seen
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
    /*
        Message.find({
        senderId: friendId,
        receiverId: MyId,
        seen: false
        });

        [
        { Hi },
        { Hello },
        { Pic }
        ]

        messages.length = 3
        */

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

// get all messages for selected user
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

// marks messages as seen 
export const markMessagesAsSeen = async (req, res) => {
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id, {seen: true});
        res.json({
            success: true,
            message: "Message marked as seen"
        })  
    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
}

//send message to someone
export const sendMessage = async (req, res) => {
    try {
      const {text, image} = req.body;
      const receiverId = req.params.id;
      const senderId = req.user._id;

      let imageUrl;

      // ✅ Fixed: Properly handle image uploads with error handling
      if(image){
        try {
          console.log("📸 Starting image upload to Cloudinary...");
          console.log("Image type:", typeof image, "Size:", image.length, "bytes");
          
          const uploadResult = await cloudinary.uploader.upload(image, {
            resource_type: "auto",
            folder: "quickchat_messages",
            timeout: 30000 // ✅ 30 second timeout
          });
          imageUrl = uploadResult.secure_url;
          console.log("✅ Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("❌ Cloudinary upload error:", uploadError.message);
          console.error("Error code:", uploadError.http_code);
          console.error("Error status:", uploadError.status);
          return res.status(400).json({
            success: false,
            message: "Failed to upload image: " + uploadError.message
          });
        }
      }

      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl || null
      })

      // ✅ Fixed: Save message to database before emitting
      await newMessage.save();
      console.log("✅ Message saved to database:", newMessage._id);

      // ✅ Emit to receiver with populated message data
      const receiverSocketId = userSocketMap[receiverId];
      if(receiverSocketId){
        console.log("📤 Emitting message to receiver socket:", receiverSocketId);
        io.to(receiverSocketId).emit("newMessage", newMessage);
      } else {
        console.log("⚠️  Receiver not online. Message saved to DB.");
      }

      // ✅ Ensure newMessage is serialized properly
      res.json({
        success: true,
        newMessage: {
          _id: newMessage._id,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
          text: newMessage.text,
          image: newMessage.image,
          createdAt: newMessage.createdAt,
          seen: newMessage.seen
        }
      })

    } catch (error) {
      console.log("❌ SendMessage error:", error.message);
      console.error("Full error:", error);
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
}