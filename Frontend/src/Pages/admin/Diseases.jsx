import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, ShieldCheck, Activity, Info, Eye } from 'lucide-react';
import { Card, Badge, Button, Input, Textarea } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Diseases() {
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Types");
    const [selectedRisk, setSelectedRisk] = useState("All Risks");
    
    // Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingDisease, setEditingDisease] = useState(null); // null if creating new
    const [viewingDisease, setViewingDisease] = useState(null);
    
    // Form fields
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState("Viral");
    const [risk, setRisk] = useState("Medium");
    const [image, setImage] = useState("/default.jpg");
    const [symptoms, setSymptoms] = useState("");
    const [prevention, setPrevention] = useState("");
    const [treatment, setTreatment] = useState("");
    const [description, setDescription] = useState("");
    const [transmission, setTransmission] = useState("");
    const [incubation, setIncubation] = useState("");
    const [emergencyProtocol, setEmergencyProtocol] = useState("");
    
    // Lists as strings (newline-separated)
    const [speciesStr, setSpeciesStr] = useState("");
    const [clinicalSignsStr, setClinicalSignsStr] = useState("");
    const [preventionStepsStr, setPreventionStepsStr] = useState("");
    const [treatmentStepsStr, setTreatmentStepsStr] = useState("");

    const fetchDiseases = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/diseases`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch diseases");
            const data = await res.json();
            setDiseases(data);
        } catch (error) {
            console.error("Diseases fetch error:", error);
            toast.error("Error loading animal diseases directory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiseases();
    }, []);

    // Calculate metrics dynamically
    const totalCount = diseases.length;
    const criticalCount = diseases.filter(d => d.risk?.toLowerCase() === 'critical').length;
    const highRiskCount = diseases.filter(d => d.risk?.toLowerCase() === 'high').length;
    const updatedThisMonthCount = diseases.filter(d => {
        if (!d.created_at) return false;
        const date = new Date(d.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const openCreateModal = () => {
        setEditingDisease(null);
        setName("");
        setSlug("");
        setCategory("Viral");
        setRisk("Medium");
        setImage("/default.jpg");
        setSymptoms("");
        setPrevention("");
        setTreatment("");
        setDescription("");
        setTransmission("");
        setIncubation("");
        setEmergencyProtocol("");
        setSpeciesStr("");
        setClinicalSignsStr("");
        setPreventionStepsStr("");
        setTreatmentStepsStr("");
        setShowFormModal(true);
    };

    const openEditModal = (disease) => {
        setEditingDisease(disease);
        setName(disease.name);
        setSlug(disease.slug);
        setCategory(disease.category || "Viral");
        setRisk(disease.risk || "Medium");
        setImage(disease.image || "/default.jpg");
        setSymptoms(disease.symptoms || "");
        setPrevention(disease.prevention || "");
        setTreatment(disease.treatment || "");
        setDescription(disease.description || "");
        setTransmission(disease.transmission || "");
        setIncubation(disease.incubation || "");
        setEmergencyProtocol(disease.emergencyProtocol || "");
        
        setSpeciesStr((Array.isArray(disease.species) ? disease.species : []).join("\n"));
        setClinicalSignsStr((Array.isArray(disease.clinicalSigns) ? disease.clinicalSigns : []).join("\n"));
        setPreventionStepsStr((Array.isArray(disease.preventionSteps) ? disease.preventionSteps : []).join("\n"));
        setTreatmentStepsStr((Array.isArray(disease.treatmentSteps) ? disease.treatmentSteps : []).join("\n"));
        
        setShowFormModal(true);
    };

    const openViewModal = (disease) => {
        setViewingDisease(disease);
        setShowViewModal(true);
    };

    const handleDeleteDisease = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this disease guide? This cannot be undone.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/diseases/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete disease");
            toast.success("Disease guide deleted successfully!");
            fetchDiseases();
        } catch (error) {
            console.error("Delete disease error:", error);
            toast.error("Failed to delete disease guide");
        }
    };

    const handleSaveDisease = async (e) => {
        e.preventDefault();
        
        const species = speciesStr.split("\n").map(s => s.trim()).filter(s => s !== "");
        const clinicalSigns = clinicalSignsStr.split("\n").map(s => s.trim()).filter(s => s !== "");
        const preventionSteps = preventionStepsStr.split("\n").map(s => s.trim()).filter(s => s !== "");
        const treatmentSteps = treatmentStepsStr.split("\n").map(s => s.trim()).filter(s => s !== "");

        const payload = {
            name, slug, category, risk, image, symptoms, prevention, treatment,
            description, transmission, incubation, emergencyProtocol,
            species, clinicalSigns, preventionSteps, treatmentSteps
        };

        try {
            const url = editingDisease 
                ? `${import.meta.env.VITE_BACKEND_URL}/api/admin/diseases/${editingDisease.id}`
                : `${import.meta.env.VITE_BACKEND_URL}/api/admin/diseases`;
            const method = editingDisease ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save disease guide");
            
            toast.success(editingDisease ? "Disease guide updated successfully" : "New disease guide added!");
            setShowFormModal(false);
            fetchDiseases();
        } catch (error) {
            console.error("Save disease error:", error);
            toast.error("Error saving disease guide");
        }
    };

    const formatLastUpdated = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    // Filter Logic
    const filteredDiseases = diseases.filter(d => {
        const matchesSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (d.symptoms && d.symptoms.toLowerCase().includes(searchQuery.toLowerCase())) ||
                             (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === "All Types" || d.category === selectedCategory;
        const matchesRisk = selectedRisk === "All Risks" || d.risk === selectedRisk;
        return matchesSearch && matchesCategory && matchesRisk;
    });

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-1 font-Inter">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Diseases */}
                <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-500 font-semibold text-[13px] tracking-wide uppercase">Total Diseases</p>
                    <p className="text-[#1d4ed8] text-4xl font-bold mt-2">{totalCount}</p>
                </div>
                {/* Critical */}
                <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-500 font-semibold text-[13px] tracking-wide uppercase">Critical</p>
                    <p className="text-[#dc2626] text-4xl font-bold mt-2">{criticalCount}</p>
                </div>
                {/* High Risk */}
                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-500 font-semibold text-[13px] tracking-wide uppercase">High Risk</p>
                    <p className="text-[#d97706] text-4xl font-bold mt-2">{highRiskCount}</p>
                </div>
                {/* Updated This Month */}
                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-500 font-semibold text-[13px] tracking-wide uppercase">Updated This Month</p>
                    <p className="text-[#16a34a] text-4xl font-bold mt-2">{updatedThisMonthCount}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="p-4 border border-slate-200/80 shadow-sm bg-white rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filters inputs */}
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input 
                                placeholder="Search diseases..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 text-[14px] rounded-xl border-slate-200 hover:border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500/20" 
                            />
                        </div>
                        
                        {/* Type Select */}
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-11 border border-slate-200 rounded-xl px-4 text-[14px] text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 min-w-[130px] font-medium animate-none"
                        >
                            <option value="All Types">All Types</option>
                            <option value="Viral">Viral</option>
                            <option value="Bacterial">Bacterial</option>
                            <option value="Fungal">Fungal</option>
                            <option value="Other">Other</option>
                        </select>

                        {/* Risk Select */}
                        <select 
                            value={selectedRisk} 
                            onChange={(e) => setSelectedRisk(e.target.value)}
                            className="h-11 border border-slate-200 rounded-xl px-4 text-[14px] text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 min-w-[130px] font-medium"
                        >
                            <option value="All Risks">All Risks</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    {/* Add Disease Button */}
                    <Button onClick={openCreateModal} className="bg-[#00a63e] hover:bg-green-700 text-white rounded-xl h-11 px-5 gap-1.5 shadow-sm font-semibold shrink-0 text-[14px]">
                        <Plus size={18} /> Add Disease
                    </Button>
                </div>
            </Card>

            {/* List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDiseases.map(disease => (
                    <Card key={disease.id} className="p-6 border border-slate-200/80 shadow-sm bg-white rounded-2xl hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                            {/* Card Header (Title & Actions) */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{disease.name}</h3>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button 
                                        onClick={() => openViewModal(disease)} 
                                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="View Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button 
                                        onClick={() => openEditModal(disease)} 
                                        className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Disease"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteDisease(disease.id)} 
                                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Disease"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Badges Row */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                    {disease.category}
                                </span>
                                {disease.risk === 'Critical' ? (
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 gap-1">
                                        <AlertTriangle size={12} className="shrink-0" />
                                        Critical
                                    </span>
                                ) : disease.risk === 'High' ? (
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                        High
                                    </span>
                                ) : disease.risk === 'Medium' ? (
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                        Medium
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                        {disease.risk}
                                    </span>
                                )}
                            </div>

                            {/* Detailed Fields */}
                            <div className="space-y-3 text-[14px]">
                                {/* Affected Species */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-slate-700 font-bold">Affected Species:</span>
                                    {disease.species && disease.species.length > 0 ? (
                                        disease.species.map((sp, idx) => (
                                            <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                                                {sp}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 italic text-xs">None specified</span>
                                    )}
                                </div>

                                {/* Symptoms */}
                                <div>
                                    <span className="text-slate-700 font-bold block sm:inline mr-1">Symptoms:</span>
                                    <span className="text-slate-600">{disease.symptoms || "N/A"}</span>
                                </div>

                                {/* Treatment */}
                                <div>
                                    <span className="text-slate-700 font-bold block sm:inline mr-1">Treatment:</span>
                                    <span className="text-slate-600">{disease.treatment || "N/A"}</span>
                                </div>

                                {/* Prevention */}
                                <div>
                                    <span className="text-slate-700 font-bold block sm:inline mr-1">Prevention:</span>
                                    <span className="text-slate-600">{disease.prevention || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Last Updated Footer */}
                        <div className="text-[12px] text-slate-400 font-medium mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span>Last updated: {formatLastUpdated(disease.created_at)}</span>
                            <span className="font-mono text-slate-300">slug: {disease.slug}</span>
                        </div>
                    </Card>
                ))}
                {filteredDiseases.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Info size={36} className="text-slate-300" />
                        <p className="text-sm font-semibold">No matching disease guides found.</p>
                    </div>
                )}
            </div>

            {/* Read-Only View Modal (Eye Icon) */}
            {showViewModal && viewingDisease && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-slate-700">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <Activity size={20} className="text-green-600" />
                                <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">{viewingDisease.name}</h3>
                            </div>
                            <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body content */}
                        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
                            {/* Tags and Badges */}
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    Type: {viewingDisease.category}
                                </span>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    Incubation: {viewingDisease.incubation || "N/A"}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    viewingDisease.risk === 'Critical' ? 'bg-red-100 text-red-700' :
                                    viewingDisease.risk === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    Risk: {viewingDisease.risk}
                                </span>
                            </div>

                            {/* Overview */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1 text-[14px]">Overview Description</h4>
                                <p className="leading-relaxed text-slate-650">{viewingDisease.description || "No description provided."}</p>
                            </div>

                            {/* Transmission */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1 text-[14px]">Transmission Mode</h4>
                                <p className="leading-relaxed text-slate-650">{viewingDisease.transmission || "No transmission details provided."}</p>
                            </div>

                            {/* Species and Clinical Signs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2 text-[14px]">Target Species</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {viewingDisease.species && viewingDisease.species.length > 0 ? (
                                            viewingDisease.species.map((sp, idx) => (
                                                <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                                    {sp}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic">None listed</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2 text-[14px]">Clinical Signs</h4>
                                    {viewingDisease.clinicalSigns && viewingDisease.clinicalSigns.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                            {viewingDisease.clinicalSigns.map((sign, idx) => (
                                                <li key={idx}>{sign}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-slate-400 italic">None listed</span>
                                    )}
                                </div>
                            </div>

                            {/* Protocols Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2 text-[14px]">Prevention Protocol Steps</h4>
                                    {viewingDisease.preventionSteps && viewingDisease.preventionSteps.length > 0 ? (
                                        <ul className="list-decimal pl-5 space-y-1 text-slate-600">
                                            {viewingDisease.preventionSteps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-slate-400 italic">None listed</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2 text-[14px]">Treatment & Supportive Steps</h4>
                                    {viewingDisease.treatmentSteps && viewingDisease.treatmentSteps.length > 0 ? (
                                        <ul className="list-decimal pl-5 space-y-1 text-slate-600">
                                            {viewingDisease.treatmentSteps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-slate-400 italic">None listed</span>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Outbreak Protocol */}
                            {viewingDisease.emergencyProtocol && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <h4 className="font-bold text-red-800 mb-1 flex items-center gap-1.5 text-[14px]">
                                        <AlertTriangle size={16} />
                                        Emergency Outbreak Protocol
                                    </h4>
                                    <p className="text-red-700 leading-relaxed">{viewingDisease.emergencyProtocol}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                            <Button onClick={() => setShowViewModal(false)} className="w-28 bg-slate-200 hover:bg-slate-300 text-slate-700">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-slate-800 text-[16px] flex items-center gap-2">
                                <Activity size={18} className="text-green-600" />
                                {editingDisease ? `Edit Disease: ${editingDisease.name}` : "Publish New Disease Guide"}
                            </h3>
                            <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSaveDisease} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-655">
                            
                            {/* Basics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Disease Name*</label>
                                    <Input 
                                        required 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Foot-and-Mouth Disease..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Unique Slug*</label>
                                    <Input 
                                        required 
                                        value={slug} 
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="fmd (lowercase, no spaces)..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category (Type)*</label>
                                    <select 
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="Viral">Viral</option>
                                        <option value="Bacterial">Bacterial</option>
                                        <option value="Fungal">Fungal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Risk Level</label>
                                    <select 
                                        value={risk}
                                        onChange={(e) => setRisk(e.target.value)}
                                        className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Incubation Period</label>
                                    <Input 
                                        value={incubation} 
                                        onChange={(e) => setIncubation(e.target.value)}
                                        placeholder="e.g. 2 - 14 days..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Image Asset URL</label>
                                    <Input 
                                        value={image} 
                                        onChange={(e) => setImage(e.target.value)}
                                        placeholder="e.g. /default.jpg..." 
                                    />
                                </div>
                            </div>

                            {/* Detailed Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description Summary</label>
                                <Textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter overview details about the virus/infection..."
                                    className="min-h-[70px]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transmission Mode</label>
                                <Textarea 
                                    value={transmission}
                                    onChange={(e) => setTransmission(e.target.value)}
                                    placeholder="How does it spread? Airborne, direct contact, swill feed..."
                                    className="min-h-[60px]"
                                />
                            </div>

                            {/* Basic symptoms, prevention, treatment text fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Symptoms (Short)*</label>
                                    <Textarea 
                                        required
                                        value={symptoms} 
                                        onChange={(e) => setSymptoms(e.target.value)}
                                        placeholder="Fever, Blisters, Lameness..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prevention (Short)*</label>
                                    <Textarea 
                                        required
                                        value={prevention} 
                                        onChange={(e) => setPrevention(e.target.value)}
                                        placeholder="Vaccination, quarantine..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Treatment (Short)*</label>
                                    <Textarea 
                                        required
                                        value={treatment} 
                                        onChange={(e) => setTreatment(e.target.value)}
                                        placeholder="No specific treatment, supportive care..."
                                    />
                                </div>
                            </div>

                            {/* Detailed bullet lists */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Species (one per line)</label>
                                    <Textarea 
                                        value={speciesStr} 
                                        onChange={(e) => setSpeciesStr(e.target.value)}
                                        placeholder="Cattle&#10;Swine&#10;Sheep"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Signs (one per line)</label>
                                    <Textarea 
                                        value={clinicalSignsStr} 
                                        onChange={(e) => setClinicalSignsStr(e.target.value)}
                                        placeholder="High fever (105°F)&#10;Blisters on tongue&#10;Heavy drooling"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prevention Protocol Steps (one per line)</label>
                                    <Textarea 
                                        value={preventionStepsStr} 
                                        onChange={(e) => setPreventionStepsStr(e.target.value)}
                                        placeholder="Regular vaccine boosters&#10;Strict quarantine for 21 days"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Treatment & Supportive Steps (one per line)</label>
                                    <Textarea 
                                        value={treatmentStepsStr} 
                                        onChange={(e) => setTreatmentStepsStr(e.target.value)}
                                        placeholder="Isolate affected animals&#10;Provide soft easy feed&#10;Clean blisters with antiseptic"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Emergency Outbreak Protocol</label>
                                <Textarea 
                                    value={emergencyProtocol}
                                    onChange={(e) => setEmergencyProtocol(e.target.value)}
                                    placeholder="Who to report to? Immediate actions..."
                                    className="min-h-[50px]"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                                <Button type="button" variant="outline" onClick={() => setShowFormModal(false)} className="w-28">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-[#00a63e] hover:bg-green-700 text-white w-32">
                                    Save Guide
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
