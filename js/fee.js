(function(w){
  w.eksporKeSpreadsheet = function() {
    const rekapHistori = w.dataRekapFee || [];
    if (rekapHistori.length === 0) {
      alert("Belum ada data rekap fee untuk diekspor ke Excel.");
      return;
    }
    const dataSiapCair = rekapHistori.filter(r => r.laporanUrl);
    if (dataSiapCair.length === 0) {
      alert("Tidak ada data dengan status 'Siap dicairkan' (laporan belum diunggah).");
      return;
    }
    const excelData = dataSiapCair.map(r => ({
      "Nama Anak": r.anak,
      "Skema": r.skemaText,
      "Kegiatan": r.kegiatan,
      "Guru Pengajar": r.guru,
      "Total Sesi": r.paket,
      "Fee Per Sesi": r.feePerSesi,
      "Transport Per Sesi": r.transportPerSesi,
      "Total Hak Guru": r.totalHakGuru,
      "Laporan Perkembangan": "Sudah Upload",
      "Status Pencairan": "Siap dicairkan",
      "Tanggal Pertemuan Terakhir": r.tanggalSelesai || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Fee Siap Cair");
    XLSX.writeFile(workbook, `Rekap_Fee_Siap_Cair_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  w.hapusRekapFee = async function(id) {
    if (!confirm("Yakin ingin menghapus data rekap fee ini secara permanen?")) return;
    try {
      const dbApi = w.kazkaDb;
      if (dbApi) await dbApi.remove(dbApi.ref(dbApi.db, `rekap_fee/${id}`));
    } catch (err) { console.error(err); }
  };
})(window);
