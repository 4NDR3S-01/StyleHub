'use client';

import React from 'react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Restablecer Contraseña
          </h2>
          <p className="text-gray-600 text-center">
            Funcionalidad de restablecimiento de contraseña en desarrollo.
          </p>
          <div className="mt-6">
            <a 
              href="/" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
