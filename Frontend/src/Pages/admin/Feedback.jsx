import { useState, useEffect } from 'react';
import { Star, StarHalf, Search, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Feedback() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Admin add review states
    const [owners, setOwners] = useState([]);
    const [vets, setVets] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState("");
    const [selectedVetId, setSelectedVetId] = useState("");
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchFeedback = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/feedback`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch feedback");
            const data = await res.json();
            setFeedbacks(data);
        } catch (error) {
            console.error("Feedback fetch error:", error);
            toast.error("Error loading user ratings & reviews");
        } finally {
            setLoading(false);
        }
    };

    const fetchOwnersAndVets = async () => {
        try {
            const token = localStorage.getItem("token");
            const ownersRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (ownersRes.ok) {
                const ownersData = await ownersRes.json();
                setOwners(ownersData);
            }

            const vetsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (vetsRes.ok) {
                const vetsData = await vetsRes.json();
                setVets(vetsData);
            }
        } catch (error) {
            console.error("Error fetching owners/vets:", error);
        }
    };

    useEffect(() => {
        fetchFeedback();
        fetchOwnersAndVets();
    }, []);

    const handleDeleteFeedback = async (id) => {
        if (!confirm("Are you sure you want to delete this feedback? This action is permanent and cannot be undone.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/feedback/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete feedback");
            toast.success("Feedback review deleted");
            fetchFeedback();
        } catch (error) {
            console.error("Feedback delete error:", error);
            toast.error("Failed to delete review");
        }
    };

    const handleAddFeedback = async (e) => {
        e.preventDefault();
        if (!selectedOwnerId) {
            return toast.error("Please select a pet owner");
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    petOwnerId: selectedOwnerId,
                    veterinarianId: selectedVetId || null,
                    rating: newRating,
                    comment: newComment
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to add feedback");
            toast.success("Feedback review added successfully!");
            setShowAddModal(false);
            setSelectedOwnerId("");
            setSelectedVetId("");
            setNewRating(5);
            setNewComment("");
            fetchFeedback();
        } catch (error) {
            console.error("Feedback add error:", error);
            toast.error(error.message || "Failed to add review");
        } finally {
            setSubmitting(false);
        }
    };

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
        fb.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fb.vetName && fb.vetName.toLowerCase().includes(searchQuery.toLowerCase()))
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
                            <h2 className="text-xl font-bold text-slate-800">User Reviews & Ratings</h2>
                            <p className="text-sm text-slate-500">Monitor veterinarian evaluations and patient experience feedback.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input 
                                    placeholder="Search comment or username..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 text-sm" 
                                />
                            </div>
                            <Button 
                                onClick={() => setShowAddModal(true)} 
                                className="bg-green-600 hover:bg-green-700 text-white shrink-0 h-10 px-4 font-semibold text-sm rounded-lg cursor-pointer"
                            >
                                Add Review
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredFeedback.map(fb => (
                            <div key={fb.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between gap-4 hover:border-slate-200 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-3">
                                        <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0">
                                            {fb.ownerName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{fb.ownerName}</p>
                                            <div className="flex items-center gap-2">
                                                {renderStars(fb.rating)}
                                                <span className="text-[10px] text-slate-400 font-semibold">•</span>
                                                <span className="text-xs text-slate-400">{new Date(fb.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleDeleteFeedback(fb.id)}
                                        variant="ghost" 
                                        size="sm"
                                        title="Delete Comment"
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                                    >
                                        <Trash2 size={15} />
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-100/50">
                                    "{fb.comment || "Rated without comments."}"
                                </p>
                                {fb.vetName && (
                                    <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                                        <MessageSquare size={13} className="text-slate-300" />
                                        Review for: <span className="text-blue-500 font-bold">Dr. {fb.vetName}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredFeedback.length === 0 && (
                            <div className="py-8 text-center text-slate-400">
                                No user reviews matched your search terms.
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
                        As an administrator, you have permissions to delete reviews that contain abusive language, spam, or false allegations. Please use discretion when moderating content.
                    </p>
                </div>
            </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Add New Review</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddFeedback} className="space-y-4">
                {/* Pet Owner selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Pet Owner / Farmer</label>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700 bg-white"
                  >
                    <option value="">Select User...</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.fullName} ({o.email})</option>
                    ))}
                  </select>
                </div>

                {/* Veterinarian selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Veterinarian (Optional)</label>
                  <select
                    value={selectedVetId}
                    onChange={(e) => setSelectedVetId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700 bg-white"
                  >
                    <option value="">No Doctor / System Feedback</option>
                    {vets.map(v => (
                      <option key={v.id} value={v.id}>Dr. {v.fullName} ({v.specialization})</option>
                    ))}
                  </select>
                </div>

                {/* Rating selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Rating (Stars)</label>
                  <div className="flex gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setNewRating(starValue)}
                        className="transform transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={24}
                          className={
                            starValue <= newRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment area */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Review Comment</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter review text..."
                    className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-slate-700"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-600 font-medium h-10 cursor-pointer"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium h-10 cursor-pointer"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Add Review'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
