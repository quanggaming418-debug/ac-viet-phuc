# AC — Visual Generation Guide

## 1. Mục tiêu của tài liệu

Tài liệu này là nguồn quy chuẩn cho tất cả task liên quan đến:

- image prompt generation
- visual preview
- external AI image tools
- image reference
- future image generation API
- future user-photo visualization
- đánh giá chất lượng hình ảnh AI
- tinh chỉnh logic `buildImagePrompt()`

Mục tiêu của visual system trong AC không phải là tạo hình ảnh đẹp bằng mọi giá.

Mục tiêu là giúp người dùng:
- hình dung bản phối Việt phục rõ hơn;
- hiểu được phần nào của trang phục đang được giữ;
- nhìn thấy phần nào đang được biến tấu;
- có thể mang prompt sang công cụ tạo ảnh để tạo visualization;
- giảm nguy cơ AI tạo ảnh làm mất nhận diện của trang phục.

Ảnh được tạo bởi AI chỉ là hình ảnh minh họa / visualization.

Không được coi ảnh AI là:
- bằng chứng lịch sử;
- phục dựng chính xác tuyệt đối;
- bản thiết kế kỹ thuật để may đo;
- xác nhận rằng toàn bộ cấu trúc bên trong trang phục đã đúng.

---

# 2. Nguyên tắc nền tảng

## 2.1. Nguồn dữ liệu được phép sử dụng

Image prompt chỉ được tạo từ dữ liệu thật đang tồn tại trong AC, ví dụ:

- `garmentType`
- `conceptName`
- `summary`
- `colorPalette`
- `accessories`
- `suitableOccasions`
- `whyItFits`
- `giu`
- `remix`
- `luuY`
- `occasion`
- `style`
- `modernityLevel`

Không tự thêm dữ liệu ngoài recommendation hoặc PROJECT_CONTEXT.md.

---

## 2.2. GIỮ là nguồn chính cho nhận diện trang phục

Các đặc điểm nhận diện cốt lõi trong prompt phải lấy từ:

- `recommendation.giu`
- whitelist đã được khóa trong `PROJECT_CONTEXT.md`

Không được tự suy diễn thêm historical fact.

Không được tự thêm:
- cấu trúc khuy;
- quy tắc mặc;
- chất liệu truyền thống;
- ý nghĩa màu;
- ý nghĩa hoa văn;
- phụ kiện bắt buộc;
- nghi thức sử dụng;
- chi tiết lịch sử chưa được xác minh.

---

## 2.3. Styling không phải historical fact

Các yếu tố sau chỉ là định hướng tạo hình:

- màu sắc;
- phụ kiện;
- chất liệu bề mặt;
- hoa văn;
- cách phối;
- độ hiện đại;
- concept;
- mood;
- visual styling.

Không được trình bày các yếu tố này như một quy tắc truyền thống hoặc sự thật lịch sử.

---

# 3. Cấu trúc chuẩn của image prompt

Prompt sinh ra phải ưu tiên cấu trúc sau:

1. Hình ảnh cần tạo
2. Đặc điểm nhận diện cốt lõi cần giữ (phân định rõ: đặc điểm cần thể hiện rõ trong hình ảnh & đặc điểm cấu trúc cần tôn trọng)
3. Phong cách và mức độ hiện đại (chỉ dẫn tạo hình styling, không phải thước đo lịch sử)
4. Bảng màu và cách phân bổ màu
5. Phụ kiện / vật phẩm được phép xuất hiện (Allowed visual items model)
6. Yêu cầu người mẫu và bố cục (Bắt buộc toàn thân)
7. Cảm nhận chất liệu bề mặt (Trung tính, không bịa lịch sử)
8. Những điều cần tránh (Negative prompt chuyên biệt theo từng dáng phục)

Không tự thay đổi cấu trúc này nếu task hiện tại không yêu cầu.

