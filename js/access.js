/* Kazka Edu — Role/profile access layer.
 * Stage 10.1: simple profile selection, no login/password for daily use.
 * Admin and Guru are separated at the UI/workspace level.
 */
(function (w) {
  'use strict';

  const STORAGE_KEY = 'kazka_active_profile_v1';
  const adminTabs = ['ringkasan','anak','guru','jadwal','pertemuan','dokumen','rekap'];

  function current() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { return null; }
  }

  function save(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    w.kazkaProfile = profile;
  }

  function teacherById(id) {
    return (w.dataGuru || []).find(g => String(g.id) === String(id));
  }

  function teacherStudents(profile) {
    if (!profile || profile.role !== 'guru') return [];
    const g = teacherById(profile.id);
    const name = g?.nama || profile.name;
    return (w.dataSiswa || []).filter(s =>
      String(s.guruId || '') === String(profile.id) ||
      String(s.guru || '').trim() === String(name).trim()
    );
  }

  function teacherSchedules(profile) {
    const students = teacherStudents(profile);
    const ids = new Set(students.map(s => String(s.id)));
    const name = teacherById(profile?.id)?.nama || profile?.name || '';
    return (w.dataJadwal || []).filter(j =>
      String(j.guruId || '') === String(profile?.id) ||
      String(j.guru || '').trim() === String(name).trim() ||
      ids.has(String(j.siswaId))
    );
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function localDateISO() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function formatDate(v) {
    if (!v) return '-';
    try { return new Intl.DateTimeFormat('id-ID', {weekday:'short', day:'2-digit', month:'short'}).format(new Date(v + 'T00:00:00')); }
    catch (_) { return v; }
  }

  function showGate() {
    const gate = document.getElementById('roleGate');
    const picker = document.getElementById('guruPicker');
    const pin = document.getElementById('modalPin');
    if (gate) { gate.classList.remove('hidden'); gate.classList.add('flex'); }
    if (picker) { picker.classList.add('hidden'); picker.classList.remove('flex'); }
    if (pin) pin.classList.add('hidden');
  }

  function hideGate() {
    const gate = document.getElementById('roleGate');
    if (gate) { gate.classList.add('hidden'); gate.classList.remove('flex'); }
  }

  function renderGuruPicker() {
    const box = document.getElementById('guruPickerList');
    if (!box) return;
    const q = (document.getElementById('guruPickerSearch')?.value || '').trim().toLowerCase();
    const list = (w.dataGuru || []).filter(g => (g.nama || '').toLowerCase().includes(q));

    if (!list.length) {
      box.innerHTML = '<div class="p-5 text-center text-xs text-slate-400">Data guru belum tersedia atau nama tidak ditemukan.</div>';
      return;
    }

    box.innerHTML = list.map(g => {
      const photo = g.fotoUrl
        ? `<img src="${esc(g.fotoUrl)}" class="w-11 h-11 rounded-2xl object-cover" alt="">`
        : '<div class="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center">👨‍🏫</div>';
      return `<button type="button" onclick="pilihGuruKazka('${esc(g.id)}')" class="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-500/5 transition-all text-left">
        ${photo}
        <span class="min-w-0">
          <strong class="block text-sm text-slate-900 dark:text-white truncate">${esc(g.nama)}</strong>
          <span class="text-[11px] text-slate-500">${esc((g.mapel || []).join(' · ') || 'Guru Privat')}</span>
        </span>
        <span class="ml-auto text-emerald-500 font-black">→</span>
      </button>`;
    }).join('');
  }

  function resetWorkspace() {
    adminTabs.forEach(t => {
      document.getElementById(`tab-${t}`)?.classList.remove('hidden');
      document.getElementById(`mob-tab-${t}`)?.classList.remove('hidden');
      document.getElementById(`page-${t}`)?.classList.remove('hidden');
    });
    document.getElementById('page-guru-dashboard')?.classList.add('hidden');
    document.getElementById('page-guru-dashboard')?.classList.remove('active');
  }

  function applyProfile(profile) {
    if (!profile) return;
    w.kazkaProfile = profile;
    document.body.classList.toggle('teacher-mode', profile.role === 'guru');
    document.body.classList.toggle('admin-mode', profile.role === 'admin');
    hideGate();

    const pill = document.getElementById('activeProfilePill');
    const pillName = document.getElementById('activeProfileName');
    const pillIcon = document.getElementById('activeProfileIcon');
    if (pill) { pill.classList.remove('hidden'); pill.classList.add('flex'); }
    if (pillName) pillName.textContent = profile.role === 'guru' ? (profile.name || 'Guru') : 'Admin';
    if (pillIcon) pillIcon.textContent = profile.role === 'guru' ? '👨‍🏫' : '👩‍💼';

    resetWorkspace();

    if (profile.role === 'guru') {
      adminTabs.forEach(t => {
        document.getElementById(`tab-${t}`)?.classList.add('hidden');
        document.getElementById(`mob-tab-${t}`)?.classList.add('hidden');
        document.getElementById(`page-${t}`)?.classList.add('hidden');
      });
      document.getElementById('page-guru-dashboard')?.classList.remove('hidden');
      document.getElementById('page-guru-dashboard')?.classList.add('active');
      const welcome = document.getElementById('teacherWelcomeName');
      if (welcome) welcome.textContent = profile.name || 'Guru';
      renderTeacherDashboard();
    } else {
      document.getElementById('page-ringkasan')?.classList.remove('hidden');
      if (typeof w.pindahTab === 'function') w.pindahTab('ringkasan', false);
    }
  }

  function renderTeacherDashboard() {
    const profile = current();
    if (!profile || profile.role !== 'guru') return;

    const students = teacherStudents(profile);
    const schedules = teacherSchedules(profile).filter(j => j.status !== 'Dibatalkan');
    const today = localDateISO();
    const upcoming = schedules
      .filter(j => (j.tanggal || '') >= today)
      .sort((a,b) => String(a.tanggal+a.jamMulai).localeCompare(String(b.tanggal+b.jamMulai)));

    const statAnak = document.getElementById('teacherStatAnak');
    const statDeposit = document.getElementById('teacherStatDeposit');
    const getTerisi = s => {
      const hasSesiList = s?.sesiList && typeof s.sesiList === 'object';
      const list = hasSesiList ? Object.values(s.sesiList) : [];
      const computed = list.filter(x => x && (x.terisi === true || String(x.tanggal || '').trim() !== '' || String(x.materi || '').trim() !== '')).length;
      return Math.max(0, hasSesiList ? computed : Number(s?.terisi || 0));
    };
    const totalSisaDeposit = students.reduce((sum, s) => sum + Math.max(0, Number(s.paket || 0) - getTerisi(s)), 0);
    if (statAnak) statAnak.textContent = students.length;
    if (statDeposit) statDeposit.textContent = totalSisaDeposit;

    const scheduleBox = document.getElementById('teacherScheduleList');
    if (scheduleBox) {
      const rows = upcoming.slice(0, 8);
      scheduleBox.innerHTML = rows.length ? rows.map(j => {
        const s = students.find(x => String(x.id) === String(j.siswaId));
        const status = j.status || 'Terjadwal';
        return `<div class="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
          <div class="w-11 text-center"><div class="text-[10px] font-bold text-emerald-500 uppercase">${esc(formatDate(j.tanggal).split(',')[0])}</div><div class="font-black text-slate-900 dark:text-white">${esc((j.tanggal || '').slice(8,10) || '-')}</div></div>
          <div class="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
          <div class="min-w-0 flex-1"><p class="font-extrabold text-sm text-slate-900 dark:text-white truncate">${esc(s?.anak || j.anak || 'Siswa')}</p><p class="text-[11px] text-slate-500 truncate">${esc(j.jamMulai || '--:--')}–${esc(j.jamSelesai || '--:--')} · ${esc(j.kegiatan || s?.kegiatan || 'Home Visit')}</p></div>
          <span class="text-[10px] font-bold rounded-full px-2 py-1 ${status==='Selesai'?'bg-emerald-500/10 text-emerald-600':'bg-amber-500/10 text-amber-600'}">${esc(status)}</span>
        </div>`;
      }).join('') : '<div class="p-5 text-center text-xs text-slate-400">Belum ada jadwal mendatang.</div>';
    }

    const studentBox = document.getElementById('teacherStudentList');
    if (studentBox) {
      studentBox.innerHTML = students.length ? students.map(s => {
        const paket = Math.max(0, Number(s.paket || 0));
        const terisi = getTerisi(s);
        const sisa = Math.max(0, paket - terisi);
        const statusClass = sisa <= 0 ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40' : sisa === 1 ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40' : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40';
        const statusText = sisa <= 0 ? 'Habis' : sisa === 1 ? 'Segera habis' : 'Aman';
        return `<div class="p-3.5 rounded-2xl border ${statusClass} transition-colors">
        <div class="flex items-start justify-between gap-3"><div><p class="font-extrabold text-sm text-slate-900 dark:text-white">${esc(s.anak || '-')}</p><p class="text-[11px] text-slate-500 mt-0.5">${esc(s.kegiatan || 'Kegiatan belum diatur')}</p></div>
        <button onclick="bukaModalSesi('${esc(s.id)}')" class="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-2 rounded-xl">Catat Sesi</button></div>
        <div class="mt-2 flex items-center justify-between gap-2"><p class="text-[10px] text-slate-500">Deposit: <b class="text-slate-800 dark:text-slate-200">${esc(sisa)} / ${esc(paket)}</b> sesi tersisa</p><span class="inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-extrabold ${statusClass}">${statusText}</span></div>
      </div>`;
      }).join('') : '<div class="p-5 text-center text-xs text-slate-400 sm:col-span-2">Belum ada anak yang ditugaskan ke profil ini.</div>';
    }
  }

  // Admin entry requires the PIN once, here at the access chooser.
  // After successful verification, the whole Admin workspace is unlocked.
  function chooseAdmin() {
    w.kazkaPendingEntryRole = 'admin';

    // Tutup halaman pemilih role terlebih dahulu supaya modal PIN benar-benar
    // berada di halaman depan dan input PIN bisa langsung digunakan.
    const gate = document.getElementById('roleGate');
    const picker = document.getElementById('guruPicker');
    if (gate) { gate.classList.add('hidden'); gate.classList.remove('flex'); }
    if (picker) { picker.classList.add('hidden'); picker.classList.remove('flex'); }

    const modal = document.getElementById('modalPin');
    const input = document.getElementById('inputPinAdmin');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
  }

  function chooseTeacher() {
    const gate = document.getElementById('roleGate');
    const picker = document.getElementById('guruPicker');
    if (gate) { gate.classList.add('hidden'); gate.classList.remove('flex'); }
    if (picker) { picker.classList.remove('hidden'); picker.classList.add('flex'); }
    const search = document.getElementById('guruPickerSearch');
    if (search) { search.value = ''; setTimeout(() => search.focus(), 50); }
    renderGuruPicker();
  }

  function selectTeacher(id) {
    const g = teacherById(id);
    if (!g) { alert('Data guru belum termuat. Coba lagi sebentar.'); renderGuruPicker(); return; }
    const profile = { role:'guru', id:g.id, name:g.nama };
    save(profile);
    applyProfile(profile);
    document.getElementById('guruPicker')?.classList.add('hidden');
  }

  function switchUser() {
    localStorage.removeItem(STORAGE_KEY);
    w.kazkaPendingEntryRole = null;
    w.isKazkaAdminUnlocked = false;
    w.kazkaProfile = null;
    w.kazkaPendingEntryRole = null;
    w.isKazkaAdminUnlocked = false;
    document.body.classList.remove('teacher-mode','admin-mode');
    document.getElementById('activeProfilePill')?.classList.add('hidden');
    document.getElementById('activeProfilePill')?.classList.remove('flex');
    resetWorkspace();
    showGate();
  }

  w.pilihAksesKazka = role => role === 'admin' ? chooseAdmin() : chooseTeacher();
  w.pilihGuruKazka = selectTeacher;
  w.renderGuruPicker = renderGuruPicker;
  w.kembaliKeRoleGate = showGate;
  w.gantiPenggunaKazka = switchUser;
  w.renderTeacherDashboard = renderTeacherDashboard;
  w.applyKazkaProfile = applyProfile;
  w.kazkaGetTeacherStudents = teacherStudents;

  document.addEventListener('DOMContentLoaded', () => {
    // Always show the role chooser on a fresh page load.
    // The selected profile is used only while the current session is active;
    // this avoids silently opening the next user into the previous user's area.
    localStorage.removeItem(STORAGE_KEY);
    w.kazkaProfile = null;
    w.kazkaPendingEntryRole = null;
    w.isKazkaAdminUnlocked = false;
    document.body.classList.remove('teacher-mode','admin-mode');
    document.getElementById('activeProfilePill')?.classList.add('hidden');
    resetWorkspace();
    showGate();

    const oldRenderAll = w.renderAll;
    w.renderAll = function () {
      if (typeof oldRenderAll === 'function') oldRenderAll();
      if (current()?.role === 'guru') renderTeacherDashboard();
      // Keep the entry selector visible only before a profile is selected.
      if (!current()) showGate();
    };
  });
})(window);

