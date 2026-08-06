import db from "../config/db.js";

const defaultDiseases = [
  {
    slug: 'fmd',
    name: 'Foot-and-Mouth Disease (FMD)',
    species: JSON.stringify(['Cattle', 'Swine', 'Sheep', 'Goats']),
    category: 'Cattle',
    risk: 'High Risk',
    image: '/cows.jpg',
    symptoms: 'Fever, Blisters in mouth, Lameness, Drop in milk production',
    prevention: 'Vaccination, strict biosecurity, quarantine of new stock',
    treatment: 'No specific treatment. Affected animals are isolated; supportive care can manage discomfort.',
    description: 'A highly contagious viral disease affecting cloven-hoofed animals. It is characterized by high fever and vesicle formation in the mouth, muzzle, teats, and feet, leading to significant productivity loss.',
    transmission: 'Direct contact with infected animals, airborne transmission (up to several kilometers in humid conditions), or indirect contact via contaminated vehicles, footwear, or uncooked food scraps.',
    incubation: '2 - 14 days',
    clinicalSigns: JSON.stringify([
      'High fever (up to 105°F / 41°C) and sudden shivering.',
      'Vesicles (blisters) on the tongue, lips, gums, teats, and interdigital space of hooves.',
      'Reluctance to move, lameness, and lying down frequently.',
      'Heavy salivation (drooling) and a characteristic smacking or clicking sound of the lips.',
      'Severe drop in milk yield in dairy cows and sudden abortions in pregnant females.'
    ]),
    preventionSteps: JSON.stringify([
      'Regular vaccine boosters in endemic zones.',
      'Strict quarantine of all new livestock for a minimum of 21 days.',
      'Rigorous biosecurity: disinfection of vehicles, footwear, and equipment.',
      'Never feeding swill or uncooked food scraps to pigs.'
    ]),
    treatmentSteps: JSON.stringify([
      'Immediate isolation of all infected and suspected animals.',
      'Providing soft, easy-to-chew feed (e.g., wet mash) and clean, fresh water.',
      'Supportive wound care: cleaning blisters with mild antiseptics and keeping pens dry.',
      'Reporting the outbreak immediately to government veterinary authorities.'
    ]),
    emergencyProtocol: 'Immediate notification of district or state veterinary authorities. Do not move any animals off the property.'
  },
  {
    slug: 'parvo',
    name: 'Canine Parvovirus',
    species: JSON.stringify(['Dogs']),
    category: 'Dogs',
    risk: 'High Risk',
    image: '/dog.jpg',
    symptoms: 'Lethargy, Severe vomiting, Bloody diarrhea, Loss of appetite',
    prevention: 'Core vaccination starting at 6-8 weeks of age.',
    treatment: 'Intensive hospital care, IV fluids, anti-nausea medication',
    description: 'A highly contagious viral disease of dogs causing severe, acute gastrointestinal illness. The virus is extremely resilient in the environment and can survive on surfaces and in soil for months or years.',
    transmission: 'Direct contact with infected dogs, or indirectly by contact with contaminated surfaces, feces, footwear, clothing, or cage equipment.',
    incubation: '3 - 7 days',
    clinicalSigns: JSON.stringify([
      'Severe lethargy, depression, and marked reluctance to interact.',
      'Persistent, severe vomiting that prevents retention of oral fluids.',
      'Foul-smelling, bloody diarrhea leading to rapid, life-threatening dehydration.',
      'High fever or subnormal body temperature, accompanied by rapid weight loss.'
    ]),
    preventionSteps: JSON.stringify([
      'Complete the full puppy vaccination series (typically 3 doses at 6-8, 10-12, and 14-16 weeks).',
      'Keep unvaccinated puppies away from public parks, pet stores, and unfamiliar dogs.',
      'Sanitize contaminated spaces with a diluted bleach solution (1:30 ratio) or veterinary disinfectants.'
    ]),
    treatmentSteps: JSON.stringify([
      'Immediate veterinary hospitalization for intensive supportive care.',
      'Intravenous fluid therapy (IV fluids) to maintain hydration and restore electrolytes.',
      'Administration of antiemetics (to stop vomiting) and broad-spectrum antibiotics to prevent secondary bacterial infections.',
      'Plasma transfusions or immunoglobulins in critical cases.'
    ]),
    emergencyProtocol: 'Immediate isolation from other dogs. Keep the dog indoors and seek urgent veterinary care.'
  },
  {
    slug: 'birdflu',
    name: 'Avian Influenza (Bird Flu)',
    species: JSON.stringify(['Poultry']),
    category: 'Poultry',
    risk: 'Critical Risk',
    image: '/poultry.jpg',
    symptoms: 'Sudden death, Swollen head, Purple discoloration, Respiratory distress',
    prevention: 'Keep flocks away from wild birds, secure housing',
    treatment: 'Highly contagious and often fatal. Immediate reporting is required.',
    description: 'A highly contagious viral infection affecting domestic poultry and wild birds. Highly Pathogenic Avian Influenza (HPAI) strains cause rapid system failure and near-total mortality in domestic flocks.',
    transmission: 'Direct nose/beak contact with infected wild birds (particularly waterfowl) or contact with contaminated feces, water, feed, cages, and clothing.',
    incubation: '1 - 7 days',
    clinicalSigns: JSON.stringify([
      'Sudden death of multiple birds in the flock without prior signs.',
      'Extreme swelling of the head, eyelids, comb, wattles, and hocks.',
      'Purple discoloration (cyanosis) of the comb, wattles, and shanks.',
      'Respiratory distress, coughing, sneezing, nasal discharge, and green watery diarrhea.'
    ]),
    preventionSteps: JSON.stringify([
      'Install physical netting and enclosures to completely isolate domestic flocks from wild birds.',
      'Enforce strict visitor restrictions and sanitize footwear/vehicles at the gate.',
      'Use clean, treated water sources (never direct river or pond runoff water).'
    ]),
    treatmentSteps: JSON.stringify([
      'No treatment is allowed for Highly Pathogenic Avian Influenza (HPAI).',
      'The entire affected flock must be humanely culled to prevent regional spread.',
      'Carcasses must be safely disposed of (buried/incinerated) under official supervision.',
      'Establish a strict quarantine zone and wait for authority clearance.'
    ]),
    emergencyProtocol: 'Mandatory reporting. Contact the state veterinarian or national animal health agency immediately.'
  },
  {
    slug: 'rabies',
    name: 'Rabies',
    species: JSON.stringify(['Dogs', 'Cats', 'Cattle']),
    category: 'Dogs',
    risk: 'Critical Risk',
    image: '/dog.jpg',
    symptoms: 'Behavioral changes, Aggression, Excessive salivation, Paralysis',
    prevention: 'Annual or 3-year rabies vaccination for all domestic pets and livestock.',
    treatment: 'Fatal once clinical symptoms appear. Immediate post-exposure prophylaxis for humans.',
    description: 'A fatal viral disease affecting the central nervous system of warm-blooded mammals, transmitted primarily through bites from infected animals.',
    transmission: 'Saliva from infected animals entering body via bites, scratches, or open wounds.',
    incubation: '1 - 3 months',
    clinicalSigns: JSON.stringify([
      'Sudden change in temperament (unexplained aggression or unusual shyness).',
      'Excessive foaming at the mouth and difficulty swallowing (hydrophobia).',
      'Progressive paralysis starting in hind limbs leading to respiratory failure.'
    ]),
    preventionSteps: JSON.stringify([
      'Vaccinate all pets and livestock regularly.',
      'Avoid contact with wild or unknown stray animals.',
      'Report suspected rabid animals to local animal control.'
    ]),
    treatmentSteps: JSON.stringify([
      'No effective treatment once clinical signs manifest.',
      'Quarantine and humane euthanasia of suspected animals under official guidance.'
    ]),
    emergencyProtocol: 'Urgent medical and veterinary emergency. Wash wounds thoroughly with soap and water for 15 minutes and seek immediate human PEP treatment.'
  },
  {
    slug: 'mastitis',
    name: 'Bovine Mastitis',
    species: JSON.stringify(['Cattle']),
    category: 'Cattle',
    risk: 'Medium Risk',
    image: '/cows.jpg',
    symptoms: 'Swollen udder, Flakes or clots in milk, Reduced milk yield, Fever',
    prevention: 'Good milking hygiene, teat dipping, clean bedding, dry cow therapy.',
    treatment: 'Intramammary antibiotic infusion, anti-inflammatory drugs, frequent milking out.',
    description: 'Inflammation of the mammary gland (udder) in dairy cows, usually caused by bacterial infection, resulting in significant economic losses.',
    transmission: 'Bacterial entry via teat canal during milking or from contaminated environment/bedding.',
    incubation: '1 - 5 days',
    clinicalSigns: JSON.stringify([
      'Visibly swollen, hot, and tender quarter of the udder.',
      'Milk containing clots, flakes, pus, or watery consistency.',
      'Systemic illness: fever, loss of appetite, depression in severe cases.'
    ]),
    preventionSteps: JSON.stringify([
      'Post-milking teat disinfection with iodine or chlorhexidine teat dip.',
      'Maintain clean, dry housing and bedding for dairy cows.',
      'Ensure proper milking machine vacuum and liner maintenance.'
    ]),
    treatmentSteps: JSON.stringify([
      'Administer targeted intramammary antibiotic tubes as prescribed by vet.',
      'Apply NSAIDs (pain/inflammation relief).',
      'Frequent stripping of affected quarter to remove toxins.'
    ]),
    emergencyProtocol: 'Isolate affected cow and discard milk from treated animals according to antibiotic withdrawal periods.'
  }
];

