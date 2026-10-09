import { GoogleGenAI, Type } from '@google/genai';
import type { ACOutfitRecommendation, OriginalRequest, VisualSpec, WearerPresentation } from '../types/recommendation.ts';
import type { ImageQAResult, QAOverallStatus, PreviousIssueProgress } from '../types/imageQA.ts';
import { getGarmentKnowledge } from '../data/garmentKnowledge.ts';
import { VISUAL_QA_TIMEOUT_CONFIG } from './timeoutConfig.ts';

export interface EvaluateImageParams {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  recommendation: ACOutfitRecommendation;
  originalRequest?: OriginalRequest | null;
  prompt: string;
  parentQaResult?: ImageQAResult | null;
  visualSpec?: VisualSpec | null;
  wearerPresentation?: WearerPresentation;
}

const QA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    qa_status: {
      type: Type.STRING,
      enum: ['PASS', 'NEEDS_REVIEW', 'FAIL'],
      description: 'Đánh giá tổng quan deterministic: PASS nếu đạt tốt nhận diện, đúng cấu hình và hoàn toàn sạch chữ; NEEDS_REVIEW nếu có partial hoặc trait không thể thẩm định; FAIL nếu vi phạm phom dáng cốt lõi, dính chữ/text, hoặc sai dáng phục.',
    },
    overall_score: {
      type: Type.INTEGER,
      description: 'Điểm bám bản phối tổng thể từ 0 đến 100 (Generation QA Score). Phản ánh thực chất, không tâng bốc điểm cao nếu có lỗi.',
    },
    garment_identity: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: 'Điểm nhận diện trang phục 0-100' },
        status: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL'] },
        checks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              trait_id: { type: Type.STRING },
              trait_name: { type: Type.STRING },
              expected: { type: Type.STRING },
              observed: { type: Type.STRING },
              result: {
                type: Type.STRING,
                enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE', 'UNCERTAIN'],
              },
              confidence: {
                type: Type.STRING,
                enum: ['HIGH', 'MEDIUM', 'LOW'],
              },
              explanation: { type: Type.STRING },
            },
            required: ['trait_id', 'trait_name', 'expected', 'observed', 'result', 'confidence', 'explanation'],
          },
        },
      },
      required: ['score', 'status', 'checks'],
    },
    user_state_adherence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: 'Điểm bám cấu hình người dùng chọn 0-100 (màu sắc, phụ kiện, remix)' },
        checks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              trait_id: { type: Type.STRING },
              trait_name: { type: Type.STRING },
              expected: { type: Type.STRING },
              observed: { type: Type.STRING },
              result: {
                type: Type.STRING,
                enum: ['PASS', 'PARTIAL', 'FAIL', 'NOT_ASSESSABLE', 'UNCERTAIN'],
              },
              confidence: {
                type: Type.STRING,
                enum: ['HIGH', 'MEDIUM', 'LOW'],
              },
              explanation: { type: Type.STRING },
            },
            required: ['trait_id', 'trait_name', 'expected', 'observed', 'result', 'confidence', 'explanation'],
          },
        },
      },
      required: ['score', 'checks'],
    },
    styling_and_context: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        status: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL'] },
        explanation: { type: Type.STRING },
      },
      required: ['score', 'status', 'explanation'],
    },
    visual_quality: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        status: { type: Type.STRING, enum: ['PASS', 'PARTIAL', 'FAIL'] },
        issues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['score', 'status', 'issues'],
    },
    visual_cleanliness: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: '100 nếu ảnh hoàn toàn sạch chữ, 0 nếu bị dính chữ/văn bản/watermark/nhãn' },
        status: { type: Type.STRING, enum: ['PASS', 'FAIL'] },
        has_text_contamination: { type: Type.BOOLEAN, description: 'True nếu có chữ, caption, watermark, tiêu đề, nhãn dán trong ảnh' },
        detected_text_or_elements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Danh sách các đoạn chữ hoặc chi tiết poster bị lẫn vào ảnh',
        },
        explanation: { type: Type.STRING, description: 'Đánh giá độ sạch hoặc mô tả lỗi dính chữ' },
      },
      required: ['score', 'status', 'has_text_contamination', 'detected_text_or_elements', 'explanation'],
    },
    previous_issue_progress: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING },
          issue_label: { type: Type.STRING },
          result: {
            type: Type.STRING,
            enum: ['FIXED', 'IMPROVED', 'NOT_FIXED', 'WORSE'],
          },
          explanation: { type: Type.STRING },
        },
        required: ['issue', 'issue_label', 'result', 'explanation'],
      },
      description: 'Đánh giá tiến độ khắc phục các lỗi cụ thể từ lần tạo trước (chỉ khi có ảnh trước)',
    },
    critical_issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách các lỗi sai nghiêm trọng về phom dáng, nhầm trang phục hoặc dính chữ',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Những điểm ảnh thể hiện đúng, đẹp và chuẩn mực',
    },
    regeneration_guidance: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2-4 chỉ dẫn ngắn gọn để patch vào prompt nếu cần tạo lại ảnh',
    },
  },
  required: [
    'qa_status',
    'overall_score',
    'garment_identity',
    'user_state_adherence',
    'styling_and_context',
    'visual_quality',
    'visual_cleanliness',
    'critical_issues',
    'strengths',
    'regeneration_guidance',
  ],
};

