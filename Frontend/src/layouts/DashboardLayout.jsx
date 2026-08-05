import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Bell, Stethoscope, Bird, ShieldCheck, Activity, Book, ClipboardList, Video, DollarSign, Database, MessageSquare, Star, BarChart3, UserCog, Search, MapPin, Check, Clock, X, Menu } from 'lucide-react';
import { BsDatabaseCheck } from 'react-icons/bs';
import { PiDogFill } from "react-icons/pi";
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      // When the signal fires, pull the fresh data from localStorage
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser)); // Instantly updates the top-right header!
      }
    };

    // Listen for our custom event
    window.addEventListener("profileImageUpdated", handleStorageChange);

    // Clean up the listener when the user leaves the page
    return () => window.removeEventListener("profileImageUpdated", handleStorageChange);
  }, []);

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // --- NEW: Profile Image Logic ---
  const getProfileImage = () => {
    if (!user || !user.image) return defaultAvatar;

    // If it's a Google/Facebook image, it already starts with 'http'
    if (user.image.startsWith('http')) {
      return user.image;
    }

    // If it's a local upload, glue the backend URL to the front
    return `${import.meta.env.VITE_BACKEND_URL}${user.image}`;
  };

  const profileImageUrl = getProfileImage();

  const [notifications, setNotifications] = useState([]);//isuri-notification
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);//isuri-notification

  //isuri-user notification
  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    if (!user) return;
    const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");
    socket.emit("register", { userId: user.id, role: user.role });
    socket.on("new-notification", (notification) => {
      setNotifications((prev) => {
        if (notification?.id && prev.some((n) => n.id === notification.id)) {
          return prev;
        }
        toast.success(notification.title || "New notification");
        // Fire a custom event to notify other pages (like farmerDashboard) to reload
        window.dispatchEvent(new Event("notificationsUpdated"));
        return [notification, ...prev];
      });
    });
    // Listen to reload events from child pages
    const handleReload = () => {
      fetchNotifications();
    };
    window.addEventListener("notificationsReloadRequest", handleReload);
    return () => {
      socket.disconnect();
      window.removeEventListener("notificationsReloadRequest", handleReload);
    };
  }, [user]);
  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (err) {
      console.error(err);
    }
  };
  const getNotificationIcon = (type) => {
    const iconClass = "p-1.5 rounded-lg shrink-0";
    switch (type) {
      case "payment_success":
      case "payment_received":
        return <div className={`${iconClass} bg-green-100 text-green-600`}><DollarSign size={16} /></div>;
      case "appointment_confirmed":
        return <div className={`${iconClass} bg-blue-100 text-blue-600`}><Check size={16} /></div>;
      case "appointment_reminder":
      case "appointment_starting":
        return <div className={`${iconClass} bg-amber-100 text-amber-600`}><Clock size={16} /></div>;
      case "appointment_rescheduled":
        return <div className={`${iconClass} bg-violet-100 text-violet-600`}><Calendar size={16} /></div>;
      case "appointment_cancelled":
        return <div className={`${iconClass} bg-red-100 text-red-600`}><X size={16} /></div>;
      case "prescription_available":
        return <div className={`${iconClass} bg-emerald-100 text-emerald-600`}><ClipboardList size={16} /></div>;
      case "vaccination_due":
      case "vaccination_due_soon":
      case "vaccination_scheduled":
        return <div className={`${iconClass} bg-pink-100 text-pink-600`}><Activity size={16} /></div>;
      case "test_results":
        return <div className={`${iconClass} bg-teal-100 text-teal-600`}><ShieldCheck size={16} /></div>;
      case "feedback_request":
      case "new_feedback_received":
      case "feedback_received":
        return <div className={`${iconClass} bg-indigo-100 text-indigo-600`}><Star size={16} /></div>;
      case "new_user_registration":
      case "new_vet_registration":
      case "approval_reminder":
        return <div className={`${iconClass} bg-emerald-100 text-emerald-600`}><Users size={16} /></div>;
      case "appointment_conflict":
      case "system_error":
      case "unresolved_complaints":
        return <div className={`${iconClass} bg-rose-100 text-rose-600`}><X size={16} /></div>;
      case "backup_status":
      case "data_backup_reminder":
        return <div className={`${iconClass} bg-cyan-100 text-cyan-600`}><Database size={16} /></div>;
      case "system_maintenance":
        return <div className={`${iconClass} bg-sky-100 text-sky-600`}><Settings size={16} /></div>;
      default:
        return <div className={`${iconClass} bg-slate-100 text-slate-500`}><Bell size={16} /></div>;
    }
  };
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isUser = location.pathname.startsWith('/dashboard/user');
  const isVet = location.pathname.startsWith('/dashboard/doctor');
  const isAdmin = location.pathname.startsWith('/dashboard/admin');

  // Dynamic sidebar links based on role
  const links = isUser ? [
    { name: 'Dashboard', path: '/dashboard/user', icon: LayoutDashboard },
    { name: 'My Animals', path: '/dashboard/user/animals', icon: PiDogFill },
    { name: 'Book Appointment', path: '/dashboard/user/appoinment', icon: Calendar },
    { name: 'Consultations', path: '/dashboard/user/consultations', icon: Stethoscope },
    { name: 'Find Clinics', path: '/dashboard/user/clinics', icon: MapPin },
    { name: 'Animal Diseases', path: '/dashboard/user/diseases', icon: BsDatabaseCheck },
    { name: 'Settings', path: '/dashboard/user/settings', icon: Settings },
  ] : isVet ? [
    { name: 'Doctor Dashboard', path: '/dashboard/doctor', icon: LayoutDashboard },
    { name: 'Upcoming Consultations', path: '/dashboard/doctor/consultations', icon: Stethoscope },
    { name: 'Consultation Requests', path: '/dashboard/doctor/requests', icon: ClipboardList }, //Navindu 2026/06/19 ... vet consultation requests
    { name: 'Schedule', path: '/dashboard/doctor/schedule', icon: Calendar },
    { name: 'Ratings & Reviews', path: '/dashboard/doctor/ratings', icon: Star },
    { name: 'Settings', path: '/dashboard/doctor/settings', icon: Settings },
  ] : [
    { name: 'Dashboard Overview', path: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/dashboard/admin/users', icon: Users },
    { name: 'Doctor Management', path: '/dashboard/admin/doctors', icon: UserCog },
    { name: 'Payments', path: '/dashboard/admin/payments', icon: DollarSign },
    { name: 'Disease Management', path: '/dashboard/admin/diseases', icon: Database },
    { name: 'Feedback & Ratings', path: '/dashboard/admin/feedback', icon: Star },
    { name: 'Reports & Analytics', path: '/dashboard/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/dashboard/admin/settings', icon: Settings },
  ];

  // Sign Out Handler
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-50
        fixed inset-y-0 left-0 transition-transform duration-300 lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2 group text-green-600">
            <div className="bg-green-100 p-2 rounded-lg">
              <Stethoscope size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">VetCloud</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <link.icon size={20} className={isActive ? 'text-green-600' : 'text-slate-400'} />
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-green-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base sm:text-xl font-semibold text-slate-800 truncate">
              {links.find((l) => l.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-28 sm:w-48 md:w-64 transition-all"
                />
              </div>
            )}
            {/*isuri-notification*/}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer focus:outline-none"
              >
                <Bell size={20} />
                {notifications.some((n) => !n.is_read) && (
                  <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white">
                    {notifications.filter((n) => !n.is_read).length}
                  </span>
                )}
              </button>
              {isDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown on click outside */}
                  <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-3 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 mb-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">Notifications</h3>
                      {notifications.some((n) => !n.is_read) && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs font-extrabold text-green-600 hover:text-green-700 cursor-pointer transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`flex items-start gap-3 p-3.5 hover:bg-slate-50/80 cursor-pointer transition-all ${!n.is_read ? 'bg-green-50/10' : ''
                              }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] leading-snug ${!n.is_read ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'
                                }`}>
                                {n.title}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5 font-medium leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                                {formatRelativeTime(n.created_at)}
                              </span>
                            </div>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0 animate-pulse" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 px-4 space-y-2">
                          <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Bell size={20} />
                          </div>
                          <p className="text-slate-400 text-xs font-bold">No new notifications</p>
                          <p className="text-[10px] text-slate-300">We'll let you know when things change.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-4">

              {/* UPDATED: Dynamic Profile Display using our new logic */}
              <img
                src={profileImageUrl}
                alt="Profile Avatar"
                className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = defaultAvatar; }}
              />
              <div className="text-sm hidden sm:block">
                <p className="font-medium text-slate-700">
                  {user?.fullName || 'Loading...'}
                </p>
                <p className="text-slate-500 text-xs">
                  {isUser || (user?.role && (user.role.toLowerCase() === 'farmer' || user.role.toLowerCase().includes('farmer') || user.role.toLowerCase().includes('owner')))
                    ? 'Farmer/PetOwner'
                    : (user?.role || 'Guest')}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}