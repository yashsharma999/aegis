// Stubbed data-access layer.
//
// TODO: replace mock store with Aurora PostgreSQL (Serverless v2) via Drizzle/pg.
// pgvector table holds document embeddings powering the agent's retrieval across all modes.
//
// For the demo this is a simple module-level store. Trigger/check-in state is mutated
// in place so the mode/state-machine survives navigation within a running server.

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
import type { CheckinConfig, TriggerState } from './types'

interface Store {
  triggerState: TriggerState
  checkin: CheckinConfig
}

// Module-level singleton (good enough for a single-instance demo).
const store: Store = {
  triggerState: structuredClone(initialTriggerState),
  checkin: { ...checkinConfig },
}

export const db = {
  getOwner: async () => owner,
  getDocuments: async () => documents,
  getDocumentById: async (id: string) => documents.find((d) => d.id === id) ?? null,
  getPolicies: async () => policies,
  getPolicyById: async (id: string) => policies.find((p) => p.id === id) ?? null,
  getReminders: async () => {
    // Derive reminders live so statuses stay believable relative to "now".
    const { buildReminders } = await import('./reminders')
    return buildReminders(policies, documents)
  },
  getMedicalProfile: async () => medicalProfile,
  getBeneficiaries: async () => beneficiaries,
  getGuardians: async () => guardians,
  getInstructions: async () => instructions,
  getContacts: async () => contacts,

  getTriggerState: async (): Promise<TriggerState> => store.triggerState,
  setTriggerState: (next: TriggerState) => {
    store.triggerState = next
  },

  getCheckin: async (): Promise<CheckinConfig> => store.checkin,
  setCheckin: (next: CheckinConfig) => {
    store.checkin = next
  },
}
