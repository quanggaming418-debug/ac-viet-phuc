import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { ReconstructionProvider } from './provider.ts';
import { MeshyReconstructionProvider } from './meshyProvider.ts';
import { MockReconstructionProvider } from './mockReconstructionProvider.ts';
import { reconstructionStore } from './artifactStore.ts';
import { validateGlbTechnical } from './validator.ts';
import { buildReconstructionInput, validatePackReadyForReconstruction } from './inputBuilder.ts';
import type { MultiViewReferencePack } from '../multiview/types.ts';
import type {
  Reconstructed3DArtifact,
  ReconstructionJob,
  ReconstructionJobReceipt,
  ReconstructionJobStatus,
  ReconstructionTechnicalValidation,
  ReconstructionInput,
} from './types.ts';

export interface ReconstructionConfig {
  meshyApiKey: string;
  meshyModel: string;
  enableLiveReconstruction: boolean;
  live3dTests: number;
  live3dMaxCalls: number;
}

/**
 * Đọc cấu hình môi trường từ process.env một cách an toàn
 */
export function getReconstructionConfig(): ReconstructionConfig {
  const meshyApiKey = (process.env.MESHY_API_KEY || '').trim();
  const meshyModel = (process.env.MESHY_3D_MODEL || 'meshy-7.1').trim();
  const enableLiveReconstruction = process.env.ENABLE_LIVE_3D_RECONSTRUCTION === 'true';
  const live3dTests = parseInt(process.env.LIVE_3D_TESTS || '0', 10);
  const live3dMaxCalls = parseInt(process.env.LIVE_3D_MAX_CALLS || '1', 10);

  return {
    meshyApiKey,
    meshyModel,
    enableLiveReconstruction,
    live3dTests: isNaN(live3dTests) ? 0 : live3dTests,
    live3dMaxCalls: isNaN(live3dMaxCalls) ? 1 : live3dMaxCalls,
  };
}

class ReconstructionService {
  private paidCallsCounter: number = 0;
  private mockProvider = new MockReconstructionProvider('SUCCESS');

  public getPaidCallsCount(): number {
    return this.paidCallsCounter;
  }

  public resetPaidCallsCounter(): void {
    this.paidCallsCounter = 0;
  }

  /**
   * Kiểm tra xem hệ thống có đủ điều kiện an toàn để gọi Meshy API thật hay không
   */
  public canDispatchLiveMeshy(): { allowed: boolean; reason?: string } {
    const config = getReconstructionConfig();

    if (!config.enableLiveReconstruction) {
      return {
        allowed: false,
        reason: 'ENABLE_LIVE_3D_RECONSTRUCTION chưa được bật (hiện tại: false).',
      };
    }

    if (!config.meshyApiKey || config.meshyApiKey.length < 5) {
      return {
        allowed: false,
        reason: 'MESHY_API_KEY chưa được cấu hình trên máy chủ.',
      };
    }

    // Nếu đang trong chế độ kiểm thử có kiểm soát số lần gọi tối đa
    if (config.live3dTests === 1 && this.paidCallsCounter >= config.live3dMaxCalls) {
      return {
        allowed: false,
        reason: `Đã đạt giới hạn tối đa số lần gọi có phí (LIVE_3D_MAX_CALLS=${config.live3dMaxCalls}).`,
      };
    }

    return { allowed: true };
  }

  /**
   * Khởi tạo Reconstruction Provider phù hợp theo cờ môi trường
   */
  public getActiveProvider(): ReconstructionProvider {
    const gate = this.canDispatchLiveMeshy();
    if (gate.allowed) {
      const config = getReconstructionConfig();
      return new MeshyReconstructionProvider({
        apiKey: config.meshyApiKey,
        model: config.meshyModel,
      });
    }
    return this.mockProvider;
  }

  /**
   * Tải tệp GLB về thư mục tạm riêng tư, thẩm định kỹ thuật và chỉ lưu vào public khi PASS
   */
  public async downloadAndValidateGlb(
    glbRemoteUrl: string,
    artifactId: string,
    maxBytes: number = 50 * 1024 * 1024
  ): Promise<{
    success: boolean;
    glbRef: string;
    glbHash: string;
    byteLength: number;
    technicalValidation: ReconstructionTechnicalValidation;
  }> {
    let buffer: Buffer;

    // 1. Tải bytes an toàn
    if (glbRemoteUrl.startsWith('http://') || glbRemoteUrl.startsWith('https://')) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);