Prompt phải:
- viết chủ yếu bằng tiếng Việt tự nhiên;
- chỉ giữ thuật ngữ tiếng Anh khi giúp model hiểu chính xác hơn;
- không lặp lại cùng một ý quá nhiều lần;
- không tự mâu thuẫn.

Các thuật ngữ tiếng Anh có thể giữ khi cần:
- full-body
- realistic fashion visualization
- editorial fashion photography
- silhouette
- clean studio background
- soft diffused lighting
- bodycon
- qipao / cheongsam
- hanfu
- fantasy costume
- stage costume
- oversized fantasy sleeves

---

# 4. Quy tắc riêng theo từng loại Việt phục

### Phân loại GIỮ cho mục đích visual prompt
Để tránh kỳ vọng phi thực tế rằng mọi chi tiết cấu tạo bên trong đều phải nhìn thấy từ một góc chụp thời trang đơn diện, prompt phân biệt rõ:
- **Đặc điểm cần thể hiện rõ trong hình ảnh (Visually observable):** Các yếu tố ngoại diện có thể nhìn thấy từ ảnh toàn thân phía trước.
- **Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (Structural):** Các yếu tố cấu trúc bên trong/phía sau cần được model tôn trọng trong tỷ lệ và cấu tạo tổng thể, nhưng không yêu cầu tạo chi tiết giả hay góc nhìn phi tự nhiên (cutaway/x-ray).

### Nguyên tắc style-neutral cho garment guidance
Chỉ dẫn thị giác theo từng dáng phục phải trung tính về mặt thẩm mỹ (style-neutral). Tuyệt đối không hard-code các tính từ phong cách như “mộc mạc”, “nữ tính”, “cổ điển”, “thanh lịch” vào phần mô tả trang phục vì sẽ xung đột với các concept cá tính hoặc hiện đại mạnh. Phong cách thẩm mỹ thuộc về `style`, `modernityLevel` và `conceptName`.

## 4.1. Áo ngũ thân tay chẽn

### Core GIỮ & Phân loại thị giác
- **Đặc điểm cần thể hiện rõ trong hình ảnh:**
  - Cổ đứng/lập lĩnh
  - Tay thu về cổ tay
  - Phom truyền thống không bodycon mạnh
- **Đặc điểm cấu trúc cần được tôn trọng trong thiết kế:**
  - Cấu trúc năm thân
  - Có thân thứ năm phía trong phần trước

### Visual direction (Style-neutral)
- Cổ đứng/lập lĩnh cần nhìn rõ ràng, thẳng thớm;
- Tay áo thu gọn dần và ôm vừa vặn về phía cổ tay (không loe, không fantasy);
- Silhouette trang phục buông tự nhiên theo phom truyền thống, tuyệt đối không ôm sát chiết eo kiểu áo dài hiện đại (bodycon fit).

Không tự thêm:
- quy tắc khuy;
- thứ tự cài;
- vật liệu lịch sử;
- phụ kiện truyền thống nếu recommendation không có.

### Avoid list tối thiểu
- không biến thành áo dài hiện đại ôm sát;
- không biến thành qipao / cheongsam;
- không biến thành hanfu;
- không biến thành fantasy costume / stage costume;
- không làm tay áo quá rộng kiểu fantasy;
- không làm tay áo mất đặc điểm thu về cổ tay.

---

## 4.2. Áo tứ thân

### Core GIỮ & Phân loại thị giác
- **Đặc điểm cần thể hiện rõ trong hình ảnh:**
  - Hai vạt trước riêng/mở
- **Đặc điểm cấu trúc cần được tôn trọng trong thiết kế:**
  - Cấu trúc bốn thân
  - Hai phần phía sau ghép dọc sống lưng

### Visual direction (Style-neutral)
- Hai vạt trước phải nhìn thấy rõ ràng là tách rời và mở tự nhiên;
- Silhouette cần thể hiện rõ các lớp phối (layering) và không để cách styling che khuất nhận diện hai vạt trước riêng/mở;
- Không may đóng kín phần trước làm mất nhận diện hai vạt trước.

