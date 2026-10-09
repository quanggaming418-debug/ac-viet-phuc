import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js 22 environment
if (typeof (globalThis as any).FileReader === 'undefined') {
  (globalThis as any).FileReader = class FileReader {
    onloadend: (() => void) | null = null;
    result: ArrayBuffer | null = null;
    readAsArrayBuffer(blob: any) {
      blob.arrayBuffer().then((buf: ArrayBuffer) => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
      });
    }
  };
}

// Color constants matching AC visual guidelines
const COLOR_MANNEQUIN = 0xd8d3cc;
const COLOR_PRIMARY = 0x8e3028;    // Terracotta silk
const COLOR_SECONDARY = 0xf1e6d2;  // Warm ivory
const COLOR_ACCENT = 0xc6a56b;     // Champagne brass

const MAT_MANNEQUIN = new THREE.MeshStandardMaterial({
  color: COLOR_MANNEQUIN,
  roughness: 0.8,
  metalness: 0.05,
});

const MAT_PRIMARY = new THREE.MeshStandardMaterial({
  color: COLOR_PRIMARY,
  roughness: 0.45,
  metalness: 0.1,
  side: THREE.DoubleSide,
});

const MAT_SECONDARY = new THREE.MeshStandardMaterial({
  color: COLOR_SECONDARY,
  roughness: 0.5,
  metalness: 0.05,
  side: THREE.DoubleSide,
});

const MAT_ACCENT = new THREE.MeshStandardMaterial({
  color: COLOR_ACCENT,
  roughness: 0.35,
  metalness: 0.25,
});

/**
 * Creates neutral mannequin stand (base + rod + torso)
 */
function createMannequin(): THREE.Group {
  const mannequinGroup = new THREE.Group();
  mannequinGroup.name = 'mannequin';

  // Base stand disk
  const baseDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.04, 32),
    MAT_MANNEQUIN
  );
  baseDisk.position.y = -1.22;
  mannequinGroup.add(baseDisk);

  // Slim vertical stand rod
  const standRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.85, 16),
    MAT_MANNEQUIN
  );
  standRod.position.y = -0.78;
  mannequinGroup.add(standRod);

  // Mannequin neck and head finial
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.22, 16),
    MAT_MANNEQUIN
  );
  neck.position.y = 0.65;
  mannequinGroup.add(neck);

  const headFinial = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    MAT_MANNEQUIN
  );
  headFinial.position.y = 0.8;
  mannequinGroup.add(headFinial);

  return mannequinGroup;
}

/**
 * PROXY 1: Áo ngũ thân tay chẽn
 * Features:
 * - Straight natural silhouette, no bodycon
 * - Fifth panel (inner_fifth_panel) nested beneath front flap
 * - Standing collar
 * - Tapered sleeves (left_sleeve, right_sleeve) narrowing from armpit to wrist
 * - Right closure buttons
 */
export function buildNguThanTayChenScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = 'ngu_than_tay_chen_root';

  scene.add(createMannequin());

  // Outer body: Five-panel family, natural straight silhouette falling to knee (-0.75)
  // Generous cylindrical body, no waist cinch
  const outerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.42, 1.35, 24, 1, true),
    MAT_PRIMARY
  );
  outerBody.name = 'outer_body';
  outerBody.position.y = -0.05;
  scene.add(outerBody);

  // Inner fifth panel (vạt con thứ năm bên trong thân trước)
  const innerFifth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.85),
    MAT_SECONDARY
  );
  innerFifth.name = 'inner_fifth_panel';
  innerFifth.position.set(-0.06, 0.05, 0.16);
  innerFifth.rotation.y = 0.15;
  scene.add(innerFifth);

  // Standing collar (lập lĩnh)
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.13, 20),
    MAT_SECONDARY
  );
  collar.name = 'standing_collar';
  collar.position.y = 0.58;
  scene.add(collar);

  // Tapered sleeves (tay chẽn) - wider at shoulder/armpit (r=0.14), tapering to wrist (r=0.075)
  // Left sleeve
  const leftSleeveGeo = new THREE.CylinderGeometry(0.075, 0.14, 0.75, 16);
  const leftSleeve = new THREE.Mesh(leftSleeveGeo, MAT_PRIMARY);
  leftSleeve.name = 'left_sleeve';
  leftSleeve.position.set(0.38, 0.18, 0.05);
  leftSleeve.rotation.set(0.15, 0, -0.45);
  scene.add(leftSleeve);

  // Right sleeve
  const rightSleeveGeo = new THREE.CylinderGeometry(0.075, 0.14, 0.75, 16);
  const rightSleeve = new THREE.Mesh(rightSleeveGeo, MAT_PRIMARY);
  rightSleeve.name = 'right_sleeve';
  rightSleeve.position.set(-0.38, 0.18, 0.05);
  rightSleeve.rotation.set(0.15, 0, 0.45);
  scene.add(rightSleeve);

  // Closure buttons (cúc cài)
  const buttonsGroup = new THREE.Group();
  buttonsGroup.name = 'closure_buttons';
  for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 12, 12),
      MAT_ACCENT
    );
    btn.position.set(0.08 + i * 0.03, 0.52 - i * 0.11, 0.22 - i * 0.02);
    buttonsGroup.add(btn);
  }
  scene.add(buttonsGroup);

  return scene;
}

