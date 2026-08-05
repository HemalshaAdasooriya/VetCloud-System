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

export default function VetConsultationRequests() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  
  // eslint-disable-next-line no-unused-vars
  const [successMessage, setSuccessMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [selectedSlotId, setSelectedSlotId] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  
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

  const [vetScheduleSlots, setVetScheduleSlots] = useState([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [completingAptId, setCompletingAptId] = useState(null);
  
  // Helper to normalize file upload URLs
  const getFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${backendUrl}${cleanPath}`;
  };

  // Helper function to format medical history notes cleanly
  const formatNotesContent = (notesStr) => {
    if (!notesStr) return "No notes available.";
    let str = String(notesStr).trim();
    if (str.includes('{') && str.includes('}')) {
      try {
        const jsonStart = str.indexOf('{');
        const jsonEnd = str.lastIndexOf('}');
        const jsonSub = str.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonSub);
        const cleanReason = parsed.notes || parsed.symptoms || parsed.reason || "";
        const prefix = str.substring(0, jsonStart).replace(/\|\s*Notes:\s*$/, '').replace(/Notes:\s*$/, '').trim();
        if (cleanReason) {
          return prefix ? `${prefix} • Reason: ${cleanReason}` : cleanReason;
        } else {
          return prefix || "Veterinary Consultation Session";
        }
      } catch {
        // Fallback
      }
    }
    return str;
  };

  const [viewingHistoryModal, setViewingHistoryModal] = useState(false);
  const [selectedAnimalHistory, setSelectedAnimalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleOpenPatientHistory = async (animalId) => {
    if (!animalId) return;
    setViewingHistoryModal(true);
    setLoadingHistory(true);
    setSelectedAnimalHistory([]);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`${API_BASE}/api/animals/${animalId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedAnimalHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch animal history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // State for data from backend
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewedRequests, setReviewedRequests] = useState([]);

  // Helper to select a request and auto-select its first slot
  const handleSelectRequest = (request) => {
    setSelectedRequestDetails(request);
    if (request && request.slots && request.slots.length > 0) {
      setSelectedSlot(request.slots[0].id);
    } else {
      setSelectedSlot('');
    }
  };

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch vet's schedule slots as fallbacks if request has no slots
  useEffect(() => {
    if (selectedRequestDetails && (!selectedRequestDetails.slots || selectedRequestDetails.slots.length === 0)) {
      const vetIdVal = getVetId();
      if (vetIdVal) {
        axios.get(`${API_BASE}/api/schedule/vet/${vetIdVal}`)
          .then(res => {
            const openSlots = res.data.filter(slot => slot.status === 'Available' || !slot.is_booked);
            setVetScheduleSlots(openSlots);
            if (openSlots.length > 0) {
              setSelectedSlot(openSlots[0].id);
            }
          })
          .catch(err => console.error("Failed to fetch vet schedule slots:", err));
      }
    }
  }, [selectedRequestDetails]);

  // Get vet ID from localStorage with fallback
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

  // Pre-select a request if navigated with a specific requestId state
  useEffect(() => {
    if (location.state?.requestId && pendingRequests.length > 0) {
      const matched = pendingRequests.find(r => r.id === location.state.requestId);
      if (matched) {
        handleSelectRequest(matched);
      }
    }
  }, [location.state, pendingRequests]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const vetId = getVetId();
      if (!vetId) {
        throw new Error('Veterinarian ID not found. Please login again.');
      }

      // Fetch all appointments for this vet
      const response = await axios.get(`${API_BASE}/api/vet-appointments/vet/${vetId}`);
      const appointments = response.data || [];

      console.log('📊 Appointments from API:', appointments);

      // Separate pending and reviewed appointments
      const pending = appointments.filter(app => 
        app.status === 'Pending' || app.status === 'pending'
      );
      
      const reviewed = appointments.filter(app => 
        app.status === 'Approved' || app.status === 'approved' ||
        app.status === 'Rejected' || app.status === 'rejected' ||
        app.status === 'Completed' || app.status === 'completed'
      );

      // For each pending appointment, fetch its slots
      const pendingWithSlots = await Promise.all(
        pending.map(async (app) => {
          try {
            const slotsResponse = await axios.get(
              `${API_BASE}/api/vet-appointments/${app.id}/slots`
            );
            return { ...app, all_slots: slotsResponse.data || [] };
          } catch (slotErr) {
            console.error(`Failed to fetch slots for appointment ${app.id}:`, slotErr);
            return { ...app, all_slots: [] };
          }
        })
      );

      // Transform data to match component format
      const formattedPending = pendingWithSlots.map(app => formatAppointmentData(app));
      const formattedReviewed = reviewed.map(app => formatReviewedData(app));

      setPendingRequests(formattedPending);
      setReviewedRequests(formattedReviewed);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load consultation requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format appointment data for pending requests
  const formatAppointmentData = (app) => {
    // Parse reason field to extract notes
    let notes = app.reason_notes || app.reason || '';
    
    if (typeof app.reason === 'string' && !app.reason_notes) {
      try {
        const parsed = JSON.parse(app.reason);
        notes = parsed.notes || '';
      } catch {
        notes = app.reason;
      }
    }

    // Get slots from the database
    const slots = app.all_slots || [];
    
    // Get first slot for display
    const firstSlot = slots.length > 0 ? slots[0] : null;
    const displayDate = firstSlot ? formatDate(firstSlot.slot_date || firstSlot.date) : 'Date pending';
    const displayTime = firstSlot ? formatTime(firstSlot.slot_time || firstSlot.time) : 'Time pending';

    return {
      id: app.id,
      patientName: app.animal_name || 'Unknown Animal',
      ownerName: app.owner_name || 'Unknown Owner',
      ownerType: 'Pet Owner',
      date: displayDate,
      time: displayTime,
      type: app.consultation_type === 'video' ? 'Video Call' : 
            app.consultation_type === 'chat' ? 'Chat / Messages' : 'Clinic Visit',
      symptoms: notes || 'No symptoms provided',
      urgency: 'medium',
      image: app.animal_image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
      requestedAt: app.created_at ? timeAgo(app.created_at) : 'Recently',
      ownerContact: app.owner_contact || '',
      animalAge: app.animal_age || 'N/A',
      animalBreed: app.animal_breed || 'Unknown',
      animalSpecies: app.animal_species || 'Unknown Species',
      animalWeight: app.animal_weight || 'Unknown Weight',
      animalStatus: app.animal_status || 'Healthy',
      healthReport: app.animal_health_report || app.health_report || null,
      animalId: app.animal_id,
      slots: slots.map(slot => ({
        id: slot.id,
        date: slot.slot_date || slot.date,
        time: slot.slot_time || slot.time,
        is_selected: slot.is_selected || 0
      })),
      status: app.status || 'Pending',
      originalData: app
    };
  };

  // Format data for reviewed requests
  const formatReviewedData = (app) => {
    return {
      id: app.id,
      patientName: app.animal_name || 'Unknown Animal',
      ownerName: app.owner_name || 'Unknown Owner',
      type: app.consultation_type === 'video' ? 'Video Call' : 'Clinic Visit',
      status: app.status === 'Approved' ? 'approved' : 
              app.status === 'Rejected' ? 'declined' : 
              app.status === 'Completed' ? 'completed' : 'pending',
      reviewedAt: app.updated_at ? timeAgo(app.updated_at) : 'Recently',
      reason: app.rejection_reason || '',
      originalData: app
    };
  };

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
  */

  // Helper for duration strings (unused)
  /*
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  */

  // Helper: Time ago
  const timeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  // Format submitted date
  const formatSubmittedDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // Handle approve (unused)
  /*
  const handleApprove = async (requestId) => {
    const slotId = selectedSlotId[requestId];
    if (!slotId) {
      alert('Please select a time slot for this appointment.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      await axios.patch(`http://localhost:5000/api/vet-appointments/${requestId}/approve`, {
        slotId: slotId
      });
      
      setSuccessMessage('Consultation approved successfully! The client will be notified.');
      
      // Clear the selected slot for this appointment
      setSelectedSlotId(prev => ({
        ...prev,
        [requestId]: null
      }));
      
      // Refresh appointments after 2 seconds
      setTimeout(() => {
        fetchAppointments();
      }, 2000);
    } catch (err) {
      console.error('Error approving appointment:', err);
      setError('Failed to approve consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  */  // Get urgency badge based on symptoms or reason
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

  // Handle decline (unused)
  /*
  const handleDecline = async (requestId) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${requestId}/reject`, {
        reason: declineReason
      });
      
      setSuccessMessage('Consultation declined. The client will be notified with your feedback.');
      setSelectedRequest(null);
      setDeclineReason('');
      
      // Refresh appointments after 2 seconds
      setTimeout(() => {
        fetchAppointments();
      }, 2000);
    } catch (err) {
      console.error('Error declining appointment:', err);
      setError('Failed to decline consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  */

  // Handle complete
  const handleCompleteClick = (appointmentId) => {
    setCompletingAptId(appointmentId);
    setPrescriptionText("");
    setShowPrescriptionModal(true);
  };

  const handleCompleteSubmit = async (withPrescription = true) => {
    if (withPrescription && !prescriptionText.trim()) {
      alert("Please enter prescription/treatment details.");
      return;
    }

    setActionLoading(true);
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${completingAptId}/complete`, {
        prescription: withPrescription ? prescriptionText : ""
      });
      await fetchAppointments();
      alert('Appointment completed successfully!');
      setShowPrescriptionModal(false);
      setCompletingAptId(null);
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      alert('Failed to complete appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setActionLoading(true);
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${appointmentId}/cancel`);
      await fetchAppointments();
      alert('Appointment cancelled successfully!');
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  // Get type icon
  const getTypeIcon = (type) => {
    switch(type) {
      case 'Video Call':
        return <Video size={16} className="text-blue-500" />;
      case 'Clinic Visit':
        return <MapPin size={16} className="text-green-500" />;
      case 'Phone Call':
        return <Phone size={16} className="text-purple-500" />;
      case 'Chat / Messages':
        return <MessageCircle size={16} className="text-indigo-500" />;
      default:
        return <User size={16} />;
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
    const normalizedKey = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending';
    const config = statusConfig[normalizedKey];
    if (!config) return null;
    return (
      <Badge className={`${config.bg} ${config.text} border ${config.border} flex items-center gap-1 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
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

  // Loading state
  if (loading && pendingRequests.length === 0 && reviewedRequests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading consultation requests...</p>
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
  const availability = request?.slots || [];
  const notes = request?.symptoms || request?.originalData?.reason_notes || request?.originalData?.reason || '';
  const symptoms = request ? extractSymptoms(notes) : [];

  return (
    <div className="space-y-6">
      {selectedRequestDetails ? (
        <div className="space-y-6 animate-in fade-in duration-300">
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedRequestDetails(null);
            setSelectedSlot('');
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
              <h2 className="text-3xl font-bold text-slate-800">
                Request for {request.animal_name || 'Patient'}
              </h2>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-slate-500 mt-1">
              Submitted by <span className="font-semibold text-slate-700">{request.ownerName || request.originalData?.owner_name || 'Client'}</span> &bull; Review details and manage schedule.
            </p>
          </div>

          {/* Accept / Reject actions in the header */}
          {request.status?.toLowerCase() === 'pending' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  if (!selectedSlot) {
                    alert('Please select a time slot from the schedule details on the right.');
                    return;
                  }
                  setActionLoading(true);
                  try {
                    await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${request.id}/approve`, {
                      slotId: selectedSlot
                    });
                    await fetchAppointments();
                    setSelectedRequestDetails(prev => ({
                      ...prev,
                      status: 'Approved',
                      appointment_date: prev.slots?.find(s => s.id === selectedSlot)?.date || prev.appointment_date,
                      appointment_time: prev.slots?.find(s => s.id === selectedSlot)?.time || prev.appointment_time
                    }));
                    alert('Appointment approved successfully!');
                  } catch (err) {
                    console.error('Failed to approve appointment:', err);
                    alert('Failed to approve appointment. Please try again.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
                disabled={actionLoading || !selectedSlot}
              >
                <CheckCircle2 size={18} />
                Accept Request
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
                    await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/vet-appointments/${request.id}/reject`, { reason });
                    await fetchAppointments();
                    setSelectedRequestDetails(prev => ({
                      ...prev,
                      status: 'Rejected'
                    }));
                    alert('Request declined. Client has been notified.');
                  } catch (err) {
                    console.error('Failed to reject:', err);
                    alert('Failed to decline. Please try again.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 px-6 py-2.5 rounded-xl cursor-pointer"
                disabled={actionLoading}
              >
                <XCircle size={18} />
                Reject
              </Button>
            </div>
          )}
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
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Species</p>
                  <p className="text-base font-bold text-slate-800 capitalize">{request.animalSpecies || request.originalData?.animal_species || 'Cattle'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Breed</p>
                  <p className="text-base font-bold text-slate-800">{request.animalBreed || request.originalData?.animal_breed || 'Unknown'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Age</p>
                  <p className="text-base font-bold text-slate-800">{request.animalAge || request.originalData?.animal_age || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Weight</p>
                  <p className="text-base font-bold text-slate-800">{request.animalWeight || request.originalData?.animal_weight || 'N/A'}</p>
                </div>
              </div>

              {/* Health Report / Vaccination Card Section */}
              {(request.healthReport || request.originalData?.animal_health_report || request.originalData?.health_report) && (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Health Report / Vaccination Card</h4>
                      <p className="text-xs text-slate-500 font-medium">Uploaded record for patient {request.patientName}</p>
                    </div>
                  </div>
                  <a
                    href={getFileUrl(request.healthReport || request.originalData?.animal_health_report || request.originalData?.health_report)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
                  >
                    <FileText size={14} />
                    View Health Report / Card
                  </a>
                </div>
              )}

              {/* Patient Medical History Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Patient Clinical History Management</span>
                <button
                  type="button"
                  onClick={() => handleOpenPatientHistory(request.animalId || request.originalData?.animal_id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <FileText size={16} />
                  View Patient Medical History
                </button>
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

            {request.status?.toLowerCase() === 'approved' ? (
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
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer mt-2"
                  >
                    <MessageSquare size={18} />
                    Join Chat Room
                  </Button>
                </Card>
              ) : (
                /* Ready for Video Consultation Card */
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
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer mt-2"
                  >
                    <Video size={18} />
                    Join Video Room
                  </Button>
                </Card>
              )
            ) : request.status?.toLowerCase() !== 'pending' ? (
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
            ) : null}
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
                  ) : vetScheduleSlots.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mb-2">
                        No client-selected slots. Please assign one of your available schedule slots:
                      </p>
                      <div className="grid gap-2">
                        {vetScheduleSlots.map((slot) => {
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
                                  <p className="font-semibold text-slate-800">{formatDate(slot.slot_date || slot.date, slot.slot_time || slot.time)}</p>
                                  <p className="text-slate-400 mt-0.5">Your Schedule Slot</p>
                                </div>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No availability slots requested. Please configure your availability in the Schedule tab to assign slots.
                    </p>
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
                  {request.originalData?.owner_image && request.originalData?.owner_image !== '/default.jpg' ? (
                    <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${request.originalData?.owner_image}`} alt={request.originalData?.owner_name || request.ownerName} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
                  ) : (
                    <User size={20} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{request.originalData?.owner_name || request.ownerName}</h4>
                  <p className="text-xs text-slate-400 font-medium">Dairy Farmer</p>
                </div>
              </div>

              {(request.originalData?.owner_email || request.originalData?.owner_phone) && (
                <div className="text-xs space-y-1.5 border-t border-slate-100 pt-3 text-slate-500">
                  {request.originalData?.owner_email && (
                    <p className="truncate"><span className="font-medium text-slate-400">Email:</span> {request.originalData?.owner_email}</p>
                  )}
                  {request.originalData?.owner_phone && (
                    <p><span className="font-medium text-slate-400">Phone:</span> {request.originalData?.owner_phone}</p>
                  )}
                </div>
              )}

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

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

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
          Recently Reviewed ({reviewedRequests.length})
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
                        {request.originalData?.animal_image && request.originalData?.animal_image !== '/default.jpg' ? (
                          <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${request.originalData?.animal_image}`} alt={request.originalData?.animal_name || request.patientName} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
                        ) : (
                          <div className="p-2 bg-slate-100 rounded-full">{getTypeIcon(request.originalData?.consultation_type)}</div>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 text-lg">{request.originalData?.animal_name || request.patientName}</h3>
                          {getUrgencyBadge(request.originalData?.reason_notes || request.originalData?.reason || request.symptoms)}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">
                          Owned by <span className="font-medium text-slate-800">{request.originalData?.owner_name || request.ownerName}</span>
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
                          {request.slots?.length || 0} slots requested
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => handleSelectRequest(request)}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 cursor-pointer"
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
              <h3 className="text-lg font-medium text-slate-900 mb-1">All caught up! 🎉</h3>
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
                      {request.originalData?.animal_image && request.originalData?.animal_image !== '/default.jpg' ? (
                        <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${request.originalData?.animal_image}`} alt={request.originalData?.animal_name || request.patientName} className="w-full h-full object-cover" onError={(e) => { e.target.src = ''; }} />
                      ) : (
                        <div className="p-2 bg-slate-100 rounded-full">{getTypeIcon(request.originalData?.consultation_type)}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-lg">{request.originalData?.animal_name || request.patientName}</h3>
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
                          onClick={() => handleCompleteClick(request.id)}
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
                      onClick={() => handleSelectRequest(request)}
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
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <Clock size={24} />
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
                    setCompletingAptId(selectedRequestDetails.id);
                    setPrescriptionText("");
                    setShowPrescriptionModal(true);
                    setSelectedRequestDetails(null);
                  } else {
                    setSelectedRequestDetails(null);
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

      {/* Complete Consultation & Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
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
                  className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-slate-700 mt-1 animate-none bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => handleCompleteSubmit(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-10 cursor-pointer"
                >
                  Complete & Send Prescription
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-600 font-medium h-10 cursor-pointer bg-white"
                    onClick={() => setShowPrescriptionModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-slate-500 hover:bg-slate-50 font-medium h-10 cursor-pointer"
                    onClick={() => handleCompleteSubmit(false)}
                  >
                    Complete without Prescription
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* PATIENT MEDICAL HISTORY MODAL */}
      {viewingHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={20} />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Patient Medical Record History</h3>
                  <p className="text-xs text-slate-400">Clinical timeline and past consultations for patient animal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryModal(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <p className="text-xs text-slate-400 font-medium">Retrieving patient clinical records...</p>
                </div>
              ) : selectedAnimalHistory && selectedAnimalHistory.length > 0 ? (
                <div className="relative pl-6 border-l border-slate-200 space-y-6 ml-2 py-2">
                  {selectedAnimalHistory.map((record, index) => (
                    <div key={index} className="relative space-y-1.5">
                      <span className="absolute -left-[31px] top-0.5 bg-white border-2 border-blue-500 rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-xs">
                        <span className="h-2 w-2 bg-blue-500 rounded-full" />
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                        <span className="font-bold text-slate-400">{record.date}</span>
                        <Badge className="bg-slate-100 text-slate-700 font-bold border-slate-200 text-[10px]">
                          {record.type}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{record.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                        {formatNotesContent(record.notes)}
                      </p>
                      <div className="text-[11px] text-slate-400 font-medium pt-1">
                        Attending Veterinarian: <span className="font-semibold text-slate-600">{record.vet}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-2">
                  <FileText size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No Medical History Found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">This animal patient has no recorded clinical history or prior consultation sessions in the database yet.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <Button type="button" onClick={() => setViewingHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}