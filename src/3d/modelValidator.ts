import * as THREE from 'three';
import {
  Garment3DDefinition,
  ModelValidationResult,
  ModelValidationIssue,
  ModelAuthority,
} from './types.ts';

/**
 * Kiểm định cấu trúc Node contract trong mô hình GLTF 3D.
 * Tuân thủ quy tắc Domain:
 * 1. Phân biệt rõ identityCriticalNodes và supportingNodes.
 * 2. Missing identityCriticalNode -> identityContractSatisfied = false, isValid = false.
 * 3. Missing supportingNode -> warning / partial support, identityContractSatisfied = true.
 * 4. Missing optionalNode / ensembleNode (yếm, váy, v.v.) -> info only, KHÔNG fail garment validation.
 * 5. Placeholder runtime hiển thị đúng modelAuthority = 'PLACEHOLDER'.
 */
export function validateGarmentModel(
  root: THREE.Object3D,
  definition: Garment3DDefinition
): ModelValidationResult {
  const foundNodes: string[] = [];
  const nodeMap = new Map<string, THREE.Object3D>();

  root.traverse((child) => {
    if (child.name) {
      foundNodes.push(child.name);
      nodeMap.set(child.name, child);
    }
  });

  // Kiểm tra nhận diện Placeholder model kỹ thuật
  const isPlaceholder =
    nodeMap.has('GarmentMannequin') ||
    nodeMap.has('MannequinMesh') ||
    root.name === 'GarmentMannequin';

  const issues: ModelValidationIssue[] = [];
  const missingIdentityCriticalNodes: string[] = [];
  const missingSupportingNodes: string[] = [];
  const missingOptionalNodes: string[] = [];

  if (isPlaceholder) {
    issues.push({
      type: 'info',
      nodeName: 'GarmentMannequin',
      severity: 'info',
      message: 'Mô hình đang sử dụng dạng ma-nơ-canh placeholder kỹ thuật thử nghiệm.',
    });

    return {
      isValid: true,
      canRender: true,
      identityContractSatisfied: true,
      modelAuthority: 'PLACEHOLDER',
      isPlaceholder: true,
      foundNodes,
      missingIdentityCriticalNodes: [],
      missingSupportingNodes: [],
      missingOptionalNodes: [],
      issues,
    };
  }

  // 1. Kiểm tra Identity Critical Nodes (Bắt buộc cho nhận diện phom dáng)
  for (const critNode of definition.identityCriticalNodes) {
    if (!nodeMap.has(critNode)) {
      missingIdentityCriticalNodes.push(critNode);
      issues.push({
        type: 'missing_identity_critical_node',
        nodeName: critNode,
        severity: 'error',
        message: `Thiếu node nhận diện cốt lõi (Identity Critical): "${critNode}" trong mô hình ${definition.displayName}.`,
      });
    }
  }

  // 2. Kiểm tra Supporting Nodes (Cấu trúc hỗ trợ: thiếu tạo warning, KHÔNG fail core identity)
  for (const supNode of definition.supportingNodes) {
    if (!nodeMap.has(supNode)) {
      missingSupportingNodes.push(supNode);
      issues.push({
        type: 'missing_supporting_node',
        nodeName: supNode,
        severity: 'warning',
        message: `Thiếu node cấu trúc hỗ trợ "${supNode}" trong ${definition.displayName} (vẫn giữ được nhận diện cốt lõi).`,
      });
    }
  }

  // 3. Kiểm tra Optional Nodes (Tùy chọn: info only)
  for (const optNode of definition.optionalNodes) {
    if (!nodeMap.has(optNode)) {
      missingOptionalNodes.push(optNode);
      issues.push({
        type: 'missing_optional_node',
        nodeName: optNode,
        severity: 'info',
        message: `Node tùy chọn "${optNode}" chưa xuất hiện trong mô hình này.`,
      });
    }
  }

  // Quy tắc xác định tính hợp lệ:
  // Chỉ fail nếu thiếu identityCriticalNode
  const identityContractSatisfied = missingIdentityCriticalNodes.length === 0;
  const canRender = identityContractSatisfied;
  const isValid = identityContractSatisfied;

  // Xác định ModelAuthority runtime
  let modelAuthority: ModelAuthority = 'PLACEHOLDER';
  if (identityContractSatisfied) {
    modelAuthority = definition.modelAuthority;
  }

  if (process.env.NODE_ENV !== 'production' && issues.length > 0) {
    console.debug(`[AC 3D Validator] ${definition.displayName}:`, {
      isValid,
      identityContractSatisfied,
      canRender,
      missingIdentityCriticalNodes,
      missingSupportingNodes,
      missingOptionalNodes,
    });
  }

  return {
    isValid,
    canRender,
    identityContractSatisfied,
    modelAuthority,
    isPlaceholder: false,
    foundNodes,
    missingIdentityCriticalNodes,
    missingSupportingNodes,
    missingOptionalNodes,
    issues,
  };
}
