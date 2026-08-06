import { useState, useMemo,  useEffect } from 'react';
import { Badge, Button, Card, Input } from '../components/Ui/ui';
import { BsDatabaseCheck } from "react-icons/bs";
import { Search, BookOpen, AlertTriangle, ShieldCheck, Activity, Info, X, ChevronRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
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
    
    description: 'A highly contagious viral disease affecting cloven-hoofed animals. It is characterized by high fever and vesicle formation in the mouth, muzzle, teats, and feet, leading to significant productivity loss.',
    transmission: 'Direct contact with infected animals, airborne transmission (up to several kilometers in humid conditions), or indirect contact via contaminated vehicles, footwear, or uncooked food scraps.',
    incubation: '2 - 14 days',
    clinicalSigns: [
      'High fever (up to 105°F / 41°C) and sudden shivering.',
      'Vesicles (blisters) on the tongue, lips, gums, teats, and interdigital space of hooves.',
      'Reluctance to move, lameness, and lying down frequently.',
      'Heavy salivation (drooling) and a characteristic smacking or clicking sound of the lips.',
      'Severe drop in milk yield in dairy cows and sudden abortions in pregnant females.'
    ],
    preventionSteps: [
      'Regular vaccine boosters in endemic zones.',
      'Strict quarantine of all new livestock for a minimum of 21 days.',
      'Rigorous biosecurity: disinfection of vehicles, footwear, and equipment.',
      'Never feeding swill or uncooked food scraps to pigs.'
    ],
    treatmentSteps: [
      'Immediate isolation of all infected and suspected animals.',
      'Providing soft, easy-to-chew feed (e.g., wet mash) and clean, fresh water.',
      'Supportive wound care: cleaning blisters with mild antiseptics and keeping pens dry.',
      'Reporting the outbreak immediately to government veterinary authorities.'
    ],
    emergencyProtocol: 'Immediate notification of district or state veterinary authorities. Do not move any animals off the property.'
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
    
    description: 'A highly contagious viral disease of dogs causing severe, acute gastrointestinal illness. The virus is extremely resilient in the environment and can survive on surfaces and in soil for months or years.',
    transmission: 'Direct contact with infected dogs, or indirectly by contact with contaminated surfaces, feces, footwear, clothing, or cage equipment.',
    incubation: '3 - 7 days',
    clinicalSigns: [
      'Severe lethargy, depression, and marked reluctance to interact.',
      'Persistent, severe vomiting that prevents retention of oral fluids.',
      'Foul-smelling, bloody diarrhea leading to rapid, life-threatening dehydration.',
      'High fever or subnormal body temperature, accompanied by rapid weight loss.'
    ],
    preventionSteps: [
      'Complete the full puppy vaccination series (typically 3 doses at 6-8, 10-12, and 14-16 weeks).',
      'Keep unvaccinated puppies away from public parks, pet stores, and unfamiliar dogs.',
      'Sanitize contaminated spaces with a diluted bleach solution (1:30 ratio) or veterinary disinfectants.'
    ],
    treatmentSteps: [
      'Immediate veterinary hospitalization for intensive supportive care.',
      'Intravenous fluid therapy (IV fluids) to maintain hydration and restore electrolytes.',
      'Administration of antiemetics (to stop vomiting) and broad-spectrum antibiotics to prevent secondary bacterial infections.',
      'Plasma transfusions or immunoglobulins in critical cases.'
    ],
    emergencyProtocol: 'Immediate isolation from other dogs. Keep the dog indoors and seek urgent veterinary care.'
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
    
    description: 'A highly contagious viral infection affecting domestic poultry and wild birds. Highly Pathogenic Avian Influenza (HPAI) strains cause rapid system failure and near-total mortality in domestic flocks.',
    transmission: 'Direct nose/beak contact with infected wild birds (particularly waterfowl) or contact with contaminated feces, water, feed, cages, and clothing.',
    incubation: '1 - 7 days',
    clinicalSigns: [
      'Sudden death of multiple birds in the flock without prior signs.',
      'Extreme swelling of the head, eyelids, comb, wattles, and hocks.',
      'Purple discoloration (cyanosis) of the comb, wattles, and shanks.',
      'Respiratory distress, coughing, sneezing, nasal discharge, and green watery diarrhea.'
    ],
    preventionSteps: [
      'Install physical netting and enclosures to completely isolate domestic flocks from wild birds.',
      'Enforce strict visitor restrictions and sanitize footwear/vehicles at the gate.',
      'Use clean, treated water sources (never direct river or pond runoff water).'
    ],
    treatmentSteps: [
      'No treatment is allowed for Highly Pathogenic Avian Influenza (HPAI).',
      'The entire affected flock must be humanely culled to prevent regional spread.',
      'Carcasses must be safely disposed of (buried/incinerated) under official supervision.',
      'Establish a strict quarantine zone and wait for authority clearance.'
    ],
    emergencyProtocol: 'Mandatory reporting. Contact the state veterinarian or national animal health agency immediately.'
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
   
    description: 'Also known as "shipping fever," Bovine Respiratory Disease (BRD) is a complex respiratory infection caused by a combination of viral agents, bacterial pathogens, and environmental stressors like transport or weather shifts.',
    transmission: 'Airborne droplets (coughing/sneezing) and direct nose-to-nose contact. Easily spread in overcrowded, stressed, or poorly ventilated environments.',
    incubation: '2 - 10 days post-stress',
    clinicalSigns: [
      'High fever (104°F to 106°F) and dull, depressed behavior.',
      'Mucopurulent (pus-like) nasal discharge and watery eyes.',
      'Frequent coughing, rapid shallow breathing, and audible grunting.',
      'Loss of appetite (off-feed) and noticeable weight loss.'
    ],
    preventionSteps: [
      'Pre-condition calves by vaccinating against common respiratory viruses (IBR, BVD, PI3, BRSV) 2-3 weeks before transport/weaning.',
      'Ensure calves receive adequate quality colostrum at birth.',
      'Minimize dust, provide good ventilation, and avoid mixing cattle from different sources.'
    ],
    treatmentSteps: [
      'Isolate the sick animal in a clean, dry, draft-free pen.',
      'Administer long-acting antibiotics as prescribed by a veterinarian.',
      'Use Non-Steroidal Anti-Inflammatory Drugs (NSAIDs) to reduce fever and lung tissue damage.',
      'Provide highly palatable, high-protein feed and fresh, clean water.'
    ],
    emergencyProtocol: 'Monitor the herd closely. Early intervention is crucial; treat any animal displaying respiratory signs immediately.'
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
   
    description: 'Feline Panleukopenia, commonly called feline distemper, is a highly contagious, life-threatening viral disease caused by the feline parvovirus. It attacks rapidly dividing cells, especially in the bone marrow, lymph nodes, and intestinal lining.',
    transmission: 'Direct contact with infected cats, or indirect contact with contaminated bedding, food bowls, grooming tools, and environments. The virus is highly resistant to freezing and heat.',
    incubation: '2 - 10 days',
    clinicalSigns: [
      'Profound depression, extreme lethargy, and general weakness.',
      'Persistent vomiting and complete refusal of food or water.',
      'Severe, watery, and frequently bloody diarrhea.',
      'Hunched posture, sitting near the water bowl but refusing to drink.'
    ],
    preventionSteps: [
      'Administer the standard FVRCP core vaccines starting at 6-8 weeks of age with proper booster schedules.',
      'Keep indoor cats away from stray cats or outdoor enclosures.',
      'Sanitize all feline equipment and cages using specialized virucidal disinfectants.'
    ],
    treatmentSteps: [
      'Immediate veterinary isolation and hospitalization.',
      'Intravenous fluid therapy to combat dehydration and maintain electrolyte balance.',
      'Injectable antiemetics and broad-spectrum antibiotics to control secondary infections.',
      'Assisted nutritional support once vomiting has been controlled.'
    ],
    emergencyProtocol: 'Separate the cat immediately from all other felines. Thoroughly wash your hands and change clothes after handling, and consult a vet.'
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
    
    description: 'African Swine Fever (ASF) is a highly contagious and lethal viral disease affecting domestic and wild pigs. It causes hemorrhagic fever and can kill up to 100% of infected pigs, causing catastrophic agricultural disruption.',
    transmission: 'Direct contact with infected swine, feeding contaminated swill (food waste), or bites from infected soft ticks. The virus is exceptionally stable in carcasses, blood, and cured pork products.',
    incubation: '3 - 15 days',
    clinicalSigns: [
      'High body temperature (above 105°F / 41°C).',
      'Redness or blue/purple patches on the skin of the ears, snout, chest, tail, and belly.',
      'Loss of appetite, severe lethargy, coughing, and labored breathing.',
      'Vomiting, bloody diarrhea, and high abortion rates in pregnant sows.'
    ],
    preventionSteps: [
      'Banning swill feeding (feeding food waste or table scraps to pigs) completely.',
      'Erecting double fencing to prevent any contact between domestic pigs and wild boars.',
      'Strict quarantine of all new pigs for at least 30 days before integration.',
      'Implementing strict footwear baths and truck disinfection stations.'
    ],
    treatmentSteps: [
      'No vaccine or treatment currently exists.',
      'All pigs in infected herds must be humanely euthanized (culled) to stop transmission.',
      'Strict quarantine zones are put in place, with deep burial or incineration of carcasses.',
      'Complete sanitization of the farm, followed by a fallow period before restocking.'
    ],
    emergencyProtocol: 'High alert. Report any swine showing skin discoloration or sudden deaths immediately to government agricultural officials.'
  }
  
];

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

