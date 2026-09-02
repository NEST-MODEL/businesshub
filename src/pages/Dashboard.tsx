import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Attention {
  id: string
  name: string
  reason: string
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    customers: 0,
    newCustomers: 0,
    activeTasks: 0,
    orders: 0,
    revenue: 0,
  })
  const [attention, setAttention] = useState<Attention[]>([])
  const [recentEvents, setRecentEvents] = useState<any[]>([])

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

      const [{ count: customers }, { count: newCustomers }, { count: activeTasks }, orders, events] =
        await Promise.all([
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekAgo),
          supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', false),
          supabase.from('orders').select('total'),
          supabase
            .from('events')
            .select('id, type, payload, created_at, customer_id, customers(name)')
            .order('created_at', { ascending: false })
            .limit(8),
        ])

      const revenue = (orders.data || []).reduce((sum, o: any) => sum + Number(o.total), 0)

      setStats({
        customers: customers || 0,
        newCustomers: newCustomers || 0,
        activeTasks: activeTasks || 0,
        orders: orders.data?.length || 0,
        revenue,
      })
      setRecentEvents(events.data || [])

      // "Требует внимания": overdue tasks + customers quiet 24h+ + no order 30d+
      const attn: Attention[] = []

      const { data: overdueTasks } = await supabase
        .from('tasks')
        .select('id, title, customers(id, name)')
        .eq('is_completed', false)
        .lt('due_date', new Date().toISOString().slice(0, 10))

      overdueTasks?.forEach((t: any) => {
        attn.push({ id: `task-${t.id}`, name: t.customers?.name || t.title, reason: 'Задача просрочена' })
      })

      const dayAgo = new Date(Date.now() - 24 * 3600000).toISOString()
      const { data: quietCustomers } = await supabase
        .from('customers')
        .select('id, name, last_activity_at')
        .in('status', ['active', 'regular'])
        .lt('last_activity_at', dayAgo)
        .order('last_activity_at', { ascending: true })
        .limit(5)

      quietCustomers?.forEach((c) => {
        const hours = Math.floor(
          (Date.now() - new Date(c.last_activity_at!).getTime()) / 3600000
        )
        attn.push({ id: `quiet-${c.id}`, name: c.name, reason: `Не отвечал ${hours} ч.` })
      })

      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: staleRegulars } = await supabase
        .from('customers')
        .select('id, name, last_activity_at')
        .eq('status', 'regular')
        .lt('last_activity_at', monthAgo)
        .limit(5)

      staleRegulars?.forEach((c) => {
        const days = Math.floor(
          (Date.now() - new Date(c.last_activity_at!).getTime()) / 86400000
        )
        attn.push({ id: `stale-${c.id}`, name: c.name, reason: `${days} дн. без заказа` })
      })

      setAttention(attn.slice(0, 6))
    } catch (e: any) {
      setError('Не удалось загрузить дашборд. Проверьте соединение.')
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    { label: 'Клиенты', value: stats.customers },
    { label: 'Новые за неделю', value: stats.newCustomers },
    { label: 'Активные задачи', value: stats.activeTasks },
    { label: 'Заказов', value: stats.orders },
    { label: 'Выручка', value: `${stats.revenue.toLocaleString('ru-RU')} ₸` },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Дашборд</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">{c.label}</div>
            <div className="text-xl font-semibold font-mono">
              {loading ? '—' : c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber mb-3">🔴 Требуют внимания</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Загрузка…</p>
          ) : attention.length === 0 ? (
            <p className="text-sm text-slate-400">Пока всё под контролем.</p>
          ) : (
            <ul className="space-y-2">
              {attention.map((a) => (
                <li key={a.id} className="flex justify-between text-sm">
                  <span>{a.name}</span>
                  <span className="text-slate-400">{a.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Последние события</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Загрузка…</p>
          ) : recentEvents.length === 0 ? (
            <p className="text-sm text-slate-400">Событий пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {recentEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <Link to={`/customers/${e.customer_id || ''}`} className="text-slate-600">
                    {e.customers?.name || '—'}
                  </Link>{' '}
                  <span className="text-slate-400">— {eventLabel(e.type)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function eventLabel(type: string) {
  const map: Record<string, string> = {
    'customer.created': 'новый клиент',
    'order.created': 'новый заказ',
    'order.status_changed': 'статус заказа изменён',
    'task.created': 'новая задача',
    'task.completed': 'задача выполнена',
    'note.created': 'добавлена заметка',
    'message.received': 'сообщение от клиента',
    'message.sent': 'сообщение клиенту',
  }
  return map[type] || type
}
