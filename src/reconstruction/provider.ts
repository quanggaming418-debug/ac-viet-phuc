import type {
  ReconstructionInput,
  ReconstructionJobReceipt,
  ReconstructionJobStatus,
} from './types.ts';

export interface ReconstructionProvider {
  readonly providerName: string;

  createJob(
    input: ReconstructionInput
  ): Promise<ReconstructionJobReceipt>;

  getJob(
    providerJobId: string
  ): Promise<ReconstructionJobStatus>;

  cancelJob?(
    providerJobId: string
  ): Promise<void>;
}
