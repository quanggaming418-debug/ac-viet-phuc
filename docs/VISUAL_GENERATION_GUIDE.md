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
2. Đặc điểm nhận diện cần giữ
3. Phong cách và mức độ hiện đại
4. Bảng màu và cách phân bổ màu
5. Phụ kiện được phép
6. Đạo cụ / vật cầm tay
7. Người mẫu và bố cục
8. Chất liệu / cảm giác bề mặt
9. Những điều cần tránh

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

## 4.1. Áo ngũ thân tay chẽn

### Core GIỮ

Chỉ được sử dụng các đặc điểm sau nếu chúng xuất hiện trong recommendation / whitelist:

- Cấu trúc năm thân
- Có thân thứ năm phía trong phần trước
- Cổ đứng/lập lĩnh
- Tay thu về cổ tay
- Phom truyền thống không bodycon mạnh

### Visual direction

Prompt có thể diễn đạt trực quan:

- cổ đứng phải nhìn rõ;
- tay thu dần về cổ tay;
- silhouette không bó sát cơ thể;
- trang phục không được biến thành modern bodycon áo dài;
- ưu tiên nhìn rõ toàn bộ form.

Không tự thêm:
- quy tắc khuy;
- thứ tự cài;
- vật liệu lịch sử;
- phụ kiện truyền thống nếu recommendation không có.

### Avoid list tối thiểu

Có thể dùng:

- không biến thành áo dài hiện đại ôm sát;
- không biến thành qipao / cheongsam;
- không biến thành hanfu;
- không biến thành fantasy costume / stage costume;
- không làm tay áo quá rộng kiểu fantasy;
- không làm tay áo mất đặc điểm thu về cổ tay.

---

## 4.2. Áo tứ thân

### Core GIỮ

- Cấu trúc bốn thân
- Hai phần phía sau ghép dọc sống lưng
- Hai vạt trước riêng/mở

### Visual direction

Prompt có thể diễn đạt:

- hai vạt trước phải nhìn thấy rõ là tách rời / mở;
- silhouette cần giúp người xem nhận ra cấu trúc layering;
- không biến thành áo dài hiện đại;
- không đóng kín phần trước nếu điều đó làm mất nhận diện hai vạt trước.

### Nguyên tắc quan trọng

Áo tứ thân không được đồng nhất với Quan họ.

Không mặc định:
- nón quai thao;
- yếm;
- khăn mỏ quạ;
- phụ kiện Quan họ;
- bối cảnh Quan họ

nếu recommendation không có.

### Avoid list tối thiểu

- không biến thành áo dài hiện đại;
- không biến thành hanfu;
- không biến thành fantasy costume;
- không làm mất hai vạt trước riêng/mở;
- không tự thêm phụ kiện Quan họ.

---

## 4.3. Áo tấc

### Core GIỮ

- Cấu trúc năm thân
- Tay rộng/thụng

Không tự thêm “cổ đứng/lập lĩnh” vào GIỮ nếu recommendation không có.

### Visual direction

Tay rộng/thụng phải là đặc điểm thị giác rõ ràng.

Prompt phải truyền đạt được cả ngưỡng dưới và ngưỡng trên:

- tay phải rộng rõ hơn tay áo dài hiện đại;
- không được thu hẹp đến mức mất nhận diện;
- vẫn phải cân đối với vóc dáng người mẫu;
- không được phóng đại thành tay cánh dơi;
- không được biến thành oversized fantasy sleeves.

Silhouette:
- dài;
- rõ;
- thanh thoát;
- dễ quan sát toàn thân.

Bề mặt:
- sạch;
- tiết chế;
- không phủ hoa văn dày đặc nếu recommendation không yêu cầu.

### Avoid list tối thiểu

- không biến thành áo dài hiện đại bodycon;
- không biến thành qipao / cheongsam;
- không biến thành hanfu;
- không biến thành fantasy costume;
- không biến thành stage costume;
- không thu hẹp tay áo làm mất tay thụng;
- không phóng đại tay thành cánh dơi;
- không phủ trang trí dày đặc;
- không để màu phụ lấn át màu chính.

---

# 5. Quy tắc theo modernityLevel

`modernityLevel` chỉ là chỉ báo về mức độ biến tấu trong styling.

Không phải thang đo lịch sử.

## 0–20: Rất gần truyền thống

