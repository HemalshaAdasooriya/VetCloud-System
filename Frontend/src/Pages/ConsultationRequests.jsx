// export default function ConsultationRequests() {
//     return (
//         <div className="w-full h-screen flex items-center justify-center">
//             <h1 className="text-4xl font-bold text-slate-700">Consultation Requests</h1>
//         </div>
//     )
// }


import { useState } from 'react';
import { Video, MessageCircle, Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, Search, Star, ShieldCheck, MapPin, Plus } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui/ui';

export default function ConsultationRequest() {
  const [step, setStep] = useState(1);
  const [consultType, setConsultType] = useState('video');
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [selectedVet, setSelectedVet] = useState('');

  const vets = [
    { id: 1, name: 'Dr. Sarah Smith', spec: 'Livestock & Large Animals', exp: '10 Years', rating: 4.9, available: true, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop' },
    { id: 2, name: 'Dr. John Doe', spec: 'Small Pets & Exotics', exp: '8 Years', rating: 4.8, available: true, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop' },
    { id: 3, name: 'Dr. Emily Chen', spec: 'Poultry & Swine', exp: '12 Years', rating: 5.0, available: false, image: 'https://images.unsplash.com/photo-1594824432258-0056973ece6c?q=80&w=2070&auto=format&fit=crop' },
  ];

  const animals = [
    { id: 1, name: 'Bessie', type: 'Cattle', species: 'Holstein Cow', age: '4 years', weight: '650 kg', tagNumber: 'CT-001', lastCheckup: 'Oct 10, 2024', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=2072&auto=format&fit=crop' },
    { id: 2, name: 'Max', type: 'Dog', species: 'Golden Retriever', age: '2 years', weight: '32 kg', tagNumber: 'DG-002', lastCheckup: 'Sep 24, 2024', image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?q=80&w=2070&auto=format&fit=crop' },
    { id: 3, name: 'Daisy', type: 'Goat', species: 'Boer Goat', age: '1 year', weight: '45 kg', tagNumber: 'GT-003', lastCheckup: 'Aug 15, 2024', image: 'https://images.unsplash.com/photo-1533318087102-b3ad366ed041?q=80&w=2070&auto=format&fit=crop' },
    { id: 4, name: 'Charlie', type: 'Horse', species: 'Arabian', age: '6 years', weight: '450 kg', tagNumber: 'HR-004', lastCheckup: 'Nov 01, 2024', image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop' },
  ];

  const getSelectedAnimal = () => animals.find(a => a.id === selectedAnimal);
  const getSelectedVet = () => vets.find(v => v.id === selectedVet);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Book a Consultation</h1>
          <p className="text-slate-600">Connect with an expert veterinary doctor for your animal's health needs.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
          {['Select Animal', 'Select Vet', 'Details', 'Confirm'].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${step >= i + 1 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > i + 1 ? <CheckCircle2 size={20} /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${step >= i + 1 ? 'text-green-600' : 'text-slate-400'}`}>{s}</span>
              {i < 3 && (
                <div className={`absolute top-5 left-10 w-[calc(100%+3rem)] h-[2px] -translate-y-1/2 ${step > i + 1 ? 'bg-green-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {step === 1 && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Select Your Animal</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input placeholder="Search your animals..." className="pl-9" />
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 mb-6">
                {animals.map((animal) => (
                  <Card 
                    key={animal.id} 
                    className={`p-4 cursor-pointer hover:border-green-500 transition-all hover:shadow-md ${selectedAnimal === animal.id ? 'border-2 border-green-500 bg-green-50 shadow-md' : 'border border-slate-200'}`} 
                    onClick={() => setSelectedAnimal(animal.id)}
                  >
                    <div className="flex gap-4">
                      <img src={animal.image} alt={animal.name} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg text-slate-900">{animal.name}</h3>
                          {selectedAnimal === animal.id && (
                            <CheckCircle2 size={20} className="text-green-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-green-600 mb-1">{animal.species}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <Badge variant="default" className="text-[10px] bg-slate-100 text-slate-600">{animal.type}</Badge>
                          <span>{animal.age}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Add New Animal Card */}
              <Card className="p-4 border-2 border-dashed border-slate-300 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all group">
                <div className="flex items-center justify-center gap-3 text-slate-600 group-hover:text-green-600 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Add New Animal</h3>
                    <p className="text-sm">Register a new animal to your profile</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                <Button onClick={() => setStep(2)} disabled={!selectedAnimal}>
                  Continue to Select Vet <ChevronRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Select a Veterinarian</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input placeholder="Search by name or specialty..." className="pl-9" />
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {vets.map((vet) => (
                  <Card 
                    key={vet.id} 
                    className={`p-4 cursor-pointer hover:border-green-500 transition-colors ${selectedVet === vet.id ? 'border-2 border-green-500 bg-green-50' : 'border border-slate-200'}`} 
                    onClick={() => setSelectedVet(vet.id)}
                  >
                    <div className="flex gap-4">
                      <img src={vet.image} alt={vet.name} className="w-24 h-24 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-slate-900">{vet.name}</h3>
                          {vet.available ? (
                            <Badge variant="success" className="text-[10px] uppercase tracking-wider">Available Now</Badge>
                          ) : (
                            <Badge className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500">Offline</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-green-600 mb-1">{vet.spec}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> {vet.rating}</span>
                          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-blue-500" /> {vet.exp}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} disabled={!selectedVet}>Continue to Details <ChevronRight size={16} className="ml-2" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Consultation Details</h2>
              
              <div className="space-y-8 max-w-3xl">
                {/* Animal Details Summary */}
                {getSelectedAnimal() && (
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Selected Animal Details
                    </h3>
                    <div className="flex gap-4">
                      <img 
                        src={getSelectedAnimal().image} 
                        alt={getSelectedAnimal().name} 
                        className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-sm" 
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-slate-900 mb-1">{getSelectedAnimal().name}</h4>
                        <p className="text-sm font-medium text-green-700 mb-3">{getSelectedAnimal().species}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-slate-500">Type:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().type}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Age:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().age}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Weight:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().weight}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Tag ID:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().tagNumber}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500">Last Checkup:</span>
                            <span className="font-semibold text-slate-800 ml-2">{getSelectedAnimal().lastCheckup}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Consultation Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setConsultType('video')}
                      className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-semibold transition-colors ${consultType === 'video' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <Video size={24} className={consultType === 'video' ? 'text-green-600' : 'text-slate-400'} />
                      Video Call
                    </button>
                    <button 
                      onClick={() => setConsultType('chat')}
                      className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-semibold transition-colors ${consultType === 'chat' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <MessageCircle size={24} className={consultType === 'chat' ? 'text-green-600' : 'text-slate-400'} />
                      Chat / Messages
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Describe Symptoms</label>
                  <textarea 
                    className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                    placeholder="Describe what's wrong with your animal... (e.g., loss of appetite, lethargy, coughing)"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Upload Images (Optional)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-green-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </div>

                {/* Schedule Section Inline */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Choose Date & Time</label>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Select Date</p>
                      <div className="border border-slate-200 rounded-lg p-4 bg-white">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button className="p-1 hover:bg-slate-100 rounded">
                            <ChevronRight size={16} className="rotate-180 text-slate-600" />
                          </button>
                          <h4 className="font-semibold text-sm text-slate-700">October 2024</h4>
                          <button className="p-1 hover:bg-slate-100 rounded">
                            <ChevronRight size={16} className="text-slate-600" />
                          </button>
                        </div>
                        
                        {/* Calendar Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-center text-[10px] font-semibold text-slate-400 py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Calendar Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {/* Empty cells for days before month starts (Oct 2024 starts on Tuesday) */}
                          {[...Array(2)].map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square"></div>
                          ))}
                          
                          {/* Days of the month */}
                          {[...Array(31)].map((_, i) => {
                            const day = i + 1;
                            const isToday = day === 24;
                            const isSelected = day === 25;
                            const isPast = day < 24;
                            
                            return (
                              <button
                                key={day}
                                disabled={isPast}
                                className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : isToday
                                    ? 'border-2 border-green-600 text-green-600 hover:bg-green-50'
                                    : isPast
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-green-50 hover:border-green-300 border border-transparent'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <div className="w-3 h-3 rounded border-2 border-green-600"></div>
                            <span>Today</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <div className="w-3 h-3 rounded bg-green-600"></div>
                            <span>Selected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Available Times</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'].map((time, i) => (
                          <button key={i} className={`p-2 text-center flex justify-center items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors ${i === 2 ? 'bg-green-600 border-green-600 text-white' : 'border-slate-200 text-slate-700 hover:border-green-300'}`}>
                            <Clock size={14} /> {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={() => setStep(4)}>Review & Confirm <ChevronRight size={16} className="ml-2" /></Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Confirm Appointment</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <Card className="p-6 bg-slate-50 border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Consultation Summary</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="font-medium text-slate-900">Dr. Sarah Smith</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Specialty</span><span className="font-medium text-slate-900">Livestock & Large Animals</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-medium text-slate-900">Bessie (Cattle)</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium text-slate-900 flex items-center gap-1"><Video size={14} className="text-green-600" /> Video Call</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Date & Time</span><span className="font-medium text-slate-900 flex items-center gap-1"><CalendarIcon size={14} className="text-green-600" /> Tomorrow, 01:00 PM</span></div>
                  </div>
                </Card>

                <Card className="p-6 bg-slate-50 border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">Payment Details</h3>
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between"><span className="text-slate-500">Consultation Fee</span><span className="font-medium text-slate-900">$45.00</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Platform Fee</span><span className="font-medium text-slate-900">$2.50</span></div>
                    <div className="flex justify-between pt-2 border-t font-bold text-lg"><span className="text-slate-800">Total Amount</span><span className="text-green-600">$47.50</span></div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 mb-4">
                    <div className="w-10 h-6 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center">VISA</div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Visa ending in 4242</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button size="lg" className="w-48">Confirm & Pay</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}