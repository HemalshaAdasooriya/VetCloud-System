import { useState, useEffect } from "react";
import { Activity, Calendar, CheckCircle, Clock, DollarSign, MoreVertical, Search, Video, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { Badge, Button, Card, Input } from "../components/Ui/ui";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    
    // State data
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState({});

    const getVetId = () => {
        return localStorage.getItem("userId");
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const vetId = getVetId();
            if (!vetId || !token) {
                throw new Error("Veterinarian ID or Token not found. Please log in again.");
            }

            // 1. Fetch Veterinarian Profile
            const profileRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/users/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setDoctorProfile(profileData);
            }

            // 2. Fetch Appointments
            const appointmentsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/vet-appointments/vet/${vetId}`);
            setAppointments(appointmentsRes.data || []);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            setError("Failed to load dashboard statistics. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Helper: Local Date Format matching YYYY-MM-DD
    const getLocalTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalTodayDateString();

    // ── METRICS CALCULATIONS ────────────────────────────────────────────────
    
    // Today's Patients (approved or completed appointments scheduled for today)
    const todayAppointments = appointments.filter(a => 
        (a.status?.toLowerCase() === "approved" || a.status?.toLowerCase() === "completed") && 
        a.appointment_date === todayStr
    );
    const todayCount = todayAppointments.length;

    // Pending Requests
    const pendingRequests = appointments.filter(a => a.status?.toLowerCase() === "pending");
    const pendingCount = pendingRequests.length;

    // Earnings calculation (Completed appointments * consultation fee)
    const consultationFee = parseFloat(doctorProfile?.consultation_fee) || 0;
    const completedAppointments = appointments.filter(a => a.status?.toLowerCase() === "completed");
    
    // Weekly earnings (completed in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCompleted = completedAppointments.filter(a => {
        const completedDate = new Date(a.updated_at || a.created_at);
        return completedDate >= sevenDaysAgo;
    });
    
    const weeklyEarnings = weeklyCompleted.length * consultationFee;
    const totalEarnings = completedAppointments.length * consultationFee;

    // ── TIME FORMATTING UTILITY ─────────────────────────────────────────────
    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        try {
            const [hours, minutes] = timeStr.split(":");
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? "PM" : "AM";
            const hour12 = hour % 12 || 12;
            return `${String(hour12).padStart(2, "0")}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    // Filter today's schedule based on search input
    const filteredTodaySchedule = todayAppointments.filter(apt => 
        apt.animal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.animal_species?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Decline request directly from dashboard
    const handleDeclineRequest = async (requestId) => {
        const reason = prompt("Please enter the reason for declining this request:");
        if (reason === null) return; // User cancelled prompt
        if (!reason.trim()) {
            alert("A reason is required to decline.");
            return;
        }

        setActionLoading(prev => ({ ...prev, [requestId]: true }));
        try {
            await axios.patch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/vet-appointments/${requestId}/reject`, { reason });
            alert("Request declined successfully!");
            fetchDashboardData();
        } catch (err) {
            console.error("Error declining appointment:", err);
            alert("Failed to decline request. Please try again.");
        } finally {
            setActionLoading(prev => ({ ...prev, [requestId]: false }));
        }
    };

    // Helper: Parse relative time ago
    const timeAgo = (dateStr) => {
        if (!dateStr) return "Recently";
        try {
            const date = new Date(dateStr);
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 60) return "Just now";
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        } catch {
            return "Recently";
        }
    };

    if (loading && appointments.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const doctorName = doctorProfile?.lastName 
        ? `Dr. ${doctorProfile.firstName || ""} ${doctorProfile.lastName}` 
        : doctorProfile?.fullName || "Doctor";

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">{error}</span>
                </div>
            )}

            {/* Welcome banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Hello, {doctorName}!</h2>
                    <p className="text-slate-500 mt-1">
                        You have {todayCount} appointment{todayCount === 1 ? "" : "s"} scheduled for today and {pendingCount} pending consultation request{pendingCount === 1 ? "" : "s"}.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="success" className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 border-none">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse inline-block"></span> Available
                    </Badge>
                </div>
            </div>

            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-green-50/50 border-green-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Today's Patients</h3>
                        <div className="bg-white p-2 rounded-lg text-green-600 shadow-sm"><Activity size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{todayCount}</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">Scheduled for today</p>
                </Card>
                
                <Card 
                    className="p-6 bg-amber-50/50 border-amber-100 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => navigate("/dashboard/doctor/requests")}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Pending Requests</h3>
                        <div className="bg-white p-2 rounded-lg text-amber-600 shadow-sm"><Clock size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">Requires attention</p>
                </Card>

                <Card 
                    className="p-6 bg-blue-50/50 border-blue-100 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => navigate("/dashboard/doctor/settings")}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Earnings (Week)</h3>
                        <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><DollarSign size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">Rs. {weeklyEarnings}</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">Total accumulated: Rs. {totalEarnings}</p>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Today's Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="text-green-600" size={20} />
                                Today's Schedule
                            </h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input 
                                    placeholder="Search patient or owner..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm" 
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {filteredTodaySchedule.length > 0 ? (
                                filteredTodaySchedule.map((apt) => {
                                    const isVideo = apt.consultation_type === "video";
                                    const isChat = apt.consultation_type === "chat";
                                    const isCompleted = apt.status?.toLowerCase() === "completed";

                                    return (
                                        <div 
                                            key={apt.id} 
                                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-4 transition-all duration-200 ${
                                                !isCompleted ? "bg-green-50/20 border-green-100 hover:border-green-300" : "bg-slate-50 border-slate-100 opacity-80"
                                            }`}
                                        >
                                            <div className="flex items-start gap-4 w-full sm:w-auto">
                                                <div className="bg-white border shadow-sm p-2.5 rounded-xl flex flex-col items-center justify-center min-w-[75px]">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {apt.appointment_time ? formatTime(apt.appointment_time).split(" ")[1] : "TBD"}
                                                    </span>
                                                    <span className="text-lg font-extrabold text-slate-800 leading-none mt-0.5">
                                                        {apt.appointment_time ? formatTime(apt.appointment_time).split(" ")[0] : "--:--"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h4 className="font-bold text-slate-800 text-base">{apt.animal_name || "Patient"}</h4>
                                                        <Badge variant="default" className="text-[9px] uppercase px-2 py-0 h-4 border-none bg-slate-100 text-slate-600 font-semibold">
                                                            {apt.animal_species || "Animal"}
                                                        </Badge>
                                                        {isCompleted && (
                                                            <Badge variant="success" className="text-[9px] uppercase px-2 py-0 h-4 border-none font-semibold">
                                                                Completed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">Owner: {apt.owner_name}</p>
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            {isVideo ? <Video size={13} className="text-blue-500" /> : <MessageSquare size={13} className="text-indigo-500" />} 
                                                            {isVideo ? "Video Consult" : "Chat Consult"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle size={13} className="text-green-500" /> Confirmed
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                                {!isCompleted && (
                                                    <Button 
                                                        variant={isVideo ? "primary" : "secondary"} 
                                                        size="sm" 
                                                        className="px-4 py-2 font-semibold text-xs rounded-lg cursor-pointer"
                                                        onClick={() => navigate("/dashboard/doctor/consultations", { 
                                                            state: { 
                                                                appointmentId: apt.id, 
                                                                startCall: isVideo, 
                                                                startChat: isChat 
                                                            } 
                                                        })}
                                                    >
                                                        {isVideo ? "Join Call" : "Open Chat"}
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="px-3 py-2 text-xs font-semibold rounded-lg"
                                                    onClick={() => navigate("/dashboard/doctor/consultations", { state: { appointmentId: apt.id } })}
                                                >
                                                    Details
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <Calendar className="mx-auto text-slate-300 mb-3" size={32} />
                                    <p className="text-sm font-semibold">No appointments scheduled for today.</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Use the search bar or check the consultations tab for other dates.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Consultation Requests */}
                <div className="space-y-6">
                    <Card className="p-6 border-amber-200 bg-amber-50/10 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="text-amber-500" size={20} />
                                New Requests
                            </h3>
                            <Badge variant="warning" className="border-none">{pendingCount}</Badge>
                        </div>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.slice(0, 3).map((req) => (
                                    <div key={req.id} className="p-4 bg-white rounded-lg border border-amber-100 shadow-sm hover:border-amber-200 transition-colors">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <div>
                                                <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{req.animal_name || "Patient"}</h4>
                                                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{req.animal_species || "Unknown"}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{timeAgo(req.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">Owner: <span className="font-semibold text-slate-600">{req.owner_name}</span></p>
                                        
                                        {req.reason_notes && (
                                            <p className="text-xs italic text-amber-800 bg-amber-50 p-2 rounded-md mb-4 border border-amber-100/50 truncate">
                                                "{req.reason_notes}"
                                            </p>
                                        )}
                                        
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                className="flex-1 text-[11px] font-bold bg-green-600 hover:bg-green-700 text-white border-none cursor-pointer h-8 rounded-lg"
                                                onClick={() => navigate("/dashboard/doctor/requests", { state: { requestId: req.id } })}
                                                disabled={actionLoading[req.id]}
                                            >
                                                Accept
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="flex-1 text-[11px] font-bold text-slate-600 border-slate-200 hover:border-red-600 hover:text-red-600 cursor-pointer h-8 rounded-lg"
                                                onClick={() => handleDeclineRequest(req.id)}
                                                disabled={actionLoading[req.id]}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-400 bg-white border border-slate-100 rounded-lg">
                                    <CheckCircle className="mx-auto text-slate-300 mb-3 animate-bounce" size={32} />
                                    <p className="text-xs font-semibold">You are all caught up!</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">No new consultation requests pending.</p>
                                </div>
                            )}
                        </div>

                        {pendingCount > 3 && (
                            <Button 
                                variant="ghost" 
                                className="w-full mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                                onClick={() => navigate("/dashboard/doctor/requests")}
                            >
                                View all requests ({pendingCount} total)
                            </Button>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}