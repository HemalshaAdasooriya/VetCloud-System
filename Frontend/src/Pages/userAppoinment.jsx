import { useEffect, useState } from "react";
import axios from "axios";

export default function UserAppoinment() {
  const [appointments, setAppointments] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/appointments/owner/${user.id}`
      );
      setAppointments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Appointments</h1>

      {appointments.map(a => (
        <div key={a.id} className="border p-3 mb-3 rounded">
          <p><b>Vet:</b> {a.veterinarian_name}</p>
          <p><b>Animal:</b> {a.animal_name}</p>
          <p><b>Date:</b> {a.appointment_date}</p>
          <p><b>Time:</b> {a.appointment_time}</p>
          <p><b>Status:</b> {a.status}</p>
        </div>
      ))}
    </div>
  );
}