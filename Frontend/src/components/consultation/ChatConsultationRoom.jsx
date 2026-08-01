import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Stethoscope, Paperclip, User, Phone, PhoneOff, XCircle, MessageSquare, Send, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import JitsiVideoCall from './JitsiVideoCall';

export default function ChatConsultationRoom({ 
  isOpen, 
  onClose, 
  onComplete, 
  requestDetails 
}) {
  const [chatRoomMessages, setChatRoomMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'incoming', 'active'
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const storageKey = `chat_history_${requestDetails?.id}`;

  const quickReplies = [
    "Reviewing files now. 🩺",
    "Any fever or loss of appetite?",
    "Keep the patient isolated.",
    "Preparing prescription..."
  ];

  // Establish socket connection and load history
  useEffect(() => {
    if (!isOpen || !requestDetails?.id) return;

    // Load message history from backend API
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${requestDetails.id}/chat-history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setChatRoomMessages(res.data);
      localStorage.setItem(storageKey, JSON.stringify(res.data));
    })
    .catch(err => {
      console.error("Failed to load chat history:", err);
      const history = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setChatRoomMessages(history);
    });

    // Connect to Socket server
    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    // Join room
    socket.emit("join-chat-room", { appointmentId: requestDetails.id });

    // Listen for incoming messages
    socket.on("receive-chat-message", (msg) => {
      setChatRoomMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const updated = [...prev, msg];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    });

    // Listen for voice call actions
    socket.on("voice-call-broadcast", ({ action, sender }) => {
      if (sender === "doctor") return; // Ignore own actions

      if (action === "invite") {
        setCallState("incoming");
      } else if (action === "accept") {
        setCallState("active");
        toast.success("Voice call connected!");
      } else if (action === "decline") {
        setCallState("idle");
        toast.error("Call declined.");
      } else if (action === "hangup") {
        setCallState("idle");
        toast.success("Call ended.");
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, requestDetails?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRoomMessages]);

  if (!isOpen || !requestDetails) return null;

  const handleInitiateCall = () => {
    if (!socketRef.current) return;
    setCallState("calling");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "invite",
      sender: "doctor",
      senderName: "Dr. " + (requestDetails.veterinarian_name || "Doctor")
    });
  };

  const handleAcceptCall = () => {
    if (!socketRef.current) return;
    setCallState("active");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "accept",
      sender: "doctor",
      senderName: "Dr. " + (requestDetails.veterinarian_name || "Doctor")
    });
  };

  const handleDeclineCall = () => {
    if (!socketRef.current) return;
    setCallState("idle");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "decline",
      sender: "doctor",
      senderName: "Dr. " + (requestDetails.veterinarian_name || "Doctor")
    });
  };

  const handleHangupCall = () => {
    if (!socketRef.current) return;
    setCallState("idle");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "hangup",
      sender: "doctor",
      senderName: "Dr. " + (requestDetails.veterinarian_name || "Doctor")
    });
  };

  const handleSendMessageInChatRoom = (customText = null) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || !socketRef.current) return;
    
    // Emit to room
    socketRef.current.emit("send-chat-message", {
      appointmentId: requestDetails.id,
      text: textToSend,
      sender: 'doctor',
      senderName: 'Dr. ' + (requestDetails.veterinarian_name || 'Doctor')
    });
    
    if (!customText) setChatInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const uploadToast = toast.loading(`Uploading ${file.name}...`);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/chat-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("File uploaded successfully!", { id: uploadToast });

      if (socketRef.current) {
        socketRef.current.emit("send-chat-message", {
          appointmentId: requestDetails.id,
          text: file.name,
          fileUrl: res.data.url,
          sender: 'doctor',
          senderName: 'Dr. ' + (requestDetails.veterinarian_name || 'Doctor')
        });
      }
    } catch (err) {
      console.error("File upload failed:", err);
      toast.error("Failed to upload file. Please try again.", { id: uploadToast });
    }
  };

  const handleEndConsultation = () => {
    setShowPrescriptionModal(true);
  };

  const handleCompleteSubmit = async () => {
    if (!prescriptionInput.trim()) {
      alert("Please enter prescription/treatment details.");
      return;
    }

    const loadToast = toast.loading("Completing consultation...");
    try {
      // 1. Send complete request with prescription to backend
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${requestDetails.id}/complete`, {
        prescription: prescriptionInput
      });

      // 2. Emit socket completion event
      if (socketRef.current) {
        socketRef.current.emit("complete-consultation", {
          appointmentId: requestDetails.id,
          prescription: prescriptionInput
        });
      }

      toast.success("Consultation completed and prescription saved!", { id: loadToast });
      setShowPrescriptionModal(false);
      onClose(); // Close chat window
      if (onComplete) onComplete(); // Trigger refresh on parent page
    } catch (err) {
      console.error("Failed to complete appointment:", err);
      toast.error("Failed to complete consultation. Please try again.", { id: loadToast });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-955 text-slate-800 z-50 flex overflow-hidden font-sans">
      
      {/* Left Panel: Case Details Context with Glassmorphism Dark theme */}
      <div className="w-80 bg-slate-900/95 text-slate-300 border-r border-slate-800 flex flex-col p-6 space-y-6 overflow-y-auto backdrop-blur-md shrink-0">
        {/* Header info */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-950/40 text-white font-bold shrink-0">
              VS
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">VetCloud Live</h3>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mt-0.5">Doctor Console</p>
            </div>
          </div>
        </div>

        {/* Patient/Case Overview */}
        <div className="space-y-5 flex-1">
          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Client / Farmer</p>
            <p className="text-base font-extrabold text-white mt-1">{requestDetails.owner_name}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-950/30 text-blue-400 text-[10px] font-bold rounded-full mt-2.5 border border-blue-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Connected
            </span>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-4">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Patient</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{requestDetails.animal_name}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Breed & Species</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 capitalize">
                {requestDetails.animal_species} {requestDetails.animal_breed ? `(${requestDetails.animal_breed})` : ''}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-850 pt-3">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Age</p>
                <p className="text-xs font-bold text-slate-300 mt-0.5">{requestDetails.animal_age || '4 Years'}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Weight</p>
                <p className="text-xs font-bold text-slate-300 mt-0.5">{requestDetails.animal_weight || '1,400 lbs'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reason for consultation</p>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-850 max-h-36 overflow-y-auto">
              {requestDetails.reason_notes || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-slate-850 space-y-2">
          <button 
            onClick={() => {
              if (window.confirm("Minimize chat room and return to requests?")) {
                onClose();
              }
            }}
            className="w-full bg-slate-950 hover:bg-slate-850 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-850 cursor-pointer shadow-sm hover:shadow-md active:scale-98"
          >
            Minimize Workspace
          </button>
          <button
            onClick={handleEndConsultation}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 active:scale-98"
          >
            <XCircle size={14} />
            End Consultation
          </button>
        </div>
      </div>

      {/* Right Panel: Immersive Chat Feed with subtle gradient background */}
      <div className="flex-1 bg-slate-50 flex flex-col h-full relative">
        
        {/* Top Header bar with Glassmorphism style */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-gradient-to-tr from-blue-100 to-indigo-50 flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner shrink-0">
              {requestDetails.owner_name ? requestDetails.owner_name.charAt(0) : 'F'}
            </div>
            <div>
              <h4 className="font-bold text-slate-850 text-sm">{requestDetails.owner_name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold">Farmer consultation session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInitiateCall}
              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-slate-200 bg-white hover:border-blue-200 flex items-center justify-center active:scale-95 shadow-sm"
              title="Start Online Voice Call"
            >
              <Phone size={18} />
            </button>
          </div>
        </div>

        {/* Call Signaling Banners */}
        {callState !== 'idle' && (
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-lg z-20 animate-in slide-in-from-top duration-300 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              {callState === 'calling' && (
                <>
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center animate-pulse">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Calling {requestDetails.owner_name || 'Farmer'}...</p>
                    <p className="text-xs text-slate-400 animate-pulse">Waiting for answer</p>
                  </div>
                </>
              )}
              {callState === 'incoming' && (
                <>
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-bounce">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Incoming Call...</p>
                    <p className="text-xs text-amber-400 font-medium">{requestDetails.owner_name || 'Farmer'} is calling you</p>
                  </div>
                </>
              )}
              {callState === 'active' && (
                <>
                  <div className="w-9 h-9 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center animate-pulse">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-400">Voice Call Connected</p>
                    <p className="text-xs text-slate-400">Secure Audio Session • Live</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {callState === 'incoming' ? (
                <>
                  <button
                    onClick={handleDeclineCall}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                  >
                    Accept
                  </button>
                </>
              ) : (
                <button
                  onClick={handleHangupCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer flex items-center gap-1 active:scale-95 shadow-md"
                >
                  <PhoneOff size={14} />
                  {callState === 'calling' ? 'Cancel' : 'End Call'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden Jitsi component for background voice calling */}
        {callState === 'active' && (
          <JitsiVideoCall
            roomName={`vetcloud-voicecall-${requestDetails.id}`}
            displayName={`Dr. ${requestDetails.veterinarian_name}`}
            onClose={handleHangupCall}
            voiceOnly={true}
          />
        )}

        {/* Chat Messages Body with Grid wallpaper styling */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-slate-50 to-slate-100/50 scrollbar-thin scrollbar-thumb-slate-205">
          {chatRoomMessages.length === 0 ? (
            <div className="text-center py-24 text-slate-400 text-xs flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner animate-bounce">
                <MessageSquare size={26} />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="font-bold text-slate-700 text-sm">Real-Time Consultation Feed</p>
                <p className="text-[11px] text-slate-400">Say hello or share files with the client to start the consultation.</p>
              </div>
            </div>
          ) : (
            chatRoomMessages.map((msg) => {
              const isDoc = msg.sender === 'doctor';
              const displayName = isDoc ? 'You' : msg.senderName;
              return (
                <div key={msg.id} className={`flex gap-3.5 max-w-[85%] ${isDoc ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                    isDoc ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {isDoc ? 'Dr' : 'U'}
                  </div>

                  <div className={`flex flex-col ${isDoc ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold mb-1 px-1">{displayName}</span>
                    
                    {/* Message Bubble */}
                    {msg.fileUrl ? (
                      <a
                        href={`${import.meta.env.VITE_BACKEND_URL}${msg.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                          isDoc
                            ? 'bg-blue-50 border border-blue-200 text-blue-950 rounded-tr-none hover:bg-blue-100'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDoc ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                          <Paperclip size={16} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold truncate text-xs text-slate-800 leading-normal">{msg.text}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Click to view attachment</p>
                        </div>
                      </a>
                    ) : (
                      <div className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-md ${
                        isDoc
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
                      }`}>
                        {msg.text}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[9px] text-slate-400 font-medium">{msg.time}</span>
                      {isDoc && <CheckCheck size={11} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Message Footer with Quick Replies */}
        <div className="p-4 border-t border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl relative z-10 shrink-0">
          {/* Quick replies bar */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSendMessageInChatRoom(reply)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 text-slate-500 hover:bg-blue-50/30"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <input 
              type="file" 
              id="doctor-chat-file-input" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <label 
              htmlFor="doctor-chat-file-input" 
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 h-10 w-10 shadow-sm hover:border-blue-200 active:scale-95"
              title="Share File / Document"
            >
              <Paperclip size={18} />
            </label>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessageInChatRoom()}
              placeholder="Type your message..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-slate-800 placeholder-slate-400 h-10 transition-all font-medium"
            />
            <button
              onClick={() => handleSendMessageInChatRoom()}
              className="bg-gradient-to-r from-blue-600 to-indigo-505 hover:from-blue-700 hover:to-indigo-600 text-white p-2.5 rounded-xl transition-all h-10 w-10 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/10 active:scale-95 border-0 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Complete consultation and write prescription modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="text-blue-605" />
              Complete Consultation
            </h3>
            <p className="text-xs text-slate-505 mt-1">
              Provide treatment instructions, diagnosis, and prescription details. This report will be saved to patient history, sent to the farmer's email, and made downloadable.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-705 uppercase tracking-wider mb-1">
                  Prescription & Advice details
                </label>
                <textarea
                  value={prescriptionInput}
                  onChange={(e) => setPrescriptionInput(e.target.value)}
                  placeholder="Enter diagnosis, prescribed medicines, dosage, and home care instructions..."
                  rows={6}
                  className="w-full border border-slate-205 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 bg-slate-50 text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="px-4 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border-0"
              >
                Go Back
              </button>
              <button
                onClick={handleCompleteSubmit}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-505 hover:from-blue-700 hover:to-indigo-650 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/10 border-0"
              >
                Submit & Complete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
