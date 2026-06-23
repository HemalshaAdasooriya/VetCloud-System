import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Video, Calendar as CalendarIcon, Clock, CheckCircle2,
  MoreVertical, FileText, AlertCircle, XCircle, HourglassIcon
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui/ui';

const TAB_STYLES = {
  pending: { text: 'text-amber-600', underline: 'bg-amber-600' },
  upcoming: { text: 'text-green-600', underline: 'bg-green-600' },
  past: { text: 'text-slate-600', underline: 'bg-slate-600' }
};

export default function ConsultationPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    const ownerId = localStorage.getItem('userId');
    if (!ownerId) {
      setError('Please sign in to view your consultations.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/owner/${ownerId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const confirmCancelAppointment = async (appointmentId) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      const animalName = appointment?.animal_name || 'your animal';
      const vetName = appointment?.veterinarian_name || 'the veterinarian';

      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${appointmentId}/cancel`);
      toast.success("Consultation request cancelled successfully.");
      setCancelModalId(null);

      // Save notification to local storage
      const userId = localStorage.getItem('userId') || 'guest';
      const storageKey = `vetcloud_notifications_${userId}`;
      const existingNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newNotification = {
        id: Date.now().toString(),
        title: "Consultation Request Cancelled",
        message: `You cancelled the consultation request for ${animalName} with ${vetName}.`,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      existingNotifications.unshift(newNotification);
      localStorage.setItem(storageKey, JSON.stringify(existingNotifications));

      // Trigger reactive bell update
      window.dispatchEvent(new Event("notificationsUpdated"));

      fetchAppointments();
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      toast.error("Failed to cancel the appointment. Please try again.");
    }
  };

  const handleCancelAppointment = (appointmentId) => {
    setCancelModalId(appointmentId);
  };

  // Filter appointments by status
  const pendingConsultations = appointments.filter(a => a.status === 'Pending');
  const upcomingConsultations = appointments.filter(a => a.status === 'Approved');
  const pastConsultations = appointments.filter(a =>
    a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'Rejected'
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

  // Format availability slots - uses new field names
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

  // Get status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <HourglassIcon size={14} />,
        label: 'Pending Approval'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Loading consultations...
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
          <h2 className="text-2xl font-bold text-slate-800">Consultations</h2>
          <p className="text-slate-500">Manage your upcoming and past veterinary appointments.</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/user/appoinment')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CalendarIcon className="w-5 h-5 mr-2" />
          Book New Consultation
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 overflow-x-auto">
        {[
          { key: 'pending', label: `Pending (${pendingConsultations.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingConsultations.length})` },
          { key: 'past', label: `Past (${pastConsultations.length})` },
        ].map(({ key, label }) => {
          const styles = TAB_STYLES[key];
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === key ? styles.text : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              {activeTab === key && (
                <span className={`absolute bottom-0 left-0 w-full h-0.5 ${styles.underline} rounded-t-full`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="grid gap-4">
          {pendingConsultations.length > 0 ? (
            pendingConsultations.map((consult) => {
              // Use the new fields from backend
              const availability = consult.availability_slots || [];
              const notes = consult.reason_notes || '';
              
              return (
                <Card key={consult.id} className="p-6 border-amber-200 bg-amber-50/30 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xl border-2 border-amber-200 flex-shrink-0">
                        {consult.animal_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{consult.animal_name}</h3>
                            <p className="text-slate-500 text-sm">with {consult.veterinarian_name}</p>
                          </div>
                          {getStatusBadge(consult.status)}
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-2">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
                              Requested Slots
                            </p>
                            <p className="text-sm text-slate-700">{formatAvailability(availability)}</p>
                          </div>
                          {notes && (
                            <div className="pt-2 border-t border-amber-100">
                              <p className="text-xs text-slate-500 mb-1">Symptoms / Notes:</p>
                              <p className="text-sm text-slate-700">{notes}</p>
                            </div>
                          )}
                          <p className="text-xs text-slate-400">
                            Submitted on {formatSubmittedDate(consult.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between md:border-l md:border-amber-100 md:pl-6">
                      <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-200 mb-4">
                        <div className="flex items-center gap-2 text-amber-700 mb-1">
                          <AlertCircle size={16} />
                          <span className="font-semibold text-sm">Awaiting Doctor Approval</span>
                        </div>
                        <p className="text-xs text-amber-600">
                          The veterinarian will review and confirm your appointment soon.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => navigate('/dashboard/user/appoinment', {
                            state: { resubmitAppointmentId: consult.id }
                          })}
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 w-full"
                        >
                          <FileText size={18} className="mr-2" />
                          Edit Request
                        </Button>
                        <Button
                          onClick={() => handleCancelAppointment(consult.id)}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 w-full"
                        >
                          <XCircle size={18} className="mr-2" />
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <HourglassIcon size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No pending requests</h3>
              <p className="text-slate-500 max-w-sm">You don't have any consultation requests awaiting approval.</p>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Tab */}
      {activeTab === 'upcoming' && (
        <div className="grid gap-4">
          {upcomingConsultations.length > 0 ? (
            upcomingConsultations.map((consult) => {
              // Use appointment_date and appointment_time from backend
              const hasSlot = consult.appointment_date && consult.appointment_time;
              
              return (
                <Card key={consult.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl border border-green-200 flex-shrink-0">
                        {consult.animal_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{consult.animal_name}</h3>
                            <p className="text-slate-500 text-sm">with {consult.veterinarian_name}</p>
                          </div>
                          {getStatusBadge(consult.status)}
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="flex items-center text-slate-700 mb-2">
                            <Clock size={16} className="mr-2 text-green-600 flex-shrink-0" />
                            <span className="font-medium">
                              {hasSlot 
                                ? formatDate(consult.appointment_date, consult.appointment_time)
                                : 'Awaiting slot confirmation'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-green-700 bg-white px-3 py-2 rounded border border-green-200">
                            <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
                            <span>Confirmed by {consult.veterinarian_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end md:border-l md:border-slate-100 md:pl-6">
                      <div className="flex items-center gap-3 relative">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!hasSlot}
                        >
                          <Video size={18} className="mr-2" />
                          Join Call
                        </Button>
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="px-2 text-slate-400 cursor-pointer"
                            onClick={() => setActiveMenuId(activeMenuId === consult.id ? null : consult.id)}
                          >
                            <MoreVertical size={20} />
                          </Button>
                          
                          {activeMenuId === consult.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button 
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleCancelAppointment(consult.id);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <XCircle size={15} className="text-red-500" />
                                  Cancel Consultation
                                </button>
                              </div>
                            </>
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
                <CalendarIcon size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No upcoming appointments</h3>
              <p className="text-slate-500 max-w-sm">You have no approved appointments yet.</p>
            </Card>
          )}
        </div>
      )}

      {/* Past Tab */}
      {activeTab === 'past' && (
        <div className="grid gap-4">
          {pastConsultations.length > 0 ? (
            pastConsultations.map((consult) => {
              const hasSlot = consult.appointment_date && consult.appointment_time;
              
              return (
                <Card key={consult.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl border border-slate-200 flex-shrink-0">
                        {consult.animal_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{consult.animal_name}</h3>
                            <p className="text-slate-500 text-sm">with {consult.veterinarian_name}</p>
                          </div>
                          {getStatusBadge(consult.status)}
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center text-slate-600">
                            <Clock size={16} className="mr-2 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">
                              {hasSlot 
                                ? formatDate(consult.appointment_date, consult.appointment_time)
                                : 'No date set'}
                            </span>
                          </div>
                          {consult.status === 'Completed' && (
                            <div className="mt-2 flex items-center text-sm text-blue-600">
                              <CheckCircle2 size={14} className="mr-1" />
                              <span>Completed on {formatSubmittedDate(consult.updated_at || consult.created_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end md:border-l md:border-slate-100 md:pl-6">
                      <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                        <FileText size={18} className="mr-2" />
                        View Report
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No past consultations</h3>
              <p className="text-slate-500 max-w-sm">
                Your consultation history will appear here once you've completed an appointment.
              </p>
            </Card>
          )}
        </div>
      )}

      {cancelModalId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cancel Consultation</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Are you sure you want to cancel this consultation request? This action cannot be undone.
                </p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setCancelModalId(null)}
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  No, Keep it
                </Button>
                <Button
                  onClick={() => confirmCancelAppointment(cancelModalId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  Yes, Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}