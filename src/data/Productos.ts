import { productos } from '../types';

export const Productos: productos[] = [
  {
    id: '1',
    name: 'Camisa Blanca Clásica',
    description: 'Una camisa blanca atemporal de algodón premium. Perfecta tanto para ocasiones casuales como formales.',
    price: 89.99,
    originalPrice: 120.00,
    images: [
      'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blanco', 'Azul Claro', 'Rosa'],
    stock: 25,
    rating: 4.8,
    reviews: 142,
    featured: true,
    sale: true
  },
  {
    id: '2',
    name: 'Chaqueta de Mezclilla Premium',
    description: 'Chaqueta de mezclilla de inspiración vintage con ajuste moderno. Hecha de mezclilla sostenible con detalles únicos de lavado.',
    price: 149.99,
    images: [
      'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Azul Claro', 'Azul Oscuro', 'Negro'],
    stock: 18,
    rating: 4.6,
    reviews: 89,
    featured: true
  },
  {
    id: '3',
    name: 'Suéter de Cachemira de Lujo',
    description: 'Suéter de cachemira ultra suave con ajuste relajado. Pieza perfecta para combinar en cualquier guardarropa.',
    price: 299.99,
    images: [
      'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/2235071/pexels-photo-2235071.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Beige', 'Gris', 'Azul Marino', 'Negro'],
    stock: 12,
    rating: 4.9,
    reviews: 67,
    featured: true
  },
  {
    id: 4,
    name: 'Buzo de Cuero para Hombre',
    description: 'Buzo de cuero clásico con estilo moderno. Hecho de cuero genuino con herrajes premium.',
    price: 399.99,
    images: [
      'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/2928206/pexels-photo-2928206.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'men',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro', 'Marrón', 'Azul Marino'],
    color: 'Negro',
    stock: 8,
    rating: 4.7,
    reviews: 124,
    featured: true
  },
  {
    id: '7',
    name: 'Camisa Casual Hombre',
    description: 'Camisa de algodón, perfecta para el día a día.',
    price: 59.99,
    images: [
      'https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blanco', 'Azul'],
    size: 'M',
    rating: 4.5,
    reviews: 80,
    featured: false
  },
  {
    id: '8',
    name: 'Jeans Slim Hombre',
    description: 'Jeans azul oscuro, corte slim, ideal para cualquier ocasión.',
    price: 79.99,
    images: [
      'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Azul Oscuro'],
    color: 'Azul Oscuro',
    size: 'L',
    stock: 20,
    rating: 4.6,
    reviews: 65,
    featured: false
  },
  {
    id: '9',
    name: 'Polo Básico Hombre',
    description: 'Polo básico de algodón, disponible en varios colores.',
    price: 39.99,
    images: [
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro', 'Blanco', 'Gris'],
    size: 'M',
    stock: 30,
    rating: 4.3,
    reviews: 40,
    featured: false
  },
  {
    id: '5',
    name: 'Designer Handbag',
    description: 'Elegant handbag crafted from premium leather. Features multiple compartments and adjustable strap.',
    price: 249.99,
    originalPrice: 320.00,
    images: [
      'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/2562992/pexels-photo-2562992.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'accessories',
    sizes: ['One Size'],
    colors: ['Black', 'Brown', 'Tan', 'Red'],
    stock: 15,
    rating: 4.8,
    reviews: 203,
    featured: true,
    sale: true
  },
  {
    id: '6',
    name: 'Premium Sneakers',
    description: 'Comfortable and stylish sneakers with premium materials. Perfect for everyday wear.',
    price: 129.99,
    images: [
      'https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'shoes',
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    colors: ['White', 'Black', 'Gray', 'Navy'],
    stock: 32,
    rating: 4.5,
    reviews: 178,
    featured: true
  }
];