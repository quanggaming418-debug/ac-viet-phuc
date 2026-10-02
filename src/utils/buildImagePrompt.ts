import type { ACOutfitRecommendation, OriginalRequest } from '../types/recommendation.ts';

/**
 * Tạo chỉ dẫn tạo hình cho 5 dải mức độ hiện đại (0-100) theo đúng
 * quy chuẩn Section 5 của VISUAL_GENERATION_GUIDE.md.
 * Modernity chỉ kiểm soát mức độ biến tấu styling, không phải thước đo lịch sử
 * hay chứng nhận chuẩn mực văn hóa (không dùng từ "chuẩn mực", "phục dựng", v.v.).
 */
function getModernityGuidance(level: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));

  // Range 1: 0–20 (Rất gần truyền thống)
  if (clamped <= 20) {
    return `Mức độ hiện đại ${clamped}/100: Ưu tiên tổng thể tiết chế, hạn chế các biến tấu styling mạnh và giữ rõ các đặc điểm GIỮ cùng silhouette đã mô tả. Ưu tiên bề mặt vải trơn hoặc rất ít hoa văn trang trí, không dùng phụ kiện mang cảm giác hiện đại phá cách và không tạo cảm giác fashion-forward quá mức.`;
  }

  // Range 2: 21–40 (Truyền thống chiếm ưu thế)
  if (clamped <= 40) {
    return `Mức độ hiện đại ${clamped}/100: Tinh thần truyền thống chiếm ưu thế rõ nét. Giữ vững nhận diện trang phục cốt lõi, chỉ biến tấu rất nhẹ ở sắc thái màu hoặc phụ kiện tinh giản, giữ mức độ hiện đại ở mức thấp và chừng mực.`;
  }

  // Range 3: 41–60 (Cân bằng)
  if (clamped <= 60) {
    return `Mức độ hiện đại ${clamped}/100: Cân bằng hài hòa giữa đặc điểm nhận diện cốt lõi (GIỮ) và tinh thần đương đại (REMIX). Màu sắc và phụ kiện có thể trẻ trung, thanh lịch hơn nhưng phom dáng cốt lõi tuyệt đối không thay đổi.`;
  }

  // Range 4: 61–80 (Hiện đại rõ)
  if (clamped <= 80) {
    return `Mức độ hiện đại ${clamped}/100: Hiện đại hóa rõ nét ở bảng màu, phụ kiện và tinh thần styling thời trang trẻ trung, phóng khoáng, nhưng vẫn bảo toàn trọn vẹn toàn bộ đặc điểm nhận diện cốt lõi (GIỮ) của trang phục.`;
  }

  // Range 5: 81–100 (Hiện đại mạnh)
  return `Mức độ hiện đại ${clamped}/100: Hiện đại hóa mạnh mẽ, cho phép sáng tạo nổi bật về bảng màu, phụ kiện đương đại và thần thái thời trang cá tính; tuy nhiên tuyệt đối không làm thay đổi các đặc điểm GIỮ, không phá vỡ silhouette cốt lõi và không biến trang phục thành loại khác.`;
}

/**
 * Xây dựng mô tả phân bổ bảng màu chặt chẽ theo Section 6 của VISUAL_GENERATION_GUIDE.md:
 * Màu 1 = chủ đạo (phần lớn diện tích)
 * Màu 2 = phụ (hỗ trợ, viền, lớp lót, mảng nhỏ)
 * Màu 3 = điểm nhấn (tiết chế, không để lấn át)
 */
