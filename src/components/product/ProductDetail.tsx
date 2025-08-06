"use client"

import { useState, useEffect } from "react"
import { Product } from "@/services/product.service"
import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"
import { getProductColors, getProductSizes, getProductVariant } from "@/services/variant.service"
import ProductReviews from "./ProductReviews"
import ReviewForm from "./ReviewForm"

interface ProductDetailProps {
  readonly product: Product
}

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
  image?: string;
  sku?: string;
  price_adjustment?: number;
}

interface ColorOption {
  color: string;
  image?: string;
}

interface SizeOption {
  size: string;
  stock: number;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [mainImage, setMainImage] = useState(product.images?.[0] || "")
  const [refreshReviews, setRefreshReviews] = useState(0)
  
  // Estados para variantes
  const [colors, setColors] = useState<ColorOption[]>([])
  const [sizes, setSizes] = useState<SizeOption[]>([])
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [loadingVariants, setLoadingVariants] = useState(true)
  const [variantError, setVariantError] = useState<string | null>(null)
  
  // Estados para sistema híbrido de imágenes
  const [isViewingGeneral, setIsViewingGeneral] = useState(true)
  const [variantImages, setVariantImages] = useState<string[]>([])
  const [displayImages, setDisplayImages] = useState<string[]>(product.images || [])

  // Detectar hidratación del componente
  // Detectar hidratación del componente
  // (Eliminado: isHydrated no se utiliza)
  // Cargar colores disponibles al montar el componente
  useEffect(() => {
    const loadColors = async () => {
      try {
        setLoadingVariants(true)
        const productColors = await getProductColors(product.id)
        setColors(productColors)
        
        // Seleccionar el primer color por defecto
        if (productColors.length > 0) {
          const firstColor = productColors[0].color
          setSelectedColor(firstColor)
          
          // Configurar imágenes según el primer color
          if (productColors[0].image) {
            setVariantImages([productColors[0].image])
            setDisplayImages([productColors[0].image])
            setMainImage(productColors[0].image)
            setIsViewingGeneral(false)
          } else {
            setVariantImages([])
            setDisplayImages(product.images || [])
            setMainImage(product.images?.[0] || "")
            setIsViewingGeneral(true)
          }
        } else {
          // No hay variantes, usar imágenes del producto
          setDisplayImages(product.images || [])
          setMainImage(product.images?.[0] || "")
          setIsViewingGeneral(true)
        }
      } catch (error) {
        console.error('Error loading colors:', error)
        setVariantError('Error al cargar los colores disponibles')
      } finally {
        setLoadingVariants(false)
      }
    }
    
    loadColors()
  }, [product.id, product.images])

  // Cargar tallas cuando cambia el color seleccionado
  useEffect(() => {
    const loadSizes = async () => {
      if (!selectedColor) return
      
      try {
        const productSizes = await getProductSizes(product.id, selectedColor)
        setSizes(productSizes)
        
        // Limpiar talla seleccionada y seleccionar la primera disponible
        setSelectedSize("")
        setSelectedVariant(null)
        if (productSizes.length > 0) {
          const firstSize = productSizes[0].size
          setSelectedSize(firstSize)
        }
      } catch (error) {
        console.error('Error loading sizes:', error)
        setVariantError('Error al cargar las tallas disponibles')
      }
    }
    
    loadSizes()
  }, [selectedColor, product.id])

  // Cargar variante específica cuando cambian color y talla
  useEffect(() => {
    const loadVariant = async () => {
      if (!selectedColor || !selectedSize) {
        setSelectedVariant(null)
        return
      }
      
      try {
        const variant = await getProductVariant(product.id, selectedColor, selectedSize)
        setSelectedVariant(variant)
        setVariantError(null)
      } catch (error) {
        console.error('Error loading variant:', error)
        setSelectedVariant(null)
        setVariantError('Esta combinación no está disponible')
      }
    }
    
    loadVariant()
  }, [selectedColor, selectedSize, product.id])

