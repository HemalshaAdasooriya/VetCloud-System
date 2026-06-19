import { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/appointments/vet/${user.id}`);
      setAppointments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

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
    } catch (e) {
      // fallback when reason is plain text
    }
    return { notes: reason, availability: [] };
  };

  const handleSelectSlot = (appointmentId, slot) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [appointmentId]: slot
    }));
  };

  const updateStatus = async (id, status, payload = null) => {
    try {
      if (status === "approve" && payload) {
        await axios.patch(`http://localhost:5000/api/appointments/${id}/approve`, payload);
      } else {
        await axios.patch(`http://localhost:5000/api/appointments/${id}/${status}`);
      }
      fetchAppointments();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Doctor Schedule</h1>

      {appointments.map((a) => {
        const request = parseRequestPayload(a.reason);
        const selectedSlot = selectedSlots[a.id] || "";

        return (
          <div key={a.id} className="border p-3 mb-3 rounded bg-white shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p><b>Animal:</b> {a.animal_name}</p>
                <p><b>Owner:</b> {a.owner_name}</p>
                <p><b>Status:</b> {a.status}</p>
                {a.appointment_date && a.appointment_time ? (
                  <p><b>Confirmed Slot:</b> {a.appointment_date} at {a.appointment_time}</p>
                ) : (
                  <p className="text-sm text-slate-500">No final slot confirmed yet.</p>
                )}
              </div>

              <div>
                <p className="font-semibold">Requested Availability</p>
                {request.availability.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {request.availability.map((slot, index) => (
                      <div key={`${a.id}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                        {slot.date} · {slot.time}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">No requested availability available.</p>
                )}
              </div>
            </div>

            {request.notes && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold">Owner Notes</p>
                <p>{request.notes}</p>
              </div>
            )}

            {a.status === "Pending" && request.availability.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <label className="font-medium">Choose final slot</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => handleSelectSlot(a.id, e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2 md:w-auto"
                  >
                    <option value="">Select a slot</option>
                    {request.availability.map((slot, index) => (
                      <option key={`${a.id}-slot-${index}`} value={`${slot.date}|${slot.time}`}>
                        {slot.date} · {slot.time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={!selectedSlot}
                    onClick={() => {
                      const [appointment_date, appointment_time] = selectedSlot.split("|");
                      updateStatus(a.id, "approve", { appointment_date, appointment_time });
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    onClick={() => updateStatus(a.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}