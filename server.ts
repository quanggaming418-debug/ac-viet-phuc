import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const SYSTEM_INSTRUCTION = `Bạn là AC, trợ lý AI hỗ trợ người trẻ tìm hiểu và phối Việt phục.
AC không phải nhà phê bình trang phục và không phán xét người mặc.
AC hiện chỉ hỗ trợ ba loại:

Áo ngũ thân tay chẽn
- Cấu trúc năm thân.
- Có thân thứ năm phía trong phần trước.
- Cổ đứng/lập lĩnh.
- Tay thu về cổ tay.
- Phom truyền thống không bodycon mạnh.

Áo tứ thân
- Cấu trúc bốn thân.
- Hai phần phía sau ghép dọc sống lưng.
- Hai vạt trước riêng/mở.

Áo tấc
- Cấu trúc năm thân.
- Tay rộng/thụng.

Nguyên tắc tư vấn:
- Trả lời 100% bằng tiếng Việt.
- Chọn đúng một trong ba loại trang phục: "Áo ngũ thân tay chẽn", "Áo tứ thân", hoặc "Áo tấc".
- Ưu tiên nhu cầu thực tế của người dùng:
  + Dịp (occasion) là thông tin chính thức về dịp.
  + Phong cách (style) là phong cách chính thức.
  + modernityLevel (thang 0-100: 0 là thiên về truyền thống hơn, 100 là thiên về hiện đại hơn, 50 là cân bằng) điều khiển mức truyền thống/hiện đại.
  + userText bổ sung màu sắc, cảm giác, hoàn cảnh và mong muốn chi tiết.
  + Nếu nội dung tự do (userText) mâu thuẫn trực tiếp với selector của cùng một trường, ưu tiên selector mà người dùng vừa chọn.
- Giải thích ngắn gọn, không bịa thông tin lịch sử.
- Không gọi bản phối là "sai Việt phục".
- Không dùng các từ "phản cảm", "vi phạm quy chuẩn" nếu không có căn cứ.
- Không biến màu sắc hoặc phụ kiện thành điều kiện duy nhất để nhận diện trang phục.
- Phân biệt rõ:
  + GIỮ: Những đặc điểm nhận diện cốt lõi của trang phục được bảo toàn.
    =======================================================================
    WHITELIST BẮT BUỘC TUYỆT ĐỐI CHO TRƯỜNG GIỮ:
    Mỗi item trong 'giu' PHẢI LÀ DIỄN ĐẠT LẠI TRỰC TIẾP từ WHITELIST của loại trang phục được chọn:

    1. Nếu chọn Áo ngũ thân tay chẽn (chọn 2-3 ý từ danh sách sau):
       - Cấu trúc năm thân.
       - Có thân thứ năm phía trong phần trước.
       - Cổ đứng/lập lĩnh.
       - Tay thu về cổ tay.
       - Phom truyền thống không bodycon mạnh.

    2. Nếu chọn Áo tứ thân (chọn các ý từ danh sách sau):
       - Cấu trúc bốn thân.
       - Hai phần phía sau ghép dọc sống lưng.
       - Hai vạt trước riêng/mở.

    3. Nếu chọn Áo tấc (chọn các ý từ danh sách sau):
       - Cấu trúc năm thân.
       - Tay rộng/thụng.

    CẤM TUYỆT ĐỐI TRONG GIỮ:
    - KHÔNG ĐƯỢC thêm màu sắc, chất liệu, phụ kiện, bối cảnh, cảm giác thẩm mỹ.
    - KHÔNG ĐƯỢC dùng các tính từ như uy nghiêm, thanh lịch, duyên dáng, đoan trang, trẻ trung trong GIỮ.
    - Với Áo tấc: TUYỆT ĐỐI KHÔNG đưa "cổ đứng/lập lĩnh" vào GIỮ.
    - KHÔNG đưa các câu như "phom dáng tạo sự uy nghiêm", "màu sắc truyền thống", "phụ kiện đặc trưng" vào GIỮ.
    - KHÔNG đưa bất kỳ supporting structure nào không nằm trong whitelist vào GIỮ.
    =======================================================================
  + REMIX: Những yếu tố được biến tấu để phù hợp phong cách cá nhân và đời sống hiện đại (2–3 ý ngắn).
  + LƯU Ý: Những điểm nên cân nhắc nếu người dùng muốn giữ rõ hơn nét của trang phục hoặc phù hợp hơn với dịp đã chọn. LƯU Ý không phải "cấm kỵ" (tối đa 2 ý ngắn).
- Recommendation về màu sắc và phụ kiện: Được phép sáng tạo bảng màu (đúng 3 màu), tên concept, phụ kiện (tối đa 3), cách phối đương đại. Nhưng phải hiểu đây là styling recommendation, không phải sự thật lịch sử. Không viết các câu kiểu "Người xưa luôn mặc màu này" hay "Đây là phụ kiện bắt buộc truyền thống".
- GUARDRAIL VỀ DIỄN ĐẠT & TÍNH TỪ:
  + Các tính từ (như: duyên dáng, phóng khoáng, đoan trang, thanh lịch, trẻ trung...) CHỈ ĐƯỢC DÙNG để mô tả CONCEPT STYLING hiện tại. Tuyệt đối KHÔNG trình bày chúng như đặc tính lịch sử cố hữu của một loại Việt phục.
  + Màu sắc, chất liệu và phụ kiện sáng tạo phải luôn được hiểu là styling recommendation. Tuyệt đối KHÔNG được diễn đạt theo hướng: "truyền thống bắt buộc", "người xưa luôn dùng", "đúng chuẩn lịch sử" nếu system knowledge không cung cấp căn cứ đó.
- whyItFits: Tối đa khoảng 2 câu, giải thích rõ ràng và thuyết phục.`;

const RECOMMENDATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    garmentType: {
      type: Type.STRING,
      enum: ["Áo ngũ thân tay chẽn", "Áo tứ thân", "Áo tấc"],
      description: "Một trong ba loại trang phục chính xác được AC hỗ trợ.",
    },
    conceptName: {
      type: Type.STRING,
      description: "Tên concept ngắn gọn, thẩm mỹ cho bản phối.",
    },
    summary: {
      type: Type.STRING,
      description: "Tóm tắt tinh thần bản phối trong 1 câu ngắn gọn.",
    },
    colorPalette: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Tên gợi cảm của màu sắc (ví dụ: Đỏ mộc, Vàng tơ tằm, Trắng ngà).",
          },
          hex: {
            type: Type.STRING,
            description: "Mã màu HEX 6 ký tự hợp lệ bắt đầu bằng dấu # (ví dụ: #8E3028).",
          },
        },
        required: ["name", "hex"],
      },
      description: "Đúng 3 màu sắc đại diện cho bản phối.",
    },
    accessories: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Tối đa 3 phụ kiện gợi ý (dạng văn bản sạch, ngắn gọn).",
    },
    suitableOccasions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Tối đa 3 dịp hoặc bối cảnh sử dụng phù hợp.",
    },
    whyItFits: {
      type: Type.STRING,
      description: "Lý do phù hợp, tối đa khoảng 2 câu.",
    },
    giu: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Chỉ lấy trực tiếp từ whitelist cấu trúc của garment tương ứng. Áo ngũ thân tay chẽn: năm thân, thân thứ năm, cổ đứng/lập lĩnh, tay thu về cổ tay, phom truyền thống. Áo tứ thân: bốn thân, ghép sống lưng, hai vạt trước riêng/mở. Áo tấc: Cấu trúc năm thân, Tay rộng/thụng (cấm cổ đứng trong Áo tấc).",
    },
    remix: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "2-3 ý: Yếu tố biến tấu theo phong cách cá nhân & hiện đại.",
    },
    luuY: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Tối đa 2 ý: Điểm nên cân nhắc theo mục tiêu & bối cảnh.",
    },
  },
  required: [
    "garmentType",
    "conceptName",
    "summary",
    "colorPalette",
    "accessories",
    "suitableOccasions",
    "whyItFits",
    "giu",
    "remix",
    "luuY",
  ],
};

const CANONICAL_WHITELISTS: Record<string, string[]> = {
  "Áo ngũ thân tay chẽn": [
    "Cấu trúc năm thân",
    "Có thân thứ năm phía trong phần trước",
    "Cổ đứng/lập lĩnh",
    "Tay thu về cổ tay",
    "Phom truyền thống không bodycon mạnh",
  ],
  "Áo tứ thân": [
    "Cấu trúc bốn thân",
    "Hai phần phía sau ghép dọc sống lưng",
    "Hai vạt trước riêng/mở",
  ],
  "Áo tấc": [
    "Cấu trúc năm thân",
    "Tay rộng/thụng",
  ],
};

