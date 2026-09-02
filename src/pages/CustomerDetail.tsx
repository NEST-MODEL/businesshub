import { useEffect, useState, FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Customer, Order, EventRow } from '../types'

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) load()
  }, [id])

  async function load() {
    setLoading(true)
    setError(null)
    const [{ data: c, error: cErr }, { data: o }, { data: e }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('events').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    ])
    if (cErr) setError('Не удалось загрузить клиента. Проверьте соединение.')
    setCustomer(c || null)
    setOrders(o || [])
    setEvents(e || [])
    setLoading(false)
  }

  async function addNote(ev: FormEvent) {
    ev.preventDefault()
    if (!noteText.trim() || !id) return
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('notes').insert({
      organization_id: customer?.organization_id,
      customer_id: id,
      author_id: userData.user?.id,
      body: noteText.trim(),
    })
    setSaving(false)
    if (!error) {
      setNoteText('')
      load()
    }
  }

  if (loading) return <div className="p-8 text-slate-400">Загрузка…</div>
  if (error) return <div className="p-8 text-red-600 text-sm">{error}</div>
  if (!customer) return <div className="p-8 text-slate-400">Клиент не найден.</div>

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{customer.name}</h1>
        <div className="text-sm text-slate-400 mt-1 space-x-3">
          {customer.phone && <span>{customer.phone}</span>}
          {customer.telegram_username && <span>@{customer.telegram_username}</span>}
          {customer.email && <span>{customer.email}</span>}
        </div>
        <div className="mt-2 text-sm">
          <span className="font-mono">{customer.total_orders}</span> заказов ·{' '}
          <span className="font-mono">{Number(customer.total_spent).toLocaleString('ru-RU')} ₸</span> всего
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">История</h2>
          <form onSubmit={addNote} className="flex gap-2 mb-4">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Добавить заметку…"
              className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
            <button
              disabled={saving}
              className="bg-ink text-white text-sm px-4 rounded-md disabled:opacity-50"
            >
              {saving ? '…' : 'Добавить'}
            </button>
          </form>

          {events.length === 0 ? (
            <p className="text-sm text-slate-400">Событий пока нет.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">
                    {new Date(e.created_at).toLocaleString('ru-RU')} · {eventIcon(e.type)} {eventLabel(e.type)}
                  </div>
                  <div className="text-sm">{eventBody(e)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Заказы</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400">Заказов нет.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
                  <div className="flex justify-between font-mono">
                    <span>#{o.id.slice(0, 8)}</span>
                    <span>{Number(o.total).toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{orderStatusLabel(o.status)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function eventIcon(type: string) {
  if (type.startsWith('message')) return '💬'
  if (type.startsWith('order')) return '📦'
  if (type.startsWith('note')) return '📝'
  if (type.startsWith('task')) return '✅'
  return '•'
}

function eventLabel(type: string) {
  const map: Record<string, string> = {
    'customer.created': 'Клиент создан',
    'order.created': 'Новый заказ',
    'order.status_changed': 'Статус заказа изменён',
    'task.created': 'Новая задача',
    'task.completed': 'Задача выполнена',
    'note.created': 'Заметка',
    'message.received': 'Сообщение от клиента',
    'message.sent': 'Сообщение клиенту',
  }
  return map[type] || type
}

function eventBody(e: EventRow) {
  const p = e.payload || {}
  if (e.type === 'order.created') return `Сумма: ${Number(p.total).toLocaleString('ru-RU')} ₸`
  if (e.type === 'order.status_changed') return `${orderStatusLabel(p.from)} → ${orderStatusLabel(p.to)}`
  if (e.type === 'task.created' || e.type === 'task.completed') return p.title
  if (e.type === 'note.created') return p.body
  if (e.type === 'message.received' || e.type === 'message.sent') return `«${p.body}»`
  return ''
}

function orderStatusLabel(s: string) {
  const map: Record<string, string> = {
    new: 'Новый', in_progress: 'В работе', awaiting_payment: 'Ожидает оплаты',
    paid: 'Оплачен', completed: 'Выполнен', cancelled: 'Отменён',
  }
  return map[s] || s
}
