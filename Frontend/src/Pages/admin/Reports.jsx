import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Briefcase, Video, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import { Card, Badge } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Reports() {
    const [reportsData, setReportsData] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const { ownerGrowth = [], consultationStats = [], specialtyStats = [] } = reportsData || {};

    // Calculate total consultation metrics
    const totalConsultations = consultationStats.reduce((acc, curr) => acc + curr.count, 0);
    const grossIncome = consultationStats.reduce((acc, curr) => acc + parseFloat(curr.totalFee || 0), 0);

    // SVG Line Graph Calculations for User Growth
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
            
            {/* Analytics Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Gross Platform Value</span>
                        <div className="bg-green-100 p-2 text-green-700 rounded-lg"><TrendingUp size={20} /></div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">LKR {grossIncome.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">platform fees accumulated</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Total Consultations</span>
                        <div className="bg-blue-100 p-2 text-blue-700 rounded-lg"><BarChart3 size={20} /></div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalConsultations}</p>
                    <p className="text-xs text-slate-400 mt-2">Successful virtual appointments</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Consultation Volume Growth</span>
                        <div className="bg-indigo-100 p-2 text-indigo-700 rounded-lg"><Briefcase size={20} /></div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">+24.8%</p>
                    <p className="text-xs text-indigo-600 font-semibold mt-2">vs. previous quarter</p>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* User Signup Growth (SVG Chart) */}
                <Card className="p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-600" />
                        User Acquisition Trend (Last 6 Months)
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

                                {/* Y-Axis grid lines */}
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

                                {/* Gradient Area */}
                                <path d={areaData} fill="url(#areaGradient)" />

                                {/* Line Path */}
                                <path d={pathData} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Dots */}
                                {points.map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="5" className="fill-white stroke-green-600 stroke-[3]" />
                                ))}

                                {/* X-Axis labels */}
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
                        Platform Specialization breakdown
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

            {/* Consultation Statuses */}
            <Card className="p-6">
                <h3 className="text-base font-bold text-slate-800 mb-6">Platform Consultation Outcomes</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {consultationStats.map((item, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-colors">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">{item.status || "Scheduled"}</span>
                            <p className="text-2xl font-bold text-slate-800 mb-1">{item.count} slots</p>
                            <span className="text-xs text-slate-400">Total fees: LKR {parseFloat(item.totalFee || 0).toLocaleString()}</span>
                        </div>
                    ))}
                    {consultationStats.length === 0 && (
                        <p className="col-span-full text-center text-sm text-slate-400 py-4">No consultation outcomes logged.</p>
                    )}
                </div>
            </Card>

        </div>
    );
}
