import * as THREE from 'three';
import {
  Garment3DDefinition,
  Outfit3DState,
  FabricPreset,
  FabricPropertyPreset,
} from './types.ts';

export const FABRIC_PRESETS: Record<FabricPreset, FabricPropertyPreset> = {
  silk: {
    label: 'Lụa tơ tằm',
    roughness: 0.36,
    metalness: 0.12,
    clearcoat: 0.2,
    description: 'Độ bóng nhẹ, ánh mượt đặc trưng của lụa dệt truyền thống.',
  },
  linen: {
    label: 'Đũi / Vải gai',
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.0,
    description: 'Bề mặt mộc tự nhiên, nhám dịu mang vẻ đẹp cổ kính.',
  },
  matte_fabric: {
    label: 'Vải dệt lì',
    roughness: 0.68,
    metalness: 0.03,
    clearcoat: 0.0,
    description: 'Chất vải đương đại mịn lì, bắt sáng dịu mắt.',
  },
};

/**
 * Áp dụng bảng màu, chất liệu và phụ kiện lên mô hình 3D.
 * Tuân thủ nghiêm ngặt nguyên tắc:
 * 1. Không thay đổi hình học (Geometry là Immutable).
 * 2. Luôn clone material, không mutate shared cache.
 * 3. Bảo toàn map, normal map, alpha và doubleSided nếu có sẵn trong model.
 * 4. Bật/tắt visibility phụ kiện an toàn mà không làm crash app.
 */
export function applyOutfitStateToModel(
  root: THREE.Object3D,
  definition: Garment3DDefinition,
  outfitState: Outfit3DState
): void {
  const { palette, fabricPreset, activeAccessories } = outfitState;
  const fabricProps = FABRIC_PRESETS[fabricPreset] || FABRIC_PRESETS.silk;

  const primaryHex = palette.primaryColor || '#8E3028';
  const secondaryHex = palette.secondaryColor || '#C6A56B';
  const accentHex = palette.accentColor || '#355C4A';

  const primarySet = new Set(definition.materialSlots.primary);
  const secondarySet = new Set(definition.materialSlots.secondary);
  const accentSet = new Set(definition.materialSlots.accent);

  // 1. Áp dụng bảng màu và chất liệu lên các Mesh
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const meshName = mesh.name;

      // Mannequin giữ nguyên màu trung tính, không bị đổi màu theo palette trang phục
      if (meshName === 'mannequin' || mesh.parent?.name === 'mannequin') {
        return;
      }

      // Xác định slot màu tương ứng
      let targetColorHex: string | null = null;
      if (primarySet.has(meshName)) {
        targetColorHex = primaryHex;
      } else if (secondarySet.has(meshName)) {
        targetColorHex = secondaryHex;
      } else if (accentSet.has(meshName)) {
        targetColorHex = accentHex;
      } else if (meshName === 'MannequinMesh') {
        // Hỗ trợ cập nhật màu sắc ngay cả trên placeholder ma-nơ-canh
        targetColorHex = primaryHex;
      }

      if (targetColorHex && mesh.material) {
        // Clone material để tránh side-effect giữa các lượt render
        const clonedMaterial = Array.isArray(mesh.material)
          ? mesh.material.map((m) => m.clone())
          : (mesh.material as THREE.Material).clone();

        mesh.material = clonedMaterial;

        // Áp dụng màu và thuộc tính PBR an toàn
        const materialsToUpdate = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materialsToUpdate.forEach((mat) => {
          if ('color' in mat && (mat as any).color instanceof THREE.Color) {
            (mat as any).color.set(targetColorHex);
          }
          if ('roughness' in mat && typeof (mat as any).roughness === 'number') {
            (mat as any).roughness = fabricProps.roughness;
          }
          if ('metalness' in mat && typeof (mat as any).metalness === 'number') {
            (mat as any).metalness = fabricProps.metalness;
          }
          if ('clearcoat' in mat && typeof (mat as any).clearcoat === 'number') {
            (mat as any).clearcoat = fabricProps.clearcoat || 0;
          }
          mat.needsUpdate = true;
        });
      }
    }
  });

  // 2. Cập nhật Visibility cho các Accessory Nodes nếu tồn tại trong file GLB
  const accessoryEntries = Object.entries(definition.accessoryNodes);
  if (accessoryEntries.length > 0) {
    const activeLower = activeAccessories.map((a) => a.toLowerCase());

    accessoryEntries.forEach(([slotKey, nodeName]) => {
      const node = root.getObjectByName(nodeName);
      if (node) {
        const isSelected = activeLower.some(
          (a) =>
            a.includes(slotKey.toLowerCase()) ||
            a.includes(nodeName.toLowerCase())
        );
        node.visible = isSelected;
      }
    });
  }
}

/**
 * Áp dụng hiệu ứng Highlight cấu trúc khi người dùng chọn một structural callout.
 * - Highlight targetNodes bằng ánh sáng vàng champagne ấm (#C6A56B, emissive)
 * - Làm mờ nhẹ (dim) các node trang phục khác (opacity ~ 0.35)
 * - Giữ mannequin trung tính, không highlight mannequin
 * - Khi deselect (highlightedNodes = null): phục hồi hoàn toàn trạng thái màu/vải trước đó.
 */
export function applyStructuralHighlight(
  root: THREE.Object3D,
  definition: Garment3DDefinition,
  highlightedNodes: string[] | null,
  outfitState: Outfit3DState
): void {
  // Nếu không có highlight nào (deselect), phục hồi lại toàn bộ vật liệu
  if (!highlightedNodes || highlightedNodes.length === 0) {
    applyOutfitStateToModel(root, definition, outfitState);
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          if ('opacity' in mat) mat.opacity = 1.0;
          if ('transparent' in mat) mat.transparent = false;
          if ('emissive' in mat) mat.emissive.set(0x000000);
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.0;
          mat.needsUpdate = true;
        }
      }
    });
    return;
  }

  const highlightSet = new Set(highlightedNodes);

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const meshName = mesh.name;
      const isMannequin = meshName === 'mannequin' || mesh.parent?.name === 'mannequin';

      if (isMannequin) {
        // Mannequin giữ neutral, mờ nhẹ để tôn trang phục
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && 'opacity' in mat) {
          mat.transparent = true;
          mat.opacity = 0.5;
          mat.needsUpdate = true;
        }
        return;
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      mat.transparent = true;

      if (highlightSet.has(meshName)) {
        // Node mục tiêu được chọn: sáng rõ, nhấn ánh vàng champagne thanh lịch (KHÔNG dùng warning-red)
        mat.opacity = 1.0;
        if ('emissive' in mat) {
          mat.emissive.set('#C6A56B');
          mat.emissiveIntensity = 0.45;
        }
      } else {
        // Node trang phục khác: làm mờ nhẹ để tập trung thị giác vào node đang khám phá
        mat.opacity = 0.35;
        if ('emissive' in mat) {
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0.0;
        }
      }
      mat.needsUpdate = true;
    }
  });
}
