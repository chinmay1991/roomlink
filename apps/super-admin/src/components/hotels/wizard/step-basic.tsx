import { WizardField } from './field'

export function StepBasic() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WizardField name="name" label="Hotel name" placeholder="Royal Inn" required />
        <WizardField name="hotelCode" label="Hotel code" placeholder="RINN-BBSR" required />
      </div>
      <WizardField name="brand" label="Brand (optional)" placeholder="Royal Hospitality" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <WizardField name="timeZone" label="Time zone" placeholder="Asia/Kolkata" />
        <WizardField name="checkInTime" label="Check-in time" placeholder="14:00" />
        <WizardField name="checkOutTime" label="Check-out time" placeholder="11:00" />
      </div>
    </div>
  )
}
