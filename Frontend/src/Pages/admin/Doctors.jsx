import { useState, useEffect } from 'react';
import { Search, Trash2, CheckCircle2, XCircle, Stethoscope, Award, FileText, Info } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDoc, setSelectedDoc] = useState(null);

    const fetchDoctors = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch doctors");
            const data = await res.json();
            setDoctors(data);
        } catch (error) {
            console.error("Doctors fetch error:", error);
            toast.error("Error loading veterinarians database");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleUpdateStatus = async (id, isApproved) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ is_Active: isApproved })
            });
            if (!res.ok) throw new Error("Failed to update veterinarian status");
            toast.success(isApproved ? "Doctor account approved & activated!" : "Doctor account deactivated/rejected");
            fetchDoctors();
            if (selectedDoc && selectedDoc.id === id) {
                setSelectedDoc(prev => ({ ...prev, is_Active: isApproved ? 1 : 0 }));
            }
        } catch (error) {
            console.error("Doctor status error:", error);
            toast.error("Failed to update status");
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this doctor's account? All profile details will be lost.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete veterinarian");
            toast.success("Veterinarian account deleted");
            fetchDoctors();
            setSelectedDoc(null);
        } catch (error) {
            console.error("Doctor delete error:", error);
            toast.error("Failed to delete veterinarian account");
        }
    };

    const filteredDoctors = doctors.filter(doc => 
        doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Doctors list (left columns) */}
            <Card className="p-6 xl:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Veterinarians Directory</h2>
                        <p className="text-sm text-slate-500">Approve registrations and manage professional credentials.</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input 
                            placeholder="Search by name, spec, or email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 text-sm" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4">Doctor</th>
                                <th className="py-3.5 px-4">Specialization</th>
                                <th className="py-3.5 px-4">License No</th>
                                <th className="py-3.5 px-4">Experience</th>
                                <th className="py-3.5 px-4">Fee (LKR)</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                            {filteredDoctors.map(doc => (
                                <tr 
                                    key={doc.id} 
                                    onClick={() => setSelectedDoc(doc)}
                                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedDoc && selectedDoc.id === doc.id ? 'bg-green-50/30' : ''}`}
                                >
                                    <td className="py-4 px-4 font-semibold text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs">
                                                {doc.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 leading-none mb-1">{doc.fullName}</p>
                                                <p className="text-xs text-slate-400">{doc.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">{doc.specialization}</td>
                                    <td className="py-4 px-4 font-mono text-xs">{doc.license_number}</td>
                                    <td className="py-4 px-4">{doc.years_of_experience} yrs</td>
                                    <td className="py-4 px-4 font-medium text-slate-700">{parseFloat(doc.consultation_fee).toLocaleString()}</td>
                                    <td className="py-4 px-4">
                                        <Badge variant={doc.is_Active ? "success" : "warning"} className="px-2 py-0.5">
                                            {doc.is_Active ? "Approved" : "Pending"}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1.5">
                                            {doc.is_Active ? (
                                                <Button 
                                                    onClick={() => handleUpdateStatus(doc.id, false)}
                                                    variant="ghost" 
                                                    size="sm" 
                                                    title="Deactivate Doctor"
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                >
                                                    <XCircle size={16} />
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={() => handleUpdateStatus(doc.id, true)}
                                                    variant="ghost" 
                                                    size="sm" 
                                                    title="Approve Doctor"
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </Button>
                                            )}
                                            <Button 
                                                onClick={() => handleDeleteDoctor(doc.id)} 
                                                variant="ghost" 
                                                size="sm" 
                                                title="Delete Doctor Account"
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDoctors.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-400">
                                        No veterinarians found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Doctor Detail Sidebar (right column) */}
            <Card className="p-6">
                {selectedDoc ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-2xl mx-auto mb-4 border-4 border-blue-50 shadow-sm">
                                {selectedDoc.fullName.charAt(0)}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{selectedDoc.fullName}</h3>
                            <p className="text-sm text-slate-500 font-medium">{selectedDoc.professional_title || "Veterinarian Practitioner"}</p>
                            <Badge variant={selectedDoc.is_Active ? "success" : "warning"} className="mt-2.5">
                                {selectedDoc.is_Active ? "Active & Verified" : "Awaiting Verification"}
                            </Badge>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Specialization</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <Stethoscope size={16} className="text-blue-500" />
                                    {selectedDoc.specialization}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">License Details</span>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <Award size={16} className="text-emerald-500" />
                                    No. {selectedDoc.license_number}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Biography</span>
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 text-justify">
                                    {selectedDoc.bio || "No professional biography has been provided yet."}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Number</span>
                                <p className="text-sm text-slate-700 font-medium">{selectedDoc.contact_No || "No number provided"}</p>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                            {selectedDoc.is_Active ? (
                                <Button 
                                    onClick={() => handleUpdateStatus(selectedDoc.id, false)} 
                                    variant="outline" 
                                    className="flex-1 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                >
                                    Deactivate
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUpdateStatus(selectedDoc.id, true)} 
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Approve & Active
                                </Button>
                            )}
                            <Button 
                                onClick={() => handleDeleteDoctor(selectedDoc.id)}
                                variant="danger" 
                                className="px-3"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-3">
                        <Info size={36} className="text-slate-300" />
                        <p className="text-sm font-semibold">Select a veterinarian</p>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                            Click on any doctor in the directory to inspect their license credentials, clinic properties, and biography.
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
}
