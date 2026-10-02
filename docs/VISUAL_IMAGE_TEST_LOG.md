# AC Visual Image Test Log

## Benchmark Metadata
- **Benchmark ID:** AC-VISUAL-BASELINE-V1
- **Prompt baseline source:** UNCOMMITTED WORKTREE
- **Prompt baseline commit:** N/A (Container worktree without .git)
- **Prompt-level status:** Stage 1.1 Prompt-Level PASS
- **Gemini image status:** PENDING
- **ChatGPT image status:** PENDING
- **Total planned images:** 18
- **Total evaluated images:** 0
- **IMAGE-LEVEL status:** PENDING

---

## Phân biệt kiểm thử: PROMPT-LEVEL PASS vs IMAGE-LEVEL PASS
- **PROMPT-LEVEL PASS** chỉ có nghĩa:
  - Văn bản prompt đúng logic kỹ thuật;
  - Chứa đầy đủ các chỉ dẫn thị giác theo specification;
  - Không tự mâu thuẫn semantic;
  - Tuân thủ cultural whitelist và guardrails.
- **PROMPT-LEVEL PASS KHÔNG chứng minh:**
  - Ảnh thực tế của mô hình AI tạo ra đúng garment;
  - Cấu trúc ẩn được bảo toàn hoàn hảo;
  - AI hiểu chính xác văn hóa và cấu trúc trang phục truyền thống Việt Nam;
  - Hình ảnh đạt chuẩn xuất bản (IMAGE-LEVEL PASS).

*IMAGE-LEVEL correctness chỉ được đánh giá sau khi có file ảnh render thực tế từ provider.*

---

## Quy trình Generate ảnh sau Giai đoạn 2A
Với từng test case:
1. Copy nguyên văn `Production Prompt Output` từ file `docs/VISUAL_IMAGE_TEST_CASES.md`.
2. Không chỉnh sửa câu từ prompt trước khi test.
3. Mở Gemini -> dán prompt -> sinh đúng 1 ảnh baseline -> lưu ảnh vào hồ sơ.
4. Mở ChatGPT -> dán cùng prompt đó -> sinh đúng 1 ảnh baseline -> lưu ảnh vào hồ sơ.
5. **Không regenerate chỉ vì ảnh đầu tiên không đẹp mắt:** Ảnh đầu tiên là Run 1 (baseline khách quan để đo độ tin cậy, tránh selection bias). Nếu regenerate, ghi rõ là Run 2, Run 3 vào ghi chú.

---

## Image-Level Rubric (Chấm điểm chẩn đoán 0–10)
Mỗi ảnh được đánh giá trên 9 tiêu chí chẩn đoán (Diagnostic Score /90):

1. **Garment Identity (Nhận diện dáng phục):**
   - 10: Nhận diện rất rõ nét, không bị nhầm lẫn hay lai tạp với trang phục khác.
   - 7–9: Nhận diện tốt, có chi tiết mơ hồ nhỏ.
   - 4–6: Nhận diện yếu, lai tạp đáng kể sang trang phục nước khác.
   - 1–3: Gần như biến thành loại trang phục khác.
   - 0: Hoàn toàn sai loại trang phục.
2. **Observable GIỮ (Đặc điểm nhận diện quan sát được):**
   - Đánh giá các đặc điểm quan sát trực diện (Cổ đứng, Tay thu cổ tay, Non-bodycon, Hai vạt trước riêng/mở, Tay rộng/thụng). Không chấm điểm cấu trúc ẩn bằng suy đoán.
3. **Silhouette & Proportion (Tỷ lệ và Phom dáng):**
   - Đánh giá độ dài, độ rủ, tỷ lệ ống tay áo, độ đứng phom tự nhiên, không méo cơ thể, không bodycon, không fantasy sleeves.
4. **Modernity / Style Adherence (Bám sát mức độ hiện đại & phong cách):**
   - Đánh giá mức độ thể hiện đúng tinh thần style và modernityLevel yêu cầu (Modernity là phong cách styling, không phải thước đo lịch sử).
5. **Color Hierarchy (Tỷ lệ phân bổ màu sắc):**
   - Màu chủ đạo chiếm phần lớn; màu phụ hỗ trợ viền/lót; màu điểm nhấn tiết chế; không bị đảo lộn palette.