### Nguyên tắc quan trọng
Áo tứ thân không được đồng nhất với Quan họ.
Không mặc định: nón quai thao, yếm, khăn mỏ quạ, phụ kiện Quan họ, bối cảnh Quan họ nếu recommendation không có.

### Avoid list tối thiểu
- không biến thành áo dài hiện đại;
- không biến thành hanfu;
- không biến thành fantasy costume;
- không làm mất hai vạt trước riêng/mở;
- không tự thêm phụ kiện Quan họ.

---

## 4.3. Áo tấc

### Core GIỮ & Phân loại thị giác
- **Đặc điểm cần thể hiện rõ trong hình ảnh:**
  - Tay rộng/thụng
- **Đặc điểm cấu trúc cần được tôn trọng trong thiết kế:**
  - Cấu trúc năm thân

*(Lưu ý: Không tự thêm “cổ đứng/lập lĩnh” vào GIỮ nếu recommendation không có).*

### Visual direction (Style-neutral)
Tay rộng/thụng phải là đặc điểm thị giác nhận thấy rõ ràng ngay khi nhìn toàn thân:
- tay phải rộng rõ hơn tay áo dài hiện đại thông thường;
- không được thu hẹp đến mức mất nhận diện tay thụng;
- vẫn phải cân đối với vóc dáng người mẫu;
- không được phóng đại thành tay cánh dơi hoặc oversized fantasy sleeves.
Silhouette: dài, thanh thoát, dễ quan sát toàn thân.
Bề mặt: sạch, tiết chế, hạn chế tối đa hoa văn dày đặc, tránh cảm giác phục trang tuồng cổ hoặc costume sân khấu.

### Avoid list tối thiểu
- không biến thành áo dài hiện đại bodycon;
- không biến thành qipao / cheongsam;
- không biến thành hanfu;
- không biến thành fantasy costume / stage costume;
- không thu hẹp tay áo làm mất tay thụng;
- không phóng đại tay thành cánh dơi;
- không phủ trang trí dày đặc;
- không để màu phụ lấn át màu chính.

---

# 5. Quy tắc theo modernityLevel

`modernityLevel` chỉ là chỉ báo về mức độ biến tấu trong styling, định hướng cách phối đương đại.

Tuyệt đối KHÔNG phải:
- authenticity score (điểm xác thực)
- historical accuracy score (điểm chính xác lịch sử)
- cultural correctness score (điểm chuẩn mực văn hóa)

Tuyệt đối không dùng các từ ngữ áp đặt như: “chuẩn mực”, “chuẩn nhất”, “đúng chuẩn”, “nguyên bản tuyệt đối”, “phục dựng” hay “xác thực lịch sử”.

## 0–20: Rất gần truyền thống
Định hướng:
- tổng thể tiết chế, hạn chế tối đa các biến tấu styling mạnh và giữ rõ các đặc điểm GIỮ cùng silhouette đã mô tả;
- ưu tiên bề mặt vải trơn hoặc rất ít hoa văn trang trí;
- không dùng phụ kiện mang cảm giác hiện đại phá cách;
- không tạo cảm giác fashion-forward quá mức.

## 21–40: Truyền thống chiếm ưu thế
Định hướng:
- giữ vững nhận diện trang phục cốt lõi;
- có thể thay đổi nhẹ ở sắc thái màu hoặc phụ kiện tinh giản;
- mức độ hiện đại ở mức thấp và chừng mực.

## 41–60: Cân bằng
Định hướng:
- cân bằng giữa GIỮ và REMIX;
- màu sắc và phụ kiện có thể trẻ trung, thanh lịch hơn;
- form cốt lõi không thay đổi.

## 61–80: Hiện đại rõ
Định hướng:
- hiện đại hóa rõ nét ở bảng màu, phụ kiện, tinh thần styling trẻ trung, phóng khoáng;
- vẫn bảo toàn toàn bộ GIỮ.

