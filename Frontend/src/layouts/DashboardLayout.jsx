import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Bell, Stethoscope, Bird, ShieldCheck, Activity, Book, ClipboardList, Video, DollarSign, Database, MessageSquare, Star, BarChart3, UserCog, Search, MapPin } from 'lucide-react';
import { BsDatabaseCheck } from 'react-icons/bs';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  //Local Storage Integration 
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
        return JSON.parse(savedUser); // Sets the object right at the start
    }
    return null; // Fallback if no user is found
  });

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const isUser = location.pathname.includes('/user') || location.pathname === '/dashboard/user';
  const isVet = location.pathname.includes('/doctor') || location.pathname === '/dashboard/doctor';
  const isAdmin = location.pathname.includes('/admin') || location.pathname === '/dashboard/admin';

  // Dynamic sidebar links based on role (Kept exactly as you had them)
  const links = isUser ? [
    { name: 'Dashboard', path: '/dashboard/user', icon: LayoutDashboard },
    { name: 'My Animals', path: '/dashboard/user/animals', icon: Bird },
    { name: 'Book Appointment', path: '/dashboard/user/appoinment', icon: Calendar },
    { name: 'Consultations', path: '/dashboard/user/consultations', icon: Stethoscope },
    { name: 'Find Clinics', path: '/dashboard/user/clinics', icon: MapPin },
    { name: 'Animal Diseases' , path: '/dashboard/user/diseases', icon: BsDatabaseCheck },
    { name: 'Settings', path: '/dashboard/user/settings', icon: Settings },
  ] : isVet ? [
    { name: 'Doctor Dashboard', path: '/dashboard/doctor', icon: LayoutDashboard },
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
    localStorage.removeItem("token"); // Clear the token
    localStorage.removeItem("user");  // Clear the user data
    navigate('/'); // Send them back to the home/login page
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
          {/* Updated this button to trigger the real handleSignOut function */}
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
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              
              {/* NEW: Dynamic Profile Display */}
              <img 
                // Uses the user's picture from local storage, or the fallback defaultAvatar
                src={user?.image || defaultAvatar} 
                alt="Profile Avatar" 
                className="w-8 h-8 rounded-full object-cover shadow-sm" 
              />
              <div className="text-sm">
                <p className="font-medium text-slate-700">
                    {/* Uses the real name from local storage */}
                    {user?.fullName || 'Loading...'}
                </p>
                <p className="text-slate-500 text-xs">
                    {/* Uses the real role from local storage */}
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