/**
 * EvoLink Image Generation Service
 * Quản lý giao tiếp server-side với EvoLink API (https://api.evolink.ai)
 * Tuyệt đối không để lộ EVOLINK_API_KEY ra client hoặc logs.
 */

export interface EvoLinkConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  pollIntervalMs: number;
  timeoutMs: number;
}

export interface CreateTaskResult {
  taskId: string;
  immediateImageUrl?: string;
  status: string;
  model: string;
}

export interface TaskStatusResult {
  taskId: string;
  status: 'processing' | 'pending' | 'completed' | 'failed' | 'timeout';
  imageUrl?: string;
  error?: string;
  raw?: any;
}

export interface GenerateImageResult {
  success: boolean;
  taskId?: string;
  imageUrl?: string;
  model?: string;
  status?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface SafeError {
  code: string;
  message: string;
}

/**
 * Danh sách model tạo ảnh text-to-image mặc định và ưu tiên
 * Được xác minh thực tế từ endpoint GET /v1/models của EvoLink
 */
const DEFAULT_FALLBACK_MODEL = 'qwen-image-3.0-pro';

/**
 * Hàm làm sạch và che giấu (redact) tuyệt đối mọi secret từ chuỗi hoặc đối tượng lỗi
 */
export function sanitizeUpstreamError(raw: any, apiKey?: string): SafeError {
  let str = '';
  if (typeof raw === 'string') {
    str = raw;
  } else if (raw && typeof raw.message === 'string') {
    str = raw.message;
  } else if (raw && typeof raw.error === 'string') {
    str = raw.error;
  } else if (raw && raw.error && typeof raw.error.message === 'string') {
    str = raw.error.message;
  } else if (raw && raw.code && raw.message) {
    str = `${raw.code}: ${raw.message}`;
  } else {
    str = JSON.stringify(raw || {});
  }

  // 1. Redact API key cụ thể nếu có
  if (apiKey && apiKey.length > 5) {
    str = str.split(apiKey).join('[REDACTED]');
  }
  const envKey = process.env.EVOLINK_API_KEY;
  if (envKey && envKey.length > 5) {
    str = str.split(envKey).join('[REDACTED]');
  }

  // 2. Redact mọi chuỗi dạng sk-
  str = str.replace(/sk-[a-zA-Z0-9_\-]{6,}/g, '[REDACTED]');
  // 3. Redact Bearer tokens
  str = str.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');

  // 4. Phân loại lỗi và trả về mã cùng thông báo tiếng Việt an toàn
  if (raw?.code && typeof raw.code === 'string') {
    const directCode = raw.code;
    if (directCode === 'INSUFFICIENT_CREDITS') {
      return {
        code: 'INSUFFICIENT_CREDITS',
        message: 'Tài khoản dịch vụ tạo ảnh không đủ số dư để thực hiện tác vụ.',
      };
    }
    if (directCode === 'MODEL_NOT_AVAILABLE') {
      return {
        code: 'MODEL_NOT_AVAILABLE',
        message: 'Mô hình tạo ảnh hiện chưa khả dụng cho tài khoản này. Vui lòng thử lại sau.',
      };
    }
    if (directCode === 'AUTHENTICATION_FAILED') {
      return {
        code: 'AUTHENTICATION_FAILED',
        message: 'Xác thực dịch vụ tạo ảnh không thành công. Khóa API có thể không hợp lệ hoặc đã hết hạn.',
      };
    }
    if (directCode === 'TASK_TIMEOUT') {
      return {
        code: 'TASK_TIMEOUT',
        message: 'Thời gian tạo ảnh kéo dài quá dự kiến (timeout). Vui lòng thử lại sau ít phút.',
      };
    }
    if (directCode === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Không thể kết nối tới máy chủ tạo ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.',
      };
    }
    if (directCode === 'CONFIGURATION_ERROR') {
      return {
        code: 'CONFIGURATION_ERROR',
        message: 'Cấu hình mô hình tạo ảnh chưa chính xác. Vui lòng kiểm tra lại thiết lập trên server.',
      };
    }
    if (directCode === 'MISSING_API_KEY') {
      return {
        code: 'MISSING_API_KEY',
        message: 'Chưa cấu hình EVOLINK_API_KEY trên server. Vui lòng thêm EVOLINK_API_KEY vào Secrets trên Google AI Studio.',
      };
    }
  }