## 81–100: Hiện đại mạnh
Định hướng:
- cho phép sáng tạo nổi bật về bảng màu, phụ kiện đương đại, concept và thần thái thời trang cá tính;
- không thay đổi GIỮ;
- không phá silhouette cốt lõi;
- không biến garment thành loại trang phục khác.

---

# 6. Quy tắc bảng màu

Nếu recommendation có 3 màu:

## Màu 1
Là màu chủ đạo. Phải chiếm phần lớn diện tích trang phục (áo chính).

## Màu 2
Là màu phụ. Chỉ xuất hiện hỗ trợ ở lớp lót, đường viền, hoặc mảng phối thứ cấp có kiểm soát.

## Màu 3
Là màu điểm nhấn. Dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện). Tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

---

# 7. Phụ kiện và vật phẩm được phép (Allowed Visual Items Model)

Trong phiên bản hiện tại, schema của AC chỉ có một trường dữ liệu duy nhất là `recommendation.accessories` và chưa có trường `props` riêng.

Vì vậy:
- Image prompt KHÔNG tự phân loại các món đồ thành “wearable accessory” (mặc trên người) hay “handheld prop” (vật cầm tay) dựa trên từ khóa hay suy diễn ngữ nghĩa (dễ dẫn tới mâu thuẫn như: Quạt giấy hay Túi cói được phép nhưng lại bị ghi "Đạo cụ cầm tay: none").
- Toàn bộ các món do `recommendation.accessories` cung cấp được coi chung là **Allowed Visual Items (Phụ kiện / vật phẩm được phép xuất hiện)**.

## Nguyên tắc:
1. `ALLOWED ITEMS = recommendation.accessories`
2. `EVERYTHING ELSE = Do not invent.`

## Cách diễn đạt trong prompt:
- Nếu có accessories:
  `Phụ kiện / vật phẩm được phép xuất hiện: [danh sách accessories].`
  `Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.`
- Nếu accessories rỗng:
  `Phụ kiện / vật phẩm được phép xuất hiện: Không có phụ kiện / vật phẩm bổ sung được yêu cầu.`
  `Tuyệt đối không tự thêm phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào ngoài trang phục chính.`

Quy tắc này loại bỏ hoàn toàn hệ thống classifier từ khóa phức tạp và triệt tiêu 100% nguy cơ tự mâu thuẫn.

---

# 8. Quy tắc full-body

Nếu prompt yêu cầu full-body:

Phải ghi đủ:

- hiển thị trọn vẹn từ đầu tới chân;
- nhìn rõ hai bàn chân / giày;
- không crop mất tay;
- không crop mất chân;
- không crop dưới gối;
- không ảnh bán thân;
- người mẫu đứng trong khung hình đủ xa;
- silhouette phải dễ đọc.

Không chỉ ghi một từ “full-body” rồi coi như đủ.

---

# 9. Người mẫu và bố cục

Ưu tiên:
- người mẫu trẻ;
- tư thế tự nhiên;
- tỷ lệ cơ thể tự nhiên;
- nền sạch;
- ánh sáng mềm;
- không để tóc che phom áo;
- không để tay hoặc phụ kiện che cấu trúc chính.

Visual direction:
- realistic fashion visualization;
- editorial fashion photography;
- clean studio background;
- soft diffused lighting.

Không thêm nhiều đạo cụ nền.

---

# 10. Chất liệu bề mặt

Nếu recommendation không chỉ định material:

Không tự thêm:
- lụa;
- gấm;
- tơ tằm;
- nhung;
- chất liệu lịch sử.

Chỉ mô tả trung tính:

- bề mặt vải tự nhiên;
- có độ rủ hợp lý;
- có độ đứng phom hợp lý;
- không bóng nhựa;
- có cảm giác wearable.

---

# 11. Quy tắc tránh historical hallucination

Không được tự viết:

- “theo truyền thống người xưa...”
- “màu này tượng trưng cho...”
- “phụ kiện này vốn được dùng để...”
- “đây là cách mặc chuẩn...”

nếu PROJECT_CONTEXT.md không xác nhận.

