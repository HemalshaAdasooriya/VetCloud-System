import { useState, useMemo,  useEffect } from 'react';
import { Badge, Button, Card, Input } from '../components/Ui/ui';
import { BsDatabaseCheck } from "react-icons/bs";
import { Search, Filter, BookOpen, AlertTriangle, ShieldCheck, Activity, Info, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DISEASES_DATA = [
  {
    id: 'fmd',
    name: 'Foot-and-Mouth Disease (FMD)',
    species: ['Cattle', 'Swine', 'Sheep', 'Goats'],
    category: 'Cattle',
    risk: 'High Risk',
    image: '/Cows.jpg',
    symptoms: 'Fever, Blisters in mouth, Lameness, Drop in milk production',
    prevention: 'Vaccination, strict biosecurity, quarantine of new stock',
    treatment: 'No specific treatment. Affected animals are isolated; supportive care can manage discomfort.',
    
  },
  {
    id: 'parvo',
    name: 'Canine Parvovirus',
    species: ['Dogs'],
    category: 'Dogs',
    risk: 'High Risk',
    image: '/dog.jpg',
    symptoms: 'Lethargy, Severe vomiting, Bloody diarrhea, Loss of appetite',
    prevention: 'Core vaccination starting at 6-8 weeks of age.',
    treatment: 'Intensive hospital care, IV fluids, anti-nausea medication',
    
  },
  {
    id: 'birdflu',
    name: 'Avian Influenza (Bird Flu)',
    species: ['Poultry'],
    category: 'Poultry',
    risk: 'Critical Risk',
    image: '/poultry.jpg',
    symptoms: 'Sudden death, Swollen head, Purple discoloration, Respiratory distress',
    prevention: 'Keep flocks away from wild birds, secure housing',
    treatment: 'Highly contagious and often fatal. Immediate reporting is required.',
    
  },
  {
    id: 'brd',
    name: 'Bovine Respiratory Disease',
    species: ['Cattle'],
    category: 'Cattle',
    risk: 'Medium Risk',
    image: '/Cows.jpg',
    symptoms: 'Fever, Nasal discharge, Coughing, Rapid breathing',
    prevention: 'Vaccination, minimizing stress during transport',
    treatment: 'Antibiotics, anti-inflammatory drugs, supportive care',
   
  },
  {
    id: 'panleuk',
    name: 'Feline Panleukopenia',
    species: ['Cats'],
    category: 'Cats',
    risk: 'High Risk',
    image: '/vetcat.jpg',
    symptoms: 'Severe lethargy, Vomiting, Bloody diarrhea, High fever',
    prevention: 'Core FVRCP vaccination starting at 6-8 weeks of age.',
    treatment: 'Aggressive supportive care, IV fluids, anti-emetics',
   
  },
  {
    id: 'asf',
    name: 'African Swine Fever (ASF)',
    species: ['Swine'],
    category: 'Swine',
    risk: 'Critical Risk',
    image: '/pig.jpg',
    symptoms: 'High fever, Loss of appetite, Skin hemorrhages, Sudden death',
    prevention: 'Strict biosecurity, ban feeding swill, quarantine, control wild boars',
    treatment: 'Highly contagious. No treatment or vaccine exists. Immediate reporting required.',
    
  }
];

export default function DiseasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGuide, setActiveGuide] = useState(null);

  const categories = ['All', 'Cattle', 'Poultry', 'Dogs', 'Cats', 'Swine'];

  // Filter diseases based on search query and category
  const filteredDiseases = useMemo(() => {
    return DISEASES_DATA.filter((disease) => {
      const matchesSearch =
        disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.species.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        disease.category === selectedCategory ||
        disease.species.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getRiskStyles = (risk) => {
    switch (risk) {
      case 'Critical Risk':
        return {
          badge: 'bg-rose-50 border-rose-100 text-rose-600',
          indicator: 'bg-rose-500'
        };
      case 'High Risk':
        return {
          badge: 'bg-amber-50 border-amber-100 text-amber-600',
          indicator: 'bg-amber-500'
        };
      default:
        return {
          badge: 'bg-blue-50 border-blue-100 text-blue-600',
          indicator: 'bg-blue-500'
        };
    }
  };

return (
    <div className="-m-8 flex flex-col min-h-screen bg-slate-50">
      {/* Main Database Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-50 border border-green-100 text-green-600 p-2.5 rounded-2xl shadow-sm">
                <BsDatabaseCheck size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Animal Disease Database
              </h1>
            </div>
            <p className="text-slate-600 max-w-xl text-sm leading-relaxed ml-0.5">
              Search and learn about common animal diseases, their symptoms, prevention methods, and treatments to keep your animals healthy.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80 shadow-sm rounded-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search diseases, symptoms or animals..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none mb-10 border-b border-slate-100">
          <Button variant="outline" className="h-9 px-4 rounded-full bg-white shrink-0 shadow-sm hover:bg-slate-50 flex items-center gap-2 border-slate-200 text-slate-600 text-sm">
            <Filter size={15} />
            <span>Filters</span>
          </Button>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`h-9 px-6 rounded-full text-sm font-semibold shrink-0 cursor-pointer shadow-sm transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-slate-900 text-white hover:bg-slate-800 scale-102'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredDiseases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm text-center px-4">
            <div className="bg-slate-50 p-4 rounded-full text-slate-400 mb-4">
              <BookOpen size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No diseases found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              We couldn't find any results matching "{searchQuery}". Try adjusting your keywords or using different category filters.
            </p>
          </div>
        )}

        {/* Disease Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredDiseases.map((disease) => {
            const riskStyles = getRiskStyles(disease.risk);
            return (
              <Card
                key={disease.id}
                className="flex flex-col md:flex-row bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 min-h-[300px]"
              >
                {/* Left: Image Side */}
                <div className="w-full md:w-48 xl:w-52 h-52 md:h-auto shrink-0 relative bg-slate-100">
                  <img
                    src={disease.image}
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Risk Badge on Image */}
                  <span className={`absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border shadow-sm ${riskStyles.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${riskStyles.indicator}`} />
                    {disease.risk}
                  </span>
                </div>

                {/* Right: Content Side */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-snug mb-1 group-hover:text-green-600 transition-colors">
                      {disease.name}
                    </h3>
                    <p className="text-sm font-semibold text-green-600 mb-5">
                      Affects: {disease.species.join(', ')}
                    </p>

                    <div className="space-y-4">
                      {/* Symptoms field */}
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="text-amber-500" size={13} />
                          symptoms
                        </span>
                        <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mt-0.5">
                          {disease.symptoms}
                        </p>
                      </div>

                      {/* Prevention field */}
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="text-blue-500" size={13} />
                          prevention
                        </span>
                        <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mt-0.5">
                          {disease.prevention}
                        </p>
                      </div>

                      {/* Treatment field */}
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Activity className="text-green-500" size={13} />
                          treatment
                        </span>
                        <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mt-0.5">
                          {disease.treatment}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveGuide(disease)}
                    className="w-full mt-6 py-2.5 rounded-full border border-green-200 bg-white hover:bg-green-50 hover:border-green-300 text-green-700 font-bold text-sm transition-colors duration-200 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    Read Full Guide <ChevronRight size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
