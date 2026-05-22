import { Activity, Calendar, CheckCircle, Clock, DollarSign, MoreVertical, Search, Video } from "lucide-react";
import { Badge, Button, Card, Input } from "../components/Ui/ui";


export default function DoctorDashboard() {

    // const navigate = useNavigate();

    const schedule = [
        { id: 1, patient: 'Bessie (Cow)', owner: 'John Davis', time: '10:00 AM', type: 'Video Consult', status: 'Next' },
        { id: 2, patient: 'Max (Dog)', owner: 'Sarah Jenkins', time: '11:30 AM', type: 'Clinic Visit', status: 'Waiting' },
        { id: 3, patient: 'Flock A (Poultry)', owner: 'Miguel Torres', time: '2:00 PM', type: 'Chat Consult', status: 'Scheduled' },
    ];

    const requests = [
        { id: 101, patient: 'Luna (Cat)', owner: 'Alice Cooper', issue: 'Not eating for 2 days', time: '2 mins ago' },
        { id: 102, patient: 'Rex (Horse)', owner: 'Bob Builder', issue: 'Limping left front leg', time: '15 mins ago' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Hello, Dr. Smith!</h2>
                    <p className="text-slate-500">You have 5 appointments today and 2 new consultation requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="success" className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Available
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-green-50/50 border-green-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Today's Patients</h3>
                        <div className="bg-white p-2 rounded-lg text-green-600 shadow-sm"><Activity size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">12</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">+2 from yesterday</p>
                </Card>
                
                <Card 
                    className="p-6 bg-amber-50/50 border-amber-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={"#"}
                    >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Pending Requests</h3>
                        <div className="bg-white p-2 rounded-lg text-amber-600 shadow-sm"><Clock size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">4</p>
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">Requires attention</p>
                </Card>

                <Card className="p-6 bg-blue-50/50 border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Earnings (Week)</h3>
                        <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><DollarSign size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">$850</p>
                    <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">+15% from last week</p>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Today's Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar className="text-blue-600" size={20} />
                                Today's Schedule
                            </h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input placeholder="Search patient..." className="pl-9 h-9 text-sm" />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {schedule.map((apt) => (
                                <div key={apt.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border gap-4 transition-colors ${apt.status === 'Next' ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex items-start gap-4 w-full sm:w-auto">
                                        <div className="bg-white border shadow-sm p-3 rounded-xl flex flex-col items-center justify-center min-w-[70px]">
                                            <span className="text-xs font-bold text-slate-400 uppercase">{apt.time.split(' ')[1]}</span>
                                            <span className="text-lg font-bold text-slate-800 leading-none">{apt.time.split(' ')[0]}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-slate-800 text-lg">{apt.patient}</h4>
                                                {apt.status === 'Next' && <Badge variant="info" className="text-[10px] uppercase tracking-wider px-2">Up Next</Badge>}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">Owner: {apt.owner}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                                <span className="flex items-center gap-1"><Video size={14} className="text-blue-500" /> {apt.type}</span>
                                                <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Confirmed</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                        <Button variant={apt.status === 'Next' ? 'primary' : 'outline'} size="sm" className="flex-1 sm:w-32">
                                        {apt.type.includes('Video') ? 'Join Call' : 'View Details'}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="px-2 text-slate-400">
                                        <MoreVertical size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Consultation Requests */}
                <div className="space-y-6">
                    <Card className="p-6 border-amber-200 bg-amber-50/30">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Clock className="text-amber-500" size={20} />
                                New Requests
                            </h3>
                            <Badge variant="warning">{requests.length}</Badge>
                        </div>
                        
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <div key={req.id} className="p-4 bg-white rounded-lg border border-amber-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800">{req.patient}</h4>
                                        <span className="text-xs text-slate-400">{req.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-1">Owner: {req.owner}</p>
                                    <p className="text-sm font-medium text-amber-700 bg-amber-50 p-2 rounded-md mb-4 border border-amber-100/50">
                                        "{req.issue}"
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0">Accept</Button>
                                        <Button variant="outline" size="sm" className="flex-1 text-slate-600 border-slate-200">Decline</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button 
                            variant="ghost" 
                            className="w-full mt-4 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={"#"}
                            >
                            View all requests ({requests.length + 2} total)
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}