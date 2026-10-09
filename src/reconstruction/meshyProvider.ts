import fs from 'fs';
import path from 'path';
import type { ReconstructionProvider } from './provider.ts';
import type {
  ReconstructionInput,
  ReconstructionJobReceipt,
  ReconstructionJobStatus,
  ReconstructionJobState,
  ReconstructionJobError,
} from './types.ts';
import { ALL_VIEW_IDS, ViewId } from '../multiview/types.ts';

export interface MeshyConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export type MeshyErrorCode =
  | 'MESHY_AUTH_FAILED'
  | 'MESHY_INSUFFICIENT_CREDITS'
  | 'MESHY_RATE_LIMITED'
  | 'MESHY_BAD_REQUEST'
  | 'MESHY_TASK_FAILED'
  | 'MESHY_DOWNLOAD_FAILED'
  | 'MESHY_INVALID_OUTPUT'
  | 'MESHY_TIMEOUT'
  | 'MESHY_UNAVAILABLE'
  | 'MESHY_MODEL_UNAVAILABLE'
  | 'MESHY_AMBIGUOUS_DISPATCH';

/**
 * Lớp chuyển đổi lỗi từ Meshy API thành mã lỗi nội bộ an toàn và thông điệp thân thiện
 * Tuyệt đối không để lộ API key hay raw trace ra bên ngoài
 */
export function sanitizeMeshyError(status: number, rawMessage?: string): { code: MeshyErrorCode; message: string } {
  if (status === 401) {
    return {
      code: 'MESHY_AUTH_FAILED',
      message: 'Xác thực Meshy API không thành công. Khóa API không hợp lệ hoặc đã hết hạn.',
    };
  }
  if (status === 402) {
    return {
      code: 'MESHY_INSUFFICIENT_CREDITS',
      message: 'Tài khoản Meshy không đủ credits để khởi tạo tác vụ tái tạo 3D.',
    };
  }
  if (status === 429) {
    return {
      code: 'MESHY_RATE_LIMITED',
      message: 'Hệ thống Meshy đang giới hạn tần suất yêu cầu (Rate Limit). Vui lòng thử lại sau giây lát.',
    };
  }
  if (status === 400) {
    const isModelIssue = rawMessage?.toLowerCase().includes('model');
    if (isModelIssue) {
      return {
        code: 'MESHY_MODEL_UNAVAILABLE',
        message: 'Phiên bản mô hình Meshy 3D không khả dụng hoặc cấu hình sai.',
      };
    }
    return {
      code: 'MESHY_BAD_REQUEST',
      message: 'Yêu cầu gửi dữ liệu ảnh sang Meshy không hợp lệ.',
    };
  }
  if (status >= 500 && status < 600) {
    return {
      code: 'MESHY_UNAVAILABLE',
      message: 'Máy chủ Meshy hiện đang gián đoạn hoặc không thể kết nối.',
    };
  }
  return {
    code: 'MESHY_TASK_FAILED',
    message: rawMessage || 'Tác vụ dựng hình 3D trên Meshy gặp sự cố kỹ thuật.',
  };
}

/**
 * Map trạng thái từ Meshy API sang hệ trạng thái chuẩn ReconstructionJobState của AC
 */
export function mapMeshyStatusToState(providerStatus?: string): ReconstructionJobState {
  if (!providerStatus) return 'FAILED';
  const upper = providerStatus.toUpperCase();

  switch (upper) {
    case 'PENDING':
      return 'QUEUED';
    case 'IN_PROGRESS':
      return 'PROCESSING';
    case 'SUCCEEDED':
      return 'SUCCEEDED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELED':
    case 'EXPIRED':
      return 'CANCELLED';
    default:
      return 'FAILED';
  }
}

/**
 * Chuẩn bị danh sách ảnh dạng data URI an toàn và đúng thứ tự bắt buộc:
 * [ FRONT, THREE_QUARTER_LEFT, BACK, THREE_QUARTER_RIGHT ]
 * FRONT luôn là phần tử đầu tiên.
 */
