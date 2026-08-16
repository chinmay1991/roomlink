import type { StaffRequestRow } from './staff-task-list'

type RequestWithRelations = {
  request_id: string
  request_type: string
  status: string
  priority: string
  notes: string | null
  created_at: Date
  rooms: { room_number: string } | null
  guests: { full_name: string | null } | null
  departments: { department_id: string; name: string } | { department_id: string; name: string; manager_id: string | null } | null
  users: { user_id: string; full_name: string } | null
}

/** Prisma rows carry `Date`/extra fields the client components don't need — this is the one shaping point every staff page uses. */
export function mapRequestRow(r: RequestWithRelations): StaffRequestRow {
  return {
    request_id: r.request_id,
    request_type: r.request_type,
    status: r.status,
    priority: r.priority,
    notes: r.notes,
    created_at: r.created_at.toISOString(),
    rooms: r.rooms,
    guests: r.guests,
    departments: r.departments ? { department_id: r.departments.department_id, name: r.departments.name } : null,
    users: r.users,
  }
}
