import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const parseRequestPayload = (reason) => {
  if (!reason) return { notes: "", availability: [] };
  try {
    const parsed = JSON.parse(reason);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.availability)) {
      return {
        notes: parsed.notes || "",
        availability: parsed.availability
      };
    }
  } catch {
    // Reason may be plain text if not structured.
  }
  return { notes: reason, availability: [] };
};

export default function UserAppoinment() {
  const navigate = useNavigate();
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Appointments</h1>

      {appointments.map((a) => {
        const request = parseRequestPayload(a.reason);

        return (
          <div key={a.id} className="border p-4 mb-4 rounded bg-white shadow-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p><b>Vet:</b> {a.veterinarian_name}</p>
                <p><b>Animal:</b> {a.animal_name}</p>
                <p><b>Status:</b> {a.status}</p>
              </div>
              <div>
                {a.appointment_date && a.appointment_time ? (
                  <p><b>Final Appointment:</b> {a.appointment_date} at {a.appointment_time}</p>
                ) : (
                  <p className="text-sm text-slate-500">Waiting for doctor confirmation.</p>
                )}
              </div>
            </div>

            {request.availability.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">Requested Availability</p>
                <div className="mt-2 grid gap-2">
                  {request.availability.map((slot, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 bg-white p-2 text-sm">
                      {slot.date} · {slot.time}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {request.notes && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold">Symptoms / Notes</p>
                <p>{request.notes}</p>
              </div>
            )}

            {a.status === "Pending" && (
              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-slate-700">
                Your request is pending doctor approval. The doctor will select one of your requested slots, then you can confirm and pay.
              </div>
            )}
            {a.status === "Rejected" && (
              <div className="mt-4 grid gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-slate-700">
                <p>Your request was rejected. Please reselect availability and submit again.</p>
                <button
                  className="inline-flex items-center justify-center rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  onClick={() => navigate('/dashboard/user/appoinment', {
                    state: { resubmitAppointmentId: a.id }
                  })}
                >
                  Resubmit Availability
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}