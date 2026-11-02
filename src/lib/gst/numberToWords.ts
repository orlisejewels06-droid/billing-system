const ONES = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];

const TENS = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

function convertBelowThousand(n: number): string {
  let result = '';
  if (n >= 100) {
    result += ONES[Math.floor(n / 100)] + ' HUNDRED ';
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      result += ONES[n] + ' ';
    } else {
      result += TENS[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) {
        result += ONES[n % 10] + ' ';
      }
    }
  }
  return result.trim();
}

/**
 * Converts an Indian Rupee amount to standard uppercase words using the Indian numbering system
 * (Crores, Lakhs, Thousands, Hundreds).
 * Example: 1494554 -> "FOURTEEN LAKH NINETY FOUR THOUSAND FIVE HUNDRED FIFTY FOUR ONLY."
 */
export function amountToIndianWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'ZERO RUPEES ONLY.';
  }

  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  let num = integerPart;
  const parts: string[] = [];

  // Crores (>= 1,00,00,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    parts.push(convertBelowThousand(crores) + ' CRORE');
    num %= 10000000;
  }

  // Lakhs (>= 1,00,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    parts.push(convertBelowThousand(lakhs) + ' LAKH');
    num %= 100000;
  }

  // Thousands (>= 1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    parts.push(convertBelowThousand(thousands) + ' THOUSAND');
    num %= 1000;
  }

  // Hundreds, Tens and Units (< 1,000)
  if (num > 0) {
    parts.push(convertBelowThousand(num));
  }

  let words = parts.join(' ').replace(/\s+/g, ' ').trim();

  if (decimalPart > 0) {
    words += ` AND ${convertBelowThousand(decimalPart)} PAISE`;
  }

  return `${words} ONLY.`;
}
