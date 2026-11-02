/**
 * Automatic Invoice Number Generator
 * Format: OJ/YY-MMNN
 * Examples:
 *   - OJ/26-1101
 *   - OJ/26-1102
 *   - OJ/26-1103
 *   - OJ/26-1201
 *   - OJ/27-0101
 * 
 * Rules:
 * - OJ is the configurable company prefix.
 * - YY is the last two digits of the year (2 digits).
 * - MM is the invoice month (2 digits).
 * - NN is a two-digit monthly sequential number, padded with zeros (01, 02, ... 99).
 * - Resets sequence every month.
 */

export interface ParsedSequenceDetails {
  prefix: string;
  year: number; // e.g. 26
  month: number; // e.g. 11
  formattedMonth: string; // "11"
  formattedYear: string; // "26"
}

export function parseDateForSequence(prefix: string, dateInput?: string | Date): ParsedSequenceDetails {
  const d = dateInput ? new Date(dateInput) : new Date();
  const cleanPrefix = (prefix || 'OJ').trim().toUpperCase();

  const monthNum = d.getMonth() + 1;
  const fullYear = d.getFullYear();
  const year2Digit = fullYear % 100;

  const formattedMonth = String(monthNum).padStart(2, '0');
  const formattedYear = String(year2Digit).padStart(2, '0');

  return {
    prefix: cleanPrefix,
    year: year2Digit,
    month: monthNum,
    formattedMonth,
    formattedYear,
  };
}

export function formatInvoiceNumber(
  prefix: string,
  formattedMonth: string,
  formattedYear: string,
  seq: number
): string {
  const formattedSeq = String(seq).padStart(2, '0');
  return `${prefix}/${formattedYear}-${formattedMonth}${formattedSeq}`;
}