Định hướng:
- tổng thể tiết chế;
- hạn chế biến tấu mạnh;
- ưu tiên form rõ;
- ít phụ kiện hiện đại;
- ít hoa văn;
- không fashion-forward quá mức.

## 21–40: Truyền thống chiếm ưu thế

Định hướng:
- giữ nhận diện mạnh;
- có thể thay đổi nhẹ màu hoặc phụ kiện;
- styling hiện đại ở mức thấp.

## 41–60: Cân bằng

Định hướng:
- cân bằng giữa GIỮ và REMIX;
- màu sắc và phụ kiện có thể hiện đại hơn;
- form cốt lõi không thay đổi.

## 61–80: Hiện đại rõ

Định hướng:
- hiện đại hóa mạnh hơn ở palette, phụ kiện, styling;
- vẫn giữ toàn bộ GIỮ.

## 81–100: Hiện đại mạnh

Định hướng:
- cho phép sáng tạo mạnh ở:
  - màu;
  - phụ kiện;
  - mood;
  - cách phối;
  - concept;

nhưng:
- không thay đổi GIỮ;
- không phá silhouette cốt lõi;
- không biến garment thành loại trang phục khác.

---

# 6. Quy tắc bảng màu

Nếu recommendation có 3 màu:

## Màu 1
Là màu chủ đạo.

Phải chiếm phần lớn diện tích trang phục.

## Màu 2
Là màu phụ.

Chỉ dùng ở:
- lớp phụ;
- viền;
- phần lót;
- mảng nhỏ có kiểm soát.

## Màu 3
Là màu điểm nhấn.

Dùng với tỷ lệ nhỏ.

Không được:
- lấn át màu chính;
- khiến toàn bộ trang phục đổi thành màu này;
- biến chất liệu thành ánh kim toàn thân nếu màu 3 là metallic.

Prompt phải mô tả rõ vai trò từng màu.

---

# 7. Phụ kiện và đạo cụ

## 7.1. Phụ kiện

Accessory chỉ được lấy từ:

`recommendation.accessories`

Không tự thêm:
- khăn;
- mũ;
- trâm;
- quạt;
- túi;
- giày;
- trang sức;
- hoa;
- đạo cụ chụp ảnh

nếu không có trong recommendation.

---

## 7.2. Đạo cụ

Phụ kiện và đạo cụ là hai nhóm khác nhau.

### Phụ kiện
Là những thứ mặc / đeo / đi cùng trang phục.

Ví dụ:
- kính
- giày
- túi
- khăn đóng
- trâm

### Đạo cụ
Là vật cầm tay hoặc vật dùng cho bối cảnh chụp ảnh.

Ví dụ:
- bằng tốt nghiệp
- mũ cử nhân
- bó hoa
- sách
- quạt cầm tay
- bảng
- ghế
- props trang trí

Nếu prompt không yêu cầu đạo cụ:

`Props allowed: none`

---

## 7.3. Quy tắc bất biến

Một item đã nằm trong danh sách accessory được phép:
- tuyệt đối không được xuất hiện trong forbidden list.

Không được sinh prompt kiểu:

Allowed:
- khăn đóng

Forbidden:
- khăn đóng

Đây là lỗi logic nghiêm trọng.

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

# 13. Checklist audit prompt

Sau khi sinh prompt test, coding agent phải tự kiểm:

- [ ] Có historical fact nào không được phép không?
- [ ] Có phụ kiện nào được phép nhưng lại bị cấm không?
- [ ] Có đạo cụ nào tự thêm không?
- [ ] GIỮ có đúng whitelist không?
- [ ] modernityLevel có được dùng như styling direction, không phải lịch sử?
- [ ] màu chính/phụ/nhấn có đúng vai trò?
- [ ] full-body có đủ cụ thể?
- [ ] avoid list có tự mâu thuẫn không?
- [ ] prompt có lặp quá nhiều không?
- [ ] prompt có vô tình kéo garment sang hanfu/qipao/áo dài không?

Nếu bất kỳ mục nào FAIL:
không được báo task hoàn thành.

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

Hiện tại AC sử dụng:

Recommendation
→ `buildImagePrompt()`
→ User copy prompt
→ User mở Gemini hoặc ChatGPT
→ User paste prompt
→ External AI tạo ảnh

Hiện tại chưa có:
- image generation API trong AC;
- virtual try-on production;
- user-photo visualization production;
- Blender / 3D engine;
- automatic image validation.

Các phần này chỉ được thêm khi có task riêng và được duyệt.

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