Prompt generator chỉ làm:
- visual instruction
- styling instruction
- garment preservation instruction

Không làm:
- historical interpretation
- cultural certification

---

# 12. Bộ test prompt bắt buộc

Mỗi lần sửa `buildImagePrompt.ts`, phải test ít nhất các case sau.

## Test A — Áo tấc truyền thống

- garmentType: Áo tấc
- modernityLevel: 0–10
- style: Trang trọng
- occasion: Lễ hội / sự kiện văn hóa

Kiểm tra:
- tay thụng rõ;
- không fantasy;
- không hanfu;
- không quá fashion-forward;
- phụ kiện không tự mâu thuẫn.

## Test B — Áo tấc cân bằng

- modernityLevel: 50
- style: Thanh lịch
- occasion: Chụp ảnh

Kiểm tra:
- form vẫn rõ;
- styling hiện đại vừa phải.

## Test C — Áo tấc hiện đại

- modernityLevel: 90–100
- style: Cá tính
- occasion: Kỷ yếu / tốt nghiệp

Kiểm tra:
- hiện đại ở màu/phụ kiện;
- không phá GIỮ.

## Test D — Ngũ thân tay chẽn

- modernityLevel: 50–80

Kiểm tra:
- cổ đứng;
- tay thu cổ tay;
- không bodycon.

## Test E — Tứ thân

- modernityLevel: 40–70

Kiểm tra:
- hai vạt trước riêng/mở;
- không tự thêm Quan họ.

---

# 13. Phân biệt kiểm thử: PROMPT-LEVEL PASS vs IMAGE-LEVEL PASS

Quy trình QA thị giác phân biệt rạch ròi 2 cấp độ kiểm thử:

### PROMPT-LEVEL PASS (Cấp độ sinh Prompt)
Đánh giá tính đúng đắn logic của văn bản prompt sinh ra từ `buildImagePrompt()`:
- Đủ các thành phần theo cấu trúc chuẩn.
- Phân biệt rõ đặc điểm nhận diện cần thể hiện (observable) và đặc điểm cấu trúc cần tôn trọng (structural).
- Không tự bịa historical fact; không dùng từ ngữ áp đặt tính chính xác lịch sử ("chuẩn mực", "phục dựng").
- Allowed visual items lấy 100% từ `recommendation.accessories`, triệt tiêu hoàn toàn mâu thuẫn phụ kiện/đạo cụ.
- Modernity level nằm đúng dải ngữ nghĩa styling và không phá vỡ GIỮ.
- Full-body có đủ các ràng buộc thị giác chặt chẽ.
- Không tự Quan họ hóa Áo tứ thân; không tự thêm cổ đứng cho Áo tấc.
- Garment visual guidance hoàn toàn trung tính về phong cách (style-neutral).

*Lưu ý:* Việc prompt-level đạt PASS chỉ xác nhận rằng **văn bản chỉ dẫn cho AI đã chuẩn xác và không mâu thuẫn**, KHÔNG đồng nghĩa với việc hình ảnh do AI vẽ ra chắc chắn đúng 100%.

### IMAGE-LEVEL PASS (Cấp độ hình ảnh tạo ra)
Chỉ được đánh giá sau khi người dùng hoặc tester sao chép prompt và đưa vào mô hình AI tạo ảnh thực tế (Gemini, ChatGPT) và kiểm tra file ảnh kết quả theo Checklist mục 14.

---

# 14. Checklist đánh giá ảnh AI

Sau khi prompt được test trên Gemini / ChatGPT Image, đánh giá:

- [ ] Full-body thật
- [ ] Nhìn rõ chân / giày
- [ ] GIỮ chính còn nhìn thấy
- [ ] Silhouette rõ
- [ ] Không thành áo dài hiện đại
- [ ] Không thành hanfu
- [ ] Không thành qipao
- [ ] Không thành fantasy costume
- [ ] Không tự thêm phụ kiện
- [ ] Không tự thêm đạo cụ
- [ ] Màu chính chiếm ưu thế
- [ ] Màu phụ đúng vai trò
- [ ] Concept đúng
- [ ] Ảnh wearable, không quá sân khấu

