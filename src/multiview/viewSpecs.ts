import type { ViewId, ViewSpec } from './types.ts';

export const VIEW_SPECS: Record<ViewId, ViewSpec> = {
  FRONT: {
    viewId: 'FRONT',
    label: 'Chính diện (Front)',
    cameraAngle: 'straight-on direct eye-level front view (0 degrees)',
    subjectDirection: 'model facing straight towards camera, erect symmetrical pose',
    framing: 'Full-length head-to-toe shot showing complete model height with clear headroom and visible footwear on the ground',
    focusTraits: [
      'front_silhouette',
      'standing_collar',
      'sleeve_widths',
      'front_overlap_or_opening',
      'primary_palette',
      'chest_accessories',
    ],
    visibleExpectations: [
      'front_silhouette',
      'collar',
      'sleeve_drape',
      'front_closure',
      'lower_garment_front',
    ],
    obscuredExpectations: [
      'center_back_seam',
      'back_neck_line',
      'rear_hem_line',
    ],
    promptCameraDirective:
      'Camera positioned directly in front at eye level (0 degrees rotation). Full-length composition from head to toe showing the model facing forward towards the camera. The front garment silhouette, neckline collar, front closure, sleeve width, and lower trousers/skirt are clearly visible.',
  },

  THREE_QUARTER_LEFT: {
    viewId: 'THREE_QUARTER_LEFT',
    label: '3/4 Trái (Three-Quarter Left)',
    cameraAngle: 'three-quarter diagonal angle rotated approximately 45 degrees to the left',
    subjectDirection: 'model angled 45 degrees towards the left, torso turned slightly with head aligned naturally, showing left side depth',
    framing: 'Full-length head-to-toe shot preserving entire body height, headroom, and floor contact',
    focusTraits: [
      'silhouette_depth',
      'left_sleeve_profile',
      'lateral_volume',
      'side_panel_drape',
      'garment_movement',
    ],
    visibleExpectations: [
      'silhouette_depth',
      'left_sleeve_shape',
      'side_seam_flow',
      'partial_front_closure',
      'partial_back_silhouette',
    ],
    obscuredExpectations: [
      'right_sleeve_hidden_profile',
      'direct_center_back_seam',
    ],
    promptCameraDirective:
      'Camera positioned at a 3/4 left perspective (rotated 45 degrees to the left). Full-length composition showing the model angled three-quarters left towards camera. The side depth, left sleeve profile, natural fold drape of side panels, and garment silhouette volume are clearly captured.',
  },

  BACK: {
    viewId: 'BACK',
    label: 'Phía sau (Back)',
    cameraAngle: 'direct straight-on back view from behind (180 degrees)',
    subjectDirection: 'model facing directly away from camera, standing straight without twisting head or torso',
    framing: 'Full-length head-to-toe shot showing complete model height from behind, with headroom and visible heels on the floor',
    focusTraits: [
      'back_silhouette',
      'center_back_structure',
      'rear_sleeve_drape',
      'back_fabric_fall',
      'rear_hair_or_headwear',
    ],
    visibleExpectations: [
      'back_silhouette',
      'center_back_line',
      'back_fabric_drape',
      'rear_sleeves',
      'rear_footwear',
    ],
    obscuredExpectations: [
      'standing_collar_front',
      'front_buttons_or_overlap',
      'inner_fifth_panel',
      'front_open_panels',
      'chest_necklace_or_brooch',
      'front_face_expression',
    ],
    promptCameraDirective:
      'Camera positioned directly behind the model (180 degrees back view). Full-length composition showing the model facing away from the camera. The back garment silhouette, clean unbroken rear fabric drape, center back spine line, and rear sleeve fall are clearly visible. No front buttons or front closures are visible.',
  },

  THREE_QUARTER_RIGHT: {
    viewId: 'THREE_QUARTER_RIGHT',
    label: '3/4 Phải (Three-Quarter Right)',
    cameraAngle: 'three-quarter diagonal angle rotated approximately 45 degrees to the right',
    subjectDirection: 'model angled 45 degrees towards the right, torso turned with head naturally aligned, showing right side depth',
    framing: 'Full-length head-to-toe shot preserving entire body height, headroom, and floor contact',
    focusTraits: [
      'silhouette_depth',
      'right_sleeve_profile',
      'lateral_volume',
      'right_closure_side_overlap',
      'side_panel_drape',
    ],
    visibleExpectations: [
      'silhouette_depth',
      'right_sleeve_shape',
      'right_side_overlap',
      'side_seam_flow',
      'partial_back_silhouette',
    ],
    obscuredExpectations: [
      'left_sleeve_hidden_profile',
      'direct_center_back_seam',
    ],
    promptCameraDirective:
      'Camera positioned at a 3/4 right perspective (rotated 45 degrees to the right). Full-length composition showing the model angled three-quarters right towards camera. The right side volume, right sleeve profile, diagonal closure overlap, and natural garment drape are clearly captured.',
  },
};

export function getViewSpec(viewId: ViewId): ViewSpec {
  return VIEW_SPECS[viewId];
}
