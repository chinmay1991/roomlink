import { MobileBottomNav } from './mobile-bottom-nav'

/**
 * Native-app-only chrome — mounted from hotel/layout.tsx exclusively when
 * isNativeClient() is true. Browsers (including the existing PWA install)
 * never render this; they keep the existing Sidebar/Topbar/StaffBottomNav
 * layout, byte-for-byte unchanged.
 */
export function MobileShell({ roleName, children }: { roleName: string | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex-1 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">{children}</main>
      <MobileBottomNav roleName={roleName} />
    </div>
  )
}
