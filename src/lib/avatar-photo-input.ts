import { supabase } from '@/integrations/supabase/client';

/** Send image bytes, not a URL that the image provider may be unable to fetch. */
export async function avatarPhotoInput(photo: string): Promise<string> {
  if (photo.startsWith('data:image/')) return photo;

  let source = photo;
  if (!/^(https?:|blob:)/i.test(source)) {
    const { data, error } = await supabase.storage
      .from('child-photos')
      .createSignedUrl(source, 300);
    if (error || !data?.signedUrl) {
      throw new Error('לא הצלחנו לטעון את התמונה. נסו להעלות אותה מחדש.');
    }
    source = data.signedUrl;
  }

  const response = await fetch(source, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error('לא הצלחנו לטעון את התמונה. נסו להעלות אותה מחדש.');
  }
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('התמונה אינה בפורמט נתמך. נסו להעלות תמונה אחרת.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('לא הצלחנו לקרוא את התמונה. נסו שוב.'));
    };
    reader.onerror = () => reject(new Error('לא הצלחנו לקרוא את התמונה. נסו שוב.'));
    reader.readAsDataURL(blob);
  });
}