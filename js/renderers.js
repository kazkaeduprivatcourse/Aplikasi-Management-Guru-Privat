/* Kazka Edu — Stage 4.9: operational renderers.
 * UI/data presentation only. Firebase/Supabase access remains in index.html runtime.
 */
(function (w) {

  w.renderRingkasan = function renderRingkasan() {
        const uniqueNames = new Set(window.dataSiswa.map(s => (s.anak || '').trim().toLowerCase()));
        let totalAnakUnik = uniqueNames.size;
        let totalPaketBerjalan = window.dataSiswa.length; 
        let totalTerisi = 0;
        let perluPerhatian = 0;
  
        const tbody = document.getElementById('ringkasanTable');
        if(!tbody) return;
        tbody.innerHTML = '';
  
        window.dataSiswa.forEach(s => {
          const terisi = s.terisi || 0;
          const sisa = s.paket - terisi;
          totalTerisi += terisi;
  
          if (sisa <= 1) perluPerhatian++;
  
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="py-3 font-bold text-slate-900 dark:text-white">${s.anak}</td>
              <td class="py-3 text-slate-600 dark:text-slate-300">${s.guru || '-'}</td>
              <td class="py-3 text-slate-500 dark:text-slate-400">${s.kegiatan}</td>
              <td class="py-3 font-bold ${sisa <= 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}">${sisa} / ${s.paket}</td>
              <td class="py-3">${getStatusBadge(sisa)}</td>
            </tr>
          `;
        });
  
        document.getElementById('statTotalAnak').innerText = totalAnakUnik;
        document.getElementById('statTotalAlokasi').innerText = totalPaketBerjalan;
        document.getElementById('statTotalSisa').innerText = (window.dataSiswa.reduce((acc, curr) => acc + curr.paket, 0) - totalTerisi);
        document.getElementById('statPerluPerhatian').innerText = perluPerhatian;
      }

  w.renderTabelAnak = function renderTabelAnak() {
        const tbody = document.getElementById('tabelAnakBody');
        if(!tbody) return;
        tbody.innerHTML = '';
  
        window.dataSiswa.forEach(s => {
          const calc = hitungFeeDanTransport(s);
          const sisa = s.paket - (s.terisi || 0);
          const skemaLabel = s.tipeHarga === 'lama' ? `Lama (${s.wilayah})` : 'Baru';
  
          let fileLink = '-';
          if (s.fileUrl) {
            const namaFileDownload = `Form_Pendaftaran_${s.anak}.pdf`;
            fileLink = `
              <div class="flex items-center gap-1.5">
                <a href="${s.fileUrl}" target="_blank" class="text-amber-600 dark:text-amber-400 underline font-semibold">Lihat</a>
                <button onclick="downloadFileSupabase('${s.fileUrl}', '${namaFileDownload}')" class="bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-500 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-all">⬇️ Download</button>
              </div>`;
          }
  
          let tombolPerpanjanganAdmin = '';
          if (sisa <= 0) {
            tombolPerpanjanganAdmin = `
              <button onclick="perpanjangPaket('${s.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow flex items-center justify-center gap-1 transition-all">
                🔄 Perpanjang
              </button>
            `;
          }
  
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="py-3.5 font-bold text-slate-900 dark:text-white">${s.anak}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${skemaLabel}</td>
              <td class="py-3.5 text-slate-500 dark:text-slate-400">${s.kegiatan}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${s.guru || '-'}</td>
              <td class="py-3.5 text-slate-500 dark:text-slate-400">${formatJadwalMingguanSiswa(s)}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${formatRupiah(calc.fee)}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${formatRupiah(calc.transport)}</td>
              <td class="py-3.5 font-bold ${sisa <= 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}">${sisa} / ${s.paket}</td>
              <td class="py-3.5">${fileLink}</td>
              <td class="py-3.5 text-center flex items-center justify-center gap-1.5">
                ${tombolPerpanjanganAdmin}
                <button onclick="bukaModalEditAnak('${s.id}')" class="bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white px-2.5 py-1 rounded-lg font-semibold transition-all">Edit</button>
                <button onclick="hapusAnak('${s.id}')" class="bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white px-2.5 py-1 rounded-lg font-semibold transition-all">Hapus</button>
              </td>
            </tr>
          `;
        });
      }

  w.renderPertemuanPerGuru = function renderPertemuanPerGuru() {
        const container = document.getElementById('containerPertemuanPerGuru');
        if(!container) return;
        container.innerHTML = '';
  
        if (window.dataGuru.length === 0 && window.dataSiswa.length === 0) {
          container.innerHTML = `<div class="bg-white dark:bg-[#1e293b] p-5 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">Belum ada data guru atau anak terdaftar.</div>`;
          return;
        }
  
        const daftarNamaGuru = new Set();
        window.dataGuru.forEach(g => daftarNamaGuru.add(g.nama));
        window.dataSiswa.forEach(s => {
          if (s.guru && s.guru !== 'Belum diatur') daftarNamaGuru.add(s.guru);
        });
  
        if (daftarNamaGuru.size === 0) {
          container.innerHTML = `<div class="bg-white dark:bg-[#1e293b] p-5 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">Belum ada guru yang terdaftar atau ditugaskan.</div>`;
          return;
        }
  
        let indexGuru = 0;
        daftarNamaGuru.forEach(namaGuru => {
          indexGuru++;
          const guruIdKey = `guru_acc_${indexGuru}`;
          const dataObjGuru = window.dataGuru.find(g => g.nama === namaGuru);
          const siswaDihandle = window.dataSiswa.filter(s => s.guru === namaGuru);
          let cardSiswaHtml = '';
  
          let fotoHeaderHtml = (dataObjGuru && dataObjGuru.fotoUrl) ? 
            `<img src="${dataObjGuru.fotoUrl}" alt="${namaGuru}" class="w-10 h-10 rounded-xl object-cover border border-amber-500/30 flex-shrink-0 shadow-inner">` :
            `<div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-base shadow-inner flex-shrink-0">👨‍🏫</div>`;
  
          if (siswaDihandle.length === 0) {
            cardSiswaHtml = `<div class="text-xs text-slate-500 dark:text-slate-400 italic p-3 text-center">Belum ada anak didik yang ditugaskan ke guru ini.</div>`;
          } else {
            siswaDihandle.forEach(s => {
              const terisi = s.terisi || 0;
              let sesiBoxes = '';
              for (let i = 1; i <= s.paket; i++) {
                const detailSesi = (s.sesiList && s.sesiList[i]) || {};
                const tgl = detailSesi.tanggal || '-';
                const mat = detailSesi.materi || '-';
                const isTerisi = detailSesi.terisi;
  
                sesiBoxes += `
                  <div class="bg-slate-50 dark:bg-[#0f172a] border ${isTerisi ? 'border-emerald-500/40' : 'border-slate-200 dark:border-slate-800'} p-3 rounded-xl space-y-1">
                    <div class="flex justify-between items-center">
                      <span class="text-[11px] font-bold ${isTerisi ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}">Sesi ${i}</span>
                      <span class="text-[10px] text-slate-400">${tgl}</span>
                    </div>
                    <p class="text-[11px] text-slate-700 dark:text-slate-300 truncate font-medium">Materi: ${mat}</p>
                  </div>
                `;
              }
  
              const namaFileLaporan = `Laporan Privat ${s.kegiatan} ${s.anak} dengan ${namaGuru}.pdf`;
              let lapLink = s.laporanUrl ? 
                `<div class="flex items-center gap-1.5 flex-wrap">
                   <a href="${s.laporanUrl}" target="_blank" class="text-amber-600 dark:text-amber-400 font-bold underline text-xs">Sudah Upload</a>
                   <button onclick="downloadFileSupabase('${s.laporanUrl}', '${namaFileLaporan}')" class="bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-500 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-all">⬇️ Download File</button>
                 </div>` : 
                `<span class="text-red-500 dark:text-red-400 font-medium text-xs">Belum Upload</span>`;
  
              cardSiswaHtml += `
                <div class="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h4 class="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">👤 ${s.anak} <span class="text-xs text-amber-600 dark:text-amber-400 font-normal">(${s.kegiatan})</span></h4>
                    </div>
                    <div>
                      <button onclick="bukaModalSesi('${s.id}')" class="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition-all flex items-center justify-center gap-1.5">
                        ✏️ Input / Edit Sesi & Laporan
                      </button>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    ${sesiBoxes}
                  </div>
  
                  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span class="text-slate-500 dark:text-slate-400">Laporan:</span> ${lapLink}
                    </div>
                    <div class="text-slate-500 dark:text-slate-400">Total: <b class="text-slate-900 dark:text-white">${s.paket}</b> | Terisi: <b class="text-emerald-600 dark:text-emerald-400">${terisi}/${s.paket}</b></div>
                  </div>
                </div>
              `;
            });
          }
  
          container.innerHTML += `
            <div class="bg-white dark:bg-[#1e293b] rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
              <button onclick="toggleDropdownGuru('${guruIdKey}')" class="w-full flex items-center justify-between p-4 bg-slate-50/70 dark:bg-[#1e293b]/70 hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-all text-left">
                <div class="flex items-center gap-3">
                  ${fotoHeaderHtml}
                  <div>
                    <h3 class="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">${namaGuru}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Ketuk untuk lihat anak didik</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-semibold">${siswaDihandle.length} Siswa</span>
                  <span id="dropdown-icon-${guruIdKey}" class="text-amber-500 font-bold text-lg transition-transform duration-300 inline-block">&#9662;</span>
                </div>
              </button>
  
              <div id="dropdown-content-${guruIdKey}" class="hidden p-4 space-y-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-[#0f172a]/40">
                ${cardSiswaHtml}
              </div>
            </div>
          `;
        });
      }

  w.renderArsipDokumen = function renderArsipDokumen() {
        const tbody = document.getElementById('tabelArsipDokumenBody');
        if(!tbody) return;
        tbody.innerHTML = '';
  
        if (!window.dataArsip || window.dataArsip.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">Belum ada file dokumen atau laporan yang diunggah di arsip.</td></tr>`;
          return;
        }
  
        window.dataArsip.forEach(item => {
          const jenisLabel = item.jenis === 'pendaftaran' ? '📄 Dokumen Pendaftaran' : '📊 Laporan Perkembangan';
          const jenisBadgeClass = item.jenis === 'pendaftaran' ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500 dark:text-amber-300';
          const namaFileDownload = item.jenis === 'pendaftaran' ? `Form_Pendaftaran_${item.anak}.pdf` : `Laporan_Privat_${item.kegiatan}_${item.anak}.pdf`;
  
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="py-3.5 font-bold text-slate-900 dark:text-white">${item.anak}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${item.guru || '-'}</td>
              <td class="py-3.5 text-slate-500 dark:text-slate-400">${item.kegiatan || '-'}</td>
              <td class="py-3.5 ${jenisBadgeClass} font-medium">${jenisLabel}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${item.tanggalUpload || '-'}</td>
              <td class="py-3.5 text-center space-x-1.5">
                <a href="${item.fileUrl}" target="_blank" class="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all">👁️ Lihat</a>
                <button onclick="downloadFileSupabase('${item.fileUrl}', '${namaFileDownload}')" class="bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all">⬇️ Download</button>
                <button onclick="hapusArsipDokumen('${item.id}', '${item.filePath || ''}')" class="bg-red-500/10 hover:bg-red-500 text-red-500 dark:text-red-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all">🗑️ Hapus</button>
              </td>
            </tr>
          `;
        });
      }

  w.renderRekapFee = function renderRekapFee() {
        const tbody = document.getElementById('tabelRekapBody');
        if(!tbody) return;
        tbody.innerHTML = '';
  
        if (!window.dataRekapFee || window.dataRekapFee.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-slate-400">Belum ada data rekap fee yang diarsipkan. Sesi yang habis akan otomatis masuk ke sini.</td></tr>`;
          return;
        }
  
        window.dataRekapFee.forEach(r => {
          let lapText = r.laporanUrl ? `<span class="text-emerald-600 dark:text-emerald-400 font-semibold">Sudah Upload</span>` : `<span class="text-red-500 dark:text-red-400 font-semibold">Belum Upload</span>`;
          
          let statusBadge = '';
          if (r.laporanUrl) {
            statusBadge = `<span class="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">Siap dicairkan</span>`;
          } else {
            statusBadge = `<span class="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">Belum bisa</span>`;
          }
  
          let tanggalKecil = r.tanggalSelesai ? `<div class="text-[10px] text-amber-600 dark:text-amber-300 font-medium mt-0.5">Selesai: ${r.tanggalSelesai}</div>` : '';
          const transportVal = (r.transportPerSesi !== undefined) ? r.transportPerSesi : (r.transportPerSessi || 0);
  
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="py-3.5 font-bold text-slate-900 dark:text-white">
                ${r.anak}
                ${tanggalKecil}
              </td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${r.skemaText} - ${r.kegiatan}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${r.guru || '-'}</td>
              <td class="py-3.5 text-slate-500 dark:text-slate-400">${r.paket} Sesi</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${formatRupiah(r.feePerSesi)}</td>
              <td class="py-3.5 text-slate-600 dark:text-slate-300">${formatRupiah(transportVal)}</td>
              <td class="py-3.5 font-extrabold text-amber-600 dark:text-amber-400">${formatRupiah(r.totalHakGuru)}</td>
              <td class="py-3.5">${lapText}</td>
              <td class="py-3.5 text-center">${statusBadge}</td>
              <td class="py-3.5 text-center">
                <button onclick="hapusRekapFee('${r.id}')" class="bg-red-500/10 hover:bg-red-500 text-red-500 dark:text-red-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all">🗑️ Hapus</button>
              </td>
            </tr>
          `;
        });
      }

})(window);