function validateGiuAgainstWhitelist(garmentType: string, giuList: string[]): { isValid: boolean; sanitized: string[]; reason?: string } {
  const allowed = CANONICAL_WHITELISTS[garmentType] || CANONICAL_WHITELISTS["Áo ngũ thân tay chẽn"];
  
  if (!Array.isArray(giuList) || giuList.length === 0) {
    return { isValid: false, sanitized: allowed.slice(0, 2), reason: "Danh sách GIỮ trống" };
  }

  const forbiddenWords = [
    "màu", "sắc", "vải", "chất liệu", "lụa", "gấm", "nhung", "sa", "đũi", "tơ", "linen", "gấm hoa",
    "phụ kiện", "khăn", "trâm", "guốc", "hài", "nón", "quạt", "túi", "trang sức", "kiềng", "vòng",
    "uy nghiêm", "thanh lịch", "duyên dáng", "đoan trang", "trẻ trung", "quý phái", "trang nghiêm", "kiêu sa", "thẩm mỹ", "cảm giác",
    "bối cảnh", "dịp", "lễ", "tết", "chụp ảnh", "cưới"
  ];

  let isValid = true;
  let reason = "";

  for (const item of giuList) {
    const lower = item.toLowerCase();

    // Check forbidden words
    for (const fw of forbiddenWords) {
      if (lower.includes(fw)) {
        isValid = false;
        reason = `Chứa từ cấm "${fw}" trong câu: "${item}"`;
        break;
      }
    }
    if (!isValid) break;

    // Check garment-specific restrictions
    if (garmentType === "Áo tấc") {
      if (lower.includes("cổ") || lower.includes("lập lĩnh") || lower.includes("đứng")) {
        isValid = false;
        reason = `Áo tấc tuyệt đối không đưa "cổ đứng/lập lĩnh" vào GIỮ: "${item}"`;
        break;
      }
      const matchesNamThan = lower.includes("năm thân") || lower.includes("5 thân");
      const matchesTayRong = lower.includes("tay rộng") || lower.includes("tay thụng") || lower.includes("thụng");
      if (!matchesNamThan && !matchesTayRong) {
        isValid = false;
        reason = `Áo tấc chỉ chấp nhận whitelist (năm thân, tay rộng/thụng): "${item}"`;
        break;
      }
    } else if (garmentType === "Áo tứ thân") {
      const matchesBonThan = lower.includes("bốn thân") || lower.includes("4 thân");
      const matchesSongLung = lower.includes("sống lưng") || lower.includes("ghép dọc");
      const matchesVatTruoc = lower.includes("vạt trước") || lower.includes("riêng") || lower.includes("mở");
      if (!matchesBonThan && !matchesSongLung && !matchesVatTruoc) {
        isValid = false;
        reason = `Áo tứ thân không thuộc whitelist: "${item}"`;
        break;
      }
    } else if (garmentType === "Áo ngũ thân tay chẽn") {
      const matchesNamThan = lower.includes("năm thân") || lower.includes("5 thân");
      const matchesThanThuNam = lower.includes("thân thứ năm") || lower.includes("thân thứ 5");
      const matchesCoDung = lower.includes("cổ đứng") || lower.includes("lập lĩnh");
      const matchesTayThu = lower.includes("tay thu") || lower.includes("cổ tay");
      const matchesPhom = lower.includes("bodycon") || lower.includes("phom truyền thống") || lower.includes("phom");
      if (!matchesNamThan && !matchesThanThuNam && !matchesCoDung && !matchesTayThu && !matchesPhom) {
        isValid = false;
        reason = `Áo ngũ thân tay chẽn không thuộc whitelist: "${item}"`;
        break;
      }
    }
  }

  // Sanitized version strictly mirrors canonical whitelist
  const sanitizedCount = garmentType === "Áo tấc" ? 2 : garmentType === "Áo tứ thân" ? 3 : 3;
  const sanitized = allowed.slice(0, sanitizedCount);

  return { isValid, sanitized, reason };
}

