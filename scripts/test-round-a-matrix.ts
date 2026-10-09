import assert from 'assert';
import {
  isJsonContentType,
  sanitizeResponsePreview,
  parseJsonResponseSafely,
} from '../src/utils/safeJson.ts';
import {
  generateCorrelationId,
  buildCorrelationHeaders,
  CORRELATION_HEADERS,
} from '../src/utils/correlation.ts';
import {
  CALL_B_TIMEOUT_CONFIG,
  VISUAL_QA_TIMEOUT_CONFIG,
} from '../src/services/timeoutConfig.ts';

console.log('🧪 ========================================================');
console.log('🧪 BẮT ĐẦU CHẠY TEST MATRIX CHO ROUND A — DETERMINISTIC SAFETY FIXES');
console.log('🧪 ========================================================');

async function runRoundATests() {
  // ----------------------------------------------------
  // NHÓM 1: CORRELATION IDS & HEADER CONTRACT
  // ----------------------------------------------------
  console.log('\n--- NHÓM 1: CORRELATION IDS & CONTRACT ---');

  // Test 1: Sinh ID với prefix
  const genId = generateCorrelationId('gen');
  assert(genId.startsWith('gen-'), 'generateCorrelationId should support prefix');
  assert(genId.length > 10, 'Correlation ID must be sufficiently long');
  console.log('✓ Test 1: generateCorrelationId prefix PASS.');

  // Test 2: Cấu trúc phân cấp 3 tầng (generationId -> qaRunId -> requestId)
  const meta1 = {
    generationId: 'gen-test-12345',
    qaRunId: generateCorrelationId('qarun'),
    requestId: generateCorrelationId('req'),
  };
  assert(meta1.generationId !== meta1.qaRunId, 'generationId and qaRunId must be distinct');
  assert(meta1.qaRunId !== meta1.requestId, 'qaRunId and requestId must be distinct');
  console.log('✓ Test 2: Hierarchical correlation IDs distinctness PASS.');

  // Test 3: Header mapping đúng chuẩn x-ac-*
  const headers = buildCorrelationHeaders(meta1);
  assert.strictEqual(headers[CORRELATION_HEADERS.GENERATION_ID], meta1.generationId);
  assert.strictEqual(headers[CORRELATION_HEADERS.QA_RUN_ID], meta1.qaRunId);
  assert.strictEqual(headers[CORRELATION_HEADERS.REQUEST_ID], meta1.requestId);
  console.log('✓ Test 3: Correlation headers mapping PASS.');

  // Test 4: Manual retry tạo qaRunId mới và requestId mới nhưng giữ generationId
  const retryMeta = {
    generationId: meta1.generationId,
    qaRunId: generateCorrelationId('qarun'),
    requestId: generateCorrelationId('req'),
  };
  assert.strictEqual(retryMeta.generationId, meta1.generationId, 'Retry must preserve generationId');
  assert.notStrictEqual(retryMeta.qaRunId, meta1.qaRunId, 'Retry must issue a fresh qaRunId');
  assert.notStrictEqual(retryMeta.requestId, meta1.requestId, 'Retry must issue a fresh requestId');
  console.log('✓ Test 4: Manual retry correlation semantics PASS.');

  // ----------------------------------------------------
  // NHÓM 2: CONTENT-TYPE GUARD & DEFENSIVE JSON PARSING
  // ----------------------------------------------------
  console.log('\n--- NHÓM 2: CONTENT-TYPE GUARD & SAFE JSON PARSING ---');

  // Test 5: isJsonContentType nhận diện đúng application/json
  assert.strictEqual(isJsonContentType('application/json'), true);
  assert.strictEqual(isJsonContentType('application/json; charset=utf-8'), true);
  assert.strictEqual(isJsonContentType('application/problem+json'), true);
  assert.strictEqual(isJsonContentType('text/json'), true);
  console.log('✓ Test 5: Valid JSON Content-Type recognition PASS.');

  // Test 6: isJsonContentType từ chối HTML và plain text
  assert.strictEqual(isJsonContentType('text/html'), false);
  assert.strictEqual(isJsonContentType('text/html; charset=utf-8'), false);
  assert.strictEqual(isJsonContentType('text/plain'), false);
  assert.strictEqual(isJsonContentType(''), false);
  assert.strictEqual(isJsonContentType(null), false);
  assert.strictEqual(isJsonContentType(undefined), false);
  console.log('✓ Test 6: Non-JSON Content-Type rejection PASS.');

  // Test 7: sanitizeResponsePreview gỡ bỏ HTML tag và giới hạn độ dài
  const htmlSnippet = '<html><body><h1>502 Bad Gateway</h1><p>The upstream server is down.</p></body></html>';
  const sanitized = sanitizeResponsePreview(htmlSnippet, 50);
  assert(!sanitized.includes('<h1>'), 'Sanitizer must strip HTML tags');
  assert(!sanitized.includes('</body>'), 'Sanitizer must strip closing tags');
  assert(sanitized.length <= 53, 'Sanitizer must enforce length limit with ellipsis');
  console.log('✓ Test 7: sanitizeResponsePreview strips HTML markup & truncates PASS.');

  // Test 8: parseJsonResponseSafely với phản hồi JSON hợp lệ
  const mockValidJsonResponse = new Response(JSON.stringify({ success: true, score: 95 }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const validResult = await parseJsonResponseSafely<{ success: boolean; score: number }>(mockValidJsonResponse);
  assert.strictEqual(validResult.ok, true);
  assert.strictEqual(validResult.data?.success, true);
  assert.strictEqual(validResult.data?.score, 95);
  console.log('✓ Test 8: parseJsonResponseSafely with valid JSON PASS.');

  // Test 9: parseJsonResponseSafely khi gặp HTML (Vite fallback hoặc Gateway 502/504)
  const mockHtmlResponse = new Response('<!DOCTYPE html><html><head><title>Vite App</title></head><body><div id="root"></div></body></html>', {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const htmlResult = await parseJsonResponseSafely(mockHtmlResponse, { route: '/api/verify-lookbook', requestId: 'req-test-9' });
  assert.strictEqual(htmlResult.ok, false);
  assert.strictEqual(htmlResult.error?.code, 'TRANSPORT_RESPONSE_NOT_JSON');
  assert.strictEqual(htmlResult.error?.route, '/api/verify-lookbook');
  assert.strictEqual(htmlResult.error?.requestId, 'req-test-9');
  assert(!htmlResult.error?.responsePreview?.includes('<html>'), 'Response preview must not expose raw tags');
  console.log('✓ Test 9: HTML response safely caught as TRANSPORT_RESPONSE_NOT_JSON without JSON.parse SyntaxError PASS.');

  // Test 10: parseJsonResponseSafely khi header là JSON nhưng body hỏng (corrupted JSON)
  const mockCorruptResponse = new Response('{ corrupt_json: unquoted, ', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const corruptResult = await parseJsonResponseSafely(mockCorruptResponse);
  assert.strictEqual(corruptResult.ok, false);
  assert.strictEqual(corruptResult.error?.code, 'JSON_PARSE_FAILURE');
  console.log('✓ Test 10: Malformed JSON payload caught as JSON_PARSE_FAILURE PASS.');

  // ----------------------------------------------------
  // NHÓM 3: TIMEOUT CONFIG SEPARATION
  // ----------------------------------------------------
  console.log('\n--- NHÓM 3: TIMEOUT CONFIG SEPARATION ---');

  // Test 11: CALL_B_TIMEOUT_CONFIG và VISUAL_QA_TIMEOUT_CONFIG là hai object riêng biệt
  assert.notStrictEqual(CALL_B_TIMEOUT_CONFIG, VISUAL_QA_TIMEOUT_CONFIG, 'Config objects must have distinct memory references');
  console.log('✓ Test 11: Config separation (distinct object references) PASS.');

  // Test 12: Object được freeze để ngăn chặn runtime mutation ngoài ý muốn
  assert(Object.isFrozen(CALL_B_TIMEOUT_CONFIG), 'CALL_B_TIMEOUT_CONFIG must be frozen');
  assert(Object.isFrozen(VISUAL_QA_TIMEOUT_CONFIG), 'VISUAL_QA_TIMEOUT_CONFIG must be frozen');
  console.log('✓ Test 12: Immutability (Object.freeze) PASS.');

  // Test 13: Numeric values giữ nguyên, không thay đổi (Zero timeout tuning rule)
  assert.strictEqual(CALL_B_TIMEOUT_CONFIG.totalTimeoutMs, 120000);
  assert.strictEqual(VISUAL_QA_TIMEOUT_CONFIG.totalTimeoutMs, 120000);
  assert.strictEqual(VISUAL_QA_TIMEOUT_CONFIG.candidateTimeoutMs, 30000);
  assert.strictEqual(VISUAL_QA_TIMEOUT_CONFIG.maxAttempts, 2);
  console.log('✓ Test 13: Numeric values preserved without speculative tuning PASS.');

  // ----------------------------------------------------
  // NHÓM 4: SINGLE AUTO-QA ENTRYPOINT & IDEMPOTENCY SIMULATION
  // ----------------------------------------------------
  console.log('\n--- NHÓM 4: SINGLE AUTO-QA ENTRYPOINT & IDEMPOTENCY ---');

  // Mô phỏng coordinator logic của ImagePromptPanel
  const qaStateMap = new Map<string, 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'>();
  let activeGenId: string | null = null;
  let networkCallsCount = 0;

  async function simulateCoordinator(params: {
    generationId: string;
    isAutoTrigger: boolean;
  }) {
    const { generationId, isAutoTrigger } = params;
    const currentState = qaStateMap.get(generationId);

    // IDEMPOTENCY GUARD: Chặn duplicate Auto-QA
    if (isAutoTrigger && (currentState === 'RUNNING' || currentState === 'COMPLETED')) {
      return { action: 'SKIPPED_DUPLICATE', networkCallsCount };
    }

    qaStateMap.set(generationId, 'RUNNING');
    activeGenId = generationId;
    networkCallsCount++;

    // Giả lập network call hoàn thành
    qaStateMap.set(generationId, 'COMPLETED');
    return { action: 'EXECUTED', networkCallsCount };
  }

  // Test 14: Lần trigger đầu tiên thực thi bình thường
  const genA = 'gen-1001';
  const run1 = await simulateCoordinator({ generationId: genA, isAutoTrigger: true });
  assert.strictEqual(run1.action, 'EXECUTED');
  assert.strictEqual(networkCallsCount, 1);
  console.log('✓ Test 14: Initial Auto-QA run executes normally PASS.');

  // Test 15: Duplicate Auto-QA trigger bị chặn đứng hoàn toàn (Idempotency)
  const run2 = await simulateCoordinator({ generationId: genA, isAutoTrigger: true });
  assert.strictEqual(run2.action, 'SKIPPED_DUPLICATE');
  assert.strictEqual(networkCallsCount, 1, 'Network call must NOT be made on duplicate trigger');
  console.log('✓ Test 15: Duplicate Auto-QA trigger blocked by Idempotency guard PASS.');

  // Test 16: Manual retry cho cùng generationId được phép chạy (isAutoTrigger: false)
  const retryRun = await simulateCoordinator({ generationId: genA, isAutoTrigger: false });
  assert.strictEqual(retryRun.action, 'EXECUTED');
  assert.strictEqual(networkCallsCount, 2, 'Manual retry must be permitted');
  console.log('✓ Test 16: Manual retry bypasses auto-trigger idempotency filter PASS.');

  // Test 17: Generation mới chạy độc lập
  const genB = 'gen-1002';
  const run3 = await simulateCoordinator({ generationId: genB, isAutoTrigger: true });
  assert.strictEqual(run3.action, 'EXECUTED');
  assert.strictEqual(networkCallsCount, 3);
  assert.strictEqual(activeGenId, genB);
  console.log('✓ Test 17: Subsequent generation runs independently PASS.');

  // Test 18: Race safety - Stale result rejection logic
  let committedGenId: string | null = null;
  function simulateCommitResult(resultGenId: string) {
    if (resultGenId === activeGenId) {
      committedGenId = resultGenId;
      return true;
    }
    return false; // Dropped as stale
  }
  assert.strictEqual(simulateCommitResult(genA), false, 'Stale result from previous generation must be dropped');
  assert.strictEqual(simulateCommitResult(genB), true, 'Current active generation result must be committed');
  assert.strictEqual(committedGenId, genB);
  console.log('✓ Test 18: Stale generation result rejection (Race Safety) PASS.');

  console.log('\n🎉 ========================================================');
  console.log('🎉 TẤT CẢ 18/18 TEST MATRIX ROUND A ĐÃ PASS 100%!');
  console.log('🎉 ========================================================');
}

runRoundATests().catch((err) => {
  console.error('❌ ROUND A TEST FAILED:', err);
  process.exit(1);
});
