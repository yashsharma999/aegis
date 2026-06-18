import type { Document, Policy, Reminder, ReminderStatus } from './types'

function statusFor(dateIso: string): ReminderStatus {
  const days = Math.round(
    (new Date(dateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (days < 0) return 'overdue'
  if (days <= 30) return 'due_soon'
  return 'scheduled'
}

// Derive the renewal/expiry/premium radar from the underlying vault data.
export function buildReminders(policies: Policy[], documents: Document[]): Reminder[] {
  const reminders: Reminder[] = []

  for (const p of policies) {
    reminders.push({
      id: `rem-renew-${p.id}`,
      kind: p.type === 'term_life' ? 'premium' : 'renewal',
      title:
        p.type === 'term_life'
          ? `${p.provider} term life premium due`
          : `${p.provider} ${p.type.replace('_', ' ')} renewal`,
      relatedTo: p.policyNumber,
      dueDate: p.renewalDate,
      status: statusFor(p.renewalDate),
    })
  }

  // Passport expiry derived from the travel document (≈ 3 months out for the demo).
  const passport = documents.find((d) => d.category === 'travel')
  if (passport) {
    const due = new Date()
    due.setMonth(due.getMonth() + 3)
    reminders.push({
      id: 'rem-expiry-passport',
      kind: 'expiry',
      title: 'Passport expiring',
      relatedTo: passport.title,
      dueDate: due.toISOString(),
      status: statusFor(due.toISOString()),
    })
  }

  return reminders.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )
}