function buildColorDistribution(colorPalette: { name: string; hex: string }[]): string {
  if (!colorPalette || colorPalette.length === 0) {
    return 'Bảng màu: Tông màu nhã nhặn, tự nhiên theo tinh thần tối giản.';
  }

  const lines: string[] = ['Bảng màu và phân bổ tỷ lệ:'];

  if (colorPalette.length >= 1) {
    const c1 = colorPalette[0];
    lines.push(
      `- Màu chủ đạo: ${c1.name} (${c1.hex.toUpperCase()}) — chiếm phần lớn diện tích trang phục (áo chính).`
    );
  }

  if (colorPalette.length >= 2) {
    const c2 = colorPalette[1];
    lines.push(
      `- Màu phụ: ${c2.name} (${c2.hex.toUpperCase()}) — chỉ xuất hiện hỗ trợ ở lớp lót, đường viền hoặc mảng phối thứ cấp có kiểm soát.`
    );
  }

  if (colorPalette.length >= 3) {
    const c3 = colorPalette[2];
    lines.push(
      `- Màu điểm nhấn: ${c3.name} (${c3.hex.toUpperCase()}) — chỉ dùng với diện tích rất nhỏ (chi tiết trang trí nhẹ hoặc phụ kiện), tuyệt đối không để lấn át màu chủ đạo hay biến toàn bộ trang phục thành màu này.`
    );
  }

  return lines.join('\n');
}

/**
 * Mô hình Allowed Visual Items theo Section 7 của VISUAL_GENERATION_GUIDE.md.
 * Vì schema hiện tại chỉ có recommendation.accessories và không có field props riêng,
 * toàn bộ item được coi chung là "Phụ kiện / vật phẩm được phép xuất hiện".
 * Loại bỏ hoàn toàn classifier từ khóa phỏng đoán, triệt tiêu 100% mâu thuẫn semantic.
 */
function buildAllowedVisualItemsSection(accessories: string[]): string {
  if (!accessories || accessories.length === 0) {
    return (
      `Phụ kiện / vật phẩm được phép xuất hiện: Không có phụ kiện / vật phẩm bổ sung được yêu cầu.\n` +
      `Tuyệt đối không tự thêm phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào ngoài trang phục chính.`
    );
  }

  const itemsList = accessories.map((item) => `- ${item}`).join('\n');
  return (
    `Phụ kiện / vật phẩm được phép xuất hiện:\n${itemsList}\n` +
    `Chỉ sử dụng đúng các phụ kiện / vật phẩm đã liệt kê ở trên. Tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay, đạo cụ chụp ảnh hoặc chi tiết bối cảnh nào khác ngoài danh sách được phép.`
  );
}

/**
 * Phân định rạch ròi giữa:
 * - Đặc điểm cần thể hiện rõ trong hình ảnh (Visually observable)
 * - Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (Structural)
 * Theo Section 4 của VISUAL_GENERATION_GUIDE.md.
 */
function categorizeGiu(garmentType: string, giu: string[]) {
  const structuralDefinitions: Record<string, string[]> = {
    'Áo ngũ thân tay chẽn': [
      'Cấu trúc năm thân',
      'Có thân thứ năm phía trong phần trước',
    ],
    'Áo tứ thân': [
      'Cấu trúc bốn thân',
      'Hai phần phía sau ghép dọc sống lưng',
    ],
    'Áo tấc': [
      'Cấu trúc năm thân',
    ],
  };

  const garmentStructural = structuralDefinitions[garmentType] || [];
  const structural = giu.filter((item) => garmentStructural.includes(item));
  const observable = giu.filter((item) => !garmentStructural.includes(item));

  return { observable, structural };
}

/**
 * Định hướng thị giác trung tính về phong cách (Style-neutral) theo Section 4 của Guide:
 * Không hard-code các từ ngữ phong cách (mộc mạc, thanh lịch, cổ điển, nữ tính)
 * để tránh xung đột với style cá tính hoặc hiện đại.
 */
