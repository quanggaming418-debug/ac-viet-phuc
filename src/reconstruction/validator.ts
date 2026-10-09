import type { ReconstructionTechnicalValidation } from './types.ts';

/**
 * Thẩm định kỹ thuật chi tiết của file GLB tái tạo trước khi cho phép render
 * TUYỆT ĐỐI KHÔNG đưa nhận định văn hóa vào bước kiểm tra kỹ thuật này
 */
export function validateGlbTechnical(buffer: ArrayBuffer | Buffer): ReconstructionTechnicalValidation {
  const issues: string[] = [];
  const byteLength = 'byteLength' in buffer ? buffer.byteLength : (buffer as any).length;

  // 1. Kiểm tra kích thước an toàn (tối đa 50MB, tối thiểu 20 bytes)
  const safeSize = byteLength >= 20 && byteLength <= 50 * 1024 * 1024;
  if (!safeSize) {
    issues.push(`Kích thước file không hợp lệ (${byteLength} bytes). Cho phép từ 20B đến 50MB.`);
  }

  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 2. Kiểm tra GLTF Magic Header (0x46546C67 -> "glTF")
  let mimeTypeValid = false;
  if (u8.length >= 12) {
    const magic = String.fromCharCode(u8[0], u8[1], u8[2], u8[3]);
    if (magic === 'glTF') {
      mimeTypeValid = true;
    } else {
      issues.push(`Magic header không đúng định dạng GLB (nhận được: "${magic}", yêu cầu: "glTF").`);
    }
  } else {
    issues.push('File quá ngắn để chứa header GLTF.');
  }

  // 3. Phân tích JSON chunk của GLB
  let canParseGlTF = false;
  let hasScene = false;
  let hasMesh = false;
  let vertexCount = 0;
  let triangleCount = 0;
  let finiteTransforms = true;
  let noNaNValues = true;
  let boundingBoxValid = true;
  let noExecutableOrScripts = true;
  let dimensions = { x: 1, y: 1.6, z: 0.6 };

  if (mimeTypeValid && u8.length >= 20) {
    try {
      const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      const jsonChunkLength = view.getUint32(12, true);
      const jsonChunkType = view.getUint32(16, true);

      // 0x4E4F534A = "JSON"
      if (jsonChunkType === 0x4e4f534a && u8.length >= 20 + jsonChunkLength) {
        const jsonBytes = u8.slice(20, 20 + jsonChunkLength);
        const jsonText = new TextDecoder().decode(jsonBytes);

        // Kiểm tra an toàn: không chứa script độc hại
        if (jsonText.includes('<script') || jsonText.includes('javascript:') || jsonText.includes('eval(')) {
          noExecutableOrScripts = false;
          issues.push('Phát hiện nội dung mã nhúng không an toàn trong metadata GLTF.');
        }

        const gltf = JSON.parse(jsonText);
        canParseGlTF = true;

        if (gltf.scenes && Array.isArray(gltf.scenes) && gltf.scenes.length > 0) {
          hasScene = true;
        } else {
          issues.push('File GLB không có scene hợp lệ.');
        }

        if (gltf.meshes && Array.isArray(gltf.meshes) && gltf.meshes.length > 0) {
          hasMesh = true;

          // Tính toán sơ bộ vertex count từ accessors
          if (gltf.accessors && Array.isArray(gltf.accessors)) {
            for (const acc of gltf.accessors) {
              if (acc.type === 'VEC3' && typeof acc.count === 'number') {
                vertexCount += acc.count;

                // Kiểm tra min/max bounding box
                if (acc.min && acc.max) {
                  const [minX, minY, minZ] = acc.min;
                  const [maxX, maxY, maxZ] = acc.max;

                  if (
                    !Number.isFinite(minX) ||
                    !Number.isFinite(minY) ||
                    !Number.isFinite(minZ) ||
                    !Number.isFinite(maxX) ||
                    !Number.isFinite(maxY) ||
                    !Number.isFinite(maxZ)
                  ) {
                    noNaNValues = false;
                    finiteTransforms = false;
                    issues.push('Phát hiện giá trị tọa độ NaN hoặc Infinity trong bounding box.');
                  } else {
                    const dx = Math.abs(maxX - minX);
                    const dy = Math.abs(maxY - minY);
                    const dz = Math.abs(maxZ - minZ);

                    if (dx > 0 || dy > 0 || dz > 0) {
                      dimensions = {
                        x: Math.max(dimensions.x, dx),
                        y: Math.max(dimensions.y, dy),
                        z: Math.max(dimensions.z, dz),
                      };
                    }
                  }
                }
              }
              if (acc.type === 'SCALAR' && typeof acc.count === 'number') {
                triangleCount += Math.floor(acc.count / 3);
              }
            }
            if (dimensions.x === 0 && dimensions.y === 0 && dimensions.z === 0 && vertexCount > 0) {
              boundingBoxValid = false;
              issues.push('Bounding box có kích thước bằng 0 (lưới hình học phẳng vô hình).');
            }
          }
        } else {
          issues.push('File GLB không chứa bất kỳ lưới hình học (mesh) nào.');
        }

        // Kiểm tra transforms trong nodes
        if (gltf.nodes && Array.isArray(gltf.nodes)) {
          for (const node of gltf.nodes) {
            const matrix = node.matrix;
            const translation = node.translation;
            const rotation = node.rotation;
            const scale = node.scale;

            const checkArr = (arr: any) => {
              if (Array.isArray(arr)) {
                return arr.every((v) => typeof v === 'number' && Number.isFinite(v));
              }
              return true;
            };

            if (
              !checkArr(matrix) ||
              !checkArr(translation) ||
              !checkArr(rotation) ||
              !checkArr(scale)
            ) {
              finiteTransforms = false;
              noNaNValues = false;
              issues.push('Phát hiện ma trận biến đổi node chứa giá trị NaN hoặc không xác định.');
            }
          }
        }
      } else {
        issues.push('Chunk đầu tiên của GLB không phải là JSON hợp lệ.');
      }
    } catch (parseErr: any) {
      issues.push(`Lỗi phân tích cú pháp GLTF JSON: ${parseErr?.message || 'Invalid format'}`);
    }
  }

  // Kết luận tổng thể
  const isValid =
    safeSize &&
    mimeTypeValid &&
    canParseGlTF &&
    hasScene &&
    hasMesh &&
    vertexCount > 0 &&
    finiteTransforms &&
    noNaNValues &&
    boundingBoxValid &&
    noExecutableOrScripts;

  return {
    isValid,
    mimeTypeValid,
    canParseGlTF,
    hasScene,
    hasMesh,
    vertexCount,
    triangleCount: triangleCount > 0 ? triangleCount : Math.floor(vertexCount / 2),
    finiteTransforms,
    noNaNValues,
    boundingBoxValid,
    dimensions,
    byteLength,
    safeSize,
    noExecutableOrScripts,
    issues,
  };
}
