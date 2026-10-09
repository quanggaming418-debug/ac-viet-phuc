/**
 * Cấu hình Timeout tách bạch (Configuration Separation) cho Round A
 * Tách biệt rõ ràng ownership giữa Call-B (Recommendation/Generation) và Visual QA.
 *
 * QUY TẮC BẮT BUỘC ROUND A:
 * - KHÔNG tune timeout (giữ nguyên numeric values hiện tại).
 * - Tách độc lập object reference và namespace để tránh kế thừa ngầm.
 */

export interface TimeoutConfig {
  totalTimeoutMs: number;
  candidateTimeoutMs: number;
  retryDelayMs: number;
  maxAttempts: number;
}

/**
 * Cấu hình Timeout cho luồng Call-B (Recommendation / Generation)
 */
export const CALL_B_TIMEOUT_CONFIG: Readonly<TimeoutConfig> = Object.freeze({
  totalTimeoutMs: 120000,
  candidateTimeoutMs: 30000,
  retryDelayMs: 1000,
  maxAttempts: 2,
});

/**
 * Cấu hình Timeout cho luồng Visual QA (POST /api/qa-image hoặc /api/verify-lookbook)
 * Ownership hoàn toàn độc lập với CALL_B_TIMEOUT_CONFIG.
 * Round A giữ nguyên numeric values, không tune số.
 */
export const VISUAL_QA_TIMEOUT_CONFIG: Readonly<TimeoutConfig> = Object.freeze({
  totalTimeoutMs: 120000,
  candidateTimeoutMs: 30000,
  retryDelayMs: 1000,
  maxAttempts: 2,
});
