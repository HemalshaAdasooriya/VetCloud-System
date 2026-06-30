import { useState, useEffect } from 'react';
import { Activity, Users, Calendar, DollarSign, Clock, Check, X, ShieldAlert, ChevronRight, Stethoscope } from 'lucide-react';
import { Card, Badge, Button } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Overview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
            } else {
                if (!confirm("Are you sure you want to reject and delete this veterinarian registration request?")) return;
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (!res.ok) throw new Error("Failed to delete request");
                toast.success("Doctor registration request rejected and deleted");
            }
            fetchData();
        } catch (error) {
            console.error("Doctor status error:", error);
            toast.error("Error updating doctor status");
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
        </div>
    );
}