async function callGeminiWithRetry(ai: GoogleGenAI, userPrompt: string) {
  let response;
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    try {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RECOMMENDATION_SCHEMA,
          temperature: 0.6,
        },
      });
      if (response?.text) {
        break;
      }
    } catch (callErr: any) {
      lastError = callErr;
      console.warn(`[AC Backend] Model ${modelName} call attempt ${i + 1} failed:`, callErr?.status || callErr?.message);
    }
  }

  if (!response?.text) {
    throw lastError || new Error('No response text received from Gemini');
  }

  let parsedRecommendation = JSON.parse(response.text);

  // SERVER-SIDE VALIDATION: Check GIỮ against strict whitelist
  let check = validateGiuAgainstWhitelist(parsedRecommendation.garmentType, parsedRecommendation.giu);
  if (!check.isValid) {
    console.warn(`[AC Backend] GIỮ validation failed (${check.reason}). Regenerating with corrective prompt...`);
    
    // Regenerate once with strict corrective instruction as requested
    const correctivePrompt = `${userPrompt}

LƯU Ý ĐẶC BIỆT VỀ LỖI VI PHẠM WHITELIST:
Lần sinh trước, trường GIỮ bị từ chối vì: ${check.reason}.
YÊU CẦU: Trường GIỮ của "${parsedRecommendation.garmentType}" BẮT BUỘC chỉ được lấy từ WHITELIST sau:
${CANONICAL_WHITELISTS[parsedRecommendation.garmentType]?.map(item => `- ${item}`).join('\n')}
Tuyệt đối KHÔNG thêm tính từ (uy nghiêm, thanh lịch, v.v.), phụ kiện, chất liệu hay màu sắc vào GIỮ!`;

    try {
      const regenResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: correctivePrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RECOMMENDATION_SCHEMA,
          temperature: 0.4,
        },
      });
      if (regenResponse?.text) {
        const regenParsed = JSON.parse(regenResponse.text);
        const secondCheck = validateGiuAgainstWhitelist(regenParsed.garmentType, regenParsed.giu);
        if (secondCheck.isValid) {
          parsedRecommendation = regenParsed;
          check = secondCheck;
        } else {
          parsedRecommendation = regenParsed;
          parsedRecommendation.giu = secondCheck.sanitized;
        }
      } else {
        parsedRecommendation.giu = check.sanitized;
      }
    } catch (regenErr) {
      console.warn('[AC Backend] Regeneration failed, falling back to canonical whitelist for GIỮ:', regenErr);
      parsedRecommendation.giu = check.sanitized;
    }
  }

  // Ensure GIỮ never exceeds valid length or leaks
  if (Array.isArray(parsedRecommendation.giu)) {
    if (parsedRecommendation.garmentType === "Áo tấc") {
      parsedRecommendation.giu = parsedRecommendation.giu.filter((item: string) => {
        const lower = item.toLowerCase();
        return !lower.includes("cổ") && !lower.includes("lập lĩnh") && !lower.includes("đứng");
      });
      if (parsedRecommendation.giu.length === 0) {
        parsedRecommendation.giu = CANONICAL_WHITELISTS["Áo tấc"];
      }
    }
    parsedRecommendation.giu = parsedRecommendation.giu.slice(0, 3);
  }

  // Clamp array limits strictly as specified
  if (Array.isArray(parsedRecommendation.colorPalette)) {
    parsedRecommendation.colorPalette = parsedRecommendation.colorPalette.slice(0, 3);
  }
  if (Array.isArray(parsedRecommendation.accessories)) {
    parsedRecommendation.accessories = parsedRecommendation.accessories.slice(0, 3);
  }
  if (Array.isArray(parsedRecommendation.suitableOccasions)) {
    parsedRecommendation.suitableOccasions = parsedRecommendation.suitableOccasions.slice(0, 3);
  }
  if (Array.isArray(parsedRecommendation.remix)) {
    parsedRecommendation.remix = parsedRecommendation.remix.slice(0, 3);
  }
  if (Array.isArray(parsedRecommendation.luuY)) {
    parsedRecommendation.luuY = parsedRecommendation.luuY.slice(0, 2);
  }

  return parsedRecommendation;
}

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Backend Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AC Server Engine',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    });
  });

  // Stage 3: Real Gemini Recommendation Endpoint
  app.post('/api/recommend', async (req, res) => {
    try {
      const { userText, occasion, style, modernityLevel, prompt, modernity } = req.body || {};

      const resolvedUserText = (userText || prompt || '').trim();
      const resolvedOccasion = occasion || 'Tết';
      const resolvedStyle = style || 'Thanh lịch';
      const resolvedModernity = typeof modernityLevel === 'number' 
        ? modernityLevel 
        : typeof modernity === 'number' 
          ? modernity 
          : 50;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('[AC Backend] Missing GEMINI_API_KEY environment variable.');
        return res.status(500).json({
          success: false,
          error: 'AC chưa thể tạo bản phối lúc này. Hãy thử lại sau một chút.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const userPrompt = `Yêu cầu phối trang phục Việt:
- Dịp đã chọn: ${resolvedOccasion}
- Phong cách mong muốn: ${resolvedStyle}
- Mức độ truyền thống ↔ hiện đại: ${resolvedModernity}/100 (${
        resolvedModernity < 50
          ? 'Ưu tiên giữ nét truyền thống hơn'
          : resolvedModernity > 50
          ? 'Ưu tiên yếu tố hiện đại hóa hơn'
          : 'Dung hòa cân bằng giữa truyền thống và hiện đại'
      })
- Chia sẻ cụ thể từ người dùng: "${resolvedUserText || 'Không có mô tả thêm'}"

Hãy phân tích toàn diện và đề xuất đúng một bản phối Việt phục chuẩn xác theo structured output.
QUY TẮC BẮT BUỘC: Trường GIỮ chỉ được lấy trực tiếp từ WHITELIST cố định của trang phục tương ứng. Tuyệt đối không thêm tính từ (uy nghiêm, thanh lịch...), phụ kiện, chất liệu, màu sắc hay bối cảnh vào GIỮ. Với Áo tấc, cấm đưa cổ đứng/lập lĩnh vào GIỮ.`;

      const recommendation = await callGeminiWithRetry(ai, userPrompt);

      return res.json({
        success: true,
        recommendation,
      });
    } catch (error) {
      console.error('[AC Backend] Gemini recommendation error:', error);
      return res.status(500).json({
        success: false,
        error: 'AC chưa thể tạo bản phối lúc này. Hãy thử lại sau một chút.',
      });
    }
  });

  // Stage 4: Real Gemini Refinement Endpoint
  app.post('/api/refine-advisor', async (req, res) => {
    try {
      const { originalRequest, currentRecommendation, refinementType } = req.body || {};

      if (!refinementType || !currentRecommendation) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin yêu cầu điều chỉnh bản phối.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('[AC Backend] Missing GEMINI_API_KEY environment variable.');
        return res.status(500).json({
          success: false,
          error: 'AC chưa thể điều chỉnh bản phối lúc này. Hãy thử lại.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const resolvedUserText = (originalRequest?.userText || '').trim();
      const resolvedOccasion = originalRequest?.occasion || 'Tết';
      const resolvedStyle = originalRequest?.style || 'Thanh lịch';
      const resolvedModernity = typeof originalRequest?.modernityLevel === 'number'
        ? originalRequest.modernityLevel
        : 50;

      let refinementDirective = '';
      if (refinementType === 'more_traditional') {
        refinementDirective = `YÊU CẦU ĐIỀU CHỈNH: "TRUYỀN THỐNG HƠN"
- Giữ đúng nhu cầu và dịp ban đầu (Dịp: ${resolvedOccasion}, Phong cách: ${resolvedStyle}).
- "Truyền thống hơn" chủ yếu có nghĩa:
  + giảm các yếu tố hiện đại nổi bật;
  + giữ rõ hơn core identity (đặc điểm nhận diện cốt lõi);
  + tiết chế màu sắc/phụ kiện nếu cần.
- KHÔNG ĐƯỢC suy luận rằng phải thêm một phụ kiện cụ thể như khăn vấn, trâm, guốc, túi vải... nếu system knowledge không xác nhận phụ kiện đó phù hợp với bối cảnh cụ thể.
- Nếu đề xuất một phụ kiện cụ thể, phải trình bày rõ đó là "gợi ý phối", không phải phụ kiện bắt buộc hay sự thật lịch sử.
- Không cần đổi loại Việt phục (${currentRecommendation.garmentType}) nếu loại này vẫn phù hợp.
- Tuyệt đối không tự bịa rằng một màu hoặc phụ kiện nào là "bắt buộc truyền thống". Không biến styling recommendation thành historical fact.`;
      } else if (refinementType === 'more_modern') {
        refinementDirective = `YÊU CẦU ĐIỀU CHỈNH: "BIẾN TẤU THÊM"
- Giữ vững các đặc điểm nhận diện cốt lõi của trang phục (cấu trúc thân áo, cổ áo, tay áo).
- Tăng mức độ hiện đại trong bảng màu (ví dụ gam màu pastel đương đại, màu trung tính thời thượng hoặc tương phản tinh tế), phụ kiện và cách phối layer phù hợp đời sống trẻ năng động.
- Giải thích rành mạch phần nào thuộc GIỮ và phần nào thuộc REMIX.
- Không làm thay đổi core identity đến mức không còn nhận ra loại trang phục.
- Nếu sự biến tấu đề xuất là phá cách đáng chú ý, phần LƯU Ý phải nói rõ điều đó cho người dùng.
- Tuyệt đối không dùng cụm từ "phối sai Việt phục".`;
      } else if (refinementType === 'alternative') {
        const remainingTypes = ["Áo ngũ thân tay chẽn", "Áo tứ thân", "Áo tấc"].filter(
          (g) => g !== currentRecommendation.garmentType
        );
        refinementDirective = `YÊU CẦU ĐIỀU CHỈNH: "THỬ PHƯƠNG ÁN KHÁC"
- Tạo một phương án THỰC SỰ KHÁC BIỆT so với bản phối hiện tại.
- Bản phối trước đang dùng: "${currentRecommendation.garmentType}" với concept "${currentRecommendation.conceptName}".
- Ưu tiên số 1: Thử một trong hai dáng Việt phục còn lại (${remainingTypes.join(" hoặc ")}) nếu vẫn phù hợp với dịp "${resolvedOccasion}" và phong cách "${resolvedStyle}".
- Ưu tiên số 2: Nếu đổi dáng phục không hợp lý với dịp, giữ dáng phục nhưng BẮT BUỘC ĐỔI RÕ RỆT concept thẩm mỹ, bảng màu 3 sắc thái hoàn toàn khác, và bộ phụ kiện mới.
- Tuyệt đối không trả về kết quả gần như y hệt recommendation trước.`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Loại điều chỉnh không hợp lệ.',
        });
      }

      const prompt = `YÊU CẦU ĐIỀU CHỈNH BẢN PHỐI VIỆT PHỤC:
1. THÔNG TIN BAN ĐẦU CỦA NGƯỜI DÙNG:
- Dịp: ${resolvedOccasion}
- Phong cách: ${resolvedStyle}
- Mức độ truyền thống ↔ hiện đại: ${resolvedModernity}/100
- Mô tả chi tiết: "${resolvedUserText || 'Không có mô tả thêm'}"

2. BẢN PHỐI HIỆN TẠI ĐANG HIỂN THỊ:
- Dáng phục: ${currentRecommendation.garmentType}
- Concept: ${currentRecommendation.conceptName}
- Tóm tắt: ${currentRecommendation.summary}
- Bảng màu hiện tại: ${JSON.stringify(currentRecommendation.colorPalette || [])}
- Phụ kiện hiện tại: ${(currentRecommendation.accessories || []).join(', ')}

3. HƯỚNG ĐIỀU CHỈNH MỚI:
${refinementDirective}

QUY TẮC BẮT BUỘC CHO GIỮ:
- Áp dụng cùng WHITELIST cố định cho trường GIỮ. Tuyệt đối không nới lỏng.
- Không đưa màu sắc, chất liệu, phụ kiện, bối cảnh hay các tính từ (uy nghiêm, thanh lịch...) vào GIỮ.
- Với Áo tấc: Tuyệt đối KHÔNG đưa "cổ đứng/lập lĩnh" vào GIỮ.`;

      const refinedRecommendation = await callGeminiWithRetry(ai, prompt);

      return res.json({
        success: true,
        recommendation: refinedRecommendation,
      });
    } catch (error) {
      console.error('[AC Backend] Gemini refinement error:', error);
      return res.status(500).json({
        success: false,
        error: 'AC chưa thể điều chỉnh bản phối lúc này. Hãy thử lại.',
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[AC Engine] Server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[AC Engine] Startup error:', err);
  process.exit(1);
});
