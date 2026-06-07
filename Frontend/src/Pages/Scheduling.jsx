import { useState } from "react";
import axios from "axios";
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
  Plus
} from "lucide-react";

import { Button, Card, Input, Badge } from "../components/ui/ui";

export default function Scheduling() {
  const [step, setStep] = useState(1);
  const [consultType, setConsultType] = useState("video");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

  const vets = [
    { id: 1, name: "Dr. Sarah Smith", spec: "Livestock & Large Animals", exp: "10 Years", rating: 4.9, available: true, image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" },
    { id: 2, name: "Dr. John Doe", spec: "Small Pets & Exotics", exp: "8 Years", rating: 4.8, available: true, image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop" },
    { id: 3, name: "Dr. Emily Chen", spec: "Poultry & Swine", exp: "12 Years", rating: 5.0, available: false, image: "https://images.unsplash.com/photo-1594824432258-0056973ece6c?q=80&w=2070&auto=format&fit=crop" }
  ];

  const animals = [
    { id: 1, name: "Bessie", type: "Cattle", species: "Holstein Cow", age: "4 years", weight: "650 kg", tagNumber: "CT-001", lastCheckup: "Oct 10, 2024", image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=2072&auto=format&fit=crop" },
    { id: 2, name: "Max", type: "Dog", species: "Golden Retriever", age: "2 years", weight: "32 kg", tagNumber: "DG-002", lastCheckup: "Sep 24, 2024", image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?q=80&w=2070&auto=format&fit=crop" },
    { id: 3, name: "Daisy", type: "Goat", species: "Boer Goat", age: "1 year", weight: "45 kg", tagNumber: "GT-003", lastCheckup: "Aug 15, 2024", image: "https://images.unsplash.com/photo-1533318087102-b3ad366ed041?q=80&w=2070&auto=format&fit=crop" },
    { id: 4, name: "Charlie", type: "Horse", species: "Arabian", age: "6 years", weight: "450 kg", tagNumber: "HR-004", lastCheckup: "Nov 01, 2024", image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop" }
  ];

  const user = JSON.parse(localStorage.getItem("user"));

  const bookAppointment = async () => {
    if (!selectedAnimal || !selectedVet || !selectedDate || !selectedTime) {
      alert("Please complete all steps");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/appointments", {
        pet_owner_id: user.id,
        veterinarian_id: selectedVet,
        animal_id: selectedAnimal,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        reason: "General checkup"
      });

      alert("Appointment booked successfully!");
      setStep(1);

      setSelectedAnimal(null);
      setSelectedVet(null);
      setSelectedDate(null);
      setSelectedTime(null);

    } catch (err) {
      console.log(err);
      alert("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto max-w-5xl px-4">

        <h1 className="text-3xl font-bold mb-6">Book Appointment</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 className="font-bold mb-4">Select Animal</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {animals.map(a => (
                <Card
                  key={a.id}
                  className={`p-3 cursor-pointer ${selectedAnimal === a.id ? "border-green-600 border-2" : ""}`}
                  onClick={() => setSelectedAnimal(a.id)}
                >
                  {a.name}
                </Card>
              ))}
            </div>

            <Button className="mt-4" onClick={() => setStep(2)} disabled={!selectedAnimal}>
              Next
            </Button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2 className="font-bold mb-4">Select Vet</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {vets.map(v => (
                <Card
                  key={v.id}
                  className={`p-3 cursor-pointer ${selectedVet === v.id ? "border-green-600 border-2" : ""}`}
                  onClick={() => setSelectedVet(v.id)}
                >
                  {v.name}
                </Card>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedVet}>Next</Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 className="font-bold mb-4">Select Date & Time</h2>

            <div className="mb-3">
              <input
                type="date"
                className="border p-2"
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["09:00", "10:30", "13:00", "14:30", "16:00"].map(t => (
                <button
                  key={t}
                  className={`p-2 border ${selectedTime === t ? "bg-green-600 text-white" : ""}`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2 className="font-bold mb-4">Confirm</h2>

            <p>Animal ID: {selectedAnimal}</p>
            <p>Vet ID: {selectedVet}</p>
            <p>Date: {selectedDate}</p>
            <p>Time: {selectedTime}</p>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>

              <Button onClick={bookAppointment} disabled={loading}>
                {loading ? "Booking..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}