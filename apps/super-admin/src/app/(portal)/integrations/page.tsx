import { listIntegrations } from '@/server/services/integrations.service'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { AddIntegrationButton } from '@/components/integrations/add-integration-button'
import { IntegrationRowActions } from '@/components/integrations/integration-row-actions'
import { formatDate } from '@/lib/format'

const GROUPS: { type: string; label: string; description: string }[] = [
  { type: 'pms', label: 'PMS', description: 'Oracle OPERA, IDS Next, eZee, Hotelogix' },
  { type: 'payment_gateway', label: 'Payments', description: 'Razorpay, Stripe' },
  { type: 'communication', label: 'Communication', description: 'WhatsApp, Twilio, Email, SMS' },
]

export default async function IntegrationsPage() {
  const integrations = await listIntegrations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-500">Platform-level connections available to every hotel.</p>
        </div>
        <AddIntegrationButton />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const rows = integrations.filter((i) => i.integration_type === group.type)
          return (
            <Card key={group.type}>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">{group.label}</h2>
                <p className="text-xs text-slate-500">{group.description}</p>
              </CardHeader>
              <CardBody className="space-y-3">
                {rows.length === 0 && <p className="text-sm text-slate-500">None configured yet.</p>}
                {rows.map((row) => (
                  <div key={row.integration_id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{row.provider}</p>
                        <p className="text-xs text-slate-500">
                          {row.is_active ? 'Active' : 'Disabled'} · added {formatDate(row.created_at)}
                        </p>
                      </div>
                      <IntegrationRowActions integrationId={row.integration_id} isActive={row.is_active} />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )
        })}
      </div>

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
        API keys and secrets are never stored in this table — connect a real provider by setting its credentials as
        environment variables and referencing them from your deploy config.
      </div>
    </div>
  )
}
