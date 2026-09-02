import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Customer, CustomerStatus } from '../types'

const filters: { key: 'all' | CustomerStatus; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'active', label: 'Активные' },
  { key: 'regular', label: 'Постоянные' },
]

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | CustomerStatus>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    setLoading(true)
    setError(null)
    let query = supabase.from('customers').select('*').order('last_activity_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data, error } = await query
    if (error) setError('Не удалось загрузить клиентов. Проверьте соединение.')
    else setCustomers(data || [])
    setLoading(false)
  }

  const visible = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Клиенты</h1>
      </div>

      <input
        type="text"
        placeholder="Поиск по имени…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-72 border border-slate-200 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-signal"
      />

      <div className="flex gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === f.key ? 'bg-ink text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-400">Клиентов пока нет.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {visible.map((c) => (
            <Link
              key={c.id}
              to={`/customers/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-slate-400">{c.phone || c.telegram_username || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-slate-400">{statusLabel(c.status)}</div>
                <div className="text-sm font-mono">{Number(c.total_spent).toLocaleString('ru-RU')} ₸</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    new: 'Новый', active: 'Активный', regular: 'Постоянный', inactive: 'Неактивный',
  }
  return map[s] || s
}
