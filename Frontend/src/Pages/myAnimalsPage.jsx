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

const ANIMAL_HISTORIES = {
  "1": [
    { date: "10 Oct, 2023", type: "Vaccination", title: "Foot-and-Mouth Disease (FMD) Vaccine", vet: "Dr. Emily Smith", notes: "Routine vaccine booster. Clean health bill." },
    { date: "12 May, 2023", type: "Checkup", title: "Weight and Nutrition Assessment", vet: "Dr. Emily Smith", notes: "Weight healthy at 650kg. Recommended continuing standard silage feed." },
    { date: "04 Jan, 2023", type: "Procedure", title: "Hoof Trimming & Care", vet: "Dr. Mark R.", notes: "Routine preventative hoof maintenance." }
  ],
  "2": [
    { date: "24 Sep, 2023", type: "Diagnostic", title: "Blood Check & Parasite Panel", vet: "Dr. Sarah Connor", notes: "Undergoing standard heartworm prevention treatment." },
    { date: "10 Aug, 2023", type: "Consultation", title: "Limping Investigation", vet: "Dr. Sarah Connor", notes: "Minor joint strain. Prescribed anti-inflammatory medication (Under Treatment)." },
    { date: "15 Jan, 2023", type: "Vaccination", title: "Rabies Booster", vet: "Dr. Sarah Connor", notes: "Annual rabies vaccination completed." }
  ],
  "3": [
    { date: "15 Aug, 2023", type: "Inspection", title: "Flock Health Assessment", vet: "Dr. Arthur Vance", notes: "Evaluated 120 layers. Excellent egg laying quality. Feed ratios stable." },
    { date: "10 Mar, 2023", type: "Vaccination", title: "Avian Influenza Deworming", vet: "Dr. Arthur Vance", notes: "Water-based flock-wide treatment." }
  ],
  "4": [
    { date: "01 Nov, 2023", type: "Checkup", title: "Annual Dental Inspection", vet: "Dr. Lisa Cuddy", notes: "Teeth cleaned, gums look robust. Cat is active and healthy." },
    { date: "14 Jun, 2023", type: "Vaccination", title: "Feline Leukemia Booster", vet: "Dr. Lisa Cuddy", notes: "Regular booster completed. Responding beautifully." }
  ]
};