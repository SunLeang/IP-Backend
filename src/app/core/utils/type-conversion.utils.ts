/**
 * Utility functions for type conversions
 */

/**
 * Convert string or boolean value to boolean
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns boolean value
 */
export const getBoolean = (
  value: string | boolean | undefined,
  defaultValue: boolean = false,
): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
};

/**
 * Convert string to number with fallback
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns number value
 */
export const getNumber = (
  value: string | number | undefined,
  defaultValue: number = 0,
): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};
