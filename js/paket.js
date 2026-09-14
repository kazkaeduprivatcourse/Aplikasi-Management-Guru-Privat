// Stage 4.5 Fixed — Paket & Perpanjangan
// Menggunakan runtime Firebase yang sudah ada; tidak mengubah struktur data.
window.perpanjangPaket = async function(id) {
  const siswa = window.dataSiswa.find(s => s.id === id);
  if (!siswa) return;

  if (confirm(`Perpanjang paket untuk ${siswa.anak}? Sesi akan direset untuk paket baru.`)) {
    try {
      const runtime = window.kazkaDb;
      if (!runtime) throw new Error('Firebase runtime belum siap.');
      await runtime.update(runtime.ref(runtime.db, `siswa/${id}`), {
        terisi: 0,
        sesiList: {},
        laporanUrl: null,
        laporanFilePath: null,
        laporanTanggalUpload: null,
        sudahMasukRekap: false
      });
    } catch (err) {
      console.error('Gagal memperpanjang paket:', err);
      alert('Gagal mereset sesi. Silakan coba lagi.');
    }
  }
};
