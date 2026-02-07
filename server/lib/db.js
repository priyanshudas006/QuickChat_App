import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("DB Connected");
    });

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "chat-app",
    });
      
  } catch (error) {
    console.log("MongoDB connection failed:", error.message);
  }
};

export default connectDB;