import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, ShieldCheck, Activity, Info } from 'lucide-react';
import { Card, Badge, Button, Input, Textarea } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Diseases() {
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Form & View states
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingDisease, setEditingDisease] = useState(null); // null if creating new
    
    // Form fields
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState("");
    const [risk, setRisk] = useState("Medium Risk");
    const [image, setImage] = useState("");
    const [symptoms, setSymptoms] = useState("");
    const [prevention, setPrevention] = useState("");
    const [treatment, setTreatment] = useState("");
    const [description, setDescription] = useState("");
    const [transmission, setTransmission] = useState("");
    const [incubation, setIncubation] = useState("");
    const [emergencyProtocol, setEmergencyProtocol] = useState("");
    
    // JSON arrays represented as strings in textareas (one bullet per line)
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

    const openCreateModal = () => {
        setEditingDisease(null);
        setName("");
        setSlug("");
        setCategory("Cattle");
        setRisk("Medium Risk");
        setImage("/Cows.jpg");
        setSymptoms("");
        setPrevention("");
        setTreatment("");
        setDescription("");
        setTransmission("");
        setIncubation("");
        setEmergencyProtocol("");
        setSpeciesStr("Cattle");
        setClinicalSignsStr("");
        setPreventionStepsStr("");
        setTreatmentStepsStr("");
        setShowFormModal(true);
    };

    const openEditModal = (disease) => {
        setEditingDisease(disease);
        setName(disease.name);
        setSlug(disease.slug);
        setCategory(disease.category || "");
        setRisk(disease.risk || "Medium Risk");
        setImage(disease.image || "");
        setSymptoms(disease.symptoms || "");
        setPrevention(disease.prevention || "");
        setTreatment(disease.treatment || "");
        setDescription(disease.description || "");
        setTransmission(disease.transmission || "");
        setIncubation(disease.incubation || "");
        setEmergencyProtocol(disease.emergencyProtocol || "");
        
        // Convert arrays to newline-separated strings
        setSpeciesStr((disease.species || []).join("\n"));
        setClinicalSignsStr((disease.clinicalSigns || []).join("\n"));
        setPreventionStepsStr((disease.preventionSteps || []).join("\n"));
        setTreatmentStepsStr((disease.treatmentSteps || []).join("\n"));
        
        setShowFormModal(true);
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
        
        // Parse newline-separated text inputs to arrays
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

    const filteredDiseases = diseases.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Disease Guide Management</h2>
                        <p className="text-sm text-slate-500">Edit or publish veterinary information and clinical protocols.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative w-56 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input 
                                placeholder="Search diseases..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 text-sm" 
                            />
                        </div>
                        <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1">
                            <Plus size={16} /> Add Disease
                        </Button>
                    </div>
                </div>
            </Card>

            {/* List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDiseases.map(disease => (
                    <Card key={disease.id} className="flex flex-col overflow-hidden border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div className="h-44 bg-slate-100 relative shrink-0">
                            <img 
                                src={disease.image.startsWith("/") ? disease.image : `/default.jpg`}
                                alt={disease.name} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3">
                                <Badge variant={disease.risk === 'Critical Risk' ? 'danger' : disease.risk === 'High Risk' ? 'warning' : 'info'}>
                                    {disease.risk}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{disease.category}</span>
                                <h3 className="text-base font-bold text-slate-800 line-clamp-1 mb-2">{disease.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{disease.description}</p>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                                <span className="text-[11px] text-slate-400 font-medium font-mono">slug: {disease.slug}</span>
                                <div className="flex gap-2">
                                    <Button onClick={() => openEditModal(disease)} variant="outline" size="sm" className="px-2.5 h-8 border-slate-200 text-slate-600 hover:text-green-600 hover:border-green-300">
                                        <Edit2 size={13} />
                                    </Button>
                                    <Button onClick={() => handleDeleteDisease(disease.id)} variant="ghost" size="sm" className="px-2.5 h-8 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100">
                                        <Trash2 size={13} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
                {filteredDiseases.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Info size={32} className="text-slate-300" />
                        <p className="text-sm font-semibold">No disease guides found</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Activity size={18} className="text-green-600" />
                                {editingDisease ? `Edit Disease: ${editingDisease.name}` : "Publish New Disease Guide"}
                            </h3>
                            <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSaveDisease} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-600">
                            
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
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category*</label>
                                    <Input 
                                        required 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Cattle, Dogs, Poultry..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Risk Level</label>
                                    <select 
                                        value={risk}
                                        onChange={(e) => setRisk(e.target.value)}
                                        className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="Critical Risk">Critical Risk</option>
                                        <option value="High Risk">High Risk</option>
                                        <option value="Medium Risk">Medium Risk</option>
                                        <option value="Low Risk">Low Risk</option>
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
                                        placeholder="e.g. /Cows.jpg or /dog.jpg..." 
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
                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white w-32">
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
