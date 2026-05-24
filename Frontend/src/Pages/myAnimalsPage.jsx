import { useState, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  FileText, 
  Pencil, 
  Trash2, 
  MoreVertical, 
  Bell, 
  LayoutDashboard, 
  Bird, 
  Calendar, 
  MessageSquare, 
  Settings, 
  User, 
  LogOut,
  X,
  PlusCircle,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

// animal details
const INITIAL_ANIMALS = [
  {
    id: "1",
    name: "Bessie",
    species: "Cattle",
    breed: "Holstein",
    age: "4 Years",
    weight: "650 kg",
    lastVisit: "10 Oct, 2023",
    status: "Healthy",
    image: "/Cows.jpg"
  },
  {
    id: "2",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    age: "2 Years",
    weight: "32 kg",
    lastVisit: "24 Sep, 2023",
    status: "Under Treatment",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "3",
    name: "Flock A",
    species: "Poultry",
    breed: "Leghorn",
    age: "6 Months",
    weight: "Avg 2 kg",
    lastVisit: "15 Aug, 2023",
    status: "Healthy",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "4",
    name: "Luna",
    species: "Cat",
    breed: "Siamese",
    age: "1 Year",
    weight: "4 kg",
    lastVisit: "01 Nov, 2023",
    status: "Healthy",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  }
];

