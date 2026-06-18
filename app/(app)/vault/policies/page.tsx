import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { PolicyCard } from "@/components/policy-card"

export const metadata = { title: "Policies · Aegis" }

export default async function PoliciesPage() {
  const policies = await db.getPolicies()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Insurance policies"
        description="Coverage, premiums, and claim steps your family can act on without hunting for paperwork."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {policies.map((policy) => (
          <PolicyCard key={policy.id} policy={policy} />
        ))}
      </div>
    </div>
  )
}
