import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Customer, Task } from '../types'

export default function Tasks() {
  const [tasks, setTasks] = useState<(Task & { customers: { name: string } | null })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const [{ data: t, error: tErr }, { data: c }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, customers(name)')
        .order('due_date', { ascending: true }),
      supabase.from('customers').select('*').order('name'),
    ])
    if (tErr) setError('Не удалось загрузить задачи. Проверьте соединение.')
    setTasks((t as any) || [])
    setCustomers(c || [])
    setLoading(false)
  }

  async function createTask(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const orgId = customers[0]?.organization_id
    const { data: userData } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userData.user?.id)
      .single()
    const { error } = await supabase.from('tasks').insert({
      organization_id: profile?.organization_id || orgId,
      customer_id: customerId || null,
      title: title.trim(),
      due_date: dueDate || null,
      priority,
    })
    setSaving(false)
    if (!error) {
      setShowForm(false)
      setTitle('')
      setCustomerId('')
      setDueDate('')
      setPriority('normal')
      load()
    }
  }

  async function toggleDone(task: Task) {
    await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id)
    load()
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Задачи</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink text-white text-sm px-4 py-2 rounded-md"
        >
          {showForm ? 'Отмена' : '+ Новая задача'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTask} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Что нужно сделать</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Клиент (опц.)</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="low">Низкий</option>
              <option value="normal">Обычный</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <button disabled={saving} className="bg-ink text-white text-sm px-4 py-2 rounded-md disabled:opacity-50">
            {saving ? 'Создаём…' : 'Создать задачу'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-400">Задач пока нет.</p>
      ) : (
        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={t.is_completed}
                onChange={() => toggleDone(t)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className={`text-sm ${t.is_completed ? 'line-through text-slate-400' : ''}`}>
                  {t.title}
                </div>
                <div className="text-xs text-slate-400">
                  {t.customers?.name && `${t.customers.name} · `}
                  {t.due_date && new Date(t.due_date).toLocaleDateString('ru-RU')}
                </div>
              </div>
              {t.priority === 'high' && !t.is_completed && (
                <span className="text-xs text-amber font-medium">высокий</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
