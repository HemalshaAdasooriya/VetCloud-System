import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  FileText, 
  Pencil, 
  Trash2, 
  MoreVertical, 
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

// Default high-quality images based on species
const SPECIES_WEIGHT_LIMITS = {
  Cattle: 3000,
  Dog: 200,
  Cat: 30,
  Poultry: 10
};

const SPECIES_IMAGES = {
  Cattle: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600",
  Dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
  Poultry: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=600",
  Cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600",
  Other: "https://images.unsplash.com/photo-1535268647977-a403b69fc756?auto=format&fit=crop&q=80&w=600"
};

export default function MyAnimalsPage() {
  const location = useLocation();
  const [animals, setAnimals] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedAnimalHistory, setSelectedAnimalHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Helper functions for Age parsing and formatting
  const parseAge = (ageStr) => {
    if (!ageStr) return { years: 0, months: 0, days: 0 };
    let years = 0, months = 0, days = 0;
    const yearsMatch = String(ageStr).match(/(\d+)\s*Years?/i);
    const monthsMatch = String(ageStr).match(/(\d+)\s*Months?/i);
    const daysMatch = String(ageStr).match(/(\d+)\s*Days?/i);
    if (yearsMatch) years = parseInt(yearsMatch[1], 10);
    if (monthsMatch) months = parseInt(monthsMatch[1], 10);
    if (daysMatch) days = parseInt(daysMatch[1], 10);
    if (!yearsMatch && !monthsMatch && !daysMatch && !isNaN(parseInt(ageStr, 10))) {
      years = parseInt(ageStr, 10);
    }
    return { years, months, days };
  };

  const formatAge = (years, months, days) => {
    const parts = [];
    const y = parseInt(years, 10) || 0;
    const m = parseInt(months, 10) || 0;
    const d = parseInt(days, 10) || 0;
    if (y > 0) parts.push(`${y} ${y === 1 ? 'Year' : 'Years'}`);
    if (m > 0) parts.push(`${m} ${m === 1 ? 'Month' : 'Months'}`);
    if (d > 0) parts.push(`${d} ${d === 1 ? 'Day' : 'Days'}`);
    if (parts.length === 0) return "0 Days";
    return parts.join(", ");
  };

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSpecies, setFormSpecies] = useState("Cattle");
  const [formBreed, setFormBreed] = useState("");
  const [formAgeYears, setFormAgeYears] = useState(0);
  const [formAgeMonths, setFormAgeMonths] = useState(0);
  const [formAgeDays, setFormAgeDays] = useState(0);
  const [formWeight, setFormWeight] = useState("");
  const [formStatus, setFormStatus] = useState("Healthy");
  const [formImage, setFormImage] = useState("");
  const [formImageFile, setFormImageFile] = useState(null);
  const [formHealthReport, setFormHealthReport] = useState("");
  const [formHealthReportFile, setFormHealthReportFile] = useState(null);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryAnimal, setSelectedHistoryAnimal] = useState(null);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAnimalId, setDeletingAnimalId] = useState(null);

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Retrieve user and token from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const ownerId = user ? user.id : null;
  const token = localStorage.getItem("token") || "";

  // Helper to normalize file upload URLs
  const getFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${import.meta.env.VITE_BACKEND_URL}${cleanPath}`;
  };
  // Load animals from backend
  const fetchAnimals = async () => {
    if (!ownerId) {
      setIsLoadingData(false);
      return;
    }
    try {
      setIsLoadingData(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals?ownerId=${ownerId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAnimals(data);
      } else {
        toast.error("Failed to load animal profiles");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not connect to server");
    } finally {
      setIsLoadingData(false);
    }
  };
  useEffect(() => {
    fetchAnimals();
  }, [ownerId]);


  useEffect(() => {
    if (location.state?.openRegisterModal) {
      // Clear history state to prevent reopening on reload
      window.history.replaceState({}, document.title);
      handleOpenCreateModal();
    }
  }, [location.state]);

  // Open Create modal
  const handleOpenCreateModal = () => {
    setEditingAnimal(null);
    setFormName("");
    setFormSpecies("Cattle");
    setFormBreed("");
    setFormAgeYears(0);
    setFormAgeMonths(0);
    setFormAgeDays(0);
    setFormWeight("");
    setFormStatus("Healthy");
    setFormImage("");
    setFormImageFile(null);
    setFormHealthReport("");
    setFormHealthReportFile(null);
    setShowFormModal(true);
    setActiveMenuId(null);
  };

  // Open Edit modal
  const handleOpenEditModal = (animal) => {
    setEditingAnimal(animal);
    setFormName(animal.name);
    setFormSpecies(animal.species);
    setFormBreed(animal.breed);
    const parsed = parseAge(animal.age);
    setFormAgeYears(parsed.years);
    setFormAgeMonths(parsed.months);
    setFormAgeDays(parsed.days);
    setFormWeight(animal.weight ? String(animal.weight) : "");
    setFormStatus(animal.status);
    setFormImage(animal.image || "");
    setFormImageFile(null);
    setFormHealthReport(animal.health_report || "");
    setFormHealthReportFile(null);
    setShowFormModal(true);
    setActiveMenuId(null);
  };

  // Open History modal and fetch history dynamically
  const handleOpenHistoryModal = async (animal) => {
    setSelectedHistoryAnimal(animal);
    setShowHistoryModal(true);
    setActiveMenuId(null);
    setSelectedAnimalHistory([]);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals/${animal.id}/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAnimalHistory(data);
      } else {
        toast.error("Failed to load medical records");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not retrieve medical history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDownloadPrescription = (record, animal) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical Prescription Report - ${animal.name}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #334155;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #10b981;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #0f766e;
              margin: 0;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-size: 11px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #334155;
            }
            .content {
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 30px;
              margin-bottom: 30px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .content-title {
              font-size: 16px;
              font-weight: 700;
              color: #0f766e;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .prescription-text {
              font-size: 14px;
              white-space: pre-wrap;
              color: #475569;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">VetCloud Medical Report</h1>
              <span class="subtitle">Digital Prescription & Consultation Summary</span>
            </div>
            <div style="text-align: right; font-family: sans-serif;">
              <span style="font-weight: 700; color: #10b981;">VETCLOUD SYSTEM</span>
            </div>
          </div>
          
          <div class="info-grid">
            <div>
              <div class="info-item">
                <div class="info-label">Patient Name</div>
                <div class="info-value">${animal.name} (${animal.breed})</div>
              </div>
              <div class="info-item">
                <div class="info-label">Species / Age</div>
                <div class="info-value">${animal.species} · ${animal.age} years old</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="info-label">Report Date</div>
                <div class="info-value">${record.date}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Attending Veterinarian</div>
                <div class="info-value">${record.vet || record.veterinarian}</div>
              </div>
            </div>
          </div>
          
          <div class="content">
            <div class="content-title">Prescribed Medication & Directions</div>
            <div class="prescription-text">${record.notes || record.details}</div>
          </div>
          
          <div class="footer">
            This is a computer-generated medical report issued by VetCloud.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Open Delete Confirm modal
  const handleOpenDeleteConfirm = (id) => {
    setDeletingAnimalId(id);
    setShowDeleteConfirm(true);
    setActiveMenuId(null);
  };

  // Form Submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!formName.trim() || !formBreed.trim() || formWeight === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    const y = parseInt(formAgeYears, 10) || 0;
    const m = parseInt(formAgeMonths, 10) || 0;
    const d = parseInt(formAgeDays, 10) || 0;

    if (y < 0 || y > 100) {
      toast.error("Age in years must be between 0 and 100");
      return;
    }
    if (m < 0 || m > 11) {
      toast.error("Months must be between 0 and 11");
      return;
    }
    if (d < 0 || d > 31) {
      toast.error("Days must be between 0 and 31");
      return;
    }
    if (y === 100 && (m > 0 || d > 0)) {
      toast.error("Maximum allowed age is 100 years");
      return;
    }
    if (y === 0 && m === 0 && d === 0) {
      toast.error("Please enter a valid age");
      return;
    }

    const wFloat = parseFloat(formWeight);
    const maxLimit = SPECIES_WEIGHT_LIMITS[formSpecies] || null;
    if (isNaN(wFloat) || wFloat <= 0 || (maxLimit !== null && wFloat > maxLimit)) {
      if (maxLimit !== null) {
        toast.error(`Maximum weight allowed for ${formSpecies} is ${maxLimit} kg (must be greater than 0)`);
      } else {
        toast.error("Weight must be a valid number greater than 0");
      }
      return;
    }

    if (!ownerId) {
      toast.error("User session expired. Please log in again.");
      return;
    }

    const ageString = formatAge(y, m, d);

    const formData = new FormData();
    formData.append("owner_id", ownerId);
    formData.append("name", formName.trim());
    formData.append("species", formSpecies);
    formData.append("breed", formBreed.trim());
    formData.append("age", ageString);
    formData.append("weight", wFloat.toString());
    formData.append("status", formStatus);
    
    if (formImageFile) {
      formData.append("image", formImageFile);
    } else {
      formData.append("image", formImage || SPECIES_IMAGES[formSpecies] || SPECIES_IMAGES.Other);
    }

    if (formHealthReportFile) {
      formData.append("healthReport", formHealthReportFile);
    } else if (formHealthReport) {
      formData.append("health_report", formHealthReport);
    }

    try {
      if (editingAnimal) {
        // Update animal profile in database
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals/${editingAnimal.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          // Replace locally
          setAnimals(animals.map((a) => (a.id === editingAnimal.id ? data.animal : a)));
          toast.success(`${formName} updated successfully!`);
          setShowFormModal(false);
        } else {
          toast.error(data.message || "Failed to update profile");
        }
      } else {
        // Create new animal profile in database
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          // Prepend locally
          setAnimals([data.animal, ...animals]);
          toast.success(`${formName} registered successfully!`);
          setShowFormModal(false);
        } else {
          toast.error(data.message || "Failed to register profile");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to communicate with server");
    }

  };

  // Execute deletion in database
  const handleDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals/${deletingAnimalId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAnimals(animals.filter((a) => a.id !== deletingAnimalId));
        toast.success("Animal profile removed successfully!");
        setShowDeleteConfirm(false);
      } else {
        toast.error(data.message || "Failed to delete profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to communicate with server");
    }
  };

  // Computed & Filtered Animals List
  const filteredAnimals = useMemo(() => {
    let result = [...animals];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.species.toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q)
      );
    }

    // Species filter
    if (filterType !== "All") {
      result = result.filter((a) => a.species === filterType);
    }

    // Status filter
    if (filterStatus !== "All") {
      result = result.filter((a) => a.status === filterStatus);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "age-asc") return a.age.localeCompare(b.age);
      if (sortBy === "weight-asc") return parseFloat(a.weight) - parseFloat(b.weight);
      return 0;
    });

    return result;
  }, [animals, searchQuery, filterType, filterStatus, sortBy]);

  // Utility to determine status style classes
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Healthy":
        return "bg-green-100 text-green-800 border-green-200";
      case "Under Treatment":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Sick":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* 1. Page Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Animals</h1>
          <p className="text-slate-500 text-sm mt-1">Manage profiles, medical histories, and treatment courses.</p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold text-[14px] px-6 py-3 rounded-full shadow-lg shadow-green-100 hover:shadow-green-200/80 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          Register Animal
        </button>
      </div>

      {/* 2. Interactive Search and Filters panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, species or breed..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Panel Toggle */}
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              showFilterPanel 
                ? "bg-green-50 border-green-200 text-green-700 shadow-inner" 
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal size={16} />
            Filter & Sort
            <ChevronDown size={14} className={`transition-transform duration-200 ${showFilterPanel ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Collapsible filter parameters */}
        {showFilterPanel && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 transition-all duration-300">
            {/* Species filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Species</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="All">All Species</option>
                <option value="Cattle">Cattle</option>
                <option value="Dog">Dog</option>
                <option value="Poultry">Poultry</option>
                <option value="Cat">Cat</option>
              </select>
            </div>

            {/* Health status filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Health Status</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="All">All Statuses</option>
                <option value="Healthy">Healthy</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Sick">Sick</option>
              </select>
            </div>

            {/* Sort parameter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="name-asc">Name (A - Z)</option>
                <option value="name-desc">Name (Z - A)</option>
                <option value="age-asc">Age (Youngest First)</option>
                <option value="weight-asc">Weight (Lightest First)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main animal profile cards grid */}
       {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-slate-500 font-semibold text-sm">Loading your registered animals...</p>
        </div>
      ) : filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAnimals.map((animal) => (
            <div 
              key={animal.id} 
              onClick={() => handleOpenHistoryModal(animal)}
              className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative cursor-pointer"
              title="Click to view medical history"
            >
              {/* Card Image */}
              <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                <img 
                  src={
                    animal.image && animal.image.startsWith('/uploads/') 
                      ? `${import.meta.env.VITE_BACKEND_URL}${animal.image}` 
                      : (animal.image || SPECIES_IMAGES[animal.species] || SPECIES_IMAGES.Other)
                  } 
                  alt={animal.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    const fallback = SPECIES_IMAGES[animal.species] || SPECIES_IMAGES.Other;
                    if (e.target.src !== fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />
                
                {/* Health Status Badge overlay */}
                <span className={`absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md ${getStatusBadgeStyle(animal.status)}`}>
                  {animal.status}
                </span>

                {/* Options button with dropdown actions */}
                <div 
                  className="absolute top-4 right-4 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === animal.id ? null : animal.id)}
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-600 rounded-full border border-slate-200 shadow-sm focus:outline-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Context Actions Dropdown menu */}
                  {activeMenuId === animal.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                        }}
                      />
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoryModal(animal);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={15} className="text-slate-400" />
                          Medical History
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(animal);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil size={15} className="text-slate-400" />
                          Edit Profile
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteConfirm(animal.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={15} className="text-red-400" />
                          Unregister
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-1.5">
                    {animal.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {animal.breed} &bull; {animal.species}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 px-3.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Age</span>
                    <span className="font-semibold text-slate-700">{animal.age}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Weight</span>
                    <span className="font-semibold text-slate-700">{animal.weight} kg</span>
                  </div>
                </div>



                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Last Visit</span>
                  <span className="font-semibold text-slate-600">{animal.lastVisit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state view */
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Activity size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No animals found</h3>
            <p className="text-slate-400 text-sm">
              We couldn't find any animals matching your filter or search query. Try broadening your criteria.
            </p>
          </div>
          <button 
            onClick={() => {
              setSearchQuery("");
              setFilterType("All");
              setFilterStatus("All");
            }}
            className="text-sm font-semibold text-green-600 hover:text-green-700 cursor-pointer"
          >
            Clear Search Filters
          </button>
        </div>
      )}

      {/* 4. FORM MODAL (Add / Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-lg">
                {editingAnimal ? `Edit Profile: ${editingAnimal.name}` : "Register New Animal"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Animal Name */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Animal Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Bessie, Rocky"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Species Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Species *</label>
                  <select 
                    value={formSpecies}
                    onChange={(e) => setFormSpecies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Cattle">Cattle</option>
                    <option value="Dog">Dog</option>
                    <option value="Poultry">Poultry</option>
                    <option value="Cat">Cat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Breed Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Breed *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Holstein, Golden Retriever"
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Age Fields (Years, Months, Days) */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Age *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Years</span>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formAgeYears}
                        onChange={(e) => setFormAgeYears(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Months</span>
                      <input 
                        type="number"
                        min="0"
                        max="11"
                        required
                        value={formAgeMonths}
                        onChange={(e) => setFormAgeMonths(Math.min(11, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Days</span>
                      <input 
                        type="number"
                        min="0"
                        max="31"
                        required
                        value={formAgeDays}
                        onChange={(e) => setFormAgeDays(Math.min(31, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Weight Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Weight *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max={SPECIES_WEIGHT_LIMITS[formSpecies] || undefined}
                    required 
                    placeholder="e.g. 45.5"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Health Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Health Status *</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Sick">Sick</option>
                  </select>
                </div>

                {/* Health Report / Vaccination Card Uploader */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Health Report / Vaccination Card</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <input 
                      type="file" 
                      accept=".pdf,image/*,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormHealthReportFile(e.target.files[0]);
                        }
                      }}
                      id="healthReportUpload"
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <label 
                        htmlFor="healthReportUpload"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <FileText size={14} />
                        Upload Health Report / Card
                      </label>
                      {formHealthReportFile ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium truncate">
                          <span>{formHealthReportFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setFormHealthReportFile(null)}
                            className="text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (formHealthReport ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                          <span>Report Uploaded</span>
                          <a 
                            href={getFileUrl(formHealthReport)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline text-emerald-700 font-bold"
                          >
                            View
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">PDF, JPG, PNG, DOC (Optional)</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Picture Uploader */}
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Profile Picture</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <img 
                      src={
                        formImageFile 
                          ? URL.createObjectURL(formImageFile) 
                          : (formImage && (formImage.startsWith('http') || formImage.startsWith('/uploads'))
                              ? (formImage.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL}${formImage}` : formImage)
                              : (SPECIES_IMAGES[formSpecies] || SPECIES_IMAGES.Other))
                      }
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white"
                    />
                    <div className="flex-1 space-y-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormImageFile(e.target.files[0]);
                          }
                        }}
                        id="animalImageUpload"
                        className="hidden"
                      />
                      <label 
                        htmlFor="animalImageUpload"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        Upload Photo
                      </label>
                      {formImageFile && (
                        <button
                          type="button"
                          onClick={() => setFormImageFile(null)}
                          className="ml-3 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">PNG, JPG or JPEG. If left empty, default system picture is used.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-green-50 hover:shadow-lg transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MEDICAL HISTORY MODAL */}
      {showHistoryModal && selectedHistoryAnimal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">
                  Medical Record History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full clinical and preventative history for {selectedHistoryAnimal.name} ({selectedHistoryAnimal.breed})
                </p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Timeline Record content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Health Report / Vaccination Card Section */}
              {selectedHistoryAnimal.health_report && (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                        <FileText size={22} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Health Report / Vaccination Card</h4>
                        <p className="text-xs text-slate-500 font-medium">Official uploaded health record for {selectedHistoryAnimal.name}</p>
                      </div>
                    </div>
                    <a
                      href={getFileUrl(selectedHistoryAnimal.health_report)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      <FileText size={14} />
                      Open Full Report / Card
                    </a>
                  </div>

                  {/* Inline Image Preview if file is an image */}
                  {/\.(jpg|jpeg|png|webp|gif)$/i.test(selectedHistoryAnimal.health_report) && (
                    <div className="mt-2 pt-3 border-t border-emerald-200/60 flex justify-center">
                      <a 
                        href={getFileUrl(selectedHistoryAnimal.health_report)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block overflow-hidden rounded-xl border border-emerald-200 shadow-xs max-h-56 w-full max-w-md bg-white text-center"
                      >
                        <img 
                          src={getFileUrl(selectedHistoryAnimal.health_report)} 
                          alt="Vaccination Card / Health Report Preview" 
                          className="w-full h-auto max-h-52 object-contain mx-auto p-1 transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <FileText size={14} /> Click to Open Full Image
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              )}
             {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="text-xs text-slate-400">Retrieving clinical records...</p>
                </div>
              ) : selectedAnimalHistory && selectedAnimalHistory.length > 0 ? (
                <div className="relative pl-6 border-l border-slate-200/80 space-y-6 ml-2 py-2">
                  {selectedAnimalHistory.map((record, index) => (
                    <div key={index} className="relative space-y-1.5">
                      {/* Timeline Dot icon */}
                      <span className="absolute -left-[31px] top-0.5 bg-white border-2 border-green-500 rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-sm">
                        <span className="h-2 w-2 bg-green-500 rounded-full" />
                      </span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                        <span className="font-bold text-slate-400">{record.date}</span>
                        <span className="inline-block bg-slate-100 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded-full font-bold">
                          {record.type}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-700 text-sm leading-tight">
                        {record.title}
                      </h4>
                      
                      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                        {record.notes}
                      </p>

                      <div className="flex items-center justify-between gap-4 border-t border-slate-100/50 pt-2 mt-2">
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <span>Attending Veterinarian:</span>
                          <span className="font-semibold text-slate-500">{record.vet || record.veterinarian}</span>
                        </div>
                        {record.type === "Prescription" && (
                          <button
                            onClick={() => handleDownloadPrescription(record, selectedHistoryAnimal)}
                            className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer transition-colors bg-green-50 px-2.5 py-1 rounded-lg border border-green-100"
                          >
                            Download Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700">No medical files</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      There are currently no clinical history notes or procedure files registered for {selectedHistoryAnimal.name}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold active:scale-95 transition-all cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">Unregister Animal?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Are you absolutely sure you want to unregister this animal? This profile will be permanently deleted and all past medical history files will be removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-rose-50 hover:shadow-lg transition-all cursor-pointer"
              >
                Yes, Unregister
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}