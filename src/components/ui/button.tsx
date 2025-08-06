import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

/**
 * COMPONENTE BUTTON REUTILIZABLE
 * Componente base para todos los botones de la aplicación
 * Utiliza class-variance-authority para manejo de variantes
 * Integrado con el sistema de diseño de StyleHub
 */

/**
 * Definición de variantes y estilos base del botón
 * Incluye todas las variantes visuales y de tamaño disponibles
 */
const buttonVariants = cva(
  // Estilos base aplicados a todos los botones
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      // Variantes visuales del botón
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Variantes de tamaño
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    // Valores por defecto cuando no se especifican variantes
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Interface que extiende las props nativas del botón HTML
 * Incluye las variantes de estilo y la opción asChild de Radix
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean; // Permite usar el componente como wrapper
}

/**
 * Componente Button con forwardRef para acceso al elemento DOM
 * Soporta todas las variantes definidas y puede actuar como wrapper (asChild)
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Utiliza Slot de Radix cuando asChild es true, botón nativo en caso contrario
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
