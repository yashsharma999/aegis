// Stubbed data-access layer.
//
// TODO: replace mock store with Aurora PostgreSQL (Serverless v2) via Drizzle/pg.
// pgvector table holds document embeddings powering the agent's retrieval across all modes.
//
// For the demo this is a simple module-level store. Trigger/check-in state is mutated
// in place so the mode/state-machine survives navigation within a running server.
//
// Personal data is only returned for the demo account. Every other signed-in
// user gets an empty vault so the empty states are visible.

import {
  beneficiaries,
  checkinConfig,
  contacts,
  documents,
  guardians,
  initialTriggerState,
  instructions,
  medicalProfile,
  owner,
  policies,
} from './mock-data'
import { isDemoUser, getSessionEmail } from './session'
import type { CheckinConfig, MedicalProfile, Owner, TriggerState } from './types'

interface Store {
  triggerState: TriggerState
  checkin: CheckinConfig
}

// Module-level singleton (good enough for a single-instance demo).
const store: Store = {
  triggerState: structuredClone(initialTriggerState),
  checkin: { ...checkinConfig },
}

const emptyMedicalProfile: MedicalProfile = {
  bloodGroup: '',
  allergies: [],
  medications: [],
  conditions: [],
  activeHealthPolicyId: '',
  preferredHospital: '',
  emergencyNote: '',
}

export const db = {
  getOwner: async (): Promise<Owner> => {
    if (await isDemoUser()) return owner
    const email = (await getSessionEmail()) ?? ''
    return { id: 'owner-self', name: '', email, protecting: '' }
  },
  getDocuments: async () => ((await isDemoUser()) ? documents : []),
  getDocumentById: async (id: string) =>
    (await isDemoUser()) ? (documents.find((d) => d.id === id) ?? null) : null,
  getPolicies: async () => ((await isDemoUser()) ? policies : []),
  getPolicyById: async (id: string) =>
    (await isDemoUser()) ? (policies.find((p) => p.id === id) ?? null) : null,
  getReminders: async () => {
    if (!(await isDemoUser())) return []
    // Derive reminders live so statuses stay believable relative to "now".
    const { buildReminders } = await import('./reminders')
    return buildReminders(policies, documents)
  },
  getMedicalProfile: async () => ((await isDemoUser()) ? medicalProfile : emptyMedicalProfile),
  getBeneficiaries: async () => ((await isDemoUser()) ? beneficiaries : []),
  getGuardians: async () => ((await isDemoUser()) ? guardians : []),
  getInstructions: async () => ((await isDemoUser()) ? instructions : []),
  getContacts: async () => ((await isDemoUser()) ? contacts : []),

  getTriggerState: async (): Promise<TriggerState> => store.triggerState,
  setTriggerState: (next: TriggerState) => {
    store.triggerState = next
  },

  getCheckin: async (): Promise<CheckinConfig> => store.checkin,
  setCheckin: (next: CheckinConfig) => {
    store.checkin = next
  },
}
