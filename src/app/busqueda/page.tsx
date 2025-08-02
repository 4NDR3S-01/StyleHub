"use client"

import { useState, useEffect, Suspense } from 'react'
import { searchProducts } from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard'
import { useSearchParams, useRouter } from 'next/navigation'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    if (q) {
      setLoading(true)
      searchProducts(q)
        .then((res) => setResults(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false))
    } else {
      setResults([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/busqueda?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Buscar productos</h1>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="search"
            placeholder="Buscar por nombre o descripción"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow border rounded-md p-2"
          />
          <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md">
            Buscar
          </button>
        </form>
      {loading ? (
        <p>Cargando...</p>
      ) : results.length === 0 ? (
        <p>No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}