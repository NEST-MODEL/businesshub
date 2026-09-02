import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'

const mobileLinks = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/customers', label: 'Клиенты' },
  { to: '/orders', label: 'Заказы' },
  { to: '/tasks', label: 'Задачи' },
]

export default function Layout() {
  return (
    <div className="md:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-10">
        {mobileLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `text-xs font-medium px-3 py-1 rounded-md ${
                isActive ? 'text-signal' : 'text-slate-400'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