const getDiseaseImage = (disease) => {
  if (disease.image && disease.image !== '/default.jpg') {
    if (disease.image.startsWith('http') || disease.image.startsWith('/') || disease.image.startsWith('data:')) {
      return disease.image;
    }
    return `${import.meta.env.VITE_BACKEND_URL}${disease.image}`;
  }
  
  const name = disease.name ? disease.name.toLowerCase() : '';
  const category = disease.category ? disease.category.toLowerCase() : '';
  const speciesList = Array.isArray(disease.species)
    ? disease.species
    : typeof disease.species === 'string' && disease.species
    ? disease.species.split(',').map(s => s.trim())
    : [];
  const species = speciesList.map(s => (s || '').toLowerCase());

  if (name.includes('foot') || name.includes('mouth') || name.includes('mastitis') || species.includes('cattle') || category.includes('cattle')) {
    return '/cows.jpg';
  }
  if (name.includes('avian') || name.includes('influenza') || species.includes('poultry') || species.includes('birds') || category.includes('poultry')) {
    return '/poultry.jpg';
  }
  if (name.includes('parvovirus') || species.includes('dogs') || category.includes('dogs')) {
    return '/dog.jpg';
  }
  if (name.includes('swine') || species.includes('pigs') || category.includes('pigs') || category.includes('swine')) {
    return '/pig.jpg';
  }
  if (name.includes('feline') || name.includes('panleukopenia') || species.includes('cats') || category.includes('cats')) {
    return '/vetcat.jpg';
  }
  
  return '/cows.jpg';
};

