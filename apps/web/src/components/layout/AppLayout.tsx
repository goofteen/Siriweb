import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  hideSearchIcon?: boolean
}

export function AppLayout({ hideSearchIcon }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header hideSearchIcon={hideSearchIcon} />
      {/* pb-16 เพื่อไม่ให้ content ซ่อนใต้ bottom nav */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
