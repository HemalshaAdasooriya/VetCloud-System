import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Stethoscope, Paperclip, User, Phone, PhoneOff, XCircle, MessageSquare, Send, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import JitsiVideoCall from './JitsiVideoCall';

export default function FarmerChatRoom({ 
  isOpen, 
  onClose, 
  requestDetails 
}) {
  const [chatRoomMessages, setChatRoomMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'incoming', 'active'
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [emailing, setEmailing] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const storageKey = `chat_history_${requestDetails?.id}`;

  const quickReplies = [
    "Hello Doctor! 👋",
    "Uploaded the file.",
    "Bessie is not eating since morning.",
    "Thank you so much!"
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
    socket.on("voice-call-broadcast", ({ action }) => {
      if (action === "invite") {
        setCallState("incoming");
      } else if (action === "accept") {
        setCallState("active");
      } else if (action === "decline") {
        setCallState("idle");
      } else if (action === "hangup") {
        setCallState("idle");
      }
    });

    // Listen for consultation complete
    socket.on("consultation-completed", ({ prescription }) => {
      setPrescriptionText(prescription);
      setShowPrescriptionModal(true);
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
      sender: "client",
      senderName: requestDetails.owner_name || "Farmer"
    });
  };

  const handleAcceptCall = () => {
    if (!socketRef.current) return;
    setCallState("active");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "accept",
      sender: "client",
      senderName: requestDetails.owner_name || "Farmer"
    });
  };

  const handleDeclineCall = () => {
    if (!socketRef.current) return;
    setCallState("idle");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "decline",
      sender: "client",
      senderName: requestDetails.owner_name || "Farmer"
    });
  };

  const handleHangupCall = () => {
    if (!socketRef.current) return;
    setCallState("idle");
    socketRef.current.emit("voice-call-action", {
      appointmentId: requestDetails.id,
      action: "hangup",
      sender: "client",
      senderName: requestDetails.owner_name || "Farmer"
    });
  };

  const handleSendMessageInChatRoom = (customText = null) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || !socketRef.current) return;
    
    // Emit to room
    socketRef.current.emit("send-chat-message", {
      appointmentId: requestDetails.id,
      text: textToSend,
      sender: 'client',
      senderName: requestDetails.owner_name || 'Farmer'
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
          sender: 'client',
          senderName: requestDetails.owner_name || 'Farmer'
        });
      }
    } catch (err) {
      console.error("File upload failed:", err);
      toast.error("Failed to upload file. Please try again.", { id: uploadToast });
    }
  };

  const handleEmailReport = async () => {
    setEmailing(true);
    const loadToast = toast.loading("Sending medical report to your email...");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/chat-email-prescription`, {
        appointmentId: requestDetails.id,
        prescription: prescriptionText
      });
      toast.success("Medical report successfully sent to your email!", { id: loadToast });
    } catch (err) {
      console.error("Failed to email prescription:", err);
      toast.error("Failed to email report. Please try again.", { id: loadToast });
    } finally {
      setEmailing(false);
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Treatment Report - Appointment #${requestDetails.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .title { font-size: 18px; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
            .card-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            .prescription-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; padding: 20px; border-radius: 8px; font-size: 14px; white-space: pre-line; margin-bottom: 40px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">VETCLOUD SYSTEM</div>
            <div class="title">Official Consultation Treatment Report</div>
          </div>
          
          <div class="grid">
            <div class="card">
              <div class="card-title">Doctor Details</div>
              <strong>Dr. ${requestDetails.veterinarian_name}</strong><br>
              VetCloud Registered Veterinarian<br>
              Consultation Type: Chat Session
            </div>
            <div class="card">
              <div class="card-title">Patient & Owner Details</div>
              <strong>Owner:</strong> ${requestDetails.owner_name || 'Farmer'}<br>
              <strong>Patient Name:</strong> ${requestDetails.animal_name}<br>
              <strong>Species:</strong> ${requestDetails.animal_species}
            </div>
          </div>

          <div class="card-title">Prescribed Treatments & Advice</div>
          <div class="prescription-box">${prescriptionText.replace(/\n/g, '<br>')}</div>

          <div class="footer">
            This is a computer-generated medical record from VetCloud. Date: ${new Date().toLocaleDateString()}<br>
            VetCloud Consultation ID: #${requestDetails.id}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-955 text-slate-800 z-50 flex overflow-hidden font-sans">
      
      {/* Left Panel: Case Details Context with Glassmorphism Dark theme */}
      <div className="w-80 bg-slate-900/95 text-slate-300 border-r border-slate-800 flex flex-col p-6 space-y-6 overflow-y-auto backdrop-blur-md shrink-0">
        {/* Header info */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-505 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-bold shrink-0">
              VC
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">VetCloud Live</h3>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">Farmer Portal</p>
            </div>
          </div>
        </div>

        {/* Veterinarian overview */}
        <div className="space-y-5 flex-1">
          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Consulting Vet</p>
            <p className="text-base font-extrabold text-white mt-1">Dr. {requestDetails.veterinarian_name}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/30 text-emerald-400 text-[10px] font-bold rounded-full mt-2.5 border border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Patient Name</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{requestDetails.animal_name}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Species</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 capitalize">{requestDetails.animal_species}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reason / Description</p>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-850 max-h-36 overflow-y-auto">
              {requestDetails.reason_notes || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Close/Minimize button */}
        <div className="pt-4 border-t border-slate-850">
          <button 
            onClick={() => {
              if (window.confirm("Leave this chat room? You can open it again from your consultations page.")) {
                onClose();
              }
            }}
            className="w-full bg-slate-950 hover:bg-slate-850 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-850 cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-1.5"
          >
            <XCircle size={14} />
            Leave Chat Room
          </button>
        </div>
      </div>

      {/* Right Panel: Immersive Chat Feed with subtle gradient background */}
      <div className="flex-1 bg-white flex flex-col h-full relative">
        
        {/* Top Header bar with Glassmorphism style */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner shrink-0">
              {requestDetails.veterinarian_name ? requestDetails.veterinarian_name.charAt(0) : 'D'}
            </div>
            <div>
              <h4 className="font-bold text-slate-850 text-sm">Dr. {requestDetails.veterinarian_name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold">Live Consultation Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInitiateCall}
              className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-slate-200 bg-white hover:border-emerald-200 flex items-center justify-center active:scale-95 shadow-sm"
              title="Start Online Voice Call"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={() => {
                if (window.confirm("Leave this chat room? You can open it again from your consultations page.")) {
                  onClose();
                }
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-0 active:scale-95 shadow-sm"
            >
              Close
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
                    <p className="text-sm font-bold">Calling Dr. {requestDetails.veterinarian_name}...</p>
                    <p className="text-xs text-slate-400 animate-pulse">Waiting for doctor to pick up</p>
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
                    <p className="text-xs text-emerald-400 font-medium">Dr. {requestDetails.veterinarian_name} is calling you</p>
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
            displayName={requestDetails.owner_name || 'Farmer'}
            onClose={handleHangupCall}
            voiceOnly={true}
          />
        )}

        {/* Chat Messages Body with Grid wallpaper styling */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-slate-50 to-slate-100/50 scrollbar-thin scrollbar-thumb-slate-205">
          {chatRoomMessages.length === 0 ? (
            <div className="text-center py-24 text-slate-400 text-xs flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner animate-bounce">
                <MessageSquare size={26} />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="font-bold text-slate-700 text-sm">Real-Time Consultation Feed</p>
                <p className="text-[11px] text-slate-400">Say hello or share files with Dr. {requestDetails.veterinarian_name} to start your case consultation.</p>
              </div>
            </div>
          ) : (
            chatRoomMessages.map((msg) => {
              const isClient = msg.sender === 'client';
              const displayName = isClient ? 'You' : msg.senderName;
              return (
                <div key={msg.id} className={`flex gap-3.5 max-w-[85%] ${isClient ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                    isClient ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {isClient ? 'U' : 'Dr'}
                  </div>

                  <div className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold mb-1 px-1">{displayName}</span>
                    
                    {/* Message Bubble */}
                    {msg.fileUrl ? (
                      <a
                        href={`${import.meta.env.VITE_BACKEND_URL}${msg.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                          isClient
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-tr-none hover:bg-emerald-100'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isClient ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          <Paperclip size={16} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold truncate text-xs text-slate-800 leading-normal">{msg.text}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Click to view attachment</p>
                        </div>
                      </a>
                    ) : (
                      <div className={`rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-md ${
                        isClient
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
                      }`}>
                        {msg.text}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[9px] text-slate-400 font-medium">{msg.time}</span>
                      {isClient && <CheckCheck size={11} className="text-emerald-500" />}
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
                className="px-3 py-1 bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 text-slate-500 hover:bg-emerald-50/30"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <input 
              type="file" 
              id="farmer-chat-file-input" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <label 
              htmlFor="farmer-chat-file-input" 
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 h-10 w-10 shadow-sm hover:border-emerald-200 active:scale-95"
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
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-800 placeholder-slate-400 h-10 transition-all font-medium"
            />
            <button
              onClick={() => handleSendMessageInChatRoom()}
              className="bg-gradient-to-r from-emerald-600 to-teal-505 hover:from-emerald-700 hover:to-teal-600 text-white p-2.5 rounded-xl transition-all h-10 w-10 flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/10 active:scale-95 border-0 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Consultation Complete Prescription Report Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-605 flex items-center justify-center mb-4">
              <Stethoscope size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900">
              Consultation Completed!
            </h3>
            <p className="text-xs text-slate-505 mt-1">
              Dr. {requestDetails.veterinarian_name} has finalized this session and issued a medical prescription report for <strong>{requestDetails.animal_name}</strong>.
            </p>

            <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="block text-[10px] font-bold text-emerald-705 uppercase tracking-wider mb-1.5">
                Prescribed Advice & Medications:
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                {prescriptionText}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-505 hover:from-emerald-700 hover:to-teal-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer border-0"
              >
                Download PDF Report
              </button>
              <button
                onClick={handleEmailReport}
                disabled={emailing}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                {emailing ? "Sending Email..." : "Email Report to Me"}
              </button>
            </div>

            <button
              onClick={() => {
                setShowPrescriptionModal(false);
                onClose(); // Exit chat
              }}
              className="mt-3 w-full bg-slate-105 hover:bg-slate-200 text-slate-650 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border-0"
            >
              Close & Exit Chat
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
