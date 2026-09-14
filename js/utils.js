/* Kazka Edu — Stage 5.5: shared common utilities.
 * Pure helpers only; no Firebase/Supabase access and no business logic.
 * Loaded before feature modules so existing globals remain available.
 */
(function (w) {
  w.pad2 = function (n) {
    return String(n).padStart(2, '0');
  };

  w.tanggalLocal = function (d) {
    return `${d.getFullYear()}-${w.pad2(d.getMonth() + 1)}-${w.pad2(d.getDate())}`;
  };

  w.formatTanggalID = function (v) {
    if (!v) return '-';
    const d = new Date(v + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  w.jamMenit = function (v) {
    return (v || '').slice(0, 5);
  };

  w.escapeHtml = function (v) {
    return String(v ?? '').replace(/[&<>'"]/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[c];
    });
  };

  w.namaHariMingguan = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
})(window);