Không dùng tiêu chí “đẹp” làm tiêu chí duy nhất.

---

# 15. Cách đánh giá Gemini và ChatGPT

Có thể chấm từng ảnh trên thang 10 theo các nhóm:

- Nhận diện garment
- Bám prompt
- Giữ silhouette
- Bám bảng màu
- Phụ kiện
- Đạo cụ
- Full-body
- Tính thẩm mỹ
- Tính ứng dụng

Không kết luận provider nào tốt hơn chỉ từ 1 ảnh.

Nên test ít nhất 3 ảnh / case nếu cần so sánh nghiêm túc.

---

# 16. Quy trình bắt buộc khi coding agent sửa visual system

Mỗi task liên quan đến visual generation phải theo thứ tự:

1. Đọc `PROJECT_CONTEXT.md`.
2. Đọc `docs/VISUAL_GENERATION_GUIDE.md`.
3. Đọc file code hiện tại liên quan.
4. Audit current behavior.
5. Chỉ ra inconsistency / bug trước khi sửa.
6. Lập plan ngắn theo file.
7. Implement.
8. Generate prompt test cases.
9. Tự audit prompt bằng checklist.
10. Chạy type check.
11. Chạy build.
12. Báo cáo kết quả.
13. Không commit nếu user chưa yêu cầu.

---

# 17. Quy tắc báo cáo kết quả

Không được chỉ báo:

“Đã sửa thành công.”

Bắt buộc phải báo:

- Files đã sửa
- Files đã thêm / xóa
- Logic đã thay đổi
- Prompt test output
- Các lỗi logic đã loại bỏ
- Checklist audit
- Type check
- Build result
- Phần nào vẫn còn giới hạn

Nếu output ảnh chưa được test:
phải nói rõ.

Không được tuyên bố:
“Ảnh sẽ chính xác hơn”
nếu chưa test thực tế.

---

# 18. Trạng thái hiện tại của visual workflow

AC hỗ trợ quy trình tạo ảnh trực tiếp:

Recommendation
→ `buildImagePrompt()`
→ Gửi prompt trực tiếp tới EvoLink Image Generation API qua server-side proxy (`POST /api/generate-image`)
→ Server theo dõi task (`GET /v1/tasks/{task_id}`)
→ Hiển thị ảnh thời trang thật trực tiếp trên giao diện website
→ Cho phép tải ảnh về, tạo lại hoặc mở xem prompt chi tiết đã dùng.

Hiện tại chưa có:
- virtual try-on production;
- user-photo visualization production;
- Blender / 3D engine;
- automatic image validation.

---

# 19. Quy tắc đối với external AI tools

Hiện tại AC chỉ hỗ trợ mở nhanh:

- Gemini
- ChatGPT

Không thêm Midjourney nếu chưa có yêu cầu mới.

Khi bấm công cụ:
- copy prompt;
- mở tool ở tab mới;
- giữ tab AC;
- không giả vờ tự động paste prompt sang website khác.

---

# 20. Quy tắc thay đổi tài liệu

Nếu thay đổi:
- cultural guardrails;
- prompt architecture;
- modernity mapping;
- QA criteria;

phải cập nhật file này.

Nếu chỉ:
- sửa typo;
- spacing;
- icon;
- UI nhỏ không ảnh hưởng logic;

không cần cập nhật file.

---

# 21. Definition of Done

Một task visual generation chỉ được coi là DONE khi:

- code đúng scope;
- không vi phạm PROJECT_CONTEXT.md;
- không vi phạm file này;
- prompt sample đã được generate;
- prompt sample đã được audit;
- không có contradiction;
- type check pass;
- build pass;
- user chưa yêu cầu thêm test ảnh ngoài hệ thống;
- báo cáo cuối cùng đầy đủ.

Nếu một trong các điều kiện trên fail:
task chưa DONE.