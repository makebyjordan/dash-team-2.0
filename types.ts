
export type ViewType = 'dashboard' | 'invoices' | 'habits' | 'timegestion' | 'gsheets' | 'connections' | 'contacts' | 'clients' | 'interested' | 'tocontact' | 'vault' | 'followups' | 'mycalendar' | 'urgent' | 'list' | 'calendar' | 'checks' | 'settings' | 'cartera' | 'income' | 'expense' | 'subscriptions_ai' | 'subscriptions_tech';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export enum InvoiceStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Overdue = 'Overdue',
}

export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
}

export interface Habit {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
