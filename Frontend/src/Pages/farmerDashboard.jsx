import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  Activity, 
  AlertCircle, 
  CreditCard, 
  Plus, 
  Clock, 
  Check, 
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Species fallback images (matching myAnimalsPage.jsx)
const SPECIES_IMAGES = {
  Cattle: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=120",
  Dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=120",
  Poultry: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=120",
  Cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=120",
  Horse: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=120",
  Sheep: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=120",
  Other: "https://images.unsplash.com/photo-1535268647977-a403b69fc756?auto=format&fit=crop&q=80&w=120"
};

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal and Form States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSpecies, setFormSpecies] = useState("Cattle");
  const [formBreed, setFormBreed] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formStatus, setFormStatus] = useState("Healthy");
  const [formImage, setFormImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve user session info
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const ownerId = user ? user.id : null;
  const token = localStorage.getItem("token") || "";

  // Personalize name
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'John';

  const fetchAnimals = async () => {
    if (!ownerId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/animals?ownerId=${ownerId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAnimals(data);
      } else {
        console.error("Failed to load animal profiles");
      }
    } catch (err) {
      console.error("Could not connect to server", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, [ownerId, token]);

  // Mock handler for rescheduling
  const handleReschedule = (appointmentName) => {
    toast.success(`Reschedule request initiated for ${appointmentName}`);
  };

  // Navigate to My Animals page and trigger history modal
  const handleAnimalClick = (animalId) => {
    navigate('/dashboard/user/animals', { state: { selectedAnimalId: animalId } });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formBreed.trim() || !formAge.trim() || !formWeight.trim()) {
      toast.error("Please fill in all standard fields");
      return;
    }
    if (!ownerId) {
      toast.error("User session expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
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
        toast.success(`${formName} registered successfully!`);
        // Reset form and close modal
        setFormName("");
        setFormSpecies("Cattle");
        setFormBreed("");
        setFormAge("");
        setFormWeight("");
        setFormStatus("Healthy");
        setFormImage("");
        setShowRegisterModal(false);
        // Refresh list
        fetchAnimals();
      } else {
        toast.error(data.message || "Failed to register profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to communicate with server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine dynamic names based on database animals
  const firstAnimalName = animals[0] ? `${animals[0].name} (${animals[0].species})` : 'Bessie (Cow)';
  const secondAnimalName = animals[1] ? `${animals[1].name} (${animals[1].species})` : (animals[0] ? 'Max (Dog)' : 'Max (Dog)');

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      {/* 1. Welcome Card */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all duration-300">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Welcome back, {firstName}!
            <Sparkles className="text-amber-400 shrink-0" size={24} />
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            You have 2 upcoming appointments this week.
          </p>
        </div>

        <Link 
          to="/dashboard/user/appoinment"
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold text-sm md:text-[15px] px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-green-100 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus size={18} strokeWidth={2.5} />
          Request Consultation
        </Link>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Appointments & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Appointments Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="text-green-600 shrink-0" size={22} />
                <h3 className="font-bold text-slate-800 text-lg">Upcoming Appointments</h3>
              </div>
              <Link 
                to="/dashboard/user/appoinment" 
                className="text-green-600 hover:text-green-700 font-bold text-sm transition-all flex items-center gap-0.5"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              {/* Appointment 1 */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:bg-slate-50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shrink-0">
                    <Video size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">
                      {firstAnimalName} - Dr. Sarah Smith
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={14} className="text-slate-400" /> Tomorrow, 10:00 AM
                      </span>
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        <Check size={12} strokeWidth={3} className="text-green-600" /> Confirmed
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleReschedule(`${firstAnimalName} with Dr. Sarah Smith`)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 border border-slate-200 rounded-xl text-sm transition-all shadow-sm hover:border-slate-300 active:scale-98 cursor-pointer self-start sm:self-auto"
                >
                  Reschedule
                </button>
              </div>

              {/* Appointment 2 */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:bg-slate-50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shrink-0">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">
                      {secondAnimalName} - Dr. John Doe
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={14} className="text-slate-400" /> Oct 24, 2:30 PM
                      </span>
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        <Check size={12} strokeWidth={3} className="text-green-600" /> Confirmed
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleReschedule(`${secondAnimalName} with Dr. John Doe`)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 border border-slate-200 rounded-xl text-sm transition-all shadow-sm hover:border-slate-300 active:scale-98 cursor-pointer self-start sm:self-auto"
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>

          {/* Recent Notifications Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <AlertCircle className="text-orange-500 shrink-0" size={22} />
              <h3 className="font-bold text-slate-800 text-lg">Recent Notifications</h3>
            </div>

            <div className="space-y-5">
              {/* Notification 1 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-sm md:text-base">
                    Prescription ready for {animals[0] ? animals[0].name : 'Bessie'}
                  </h4>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    Dr. Sarah has uploaded a new prescription following your consultation.
                  </p>
                  <span className="text-slate-400 text-[11px] font-semibold block mt-1">
                    2 hours ago
                  </span>
                </div>
              </div>

              {/* Notification 2 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-slate-300 mt-2 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-600 text-sm md:text-base">
                    Payment successful
                  </h4>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    Receipt for your last consultation has been generated.
                  </p>
                  <span className="text-slate-400 text-[11px] font-semibold block mt-1">
                    1 day ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - My Animals & Payment History */}
        <div className="space-y-6">
          
          {/* My Animals Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">My Animals</h3>
              <Link 
                to="/dashboard/user/animals" 
                className="text-green-600 hover:text-green-700 font-bold text-sm transition-all"
              >
                Manage
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="text-xs text-slate-400">Fetching profiles...</p>
              </div>
            ) : animals.length > 0 ? (
              <div className="space-y-4">
                {animals.slice(0, 4).map((animal) => {
                  const imageSrc = animal.image || SPECIES_IMAGES[animal.species] || SPECIES_IMAGES.Other;
                  return (
                    <div 
                      key={animal.id} 
                      onClick={() => handleAnimalClick(animal.id)}
                      className="flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition-all duration-200"
                      title="Click to view history details"
                    >
                      <img 
                        src={imageSrc}
                        alt={animal.name} 
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                        onError={(e) => {
                          e.target.src = SPECIES_IMAGES[animal.species] || SPECIES_IMAGES.Other;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{animal.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 truncate">
                          {animal.species} &bull; {animal.breed}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 hover:text-slate-500" />
                    </div>
                  );
                })}

                {/* Add Animal Shortcut Button */}
                <button 
                  onClick={() => setShowRegisterModal(true)}
                  className="mt-2 border border-dashed border-slate-200 hover:border-green-600 hover:bg-green-50/20 rounded-xl py-3 w-full text-slate-500 hover:text-green-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} strokeWidth={3} />
                  Add Animal
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-slate-400">No animals registered yet.</p>
                <button 
                  onClick={() => setShowRegisterModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs bg-green-50 border border-green-100 text-green-700 hover:bg-green-100 font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Register First Animal
                </button>
              </div>
            )}
          </div>

          {/* Payment History Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Payment History</h3>
            
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="text-slate-400 shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-slate-700 text-xs md:text-sm">Visa ending in 4242</h4>
                  <p className="text-slate-400 text-[10px] md:text-xs font-medium mt-0.5">Expires 12/24</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 border border-green-200/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                Default
              </span>
            </div>

            <Link 
              to="/dashboard/user/settings"
              className="mt-4 w-full py-2.5 text-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer block"
            >
              View Payment History
            </Link>
          </div>

        </div>

      </div>

      {/* 3. Register Animal Modal Overlay */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-lg">
                Register New Animal
              </h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
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
                  <label className="text-xs font-semibold text-slate-500">Profile Image URL (Optional)</label>
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
                  onClick={() => setShowRegisterModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-green-50 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}