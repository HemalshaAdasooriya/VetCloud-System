import { ArrowRight, CalendarCheck, CalendarCheck2, FileText, HeartPulse, HeartPulseIcon, LucideHeartPulse, MapPin, Phone, ShieldCheck, Star, Stethoscope, StethoscopeIcon, Video, VideoIcon } from "lucide-react";
import { Button, Card } from "../components/Ui/ui";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navigation from "../layouts/navigation";
import Footer from "../layouts/footer";
import { FaInstagram } from "react-icons/fa6";
import { BsFacebook, BsInstagram, BsTwitter } from "react-icons/bs";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";


export default function HomePage() {
    const navigate = useNavigate();
    const [testimonials, setTestimonials] = useState([]);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/feedback/homepage`);
            if (res.ok) {
                const data = await res.json();
                setTestimonials(data);
            }
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const defaultTestimonials = [
        {
            comment: "VetCloud saved my calf's life. Being able to video call a vet at 2 AM from my barn was incredible.",
            ownerName: "John Davis", ownerRole: "Dairy Farmer", rating: 5,
            ownerImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop"
        },
        {
            comment: "I used to drive 45 minutes to the nearest clinic for basic checkups. Now I just use the app!",
            ownerName: "Sarah Jenkins", ownerRole: "Pet Owner", rating: 5,
            ownerImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
        },
        {
            comment: "The disease database helps me spot early signs of illness in my flock before it spreads.",
            ownerName: "Miguel Torres", ownerRole: "Poultry Farmer", rating: 5,
            ownerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop"
        }
    ];

    const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

    const getOwnerImage = (image) => {
        if (!image) return "/default.jpg";
        if (image.startsWith("/uploads/")) {
            return `${import.meta.env.VITE_BACKEND_URL}${image}`;
        }
        return image;
    };
    return (
        <div className="flex flex-col">
            <Navigation />
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-t from-green-100 via-green-100 to-sky-50 py-12 lg:py-10">
                <div className="container mx-auto px-4">
                    <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50 to-green-200 rounded-[60px] p-8 lg:p-16 shadow-xl border border-slate-200">



                        <div className="grid lg:grid-cols-2 gap-12 items-center relative">
                            {/* Left Content */}
                            <div className="z-10">
                                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full shadow-sm mb-6 border border-green-100">
                                    <HeartPulse className="text-green-600" size={18} />
                                    <span className="text-sm font-semibold text-green-700">Best Animal Vet</span>
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                                    Compassionate vet <br />
                                    at your <span className="text-green-600">Doorstep</span>
                                </h1>

                                <p className="text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
                                    Animal care starts in the animal's condition, what treatment requires such as advance service, best medicine.
                                </p>



                                {/* Service Icons */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-emerald-100 shadow-lg flex items-center justify-center text-emerald-600">
                                        <Stethoscope size={24} />
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-rose-100 shadow-lg flex items-center justify-center text-rose-600">
                                        <HeartPulse size={24} />
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-blue-100 shadow-lg flex items-center justify-center text-blue-600">
                                        <Video size={24} />
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-amber-100 shadow-lg flex items-center justify-center text-amber-600">
                                        <CalendarCheck size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="relative">
                                    {/* Organic Background Shape */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-700 rounded-[100px] transform rotate-6 scale-105"></div>

                                    {/* Image Container */}
                                    <div className="relative rounded-[80px] overflow-hidden shadow-2xl">
                                        <img
                                            src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/home.jpg"
                                            alt="Veterinarian with Dog"
                                            className="w-full h-[450px] object-cover"
                                        />
                                    </div>

                                    {/* 30% Off Badge */}
                                    <div className="absolute -top-4 -left-4 w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center shadow-xl">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-white">30%</p>
                                            <p className="text-xs text-white/90 font-medium">OFF</p>
                                        </div>
                                    </div>

                                    {/* Emergency Hotline */}
                                    <div className="absolute -bottom-6 right-8 bg-green-600 px-6 py-4 rounded-full shadow-2xl">
                                        <div className="text-center text-white">
                                            <p className="text-xs font-medium mb-1">Emergency hotline</p>
                                            <div className="flex items-center gap-2">
                                                <Phone size={18} />
                                                <p className="text-lg font-bold">+94 765763241</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute bottom-8 left-8 opacity-10">
                            <HeartPulse size={60} className="text-green-600" />
                        </div>
                        <div className="absolute top-14 right-32 opacity-10">
                            <Stethoscope size={50} className="text-green-600" />
                        </div>
                        <div className="absolute bottom-50 left-40 opacity-15">
                            <img src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/Logo.png" alt="logo" className="w-100 h-65 object-cover" />
                        </div>
                    </div>
                </div>
            </section>



            {/* Quick Access Services */}
            <section className="py-20 px-5 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Core Services</h2>
                        <p className="text-slate-600">Access everything you need to keep your animals healthy, all from one easy-to-use platform.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Online Consultation', desc: 'Video or chat with certified vets.', icon: Video, color: 'bg-blue-100 text-blue-600', link: '/login' },
                        { title: 'Disease Information', desc: 'Search our comprehensive animal health database.', icon: FileText, color: 'bg-emerald-100 text-emerald-600', link: '/diseases' },
                        { title: 'Emergency Clinics', desc: 'GPS locator for the nearest open vet clinics.', icon: MapPin, color: 'bg-rose-100 text-rose-600', link: '/clinics' },
                        { title: 'Appointment Booking', desc: 'Schedule farm visits or clinic checkups.', icon: CalendarCheck, color: 'bg-amber-100 text-amber-600', link: '/login' },
                    ].map((service, idx) => (
                        <Link
                            to={service.link}
                            key={idx}
                            onClick={(e) => {
                                if (service.link === '/consultation' && !localStorage.getItem("token")) {
                                    e.preventDefault();
                                    toast.error("Please login to consult a veterinarian");
                                    navigate("/login");
                                }
                            }}
                        >
                            <Card className="h-full p-6 hover:shadow-md transition-shadow border-slate-100 hover:border-green-200 group cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${service.color}`}>
                                    <service.icon size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-green-600 transition-colors">{service.title}</h3>
                                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{service.desc}</p>
                                <div className="flex items-center text-sm font-medium text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Learn more <ArrowRight size={16} className="ml-1" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Mission Section */}

            <section className="relative py-20 text-white bg-[url('https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=2068&auto=format&fit=crop')] bg-cover bg-center bg-fixed bg-no-repeat">

                {/* Dark Overlay - Adjust the opacity (bg-slate-900/80) to make the image lighter or darker */}
                <div className="absolute inset-0 bg-slate-900/85"></div>

                {/* Added 'relative z-10' here so the content sits above the dark overlay */}
                <div className="container relative z-10 mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative text-center lg:text-left">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-6">Bridging the Gap in Veterinary Care</h2>
                        <p className="text-slate-300 mb-6 text-lg leading-relaxed">
                            For farmers in rural areas and pet owners with busy schedules, getting access to quality veterinary care can be challenging. VetCloud was built to solve this.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[
                                'Instant access to licensed professionals',
                                'Affordable consultation rates',
                                'Easy-to-understand health guides',
                                'Secure and private health records'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-200">
                                    <div className="bg-green-500/20 p-1 rounded-full text-green-400">
                                        <HeartPulse size={16} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-green-600 rounded-full opacity-20 animate-pulse"></div>
                        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-green-700 rounded-full opacity-15 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {/* <img src="" alt="Cows on farm" className="rounded-2xl h-64 object-cover w-full" /> https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=2070&auto=format&fit=crop*/}
                        <img src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/dog%20in%20field.png" alt="Vet examining dog" className="absolute right-0 bottom-0 rounded-2xl h-full w-90 object-cover translate-y-8 shadow-lg" />
                    </div>
                </div>
            </section>

            {/* Testimonials */}

            {/* Testimonials */}
            <section className="py-20 bg-slate-50 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by Farmers & Pet Owners</h2>
                        <p className="text-slate-600">See what our community has to say about their experience with VetCloud.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {displayTestimonials.map((t, i) => (
                            <motion.div
                                key={t.id || i}
                                initial={{ opacity: 0, y: 70 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: i * 0.2, ease: "easeOut" }}
                            >
                                <Card
                                    className="h-full p-8 bg-white border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-green-100 group cursor-default"
                                >
                                    <div className="flex gap-1 text-amber-400 mb-4 transition-transform duration-300 group-hover:scale-105 origin-left">
                                        {[...Array(t.rating || 5)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                                    </div>
                                    <p className="text-slate-700 italic mb-6">"{t.comment || t.text}"</p>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <div className="overflow-hidden rounded-full w-12 h-12 shrink-0">
                                            <img
                                                src={getOwnerImage(t.ownerImage || t.img)}
                                                alt={t.ownerName || t.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors duration-300">{t.ownerName || t.name}</h4>
                                            <p className="text-sm text-slate-500">{t.ownerRole || t.role}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}