  const handleReviewSubmitted = () => {
    setRefreshReviews(prev => prev + 1)
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    
    // Encontrar el color seleccionado
    const colorOption = colors.find(c => c.color === color)
    
    if (colorOption?.image) {
      // Si el color tiene imagen específica, mostrar solo esa imagen
      setVariantImages([colorOption.image])
      setDisplayImages([colorOption.image])
      setMainImage(colorOption.image)
      setIsViewingGeneral(false)
    } else {
      // Si no tiene imagen específica, mostrar imágenes generales del producto
      setVariantImages([])
      setDisplayImages(product.images || [])
      setMainImage(product.images?.[0] || "")
      setIsViewingGeneral(true)
    }
  }

  const handleViewModeChange = (viewGeneral: boolean) => {
    setIsViewingGeneral(viewGeneral)
    
    if (viewGeneral) {
      // Mostrar imágenes generales del producto
      setDisplayImages(product.images || [])
      setMainImage(product.images?.[0] || "")
    } else {
      // Mostrar imagen específica de la variante si existe
      const colorOption = colors.find(c => c.color === selectedColor)
      if (colorOption?.image) {
        setDisplayImages([colorOption.image])
        setMainImage(colorOption.image)
      } else {
        // Fallback a imágenes generales si no hay imagen de variante
        setDisplayImages(product.images || [])
        setMainImage(product.images?.[0] || "")
      }
    }
  }

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert('Por favor selecciona color y talla')
      return
    }

    if (selectedVariant.stock < selectedQuantity) {
      alert('Stock insuficiente')
      return
    }

    // Calcular precio final con redondeo para evitar problemas de precisión
    const finalPrice = Math.round((product.price + (selectedVariant.price_adjustment || 0)) * 100) / 100
    
    const cartItem = {
      id: `${product.id}-${selectedVariant.id}-${Date.now()}`,
      producto: {
        id: product.id,
        name: product.name,
        price: finalPrice,
        images: product.images,
        category_id: product.category_id
      },
      quantity: selectedQuantity,
      variant: {
        id: selectedVariant.id,
        color: selectedColor,
        size: selectedSize,
        stock: selectedVariant.stock
      }
    }
    addItem(cartItem)
  }

  // Calcular precio final con ajuste de variante (redondeado a 2 decimales)
  const finalPrice = selectedVariant 
    ? Math.round((Number(product.price) + Number(selectedVariant.price_adjustment || 0)) * 100) / 100
    : Math.round(Number(product.price) * 100) / 100

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          {/* Controles del sistema híbrido */}
          {!loadingVariants && colors.length > 0 && variantImages.length > 0 && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleViewModeChange(true)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  isViewingGeneral 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Vista general
              </button>
              <button
                onClick={() => handleViewModeChange(false)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  !isViewingGeneral 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Color: {selectedColor}
              </button>
            </div>
          )}
          
          {/* Imagen principal */}
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Galería de imágenes */}
          <div className="flex space-x-2 overflow-x-auto">
            {displayImages.map((img, index) => (
              <button
                key={`${img}-${index}`}
                className={`w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  mainImage === img 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-transparent hover:border-blue-300'
                }`}
                onClick={() => setMainImage(img)}
              >
                <img
                  src={img}
                  alt={`${product.name} vista ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          
          {/* Indicador del modo de vista actual */}
          {!loadingVariants && colors.length > 0 && variantImages.length > 0 && (
            <div className="text-xs text-gray-500 text-center">
              {isViewingGeneral ? (
                <span>🖼️ Mostrando imágenes generales del producto</span>
              ) : (
                <span>🎨 Mostrando imagen específica para color {selectedColor}</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-slate-900 mr-2 flex-1">{product.name}</h1>
            <button
              className="text-2xl text-red-500 hover:scale-110 transition-transform"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Agregar a favoritos"
            >
              {isInWishlist(product.id) ? "♥" : "♡"}
            </button>
          </div>

          <div className="text-2xl font-semibold text-green-600">
            ${finalPrice.toFixed(2)}
            {selectedVariant?.price_adjustment && Number(selectedVariant.price_adjustment) !== 0 && (
              <span className="text-sm text-gray-500 ml-2">
                (${product.price.toFixed(2)} + ${Number(selectedVariant.price_adjustment).toFixed(2)})
              </span>
            )}
          </div>

          {product.description && (
            <div className="text-gray-700">
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.category && (
            <div className="text-sm text-gray-600">
              Categoría: <span className="font-medium">{product.category.name}</span>
            </div>
          )}

          {/* Selección de variantes */}
          {!loadingVariants && colors.length > 0 && (
            <div className="space-y-4">
              {/* Selección de color */}
              <div>
                <h3 className="font-semibold mb-2">Color</h3>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((colorOption) => (
                    <button
                      key={colorOption.color}
                      onClick={() => handleColorChange(colorOption.color)}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        selectedColor === colorOption.color
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {colorOption.color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selección de talla */}
              {selectedColor && sizes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Talla</h3>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((sizeOption) => {
                      let buttonClass = 'px-4 py-2 border rounded-md transition-colors ';
                      if (selectedSize === sizeOption.size) {
                        buttonClass += 'bg-blue-600 text-white border-blue-600';
                      } else if (sizeOption.stock === 0) {
                        buttonClass += 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
                      } else {
                        buttonClass += 'bg-white text-gray-700 border-gray-300 hover:border-blue-400';
                      }

                      return (
                        <button
                          key={sizeOption.size}
                          onClick={() => setSelectedSize(sizeOption.size)}
                          disabled={sizeOption.stock === 0}
                          className={buttonClass}
                        >
                          {sizeOption.size}
                          {sizeOption.stock <= 5 && sizeOption.stock > 0 && (
                            <span className="ml-1 text-xs text-red-500">({sizeOption.stock})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Información de stock */}
              {selectedVariant && (
                <div className="text-sm text-gray-600">
                  Stock: <span className="font-medium">
                    {selectedVariant.stock > 0 
                      ? `${selectedVariant.stock} disponibles`
                      : "Agotado"
                    }
                  </span>
                  {selectedVariant.sku && (
                    <span className="ml-4">SKU: <span className="font-mono">{selectedVariant.sku}</span></span>
                  )}
                </div>
              )}

              {/* Error de variante */}
              {variantError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {variantError}
                </div>
              )}
            </div>
          )}

          {/* Estado de carga */}
          {loadingVariants && (
            <div className="text-sm text-gray-500">
              Cargando opciones disponibles...
            </div>
          )}

          {/* Si no hay variantes, mostrar stock general */}
          {!loadingVariants && colors.length === 0 && (
            <div className="text-sm text-gray-600">
              Stock: <span className="font-medium">Consultar disponibilidad</span>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label htmlFor="quantity" className="font-semibold">Cantidad:</label>
            <select
              id="quantity"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              {Array.from({ length: Math.min(10, selectedVariant?.stock || 1) }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={
                loadingVariants || 
                !selectedVariant || 
                selectedVariant.stock <= 0 ||
                (colors.length > 0 && (!selectedColor || !selectedSize))
              }
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {(() => {
                if (loadingVariants) return "Cargando...";
                if (!selectedVariant && colors.length > 0) return "Selecciona color y talla";
                if (selectedVariant?.stock === 0) return "Sin stock";
                return "Agregar al carrito";
              })()}
            </button>
            
            <button
              onClick={() => toggleWishlist(product.id)}
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {isInWishlist(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
            </button>
          </div>

          <div className="border-t pt-6 space-y-2 text-sm text-gray-600">
            <p>• Envío gratis en compras superiores dese $50</p>
            <p>• Devoluciones gratuitas si cumple con nuestra política de devoluciones</p>
            <p>• Garantía de satisfacción</p>
          </div>
        </div>
      </div>

      {/* Sección de Reseñas */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Título */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Reseñas de Clientes</h2>
            <p className="text-gray-600">Descubre lo que nuestros clientes dicen sobre este producto</p>
          </div>

          {/* Formulario para enviar reseña */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Deja tu reseña</h3>
            <ReviewForm 
              productId={product.id} 
              onSubmitted={handleReviewSubmitted}
            />
          </div>

          {/* Lista de reseñas aprobadas */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Reseñas</h3>
            <ProductReviews 
              productId={product.id} 
              key={refreshReviews} 
            />
          </div>
        </div>
      </div>
    </>
  )
}
