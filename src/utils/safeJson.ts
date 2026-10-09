export interface SafeJsonResult<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: 'TRANSPORT_RESPONSE_NOT_JSON' | 'JSON_PARSE_FAILURE' | string;
    message: string;
    status: number;
    contentType: string;
    requestId?: string;
    route?: string;
    responsePreview?: string;
  };
}

/**
 * Truncate và sanitize chuỗi preview (tối đa ~200 ký tự), không để lộ HTML thô vào UI/DOM
 */
export function sanitizeResponsePreview(rawText: string, maxLength: number = 200): string {
  if (!rawText) return '';
  // Gỡ bỏ tag HTML cơ bản nếu có để tránh script/markup injection
  const stripped = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (stripped.length <= maxLength) {
    return stripped;
  }
  return stripped.substring(0, maxLength) + '...';
}

/**
 * Kiểm tra xem Header Content-Type có phải là JSON chuẩn hay không
 * Chấp nhận: application/json, application/problem+json, application/vnd.api+json, v.v.
 */
export function isJsonContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase().trim();
  const mime = lower.split(';')[0].trim();
  return (
    mime === 'application/json' ||
    mime.endsWith('+json') ||
    mime === 'text/json'
  );
}

/**
 * Đọc và parse phản hồi JSON an toàn với Content-Type guard:
 * 1. Đọc status
 * 2. Đọc Content-Type
 * 3. Nếu là JSON (+json) -> parse JSON
 * 4. Nếu non-JSON (VD: HTML fallback/gateway) -> đọc text có giới hạn, tạo typed error TRANSPORT_RESPONSE_NOT_JSON
 * 5. KHÔNG để SyntaxError từ JSON.parse trở thành error không kiểm soát
 */
export async function parseJsonResponseSafely<T = any>(
  response: Response,
  options?: {
    route?: string;
    requestId?: string;
  }
): Promise<SafeJsonResult<T>> {
  const status = response.status;
  const contentType = response.headers.get('content-type') || '';
  const requestId =
    options?.requestId ||
    response.headers.get('x-ac-request-id') ||
    response.headers.get('x-request-id') ||
    undefined;
  const route = options?.route;

  // Kiểm tra Content-Type
  if (!isJsonContentType(contentType)) {
    let preview = '';
    try {
      const rawText = await response.text();
      preview = sanitizeResponsePreview(rawText, 200);
    } catch {
      preview = '(không thể đọc nội dung phản hồi)';
    }

    return {
      ok: false,
      error: {
        code: 'TRANSPORT_RESPONSE_NOT_JSON',
        message: 'Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại.',
        status,
        contentType,
        requestId,
        route,
        responsePreview: preview,
      },
    };
  }

  // Content-Type là JSON, tiến hành parse
  let text = '';
  try {
    text = await response.text();
  } catch (readErr: any) {
    return {
      ok: false,
      error: {
        code: 'TRANSPORT_READ_FAILURE',
        message: 'Không thể đọc dữ liệu phản hồi từ máy chủ.',
        status,
        contentType,
        requestId,
        route,
      },
    };
  }

  try {
    const data = JSON.parse(text) as T;
    return {
      ok: true,
      data,
    };
  } catch (parseErr: any) {
    return {
      ok: false,
      error: {
        code: 'JSON_PARSE_FAILURE',
        message: 'Máy chủ trả về dữ liệu JSON không hợp lệ.',
        status,
        contentType,
        requestId,
        route,
        responsePreview: sanitizeResponsePreview(text, 200),
      },
    };
  }
}
