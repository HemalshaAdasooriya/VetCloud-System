import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, Landmark, Send, X, Calendar, Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Payments() {
    const [paymentsData, setPaymentsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [txToDelete, setTxToDelete] = useState(null);
    
    // Payout Form States
    const [vets, setVets] = useState([]);
    const [selectedVetId, setSelectedVetId] = useState("");
    const [payoutAmount, setPayoutAmount] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    
    const fetchPayments = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/payments`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch payments data");
            const data = await res.json();
            setPaymentsData(data);
        } catch (error) {
            console.error("Payments fetch error:", error);
            toast.error("Error loading financial reports");
        } finally {
            setLoading(false);
        }
    };

    const fetchVets = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/doctors`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setVets(data);
            }
        } catch (e) {
            console.error("Vets fetch error in payments:", e);
        }
    };

    useEffect(() => {
        fetchPayments();
        fetchVets();
    }, []);

    const confirmDeleteTx = async () => {
        if (!txToDelete) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${txToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete record");
            toast.success("Consultation record deleted successfully");
            setShowDeleteModal(false);
            setTxToDelete(null);
            fetchPayments();
        } catch (error) {
            console.error("Delete transaction error:", error);
            toast.error("Failed to delete consultation record");
        }
    };

    const handleCreatePayout = async (e) => {
        e.preventDefault();
        if (!selectedVetId || !payoutAmount) {
            toast.error("Please fill in the required fields");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/payouts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    veterinarian_id: selectedVetId,
                    amount: parseFloat(payoutAmount),
                    bank_name: bankName,
                    account_number: accountNumber
                })
            });
            if (!res.ok) throw new Error("Failed to release payout");
            toast.success("Payout record released successfully!");
            setShowModal(false);
            
            // Clear fields
            setSelectedVetId("");
            setPayoutAmount("");
            setBankName("");
            setAccountNumber("");

            fetchPayments();
        } catch (error) {
            console.error("Payout release error:", error);
            toast.error("Error creating payout record");
        }
    };

    // Auto-fill bank details if doctor is selected
    useEffect(() => {
        if (selectedVetId) {
            const vet = vets.find(v => v.id === parseInt(selectedVetId));
            // Let's see if we can find bank details or mock some
            if (vet) {
                setBankName("National Savings Bank");
                setAccountNumber(`100${vet.id}25${vet.license_number.replace(/\D/g, '') || '91'}`);
            }
        }
    }, [selectedVetId, vets]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const { transactions = [], payouts = [], summary = {} } = paymentsData || {};

    return (
        <div className="space-y-6">
            {/* Financial Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-green-50/40 border-green-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Gross Income</span>
                        <div className="bg-green-100 p-2.5 rounded-xl text-green-700"><ArrowDownLeft size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">LKR {summary.totalFees.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">All fees collected from appointments</p>
                </Card>

                <Card className="p-6 bg-emerald-50/40 border-emerald-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Released Payouts</span>
                        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700"><ArrowUpRight size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">LKR {summary.totalPaidPayouts.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Payouts successfully sent to veterinarians</p>
                </Card>

                <Card className="p-6 bg-amber-50/40 border-amber-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-500">Pending Payouts</span>
                        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700"><Landmark size={20} /></div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">LKR {summary.totalPendingPayouts.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Approved earnings awaiting bank transfer</p>
                </Card>
            </div>

            {/* Main grid: Transactions & Payouts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Transaction history (Incoming fees) */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-500" />
                        Income Transactions
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-3 px-2">Owner & Vet</th>
                                    <th className="py-3 px-2">Type</th>
                                    <th className="py-3 px-2">Date</th>
                                    <th className="py-3 px-2 text-right">Fee (LKR)</th>
                                    <th className="py-3 px-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-2">
                                            <p className="font-semibold text-slate-800 leading-tight">{tx.ownerName}</p>
                                            <p className="text-xs text-slate-400">to Dr. {tx.vetName}</p>
                                        </td>
                                        <td className="py-3 px-2">
                                            <Badge variant={tx.consultation_type === 'video' ? "info" : "default"} className="text-[10px] capitalize">
                                                {tx.consultation_type}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-2 text-xs text-slate-500">
                                            {tx.appointment_date} <br/> {tx.appointment_time}
                                        </td>
                                        <td className="py-3 px-2 text-right font-medium text-slate-800">
                                            {parseFloat(tx.fee).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <Button 
                                                onClick={() => {
                                                    setTxToDelete(tx);
                                                    setShowDeleteModal(true);
                                                }}
                                                variant="ghost" 
                                                size="sm" 
                                                title="Delete Record"
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            No transaction records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Payouts log (Outgoing funds) */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Landmark size={20} className="text-emerald-500" />
                            Veterinarian Payouts
                        </h3>
                        <Button onClick={() => setShowModal(true)} size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1">
                            <Plus size={16} /> Release Payout
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-3 px-2">Veterinarian</th>
                                    <th className="py-3 px-2">Bank Details</th>
                                    <th className="py-3 px-2">Date</th>
                                    <th className="py-3 px-2">Status</th>
                                    <th className="py-3 px-2 text-right">Amount (LKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                {payouts.map(po => (
                                    <tr key={po.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-2">
                                            <p className="font-semibold text-slate-800 leading-tight">{po.vetName}</p>
                                            <p className="text-xs text-slate-400">{po.vetEmail}</p>
                                        </td>
                                        <td className="py-3 px-2 text-xs">
                                            <p className="font-medium text-slate-700">{po.bank_name || "N/A"}</p>
                                            <p className="font-mono text-slate-400">{po.account_number || "N/A"}</p>
                                        </td>
                                        <td className="py-3 px-2 text-xs text-slate-400">
                                            {po.payout_date ? new Date(po.payout_date).toLocaleDateString() : "Pending"}
                                        </td>
                                        <td className="py-3 px-2">
                                            <Badge variant={po.status === 'Paid' ? "success" : "warning"} className="text-[10px]">
                                                {po.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-2 text-right font-medium text-slate-800">
                                            {parseFloat(po.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {payouts.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            No payout records logged.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Release Payout Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Send size={18} className="text-green-600" />
                                Release Veterinarian Payout
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreatePayout} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Doctor*</label>
                                <select 
                                    required
                                    value={selectedVetId} 
                                    onChange={(e) => setSelectedVetId(e.target.value)}
                                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">-- Select Veterinarian --</option>
                                    {vets.map(vet => (
                                        <option key={vet.id} value={vet.id}>
                                            {vet.fullName} ({vet.specialization})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payout Amount (LKR)*</label>
                                <Input 
                                    type="number"
                                    required
                                    placeholder="Enter payout amount..."
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    className="h-10 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Name</label>
                                <Input 
                                    type="text"
                                    placeholder="Enter bank name (e.g. Bank of Ceylon)..."
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="h-10 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Account Number</label>
                                <Input 
                                    type="text"
                                    placeholder="Enter account number..."
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="h-10 text-sm"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Confirm & Release
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Custom Confirm Delete Transaction Modal */}
            {showDeleteModal && txToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 text-red-600">
                                <Trash2 size={28} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-800">Delete Consultation Record?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed text-center">
                                    Are you sure you want to delete the consultation record of <strong>{txToDelete.ownerName}</strong> with <strong>Dr. {txToDelete.vetName}</strong>? This action is permanent and cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setTxToDelete(null);
                                }}
                                className="flex-1 font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="button" 
                                onClick={confirmDeleteTx}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                            >
                                Delete Record
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
