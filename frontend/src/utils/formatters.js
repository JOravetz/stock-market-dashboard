/**
 * Formats a number with the specified number of decimal places
 */
export const formatNumber = (num, decimals = 2) => {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formats a large number with K/M/B suffixes
 */
export const formatLargeNumber = (num) => {
  if (num >= 1e9) {
    return formatNumber(num / 1e9, 2) + 'B';
  } else if (num >= 1e6) {
    return formatNumber(num / 1e6, 2) + 'M';
  } else if (num >= 1e3) {
    return formatNumber(num / 1e3, 2) + 'K';
  }
  return formatNumber(num);
};

/**
 * Formats a price with currency symbol and decimal places
 */
export const formatPrice = (price) => {
  return `$${formatNumber(price, 2)}`;
};

/**
 * Formats a percentage with +/- sign and decimal places
 */
export const formatPercentage = (percent, decimals = 2) => {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${formatNumber(percent, decimals)}%`;
};

/**
 * Formats a timestamp into a readable date/time string
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Formats a volume number based on its magnitude
 */
export const formatVolume = (volume) => {
  return formatLargeNumber(volume);
};

/**
 * Returns a CSS color class based on the value (positive/negative)
 */
export const getValueColorClass = (value) => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};
