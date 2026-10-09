import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Căn giữa và chuẩn hóa kích thước mô hình 3D theo nguyên tắc UNIFORM SCALE tuyệt đối.
 * Không bóp méo, không scale riêng từng trục, không thay đổi tỷ lệ phom dáng nguyên bản.
 */
export function normalizeAndCenterModel(
  root: THREE.Object3D,
  targetSize: number = 2.0
): void {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Căn tâm hình học về gốc (0, 0, 0)
  root.position.sub(center);

  // Scale đồng dạng (Uniform Scale) duy nhất
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0 && Math.abs(maxDim - targetSize) > 0.001) {
    const uniformScale = targetSize / maxDim;
    root.scale.setScalar(uniformScale);
  }
}

/**
 * Thiết lập hệ thống ánh sáng phong cách Aurora Heritage Studio
 */
export function setupStudioLighting(scene: THREE.Scene): void {
  // 1. Ambient Light ấm áp
  const ambientLight = new THREE.AmbientLight(0xfff8f2, 1.25);
  ambientLight.name = 'studio_ambient';
  scene.add(ambientLight);

  // 2. Key Light (Vàng champagne hoàng gia)
  const keyLight = new THREE.DirectionalLight(0xffeed6, 2.3);
  keyLight.position.set(3.5, 5, 4);
  keyLight.name = 'studio_key';
  scene.add(keyLight);

  // 3. Fill Light (Xanh gốm men dịu)
  const fillLight = new THREE.DirectionalLight(0xd9ebff, 1.15);
  fillLight.position.set(-4, 3, -2);
  fillLight.name = 'studio_fill';
  scene.add(fillLight);

  // 4. Rim Light (Tách lớp viền bóng)
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
  rimLight.position.set(0, -2, -4);
  rimLight.name = 'studio_rim';
  scene.add(rimLight);

  // 5. Đĩa bóng tiếp xúc dưới sàn (Ground Contact Shadow Disk)
  const shadowGeo = new THREE.CircleGeometry(0.55, 32);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x181716,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -1.22;
  shadowMesh.name = 'ground_contact_shadow';
  scene.add(shadowMesh);
}

/**
 * Thu dọn triệt để tài nguyên Three.js khi Unmount tránh rò rỉ WebGL context
 */
export function disposeThreeResources(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  controls?: OrbitControls | null
): void {
  if (controls) {
    controls.dispose();
  }

  scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          disposeMaterial(mat);
        });
      } else if (mesh.material) {
        disposeMaterial(mesh.material);
      }
    }
  });

  renderer.dispose();
}

function disposeMaterial(mat: THREE.Material): void {
  // Dispose textures attached to material
  Object.keys(mat).forEach((prop) => {
    const val = (mat as any)[prop];
    if (val && typeof val === 'object' && 'isTexture' in val && val.isTexture) {
      val.dispose();
    }
  });
  mat.dispose();
}
