# AC — Trợ lý phối Việt phục đương đại

AC là trợ lý AI hỗ trợ người trẻ tìm hiểu và định hình bản phối Việt phục theo dịp sử dụng, phong cách cá nhân và mức độ truyền thống / hiện đại mong muốn.

Ứng dụng hướng đến trải nghiệm **Contemporary Vietnamese Minimalism** kết hợp **Premium Aurora Minimalism**: giao diện sáng, tối giản, nhiều khoảng thở và sử dụng các lớp màu ambient gradient nhẹ để tạo cảm giác hiện đại nhưng vẫn giữ sự tập trung vào Việt phục.

AC không nhằm chấm điểm “đúng / sai Việt phục”. Mục tiêu của sản phẩm là giúp người dùng hiểu những đặc điểm nhận diện đang được giữ lại, những phần đang được biến tấu và các yếu tố nên cân nhắc theo bối cảnh sử dụng.

## Tính năng MVP

### Tiếp nhận nhu cầu bằng ngôn ngữ tự nhiên

Người dùng có thể mô tả trực tiếp nhu cầu bằng tiếng Việt, ví dụ:

> “Tết này mình muốn chụp ảnh, thích màu sáng, trẻ trung nhưng vẫn muốn giữ khá rõ nét truyền thống.”

Ngoài ra AC cung cấp các lựa chọn nhanh:

- Dịp: Tết, Chụp ảnh, Kỷ yếu / tốt nghiệp, Lễ hội / sự kiện văn hóa, Đám cưới / lễ nghi, Khác.
- Phong cách: Nhẹ nhàng, Thanh lịch, Trẻ trung, Trang trọng, Cá tính.
- Thanh trượt: **Truyền thống hơn ←→ Hiện đại hơn**.

### Hiện hỗ trợ 3 dáng Việt phục

**Áo ngũ thân tay chẽn**
- Cấu trúc năm thân.
- Có thân thứ năm phía trong phần trước.
- Cổ đứng / lập lĩnh.
- Tay thu về cổ tay.

**Áo tứ thân**
- Cấu trúc bốn thân.
- Hai phần phía sau ghép dọc sống lưng.
- Hai vạt trước riêng / mở.

**Áo tấc**
- Thuộc hệ cấu trúc năm thân.
- Đặc điểm nổi bật là tay rộng / thụng.
- Gắn mạnh hơn với các bối cảnh trang trọng và lễ nghi.

### Gemini AI

Gemini phân tích đồng thời:

- mô tả tự nhiên của người dùng;
- dịp sử dụng;
- phong cách;
- mức độ truyền thống / hiện đại.

Sau đó AC tạo một bản phối phù hợp với nhu cầu và trả kết quả dưới dạng structured output để frontend hiển thị ổn định.

Kết quả gồm:

- loại Việt phục được đề xuất;
- tên concept;
- lý do lựa chọn;
- bảng màu 3 sắc thái kèm mã HEX;
- phụ kiện gợi ý;
- bối cảnh phù hợp.

### GIỮ / REMIX / LƯU Ý

**GIỮ**  
Những đặc điểm nhận diện cốt lõi của trang phục đang được bảo toàn.

**REMIX**  
Những yếu tố được biến tấu theo phong cách cá nhân và đời sống đương đại.

**LƯU Ý**  
Những điểm nên cân nhắc dựa trên mục tiêu và bối cảnh sử dụng.

AC tránh các phán xét như “phối sai Việt phục” và không biến styling recommendation thành sự thật lịch sử.

### Nguyên tắc kỹ thuật

- Không sử dụng mock recommendation để giả lập kết quả Gemini.
- Nếu Gemini hoặc mạng gặp lỗi, ứng dụng hiển thị thông báo lỗi và cho phép thử lại.
- Gemini API Key chỉ được sử dụng phía server.
- Không đưa API Key vào frontend.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- **Backend:** Express, Node.js
- **AI SDK:** `@google/genai`
- **AI Model:** `gemini-3.8-flash`
- **Build Tool:** Vite, tsx

## Cấu trúc project

```text
├── server.ts
├── src/
│   ├── components/
│   │   ├── AuroraBackground.tsx
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── GarmentsSection.tsx
│   │   ├── InputSection.tsx
│   │   ├── ResultSection.tsx
│   │   └── Footer.tsx
│   ├── types/
│   │   └── recommendation.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── metadata.json
├── package.json
├── .env.example
└── README.md
```

## Cài đặt và chạy local

### 1. Yêu cầu

- Node.js >= 18
- npm

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Thêm Gemini API Key:

```env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

Mở:

```text
http://localhost:3000
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | Có | API key dùng ở backend để gọi Gemini |
| `APP_URL` | Tùy môi trường | URL ứng dụng khi triển khai |

## Bảo mật

Không commit file `.env` hoặc bất kỳ API key thật nào lên GitHub.

`.gitignore` đã được cấu hình để bỏ qua các file môi trường, trong khi `.env.example` chỉ chứa placeholder để hướng dẫn cấu hình.
