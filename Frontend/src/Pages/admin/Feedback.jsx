import { useState, useEffect } from 'react';
import { Star, Search, Trash2, MessageSquare, Eye, ThumbsUp, AlertTriangle, X, Check } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Feedback() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    // View Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingFeedback, setViewingFeedback] = useState(null);

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

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/feedback/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update feedback status");
            toast.success(`Feedback review ${newStatus === 'Published' ? 'Approved & Published' : 'Rejected'}`);
            fetchFeedback();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/feedback/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete feedback");
            toast.success("Feedback review deleted permanently");
            fetchFeedback();
        } catch (error) {
            console.error("Feedback delete error:", error);
            toast.error("Failed to delete review");
        }
    };

    const handleHelpfulClick = (id) => {
        // Optimistic local state increment for a premium UI feel
        setFeedbacks(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, helpful_count: (f.helpful_count || 0) + 1 };
            }
            return f;
        }));
        toast.success("Marked as helpful!");
    };

    const getImageUrl = (imagePath) => {
        const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        if (!imagePath) return defaultAvatar;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            return imagePath;
        }
        return `${import.meta.env.VITE_BACKEND_URL}${imagePath}`;
    };

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

    // Filter Logic: Exclude Rejected and search by comment, owner, or doctor
    const filteredFeedback = feedbacks.filter(fb => {
        if (fb.status === 'Rejected') return false;
        
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (fb.comment && fb.comment.toLowerCase().includes(searchLower)) ||
                             fb.ownerName.toLowerCase().includes(searchLower) ||
                             (fb.vetName && fb.vetName.toLowerCase().includes(searchLower));
        return matchesSearch;
    });

    // Pagination Calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredFeedback.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const formatRelativeDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-1 font-Inter text-slate-700">
            {/* Search filter input is linked to layout header, but we keep an optional inline search if needed */}
            <div className="flex flex-col gap-6">
                
                {/* List of Reviews */}
                <div className="space-y-6">
                    {currentItems.map(fb => (
                        <Card key={fb.id} className="p-6 border border-slate-200/80 shadow-sm bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative">
                            
                            {/* Card Body */}
                            <div className="space-y-4">
                                {/* Header (Users and Doctor) */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {/* Owner Avatar */}
                                        <img 
                                            src={getImageUrl(fb.ownerImage)} 
                                            alt={fb.ownerName} 
                                            className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100"
                                            onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
                                        />
                                        
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-800 text-[15px]">{fb.ownerName}</span>
                                            <span className="text-slate-400 text-sm">→</span>
                                            
                                            {/* Doctor Section */}
                                            {fb.vetName && (
                                                <div className="flex items-center gap-1.5">
                                                    <img 
                                                        src={getImageUrl(fb.vetImage)} 
                                                        alt={fb.vetName} 
                                                        className="w-6 h-6 rounded-full object-cover border border-slate-100"
                                                        onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
                                                    />
                                                    <span className="text-slate-600 font-semibold text-[14px]">{fb.vetName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Badge & Eye Action */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            fb.status === 'Published' 
                                                ? 'bg-[#e2fbeb] text-[#16a34a]' 
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {fb.status || "Under Review"}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                setViewingFeedback(fb);
                                                setShowViewModal(true);
                                            }}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                            title="View details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteFeedback(fb.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                                            title="Delete permanently"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Rating, Date & Consult Type */}
                                <div className="flex items-center gap-2.5 flex-wrap text-xs font-medium text-slate-400">
                                    {renderStars(fb.rating)}
                                    <span className="text-[10px]">•</span>
                                    <span>{formatRelativeDate(fb.created_at)}</span>
                                    <span className="text-[10px]">•</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold text-[11px]">
                                        {fb.consultation_type || "Video Consultation"}
                                    </span>
                                </div>

                                {/* Comment Content */}
                                <p className="text-[15px] text-slate-600 leading-relaxed font-normal pt-1">
                                    {fb.comment || "Rated without comments."}
                                </p>

                                {/* Action Buttons (Helpful & Reply) */}
                                <div className="flex items-center gap-4 text-slate-500 font-semibold text-xs pt-1">
                                    <button 
                                        onClick={() => handleHelpfulClick(fb.id)} 
                                        className="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-pointer"
                                    >
                                        <ThumbsUp size={14} />
                                        Helpful ({fb.helpful_count || 0})
                                    </button>
                                    <button 
                                        onClick={() => toast.success("Reply module clicked (Group Admin project stub)")}
                                        className="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-pointer"
                                    >
                                        <MessageSquare size={14} />
                                        Reply
                                    </button>
                                </div>
                            </div>

                            {/* Moderation Controls (Only shown if status is Under Review) */}
                            {fb.status !== 'Published' && (
                                <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
                                    <Button 
                                        onClick={() => handleUpdateStatus(fb.id, 'Published')} 
                                        className="bg-[#00a63e] hover:bg-green-700 text-white font-semibold rounded-xl text-sm py-2.5 flex-1 transition-all h-11"
                                    >
                                        Approve & Publish
                                    </Button>
                                    <button 
                                        onClick={() => handleUpdateStatus(fb.id, 'Rejected')} 
                                        className="border border-red-500 hover:bg-red-50 text-red-600 font-semibold rounded-xl text-sm py-2.5 flex-1 transition-all h-11 cursor-pointer focus:outline-none"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </Card>
                    ))}

                    {filteredFeedback.length === 0 && (
                        <div className="py-20 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm">
                            <Info size={36} className="text-slate-300" />
                            <p className="text-sm font-semibold">No feedback reviews match your filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {/* Previous Button */}
                        <button 
                            onClick={handlePrevPage} 
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-slate-200 text-sm font-semibold text-slate-500 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Previous
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, idx) => (
                            <button
                                key={idx + 1}
                                onClick={() => setCurrentPage(idx + 1)}
                                className={`w-9 h-9 rounded-full text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                                    currentPage === idx + 1 
                                        ? 'bg-[#00a63e] text-white' 
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}

                        {/* Next Button */}
                        <button 
                            onClick={handleNextPage} 
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-slate-200 text-sm font-semibold text-slate-500 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Read-Only Details Modal */}
            {showViewModal && viewingFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-700">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">Review Details</h3>
                            <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body content */}
                        <div className="p-6 space-y-4 text-sm text-slate-600">
                            {/* Path */}
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <img src={getImageUrl(viewingFeedback.ownerImage)} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-slate-800">{viewingFeedback.ownerName}</p>
                                    <p className="text-xs text-slate-400">Pet Owner / Farmer</p>
                                </div>
                                <span className="text-slate-400">→</span>
                                <img src={getImageUrl(viewingFeedback.vetImage)} alt="" className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-slate-800">{viewingFeedback.vetName}</p>
                                    <p className="text-xs text-slate-400">Veterinary Doctor</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-1">
                                <div>
                                    <span className="text-slate-400 block mb-1">CONSULTATION TYPE</span>
                                    <Badge variant="info">{viewingFeedback.consultation_type}</Badge>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-1">RATING</span>
                                    <div className="flex items-center gap-1.5">
                                        {renderStars(viewingFeedback.rating)}
                                        <span className="text-slate-700 font-bold">({viewingFeedback.rating}/5)</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-slate-400 block text-xs font-semibold mb-1">DATE SUBMITTED</span>
                                <p className="text-slate-700 font-medium">{new Date(viewingFeedback.created_at).toLocaleString()}</p>
                            </div>

                            <div>
                                <span className="text-slate-400 block text-xs font-semibold mb-1">REVIEW COMMENT</span>
                                <p className="leading-relaxed text-slate-700 bg-slate-50 p-3.5 border border-slate-100 rounded-xl font-normal">
                                    "{viewingFeedback.comment || "Rated without comments."}"
                                </p>
                            </div>

                            <div className="flex gap-4 text-xs font-semibold text-slate-400 pt-1">
                                <span>Status: {viewingFeedback.status}</span>
                                <span>Helpful Reactions: {viewingFeedback.helpful_count}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 gap-3">
                            {viewingFeedback.status !== 'Published' && (
                                <>
                                    <Button 
                                        onClick={() => {
                                            handleUpdateStatus(viewingFeedback.id, 'Published');
                                            setShowViewModal(false);
                                        }}
                                        className="bg-[#00a63e] hover:bg-green-700 text-white font-semibold"
                                    >
                                        Approve & Publish
                                    </Button>
                                    <button 
                                        onClick={() => {
                                            handleUpdateStatus(viewingFeedback.id, 'Rejected');
                                            setShowViewModal(false);
                                        }}
                                        className="border border-red-500 hover:bg-red-50 text-red-600 font-semibold rounded-3xl px-4 py-2 cursor-pointer focus:outline-none"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <Button onClick={() => setShowViewModal(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
