'use client';

import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  onClick?: () => void;
}

export default function UserAvatar({ 
  src, 
  name = 'Usuario', 
  size = 'md', 
  className = '', 
  alt = 'Avatar',
  onClick
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Configuraciones de tamaño
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-32 h-32 text-2xl'
  };
  
  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Generar color de fondo basado en el nombre
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-[#ff6f61] to-[#d7263d]'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const baseClasses = `${sizeClasses[size]} rounded-full ${className}`;
  
  // Si hay imagen y no ha habido error, mostrar imagen
  if (src && !imageError) {
    if (onClick) {
      return (
        <button
          className={`${baseClasses} object-cover overflow-hidden border-0 p-0`}
          onClick={onClick}
          aria-label={alt}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </button>
      );
    }
    
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseClasses} object-cover`}
        onError={() => setImageError(true)}
      />
    );
  }
  
  // Mostrar avatar con iniciales
  if (onClick) {
    return (
      <button 
        className={`${baseClasses} ${getBackgroundColor(name)} flex items-center justify-center text-white font-semibold shadow-lg border-2 border-white/20`}
        onClick={onClick}
        aria-label={alt}
      >
        {getInitials(name)}
      </button>
    );
  }
  
  return (
    <div 
      className={`${baseClasses} ${getBackgroundColor(name)} flex items-center justify-center text-white font-semibold shadow-lg border-2 border-white/20`}
    >
      {getInitials(name)}
    </div>
  );
}
