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
const SPECIES_IMAGES = {
  Cattle: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600",
  Dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
  Poultry: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=600",
  Cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600",
  Horse: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=600",
  Sheep: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=600",
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

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSpecies, setFormSpecies] = useState("Cattle");
  const [formBreed, setFormBreed] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formStatus, setFormStatus] = useState("Healthy");
  const [formImage, setFormImage] = useState("");

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
    if (animals.length > 0 && location.state?.selectedAnimalId) {
      const targetAnimalId = location.state.selectedAnimalId;
      const animal = animals.find(a => a.id === targetAnimalId || String(a.id) === String(targetAnimalId));
      if (animal) {
        // Clear history state to prevent reopening on reload
        window.history.replaceState({}, document.title);
        handleOpenHistoryModal(animal);
      }
    }
  }, [animals, location.state]);

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
    setFormAge("");
    setFormWeight("");
    setFormStatus("Healthy");
    setFormImage("");
    setShowFormModal(true);
    setActiveMenuId(null);
  };

  // Open Edit modal
  const handleOpenEditModal = (animal) => {
    setEditingAnimal(animal);
    setFormName(animal.name);
    setFormSpecies(animal.species);
    setFormBreed(animal.breed);
    setFormAge(animal.age);
    setFormWeight(animal.weight);
    setFormStatus(animal.status);
    setFormImage(animal.image || "");
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

  // Open Delete Confirm modal
  const handleOpenDeleteConfirm = (id) => {
    setDeletingAnimalId(id);
    setShowDeleteConfirm(true);
    setActiveMenuId(null);
  };

  // Form Submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!formName.trim() || !formBreed.trim() || !formAge.trim() || !formWeight.trim()) {
      toast.error("Please fill in all standard fields");
      return;
    }
    if (!ownerId) {
      toast.error("User session expired. Please log in again.");
      return;
    }

    const animalData = {
      owner_id: ownerId,
      name: formName.trim(),
      species: formSpecies,
      breed: formBreed.trim(),
      age: formAge.trim(),
      weight: formWeight.trim(),
      status: formStatus,
      image: formImage.trim() || SPECIES_IMAGES[formSpecies] || SPECIES_IMAGES.Other
    };

    try {
      if (editingAnimal) {
        // Update animal profile in database
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals/${editingAnimal.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(animalData)
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
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(animalData)
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
                <option value="Horse">Horse</option>
                <option value="Sheep">Sheep</option>
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
              className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative"
            >
              {/* Card Image */}
              <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                <img 
                  src={animal.image} 
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
                <div className="absolute top-4 right-4">
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
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button 
                          onClick={() => handleOpenHistoryModal(animal)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={15} className="text-slate-400" />
                          Medical History
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(animal)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil size={15} className="text-slate-400" />
                          Edit Profile
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button 
                          onClick={() => handleOpenDeleteConfirm(animal.id)}
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
                    <span className="font-semibold text-slate-700">{animal.weight}</span>
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
                    <option value="Horse">Horse</option>
                    <option value="Sheep">Sheep</option>
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

                {/* Age Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Age *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 4 Years, 6 Months"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Weight Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Weight *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 650 kg, 32 kg"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Health Status */}
                <div className="col-span-2 space-y-1.5">
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

                {/* Image URL Field */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-Inter">Profile Image URL (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="Paste an Unsplash or image link"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                  />
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

                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <span>Attending Veterinarian:</span>
                        <span className="font-semibold text-slate-500">{record.vet}</span>
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