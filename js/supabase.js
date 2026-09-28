// Kazka Edu — Supabase Storage connection layer
// Stage 3: connection/config only; upload/delete behavior is preserved.

const SUPABASE_URL = 'https://asuxuopnlouervbyvcfg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PcIWQhTNjmbWS2px8RyycA_Dd_2xCyC';
const BUCKET_NAME = 'kazkaedu';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  console.error('Supabase library belum termuat. Pastikan CDN supabase-js tetap ada di index.html.');
} else {
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = supabaseClient;
  window.BUCKET_NAME = BUCKET_NAME;

  async function uploadToSupabase(file, prefix = 'file') {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);

    if (error) {
      console.error("Gagal Upload ke Supabase Storage:", error);
      alert("Upload file gagal! Error: " + error.message);
      return null;
    }

    return {
      url: supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fileName).data.publicUrl,
      path: fileName,
      tanggalUpload: new Date().toISOString().slice(0, 10)
    };
  }

  async function deleteFromSupabase(filePath) {
    if (!filePath) return true;
    const { error } = await supabaseClient.storage.from(BUCKET_NAME).remove([filePath]);
    if (error) {
      console.error("Gagal menghapus file di Supabase:", error.message);
      return false;
    }
    return true;
  }

  // Kompatibilitas dengan modul aplikasi yang memakai namespace kazkaStorage.
  window.kazkaStorage = { uploadToSupabase, deleteFromSupabase };
  window.uploadToSupabase = uploadToSupabase;
  window.deleteFromSupabase = deleteFromSupabase;
}