function buildGarmentVisualGuidance(garmentType: string): string {
  if (garmentType === 'Áo ngũ thân tay chẽn') {
    return `- Chỉ dẫn tạo hình cho Áo ngũ thân tay chẽn: Cổ đứng/lập lĩnh cần nhìn rõ ràng, thẳng thớm; tay áo thu gọn dần và ôm vừa vặn về phía cổ tay (không loe, không fantasy). Silhouette trang phục buông tự nhiên theo phom truyền thống, không ôm sát chiết eo kiểu áo dài hiện đại (bodycon fit) để người xem nhận rõ toàn bộ cấu trúc form áo.`;
  }

  if (garmentType === 'Áo tứ thân') {
    return `- Chỉ dẫn tạo hình cho Áo tứ thân: Hai vạt trước phải nhìn thấy rõ ràng là tách rời và mở tự nhiên, không may đóng kín phần trước làm mất nhận diện cấu trúc bốn thân. Silhouette cần thể hiện rõ các lớp phối (layering) và không để cách styling che khuất nhận diện hai vạt trước riêng/mở; tuyệt đối không tự ý thêm phụ kiện hoặc bối cảnh biểu diễn Quan họ nếu không có trong danh sách được phép.`;
  }

  // Áo tấc
  return `- Chỉ dẫn tạo hình cho Áo tấc: Tay rộng/thụng phải là đặc điểm thị giác nhận thấy rõ ràng ngay khi nhìn toàn thân. Tay cần rộng rõ hơn tay áo dài hiện đại thông thường nhưng vẫn giữ tỷ lệ cân đối với vóc dáng người mẫu, không thu hẹp đến mức mất nhận diện tay thụng, đồng thời không phóng đại thành tay cánh dơi hay oversized fantasy sleeves. Silhouette dài, thanh thoát; bề mặt trang phục sạch và tiết chế, hạn chế tối đa hoa văn dày đặc, tránh cảm giác phục trang tuồng cổ hay sân khấu (stage costume).`;
}

/**
 * Danh sách những điều cần tránh (negative prompt) phân hóa theo từng dáng phục,
 * tuân thủ chặt chẽ VISUAL_GENERATION_GUIDE.md và đồng bộ với Allowed Visual Items model.
 */
function buildAvoidList(garmentType: string): string {
  if (garmentType === 'Áo tấc') {
    return (
      `Những điều cần tránh:\n` +
      `- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon).\n` +
      `- Không nhầm sang qipao / cheongsam hoặc hanfu.\n` +
      `- Không biến thành trang phục kỳ ảo (fantasy costume), tuồng cổ hoặc trang phục biểu diễn sân khấu (stage costume).\n` +
      `- Không thu hẹp tay áo làm mất nhận diện tay rộng/thụng; không phóng đại tay thành dạng cánh dơi hoặc oversized fantasy sleeves.\n` +
      `- Tránh hoa văn hoặc chi tiết thêu thùa phủ kín dày đặc trên bề mặt tà áo.\n` +
      `- Không để màu phụ hoặc màu điểm nhấn chiếm diện tích quá lớn lấn át màu chủ đạo.\n` +
      `- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.`
    );
  }

  if (garmentType === 'Áo ngũ thân tay chẽn') {
    return (
      `Những điều cần tránh:\n` +
      `- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon fit).\n` +
      `- Không nhầm lẫn với qipao / cheongsam, hanfu, trang phục biểu diễn sân khấu (stage costume) hoặc fantasy costume.\n` +
      `- Tránh tay áo fantasy quá rộng, tay loe và trang trí thêu thùa hoa văn quá mức; không làm mất đặc điểm tay thu về cổ tay.\n` +
      `- Không để màu phụ hoặc màu điểm nhấn lấn át diện tích của màu chủ đạo.\n` +
      `- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.`
    );
  }

  // Áo tứ thân
  return (
    `Những điều cần tránh:\n` +
    `- Tuyệt đối không biến thành áo dài hiện đại, qipao / cheongsam hoặc hanfu.\n` +
    `- Không biến tấu thành trang phục biểu diễn sân khấu hở hang (stage costume) hoặc fantasy costume.\n` +
    `- Không dùng chất liệu xuyên thấu hoặc cách điệu làm mất nhận diện hai vạt trước riêng/mở.\n` +
    `- Không tự tiện thêm phụ kiện Quan họ (nón quai thao, khăn mỏ quạ, yếm...) nếu không có trong danh sách được phép.\n` +
    `- Không để màu điểm nhấn chiếm diện tích quá lớn.\n` +
    `- Không tự ý thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ chụp ảnh nào ngoài danh sách được phép.`
  );
}

