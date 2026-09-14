/* Kazka Edu — Stage 4.1: dependency-free UI helpers only. */
(function (w) {
  w.getStatusBadge = function (sisa) {
    if (sisa <= 0) return '<span class="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">Habis</span>';
    if (sisa === 1) return '<span class="bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Perhatian</span>';
    return '<span class="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Aman</span>';
  };
  w.formatRupiah = function (angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka || 0);
  };
})(window);
