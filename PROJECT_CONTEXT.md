# AC — Project Context

## 1. Project Goal

- **Bài toán:** Hỗ trợ người trẻ khám phá, lựa chọn và phối Việt phục phù hợp với nhu cầu thực tế mà không áp đặt định kiến hoặc phán xét.

- **Đối tượng người dùng:** Người trẻ quan tâm đến Việt phục nhưng chưa có nhiều kinh nghiệm lựa chọn và phối trang phục, đặc biệt trong các dịp như Tết, chụp ảnh, kỷ yếu/tốt nghiệp, lễ hội/sự kiện văn hóa và đám cưới/lễ nghi.

- **Giá trị cốt lõi:** Cầu nối giữa đặc điểm nhận diện cốt lõi (GIỮ) và khả năng biến tấu theo nhu cầu cá nhân (REMIX, LƯU Ý), giúp người dùng hiểu lý do của một bản phối thay vì quy chụp “đúng / sai Việt phục”.

## 2. Current MVP Scope
- **3 dáng Việt phục được hỗ trợ:**
  - Áo ngũ thân tay chẽn
  - Áo tứ thân
  - Áo tấc
- **Tính năng đã hoàn thiện (In-Scope):**
  - Nhập mô tả nhu cầu bằng ngôn ngữ tự nhiên (textarea).
  - Quick selectors: Dịp (Occasion), Phong cách (Style).
  - Slider tỷ lệ Truyền thống hơn ↔ Hiện đại hơn (0–100).
  - Server-side Gemini recommendation với structured output chuẩn.
  - Ba trụ cột định hình: GIỮ (nhận diện cốt lõi theo whitelist), REMIX (biến tấu đương đại), LƯU Ý (cân nhắc thực tế).
  - Refinement flow 3 nút: "Truyền thống hơn", "Biến tấu thêm", "Thử phương án khác" (gọi Gemini thật, tự cập nhật kết quả).
  - Tích hợp tạo hình ảnh bản phối trực tiếp qua EvoLink Image Generation API (proxy server-side bảo mật EVOLINK_API_KEY).
- **Out of Scope (Chưa triển khai):**
  - Upload ảnh người dùng.
  - Authentication / Login / User profile.
  - Database lưu trữ dữ liệu (PostgreSQL, Firestore, v.v.).
  - Lưu lịch sử bản phối lâu dài trên cloud, chia sẻ social, dữ liệu thời tiết, giỏ hàng thương mại điện tử.

## 3. Architecture
- **Frontend:** React 19 SPA chạy trên nền Vite + Tailwind CSS v4, Lucide React icons, TypeScript.
- **Backend:** Node.js + Express (`server.ts`), tích hợp `vite.middlewares` trong môi trường development (`tsx server.ts`).
- **AI Integration:** `@google/genai` gọi model `gemini-3.8-flash` hoàn toàn ở server-side proxy.
- **Secrets & Env:** `GEMINI_API_KEY` chỉ được truy cập dưới dạng biến môi trường phía server. Khi chạy local có thể cấu hình qua `.env`; khi chạy trên Google AI Studio/deployment sử dụng Secrets/environment của nền tảng. Frontend không chứa hoặc truy cập API key.

```text
[Browser: React SPA]
       │
       │  POST /api/recommend hoặc POST /api/refine-advisor
       ▼
[Backend: Express server.ts] ──(GEMINI_API_KEY)──► [Google GenAI: gemini-3.8-flash]
       │                                                      │
       │◄─── Structured Output Validated against Whitelist ───┘
       ▼
[JSON: ACOutfitRecommendation] ──► [ResultSection UI Render]
```

## 4. Main Files & Responsibilities
- `server.ts`: Entry point Express backend; cấu hình Vite middleware, bảo vệ API key, chứa system instruction, schema, gọi Gemini và validate whitelist trường `giu`.
- `src/App.tsx`: Component gốc; quản lý state bản phối hiện tại (`recommendation`), yêu cầu gốc (`originalRequest`), trạng thái loading/refining và điều hướng mượt.
- `src/components/InputSection.tsx`: Form tiếp nhận input tự nhiên, chip chọn Dịp, chip chọn Phong cách, slider truyền thống/hiện đại và nút submit.
- `src/components/ResultSection.tsx`: Hiển thị chi tiết bản phối (tên concept, lý do, bảng màu 3 sắc thái, phụ kiện, GIỮ, REMIX, LƯU Ý) và 3 nút Refinement.
- `src/components/AuroraBackground.tsx`: Lớp hiệu ứng ánh sáng nền ambient aurora tối giản.
- `src/components/Header.tsx`, `HeroSection.tsx`, `AboutSection.tsx`, `GarmentsSection.tsx`, `Footer.tsx`: Các section tĩnh định hình trải nghiệm và giới thiệu 3 dáng phục.
- `src/types/recommendation.ts`: Type definitions cho `ACOutfitRecommendation`, `RefinementType` và `OriginalRequest`.
- `src/index.css`: Cấu hình Tailwind CSS (@import "tailwindcss";), font chữ Be Vietnam Pro và style tùy chỉnh cho slider.
- `metadata.json`: Khai báo metadata applet và capability server-side Gemini.
- `package.json`: Danh sách scripts (`dev: "tsx server.ts"`, `build: "vite build"`) và dependencies.

