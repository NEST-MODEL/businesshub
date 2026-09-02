export type CustomerStatus = 'new' | 'active' | 'regular' | 'inactive'
export type OrderStatus =
  | 'new' | 'in_progress' | 'awaiting_payment' | 'paid' | 'completed' | 'cancelled'

export interface Customer {
  id: string
  organization_id: string
  name: string
  phone: string | null
  email: string | null
  telegram_username: string | null
  telegram_id: number | null
  status: CustomerStatus
  tags: string[]
  notes: string | null
  total_orders: number
  total_spent: number
  last_activity_at: string | null
  created_at: string
}

export interface Order {
  id: string
  organization_id: string
  customer_id: string
  status: OrderStatus
  total: number
  comment: string | null
  created_at: string
}

export interface Task {
  id: string
  organization_id: string
  customer_id: string | null
  title: string
  due_date: string | null
  priority: 'low' | 'normal' | 'high'
  is_completed: boolean
  created_at: string
}

export interface EventRow {
  id: string
  organization_id: string
  customer_id: string | null
  type: string
  payload: Record<string, any>
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string | null
  role: 'owner' | 'admin' | 'manager' | 'employee'
}
