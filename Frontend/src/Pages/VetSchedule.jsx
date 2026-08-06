import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, Plus, Trash2, Check, X, AlertCircle, Loader2
} from 'lucide-react';
import { Button, Card, Badge } from '../components/Ui/ui';

export default function VetSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('09:00');
  const [newSlotType, setNewSlotType] = useState('video');
  const [monthSlots, setMonthSlots] = useState({});

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  // Get vet ID from localStorage with fallback
  const getVetId = () => {
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return u.id || u.vetId || u.user_id || null;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
    // return localStorage.getItem('userId');
  };

  // Fetch schedule for current month
  useEffect(() => {
    fetchMonthSchedule();
  }, [currentMonth]);

  // Fetch schedule for selected date when it changes
  useEffect(() => {
    if (selectedDate) {
      fetchScheduleForDate(selectedDate);
    }
  }, [selectedDate]);

  // Fetch schedule for the month
  const fetchMonthSchedule = async () => {
    try {
      const vetId = getVetId();
      if (!vetId) return;

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await axios.get(
        `${API_BASE}/api/schedule/vet/${vetId}/month/${year}/${month}`
        // `http://localhost:5000/api/schedule/vet/${vetId}/month/${year}/${month}`
      );
      
      const grouped = {};
      response.data.forEach(slot => {
        const date = new Date(slot.slot_date).getDate();
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(slot);
      });
      setMonthSlots(grouped);
    } catch (err) {
      console.error('Error fetching month schedule:', err);
    }
  };

  // Fetch schedule for a specific date
  const fetchScheduleForDate = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const vetId = getVetId();
      if (!vetId) {
        throw new Error('Veterinarian ID not found');
      }

      const formattedDate = formatDateForAPI(date);
      const response = await axios.get(
        `${API_BASE}/api/schedule/vet/${vetId}/date/${formattedDate}`
        // `http://localhost:5000/api/schedule/vet/${vetId}/date/${formattedDate}`
      );
      
      const slots = response.data.map(slot => ({
        id: slot.id,
        time: formatTimeForDisplay(slot.slot_time),
        type: slot.consultation_type,
        isBooked: slot.is_booked === 1,
        appointmentId: slot.appointment_id
      }));
      
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format time for display (HH:MM AM/PM)
  const formatTimeForDisplay = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Format time for API (HH:MM:SS)
  const formatTimeForAPI = (timeStr) => {
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minutes}:00`;
  };

  // Check if a date has slots
  const hasSlotsForDate = (day) => {
    return monthSlots[day] && monthSlots[day].length > 0;
  };

  // Handle adding a new slot
  const handleAddSlot = async () => {
    if (!newSlotTime) return;

    setLoading(true);
    try {
      const vetId = getVetId();
      if (!vetId) throw new Error('Veterinarian ID not found');

      const formattedDate = formatDateForAPI(selectedDate);
      const formattedTime = formatTimeForAPI(newSlotTime);

      await axios.post(`${API_BASE}/api/schedule/vet/${vetId}/slot`, {
      // await axios.post(`http://localhost:5000/api/schedule/vet/${vetId}/slot`, {
        slot_date: formattedDate,
        slot_time: formattedTime,
        consultation_type: newSlotType
      });

      setSuccessMessage('Slot added successfully!');
      setIsAdding(false);
      setNewSlotTime('09:00');
      setNewSlotType('video');
      
      await fetchScheduleForDate(selectedDate);
      await fetchMonthSchedule();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding slot:', err);
      setError('Failed to add slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a slot
  const handleRemoveSlot = async (id, time, isBooked) => {
    if (isBooked) {
      alert("Cannot remove a slot that is already booked.");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove the slot at ${time}?`)) return;

    setLoading(true);
    try {
      const vetId = getVetId();
      if (!vetId) throw new Error('Veterinarian ID not found');

      await axios.delete(`${API_BASE}/api/schedule/vet/${vetId}/slot/${id}`);
      // await axios.delete(`http://localhost:5000/api/schedule/vet/${vetId}/slot/${id}`);

      setSuccessMessage('Slot removed successfully!');
      
      await fetchScheduleForDate(selectedDate);
      await fetchMonthSchedule();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error removing slot:', err);
      setError(err.response?.data?.message || 'Failed to remove slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing all slots for a day
  const handleClearDay = async () => {
    if (!window.confirm('Are you sure you want to clear all slots for this day?')) return;

    setLoading(true);
    try {
      const vetId = getVetId();
      if (!vetId) throw new Error('Veterinarian ID not found');

      const formattedDate = formatDateForAPI(selectedDate);
      await axios.delete(`${API_BASE}/api/schedule/vet/${vetId}/day/${formattedDate}`);
      // await axios.delete(`http://localhost:5000/api/schedule/vet/${vetId}/day/${formattedDate}`);

      setSuccessMessage('All slots cleared successfully!');
      
      await fetchScheduleForDate(selectedDate);
      await fetchMonthSchedule();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error clearing slots:', err);
      setError('Failed to clear slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle applying template
  const handleApplyTemplate = async () => {
    const sourceDate = prompt('Enter the source date (YYYY-MM-DD) to copy from:');
    if (!sourceDate) return;

    const targetDate = formatDateForAPI(selectedDate);
    
    if (!window.confirm(`Copy slots from ${sourceDate} to ${targetDate}?`)) return;

    setLoading(true);
    try {
      const vetId = getVetId();
      if (!vetId) throw new Error('Veterinarian ID not found');

      await axios.post(`${API_BASE}/api/schedule/vet/${vetId}/template`, {
      // await axios.post(`http://localhost:5000/api/schedule/vet/${vetId}/template`, {
        source_date: sourceDate,
        target_date: targetDate
      });

      setSuccessMessage('Template applied successfully!');
      
      await fetchScheduleForDate(selectedDate);
      await fetchMonthSchedule();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error applying template:', err);
      setError('Failed to apply template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate month
  const changeMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  // Get consultation type label
  const getTypeLabel = (type) => {
    switch(type) {
      case 'video': return 'Video Call';
      case 'chat': return 'Chat Consultation';
      case 'both': return 'Video or Chat';
      default: return 'Unknown';
    }
  };

  // Get consultation type color
  const getTypeColor = (type) => {
    switch(type) {
      case 'video': return 'bg-blue-100 text-blue-700';
      case 'chat': return 'bg-purple-100 text-purple-700';
      case 'both': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Generate days for the month
  const daysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = daysInMonth();

  // Loading state
  if (loading && availableSlots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Schedule</h2>
          <p className="text-slate-500">Set your availability for video calls and chat consultations</p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={18} />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Side */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Select Date</h3>
              <div className="flex items-center gap-2">
                <button 
                  className="p-1 text-slate-400 hover:text-slate-600"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-slate-600">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  className="p-1 text-slate-400 hover:text-slate-600"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-semibold text-slate-400 py-1">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }
                const isSelected = selectedDate.getDate() === day && 
                  selectedDate.getMonth() === currentMonth.getMonth();
                const hasSlots = hasSlotsForDate(day);
                
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setDate(day);
                      setSelectedDate(newDate);
                    }}
                    className={`
                      aspect-square rounded-full flex flex-col items-center justify-center text-sm relative transition-all
                      ${isSelected ? 'bg-green-600 text-white shadow-md font-bold' : 'hover:bg-slate-100 text-slate-700'}
                    `}
                  >
                    <span>{day}</span>
                    {hasSlots && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-green-500 absolute bottom-1"></span>
                    )}
                    {hasSlots && isSelected && (
                      <span className="w-1 h-1 rounded-full bg-white absolute bottom-1"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5 border-slate-200 shadow-sm bg-blue-50/50">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle size={18} className="text-blue-500" />
              Quick Actions
            </h3>
            <p className="text-sm text-slate-600 mb-4">Manage your daily schedule.</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border-red-200"
                onClick={handleClearDay}
                disabled={loading}
              >
                Clear all slots for this day
              </Button>
            </div>
          </Card>
        </div>

        {/* Time Slots Side */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 border-slate-200 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarIcon size={20} className="text-green-600" />
                  Availability for {selectedDate.toLocaleDateString('default', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Manage time slots and consultation types for this specific day.</p>
              </div>
              <Button 
                onClick={() => setIsAdding(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm"
                disabled={loading}
              >
                <Plus size={16} className="mr-2" /> Add Slot
              </Button>
            </div>

            {/* Add Slot Form */}
            {isAdding && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 animate-in slide-in-from-top-2">
                <h4 className="font-medium text-slate-800 mb-3">Add New Time Slot</h4>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
                    <select 
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[120px]"
                    >
                      <option value="08:00">08:00 AM</option>
                      <option value="08:30">08:30 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="09:30">09:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="13:30">01:30 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="14:30">02:30 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="15:30">03:30 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="16:30">04:30 PM</option>
                      <option value="17:00">05:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Type</label>
                    <select 
                      value={newSlotType}
                      onChange={(e) => setNewSlotType(e.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]"
                    >
                      <option value="video">Video Call</option>
                      <option value="chat">Chat Consultation</option>
                    </select>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={() => setIsAdding(false)} disabled={loading}>Cancel</Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white" 
                      onClick={handleAddSlot}
                      disabled={loading}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Slots List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-green-600" />
                </div>
              ) : availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <div 
                    key={slot.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      slot.isBooked 
                        ? 'bg-slate-50 border-slate-200 opacity-80' 
                        : 'bg-white border-slate-200 hover:border-green-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-md ${slot.isBooked ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className={`font-semibold ${slot.isBooked ? 'text-slate-600' : 'text-slate-900'}`}>{slot.time}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(slot.type)}`}>
                             {getTypeLabel(slot.type)}
                          </span>
                          {slot.isBooked && (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 h-4 border-none">Booked</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {slot.isBooked ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-slate-600 text-xs"
                          onClick={() => alert(`View appointment #${slot.appointmentId}`)}
                        >
                          View Booking
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                          onClick={() => handleRemoveSlot(slot.id, slot.time, slot.isBooked)}
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <CalendarIcon size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-600">No availability set</p>
                  <p className="text-sm mt-1">You haven't added any open slots for this date.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAdding(true)}
                  >
                    Add Your First Slot
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