function DiseaseGuideModal({ disease, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const riskStyles = getRiskStyles(disease.risk);

  const speciesList = Array.isArray(disease.species)
    ? disease.species
    : typeof disease.species === 'string' && disease.species
    ? disease.species.split(',').map(s => s.trim())
    : [];

  const clinicalSignsList = Array.isArray(disease.clinicalSigns)
    ? disease.clinicalSigns
    : typeof disease.clinicalSigns === 'string' && disease.clinicalSigns
    ? [disease.clinicalSigns]
    : [];

  const preventionStepsList = Array.isArray(disease.preventionSteps)
    ? disease.preventionSteps
    : typeof disease.preventionSteps === 'string' && disease.preventionSteps
    ? [disease.preventionSteps]
    : [];

  const treatmentStepsList = Array.isArray(disease.treatmentSteps)
    ? disease.treatmentSteps
    : typeof disease.treatmentSteps === 'string' && disease.treatmentSteps
    ? [disease.treatmentSteps]
    : [];

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Banner Image with Overlay */}
        <div className="relative h-48 sm:h-64 bg-slate-100 shrink-0">
          <img
            src={getDiseaseImage(disease)}
            alt={disease.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white hover:text-white rounded-full transition-colors shadow-sm cursor-pointer border border-white/10"
          >
            <X size={20} />
          </button>
          {/* Badge & Title overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border mb-3 shadow-md ${riskStyles.badge} bg-white/95 backdrop-blur-xs`}>
              <span className={`w-1.5 h-1.5 rounded-full ${riskStyles.indicator}`} />
              {disease.risk}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-sm">
              {disease.name}
            </h2>
            <p className="text-emerald-300 font-semibold text-sm mt-1">
              Affects: {speciesList.length > 0 ? speciesList.join(', ') : (disease.category || 'All Animals')}
            </p>
          </div>
        </div>
        {/* Tab Selection Row */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview & Symptoms
          </button>
          <button
            onClick={() => setActiveTab('prevention')}
            className={`py-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'prevention'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Prevention & Biosecurity
          </button>
          <button
            onClick={() => setActiveTab('treatment')}
            className={`py-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'treatment'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Treatment & Protocol
          </button>
        </div>
        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Info className="text-slate-400" size={18} />
                  Disease Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {disease.description}
                </p>
              </div>
              {/* Incubation & Transmission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Incubation Period</span>
                  <p className="text-sm font-bold text-slate-700 mt-1">{disease.incubation}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Transmission Mode</span>
                  <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">{disease.transmission}</p>
                </div>
              </div>
              {/* Symptoms Details */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={18} />
                  Clinical Signs & Identification
                </h3>
                <ul className="space-y-2.5">
                  {clinicalSignsList.map((sign, index) => (
                    <li key={index} className="flex gap-2.5 items-start text-sm text-slate-600 font-medium">
                      <span className="h-5 w-5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'prevention' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="text-blue-500" size={18} />
                  Prevention Measures
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-2">
                  Implementing proactive biosecurity practices is the most effective way to protect your herd or flock from transmission.
                </p>
                <ul className="space-y-3">
                  {preventionStepsList.map((step, index) => (
                    <li key={index} className="flex gap-3 items-start text-sm text-slate-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'treatment' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Treatment */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Activity className="text-green-500" size={18} />
                  Treatment & Supportive Care
                </h3>
                <ul className="space-y-3">
                  {treatmentStepsList.map((step, index) => (
                    <li key={index} className="flex gap-3 items-start text-sm text-slate-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-2" />
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Emergency Protocol alert */}
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-3.5 items-start">
                <div className="p-2 bg-white rounded-xl text-rose-600 border border-rose-100 shadow-sm shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-rose-800">Emergency & Reporting Protocol</h4>
                  <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                    {disease.emergencyProtocol}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-bold active:scale-95 transition-all cursor-pointer shadow-md"
          >
            Close Guide
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DiseasesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGuide, setActiveGuide] = useState(null);
  const [diseases, setDiseases] = useState(DISEASES_DATA);

  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const safeParseArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(',').map(s => s.trim());
      }
      return [val.trim()];
    }
    return [];
  };

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/public/diseases`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const normalizedData = data.map(d => ({
              ...d,
              species: safeParseArray(d.species),
              clinicalSigns: safeParseArray(d.clinicalSigns),
              preventionSteps: safeParseArray(d.preventionSteps),
              treatmentSteps: safeParseArray(d.treatmentSteps)
            }));

            setDiseases(normalizedData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch public diseases:", error);
      }
    };
    fetchDiseases();
  }, []);

  const categories = useMemo(() => {
    const baseCategories = ['All', 'Cattle', 'Poultry', 'Dogs', 'Cats', 'Swine'];
    const dynamicSet = new Set(baseCategories);
    diseases.forEach((d) => {
      if (d.category) dynamicSet.add(d.category);
      if (Array.isArray(d.species)) {
        d.species.forEach((s) => dynamicSet.add(s));
      } else if (typeof d.species === 'string' && d.species.trim()) {
        dynamicSet.add(d.species.trim());
      }
    });
    return Array.from(dynamicSet);
  }, [diseases]);

  // Filter diseases based on search query and category
  const filteredDiseases = useMemo(() => {
    return diseases.filter((disease) => {
      const diseaseName = (disease.name || '').toLowerCase();
      const diseaseSymptoms = (disease.symptoms || '').toLowerCase();
      const speciesList = Array.isArray(disease.species)
        ? disease.species
        : typeof disease.species === 'string' && disease.species
        ? [disease.species]
        : [];
      
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        diseaseName.includes(query) ||
        diseaseSymptoms.includes(query) ||
        speciesList.some(s => (s || '').toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'All' ||
        disease.category === selectedCategory ||
        speciesList.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, diseases]);

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
            const speciesList = Array.isArray(disease.species)
              ? disease.species
              : typeof disease.species === 'string' && disease.species
              ? disease.species.split(',').map(s => s.trim())
              : [];
            return (
              <Card
                key={disease.id}
                className="flex flex-col md:flex-row bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 min-h-[300px]"
              >
                {/* Left: Image Side */}
                <div className="w-full md:w-48 xl:w-52 h-52 md:h-auto shrink-0 relative bg-slate-100">
                  <img
                    src={getDiseaseImage(disease)}
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Risk Badge on Image */}
                 <span className={`absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border shadow-sm ${riskStyles.badge} bg-white/95 backdrop-blur-xs`}>
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
                      Affects: {speciesList.length > 0 ? speciesList.join(', ') : (disease.category || 'All Animals')}
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

      {/* Disease Guide Modal Overlay */}
      <AnimatePresence>
        {activeGuide && (
          <DiseaseGuideModal
            disease={activeGuide}
            onClose={() => setActiveGuide(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