6. **Allowed Visual Items (Phụ kiện / vật phẩm được phép):**
   - Các món yêu cầu có xuất hiện hợp lý, không bị biến dạng; nếu danh sách rỗng thì kiểm tra model có tự tiện thêm đồ hay không.
7. **Invented Items / Props (Kiểm soát đạo cụ / phụ kiện tự phát):**
   - 10: Tuyệt đối không tự thêm bất kỳ món nào ngoài danh sách.
   - Điểm trừ mạnh nếu tự thêm bằng tốt nghiệp, mũ cử nhân, hoa, sách, quạt hay đồ bối cảnh không yêu cầu (Lưu ý: Món đã nằm trong Allowed Visual Items không bị tính là invented).
8. **Full-body & Composition (Ảnh toàn thân & Bố cục):**
   - Toàn thân từ đầu đến gót chân; nhìn rõ hai bàn chân/giày; không crop mất tay/chân; silhouette dễ quan sát; studio background sạch nhã.
9. **Wearability & Visual Quality (Tính thực tế & Thẩm mỹ):**
   - Cảm giác trang phục có thể may mặc đời thực (wearable), không phải trang phục sân khấu/tuồng cổ.

---

## Đánh giá Structural GIỮ (Không chấm điểm giả)
Các đặc điểm cấu trúc bên trong hoặc phía sau (Cấu trúc năm thân, Thân thứ năm phía trong, Ghép dọc sống lưng, Cấu trúc bốn thân) không thể quan sát trọn vẹn từ một ảnh phía trước. Vì vậy tiêu chí này KHÔNG chấm điểm số 0–10 mà phân loại định tính:
- `NOT DIRECTLY VERIFIABLE` (Không thể kiểm chứng trực tiếp từ góc nhìn này).
- `NO VISIBLE CONTRADICTION` (Không có dấu hiệu thị giác nào mâu thuẫn với cấu trúc).
- `VISIBLE CONTRADICTION` (Có dấu hiệu trực quan mâu thuẫn rõ ràng với cấu trúc).

---

## Hard Gates (Điều kiện tiên quyết)
Một ảnh chỉ được công nhận **IMAGE-LEVEL PASS** khi vượt qua TẤT CẢ 4 Hard Gates:
- **Hard Gate 1 — Garment Identity:** Ảnh không bị biến thành loại trang phục khác (áo dài hiện đại, hanfu, qipao, fantasy/tuồng cổ).
- **Hard Gate 2 — Observable GIỮ:** Không làm mất đặc điểm nhận diện quan sát được (Áo tấc mà tay hẹp: FAIL; Áo tứ thân mà vạt trước đóng kín: FAIL; Ngũ thân tay chẽn mà thành bodycon: FAIL).
- **Hard Gate 3 — No Critical Contradiction:** Không vi phạm các cấm kỵ cốt lõi trong prompt guardrails.
- **Hard Gate 4 — Usable Visualization:** Ảnh đủ rõ nét, anatomy hợp lý, không crop cụt chân/tay, giúp người dùng thực sự hình dung được bản phối.

*Quy tắc bất biến: Điểm số trung bình (Average Score) không được dùng để override Hard Gate. Nếu bất kỳ Hard Gate nào FAIL thì IMAGE-LEVEL RESULT = FAIL.*

---