export function prepareTrustedImageDataUris(input: ReconstructionInput): string[] {
  const orderedViewIds: ViewId[] = [
    'FRONT',
    'THREE_QUARTER_LEFT',
    'BACK',
    'THREE_QUARTER_RIGHT',
  ];

  const resultUris: string[] = [];

  for (const viewId of orderedViewIds) {
    const viewItem = input.views.find((v) => v.viewId === viewId);
    if (!viewItem) {
      throw new Error(`Thiếu dữ liệu góc nhìn bắt buộc: ${viewId}`);
    }

    const ref = viewItem.imageBytesRef;
    if (!ref) {
      throw new Error(`Góc nhìn ${viewId} không có tham chiếu ảnh hợp lệ.`);
    }

    // 1. Nếu đã là data URI chuẩn
    if (ref.startsWith('data:image/png;base64,') || ref.startsWith('data:image/jpeg;base64,')) {
      resultUris.push(ref);
      continue;
    }

    // 2. Nếu là đường dẫn file cục bộ trong server (/assets/... hoặc public/assets/...)
    let localPath = ref;
    if (localPath.startsWith('/assets/')) {
      localPath = path.resolve('public' + localPath);
      if (!fs.existsSync(localPath)) {
        localPath = path.resolve('dist' + ref);
      }
    } else if (localPath.startsWith('public/')) {
      localPath = path.resolve(localPath);
    }

    if (!fs.existsSync(localPath)) {
      throw new Error(`Không tìm thấy file ảnh nguồn tin cậy trên máy chủ: ${ref}`);
    }

    const ext = path.extname(localPath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    const buffer = fs.readFileSync(localPath);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mime};base64,${base64}`;

    resultUris.push(dataUri);
  }

  return resultUris;
}

/**
 * Nhà cung cấp tái tạo 3D qua Meshy Multi-Image-to-3D API
 */
export class MeshyReconstructionProvider implements ReconstructionProvider {
  public readonly providerName = 'Meshy Multi-Image-to-3D';
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: MeshyConfig) {
    this.apiKey = config.apiKey ? config.apiKey.trim() : '';
    this.model = config.model || 'meshy-7.1';
    this.baseUrl = config.baseUrl || 'https://api.meshy.ai/openapi/v1/multi-image-to-3d';
    this.timeoutMs = config.timeoutMs || 30000;
  }

  public getModel(): string {
    return this.model;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Khởi tạo tác vụ tái tạo 3D từ bộ ảnh đa góc
   * Giao dịch trả phí: KHÔNG tự động retry nếu thất bại mạng.
   */
  public async createJob(input: ReconstructionInput): Promise<ReconstructionJobReceipt> {
    if (!this.hasApiKey()) {
      throw new Error('Chưa cấu hình MESHY_API_KEY trên máy chủ.');
    }

    // Chuẩn bị 4 ảnh tin cậy theo đúng thứ tự FRONT đầu tiên
    const trustedDataUris = prepareTrustedImageDataUris(input);

    const payload = {
      image_urls: trustedDataUris,
      ai_model: this.model,
      geometry_resolution: 'standard',
      should_texture: true,
      enable_pbr: true,
      target_formats: ['glb'],
      moderation: true,
      multi_view_thumbnails: true,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (networkErr: any) {
      clearTimeout(timer);
      console.error('[AC MeshyProvider] Network dispatch error during paid request:', networkErr?.message);
      // PAID DISPATCH SAFETY: Request có thể đã tới Meshy nhưng đứt mạng trước khi nhận phản hồi.
      // Tuyệt đối không retry POST tự động để tránh double-spend credit.
      const error: ReconstructionJobError = {
        code: 'MESHY_AMBIGUOUS_DISPATCH',
        message: 'Mạng bị gián đoạn trong khi gửi yêu cầu sang Meshy. Tác vụ được đặt ở trạng thái kiểm tra (AMBIGUOUS_DISPATCH) để bảo toàn credit.',
        retryable: false,
      };
      throw Object.assign(new Error(error.message), { errorData: error, state: 'AMBIGUOUS_DISPATCH' });
    } finally {
      clearTimeout(timer);
    }

    const now = new Date().toISOString();

    if (!res.ok) {
      let rawMsg = '';
      try {
        const errJson = await res.json();
        rawMsg = errJson?.message || errJson?.error || '';
      } catch {
        // ignore json parse error
      }
      const sanitized = sanitizeMeshyError(res.status, rawMsg);
      console.warn(`[AC MeshyProvider] Meshy API rejected dispatch (${res.status}): ${sanitized.code}`);
      throw Object.assign(new Error(sanitized.message), {
        errorData: {
          code: sanitized.code,
          message: sanitized.message,
          retryable: res.status === 429 || res.status >= 500,
        },
      });
    }

    const responseData = await res.json();
    const providerJobId = responseData?.result;

    if (!providerJobId || typeof providerJobId !== 'string') {
      throw new Error('Meshy API không trả về Task ID hợp lệ.');
    }

    console.log(`[AC MeshyProvider] Successfully dispatched task to Meshy. TaskId: ${providerJobId}`);

    return {
      reconstructionId: input.reconstructionId,
      providerJobId,
      provider: this.providerName,
      state: 'QUEUED',
      estimatedSeconds: 90,
      createdAt: now,
    };
  }

  /**
   * Truy vấn tiến độ tác vụ dựng 3D
   */
  public async getJob(providerJobId: string): Promise<ReconstructionJobStatus> {
    if (!this.hasApiKey()) {
      throw new Error('Chưa cấu hình MESHY_API_KEY trên máy chủ.');
    }

    const url = `${this.baseUrl}/${encodeURIComponent(providerJobId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const now = new Date().toISOString();

    if (!res.ok) {
      let rawMsg = '';
      try {
        const errJson = await res.json();
        rawMsg = errJson?.message || errJson?.error || '';
      } catch {
        // ignore
      }
      const sanitized = sanitizeMeshyError(res.status, rawMsg);
      return {
        providerJobId,
        state: 'FAILED',
        error: {
          code: sanitized.code,
          message: sanitized.message,
          retryable: res.status === 429 || res.status >= 500,
        },
        updatedAt: now,
      };
    }

    const data = await res.json();
    const providerStatus = data?.status || '';
    const state = mapMeshyStatusToState(providerStatus);
    const progress = typeof data?.progress === 'number' ? data.progress : 0;

    let glbUrl: string | undefined;
    if (data?.model_urls?.glb) {
      glbUrl = data.model_urls.glb;
    }

    let providerThumbnails: Record<string, string> | undefined;
    if (data?.thumbnail_urls && typeof data.thumbnail_urls === 'object') {
      providerThumbnails = { ...data.thumbnail_urls };
    }

    let error: ReconstructionJobError | undefined;
    if (state === 'FAILED') {
      const errReason = data?.task_error?.message || data?.task_error?.code || 'Tiến trình dựng 3D trên Meshy báo lỗi.';
      error = {
        code: 'MESHY_TASK_FAILED',
        message: errReason,
        retryable: false,
      };
    }

    return {
      providerJobId,
      state,
      progressPercent: progress,
      glbUrl,
      providerThumbnails,
      error,
      updatedAt: now,
    };
  }
}
