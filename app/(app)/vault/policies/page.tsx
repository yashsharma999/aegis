import { ShieldQuestion } from "lucide-react"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { PolicyCard } from "@/components/policy-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export const metadata = { title: "Policies · Aegis" }

export default async function PoliciesPage() {
  const policies = await db.getPolicies()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Vault · Insurance"
        title="Insurance policies"
        description="Coverage, premiums, and claim steps your family can act on without hunting for paperwork."
      />
      {policies.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldQuestion />
            </EmptyMedia>
            <EmptyTitle>No policies added</EmptyTitle>
            <EmptyDescription>
              Add your health, life, vehicle and home insurance. Aegis tracks every renewal date and keeps the claim
              steps ready for the people who&apos;ll need them.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {policies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  )
}
