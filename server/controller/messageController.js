import User from "../models/user.js";
import Message from "../models/message.js";

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
    const { selectedUserId } = req.params.id;
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
        
    }
}