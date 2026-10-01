import type { ACOutfitRecommendation, OriginalRequest } from '../types/recommendation.ts';

/**
 * Tạo chỉ dẫn tạo hình tự nhiên cho mức độ hiện đại (0-100).
 * Giúp AI hiểu rõ giới hạn biến tấu styling mà không phá vỡ đặc điểm cốt lõi.
 * Siết chặt hơn cho các case truyền thống (modernity thấp).
 */
function getModernityGuidance(level: number): string {
  if (level <= 35) {
    return `Mức độ hiện đại ${level}/100: Ưu tiên tổng thể tiết chế và gần gũi với tinh thần truyền thống cổ điển. Hạn chế tối đa các biến tấu thời trang mạnh, ưu tiên bề mặt vải trơn hoặc rất ít hoa văn trang trí, không dùng phụ kiện mang cảm giác hiện đại phá cách và không tạo cảm giác fashion-forward quá mức.`;
  }
  if (level <= 70) {
    return `Mức độ hiện đại ${level}/100: Cân bằng hài hòa giữa đặc điểm nhận diện cốt lõi của trang phục và cách phối thanh lịch đương đại.`;
  }
  return `Mức độ hiện đại ${level}/100: Hiện đại hóa rõ nét ở bảng màu, phụ kiện và tinh thần styling trẻ trung, nhưng tuyệt đối không làm thay đổi các đặc điểm GIỮ cốt lõi của trang phục.`;
}