/**
 * PROXY 2: Áo tấc (Ngũ thân tay thụng)
 * Features:
 * - Natural loose drape
 * - Fifth panel (inner_fifth_panel)
 * - Standing collar
 * - Wide rectangular trailing sleeves (wide_left_sleeve, wide_right_sleeve)
 *   UNMISTAKABLY WIDE, NOT tapering to wrists, trailing lower drape
 * - Closure buttons
 */
export function buildAoTacScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = 'ao_tac_root';

  scene.add(createMannequin());

  // Outer body: Five-panel family, broader ceremonial drape
  const outerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.46, 1.4, 24, 1, true),
    MAT_PRIMARY
  );
  outerBody.name = 'outer_body';
  outerBody.position.y = -0.08;
  scene.add(outerBody);

  // Inner fifth panel
  const innerFifth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.88),
    MAT_SECONDARY
  );
  innerFifth.name = 'inner_fifth_panel';
  innerFifth.position.set(-0.06, 0.02, 0.18);
  innerFifth.rotation.y = 0.15;
  scene.add(innerFifth);

  // Standing collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.125, 0.14, 20),
    MAT_SECONDARY
  );
  collar.name = 'standing_collar';
  collar.position.y = 0.58;
  scene.add(collar);

  // WIDE RECTANGULAR SLEEVES (tay thụng)
  // Generous rectangular box sleeves: width 0.32, height 0.62, depth 0.24
  // Hangs low without wrist tapering
  const wideLeftGeo = new THREE.BoxGeometry(0.26, 0.62, 0.26);
  const wideLeftSleeve = new THREE.Mesh(wideLeftGeo, MAT_PRIMARY);
  wideLeftSleeve.name = 'wide_left_sleeve';
  wideLeftSleeve.position.set(0.44, 0.1, 0);
  wideLeftSleeve.rotation.z = -0.15;
  scene.add(wideLeftSleeve);

  const wideRightGeo = new THREE.BoxGeometry(0.26, 0.62, 0.26);
  const wideRightSleeve = new THREE.Mesh(wideRightGeo, MAT_PRIMARY);
  wideRightSleeve.name = 'wide_right_sleeve';
  wideRightSleeve.position.set(-0.44, 0.1, 0);
  wideRightSleeve.rotation.z = 0.15;
  scene.add(wideRightSleeve);

  // Closure buttons
  const buttonsGroup = new THREE.Group();
  buttonsGroup.name = 'closure_buttons';
  for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      MAT_ACCENT
    );
    btn.position.set(0.09 + i * 0.035, 0.52 - i * 0.12, 0.24 - i * 0.02);
    buttonsGroup.add(btn);
  }
  scene.add(buttonsGroup);

  return scene;
}

/**
 * PROXY 3: Áo tứ thân
 * Features:
 * - Four separate panels:
 *   - back_left_panel & back_right_panel meeting at center-back (x=0) with visible seam
 *   - front_left_flap & front_right_flap as two separate front flaps with open gap at center!
 * - collar_band (v-neck band)
 * - inner_tie
 * - Optional ensemble layer (ensemble_yem, ensemble_skirt, ensemble_sash)
 */
