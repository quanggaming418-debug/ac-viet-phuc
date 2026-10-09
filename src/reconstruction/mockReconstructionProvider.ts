import type { ReconstructionProvider } from './provider.ts';
import type {
  ReconstructionInput,
  ReconstructionJobReceipt,
  ReconstructionJobStatus,
} from './types.ts';

export type MockScenario =
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT'
  | 'STALE'
  | 'INVALID_GLB';

export class MockReconstructionProvider implements ReconstructionProvider {
  public readonly providerName = 'MockReconstructionProvider (Deterministic Offline Engine)';
  private scenario: MockScenario;
  private jobs: Map<string, ReconstructionJobStatus> = new Map();

  constructor(defaultScenario: MockScenario = 'SUCCESS') {
    this.scenario = defaultScenario;
  }

  public setScenario(scenario: MockScenario): void {
    this.scenario = scenario;
  }

  public async createJob(input: ReconstructionInput): Promise<ReconstructionJobReceipt> {
    const providerJobId = `mock-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (this.scenario === 'FAILED') {
      this.jobs.set(providerJobId, {
        providerJobId,
        state: 'FAILED',
        error: {
          code: 'TECHNICAL_FAILURE',
          message: 'Dịch vụ tạo 3D thử nghiệm báo lỗi bộ nhớ dựng hình ảnh.',
          retryable: false,
        },
        updatedAt: now,
      });

      return {
        reconstructionId: input.reconstructionId,
        providerJobId,
        provider: this.providerName,
        state: 'FAILED',
        createdAt: now,
      };
    }

    if (this.scenario === 'TIMEOUT') {
      this.jobs.set(providerJobId, {
        providerJobId,
        state: 'PROCESSING',
        progressPercent: 35,
        updatedAt: now,
      });

      return {
        reconstructionId: input.reconstructionId,
        providerJobId,
        provider: this.providerName,
        state: 'PROCESSING',
        estimatedSeconds: 120,
        createdAt: now,
      };
    }

    if (this.scenario === 'STALE') {
      this.jobs.set(providerJobId, {
        providerJobId,
        state: 'STALE',
        updatedAt: now,
      });

      return {
        reconstructionId: input.reconstructionId,
        providerJobId,
        provider: this.providerName,
        state: 'STALE',
        createdAt: now,
      };
    }

    if (this.scenario === 'INVALID_GLB') {
      this.jobs.set(providerJobId, {
        providerJobId,
        state: 'SUCCEEDED',
        glbUrl: '/models/corrupted-mock.glb',
        byteLength: 12,
        updatedAt: now,
      });

      return {
        reconstructionId: input.reconstructionId,
        providerJobId,
        provider: this.providerName,
        state: 'SUCCEEDED',
        createdAt: now,
      };
    }

    // Default SUCCESS scenario: trả đường dẫn file proxy làm fixture kiểm thử kỹ thuật an toàn
    const fixtureMap: Record<string, string> = {
      ngu_than_tay_chen: '/models/ngu-than-tay-chen-proxy.glb',
      ao_tac: '/models/ao-tac-proxy.glb',
      ao_tu_than: '/models/ao-tu-than-proxy.glb',
    };
    const glbUrl = fixtureMap[input.garmentId] || '/models/ao-tac-proxy.glb';

    this.jobs.set(providerJobId, {
      providerJobId,
      state: 'SUCCEEDED',
      progressPercent: 100,
      glbUrl,
      byteLength: 84480,
      glbHash: 'b9d773d2be385096',
      updatedAt: now,
    });

    return {
      reconstructionId: input.reconstructionId,
      providerJobId,
      provider: this.providerName,
      state: 'SUCCEEDED',
      estimatedSeconds: 5,
      createdAt: now,
    };
  }

  public async getJob(providerJobId: string): Promise<ReconstructionJobStatus> {
    const job = this.jobs.get(providerJobId);
    if (!job) {
      return {
        providerJobId,
        state: 'FAILED',
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Không tìm thấy job trên mock provider.',
          retryable: false,
        },
        updatedAt: new Date().toISOString(),
      };
    }
    return job;
  }

  public async cancelJob(providerJobId: string): Promise<void> {
    const job = this.jobs.get(providerJobId);
    if (job) {
      job.state = 'CANCELLED';
      job.updatedAt = new Date().toISOString();
    }
  }
}
