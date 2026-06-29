// The mode/state-machine transitions, called by the /trigger demo buttons.
//
// Missed check-ins advance toward legacy activation (automated by the daily
// cron — app/api/cron/checkin); emergency mode is entered explicitly.

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

  simulateMissedCheckin: (
    prev: TriggerState,
    missedCount: number,
    threshold: number,
    nudged: boolean,
  ): TriggerState => {
    if (missedCount < threshold) {
      return withEvent(
        prev,
        prev.mode === 'everyday' ? 'everyday' : prev.mode,
        'Missed check-in',
        `Owner missed a check-in (${missedCount}/${threshold}).` +
          (nudged ? ' A Telegram nudge was sent.' : ' (Connect Telegram to receive nudges.)'),
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
      'Executor confirmed. Legacy mode is live — verified contacts now have guided access to the vault.',
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