## 5. API Routes
- `GET /api/health`
  - **Mục đích:** Kiểm tra trạng thái máy chủ backend và sự hiện diện của Gemini API key.
  - **Input:** Không có.
  - **Output:** `{ status: "ok", service: string, hasApiKey: boolean, model: string }`
- `POST /api/recommend`
  - **Mục đích:** Tạo bản phối Việt phục ban đầu từ input của người dùng.
  - **Input:** `{ userText: string, occasion: string, style: string, modernityLevel: number }`
  - **Output:** `{ success: boolean, recommendation: ACOutfitRecommendation }` (hoặc lỗi HTTP 500 kèm message thân thiện).
- `POST /api/refine-advisor`
  - **Mục đích:** Điều chỉnh bản phối theo 1 trong 3 hướng: `more_traditional`, `more_modern`, hoặc `alternative`.
  - **Input:** `{ originalRequest: OriginalRequest, currentRecommendation: ACOutfitRecommendation, refinementType: RefinementType }`
  - **Output:** `{ success: boolean, recommendation: ACOutfitRecommendation }` (hoặc lỗi HTTP 400/500).
- `POST /api/generate-image`
  - **Mục đích:** Proxy tạo hình ảnh trực tiếp từ prompt thông qua EvoLink AI (`qwen-image-3.0-pro`), bảo mật `EVOLINK_API_KEY`.
  - **Input:** `{ prompt: string, model?: string }`
  - **Output:** `{ success: boolean, taskId: string, imageUrl: string, model: string, status: string }` (hoặc `{ success: false, error: { code: string, message: string } }`).

## 6. Gemini Flow
1. **Frontend gửi dữ liệu:** `InputSection` hoặc `ResultSection` gửi thông tin nhu cầu + bản phối hiện tại đến Express API.
2. **Backend đóng gói prompt:**
   - Gắn `SYSTEM_INSTRUCTION` chứa kiến thức 3 dáng phục, nguyên tắc tư vấn khách quan và quy tắc whitelist.
   - Bổ sung directive riêng biệt cho từng loại refinement (`more_traditional`, `more_modern`, `alternative`).
3. **Structured Output:** Sử dụng `responseSchema` của `@google/genai` ép model trả về đúng cấu trúc JSON của `ACOutfitRecommendation`.
4. **Validation & Guardrail:**
   - Backend chạy hàm `validateGiuAgainstWhitelist(garmentType, giu)`.
   - Nếu vi phạm (chứa từ cấm, tính từ styling, hoặc sai dáng phục), backend kích hoạt cơ chế retry/regeneration với prompt hiệu chỉnh hoặc sanitize theo whitelist chuẩn.
5. **Refinement:** Model nhận toàn bộ bản phối trước để tránh trùng lặp khi chọn "Thử phương án khác", hoặc tiết chế/tăng cường tính hiện đại khi chọn "Truyền thống hơn" / "Biến tấu thêm".

## 7. Cultural Guardrails
### Whitelist trường GIỮ (Bắt buộc):
- **Áo ngũ thân tay chẽn:**
  - Cấu trúc năm thân.
  - Có thân thứ năm phía trong phần trước.
  - Cổ đứng/lập lĩnh.
  - Tay thu về cổ tay.
  - Phom truyền thống không bodycon mạnh.
- **Áo tứ thân:**
  - Cấu trúc bốn thân.
  - Hai phần phía sau ghép dọc sống lưng.
  - Hai vạt trước riêng/mở.
- **Áo tấc:**
  - Cấu trúc năm thân.
  - Tay rộng/thụng.
  *(Lưu ý: Không đưa "cổ đứng/lập lĩnh" vào GIỮ của Áo tấc).*

