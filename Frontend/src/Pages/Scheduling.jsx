import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Video,
  MessageCircle,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  CheckCircle2,
  Search,
  Star,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';

import { Button, Card, Input, Badge } from '../components/Ui/ui';

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

export default function Scheduling() {
  const [step, setStep] = useState(1);
  const [consultType, setConsultType] = useState('video');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [symptoms, setSymptoms] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [resubmitAppointmentId, setResubmitAppointmentId] = useState(null);

  const [animals, setAnimals] = useState([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [searchAnimal, setSearchAnimal] = useState('');
  const [searchVet, setSearchVet] = useState('');

  // Add Animal Modal
  const [showAddAnimalModal, setShowAddAnimalModal] = useState(false);
  const [addAnimalForm, setAddAnimalForm] = useState({
    name: '',
    species: 'Cattle',
    breed: '',
    ageYears: 0,
    ageMonths: 0,
    ageDays: 0,
    weight: '',
    status: 'Healthy',
    image: ''
  });
  const [formImageFile, setFormImageFile] = useState(null);
  const [formHealthReportFile, setFormHealthReportFile] = useState(null);
  const [addingAnimal, setAddingAnimal] = useState(false);

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

  // Restored states for symptoms/appointment upload images
  const [uploadedImages, setUploadedImages] = useState([]);
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedImages((prev) => [...prev, ...files]);
  };

  // Delete Animal States & Logic
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAnimalId, setDeletingAnimalId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // States for fetching available slots from vet_schedule
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const handleDeleteAnimalClick = (e, animalId) => {
    e.stopPropagation();
    setDeletingAnimalId(animalId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAnimal = async () => {
    if (!deletingAnimalId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/animals/${deletingAnimalId}`);
      setAnimals((prev) => prev.filter((a) => a.id !== deletingAnimalId));
      if (selectedAnimal === deletingAnimalId) {
        setSelectedAnimal(null);
      }
      setShowDeleteModal(false);
      setDeletingAnimalId(null);
    } catch (err) {
      console.error("Failed to delete animal:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Vets state
  const [vets, setVets] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loadingVets, setLoadingVets] = useState(true);
  // GET animals from DB
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const ownerId = localStorage.getItem('userId');
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/animals?ownerId=${ownerId}`);
        setAnimals(res.data);
      } catch (err) {
        console.error('Failed to load animals:', err);
      } finally {
        setLoadingAnimals(false);
      }
    };

    fetchAnimals();
  }, []);

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/vets`);
        setVets(res.data);
      } catch (err) {
        console.error("Failed to load vets:", err);
      } finally {
        setLoadingVets(false);
      }
    };

    fetchVets();
  }, []);

  // Fetch available slots for all selected dates
  useEffect(() => {
    if (selectedVet && selectedDates.length > 0) {
      const loadAllSlots = async () => {
        setLoadingSlots(true);
        try {
          const allSlots = [];
          for (const date of selectedDates) {
            const slots = await fetchAvailableSlotsForVet(selectedVet, date);
            allSlots.push(...slots);
          }
          setAvailableTimeSlots(allSlots);
        } catch (err) {
          console.error('Error loading slots:', err);
        } finally {
          setLoadingSlots(false);
        }
      };
      loadAllSlots();
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedVet, selectedDates]);

  const getSelectedAnimal = () =>
    animals.find(a => a.id === selectedAnimal);

  const getSelectedVet = () =>
    vets.find(v => v.id === selectedVet);

  // Search & Filter
  const filteredAnimals = animals.filter(animal =>
    animal.name.toLowerCase().includes(searchAnimal.toLowerCase()) ||
    animal.breed?.toLowerCase().includes(searchAnimal.toLowerCase()) ||
    animal.species?.toLowerCase().includes(searchAnimal.toLowerCase())
  );

  const filteredVets = vets.filter(vet =>
    vet.name.toLowerCase().includes(searchVet.toLowerCase()) ||
    vet.spec.toLowerCase().includes(searchVet.toLowerCase())
  );

  const location = useLocation();

  useEffect(() => {
    if (location?.state?.resubmitAppointmentId) {
      setResubmitAppointmentId(location.state.resubmitAppointmentId);
    }
  }, [location?.state]);

  // Fetch available slots from vet_schedule
  const fetchAvailableSlotsForVet = async (vetId, date) => {
    if (!vetId || !date) return [];
    try {
      const formattedDate = formatDateKey(date);
      
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/vet/${vetId}/date/${formattedDate}`
      );
      
      // Filter only available slots (not booked)
      const available = response.data.filter(slot => slot.is_booked === 0);
      
      return available;
    } catch (err) {
      console.error('Error fetching available slots:', err);
      return [];
    }
  };

  // Resubmit appointment logic
  useEffect(() => {
    if (!resubmitAppointmentId) return;

    const fetchAppointmentForResubmit = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${resubmitAppointmentId}`);
        const appointment = res.data;
        setSelectedAnimal(appointment.animal_id);
        setSelectedVet(appointment.veterinarian_id);
        
        if (appointment.consultation_type) {
          setConsultType(appointment.consultation_type);
        }
        
        setSymptoms(() => {
          try {
            const parsed = JSON.parse(appointment.reason);
            return parsed?.notes || '';
          } catch {
            return appointment.reason || '';
          }
        });

        const availability = (() => {
          try {
            const parsed = JSON.parse(appointment.reason);
            if (Array.isArray(parsed?.availability) && parsed.availability.length > 0) {
              return parsed.availability;
            }
          } catch {
            // Ignore parse error, proceed to fallback
          }

          if (Array.isArray(appointment.slots) && appointment.slots.length > 0) {
            return appointment.slots.map((s) => ({
              date: s.date || s.slot_date,
              time: s.time || s.slot_time
            }));
          }

          return [];
          
        })();

        setSelectedDates(
          Array.from(new Set(availability.map((slot) => slot.date)))
            .map((dateString) => new Date(dateString))
        );

        setSelectedTimes(
          Array.from(new Set(availability.map((slot) => normalizeTimeToLabel(slot.time)))).filter(Boolean)
        );

        setStep(3);
      } catch (err) {
        console.error('Failed to load appointment for resubmission:', err);
      }
    };

    fetchAppointmentForResubmit();
  }, [resubmitAppointmentId]);

  // Add Animal handlers
  const handleAddAnimalChange = (e) => {
    const { name, value } = e.target;
    setAddAnimalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAnimalSubmit = async (e) => {
    e.preventDefault();

    const y = parseInt(addAnimalForm.ageYears, 10) || 0;
    const m = parseInt(addAnimalForm.ageMonths, 10) || 0;
    const d = parseInt(addAnimalForm.ageDays, 10) || 0;

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

    const wFloat = parseFloat(addAnimalForm.weight);
    if (isNaN(wFloat) || wFloat <= 0 || wFloat > 150) {
      toast.error("Maximum weight allowed is 150 kg (must be greater than 0)");
      return;
    }

    setAddingAnimal(true);

    try {
      const ownerId = localStorage.getItem('userId');
      const ageString = formatAge(y, m, d);

      const formData = new FormData();
      formData.append('owner_id', ownerId);
      formData.append('name', addAnimalForm.name);
      formData.append('species', addAnimalForm.species);
      formData.append('breed', addAnimalForm.breed);
      formData.append('age', ageString);
      formData.append('weight', wFloat.toString());
      formData.append('status', addAnimalForm.status);

      if (formImageFile) {
        formData.append('image', formImageFile);
      } else {
         formData.append('image', addAnimalForm.image || SPECIES_IMAGES[addAnimalForm.species] || SPECIES_IMAGES.Other);
      }

      if (formHealthReportFile) {
        formData.append('healthReport', formHealthReportFile);
      }

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/animals`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/animals?ownerId=${ownerId}`);
      setAnimals(res.data);

      setAddAnimalForm({
        name: '',
        species: 'Cattle',
        breed: '',
        ageYears: 0,
        ageMonths: 0,
        ageDays: 0,
        weight: '',
        status: 'Healthy',
        image: ''
      });
      setFormImageFile(null);
      setFormHealthReportFile(null);
      setShowAddAnimalModal(false);
    } catch (err) {
      console.error('Failed to add animal:', err);
    } finally {
      setAddingAnimal(false);
    }
  };

  // Compare dates using local date values
  const areSameDate = (dateA, dateB) => {
    if (!dateA || !dateB) return false;
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
  };

  const toggleDateSelection = (date) => {
    setSelectedDates((prev) => {
      const alreadySelected = prev.some((selectedDate) => areSameDate(selectedDate, date));
      if (alreadySelected) {
        return prev.filter((selectedDate) => !areSameDate(selectedDate, date));
      }
      return [...prev, date];
    });
  };

  const toggleTimeSelection = (time) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((item) => item !== time) : [...prev, time]
    );
  };

  // Format date using local date values (no timezone issues)
  const formatDateKey = (date) => {
    if (!date || !(date instanceof Date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (date) => {
    if (!date || !(date instanceof Date)) return "";
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const normalizeTimeTo24 = (timeString) => {
    if (!timeString) return '';
    const [timePart, meridiem] = timeString.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let normalized = hours;
    if (meridiem === 'PM' && hours < 12) normalized += 12;
    if (meridiem === 'AM' && hours === 12) normalized = 0;
    return `${String(normalized).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const normalizeTimeToLabel = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return time24;
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
  };

  const buildAvailabilityPayload = () => {
    return selectedDates.flatMap((date) =>
      selectedTimes.map((time) => ({
        date: formatDateKey(date),
        time: normalizeTimeTo24(time)
      }))
    );
  };

  const handleSubmitAppointmentRequest = async () => {
    if (!selectedAnimal || !selectedVet || selectedDates.length === 0 || selectedTimes.length === 0) {
      return;
    }

    setRequestError('');
    setSubmissionMessage('');
    setIsSubmittingRequest(true);

    try {
      const ownerId = localStorage.getItem('userId');
      const availability = buildAvailabilityPayload();

      if (resubmitAppointmentId) {
        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${resubmitAppointmentId}/resubmit`, {
          availability,
          reason: symptoms,
          consultation_type: consultType
        });
        setSubmissionMessage('Request resubmitted. Your doctor will review the updated availability.');
        setResubmitAppointmentId(null);
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
          pet_owner_id: ownerId,
          veterinarian_id: selectedVet,
          animal_id: selectedAnimal,
          reason: symptoms,
          availability,
          status: 'Pending',
          consultation_type: consultType
        });
        setSubmissionMessage('Request submitted. Your doctor will review and approve one of your requested slots.');
      }

      setRequestSubmitted(true);
      setSelectedDates([]);
      setSelectedTimes([]);
      setSymptoms('');
      setSelectedAnimal(null);
      setSelectedVet(null);
    } catch (err) {
      console.error('Failed to submit appointment request:', err);
      setRequestError('Failed to send request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] py-4">
      <div className="container mx-auto px-2 max-w-10xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Appointment Slots</h1>
          <p className="text-slate-600">Request available time slots and let the doctor approve the final appointment before payment.</p>
        </div>

        <div className="flex items-center justify-between mb-6 max-w-3xl mx-auto overflow-x-auto py-2 px-1 gap-4">
          {['Select Animal', 'Select Vet', 'Details', 'Confirm'].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${step >= i + 1 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > i + 1 ? <CheckCircle2 size={20} /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${step >= i + 1 ? 'text-green-600' : 'text-slate-400'}`}>{s}</span>
              {i < 3 && (
                <div className={`absolute top-5 left-10 w-[calc(100%+3rem)] h-[2px] -translate-y-1/2 ${step > i + 1 ? 'bg-green-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {step === 1 && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-slate-800">Select Your Animal</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search your animals..."
                    className="pl-9"
                    value={searchAnimal}
                    onChange={(e) => setSearchAnimal(e.target.value)}
                  />
                </div>
              </div>

              {loadingAnimals ? (
                <p className="text-slate-500">Loading animals...</p>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4 mb-6">
                  {filteredAnimals.map((animal) => (
                    <Card
                      key={animal.id}
                      className={`p-4 cursor-pointer hover:border-green-500 transition-all hover:shadow-md ${selectedAnimal === animal.id ? 'border-2 border-green-500 bg-green-50 shadow-md' : 'border border-slate-200'}`}
                      onClick={() => setSelectedAnimal(animal.id)}
                    >
                      <div className="flex gap-4">
                        <img 
                          src={
                            animal.image && animal.image.startsWith('/uploads/') 
                              ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${animal.image}` 
                              : (animal.image || SPECIES_IMAGES[animal.species] || SPECIES_IMAGES.Other)
                          } 
                          alt={animal.name} 
                          className="w-20 h-20 rounded-lg object-cover" 
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-lg text-slate-900">{animal.name}</h3>
                            <div className="flex items-center gap-2">
                              {selectedAnimal === animal.id && (
                                <CheckCircle2 size={20} className="text-green-600" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAnimalClick(e, animal.id)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all active:scale-90"
                                title="Delete Profile"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-green-600 mb-1">{animal.breed || 'Unknown'}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <Badge variant="default" className="text-[10px] bg-slate-100 text-slate-600">{animal.species || 'Animal'}</Badge>
                            <span>{animal.age || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="p-4 border-2 border-dashed border-slate-300 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all group" onClick={() => setShowAddAnimalModal(true)}>
                <div className="flex items-center justify-center gap-3 text-slate-600 group-hover:text-green-600 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Add New Animal</h3>
                    <p className="text-sm">Register a new animal to your profile</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                <Button onClick={() => setStep(2)} disabled={!selectedAnimal}>
                  Continue to Select Vet <ChevronRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-slate-800">Select a Veterinarian</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search by name or specialty..."
                    className="pl-9"
                    value={searchVet}
                    onChange={(e) => setSearchVet(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {filteredVets.map((vet) => (
                  <Card
                    key={vet.id}
                    className={`p-4 cursor-pointer hover:border-green-500 transition-colors ${selectedVet === vet.id ? 'border-2 border-green-500 bg-green-50' : 'border border-slate-200'}`}
                    onClick={() => setSelectedVet(vet.id)}
                  >
                    <div className="flex gap-4">
                      <img src={vet.image} alt={vet.name} className="w-24 h-24 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-slate-900">{vet.name}</h3>
                          {vet.available ? (
                            <Badge variant="success" className="text-[10px] uppercase tracking-wider">Available Now</Badge>
                          ) : (
                            <Badge className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500">Offline</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-green-600 mb-1">{vet.spec}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> {vet.rating}</span>
                          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-blue-500" /> {vet.exp}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} disabled={!selectedVet}>Continue to Details <ChevronRight size={16} className="ml-2" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-4 sm:p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Consultation Details</h2>

              <div className="space-y-6 max-w-7xl">
                {getSelectedAnimal() && (
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Selected Animal Details
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                          src={
                            getSelectedAnimal().image && getSelectedAnimal().image.startsWith('/uploads/') 
                              ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${getSelectedAnimal().image}` 
                              : (getSelectedAnimal().image || SPECIES_IMAGES[getSelectedAnimal().species] || SPECIES_IMAGES.Other)
                          }
                          alt={getSelectedAnimal().name}
                          className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-sm"
                        />
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-slate-900 mb-1">{getSelectedAnimal().name}</h4>
                        <p className="text-sm font-medium text-green-700 mb-3">{getSelectedAnimal().species || getSelectedAnimal().breed || 'Animal'}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-slate-500">Type:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().breed || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Age:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().age || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Weight:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().weight || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Tag ID:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().id || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500">Last Checkup:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().lastCheckup || getSelectedAnimal().lastVisit || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Consultation Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setConsultType('video')}
                      className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-semibold transition-colors ${consultType === 'video' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <Video size={24} className={consultType === 'video' ? 'text-green-600' : 'text-slate-400'} />
                      Video Call
                    </button>
                    <button
                      onClick={() => setConsultType('chat')}
                      className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-semibold transition-colors ${consultType === 'chat' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <MessageCircle size={24} className={consultType === 'chat' ? 'text-green-600' : 'text-slate-400'} />
                      Chat / Messages
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Describe Symptoms</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                    placeholder="Describe what's wrong with your animal... (e.g., loss of appetite, lethargy, coughing)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Upload Images (Optional)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />

                    <label htmlFor="imageUpload" className="cursor-pointer">
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">
                        SVG, PNG, JPG or GIF (max. 5MB)
                      </p>
                    </label>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {uploadedImages.map((file, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(file)}
                        alt="upload preview"
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Choose Requested Dates & Time Slots</label>
                  <p className="text-xs text-slate-500 mb-4">Request one or more available slots and let the doctor choose the final appointment.</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Calendar Section */}
                    <div>
                      <div className="border border-slate-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <ChevronRight size={16} className="rotate-180 text-slate-600" />
                          </button>
                          <h4 className="font-semibold text-sm text-slate-700">
                            {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <ChevronRight size={16} className="text-slate-600" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-center text-[10px] font-semibold text-slate-400 py-1">{day}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const startOfMonth = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
                            const daysInMonth = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate();
                            const emptyCells = Array(startOfMonth.getDay()).fill(null);
                            const today = new Date();
                            return (
                              <>
                                {emptyCells.map((_, i) => (
                                  <div key={`empty-${i}`} className="aspect-square"></div>
                                ))}
                                {Array.from({ length: daysInMonth }, (_, i) => {
                                  const day = i + 1;
                                  const date = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
                                  const isToday =
                                    today.getFullYear() === date.getFullYear() &&
                                    today.getMonth() === date.getMonth() &&
                                    today.getDate() === date.getDate();
                                  const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                  const isSelected = selectedDates.some((selectedDate) => areSameDate(selectedDate, date));
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      disabled={isPast}
                                      onClick={() => !isPast && toggleDateSelection(date)}
                                      className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                                        isPast
                                          ? 'text-slate-300 cursor-not-allowed'
                                          : isSelected
                                          ? 'bg-green-600 text-white shadow-inner'
                                          : isToday
                                          ? 'border border-green-500 text-slate-700 hover:bg-green-50'
                                          : 'text-slate-700 hover:bg-green-50'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                          {selectedDates.length === 0 ? (
                            <span className="text-slate-400">Select one or more dates from the calendar.</span>
                          ) : (
                            selectedDates.map((date) => (
                              <span key={formatDateKey(date)} className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] text-slate-700">
                                <CalendarIcon size={12} /> {formatDateLabel(date)}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Slots Section - Grouped by Date with Consultation Type Filtering */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                        Selected Dates & Available {consultType === 'video' ? 'Video Call' : 'Chat'} Slots
                        {selectedVet && (
                          <span className="ml-2 text-green-600 font-medium">
                            (from {getSelectedVet()?.name || 'Doctor'}'s schedule)
                          </span>
                        )}
                      </p>

                      {!selectedVet ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <Clock size={32} className="mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Please select a veterinarian first</p>
                        </div>
                      ) : selectedDates.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <CalendarIcon size={32} className="mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Please select one or more dates from the calendar</p>
                        </div>
                      ) : loadingSlots ? (
                        <div className="text-center py-8 text-slate-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-sm">Loading available slots...</p>
                        </div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className="text-center py-8 text-amber-600 bg-amber-50 rounded-xl border border-amber-200">
                          <AlertCircle size={24} className="mx-auto mb-2" />
                          <p className="text-sm font-medium">No available slots found</p>
                          <p className="text-xs mt-1 text-amber-500">The doctor has no available slots for the selected dates.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          {selectedDates.map((date) => {
                            const formattedDate = formatDateKey(date);
                            const dateLabel = formatDateLabel(date);
                            
                            // Filter slots by date AND consultation type
                            const slotsForDate = availableTimeSlots.filter(slot => {
                              // Check date match
                              const slotDate = slot.slot_date || slot.date;
                              let slotDateStr = '';
                              
                              if (slotDate) {
                                if (typeof slotDate === 'string') {
                                  slotDateStr = slotDate.split('T')[0];
                                } else {
                                  const d = new Date(slotDate);
                                  slotDateStr = formatDateKey(d);
                                }
                              }
                              
                              // Check consultation type match
                              const slotType = slot.consultation_type || slot.type || 'video';
                              const matchesType = slotType === consultType;
                              
                              return slotDateStr === formattedDate && matchesType;
                            });
                            
                            return (
                              <div key={formattedDate} className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-700">
                                    <CalendarIcon size={14} className="inline mr-2 text-green-600" />
                                    {dateLabel}
                                  </span>
                                  <Badge className="bg-green-100 text-green-700 text-[10px]">
                                    {slotsForDate.length} slot{slotsForDate.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <div className="p-3">
                                  {slotsForDate.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {slotsForDate.map((slot) => {
                                        const timeLabel = normalizeTimeToLabel(slot.slot_time || slot.time);
                                        const isSelected = selectedTimes.includes(timeLabel);
                                        
                                        return (
                                          <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => toggleTimeSelection(timeLabel)}
                                            className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                                              isSelected
                                                ? 'bg-green-600 border-green-600 text-white'
                                                : 'border-slate-200 text-slate-700 hover:border-green-300 hover:bg-slate-50'
                                            }`}
                                          >
                                            <span className="flex items-center gap-2 justify-center">
                                              <Clock size={12} /> {timeLabel}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 text-center py-2">
                                      No {consultType === 'video' ? 'Video Call' : 'Chat'} slots available for this date
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="mt-3 text-sm text-slate-500 text-center">
                            {selectedTimes.length === 0 
                              ? `Select ${consultType === 'video' ? 'Video Call' : 'Chat'} time slots from the dates above` 
                              : `${selectedTimes.length} time slot${selectedTimes.length > 1 ? 's' : ''} selected across ${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={selectedDates.length === 0 || selectedTimes.length === 0}
                  >Review & Request <ChevronRight size={16} className="ml-2" /></Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-4 sm:p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Review Your Request</h2>
              <p className="text-sm text-slate-600 mb-6">Request available time slots for doctor approval. The doctor will choose one final slot and then you can confirm and pay.</p>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="p-6 bg-slate-50 border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Consultation Summary</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Doctor</span>
                      <span className="font-medium text-slate-900">{getSelectedVet()?.name || 'Dr. Sarah Smith'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Specialty</span>
                      <span className="font-medium text-slate-900">{getSelectedVet()?.spec || 'Livestock & Large Animals'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient</span>
                      <span className="font-medium text-slate-900">{getSelectedAnimal()?.name || 'Bessie'} ({getSelectedAnimal()?.species || 'Animal'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Consultation Type</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        {consultType === 'video' ? (
                          <>
                            <Video size={14} className="text-green-600" /> 
                            Video Call
                          </>
                        ) : (
                          <>
                            <MessageCircle size={14} className="text-green-600" /> 
                            Chat / Messages
                          </>
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-slate-500">Requested Availability</span>
                      <div className="grid gap-2">
                        {selectedDates.map((date) => (
                          <div key={formatDateKey(date)} className="flex flex-wrap gap-2 items-center rounded-lg border border-slate-200 bg-white p-3">
                            <span className="text-slate-700 font-semibold">{formatDateLabel(date)}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-700">{selectedTimes.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {symptoms && (
                      <div>
                        <span className="text-slate-500">Symptoms / Notes</span>
                        <p className="mt-1 text-slate-800">{symptoms}</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6 bg-slate-50 border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Request Status</h3>
                  <div className="space-y-4 text-sm">
                    <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
                      <p className="font-semibold text-slate-800">Pending Approval</p>
                      <p className="text-slate-600 text-sm mt-1">Doctor will review your suggested availability and select the final slot. Payment is requested only after confirmation.</p>
                    </div>
                  </div>
                </Card>
              </div>

              {requestError && <p className="text-sm text-red-600 mb-4">{requestError}</p>}
              {requestSubmitted && submissionMessage && <p className="text-sm text-green-700 mb-4">{submissionMessage}</p>}

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button
                  size="lg"
                  className="w-48"
                  disabled={selectedDates.length === 0 || selectedTimes.length === 0 || isSubmittingRequest}
                  onClick={handleSubmitAppointmentRequest}
                >
                  {isSubmittingRequest ? 'Submitting...' : resubmitAppointmentId ? 'Resubmit Request' : 'Submit Request'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Animal Modal */}
      {showAddAnimalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Register New Animal</h2>
              <button
                onClick={() => {
                  setFormImageFile(null);
                  setShowAddAnimalModal(false);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddAnimalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Animal Name *</label>
                <Input
                  type="text"
                  name="name"
                  value={addAnimalForm.name}
                  onChange={handleAddAnimalChange}
                  placeholder="e.g., Bessie"
                  required
                  className="w-full"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Species *</label>
                  <select
                    name="species"
                    value={addAnimalForm.species}
                    onChange={handleAddAnimalChange}
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cattle">Cattle</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Horse">Horse</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Poultry">Poultry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Breed *</label>
                  <Input
                    type="text"
                    name="breed"
                    value={addAnimalForm.breed}
                    onChange={handleAddAnimalChange}
                    placeholder="e.g., Holstein"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              {/* Age Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Age *</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Years</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={addAnimalForm.ageYears}
                      onChange={(e) => setAddAnimalForm(prev => ({ ...prev, ageYears: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) }))}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Months</span>
                    <Input
                      type="number"
                      min="0"
                      max="11"
                      value={addAnimalForm.ageMonths}
                      onChange={(e) => setAddAnimalForm(prev => ({ ...prev, ageMonths: Math.min(11, Math.max(0, parseInt(e.target.value, 10) || 0)) }))}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Days</span>
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      value={addAnimalForm.ageDays}
                      onChange={(e) => setAddAnimalForm(prev => ({ ...prev, ageDays: Math.min(31, Math.max(0, parseInt(e.target.value, 10) || 0)) }))}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Weight *</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="150"
                    name="weight"
                    value={addAnimalForm.weight}
                    onChange={handleAddAnimalChange}
                    placeholder="e.g., 45.5"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={addAnimalForm.status}
                    onChange={handleAddAnimalChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </div>

              {/* Health Report / Vaccination Card Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Health Report / Vaccination Card</label>
                <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormHealthReportFile(e.target.files[0]);
                      }
                    }}
                    id="schedulingHealthReport"
                    className="hidden"
                  />
                  <label
                    htmlFor="schedulingHealthReport"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                  >
                    Upload File
                  </label>
                  {formHealthReportFile ? (
                    <span className="text-xs text-slate-600 font-medium truncate">{formHealthReportFile.name}</span>
                  ) : (
                    <span className="text-xs text-slate-400">PDF, JPG, PNG, DOC (Optional)</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Picture (Optional)</label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <img 
                    src={
                      formImageFile 
                        ? URL.createObjectURL(formImageFile) 
                        : (SPECIES_IMAGES[addAnimalForm.species] || SPECIES_IMAGES.Other)
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
                      id="animalImageUploadScheduling"
                      className="hidden"
                    />
                    <label 
                      htmlFor="animalImageUploadScheduling"
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
                    <p className="text-[10px] text-slate-400">PNG, JPG or JPEG. If left empty, default picture is used.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormImageFile(null);
                    setShowAddAnimalModal(false);
                  }}
                  disabled={addingAnimal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addingAnimal}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addingAnimal ? 'Adding...' : 'Add Animal'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900">Unregister Animal?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to unregister this animal? This profile will be permanently deleted and all past medical history files will be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingAnimalId(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAnimal}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Unregister'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}