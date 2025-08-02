'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  PlusIcon, EditIcon, TrashIcon, ExternalLinkIcon,
  FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon, YoutubeIcon
} from 'lucide-react';
import { 
  getFooterSettings,
  saveFooterSettings,
  getFooterLinks,
  saveFooterLink,
  updateFooterLink,
  deleteFooterLink,
  getSocialMedia,
  saveSocialMedia,
  updateSocialMedia,
  deleteSocialMedia,
  type FooterSettings,
  type FooterLink,
  type SocialMedia 
} from '@/services/personalization.service';

const SOCIAL_MEDIA_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { value: 'twitter', label: 'Twitter', icon: TwitterIcon },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { value: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon },
  { value: 'youtube', label: 'YouTube', icon: YoutubeIcon },
];

const LINK_CATEGORIES = [
  'Productos',
  'Categorías',
  'Información',
  'Ayuda',
  'Legal',
  'Empresa',
];

export default function FooterPage() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [editingSocial, setEditingSocial] = useState<SocialMedia | null>(null);

  // Formularios
  const [settingsForm, setSettingsForm] = useState({
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    copyright_text: '',
    show_newsletter_signup: true,
    newsletter_text: ''
  });

  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    category: '',
    is_active: true,
    sort_order: 0
  });

  const [socialForm, setSocialForm] = useState({
    platform: '',
    url: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settings, links, social] = await Promise.all([
        getFooterSettings(),
        getFooterLinks(),
        getSocialMedia()
      ]);
      if (settings) {
        setFooterSettings(settings);
        setSettingsForm({
          description: settings.description || '',
          contact_email: settings.email || '',
          contact_phone: settings.phone || '',
          address: settings.address || '',
          copyright_text: settings.copyright || '',
          show_newsletter_signup: settings.show_newsletter ?? true,
          newsletter_text: settings.newsletter_description || ''
        });
      }
      setFooterLinks(links);
      setSocialMedia(social);
    } catch (error) {
      console.error('Error loading footer data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del footer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const footerData = {
        company_name: footerSettings?.company_name || 'StyleHub',
        description: settingsForm.description,
        email: settingsForm.contact_email,
        phone: settingsForm.contact_phone,
        address: settingsForm.address,
        copyright: settingsForm.copyright_text,
        show_newsletter: settingsForm.show_newsletter_signup,
        newsletter_title: 'Suscríbete a nuestro newsletter',
        newsletter_description: settingsForm.newsletter_text
      };
      
      await saveFooterSettings(footerData);
      toast({
        title: "Éxito",
        description: "Configuración del footer actualizada correctamente",
      });
      loadData();
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración del footer",
        variant: "destructive",
      });
    }
  };

  const handleSaveLink = async () => {
    try {
      const linkData = {
        title: linkForm.title,
        url: linkForm.url,
        category: linkForm.category,
        external: false,
        active: linkForm.is_active,
        sort_order: linkForm.sort_order
      };
      
      if (editingLink?.id) {
        await updateFooterLink(editingLink.id, linkData);
      } else {
        await saveFooterLink(linkData);
      }
      toast({
        title: "Éxito",
        description: `Enlace ${editingLink ? 'actualizado' : 'creado'} correctamente`,
      });
      setIsLinkDialogOpen(false);
      resetLinkForm();
      loadData();
    } catch (error) {
      console.error('Error saving footer link:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleSaveSocial = async () => {
    try {
      const socialData = {
        platform: socialForm.platform,
        url: socialForm.url,
        active: socialForm.is_active
      };
      
      if (editingSocial?.id) {
        await updateSocialMedia(editingSocial.id, socialData);
      } else {
        await saveSocialMedia(socialData);
      }
      toast({
        title: "Éxito",
        description: `Red social ${editingSocial ? 'actualizada' : 'creada'} correctamente`,
      });
      setIsSocialDialogOpen(false);
      resetSocialForm();
      loadData();
    } catch (error) {
      console.error('Error saving social media:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la red social",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteFooterLink(id);
      toast({
        title: "Éxito",
        description: "Enlace eliminado correctamente",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting footer link:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSocial = async (id: string) => {
    try {
      await deleteSocialMedia(id);
      toast({
        title: "Éxito",
        description: "Red social eliminada correctamente",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting social media:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la red social",
        variant: "destructive",
      });
    }
  };

  const resetLinkForm = () => {
    setLinkForm({
      title: '',
      url: '',
      category: '',
      is_active: true,
      sort_order: 0
    });
    setEditingLink(null);
  };

  const resetSocialForm = () => {
    setSocialForm({
      platform: '',
      url: '',
      is_active: true,
      sort_order: 0
    });
    setEditingSocial(null);
  };

  const openEditLink = (link: FooterLink) => {
    setEditingLink(link);
    setLinkForm({
      title: link.title,
      url: link.url,
      category: link.category,
      is_active: link.active,
      sort_order: link.sort_order
    });
    setIsLinkDialogOpen(true);
  };

  const openEditSocial = (social: SocialMedia) => {
    setEditingSocial(social);
    setSocialForm({
      platform: social.platform,
      url: social.url,
      is_active: social.active,
      sort_order: 0 // 'sort_order' does not exist in SocialMedia, default to 0 or remove if not needed
    });
    setIsSocialDialogOpen(true);
  };

  const openNewLink = () => {
    resetLinkForm();
    setIsLinkDialogOpen(true);
  };

  const openNewSocial = () => {
    resetSocialForm();
    setIsSocialDialogOpen(true);
  };

  const groupedLinks = footerLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando configuración del footer...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión del Footer</h1>
          <p className="text-muted-foreground">
            Configura la información y enlaces del pie de página
          </p>
        </div>
      </div>

      {/* Configuración General */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Información general que aparecerá en el footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción de la empresa</Label>
              <Textarea
                id="description"
                placeholder="Descripción breve de tu empresa..."
                value={settingsForm.description}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copyright">Texto de copyright</Label>
              <Input
                id="copyright"
                placeholder="© 2024 StyleHub. Todos los derechos reservados."
                value={settingsForm.copyright_text}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, copyright_text: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email de contacto</Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@stylehub.com"
                value={settingsForm.contact_email}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono de contacto</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 8900"
                value={settingsForm.contact_phone}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, contact_phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="123 Calle Principal, Ciudad"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="newsletter"
                checked={settingsForm.show_newsletter_signup}
                onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, show_newsletter_signup: checked }))}
              />
              <Label htmlFor="newsletter">Mostrar suscripción al newsletter</Label>
            </div>
            {settingsForm.show_newsletter_signup && (
              <div className="space-y-2">
                <Label htmlFor="newsletter-text">Texto del newsletter</Label>
                <Input
                  id="newsletter-text"
                  placeholder="Suscríbete para recibir ofertas especiales"
                  value={settingsForm.newsletter_text}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, newsletter_text: e.target.value }))}
                />
              </div>
            )}
          </div>
          <Button onClick={handleSaveSettings}>
            Guardar Configuración
          </Button>
        </CardContent>
      </Card>

      {/* Enlaces del Footer */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Enlaces del Footer</CardTitle>
              <CardDescription>
                Gestiona los enlaces organizados por categorías
              </CardDescription>
            </div>
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewLink}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar Enlace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLink ? 'Editar Enlace' : 'Nuevo Enlace'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLink ? 'Modifica' : 'Agrega'} un enlace del footer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link-title">Título</Label>
                    <Input
                      id="link-title"
                      placeholder="Título del enlace"
                      value={linkForm.title}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-url">URL</Label>
                    <Input
                      id="link-url"
                      placeholder="https://ejemplo.com"
                      value={linkForm.url}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-category">Categoría</Label>
                    <Select value={linkForm.category} onValueChange={(value) => setLinkForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-order">Orden</Label>
                    <Input
                      id="link-order"
                      type="number"
                      value={linkForm.sort_order}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="link-active"
                      checked={linkForm.is_active}
                      onCheckedChange={(checked) => setLinkForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="link-active">Activo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveLink}>
                    {editingLink ? 'Actualizar' : 'Crear'} Enlace
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedLinks).map(([category, links]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-lg">{category}</h3>
                <div className="space-y-2">
                  {links
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <ExternalLinkIcon className="h-4 w-4" />
                          <span className="text-sm">{link.title}</span>
                          {!link.active && <Badge variant="secondary">Inactivo</Badge>}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditLink(link)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => link.id && handleDeleteLink(link.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociales */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>
                Configura los enlaces a las redes sociales
              </CardDescription>
            </div>
            <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewSocial}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar Red Social
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSocial ? 'Editar Red Social' : 'Nueva Red Social'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSocial ? 'Modifica' : 'Agrega'} una red social
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="social-platform">Plataforma</Label>
                    <Select value={socialForm.platform} onValueChange={(value) => setSocialForm(prev => ({ ...prev, platform: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social-url">URL</Label>
                    <Input
                      id="social-url"
                      placeholder="https://facebook.com/tu-pagina"
                      value={socialForm.url}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social-order">Orden</Label>
                    <Input
                      id="social-order"
                      type="number"
                      value={socialForm.sort_order}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="social-active"
                      checked={socialForm.is_active}
                      onCheckedChange={(checked) => setSocialForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="social-active">Activo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSocialDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveSocial}>
                    {editingSocial ? 'Actualizar' : 'Crear'} Red Social
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialMedia
              .sort((a, b) => a.platform.localeCompare(b.platform))
              .map((social) => {
                const platform = SOCIAL_MEDIA_PLATFORMS.find(p => p.value === social.platform);
                const IconComponent = platform?.icon;

                return (
                  <div key={social.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {IconComponent && <IconComponent className="h-5 w-5" />}
                      <div>
                        <div className="font-medium">{platform?.label}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {social.url}
                        </div>
                      </div>
                      {!social.active && <Badge variant="secondary">Inactivo</Badge>}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditSocial(social)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => social.id && handleDeleteSocial(social.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
