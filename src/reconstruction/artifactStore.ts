import type {
  Reconstructed3DArtifact,
  ReconstructionJob,
  ReconstructionJobState,
} from './types.ts';

class ReconstructionArtifactStore {
  private jobs: Map<string, ReconstructionJob> = new Map();
  private artifacts: Map<string, Reconstructed3DArtifact> = new Map();

  /**
   * Đăng ký một Job mới (hỗ trợ Idempotency)
   */
  public registerJob(job: ReconstructionJob): ReconstructionJob {
    this.jobs.set(job.reconstructionId, { ...job });
    return this.jobs.get(job.reconstructionId)!;
  }

  /**
   * Lấy thông tin job theo ID
   */
  public getJob(reconstructionId: string): ReconstructionJob | null {
    return this.jobs.get(reconstructionId) || null;
  }

  /**
   * Tìm kiếm job đã tồn tại theo inputFingerprint để chống trùng lặp (Idempotency)
   */
  public findJobByFingerprint(inputFingerprint: string): ReconstructionJob | null {
    for (const job of this.jobs.values()) {
      if (job.inputFingerprint === inputFingerprint && job.state !== 'CANCELLED' && job.state !== 'FAILED') {
        return job;
      }
    }
    return null;
  }

  /**
   * Cập nhật trạng thái job
   */
  public updateJobState(
    reconstructionId: string,
    state: ReconstructionJobState,
    error?: { code: string; message: string; retryable: boolean },
    providerJobId?: string
  ): ReconstructionJob | null {
    const job = this.jobs.get(reconstructionId);
    if (!job) return null;

    job.state = state;
    job.updatedAt = new Date().toISOString();
    if (error) job.error = error;
    if (providerJobId) job.providerJobId = providerJobId;

    this.jobs.set(reconstructionId, job);
    return job;
  }

  /**
   * Đánh dấu các job đang chạy không khớp với currentFingerprint thành STALE
   */
  public markStaleJobs(currentFingerprint: string): void {
    for (const job of this.jobs.values()) {
      if (
        job.inputFingerprint !== currentFingerprint &&
        (job.state === 'QUEUED' || job.state === 'PROCESSING' || job.state === 'VALIDATING_INPUT')
      ) {
        job.state = 'STALE';
        job.updatedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Lưu artifact 3D tái tạo
   */
  public saveArtifact(artifact: Reconstructed3DArtifact): void {
    this.artifacts.set(artifact.artifactId, { ...artifact });
  }

  /**
   * Lấy artifact theo ID
   */
  public getArtifact(artifactId: string): Reconstructed3DArtifact | null {
    return this.artifacts.get(artifactId) || null;
  }

  /**
   * Lấy toàn bộ artifact của một pack
   */
  public getArtifactsForPack(packId: string): Reconstructed3DArtifact[] {
    return Array.from(this.artifacts.values()).filter((a) => a.sourcePackId === packId);
  }

  /**
   * Reset store (hỗ trợ testing)
   */
  public clear(): void {
    this.jobs.clear();
    this.artifacts.clear();
  }
}

export const reconstructionStore = new ReconstructionArtifactStore();
