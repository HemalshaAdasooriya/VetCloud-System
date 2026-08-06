import { useState, useEffect } from 'react';
import { Activity, Users, Calendar, DollarSign, Clock, Check, X, ShieldAlert, ChevronRight, Stethoscope, AlertCircle } from 'lucide-react';
import { Card, Badge, Button } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Overview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmRejectModal, setShowConfirmRejectModal] = useState(false);
    const [vetToReject, setVetToReject] = useState(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/overview`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch overview data");
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error("Overview fetch error:", error);
            toast.error("Error loading dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproveDoctor = async (id, approve) => {
        try {
            if (approve) {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors/${id}/status`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ is_Active: true })
                });
                if (!res.ok) throw new Error("Failed to update status");
                toast.success("Doctor approved successfully");
                fetchData();
            } else {
                const vet = (data?.recentVets || []).find(v => v.id === id);
                setVetToReject(vet);
                setShowConfirmRejectModal(true);
            }
        } catch (error) {
            console.error("Doctor status error:", error);
            toast.error("Error updating doctor status");
        }
    };

    const confirmRejectDoctor = async () => {
        if (!vetToReject) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors/${vetToReject.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete request");
            toast.success("Doctor registration request rejected and deleted");
            setShowConfirmRejectModal(false);
            setVetToReject(null);
            fetchData();
        } catch (error) {
            console.error("Doctor reject error:", error);
            toast.error("Error rejecting doctor request");
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const { stats = {}, recentVets = [], recentOwners = [] } = data || {};
    const pendingVets = recentVets.filter(v => !v.is_Active);

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-emerald-50/40 border-emerald-100/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Total Owners</span>
                        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700"><Users size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalOwners}</p>
                    <p className="text-xs text-slate-400 mt-2">Registered farmers & pet owners</p>
                </Card>

                <Card className="p-6 bg-blue-50/40 border-blue-100/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Total Veterinarians</span>
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700"><Stethoscope size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalVets}</p>
                    <p className="text-xs text-slate-400 mt-2">Licensed veterinary professionals</p>
                </Card>

                <Card className="p-6 bg-indigo-50/40 border-indigo-100/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Total Appointments</span>
                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-700"><Calendar size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalAppointments}</p>
                    <p className="text-xs text-slate-400 mt-2">Consultation slots booked</p>
                </Card>

                <Card className="p-6 bg-amber-50/40 border-amber-100/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Total Revenue</span>
                        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700"><DollarSign size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">LKR {stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Gross consultation fees collected</p>
                </Card>
            </div>

            {/* Pending Approvals Quick Panel */}
            {pendingVets.length > 0 && (
                <Card className="p-6 border-amber-200 bg-amber-50/10">
                    <div className="flex items-center gap-2.5 mb-6 text-amber-800">
                        <ShieldAlert size={22} className="text-amber-500" />
                        <h3 className="text-lg font-bold">Vets Awaiting Approval</h3>
                        <Badge variant="warning" className="ml-2 px-2.5 py-0.5">{pendingVets.length}</Badge>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {pendingVets.map(vet => (
                            <div key={vet.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                    <h4 className="font-semibold text-slate-800">{vet.fullName}</h4>
                                    <p className="text-sm text-slate-500">{vet.email} • <span className="italic">{vet.specialization}</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleApproveDoctor(vet.id, true)} size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1">
                                        <Check size={16} /> Approve
                                    </Button>
                                    <Button onClick={() => handleApproveDoctor(vet.id, false)} variant="danger" size="sm" className="rounded-xl gap-1">
                                        <X size={16} /> Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Recent Registrations Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Farmers */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                        <span>Recent Pet Owners / Farmers</span>
                        <ChevronRight className="text-slate-400" size={18} />
                    </h3>
                    <div className="space-y-4">
                        {recentOwners.map(owner => (
                            <div key={owner.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-colors">
                                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-sm">
                                    {owner.fullName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 text-sm">{owner.fullName}</p>
                                    <p className="text-xs text-slate-500">{owner.email}</p>
                                </div>
                                <Badge variant={owner.is_Active ? "success" : "danger"} className="text-[10px]">
                                    {owner.is_Active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        ))}
                        {recentOwners.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">No recent signups</p>
                        )}
                    </div>
                </Card>

                {/* Recent Veterinarians */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                        <span>Recent Veterinarians</span>
                        <ChevronRight className="text-slate-400" size={18} />
                    </h3>
                    <div className="space-y-4">
                        {recentVets.map(vet => (
                            <div key={vet.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-colors">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-sm">
                                    {vet.fullName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 text-sm">{vet.fullName}</p>
                                    <p className="text-xs text-slate-500">{vet.specialization}</p>
                                </div>
                                <Badge variant={vet.is_Active ? "success" : "warning"} className="text-[10px]">
                                    {vet.is_Active ? "Approved" : "Pending"}
                                </Badge>
                            </div>
                        ))}
                        {recentVets.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">No recent signups</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Custom Confirm Reject Modal */}
            {showConfirmRejectModal && vetToReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-lg p-8 md:p-10 space-y-6 mx-4 text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Red Exclamation Mark Icon */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 border border-red-100/50">
                            <AlertCircle size={28} />
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-3">
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Reject Registration?</h3>
                            <p className="text-sm md:text-base text-slate-500 leading-relaxed px-2">
                                Are you sure you want to reject and delete <strong>Dr. {vetToReject.fullName}</strong>'s registration request? This action cannot be undone.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setShowConfirmRejectModal(false);
                                    setVetToReject(null);
                                }}
                                className="px-8 py-3 h-12 border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 rounded-full font-bold text-sm tracking-wide transition-all duration-200 flex-1 w-full sm:w-auto cursor-pointer focus:outline-none"
                            >
                                No, Keep it
                            </button>
                            <button 
                                type="button" 
                                onClick={confirmRejectDoctor}
                                className="px-8 py-3 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm tracking-wide transition-all duration-200 flex-1 w-full sm:w-auto cursor-pointer focus:outline-none shadow-md shadow-red-200/50 hover:shadow-lg"
                            >
                                Yes, Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
