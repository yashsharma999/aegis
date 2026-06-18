// The mode/state-machine transitions, called by the /trigger demo buttons.
//
// TODO: production cron pings owner via WhatsApp; missed check-ins advance toward
// legacy activation; emergency/guardian modes are entered explicitly.

import type { AppMode, TimelineEvent, TriggerState } from './types'

function event(state: string, note: string): TimelineEvent {
  return { state, at: new Date().toISOString(), note }
}

function withEvent(prev: TriggerState, mode: AppMode, state: string, note: string): TriggerState {
  return { mode, timeline: [...prev.timeline, event(state, note)] }
}

export const transitions = {
  triggerEmergency: (prev: TriggerState): TriggerState =>
    withEvent(
      prev,
      'emergency',
      'Emergency',
      'Break-glass emergency mode activated. Medical ID and health policy are now front-and-center.',
    ),

  grantTemporaryGuardian: (prev: TriggerState): TriggerState =>
    withEvent(
      prev,
      'incapacity',
      'Incapacity',
      'Temporary guardian access granted to Dr. Meera Nair while the owner is incapacitated.',
    ),

  simulateMissedCheckin: (prev: TriggerState, missedCount: number, threshold: number): TriggerState => {
    if (missedCount < threshold) {
      return withEvent(
        prev,
        prev.mode === 'everyday' ? 'everyday' : prev.mode,
        'Missed check-in',
        `Owner missed a check-in (${missedCount}/${threshold}). A WhatsApp nudge was sent.`,
      )
    }
    return withEvent(
      prev,
      'incapacity',
      'Pre-triggered',
      `Check-in threshold reached (${missedCount}/${threshold}). Pre-trigger window open — awaiting executor confirmation before legacy activation.`,
    )
  },

  executorConfirms: (prev: TriggerState): TriggerState =>
    withEvent(
      prev,
      'legacy',
      'Legacy Activated',
      'Executor Arjun Sharma confirmed. Legacy mode is live — verified family members now have compassionate, guided access.',
    ),

  awaitingExecutor: (prev: TriggerState): TriggerState =>
    withEvent(
      prev,
      'incapacity',
      'Awaiting Executor',
      'Pre-trigger window open. The executor has been notified to confirm or cancel activation.',
    ),

  reset: (): TriggerState => ({
    mode: 'everyday',
    timeline: [
      event('Everyday', 'Demo reset. Vault returned to healthy everyday state.'),
    ],
  }),
}
