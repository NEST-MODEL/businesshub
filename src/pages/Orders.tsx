import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Customer, Order, OrderStatus } from '../types'

const statuses: { key: OrderStatus; label: string }[] = [
  { key: 'new', label: 'Новый' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'awaiting_payment', label: 'Ожидает оплаты' },
  { key: 'paid', label: 'Оплачен' },
  { key: 'completed', label: 'Выполнен' },
  { key: 'cancelled', label: 'Отменён' },
]

export default function Orders() {
  const [orders, setOrders] = useState<(Order & { customers: { name: string } | null })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [total, setTotal] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const [{ data: o, error: oErr }, { data: c }] = await Promise.all([
      supabase
        .from('orders')
        .select('*, customers(name)')
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    if (oErr) setError('Не удалось загрузить заказы. Проверьте соединение.')
    setOrders((o as any) || [])
    setCustomers(c || [])
    setLoading(false)
  }

  async function createOrder(e: FormEvent) {
    e.preventDefault()
    if (!customerId || !total) return
    setSaving(true)
    const customer = customers.find((c) => c.id === customerId)
    const { error } = await supabase.from('orders').insert({
      organization_id: customer?.organization_id,
      customer_id: customerId,
      total: Number(total),
      comment: comment || null,
    })
    setSaving(false)
    if (!error) {
      setShowForm(false)
      setCustomerId('')
      setTotal('')
      setComment('')
      load()
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    load()
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Заказы</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink text-white text-sm px-4 py-2 rounded-md"
        >
          {showForm ? 'Отмена' : '+ Новый заказ'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createOrder} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Клиент</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Выберите клиента</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Сумма, ₸</label>
            <input
              type="number"
              required
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button disabled={saving} className="bg-ink text-white text-sm px-4 py-2 rounded-md disabled:opacity-50">
            {saving ? 'Создаём…' : 'Создать заказ'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-slate-400">Заказов пока нет.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link to={`/customers/${o.customer_id}`} className="text-sm font-medium">
                  {o.customers?.name || '—'}
                </Link>
                <div className="text-xs text-slate-400">#{o.id.slice(0, 8)} · {o.comment || 'без комментария'}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono">{Number(o.total).toLocaleString('ru-RU')} ₸</span>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1"
                >
                  {statuses.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