  const lower = str.toLowerCase();

  if (raw?.code === 'CONFIGURATION_ERROR' || lower.includes('configuration_error')) {
    return {
      code: 'CONFIGURATION_ERROR',
      message: 'Cấu hình mô hình tạo ảnh chưa chính xác. Vui lòng kiểm tra lại thiết lập trên server.',
    };
  }

  if (raw?.code === 'MISSING_API_KEY' || lower.includes('missing_api_key')) {
    return {
      code: 'MISSING_API_KEY',
      message: 'Chưa cấu hình EVOLINK_API_KEY trên server. Vui lòng thêm EVOLINK_API_KEY vào Secrets trên Google AI Studio.',
    };
  }

  if (
    lower.includes('not available for this api key') ||
    (lower.includes('model') && lower.includes('not available')) ||
    (lower.includes('model') && lower.includes('not found'))
  ) {
    return {
      code: 'MODEL_NOT_AVAILABLE',
      message: 'Mô hình tạo ảnh hiện chưa khả dụng cho tài khoản này. Vui lòng thử lại sau.',
    };
  }

  if (
    lower.includes('insufficient') ||
    lower.includes('balance') ||
    lower.includes('quota') ||
    lower.includes('credit') ||
    raw?.status === 402
  ) {
    return {
      code: 'INSUFFICIENT_CREDITS',
      message: 'Tài khoản dịch vụ tạo ảnh không đủ số dư để thực hiện tác vụ.',
    };
  }

  if (
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('authentication') ||
    raw?.status === 401 ||
    raw?.status === 403
  ) {
    return {
      code: 'AUTHENTICATION_FAILED',
      message: 'Xác thực dịch vụ tạo ảnh không thành công. Khóa API có thể không hợp lệ hoặc đã hết hạn.',
    };
  }

  if (raw?.code === 'TASK_TIMEOUT' || lower.includes('timeout')) {
    return {
      code: 'TASK_TIMEOUT',
      message: 'Thời gian tạo ảnh kéo dài quá dự kiến (timeout). Vui lòng thử lại sau ít phút.',
    };
  }

  if (raw?.code === 'NETWORK_ERROR' || lower.includes('network') || lower.includes('econnrefused')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối tới máy chủ tạo ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.',
    };
  }

  return {
    code: 'GENERATION_FAILED',
    message: 'Chưa thể tạo ảnh lúc này. Bạn có thể thử lại sau ít phút.',
  };
}

export class EvoLinkImageService {
  private config: EvoLinkConfig;
  private static cachedAvailableModels: string[] | null = null;
  private static lastModelsFetchTime = 0;

  constructor(customConfig?: Partial<EvoLinkConfig>) {
    const rawApiKey = (process.env.EVOLINK_API_KEY || '').trim();
    const rawModelEnv = (process.env.EVOLINK_IMAGE_MODEL || '').trim();

    // STRICT ENV VALIDATION:
    // Nếu EVOLINK_IMAGE_MODEL bắt đầu bằng sk- hoặc trùng với rawApiKey,
    // đây là lỗi nhầm lẫn cấu hình bí mật vào tên model! Bắt buộc bỏ qua và fallback.
    let resolvedModel = DEFAULT_FALLBACK_MODEL;
    if (rawModelEnv && !rawModelEnv.startsWith('sk-') && rawModelEnv !== rawApiKey) {
      resolvedModel = rawModelEnv;
    }

    this.config = {
      apiKey: rawApiKey,
      baseUrl: (process.env.EVOLINK_BASE_URL || 'https://api.evolink.ai').replace(/\/+$/, ''),
      model: resolvedModel,
      pollIntervalMs: Number(process.env.EVOLINK_POLL_INTERVAL_MS) || 2000,
      timeoutMs: Number(process.env.EVOLINK_TIMEOUT_MS) || 120000,
      ...customConfig,
    };
  }

  public getModel(): string {
    return this.config.model;
  }

  public getApiKey(): string {
    return this.config.apiKey;
  }

