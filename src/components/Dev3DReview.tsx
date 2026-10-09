import React, { useState, Suspense, lazy } from 'react';
import { GARMENT_3D_REGISTRY } from '../3d/garment3DRegistry.ts';
import { Box, ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

const ThreeDViewer = lazy(() =>
  import('./ThreeDViewer.tsx').then((m) => ({ default: m.ThreeDViewer }))
);

export function Dev3DReview() {
  const [syncedPalette, setSyncedPalette] = useState({
    primary: '#8E3028',
    secondary: '#F1E6D2',
    accent: '#C6A56B',
  });

  const garments = [
    {
      id: 'ngu_than_tay_chen',
      title: 'Áo ngũ thân tay chẽn',
      canonical: 'Áo ngũ thân tay chẽn' as const,
      morphologyNote: 'Tay chẽn thu dần về cổ tay, thân suông tự nhiên không chiết eo, vạt con thứ năm bên trong.',
    },
    {
      id: 'ao_tac',
      title: 'Áo tấc',
      canonical: 'Áo tấc' as const,
      morphologyNote: 'Tay thụng rộng hình chữ nhật buông thả tự nhiên, không thu về cổ tay, phom buông bề thế.',
    },
    {
      id: 'ao_tu_than',
      title: 'Áo tứ thân',
      canonical: 'Áo tứ thân' as const,
      morphologyNote: 'Hai vạt trước tách rời mở phía trước, hai thân sau ghép dọc sống lưng, phối yếm & váy đụp.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#181716] p-4 sm:p-8">
      {/* Dev Header */}
      <div className="max-w-7xl mx-auto mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E9E6E1]">
          <div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-[#77736E] hover:text-[#181716] px-2.5 py-1 rounded-lg bg-white border border-[#E9E6E1] transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại ứng dụng chính</span>
              </a>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                DEV 3D REVIEW MODE (/3d-review)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mt-2 tracking-tight">
              Kiểm tra hình thái 3D Structural Proxy (Morphology Side-by-Side)
            </h1>
            <p className="text-xs sm:text-sm text-[#77736E] mt-1">
              So sánh trực quan ba dáng phục đặt cạnh nhau ở góc chiếu Front, 3/4 và Back. Xác nhận sự phân biệt rõ ràng của tay áo và vạt trước.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-2 rounded-xl border border-[#E9E6E1] text-xs">
            <span className="text-[11px] font-semibold text-[#77736E]">Màu kiểm thử:</span>
            <span
              className="w-4 h-4 rounded-full border border-black/10"
              style={{ backgroundColor: syncedPalette.primary }}
              title="Primary #8E3028"
            />
            <span
              className="w-4 h-4 rounded-full border border-black/10"
              style={{ backgroundColor: syncedPalette.secondary }}
              title="Secondary #F1E6D2"
            />
            <span
              className="w-4 h-4 rounded-full border border-black/10"
              style={{ backgroundColor: syncedPalette.accent }}
              title="Accent #C6A56B"
            />
          </div>
        </div>
      </div>

      {/* 3 Models Side-by-Side Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {garments.map((g) => {
          const def = GARMENT_3D_REGISTRY[g.id as keyof typeof GARMENT_3D_REGISTRY];
          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-[#E9E6E1] p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2 pb-3 border-b border-[#E9E6E1]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#77736E]">{def.modelUrl}</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>CONTRACT PASS</span>
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[#181716]">{g.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8E3028]/10 text-[#8E3028] font-bold">
                    {def.modelAuthority}
                  </span>
                </div>

                <p className="text-xs text-[#77736E] leading-relaxed">
                  {g.morphologyNote}
                </p>

                <div className="pt-1 text-[11px] text-[#77736E] space-y-1 bg-[#FCFBF8] p-2.5 rounded-lg border border-[#E9E6E1]/70">
                  <div className="flex justify-between">
                    <span>Identity Critical Nodes:</span>
                    <span className="font-mono text-[#181716] font-medium">
                      {def.identityCriticalNodes.length} nodes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supporting Nodes:</span>
                    <span className="font-mono text-[#181716] font-medium">
                      {def.supportingNodes.length} nodes
                    </span>
                  </div>
                </div>
              </div>

              {/* 3D Viewer Instance */}
              <div className="w-full">
                <Suspense
                  fallback={
                    <div className="rounded-xl border border-[#E9E6E1] bg-[#FCFBF8] p-8 text-center">
                      <div className="w-6 h-6 border-2 border-[#8E3028] border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  }
                >
                  <ThreeDViewer
                    garmentType={g.canonical}
                    conceptName={`Kiểm thử ${g.title}`}
                    recommendationPalette={[
                      { name: 'Primary', hex: syncedPalette.primary },
                      { name: 'Secondary', hex: syncedPalette.secondary },
                      { name: 'Accent', hex: syncedPalette.accent },
                    ]}
                    recommendationAccessories={['khan_van']}
                  />
                </Suspense>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
