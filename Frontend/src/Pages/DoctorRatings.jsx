import { useState, useEffect } from 'react';
import { Star, Search, AlertCircle } from 'lucide-react';
import { Card, Input } from '../components/Ui/ui';
import axios from 'axios';

export default function DoctorRatings() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchFeedback = async () => {
        try {
            const vetId = localStorage.getItem("userId");
            if (!vetId) return;
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/feedback/vet/${vetId}`);
            setFeedbacks(res.data);
        } catch (error) {
            console.error("Feedback fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    // Calculate feedback stats
    const totalReviews = feedbacks.length;
    const averageRating = totalReviews > 0 
        ? (feedbacks.reduce((acc, curr) => acc + Number(curr.rating), 0) / totalReviews).toFixed(1)
        : "0.0";

    const ratingBreakdown = {
        5: feedbacks.filter(f => Number(f.rating) === 5).length,
        4: feedbacks.filter(f => Number(f.rating) === 4).length,
        3: feedbacks.filter(f => Number(f.rating) === 3).length,
        2: feedbacks.filter(f => Number(f.rating) === 2).length,
        1: feedbacks.filter(f => Number(f.rating) === 1).length
    };

    const filteredFeedback = feedbacks.filter(fb => 
        (fb.comment && fb.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (fb.ownerName && fb.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<Star key={i} size={15} className="fill-amber-400 text-amber-400" />);
            } else {
                stars.push(<Star key={i} size={15} className="text-slate-200" />);
            }
        }
        return <div className="flex gap-0.5">{stars}</div>;
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Reviews list (left columns) */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">My Reviews & Ratings</h2>
                            <p className="text-sm text-slate-500">View what owners and farmers have written about your services.</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input 
                                placeholder="Search comment or username..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 text-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredFeedback.map(fb => (
                            <div key={fb.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between gap-4 hover:border-slate-200 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-3">
                                        <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0">
                                            {(fb.ownerName || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{fb.ownerName || 'Unknown User'}</p>
                                            <div className="flex items-center gap-2">
                                                {renderStars(Number(fb.rating))}
                                                <span className="text-[10px] text-slate-400 font-semibold">•</span>
                                                <span className="text-xs text-slate-400">{new Date(fb.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-100/50">
                                    "{fb.comment || "Rated without comments."}"
                                </p>
                            </div>
                        ))}
                        {filteredFeedback.length === 0 && (
                            <div className="py-8 text-center text-slate-400">
                                No reviews matched your search terms.
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Ratings Summary (right column) */}
            <Card className="p-6">
                <h3 className="text-base font-bold text-slate-800 mb-6">Ratings Breakdown</h3>
                <div className="flex items-center gap-4 mb-8">
                    <div className="text-center bg-green-50/50 border border-green-100 p-4 rounded-2xl w-24 shrink-0">
                        <p className="text-3xl font-extrabold text-slate-800">{averageRating}</p>
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1">Average</p>
                    </div>
                    <div>
                        <div className="flex gap-0.5 mb-1.5">
                            {renderStars(Math.round(parseFloat(averageRating)))}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Based on {totalReviews} reviews submitted by verified pet owners.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(stars => {
                        const count = ratingBreakdown[stars] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                <span className="w-3 text-right">{stars}</span>
                                <Star size={13} className="fill-slate-400 text-slate-400 shrink-0" />
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right font-mono text-slate-400">{count}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400 flex gap-2">
                    <AlertCircle size={16} className="text-slate-300 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                        Ratings reflect the overall evaluations submitted by your patients. Maintain high-quality services to keep high averages.
                    </p>
                </div>
            </Card>
        </div>
    );
}
