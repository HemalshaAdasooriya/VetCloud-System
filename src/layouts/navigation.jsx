import { BookOpen, HeartPulse, LogIn, MapPin } from "lucide-react";
import { Activity, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "../components/Ui/ui";

export default function Navigation() {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    
    const navItems = [
        { name: 'Home', path: '/', icon: HeartPulse },
        { name: 'Consult a Vet', path: '/consultation', icon: Activity },
        { name: 'Diseases', path: '/diseases', icon: BookOpen },
        { name: 'Find Clinic', path: '/clinics', icon: MapPin },
    ];
  return (
        <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${
                    scrolled
                        ? "bg-white/70 backdrop-blur-md border-slate-200/50 shadow-sm"
                        : "bg-white border-slate-200 shadow-sm"
                }`}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className=" text-white p-2 rounded-lg">
                        <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">VetCloud</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                        location.pathname === item.path ? 'text-green-600' : 'text-slate-600 hover:text-green-600'
                        }`}
                    >
                        <item.icon size={16} />
                        {item.name}
                    </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <Link to="/login">
                    <Button variant="ghost" className="hidden md:inline-flex gap-2">
                        <LogIn size={18} />
                        Login
                    </Button>
                    </Link>
                    <Link to="/consultation">
                    <Button>Book Appointment</Button>
                    </Link>
                </div>
            </div>
            <main className="flex-1">
                <Outlet />
            </main>
        </header>
  )
}