export function buildAoTuThanScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = 'ao_tu_than_root';

  scene.add(createMannequin());

  // Back left panel (half cylinder curved back, x < 0)
  const backLeftGeo = new THREE.CylinderGeometry(0.26, 0.44, 1.35, 12, 1, true, Math.PI / 2, Math.PI / 2);
  const backLeft = new THREE.Mesh(backLeftGeo, MAT_PRIMARY);
  backLeft.name = 'back_left_panel';
  backLeft.position.set(-0.005, -0.05, 0);
  scene.add(backLeft);

  // Back right panel (half cylinder curved back, x > 0) meeting at center-back
  const backRightGeo = new THREE.CylinderGeometry(0.26, 0.44, 1.35, 12, 1, true, 0, Math.PI / 2);
  const backRight = new THREE.Mesh(backRightGeo, MAT_PRIMARY);
  backRight.name = 'back_right_panel';
  backRight.position.set(0.005, -0.05, 0);
  scene.add(backRight);

  // Front left flap (vạt trước bên trái - để hở ở giữa, góc x < 0)
  const frontLeftGeo = new THREE.CylinderGeometry(0.26, 0.42, 1.3, 8, 1, true, Math.PI, Math.PI * 0.38);
  const frontLeftFlap = new THREE.Mesh(frontLeftGeo, MAT_PRIMARY);
  frontLeftFlap.name = 'front_left_flap';
  frontLeftFlap.position.set(-0.03, -0.05, 0);
  scene.add(frontLeftFlap);

  // Front right flap (vạt trước bên phải - để hở ở giữa, góc x > 0)
  const frontRightGeo = new THREE.CylinderGeometry(0.26, 0.42, 1.3, 8, 1, true, -Math.PI * 0.38, Math.PI * 0.38);
  const frontRightFlap = new THREE.Mesh(frontRightGeo, MAT_PRIMARY);
  frontRightFlap.name = 'front_right_flap';
  frontRightFlap.position.set(0.03, -0.05, 0);
  scene.add(frontRightFlap);

  // Collar band (nẹp cổ viền vạt)
  const collarBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.02, 12, 24, Math.PI),
    MAT_ACCENT
  );
  collarBand.name = 'collar_band';
  collarBand.position.set(0, 0.48, 0.08);
  collarBand.rotation.x = 0.55;
  scene.add(collarBand);

  // Inner tie cord
  const innerTie = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8),
    MAT_ACCENT
  );
  innerTie.name = 'inner_tie';
  innerTie.position.set(0, 0.18, 0.17);
  innerTie.rotation.z = Math.PI / 4;
  scene.add(innerTie);

  // ENSEMBLE NODES (optional ensemble layer, togglable)
  // Yếm lót trong (ensemble_yem) visible through open front
  const yem = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.32),
    MAT_SECONDARY
  );
  yem.name = 'ensemble_yem';
  yem.position.set(0, 0.28, 0.12);
  scene.add(yem);

  // Chân váy đụp xoè (ensemble_skirt)
  const skirt = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.85, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x242220, roughness: 0.8 })
  );
  skirt.name = 'ensemble_skirt';
  skirt.position.y = -0.65;
  scene.add(skirt);

  // Dải yếm / thắt lưng thắt ngang bụng (ensemble_sash)
  const sash = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.035, 12, 24),
    MAT_ACCENT
  );
  sash.name = 'ensemble_sash';
  sash.position.set(0, 0.05, 0);
  sash.rotation.x = Math.PI / 2;
  scene.add(sash);

  return scene;
}

/**
 * Export Scene to GLB ArrayBuffer
 */
function exportSceneToGLB(scene: THREE.Scene): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => {
        resolve(gltf as ArrayBuffer);
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

/**
 * Main generator function
 */
async function main() {
  console.log('🚀 [AC 3D Engine] Bắt đầu sinh 3 Structural Proxy Models...');

  const outputDir = path.resolve('public/models');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targets = [
    {
      name: 'ngu-than-tay-chen-proxy.glb',
      generator: buildNguThanTayChenScene,
      label: 'Áo ngũ thân tay chẽn (Tapered sleeves & fifth panel)',
    },
    {
      name: 'ao-tac-proxy.glb',
      generator: buildAoTacScene,
      label: 'Áo tấc (Wide rectangular sleeves & loose silhouette)',
    },
    {
      name: 'ao-tu-than-proxy.glb',
      generator: buildAoTuThanScene,
      label: 'Áo tứ thân (Open front flaps, back seam & ensemble)',
    },
  ];

  for (const item of targets) {
    console.log(`\n⏳ Đang sinh: ${item.label}...`);
    const scene = item.generator();
    const glbBuffer = await exportSceneToGLB(scene);
    const outputPath = path.join(outputDir, item.name);

    fs.writeFileSync(outputPath, Buffer.from(glbBuffer));
    console.log(`✅ Xuất thành công: ${outputPath} (${glbBuffer.byteLength} bytes)`);

    // Đồng bộ sang dist/models nếu dist tồn tại
    const distDir = path.resolve('dist/models');
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(outputPath, path.join(distDir, item.name));
    }
  }

  console.log('\n🎉 Hoàn thành sinh cả 3 Structural Proxy Models chuẩn xác!');
}

main().catch((err) => {
  console.error('❌ Lỗi khi sinh 3D proxies:', err);
  process.exit(1);
});
