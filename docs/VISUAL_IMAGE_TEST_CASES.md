# AC Visual Image Test Cases

## Benchmark Metadata
- **Benchmark ID:** AC-VISUAL-BASELINE-V1
- **Date generated:** 2026-10-01
- **Prompt baseline source:** UNCOMMITTED WORKTREE
- **Prompt baseline commit:** N/A (Container worktree without .git)
- **Prompt system status:** Stage 1.1 Prompt-Level PASS
- **Providers planned:**
  - Gemini
  - ChatGPT
- **Number of test cases:** 9
- **Planned baseline images:** 18 (2 per case)
- **Image generation status:** NOT RUN
- **IMAGE-LEVEL status:** PENDING

---

## Test Methodology
1. **Text-to-Image Only:** Toàn bộ test bench sử dụng thuần túy chỉ dẫn văn bản từ prompt sinh bởi production `buildImagePrompt()`. Không dùng ảnh tham chiếu (reference images), không moodboard, không img2img.
2. **Same Prompt Across Providers:** Đúng nguyên văn cùng một prompt được đưa vào cả Gemini và ChatGPT, tuyệt đối không tinh chỉnh câu chữ riêng cho từng provider.
3. **Single Run Baseline:** Mỗi provider chỉ tạo một ảnh đầu tiên làm baseline (Run 1). Không regenerate để chọn ảnh đẹp (tránh selection bias).
4. **Production Code Fidelity:** Toàn bộ 9 prompt dưới đây được sinh tự động trực tiếp từ code production `src/utils/buildImagePrompt.ts`, không qua chỉnh sửa thủ công.

---

## VP-NTC-10

