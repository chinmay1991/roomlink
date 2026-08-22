import {
  Car,
  ConciergeBell,
  Flower2,
  MessageCircleQuestion,
  Shirt,
  Soup,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { DEFAULT_DEPARTMENT_TEMPLATES } from '@/server/validation/department.schema'

export type ServiceDisplay = { name: string; subtitle: string; icon: LucideIcon }

/** Subtitle + icon for each of the app's known department templates (see DEFAULT_DEPARTMENT_TEMPLATES). */
const KNOWN_DEPARTMENTS: Record<(typeof DEFAULT_DEPARTMENT_TEMPLATES)[number], { subtitle: string; icon: LucideIcon }> = {
  Reception: { subtitle: 'Assistance & Information', icon: ConciergeBell },
  Housekeeping: { subtitle: 'Room Cleaning & Amenities', icon: Sparkles },
  Restaurant: { subtitle: 'Food & Beverages', icon: UtensilsCrossed },
  Maintenance: { subtitle: 'Technical Support', icon: Wrench },
  'Room Service': { subtitle: 'In-Room Dining', icon: Soup },
  Laundry: { subtitle: 'Wash & Press', icon: Shirt },
  'Spa & Wellness': { subtitle: 'Relaxation & Treatments', icon: Flower2 },
  'Concierge / Transport': { subtitle: 'Travel, Taxi, Local Info', icon: Car },
}

/** Custom, hotel-defined department names fall back to a generic "request" icon/subtitle. */
export function departmentDisplay(name: string): ServiceDisplay {
  const known = KNOWN_DEPARTMENTS[name as keyof typeof KNOWN_DEPARTMENTS]
  if (known) return { name, ...known }
  return { name, subtitle: 'Request assistance', icon: MessageCircleQuestion }
}
