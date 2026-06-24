import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Stethoscope, Paperclip, User, Phone, XCircle, MessageSquare, Send 
} from 'lucide-react';

export default function ChatConsultationRoom({ 
  isOpen, 
  onClose, 
  onComplete, 
  requestDetails 
}) {
  const [chatRoomMessages, setChatRoomMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Simulated farmer messages during chat consultation room
  useEffect(() => {
    if (!isOpen || !requestDetails) return;
    
    const ownerName = requestDetails.owner_name || 'Farmer';
    const animalName = requestDetails.animal_name || 'Bessie';

    const timers = [];
    
    // Message 1 (3 seconds)
    timers.push(setTimeout(() => {
      setChatRoomMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 20,
          sender: 'client',
          senderName: ownerName,
          text: `Hello Doctor, thanks for opening the chat room. I appreciate you taking the time to help.`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 3000));

    // Message 2 (10 seconds)
    timers.push(setTimeout(() => {
      setChatRoomMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 21,
          sender: 'client',
          senderName: ownerName,
          text: `I've uploaded ${animalName}'s health records. She hasn't been eating her feed since yesterday morning, and she seems to be laying down more than usual.`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 10000));

    // Message 3 (20 seconds)
    timers.push(setTimeout(() => {
      setChatRoomMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 22,
          sender: 'client',
          senderName: ownerName,
          text: `Do you think we should adjust her diet, or could this be an early symptom of milk fever?`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 20000));

    return () => timers.forEach(clearTimeout);
  }, [isOpen, requestDetails]);

  if (!isOpen || !requestDetails) return null;

  const handleSendMessageInChatRoom = () => {
    if (!chatInput.trim()) return;
    const msgText = chatInput;
    const newMsg = {
      id: Date.now(),
      sender: 'doctor',
      senderName: 'You',
      text: msgText,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatRoomMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setIsTyping(true);

    // Auto-reply timer
    setTimeout(() => {
      setIsTyping(false);
      const ownerName = requestDetails?.owner_name || 'Farmer';
      setChatRoomMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 25,
          sender: 'client',
          senderName: ownerName,
          text: `Understood, Doctor. I will check that immediately and let you know what happens.`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  const getMockFiles = (animalName, species) => {
    const cleanName = animalName || 'Patient';
    const cleanSpecies = (species || 'Animal').charAt(0).toUpperCase() + (species || 'Animal').slice(1).toLowerCase();
    return [
      { name: `${cleanName}_Health_Record.pdf`, size: '2.4 MB' },
      { name: `${cleanSpecies}_Vaccination_Log.xlsx`, size: '1.1 MB' }
    ];
  };

  const handleEndConsultation = async () => {
    if (window.confirm("Are you sure you want to end this chat consultation?")) {
      onClose();
      const markDone = window.confirm("Would you like to mark this consultation as completed?");
      if (markDone) {
        try {
          await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${requestDetails.id}/complete`);
          if (onComplete) onComplete();
        } catch (err) {
          console.error("Failed to complete appointment:", err);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-800 z-50 flex overflow-hidden animate-in fade-in duration-300">
      
      {/* Left Panel: Case Details Context */}
      <div className="w-80 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col p-6 space-y-6 overflow-y-auto">
        {/* Header info */}
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Stethoscope size={20} className="text-blue-500" />
            Case File
          </h3>
          <p className="text-xs text-slate-500 mt-1">Live Clinical Context</p>
        </div>

        {/* Patient overview */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Patient Name</p>
            <p className="text-base font-bold text-slate-100 mt-0.5">{requestDetails.animal_name}</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Species / Breed</p>
            <p className="text-sm font-medium text-slate-300 mt-0.5">
              {requestDetails.animal_species} {requestDetails.animal_breed ? `(${requestDetails.animal_breed})` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Age</p>
              <p className="text-sm font-bold text-slate-300 mt-0.5">{requestDetails.animal_age || '4 Years'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Weight</p>
              <p className="text-sm font-bold text-slate-300 mt-0.5">{requestDetails.animal_weight || '1,400 lbs'}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reason for Visit</p>
            <div className="bg-red-950/20 border border-red-900/30 text-red-200 p-3 rounded-lg text-xs leading-relaxed">
              {requestDetails.reason_notes || 'No notes provided.'}
            </div>
          </div>

          {/* Mock files list */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attached Files</p>
            <div className="space-y-2">
              {getMockFiles(requestDetails.animal_name, requestDetails.animal_species).map((file, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded text-[11px]">
                  <Paperclip size={12} className="text-slate-500 flex-shrink-0" />
                  <span className="truncate text-slate-300 flex-1">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Minimize button */}
        <div className="flex-1 flex flex-col justify-end pb-4">
          <button 
            onClick={() => {
              if (window.confirm("Minimize chat room and return to requests?")) {
                onClose(); // Just close the room overlay, don't end consultation
              }
            }}
            className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-all border border-slate-805 cursor-pointer"
          >
            Minimize Workspace
          </button>
        </div>
      </div>

      {/* Right Panel: Immersive Chat Feed */}
      <div className="flex-1 bg-white flex flex-col h-full">
        
        {/* Top Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
              {requestDetails.owner_image && requestDetails.owner_image !== '/default.jpg' ? (
                <img src={`${import.meta.env.VITE_BACKEND_URL}${requestDetails.owner_image}`} alt={requestDetails.owner_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
              ) : (
                <User size={18} className="text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{requestDetails.owner_name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold">Live Chat Consultation Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Initiating simulated secure voice call with client...')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border border-slate-200 bg-white"
              title="Call Client"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={handleEndConsultation}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle size={16} />
              End Consultation
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {chatRoomMessages.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-semibold">Chat Consultation Room Opened</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Start typing to message the client.</p>
              </div>
            </div>
          ) : (
            chatRoomMessages.map((msg) => {
              const isDoc = msg.sender === 'doctor';
              return (
                <div key={msg.id} className={`flex flex-col ${isDoc ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 font-semibold mb-1 px-1">{msg.senderName}</span>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isDoc
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-1 text-slate-400 text-xs pl-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Input Message Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessageInChatRoom()}
            placeholder="Type your message..."
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-50 text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={handleSendMessageInChatRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
