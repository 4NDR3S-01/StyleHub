import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // clave secreta
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { productData, base64Image, fileName } = req.body;

    // Subir imagen
    let imageUrl = null;
    if (base64Image && fileName) {
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('productos')
        .upload(`products/${fileName}`, Buffer.from(base64Image, 'base64'), {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabaseAdmin
        .storage
        .from('productos')
        .getPublicUrl(`products/${fileName}`);

      imageUrl = publicUrl.publicUrl;
    }

    // Insertar producto
    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert([{ ...productData, images: imageUrl ? [imageUrl] : null }]);

    if (error) throw error;

    return res.status(200).json({ message: 'Producto creado', data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