/**
 * Chuyển đổi dữ liệu bản phối AC và yêu cầu gốc thành prompt tạo hình ảnh chi tiết,
 * viết chủ yếu bằng tiếng Việt tự nhiên, giữ các thuật ngữ thời trang quốc tế hữu ích.
 * Tuân thủ đầy đủ đặc tả kỹ thuật trong docs/VISUAL_GENERATION_GUIDE.md.
 */
export function buildImagePrompt(
  recommendation: ACOutfitRecommendation,
  originalRequest?: OriginalRequest | null
): string {
  const { garmentType, conceptName, colorPalette, accessories, giu } = recommendation;
  const promptSections: string[] = [];

  // 1. Hình ảnh cần tạo
  promptSections.push(
    `Hãy tạo một hình ảnh thời trang toàn thân (full-body, realistic fashion visualization) của một người mẫu trẻ mặc ${garmentType}, thể hiện concept "${conceptName}".`
  );

  // 2. Đặc điểm nhận diện cốt lõi cần giữ (Phân định rõ Observable vs Structural)
  if (giu && giu.length > 0) {
    const { observable, structural } = categorizeGiu(garmentType, giu);
    const giuSubsections: string[] = ['Đặc điểm nhận diện cốt lõi cần giữ:'];

    if (observable.length > 0) {
      giuSubsections.push(
        `- Đặc điểm cần thể hiện rõ trong hình ảnh:\n` +
          observable.map((item) => `  + ${item}`).join('\n')
      );
    }

    if (structural.length > 0) {
      giuSubsections.push(
        `- Đặc điểm cấu trúc cần được tôn trọng trong thiết kế (không cần tạo chi tiết giả hay góc nhìn phi tự nhiên để cố chứng minh những phần không thể quan sát đầy đủ từ một góc chụp thời trang đơn):\n` +
          structural.map((item) => `  + ${item}`).join('\n')
      );
    }

    const visualGuidance = buildGarmentVisualGuidance(garmentType);
    giuSubsections.push(visualGuidance);

    promptSections.push(giuSubsections.join('\n'));
  }

  // 3. Phong cách và mức độ hiện đại (Mapping 5 dải định hướng styling, không phải thước đo lịch sử)
  const style = originalRequest?.style || 'Thanh lịch';
  const occasion = originalRequest?.occasion || (recommendation.suitableOccasions?.[0] ?? 'Dạo phố / Chụp ảnh');
  const modernityLevel = originalRequest?.modernityLevel ?? 50;
  const modernityGuidance = getModernityGuidance(modernityLevel);

  promptSections.push(
    `Phong cách & Định hướng hiện đại:\n` +
      `- Phong cách tổng thể: ${style}, phù hợp cho bối cảnh ${occasion}.\n` +
      `- ${modernityGuidance}`
  );

  // 4. Bảng màu và cách phân bổ tỷ lệ màu
  promptSections.push(buildColorDistribution(colorPalette));

  // 5. Phụ kiện / vật phẩm được phép xuất hiện (Allowed visual items model)
  promptSections.push(buildAllowedVisualItemsSection(accessories));

  // 6. Yêu cầu người mẫu và bố cục (Bắt buộc toàn thân theo Section 8 của Guide)
  promptSections.push(
    `Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):\n` +
      `- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng trong khung hình đủ xa, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.\n` +
      `- Tuyệt đối không crop mất chân, không crop dưới đầu gối, không crop ngang hông hoặc crop mất tay, không tạo ảnh bán thân (half-body/medium shot).\n` +
      `- Tỷ lệ cơ thể tự nhiên; silhouette trang phục phải rõ ràng và dễ quan sát; không để tay áo, tóc dài hoặc phụ kiện che khuất cấu trúc phom dáng chính của áo.\n` +
      `- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.\n` +
      `- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.`
  );

  // 7. Cảm nhận chất liệu bề mặt (Trung tính, không bịa lịch sử)
  promptSections.push(
    `Cảm nhận chất liệu bề mặt:\n` +
      `- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng nhựa, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được (wearable).`
  );

  // 8. Những điều cần tránh (riêng biệt theo từng dáng phục)
  promptSections.push(buildAvoidList(garmentType));

  return promptSections.join('\n\n');
}
