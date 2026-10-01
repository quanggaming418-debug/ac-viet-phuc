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
- cấu trúc năm thân;
- có thân thứ năm phía trong phần trước;
- cổ đứng/lập lĩnh;
- tay thu về cổ tay;
- phom truyền thống không bodycon mạnh;
- màu sắc và phụ kiện có thể linh hoạt theo bối cảnh.

Áo tứ thân
- cấu trúc bốn thân;
- hai phần sau ghép dọc sống lưng;
- hai vạt trước riêng/mở;
- cách mặc nhiều lớp, màu sắc và phụ kiện phụ thuộc bối cảnh;
- không đồng nhất áo tứ thân với Quan họ.

Áo tấc
- thuộc hệ cấu trúc năm thân;
- đặc điểm nổi bật là tay rộng/thụng;
- thường gắn mạnh hơn với bối cảnh trang trọng/lễ nghi;
- màu sắc và phụ kiện thay đổi theo bối cảnh.

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
  + GIỮ: Những đặc điểm nhận diện cốt lõi của trang phục được bảo toàn (2–3 ý ngắn).
  + REMIX: Những yếu tố được biến tấu để phù hợp phong cách cá nhân và đời sống hiện đại (2–3 ý ngắn).
  + LƯU Ý: Những điểm nên cân nhắc nếu người dùng muốn giữ rõ hơn nét của trang phục hoặc phù hợp hơn với dịp đã chọn. LƯU Ý không phải "cấm kỵ" (tối đa 2 ý ngắn).
- Recommendation về màu sắc và phụ kiện: Được phép sáng tạo bảng màu (đúng 3 màu), tên concept, phụ kiện (tối đa 3), cách phối đương đại. Nhưng phải hiểu đây là styling recommendation, không phải sự thật lịch sử. Không viết các câu kiểu "Người xưa luôn mặc màu này" hay "Đây là phụ kiện bắt buộc truyền thống".
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
      description: "2-3 ý: Đặc điểm nhận diện cốt lõi được bảo toàn.",
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

Hãy phân tích toàn diện và đề xuất đúng một bản phối Việt phục chuẩn xác theo structured output.`;

      // Call primary model with automatic retry if 503 transient spike occurs
      let response;
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      let lastError = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const modelName = modelsToTry[i];
        try {
          if (i > 0) {
            // Wait 1 second before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: RECOMMENDATION_SCHEMA,
              temperature: 0.7,
            },
          });
          if (response?.text) {
            break; // Success!
          }
        } catch (callErr: any) {
          lastError = callErr;
          console.warn(`[AC Backend] Model ${modelName} call attempt ${i + 1} failed:`, callErr?.status || callErr?.message);
        }
      }

      if (!response?.text) {
        throw lastError || new Error('No response text received from Gemini');
      }

      const parsedRecommendation = JSON.parse(response.text);

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
      if (Array.isArray(parsedRecommendation.giu)) {
        parsedRecommendation.giu = parsedRecommendation.giu.slice(0, 3);
      }
      if (Array.isArray(parsedRecommendation.remix)) {
        parsedRecommendation.remix = parsedRecommendation.remix.slice(0, 3);
      }
      if (Array.isArray(parsedRecommendation.luuY)) {
        parsedRecommendation.luuY = parsedRecommendation.luuY.slice(0, 2);
      }

      return res.json({
        success: true,
        recommendation: parsedRecommendation,
      });
    } catch (error) {
      console.error('[AC Backend] Gemini recommendation error:', error);
      // Friendly, non-technical error response. Never mock data!
      return res.status(500).json({
        success: false,
        error: 'AC chưa thể tạo bản phối lúc này. Hãy thử lại sau một chút.',
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
