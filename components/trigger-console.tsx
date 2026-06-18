'use client'

import { useState, useTransition } from 'react'
import {
  Siren,
  UserCog,
  CalendarX,
  CheckCheck,
  RotateCcw,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModeStateMachineTimeline } from '@/components/mode-state-machine-timeline'
import { ModeIndicator } from '@/components/mode-indicator'
import { runTrigger, type TriggerAction } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { MODE_LABELS, type AppMode, type TriggerState } from '@/lib/types'

const STAGES: { key: string; modes: AppMode[] }[] = [
  { key: 'Everyday', modes: ['everyday'] },
  { key: 'Emergency', modes: ['emergency'] },
  { key: 'Incapacity', modes: ['incapacity'] },
  { key: 'Legacy', modes: ['legacy'] },
]

const buttons: {
  action: TriggerAction
  label: string
  description: string
  icon: React.ElementType
  className: string
}[] = [
  {
    action: 'emergency',
    label: 'Trigger emergency',
    description: 'Break-glass medical mode',
    icon: Siren,
    className: 'border-emergency/40 text-emergency hover:bg-emergency/10',
  },
  {
    action: 'guardian',
    label: 'Grant temporary guardian',
    description: 'Incapacity access',
    icon: UserCog,
    className: 'hover:bg-secondary',
  },
  {
    action: 'missed',
    label: 'Simulate missed check-in',
    description: 'Advance toward activation',
    icon: CalendarX,
    className: 'hover:bg-secondary',
  },
  {
    action: 'executor',
    label: 'Executor confirms',
    description: 'Activate legacy mode',
    icon: CheckCheck,
    className: 'hover:bg-secondary',
  },
]

export function TriggerConsole({ initialState }: { initialState: TriggerState }) {
  const [state, setState] = useState<TriggerState>(initialState)
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<TriggerAction | null>(null)

  function run(action: TriggerAction, message: string) {
    setActiveAction(action)
    startTransition(async () => {
      const next = await runTrigger(action)
      setState(next)
      toast(message)
      setActiveAction(null)
    })
  }

  const currentStageIndex = STAGES.findIndex((s) => s.modes.includes(state.mode))

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Card className="rounded-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current state</CardTitle>
              <ModeIndicator mode={state.mode} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => (
                <div key={stage.key} className="flex flex-1 items-center gap-1">
                  <div
                    className={cn(
                      'flex-1 rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors',
                      i <= currentStageIndex
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground',
                      i === currentStageIndex && 'ring-2 ring-accent/50',
                    )}
                  >
                    {stage.key}
                  </div>
                  {i < STAGES.length - 1 ? (
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50" />
                  ) : null}
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The same vault, same agent — only the access level and intent change. You are currently
              in <span className="font-medium text-foreground">{MODE_LABELS[state.mode]}</span> mode.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Demo controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {buttons.map((b) => {
                const Icon = b.icon
                return (
                  <Button
                    key={b.action}
                    variant="outline"
                    disabled={isPending}
                    onClick={() => run(b.action, `${b.label} — done`)}
                    className={cn('h-auto flex-col items-start gap-1 rounded-2xl py-3 text-left', b.className)}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Icon className="size-4" />
                      {b.label}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">{b.description}</span>
                  </Button>
                )
              })}
            </div>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => run('reset', 'Demo reset to everyday')}
              className="w-fit text-muted-foreground"
            >
              <RotateCcw className="size-4" data-icon="inline-start" />
              Reset demo
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base">Transition log</CardTitle>
        </CardHeader>
        <CardContent>
          <ModeStateMachineTimeline timeline={state.timeline} />
        </CardContent>
      </Card>
    </div>
  )
}
