    window.bukaModalSesi = function(id) {
      const siswa = window.dataSiswa.find(s => s.id === id);
      if(!siswa) return;

      document.getElementById('editSesiId').value = id;
      document.getElementById('modalSesiTitle').innerText = `Catat Sesi & Laporan: ${siswa.anak}`;
      
      const slotInputs = document.getElementById('slotInputs');
      slotInputs.innerHTML = '';

      for(let i = 1; i <= siswa.paket; i++) {
        const detail = (siswa.sesiList && siswa.sesiList[i]) || {};
        slotInputs.innerHTML += `
          <div class="bg-slate-100 dark:bg-[#0f172a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span class="font-extrabold text-slate-900 dark:text-white text-xs">Sesi ${i}</span>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tanggal</label>
              <input type="date" id="tgl_sesi_${i}" value="${detail.tanggal || ''}" class="w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-amber-500">
            </div>
            <div>
              <label class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Materi</label>
              <input type="text" id="mat_sesi_${i}" value="${detail.materi || ''}" placeholder="Materi hari ini..." class="w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-amber-500">
            </div>
          </div>
        `;
      }

      const previewDiv = document.getElementById('laporanPreview');
      if (siswa.laporanUrl) {
        previewDiv.innerHTML = `<a href="${siswa.laporanUrl}" target="_blank" class="text-amber-600 dark:text-amber-400 text-xs underline font-medium">File Laporan Saat Ini Terpasang</a>`;
      } else {
        previewDiv.innerHTML = `<span class="text-slate-400 text-xs">Belum ada file laporan.</span>`;
      }

      document.getElementById('fileLaporanInput').value = '';
      document.getElementById('modalSesi').classList.remove('hidden');
    };

    window.simpanSesi = async function() {
      const id = document.getElementById('editSesiId').value;
      const siswa = window.dataSiswa.find(s => s.id === id);
      if(!siswa) return;

      let sesiList = {};
      let terisiCount = 0;

      for(let i = 1; i <= siswa.paket; i++) {
        const tgl = document.getElementById(`tgl_sesi_${i}`).value;
        const mat = document.getElementById(`mat_sesi_${i}`).value.trim();
        const isTerisi = (tgl !== '' || mat !== '');
        if (isTerisi) terisiCount++;

        sesiList[i] = { tanggal: tgl, materi: mat, terisi: isTerisi };
      }

      const fileInput = document.getElementById('fileLaporanInput');
      let updateData = { sesiList, terisi: terisiCount };

      if (fileInput.files.length > 0) {
        const uploaded = await window.kazkaStorage.uploadToSupabase(fileInput.files[0], 'laporan_anak');
        if (uploaded) {
          updateData.laporanUrl = uploaded.url;
          updateData.laporanFilePath = uploaded.path;
          updateData.laporanTanggalUpload = uploaded.tanggalUpload;

          await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db, 'arsip'), {
            siswaId: siswa.id, anak: siswa.anak, guru: siswa.guru || 'Pengajar', kegiatan: siswa.kegiatan,
            jenis: 'laporan', fileUrl: uploaded.url, filePath: uploaded.path, tanggalUpload: uploaded.tanggalUpload
          });
        }
      }

      const sisaBaru = siswa.paket - terisiCount;
      const urlBaruDiupload = updateData.laporanUrl || siswa.laporanUrl || null;

      if (sisaBaru <= 0 && !siswa.sudahMasukRekap) {
        const calc = hitungFeeDanTransport(siswa);
        const totalHakGuru = (calc.fee + calc.transport) * siswa.paket;
        const skemaText = siswa.tipeHarga === 'lama' ? `Harga Lama (${siswa.wilayah})` : `Harga Baru`;
        const tanggalPertemuanTerakhir = (sesiList[siswa.paket] && sesiList[siswa.paket].tanggal) ? sesiList[siswa.paket].tanggal : new Date().toISOString().slice(0, 10);

        const riwayatOtomatis = {
          siswaId: siswa.id, anak: siswa.anak, skemaText, kegiatan: siswa.kegiatan,
          guru: siswa.guru || '-', paket: siswa.paket, feePerSesi: calc.fee,
          transportPerSesi: calc.transport, totalHakGuru, laporanUrl: urlBaruDiupload, tanggalSelesai: tanggalPertemuanTerakhir
        };

        await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db, 'rekap_fee'), riwayatOtomatis);
        updateData.sudahMasukRekap = true;
      } 
      
      if (siswa.sudahMasukRekap || sisaBaru <= 0) {
        const targetRekap = window.dataRekapFee.find(r => r.siswaId === siswa.id);
        if (targetRekap) {
          const calc = hitungFeeDanTransport(siswa);
          const totalHakGuru = (calc.fee + calc.transport) * siswa.paket;
          await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db, `rekap_fee/${targetRekap.id}`), { 
            laporanUrl: urlBaruDiupload,
            transportPerSesi: calc.transport,
            feePerSesi: calc.fee,
            totalHakGuru: totalHakGuru
          });
        }
      }

      try {
        await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db, `siswa/${id}`), updateData);
        if (typeof window.tutupModalSesi === 'function') window.tutupModalSesi();
      } catch (err) { console.log(err); }
    };

;

