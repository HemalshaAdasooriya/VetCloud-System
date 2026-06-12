import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, Plus, Trash2, Check, AlertCircle
} from 'lucide-react';
import { Button, Card, Badge } from "../components/Ui/ui"; 

export default function DoctorSchedule() {
  // ── LIVE CALENDAR STATE ────────────────────────────────────────────────
  const [currentViewDate, setCurrentViewDate] = useState(new Date()); // Tracks the month being viewed
  const [selectedDate, setSelectedDate] = useState(new Date()); // Tracks the specifically clicked day
  
  // ── DATA STATE ─────────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  
  // Mock data for slots to manage on the right side
  const [availableSlots, setAvailableSlots] = useState([
    { id: 1, time: '09:00 AM', type: 'video' },
    { id: 3, time: '10:00 AM', type: 'clinic' },
  ]);

  const [newSlotTime, setNewSlotTime] = useState('04:00 PM');
  const [newSlotType, setNewSlotType] = useState('video');
  const [isAdding, setIsAdding] = useState(false);

  // ── FETCH APPOINTMENTS FROM BACKEND ────────────────────────────────────
  const fetchAppointments = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      
      if (user && user.id) {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/appointments/vet/${user.id}`
        );
        setAppointments(res.data);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ── CALENDAR LOGIC ──────────────────────────────────────────────────────
  const currentYear = currentViewDate.getFullYear();
  const currentMonthIndex = currentViewDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Find out how many days are in the current month, and what day of the week the 1st falls on
  const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Handlers to change months
  const handlePrevMonth = () => setCurrentViewDate(new Date(currentYear, currentMonthIndex - 1, 1));
  const handleNextMonth = () => setCurrentViewDate(new Date(currentYear, currentMonthIndex + 1, 1));

  // Helper function: Convert a JS Date to "YYYY-MM-DD" to compare with MySQL dates
  const formatDateToYMD = (dateObj) => {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  // Extract a clean array of dates (YYYY-MM-DD) that have appointments in the DB
  const scheduledDates = appointments.map(app => {
    const dbDate = new Date(app.appointment_date);
    return formatDateToYMD(dbDate);
  });

  // ── SLOT MANAGEMENT ─────────────────────────────────────────────────────
  const handleAddSlot = () => {
    if (newSlotTime) {
      setAvailableSlots([...availableSlots, { 
        id: Date.now(), 
        time: newSlotTime, 
        type: newSlotType 
      }].sort((a, b) => {
        const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
        const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
        return timeA - timeB;
      }));
      setIsAdding(false);
    }
  };

  const handleRemoveSlot = (id) => {
    setAvailableSlots(availableSlots.filter(slot => slot.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Schedule</h2>
          <p className="text-slate-500">Set your availability for consultations and clinic visits</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Check size={16} className="mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── CALENDAR COMPONENT ── */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Select Date</h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={16} /></button>
                <span className="text-sm font-medium text-slate-600 w-24 text-center">
                  {monthNames[currentMonthIndex]} {currentYear}
                </span>
                <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-semibold text-slate-400 py-1">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* Empty padding for the start of the month */}
              {blankDays.map((_, i) => <div key={`empty-${i}`} />)}
              
              {/* Actual Days */}
              {daysArray.map(day => {
                const cellDateObj = new Date(currentYear, currentMonthIndex, day);
                const cellDateString = formatDateToYMD(cellDateObj);

                // Check if the day is in the past
                const isPastDate = cellDateObj < today;
                
                // Check if this specific day is currently selected
                const isSelected = formatDateToYMD(selectedDate) === cellDateString;
                
                // Check if this day exists in the scheduledDates array from the database
                const hasSlots = scheduledDates.includes(cellDateString);

                const isToday = formatDateToYMD(today) === cellDateString;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(cellDateObj)}
                    disabled={isPastDate} // Prevents clicking on past days
                    className={`
                      aspect-square rounded-full flex flex-col items-center justify-center text-sm relative transition-all
                      ${isPastDate ? 'opacity-70 cursor-not-allowed text-slate-400 bg-slate-50/50' : 'hover:bg-green-300 text-slate-700'}
                      ${isSelected && !isPastDate ? 'bg-green-600 text-white shadow-md font-bold' : ''}

                      
                      ${isToday ? 'ring-1 ring-green-500 font-bold' : ''}
                    `}
                  >
                    <span>{day}</span>
                    
                    {/* Green Dot Logic (Only show if it's not a past date, or keep it if you want history) */}
                    {hasSlots && !isSelected && (
                      <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isPastDate ? 'bg-slate-300' : 'bg-green-500'}`}></span>
                    )}
                    {hasSlots && isSelected && !isPastDate && (
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
            <p className="text-sm text-slate-600 mb-4">Apply schedule templates to save time.</p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm bg-white">
                Apply "Standard Weekday" template
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm bg-white">
                Copy from previous week
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border-red-200">
                Clear all slots for this day
              </Button>
            </div>
          </Card>
        </div>

        {/* ── TIME SLOTS SIDE ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 border-slate-200 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarIcon size={20} className="text-green-600" />
                  Availability for {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Manage time slots and consultation types for this specific day.</p>
              </div>
              <Button 
                onClick={() => setIsAdding(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm"
              >
                <Plus size={16} className="mr-2" /> Add Slot
              </Button>
            </div>

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
                      <option>08:00 AM</option>
                      <option>08:30 AM</option>
                      <option>09:00 AM</option>
                      <option>04:00 PM</option>
                      <option>04:30 PM</option>
                      <option>05:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Type</label>
                    <select 
                      value={newSlotType}
                      onChange={(e) => setNewSlotType(e.target.value)}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]"
                    >
                      <option value="video">Video Only</option>
                      <option value="clinic">In-Clinic Only</option>
                      <option value="both">Video or In-Clinic</option>
                    </select>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAddSlot}>Add</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => {
                  return (
                    <div 
                      key={slot.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors bg-white border-slate-200 hover:border-green-300 hover:shadow-sm`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-md bg-green-100 text-green-700`}>
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{slot.time}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {slot.type === 'video' ? 'Video Only' : slot.type === 'clinic' ? 'In-Clinic Only' : 'Video or In-Clinic'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                          onClick={() => handleRemoveSlot(slot.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })
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