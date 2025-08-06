'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DiagnosticResult {
  table: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface TableTest {
  name: string;
  fields?: string;
}

export default function AdminDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const testTable = async (test: TableTest): Promise<DiagnosticResult> => {
    try {
      const { error } = await supabase
        .from(test.name)
        .select(test.fields || 'id')
        .limit(1);
      
      if (error) {
        return {
          table: test.name,
          status: 'error',
          message: `Error al acceder a la tabla ${test.name}`,
          details: error.message
        };
      }
      
      return {
        table: test.name,
        status: 'success',
        message: `Tabla ${test.name} compatible`
      };
    } catch (err) {
      return {
        table: test.name,
        status: 'error',
        message: `Error de conexión con ${test.name}`,
        details: err instanceof Error ? err.message : 'Error desconocido'
      };
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    
    const mainTables: TableTest[] = [
      {
        name: 'products',
        fields: 'id, name, price, category_id, brand, gender, season, featured, sale, active, is_active, is_featured'
      },
      {
        name: 'product_variants',
        fields: 'id, product_id, color, size, stock, price_adjustment, image, sku'
      },
      {
        name: 'categories',
        fields: 'id, name, slug, image, description, parent_id, active, sort_order'
      },
      {
        name: 'orders',
        fields: 'id, user_id, order_number, total, subtotal, status, payment_status, payment_method'
      },
      {
        name: 'coupons',
        fields: 'id, code, description, discount_type, discount_value, max_uses, active'
      },
      {
        name: 'reviews',
        fields: 'id, product_id, user_id, rating, comment, approved, verified_purchase'
      },
      {
        name: 'users',
        fields: 'id, email, name, lastname, role, phone, email_verified, account_status'
      }
    ];

    const personalizationTables: TableTest[] = [
      { name: 'theme_settings', fields: 'id' },
      { name: 'branding_settings', fields: 'id' },
      { name: 'banners', fields: 'id' },
      { name: 'footer_settings', fields: 'id' }
    ];

    const allTests = [...mainTables, ...personalizationTables];
    const results = await Promise.all(allTests.map(testTable));
    
    setDiagnostics(results);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Database className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Ejecutando diagnósticos...</p>
        </div>
      </div>
    );
  }

  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Diagnóstico del Panel de Administrador
        </h2>
        <div className="flex justify-center space-x-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">Compatibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-sm text-gray-600">Advertencias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">Errores</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {diagnostics.map((diagnostic) => (
          <div
            key={diagnostic.table}
            className={`p-4 rounded-lg border ${getStatusColor(diagnostic.status)}`}
          >
            <div className="flex items-start space-x-3">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold capitalize">{diagnostic.table}</h3>
                </div>
                <p className="text-gray-700 mt-1">{diagnostic.message}</p>
                {diagnostic.details && (
                  <p className="text-sm text-gray-500 mt-2">{diagnostic.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Recomendaciones:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Si hay errores rojos, verifica que las tablas existan en tu base de datos</li>
          <li>• Las advertencias amarillas indican funcionalidad limitada pero no crítica</li>
          <li>• Los éxitos verdes confirman que el panel funciona correctamente con tu esquema</li>
          <li>• Asegúrate de que las políticas RLS estén configuradas correctamente</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={runDiagnostics}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ejecutar Diagnósticos Nuevamente
        </button>
      </div>
    </div>
  );
}
