export interface GarmentKnowledgeItem {
  garment_id: 'ngu-than-tay-chen' | 'tu-than' | 'ao-tac';
  canonical_name: 'Áo ngũ thân tay chẽn' | 'Áo tứ thân' | 'Áo tấc';
  historical_context: string;
  historical_function: string;
  identity_traits: string[];
  strongly_characteristic_traits: string[];
  styling_space: string[];
  evidence_refs: {
    title: string;
    source: string;
    note: string;
  }[];
}

export const GARMENT_KNOWLEDGE: Record<string, GarmentKnowledgeItem> = {
  'Áo ngũ thân tay chẽn': {
    garment_id: 'ngu-than-tay-chen',
    canonical_name: 'Áo ngũ thân tay chẽn',
    historical_context:
      'Được định hình và phát triển mạnh mẽ từ thời chúa Nguyễn Phúc Khoát (thế kỷ 18), sau đó trở thành quy chuẩn trang phục phổ biến cho cả nam và nữ dưới triều vua Minh Mạng (thế kỷ 19). Đây là mẫu áo phổ biến trong đời sống hàng ngày, công sở và giao tiếp xã hội của người Việt thời cận đại.',
    historical_function:
      'Trang phục thường nhật và công vụ lịch thiệp. Phom dáng gọn gàng với tay chẽn giúp người mặc cử động và làm việc thuận tiện trong khi vẫn giữ vẻ đoan trang, kín đáo.',
    identity_traits: [
      'Cấu trúc năm thân (bốn thân ngoài và một thân con lót bên trong).',
      'Cổ đứng (lập lĩnh) vuông vắn, thẳng thớm ôm vừa vòm cổ.',
      'Tay chẽn thu gọn dần từ khuỷu tay về cổ tay, ôm nhẹ không loe.',
      'Cài khuy bên nách phải theo đường chéo tự nhiên.',
      'Phom dáng suông thẳng buông tự nhiên, tuyệt đối không chiết eo ôm sát.',
    ],
    strongly_characteristic_traits: [
      'Cổ đứng/lập lĩnh',
      'Tay thu về cổ tay (tay chẽn)',
      'Phom suông truyền thống (không bodycon)',
      'Vạt cài nách phải',
    ],
    styling_space: [
      'Bảng màu linh hoạt: Từ các tông đất mộc mạc đến các gam màu pastel tươi sáng hoặc đơn sắc tối giản.',
      'Chất liệu đương đại: Lụa tơ tằm dệt trơn, đũi tự nhiên, linen cao cấp thoáng mát.',
      'Phụ kiện phối: Khăn đóng vải tối giản, giày da, đồng hồ hoặc túi xách hiện đại.',
      'Bối cảnh ứng dụng: Dạo phố văn hóa, chụp ảnh thanh lịch, công sở sáng tạo, giao lưu quốc tế.',
    ],
    evidence_refs: [
      {
        title: 'Khảo cứu trang phục triều Nguyễn',
        source: 'Nhà nghiên cứu Trần Đình Sơn (NXB Trẻ)',
        note: 'Ghi chép và hình ảnh tư liệu về quy chế trang phục thường nhật thời Nguyễn.',
      },
      {
        title: 'Ngàn Năm Áo Mũ',
        source: 'Nhà nghiên cứu Trần Quang Đức (NXB Nhã Nam)',
        note: 'Khảo cứu lịch sử trang phục Việt Nam qua các thời kỳ Lý, Trần, Lê, Nguyễn.',
      },
      {
        title: 'Hiện vật Bảo tàng Lịch sử Quốc gia',
        source: 'Bảo tàng Lịch sử Quốc gia Việt Nam',
        note: 'Bộ sưu tập áo ngũ thân tay chẽn dệt gấm và lụa thế kỷ 19 - đầu thế kỷ 20.',
      },
    ],
  },

  'Áo tứ thân': {
    garment_id: 'tu-than',
    canonical_name: 'Áo tứ thân',
    historical_context:
      'Trang phục truyền thống lâu đời gắn bó mật thiết với phụ nữ vùng đồng bằng Bắc Bộ qua nhiều thế kỷ. Mẫu áo phản ánh vẻ đẹp mộc mạc, sự đảm đang và nếp sống hài hòa cùng thiên nhiên trong các sinh hoạt làng xã và lễ hội dân gian.',
    historical_function:
      'Trang phục lao động, lễ hội làng và giao tiếp cộng đồng thường nhật. Thiết kế thông minh với hai vạt trước có thể thả buông thanh thoát hoặc buộc gọn khi làm việc, kết hợp nhiều lớp giúp linh hoạt thích ứng với thời tiết.',
    identity_traits: [
      'Cấu trúc bốn thân: Hai thân sau may nối dọc sống lưng (sống áo).',
      'Hai vạt trước để riêng biệt và mở tự nhiên, có thể buông tà hoặc buộc chéo.',
      'Kết cấu trang phục nhiều lớp (layering) phối cùng áo cánh, yếm và dải yếm.',
      'Phom áo suông mềm, buông theo vóc dáng tự nhiên không bó chiết.',
    ],
    strongly_characteristic_traits: [
      'Hai vạt trước riêng biệt mở tự nhiên',
      'Sống áo ghép dọc sống lưng',
      'Cấu trúc phối nhiều lớp (áo ngoài, áo yếm, thắt lưng)',
    ],
    styling_space: [
      'Phối màu phân tầng: Lớp áo ngoài màu nhã kết hợp lớp yếm hoặc dải lụa thắt lưng tạo điểm nhấn sắc thái.',
      'Chất liệu mộc: Lụa tơ, đũi, linen tự nhiên tạo cảm giác nhẹ nhàng, bay bổng.',
      'Phụ kiện sáng tạo: Quạt nan lụa, guốc mộc, trâm cài tóc thanh thoát.',
      'Bối cảnh ứng dụng: Lễ hội dân gian, chụp ảnh nghệ thuật ngoại cảnh, biểu diễn nghệ thuật đương đại.',
    ],
    evidence_refs: [
      {
        title: 'Ngàn Năm Áo Mũ',
        source: 'Nhà nghiên cứu Trần Quang Đức (NXB Nhã Nam)',
        note: 'Phân tích nguồn gốc và sự chuyển biến của áo tứ thân qua các thời kỳ dân gian Bắc Bộ.',
      },
      {
        title: 'Tư liệu hình ảnh Phụ nữ Bắc Bộ đầu thế kỷ 20',
        source: 'Viện Viễn Đông Bác Cổ (EFEO)',
        note: 'Tư liệu nhiếp ảnh thực địa về phụ nữ Bắc Bộ mặc áo tứ thân trong sinh hoạt thường nhật.',
      },
      {
        title: 'Bộ sưu tập Trang phục Dân tộc',
        source: 'Bảo tàng Phụ nữ Việt Nam',
        note: 'Hiện vật áo tứ thân truyền thống, yếm lụa và dải bao sáp qua các thời kỳ.',
      },
    ],
  },

  'Áo tấc': {
    garment_id: 'ao-tac',
    canonical_name: 'Áo tấc',
    historical_context:
      'Là thể thức lễ phục trang trọng thuộc hệ ngũ thân triều Nguyễn (thế kỷ 19 - đầu thế kỷ 20). Tên gọi "Áo tấc" bắt nguồn từ phần viền cổ và tà áo rộng đo đúng một tấc theo thước cổ xưa, được sử dụng trong các nghi lễ trang nghiêm của cả triều đình và dân gian.',
    historical_function:
      'Lễ phục trang trọng cho mọi tầng lớp (từ hoàng thân, quan lại đến thứ dân) dùng trong các nghi lễ trọng đại: Lễ tế, đại triều, lễ cưới, lễ tang, lễ mừng thọ và các dịp khánh tiết cần sự tôn nghiêm.',
    identity_traits: [
      'Thuộc hệ áo năm thân nhưng có tay áo thụng rộng hình chữ nhật buông dài đặc trưng.',
      'Vạt áo dài qua gối buông thẳng tự nhiên, không chiết eo ôm sát.',
      'Cài khuy bên nách phải, cổ áo đứng hoặc lập lĩnh chỉnh tề.',
      'Thường đi kèm với khăn đóng (khăn vấn) để hoàn thiện diện mạo lễ nghi chuẩn mực.',
    ],
    strongly_characteristic_traits: [
      'Tay thụng rộng hình chữ nhật buông dài (wide rectangular sleeves)',
      'Phom dáng dài trang trọng, buông thẳng tự nhiên (không chiết eo)',
      'Hệ cấu trúc năm thân cài nách phải',
    ],
    styling_space: [
      'Bảng màu trang nhã: Các tông màu hoàng yến, xanh thiên thanh, đỏ điều, trắng ngà hoặc gam màu pastel cao cấp.',
      'Chất liệu quý phái: Lụa trơn dệt hoa ẩn, gấm dệt nhẹ, sa tơ tằm thanh thoát.',
      'Phụ kiện đương đại: Khăn đóng lụa tối giản, kiềng bạc thanh mảnh, chuỗi ngọc hoặc quạt xếp.',
      'Bối cảnh ứng dụng: Lễ tốt nghiệp/kỷ yếu trang trọng, lễ dạm ngõ/cưới hỏi, đón Tết truyền thống, sự kiện ngoại giao văn hóa.',
    ],
    evidence_refs: [
      {
        title: 'Khâm Định Đại Nam Hội Điển Sự Lệ',
        source: 'Nội các Triều Nguyễn (NXB Thuận Hóa dịch)',
        note: 'Quy chế điển chế về quy cách áo tấc lễ phục của quan viên và dân chúng.',
      },
      {
        title: 'Bảo tàng Cổ vật Cung đình Huế',
        source: 'Trung tâm Bảo tồn Di tích Cố đô Huế',
        note: 'Bộ sưu tập hiện vật áo tấc bằng gấm sa của hoàng gia và quan lại triều Nguyễn.',
      },
      {
        title: 'Khảo cứu trang phục triều Nguyễn',
        source: 'Nhà nghiên cứu Trần Đình Sơn',
        note: 'Khảo cứu chi tiết về kích thước tay áo thụng và bối cảnh lễ nghi của Áo tấc.',
      },
    ],
  },
};

export function getGarmentKnowledge(garmentType: string): GarmentKnowledgeItem {
  return (
    GARMENT_KNOWLEDGE[garmentType] ||
    GARMENT_KNOWLEDGE['Áo ngũ thân tay chẽn']
  );
}
