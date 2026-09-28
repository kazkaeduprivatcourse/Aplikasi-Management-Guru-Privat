/* Kazka Edu — Stage 4.20: Jadwal + Kalender module.
 * Extracted as a complete feature group from Stage 4.10.
 * Firebase access uses the existing window.kazkaDb bridge; data schema is unchanged.
 */
document.addEventListener('DOMContentLoaded', function () {
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeText');
  if (document.documentElement.classList.contains('dark')) {
    if (icon) icon.innerText = '🌙';
    if (label) label.innerText = 'Dark Mode';
  }
});


    // ===== JADWAL HOME VISIT V1 =====
    window.dataJadwal = [];
    let bulanJadwalAktif = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    function statusBadgeJadwal(status){
      const map={Terjadwal:'bg-blue-500/15 text-blue-300 border-blue-500/20',Selesai:'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',Dibatalkan:'bg-red-500/15 text-red-300 border-red-500/20'};
      return `<span class="inline-flex px-2 py-1 rounded-full border text-[10px] font-bold ${map[status]||map.Terjadwal}">${status||'Terjadwal'}</span>`;
    }
    function isiFilterJadwal(){
      const g=document.getElementById('filterJadwalGuru'), s=document.getElementById('filterJadwalSiswa'); if(!g||!s)return;
      const gv=g.value, sv=s.value;
      g.innerHTML='<option value="">Semua Guru</option>'+((window.dataGuru||[]).map(x=>`<option value="${String(x.id)}">${escapeHtml(x.nama||x.guru||'-')}</option>`).join(''));
      const siswaUnik=[]; (window.dataSiswa||[]).forEach(x=>{ if(x.id && !siswaUnik.some(y=>y.id===x.id)) siswaUnik.push(x); });
      s.innerHTML='<option value="">Semua Siswa</option>'+siswaUnik.map(x=>`<option value="${String(x.id)}">${escapeHtml(x.anak||'-')}</option>`).join('');
      g.value=gv; s.value=sv;
    }
    // Jadwal mingguan hanya dibuat sebanyak SISA SESI pada paket aktif.
    // Contoh: paket 8, sudah terisi 4 -> kalender hanya menampilkan 4 pertemuan berikutnya.
    function normalizeJadwalMingguan(v){
      if(Array.isArray(v)) return v;
      if(v && typeof v === 'object') return Object.values(v);
      return [];
    }

    function getTanggalAwalJadwalSiswa(s){
      const sesi = s.sesiList && typeof s.sesiList === 'object' ? Object.values(s.sesiList) : [];
      const tanggalSesi = sesi
        .filter(x => x && x.tanggal)
        .map(x => new Date(`${x.tanggal}T00:00:00`))
        .filter(d => !Number.isNaN(d.getTime()));

      if(tanggalSesi.length){
        const terakhir = new Date(Math.max(...tanggalSesi.map(d => d.getTime())));
        terakhir.setDate(terakhir.getDate() + 1);
        return terakhir;
      }

      const sekarang = new Date();
      return new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
    }

    function getJadwalMingguanBulan(y,m){
      const out=[];
      const bulanMulai = new Date(y,m,1);
      const bulanSelesai = new Date(y,m+1,0);

      (window.dataSiswa||[]).forEach(s=>{
        // Jadwal dari pengajuan Guru harus diaktifkan Admin terlebih dahulu.
        // Data lama yang belum memiliki flag tetap dianggap aktif agar kompatibel.
        if(s.jadwalAktif === false) return;
        const aturan = normalizeJadwalMingguan(s.jadwalMingguan);
        const paket = Math.max(0, Number(s.paket) || 0);
        const terisi = Math.max(0, Number(s.terisi) || 0);
        const sisa = Math.max(0, paket - terisi);

        // Kalau paket sudah habis, jangan tampilkan jadwal sampai paket diperpanjang.
        if(!aturan.length || sisa <= 0 || paket <= 0) return;

        const tanggalAwal = getTanggalAwalJadwalSiswa(s);
        let jumlahYangSudahDibuat = 0;
        let cursor = new Date(tanggalAwal);

        // Cari maksimal sisa sesi berikutnya. Kita scan ke depan cukup jauh agar
        // jadwal paket tetap bisa ditemukan walaupun jatuh di bulan berikutnya.
        const batasScan = new Date(tanggalAwal);
        batasScan.setMonth(batasScan.getMonth() + Math.max(3, sisa * 2));

        while(cursor <= batasScan && jumlahYangSudahDibuat < sisa){
          const hari = cursor.getDay();
          const aturanHari = aturan.filter(a => Number(a.hari) === hari);

          aturanHari.forEach(a => {
            if(jumlahYangSudahDibuat >= sisa) return;
            if(cursor < tanggalAwal || cursor > batasScan) return;

            const tanggal = tanggalLocal(cursor);
            const sesiKe = terisi + jumlahYangSudahDibuat + 1;

            // Jika sesi ini sudah diisi guru pada halaman Pertemuan, jangan tampilkan
            // slot rencana tersebut di kalender. Sesi berikutnya tetap dibuat.
            if(jadwalSesiSudahDiisi(s, sesiKe)){
              jumlahYangSudahDibuat++;
              return;
            }

            jumlahYangSudahDibuat++;

            // Hanya masukkan ke bulan yang sedang dilihat.
            if(cursor >= bulanMulai && cursor <= bulanSelesai){
              out.push({
                id:`mingguan_${s.id}_${tanggal}_${sesiKe}`,
                siswaId:s.id,
                guruId:(window.dataGuru||[]).find(g=>(g.nama||g.guru)===s.guru)?.id||s.guruId||'',
                anak:s.anak||'-',
                guru:s.guru||'-',
                tanggal,
                jamMulai:a.jamMulai||'16:00',
                jamSelesai:a.jamSelesai||'17:30',
                kegiatan:s.kegiatan||'Home Visit',
                catatan:`Sesi ${sesiKe} dari ${paket}`,
                status:'Terjadwal',
                isRecurring:true,
                sesiKe,
                totalSesi:paket,
                hariMingguan:hari
              });
            }
          });
          cursor.setDate(cursor.getDate()+1);
        }
      });
      return out;
    }

    function jadwalSesiSudahDiisi(s, sesiKe){
      const d=s?.sesiList && typeof s.sesiList==='object' ? s.sesiList[sesiKe] : null;
      return !!(d && d.tanggal);
    }
    function kunciJadwal(siswaId, tanggal, sesiKe){ return `${siswaId}__${tanggal}__${sesiKe||''}`; }
    function getRescheduleMap(){
      const map=new Map();
      (window.dataJadwal||[]).forEach(x=>{
        if(x && x.isReschedule && x.originalDate && x.siswaId){
          map.set(kunciJadwal(x.siswaId,x.originalDate,x.sesiKe), x);
        }
      });
      return map;
    }
    function getSemuaJadwalKalender(){
      const y=bulanJadwalAktif.getFullYear(),m=bulanJadwalAktif.getMonth();
      const resMap=getRescheduleMap();
      const generated=getJadwalMingguanBulan(y,m).filter(x=>!resMap.has(kunciJadwal(x.siswaId,x.tanggal,x.sesiKe)));
      const manual=(window.dataJadwal||[]).filter(x=>{
        if(!x) return false;
        if(x.isReschedule && jadwalSesiSudahDiisi((window.dataSiswa||[]).find(s=>s.id===x.siswaId),x.sesiKe)) return false;
        return true;
      });
      return [...manual,...generated];
    }
    function formatJadwalMingguanSiswa(s){
      const a=normalizeJadwalMingguan(s.jadwalMingguan); if(!a.length)return '<span class="text-slate-600">Belum diatur</span>';
      return a.map(x=>`${namaHariMingguan[Number(x.hari)]||'-'} ${jamMenit(x.jamMulai)}–${jamMenit(x.jamSelesai)}`).join('<br>');
    }
    function getJadwalFiltered(){
      const g=document.getElementById('filterJadwalGuru')?.value||'', s=document.getElementById('filterJadwalSiswa')?.value||'', st=document.getElementById('filterJadwalStatus')?.value||'';
      return getSemuaJadwalKalender().filter(x=>(!g||String(x.guruId)===g||String(x.guruId)===(window.dataGuru||[]).find(q=>q.nama===x.guru)?.id)&&(!s||String(x.siswaId)===s)&&(!st||x.status===st));
    }
    function renderJadwal(){
      isiFilterJadwal();
      const y=bulanJadwalAktif.getFullYear(), m=bulanJadwalAktif.getMonth();
      const namaBulan=bulanJadwalAktif.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
      const label=document.getElementById('jadwalBulanLabel'); if(label) label.textContent=namaBulan.charAt(0).toUpperCase()+namaBulan.slice(1);
      const cal=document.getElementById('kalenderJadwal'); if(!cal)return;
      const days=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
      let html=days.map(d=>`<div class="jadwal-weekday-head"><span class="text-[10px] font-bold text-slate-400">${d}</span></div>`).join('');
      const first=new Date(y,m,1), offset=(first.getDay()+6)%7, last=new Date(y,m+1,0).getDate();
      for(let i=0;i<offset;i++) html+='<div class="min-h-[92px] rounded-xl bg-slate-950/30 border border-transparent"></div>';
      const data=getJadwalFiltered();
      for(let day=1;day<=last;day++){
        const date=`${y}-${pad2(m+1)}-${pad2(day)}`, items=data.filter(x=>x.tanggal===date).sort((a,b)=>(a.jamMulai||'').localeCompare(b.jamMulai||''));
        const today=date===tanggalLocal(new Date());
        html+=`<div class="jadwal-day-cell ${today?'is-today':''}"><div class="jadwal-day-head"><span class="jadwal-day-number">${day}</span>${items.length?`<span class="jadwal-day-count">${items.length} jadwal</span>`:''}</div><div class="jadwal-day-events">${items.slice(0,6).map(x=>`<button onclick="bukaDetailJadwal('${x.id}')" class="jadwal-calendar-item ${x.isReschedule?'jci-reschedule':x.isRecurring?'jci-recurring':'jci-normal'}"><div class="jci-top"><span class="jci-time">${jamMenit(x.jamMulai)}–${jamMenit(x.jamSelesai)}</span>${x.isReschedule?`<span class="jci-badge">↻</span>`:x.isRecurring?`<span class="jci-badge">W</span>`:''}</div><div class="jci-name">${escapeHtml(x.anak||'-')}</div><div class="jci-guru"><span class="jci-guru-dot"></span>${escapeHtml(x.guru||'-')}</div></button>`).join('')}${items.length>6?`<div class="jadwal-calendar-more">+${items.length-6} jadwal lainnya</div>`:''}</div></div>`;
      }
      cal.innerHTML=html;
      const monthPrefix=`${y}-${pad2(m+1)}`;
      const monthItems=data.filter(x=>(x.tanggal||'').startsWith(monthPrefix)).sort((a,b)=>((a.tanggal||'')+(a.jamMulai||'')).localeCompare((b.tanggal||'')+(b.jamMulai||'')));
      const list=document.getElementById('agendaJadwalList'); if(list) list.innerHTML=monthItems.length?monthItems.map(x=>`<div class="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl ${x.isRecurring?'bg-emerald-950/30 border-emerald-900/50':'bg-slate-800/60 border-slate-800'} border"><div class="w-20 text-xs font-bold text-amber-300">${formatTanggalID(x.tanggal).split(',')[0]}<br><span class="text-white">${x.tanggal?.slice(8,10)}/${x.tanggal?.slice(5,7)}</span></div><div class="flex-1 min-w-0"><div class="font-bold text-white text-sm truncate">${escapeHtml(x.anak||'-')}</div><div class="text-xs text-slate-400">${escapeHtml(x.guru||'-')} · ${jamMenit(x.jamMulai)}–${jamMenit(x.jamSelesai)} · ${escapeHtml(x.kegiatan||'Home Visit')}</div></div>${x.isRecurring?'<span class="inline-flex px-2 py-1 rounded-full border text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/20">Mingguan</span>':statusBadgeJadwal(x.status)}<button onclick="bukaDetailJadwal('${x.id}')" class="text-xs font-semibold text-slate-300 hover:text-white">Detail</button></div>`).join(''):'<div class="text-center text-sm text-slate-500 py-8">Belum ada jadwal pada bulan ini.</div>';
      const todayStr=tanggalLocal(new Date()), all=getJadwalFiltered();
      const statToday=all.filter(x=>x.tanggal===todayStr).length, statMonth=all.filter(x=>(x.tanggal||'').startsWith(monthPrefix)).length, statUpcoming=all.filter(x=>x.status==='Terjadwal').length;
      document.getElementById('jadwalStatHariIni').textContent=statToday; document.getElementById('jadwalStatBulan').textContent=statMonth; document.getElementById('jadwalStatTerjadwal').textContent=statUpcoming;
      document.getElementById('agendaCountLabel').textContent=`${monthItems.length} jadwal`;
    }
    function ubahBulanJadwal(delta){ bulanJadwalAktif=new Date(bulanJadwalAktif.getFullYear(),bulanJadwalAktif.getMonth()+delta,1); renderJadwal(); }
    function keBulanIniJadwal(){ const d=new Date(); bulanJadwalAktif=new Date(d.getFullYear(),d.getMonth(),1); renderJadwal(); }
    function populateJadwalForm(){
      const s=document.getElementById('jadwalSiswa'), g=document.getElementById('jadwalGuru'); if(!s||!g)return;
      s.innerHTML='<option value="">Pilih siswa</option>'+(window.dataSiswa||[]).map(x=>`<option value="${x.id}" data-guru="${escapeHtml(x.guru||'')}">${escapeHtml(x.anak||'-')} — ${escapeHtml(x.kegiatan||'')}</option>`).join('');
      g.innerHTML='<option value="">Pilih guru</option>'+(window.dataGuru||[]).map(x=>`<option value="${x.id}">${escapeHtml(x.nama||x.guru||'-')}</option>`).join('');
    }

    function sinkronGuruDariSiswa(){
      const sid=document.getElementById('jadwalSiswa')?.value;
      const siswa=(window.dataSiswa||[]).find(x=>x.id===sid);
      const guruSelect=document.getElementById('jadwalGuru');
      if(!siswa||!guruSelect)return;
      const match=(window.dataGuru||[]).find(g=>
        (siswa.guruId && String(g.id)===String(siswa.guruId)) ||
        String(g.nama||g.guru||'')===String(siswa.guru||'')
      );
      if(match) guruSelect.value=match.id;
    }

    function setHariJadwalForm(aturan){
      const hari=normalizeJadwalMingguan(aturan).map(x=>Number(x.hari)).filter(x=>!Number.isNaN(x));
      document.querySelectorAll('input[name="jadwalHariForm"]').forEach(x=>x.checked=hari.includes(Number(x.value)));
    }

    function setModeJadwalForm(mode){
      const weekly=mode!=='legacy';
      document.getElementById('jadwalMode').value=weekly?'mingguan':'legacy';
      document.getElementById('jadwalMingguanBox')?.classList.toggle('hidden',!weekly);
      document.getElementById('jadwalLegacyTanggalWrap')?.classList.toggle('hidden',weekly);
      const info=document.getElementById('jadwalSyncInfo');
      if(info) info.textContent=weekly
        ? 'Jadwal mingguan dari halaman ini akan menyinkronkan hari, jam, dan guru ke Data Anak.'
        : 'Jadwal ini adalah data jadwal lama. Edit tetap disimpan sebagai jadwal satu kali tanpa mengubah jadwal mingguan Data Anak.';
    }

    function bukaModalJadwal(id=null){
      populateJadwalForm();
      document.getElementById('editJadwalId').value=id||'';
      document.getElementById('modalJadwal').classList.remove('hidden');
      if(id){
        const x=window.dataJadwal.find(j=>j.id===id);
        if(!x)return;
        // Data jadwal lama tetap bisa diedit tanpa kehilangan fungsi lama.
        setModeJadwalForm('legacy');
        document.getElementById('jadwalSiswa').value=x.siswaId||'';
        document.getElementById('jadwalGuru').value=x.guruId||'';
        document.getElementById('jadwalTanggal').value=x.tanggal||tanggalLocal(new Date());
        document.getElementById('jadwalMulai').value=x.jamMulai||'16:00';
        document.getElementById('jadwalSelesai').value=x.jamSelesai||'17:30';
        document.getElementById('jadwalKegiatan').value=x.kegiatan||'Home Visit';
        document.getElementById('jadwalCatatan').value=x.catatan||'';
        document.getElementById('modalJadwalTitle').textContent='Edit Jadwal Home Visit';
      }else{
        setModeJadwalForm('mingguan');
        setHariJadwalForm([]);
        document.getElementById('modalJadwalTitle').textContent='Buat Jadwal Home Visit';
        document.getElementById('jadwalSiswa').value='';
        document.getElementById('jadwalGuru').value='';
        document.getElementById('jadwalTanggal').value=tanggalLocal(new Date());
        document.getElementById('jadwalMulai').value='16:00';
        document.getElementById('jadwalSelesai').value='17:30';
        document.getElementById('jadwalKegiatan').value='Home Visit';
        document.getElementById('jadwalCatatan').value='';
      }
    }
    function tutupModalJadwal(){document.getElementById('modalJadwal').classList.add('hidden');}
    function bukaDetailJadwal(id){
      const x=getSemuaJadwalKalender().find(j=>j.id===id); if(!x)return;
      const siswa=(window.dataSiswa||[]).find(s=>s.id===x.siswaId);
      const sesiKe=x.sesiKe;
      const sesiInfo=sesiKe ? `<div><div class="text-xs text-slate-500">Sesi</div><div class="text-sm text-slate-200">Sesi ${sesiKe} dari ${x.totalSesi||siswa?.paket||'-'}</div></div>` : '';
      document.getElementById('detailJadwalIsi').innerHTML=`<div class="space-y-3"><div><div class="text-xs text-slate-500">Siswa</div><div class="font-bold text-white">${escapeHtml(x.anak||'-')}</div></div><div><div class="text-xs text-slate-500">Guru</div><div class="font-bold text-white">${escapeHtml(x.guru||'-')}</div></div><div class="grid grid-cols-2 gap-3"><div><div class="text-xs text-slate-500">Tanggal</div><div class="text-sm text-slate-200">${formatTanggalID(x.tanggal)}</div></div><div><div class="text-xs text-slate-500">Waktu</div><div class="text-sm text-slate-200">${jamMenit(x.jamMulai)}–${jamMenit(x.jamSelesai)}</div></div></div>${sesiInfo}<div><div class="text-xs text-slate-500">Kegiatan</div><div class="text-sm text-slate-200">${escapeHtml(x.kegiatan||'-')}</div></div>${x.isReschedule?`<div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200"><b>↻ Jadwal Reschedule</b><br>Dari ${formatTanggalID(x.originalDate)}${x.rescheduleReason?`<br>Catatan: ${escapeHtml(x.rescheduleReason)}`:''}</div>`:x.isRecurring?`<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300"><b>Jadwal Mingguan</b><br>Jadwal ini berasal dari Data Anak dan berulang setiap ${namaHariMingguan[x.hariMingguan]||'-'}.</div>`:x.catatan?`<div><div class="text-xs text-slate-500">Catatan</div><div class="text-sm text-slate-300">${escapeHtml(x.catatan)}</div></div>`:''}<div>${x.isReschedule?'<span class="inline-flex px-2 py-1 rounded-full border text-[10px] font-bold bg-amber-500/15 text-amber-300 border-amber-500/20">Reschedule</span>':x.isRecurring?'<span class="inline-flex px-2 py-1 rounded-full border text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/20">Mingguan</span>':statusBadgeJadwal(x.status)}</div></div>`;
      const edit=document.getElementById('detailJadwalEdit'), selesai=document.getElementById('detailJadwalSelesai'), batal=document.getElementById('detailJadwalBatal'), res=document.getElementById('detailJadwalReschedule');
      edit.dataset.id=id; res.dataset.id=id;
      // Jadwal mingguan/reschedule dikelola melalui Reschedule, bukan Hapus.
      if(x.isRecurring){ edit.classList.add('hidden'); selesai.classList.add('hidden'); batal.classList.add('hidden'); res.classList.remove('hidden'); }
      else { edit.classList.remove('hidden'); selesai.classList.remove('hidden'); batal.classList.remove('hidden'); res.classList.remove('hidden'); edit.onclick=()=>{tutupDetailJadwal();bukaModalJadwal(id)}; selesai.onclick=()=>ubahStatusJadwal(id,'Selesai'); batal.onclick=()=>ubahStatusJadwal(id,'Dibatalkan'); }
      res.onclick=()=>{tutupDetailJadwal();bukaModalReschedule(id)};
      document.getElementById('modalDetailJadwal').classList.remove('hidden');
    }
    function tutupDetailJadwal(){document.getElementById('modalDetailJadwal').classList.add('hidden');}

    function bukaModalReschedule(id){
      const x=getSemuaJadwalKalender().find(j=>j.id===id); if(!x)return;
      document.getElementById('rescheduleEventId').value=id;
      document.getElementById('rescheduleTanggal').value=x.tanggal||tanggalLocal(new Date());
      document.getElementById('rescheduleMulai').value=x.jamMulai||'16:00';
      document.getElementById('rescheduleSelesai').value=x.jamSelesai||'17:30';
      document.getElementById('rescheduleCatatan').value=x.rescheduleReason||'';
      document.getElementById('rescheduleInfo').innerHTML=`<b class="text-white">${escapeHtml(x.anak||'-')}</b><br><span class="text-slate-400">${escapeHtml(x.guru||'-')} · ${formatTanggalID(x.tanggal)} · ${jamMenit(x.jamMulai)}–${jamMenit(x.jamSelesai)}</span>${x.sesiKe?`<br><span class="text-amber-300">Sesi ${x.sesiKe} dari ${x.totalSesi||'-'}</span>`:''}`;
      document.getElementById('modalRescheduleJadwal').classList.remove('hidden');
    }
    function tutupModalReschedule(){document.getElementById('modalRescheduleJadwal').classList.add('hidden');}
    async function simpanReschedule(){
      const id=document.getElementById('rescheduleEventId').value;
      const x=getSemuaJadwalKalender().find(j=>j.id===id); if(!x)return;
      const tanggal=document.getElementById('rescheduleTanggal').value;
      const mulai=document.getElementById('rescheduleMulai').value;
      const selesai=document.getElementById('rescheduleSelesai').value;
      const alasan=document.getElementById('rescheduleCatatan').value.trim();
      if(!tanggal||!mulai||!selesai)return alert('Lengkapi tanggal dan waktu baru.');
      if(selesai<=mulai)return alert('Jam selesai harus lebih besar dari jam mulai.');
      if(tanggal===x.tanggal && mulai===x.jamMulai && selesai===x.jamSelesai)return alert('Pilih tanggal atau waktu baru untuk reschedule.');
      const bentrok=getSemuaJadwalKalender().find(o=>o.id!==id&&o.tanggal===tanggal&&String(o.guruId)===String(x.guruId)&&o.status!=='Dibatalkan'&&mulai<(o.jamSelesai||'')&&selesai>(o.jamMulai||''));
      if(bentrok && !confirm(`Jadwal guru bentrok dengan ${bentrok.anak||'siswa lain'} (${jamMenit(bentrok.jamMulai)}–${jamMenit(bentrok.jamSelesai)}). Tetap reschedule?`))return;
      try{
        if(x.isRecurring){
          const data={siswaId:x.siswaId,guruId:x.guruId,anak:x.anak||'-',guru:x.guru||'-',tanggal,jamMulai:mulai,jamSelesai:selesai,kegiatan:x.kegiatan||'Home Visit',catatan:x.catatan||'',status:'Terjadwal',isReschedule:true,originalDate:x.tanggal,sesiKe:x.sesiKe||null,totalSesi:x.totalSesi||null,rescheduleReason:alasan,createdAt:Date.now(),updatedAt:Date.now()};
          await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db,'jadwal'),data);
        }else{
          await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db,`jadwal/${x.id}`),{tanggal,jamMulai:mulai,jamSelesai:selesai,isReschedule:true,originalDate:x.originalDate||x.tanggal,rescheduleReason:alasan,updatedAt:Date.now()});
        }
        tutupModalReschedule();
      }catch(e){console.error(e);alert('Gagal menyimpan reschedule.');}
    }

    async function simpanJadwal(){
      const siswaId=document.getElementById('jadwalSiswa').value;
      const guruId=document.getElementById('jadwalGuru').value;
      const mulai=document.getElementById('jadwalMulai').value;
      const selesai=document.getElementById('jadwalSelesai').value;
      const id=document.getElementById('editJadwalId').value;
      const mode=document.getElementById('jadwalMode').value||'mingguan';
      const kegiatan=document.getElementById('jadwalKegiatan').value.trim()||'Home Visit';
      const catatan=document.getElementById('jadwalCatatan').value.trim();

      if(!siswaId||!guruId||!mulai||!selesai)return alert('Lengkapi siswa, guru, dan waktu.');
      if(selesai<=mulai)return alert('Jam selesai harus lebih besar dari jam mulai.');

      // Mode baru: pilih beberapa hari lalu sinkronkan langsung ke Data Anak.
      if(mode==='mingguan'){
        const hariMingguan=Array.from(document.querySelectorAll('input[name="jadwalHariForm"]:checked')).map(x=>Number(x.value));
        if(!hariMingguan.length)return alert('Pilih minimal satu hari belajar.');

        const sv=window.dataSiswa.find(x=>x.id===siswaId);
        const gv=window.dataGuru.find(x=>x.id===guruId);
        if(!sv||!gv)return alert('Data siswa atau guru tidak ditemukan.');

        const jadwalMingguan=hariMingguan.map(hari=>({hari,jamMulai:mulai,jamSelesai:selesai}));
        const konflik=(window.dataSiswa||[]).find(other=>{
          if(other.id===siswaId || String(other.guruId||'')!==String(guruId))return false;
          const aturanLain=normalizeJadwalMingguan(other.jadwalMingguan);
          return jadwalMingguan.some(a=>aturanLain.some(b=>Number(a.hari)===Number(b.hari)&&a.jamMulai<b.jamSelesai&&a.jamSelesai>b.jamMulai));
        });
        if(konflik && !confirm(`Jadwal guru bentrok dengan ${konflik.anak}. Tetap simpan jadwal ini?`))return;

        try{
          await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db,`siswa/${siswaId}`),{
            guruId:gv.id,
            guru:gv.nama||gv.guru||'-',
            jadwalMingguan,
            updatedAt:Date.now()
          });
          tutupModalJadwal();
        }catch(e){console.error(e);alert('Gagal menyimpan jadwal ke Data Anak.');}
        return;
      }

      // Mode legacy hanya untuk jadwal satu-kali yang sudah tersimpan sebelumnya.
      const tanggal=document.getElementById('jadwalTanggal').value;
      if(!tanggal)return alert('Tanggal jadwal lama wajib diisi.');
      const bentrok=window.dataJadwal.find(x=>x.id!==id&&x.tanggal===tanggal&&x.guruId===guruId&&x.status!=='Dibatalkan'&&mulai<(x.jamSelesai||'')&&selesai>(x.jamMulai||''));
      if(bentrok&&!confirm(`Jadwal guru bentrok dengan ${bentrok.anak||'siswa lain'} (${jamMenit(bentrok.jamMulai)}–${jamMenit(bentrok.jamSelesai)}). Tetap simpan?`))return;
      const sv=window.dataSiswa.find(x=>x.id===siswaId),gv=window.dataGuru.find(x=>x.id===guruId);
      const data={siswaId,guruId,anak:sv?.anak||'-',guru:gv?.nama||gv?.guru||'-',tanggal,jamMulai:mulai,jamSelesai:selesai,kegiatan,catatan,status:id?(window.dataJadwal.find(x=>x.id===id)?.status||'Terjadwal'):'Terjadwal',updatedAt:Date.now()};
      try{if(id)await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db,`jadwal/${id}`),data);else await window.kazkaDb.push(window.kazkaDb.ref(window.kazkaDb.db,'jadwal'),{...data,createdAt:Date.now()});tutupModalJadwal();}catch(e){console.error(e);alert('Gagal menyimpan jadwal.');}
    }
    async function ubahStatusJadwal(id,status){ try{await window.kazkaDb.update(window.kazkaDb.ref(window.kazkaDb.db,`jadwal/${id}`),{status,updatedAt:Date.now()});tutupDetailJadwal();}catch(e){console.error(e);alert('Gagal mengubah status.');} }
    async function hapusJadwal(id){ if(!confirm('Hapus jadwal ini?'))return; try{await window.kazkaDb.remove(window.kazkaDb.ref(window.kazkaDb.db,`jadwal/${id}`));tutupDetailJadwal();}catch(e){console.error(e);alert('Gagal menghapus jadwal.');} }
