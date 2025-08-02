'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import type {
  ThemeSettings,
  BrandingSettings,
  FooterSettings,
  FooterLink,
  SocialMedia,
  Banner
} from '@/services/personalization.service';

interface PersonalizationContextType {
  theme: ThemeSettings | null;
  branding: BrandingSettings | null;
  footer: FooterSettings | null;
  footerLinks: FooterLink[];
  socialMedia: SocialMedia[];
  banners: Banner[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(
  undefined
);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const personalizationData = usePersonalization();

  return (
    <PersonalizationContext.Provider value={personalizationData}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalizationContext() {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalizationContext must be used within a PersonalizationProvider');
  }
  return context;
}

// Hook específico para aplicar CSS custom properties del tema
export function useThemeCSS() {
  const { theme } = usePersonalizationContext();

  const applyThemeCSS = () => {
    if (theme?.colors) {
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
  };

  return { applyThemeCSS, theme };
}
