import type { GarmentId, MultiViewReferencePack } from '../multiview/types.ts';
import type {
  Reconstructed3DArtifact,
  ReconstructionIssueCode,
  ReconstructionStructuralComparison,
  StructuralTraitComparison,
  StructuralComparisonVerdict,
  TraitComparisonVerdict,
  ReconstructionSnapshotSet,
} from './types.ts';

/**
 * Danh sách toàn bộ các mã lỗi hình thái học của quá trình dựng 3D
 */
export const RECONSTRUCTION_ISSUE_CODES: ReconstructionIssueCode[] = [
  'RECON_GARMENT_DRIFT',
  'RECON_BODYCON_DRIFT',
  'RECON_SLEEVE_TOO_NARROW',
  'RECON_SLEEVE_SHAPE_CHANGED',
  'RECON_TU_THAN_FRONT_CLOSED',
  'RECON_TU_THAN_FRONT_PANELS_MERGED',
  'RECON_BACK_STRUCTURE_DRIFT',
  'RECON_FOREIGN_GARMENT_CUES',
  'RECON_MISSING_LOWER_BODY',
  'RECON_GEOMETRY_CORRUPTED',
  'RECON_TEXTURE_CORRUPTED',
  'RECON_ARTIFACT_UNUSABLE',
  'RECON_INSUFFICIENT_VISIBILITY',
];

export interface GarmentTraitDefinition {
  traitId: string;
  name: string;
  proxyExpectation: string;
  critical: boolean;
  issueCodeOnMismatch: ReconstructionIssueCode;
}

/**
 * Định nghĩa bộ tiêu chuẩn hình thái học theo từng dáng phục
 * Tuyệt đối không dùng kích thước centimet hay khoảng cách đỉnh (vertex distance)
 */
export const GARMENT_TRAIT_DEFINITIONS: Record<GarmentId, GarmentTraitDefinition[]> = {
  ngu_than_tay_chen: [
    {
      traitId: 'tapered_sleeves',
      name: 'Dáng tay chẽn thu về cổ tay',
      proxyExpectation: 'Tay áo rộng hơn ở vùng nách rồi thu dần vừa vặn về cổ tay, không xòe thụng.',
      critical: true,
      issueCodeOnMismatch: 'RECON_SLEEVE_SHAPE_CHANGED',
    },
    {
      traitId: 'non_bodycon_silhouette',
      name: 'Phom suông thẳng tự nhiên (không bodycon / không bóp eo)',
      proxyExpectation: 'Dáng áo buông suông thẳng thoải mái theo hệ năm thân, không chiết eo ôm sát.',
      critical: true,
      issueCodeOnMismatch: 'RECON_BODYCON_DRIFT',
    },
    {
      traitId: 'standing_collar',
      name: 'Cổ đứng lập lĩnh hỗ trợ',
      proxyExpectation: 'Cổ áo đứng vuông vắn ôm vừa cổ khi quan sát được.',
      critical: false,
      issueCodeOnMismatch: 'RECON_GARMENT_DRIFT',
    },
    {
      traitId: 'five_panel_intent',
      name: 'Ý định cấu trúc năm thân (vạt con thứ năm)',
      proxyExpectation: 'Thân vải thể hiện ý định năm thân cài kín (chỉ đánh giá khi quan sát thấy).',
      critical: false,
      issueCodeOnMismatch: 'RECON_GARMENT_DRIFT',
    },
  ],

  ao_tac: [
    {
      traitId: 'wide_loose_sleeves',
      name: 'Tay áo thụng rộng buông dài',
      proxyExpectation: 'Tay áo rộng hình chữ nhật buông dài quá gối, không ôm thắt lại như tay chẽn.',
      critical: true,
      issueCodeOnMismatch: 'RECON_SLEEVE_TOO_NARROW',
    },
    {
      traitId: 'non_bodycon_silhouette',
      name: 'Phom áo buông rộng trang trọng',
      proxyExpectation: 'Dáng áo rộng rãi buông thẳng tự nhiên, tôn nét trang nghiêm.',
      critical: true,
      issueCodeOnMismatch: 'RECON_BODYCON_DRIFT',
    },
    {
      traitId: 'standing_collar',
      name: 'Cổ đứng lập lĩnh hỗ trợ',
      proxyExpectation: 'Cổ đứng truyền thống khi nhìn từ góc trước hoặc bên.',
      critical: false,
      issueCodeOnMismatch: 'RECON_GARMENT_DRIFT',
    },
    {
      traitId: 'five_panel_intent',
      name: 'Hệ năm thân buông dài',
      proxyExpectation: 'Thân áo buông dài trang trọng phù hợp hệ năm thân.',
      critical: false,
      issueCodeOnMismatch: 'RECON_GARMENT_DRIFT',
    },
  ],

  ao_tu_than: [
    {
      traitId: 'two_separate_front_flaps',
      name: 'Hai vạt trước tách rời',
      proxyExpectation: 'Hai vạt phía trước buông riêng biệt, không bị dính liền thành một mảng kín.',
      critical: true,
      issueCodeOnMismatch: 'RECON_TU_THAN_FRONT_PANELS_MERGED',
    },
    {
      traitId: 'open_front',
      name: 'Mặt trước mở buông tự do',
      proxyExpectation: 'Cấu trúc mở phía trước để lộ yếm bên trong, không cài nút đóng kín mít như áo ngũ thân.',
      critical: true,
      issueCodeOnMismatch: 'RECON_TU_THAN_FRONT_CLOSED',
    },
    {
      traitId: 'center_back_join',
      name: 'Đường ghép sống lưng phía sau',
      proxyExpectation: 'Đường nối dọc chính giữa sống lưng phía sau quan sát được ở góc nhìn sau lưng.',
      critical: false,
      issueCodeOnMismatch: 'RECON_BACK_STRUCTURE_DRIFT',
    },
    {
      traitId: 'four_panel_intent',
      name: 'Ý định cấu trúc bốn thân',
      proxyExpectation: 'Tổng thể chia làm bốn thân vải buông rủ.',
      critical: false,
      issueCodeOnMismatch: 'RECON_GARMENT_DRIFT',
    },
  ],
};