## Failure Taxonomy (Bộ mã lỗi chuẩn)
- `GARMENT_DRIFT`: Sai lệch nhận diện dáng phục sang loại khác
- `OBSERVABLE_GIU_LOSS`: Mất đặc điểm nhận diện quan sát được
- `STRUCTURAL_CONTRADICTION`: Mâu thuẫn rõ ràng với cấu trúc trang phục
- `HANFU_DRIFT`: Bị kéo sang phong cách Hán phục
- `QIPAO_DRIFT`: Bị kéo sang phong cách sườn xám / qipao
- `AO_DAI_DRIFT`: Bị biến thành áo dài hiện đại chiết eo
- `FANTASY_DRIFT`: Trang phục mang phong cách kỳ ảo / tiên hiệp
- `STAGE_COSTUME_DRIFT`: Cảm giác phục trang biểu diễn sân khấu / tuồng cổ
- `SLEEVE_TOO_NARROW`: Tay áo bị thu quá hẹp làm mất dáng tay thụng
- `SLEEVE_TOO_OVERSIZED`: Tay áo bị phóng đại thành cánh dơi / fantasy
- `FRONT_PANELS_LOST`: Hai vạt trước Áo tứ thân bị may liền hoặc đóng kín
- `BODYCON_DRIFT`: Dáng áo bị bó sát chiết eo bodycon
- `COLOR_HIERARCHY_FAIL`: Đảo lộn tỷ lệ màu hoặc màu phụ lấn át màu chính
- `UNREQUESTED_ITEM`: Tự phát thêm phụ kiện / đạo cụ ngoài yêu cầu
- `REQUESTED_ITEM_MISSING`: Thiếu phụ kiện được phép yêu cầu rõ trong prompt
- `FULL_BODY_FAIL`: Không phải ảnh toàn thân (bán thân, crop gối)
- `CROP_FAIL`: Crop mất tay, mất chân hoặc mất phom áo
- `ANATOMY_FAIL`: Lỗi giải phẫu cơ thể người (tay, ngón tay, mắt)
- `STYLE_MISMATCH`: Không đúng phong cách yêu cầu
- `MODERNITY_MISMATCH`: Lệch dải mức độ hiện đại yêu cầu
- `OVER_DECORATION`: Hoa văn, thêu thùa phủ kín quá mức
- `OTHER`: Lỗi khác (ghi chú trong Notes)
- `NONE`: Không có lỗi

---

## Định nghĩa Recurring Failure Pattern
Một lỗi chỉ được coi là "lỗi hệ thống" (Systematic Failure) cần can thiệp sửa `buildImagePrompt()` khi:
1. Xuất hiện trên ít nhất 2 test cases có liên quan; HOẶC
2. Cùng xuất hiện ở cả Gemini và ChatGPT trên cùng một dáng trang phục; HOẶC
3. Là lỗi chí mạng (Critical Failure) trực tiếp làm mất Observable GIỮ.

*Không sửa code prompt vì lỗi ngẫu nhiên cá biệt của một lần render (Random Generation Variance) hay sở thích thẩm mỹ chủ quan.*

---

## 18 Image Evaluation Records

## VP-NTC-10

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-NTC-50

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-NTC-95

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-TT-10

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-TT-50

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-TT-95

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-AT-10

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-AT-50

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

## VP-AT-95

### Gemini
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

### ChatGPT
- **Image reference:** PENDING
- **Generation date:** PENDING
- **Hard Gate 1 (Garment Identity):** PENDING
- **Hard Gate 2 (Observable GIỮ):** PENDING
- **Hard Gate 3 (No Critical Contradiction):** PENDING
- **Hard Gate 4 (Usable Visualization):** PENDING
- **Garment Identity Score:** PENDING /10
- **Observable GIỮ Score:** PENDING /10
- **Silhouette & Proportion Score:** PENDING /10
- **Modernity / Style Score:** PENDING /10
- **Color Hierarchy Score:** PENDING /10
- **Allowed Visual Items Score:** PENDING /10
- **Invented Items Score:** PENDING /10
- **Full-body & Composition Score:** PENDING /10
- **Wearability & Visual Quality Score:** PENDING /10
- **Total Diagnostic Score:** PENDING /90
- **Average Diagnostic Score:** PENDING /10
- **Structural GIỮ Status:** PENDING (NOT DIRECTLY VERIFIABLE / NO VISIBLE CONTRADICTION / VISIBLE CONTRADICTION)
- **Failure Tags:** PENDING
- **IMAGE-LEVEL RESULT:** PENDING (PASS / FAIL)
- **Notes:** PENDING

---

# Gemini vs ChatGPT Comparison

**Status:** PENDING UNTIL 18 IMAGES ARE EVALUATED

| Metric | Gemini | ChatGPT |
| :--- | :--- | :--- |
| **Evaluated Images** | 0 / 9 | 0 / 9 |
| **Hard Gate Pass Count** | PENDING | PENDING |
| **IMAGE-LEVEL PASS Count** | PENDING | PENDING |
| **Average Diagnostic Score** | PENDING /10 | PENDING /10 |
| **Garment Drift Count** | PENDING | PENDING |
| **Observable GIỮ Loss Count** | PENDING | PENDING |
| **Unrequested Items Count** | PENDING | PENDING |
| **Full-body Fail Count** | PENDING | PENDING |

### Provider Strengths
- **Gemini:** PENDING
- **ChatGPT:** PENDING

### Provider Weaknesses
- **Gemini:** PENDING
- **ChatGPT:** PENDING

### Systematic Observations
PENDING
