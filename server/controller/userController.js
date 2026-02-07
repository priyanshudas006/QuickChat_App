import User from "../models/user.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { email, fullName, password } = req.body;
  try {
    if (!email || !fullName || !password) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }
    const salt = await bcrypt.gensalt(10);
    const hassedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hassedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    res.json({
      success: true,
      userData: newUser,
      token,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("Signup error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (!isPasswordCorrect) {
      return res.json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      userData: newUser,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log("Signup error:", error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName} = req.body;
        const userId = req.user._id;
        let updatedUser;

        if(!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName}, {new: true});
        }else{
            const upload = await cloudinary.uploader.upload(profilePic)
            updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName, profilePic: upload.secure_url}, {new: true});
        }
        res.json({
            success: true,
            user: updatedUser,
        })
    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: error.message
        })
    }
}