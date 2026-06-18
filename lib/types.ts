// Core domain types for Aegis (codename "D-Day").
// A single owner's vault, navigated by an AI agent across three modes of life.

export type DocumentCategory =
  | 'insurance'
  | 'medical'
  | 'legal'
  | 'financial'
  | 'property'
  | 'vehicle'
  | 'travel'
  | 'digital'

export type PolicyType = 'health' | 'term_life' | 'vehicle' | 'home' | 'travel'

export type ReminderKind = 'renewal' | 'expiry' | 'premium'

export type ReminderStatus = 'scheduled' | 'due_soon' | 'overdue'

export type InstructionType = 'first24' | 'funeral' | 'messages' | 'financial'

// The active access level + intent. The same vault, gated differently.
export type AppMode = 'everyday' | 'emergency' | 'incapacity' | 'legacy'

export interface Owner {
  id: string
  name: string
  email: string
  protecting: string
}

export interface Document {
  id: string
  category: DocumentCategory
  title: string
  fileName: string
  notes: string
  sensitive: boolean
  uploadedAt: string
}

export interface Policy {
  id: string
  type: PolicyType
  provider: string
  policyNumber: string
  coverageAmount: string
  premium: string
  renewalDate: string
  networkHospitals?: string[]
  claimContact: string
  claimSteps?: string[]
  notes: string
}

export interface Reminder {
  id: string
  kind: ReminderKind
  title: string
  relatedTo: string
  dueDate: string
  status: ReminderStatus
}

export interface MedicalProfile {
  bloodGroup: string
  allergies: string[]
  medications: string[]
  conditions: string[]
  activeHealthPolicyId: string
  preferredHospital: string
  emergencyNote: string
}

export interface Beneficiary {
  id: string
  name: string
  relationship: string
  whatsapp: string
  verificationSecret: string
  accessScope: DocumentCategory[]
  status: 'verified' | 'pending'
}

export interface Guardian {
  id: string
  name: string
  relationship: string
  whatsapp: string
  role: 'executor' | 'temporary_guardian'
}

export interface Instruction {
  id: string
  type: InstructionType
  title: string
  body: string
}

export interface Contact {
  id: string
  name: string
  role: string
  phone: string
  notes: string
}

export interface CheckinConfig {
  cadenceDays: number
  lastCheckinAt: string
  missedCount: number
  threshold: number
}

export interface TimelineEvent {
  state: string
  at: string
  note: string
}

export interface TriggerState {
  mode: AppMode
  timeline: TimelineEvent[]
}

export interface ChatMessage {
  id: string
  mode: AppMode
  from: 'agent' | 'user' | 'family'
  text: string
  sourceDoc?: string
  at: string
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  insurance: 'Insurance',
  medical: 'Medical & Health',
  legal: 'Legal & Will',
  financial: 'Financial & Funds',
  property: 'Property',
  vehicle: 'Vehicle',
  travel: 'Travel',
  digital: 'Digital & Passwords',
}

export const POLICY_LABELS: Record<PolicyType, string> = {
  health: 'Health',
  term_life: 'Term Life',
  vehicle: 'Vehicle',
  home: 'Home',
  travel: 'Travel',
}

export const MODE_LABELS: Record<AppMode, string> = {
  everyday: 'Everyday',
  emergency: 'Emergency',
  incapacity: 'Incapacity',
  legacy: 'Legacy',
}
