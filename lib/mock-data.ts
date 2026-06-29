import type {
  Beneficiary,
  CheckinConfig,
  Contact,
  Credential,
  Document,
  Instruction,
  Owner,
  Policy,
  Reminder,
  TriggerState,
} from './types'

// Helper to produce ISO dates relative to "now" so the demo always feels live.
function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export const owner: Owner = {
  id: 'owner-1',
  name: 'Ravi Sharma',
  email: 'ravi.sharma@gmail.com',
  protecting: 'Priya (wife) & Aanya (daughter, 9)',
}

export const documents: Document[] = [
  {
    id: 'doc-1',
    kind: 'file',
    category: 'health_insurance',
    title: 'HDFC Ergo Family Health Policy',
    fileName: 'hdfc-health-2024.pdf',
    notes: 'Family floater covering Ravi, Priya and Aanya. Cashless at network hospitals.',
    sensitive: false,
    uploadedAt: daysFromNow(-210),
  },
  {
    id: 'doc-2',
    kind: 'file',
    category: 'life_insurance',
    title: 'LIC Term Life — Jeevan Amar',
    fileName: 'lic-term-life.pdf',
    notes: 'Pure term cover. Nominee: Priya Sharma.',
    sensitive: false,
    uploadedAt: daysFromNow(-180),
  },
  {
    id: 'doc-3',
    kind: 'file',
    category: 'documents',
    title: 'Annual Health Checkup — Apollo',
    fileName: 'apollo-checkup-report.pdf',
    notes: 'Lipid profile slightly elevated. On Atorvastatin since.',
    sensitive: true,
    uploadedAt: daysFromNow(-95),
  },
  {
    id: 'doc-4',
    kind: 'file',
    category: 'documents',
    title: 'Last Will & Testament',
    fileName: 'will-registered-2023.pdf',
    notes: 'Registered will. Executor: brother Arjun Sharma.',
    sensitive: true,
    uploadedAt: daysFromNow(-320),
  },
  {
    id: 'doc-5',
    kind: 'file',
    category: 'documents',
    title: 'Mutual Fund Portfolio Statement',
    fileName: 'cams-consolidated.pdf',
    notes: 'Consolidated CAMS statement across all folios.',
    sensitive: true,
    uploadedAt: daysFromNow(-40),
  },
  {
    id: 'doc-6',
    kind: 'file',
    category: 'documents',
    title: 'Flat Sale Deed — Whitefield',
    fileName: 'sale-deed-whitefield.pdf',
    notes: '3BHK, jointly held with Priya.',
    sensitive: false,
    uploadedAt: daysFromNow(-400),
  },
  {
    id: 'doc-7',
    kind: 'file',
    category: 'forms',
    title: 'Car Registration — Honda City',
    fileName: 'rc-honda-city.pdf',
    notes: 'KA-05-MJ-4471. Registered owner: Ravi Sharma.',
    sensitive: false,
    uploadedAt: daysFromNow(-150),
  },
  {
    id: 'doc-8',
    kind: 'file',
    category: 'documents',
    title: 'Passport — Ravi Sharma',
    fileName: 'passport-ravi.pdf',
    notes: 'Expires soon — renewal recommended before international travel.',
    sensitive: true,
    uploadedAt: daysFromNow(-60),
  },
]

export const policies: Policy[] = [
  {
    id: 'pol-health',
    type: 'health',
    provider: 'HDFC Ergo',
    policyNumber: 'HE-FLT-99213447',
    coverageAmount: '₹15,00,000 family floater',
    premium: '₹28,400 / year',
    renewalDate: daysFromNow(78),
    networkHospitals: [
      'Manipal Hospital, Whitefield',
      'Apollo Hospital, Bannerghatta',
      'Fortis, Cunningham Road',
      'Columbia Asia, Hebbal',
    ],
    claimContact: 'HDFC Ergo Cashless Desk — 1800 2700 700',
    claimSteps: [
      'Show the health card / policy number at the hospital insurance desk.',
      'Hospital sends a pre-authorisation request to HDFC Ergo.',
      'Approval usually arrives within 2–4 hours for planned admission.',
      'For emergencies, treatment begins immediately; auth follows within 24h.',
    ],
    notes: 'Covers Ravi, Priya and Aanya. Cashless across the network hospitals listed.',
  },
  {
    id: 'pol-term',
    type: 'term_life',
    provider: 'LIC',
    policyNumber: 'LIC-JA-55120098',
    coverageAmount: '₹1,50,00,000 sum assured',
    premium: '₹19,200 / year',
    renewalDate: daysFromNow(10),
    claimContact: 'LIC Claims — 022 6827 6827',
    claimSteps: [
      'Named nominee intimates the claim with the policy number.',
      'Submit the required documentation and ID proof to LIC.',
      'LIC processes term claims typically within 30 days.',
    ],
    notes: 'Nominee: Priya Sharma. Premium due in 10 days — keep the policy active.',
  },
  {
    id: 'pol-car',
    type: 'vehicle',
    provider: 'ICICI Lombard',
    policyNumber: 'IL-MOT-44120931',
    coverageAmount: 'Comprehensive — IDV ₹7,80,000',
    premium: '₹11,650 / year',
    renewalDate: daysFromNow(-6),
    claimContact: 'ICICI Lombard Motor Claims — 1800 2666',
    claimSteps: [
      'Call the claims line and note the claim reference number.',
      'Photograph the damage before moving the vehicle.',
      'Use a network garage for cashless repair.',
    ],
    notes: 'Honda City KA-05-MJ-4471. Renewal is overdue — vehicle is currently uninsured.',
  },
]