### Input Fixture
- **Garment:** Áo ngũ thân tay chẽn
- **Concept:** Nếp Xưa Tiết Chế
- **Style:** Trang trọng
- **Occasion:** Lễ hội / sự kiện văn hóa
- **Modernity:** 10/100
- **Colors:**
1. Nâu hạt dẻ (#5C4033)
2. Be ngà (#E8DCC4)
3. Đen nâu (#2F2926)
- **Allowed visual items / accessories:**
EMPTY (Không có phụ kiện)
- **GIỮ:**
- Cấu trúc năm thân
- Có thân thứ năm phía trong phần trước
- Cổ đứng/lập lĩnh
- Tay thu về cổ tay
- Phom truyền thống không bodycon mạnh

### Stress Target
Low modernity; không phụ kiện; kiểm tra model có tự thêm đồ hay không; kiểm tra cổ đứng; kiểm tra tay thu cổ tay; kiểm tra non-bodycon.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo ngũ thân tay chẽn, thể hiện concept "Nếp Xưa Tiết Chế".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Cổ đứng/lập lĩnh
  + Tay thu về cổ tay
  + Phom truyền thống không bodycon mạnh
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc năm thân
  + Có thân thứ năm phía trong phần trước
- Chỉ dẫn tạo hình cho Áo ngũ thân tay chẽn: Cổ đứng/lập lĩnh cần nhìn rõ ràng, thẳng thớm; tay áo thu gọn dần và ôm vừa vặn về phía cổ tay (không loe, không fantasy). Silhouette trang phục buông tự nhiên theo phom truyền thống, không ôm sát chiết eo kiểu áo dài hiện đại (bodycon fit) để người xem nhận rõ toàn bộ cấu trúc form áo.

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Trang trọng, phù hợp cho bối cảnh Lễ hội / sự kiện văn hóa.
- Mức độ hiện đại 10/100: Ưu tiên tổng thể tiết chế, hạn chế các biến tấu styling mạnh và giữ rõ các đặc điểm GIỮ cùng silhouette đã mô tả. Ưu tiên bề mặt vải trơn hoặc rất ít hoa văn trang trí, không dùng phụ kiện mang cảm giác hiện đại phá cách và không tạo cảm giác fashion-forward quá mức.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Nâu hạt dẻ (#5C4033) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Be ngà (#E8DCC4) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Đen nâu (#2F2926) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện: Không có phụ kiện / vật phẩm bổ sung được yêu cầu.
Tuyệt đối không tự thêm phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào ngoài trang phục chính.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon fit).
- Không nhầm lẫn với qipao / cheongsam, hanfu, trang phục biểu diễn sân khấu (stage costume) hoặc fantasy costume.
- Tránh tay áo fantasy quá rộng, tay loe và trang trí thêu thùa hoa văn quá mức; không làm mất đặc điểm tay thu về cổ tay.
- Không để màu phụ hoặc màu điểm nhấn lấn át diện tích của màu chủ đạo.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-NTC-50

### Input Fixture
- **Garment:** Áo ngũ thân tay chẽn
- **Concept:** Cân Bằng Đương Đại
- **Style:** Thanh lịch
- **Occasion:** Chụp ảnh / sự kiện văn hóa
- **Modernity:** 50/100
- **Colors:**
1. Xanh rêu (#556B2F)
2. Kem (#F5F0E6)
3. Đồng (#B87333)
- **Allowed visual items / accessories:**
- Giày oxford da trơn
- Đồng hồ mặt nhỏ
- **GIỮ:**
- Cấu trúc năm thân
- Có thân thứ năm phía trong phần trước
- Cổ đứng/lập lĩnh
- Tay thu về cổ tay
- Phom truyền thống không bodycon mạnh

### Stress Target
Balanced modernity; phụ kiện hiện đại nhẹ; form ngũ thân vẫn giữ rõ nét.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo ngũ thân tay chẽn, thể hiện concept "Cân Bằng Đương Đại".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Cổ đứng/lập lĩnh
  + Tay thu về cổ tay
  + Phom truyền thống không bodycon mạnh
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc năm thân
  + Có thân thứ năm phía trong phần trước
- Chỉ dẫn tạo hình cho Áo ngũ thân tay chẽn: Cổ đứng/lập lĩnh cần nhìn rõ ràng, thẳng thớm; tay áo thu gọn dần và ôm vừa vặn về phía cổ tay (không loe, không fantasy). Silhouette trang phục buông tự nhiên theo phom truyền thống, không ôm sát chiết eo kiểu áo dài hiện đại (bodycon fit) để người xem nhận rõ toàn bộ cấu trúc form áo.

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Thanh lịch, phù hợp cho bối cảnh Chụp ảnh / sự kiện văn hóa.
- Mức độ hiện đại 50/100: Cân bằng hài hòa giữa đặc điểm nhận diện cốt lõi (GIỮ) và tinh thần đương đại (REMIX). Màu sắc và phụ kiện có thể trẻ trung, thanh lịch hơn nhưng phom dáng cốt lõi tuyệt đối không thay đổi.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Xanh rêu (#556B2F) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Kem (#F5F0E6) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Đồng (#B87333) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Giày oxford da trơn
- Đồng hồ mặt nhỏ
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon fit).
- Không nhầm lẫn với qipao / cheongsam, hanfu, trang phục biểu diễn sân khấu (stage costume) hoặc fantasy costume.
- Tránh tay áo fantasy quá rộng, tay loe và trang trí thêu thùa hoa văn quá mức; không làm mất đặc điểm tay thu về cổ tay.
- Không để màu phụ hoặc màu điểm nhấn lấn át diện tích của màu chủ đạo.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-NTC-95

### Input Fixture
- **Garment:** Áo ngũ thân tay chẽn
- **Concept:** Phá Cách Phố Thị
- **Style:** Cá tính
- **Occasion:** Kỷ yếu / tốt nghiệp
- **Modernity:** 95/100
- **Colors:**
1. Đen than (#181716)
2. Xám xi măng (#9E9E9E)
3. Cam đất (#D96B43)
- **Allowed visual items / accessories:**
- Giày sneaker chunky
- Túi đeo chéo mini
- **GIỮ:**
- Cấu trúc năm thân
- Có thân thứ năm phía trong phần trước
- Cổ đứng/lập lĩnh
- Tay thu về cổ tay
- Phom truyền thống không bodycon mạnh

### Stress Target
Modernity cao; stress-test khả năng giữ form khi styling mạnh; không biến thành áo dài bodycon; không tạo tay rộng fantasy.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo ngũ thân tay chẽn, thể hiện concept "Phá Cách Phố Thị".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Cổ đứng/lập lĩnh
  + Tay thu về cổ tay
  + Phom truyền thống không bodycon mạnh
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc năm thân
  + Có thân thứ năm phía trong phần trước
- Chỉ dẫn tạo hình cho Áo ngũ thân tay chẽn: Cổ đứng/lập lĩnh cần nhìn rõ ràng, thẳng thớm; tay áo thu gọn dần và ôm vừa vặn về phía cổ tay (không loe, không fantasy). Silhouette trang phục buông tự nhiên theo phom truyền thống, không ôm sát chiết eo kiểu áo dài hiện đại (bodycon fit) để người xem nhận rõ toàn bộ cấu trúc form áo.

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Cá tính, phù hợp cho bối cảnh Kỷ yếu / tốt nghiệp.
- Mức độ hiện đại 95/100: Hiện đại hóa mạnh mẽ, cho phép sáng tạo nổi bật về bảng màu, phụ kiện đương đại và thần thái thời trang cá tính; tuy nhiên tuyệt đối không làm thay đổi các đặc điểm GIỮ, không phá vỡ silhouette cốt lõi và không biến trang phục thành loại khác.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Đen than (#181716) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Xám xi măng (#9E9E9E) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Cam đất (#D96B43) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Giày sneaker chunky
- Túi đeo chéo mini
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon fit).
- Không nhầm lẫn với qipao / cheongsam, hanfu, trang phục biểu diễn sân khấu (stage costume) hoặc fantasy costume.
- Tránh tay áo fantasy quá rộng, tay loe và trang trí thêu thùa hoa văn quá mức; không làm mất đặc điểm tay thu về cổ tay.
- Không để màu phụ hoặc màu điểm nhấn lấn át diện tích của màu chủ đạo.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-TT-10

### Input Fixture
- **Garment:** Áo tứ thân
- **Concept:** Dáng Xưa Tiết Chế
- **Style:** Trang trọng
- **Occasion:** Lễ hội / sự kiện văn hóa
- **Modernity:** 10/100
- **Colors:**
1. Nâu gụ (#6B4423)
2. Kem nhạt (#F3E9D2)
3. Xanh rêu nhạt (#6B7A52)
- **Allowed visual items / accessories:**
- Dép vải đơn sắc
- **GIỮ:**
- Cấu trúc bốn thân
- Hai phần phía sau ghép dọc sống lưng
- Hai vạt trước riêng/mở

### Stress Target
Low modernity; không Quan họ hóa; không tự thêm nón quai thao; không tự thêm khăn mỏ quạ; hai vạt trước phải đọc được rõ.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo tứ thân, thể hiện concept "Dáng Xưa Tiết Chế".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Hai vạt trước riêng/mở
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc bốn thân
  + Hai phần phía sau ghép dọc sống lưng
- Chỉ dẫn tạo hình cho Áo tứ thân: Hai vạt trước phải nhìn thấy rõ ràng là tách rời và mở tự nhiên, không may đóng kín phần trước làm mất nhận diện cấu trúc bốn thân. Silhouette cần thể hiện rõ các lớp phối (layering) và không để cách styling che khuất nhận diện hai vạt trước riêng/mở; tuyệt đối không tự ý thêm phụ kiện hoặc bối cảnh biểu diễn Quan họ nếu không có trong danh sách được phép.

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Trang trọng, phù hợp cho bối cảnh Lễ hội / sự kiện văn hóa.
- Mức độ hiện đại 10/100: Ưu tiên tổng thể tiết chế, hạn chế các biến tấu styling mạnh và giữ rõ các đặc điểm GIỮ cùng silhouette đã mô tả. Ưu tiên bề mặt vải trơn hoặc rất ít hoa văn trang trí, không dùng phụ kiện mang cảm giác hiện đại phá cách và không tạo cảm giác fashion-forward quá mức.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Nâu gụ (#6B4423) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Kem nhạt (#F3E9D2) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Xanh rêu nhạt (#6B7A52) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Dép vải đơn sắc
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại, qipao / cheongsam hoặc hanfu.
- Không biến tấu thành trang phục biểu diễn sân khấu hở hang (stage costume) hoặc fantasy costume.
- Không dùng chất liệu xuyên thấu hoặc cách điệu làm mất nhận diện hai vạt trước riêng/mở.
- Không tự tiện thêm phụ kiện Quan họ (nón quai thao, khăn mỏ quạ, yếm...) nếu không có trong danh sách được phép.
- Không để màu điểm nhấn chiếm diện tích quá lớn.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-TT-50

### Input Fixture
- **Garment:** Áo tứ thân
- **Concept:** Dáng Xưa Phố Mới
- **Style:** Thanh lịch
- **Occasion:** Chụp ảnh
- **Modernity:** 50/100
- **Colors:**
1. Xanh ngọc nhạt (#A2D2FF)
2. Trắng sữa (#FAF9F6)
3. Vàng mơ (#FFD166)
- **Allowed visual items / accessories:**
- Túi cói cầm tay
- Dép mules da tối giản
- **GIỮ:**
- Cấu trúc bốn thân
- Hai phần phía sau ghép dọc sống lưng
- Hai vạt trước riêng/mở

### Stress Target
Stress-test allowed visual item dạng vật cầm tay; không được phủ nhận túi cói; layering rõ; styling balanced.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo tứ thân, thể hiện concept "Dáng Xưa Phố Mới".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Hai vạt trước riêng/mở
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc bốn thân
  + Hai phần phía sau ghép dọc sống lưng
- Chỉ dẫn tạo hình cho Áo tứ thân: Hai vạt trước phải nhìn thấy rõ ràng là tách rời và mở tự nhiên, không may đóng kín phần trước làm mất nhận diện cấu trúc bốn thân. Silhouette cần thể hiện rõ các lớp phối (layering) và không để cách styling che khuất nhận diện hai vạt trước riêng/mở; tuyệt đối không tự ý thêm phụ kiện hoặc bối cảnh biểu diễn Quan họ nếu không có trong danh sách được phép.

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Thanh lịch, phù hợp cho bối cảnh Chụp ảnh.
- Mức độ hiện đại 50/100: Cân bằng hài hòa giữa đặc điểm nhận diện cốt lõi (GIỮ) và tinh thần đương đại (REMIX). Màu sắc và phụ kiện có thể trẻ trung, thanh lịch hơn nhưng phom dáng cốt lõi tuyệt đối không thay đổi.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Xanh ngọc nhạt (#A2D2FF) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Trắng sữa (#FAF9F6) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Vàng mơ (#FFD166) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Túi cói cầm tay
- Dép mules da tối giản
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại, qipao / cheongsam hoặc hanfu.
- Không biến tấu thành trang phục biểu diễn sân khấu hở hang (stage costume) hoặc fantasy costume.
- Không dùng chất liệu xuyên thấu hoặc cách điệu làm mất nhận diện hai vạt trước riêng/mở.
- Không tự tiện thêm phụ kiện Quan họ (nón quai thao, khăn mỏ quạ, yếm...) nếu không có trong danh sách được phép.
- Không để màu điểm nhấn chiếm diện tích quá lớn.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-TT-95

### Input Fixture
- **Garment:** Áo tứ thân
- **Concept:** Layering Gen Z
- **Style:** Cá tính
- **Occasion:** Chụp ảnh / sự kiện sáng tạo
- **Modernity:** 95/100
- **Colors:**
1. Đen than (#36454F)
2. Hồng bụi (#D8A7B1)
3. Bạc (#C0C0C0)
- **Allowed visual items / accessories:**
- Bốt da cổ thấp
- Khuyên tai hình học bạc
- **GIỮ:**
- Cấu trúc bốn thân
- Hai phần phía sau ghép dọc sống lưng
- Hai vạt trước riêng/mở

### Stress Target
Modernity cao; không đóng kín hai vạt trước; không Quan họ hóa; garment visual guidance phải style-neutral.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo tứ thân, thể hiện concept "Layering Gen Z".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Hai vạt trước riêng/mở
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc bốn thân
  + Hai phần phía sau ghép dọc sống lưng
- Chỉ dẫn tạo hình cho Áo tứ thân: Hai vạt trước phải nhìn thấy rõ ràng là tách rời và mở tự nhiên, không may đóng kín phần trước làm mất nhận diện cấu trúc bốn thân. Silhouette cần thể hiện rõ các lớp phối (layering) và không để cách styling che khuất nhận diện hai vạt trước riêng/mở; tuyệt đối không tự ý thêm phụ kiện hoặc bối cảnh biểu diễn Quan họ nếu không có trong danh sách được phép.

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Cá tính, phù hợp cho bối cảnh Chụp ảnh / sự kiện sáng tạo.
- Mức độ hiện đại 95/100: Hiện đại hóa mạnh mẽ, cho phép sáng tạo nổi bật về bảng màu, phụ kiện đương đại và thần thái thời trang cá tính; tuy nhiên tuyệt đối không làm thay đổi các đặc điểm GIỮ, không phá vỡ silhouette cốt lõi và không biến trang phục thành loại khác.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Đen than (#36454F) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Hồng bụi (#D8A7B1) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Bạc (#C0C0C0) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Bốt da cổ thấp
- Khuyên tai hình học bạc
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại, qipao / cheongsam hoặc hanfu.
- Không biến tấu thành trang phục biểu diễn sân khấu hở hang (stage costume) hoặc fantasy costume.
- Không dùng chất liệu xuyên thấu hoặc cách điệu làm mất nhận diện hai vạt trước riêng/mở.
- Không tự tiện thêm phụ kiện Quan họ (nón quai thao, khăn mỏ quạ, yếm...) nếu không có trong danh sách được phép.
- Không để màu điểm nhấn chiếm diện tích quá lớn.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-AT-10

### Input Fixture
- **Garment:** Áo tấc
- **Concept:** Cổ Phong Điển Lễ
- **Style:** Trang trọng
- **Occasion:** Lễ hội / sự kiện văn hóa
- **Modernity:** 10/100
- **Colors:**
1. Đỏ thẫm (#7B1113)
2. Vàng đồng (#C6A56B)
3. Trắng ngà (#F4EFE6)
- **Allowed visual items / accessories:**
- Khăn đóng đồng bộ
- Quạt giấy cổ phong
- Hài vải đơn sắc
- **GIỮ:**
- Cấu trúc năm thân
- Tay rộng/thụng

### Stress Target
Test tay rộng/thụng; test allowed visual item dạng vật cầm tay; quạt không được bị cấm lại; không hanfu hóa; không fantasy sleeve; không tự thêm cổ đứng vào GIỮ.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo tấc, thể hiện concept "Cổ Phong Điển Lễ".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Tay rộng/thụng
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc năm thân
- Chỉ dẫn tạo hình cho Áo tấc: Tay rộng/thụng phải là đặc điểm thị giác nhận thấy rõ ràng ngay khi nhìn toàn thân. Tay cần rộng rõ hơn tay áo dài hiện đại thông thường nhưng vẫn giữ tỷ lệ cân đối với vóc dáng người mẫu, không thu hẹp đến mức mất nhận diện tay thụng, đồng thời không phóng đại thành tay cánh dơi hay oversized fantasy sleeves. Silhouette dài, thanh thoát; bề mặt trang phục sạch và tiết chế, hạn chế tối đa hoa văn dày đặc, tránh cảm giác phục trang tuồng cổ hay sân khấu (stage costume).

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Trang trọng, phù hợp cho bối cảnh Lễ hội / sự kiện văn hóa.
- Mức độ hiện đại 10/100: Ưu tiên tổng thể tiết chế, hạn chế các biến tấu styling mạnh và giữ rõ các đặc điểm GIỮ cùng silhouette đã mô tả. Ưu tiên bề mặt vải trơn hoặc rất ít hoa văn trang trí, không dùng phụ kiện mang cảm giác hiện đại phá cách và không tạo cảm giác fashion-forward quá mức.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Đỏ thẫm (#7B1113) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Vàng đồng (#C6A56B) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Trắng ngà (#F4EFE6) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Khăn đóng đồng bộ
- Quạt giấy cổ phong
- Hài vải đơn sắc
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon).
- Không nhầm sang qipao / cheongsam hoặc hanfu.
- Không biến thành trang phục kỳ ảo (fantasy costume), tuồng cổ hoặc trang phục biểu diễn sân khấu (stage costume).
- Không thu hẹp tay áo làm mất nhận diện tay rộng/thụng; không phóng đại tay thành dạng cánh dơi hoặc oversized fantasy sleeves.
- Tránh hoa văn hoặc chi tiết thêu thùa phủ kín dày đặc trên bề mặt tà áo.
- Không để màu phụ hoặc màu điểm nhấn chiếm diện tích quá lớn lấn át màu chủ đạo.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-AT-50

### Input Fixture
- **Garment:** Áo tấc
- **Concept:** Giao Thoa Đương Đại
- **Style:** Thanh lịch
- **Occasion:** Chụp ảnh / sự kiện văn hóa
- **Modernity:** 50/100
- **Colors:**
1. Chàm (#2C3E50)
2. Be cát (#D8C3A5)
3. Xanh rêu dịu (#657A5B)
- **Allowed visual items / accessories:**
- Trâm cài tóc tối giản
- **GIỮ:**
- Cấu trúc năm thân
- Tay rộng/thụng

### Stress Target
Balanced modernity; tay thụng vẫn rõ; không biến thành áo dài; không phóng đại fantasy.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo tấc, thể hiện concept "Giao Thoa Đương Đại".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Tay rộng/thụng
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc năm thân
- Chỉ dẫn tạo hình cho Áo tấc: Tay rộng/thụng phải là đặc điểm thị giác nhận thấy rõ ràng ngay khi nhìn toàn thân. Tay cần rộng rõ hơn tay áo dài hiện đại thông thường nhưng vẫn giữ tỷ lệ cân đối với vóc dáng người mẫu, không thu hẹp đến mức mất nhận diện tay thụng, đồng thời không phóng đại thành tay cánh dơi hay oversized fantasy sleeves. Silhouette dài, thanh thoát; bề mặt trang phục sạch và tiết chế, hạn chế tối đa hoa văn dày đặc, tránh cảm giác phục trang tuồng cổ hay sân khấu (stage costume).

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Thanh lịch, phù hợp cho bối cảnh Chụp ảnh / sự kiện văn hóa.
- Mức độ hiện đại 50/100: Cân bằng hài hòa giữa đặc điểm nhận diện cốt lõi (GIỮ) và tinh thần đương đại (REMIX). Màu sắc và phụ kiện có thể trẻ trung, thanh lịch hơn nhưng phom dáng cốt lõi tuyệt đối không thay đổi.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Chàm (#2C3E50) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Be cát (#D8C3A5) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Xanh rêu dịu (#657A5B) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Trâm cài tóc tối giản
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon).
- Không nhầm sang qipao / cheongsam hoặc hanfu.
- Không biến thành trang phục kỳ ảo (fantasy costume), tuồng cổ hoặc trang phục biểu diễn sân khấu (stage costume).
- Không thu hẹp tay áo làm mất nhận diện tay rộng/thụng; không phóng đại tay thành dạng cánh dơi hoặc oversized fantasy sleeves.
- Tránh hoa văn hoặc chi tiết thêu thùa phủ kín dày đặc trên bề mặt tà áo.
- Không để màu phụ hoặc màu điểm nhấn chiếm diện tích quá lớn lấn át màu chủ đạo.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---

## VP-AT-95

### Input Fixture
- **Garment:** Áo tấc
- **Concept:** Tốt Nghiệp Phá Cách
- **Style:** Cá tính
- **Occasion:** Kỷ yếu / tốt nghiệp
- **Modernity:** 95/100
- **Colors:**
1. Xám khói (#708090)
2. Hồng pastel (#FFD1DC)
3. Đen than (#36454F)
- **Allowed visual items / accessories:**
- Giày sneaker chunky
- Khuyên tai hình học bản lớn
- Túi đeo chéo da bóng
- **GIỮ:**
- Cấu trúc năm thân
- Tay rộng/thụng

### Stress Target
Modernity rất cao; kiểm tra tay áo không bị thu hẹp; không biến thành áo dài hiện đại; không fantasy hóa; không tự thêm bằng tốt nghiệp/mũ cử nhân/hoa nếu không được yêu cầu.

### Production Prompt Output
```text
Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc Áo tấc, thể hiện concept "Tốt Nghiệp Phá Cách".

Đặc điểm nhận diện cốt lõi cần giữ:
- Đặc điểm cần thể hiện rõ trong hình ảnh:
  + Tay rộng/thụng
- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):
  + Cấu trúc năm thân
- Chỉ dẫn tạo hình cho Áo tấc: Tay rộng/thụng phải là đặc điểm thị giác nhận thấy rõ ràng ngay khi nhìn toàn thân. Tay cần rộng rõ hơn tay áo dài hiện đại thông thường nhưng vẫn giữ tỷ lệ cân đối với vóc dáng người mẫu, không thu hẹp đến mức mất nhận diện tay thụng, đồng thời không phóng đại thành tay cánh dơi hay oversized fantasy sleeves. Silhouette dài, thanh thoát; bề mặt trang phục sạch và tiết chế, hạn chế tối đa hoa văn dày đặc, tránh cảm giác phục trang tuồng cổ hay sân khấu (stage costume).

Phong cách & Định hướng hiện đại:
- Phong cách tổng thể: Cá tính, phù hợp cho bối cảnh Kỷ yếu / tốt nghiệp.
- Mức độ hiện đại 95/100: Hiện đại hóa mạnh mẽ, cho phép sáng tạo nổi bật về bảng màu, phụ kiện đương đại và thần thái thời trang cá tính; tuy nhiên tuyệt đối không làm thay đổi các đặc điểm GIỮ, không phá vỡ silhouette cốt lõi và không biến trang phục thành loại khác.

Bảng màu và phân bổ tỷ lệ:
- Màu chủ đạo: Xám khói (#708090) — chiếm phần lớn diện tích trang phục (áo chính).
- Màu phụ: Hồng pastel (#FFD1DC) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.
- Màu điểm nhấn: Đen than (#36454F) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.

Phụ kiện / vật phẩm được phép xuất hiện:
- Giày sneaker chunky
- Khuyên tai hình học bản lớn
- Túi đeo chéo da bóng
Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.

Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):
- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.
- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).
- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.
- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.
- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.

Cảm nhận chất liệu bề mặt:
- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).

Những điều cần tránh:
- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon).
- Không nhầm sang qipao / cheongsam hoặc hanfu.
- Không biến thành trang phục kỳ ảo (fantasy costume), tuồng cổ hoặc trang phục biểu diễn sân khấu (stage costume).
- Không thu hẹp tay áo làm mất nhận diện tay rộng/thụng; không phóng đại tay thành dạng cánh dơi hoặc oversized fantasy sleeves.
- Tránh hoa văn hoặc chi tiết thêu thùa phủ kín dày đặc trên bề mặt tà áo.
- Không để màu phụ hoặc màu điểm nhấn chiếm diện tích quá lớn lấn át màu chủ đạo.
- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.
```

### Prompt-Level Verification
- Observable GIỮ present: PASS
- Structural GIỮ present: PASS
- Modernity wording correct: PASS
- Allowed items correct: PASS
- No semantic contradiction: PASS
- Color hierarchy present: PASS
- Full-body instruction present: PASS
- Garment-specific avoidance present: PASS

---
