import { BedDouble, DoorOpen, Phone, Smartphone } from 'lucide-react'
import { PrintButton } from './print-button'
import type { ServiceDisplay } from './department-display'

export function RoomQrCard({
  hotelName,
  roomNumber,
  qrImageSrc,
  services,
}: {
  hotelName: string
  roomNumber: string
  qrImageSrc: string
  services: ServiceDisplay[]
}) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-slate-100 py-10 print:block print:min-h-0 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: 4in 6in; margin: 0; }
          html, body { margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <PrintButton />

      <div
        className="flex h-[6in] w-[4in] flex-col overflow-hidden rounded-2xl bg-[#171512] px-[0.22in] pb-[0.18in] pt-[0.22in] shadow-2xl print:rounded-none print:shadow-none"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', colorAdjust: 'exact' }}
      >
        {/* Hotel name plaque */}
        <div className="rounded-lg border border-amber-500/30 bg-[#e9e3d2] px-3 py-2 text-center">
          <div className="font-serif text-[15px] font-bold uppercase tracking-[0.15em] text-slate-900">{hotelName}</div>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-amber-600/60" />
            <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-amber-700">Welcome</span>
            <span className="h-px w-6 bg-amber-600/60" />
          </div>
        </div>

        {/* Room pill */}
        <div className="mx-auto mt-[0.12in] flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-900">
          <BedDouble className="h-3 w-3" strokeWidth={2.5} />
          Room {roomNumber}
        </div>

        <div className="mt-[0.14in] h-px w-full bg-amber-500/20" />

        {/* QR block */}
        <div className="mt-[0.12in] text-center">
          <div className="text-[13px] font-bold text-white">Need Anything?</div>
          <div className="text-[8.5px] text-slate-400">Scan to connect with us</div>
        </div>

        <div className="mx-auto mt-[0.1in] flex h-[2in] w-[2in] items-center justify-center rounded-xl border-2 border-amber-400 bg-white p-[0.1in]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImageSrc} alt="Room QR code" className="h-full w-full object-contain" />
        </div>

        <div className="mt-[0.08in] flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
          <Smartphone className="h-3 w-3" strokeWidth={2.5} />
          Scan to connect
        </div>
        <div className="text-center text-[7.5px] text-slate-400">Instant assistance at your fingertips</div>

        <div className="mt-[0.12in] h-px w-full bg-amber-500/20" />

        {/* Services */}
        <div className="mt-[0.1in] min-h-0 flex-1">
          <div className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">Services you can order</div>
          <div className="mt-[0.08in] grid grid-cols-2 gap-x-[0.12in] gap-y-[0.07in] overflow-hidden">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.name} className="flex items-start gap-1.5">
                  <div className="flex h-[0.24in] w-[0.24in] shrink-0 items-center justify-center rounded-md bg-white">
                    <Icon className="h-[0.13in] w-[0.13in] text-slate-800" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-[8px] font-semibold text-white">{service.name}</div>
                    <div className="truncate text-[6.5px] text-slate-400">{service.subtitle}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Help line */}
        <div className="mt-[0.1in] flex items-center justify-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.15em] text-amber-400">
          <Phone className="h-2.5 w-2.5" strokeWidth={2.5} />
          We are here to help you
        </div>

        {/* Footer */}
        <div className="mt-[0.08in] flex flex-col items-center border-t border-slate-700/60 pt-[0.08in]">
          <div className="flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5 text-amber-400" strokeWidth={2.5} />
            <span className="text-[13px] font-extrabold tracking-tight">
              <span className="text-white">Room</span>
              <span className="text-amber-400">Link</span>
            </span>
          </div>
          <div className="mt-0.5 text-[6.5px] font-medium uppercase tracking-[0.3em] text-slate-500">Scan &bull; Stay &bull; Connect</div>
        </div>
      </div>
    </div>
  )
}
