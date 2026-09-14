(function(w){
  async function downloadFileSupabase(url, namaFile) {
    if (!url) {
      alert("URL file tidak ditemukan!");
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlParts = url.split('?')[0].split('.');
      const ekstensi = urlParts.length > 1 ? `.${urlParts.pop()}` : '.pdf';
      const finalNamaFile = (namaFile.includes('.')) ? namaFile : (namaFile + ekstensi);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalNamaFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Gagal mendownload file, mengalihkan ke tab baru:", error);
      window.open(url, '_blank');
    }
  }

  w.downloadFileSupabase = downloadFileSupabase;

  w.hapusArsipDokumen = async function(arsipId, filePath) {
    if (!confirm("Yakin ingin menghapus dokumen ini dari arsip secara permanen?")) return;
    const storage = w.kazkaStorage;
    const dbApi = w.kazkaDb;
    if (filePath && storage && storage.deleteFromSupabase) await storage.deleteFromSupabase(filePath);
    try {
      if (dbApi) await dbApi.remove(dbApi.ref(dbApi.db, `arsip/${arsipId}`));
    } catch (err) { console.error(err); }
  };
})(window);
