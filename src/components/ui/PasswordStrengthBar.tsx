'use client';

import React from 'react';
import { Shield, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';

interface PasswordStrengthBarProps {
  password: string;
  showDetails?: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  level: 'muy-debil' | 'debil' | 'medio' | 'fuerte' | 'muy-fuerte';
  color: string;
  message: string;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Calcular puntuación basada en los criterios cumplidos
  let score = 0;
  if (checks.length) score++;
  if (checks.lowercase) score++;
  if (checks.uppercase) score++;
  if (checks.numbers) score++;
  if (checks.symbols) score++;

  // Ajustar puntuación por longitud
  if (password.length >= 12) score = Math.min(score + 1, 4);
  if (password.length >= 16) score = 4;

  // Determinar nivel y mensaje
  let level: PasswordStrength['level'];
  let color: string;
  let message: string;

  if (score === 0) {
    level = 'muy-debil';
    color = 'bg-red-500';
    message = 'Muy débil';
  } else if (score === 1) {
    level = 'debil';
    color = 'bg-red-400';
    message = 'Débil';
  } else if (score === 2) {
    level = 'medio';
    color = 'bg-yellow-500';
    message = 'Medio';
  } else if (score === 3) {
    level = 'fuerte';
    color = 'bg-green-500';
    message = 'Fuerte';
  } else {
    level = 'muy-fuerte';
    color = 'bg-green-600';
    message = 'Muy fuerte';
  }

  return { score, level, color, message, checks };
}

export default function PasswordStrengthBar({ password, showDetails = true }: Readonly<PasswordStrengthBarProps>) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  const getIcon = () => {
    switch (strength.level) {
      case 'muy-debil':
        return <ShieldX className="w-4 h-4 text-red-500" />;
      case 'debil':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medio':
        return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'fuerte':
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'muy-fuerte':
        return <ShieldCheck className="w-4 h-4 text-green-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTextColor = () => {
    if (strength.level === 'muy-debil' || strength.level === 'debil') {
      return 'text-red-600';
    }
    if (strength.level === 'medio') {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  return (
    <div className="mt-2">
      {/* Barra de progreso */}
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>
        </div>
        <span className={`text-sm font-medium ${getTextColor()}`}>
          {strength.message}
        </span>
      </div>

      {/* Detalles de requisitos */}
      {showDetails && (
        <div className="text-xs space-y-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <div className={`flex items-center gap-1 ${strength.checks.length ? 'text-green-600' : 'text-gray-500'}`}>
              {strength.checks.length ? '✓' : '○'} Al menos 8 caracteres
            </div>
            <div className={`flex items-center gap-1 ${strength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
              {strength.checks.lowercase ? '✓' : '○'} Minúsculas (a-z)
            </div>
            <div className={`flex items-center gap-1 ${strength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
              {strength.checks.uppercase ? '✓' : '○'} Mayúsculas (A-Z)
            </div>
            <div className={`flex items-center gap-1 ${strength.checks.numbers ? 'text-green-600' : 'text-gray-500'}`}>
              {strength.checks.numbers ? '✓' : '○'} Números (0-9)
            </div>
            <div className={`flex items-center gap-1 ${strength.checks.symbols ? 'text-green-600' : 'text-gray-500'} sm:col-span-2`}>
              {strength.checks.symbols ? '✓' : '○'} Símbolos (!@#$%^&*)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
