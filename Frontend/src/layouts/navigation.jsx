import { BookOpen, HeartPulse, LogIn, MapPin, Menu, X } from "lucide-react";
import { Activity, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Ui/ui";
import toast from "react-hot-toast";

export default function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                        <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" alt="Logo" />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">VetCloud</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={(e) => {
                            if (item.path === '/consultation' && !localStorage.getItem("token")) {
                                e.preventDefault();
                                toast.error("Please login to consult a veterinarian");
                                navigate("/login");
                            }
                        }}
                        className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                        location.pathname === item.path ? 'text-green-600' : 'text-slate-600 hover:text-green-600'
                        }`}
                    >
                        <item.icon size={16} />
                        {item.name}
                    </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Link to="/login">
                    <Button variant="outline" className="hidden md:inline-flex gap-2">
                        Login
                    </Button>
                    </Link>
                    <Link to="/register">
                    <Button variant="outline" className="hidden md:inline-flex gap-2">
                        Sign Up
                    </Button>
                    </Link>
                    <Link 
                        to="/consultation"
                        onClick={(e) => {
                            if (!localStorage.getItem("token")) {
                                e.preventDefault();
                                toast.error("Please login to consult a veterinarian");
                                navigate("/login");
                            }
                        }}
                    >
                        <Button>Book Appointment</Button>
                    </Link>
                </div>

                <div className="flex items-center gap-3 md:hidden">
                    <Link 
                        to="/consultation"
                        onClick={(e) => {
                            if (!localStorage.getItem("token")) {
                                e.preventDefault();
                                toast.error("Please login to consult a veterinarian");
                                navigate("/login");
                            }
                        }}
                    >
                        <Button size="sm">Book</Button>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-slate-600 hover:text-green-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer focus:outline-none"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 py-4 px-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
                    <nav className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={(e) => {
                                    setIsMobileMenuOpen(false);
                                    if (item.path === '/consultation' && !localStorage.getItem("token")) {
                                        e.preventDefault();
                                        toast.error("Please login to consult a veterinarian");
                                        navigate("/login");
                                    }
                                }}
                                className={`text-sm font-semibold py-2 transition-colors flex items-center gap-3 ${
                                    location.pathname === item.path ? 'text-green-600' : 'text-slate-600 hover:text-green-600'
                                }`}
                            >
                                <item.icon size={18} />
                                {item.name}
                            </Link>
                        ))}
                        <div className="h-px bg-slate-100 my-2" />
                        <div className="flex flex-col gap-3">
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                                <Button variant="outline" className="w-full justify-center py-2.5">
                                    Login
                                </Button>
                            </Link>
                            <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                                <Button variant="outline" className="w-full justify-center py-2.5">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}

            <main className="flex-1">
                <Outlet />
            </main>
        </header>
  )
}