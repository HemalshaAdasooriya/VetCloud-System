import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, FileText, 
  User, Video, Phone, MapPin, Calendar, ChevronRight,
  HourglassIcon, Stethoscope, ArrowLeft, Paperclip, MessageSquare,
  Mic, MicOff, VideoOff, Monitor, Send, X, MessageCircle, Loader2
} from 'lucide-react';
import { Button, Card, Badge, Textarea } from '../components/Ui/ui';
import ChatConsultationRoom from '../components/consultation/ChatConsultationRoom';
import ClientChatDrawer from '../components/consultation/ClientChatDrawer';
import JitsiVideoCall from '../components/consultation/JitsiVideoCall';

export default function DoctorConsultations() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [completingAptId, setCompletingAptId] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");

  // Calling & Chat State hooks
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [showClientChatDrawer, setShowClientChatDrawer] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [chatInput, setChatInput] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [chatMessages, setChatMessages] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [callDuration, setCallDuration] = useState(0);

  const getVetId = () => {
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return u.id || u.vetId || u.user_id || null;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // const vetId = getVetId();

  const getDoctorName = () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.fullName || 'Doctor';
      }
    } catch (e) {
      console.error(e);
    }
    return 'Doctor';
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Auto-select and join call/chat from navigation state (e.g. from Dashboard)
  useEffect(() => {
    if (location.state?.appointmentId && appointments.length > 0) {
      const matched = appointments.find(a => a.id === location.state.appointmentId);
      if (matched) {
        setSelectedRequestDetails(matched);
        if (location.state?.startCall) {
          setShowVideoRoom(true);
        } else if (location.state?.startChat) {
          setShowChatRoom(true);
        }
      }
    }
  }, [location.state, appointments]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const vetId = getVetId();
      if (!vetId) {
        throw new Error('Veterinarian ID not found. Please login again.');
      }

      // Fetch all appointments for this vet
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/vet/${vetId}`
      );
      const data = response.data || [];
      console.log('📊 Doctor Consultations loaded:', data);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load consultations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Live call duration timer
  useEffect(() => {
    let interval = null;
    if (showVideoRoom) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [showVideoRoom]);

  // Simulated farmer messages during call
  useEffect(() => {
    if (!showVideoRoom || !selectedRequestDetails) return;
    
    const ownerName = selectedRequestDetails.owner_name || 'Farmer';
    const animalName = selectedRequestDetails.animal_name || 'Bessie';

    const timers = [];
    
    timers.push(setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'client',
          senderName: ownerName,
          text: `Hi doctor! Thanks for joining. Can you see ${animalName} clearly?`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 5000));

    timers.push(setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'client',
          senderName: ownerName,
          text: `I've got her right here in the paddock. Her appetite is still a bit low, but she seems slightly more active than yesterday.`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 15000));

    timers.push(setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          sender: 'client',
          senderName: ownerName,
          text: `Should I continue administering the supplement we discussed, or do we need to try something else?`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 30000));

    return () => timers.forEach(clearTimeout);
  }, [showVideoRoom, selectedRequestDetails]);

  // Handle send message in call (unused)
  /*
  const handleSendMessageInCall = () => {
    if (!chatInput.trim()) return;
    const msgText = chatInput;
    const newMsg = {
      id: Date.now(),
      sender: 'doctor',
      senderName: 'You',
      text: msgText,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const ownerName = selectedRequestDetails?.owner_name || 'Farmer';
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 5,
          sender: 'client',
          senderName: ownerName,
          text: `Got it doctor. Thank you, I'll follow those instructions.`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };
  */

  // Helper for duration strings (unused)
  /*
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  */

  // Helper: Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return 'Time pending';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Helper: Format date
  const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return 'Date pending';
    try {
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return timeStr ? `${formattedDate} at ${formatTime(timeStr)}` : formattedDate;
    } catch {
      return dateStr;
    }
  };

  // Helper: timeAgo relative format (unused)
  /*
  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return `${Math.floor(seconds)}s ago`;
    } catch {
      return 'Recently';
    }
  };
  */

  // Filter lists based on status
  const upcomingConsultations = appointments.filter(a => 
    a.status === 'Approved' || a.status === 'approved'
  );
  
  const completedConsultations = appointments.filter(a => 
    a.status === 'Completed' || a.status === 'completed'
  );

  const cancelledConsultations = appointments.filter(a => 
    a.status === 'Rejected' || a.status === 'rejected' ||
    a.status === 'Cancelled' || a.status === 'cancelled'
  );

  // Statistics
  const totalUpcomingCount = upcomingConsultations.length;
  const totalCompletedCount = completedConsultations.length;
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  const totalTodayCount = upcomingConsultations.filter(a => {
    if (!a.appointment_date) return false;
    const appDate = new Date(a.appointment_date);
    return appDate >= todayStart && appDate <= todayEnd;
  }).length;

  // Urgency badge helper
  const getUrgencyBadge = (reasonStr) => {
    const lower = (reasonStr || '').toLowerCase();
    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('severe') || lower.includes('dying') || lower.includes('bleeding') || lower.includes('breathing')) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold px-2 py-0.5 rounded-full text-xs">
          High Priority
        </Badge>
      );
    }
    if (lower.includes('mild') || lower.includes('checkup') || lower.includes('routine') || lower.includes('vaccin')) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold px-2 py-0.5 rounded-full text-xs">
          Low Priority
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-semibold px-2 py-0.5 rounded-full text-xs">
        Medium Priority
      </Badge>
    );
  };

  // Symptoms helper
  const extractSymptoms = (notes) => {
    if (!notes) return [];
    const lower = notes.toLowerCase();
    const symptomsList = [];
    if (lower.includes('lethargy') || lower.includes('tired') || lower.includes('weak') || lower.includes('sluggish')) symptomsList.push('Lethargy');
    if (lower.includes('appetite') || lower.includes('eating') || lower.includes('feed')) symptomsList.push('Reduced Appetite');
    if (lower.includes('milk') || lower.includes('yield') || lower.includes('production')) symptomsList.push('Drop in Milk Production');
    if (lower.includes('cough') || lower.includes('sneeze') || lower.includes('respirat')) symptomsList.push('Coughing');
    if (lower.includes('fever') || lower.includes('temp') || lower.includes('hot')) symptomsList.push('Fever');
    if (lower.includes('injury') || lower.includes('wound') || lower.includes('hurt') || lower.includes('cut')) symptomsList.push('Physical Injury');
    
    if (symptomsList.length === 0 && notes.length > 0) {
      const parts = notes.split(/[,.]+/).map(w => w.trim()).filter(w => w.length > 0 && w.length < 20);
      if (parts.length > 0) {
        return parts.slice(0, 3);
      }
      return ['General Symptoms'];
    }
    return symptomsList;
  };

  // Status Badge Renderer
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold px-3 py-1 rounded-full text-xs">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold px-3 py-1 rounded-full text-xs">Completed</Badge>;
      case 'rejected':
      case 'declined':
        return <Badge className="bg-red-100 text-red-700 border-red-200 font-bold px-3 py-1 rounded-full text-xs">Declined</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 font-bold px-3 py-1 rounded-full text-xs">Cancelled</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold px-3 py-1 rounded-full text-xs">{status}</Badge>;
    }
  };

  // Type Icon Renderer
  const getTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'video':
      case 'video call':
        return <Video size={16} className="text-blue-500" />;
      case 'clinic visit':
      case 'clinic':
        return <MapPin size={16} className="text-green-500" />;
      case 'phone call':
      case 'phone':
        return <Phone size={16} className="text-purple-500" />;
      case 'chat':
      case 'chat / messages':
        return <MessageCircle size={16} className="text-indigo-500" />;
      default:
        return <Video size={16} className="text-slate-400" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type?.toLowerCase()) {
      case 'video':
        return 'Video Consultation';
      case 'clinic':
        return 'In-Clinic Visit';
      case 'phone':
        return 'Phone Consultation';
      case 'chat':
        return 'Live Chat Consultation';
      default:
        return type || 'Consultation';
    }
  };

  // Action handlers
  const handleOpenCompleteModal = (appointmentId) => {
    setCompletingAptId(appointmentId);
    setPrescriptionText("");
    setShowPrescriptionModal(true);
  };

  const handleComplete = async (withPrescription = true) => {
    setActionLoading(true);
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${completingAptId}/complete`, {
        prescription: withPrescription ? prescriptionText : ""
      });
      await fetchAppointments();
      setSuccessMessage('Appointment marked as completed successfully!');
      setSelectedRequestDetails(null);
      setShowPrescriptionModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      alert('Failed to complete appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setActionLoading(true);
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${appointmentId}/cancel`);
      await fetchAppointments();
      setSuccessMessage('Appointment cancelled successfully!');
      setSelectedRequestDetails(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading consultations...</p>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'upcoming' 
    ? upcomingConsultations 
    : activeTab === 'completed' 
    ? completedConsultations 
    : cancelledConsultations;

  const request = selectedRequestDetails;
  const notes = request?.reason_notes || request?.reason || '';
  const symptoms = request ? extractSymptoms(notes) : [];

  return (
    <div className="space-y-6">
      {/* Detail Overlay View */}
      {selectedRequestDetails ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedRequestDetails(null);
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors group font-semibold"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Consultations Board</span>
          </button>

          {/* Header & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-800">Consultation Details</h2>
                {getStatusBadge(request.status)}
              </div>
              <p className="text-slate-500 mt-1">Review Patient History, symptoms, and conduct the call/chat consultation.</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Side: Clinical Info & Action Actions */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Clinical Card */}
              <Card className="p-6 border-slate-200 shadow-sm space-y-6 bg-white rounded-2xl">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
                  <Stethoscope size={18} className="text-green-600" />
                  <span>Clinical Case File</span>
                </div>

                {/* Patient Profile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Patient Name</p>
                    <p className="text-base text-slate-800 font-bold mt-1">{request.animal_name || 'Patient'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Species</p>
                    <p className="text-base text-slate-800 font-bold mt-1 capitalize">{request.animal_species || 'Unknown'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Breed</p>
                    <p className="text-base text-slate-800 font-bold mt-1 truncate">{request.animal_breed || 'Unknown'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Age</p>
                    <p className="text-base text-slate-800 font-bold mt-1">{request.animal_age || 'N/A'}</p>
                  </div>
                </div>

                {/* Urgency Badge & Symptoms */}
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Diagnostic Symptoms</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {getUrgencyBadge(notes)}
                    {symptoms.map((sym, idx) => (
                      <Badge key={idx} className="bg-slate-100 text-slate-700 border-slate-200 px-3 py-1 rounded-full text-xs font-semibold">
                        {sym}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Owner Notes */}
                <div className="space-y-2 bg-green-50/30 p-4 rounded-xl border border-green-100/50">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Reason for consultation</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    "{notes || 'No description notes provided by the client.'}"
                  </p>
                </div>
              </Card>

              {/* Consultation Details Card */}
              <Card className="p-6 border-slate-200 shadow-sm bg-white rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
                  <Calendar size={18} className="text-blue-500" />
                  <span>Scheduled Session Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <Clock size={16} className="text-slate-400" />
                    <div>
                      <p className="text-slate-400 text-xs">Date & Time</p>
                      <p className="text-slate-800 font-semibold mt-0.5">
                        {formatDate(request.appointment_date, request.appointment_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    {getTypeIcon(request.consultation_type)}
                    <div>
                      <p className="text-slate-400 text-xs">Channel Type</p>
                      <p className="text-slate-800 font-semibold mt-0.5">
                        {getTypeLabel(request.consultation_type)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Consultation conducting Actions */}
              {(request.status === 'Approved' || request.status === 'approved') && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {request.consultation_type === 'video' ? (
                    <Button 
                      onClick={() => {
                        setChatMessages([]);
                        setShowVideoRoom(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 font-bold shadow-lg shadow-green-600/20 flex-1 md:flex-initial flex items-center gap-2 rounded-xl"
                    >
                      <Video size={18} />
                      Start Video Call
                    </Button>
                  ) : request.consultation_type === 'chat' ? (
                    <Button 
                      onClick={() => setShowChatRoom(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 font-bold shadow-lg shadow-indigo-600/20 flex-1 md:flex-initial flex items-center gap-2 rounded-xl"
                    >
                      <MessageSquare size={18} />
                      Open Chat Room
                    </Button>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl w-full text-sm font-medium">
                      Clinic Visit: Please conduct this consultation in person at your designated clinic.
                    </div>
                  )}

                  <div className="w-full flex gap-3 mt-2">
                    <Button 
                      onClick={() => handleOpenCompleteModal(request.id)}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 py-3 rounded-xl cursor-pointer"
                    >
                      Mark as Completed
                    </Button>
                    <Button 
                      onClick={() => handleCancel(request.id)}
                      variant="outline"
                      disabled={actionLoading}
                      className="border-red-200 text-red-600 hover:bg-red-50 font-bold flex-1 py-3 rounded-xl"
                    >
                      Cancel Consultation
                    </Button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Side: Owner info / Files */}
            <div className="space-y-6">
              
              {/* Owner card */}
              <Card className="p-6 border-slate-200 shadow-sm bg-white rounded-2xl space-y-6">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
                  <User size={18} className="text-slate-400" />
                  <span>Client Profile</span>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={request.owner_image ? `${import.meta.env.VITE_BACKEND_URL}${request.owner_image}` : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt={request.owner_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-snug">{request.owner_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Farmer / Pet Owner</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Contact No.</span>
                    <span className="text-slate-800 font-bold">{request.owner_contact || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Email</span>
                    <span className="text-slate-800 font-bold truncate max-w-[170px]">{request.owner_email || 'Not provided'}</span>
                  </div>
                </div>
              </Card>

            </div>

          </div>

        </div>
      ) : (
        // Main Consultations Board
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Upcoming Consultations</h2>
              <p className="text-slate-500 mt-1">Conduct approved video consultations, client chats, and view completed sessions.</p>
            </div>
          </div>

          {/* Success messages */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="text-emerald-600" size={18} />
              <span className="font-semibold text-sm">{successMessage}</span>
            </div>
          )}

          {/* Statistics widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Scheduled Today</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalTodayCount}</h3>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Upcoming</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalUpcomingCount}</h3>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completed Sessions</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalCompletedCount}</h3>
              </div>
            </Card>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
                activeTab === 'upcoming' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Upcoming ({totalUpcomingCount})
              {activeTab === 'upcoming' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
                activeTab === 'completed' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Completed ({totalCompletedCount})
              {activeTab === 'completed' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
                activeTab === 'cancelled' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cancelled / Declined ({cancelledConsultations.length})
              {activeTab === 'cancelled' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></span>
              )}
            </button>
          </div>

          {/* Consultation lists */}
          <div className="grid gap-4">
            {currentList.length > 0 ? (
              currentList.map((request) => {
                const notesText = request.reason_notes || request.reason || '';
                return (
                  <Card key={request.id} className="p-4 border-slate-200 hover:shadow-md transition-all bg-white rounded-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-inner">
                          {request.animal_image && request.animal_image !== '/default.jpg' ? (
                            <img 
                              src={`${import.meta.env.VITE_BACKEND_URL}${request.animal_image}`} 
                              alt={request.animal_name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100'; }} 
                            />
                          ) : (
                            <div className="p-2 bg-slate-100 rounded-full text-slate-400">
                              <Stethoscope size={20} />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-lg">{request.animal_name || 'Patient'}</h3>
                            {activeTab === 'upcoming' 
                              ? getUrgencyBadge(notesText)
                              : getStatusBadge(request.status)
                            }
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">
                            Owned by <span className="font-semibold text-slate-800">{request.owner_name || 'Unknown Owner'}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(request.appointment_date, request.appointment_time)}
                            </span>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(request.consultation_type)}
                              {getTypeLabel(request.consultation_type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                        {activeTab === 'upcoming' && (
                          <div className="flex items-center gap-2">
                            {request.consultation_type === 'video' ? (
                              <Button
                                onClick={() => {
                                  setSelectedRequestDetails(request);
                                  setChatMessages([]);
                                  setShowVideoRoom(true);
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 px-4 rounded-xl"
                              >
                                <Video size={14} />
                                Join Call
                              </Button>
                            ) : request.consultation_type === 'chat' ? (
                              <Button
                                onClick={() => {
                                  setSelectedRequestDetails(request);
                                  setShowChatRoom(true);
                                }}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 px-4 rounded-xl"
                              >
                                <MessageSquare size={14} />
                                Chat
                              </Button>
                            ) : null}
                          </div>
                        )}

                        <Button 
                          onClick={() => setSelectedRequestDetails(request)}
                          variant="ghost" 
                          size="sm"
                          className="text-slate-600 hover:text-green-600 hover:bg-slate-50 flex items-center gap-1 px-3 rounded-xl"
                        >
                          Details
                          <ChevronRight size={18} />
                        </Button>
                      </div>

                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-16 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">No sessions found</h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  There are no consultations listed under this status tab currently.
                </p>
              </Card>
            )}
          </div>

        </div>
      )}

      {/* Video Consultation Room Overlay */}
      {showVideoRoom && selectedRequestDetails && (
        <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col animate-in fade-in duration-300">
          
          {/* Top Bar Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Live Call
              </div>
              <h3 className="font-extrabold text-slate-100 text-lg">
                Consultation: {selectedRequestDetails.animal_name} ({selectedRequestDetails.animal_species})
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to end this consultation call?")) {
                    setShowVideoRoom(false);
                    const markDone = window.confirm("Would you like to mark this consultation as completed?");
                    if (markDone) {
                      handleOpenCompleteModal(selectedRequestDetails.id);
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md transition-all cursor-pointer border-0"
              >
                Exit Call
              </button>
            </div>
          </div>

          {/* Main Layout Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Jitsi Meet Iframe */}
            <div className="flex-1 p-6 bg-slate-950 flex flex-col h-full">
              <JitsiVideoCall
                roomName={`vetcloud-appointment-${selectedRequestDetails.id}`}
                displayName={getDoctorName()}
                onClose={async () => {
                  setShowVideoRoom(false);
                  const markDone = window.confirm("Would you like to mark this consultation as completed?");
                  if (markDone) {
                    handleOpenCompleteModal(selectedRequestDetails.id);
                  }
                }}
              />
            </div>

            {/* Right: Clinical History Sidebar */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col overflow-y-auto space-y-6 shrink-0">
              <div className="border-b border-slate-800 pb-4">
                <h4 className="font-extrabold text-white text-md flex items-center gap-2">
                  <Stethoscope size={18} className="text-green-500" />
                  Clinical Profile
                </h4>
                <p className="text-xs text-slate-400 mt-1">Review live details and records</p>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Patient Name</p>
                  <p className="text-base font-bold text-white mt-0.5">{selectedRequestDetails.animal_name || 'Patient'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Species</p>
                    <p className="font-semibold text-white capitalize">{selectedRequestDetails.animal_species || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Breed</p>
                    <p className="font-semibold text-white truncate">{selectedRequestDetails.animal_breed || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Age</p>
                    <p className="font-semibold text-white">{selectedRequestDetails.animal_age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Owner</p>
                    <p className="font-semibold text-white truncate">{selectedRequestDetails.owner_name || 'Client'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Reason / Symptoms</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    "{selectedRequestDetails.reason_notes || selectedRequestDetails.reason || 'No description notes provided.'}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Consultation Room Overlay */}
      <ChatConsultationRoom
        isOpen={showChatRoom}
        onClose={() => setShowChatRoom(false)}
        onComplete={fetchAppointments}
        requestDetails={selectedRequestDetails}
      />

      {/* Standalone Client Chat Drawer */}
      <ClientChatDrawer
        isOpen={showClientChatDrawer}
        onClose={() => setShowClientChatDrawer(false)}
        requestDetails={selectedRequestDetails}
      />

      {/* Prescription / Complete Consultation Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Complete Consultation</h3>
                <button 
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer border-0 bg-transparent"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 mb-2">
                  You are marking this consultation as completed. You can write a digital prescription / treatment report for the patient below:
                </p>
                <label className="text-xs font-bold text-slate-600">Prescription / Treatment Report</label>
                <textarea
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  placeholder="e.g. Amoxicillin 250mg twice daily for 5 days. Rest and keep hydrated."
                  className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-slate-700 mt-1 animate-none"
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => handleComplete(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-10 cursor-pointer"
                >
                  Complete & Send Prescription
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-600 font-medium h-10 cursor-pointer"
                    onClick={() => setShowPrescriptionModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-slate-500 hover:bg-slate-50 font-medium h-10 cursor-pointer"
                    onClick={() => handleComplete(false)}
                  >
                    Complete without Prescription
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
