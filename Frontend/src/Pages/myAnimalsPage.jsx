import { useState, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  FileText, 
  Pencil, 
  Trash2, 
  MoreVertical, 
  Bell, 
  LayoutDashboard, 
  Bird, 
  Calendar, 
  MessageSquare, 
  Settings, 
  User, 
  LogOut,
  X,
  PlusCircle,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

// animal details
const INITIAL_ANIMALS = [
  {
    id: "1",
    name: "Bessie",
    species: "Cattle",
    breed: "Holstein",
    age: "4 Years",
    weight: "650 kg",
    lastVisit: "10 Oct, 2023",
    status: "Healthy",
    image: "/Cows.jpg"
  },
  {
    id: "2",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "2 Years",
    weight: "32 kg",
    lastVisit: "24 Sep, 2023",
    status: "Under Treatment",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "3",
    name: "Flock A",
    species: "Poultry",
    breed: "Leghorn",
    age: "6 Months",
    weight: "Avg 2 kg",
    lastVisit: "15 Aug, 2023",
    status: "Healthy",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "4",
    name: "Luna",
    species: "Cat",
    breed: "Siamese",
    age: "1 Year",
    weight: "4 kg",
    lastVisit: "01 Nov, 2023",
    status: "Healthy",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  }
];


const ANIMAL_HISTORIES = {
  "1": [
    { date: "10 Oct, 2023", type: "Vaccination", title: "Foot-and-Mouth Disease (FMD) Vaccine", vet: "Dr. Emily Smith", notes: "Routine vaccine booster. Clean health bill." },
    { date: "12 May, 2023", type: "Checkup", title: "Weight and Nutrition Assessment", vet: "Dr. Emily Smith", notes: "Weight healthy at 650kg. Recommended continuing standard silage feed." },
    { date: "04 Jan, 2023", type: "Procedure", title: "Hoof Trimming & Care", vet: "Dr. Mark R.", notes: "Routine preventative hoof maintenance." }
  ],
  "2": [
    { date: "24 Sep, 2023", type: "Diagnostic", title: "Blood Check & Parasite Panel", vet: "Dr. Sarah Connor", notes: "Undergoing standard heartworm prevention treatment." },
    { date: "10 Aug, 2023", type: "Consultation", title: "Limping Investigation", vet: "Dr. Sarah Connor", notes: "Minor joint strain. Prescribed anti-inflammatory medication (Under Treatment)." },
    { date: "15 Jan, 2023", type: "Vaccination", title: "Rabies Booster", vet: "Dr. Sarah Connor", notes: "Annual rabies vaccination completed." }
  ],
  "3": [
    { date: "15 Aug, 2023", type: "Inspection", title: "Flock Health Assessment", vet: "Dr. Arthur Vance", notes: "Evaluated 120 layers. Excellent egg laying quality. Feed ratios stable." },
    { date: "10 Mar, 2023", type: "Vaccination", title: "Avian Influenza Deworming", vet: "Dr. Arthur Vance", notes: "Water-based flock-wide treatment." }
  ],
  "4": [
    { date: "01 Nov, 2023", type: "Checkup", title: "Annual Dental Inspection", vet: "Dr. Lisa Cuddy", notes: "Teeth cleaned, gums look robust. Cat is active and healthy." },
    { date: "14 Jun, 2023", type: "Vaccination", title: "Feline Leukemia Booster", vet: "Dr. Lisa Cuddy", notes: "Regular booster completed. Responding beautifully." }
  ]
};

export default function MyAnimalsPage() {
  const [animals, setAnimals] = useState(INITIAL_ANIMALS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSpecies, setFormSpecies] = useState("Cattle");
  const [formBreed, setFormBreed] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formStatus, setFormStatus] = useState("Healthy");
  const [formImage, setFormImage] = useState("");

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryAnimal, setSelectedHistoryAnimal] = useState(null);

  // Delete Confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAnimalId, setDeletingAnimalId] = useState(null);

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Handle opening modal for creating
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
  };

  // Handle opening modal for editing
  const handleOpenEditModal = (animal) => {
    setEditingAnimal(animal);
    setFormName(animal.name);
    setFormSpecies(animal.species);
    setFormBreed(animal.breed);
    setFormAge(animal.age);
    setFormWeight(animal.weight);
    setFormStatus(animal.status);
    setFormImage(animal.image);
    setShowFormModal(true);
    setActiveMenuId(null);
  };

  // Handle form submission (Create or Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formBreed.trim() || !formAge.trim() || !formWeight.trim()) {
      toast.error("Please fill in all standard fields");
      return;
    }

  
  }



 return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR (Left) */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-full z-20">
        
        {/* Logo/Brand Header */}
        <div>
          <div className="h-20 flex items-center px-6 gap-2.5 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <img src="/public/Logo.png" alt="VetCloud Logo" className="w-[45px] h-[32px] object-fill" />
              <span className="text-xl font-bold text-slate-800 tracking-tight">VetCloud</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-4">
            <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <LayoutDashboard size={20} className="text-slate-400" />
              Dashboard
            </button>
            
            <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-semibold text-green-700 bg-green-50 rounded-xl transition-all">
              <Bird size={20} className="text-green-600" />
              My Animals
            </button>
            
            <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <Calendar size={20} className="text-slate-400" />
              Book Appointment
            </button>
            
            <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <MessageSquare size={20} className="text-slate-400" />
              Consultations
            </button>
            
            <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <Settings size={20} className="text-slate-400" />
              Settings
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-50 space-y-1">
          <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <User size={20} className="text-slate-400" />
            Login as Pet Owner
          </button>
          <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} className="text-red-400" />
            Sign Out
          </button>
        </div>

      </aside>

      {/* 2. MAIN CONTAINER (Right) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-slate-800">My Animals</h2>
          
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
              <Bell size={21} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 border-l pl-6 border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" 
                alt="John Farmer Avatar" 
                className="w-10 h-10 rounded-full object-cover border border-slate-100"
              />
              <div className="text-left">
                <p className="text-[14px] font-bold text-slate-800 leading-none">John Farmer</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Livestock Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Panel */}
        <main className="flex-1 overflow-y-auto p-8">
          
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Page Subtitle & Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Animals</h1>
                <p className="text-slate-400 text-sm mt-0.5">Manage profiles, medical history, and appointments.</p>
              </div>

              <button 
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold text-[14px] px-5 py-2.5 rounded-full shadow-md shadow-green-100 hover:shadow-lg transition-all"
              >
                <Plus size={16} strokeWidth={2.5} />
                Register Animal
              </button>
            </div>

            {/* Search and Filters Line */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch relative">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, species or breed..." 
                  className="w-full bg-white border border-slate-200/90 rounded-2xl pl-12 pr-4 py-3 text-sm placeholder:text-slate-400 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>

              {/* Filter Button */}
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                  showFilterPanel 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : "bg-white border-slate-200/90 hover:border-slate-300 text-slate-600 hover:text-slate-800"
                }`}
              >
                <SlidersHorizontal size={16} />
                Filter Options
                <ChevronDown size={14} className={`transition-transform duration-200 ${showFilterPanel ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          </main>
        </div>
    </div>
 )
}