import { useState, useEffect } from 'react';
import { Search, Trash2, Shield, UserX, UserCheck, Calendar } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Users fetch error:", error);
            toast.error("Error loading users database");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ is_Active: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update user status");
            toast.success(newStatus ? "User activated successfully" : "User suspended successfully");
            fetchUsers();
        } catch (error) {
            console.error("User status toggle error:", error);
            toast.error("Failed to update status");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User account deleted successfully");
            fetchUsers();
        } catch (error) {
            console.error("User delete error:", error);
            toast.error("Failed to delete user account");
        }
    };

    const filteredUsers = users.filter(user => 
        (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Pet Owners & Farmers Database</h2>
                    <p className="text-sm text-slate-500">Manage registered farmer accounts and access credentials.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 text-sm" 
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-4">Owner Name</th>
                            <th className="py-3.5 px-4">Contact Info</th>
                            <th className="py-3.5 px-4">Animals Count</th>
                            <th className="py-3.5 px-4">Auth Type</th>
                            <th className="py-3.5 px-4">Account Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 font-semibold text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xs">
                                            {user.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 leading-none mb-1">{user.fullName || 'Unnamed User'}</p>
                                            <p className="text-xs text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">{user.contact_No || "N/A"}</td>
                                <td className="py-4 px-4 text-center">
                                    <Badge variant="info">{user.numberOfAnimals || 0}</Badge>
                                </td>
                                <td className="py-4 px-4 uppercase text-xs font-semibold text-slate-500">{user.provider}</td>
                                <td className="py-4 px-4">
                                    <Badge variant={user.is_Active ? "success" : "danger"} className="px-2 py-0.5">
                                        {user.is_Active ? "Active" : "Suspended"}
                                    </Badge>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <Button 
                                            onClick={() => handleToggleStatus(user.id, user.is_Active)} 
                                            variant="ghost" 
                                            size="sm" 
                                            title={user.is_Active ? "Suspend User" : "Activate User"}
                                            className={`p-2 rounded-lg ${user.is_Active ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                                        >
                                            {user.is_Active ? <UserX size={16} /> : <UserCheck size={16} />}
                                        </Button>
                                        <Button 
                                            onClick={() => handleDeleteUser(user.id)} 
                                            variant="ghost" 
                                            size="sm" 
                                            title="Delete User"
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-slate-400">
                                    No pet owners found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
