import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreateHotelInput } from '@/server/validation/hotel.schema'

export function WizardField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  valueAsNumber,
}: {
  name: keyof CreateHotelInput
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  valueAsNumber?: boolean
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateHotelInput>()
  const error = errors[name]

  return (
    <div>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name, { valueAsNumber })} />
      {error && <p className="mt-1 text-sm text-red-600">{error.message as string}</p>}
    </div>
  )
}
