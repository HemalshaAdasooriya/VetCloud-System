import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, FileText, 
  User, Video, Phone, MapPin, Calendar, ChevronRight 
} from 'lucide-react';
import { Button, Card, Badge, Textarea } from '../components/ui/ui';

export default function VetConsultationRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const pendingRequests = [
    {
      id: 101,
      patientName: 'Bessie',
      ownerName: 'John Smith',
      ownerType: 'Dairy Farmer',
      date: 'Mar 25, 2026',
      time: '2:30 PM',
      type: 'Video Call',
      symptoms: 'Loss of appetite for 2 days, mild fever (102.5°F), reduced milk production',
      urgency: 'high',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
      requestedAt: '2 hours ago',
      ownerContact: '+1 (555) 123-4567',
      animalAge: '4 years',
      animalBreed: 'Holstein'
    },
    {
      id: 102,
      patientName: 'Luna',
      ownerName: 'Emily Wilson',
      ownerType: 'Pet Owner',
      date: 'Mar 26, 2026',
      time: '11:00 AM',
      type: 'Clinic Visit',
      symptoms: 'Excessive scratching, skin irritation on neck area, possible allergic reaction',
      urgency: 'medium',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop',
      requestedAt: '5 hours ago',
      ownerContact: '+1 (555) 987-6543',
      animalAge: '3 years',
      animalBreed: 'Persian Cat'
    },
    {
      id: 103,
      patientName: 'Max',
      ownerName: 'Robert Johnson',
      ownerType: 'Pet Owner',
      date: 'Mar 27, 2026',
      time: '3:00 PM',
      type: 'Clinic Visit',
      symptoms: 'Annual vaccination checkup, general wellness examination',
      urgency: 'low',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=2070&auto=format&fit=crop',
      requestedAt: '1 day ago',
      ownerContact: '+1 (555) 456-7890',
      animalAge: '5 years',
      animalBreed: 'Golden Retriever'
    }
  ];

  const reviewedRequests = [
    {
      id: 104,
      patientName: 'Charlie',
      ownerName: 'Sarah Brown',
      type: 'Video Call',
      status: 'approved',
      reviewedAt: '1 hour ago'
    },
    {
      id: 105,
      patientName: 'Daisy',
      ownerName: 'Mike Davis',
      type: 'Clinic Visit',
      status: 'declined',
      reviewedAt: '3 hours ago',
      reason: 'Requested time slot already booked'
    }
  ];

  const handleApprove = (requestId) => {
    // In a real app, this would make an API call
    console.log(`Approved request ${requestId}`);
    alert('Consultation approved! The client will be notified.');
  };

  const handleDecline = (requestId) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }
    // In a real app, this would make an API call
    console.log(`Declined request ${requestId} with reason: ${declineReason}`);
    alert('Consultation declined. The client will be notified with your feedback.');
    setSelectedRequest(null);
    setDeclineReason('');
  };

  const getUrgencyBadge = (urgency) => {
    switch(urgency) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
          <AlertCircle size={12} />
          High Priority
        </Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Medium Priority
        </Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Routine
        </Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Video Call':
        return <Video size={16} className="text-blue-500" />;
      case 'Clinic Visit':
        return <MapPin size={16} className="text-green-500" />;
      case 'Phone Call':
        return <Phone size={16} className="text-purple-500" />;
      default:
        return <User size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Consultation Requests</h2>
          <p className="text-slate-500">Review and manage incoming appointment requests from clients.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1.5">
            <Clock size={14} className="mr-1" />
            {pendingRequests.length} Pending
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'pending' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Review ({pendingRequests.length})
          {activeTab === 'pending' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reviewed')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'reviewed' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Recently Reviewed
          {activeTab === 'reviewed' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="grid gap-6">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="p-0 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {getTypeIcon(request.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{request.patientName}</h3>
                    <p className="text-sm text-slate-600">Owned by {request.ownerName} • {request.ownerType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getUrgencyBadge(request.urgency)}
                  <span className="text-xs text-slate-500">{request.requestedAt}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Animal Image and Details */}
                  <div className="md:col-span-1">
                    <img 
                      src={request.image} 
                      alt={request.patientName} 
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 mb-4"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 w-20">Breed:</span>
                        <span className="text-slate-900 font-medium">{request.animalBreed}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 w-20">Age:</span>
                        <span className="text-slate-900 font-medium">{request.animalAge}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 w-20">Contact:</span>
                        <span className="text-slate-900 font-medium">{request.ownerContact}</span>
                      </div>
                    </div>
                  </div>

                  {/* Consultation Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Requested Appointment
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-slate-400" />
                          <span className="font-medium text-slate-900">{request.date} at {request.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getTypeIcon(request.type)}
                          <span className="text-slate-700">{request.type}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                        Reported Symptoms / Reason
                      </h4>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-slate-800 leading-relaxed">{request.symptoms}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-200">
                      {selectedRequest === request.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Reason for Declining (will be sent to client)
                            </label>
                            <Textarea
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              placeholder="e.g., Requested time slot is unavailable. Please book another slot or contact us for alternative times."
                              className="min-h-[100px]"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleDecline(request.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle size={18} className="mr-2" />
                              Confirm Decline
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedRequest(null);
                                setDeclineReason('');
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 size={18} className="mr-2" />
                            Approve Consultation
                          </Button>
                          <Button
                            onClick={() => setSelectedRequest(request.id)}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle size={18} className="mr-2" />
                            Decline Request
                          </Button>
                          <Button
                            onClick={() => navigate(`/dashboard/vet/consultations/${request.id}`)}
                            variant="ghost"
                            className="px-4"
                          >
                            <FileText size={18} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {pendingRequests.length === 0 && (
            <Card className="p-12 border-slate-200 border-dashed flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">All caught up!</h3>
              <p className="text-slate-500 max-w-sm">
                There are no pending consultation requests at the moment.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Reviewed Tab */}
      {activeTab === 'reviewed' && (
        <div className="grid gap-4">
          {reviewedRequests.map((request) => (
            <Card key={request.id} className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    request.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {request.status === 'approved' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{request.patientName}</h4>
                    <p className="text-sm text-slate-500">Owner: {request.ownerName} • {request.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={request.status === 'approved' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                    }>
                      {request.status === 'approved' ? 'Approved' : 'Declined'}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{request.reviewedAt}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </div>
              {request.status === 'declined' && request.reason && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}