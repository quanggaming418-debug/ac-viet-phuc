/**
 * Safe client-side fetch wrapper
 * Sử dụng native fetch hiện hữu trong window/globalThis mà không bao giờ gán đè,
 * mutate hoặc monkey-patch window.fetch.
 */

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 120000, ...fetchOptions } = options;

  // Sử dụng window.fetch hoặc globalThis.fetch gốc
  const nativeFetch =
    typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? window.fetch.bind(window)
      : typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function'
      ? globalThis.fetch.bind(globalThis)
      : null;

  if (!nativeFetch) {
    throw new Error('Môi trường trình duyệt không hỗ trợ Fetch API.');
  }

  // Tùy chọn timeout qua AbortController
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal
    ? (options.signal as AbortSignal)
    : controller.signal;

  try {
    const response = await nativeFetch(url, {
      ...fetchOptions,
      signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Yêu cầu bị quá hạn thời gian chờ (timeout).');
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