  public hasApiKey(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.length > 0);
  }

  /**
   * Gọi GET /v1/models để lấy danh sách model thực tế được API key hiện tại cho phép
   */
  public async fetchAvailableModels(): Promise<string[]> {
    if (!this.hasApiKey()) {
      return [DEFAULT_FALLBACK_MODEL];
    }

    // Cache trong 5 phút để tránh gọi lặp lại liên tục
    const now = Date.now();
    if (
      EvoLinkImageService.cachedAvailableModels &&
      now - EvoLinkImageService.lastModelsFetchTime < 300000
    ) {
      return EvoLinkImageService.cachedAvailableModels;
    }

    const endpoint = `${this.config.baseUrl}/v1/models`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`[EvoLink Service] GET /v1/models returned HTTP ${response.status}`);
        return [DEFAULT_FALLBACK_MODEL];
      }

      const data: any = await response.json();
      if (Array.isArray(data.data)) {
        const modelIds: string[] = data.data.map((m: any) => String(m.id || '').trim()).filter(Boolean);
        EvoLinkImageService.cachedAvailableModels = modelIds;
        EvoLinkImageService.lastModelsFetchTime = now;
        return modelIds;
      }
    } catch (err) {
      console.warn('[EvoLink Service] Could not fetch models list:', err);
    }

    return [DEFAULT_FALLBACK_MODEL];
  }

  /**
   * Lấy danh sách các model chuyên tạo ảnh (text-to-image) khả dụng cho tài khoản
   */
  public async getAvailableImageModels(): Promise<string[]> {
    const allModels = await this.fetchAvailableModels();

    const imageModels = allModels.filter((id) => {
      const lower = id.toLowerCase();
      // Loại bỏ video, audio, tts, chat, code
      if (
        lower.includes('video') ||
        lower.includes('music') ||
        lower.includes('audio') ||
        lower.includes('tts') ||
        lower.includes('voice') ||
        lower.includes('retalk') ||
        lower.includes('suno') ||
        lower.includes('moderation') ||
        lower.includes('chat') ||
        lower.includes('reasoner') ||
        lower.includes('code') ||
        lower.startsWith('claude') ||
        lower.startsWith('deepseek') ||
        lower.startsWith('glm') ||
        lower.startsWith('kimi') ||
        lower.startsWith('veo') ||
        lower.startsWith('sora') ||
        lower.startsWith('kling') ||
        lower.includes('i2v') ||
        lower.includes('t2v')
      ) {
        return false;
      }
      // Giữ lại các model tạo ảnh
      return (
        lower.includes('image') ||
        lower.includes('t2i') ||
        lower.includes('text-to-image') ||
        lower.startsWith('mj') ||
        lower.includes('seedream') ||
        lower.includes('banana')
      );
    });

    return imageModels.length > 0 ? imageModels : [DEFAULT_FALLBACK_MODEL];
  }

  /**
   * Xác định model ID hợp lệ để sử dụng, bảo đảm KHÔNG BAO GIỜ dùng giá trị bí mật
   */
  public async resolveValidModel(modelOverride?: string): Promise<string> {
    const rawRequested = (modelOverride || this.config.model || '').trim();

    // CHẶN BẢO MẬT TUYỆT ĐỐI: Không bao giờ chấp nhận model bắt đầu bằng sk- hoặc bằng API key
    if (rawRequested.startsWith('sk-') || rawRequested === this.config.apiKey) {
      console.error(
        '[EvoLink Service] SECURITY BLOCK: Attempted to use API Key as model identifier. Falling back to default.'
      );
      return DEFAULT_FALLBACK_MODEL;
    }

    // Nếu model được chỉ định hợp lệ
    if (rawRequested && rawRequested.length > 0) {
      return rawRequested;
    }

    return DEFAULT_FALLBACK_MODEL;
  }

  /**
   * Tạo task sinh ảnh trên EvoLink với đầy đủ kiểm tra an toàn
   */
  public async createImageTask(prompt: string, modelOverride?: string): Promise<CreateTaskResult> {
    if (!this.hasApiKey()) {
      throw {
        code: 'MISSING_API_KEY',
        message: 'Chưa cấu hình EVOLINK_API_KEY trên server. Vui lòng thêm EVOLINK_API_KEY vào Secrets trên Google AI Studio.',
      };
    }

    const trimmedPrompt = (prompt || '').trim();
    if (!trimmedPrompt) {
      throw {
        code: 'INVALID_PROMPT',
        message: 'Mô tả hình ảnh (prompt) không được để trống.',
      };
    }

    // Xác thực model
    let targetModel = (modelOverride || this.config.model || '').trim();

    // KIỂM TRA BẢO MẬT CHẶT CHẼ
    if (targetModel.startsWith('sk-') || targetModel === this.config.apiKey) {
      console.error(
        '[EvoLink Service] CONFIGURATION_ERROR: Model ID starts with sk- or matches API key. Refusing request.'
      );
      throw {
        code: 'CONFIGURATION_ERROR',
        message: 'Cấu hình mô hình tạo ảnh không hợp lệ (mã mô hình bị nhầm lẫn với khóa truy cập).',
      };
    }

    targetModel = await this.resolveValidModel(targetModel);

    const endpoint = `${this.config.baseUrl}/v1/images/generations`;

    const payload = {
      model: targetModel,
      prompt: trimmedPrompt,
      n: 1,
      size: '1024x1024',
      prompt_extend: false,
      watermark: false,
    };

    // Log an toàn: Tuyệt đối không log API key hoặc headers
    console.log(
      JSON.stringify({
        provider: 'EvoLink',
        model: targetModel,
        promptLength: trimmedPrompt.length,
        hasApiKey: true,
      })
    );

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr: any) {
      console.error('[EvoLink Service] Network error connecting to EvoLink');
      throw {
        code: 'NETWORK_ERROR',
        message: 'Không thể kết nối tới máy chủ EvoLink. Vui lòng kiểm tra kết nối mạng và thử lại.',
      };
    }

    // Nếu model không hỗ trợ các optional params, thử lại với payload tối thiểu
    if (!response.ok && response.status === 400) {
      const minimalPayload = {
        model: targetModel,
        prompt: trimmedPrompt,
        n: 1,
        size: '1024x1024',
      };

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(minimalPayload),
        });
      } catch (err: any) {
        throw {
          code: 'NETWORK_ERROR',
          message: 'Không thể kết nối tới máy chủ EvoLink.',
        };
      }
    }

    if (!response.ok) {
      let rawErrorBody: any = null;
      try {
        rawErrorBody = await response.json();
      } catch {
        // ignore parse error
      }

      // Làm sạch ngay lập tức mọi thông tin nhạy cảm
      const safeErr = sanitizeUpstreamError(rawErrorBody, this.config.apiKey);
      console.error(`[EvoLink Service] Task creation failed (HTTP ${response.status}): [${safeErr.code}]`);

      throw safeErr;
    }

    const data: any = await response.json();
    const taskId = data.id || data.task_id || data.data?.id || data.data?.task_id;
    const directImageUrl = this.extractImageUrl(data);

    if (!taskId && !directImageUrl) {
      console.error('[EvoLink Service] Malformed create task response');
      throw {
        code: 'MALFORMED_RESPONSE',
        message: 'Phản hồi từ EvoLink không chứa mã tác vụ hợp lệ.',
      };
    }

    return {
      taskId: taskId || 'direct-task',
      immediateImageUrl: directImageUrl || undefined,
      status: data.status || (directImageUrl ? 'completed' : 'processing'),
      model: targetModel,
    };
  }

  /**
   * Lấy trạng thái hiện tại của một task với sanitize an toàn
   */
  public async getImageTask(taskId: string): Promise<TaskStatusResult> {
    if (!this.hasApiKey()) {
      throw {
        code: 'MISSING_API_KEY',
        message: 'Chưa cấu hình EVOLINK_API_KEY trên server.',
      };
    }

    const endpoint = `${this.config.baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
    } catch (networkErr: any) {
      console.error(`[EvoLink Service] Network error fetching task: ${taskId}`);
      throw {
        code: 'NETWORK_ERROR',
        message: 'Lỗi kết nối khi kiểm tra tiến trình tác vụ.',
      };
    }

    if (!response.ok) {
      let rawErr: any = null;
      try {
        rawErr = await response.json();
      } catch {
        // ignore
      }
      const safeErr = sanitizeUpstreamError(rawErr, this.config.apiKey);
      throw safeErr;
    }

    const taskData: any = await response.json();
    const rawStatus = (taskData.status || '').toLowerCase();

    const isCompleted = ['completed', 'succeeded', 'success', 'done'].includes(rawStatus);
    const isFailed = ['failed', 'error', 'canceled', 'cancelled'].includes(rawStatus);

    if (isCompleted) {
      const imageUrl = this.extractImageUrl(taskData);
      if (!imageUrl) {
        return {
          taskId,
          status: 'failed',
          error: 'Tác vụ đã hoàn tất nhưng không tìm thấy đường dẫn ảnh.',
        };
      }
      return {
        taskId,
        status: 'completed',
        imageUrl,
      };
    }

    if (isFailed) {
      const safeErr = sanitizeUpstreamError(taskData.error || taskData.message || 'Tác vụ tạo ảnh thất bại.', this.config.apiKey);
      return {
        taskId,
        status: 'failed',
        error: safeErr.message,
      };
    }

    return {
      taskId,
      status: 'processing',
    };
  }

  /**
   * Chờ tác vụ hoàn thành (polling có timeout)
   */
  public async waitForImageTask(taskId: string): Promise<GenerateImageResult> {
    const startTime = Date.now();
    const pollInterval = this.config.pollIntervalMs;
    const timeout = this.config.timeoutMs;

    console.log(`[EvoLink Service] Waiting for task ${taskId}... (timeout: ${timeout / 1000}s)`);

    while (Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const taskResult = await this.getImageTask(taskId);

      if (taskResult.status === 'completed' && taskResult.imageUrl) {
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[EvoLink Service] Task ${taskId} completed in ${durationSec}s`);
        return {
          success: true,
          taskId,
          imageUrl: taskResult.imageUrl,
          model: this.config.model,
          status: 'completed',
        };
      }

      if (taskResult.status === 'failed') {
        const safeErr = sanitizeUpstreamError(taskResult.error, this.config.apiKey);
        throw safeErr;
      }
    }

    // Timeout
    console.error(`[EvoLink Service] Task ${taskId} timed out after ${timeout / 1000}s`);
    throw {
      code: 'TASK_TIMEOUT',
      message: 'Thời gian tạo ảnh kéo dài quá dự kiến (timeout). Vui lòng thử lại sau ít phút.',
    };
  }

  /**
   * Trích xuất URL hình ảnh an toàn từ cấu trúc phản hồi của EvoLink
   */
  private extractImageUrl(taskData: any): string | null {
    if (!taskData) return null;

    // 1. results array
    if (Array.isArray(taskData.results) && taskData.results.length > 0) {
      const first = taskData.results[0];
      if (typeof first === 'string') return first;
      if (first && typeof first.url === 'string') return first.url;
      if (first && typeof first.image_url === 'string') return first.image_url;
    }

    // 2. data array chuẩn OpenAI
    if (Array.isArray(taskData.data) && taskData.data.length > 0) {
      const first = taskData.data[0];
      if (typeof first === 'string') return first;
      if (first && typeof first.url === 'string') return first.url;
      if (first && typeof first.b64_json === 'string') return `data:image/png;base64,${first.b64_json}`;
    }

    // 3. output / result object
    const output = taskData.output || taskData.result;
    if (output) {
      if (Array.isArray(output.images) && output.images.length > 0) {
        const img = output.images[0];
        return typeof img === 'string' ? img : img.url || null;
      }
      if (Array.isArray(output.results) && output.results.length > 0) {
        const img = output.results[0];
        return typeof img === 'string' ? img : img.url || null;
      }
      if (typeof output.url === 'string') return output.url;
      if (typeof output.image_url === 'string') return output.image_url;
    }

    // 4. images array trực tiếp
    if (Array.isArray(taskData.images) && taskData.images.length > 0) {
      const img = taskData.images[0];
      return typeof img === 'string' ? img : img.url || null;
    }

    // 5. url hoặc image_url ở root object
    if (typeof taskData.url === 'string') return taskData.url;
    if (typeof taskData.image_url === 'string') return taskData.image_url;

    return null;
  }
}
