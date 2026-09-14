/* Kazka Edu — Stage 4.6: Data Anak form helpers only. */
(function (w) {
  w.toggleWilayahOpsi = function () {
    const tipe = document.getElementById('newTipeHarga').value;
    const c = document.getElementById('containerWilayah');
    if (!c) return;
    if (tipe === 'lama') c.classList.remove('hidden');
    else c.classList.add('hidden');
  };

  w.toggleManualFeeOpsi = function () {
    const kegiatan = document.getElementById('newKegiatanAnak').value;
    const containerFee = document.getElementById('containerManualFee');
    if (!containerFee) return;
    if (kegiatan.includes('Mapel SD') || kegiatan.includes('Mapel SMP')) containerFee.classList.remove('hidden');
    else containerFee.classList.add('hidden');
  };
})(window);

/* Stage 4.10 — Data Anak form + CRUD module. */
    window.resetFormAnakModal = function() {
      document.getElementById('editIdAnak').value = '';
      document.getElementById('modalAnakTitle').innerText = 'Tambah Data Anak';
      document.getElementById('btnSimpanAnak').innerText = '➕ Simpan Ke Cloud';
      document.getElementById('newNamaAnak').value = '';
      document.getElementById('newTipeHarga').value = 'baru';
      document.getElementById('newWilayah').value = 'Cimahi';
      document.getElementById('newKegiatanAnak').value = 'Calistung';
      document.getElementById('newGuruAnak').value = '';
      document.getElementById('newJarak').value = 'kurang_7';
      document.getElementById('newPaketAnak').value = '4';
      document.getElementById('inputManualFeeValue').value = '';
      document.getElementById('newJamMulaiAnak').value = '16:00';
      document.getElementById('newJamSelesaiAnak').value = '17:30';
      document.querySelectorAll('input[name="jadwalHariAnak"]').forEach(x => x.checked = false);
      document.getElementById('fileAnakInput').value = '';
    }

    window.bukaModalTambahAnakDirect = function() {
      resetFormAnakModal();
      document.getElementById('modalAnak').classList.remove('hidden');
      toggleWilayahOpsi();
      toggleManualFeeOpsi();
    }

    window.bukaModalEditAnak = function(id) {
      const s = window.dataSiswa.find(x => x.id === id);
      if (!s) return;

      document.getElementById('editIdAnak').value = id;
      document.getElementById('modalAnakTitle').innerText = 'Edit Data Anak';
      document.getElementById('btnSimpanAnak').innerText = '💾 Simpan Perubahan';
      document.getElementById('newNamaAnak').value = s.anak || '';
      document.getElementById('newTipeHarga').value = s.tipeHarga || 'baru';
      document.getElementById('newWilayah').value = s.wilayah || 'Cimahi';
      document.getElementById('newKegiatanAnak').value = s.kegiatan || 'Calistung';
      // Dropdown guru menggunakan NAMA sebagai value (bukan ID).
      // Saat edit, prioritaskan guruId jika cocok, lalu fallback ke nama guru lama.
      const guruSelect = document.getElementById('newGuruAnak');
      let guruValue = s.guru || '';
      const guruMatch = (window.dataGuru || []).find(g =>
        (s.guruId && String(g.id) === String(s.guruId)) ||
        String(g.nama || g.guru || '') === String(s.guru || '')
      );
      if (guruMatch) guruValue = guruMatch.nama || guruMatch.guru || '';
      guruSelect.value = guruValue;
      if (guruValue && guruSelect.value !== guruValue) guruSelect.value = s.guru || '';
      document.getElementById('newJarak').value = s.jarak || 'kurang_7';
      document.getElementById('newPaketAnak').value = s.paket || 4;
      document.getElementById('inputManualFeeValue').value = s.manualFee || '';

      const aturan = Array.isArray(s.jadwalMingguan) ? s.jadwalMingguan : [];
      const hari = [...new Set(aturan.map(x => Number(x.hari)).filter(x => !Number.isNaN(x)))];
      document.querySelectorAll('input[name="jadwalHariAnak"]').forEach(x => x.checked = hari.includes(Number(x.value)));
      document.getElementById('newJamMulaiAnak').value = aturan[0]?.jamMulai || '16:00';
      document.getElementById('newJamSelesaiAnak').value = aturan[0]?.jamSelesai || '17:30';
      document.getElementById('fileAnakInput').value = '';

      document.getElementById('modalAnak').classList.remove('hidden');
      toggleWilayahOpsi();
      toggleManualFeeOpsi();
    }
    window.tutupModalAnak = function() { document.getElementById('modalAnak').classList.add('hidden'); }

    window.hitungFeeDanTransport = function(s) {
      let fee = 0;
      let transport = 0;

      const tipe = s.tipeHarga || 'baru';
      const wilayah = s.wilayah || 'Cimahi';
      const kegiatan = s.kegiatan || 'Calistung';
      const jarak = s.jarak || 'kurang_7';

      if (kegiatan.includes('Mapel SD') || kegiatan.includes('Mapel SMP')) {
        fee = Number(s.manualFee) || 0;
      } else {
        if (tipe === 'lama') {
          if (kegiatan === 'English Phonic') {
            fee = (wilayah === 'Bandung') ? 75000 : 55000;
          } else if (kegiatan.includes('English')) {
            fee = (wilayah === 'Bandung') ? 60000 : 50000;
          } else {
            fee = (wilayah === 'Bandung') ? 50000 : 40000;
          }
        } else {
          if (kegiatan === 'English Phonic' || kegiatan.includes('English')) {
            fee = 80000;
          } else {
            fee = 60000;
          }
        }
      }

      if (tipe === 'lama') {
        if (jarak === '7_10' || jarak === 'lebih_10') {
          transport = 15000;
        } else {
          transport = 0;
        }
      } else {
        if (jarak === '7_10') {
          transport = 15000;
        } else if (jarak === 'lebih_10') {
          transport = 20000;
        } else {
          transport = 0;
        }
      }

      return { fee, transport };
    }

    window.simpanAnakBaru = async function() {
      const editId = document.getElementById('editIdAnak').value;
      const anak = document.getElementById('newNamaAnak').value.trim();
      const tipeHarga = document.getElementById('newTipeHarga').value;
      const wilayah = document.getElementById('newWilayah').value;
      const kegiatan = document.getElementById('newKegiatanAnak').value;
      const guruValue = document.getElementById('newGuruAnak').value;
      // Kompatibel dengan data lama maupun data baru: dropdown saat ini menyimpan nama guru.
      const guruObj = (window.dataGuru || []).find(g =>
        String(g.id) === String(guruValue) || String(g.nama || g.guru || '') === String(guruValue)
      );
      const guruId = guruObj ? guruObj.id : '';
      const guru = guruObj ? (guruObj.nama || guruObj.guru || '') : (guruValue || '');
      const jarak = document.getElementById('newJarak').value;
      const hariMingguan = Array.from(document.querySelectorAll('input[name="jadwalHariAnak"]:checked')).map(x => Number(x.value));
      const jamMulaiMingguan = document.getElementById('newJamMulaiAnak').value || '16:00';
      const jamSelesaiMingguan = document.getElementById('newJamSelesaiAnak').value || '17:30';
      if (jamSelesaiMingguan <= jamMulaiMingguan) { alert('Jam selesai jadwal mingguan harus lebih besar dari jam mulai.'); return; }
      const paket = parseInt(document.getElementById('newPaketAnak').value) || 4;
      const manualFee = parseFloat(document.getElementById('inputManualFeeValue').value) || 0;
      const fileInput = document.getElementById('fileAnakInput');

      if (!anak) { alert('Nama anak wajib diisi!'); return; }
      if (hariMingguan.length > 0 && !guruId) { alert('Pilih Guru Pengajar jika jadwal mingguan diatur.'); return; }

      const jadwalMingguan = hariMingguan.map(hari => ({ hari, jamMulai: jamMulaiMingguan, jamSelesai: jamSelesaiMingguan }));

      // Cek bentrok jadwal mingguan dengan anak lain yang memakai guru yang sama.
      if (guruId && jadwalMingguan.length) {
        const konflik = (window.dataSiswa || []).find(other => {
          if (other.id === editId || String(other.guruId || '') !== String(guruId)) return false;
          const aturanLain = normalizeJadwalMingguan(other.jadwalMingguan);
          return jadwalMingguan.some(a => aturanLain.some(b => Number(a.hari) === Number(b.hari) && a.jamMulai < b.jamSelesai && a.jamSelesai > b.jamMulai));
        });
        if (konflik && !confirm(`Jadwal guru bentrok dengan ${konflik.anak}. Tetap simpan jadwal ini?`)) return;
      }

      let uploadedFile = null;
      if (fileInput.files.length > 0) {
        uploadedFile = await window.kazkaStorage.uploadToSupabase(fileInput.files[0], 'dokumen_anak');
      }

      try {
        if (editId) {
          const siswaLama = window.dataSiswa.find(x => x.id === editId) || {};
          const updateData = { anak, tipeHarga, wilayah, kegiatan, guru, guruId, jarak, paket, manualFee, jadwalMingguan };
          if (uploadedFile) {
            updateData.fileUrl = uploadedFile.url;
            updateData.filePath = uploadedFile.path;
            updateData.tanggalUpload = uploadedFile.tanggalUpload;
            await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db, 'arsip'), { anak, guru: 'Admin', kegiatan, jenis: 'pendaftaran', fileUrl: uploadedFile.url, filePath: uploadedFile.path, tanggalUpload: uploadedFile.tanggalUpload });
          }
          await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db, `siswa/${editId}`), updateData);
        } else {
          const dataBaru = {
            anak, tipeHarga, wilayah, kegiatan, guru, guruId, jarak, paket, manualFee,
            jadwalMingguan,
            terisi: 0,
            fileUrl: uploadedFile ? uploadedFile.url : null,
            filePath: uploadedFile ? uploadedFile.path : null,
            tanggalUpload: uploadedFile ? uploadedFile.tanggalUpload : null,
            sesiList: {},
            sudahMasukRekap: false
          };
          await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db, 'siswa'), dataBaru);
          if (uploadedFile) {
            await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db, 'arsip'), { anak, guru: 'Admin', kegiatan, jenis: 'pendaftaran', fileUrl: uploadedFile.url, filePath: uploadedFile.path, tanggalUpload: uploadedFile.tanggalUpload });
          }
        }

        resetFormAnakModal();
        tutupModalAnak();
      } catch (err) { console.error(err); alert('Gagal menyimpan data anak. Silakan coba lagi.'); }
    }
    window.hapusAnak = async function(id) {
      if(confirm("Yakin ingin menghapus data anak ini? (File dokumen di Arsip akan tetap aman dan tersimpan)")) {
        await window.kazkaDb.remove(window.kazkaDb.ref(window.kazkaDb.db, `siswa/${id}`));
      }
    }
