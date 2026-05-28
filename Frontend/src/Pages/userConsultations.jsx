// export default function UserConsultations() {
//     return (
//         <div className="p-4">
//             <h1 className="text-2xl font-bold mb-4">My Consultations</h1>
//             <p>This is where you can manage your consultations.</p>
//         </div>
//     );
// }

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Video, Calendar as CalendarIcon, Clock, CheckCircle2, MoreVertical, Search, FileText, AlertCircle, XCircle, HourglassIcon } from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/ui/ui';

export default function UserConsultations() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  const pendingConsultations = [
    {
      id: 3,
      clientName: 'John Smith',
      clientType: 'Dairy Farmer',
      animalName: 'Bessie (Cow)',
      date: 'Mar 25, 2026, 2:30 PM',
      type: 'Video Call',
      status: 'Pending Approval',
      statusType: 'pending',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
      requestedAt: '2 hours ago',
      symptoms: 'Loss of appetite, mild fever'
    },
    {
      id: 4,
      clientName: 'Emily Wilson',
      clientType: 'Pet Owner',
      animalName: 'Luna (Cat)',
      date: 'Mar 26, 2026, 11:00 AM',
      type: 'Clinic Visit',
      status: 'Pending Approval',
      statusType: 'pending',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop',
      requestedAt: '5 hours ago',
      symptoms: 'Skin irritation, excessive scratching'
    }
  ];

  const upcomingConsultations = [
    {
      id: 1,
      clientName: 'John Smith',
      clientType: 'Dairy Farmer',
      animalName: 'Bessie (Cow)',
      date: 'Today, 2:30 PM',
      type: 'Video Call',
      status: 'Approved by Doctor',
      statusType: 'approved',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
      doctor: 'Dr. Sarah Smith',
      approvedAt: 'Yesterday'
    },
    {
      id: 2,
      clientName: 'Sarah Jenkins',
      clientType: 'Pet Owner',
      animalName: 'Max (Dog)',
      date: 'Tomorrow, 10:00 AM',
      type: 'Clinic Visit',
      status: 'Approved by Doctor',
      statusType: 'approved',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop',
      doctor: 'Dr. James Wilson',
      approvedAt: '2 days ago'
    }
  ];

  const pastConsultations = [
    {
      id: 5,
      clientName: 'Mike Brown',
      clientType: 'Farmer',
      animalName: 'Herd A (Cattle)',
      date: 'Mar 15, 2026, 3:00 PM',
      type: 'Video Call',
      status: 'Completed',
      statusType: 'completed',
      image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=2072&auto=format&fit=crop',
      doctor: 'Dr. Sarah Smith',
      completedAt: '5 days ago'
    }
  ];

  const getStatusBadge = (statusType) => {
    switch(statusType) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
          <HourglassIcon size={14} />
          Pending Approval
        </Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
          <CheckCircle2 size={14} />
          Approved
        </Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
          <CheckCircle2 size={14} />
          Completed
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
          <XCircle size={14} />
          Cancelled
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Consultations</h2>
          <p className="text-slate-500">Manage your upcoming and past veterinary appointments.</p>
        </div>
        <Button 
          onClick={() => navigate('/dashboard/user/scheduling')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CalendarIcon className="w-5 h-5 mr-2" />
          Book New Consultation
        </Button>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'pending' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending ({pendingConsultations.length})
          {activeTab === 'pending' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'upcoming' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Upcoming ({upcomingConsultations.length})
          {activeTab === 'upcoming' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'past' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Past Consultations
          {activeTab === 'past' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>
          )}
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="grid gap-4">
          {pendingConsultations.length > 0 ? (
            pendingConsultations.map((consult) => (
              <Card key={consult.id} className="p-6 border-amber-200 bg-amber-50/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <img 
                      src={consult.image} 
                      alt={consult.animalName} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{consult.animalName}</h3>
                          <p className="text-slate-500 text-sm">{consult.clientType}</p>
                        </div>
                        {getStatusBadge(consult.statusType)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                          {consult.type}
                        </Badge>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-sm">Requested {consult.requestedAt}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-amber-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Requested Date & Time</p>
                        <div className="flex items-center text-slate-700">
                          <Clock size={16} className="mr-2 text-amber-500" />
                          <span className="font-medium">{consult.date}</span>
                        </div>
                        {consult.symptoms && (
                          <div className="mt-2 pt-2 border-t border-amber-100">
                            <p className="text-xs text-slate-500 mb-1">Symptoms:</p>
                            <p className="text-sm text-slate-700">{consult.symptoms}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between md:border-l md:border-amber-100 md:pl-6">
                    <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-200 mb-4">
                      <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <AlertCircle size={16} />
                        <span className="font-semibold text-sm">Awaiting Doctor Approval</span>
                      </div>
                      <p className="text-xs text-amber-600">The veterinarian will review and confirm your appointment soon.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={() => navigate(`${consult.id}`)}
                        variant="outline" 
                        className="flex-1 border-slate-300 text-slate-700"
                      >
                        <FileText size={18} className="mr-2" />
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="px-2 text-slate-400">
                        <MoreVertical size={20} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <HourglassIcon size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No pending requests</h3>
              <p className="text-slate-500 max-w-sm">
                You don't have any consultation requests awaiting approval.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="grid gap-4">
          {upcomingConsultations.map((consult) => (
            <Card key={consult.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <img 
                    src={consult.image} 
                    alt={consult.animalName} 
                    className="w-16 h-16 rounded-full object-cover border border-slate-100"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{consult.animalName}</h3>
                        <p className="text-slate-500 text-sm">{consult.clientType}</p>
                      </div>
                      {getStatusBadge(consult.statusType)}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                        {consult.type}
                      </Badge>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-slate-700">
                          <Clock size={16} className="mr-2 text-green-600" />
                          <span className="font-medium">{consult.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-green-700 bg-white px-3 py-2 rounded border border-green-200">
                        <CheckCircle2 size={16} className="mr-2" />
                        <span>Confirmed by {consult.doctor} • {consult.approvedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between md:border-l md:border-slate-100 md:pl-6">
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Your Veterinarian</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{consult.doctor}</p>
                        <p className="text-xs text-slate-500">Large Animal Specialist</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    {consult.type === 'Video Call' ? (
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                        <Video size={18} className="mr-2" />
                        Join Call
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => navigate(`${consult.id}`)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        <FileText size={18} className="mr-2" />
                        View Details
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="px-2 text-slate-400">
                      <MoreVertical size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}</div>
      )}

      {activeTab === 'past' && (
        <div className="grid gap-4">
          {pastConsultations.length > 0 ? (
            pastConsultations.map((consult) => (
              <Card key={consult.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <img 
                      src={consult.image} 
                      alt={consult.animalName} 
                      className="w-16 h-16 rounded-full object-cover border border-slate-100 grayscale"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{consult.animalName}</h3>
                          <p className="text-slate-500 text-sm">{consult.clientType}</p>
                        </div>
                        {getStatusBadge(consult.statusType)}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                          {consult.type}
                        </Badge>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-sm">{consult.completedAt}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center text-slate-600">
                          <Clock size={16} className="mr-2 text-slate-400" />
                          <span className="font-medium">{consult.date}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-500 mt-2">
                          <span>with {consult.doctor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between md:border-l md:border-slate-100 md:pl-6">
                    <div className="flex items-center gap-3 w-full">
                      <Button 
                        onClick={() => navigate(`${consult.id}`)}
                        variant="outline" 
                        className="flex-1 border-slate-300 text-slate-700"
                      >
                        <FileText size={18} className="mr-2" />
                        View Report
                      </Button>
                      <Button variant="ghost" size="sm" className="px-2 text-slate-400">
                        <MoreVertical size={20} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No past consultations</h3>
              <p className="text-slate-500 max-w-sm">
                Your consultation history will appear here once you've completed an appointment.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}