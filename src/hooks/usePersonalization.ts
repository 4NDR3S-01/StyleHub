'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getActiveTheme,
  getBrandingSettings,
  getFooterSettings,
  getFooterLinks,
  getSocialMedia,
  getActiveBanners,
  type ThemeSettings,
  type BrandingSettings,
  type FooterSettings,
  type FooterLink,
  type SocialMedia,
  type Banner
} from '@/services/personalization.service';

interface PersonalizationData {
  theme: ThemeSettings | null;
  branding: BrandingSettings | null;
  footer: FooterSettings | null;
  footerLinks: FooterLink[];
  socialMedia: SocialMedia[];
  banners: Banner[];
}

export function usePersonalization() {
  const [data, setData] = useState<PersonalizationData>({
    theme: null,
    branding: null,
    footer: null,
    footerLinks: [],
    socialMedia: [],
    banners: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPersonalizationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        theme,
        branding,
        footer,
        footerLinks,
        socialMedia,
        banners
      ] = await Promise.all([
        getActiveTheme(),
        getBrandingSettings(),
        getFooterSettings(),
        getFooterLinks(),
        getSocialMedia(),
        getActiveBanners()
      ]);

      setData({
        theme,
        branding,
        footer,
        footerLinks,
        socialMedia,
        banners
      });
    } catch (err) {
      console.error('Error loading personalization data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersonalizationData();
  }, [loadPersonalizationData]);

  const refreshData = useCallback(() => {
    loadPersonalizationData();
  }, [loadPersonalizationData]);

  return {
    ...data,
    loading,
    error,
    refreshData
  };
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const activeTheme = await getActiveTheme();
        setTheme(activeTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  return { theme, loading };
}

export function useBanners(position?: string) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const activeBanners = await getActiveBanners(position);
        setBanners(activeBanners);
      } catch (error) {
        console.error('Error loading banners:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, [position]);

  return { banners, loading };
}
