import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, FileText, 
  User, Video, Phone, MapPin, Calendar, ChevronRight,
  HourglassIcon, Stethoscope
} from 'lucide-react';
import { Button, Card, Badge, Textarea } from '../components/ui/ui';

export default function VetConsultationRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

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
  const getUrgencyBadge = () => {
    // You can add logic here to determine urgency based on reason content
    // For now, return medium by default
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        Medium Priority
      </Badge>
    );
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

  return (
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
        <div className="grid gap-6">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => {
              const availability = request.availability_slots || [];
              const notes = request.reason_notes || '';
              
              return (
                <Card key={request.id} className="p-0 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {getTypeIcon(request.consultation_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{request.animal_name}</h3>
                        <p className="text-sm text-slate-600">
                          Owned by {request.owner_name} • Submitted {formatSubmittedDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {getUrgencyBadge(request.reason)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      {/* Patient Info */}
                      <div className="md:col-span-1 space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                            Patient Details
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <span className="text-slate-500 w-24">Animal:</span>
                              <span className="text-slate-900 font-medium">{request.animal_name}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="text-slate-500 w-24">Veterinarian:</span>
                              <span className="text-slate-900 font-medium">{request.veterinarian_name}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="text-slate-500 w-24">Type:</span>
                              <span className="text-slate-900 font-medium">{getTypeLabel(request.consultation_type)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Details */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                            Requested Availability
                          </h4>
                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <p className="text-slate-800 leading-relaxed">
                              {formatAvailability(availability)}
                            </p>
                          </div>
                        </div>

                        {notes && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                              Symptoms / Notes
                            </h4>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <p className="text-slate-800 leading-relaxed">{notes}</p>
                            </div>
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
                                  className="min-h-[100px] w-full"
                                />
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleDecline(request.id)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                  disabled={actionLoading}
                                >
                                  <XCircle size={18} className="mr-2" />
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
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApproveClick(request)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 size={18} className="mr-2" />
                                Approve Consultation
                              </Button>
                              <Button
                                onClick={() => setSelectedRequest(request.id)}
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle size={18} className="mr-2" />
                                Decline Request
                              </Button>
                              <Button
                                onClick={() => navigate(`/dashboard/vet/consultations/${request.id}`)}
                                variant="ghost"
                                className="px-4"
                              >
                                <FileText size={18} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
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
              <Card key={request.id} className="p-4 border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      request.status === 'Approved' || request.status === 'Completed' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {request.status === 'Approved' || request.status === 'Completed' 
                        ? <CheckCircle2 size={20} /> 
                        : <XCircle size={20} />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{request.animal_name}</h4>
                      <p className="text-sm text-slate-500">
                        Owner: {request.owner_name} • {getTypeLabel(request.consultation_type)}
                      </p>
                      {request.appointment_date && (
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(request.appointment_date, request.appointment_time)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      <p className="text-xs text-slate-500 mt-1">
                        {formatSubmittedDate(request.updated_at || request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'Approved' && (
                        <>
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
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/dashboard/vet/consultations/${request.id}`)}
                      >
                        <ChevronRight size={20} />
                      </Button>
                    </div>
                  </div>
                </div>
                {request.status === 'Rejected' && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Declined:</span> Appointment request was not approved.
                    </p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
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

      {/* Approve Modal */}
      {showApproveModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Approve Consultation
            </h3>
            <p className="text-slate-600 mb-4">
              Select a time slot for {selectedAppointment.animal_name}'s consultation:
            </p>
            
            <div className="space-y-3 mb-6">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                      selectedSlot === slot.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-slate-400" />
                      <span className="font-medium">
                        {formatDate(slot.slot_date, slot.slot_time)}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500">
                  No available slots found for this appointment.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmApprove}
                disabled={!selectedSlot || actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </Button>
              <Button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedAppointment(null);
                  setSelectedSlot('');
                  setAvailableSlots([]);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}