      try {
        const res = await fetch(glbRemoteUrl, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Tải tệp GLB từ provider thất bại: HTTP ${res.status}`);
        }
        const arrBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrBuf);
      } finally {
        clearTimeout(timer);
      }
    } else {
      // Đọc từ file local (trường hợp mock provider)
      let localPath = glbRemoteUrl;
      if (localPath.startsWith('/models/') || localPath.startsWith('/reconstructions/')) {
        localPath = path.resolve('public' + localPath);
      }
      if (!fs.existsSync(localPath)) {
        throw new Error(`Không tìm thấy file GLB nguồn: ${glbRemoteUrl}`);
      }
      buffer = fs.readFileSync(localPath);
    }

    const byteLength = buffer.length;

    // 2. Kiểm tra giới hạn dung lượng
    if (byteLength > maxBytes) {
      const failedValidation: ReconstructionTechnicalValidation = {
        isValid: false,
        mimeTypeValid: false,
        canParseGlTF: false,
        hasScene: false,
        hasMesh: false,
        vertexCount: 0,
        triangleCount: 0,
        finiteTransforms: false,
        noNaNValues: false,
        boundingBoxValid: false,
        dimensions: { x: 0, y: 0, z: 0 },
        byteLength,
        safeSize: false,
        noExecutableOrScripts: true,
        issues: [`Dung lượng tệp GLB vượt quá giới hạn an toàn (${(byteLength / (1024 * 1024)).toFixed(1)}MB > 50MB)`],
      };

      return {
        success: false,
        glbRef: '',
        glbHash: '',
        byteLength,
        technicalValidation: failedValidation,
      };
    }

    // 3. Tính mã băm SHA-256
    const glbHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 4. Chạy Thẩm định Kỹ thuật GLB (Technical Validation)
    const technicalValidation = validateGlbTechnical(buffer);

    if (!technicalValidation.isValid) {
      console.warn(`[AC ReconstructionService] GLB technical validation failed for artifact ${artifactId}:`, technicalValidation.issues);
      return {
        success: false,
        glbRef: '',
        glbHash,
        byteLength,
        technicalValidation,
      };
    }

    // 5. Chỉ lưu sang thư mục public sau khi Thẩm định Kỹ thuật PASS
    const targetDir = path.resolve('public/reconstructions');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFile = path.join(targetDir, `${artifactId}.glb`);
    fs.writeFileSync(targetFile, buffer);

    // Đồng bộ sang dist/reconstructions nếu có
    const distTargetDir = path.resolve('dist/reconstructions');
    if (fs.existsSync(distTargetDir)) {
      fs.writeFileSync(path.join(distTargetDir, `${artifactId}.glb`), buffer);
    }

    const glbRef = `/reconstructions/${artifactId}.glb`;

    return {
      success: true,
      glbRef,
      glbHash,
      byteLength,
      technicalValidation,
    };
  }

  /**
   * Tạo tác vụ tái tạo 3D với cơ chế bảo vệ Idempotency và Paid Dispatch Safety
   */
  public async handleCreateReconstruction(pack: MultiViewReferencePack): Promise<{
    receipt: ReconstructionJobReceipt;
    job: ReconstructionJob;
    isExisting: boolean;
  }> {
    // 1. Kiểm tra điều kiện bắt buộc READY_FOR_3D
    const readyCheck = validatePackReadyForReconstruction(pack);
    if (!readyCheck.canProceed) {
      throw new Error(readyCheck.reason || 'Pack chưa đạt trạng thái READY_FOR_3D.');
    }

    // 2. Xây dựng input chuẩn hóa và khóa nguồn
    const reconstructionInput = buildReconstructionInput(pack);

    // 3. IDEMPOTENCY: Kiểm tra xem cùng input fingerprint đã có job nào đang chạy hoặc hoàn thành chưa
    const existingJob = reconstructionStore.findJobByFingerprint(
      reconstructionInput.reconstructionInputFingerprint
    );

    if (existingJob) {
      console.log(`[AC ReconstructionService] Idempotency hit: Reusing existing job ${existingJob.reconstructionId}`);
      return {
        receipt: {
          reconstructionId: existingJob.reconstructionId,
          providerJobId: existingJob.providerJobId || '',
          provider: existingJob.provider,
          state: existingJob.state,
          createdAt: existingJob.createdAt,
        },
        job: existingJob,
        isExisting: true,
      };
    }

    // 4. Chọn Provider
    const provider = this.getActiveProvider();
    const isLive = provider instanceof MeshyReconstructionProvider;

    if (isLive) {
      this.paidCallsCounter++;
      console.log(`[AC ReconstructionService] Dispatching LIVE Meshy call #${this.paidCallsCounter}`);
    }

    // 5. Gửi tác vụ sang provider
    let receipt: ReconstructionJobReceipt;
    try {
      receipt = await provider.createJob(reconstructionInput);
    } catch (dispatchErr: any) {
      // Xử lý lỗi trả về từ provider hoặc ngắt kết nối mạng
      if (dispatchErr?.state === 'AMBIGUOUS_DISPATCH') {
        const ambiguousJob: ReconstructionJob = {
          reconstructionId: reconstructionInput.reconstructionId,
          provider: provider.providerName,
          inputFingerprint: reconstructionInput.reconstructionInputFingerprint,
          state: 'AMBIGUOUS_DISPATCH',
          error: dispatchErr.errorData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        reconstructionStore.registerJob(ambiguousJob);
        throw dispatchErr;
      }
      throw dispatchErr;
    }

    // 6. Đăng ký job vào store
    const job = reconstructionStore.registerJob({
      reconstructionId: reconstructionInput.reconstructionId,
      provider: provider.providerName,
      providerJobId: receipt.providerJobId,
      inputFingerprint: reconstructionInput.reconstructionInputFingerprint,
      state: receipt.state,
      createdAt: receipt.createdAt,
      updatedAt: receipt.createdAt,
    });

    return {
      receipt,
      job,
      isExisting: false,
    };
  }

  /**
   * Truy vấn tiến độ tác vụ dựng 3D và tự động tải/thẩm định file khi SUCCEEDED
   */
  public async handleGetReconstruction(reconstructionId: string): Promise<{
    job: ReconstructionJob;
    artifact: Reconstructed3DArtifact | null;
  }> {
    const job = reconstructionStore.getJob(reconstructionId);
    if (!job) {
      throw new Error(`Không tìm thấy reconstruction job: ${reconstructionId}`);
    }

    const artifactId = `artifact-${reconstructionId}`;
    let artifact = reconstructionStore.getArtifact(artifactId);

    // Nếu job đã thành công và đã có artifact thì trả về ngay
    if (job.state === 'SUCCEEDED' && artifact) {
      return { job, artifact };
    }

    // Nếu job đang trong trạng thái chờ xử lý hoặc đã xong nhưng chưa có artifact, tiến hành poll/tải tệp
    if (job.providerJobId && (job.state === 'QUEUED' || job.state === 'PROCESSING' || (job.state === 'SUCCEEDED' && !artifact))) {
      const provider = this.getActiveProvider();
      const status = await provider.getJob(job.providerJobId);

      reconstructionStore.updateJobState(
        reconstructionId,
        status.state,
        status.error,
        job.providerJobId
      );

      if (status.state === 'SUCCEEDED' && status.glbUrl) {
        // Tải GLB về và chạy Thẩm định Kỹ thuật
        const downloadRes = await this.downloadAndValidateGlb(status.glbUrl, artifactId);

        const garmentId = job.reconstructionId.includes('ngu_than')
          ? 'ngu_than_tay_chen'
          : job.reconstructionId.includes('tu_than')
          ? 'ao_tu_than'
          : 'ao_tac';

        const config = getReconstructionConfig();

        // KHÔNG TỰ ĐỘNG CHẤP NHẬN HÌNH THÁI HỌC (No Auto Accept Morphology):
        // Thẩm định kỹ thuật PASS -> Trạng thái bắt đầu là 'NEEDS_REVIEW'
        // structuralComparison đặt là null, không ngụy tạo kết quả chấp nhận
        const newArtifact: Reconstructed3DArtifact = {
          artifactId,
          reconstructionId,
          garmentId,
          sourcePackId: `pack-${garmentId}`,
          sourceGenerationGroupId: `grp-${garmentId}`,
          inputFingerprint: job.inputFingerprint,
          modelAuthority: 'AI_RECONSTRUCTION',
          provider: provider.providerName,
          providerModel: config.meshyModel,
          providerTaskId: job.providerJobId,
          glbRef: downloadRes.glbRef,
          glbHash: downloadRes.glbHash,
          byteLength: downloadRes.byteLength,
          technicalValidation: downloadRes.technicalValidation,
          providerThumbnailRefs: status.providerThumbnails || null,
          structuralComparison: null,
          status: downloadRes.technicalValidation.isValid ? 'NEEDS_REVIEW' : 'REJECTED',
          createdAt: new Date().toISOString(),
        };

        reconstructionStore.saveArtifact(newArtifact);
        artifact = newArtifact;

        if (!downloadRes.technicalValidation.isValid) {
          reconstructionStore.updateJobState(reconstructionId, 'FAILED', {
            code: 'TECHNICAL_FAILURE',
            message: 'Tệp GLB không vượt qua quy trình thẩm định kỹ thuật an toàn.',
            retryable: false,
          });
        }
      }
    }

    const updatedJob = reconstructionStore.getJob(reconstructionId) || job;
    return { job: updatedJob, artifact };
  }
}

export const reconstructionService = new ReconstructionService();
