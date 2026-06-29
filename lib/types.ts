// Core domain types for Aegis (codename "D-Day").
// A single owner's vault, navigated by an AI agent across three modes of life.

// A vault item's bucket. File-backed categories hold uploads; note-backed
// categories hold authored markdown. `kind` on the item is the source of truth
// for how it's stored; these sets just drive the create UI.
export type DocumentCategory =
  | 'health_insurance'
  | 'life_insurance'
  | 'forms'
  | 'documents'
  | 'images'
  | 'wishes'
  | 'instructions'

export type DocumentKind = 'file' | 'note'

export const NOTE_CATEGORIES: DocumentCategory[] = ['wishes', 'instructions']
export const FILE_CATEGORIES: DocumentCategory[] = [
  'health_insurance',
  'life_insurance',
  'forms',
  'documents',
  'images',
]

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
  kind: DocumentKind
  category: DocumentCategory
  title: string
  fileName?: string | null
  body?: string | null
  notes: string
  sensitive: boolean
  uploadedAt: string
  updatedAt?: string | null
}

export interface Credential {
  id: string
  label: string
  username: string
  secret: string
  url: string
  notes: string
  createdAt: string
  updatedAt?: string | null
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
  health_insurance: 'Health Insurance',
  life_insurance: 'Life Insurance',
  forms: 'Forms',
  documents: 'Documents',
  images: 'Images',
  wishes: 'Wishes',
  instructions: 'Instructions',
}

// Old rows / unknown categories degrade to a humanized label instead of blank.
export function categoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category as DocumentCategory] ??
    category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
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
