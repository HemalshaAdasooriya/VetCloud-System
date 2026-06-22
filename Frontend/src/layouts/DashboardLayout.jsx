import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Bell, Stethoscope, Bird, ShieldCheck, Activity, Book, ClipboardList, Video, DollarSign, Database, MessageSquare, Star, BarChart3, UserCog, Search, MapPin, X } from 'lucide-react';
import { BsDatabaseCheck } from 'react-icons/bs';
import { PiDogFill } from "react-icons/pi";
import { useEffect } from 'react';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const loadNotifications = () => {
    const userId = user?.id || localStorage.getItem('userId') || 'guest';
    const storageKey = `vetcloud_notifications_${userId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setNotifications(stored);
    setUnreadCount(stored.filter((n) => !n.isRead).length);
  };

  const markAllAsRead = () => {
    const userId = user?.id || localStorage.getItem('userId') || 'guest';
    const storageKey = `vetcloud_notifications_${userId}`;
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(updated);
    setUnreadCount(0);
  };

  const markAsRead = (id) => {
    const userId = user?.id || localStorage.getItem('userId') || 'guest';
    const storageKey = `vetcloud_notifications_${userId}`;
    const updated = notifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.isRead).length);
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    const userId = user?.id || localStorage.getItem('userId') || 'guest';
    const storageKey = `vetcloud_notifications_${userId}`;
    const updated = notifications.filter((n) => n.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.isRead).length);
  };

  const clearAllNotifications = () => {
    const userId = user?.id || localStorage.getItem('userId') || 'guest';
    const storageKey = `vetcloud_notifications_${userId}`;
    localStorage.removeItem(storageKey);
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTimeAgo = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleNotificationsChange = () => {
      loadNotifications();
    };

    window.addEventListener("notificationsUpdated", handleNotificationsChange);
    return () => window.removeEventListener("notificationsUpdated", handleNotificationsChange);
  }, [user?.id]);

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


  const isUser = location.pathname.includes('/user') || location.pathname === '/dashboard/user';
  const isVet = location.pathname.includes('/doctor') || location.pathname === '/dashboard/doctor';
  const isAdmin = location.pathname.includes('/admin') || location.pathname === '/dashboard/admin';

  // Dynamic sidebar links based on role
  const links = isUser ? [
    { name: 'Dashboard', path: '/dashboard/user', icon: LayoutDashboard },
    { name: 'My Animals', path: '/dashboard/user/animals', icon: PiDogFill },
    { name: 'Book Appointment', path: '/dashboard/user/appoinment', icon: Calendar },
    { name: 'Consultations', path: '/dashboard/user/consultations', icon: Stethoscope },
    { name: 'Find Clinics', path: '/dashboard/user/clinics', icon: MapPin },
    { name: 'Animal Diseases' , path: '/dashboard/user/diseases', icon: BsDatabaseCheck },
    { name: 'Settings', path: '/dashboard/user/settings', icon: Settings },
  ] : isVet ? [
    { name: 'Doctor Dashboard', path: '/dashboard/doctor', icon: LayoutDashboard },
    { name: 'Consultation Requests', path: '/dashboard/doctor/requests', icon: ClipboardList }, //Navindu 2026/06/19 ... vet consultation requests
    { name: 'Consultations', path: '/dashboard/doctor/consultations', icon: Stethoscope },
    { name: 'Schedule', path: '/dashboard/doctor/schedule', icon: Calendar },
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2 group text-green-600">
            <div className="bg-green-100 p-2 rounded-lg">
              <Stethoscope size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">VetCloud</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold text-slate-800">
            {links.find((l) => l.path === location.pathname)?.name || 'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                />
              </div>
            )}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotificationsDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-green-600 hover:text-green-700 font-semibold cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                          <Bell size={28} className="text-slate-300" />
                          <p className="text-sm font-medium">All caught up!</p>
                          <p className="text-xs text-slate-400">No new notifications.</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`p-4 flex gap-3 items-start transition-colors cursor-pointer hover:bg-slate-50/50 ${
                              !notification.isRead ? 'bg-green-50/15' : ''
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !notification.isRead ? 'bg-green-500' : 'bg-slate-200'
                            }`} />
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <p className={`text-xs md:text-sm leading-relaxed ${
                                !notification.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'
                              }`}>
                                {notification.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => deleteNotification(notification.id, e)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100 text-center bg-slate-50/30">
                        <button 
                          onClick={clearAllNotifications}
                          className="text-xs text-slate-500 hover:text-slate-600 font-medium cursor-pointer"
                        >
                          Clear all history
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              
              {/* UPDATED: Dynamic Profile Display using our new logic */}
              <img 
                src={profileImageUrl} 
                alt="Profile Avatar" 
                className="w-8 h-8 rounded-full object-cover shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = defaultAvatar; }} 
              />
              <div className="text-sm">
                <p className="font-medium text-slate-700">
                    {user?.fullName || 'Loading...'}
                </p>
                <p className="text-slate-500 text-xs">
                    {user?.role || 'Guest'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}