export const beneficiaries: Beneficiary[] = [
  {
    id: 'ben-1',
    name: 'Priya Sharma',
    relationship: 'Wife',
    whatsapp: '+91 98860 12345',
    verificationSecret: 'Our anniversary city: Udaipur',
    accessScope: ['health_insurance', 'life_insurance', 'forms', 'documents', 'images', 'wishes', 'instructions'],
    status: 'verified',
  },
  {
    id: 'ben-2',
    name: 'Aanya Sharma',
    relationship: 'Daughter',
    whatsapp: '+91 98860 77321',
    verificationSecret: 'First pet name: Coco',
    accessScope: ['documents', 'instructions'],
    status: 'pending',
  },
]


export const instructions: Instruction[] = [
  {
    id: 'ins-first24',
    type: 'first24',
    title: 'First 24 hours',
    body: 'Call my brother Arjun first — he is the executor and knows the plan. Do not rush any financial decisions. The term life policy (LIC) alone is enough to keep the household running for years; take your time.',
  },
  {
    id: 'ins-funeral',
    type: 'funeral',
    title: 'Funeral wishes',
    body: 'Keep it simple and warm. Hindu rites at the Whitefield crematorium. No grand spending. I would love everyone to share one good memory rather than mourn.',
  },
  {
    id: 'ins-messages',
    type: 'messages',
    title: 'Personal messages to loved ones',
    body: 'To Priya: you made every ordinary day feel like home. To Aanya: study what makes you curious, not what pays best — the money is handled. Be kind, travel often.',
  },
  {
    id: 'ins-financial',
    type: 'financial',
    title: 'Financial instructions',
    body: 'Emergency fund is in the HDFC savings account. Mutual funds via CAMS �� Priya is nominee on all folios. Claim the LIC term cover first; it is the largest and fastest. The 1Password emergency kit unlocks every account login.',
  },
]

export const contacts: Contact[] = [
  {
    id: 'con-1',
    name: 'Dr. Meera Nair',
    role: 'Family doctor',
    phone: '+91 98450 33210',
    notes: 'Knows full medical history. First call in any health scare.',
  },
  {
    id: 'con-2',
    name: 'Adv. Sunil Rao',
    role: 'Lawyer',
    phone: '+91 99016 22110',
    notes: 'Drafted and holds a copy of the registered will.',
  },
  {
    id: 'con-3',
    name: ' KrishnaKumar (HDFC RM)',
    role: 'Bank relationship manager',
    phone: '+91 98455 90011',
    notes: 'Handles the family savings and FD accounts.',
  },
]

export const credentials: Credential[] = [
  {
    id: 'cred-1',
    label: '1Password (family vault)',
    username: 'ravi.sharma@gmail.com',
    secret: 'Emergency Kit in the safe — master password on the printed card',
    url: 'https://my.1password.com',
    notes: 'Unlocks every other account login. Share only after executor confirmation.',
    createdAt: daysFromNow(-30),
  },
  {
    id: 'cred-2',
    label: 'HDFC NetBanking',
    username: 'ravisharma91',
    secret: '••••••••',
    url: 'https://netbanking.hdfcbank.com',
    notes: 'Primary salary + savings account.',
    createdAt: daysFromNow(-200),
  },
]

export const checkinConfig: CheckinConfig = {
  cadenceDays: 14,
  lastCheckinAt: daysFromNow(-3),
  missedCount: 0,
  threshold: 3,
}

export const initialTriggerState: TriggerState = {
  mode: 'everyday',
  timeline: [
    {
      state: 'Everyday',
      at: daysFromNow(-3),
      note: 'Last check-in confirmed. Vault healthy and active.',
    },
  ],
}