/* Stage 10.21 — Pengajuan anak Guru disimpan bersama di Firebase agar Guru/Admin lintas perangkat sinkron. */
(function(w){
  const PATH='pengajuan_anak';
  let actionBusy=false;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const hariNama={0:'Minggu',1:'Senin',2:'Selasa',3:'Rabu',4:'Kamis',5:'Jumat',6:'Sabtu'};
  const jarakNama={kurang_7:'< 7 km',7_10:'7–10 km',lebih_10:'> 10 km'};
  const listPengajuan=()=>Array.isArray(w.dataPengajuanAnak)?w.dataPengajuanAnak:[];

  function resetForm(){
    ['pengajuanNamaAnak','pengajuanCatatanAnak'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    ['pengajuanKegiatanAnak','pengajuanHariAnak','pengajuanJarakAnak'].forEach(id=>{const el=document.getElementById(id);if(el)el.selectedIndex=0;});
    const paket=document.getElementById('pengajuanPaketAnak'); if(paket)paket.value='4';
    const jm=document.getElementById('pengajuanJamMulai'); if(jm)jm.value='16:00';
    const js=document.getElementById('pengajuanJamSelesai'); if(js)js.value='17:30';
  }

  w.bukaModalPengajuanAnakGuru=()=>document.getElementById('modalPengajuanAnakGuru')?.classList.remove('hidden');
  w.tutupModalPengajuanAnakGuru=()=>document.getElementById('modalPengajuanAnakGuru')?.classList.add('hidden');
  w.kirimPengajuanAnakGuru=async()=>{
    const profile=w.kazkaProfile;
    if(!profile || profile.role!=='guru'){alert('Akses Guru tidak ditemukan. Silakan pilih profil Guru terlebih dahulu.');return;}
    if(!w.kazkaDb){alert('Koneksi data belum siap. Silakan coba lagi sebentar.');return;}
    const nama=document.getElementById('pengajuanNamaAnak')?.value.trim();
    const kegiatan=document.getElementById('pengajuanKegiatanAnak')?.value||'';
    const paket=Math.max(1, parseInt(document.getElementById('pengajuanPaketAnak')?.value || '4', 10) || 4);
    const hari=Number(document.getElementById('pengajuanHariAnak')?.value ?? 1);
    const jamMulai=document.getElementById('pengajuanJamMulai')?.value||'';
    const jamSelesai=document.getElementById('pengajuanJamSelesai')?.value||'';
    const jarak=document.getElementById('pengajuanJarakAnak')?.value||'kurang_7';
    const catatan=document.getElementById('pengajuanCatatanAnak')?.value.trim()||'';
    if(!nama){alert('Nama anak wajib diisi.');return;}
    if(!kegiatan){alert('Pilih kegiatan / mapel terlebih dahulu.');return;}
    if(!Number.isInteger(paket) || paket < 1){alert('Paket pertemuan harus berupa angka minimal 1 sesi.');return;}
    if(!jamMulai || !jamSelesai){alert('Jam mulai dan jam selesai wajib diisi.');return;}
    if(jamSelesai<=jamMulai){alert('Jam selesai harus lebih besar dari jam mulai.');return;}
    const duplicate=listPengajuan().some(x=>x.status==='menunggu' && String(x.guruId)===String(profile.id) && String(x.nama||'').trim().toLowerCase()===nama.toLowerCase());
    if(duplicate){alert('Pengajuan anak dengan nama tersebut masih menunggu persetujuan Admin.');return;}
    try{
      await w.kazkaDb.push(w.kazkaDb.ref(w.kazkaDb.db,PATH),{
        nama,kegiatan,paket,jarak,hari,jamMulai,jamSelesai,catatan,
        guruId:profile.id||'',guru:profile.name||'',status:'menunggu',jadwalAktif:false,createdAt:new Date().toISOString()
      });
      w.tutupModalPengajuanAnakGuru();
      resetForm();
      alert('Pengajuan sudah dikirim ke Admin. Jadwal masih berupa usulan dan belum masuk kalender.');
    }catch(e){console.error(e);alert('Gagal mengirim pengajuan: '+(e?.message||'koneksi bermasalah')+'. Silakan coba lagi.');}
  };

  function renderAdminRequests(){
    const host=document.getElementById('kazkaAdminPengajuanList'); if(!host)return;
    const pending=listPengajuan().filter(x=>x.status==='menunggu');
    const escHtml=v=>esc(v??'');
    const count=pending.length;
    const header=`
      <div class="px-5 sm:px-7 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="min-w-0">
            <span class="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Approval &amp; Penempatan</span>
            <h2 class="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">Pengajuan Anak dari Guru</h2>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Periksa usulan Guru sebelum anak masuk ke Data Anak. Fee dan aktivasi jadwal tetap dikendalikan Admin.</p>
          </div>
          <div class="shrink-0 flex items-center gap-2 self-start lg:self-center"><div class="min-w-[78px] rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-center"><div class="text-[9px] uppercase tracking-wider font-extrabold text-amber-600">Menunggu</div><div class="text-xl leading-none font-black text-amber-700 mt-1">${count}</div></div></div>
        </div>
      </div>`;
    if(!pending.length){
      host.innerHTML=`<div class="w-full bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">${header}<div class="w-full overflow-x-auto"><table class="w-full table-fixed text-left text-xs"><colgroup><col style="width:27%"><col style="width:18%"><col style="width:17%"><col style="width:23%"><col style="width:15%"></colgroup><thead class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 sm:px-5 py-3.5 font-bold">Nama Anak / Guru</th><th class="px-4 py-3.5 font-bold">Kegiatan</th><th class="px-4 py-3.5 font-bold">Usulan Jadwal</th><th class="px-4 py-3.5 font-bold">Catatan</th><th class="px-4 sm:px-5 py-3.5 font-bold text-right">Aksi</th></tr></thead><tbody><tr><td colspan="5" class="px-6 py-10 text-center border-b border-slate-100 dark:border-slate-800"><div class="mx-auto w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">✓</div><p class="mt-3 text-sm font-extrabold text-slate-800 dark:text-slate-100">Tidak ada pengajuan yang menunggu</p><p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Pengajuan baru dari Guru akan muncul di sini.</p></td></tr></tbody></table></div><div class="px-4 sm:px-5 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800"><p class="text-[10px] text-slate-500 dark:text-slate-400"><span class="font-bold text-slate-700 dark:text-slate-200">Catatan:</span> pengajuan baru dari Guru akan tersinkron otomatis ke perangkat Admin.</p></div></div>`;
      return;
    }
    const rows=pending.map(r=>`<tr class="border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors align-middle"><td class="px-4 sm:px-5 py-4"><div class="flex items-center gap-3 min-w-0"><div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shrink-0">${escHtml((r.nama||'?').charAt(0).toUpperCase())}</div><div class="min-w-0"><div class="font-extrabold text-slate-900 dark:text-white text-[12px] truncate">${escHtml(r.nama)}</div><div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">Guru: ${escHtml(r.guru||'-')}</div></div></div></td><td class="px-4 py-4"><span class="inline-flex items-center rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5 text-[10px] font-extrabold text-amber-700">${escHtml(r.kegiatan||'-')}</span><div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">Jarak ${escHtml(jarakNama[r.jarak]||r.jarak||'-')} · Paket ${escHtml(r.paket||4)} sesi</div></td><td class="px-4 py-4"><div class="font-bold text-slate-800 dark:text-slate-200 text-[11px]">${escHtml(hariNama[r.hari]||'-')}</div><div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">${escHtml(r.jamMulai||'--:--')} – ${escHtml(r.jamSelesai||'--:--')}</div></td><td class="px-4 py-4">${r.catatan?`<div class="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-normal line-clamp-2">${escHtml(r.catatan)}</div>`:'<span class="text-[10px] text-slate-400">Tidak ada catatan</span>'}</td><td class="px-4 sm:px-5 py-4"><div class="flex flex-wrap lg:flex-nowrap justify-end gap-2"><button class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2.5 text-[10px] font-extrabold shadow-sm transition-all whitespace-nowrap" onclick="setujuiPengajuanAnak('${escHtml(r.id)}')">✓ Setujui</button><button class="bg-rose-600 hover:bg-rose-700 border border-rose-600 hover:border-rose-700 text-white rounded-xl px-3.5 py-2.5 text-[10px] font-extrabold transition-all whitespace-nowrap" onclick="tolakPengajuanAnak('${escHtml(r.id)}')">Tolak</button></div></td></tr>`).join('');
    host.innerHTML=`<div class="w-full bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">${header}<div class="overflow-x-auto"><table class="w-full table-fixed text-left text-xs"><colgroup><col style="width:27%"><col style="width:18%"><col style="width:17%"><col style="width:23%"><col style="width:15%"></colgroup><thead class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 sm:px-5 py-3.5 font-bold">Nama Anak / Guru</th><th class="px-4 py-3.5 font-bold">Kegiatan</th><th class="px-4 py-3.5 font-bold">Usulan Jadwal</th><th class="px-4 py-3.5 font-bold">Catatan</th><th class="px-4 sm:px-5 py-3.5 font-bold text-right">Aksi</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800/70">${rows}</tbody></table></div><div class="px-4 sm:px-5 py-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800"><p class="text-[10px] text-slate-500 dark:text-slate-400"><span class="font-bold text-slate-700 dark:text-slate-200">Catatan:</span> menyetujui anak belum mengaktifkan jadwal di kalender. Data fee dan jadwal tetap perlu diselesaikan oleh Admin.</p></div></div>`;
  }

  w.setujuiPengajuanAnak=async id=>{
    if(actionBusy)return;
    const req=listPengajuan().find(x=>String(x.id)===String(id)); if(!req)return;
    if(req.status!=='menunggu')return;
    if(!confirm('Setujui anak ini? Setelah disetujui, data anak masuk ke Data Anak tetapi jadwal belum masuk kalender.'))return;
    if(!w.kazkaDb){alert('Koneksi data belum siap. Silakan coba lagi.');return;}
    actionBusy=true;
    const guru=(w.dataGuru||[]).find(g=>String(g.id)===String(req.guruId));
    const jadwalMingguan=[{hari:Number(req.hari),jamMulai:req.jamMulai||'',jamSelesai:req.jamSelesai||''}];
    const data={anak:req.nama,kegiatan:req.kegiatan,jarak:req.jarak,guru:req.guru||guru?.nama||'',guruId:req.guruId||guru?.id||'',tipeHarga:'baru',wilayah:'',paket:Math.max(1,Number(req.paket||4)),manualFee:0,terisi:0,jadwalMingguan,sesiList:{},sudahMasukRekap:false,catatanPengajuan:req.catatan||'',jadwalAktif:false,createdAt:Date.now()};
    try{
      // Buat ID siswa lalu lakukan penambahan siswa + penghapusan pengajuan dalam satu update root.
      // Ini mencegah kasus klik ganda / koneksi putus di tengah proses yang dapat membuat data anak ganda.
      const studentRef=w.kazkaDb.push(w.kazkaDb.ref(w.kazkaDb.db,'siswa'));
      const siswaId=studentRef?.key||'';
      if(!siswaId)throw new Error('ID anak tidak berhasil dibuat.');
      const changes={};
      changes[`siswa/${siswaId}`]=data;
      changes[`${PATH}/${id}`]=null;
      await w.kazkaDb.update(w.kazkaDb.ref(w.kazkaDb.db),changes);
      if(typeof w.renderAll==='function')w.renderAll();
      alert(`Anak disetujui dengan paket awal ${data.paket} sesi. Silakan lengkapi fee/data lainnya. Jadwal belum masuk kalender.`);
    }catch(e){console.error(e);alert('Gagal menyetujui pengajuan: '+(e?.message||'koneksi bermasalah')+'. Tidak ada perubahan yang dianggap berhasil.');}
    finally{actionBusy=false;}
  };

  w.tolakPengajuanAnak=async id=>{
    if(actionBusy)return;
    const req=listPengajuan().find(x=>String(x.id)===String(id)); if(!req)return;
    const reason=prompt('Alasan penolakan (opsional):','');
    if(reason===null)return;
    if(!w.kazkaDb){alert('Koneksi data belum siap. Silakan coba lagi.');return;}
    actionBusy=true;
    try{
      await w.kazkaDb.remove(w.kazkaDb.ref(w.kazkaDb.db,`${PATH}/${id}`));
      renderAdminRequests();
      alert('Pengajuan ditolak dan dikeluarkan dari daftar.');
    }catch(e){console.error(e);alert('Gagal menolak pengajuan: '+(e?.message||'koneksi bermasalah')+'.');}
    finally{actionBusy=false;}
  };

  function ensurePanel(){
    if(document.getElementById('kazkaAdminPengajuanPanel'))return;
    const page=document.getElementById('page-anak');if(!page)return;
    const panel=document.createElement('div');panel.id='kazkaAdminPengajuanPanel';panel.className='mb-4';panel.innerHTML='<div id="kazkaAdminPengajuanList"></div>';page.prepend(panel);
  }
  const oldApply=w.applyKazkaProfile;
  w.applyKazkaProfile=function(profile){oldApply&&oldApply(profile);if(profile?.role==='admin'){ensurePanel();renderAdminRequests();}else{document.getElementById('kazkaAdminPengajuanPanel')?.remove();}};
  document.addEventListener('DOMContentLoaded',()=>{
    if(w.kazkaProfile?.role==='admin'){ensurePanel();renderAdminRequests();}
    w.dataPengajuanAnak=[];
    if(w.kazkaDb?.onValue){
      w.kazkaDb.onValue(w.kazkaDb.ref(w.kazkaDb.db,PATH),snapshot=>{
        const data=snapshot.val();
        w.dataPengajuanAnak=data?Object.keys(data).map(id=>({id,...data[id]})):[];
        renderAdminRequests();
      });
    }
  });
})(window);
