// Production-safe logger
const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  warn: (...args: any[]) => {
    if (isDevelopment) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) console.info(...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) console.debug(...args);
  }
};

// Performance monitoring utility
export function measurePerformance<T>(
  label: string,
  fn: () => T
): T {
  if (!isDevelopment) return fn();
  
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  logger.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Async performance monitoring
export async function measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isDevelopment) return await fn();
  
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  logger.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}
