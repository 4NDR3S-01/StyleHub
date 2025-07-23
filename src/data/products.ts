import { Product, Category } from '@/types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Women',
    image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    slug: 'women'
  },
  {
    id: '2',
    name: 'Men',
    image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    slug: 'men'
  },
  {
    id: '3',
    name: 'Accessories',
    image: 'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    slug: 'accessories'
  },
  {
    id: '4',
    name: 'Shoes',
    image: 'https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    slug: 'shoes'
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic White Shirt',
    description: 'A timeless white button-down shirt made from premium cotton. Perfect for both casual and formal occasions.',
    price: 89.99,
    originalPrice: 120.00,
    images: [
      'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['White', 'Light Blue', 'Pink'],
    stock: 25,
    rating: 4.8,
    reviews: 142,
    featured: true,
    sale: true
  },
  {
    id: '2',
    name: 'Premium Denim Jacket',
    description: 'Vintage-inspired denim jacket with a modern fit. Made from sustainable denim with unique wash details.',
    price: 149.99,
    images: [
      'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Light Blue', 'Dark Blue', 'Black'],
    stock: 18,
    rating: 4.6,
    reviews: 89,
    featured: true
  },
  {
    id: '3',
    name: 'Luxury Cashmere Sweater',
    description: 'Ultra-soft cashmere sweater with a relaxed fit. Perfect layering piece for any wardrobe.',
    price: 299.99,
    images: [
      'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Beige', 'Gray', 'Navy', 'Black'],
    stock: 12,
    rating: 4.9,
    reviews: 67,
    featured: true
  },
  {
    id: '4',
    name: 'Men\'s Leather Jacket',
    description: 'Classic leather jacket with modern styling. Made from genuine leather with premium hardware.',
    price: 399.99,
    images: [
      'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
    ],
    category: 'men',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Brown', 'Navy'],
    stock: 8,
    rating: 4.7,
    reviews: 124,
    featured: true
  },
  {
    id: '5',
    name: 'Designer Handbag',
    description: 'Elegant handbag crafted from premium leather. Features multiple compartments and adjustable strap.',
    price: 249.99,
    originalPrice: 320.00,
    images: [
      'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1',
      'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
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
      'https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
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