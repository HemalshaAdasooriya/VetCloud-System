import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, FileText, 
  User, Video, Phone, MapPin, Calendar, ChevronRight,
  HourglassIcon, Stethoscope, ArrowLeft, Paperclip, MessageSquare,
  Mic, MicOff, VideoOff, Monitor, Send, X, MessageCircle
} from 'lucide-react';
import { Button, Card, Badge, Textarea } from '../components/ui/ui';
import ChatConsultationRoom from '../components/consultation/ChatConsultationRoom';
import ClientChatDrawer from '../components/consultation/ClientChatDrawer';

export default function VetConsultationRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Calling & Chat State hooks
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [showClientChatDrawer, setShowClientChatDrawer] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const vetId = localStorage.getItem('userId');
  useEffect(() => {
    if (!vetId) {
      setError('Please sign in to view consultation requests.');
      setLoading(false);
      return;
    }
    fetchAppointments();
  }, [vetId]);
  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/vet/${vetId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };
  const fetchAvailableSlots = async (appointmentId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${appointmentId}/available-slots`);
      setAvailableSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setAvailableSlots([]);
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
    
    // Message 1 (5 seconds)
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

    // Message 2 (15 seconds)
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

    // Message 3 (30 seconds)
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



  // Handle send message in call
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

    // Auto-reply timer
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



  // Helper for duration strings
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  // Filter appointments by status
  const pendingRequests = appointments.filter(a => a.status === 'Pending');
  const reviewedRequests = appointments.filter(a => 
    a.status === 'Approved' || a.status === 'Rejected' || a.status === 'Completed' || a.status === 'Cancelled'
  );
  // Format date and time
  const formatDate = (date, time) => {
    if (!date) return 'TBD';
    
    try {
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const timeStr = time || '00:00:00';
      const d = new Date(`${dateStr}T${timeStr}`);
      
      if (isNaN(d.getTime())) return 'TBD';
      
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + (time ? `, ${d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })}` : '');
    } catch {
      return 'TBD';
    }
  };
  // Format availability slots
  const formatAvailability = (availability) => {
    if (!Array.isArray(availability) || availability.length === 0) {
      return 'No slots provided';
    }
    
    return availability
      .map((s) => {
        const date = s.date ?? s.slot_date ?? '';
        const time = s.time ?? s.slot_time ?? '';
        return `${date}${time ? ` at ${time}` : ''}`.trim();
      })
      .join(' • ');
  };
  // Format submitted date
  const formatSubmittedDate = (value) => {
    if (!value) return 'Unknown date';
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };
  // Get urgency badge based on symptoms or reason
  const getUrgencyBadge = (reasonStr) => {
    const lower = (reasonStr || '').toLowerCase();
    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('severe') || lower.includes('dying') || lower.includes('bleeding') || lower.includes('breathing')) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          High Priority
        </Badge>
      );
    }
    if (lower.includes('mild') || lower.includes('checkup') || lower.includes('routine') || lower.includes('vaccin')) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Low Priority
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        Medium Priority
      </Badge>
    );
  };
  // Helper to extract symptoms from notes
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
    
    // Fallback if none matched but there are notes
    if (symptomsList.length === 0 && notes.length > 0) {
      const parts = notes.split(/[,.]+/).map(w => w.trim()).filter(w => w.length > 0 && w.length < 20);
      if (parts.length > 0) {
        return parts.slice(0, 3);
      }
      return ['General Symptoms'];
    }
    return symptomsList;
  };
  // Helper to get mock files based on animal name
  const getMockFiles = (animalName, species) => {
    const cleanName = animalName || 'Patient';
    const cleanSpecies = (species || 'Animal').charAt(0).toUpperCase() + (species || 'Animal').slice(1).toLowerCase();
    return [
      { name: `${cleanName}_Health_Record.pdf`, size: '2.4 MB' },
      { name: `${cleanSpecies}_Vaccination_Log.xlsx`, size: '1.1 MB' }
    ];
  };
  // Separate date formatting helpers
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'TBD' : d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'TBD';
    }
  };
  const formatTimeOnly = (timeStr) => {
    if (!timeStr) return 'TBD';
    try {
      const dummyDate = new Date(`2000-01-01T${timeStr}`);
      return isNaN(dummyDate.getTime()) ? timeStr : dummyDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeStr;
    }
  };
  // Get type icon
  const getTypeIcon = (consultationType) => {
    switch(consultationType) {
      case 'video':
        return <Video size={16} className="text-blue-500" />;
      case 'chat':
        return <Phone size={16} className="text-purple-500" />;
      default:
        return <Video size={16} className="text-blue-500" />;
    }
  };
  // Get type label
  const getTypeLabel = (consultationType) => {
    switch(consultationType) {
      case 'video':
        return 'Video Call';
      case 'chat':
        return 'Chat Consultation';
      default:
        return 'Video Call';
    }
  };
  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <HourglassIcon size={14} />,
        label: 'Pending Review'
      },
      'Approved': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <CheckCircle2 size={14} />,
        label: 'Approved'
      },
      'Completed': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <CheckCircle2 size={14} />,
        label: 'Completed'
      },
      'Cancelled': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <XCircle size={14} />,
        label: 'Cancelled'
      },
      'Rejected': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <XCircle size={14} />,
        label: 'Rejected'
      }
    };
    const config = statusConfig[status];
    if (!config) return null;
    return (
      <Badge className={`${config.bg} ${config.text} border ${config.border} flex items-center gap-1 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };
  // Handle approve action - open modal
  const handleApproveClick = async (appointment) => {
    setSelectedAppointment(appointment);
    await fetchAvailableSlots(appointment.id);
    setShowApproveModal(true);
  };
  // Handle confirm approve
  const handleConfirmApprove = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }
    setActionLoading(true);
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${selectedAppointment.id}/approve`, {
        slotId: selectedSlot
      });
      await fetchAppointments();
      setShowApproveModal(false);
      setSelectedAppointment(null);
      setSelectedSlot('');
      setAvailableSlots([]);
    } catch (err) {
      console.error('Failed to approve appointment:', err);
      alert('Failed to approve appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  // Handle reject
  const handleDecline = async (appointmentId) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }
    setActionLoading(true);
    try {
      // You can store the decline reason in a notes field or separate table
      // For now, we'll just reject and log the reason
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${appointmentId}/reject`);
      await fetchAppointments();
      setSelectedRequest(null);
      setDeclineReason('');
      alert('Consultation declined. The client will be notified.');
    } catch (err) {
      console.error('Failed to decline appointment:', err);
      alert('Failed to decline appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  // Handle complete
  const handleComplete = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${appointmentId}/complete`);
      await fetchAppointments();
      alert('Appointment marked as completed successfully!');
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      alert('Failed to complete appointment. Please try again.');
    }
  };
  // Handle cancel
  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${appointmentId}/cancel`);
      await fetchAppointments();
      alert('Appointment cancelled successfully!');
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Loading consultation requests...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <AlertCircle size={48} className="mb-4" />
        <p>{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const request = selectedRequestDetails;
  const availability = request?.availability_slots || [];
  const notes = request?.reason_notes || '';
  const symptoms = request ? extractSymptoms(notes) : [];
  const mockFiles = request ? getMockFiles(request.animal_name, request.animal_species) : [];

  return (
    <div className="space-y-6">
      {selectedRequestDetails ? (
        <div className="space-y-6 animate-in fade-in duration-300">
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedRequestDetails(null);
            setSelectedSlot('');
            setDeclineReason('');
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Consultation Requests</span>
        </button>

        {/* Header Title & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-800">Appointment Details</h2>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-slate-500 mt-1">Review patient information and confirm the consultation.</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Columns (Clinical Information & Actions) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Clinical Information Card */}
            <Card className="p-6 border-slate-200 shadow-sm space-y-6 bg-white">
              <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-3">
                <Stethoscope size={18} className="text-slate-400" />
                <span>Clinical Information</span>
              </div>

              {/* Patient Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Patient</p>
                  <p className="text-base font-bold text-slate-800">{request.animal_name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Species/Breed</p>
                  <p className="text-base font-bold text-slate-800 truncate">
                    {request.animal_species} {request.animal_breed ? `(${request.animal_breed})` : ''}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Age</p>
                  <p className="text-base font-bold text-slate-800">{request.animal_age || '4 Years'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Weight</p>
                  <p className="text-base font-bold text-slate-800">{request.animal_weight || '1,400 lbs'}</p>
                </div>
              </div>

              {/* Primary Reason for Visit */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Primary Reason for Visit</h4>
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-900 leading-relaxed font-medium">
                    {notes || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Reported Symptoms */}
              {symptoms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">Reported Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((symptom, i) => (
                      <Badge key={i} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-medium px-3 py-1 text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Review & Confirm Card */}
            {request.status === 'Pending' ? (
              <Card className="p-6 border-green-200 bg-green-50/20 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Review & Confirm</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Please review the case details above. Confirming this appointment will notify the client and finalize the schedule block.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Message to Client (Optional)
                  </label>
                  <Textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="E.g., Please ensure the cow is separated from the herd before our call..."
                    className="min-h-[100px] w-full border-slate-200 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={async () => {
                      if (!selectedSlot) {
                        alert('Please select a time slot from the schedule details on the right.');
                        return;
                      }
                      setActionLoading(true);
                      try {
                        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${request.id}/approve`, {
                          slotId: selectedSlot
                        });
                        await fetchAppointments();
                        setSelectedRequestDetails(null);
                        setSelectedSlot('');
                        setDeclineReason('');
                        alert('Appointment approved successfully!');
                      } catch (err) {
                        console.error('Failed to approve appointment:', err);
                        alert('Failed to approve appointment. Please try again.');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2 px-6"
                    disabled={actionLoading || !selectedSlot}
                  >
                    <CheckCircle2 size={18} />
                    Confirm Appointment
                  </Button>
                  <Button
                    onClick={async () => {
                      const reason = prompt('Please enter the reason for declining this request:');
                      if (reason === null) return;
                      if (!reason.trim()) {
                        alert('A reason is required to decline.');
                        return;
                      }
                      setActionLoading(true);
                      try {
                        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${request.id}/reject`);
                        await fetchAppointments();
                        setSelectedRequestDetails(null);
                        setSelectedSlot('');
                        setDeclineReason('');
                        alert('Request declined. Client has been notified.');
                      } catch (err) {
                        console.error('Failed to reject:', err);
                        alert('Failed to decline. Please try again.');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 px-6"
                    disabled={actionLoading}
                  >
                    <XCircle size={18} />
                    Decline
                  </Button>
                </div>
              </Card>
            ) : request.status === 'Approved' ? (
              request.consultation_type === 'chat' ? (
                /* Ready for Chat Consultation Card */
                <Card className="p-8 border-blue-200 bg-blue-50/10 shadow-sm flex flex-col items-center justify-center text-center space-y-4 bg-white relative overflow-hidden">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                    <MessageSquare size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">Ready for Chat Consultation</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                      The appointment is confirmed. The chat room is ready for your live text consultation.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowChatRoom(true);
                      setChatRoomMessages([]);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer mt-2"
                  >
                    <MessageSquare size={18} />
                    Join Chat Room
                  </Button>
                </Card>
              ) : (
                /* Ready for Video Consultation Card - matches user screenshot */
                <Card className="p-8 border-blue-200 bg-blue-50/10 shadow-sm flex flex-col items-center justify-center text-center space-y-4 bg-white relative overflow-hidden">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                    <Video size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">Ready for Consultation</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                      The appointment is confirmed. The video room will open 10 minutes before the scheduled start time.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowVideoRoom(true);
                      setChatMessages([]);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer mt-2"
                  >
                    <Video size={18} />
                    Join Video Room
                  </Button>
                </Card>
              )
            ) : (
              /* Review message for already reviewed cases */
              <Card className="p-6 border-slate-200 bg-slate-50/50 shadow-sm bg-white">
                <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-800 font-bold">Review Completed</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      This request has been reviewed. Current status is <span className="font-semibold text-slate-700">{request.status}</span>.
                    </p>
                  </div>
                </div>
                {request.status === 'Completed' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-blue-600 flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    Consultation completed successfully!
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right/Sidebar Columns (Schedule, Client, Files) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Schedule Details Card */}
            <Card className="p-6 border-slate-200 shadow-sm space-y-4 bg-white">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Details</h3>
              
              {request.status === 'Pending' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">Select one of the requested slots:</p>
                  {availability.length > 0 ? (
                    <div className="grid gap-2">
                      {availability.map((slot) => {
                        const isSelected = selectedSlot === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`w-full p-3 border rounded-lg text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-green-600 bg-green-50/50 text-green-700 font-medium'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Calendar size={16} className={isSelected ? 'text-green-600' : 'text-slate-400'} />
                              <div className="text-xs">
                                <p className="font-semibold text-slate-800">{formatDate(slot.date, slot.time)}</p>
                                <p className="text-slate-400 mt-0.5">{getTypeLabel(request.consultation_type)}</p>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No availability slots requested.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Date</p>
                      <p className="font-semibold text-slate-800">
                        {formatDateOnly(request.appointment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Time</p>
                      <p className="font-semibold text-slate-800">
                        {formatTimeOnly(request.appointment_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      {getTypeIcon(request.consultation_type)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Method</p>
                      <p className="font-semibold text-slate-800">
                        {getTypeLabel(request.consultation_type)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Client Details Card */}
            <Card className="p-6 border-slate-200 shadow-sm space-y-4 bg-white">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Details</h3>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  {request.owner_image && request.owner_image !== '/default.jpg' ? (
                    <img src={`${import.meta.env.VITE_BACKEND_URL}${request.owner_image}`} alt={request.owner_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
                  ) : (
                    <User size={20} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{request.owner_name}</h4>
                  <p className="text-xs text-slate-400 font-medium">Dairy Farmer</p>
                </div>
              </div>

              {(request.owner_email || request.owner_phone) && (
                <div className="text-xs space-y-1.5 border-t border-slate-100 pt-3 text-slate-500">
                  {request.owner_email && (
                    <p className="truncate"><span className="font-medium text-slate-400">Email:</span> {request.owner_email}</p>
                  )}
                  {request.owner_phone && (
                    <p><span className="font-medium text-slate-400">Phone:</span> {request.owner_phone}</p>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-center gap-2 bg-white"
                onClick={() => {
                  setChatInput('');
                  setShowClientChatDrawer(true);
                }}
              >
                <MessageSquare size={16} />
                Message Client
              </Button>
            </Card>

            {/* Attached Files Card */}
            <Card className="p-6 border-slate-200 shadow-sm space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Files</h3>
                <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5">
                  {mockFiles.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {mockFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <Paperclip size={16} className="text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Consultation Requests</h2>
          <p className="text-slate-500">Review and manage incoming appointment requests from clients.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1.5">
            <Clock size={14} className="mr-1" />
            {pendingRequests.length} Pending
          </Badge>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'pending' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Review ({pendingRequests.length})
          {activeTab === 'pending' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reviewed')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'reviewed' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Reviewed ({reviewedRequests.length})
          {activeTab === 'reviewed' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>
          )}
        </button>
      </div>
      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="grid gap-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => {
              return (
                <Card key={request.id} className="p-4 border-slate-200 hover:shadow-md transition-all bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        {request.animal_image && request.animal_image !== '/default.jpg' ? (
                          <img src={`${import.meta.env.VITE_BACKEND_URL}${request.animal_image}`} alt={request.animal_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
                        ) : (
                          <div className="p-2 bg-slate-100 rounded-full">{getTypeIcon(request.consultation_type)}</div>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 text-lg">{request.animal_name}</h3>
                          {getUrgencyBadge(request.reason_notes || request.reason)}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">
                          Owned by <span className="font-medium text-slate-800">{request.owner_name}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {formatSubmittedDate(request.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(request.consultation_type)}
                            {getTypeLabel(request.consultation_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Availability</p>
                        <p className="text-sm text-slate-700 font-semibold">
                          {request.availability_slots?.length || 0} slots requested
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => setSelectedRequestDetails(request)}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
                      >
                        View Details
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50 bg-white">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">All caught up!</h3>
              <p className="text-slate-500 max-w-sm">
                There are no pending consultation requests at the moment.
              </p>
            </Card>
          )}
        </div>
      )}
      {/* Reviewed Tab */}
      {activeTab === 'reviewed' && (
        <div className="grid gap-4">
          {reviewedRequests.length > 0 ? (
            reviewedRequests.map((request) => (
              <Card key={request.id} className="p-4 border-slate-200 hover:shadow-md transition-all bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                      {request.animal_image && request.animal_image !== '/default.jpg' ? (
                        <img src={`${import.meta.env.VITE_BACKEND_URL}${request.animal_image}`} alt={request.animal_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
                      ) : (
                        <div className="p-2 bg-slate-100 rounded-full">{getTypeIcon(request.consultation_type)}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-lg">{request.animal_name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Owned by <span className="font-medium text-slate-800">{request.owner_name}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        {request.appointment_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Confirmed: {formatDate(request.appointment_date, request.appointment_time)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {getTypeIcon(request.consultation_type)}
                          {getTypeLabel(request.consultation_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                    {request.status === 'Approved' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleComplete(request.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Complete
                        </Button>
                        <Button
                          onClick={() => handleCancel(request.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => setSelectedRequestDetails(request)}
                      variant="ghost" 
                      size="sm"
                      className="text-slate-600 hover:text-green-600 flex items-center gap-1"
                    >
                      Details
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50 bg-white">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No reviewed requests</h3>
              <p className="text-slate-500 max-w-sm">
                You haven't reviewed any consultation requests yet.
              </p>
            </Card>
          )}
        </div>
      )}
        </div>
      )}

      {/* Video Consultation Room Overlay */}
      {showVideoRoom && selectedRequestDetails && (
        <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col animate-in fade-in duration-300">
          
          {/* Top Bar Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                REC
              </div>
              <h3 className="font-bold text-slate-100 text-lg">
                Consultation: {selectedRequestDetails.animal_name} ({selectedRequestDetails.animal_species})
              </h3>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-base bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <Clock size={16} className="text-green-500" />
                {formatDuration(callDuration)}
              </div>
            </div>
          </div>

          {/* Main Workspace Area (Split Video Feed & Chat Sidebar) */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Left Main Screen - Video Feeds */}
            <div className="flex-1 p-6 flex flex-col justify-between relative bg-slate-900/40">
              
              {/* Remote Participant camera box (Full screen display) */}
              <div className="flex-1 rounded-2xl border border-slate-800 overflow-hidden relative bg-slate-950 flex items-center justify-center shadow-2xl">
                {/* Farmer background representation */}
                <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070&auto=format&fit=crop')` }} />
                
                {/* Live visual of animal/farmer */}
                <div className="z-10 text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-blue-600/20 text-blue-400 border-2 border-blue-500 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                    <Video size={40} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedRequestDetails.owner_name}</h4>
                    <p className="text-slate-400 text-sm mt-1">Live Feed - Patient: {selectedRequestDetails.animal_name}</p>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-slate-700/50 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <User size={12} className="text-blue-400" />
                  {selectedRequestDetails.owner_name} (Farmer)
                </div>
              </div>

              {/* Doctor Camera view (Picture-in-picture floating in corner) */}
              <div className="absolute top-10 right-10 w-48 h-32 rounded-xl border-2 border-slate-700 overflow-hidden shadow-2xl bg-slate-950 flex items-center justify-center z-10 transition-all">
                {isVideoPaused ? (
                  <div className="text-center text-slate-500 text-xs">
                    <VideoOff size={24} className="mx-auto mb-1 text-slate-600" />
                    Camera Off
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-green-600/20 text-green-400 border border-green-500 flex items-center justify-center animate-pulse">
                        <Stethoscope size={20} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-semibold text-slate-200">
                      You
                    </div>
                  </>
                )}
              </div>

              {/* Case Record Floating Panel */}
              <div className="absolute bottom-10 left-10 max-w-sm bg-slate-900/90 border border-slate-700/50 backdrop-blur p-4 rounded-xl shadow-2xl space-y-2 z-10">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient History</p>
                <h4 className="text-sm font-bold text-white">{selectedRequestDetails.animal_name} ({selectedRequestDetails.animal_species})</h4>
                <p className="text-xs text-slate-300 line-clamp-3">
                  <span className="font-semibold text-slate-400">Reason:</span> {selectedRequestDetails.reason_notes || 'Routine consultation'}
                </p>
              </div>

            </div>

            {/* Right Sidebar - Chat sidebar inside call */}
            {showChatSidebar && (
              <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    Session Chat
                  </h4>
                  <button 
                    onClick={() => setShowChatSidebar(false)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-xs">
                      No messages yet. Send a note to the farmer.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isDoc = msg.sender === 'doctor';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isDoc ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] text-slate-500 font-medium mb-1 px-1">{msg.senderName}</span>
                          <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                            isDoc
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-600 mt-1 px-1">{msg.time}</span>
                        </div>
                      );
                    })
                  )}
                  {isTyping && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs pl-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                {/* Message input */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessageInCall()}
                    placeholder="Type message..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder-slate-500"
                  />
                  <button
                    onClick={handleSendMessageInCall}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Call Controls Toolbar */}
          <div className="bg-slate-950 border-t border-slate-800 px-6 py-6 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {isScreenSharing ? (
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                  Screen Sharing Active
                </span>
              ) : (
                "Call Status: Encrypted & Private"
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-3.5 rounded-full transition-all cursor-pointer border ${
                  isVideoMuted
                    ? 'bg-red-600/20 text-red-500 border-red-500/40 hover:bg-red-600/30'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title={isVideoMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isVideoMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={() => setIsVideoPaused(!isVideoPaused)}
                className={`p-3.5 rounded-full transition-all cursor-pointer border ${
                  isVideoPaused
                    ? 'bg-red-600/20 text-red-500 border-red-500/40 hover:bg-red-600/30'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title={isVideoPaused ? 'Start Video' : 'Stop Video'}
              >
                {isVideoPaused ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3.5 rounded-full transition-all cursor-pointer border ${
                  isScreenSharing
                    ? 'bg-green-600/20 text-green-500 border-green-500/40 hover:bg-green-600/30'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title={isScreenSharing ? 'Stop Presenting' : 'Share Screen'}
              >
                <Monitor size={20} />
              </button>

              <button
                onClick={() => setShowChatSidebar(!showChatSidebar)}
                className={`p-3.5 rounded-full transition-all cursor-pointer border relative ${
                  showChatSidebar
                    ? 'bg-blue-600/20 text-blue-500 border-blue-500/40'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title="Chat Sidebar"
              >
                <MessageSquare size={20} />
                {!showChatSidebar && chatMessages.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-slate-950" />
                )}
              </button>
            </div>

            <div>
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to end this consultation call?")) {
                    setShowVideoRoom(false);
                    const markDone = window.confirm("Would you like to mark this consultation as completed?");
                    if (markDone) {
                      try {
                        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/vet-appointments/${selectedRequestDetails.id}/complete`);
                        await fetchAppointments();
                        setSelectedRequestDetails(null);
                        alert("Consultation marked as completed successfully!");
                      } catch (err) {
                        console.error("Failed to complete appointment:", err);
                      }
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold shadow-lg hover:shadow-red-900/50 hover:scale-105 transition-all cursor-pointer"
              >
                <Phone size={18} className="rotate-[135deg]" />
                End Call
              </button>
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
    </div>
  );
}