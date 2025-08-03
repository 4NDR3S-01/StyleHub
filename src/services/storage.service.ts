import supabase from '@/lib/supabaseClient';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

export class StorageService {
  /**
   * Subir imagen de producto
   */
  static async uploadProductImage(file: File, productId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${productId}_${timestamp}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen');
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande (máximo 5MB)');
      }

      // Subir archivo
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir imagen');
    }
  }

  /**
   * Subir múltiples imágenes de producto
   */
  static async uploadProductImages(files: FileList, productId: string): Promise<UploadResult[]> {
    try {
      const results: UploadResult[] = [];
      
      for (const file of Array.from(files)) {
        const result = await this.uploadProductImage(file, productId);
        results.push(result);
      }

      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir imágenes');
    }
  }

  /**
   * Eliminar imagen de producto
   */
  static async deleteProductImage(imagePath: string) {
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove([imagePath]);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar imagen');
    }
  }

  /**
   * Subir imagen de categoría
   */
  static async uploadCategoryImage(file: File, categoryId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${categoryId}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      // Validaciones
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande (máximo 2MB)');
      }

      // Subir archivo (reemplazar si existe)
      const { error } = await supabase.storage
        .from('category-images')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir imagen de categoría');
    }
  }

  /**
   * Subir avatar de usuario
   */
  static async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;

      // Validaciones
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen');
      }

      if (file.size > 1 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande (máximo 1MB)');
      }

      // Subir archivo (reemplazar si existe)
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir avatar');
    }
  }

  /**
   * Optimizar imagen antes de subir
   */
  static async optimizeImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspecto
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al optimizar imagen'));
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generar miniaturas de imagen
   */
  static async generateThumbnail(file: File, size: number = 200): Promise<Blob> {
    return this.optimizeImage(file, size, 0.7);
  }

  /**
   * Obtener información de archivo de storage
   */
  static async getFileInfo(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener información del archivo');
    }
  }

  /**
   * Crear bucket si no existe
   */
  static async createBucket(bucketName: string, isPublic: boolean = true) {
    try {
      const { data, error } = await supabase.storage
        .createBucket(bucketName, { public: isPublic });

      if (error && !error.message.includes('already exists')) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear bucket');
    }
  }

  /**
   * Limpiar archivos temporales o no utilizados
   */
  static async cleanupUnusedFiles(bucket: string, usedPaths: string[]) {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list();

      if (error) throw error;

      const filesToDelete = files
        ?.filter(file => !usedPaths.includes(file.name))
        .map(file => file.name) || [];

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(filesToDelete);

        if (deleteError) throw deleteError;
      }

      return filesToDelete;
    } catch (error: any) {
      throw new Error(error.message || 'Error al limpiar archivos');
    }
  }

  /**
   * Validar formato de imagen
   */
  static validateImageFormat(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  /**
   * Obtener URL pública de un archivo
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  }

  /**
   * Crear URL firmada para acceso temporal
   */
  static async createSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear URL firmada');
    }
  }
}

export default StorageService;