/**
 * Xây dựng mô tả phân bổ bảng màu chặt chẽ, tránh việc AI tạo ảnh chia đều 3 màu
 * hoặc để màu điểm nhấn/màu phụ lấn át diện tích trang phục chính.
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
 * Danh sách những điều cần tránh (negative prompt) phân hóa theo từng dáng phục,
 * tuân thủ chặt chẽ PROJECT_CONTEXT.md và không tự mâu thuẫn với phụ kiện hợp lệ.
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
      `- Không tự ý thêm bất kỳ đạo cụ chụp ảnh hoặc vật cầm tay nào ngoài danh sách phụ kiện đã nêu.`
    );
  }

  if (garmentType === 'Áo ngũ thân tay chẽn') {
    return (
      `Những điều cần tránh:\n` +
      `- Tuyệt đối không biến thành áo dài hiện đại chiết eo bó sát (bodycon fit).\n` +
      `- Không nhầm lẫn với qipao / cheongsam, hanfu, trang phục biểu diễn sân khấu (stage costume) hoặc fantasy costume.\n` +
      `- Tránh tay áo fantasy quá rộng, tay loe và trang trí thêu thùa hoa văn quá mức.\n` +
      `- Không để màu phụ hoặc màu điểm nhấn lấn át diện tích của màu chủ đạo.\n` +
      `- Không tự ý thêm bất kỳ đạo cụ chụp ảnh hoặc vật cầm tay nào ngoài danh sách phụ kiện đã nêu.`
    );
  }

  // Áo tứ thân
  return (
    `Những điều cần tránh:\n` +
    `- Tuyệt đối không biến thành áo dài hiện đại, qipao / cheongsam hoặc hanfu.\n` +
    `- Không biến tấu thành trang phục biểu diễn sân khấu hở hang (stage costume) hoặc fantasy costume.\n` +
    `- Không dùng chất liệu xuyên thấu hoặc cách điệu sai lệch cấu trúc bốn thân.\n` +
    `- Không để màu điểm nhấn chiếm diện tích quá lớn.\n` +
    `- Không tự ý thêm bất kỳ đạo cụ chụp ảnh hoặc vật cầm tay nào ngoài danh sách phụ kiện đã nêu.`
  );
}

/**
 * Chuyển đổi dữ liệu bản phối AC và yêu cầu gốc thành prompt tạo hình ảnh chi tiết,
 * viết chủ yếu bằng tiếng Việt tự nhiên, giữ các thuật ngữ thời trang quốc tế hữu ích.
 * Bảo toàn 100% cultural guardrails và cấu trúc whitelist của AC.
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

  // 2. Đặc điểm nhận diện cốt lõi cần giữ (chỉ lấy từ recommendation.giu)
  if (giu && giu.length > 0) {
    const giuList = giu.map((item) => `- ${item}`).join('\n');
    let section2 = `Đặc điểm nhận diện cốt lõi cần giữ trên trang phục:\n${giuList}`;

    // Chỉ dẫn tạo hình đặc thù cho Áo tấc (ưu tiên tay rộng/thụng và silhouette dài trang trọng)
    if (garmentType === 'Áo tấc') {
      section2 +=
        `\n- Định hướng thị giác cho Áo tấc: Tay rộng/thụng phải là đặc điểm dễ nhận thấy ngay khi nhìn toàn thân. Tay cần rộng rõ hơn tay áo dài hiện đại thông thường nhưng vẫn giữ tỷ lệ cân đối với vóc dáng người mẫu, tuyệt đối không thu hẹp đến mức mất nhận diện tay thụng, đồng thời không phóng đại thành tay cánh dơi hay oversized fantasy sleeves. Silhouette dài, trang trọng, thanh thoát; bề mặt trang phục sạch và tiết chế, hạn chế tối đa hoa văn dày đặc để giữ vẻ đẹp đời thực tinh tế, tránh cảm giác phục trang tuồng cổ hay sân khấu (stage costume).`;
    }

    promptSections.push(section2);
  }

  // 3. Phong cách và mức độ hiện đại
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

  // 5. Tách rõ: Phụ kiện mặc trên người & Đạo cụ cầm tay / bối cảnh (Không tự mâu thuẫn)
  const accList = accessories && accessories.length > 0 ? accessories.join(', ') : 'Tối giản, không có phụ kiện rườm rà';
  promptSections.push(
    `Phụ kiện trang phục & Kiểm soát đạo cụ:\n` +
      `- Phụ kiện mặc trên người / đi kèm: ${accList}.\n` +
      `- Đạo cụ cầm tay & Chi tiết bối cảnh: Không có. Chỉ sử dụng đúng các phụ kiện đã liệt kê ở trên; tuyệt đối không tự thêm bất kỳ phụ kiện, vật cầm tay hoặc đạo cụ bối cảnh nào khác ngoài danh sách này (kể cả trong bối cảnh kỷ yếu, tốt nghiệp, lễ Tết hay sự kiện đặc biệt, không tự thêm bằng tốt nghiệp, mũ cử nhân, hoa cầm tay, sách vở hay đạo cụ chụp ảnh).`
  );

  // 6. Yêu cầu người mẫu và bố cục (Siết chặt full-body)
  promptSections.push(
    `Yêu cầu người mẫu & bố cục hình ảnh (Bắt buộc toàn thân):\n` +
      `- Bắt buộc là ảnh toàn thân (full-body shot): Người mẫu đứng thẳng hoặc tư thế tự nhiên, hiển thị trọn vẹn từ đỉnh đầu xuống tới gót chân, nhìn thấy rõ cả hai bàn chân / giày / hài.\n` +
      `- Tuyệt đối không crop mất chân, không crop ngang hông hoặc dưới đầu gối, không tạo ảnh bán thân (half-body).\n` +
      `- Tỷ lệ cơ thể tự nhiên; không để tay áo rộng, tóc dài hoặc phụ kiện che khuất các đặc điểm nhận diện chính của phom dáng áo.\n` +
      `- Phong cách hình ảnh: Realistic fashion visualization, editorial fashion photography.\n` +
      `- Bối cảnh: Clean studio background tông màu sáng nhã nhặn, ánh sáng mềm khuếch tán (soft diffused lighting), không đưa thêm các đạo cụ hay chi tiết phông nền phức tạp làm nhiễu trang phục.`
  );

  // 7. Cảm nhận chất liệu bề mặt
  promptSections.push(
    `Cảm nhận chất liệu bề mặt:\n` +
      `- Bề mặt vải tự nhiên, có độ rủ và độ đứng phom hợp lý, mềm mại và không bóng lộn, tạo cảm giác một bộ trang phục thời trang thực tế có thể mặc được.`
  );

  // 8. Những điều cần tránh (riêng biệt theo từng dáng phục)
  promptSections.push(buildAvoidList(garmentType));

  return promptSections.join('\n\n');
}
