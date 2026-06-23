import { useState, useEffect } from 'react';
import { User, X, Send } from 'lucide-react';

export default function ClientChatDrawer({ 
  isOpen, 
  onClose, 
  requestDetails 
}) {
  const [clientChatMessages, setClientChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Pre-load standalone chat history
  useEffect(() => {
    if (isOpen && requestDetails) {
      const animalName = requestDetails.animal_name || 'Bessie';
      setClientChatMessages([
        {
          id: 1,
          sender: 'client',
          text: `Hello doctor, I would like to schedule a consultation for my animal ${animalName}.`,
          time: '10:15 AM'
        },
        {
          id: 2,
          sender: 'doctor',
          text: `Hello! I would be happy to help. Please submit your requested availability slots and fill out the clinical notes.`,
          time: '10:18 AM'
        },
        {
          id: 3,
          sender: 'client',
          text: `Yes, I just submitted the request. Please review it when you have a moment. Thanks!`,
          time: '10:20 AM'
        }
      ]);
    }
  }, [isOpen, requestDetails]);

  if (!isOpen || !requestDetails) return null;

  const handleSendClientMessage = () => {
    if (!chatInput.trim()) return;
    const msgText = chatInput;
    const newMsg = {
      id: Date.now(),
      sender: 'doctor',
      text: msgText,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    
    setClientChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setClientChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 10,
          sender: 'client',
          text: `Thank you for the message doctor! I will make sure everything is ready on my side.`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-300 text-slate-800">
        
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
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
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold">Online</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {clientChatMessages.map((msg) => {
            const isDoc = msg.sender === 'doctor';
            return (
              <div key={msg.id} className={`flex flex-col ${isDoc ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  isDoc 
                    ? 'bg-green-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex items-center gap-1 text-slate-400 text-xs pl-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendClientMessage()}
            placeholder="Type your message..."
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-slate-50 text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={handleSendClientMessage}
            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </>
  );
}
