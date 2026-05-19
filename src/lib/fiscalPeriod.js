/**
 * Fiscal Period Utility
 * 
 * Mengkonversi bulan & tahun ke range tanggal fiscal custom.
 * Default: periode dimulai tanggal 4 (configurable via FISCAL_START_DAY env).
 * 
 * Contoh dengan FISCAL_START_DAY=4:
 *   getFiscalPeriod(2, 2026) → { start: Date(2026-02-04), end: Date(2026-03-03T23:59:59) }
 *   getFiscalPeriod(12, 2026) → { start: Date(2026-12-04), end: Date(2027-01-03T23:59:59) }
 */

const FISCAL_START_DAY = parseInt(process.env.FISCAL_START_DAY || '4', 10);

/**
 * Mendapatkan range tanggal fiscal untuk 1 bulan tertentu.
 * @param {number} month - Bulan (1-12)
 * @param {number} year - Tahun (e.g. 2026)
 * @returns {{ start: Date, end: Date }}
 */
export function getFiscalPeriod(month, year) {
  // Start: tanggal FISCAL_START_DAY di bulan yang dipilih
  const start = new Date(Date.UTC(year, month - 1, FISCAL_START_DAY, 0, 0, 0, 0));

  // End: tanggal (FISCAL_START_DAY - 1) di bulan berikutnya, jam 23:59:59.999
  let endMonth = month; // month is 1-based, but Date uses 0-based
  let endYear = year;
  if (month === 12) {
    endMonth = 1;
    endYear = year + 1;
  } else {
    endMonth = month + 1;
  }
  const end = new Date(Date.UTC(endYear, endMonth - 1, FISCAL_START_DAY - 1, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Mendapatkan range tanggal fiscal untuk 1 tahun penuh.
 * Contoh: getFiscalYear(2026) → 4 Jan 2026 s/d 3 Jan 2027
 * @param {number} year
 * @returns {{ start: Date, end: Date }}
 */
export function getFiscalYear(year) {
  const start = new Date(Date.UTC(year, 0, FISCAL_START_DAY, 0, 0, 0, 0)); // 4 Jan
  const end = new Date(Date.UTC(year + 1, 0, FISCAL_START_DAY - 1, 23, 59, 59, 999)); // 3 Jan next year
  return { start, end };
}

/**
 * Mendapatkan range tanggal fiscal untuk rentang multi-bulan.
 * Start = awal fiscal bulan pertama, End = akhir fiscal bulan terakhir.
 * @param {number} startMonth 
 * @param {number} startYear 
 * @param {number} endMonth 
 * @param {number} endYear 
 * @returns {{ start: Date, end: Date }}
 */
export function getFiscalRange(startMonth, startYear, endMonth, endYear) {
  const { start } = getFiscalPeriod(startMonth, startYear);
  const { end } = getFiscalPeriod(endMonth, endYear);

  // Auto swap if inverted
  if (start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

/**
 * Menentukan fiscal month dari sebuah tanggal.
 * Contoh dengan FISCAL_START_DAY=4:
 *   "2026-03-01" → { month: 2, year: 2026 }  (1 Mar masuk fiscal Februari)
 *   "2026-03-04" → { month: 3, year: 2026 }  (4 Mar masuk fiscal Maret)
 *   "2026-01-02" → { month: 12, year: 2025 } (2 Jan masuk fiscal Desember tahun lalu)
 * @param {Date|string} date 
 * @returns {{ month: number, year: number }}
 */
export function getFiscalMonthFromDate(date) {
  const d = new Date(date);
  const day = d.getUTCDate();
  let month = d.getUTCMonth() + 1; // 1-12
  let year = d.getUTCFullYear();

  // Jika tanggal sebelum FISCAL_START_DAY, berarti masih masuk bulan fiscal sebelumnya
  if (day < FISCAL_START_DAY) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return { month, year };
}

/**
 * Menghitung jumlah hari dalam sebuah fiscal period.
 * @param {number} month 
 * @param {number} year 
 * @returns {number}
 */
export function getFiscalDaysInPeriod(month, year) {
  const { start, end } = getFiscalPeriod(month, year);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
