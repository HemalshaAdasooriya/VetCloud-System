import { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/appointments/vet/${user.id}`
      );
      setAppointments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/appointments/${id}/${status}`
      );
      fetchAppointments();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Doctor Schedule</h1>

      {appointments.map(a => (
        <div key={a.id} className="border p-3 mb-3 rounded">
          <p><b>Animal:</b> {a.animal_name}</p>
          <p><b>Date:</b> {a.appointment_date}</p>
          <p><b>Time:</b> {a.appointment_time}</p>
          <p><b>Status:</b> {a.status}</p>

          {a.status === "Pending" && (
            <div className="flex gap-2 mt-2">
              <button
                className="bg-green-600 text-white px-3 py-1"
                onClick={() => updateStatus(a.id, "approve")}
              >
                Approve
              </button>

              <button
                className="bg-red-600 text-white px-3 py-1"
                onClick={() => updateStatus(a.id, "reject")}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}