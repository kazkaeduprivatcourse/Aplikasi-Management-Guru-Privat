// Stage 4.3 — Jadwal detail & reschedule helpers.
// Intentionally separated from the proven Firebase/Supabase runtime.
    function bukaDetailJadwal(id){
      const x=window.getSemuaJadwalKalender().find(j=>j.id===id); if(!x)return;
      const siswa=(window.dataSiswa||[]).find(s=>s.id===x.siswaId);
      const sesiKe=x.sesiKe;
      const sesiInfo=sesiKe ? `<div><div class="text-xs text-slate-500">Sesi</div><div class="text-sm text-slate-200">Sesi ${sesiKe} dari ${x.totalSesi||siswa?.paket||'-'}</div></div>` : '';
      document.getElementById('detailJadwalIsi').innerHTML=`<div class="space-y-3"><div><div class="text-xs text-slate-500">Siswa</div><div class="font-bold text-white">${window.escapeHtml(x.anak||'-')}</div></div><div><div class="text-xs text-slate-500">Guru</div><div class="font-bold text-white">${window.escapeHtml(x.guru||'-')}</div></div><div class="grid grid-cols-2 gap-3"><div><div class="text-xs text-slate-500">Tanggal</div><div class="text-sm text-slate-200">${window.formatTanggalID(x.tanggal)}</div></div><div><div class="text-xs text-slate-500">Waktu</div><div class="text-sm text-slate-200">${window.jamMenit(x.jamMulai)}–${window.jamMenit(x.jamSelesai)}</div></div></div>${sesiInfo}<div><div class="text-xs text-slate-500">Kegiatan</div><div class="text-sm text-slate-200">${window.escapeHtml(x.kegiatan||'-')}</div></div>${x.isReschedule?`<div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200"><b>↻ Jadwal Reschedule</b><br>Dari ${window.formatTanggalID(x.originalDate)}${x.rescheduleReason?`<br>Catatan: ${window.escapeHtml(x.rescheduleReason)}`:''}</div>`:x.isRecurring?`<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300"><b>Jadwal Mingguan</b><br>Jadwal ini berasal dari Data Anak dan berulang setiap ${['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][x.hariMingguan]||'-'}.</div>`:x.catatan?`<div><div class="text-xs text-slate-500">Catatan</div><div class="text-sm text-slate-300">${window.escapeHtml(x.catatan)}</div></div>`:''}<div>${x.isReschedule?'<span class="inline-flex px-2 py-1 rounded-full border text-[10px] font-bold bg-amber-500/15 text-amber-300 border-amber-500/20">Reschedule</span>':x.isRecurring?'<span class="inline-flex px-2 py-1 rounded-full border text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/20">Mingguan</span>':window.statusBadgeJadwal(x.status)}</div></div>`;
      const edit=document.getElementById('detailJadwalEdit'), selesai=document.getElementById('detailJadwalSelesai'), batal=document.getElementById('detailJadwalBatal'), res=document.getElementById('detailJadwalReschedule');
      edit.dataset.id=id; res.dataset.id=id;
      // Jadwal mingguan/reschedule dikelola melalui Reschedule, bukan Hapus.
      if(x.isRecurring){ edit.classList.add('hidden'); selesai.classList.add('hidden'); batal.classList.add('hidden'); res.classList.remove('hidden'); }
      else { edit.classList.remove('hidden'); selesai.classList.remove('hidden'); batal.classList.remove('hidden'); res.classList.remove('hidden'); edit.onclick=()=>{window.tutupDetailJadwal();window.bukaModalJadwal(id)}; selesai.onclick=()=>window.ubahStatusJadwal(id,'Selesai'); batal.onclick=()=>window.ubahStatusJadwal(id,'Dibatalkan'); }
      res.onclick=()=>{window.tutupDetailJadwal();window.bukaModalReschedule(id)};
      document.getElementById('modalDetailJadwal').classList.remove('hidden');
    }
    function tutupDetailJadwal(){document.getElementById('modalDetailJadwal').classList.add('hidden');}

    function bukaModalReschedule(id){
      const x=window.getSemuaJadwalKalender().find(j=>j.id===id); if(!x)return;
      document.getElementById('rescheduleEventId').value=id;
      document.getElementById('rescheduleTanggal').value=x.tanggal||window.tanggalLocal(new Date());
      document.getElementById('rescheduleMulai').value=x.jamMulai||'16:00';
      document.getElementById('rescheduleSelesai').value=x.jamSelesai||'17:30';
      document.getElementById('rescheduleCatatan').value=x.rescheduleReason||'';
      document.getElementById('rescheduleInfo').innerHTML=`<b class="text-white">${window.escapeHtml(x.anak||'-')}</b><br><span class="text-slate-400">${window.escapeHtml(x.guru||'-')} · ${window.formatTanggalID(x.tanggal)} · ${window.jamMenit(x.jamMulai)}–${window.jamMenit(x.jamSelesai)}</span>${x.sesiKe?`<br><span class="text-amber-300">Sesi ${x.sesiKe} dari ${x.totalSesi||'-'}</span>`:''}`;
      document.getElementById('modalRescheduleJadwal').classList.remove('hidden');
    }
    function tutupModalReschedule(){document.getElementById('modalRescheduleJadwal').classList.add('hidden');}
    async function simpanReschedule(){
      const id=document.getElementById('rescheduleEventId').value;
      const x=window.getSemuaJadwalKalender().find(j=>j.id===id); if(!x)return;
      const tanggal=document.getElementById('rescheduleTanggal').value;
      const mulai=document.getElementById('rescheduleMulai').value;
      const selesai=document.getElementById('rescheduleSelesai').value;
      const alasan=document.getElementById('rescheduleCatatan').value.trim();
      if(!tanggal||!mulai||!selesai)return alert('Lengkapi tanggal dan waktu baru.');
      if(selesai<=mulai)return alert('Jam selesai harus lebih besar dari jam mulai.');
      if(tanggal===x.tanggal && mulai===x.jamMulai && selesai===x.jamSelesai)return alert('Pilih tanggal atau waktu baru untuk reschedule.');
      const bentrok=window.getSemuaJadwalKalender().find(o=>o.id!==id&&o.tanggal===tanggal&&String(o.guruId)===String(x.guruId)&&o.status!=='Dibatalkan'&&mulai<(o.jamSelesai||'')&&selesai>(o.jamMulai||''));
      if(bentrok && !confirm(`Jadwal guru bentrok dengan ${bentrok.anak||'siswa lain'} (${window.jamMenit(bentrok.jamMulai)}–${window.jamMenit(bentrok.jamSelesai)}). Tetap reschedule?`))return;
      try{
        if(x.isRecurring){
          const data={siswaId:x.siswaId,guruId:x.guruId,anak:x.anak||'-',guru:x.guru||'-',tanggal,jamMulai:mulai,jamSelesai:selesai,kegiatan:x.kegiatan||'Home Visit',catatan:x.catatan||'',status:'Terjadwal',isReschedule:true,originalDate:x.tanggal,sesiKe:x.sesiKe||null,totalSesi:x.totalSesi||null,rescheduleReason:alasan,createdAt:Date.now(),updatedAt:Date.now()};
          await window.push(window.ref(window.db,'jadwal'),data);
        }else{
          await window.update(window.ref(window.db,`jadwal/${x.id}`),{tanggal,jamMulai:mulai,jamSelesai:selesai,isReschedule:true,originalDate:x.originalDate||x.tanggal,rescheduleReason:alasan,updatedAt:Date.now()});
        }
        tutupModalReschedule();
      }catch(e){console.error(e);alert('Gagal menyimpan reschedule.');}
    }

