/* Kazka Edu — Stage 4.7: Guru grid renderer only. */
(function (w) {
  w.renderGridGuru = function () {
      const grid = document.getElementById('gridGuru');
      if(!grid) return;
      grid.innerHTML = '';

      window.dataGuru.forEach(g => {
        let mapelList = (g.mapel || []).map(m => `<span class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-medium">${m}</span>`).join(' ');

        let fotoHtml = g.fotoUrl ? 
          `<img src="${g.fotoUrl}" alt="${g.nama}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-amber-500/30 shadow-inner flex-shrink-0">` : 
          `<div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-base shadow-inner flex-shrink-0">👨‍🏫</div>`;

        grid.innerHTML += `
          <div class="bg-white dark:bg-[#1e293b] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm">
            <div class="space-y-2.5">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  ${fotoHtml}
                  <div>
                    <h3 class="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">${g.nama}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">📞 ${g.hp || '-'}</p>
                  </div>
                </div>
                <div class="flex gap-1">
                  <button onclick="bukaModalEditGuru('${g.id}')" class="bg-sky-500/10 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white p-1.5 rounded-xl text-xs transition-all" title="Edit Guru">✏️</button>
                  <button onclick="hapusGuru('${g.id}', '${g.fotoFilePath || ''}')" class="bg-red-500/10 hover:bg-red-500 text-red-500 dark:text-red-400 hover:text-white p-1.5 rounded-xl text-xs transition-all" title="Hapus Guru">🗑️</button>
                </div>
              </div>
              <div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Mata Pelajaran:</p>
                <div class="flex flex-wrap gap-1">${mapelList || '-'}</div>
              </div>
            </div>
          </div>
        `;
      });
  };

})(window);
