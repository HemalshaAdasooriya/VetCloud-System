import { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Briefcase, 
    Award, 
    Download, 
    Printer, 
    DollarSign, 
    Users, 
    Stethoscope, 
    ShieldCheck, 
    FileText,
    Activity,
    Calendar
} from 'lucide-react';
import { Card, Badge } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Reports() {
    const [reportsData, setReportsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/reports`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (!res.ok) throw new Error("Failed to fetch reports");
                const data = await res.json();
                setReportsData(data);
            } catch (error) {
                console.error("Reports fetch error:", error);
                toast.error("Error loading analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // CSV Export Utility Function
    const exportCSV = (dataArray, filename = "vetcloud_report.csv") => {
        if (!dataArray || dataArray.length === 0) {
            toast.error("No data available to export");
            return;
        }

        const headers = Object.keys(dataArray[0]).join(",");
        const rows = dataArray.map(obj => 
            Object.values(obj).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(",")
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${filename}`);
    };

    // Print PDF Helper
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const { 
        ownerGrowth = [], 
        consultationStats = [], 
        specialtyStats = [],
        financialSummary = {},
        vetPerformance = [],
        patientStats = {},
        recentTransactions = []
    } = reportsData || {};

    const { grossRevenue = 0, paidPayouts = 0, pendingPayouts = 0, totalConsultations = 0 } = financialSummary;
    const { totalAnimals = 0, totalMedicalRecords = 0, speciesStats = [] } = patientStats;

    // SVG Line Graph Calculations
    const maxGrowthCount = Math.max(...ownerGrowth.map(d => d.count), 5);
    const width = 500;
    const height = 180;
    const padding = 30;

    const points = ownerGrowth.map((d, index) => {
        const x = padding + (index * (width - padding * 2)) / (ownerGrowth.length - 1 || 1);
        const y = height - padding - (d.count * (height - padding * 2)) / maxGrowthCount;
        return { x, y };
    });

    const pathData = points.reduce((acc, p, i) => {
        return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaData = points.length > 0 
        ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
        : "";

    return (
        <div className="space-y-6">
            
            {/* Printable CSS Header */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-report, .printable-report * { visibility: visible; }
                    .printable-report { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="printable-report space-y-6">
                
                {/* Header & Export Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm no-print">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <BarChart3 className="text-green-600" />
                            System Reports & Analytics Hub
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Comprehensive financial breakdown, doctor performance metrics, and clinical analytics.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => exportCSV(
                                activeTab === 'vetPerformance' ? vetPerformance :
                                activeTab === 'audit' ? recentTransactions :
                                activeTab === 'patientAnalytics' ? speciesStats : consultationStats,
                                `${activeTab}_report.csv`
                            )}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>

                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-green-600/20"
                        >
                            <Printer size={16} />
                            Print Report PDF
                        </button>
                    </div>
                </div>

                {/* Report Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-2 no-print">
                    {[
                        { id: 'overview', label: 'Financial & Overview', icon: DollarSign },
                        { id: 'vetPerformance', label: 'Doctor Performance', icon: Stethoscope },
                        { id: 'patientAnalytics', label: 'Patient & Species Stats', icon: Activity },
                        { id: 'audit', label: 'Financial Audit Log', icon: FileText },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                                    active 
                                        ? 'border-green-600 text-green-700 bg-green-50/50 rounded-t-xl' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: OVERVIEW & FINANCIAL ANALYTICS */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Analytics Header Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
                                    <div className="bg-green-100 p-2 text-green-700 rounded-lg"><TrendingUp size={20} /></div>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-800">LKR {grossRevenue.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 mt-2">Cumulative consultation fees</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Payouts</span>
                                    <div className="bg-blue-100 p-2 text-blue-700 rounded-lg"><DollarSign size={20} /></div>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-800">LKR {paidPayouts.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 mt-2">Disbursed doctor earnings</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payouts</span>
                                    <div className="bg-amber-100 p-2 text-amber-700 rounded-lg"><Briefcase size={20} /></div>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-800">LKR {pendingPayouts.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 mt-2">Awaiting disbursement</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Consultations</span>
                                    <div className="bg-indigo-100 p-2 text-indigo-700 rounded-lg"><BarChart3 size={20} /></div>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-800">{totalConsultations}</p>
                                <p className="text-xs text-indigo-600 font-semibold mt-2">Successful virtual visits</p>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* User Signup Growth (SVG Chart) */}
                            <Card className="p-6">
                                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-600" />
                                    Consultation Growth Trend (Last 6 Months)
                                </h3>
                                <div className="relative">
                                    {ownerGrowth.length > 1 ? (
                                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                                            <defs>
                                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                                </linearGradient>
                                            </defs>

                                            {[0, 0.5, 1].map((ratio, i) => {
                                                const y = padding + ratio * (height - padding * 2);
                                                const val = Math.round(maxGrowthCount * (1 - ratio));
                                                return (
                                                    <g key={i}>
                                                        <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                                                        <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="10" className="fill-slate-400 font-medium font-mono">{val}</text>
                                                    </g>
                                                );
                                            })}

                                            <path d={areaData} fill="url(#areaGradient)" />
                                            <path d={pathData} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                            {points.map((p, i) => (
                                                <circle key={i} cx={p.x} cy={p.y} r="5" className="fill-white stroke-green-600 stroke-[3]" />
                                            ))}

                                            {ownerGrowth.map((d, i) => {
                                                const p = points[i];
                                                return (
                                                    <text key={i} x={p.x} y={height - 10} textAnchor="middle" fontSize="9" className="fill-slate-400 font-bold uppercase tracking-wider">
                                                        {d.month.split(" ")[0]}
                                                    </text>
                                                );
                                            })}
                                        </svg>
                                    ) : (
                                        <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                                            Insufficient historical data to graph trends.
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Popular Specializations */}
                            <Card className="p-6">
                                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Award size={18} className="text-blue-600" />
                                    Veterinary Specialization Breakdown
                                </h3>
                                <div className="space-y-4">
                                    {specialtyStats.map((item, index) => {
                                        const totalVetsCount = specialtyStats.reduce((acc, curr) => acc + curr.count, 0);
                                        const percent = totalVetsCount > 0 ? (item.count / totalVetsCount) * 100 : 0;
                                        return (
                                            <div key={index} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                    <span>{item.specialization}</span>
                                                    <span className="text-slate-400">{item.count} Vets ({Math.round(percent)}%)</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" 
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {specialtyStats.length === 0 && (
                                        <p className="text-center text-sm text-slate-400 py-8">No veterinarian records to display.</p>
                                    )}
                                </div>
                            </Card>

                        </div>

                        {/* Consultation Outcomes Grid */}
                        <Card className="p-6">
                            <h3 className="text-base font-bold text-slate-800 mb-6">Consultation Outcome Summaries</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {consultationStats.map((item, index) => (
                                    <div key={index} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-colors">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">{item.status || "Scheduled"}</span>
                                        <p className="text-2xl font-bold text-slate-800 mb-1">{item.count} consultations</p>
                                        <span className="text-xs text-slate-400 font-semibold">Volume: LKR {parseFloat(item.totalFee || 0).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 2: DOCTOR PERFORMANCE REPORT */}
                {activeTab === 'vetPerformance' && (
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Veterinarian Performance & Revenue Leaders</h3>
                                <p className="text-xs text-slate-500">Summary of total consultations completed, revenue generated, and ratings per veterinarian.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3">Doctor Name</th>
                                        <th className="px-4 py-3">Specialization</th>
                                        <th className="px-4 py-3">Consultation Fee</th>
                                        <th className="px-4 py-3 text-center">Completed Consultations</th>
                                        <th className="px-4 py-3 text-right">Total Revenue</th>
                                        <th className="px-4 py-3 text-center">Avg Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {vetPerformance.map((vet, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3.5 font-bold text-slate-800">Dr. {vet.fullName}</td>
                                            <td className="px-4 py-3.5"><Badge variant="outline">{vet.specialization}</Badge></td>
                                            <td className="px-4 py-3.5">LKR {parseFloat(vet.consultation_fee || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3.5 text-center font-bold text-slate-800">{vet.totalConsultations}</td>
                                            <td className="px-4 py-3.5 text-right font-extrabold text-green-600">LKR {parseFloat(vet.totalRevenue || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs">
                                                    ★ {parseFloat(vet.avgRating || 5).toFixed(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {vetPerformance.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-slate-400 text-sm">No veterinarian performance data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* TAB 3: PATIENT & SPECIES STATS */}
                {activeTab === 'patientAnalytics' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Patient Animals</span>
                                    <div className="bg-emerald-100 p-2 text-emerald-700 rounded-lg"><Users size={20} /></div>
                                </div>
                                <p className="text-3xl font-black text-slate-800">{totalAnimals}</p>
                                <p className="text-xs text-slate-400 mt-2">Active animal profiles registered on VetCloud</p>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Medical Records</span>
                                    <div className="bg-purple-100 p-2 text-purple-700 rounded-lg"><FileText size={20} /></div>
                                </div>
                                <p className="text-3xl font-black text-slate-800">{totalMedicalRecords}</p>
                                <p className="text-xs text-slate-400 mt-2">Diagnostic, prescription & medical history logs</p>
                            </Card>
                        </div>

                        <Card className="p-6 space-y-4">
                            <h3 className="text-base font-bold text-slate-800">Animal Species Breakdown Report</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {speciesStats.map((sp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <span className="font-bold text-slate-700 text-sm">{sp.species}</span>
                                        <Badge className="bg-green-600 text-white font-bold">{sp.count} Animals</Badge>
                                    </div>
                                ))}
                                {speciesStats.length === 0 && (
                                    <p className="col-span-full text-center text-slate-400 text-sm py-4">No animal species registered yet.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 4: TRANSACTION & AUDIT LOG */}
                {activeTab === 'audit' && (
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Financial Audit & Transaction Log</h3>
                                <p className="text-xs text-slate-500">Live consultation payments and fee transaction logs.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Transaction Type</th>
                                        <th className="px-4 py-3">Client (Owner)</th>
                                        <th className="px-4 py-3">Attending Doctor</th>
                                        <th className="px-4 py-3">Mode</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentTransactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                                                {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{tx.type}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{tx.ownerName || 'N/A'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{tx.doctorName ? `Dr. ${tx.doctorName}` : 'N/A'}</td>
                                            <td className="px-4 py-3 capitalize"><Badge variant="outline">{tx.mode || 'video'}</Badge></td>
                                            <td className="px-4 py-3 text-right font-extrabold text-slate-800">LKR {parseFloat(tx.amount || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={
                                                    tx.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    tx.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }>
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-slate-400 text-sm">No transaction audit records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

            </div>
        </div>
    );
}
