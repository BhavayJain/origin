const bcrypt = require('bcryptjs');
const repo = require('./services/repository');

const commonFacilities = [
  'Smart classrooms with interactive boards',
  'Age-appropriate library and reading corners',
  'Early-years activity and discovery corners',
  'Creative art and storytelling zone',
  'Outdoor playground and indoor play zone',
  'Child-safe transport coordination',
  'CCTV-monitored common areas',
  'Medical room with first-aid support'
];

const branches = [
  {
    name: 'Vidyarupa Discovery Kids - Panjabari',
    address: 'Panjabari, Guwahati, Assam',
    phone: '+91 98765 41001',
    mapUrl: 'https://maps.app.goo.gl/Y1VPP8zC3BMXEj3V',
    mapEmbedUrl: 'https://www.google.com/maps?q=Vidyarupa%20Discovery%20Kids%20Panjabari&output=embed',
    image: '/images/branch-panjabari.svg',
    heroImages: ['/images/campus.svg', '/images/classroom.svg', '/images/activities.svg'],
    facilities: [...commonFacilities, 'Parent interaction area', 'Pre-school readiness program'],
    admissionStatus: 'Open',
    description: 'A warm pre-school branch focused on playful discovery, foundational language, early numeracy, social confidence, and safe daily routines.',
    faculty: [
      { name: 'Branch Coordinator', role: 'Pre-school Lead', qualification: 'Early Childhood Education', experience: 'Experienced' },
      { name: 'Activity Mentor', role: 'Creative Learning', qualification: 'Child Development Training', experience: 'Experienced' },
      { name: 'Care Team', role: 'Student Support', qualification: 'First-aid and Safety Trained', experience: 'Experienced' }
    ],
    gallery: ['/images/campus.svg', '/images/classroom.svg', '/images/playground.svg']
  },
  {
    name: 'Vidyarupa Discovery Kids - Hatigaon',
    address: 'Hatigaon, Guwahati, Assam',
    phone: '+91 98765 41002',
    mapUrl: 'https://share.google/06qCGudxcNoj2rNow',
    mapEmbedUrl: 'https://www.google.com/maps?q=Vidyarupa%20Discovery%20Kids%20Hatigaon&output=embed',
    image: '/images/branch-hatigaon.svg',
    heroImages: ['/images/classroom.svg', '/images/library.svg', '/images/playground.svg'],
    facilities: [...commonFacilities, 'Phonics and storytelling support', 'Music and movement activities'],
    admissionStatus: 'Limited Seats',
    description: 'A parent-friendly pre-school environment for early learning, habit building, creative play, and confident classroom participation.',
    faculty: [
      { name: 'Branch Coordinator', role: 'Pre-school Lead', qualification: 'Early Childhood Education', experience: 'Experienced' },
      { name: 'Language Mentor', role: 'Phonics and Storytelling', qualification: 'Pre-primary Teaching Training', experience: 'Experienced' },
      { name: 'Care Team', role: 'Student Support', qualification: 'First-aid and Safety Trained', experience: 'Experienced' }
    ],
    gallery: ['/images/library.svg', '/images/activities.svg', '/images/classroom.svg']
  },
  {
    name: 'Vidyarupa Discovery Kids - Moregaon',
    address: 'Moregaon, Assam',
    phone: '+91 98765 41003',
    mapUrl: 'https://share.google/IS84v9euN0qvX68mw',
    mapEmbedUrl: 'https://www.google.com/maps?q=Vidyarupa%20Discovery%20Kids%20Moregaon&output=embed',
    image: '/images/branch-moregaon.svg',
    heroImages: ['/images/playground.svg', '/images/science.svg', '/images/campus.svg'],
    facilities: [...commonFacilities, 'Sensorial learning materials', 'Festival and community activities'],
    admissionStatus: 'Open',
    description: 'A nurturing pre-school branch for discovery-based learning, guided play, social development, and school readiness.',
    faculty: [
      { name: 'Branch Coordinator', role: 'Pre-school Lead', qualification: 'Early Childhood Education', experience: 'Experienced' },
      { name: 'Activity Mentor', role: 'Sensorial Learning', qualification: 'Pre-primary Teaching Training', experience: 'Experienced' },
      { name: 'Care Team', role: 'Student Support', qualification: 'First-aid and Safety Trained', experience: 'Experienced' }
    ],
    gallery: ['/images/playground.svg', '/images/science.svg', '/images/campus.svg']
  }
];

const fees = [
  { level: 'Playgroup', admissionFee: 12000, monthlyTuition: 3500, annualCharges: 8000, transportFee: 0 },
  { level: 'Nursery', admissionFee: 15000, monthlyTuition: 4000, annualCharges: 9000, transportFee: 0 },
  { level: 'LKG / UKG', admissionFee: 18000, monthlyTuition: 4500, annualCharges: 10000, transportFee: 0 }
];

async function seedData() {
  const existingBranches = await repo.getBranches();
  if (!existingBranches.length) {
    for (const branch of branches) await repo.createBranch(branch);
  }

  const existingFees = await repo.getFees();
  if (!existingFees.length) {
    for (const fee of fees) await repo.createFee(fee);
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vidyarupa.edu').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Vidyarupa@2026';
  const existingAdmin = await repo.findAdminByEmail(adminEmail);
  if (!existingAdmin) {
    await repo.createAdmin({
      email: adminEmail,
      name: 'Vidyarupa Admin',
      role: 'admin',
      passwordHash: await bcrypt.hash(adminPassword, 12)
    });
  }
}

module.exports = { seedData, branches, fees };
