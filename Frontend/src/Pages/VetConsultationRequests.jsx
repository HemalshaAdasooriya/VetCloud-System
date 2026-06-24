import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, FileText, 
  User, Video, Phone, MapPin, Calendar, ChevronRight, 
  Loader2, MessageCircle
} from 'lucide-react';
import { Button, Card, Badge, Textarea } from '../components/ui/ui';

export default function VetConsultationRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState({});
  
  // State for data from backend
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewedRequests, setReviewedRequests] = useState([]);

  // Get vet ID from localStorage
  const getVetId = () => {
    return localStorage.getItem('userId');
  };

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const vetId = getVetId();
      if (!vetId) {
        throw new Error('Veterinarian ID not found. Please login again.');
      }

      // Fetch all appointments for this vet
      const response = await axios.get(`http://localhost:5000/api/vet-appointments/vet/${vetId}`);
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
              `http://localhost:5000/api/vet-appointments/${app.id}/slots`
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
      animalId: app.animal_id,
      slots: slots.map(slot => ({
        id: slot.id,
        date: slot.slot_date || slot.date,
        time: slot.slot_time || slot.time,
        is_selected: slot.is_selected || 0
      })),
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
      reason: app.rejection_reason || ''
    };
  };

  // Helper: Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date pending';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
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

  // Handle approve
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
  };

  // Handle decline
  const handleDecline = async (requestId) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      await axios.patch(`http://localhost:5000/api/vet-appointments/${requestId}/reject`, {
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          {/* <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : '🔄 Refresh'}
          </Button> */}
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
        <div className="grid gap-6">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="p-0 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {getTypeIcon(request.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{request.patientName}</h3>
                    <p className="text-sm text-slate-600">Owned by {request.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{request.requestedAt}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Animal Image and Details */}
                  <div className="md:col-span-1">
                    <img 
                      src={request.image} 
                      alt={request.patientName} 
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 mb-4"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 w-20">Breed:</span>
                        <span className="text-slate-900 font-medium">{request.animalBreed}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 w-20">Age:</span>
                        <span className="text-slate-900 font-medium">{request.animalAge}</span>
                      </div>
                      {request.ownerContact && (
                        <div className="flex items-center text-sm">
                          <span className="text-slate-500 w-20">Contact:</span>
                          <span className="text-slate-900 font-medium">{request.ownerContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Consultation Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Requested Appointment
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-slate-400" />
                          <span className="font-medium text-slate-900">{request.date} at {request.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getTypeIcon(request.type)}
                          <span className="text-slate-700">{request.type}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Reported Symptoms / Reason
                      </h4>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-slate-800 leading-relaxed">{request.symptoms}</p>
                      </div>
                    </div>

                    {/* Available Slots Selection */}
                    {request.slots && request.slots.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                          Available Time Slots (Select One to Approve)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {request.slots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedSlotId(prev => ({
                                ...prev,
                                [request.id]: slot.id  // Track slot per appointment
                              }))}
                              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                                selectedSlotId[request.id] === slot.id  // Check per appointment
                                  ? 'bg-green-600 border-green-600 text-white'
                                  : 'border-slate-200 text-slate-700 hover:border-green-300 hover:bg-slate-50'
                              }`}
                            >
                              {formatDate(slot.date)} {formatTime(slot.time)}
                            </button>
                          ))}
                        </div>
                        {selectedSlotId[request.id] && (
                          <p className="text-xs text-green-600 mt-2">
                            Slot selected for approval
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700">
                          ⚠️ No available time slots found for this appointment. The client needs to resubmit with available slots.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-200">
                      {selectedRequest === request.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Reason for Declining (will be sent to client)
                            </label>
                            <Textarea
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              placeholder="e.g., Requested time slot is unavailable. Please book another slot or contact us for alternative times."
                              className="min-h-[100px]"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleDecline(request.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              disabled={loading}
                            >
                              {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <XCircle size={18} className="mr-2" />}
                              Confirm Decline
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedRequest(null);
                                setDeclineReason('');
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 flex-wrap">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={loading || !selectedSlotId[request.id] || !request.slots || request.slots.length === 0}
                          >
                            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                            {selectedSlotId[request.id] ? 'Approve Consultation' : 'Select a Slot First'}
                          </Button>
                          <Button
                            onClick={() => setSelectedRequest(request.id)}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle size={18} className="mr-2" />
                            Decline Request
                          </Button>
                          {/* <Button
                            onClick={() => navigate(`/dashboard/doctor/consultations/${request.id}`)}
                            variant="ghost"
                            className="px-4"
                          >
                            <FileText size={18} />
                          </Button> */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {pendingRequests.length === 0 && (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
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
          {reviewedRequests.map((request) => (
            <Card key={request.id} className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    request.status === 'approved' ? 'bg-green-100 text-green-600' : 
                    request.status === 'declined' ? 'bg-red-100 text-red-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {request.status === 'approved' ? <CheckCircle2 size={20} /> : 
                     request.status === 'declined' ? <XCircle size={20} /> : 
                     <Clock size={20} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{request.patientName}</h4>
                    <p className="text-sm text-slate-500">Owner: {request.ownerName} • {request.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={request.status === 'approved' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : request.status === 'declined'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                    }>
                      {request.status === 'approved' ? 'Approved' : 
                       request.status === 'declined' ? 'Declined' : 'Completed'}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{request.reviewedAt}</p>
                  </div>
                  {/* <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/dashboard/doctor/consultations/${request.id}`)}
                  >
                    <ChevronRight size={20} />
                  </Button> */}
                </div>
              </div>
              {request.status === 'declined' && request.reason && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                </div>
              )}
            </Card>
          ))}

          {reviewedRequests.length === 0 && (
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
  );
}