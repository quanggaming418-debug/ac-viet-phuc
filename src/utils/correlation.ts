/**
 * Correlation IDs contract cho hệ thống AC (Round A — Deterministic Safety Fixes)
 * Cấu trúc phân cấp:
 * generationId (một lần tạo ảnh lookbook cụ thể)
 *   └── qaRunId (một lần thực thi QA cụ thể)
 *         └── requestId (một HTTP request cụ thể)
 */

/**
 * Sinh UUID v4 an toàn trong môi trường browser hoặc Node.js
 */
export function generateCorrelationId(prefix?: string): string {
  let uuid: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uuid = crypto.randomUUID();
  } else {
    // Fallback nếu môi trường không hỗ trợ crypto.randomUUID
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return prefix ? `${prefix}-${uuid}` : uuid;
}

export interface CorrelationMetadata {
  generationId: string;
  qaRunId: string;
  requestId: string;
}

export const CORRELATION_HEADERS = {
  GENERATION_ID: 'x-ac-generation-id',
  QA_RUN_ID: 'x-ac-qa-run-id',
  REQUEST_ID: 'x-ac-request-id',
} as const;

/**
 * Gắn correlation headers chuẩn vào options của fetch
 */
export function buildCorrelationHeaders(meta: CorrelationMetadata): Record<string, string> {
  return {
    [CORRELATION_HEADERS.GENERATION_ID]: meta.generationId,
    [CORRELATION_HEADERS.QA_RUN_ID]: meta.qaRunId,
    [CORRELATION_HEADERS.REQUEST_ID]: meta.requestId,
  };
}
