import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError || !authData.user) {
      setLoading(false)
      setError(authError?.message || 'Не удалось создать аккаунт.')
      return
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: companyName })
      .select()
      .single()

    if (orgError) {
      setLoading(false)
      setError('Аккаунт создан, но не удалось создать компанию: ' + orgError.message)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      organization_id: org.id,
      full_name: fullName,
      role: 'owner',
    })

    setLoading(false)
    if (profileError) {
      setError('Компания создана, но профиль — нет: ' + profileError.message)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-8">
        <h1 className="text-xl font-semibold mb-1">Создать компанию</h1>
        <p className="text-sm text-slate-400 mb-6">Первый пользователь становится владельцем</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название компании</label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ваше имя</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Создаём…' : 'Создать компанию'}
          </button>
        </form>
        <p className="text-sm text-slate-400 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-signal font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
