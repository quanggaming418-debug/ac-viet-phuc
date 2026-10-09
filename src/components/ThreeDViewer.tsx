import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Box,
  AlertCircle,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  Palette,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { getGarment3DDefinition } from '../3d/garment3DRegistry.ts';
import { validateGarmentModel } from '../3d/modelValidator.ts';
import {
  applyOutfitStateToModel,
  applyStructuralHighlight,
  FABRIC_PRESETS,
} from '../3d/materialMapper.ts';
import {
  normalizeAndCenterModel,
  setupStudioLighting,
  disposeThreeResources,
} from '../3d/sceneUtils.ts';
import {
  Garment3DDefinition,
  GarmentStructuralCallout,
  FabricPreset,
  ModelLoadStatus,
  ModelAuthority,
  Outfit3DState,
} from '../3d/types.ts';
import type { Reconstructed3DArtifact } from '../reconstruction/types.ts';

interface ThreeDViewerProps {
  garmentType: string;
  conceptName?: string;
  recommendationPalette?: { name: string; hex: string }[];
  recommendationAccessories?: string[];
  reconstructedArtifact?: Reconstructed3DArtifact | null;
}

export function ThreeDViewer({
  garmentType = 'Áo tấc',
  conceptName = 'Bản phối đề xuất',
  recommendationPalette = [],
  recommendationAccessories = [],
  reconstructedArtifact = null,
}: ThreeDViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References to Three.js runtime instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const loadedModelSceneRef = useRef<THREE.Group | null>(null);

  // Garment definition resolved from registry
  const definition: Garment3DDefinition = useMemo(() => {
    return getGarment3DDefinition(garmentType);
  }, [garmentType]);

  // Initial camera preset
  const initialCamPos = useRef<THREE.Vector3>(
    new THREE.Vector3(...definition.cameraPreset.position)
  );
  const initialTarget = useRef<THREE.Vector3>(
    new THREE.Vector3(...definition.cameraPreset.target)
  );

  // Component UI State
  const [loadStatus, setLoadStatus] = useState<ModelLoadStatus>('idle');
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false);
  const [modelAuthority, setModelAuthority] = useState<ModelAuthority>('PLACEHOLDER');
  const [activeTab, setActiveTab] = useState<'structure' | 'styling'>('structure');
  const [fabricPreset, setFabricPreset] = useState<FabricPreset>('silk');
  const [selectedCalloutId, setSelectedCalloutId] = useState<string | null>(null);
  const [viewerSourceMode, setViewerSourceMode] = useState<'proxy' | 'reconstruction'>('proxy');

  const canUseReconstruction =
    Boolean(reconstructedArtifact) &&
    reconstructedArtifact?.technicalValidation?.isValid === true &&
    reconstructedArtifact?.status !== 'REJECTED' &&
    Boolean(reconstructedArtifact.glbRef);

  const isReconstructionActive = viewerSourceMode === 'reconstruction' && canUseReconstruction;
  const targetModelUrl = isReconstructionActive
    ? reconstructedArtifact!.glbRef
    : definition.modelUrl;

  // Outfit 3D state derived from props & user selection
  const outfitState: Outfit3DState = useMemo(() => {
    const primary = recommendationPalette[0]?.hex || '#8E3028';
    const secondary = recommendationPalette[1]?.hex || '#C6A56B';
    const accent = recommendationPalette[2]?.hex || '#355C4A';

    return {
      palette: {
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
      },
      fabricPreset,
      activeAccessories: recommendationAccessories,
    };
  }, [recommendationPalette, fabricPreset, recommendationAccessories]);

  // Update OrbitControls autoRotate when state changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  /**
   * Reset Camera view to initial preset
   */
  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    camera.position.copy(initialCamPos.current);
    controls.target.copy(initialTarget.current);
    controls.update();
  }, []);

  /**
   * Switch camera angles: Front, 3/4, Back
   */
  const setCameraAngle = useCallback((angle: 'front' | 'three_quarter' | 'back') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    controls.target.set(0, 0, 0);

    if (angle === 'front') {
      camera.position.set(0, 0.35, 2.8);
    } else if (angle === 'three_quarter') {
      camera.position.set(1.9, 0.45, 2.0);
    } else if (angle === 'back') {
      camera.position.set(0, 0.35, -2.8);
    }
    controls.update();
  }, []);

  /**
   * Discrete Zoom Controls (+ and -)
   */
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const factor = direction === 'in' ? 0.8 : 1.25;
    const offset = camera.position.clone().sub(controls.target);
    offset.multiplyScalar(factor);

    const dist = offset.length();
    const minD = definition.cameraPreset.minDistance || 1.2;
    const maxD = definition.cameraPreset.maxDistance || 6.0;

    if (dist >= minD && dist <= maxD) {
      camera.position.copy(controls.target.clone().add(offset));
      controls.update();
    }
  }, [definition]);

  /**
   * Interactive structural callout highlight toggle
   */
  const handleSelectCallout = useCallback((callout: GarmentStructuralCallout) => {
    setSelectedCalloutId((prev) => {
      const nextId = prev === callout.id ? null : callout.id;
      if (loadedModelSceneRef.current) {
        if (nextId) {
          applyStructuralHighlight(
            loadedModelSceneRef.current,
            definition,
            callout.targetNodes || null,
            outfitState
          );
        } else {
          applyStructuralHighlight(
            loadedModelSceneRef.current,
            definition,
            null,
            outfitState
          );
        }
      }
      return nextId;
    });
  }, [definition, outfitState]);

  /**
   * Live apply outfit state (palette, fabric, accessories, or structural highlight)
   */
  useEffect(() => {
    if (loadedModelSceneRef.current) {
      if (selectedCalloutId) {
        const activeCallout = definition.structuralCallouts.find(
          (c) => c.id === selectedCalloutId
        );
        applyStructuralHighlight(
          loadedModelSceneRef.current,
          definition,
          activeCallout?.targetNodes || null,
          outfitState
        );
      } else {
        applyOutfitStateToModel(
          loadedModelSceneRef.current,
          definition,
          outfitState
        );
      }
    }
  }, [definition, outfitState, selectedCalloutId]);

  /**
   * Main Three.js Scene Initialization and Dynamic Model Loading with Fallback
   */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    setLoadStatus('loading');
    setErrorMessage(null);
    setLoadProgress(0);

    // Update camera preset vectors
    initialCamPos.current.set(...definition.cameraPreset.position);
    initialTarget.current.set(...definition.cameraPreset.target);

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    const camera = new THREE.PerspectiveCamera(
      definition.cameraPreset.fov || 45,
      aspect,
      0.1,
      50
    );
    camera.position.copy(initialCamPos.current);
    cameraRef.current = camera;

    // 3. WebGLRenderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. OrbitControls setup
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = definition.cameraPreset.minDistance || 1.2;
    controls.maxDistance = definition.cameraPreset.maxDistance || 6.0;
    controls.minPolarAngle = Math.PI / 6; // ~30 deg
    controls.maxPolarAngle = (Math.PI * 5) / 6; // ~150 deg
    controls.target.copy(initialTarget.current);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // 5. Studio Lighting
    setupStudioLighting(scene);

    // 6. Model Root Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 7. GLTFLoader with Fallback Mechanism
    const loader = new GLTFLoader();

    const loadGLBWithFallback = (urlToTry: string, isFallbackAttempt: boolean) => {
      loader.load(
        urlToTry,
        (gltf) => {
          const loadedScene = gltf.scene;
          loadedModelSceneRef.current = loadedScene;

          // Validate model node structure against definition
          const validation = validateGarmentModel(loadedScene, definition);

          if (!validation.identityContractSatisfied && !isFallbackAttempt) {
            // Dedicated model is missing identity critical nodes; fallback to placeholder
            console.warn(
              `[AC 3D Validator] Model ${urlToTry} missing identity critical nodes. Falling back to placeholder.`
            );
            loadGLBWithFallback(definition.fallbackModelUrl, true);
            return;
          }

          // Geometry is IMMUTABLE: Center & Uniform Scale only
          normalizeAndCenterModel(loadedScene, 2.0);

          // Apply Material & Palette Mapping (cloning materials)
          applyOutfitStateToModel(loadedScene, definition, outfitState);

          modelGroup.clear();
          modelGroup.add(loadedScene);

          const isCurrentPlaceholder = isFallbackAttempt || validation.isPlaceholder;
          setIsPlaceholder(isCurrentPlaceholder);
          setModelAuthority(
            isCurrentPlaceholder
              ? 'PLACEHOLDER'
              : isReconstructionActive
                ? 'AI_RECONSTRUCTION'
                : validation.modelAuthority
          );
          setLoadStatus(isCurrentPlaceholder ? 'placeholder_fallback' : 'ready');
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadProgress(pct);
          }
        },
        (err) => {
          if (!isFallbackAttempt) {
            // Primary model not found (e.g. 404), seamlessly fallback to local placeholder
            console.info(
              `[AC 3D Viewer] Primary model ${urlToTry} not yet available. Loading technical placeholder ${definition.fallbackModelUrl}.`
            );
            loadGLBWithFallback(definition.fallbackModelUrl, true);
          } else {
            console.error('[AC 3D Viewer] Failed to load placeholder model:', err);
            setErrorMessage('Mô hình 3D hiện chưa khả dụng cho bản phối này. Bạn vẫn có thể xem ảnh minh họa.');
            setLoadStatus('error');
          }
        }
      );
    };

    // Begin loading target model (proxy or reconstruction)
    loadGLBWithFallback(targetModelUrl, false);

    // 8. Animation Loop
    let isActive = true;
    const animate = () => {
      if (!isActive) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 10. Comprehensive Cleanup on Unmount
    return () => {
      isActive = false;
      resizeObserver.disconnect();

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      disposeThreeResources(scene, renderer, controls);

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      modelGroupRef.current = null;
      loadedModelSceneRef.current = null;
    };
  }, [definition, targetModelUrl, isReconstructionActive]);

  return (
    <div className="space-y-4">
      {/* 3D Viewer Top Header / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E3028] flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              Bản xem 3D của bản phối
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8E3028]/10 text-[#8E3028]">
              {definition.displayName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#77736E] leading-relaxed max-w-xl">
            Tương tác 3 chiều với phom dáng chuẩn mực. Màu sắc và chất liệu được kết nối trực tiếp từ bản phối của bạn.
          </p>
        </div>

        {/* Sub-tab Switcher: Cấu trúc vs Bản phối */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-[#F5F2EB] border border-[#E9E6E1] text-xs shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-white text-[#181716] shadow-xs'
                : 'text-[#77736E] hover:text-[#181716]'
            }`}
          >
            Cấu trúc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('styling')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'styling'
                ? 'bg-white text-[#181716] shadow-xs'
                : 'text-[#77736E] hover:text-[#181716]'
            }`}
          >
            Bản phối
          </button>
        </div>
      </div>

      {/* Nguồn hiển thị 3D: Cấu trúc (Proxy) vs Bản dựng AI */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FBFBFA] border border-[#E9E6E1]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[#77736E]">Nguồn mô hình:</span>
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#EAE7E1] text-xs">
            <button
              type="button"
              onClick={() => setViewerSourceMode('proxy')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewerSourceMode === 'proxy'
                  ? 'bg-white text-[#181716] shadow-2xs'
                  : 'text-[#77736E] hover:text-[#181716]'
              }`}
            >
              Cấu trúc chuẩn
            </button>
            <button
              type="button"
              disabled={!canUseReconstruction}
              onClick={() => setViewerSourceMode('reconstruction')}
              title={
                canUseReconstruction
                  ? 'Xem bản dựng 3D thử nghiệm từ ảnh'
                  : 'Chưa có bản dựng AI đạt chuẩn'
              }
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                viewerSourceMode === 'reconstruction'
                  ? 'bg-white text-[#8E3028] shadow-2xs font-semibold'
                  : 'text-[#77736E] hover:text-[#181716]'
              }`}
            >
              Bản dựng AI
              {canUseReconstruction && (
                <span className="ml-1 text-[9px] uppercase px-1 rounded bg-[#8E3028]/10 text-[#8E3028]">
                  Thử nghiệm
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Badge nhận diện thẩm quyền mô hình */}
        <div className="flex items-center gap-1.5">
          {modelAuthority === 'AI_RECONSTRUCTION' || isReconstructionActive ? (
            <>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-800 border border-violet-500/20">
                AI reconstruction
              </span>
              {reconstructedArtifact?.status === 'NEEDS_REVIEW' && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20">
                  Cần kiểm tra cấu trúc
                </span>
              )}
            </>
          ) : modelAuthority === 'STRUCTURAL_PROXY' ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
              Structural Proxy
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20">
              Technical Placeholder
            </span>
          )}
        </div>
      </div>

      {/* Disclaimer bắt buộc khi hiển thị AI Reconstruction */}
      {isReconstructionActive && (
        <div className="p-3 rounded-xl bg-violet-50/50 border border-violet-200 text-xs text-violet-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-semibold block text-violet-950">
              Bản dựng 3D thử nghiệm từ ảnh
            </span>
            <p>
              Bản dựng được suy từ ảnh tham chiếu. Các vùng bị che khuất có thể được mô hình ước đoán.
            </p>
          </div>
        </div>
      )}

      {/* Thông báo trạng thái Placeholder (Nếu đang nạp file ma-nơ-canh thử nghiệm) */}
      {isPlaceholder && (
        <div className="p-3.5 rounded-xl bg-[#FCFBF8] border border-[#E9E6E1] text-xs text-[#77736E] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#8E3028] shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-semibold text-[#181716] block">
              Mô hình 3D thử nghiệm — chưa phải bản phục dựng chuẩn
            </span>
            <span>
              Mô hình đang hiển thị phom dáng ma-nơ-canh hình học để kiểm thử xoay 360°, nạp màu sắc và chất liệu. Cấu trúc hình học được khóa bất biến theo di sản phục sức.
            </span>
          </div>
        </div>
      )}

      {/* Panel Chi Tiết Theo Tab: Cấu trúc / Bản phối */}
      {activeTab === 'structure' ? (
        <div className="p-4 rounded-xl bg-white border border-[#E9E6E1] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-1 border-b border-[#E9E6E1]/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#181716]">
              <ShieldCheck className="w-4 h-4 text-[#8E3028]" />
              <span>Đặc trưng nhận diện hình học</span>
            </div>
            <span className="text-[11px] text-[#77736E]">Hình học bất biến (Immutable Geometry)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {definition.structuralCallouts
              .filter((c) => c.level === 'identity' || c.level === 'supporting')
              .map((callout) => {
                const isSelected = selectedCalloutId === callout.id;
                return (
                  <button
                    key={callout.id}
                    type="button"
                    onClick={() => handleSelectCallout(callout)}
                    className={`p-3 rounded-xl border text-left space-y-1.5 flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#8E3028] bg-[#8E3028]/8 shadow-xs ring-1 ring-[#8E3028]/30'
                        : 'bg-[#FCFBF8] border-[#E9E6E1]/90 hover:border-[#181716]/30 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-1 w-full">
                      <div className="text-xs font-semibold text-[#181716] flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              callout.level === 'identity' ? 'bg-[#8E3028]' : 'bg-[#C6A56B]'
                            }`}
                          />
                          <span className={isSelected ? 'text-[#8E3028] font-bold' : ''}>
                            {callout.label}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-[#8E3028] text-white'
                              : callout.level === 'identity'
                              ? 'bg-[#8E3028]/10 text-[#8E3028]'
                              : 'bg-[#C6A56B]/20 text-[#8E3028]'
                          }`}
                        >
                          {isSelected ? 'Đang soi' : callout.level === 'identity' ? 'Cốt lõi' : 'Hỗ trợ'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#77736E] leading-relaxed">
                        {callout.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-[#8E3028] font-medium flex items-center gap-1 pt-1">
                        <Check className="w-3 h-3" />
                        <span>Đang làm sáng trên mô hình 3D</span>
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white border border-[#E9E6E1] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-1 border-b border-[#E9E6E1]/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#181716]">
              <Palette className="w-4 h-4 text-[#8E3028]" />
              <span>Bảng màu & Chất liệu được ánh xạ</span>
            </div>
            <span className="text-[11px] text-[#77736E]">{conceptName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Palette Slot Mapping */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736E] block">
                Màu sắc ứng dụng
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-[#E9E6E1] bg-[#FCFBF8]">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: outfitState.palette.primaryColor }}
                  />
                  <span className="text-[11px] font-medium text-[#181716]">Chính</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-[#E9E6E1] bg-[#FCFBF8]">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: outfitState.palette.secondaryColor }}
                  />
                  <span className="text-[11px] font-medium text-[#181716]">Phụ</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-[#E9E6E1] bg-[#FCFBF8]">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: outfitState.palette.accentColor }}
                  />
                  <span className="text-[11px] font-medium text-[#181716]">Nhấn</span>
                </div>
              </div>
            </div>

            {/* 2. Fabric Preset Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736E] block">
                Chất liệu bề mặt
              </span>
              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#F5F2EB] border border-[#E9E6E1] text-[11px]">
                {(Object.keys(FABRIC_PRESETS) as FabricPreset[]).map((key) => {
                  const preset = FABRIC_PRESETS[key];
                  const isSelected = fabricPreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFabricPreset(key)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-[#181716] shadow-2xs'
                          : 'text-[#77736E] hover:text-[#181716]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Phụ kiện gợi ý */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736E] block">
                Phụ kiện đồng bộ
              </span>
              <div className="flex flex-wrap gap-1">
                {recommendationAccessories.length > 0 ? (
                  recommendationAccessories.slice(0, 3).map((acc, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#FCFBF8] border border-[#E9E6E1] text-[11px] text-[#181716]"
                    >
                      {acc}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#77736E]">Theo bản phối tổng thể</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Khung Canvas 3D Chính */}
      <div className="relative rounded-2xl border border-[#E9E6E1] bg-gradient-to-b from-[#FCFBF8] via-[#F8F6F0] to-[#EFECE4] p-2 sm:p-4 shadow-2xs overflow-hidden">
        
        {/* Subtle Ambient Aurora Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#8E3028]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#C6A56B]/10 blur-3xl pointer-events-none" />

        {/* 3D Canvas Area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-3/4 max-w-md mx-auto rounded-xl overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-grab active:cursor-grabbing"
          />

          {/* Loading Indicator */}
          {loadStatus === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs space-y-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-full border-2 border-[#8E3028] border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8E3028] block">
                  Đang khởi tạo không gian 3D…
                </span>
                <p className="text-[11px] text-[#77736E]">
                  {loadProgress > 0 ? `${loadProgress}%` : 'Đang nạp mô hình & ánh xạ vật liệu'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {loadStatus === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#8E3028]" />
              <div className="space-y-1.5 max-w-xs">
                <h5 className="text-sm font-semibold text-[#181716]">
                  Mô hình 3D chưa khả dụng
                </h5>
                <p className="text-xs text-[#77736E] leading-relaxed">
                  {errorMessage || 'Mô hình 3D hiện chưa khả dụng cho bản phối này. Bạn vẫn có thể xem ảnh minh họa.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8E3028] text-white text-xs font-medium cursor-pointer shadow-2xs hover:bg-[#722620]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* Badges góc khung nhìn */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-[#181716] shadow-xs border border-white/60">
              {definition.displayName}
            </span>
            {isPlaceholder && (
              <span className="px-2 py-0.5 rounded-full bg-[#181716]/80 backdrop-blur-xs text-[10px] font-medium text-white shadow-xs">
                Mô hình 3D thử nghiệm ({modelAuthority})
              </span>
            )}
          </div>

          {/* Floating Toolbar Điều Khiển Tương Tác */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-auto">
            {/* Hướng dẫn tương tác ngắn cho người dùng */}
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 backdrop-blur-xs border border-white/60 text-[10px] text-[#77736E] shadow-2xs">
              <span>Chuột/Touch: Xoay 360° · Cuộn: Zoom</span>
            </div>

            {/* Cụm nút thao tác */}
            <div className="flex items-center gap-1.5 ml-auto bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-white/80 shadow-xs">
              {/* Nút đổi góc máy nhanh: Front, 3/4, Back */}
              <div className="hidden xs:flex items-center gap-0.5 pr-1 border-r border-[#E9E6E1]">
                <button
                  type="button"
                  onClick={() => setCameraAngle('front')}
                  title="Góc nhìn chính diện"
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-[#77736E] hover:text-[#181716] hover:bg-[#F5F2EB] transition-all cursor-pointer"
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setCameraAngle('three_quarter')}
                  title="Góc nhìn 3/4"
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-[#77736E] hover:text-[#181716] hover:bg-[#F5F2EB] transition-all cursor-pointer"
                >
                  3/4
                </button>
                <button
                  type="button"
                  onClick={() => setCameraAngle('back')}
                  title="Góc nhìn sau lưng (kiểm tra đường ghép sống lưng)"
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-[#77736E] hover:text-[#181716] hover:bg-[#F5F2EB] transition-all cursor-pointer"
                >
                  Sau
                </button>
              </div>

              {/* Tự xoay (Auto-Rotate) On/Off */}
              <button
                type="button"
                onClick={() => setAutoRotate((prev) => !prev)}
                title={autoRotate ? 'Tắt tự động xoay' : 'Bật tự động xoay'}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  autoRotate
                    ? 'bg-[#8E3028] text-white'
                    : 'bg-transparent text-[#77736E] hover:bg-[#F5F2EB] hover:text-[#181716]'
                }`}
              >
                {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => handleZoom('in')}
                title="Phóng to"
                className="p-1.5 rounded-lg text-[#77736E] hover:text-[#181716] hover:bg-[#F5F2EB] transition-all cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => handleZoom('out')}
                title="Thu nhỏ"
                className="p-1.5 rounded-lg text-[#77736E] hover:text-[#181716] hover:bg-[#F5F2EB] transition-all cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-[#E9E6E1]" />

              {/* Reset Camera */}
              <button
                type="button"
                onClick={handleResetCamera}
                title="Đặt lại góc nhìn camera"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[#77736E] hover:text-[#181716] hover:bg-[#F5F2EB] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden xs:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer trạng thái kỹ thuật */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 px-2 border-t border-[#E9E6E1]/60 text-[11px] text-[#77736E]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>WebGL Three.js Engine: Khớp với hệ ngũ thân & tứ thân AC</span>
          </div>
          <div>
            Định dạng: <code className="font-mono text-[#181716]">GLTF 2.0 / PBR</code> · Cấu trúc hình học bất biến
          </div>
        </div>

      </div>
    </div>
  );
}
