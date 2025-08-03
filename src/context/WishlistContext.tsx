"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getWishlist, addToWishlist, removeFromWishlist, WishlistItem } from '@/services/wishlist.service'
import { useAuth } from './AuthContext'

interface WishlistContextValue {
  items: WishlistItem[]
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadWishlist = async () => {
    if (!user) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const result = await getWishlist(user.id)
      setItems(result)
    } catch (error) {
      console.error('Error loading wishlist', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadWishlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.product_id === productId)
  }

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      alert('Debes iniciar sesión para guardar favoritos.')
      return
    }
    const exists = isInWishlist(productId)
    try {
      if (exists) {
        await removeFromWishlist(user.id, productId)
        setItems((prev) => prev.filter((item) => item.product_id !== productId))
      } else {
        await addToWishlist(user.id, productId)
        setItems((prev) => [...prev, { id: '', user_id: user.id, product_id: productId }])
      }
    } catch (error) {
      console.error('Error toggling wishlist', error)
    }
  }

  const value = React.useMemo<WishlistContextValue>(() => ({
    items,
    isInWishlist,
    toggleWishlist,
    refresh: loadWishlist,
  }), [items, isInWishlist, toggleWishlist, loadWishlist])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist debe ser usado dentro de WishlistProvider')
  return ctx
}