/**
 * Thực hiện so sánh hình thái học giữa Reconstruction quan sát được và kỳ vọng Structural Proxy
 */
export function compareReconstructionStructure(
  garmentId: GarmentId,
  observations?: Partial<Record<string, { verdict: TraitComparisonVerdict; notes?: string }>>,
  _snapshots?: ReconstructionSnapshotSet
): ReconstructionStructuralComparison {
  const defs = GARMENT_TRAIT_DEFINITIONS[garmentId] || GARMENT_TRAIT_DEFINITIONS.ao_tac;
  const traits: StructuralTraitComparison[] = [];
  const issueCodes: ReconstructionIssueCode[] = [];

  let hasCriticalMismatch = false;
  let hasPartial = false;

  for (const def of defs) {
    const obs = observations?.[def.traitId];
    const verdict: TraitComparisonVerdict = obs?.verdict || 'MATCH';
    const reason = obs?.notes || (verdict === 'MATCH' ? 'Khớp với đặc tả cấu trúc của proxy' : 'Phát hiện sai lệch hình thái');

    if (verdict === 'MISMATCH') {
      if (def.critical) {
        hasCriticalMismatch = true;
      }
      if (!issueCodes.includes(def.issueCodeOnMismatch)) {
        issueCodes.push(def.issueCodeOnMismatch);
      }
    } else if (verdict === 'PARTIAL' || verdict === 'NOT_ASSESSABLE') {
      hasPartial = true;
    }

    traits.push({
      traitId: def.traitId,
      proxyExpectation: def.proxyExpectation,
      reconstructedObservation: reason,
      verdict,
      critical: def.critical,
      reason,
    });
  }

  let overall: StructuralComparisonVerdict = 'ACCEPT';
  if (hasCriticalMismatch) {
    overall = 'REJECT';
  } else if (hasPartial) {
    overall = 'NEEDS_REVIEW';
  }

  const summary =
    overall === 'ACCEPT'
      ? 'Mô hình tái tạo AI giữ được đầy đủ các đặc trưng hình thái cốt lõi của trang phục.'
      : overall === 'REJECT'
        ? `Từ chối mô hình: phát hiện vi phạm đặc trưng cốt lõi (${issueCodes.join(', ')}).`
        : 'Mô hình đạt phần lớn tiêu chí nhưng một số đặc trưng phụ cần được kiểm tra thêm.';

  return {
    garmentId,
    overall,
    traits,
    issueCodes,
    summary,
  };
}

/**
 * Cổng kiểm duyệt chấp nhận (Acceptance Gate) cho bản dựng 3D
 */
export function evaluateAcceptanceGate(
  artifact: Reconstructed3DArtifact,
  currentFingerprint: string,
  sourcePack: MultiViewReferencePack
): {
  status: 'ACCEPTED_FOR_VISUALIZATION' | 'NEEDS_REVIEW' | 'REJECTED';
  reason?: string;
} {
  // 1. Technical validation phải PASS
  if (!artifact.technicalValidation.isValid) {
    return {
      status: 'REJECTED',
      reason: `Kiểm tra kỹ thuật GLB thất bại: ${artifact.technicalValidation.issues.join('; ')}`,
    };
  }

  // 2. Reconstructed garmentId phải khớp với source pack
  if (artifact.garmentId !== sourcePack.garmentId) {
    return {
      status: 'REJECTED',
      reason: `Sai lệch mã trang phục: artifact (${artifact.garmentId}) khác với source pack (${sourcePack.garmentId}).`,
    };
  }

  // 3. Không có critical structural mismatch
  if (artifact.structuralComparison?.overall === 'REJECT') {
    return {
      status: 'REJECTED',
      reason: `Thẩm định hình thái học từ chối: ${artifact.structuralComparison.summary}`,
    };
  }

  // 4. Input fingerprint vẫn phải là current (chống stale)
  if (artifact.inputFingerprint !== currentFingerprint) {
    return {
      status: 'REJECTED',
      reason: 'Bản phối đã thay đổi (Stale Artifact: Fingerprint mismatch).',
    };
  }

  // 5. Source pack vẫn phải ở trạng thái READY_FOR_3D
  if (sourcePack.status !== 'READY_FOR_3D') {
    return {
      status: 'REJECTED',
      reason: `Source pack không còn ở trạng thái READY_FOR_3D (hiện tại: ${sourcePack.status}).`,
    };
  }

  // Nếu structural comparison yêu cầu review thêm
  if (artifact.structuralComparison?.overall === 'NEEDS_REVIEW') {
    return {
      status: 'NEEDS_REVIEW',
      reason: artifact.structuralComparison.summary,
    };
  }

  return {
    status: 'ACCEPTED_FOR_VISUALIZATION',
  };
}
