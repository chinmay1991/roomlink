import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { getOwnProfile } from '@/server/services/account.service'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import { MfaSection } from '@/components/settings/mfa-section'
import { timeAgo } from '@/lib/format'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const profile = await getOwnProfile(session!.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Your account and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Name: </span>
              <span className="text-slate-900">{profile.full_name}</span>
            </p>
            <p>
              <span className="text-slate-500">Email: </span>
              <span className="text-slate-900">{profile.email}</span>
            </p>
            <p>
              <span className="text-slate-500">Role: </span>
              <span className="capitalize text-slate-900">{profile.user_type.replace('_', ' ')}</span>
            </p>
            <p>
              <span className="text-slate-500">Last login: </span>
              <span className="text-slate-900">{profile.last_login_at ? timeAgo(profile.last_login_at) : 'This is your first login'}</span>
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
          </CardHeader>
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Two-factor authentication</h2>
          </CardHeader>
          <CardBody>
            <MfaSection mfaEnabled={profile.mfa_enabled} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