/**
 * Fetch image bytes server-side và trả về base64 + mimeType
 */
async function resolveImageBytes(params: EvaluateImageParams): Promise<{ base64: string; mimeType: string }> {
  if (params.imageBase64) {
    const raw = params.imageBase64;
    if (raw.startsWith('data:')) {
      const match = raw.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: match[2] };
      }
    }
    return {
      mimeType: params.mimeType || 'image/png',
      base64: raw,
    };
  }

  if (params.imageUrl) {
    const res = await fetch(params.imageUrl);
    if (!res.ok) {
      throw new Error(`Không thể tải ảnh từ URL: ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type') || 'image/png';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return {
      mimeType: contentType.split(';')[0],
      base64,
    };
  }

  throw new Error('Cần cung cấp imageUrl hoặc imageBase64 để đánh giá hình ảnh.');
}

export async function evaluateGeneratedImageWithGemini(
  ai: GoogleGenAI,
  params: EvaluateImageParams
): Promise<ImageQAResult> {
  const { recommendation, originalRequest, prompt, parentQaResult } = params;
  const { garmentType, conceptName, colorPalette, accessories, giu, remix } = recommendation;
  const knowledge = getGarmentKnowledge(garmentType);

  const effectiveWearer =
    params.visualSpec?.wearerPresentation ||
    params.wearerPresentation ||
    params.originalRequest?.wearerPresentation ||
    params.recommendation.wearerPresentation ||
    'unspecified';

  const wearerLabel =
    effectiveWearer === 'male'
      ? 'Nam giới'
      : effectiveWearer === 'female'
        ? 'Nữ giới'
        : 'Không ưu tiên / trung tính (gender-neutral)';

  // 1. Lấy dữ liệu ảnh
  const { base64, mimeType } = await resolveImageBytes(params);

  // 2. Chuẩn bị so sánh với lần tạo trước (nếu có parentQaResult)
  let parentComparisonSection = '';
  if (parentQaResult) {
    const prevCritical = parentQaResult.critical_issues || [];
    const prevGuidance = parentQaResult.regeneration_guidance || [];
    const prevFailedChecks = [
      ...(parentQaResult.garment_identity?.checks || []).filter((c) => c.result === 'FAIL' || c.result === 'PARTIAL'),
      ...(parentQaResult.user_state_adherence?.checks || []).filter((c) => c.result === 'FAIL' || c.result === 'PARTIAL'),
    ];

    const prevList = [
      ...prevCritical.map((ci) => `- Lỗi nghiêm trọng cũ: ${ci}`),
      ...prevFailedChecks.map((fc) => `- Lỗi đặc trưng cũ: ${fc.trait_name} (${fc.observed})`),
      ...prevGuidance.map((g) => `- Chỉ dẫn sửa cũ: ${g}`),
    ].slice(0, 5);

    parentComparisonSection = `
SO SÁNH VỚI LẦN TẠO TRƯỚC (PARENT GENERATION COMPARISON):
Ảnh hiện tại là phiên bản được tạo lại (Regeneration) để khắc phục các lỗi ở lần tạo trước:
${prevList.join('\n')}

YÊU CẦU ĐẶC BIỆT:
Bạn PHẢI điền mảng 'previous_issue_progress' để đánh giá xem từng lỗi của lần trước đã biến chuyển thế nào ở ảnh mới này:
- issue: Tên mã lỗi (ví dụ: WAIST_TOO_FITTED, SLEEVE_TOO_NARROW, TEXT_CONTAMINATION, COLOR_MISMATCH, ...)
- issue_label: Tên lỗi hiển thị tiếng Việt (ví dụ: "Phom eo bị chiết dáng áo dài", "Tay áo chưa đủ thụng", ...)
- result:
  + "FIXED" nếu lỗi cũ đã hoàn toàn được sửa trong ảnh này.
  + "IMPROVED" nếu có cải thiện rõ rệt nhưng chưa đạt chuẩn 100%.
  + "NOT_FIXED" nếu lỗi vẫn y nguyên như lần trước.
  + "WORSE" nếu bị tệ hơn.
- explanation: Nhận xét khách quan vì sao (ví dụ: "Tay áo lần này đã mở rộng đáng kể thành tay thụng", hoặc "Phom eo vẫn tiếp tục bị bóp thon").
`;
  }

  // 3. Soạn nội dung hướng dẫn chuyên sâu cho Gemini Multimodal Image QA
  const systemPrompt = `Bạn là Trưởng bộ phận Thẩm định Thị giác Việt phục (Visual QA Specialist) của hệ thống AC.
Nhiệm vụ của bạn là kiểm tra khắt khe bức ảnh do AI vừa tạo ra và đối chiếu với bản phối Việt phục yêu cầu.

NGUYÊN TẮC THẨM ĐỊNH NGHIÊM NGẶT (STRICT QA CRITERIA):

1. TIÊU CHÍ BẮT BUỘC: ĐỘ SẠCH HÌNH ẢNH / KHÔNG DÍNH CHỮ (VISUAL CLEANLINESS & TEXT CONTAMINATION):
   - Quan sát kỹ toàn bộ bức ảnh xem có xuất hiện BẤT KỲ chữ viết, từ ngữ, số, caption, nhãn dán, watermark, tiêu đề, đoạn văn mô tả hay bố cục kiểu poster/infographic/moodboard nào không.
   - Nếu CÓ BẤT KỲ VĂN BẢN HOẶC CHỮ NÀO RENDER TRONG ẢNH (text contamination):
     + visual_cleanliness.has_text_contamination = true
     + visual_cleanliness.status = "FAIL"
     + visual_cleanliness.score = 0
     + visual_cleanliness.explanation = "Ảnh bị dính chữ/văn bản/bố cục poster vào trong khung hình."
     + Thêm vào critical_issues: "Ảnh bị lỗi dính chữ hoặc văn bản render vào khung hình (Text contamination)."
     + BẮT BUỘC qa_status phải là "FAIL" và overall_score không được vượt quá 40/100!
     + regeneration_guidance phải chứa: "Loại bỏ hoàn toàn mọi chữ, typography, chú thích và bố cục dạng poster khỏi hình ảnh."
   - Nếu ảnh hoàn toàn sạch sẽ, chỉ có người mẫu và trang phục trên phông nền sạch:
     + visual_cleanliness.has_text_contamination = false
     + visual_cleanliness.status = "PASS"
     + visual_cleanliness.score = 100
     + visual_cleanliness.explanation = "Ảnh sạch hoàn toàn, không dính văn bản hay nhãn dán."

2. KIỂM SOÁT PHOM DÁNG & NHẬN DIỆN CỐT LÕI (GARMENT IDENTITY):
   - Phom chiết eo (bodycon fit / hourglass waist): Cả Áo tấc và Áo ngũ thân tay chẽn truyền thống đều là phom suông thẳng tự nhiên (natural straight silhouette). Nếu người mẫu bị bóp eo thon bó sát như áo dài hiện đại -> BẮT BUỘC gán kết quả "FAIL" cho trait phom dáng, garment_identity.status = "FAIL", garment_identity.score < 50, và đưa vào critical_issues.
   - Tay áo: Áo tấc chuẩn phải có tay thụng rộng buông dài (wide rectangular trailing sleeves). Nếu tay áo bị làm hẹp như áo dài hiện đại (mà người dùng không hề chọn remix tay chẽn) -> gán "FAIL" cho trait tay áo.
   - Lai tạp trang phục: Nếu bị biến thành áo dài hiện đại bó sát, sườn xám (qipao) xẻ tà cao, hoặc hán phục (hanfu) cổ trang Trung Quốc -> BẮT BUỘC qa_status = "FAIL".

3. BÁM SÁT LỰA CHỌN CỦA NGƯỜI DÙNG & ĐỐI TƯỢNG NGƯỜI MẶC (USER STATE ADHERENCE & WEARER PRESENTATION):
   - Người mặc theo bản phối: ${wearerLabel}.
   ${effectiveWearer === 'unspecified'
     ? `- Với trường hợp người mặc "Không ưu tiên / trung tính (unspecified)": Người dùng không đặt ưu tiên giới tính cụ thể. BỎ QUA HOÀN TOÀN việc phán xét giới tính người mẫu (không chấm lỗi mismatch giới tính dù ảnh là người mẫu nam hay nữ hay trung tính). TUYỆT ĐỐI KHÔNG ép buộc người mẫu phải là phi nhị nguyên hay áp đặt định kiến ngoại hình.`
     : `- Nếu người mẫu trong ảnh thể hiện sai khác rõ rệt so với giới tính đã chọn (${wearerLabel}) (ví dụ chọn Nam nhưng ảnh ra Nữ rõ rệt, hoặc chọn Nữ nhưng ra Nam), hãy phản ánh vào user_state_adherence như một lỗi KHÔNG BÁM SÁT BẢN PHỐI (BLUEPRINT / FIDELITY MISMATCH). TUYỆT ĐỐI KHÔNG coi đây là phán xét văn hóa hay sai phạm lịch sử!`}
   - Màu sắc: Màu chủ đạo (${colorPalette[0]?.name || ''} - ${colorPalette[0]?.hex || ''}) phải chiếm phần lớn diện tích. Nếu ảnh bị lệch màu sang màu khác -> trừ điểm user_state_adherence.
   - Phụ kiện: Kiểm tra xem các phụ kiện đã yêu cầu (${accessories.join(', ')}) có xuất hiện không. Nếu thiếu hẳn phụ kiện quan trọng đã chọn -> trừ điểm user_state_adherence.

4. BỐ CỤC TOÀN THÂN (VISUAL QUALITY):
   - Bắt buộc là ảnh toàn thân (full-body). Nếu bị crop ngang hông hoặc crop cụt bàn chân/giày -> visual_quality.status = "PARTIAL" hoặc "FAIL", trừ điểm visual_quality.

5. KHÔNG CHẤM NHỮNG GÌ ẢNH KHÔNG THỂ HIỆN:
   - Các chi tiết cấu tạo bên trong hoặc khuất (như thân thứ năm bên trong, đường ghép sống lưng khi chụp chính diện): gán result = "NOT_ASSESSABLE", confidence = "LOW", và KHÔNG trừ điểm của bức ảnh vì điều này.

6. NGUYÊN TẮC CHẤM ĐIỂM (NO FALSE 90+):
   - TUYỆT ĐỐI KHÔNG CHẤM 90+ chỉ vì ảnh trông nghệ thuật nếu có lỗi về nhận diện, dính chữ, hoặc sai màu/phụ kiện!
   - PASS: 80-100 (Nhận diện tốt, sạch chữ 100%, đúng phom suông, đúng palette).
   - NEEDS_REVIEW: 50-79 (Nhận diện khá, sạch chữ, nhưng thiếu phụ kiện hoặc màu sắc/tay áo chưa trọn vẹn).
   - FAIL: 0-49 (Dính chữ trong ảnh, HOẶC bị chiết eo bodycon, HOẶC sai lệch hoàn toàn loại trang phục).
${parentComparisonSection}

DỮ LIỆU ĐỐI CHỨNG CỦA BẢN PHỐI:
- Loại trang phục: ${garmentType}
- Bối cảnh lịch sử tham chiếu: ${knowledge.historical_context}
- Đặc trưng nhận diện cốt lõi: ${knowledge.identity_traits.join('; ')}
- Đặc điểm GIỮ theo whitelist: ${(giu || []).join('; ')}
- Yếu tố REMIX: ${(remix || []).join('; ')}
- Concept: ${conceptName}
- Dịp: ${originalRequest?.occasion || 'Dạo phố / Chụp ảnh'}
- Phong cách: ${originalRequest?.style || 'Thanh lịch'}
- Mức độ hiện đại: ${originalRequest?.modernityLevel ?? 50}/100
- Prompt đã dùng:
"""
${prompt}
"""

Hãy xuất kết quả chính xác theo định dạng JSON schema được chỉ định. Nhận xét chân thực, súc tích, mang tính chuyên môn cao.`;

  let response: any = null;
  let lastError: any = null;
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= VISUAL_QA_TIMEOUT_CONFIG.maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            systemPrompt,
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: QA_RESPONSE_SCHEMA,
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Image QA] Model ${modelName} Attempt ${attempt} failed:`, err?.status || err?.message || err);
        if (attempt < VISUAL_QA_TIMEOUT_CONFIG.maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, VISUAL_QA_TIMEOUT_CONFIG.retryDelayMs));
        }
      }
    }
    if (response?.text) break;
  }

  if (!response?.text) {
    throw lastError || new Error('Không nhận được phản hồi đánh giá từ mô hình.');
  }

  const text = response.text?.trim() || '{}';
  const parsed = JSON.parse(text) as ImageQAResult;

  // Thu thập điểm chi tiết thô (raw sub-scores) trước khi clamp
  const rawSubScores = {
    garment_identity: typeof parsed.garment_identity?.score === 'number' ? parsed.garment_identity.score : 0,
    user_state_adherence: typeof parsed.user_state_adherence?.score === 'number' ? parsed.user_state_adherence.score : 0,
    styling_and_context: typeof parsed.styling_and_context?.score === 'number' ? parsed.styling_and_context.score : 0,
    visual_quality: typeof parsed.visual_quality?.score === 'number' ? parsed.visual_quality.score : 0,
    visual_cleanliness: typeof parsed.visual_cleanliness?.score === 'number' ? parsed.visual_cleanliness.score : 100,
  };

  // Sanitize & enforce deterministic guardrails:
  let overallScore = typeof parsed.overall_score === 'number' ? parsed.overall_score : 70;
  let qaStatus: QAOverallStatus = parsed.qa_status;
  const criticalIssues = Array.isArray(parsed.critical_issues) ? [...parsed.critical_issues] : [];
  const guidance = Array.isArray(parsed.regeneration_guidance) && parsed.regeneration_guidance.length > 0
    ? [...parsed.regeneration_guidance]
    : [];

  const hasText = Boolean(parsed.visual_cleanliness?.has_text_contamination);
  if (hasText) {
    qaStatus = 'FAIL';
    overallScore = Math.min(overallScore, 40);
    const textMsg = 'Ảnh bị lỗi dính chữ, caption hoặc bố cục poster vào trong khung hình (Text contamination).';
    if (!criticalIssues.some((ci) => ci.toLowerCase().includes('chữ') || ci.toLowerCase().includes('text'))) {
      criticalIssues.unshift(textMsg);
    }
    const guideMsg = 'Loại bỏ hoàn toàn mọi chữ, ký tự văn bản, nhãn dán và bố cục poster khỏi hình ảnh.';
    if (!guidance.some((rg) => rg.toLowerCase().includes('chữ') || rg.toLowerCase().includes('text'))) {
      guidance.unshift(guideMsg);
    }
  }

  // Check garment identity failure
  if (parsed.garment_identity?.status === 'FAIL') {
    qaStatus = 'FAIL';
    overallScore = Math.min(overallScore, 45);
  }

  // Make sure regeneration guidance is always provided
  if (guidance.length === 0) {
    guidance.push(
      'Giữ phom áo suông thẳng tự nhiên, không chiết eo (natural straight silhouette, no waist shaping)',
      'Đảm bảo tay áo thể hiện đúng nhận diện đặc trưng của trang phục'
    );
  }

  const previousIssueProgress: PreviousIssueProgress[] = Array.isArray(parsed.previous_issue_progress)
    ? parsed.previous_issue_progress
    : [];

  return {
    ...parsed,
    qa_status: qaStatus,
    overall_score: overallScore,
    critical_issues: criticalIssues,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    regeneration_guidance: guidance,
    raw_sub_scores: rawSubScores,
    previous_issue_progress: previousIssueProgress,
    wearerPresentation: effectiveWearer,
  };
}
