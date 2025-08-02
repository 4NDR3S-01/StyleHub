import OrdersAdmin from '@/components/admin/OrdersAdmin'
import ProtectedRoute from '@/components/ProtectedRoute'

/**
 * Página de administración de órdenes.  Renderiza el componente
 * `OrdersAdmin` que permite listar las órdenes de Supabase y cambiar
 * su estado.
 */
export default function AdminOrdersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="mt-4 sm:mt-6 md:mt-8">
        <OrdersAdmin />
      </div>
    </ProtectedRoute>
  )
}