import type { MultiViewReferencePack, ViewId } from '../multiview/types.ts';
import { ALL_VIEW_IDS } from '../multiview/types.ts';
import { simpleHash } from '../multiview/multiViewCompiler.ts';
import type {
  ReconstructionInput,
  ReconstructionInputViewItem,
} from './types.ts';

/**
 * Kiểm tra xem tham chiếu ảnh có thuộc nguồn đáng tin cậy của máy chủ hay không
 * Chống tấn công SSRF: Nghiêm cấm nhận đường dẫn HTTP/HTTPS tùy ý từ client
 */
export function validateTrustedImageRef(ref: string): boolean {
  if (!ref || typeof ref !== 'string') return false;
  const clean = ref.trim();

  // Cho phép data URI nội bộ đã xác thực
  if (clean.startsWith('data:image/png;base64,') || clean.startsWith('data:image/jpeg;base64,')) {
    return true;
  }

  // Cho phép đường dẫn nội bộ đã được kiểm soát
  if (clean.startsWith('/assets/') || clean.startsWith('/models/') || clean.startsWith('public/')) {
    return true;
  }

  // Cho phép mã hash SHA256 / DJB2 của server
  if (/^[a-fA-F0-9]{16,64}$/.test(clean)) {
    return true;
  }

  // Cấm mọi URL ngoại vi tùy tiện (ngăn chặn SSRF)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    // Chỉ chấp nhận nếu là domain chính thức cùng origin localhost/ais-app
    if (clean.includes('localhost:') || clean.includes('.run.app/assets/')) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Tính hash cho dữ liệu ảnh từ URL hoặc base64
 */
export function computeImageHash(imageBytesRef: string): string {
  return simpleHash(imageBytesRef.substring(0, 1000) + imageBytesRef.length);
}

/**
 * Tính Canonical Reconstruction Input Fingerprint
 * Khóa chặt chẽ: packId, generationGroupId, garmentId, blueprintFp, visualSpecFp, knowledgeVersion, imageHashes
 */
export function computeReconstructionInputFingerprint(params: {
  packId: string;
  generationGroupId: string;
  garmentId: string;
  stateVersion: number;
  knowledgeVersion: string;
  blueprintFingerprint: string;
  visualSpecFingerprint: string;
  views: ReconstructionInputViewItem[];
}): string {
  const viewsKey = params.views
    .map((v) => `${v.viewId}:${v.imageHash}`)
    .sort()
    .join('|');

  const payload = [
    params.packId,
    params.generationGroupId,
    params.garmentId,
    params.stateVersion,
    params.knowledgeVersion,
    params.blueprintFingerprint,
    params.visualSpecFingerprint,
    viewsKey,
  ].join('##');

  return simpleHash(payload);
}

/**
 * Kiểm tra xem pack có đủ điều kiện pháp lý và kỹ thuật để gửi sang reconstruction hay không
 */
export function validatePackReadyForReconstruction(
  pack: MultiViewReferencePack
): { canProceed: boolean; reason?: string } {
  // 1. Pack bắt buộc phải đạt READY_FOR_3D
  if (pack.status !== 'READY_FOR_3D') {
    return {
      canProceed: false,
      reason: `MultiViewReferencePack chưa đạt trạng thái READY_FOR_3D (hiện tại: ${pack.status}).`,
    };
  }

  // 2. Bắt buộc có đủ 4 góc nhìn
  if (pack.views.length !== 4) {
    return {
      canProceed: false,
      reason: `Thiếu góc nhìn: cần 4 góc, hiện có ${pack.views.length}.`,
    };
  }

  for (const expectedId of ALL_VIEW_IDS) {
    const v = pack.views.find((item) => item.viewId === expectedId);
    if (!v) {
      return {
        canProceed: false,
        reason: `Thiếu góc nhìn bắt buộc: ${expectedId}.`,
      };
    }
    if (v.status !== 'READY') {
      return {
        canProceed: false,
        reason: `Góc nhìn ${expectedId} chưa sẵn sàng (status: ${v.status}).`,
      };
    }
    const imgRef = v.imageUrl || v.imageBase64;
    if (!imgRef) {
      return {
        canProceed: false,
        reason: `Góc nhìn ${expectedId} không có dữ liệu ảnh.`,
      };
    }
    if (!validateTrustedImageRef(imgRef)) {
      return {
        canProceed: false,
        reason: `Góc nhìn ${expectedId} sử dụng đường dẫn ảnh không an toàn (Security Violation: Untrusted Remote URL).`,
      };
    }
  }

  return { canProceed: true };
}

/**
 * Xây dựng ReconstructionInput chuẩn xác và khóa nguồn (Exact Source Binding)
 */
export function buildReconstructionInput(
  pack: MultiViewReferencePack,
  proxyHash: string = 'ca84474aa75788c0'
): ReconstructionInput {
  const validation = validatePackReadyForReconstruction(pack);
  if (!validation.canProceed) {
    throw new Error(validation.reason || 'Pack không đủ điều kiện để tạo 3D.');
  }

  const views: ReconstructionInputViewItem[] = ALL_VIEW_IDS.map((viewId) => {
    const v = pack.views.find((item) => item.viewId === viewId)!;
    const imgRef = v.imageUrl || v.imageBase64 || '';
    const imgHash = v.imageHash || computeImageHash(imgRef);

    return {
      viewId,
      imageHash: imgHash,
      imageBytesRef: imgRef,
    };
  });

  const reconstructionInputFingerprint = computeReconstructionInputFingerprint({
    packId: pack.packId,
    generationGroupId: pack.generationGroupId,
    garmentId: pack.garmentId,
    stateVersion: pack.stateVersion,
    knowledgeVersion: pack.knowledgeVersion,
    blueprintFingerprint: pack.blueprintFingerprint,
    visualSpecFingerprint: pack.visualSpecFingerprint,
    views,
  });

  const timestamp = Date.now();
  const reconstructionId = `recon-${pack.garmentId}-${timestamp}`;

  return {
    reconstructionId,
    packId: pack.packId,
    generationGroupId: pack.generationGroupId,
    garmentId: pack.garmentId,
    stateVersion: pack.stateVersion,
    knowledgeVersion: pack.knowledgeVersion,
    blueprintFingerprint: pack.blueprintFingerprint,
    visualSpecFingerprint: pack.visualSpecFingerprint,
    reconstructionInputFingerprint,
    views,
    structuralReference: {
      garmentId: pack.garmentId,
      proxyVersion: '1.2.0',
      proxyHash,
    },
  };
}
