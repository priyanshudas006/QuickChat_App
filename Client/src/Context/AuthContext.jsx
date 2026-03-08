import { createContext, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthConext = createContext();

const rtcConfig = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [activeCallUser, setActiveCallUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTargetIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callStatusRef = useRef(callStatus);
  const screenStreamRef = useRef(null);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (authUser?._id) {
      connectSocket(authUser._id);
    }
  }, [authUser?._id]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socket) socket.disconnect();
    };
  }, [socket]);

  const flushPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Failed to add pending ICE candidate:", error);
      }
    }
  }, []);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
    setIsCameraEnabled(stream.getVideoTracks().some((track) => track.enabled));
    return stream;
  }, []);

  const createPeerConnection = useCallback(
    (targetUserId) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStream(stream);
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate || !socket || !targetUserId) return;
        socket.emit("call:ice-candidate", {
          to: targetUserId,
          candidate: event.candidate,
        });
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          setCallStatus("idle");
          setIncomingCall(null);
          setActiveCallUser(null);
          setRemoteStream(null);
          callTargetIdRef.current = null;

          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
            setIsMicEnabled(true);
            setIsCameraEnabled(true);
          }
        }
      };

      return pc;
    },
    [socket],
  );

  const cleanupCallState = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    callTargetIdRef.current = null;
    setRemoteStream(null);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setIsMicEnabled(true);
      setIsCameraEnabled(true);
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  }, []);

  const startVideoCall = useCallback(
    async (targetUser) => {
      if (!socket || !authUser?._id || !targetUser?._id) return;
      if (callStatusRef.current !== "idle") {
        toast.error("You are already in another call");
        return;
      }

      try {
        await ensureLocalStream();
        const targetUserId = String(targetUser._id);
        callTargetIdRef.current = targetUserId;
        setIncomingCall(null);
        setActiveCallUser(targetUser);
        setRemoteStream(null);
        setCallStatus("calling");

        const pc = createPeerConnection(targetUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:offer", {
          to: targetUserId,
          offer,
          caller: {
            _id: authUser._id,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic || null,
          },
        });
      } catch (error) {
        cleanupCallState();
        setCallStatus("idle");
        setActiveCallUser(null);
        toast.error("Unable to start video call");
        console.error("startVideoCall error:", error);
      }
    },
    [socket, authUser, ensureLocalStream, createPeerConnection, cleanupCallState],
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!socket || !incomingCall?.from || !incomingCall?.offer) return;

    try {
      await ensureLocalStream();
      const targetUserId = String(incomingCall.from);
      callTargetIdRef.current = targetUserId;
      setActiveCallUser(
        incomingCall.caller || {
          _id: targetUserId,
          fullName: "Unknown user",
          profilePic: null,
        },
      );
      setCallStatus("connecting");

      const pc = createPeerConnection(targetUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await flushPendingCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call:answer", { to: targetUserId, answer });

      setIncomingCall(null);
      setCallStatus("in-call");
    } catch (error) {
      cleanupCallState();
      setIncomingCall(null);
      setCallStatus("idle");
      setActiveCallUser(null);
      toast.error("Unable to accept call");
      console.error("acceptIncomingCall error:", error);
    }
  }, [
    socket,
    incomingCall,
    ensureLocalStream,
    createPeerConnection,
    flushPendingCandidates,
    cleanupCallState,
  ]);

  const rejectIncomingCall = useCallback(() => {
    if (!socket || !incomingCall?.from) {
      callTargetIdRef.current = null;
      pendingCandidatesRef.current = [];
      setIncomingCall(null);
      setCallStatus("idle");
      return;
    }
    socket.emit("call:reject", { to: incomingCall.from });
    callTargetIdRef.current = null;
    pendingCandidatesRef.current = [];
    setIncomingCall(null);
    setCallStatus("idle");
    setActiveCallUser(null);
  }, [socket, incomingCall]);

  const endVideoCall = useCallback(
    (shouldSignal = true) => {
      const targetId = callTargetIdRef.current;
      if (shouldSignal && socket && targetId) {
        socket.emit("call:end", { to: targetId });
      }
      cleanupCallState();
      setIncomingCall(null);
      setCallStatus("idle");
      setActiveCallUser(null);
    },
    [socket, cleanupCallState],
  );

  const toggleMicrophone = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextEnabled = !isMicEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsMicEnabled(nextEnabled);
  }, [isMicEnabled]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextEnabled = !isCameraEnabled;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsCameraEnabled(nextEnabled);
  }, [isCameraEnabled]);

  const stopScreenShare = useCallback(async () => {
    if (!isScreenSharing || !peerConnectionRef.current || !localStreamRef.current) return;

    const cameraTrack = localStreamRef.current.getVideoTracks()[0];
    const videoSender = peerConnectionRef.current
      .getSenders()
      .find((sender) => sender.track?.kind === "video");

    try {
      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }
    } catch (error) {
      console.error("stopScreenShare replaceTrack error:", error);
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setLocalStream(localStreamRef.current);
    setIsScreenSharing(false);
  }, [isScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;

      const videoSender = peerConnectionRef.current
        .getSenders()
        .find((sender) => sender.track?.kind === "video");

      if (!videoSender) {
        displayStream.getTracks().forEach((track) => track.stop());
        return;
      }

      await videoSender.replaceTrack(screenTrack);
      screenStreamRef.current = displayStream;
      setLocalStream(displayStream);
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("toggleScreenShare error:", error);
      toast.error("Unable to share screen");
    }
  }, [isScreenSharing, stopScreenShare]);

  // connect socket function to handle socket connection and online users updates
  const connectSocket = (userId) => {
    if (!userId || socket?.connected) return;
    const newSocket = io(backendUrl, {
      autoConnect: false,
      query: {
        userId: userId,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
    newSocket.on("connect_error", (error) => {
      console.error("Socket connect error:", error.message);
    });

    newSocket.on("call:offer", ({ from, offer, caller }) => {
      if (!from || !offer) return;
      if (callStatusRef.current !== "idle") {
        newSocket.emit("call:reject", { to: from });
        return;
      }
      pendingCandidatesRef.current = [];
      callTargetIdRef.current = String(from);
      setIncomingCall({ from: String(from), offer, caller });
      setActiveCallUser(
        caller || {
          _id: String(from),
          fullName: "Incoming call",
          profilePic: null,
        },
      );
      setCallStatus("ringing");
    });

    newSocket.on("call:answer", async ({ from, answer }) => {
      if (!from || !answer || String(from) !== String(callTargetIdRef.current)) return;
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates();
        setCallStatus("in-call");
      } catch (error) {
        console.error("call:answer error:", error);
      }
    });

    newSocket.on("call:ice-candidate", async ({ from, candidate }) => {
      if (!from || !candidate || String(from) !== String(callTargetIdRef.current)) return;
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("call:ice-candidate error:", error);
      }
    });

    newSocket.on("call:reject", ({ from }) => {
      if (String(from) !== String(callTargetIdRef.current)) return;
      toast.error("Call was declined");
      endVideoCall(false);
    });

    newSocket.on("call:end", ({ from }) => {
      if (String(from) !== String(callTargetIdRef.current)) return;
      endVideoCall(false);
    });

    newSocket.connect();
    setSocket(newSocket);
  };

  const login = async (state, Credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, Credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        axios.defaults.headers.common["token"] = data.token;
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = () => {
    endVideoCall(false);
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logout successfully");
    if (socket) socket.disconnect();
    setSocket(null);
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("profile updated successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const values = {
    axios,
    authUser,
    onlineUsers,
    socket,
    incomingCall,
    callStatus,
    activeCallUser,
    localStream,
    remoteStream,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    startVideoCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endVideoCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    login,
    logout,
    updateProfile,
  };

  return <AuthConext.Provider value={values}>{children}</AuthConext.Provider>;
};
