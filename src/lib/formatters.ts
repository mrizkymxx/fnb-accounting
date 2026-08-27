export function formatRupiah(amount: number): string {
  const clean = isNaN(amount) ? 0 : Math.round(amount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(clean);
}

// Mendapatkan string tanggal lokal Indonesia (WIB - Asia/Jakarta) format YYYY-MM-DD
export function getLocalDateString(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
  } catch {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// Parse input string angka atau desimal (mendukung koma '0,5' dan titik '0.5', aman dari NaN)
export function parseNumberInput(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'string') {
    const sanitized = val.trim().replace(/,/g, '.');
    const parsed = Number(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    // Tangani format YYYY-MM-DD langsung agar tidak bergeser zona waktu
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(dueDateStr?: string): { days: number; isOverdue: boolean; label: string } {
  if (!dueDateStr) return { days: 0, isOverdue: false, label: '-' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return { days: 0, isOverdue: false, label: '-' };
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isOverdue: true, label: `Terlambat ${Math.abs(diffDays)} hari!` };
  } else if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Jatuh tempo HARI INI' };
  } else if (diffDays === 1) {
    return { days: 1, isOverdue: false, label: 'Besok jatuh tempo' };
  } else {
    return { days: diffDays, isOverdue: false, label: `${diffDays} hari lagi` };
  }
}
