export type ModernityBand = 'traditional' | 'balanced' | 'contemporary';

export interface VisualExample {
  garmentType: 'Áo ngũ thân tay chẽn' | 'Áo tứ thân' | 'Áo tấc';
  modernityBand: ModernityBand;
  imageSrc: string;
  alt: string;
  bandLabel: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

/**
 * Phân chia mức độ hiện đại (0-100) thành 3 dải cảm quan:
 * 0–35: Truyền thống hơn
 * 36–70: Cân bằng
 * 71–100: Hiện đại hơn
 */
export function getModernityBand(level: number): ModernityBand {
  if (level <= 35) return 'traditional';
  if (level <= 70) return 'balanced';
  return 'contemporary';
}

export function getModernityBandLabel(band: ModernityBand): string {
  switch (band) {
    case 'traditional':
      return 'Định hướng truyền thống (0–35)';
    case 'balanced':
      return 'Định hướng cân bằng (36–70)';
    case 'contemporary':
      return 'Định hướng hiện đại (71–100)';
  }
}

/**
 * Danh mục ảnh minh họa mẫu của AC.
 * NGUYÊN TẮC: Không dùng mock image hoặc placeholder giả.
 * Các vị trí chưa có asset thật đã kiểm tra sẽ để imageSrc rỗng ('').
 * UI chỉ render hình ảnh minh họa khi imageSrc có giá trị thực tế hợp lệ.
 */
export const VISUAL_EXAMPLES: VisualExample[] = [
  // 1. Áo ngũ thân tay chẽn
  {
    garmentType: 'Áo ngũ thân tay chẽn',
    modernityBand: 'traditional',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo ngũ thân tay chẽn theo phong cách truyền thống',
    bandLabel: 'Truyền thống hơn',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
  {
    garmentType: 'Áo ngũ thân tay chẽn',
    modernityBand: 'balanced',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo ngũ thân tay chẽn kết hợp cân bằng giữa cổ điển và đương đại',
    bandLabel: 'Cân bằng',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
  {
    garmentType: 'Áo ngũ thân tay chẽn',
    modernityBand: 'contemporary',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo ngũ thân tay chẽn theo phong cách hiện đại tối giản',
    bandLabel: 'Hiện đại hơn',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },

  // 2. Áo tứ thân
  {
    garmentType: 'Áo tứ thân',
    modernityBand: 'traditional',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo tứ thân phom dáng truyền thống mộc mạc',
    bandLabel: 'Truyền thống hơn',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
  {
    garmentType: 'Áo tứ thân',
    modernityBand: 'balanced',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo tứ thân phối màu thanh nhã đương đại',
    bandLabel: 'Cân bằng',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
  {
    garmentType: 'Áo tứ thân',
    modernityBand: 'contemporary',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo tứ thân ứng dụng phong cách tối giản',
    bandLabel: 'Hiện đại hơn',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },

  // 3. Áo tấc
  {
    garmentType: 'Áo tấc',
    modernityBand: 'traditional',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo tấc tay thụng phom dáng truyền thống trang nghiêm',
    bandLabel: 'Truyền thống hơn',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
  {
    garmentType: 'Áo tấc',
    modernityBand: 'balanced',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo tấc phối màu nhã nhặn cho dịp lễ hội đương đại',
    bandLabel: 'Cân bằng',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
  {
    garmentType: 'Áo tấc',
    modernityBand: 'contemporary',
    imageSrc: '', // Chờ asset thật được kiểm tra văn hóa
    alt: 'Minh họa Áo tấc kết hợp phụ kiện và màu sắc trẻ trung',
    bandLabel: 'Hiện đại hơn',
    sourceLabel: 'AC Archive (Đang cập nhật)',
  },
];

/**
 * Tìm ảnh minh họa mẫu theo loại trang phục và mức độ hiện đại.
 * Chỉ trả về khi asset thực sự tồn tại (chuỗi imageSrc không rỗng).
 */
export function getVisualExample(
  garmentType: string,
  modernityLevel: number
): VisualExample | null {
  const band = getModernityBand(modernityLevel);
  const match = VISUAL_EXAMPLES.find(
    (ex) => ex.garmentType === garmentType && ex.modernityBand === band
  );

  if (match && match.imageSrc && match.imageSrc.trim() !== '') {
    return match;
  }
  return null;
}
