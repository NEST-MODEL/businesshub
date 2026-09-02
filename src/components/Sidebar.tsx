import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/customers', label: 'Клиенты' },
  { to: '/orders', label: 'Заказы' },
  { to: '/tasks', label: 'Задачи' },
]

export default function Sidebar() {
  const { signOut, profile } = useAuth()

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
      <div className="px-5 py-5 text-lg font-semibold tracking-tight">BusinessHub</div>
      <nav className="flex-1 px-2 space-y-0.5">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-ink'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-200 text-sm">
        <div className="text-slate-600 truncate">{profile?.full_name || 'Сотрудник'}</div>
        <button onClick={signOut} className="text-slate-400 hover:text-ink mt-1">
          Выйти
        </button>
      </div>
    </aside>
  )
}