// Ensure diseases table exists and is populated
export const initializeDiseasesTable = () => {
    const createDiseasesTableSql = `
        CREATE TABLE IF NOT EXISTS diseases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            species TEXT,
            category VARCHAR(100) DEFAULT 'General',
            risk VARCHAR(50) DEFAULT 'Medium Risk',
            image TEXT,
            symptoms TEXT,
            prevention TEXT,
            treatment TEXT,
            description TEXT,
            transmission TEXT,
            incubation VARCHAR(255),
            clinicalSigns TEXT,
            preventionSteps TEXT,
            treatmentSteps TEXT,
            emergencyProtocol TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    db.query(createDiseasesTableSql, (err) => {
        if (err) {
            console.error("Error creating diseases table:", err);
            return;
        }
        console.log("MySQL 'diseases' table verified.");

        // Check if table is empty and seed default records
        db.query("SELECT COUNT(*) AS count FROM diseases", (countErr, results) => {
            if (countErr) {
                console.error("Error checking diseases count:", countErr);
                return;
            }

            if (results[0].count === 0) {
                console.log("Seeding default animal diseases into database...");
                const insertSql = `
                    INSERT INTO diseases (slug, name, species, category, risk, image, symptoms, prevention, treatment, description, transmission, incubation, clinicalSigns, preventionSteps, treatmentSteps, emergencyProtocol)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                defaultDiseases.forEach((d) => {
                    db.query(insertSql, [
                        d.slug, d.name, d.species, d.category, d.risk, d.image,
                        d.symptoms, d.prevention, d.treatment, d.description, d.transmission,
                        d.incubation, d.clinicalSigns, d.preventionSteps, d.treatmentSteps, d.emergencyProtocol
                    ], (insertErr) => {
                        if (insertErr) console.error(`Error seeding disease ${d.name}:`, insertErr);
                    });
                });
            }
        });
    });
};

initializeDiseasesTable();