### Nguyên tắc văn hóa cốt lõi:
- Màu sắc, chất liệu, phụ kiện và cách phối là **gợi ý tạo hình (styling recommendation)**, không phải sự thật lịch sử hay quy chuẩn bắt buộc của người xưa.
- Tuyệt đối không đưa màu sắc, chất liệu, phụ kiện hoặc tính từ (duyên dáng, thanh lịch, uy nghiêm, v.v.) vào mục GIỮ.
- Không dùng ngôn ngữ phán xét hay quy chụp *"phối sai Việt phục"*.

## 8. Visual Direction
- **Phong cách đã khóa:** Contemporary Vietnamese Minimalism kết hợp Premium Aurora Minimalism.
- **Màu sắc:** Nền sáng/gần trắng (`#FBFBFA`, `#FFFFFF`), viền mảnh tinh tế (`#E9E6E1`). Điểm nhấn lacquer red (`#8E3028`), moss green (`#355C4A`), champagne (`#C6A56B`).
- **Typography:** Ưu tiên font Be Vietnam Pro, phân cấp thị giác rõ ràng, nhiều khoảng thở.
- **Nguyên tắc:** Giữ nguyên cấu trúc giao diện đã duyệt; không tự ý redesign, không dùng gradient sặc sỡ hay họa tiết rườm rà.

## 9. Development Rules
- **Quy trình làm việc:**
  Task → đọc context/code → phân tích → plan → user approve → implementation → test → review → commit.
- **Nguyên tắc kỹ thuật:**
  - Sửa đúng phạm vi yêu cầu, không refactor lan man.
  - Không tự ý cài dependency mới nếu không được yêu cầu.
  - Tuyệt đối không để lộ API key hay secret ra frontend hoặc commit lên Git.
  - Không hiển thị debug UI, error stack trace hay tên model trong production UI.
  - Không dùng mock data để giả lập kết quả Gemini.
  - Các phần đã được đánh dấu DONE được coi là stable baseline. Không redesign hoặc refactor chúng nếu task hiện tại không yêu cầu trực tiếp.

## 10. Git & Checkpoints
- Mã nguồn được quản lý trên GitHub repository.
- Chỉ đề xuất commit checkpoint khi tính năng đã chạy ổn định, đã qua kiểm thử và không có regression.
- Không commit file `.env` chứa secret. Chỉ commit `.env.example` với giá trị placeholder.

## 11. Current Status

### DONE

- **Giai đoạn 1 — Foundation:** React/TypeScript frontend, Express backend, environment & secret handling, project structure.
- **Giai đoạn 2 — Homepage & Input UI:** Header, Hero, About, Garments, Input Form và visual direction.
- **Giai đoạn 3 — Gemini Recommendation:** Gemini server-side, structured output, Result UI, bảng màu, phụ kiện và GIỮ / REMIX / LƯU Ý.
- **Giai đoạn 4 — Refinement Flow:** “Truyền thống hơn”, “Biến tấu thêm”, “Thử phương án khác”, loading/error handling và server-side whitelist validation cho GIỮ.

### NEXT

- Thay placeholder bằng hình ảnh Việt phục đã được kiểm tra.
- Responsive QA.
- Functional & edge-case testing.
- Code/security review.
- Final Git checkpoint.
- Publish và kiểm tra public URL.
- Chuẩn bị submission.

### OUT OF SCOPE

- Login / authentication.
- User database.
- Social feed.
- Shopping/cart.
- Weather.
- AI image generation.
- Upload ảnh người dùng.

## 12. Instructions for Future AI Tasks

Trước mỗi task:

1. Đọc `PROJECT_CONTEXT.md`.
2. Đọc các file/module trực tiếp liên quan đến task.
3. Xác định current behavior và expected behavior.
4. Không sửa ngoài phạm vi task.
5. Nếu task ảnh hưởng nhiều module hoặc kiến trúc, phân tích và trình bày implementation plan trước; chờ người dùng phê duyệt rồi mới code.
6. Sau implementation, chạy test phù hợp.
7. Review regression, security và scope trước khi coi task hoàn thành.
8. Chỉ đề xuất Git commit khi phiên bản đang chạy ổn định.

## 13. Visual Generation Reference

Mọi task liên quan tới:
- image prompt generation
- visual preview
- external AI image tools
- image reference
- future image generation API
- future user-photo visualization

phải đọc:

`docs/VISUAL_GENERATION_GUIDE.md`

trước khi sửa code.
