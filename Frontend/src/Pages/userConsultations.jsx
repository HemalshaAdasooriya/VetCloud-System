import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Video, Calendar as CalendarIcon, Clock, CheckCircle2,
  MoreVertical, FileText, AlertCircle, XCircle, HourglassIcon, CreditCard, ShieldAlert,
  Star, MessageSquare
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui/ui';
import JitsiVideoCall from '../components/consultation/JitsiVideoCall';
import FarmerChatRoom from '../components/consultation/FarmerChatRoom';

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
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackConsultation, setFeedbackConsultation] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  // Prescription Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportConsultation, setSelectedReportConsultation] = useState(null);
  const [emailing, setEmailing] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Payment Gateway States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [processingStripe, setProcessingStripe] = useState(false);

  const handleInitiatePayment = async (appointment) => {
    setPaymentAppointment(appointment);
    setShowPaymentModal(true);
    setPaymentLoading(true);
    setPaymentBreakdown(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payments/info`, {
        appointmentId: appointment.id
      });
      setPaymentBreakdown(res.data);
    } catch (err) {
      console.error("Failed to generate payment details:", err);
      toast.error("Failed to load payment details. Please try again.");
      setShowPaymentModal(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleConfirmStripe = async (e) => {
    if (e) e.preventDefault();
    if (!paymentAppointment) return;

    setProcessingStripe(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payments/create-checkout-session`, {
        appointmentId: paymentAppointment.id
      });
      if (res.data && res.data.url) {
        toast.loading("Redirecting to secure Stripe Checkout...");
        window.location.href = res.data.url;
      } else {
        throw new Error("Invalid session response");
      }
    } catch (err) {
      console.error("Stripe session error:", err);
      toast.error("Failed to initiate Stripe payment checkout.");
      setProcessingStripe(false);
    }
  };

  const handleSimulateTestPayment = async () => {
    setPaymentLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payments/test-payment`, {
        appointmentId: paymentAppointment.id
      });
      toast.success("Simulated Sandbox/Test payment successful!");
      setShowPaymentModal(false);
      fetchAppointments();
      
      // Auto-open chat room if it's a chat consultation
      if (paymentAppointment && paymentAppointment.consultation_type === 'chat') {
        setSelectedRequestDetails(paymentAppointment);
        setShowChatRoom(true);
      }
    } catch (err) {
      console.error("Test payment error:", err);
      toast.error("Failed to process simulated payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const getFarmerName = () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return u.fullName || 'Farmer';
      }
    } catch (e) {
      console.error(e);
    }
    return 'Farmer';
  };

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

  useEffect(() => {
    const success = searchParams.get('payment_success');
    const cancel = searchParams.get('payment_cancel');
    const sessionId = searchParams.get('session_id');
    const appointmentId = searchParams.get('appointment_id');

    if (success === 'true' && sessionId && appointmentId) {
      const verifyStripePayment = async () => {
        setVerifyingPayment(true);
        const loadingToast = toast.loading("Verifying your Stripe payment...");
        try {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payments/verify-session`, {
            sessionId,
            appointmentId
          });
          toast.success("Payment completed via Stripe!", { id: loadingToast });
          
          // Fetch updated appointments list
          const ownerId = localStorage.getItem('userId');
          if (ownerId) {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/owner/${ownerId}`);
            setAppointments(res.data);
            
            // Check if the paid appointment is chat type, and open it
            const paidAppt = res.data.find(a => String(a.id) === String(appointmentId));
            if (paidAppt && paidAppt.consultation_type === 'chat') {
              setSelectedRequestDetails(paidAppt);
              setShowChatRoom(true);
            }
          }
        } catch (err) {
          console.error("Verification error:", err);
          toast.error("Failed to verify Stripe payment.", { id: loadingToast });
        } finally {
          setVerifyingPayment(false);
          setSearchParams({});
        }
      };
      verifyStripePayment();
    } else if (cancel === 'true') {
      toast.error("Payment cancelled.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const isAppointmentRated = (apptId) => {
    const userId = localStorage.getItem('userId') || 'guest';
    const rated = JSON.parse(localStorage.getItem(`vetcloud_rated_appts_${userId}`) || '[]');
    return rated.includes(apptId);
  };

  const markAppointmentAsRated = (apptId) => {
    const userId = localStorage.getItem('userId') || 'guest';
    const key = `vetcloud_rated_appts_${userId}`;
    const rated = JSON.parse(localStorage.getItem(key) || '[]');
    if (!rated.includes(apptId)) {
      rated.push(apptId);
      localStorage.setItem(key, JSON.stringify(rated));
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackConsultation) return;
    setSubmittingFeedback(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/feedback`,
        {
          veterinarianId: feedbackConsultation.veterinarian_id,
          rating: feedbackRating,
          comment: feedbackComment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success("Thank you! Your feedback has been submitted.");
      markAppointmentAsRated(feedbackConsultation.id);
      setShowFeedbackModal(false);
      setFeedbackConsultation(null);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast.error(err.response?.data?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

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

  const handleViewReport = (consultation) => {
    setSelectedReportConsultation(consultation);
    setShowReportModal(true);
  };

  const handleEmailReport = async () => {
    if (!selectedReportConsultation) return;
    setEmailing(true);
    const loadToast = toast.loading("Sending medical report to your email...");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/chat-email-prescription`, {
        appointmentId: selectedReportConsultation.id,
        prescription: selectedReportConsultation.prescription || "No prescription details available."
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
    if (!selectedReportConsultation) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const formattedDate = new Date(selectedReportConsultation.appointment_date || selectedReportConsultation.created_at).toLocaleDateString("en-US", {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });

    const prescriptionText = selectedReportConsultation.prescription || "No prescription details entered.";

    printWindow.document.write(`
      <html>
        <head>
          <title>Treatment Report - Appointment #${selectedReportConsultation.id}</title>
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
              <strong>Dr. ${selectedReportConsultation.veterinarian_name}</strong><br>
              VetCloud Registered Veterinarian<br>
              Consultation Type: ${selectedReportConsultation.consultation_type.toUpperCase()}
            </div>
            <div class="card">
              <div class="card-title">Patient & Owner Details</div>
              <strong>Patient Name:</strong> ${selectedReportConsultation.animal_name}<br>
              <strong>Species:</strong> ${selectedReportConsultation.animal_species || 'N/A'}<br>
              <strong>Breed:</strong> ${selectedReportConsultation.animal_breed || 'N/A'}
            </div>
          </div>

          <div class="card-title">Prescribed Treatments & Advice</div>
          <div class="prescription-box">${prescriptionText.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</div>

          <div class="footer">
            This is a computer-generated medical record from VetCloud. Date: ${formattedDate}<br>
            VetCloud Consultation ID: #${selectedReportConsultation.id}
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
                          <div className={`mt-2 flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg border ${consult.payment_status === 'Paid' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                            <CreditCard size={14} className="mr-1.5" />
                            <span>Payment Status: {consult.payment_status || 'Unpaid'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end md:border-l md:border-slate-100 md:pl-6">
                      <div className="flex items-center gap-3 relative">
                        {consult.payment_status === 'Unpaid' ? (
                          <Button 
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap px-4 font-semibold"
                            onClick={() => handleInitiatePayment(consult)}
                          >
                            <CreditCard size={18} className="mr-2" />
                            Pay Fee
                          </Button>
                        ) : consult.consultation_type === 'chat' ? (
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap px-4 font-semibold"
                            disabled={!hasSlot}
                            onClick={() => {
                              setSelectedRequestDetails(consult);
                              setShowChatRoom(true);
                            }}
                          >
                            <MessageSquare size={18} className="mr-2" />
                            Open Chat
                          </Button>
                        ) : (
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-4 font-semibold"
                            disabled={!hasSlot}
                            onClick={() => {
                              setSelectedRequestDetails(consult);
                              setShowVideoRoom(true);
                            }}
                          >
                            <Video size={18} className="mr-2" />
                            Join Call
                          </Button>
                        )}
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
                    <div className="flex flex-col justify-end md:border-l md:border-slate-100 md:pl-6 gap-2">
                      {consult.status === 'Completed' && (
                        <Button 
                          variant="outline" 
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 w-full cursor-pointer"
                          onClick={() => handleViewReport(consult)}
                        >
                          <FileText size={18} className="mr-2" />
                          View Report
                        </Button>
                      )}
                      {consult.status === 'Completed' && !isAppointmentRated(consult.id) && (
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white w-full flex items-center justify-center cursor-pointer font-semibold text-sm"
                          onClick={() => {
                            setFeedbackConsultation(consult);
                            setFeedbackRating(5);
                            setFeedbackComment("");
                            setShowFeedbackModal(true);
                          }}
                        >
                          <Star size={18} className="mr-2" />
                          Rate Doctor
                        </Button>
                      )}
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
                Consultation with {selectedRequestDetails.veterinarian_name}
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to leave this call?")) {
                    setShowVideoRoom(false);
                    setSelectedRequestDetails(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md transition-all cursor-pointer border-0"
              >
                Exit Call
              </button>
            </div>
          </div>

          {/* Video Iframe Container */}
          <div className="flex-1 p-6 bg-slate-950 flex flex-col h-full">
            <JitsiVideoCall
              roomName={`vetcloud-appointment-${selectedRequestDetails.id}`}
              displayName={getFarmerName()}
              onClose={() => {
                setShowVideoRoom(false);
                setSelectedRequestDetails(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Farmer Chat Consultation Room Overlay */}
      {showChatRoom && selectedRequestDetails && (
        <FarmerChatRoom
          isOpen={showChatRoom}
          onClose={() => {
            setShowChatRoom(false);
            setSelectedRequestDetails(null);
          }}
          requestDetails={selectedRequestDetails}
        />
      )}

      {/* Dynamic Payment Modal */}
      {showPaymentModal && paymentAppointment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl bg-white p-0 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Secure Checkout</h3>
                <p className="text-xs text-slate-500 mt-1">Complete your virtual consultation booking</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
              >
                <XCircle size={20} />
              </button>
            </div>

            {paymentLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                <p className="text-sm font-medium text-slate-500">Calculating fees and generating secure keys...</p>
              </div>
            ) : paymentBreakdown ? (
              <div className="p-6 space-y-6">
                {/* Appointment Info */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg border border-green-200 shrink-0">
                    {paymentAppointment.animal_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Dr. {paymentAppointment.veterinarian_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Consultation for {paymentAppointment.animal_name} ({paymentAppointment.animal_breed})</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {paymentAppointment.appointment_date} at {paymentAppointment.appointment_time}
                    </p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 border-b border-slate-100 pb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Details</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Consultation Fee (Vet)</span>
                    <span className="font-medium text-slate-800">LKR {parseFloat(paymentBreakdown.doctorFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Platform Commission Fee</span>
                    <span className="font-medium text-slate-800">LKR {parseFloat(paymentBreakdown.commissionFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-800">Total Amount Due</span>
                    <span className="text-xl font-extrabold text-green-600">LKR {parseFloat(paymentBreakdown.amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Specific Checkout Fields */}
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <CreditCard size={18} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 leading-normal">
                      You will be securely redirected to the **Stripe Hosted Checkout** page to finalize your payment.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSimulateTestPayment}
                      className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                      type="button"
                    >
                      Simulate Success (Bypass)
                    </Button>
                    <Button 
                      onClick={handleConfirmStripe}
                      disabled={processingStripe}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                      type="button"
                    >
                      {processingStripe ? "Processing..." : `Pay LKR ${parseFloat(paymentBreakdown.amount).toLocaleString()}`}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
                  <ShieldAlert size={24} />
                </div>
                <p className="text-sm text-slate-500 font-medium">Failed to calculate fees. Please close and try again.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {showFeedbackModal && feedbackConsultation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Star size={24} className="fill-amber-600 text-amber-600" />
              </div>
              
              <div className="text-center w-full">
                <h3 className="text-lg font-bold text-slate-900">Rate Your Consultation</h3>
                <p className="text-sm text-slate-500 mt-1">
                  How was your experience with <span className="font-semibold text-slate-700">{feedbackConsultation.veterinarian_name || 'the doctor'}</span>?
                </p>
              </div>

              {/* Star Rating Selector */}
              <div className="flex gap-2 py-2">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setFeedbackRating(starValue)}
                    className="transform transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      size={32}
                      className={
                        starValue <= feedbackRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }
                    />
                  </button>
                ))}
              </div>

              {/* Comment Field */}
              <div className="w-full space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-500">Review Comments (Optional)</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share details of your experience..."
                  className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-slate-700"
                />
              </div>

              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-600 font-medium h-10 cursor-pointer"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackConsultation(null);
                  }}
                  disabled={submittingFeedback}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium h-10 cursor-pointer"
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Consultation Report Details Modal */}
      {showReportModal && selectedReportConsultation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  Consultation Report
                </h3>
                <p className="text-xs text-slate-500">
                  Appointment #{selectedReportConsultation.id} &bull; Completed
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Dr. <strong>{selectedReportConsultation.veterinarian_name}</strong> completed the session and issued the following prescription and treatment advice for <strong>{selectedReportConsultation.animal_name}</strong> ({selectedReportConsultation.animal_species || 'Unknown'}):
            </p>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl max-h-48 overflow-y-auto mb-6">
              <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                Prescribed Advice & Medications:
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                {selectedReportConsultation.prescription || "No prescription notes entered."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                onClick={handleDownloadPDF}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer border-0"
              >
                Download PDF Report
              </Button>
              <Button
                onClick={handleEmailReport}
                disabled={emailing}
                variant="outline"
                className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer bg-white"
              >
                {emailing ? "Sending Email..." : "Email Report to Me"}
              </Button>
            </div>

            <Button
              onClick={() => {
                setShowReportModal(false);
                setSelectedReportConsultation(null);
              }}
              variant="ghost"
              className="mt-3 w-full text-slate-500 hover:bg-slate-100 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}