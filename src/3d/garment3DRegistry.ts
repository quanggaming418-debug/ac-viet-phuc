import { Garment3DDefinition, Garment3DId, CanonicalGarmentName } from './types.ts';

export const GARMENT_3D_REGISTRY: Record<Garment3DId, Garment3DDefinition> = {
  ngu_than_tay_chen: {
    garmentId: 'ngu_than_tay_chen',
    displayName: 'Áo ngũ thân tay chẽn',
    canonicalName: 'Áo ngũ thân tay chẽn',
    version: '1.2.0',
    modelAuthority: 'STRUCTURAL_PROXY',
    modelUrl: '/models/ngu-than-tay-chen-proxy.glb',
    fallbackModelUrl: '/models/placeholder-garment.glb',
    // Core Identity Critical Nodes (Bắt buộc cho nhận diện phom dáng)
    identityCriticalNodes: ['outer_body', 'left_sleeve', 'right_sleeve', 'inner_fifth_panel'],
    // Supporting Structure
    supportingNodes: ['standing_collar', 'closure_buttons'],
    // Structural Nodes tổng hợp
    structuralNodes: ['outer_body', 'standing_collar', 'left_sleeve', 'right_sleeve', 'inner_fifth_panel'],
    // Optional Nodes
    optionalNodes: ['inner_layer', 'collar_trim', 'trousers'],
    ensembleNodes: ['inner_layer', 'trousers', 'khan_van', 'quat_go', 'guoc_moc'],
    materialSlots: {
      primary: ['outer_body', 'left_sleeve', 'right_sleeve', 'MannequinMesh'],
      secondary: ['inner_fifth_panel', 'standing_collar', 'inner_layer'],
      accent: ['closure_buttons', 'collar_trim', 'waist_tie'],
    },
    accessoryNodes: {
      headwear: 'khan_van',
      necklace: 'chuoi_ngoc',
      fan: 'quat_go',
      footwear: 'guoc_moc',
    },
    cameraPreset: {
      position: [0, 0.35, 2.8],
      target: [0, 0, 0],
      fov: 45,
      minDistance: 1.2,
      maxDistance: 5.5,
    },
    structuralCallouts: [
      {
        id: 'ngu_than_five_panel',
        label: 'Hệ năm thân',
        description: 'Cấu tạo gồm năm thân vải ghép dọc, vạt con thứ năm (inner_fifth_panel) cài kín bên trong thân trước.',
        targetNodes: ['outer_body', 'inner_fifth_panel'],
        level: 'identity',
      },
      {
        id: 'ngu_than_fitted_sleeve',
        label: 'Tay thu về cổ tay',
        description: 'Tay áo rộng hơn ở vùng nách rồi thu dần về cổ tay mà không xòe rộng.',
        targetNodes: ['left_sleeve', 'right_sleeve'],
        level: 'identity',
      },
      {
        id: 'ngu_than_loose_silhouette',
        label: 'Phom tương đối rộng / không bodycon',
        description: 'Dáng áo buông suông thẳng tự nhiên, tuyệt đối không bóp eo hay chiết eo ôm sát.',
        targetNodes: ['outer_body'],
        level: 'identity',
      },
      {
        id: 'ngu_than_standing_collar',
        label: 'Cổ đứng / lập lĩnh',
        description: 'Cổ áo dựng đứng ôm vừa vặn chân cổ, thanh lịch và trang nhã.',
        targetNodes: ['standing_collar'],
        level: 'supporting',
      },
    ],
  },

  ao_tac: {
    garmentId: 'ao_tac',
    displayName: 'Áo tấc',
    canonicalName: 'Áo tấc',
    version: '1.2.0',
    modelAuthority: 'STRUCTURAL_PROXY',
    modelUrl: '/models/ao-tac-proxy.glb',
    fallbackModelUrl: '/models/placeholder-garment.glb',
    // Core Identity Critical Nodes (Áo tấc bắt buộc thân ngũ thân, fifth panel và 2 tay thụng rộng)
    identityCriticalNodes: ['outer_body', 'wide_left_sleeve', 'wide_right_sleeve', 'inner_fifth_panel'],
    // Supporting Structure
    supportingNodes: ['standing_collar', 'closure_buttons'],
    // Structural Nodes
    structuralNodes: ['outer_body', 'standing_collar', 'wide_left_sleeve', 'wide_right_sleeve', 'inner_fifth_panel'],
    // Optional Nodes
    optionalNodes: ['sheer_outer_layer', 'trousers', 'inner_flap'],
    ensembleNodes: ['trousers', 'khan_van', 'chuoi_ngoc', 'quat_long', 'hai_theu'],
    materialSlots: {
      primary: ['outer_body', 'wide_left_sleeve', 'wide_right_sleeve', 'MannequinMesh'],
      secondary: ['inner_fifth_panel', 'standing_collar', 'trousers'],
      accent: ['closure_buttons', 'collar_lining'],
    },
    accessoryNodes: {
      headwear: 'khan_van',
      necklace: 'chuoi_ngoc',
      fan: 'quat_long',
      footwear: 'hai_theu',
    },
    cameraPreset: {
      position: [0, 0.3, 3.1],
      target: [0, -0.05, 0],
      fov: 45,
      minDistance: 1.3,
      maxDistance: 6.0,
    },
    structuralCallouts: [
      {
        id: 'ao_tac_five_panel',
        label: 'Hệ năm thân',
        description: 'Thuộc hệ năm thân truyền thống thời Nguyễn với thân áo rộng rãi bề thế và vạt con bên trong.',
        targetNodes: ['outer_body', 'inner_fifth_panel'],
        level: 'identity',
      },
      {
        id: 'ao_tac_wide_sleeve',
        label: 'Tay rộng / tay thụng',
        description: 'Tay áo thụng rộng hình chữ nhật buông thả tự nhiên, tạo khí chất uy nghiêm và trang trọng.',
        targetNodes: ['wide_left_sleeve', 'wide_right_sleeve'],
        level: 'identity',
      },
      {
        id: 'ao_tac_natural_drape',
        label: 'Phom buông tự nhiên',
        description: 'Thân áo buông thả tự nhiên bề thế, không chiết eo hay tạo dáng bodycon.',
        targetNodes: ['outer_body'],
        level: 'identity',
      },
      {
        id: 'ao_tac_standing_collar',
        label: 'Cổ đứng / lập lĩnh',
        description: 'Cổ đứng ngay ngắn theo quy chuẩn lễ phục truyền thống.',
        targetNodes: ['standing_collar'],
        level: 'supporting',
      },
    ],
  },

  ao_tu_than: {
    garmentId: 'ao_tu_than',
    displayName: 'Áo tứ thân',
    canonicalName: 'Áo tứ thân',
    version: '1.2.0',
    modelAuthority: 'STRUCTURAL_PROXY',
    modelUrl: '/models/ao-tu-than-proxy.glb',
    fallbackModelUrl: '/models/placeholder-garment.glb',
    // Core Identity Critical Nodes (Bốn thân vải tách biệt)
    identityCriticalNodes: [
      'back_left_panel',
      'back_right_panel',
      'front_left_flap',
      'front_right_flap',
    ],
    // Supporting Structure
    supportingNodes: ['collar_band', 'inner_tie'],
    // Structural Nodes
    structuralNodes: [
      'back_left_panel',
      'back_right_panel',
      'front_left_flap',
      'front_right_flap',
    ],
    // Optional Nodes của chiếc áo
    optionalNodes: ['collar_band', 'inner_tie'],
    // Ensemble Nodes: yếm, áo cánh, váy, thắt lưng
    ensembleNodes: [
      'ensemble_yem',
      'ensemble_ao_canh',
      'ensemble_skirt',
      'ensemble_sash',
      'yem',
      'ao_canh',
      'skirt',
      'sash_tie',
      'headscarf',
      'non_quai_thao',
      'footwear',
    ],
    materialSlots: {
      primary: [
        'back_left_panel',
        'back_right_panel',
        'front_left_flap',
        'front_right_flap',
        'MannequinMesh',
      ],
      secondary: ['ensemble_yem', 'ensemble_skirt', 'ensemble_ao_canh', 'yem', 'skirt', 'ao_canh'],
      accent: ['ensemble_sash', 'collar_band', 'inner_tie', 'sash_tie', 'headscarf'],
    },
    accessoryNodes: {
      headwear: 'khan_mo_qua',
      hat: 'non_quai_thao',
      jewelry: 'kieng_bac',
      footwear: 'guoc_moc',
    },
    cameraPreset: {
      position: [0, 0.25, 2.7],
      target: [0, 0, 0],
      fov: 45,
      minDistance: 1.2,
      maxDistance: 5.2,
    },
    structuralCallouts: [
      {
        id: 'tu_than_four_panel',
        label: 'Cấu trúc bốn thân',
        description: 'Bốn thân vải gồm hai thân sau ghép dọc sống lưng và hai thân vạt trước tách rời.',
        targetNodes: ['back_left_panel', 'back_right_panel', 'front_left_flap', 'front_right_flap'],
        level: 'identity',
      },
      {
        id: 'tu_than_back_seam',
        label: 'Hai phần sau ghép tại sống lưng',
        description: 'Đường ghép sống lưng thẳng tắp chính giữa phía sau lưng áo.',
        targetNodes: ['back_left_panel', 'back_right_panel'],
        level: 'identity',
      },
      {
        id: 'tu_than_front_flaps',
        label: 'Hai vạt trước tách rời',
        description: 'Hai thân vạt phía trước buông rủ riêng biệt, không cài kín cố định.',
        targetNodes: ['front_left_flap', 'front_right_flap'],
        level: 'identity',
      },
      {
        id: 'tu_than_open_front',
        label: 'Mặt trước mở',
        description: 'Cấu trúc mở tự do phía trước, có thể để buông thẳng tự nhiên hoặc thắt vạt gọn gàng.',
        targetNodes: ['front_left_flap', 'front_right_flap'],
        level: 'identity',
      },
    ],
  },
};

/**
 * Chuyển tên chuẩn của Garment trong hệ thống thành Garment3DId
 */
export function canonicalTo3DId(name: string): Garment3DId {
  if (name.includes('chẽn') || name === 'ngu_than_tay_chen') {
    return 'ngu_than_tay_chen';
  }
  if (name.includes('tấc') || name.includes('thụng') || name === 'ao_tac') {
    return 'ao_tac';
  }
  if (name.includes('tứ thân') || name === 'ao_tu_than') {
    return 'ao_tu_than';
  }
  return 'ao_tac';
}

/**
 * Lấy định nghĩa Garment3DDefinition theo ID hoặc Canonical Name
 */
export function getGarment3DDefinition(identifier: string): Garment3DDefinition {
  const id = canonicalTo3DId(identifier);
  return GARMENT_3D_REGISTRY[id];
}
