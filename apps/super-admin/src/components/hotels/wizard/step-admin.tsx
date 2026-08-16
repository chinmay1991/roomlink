import { WizardField } from './field'

export function StepAdmin() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        This person becomes the Hotel Admin — they configure rooms, staff, menu, and services inside their own
        workspace once invited.
      </p>
      <WizardField name="adminFullName" label="Full name" placeholder="Alok Mishra" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WizardField name="adminEmail" label="Email" type="email" placeholder="alok@hotel.example" required />
        <WizardField name="adminPhone" label="Phone" type="tel" placeholder="+91-9861200001" />
      </div>
    </div>
  )
}
