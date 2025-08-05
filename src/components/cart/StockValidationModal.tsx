'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package } from 'lucide-react';
import { StockCheck } from '@/services/inventory.service';

interface StockValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockIssues: StockCheck[];
  onUpdateCart: (updates: { productId: string; newQuantity: number }[]) => void;
}

export function StockValidationModal({ 
  isOpen, 
  onClose, 
  stockIssues, 
  onUpdateCart 
}: Readonly<StockValidationModalProps>) {
  const handleFixStock = () => {
    const updates = stockIssues.map(issue => ({
      productId: issue.productId,
      newQuantity: Math.min(issue.requestedQuantity, issue.availableStock)
    }));
    
    onUpdateCart(updates);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Problemas de Stock
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Algunos productos en tu carrito tienen stock limitado:
          </p>
          
          <div className="space-y-3">
            {stockIssues.map((issue) => (
              <div key={issue.productId} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm">Producto ID: {issue.productId}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Solicitado: {issue.requestedQuantity}</p>
                  <p>Disponible: {issue.availableStock}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleFixStock} className="w-full">
              Ajustar Cantidades Automáticamente
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Revisar Carrito Manualmente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
