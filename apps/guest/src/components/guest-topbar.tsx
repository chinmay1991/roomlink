export function GuestTopbar({ hotelName, roomNumber }: { hotelName: string; roomNumber: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <p className="truncate text-sm font-semibold text-slate-900">{hotelName}</p>
      <p className="shrink-0 text-xs font-medium text-slate-500">Room {roomNumber}</p>
    </header>
  )
}
