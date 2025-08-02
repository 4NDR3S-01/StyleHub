"use client"

import { useEffect, useState } from 'react'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import ProductCard from '@/components/product/ProductCard'

export default function WishlistPage() {
  const { items, refresh } = useWishlist()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!user) {
    return <p className="p-4">Inicia sesión para ver tu lista de favoritos.</p>
  }
  if (loading) {
    return <p className="p-4">Cargando...</p>
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Mis Favoritos</h1>
      {items.length === 0 ? (
        <p>No tienes productos en tu lista de favoritos.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            // @ts-ignore products relationship includes producto completo
            <ProductCard key={item.id || item.product_id} product={item.products} />
          ))}
        </div>
      )}
    </div>
  )
}