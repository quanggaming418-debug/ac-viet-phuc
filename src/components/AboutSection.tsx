import React from 'react';

export function AboutSection() {
  return (
    <section className="py-16 sm:py-20 relative">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Clean white surface card with delicate border and ample whitespace */}
        <div className="relative bg-[#FFFFFF] rounded-[28px] border border-[#E9E6E1] p-8 sm:p-12 md:p-14 shadow-[0_4px_20px_rgba(24,23,22,0.02)] overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#181716] tracking-tight">
              Việt phục là gì?
            </h2>

            <div className="mt-5 space-y-4 text-base sm:text-lg text-[#77736E] leading-relaxed font-normal">
              <p>
                Việt phục là cách gọi rộng cho các hình thức trang phục truyền thống của người Việt qua nhiều thời kỳ và bối cảnh. Không chỉ là quần áo, mỗi kiểu phục sức còn phản ánh thẩm mỹ, lối sống và những dấu ấn văn hóa riêng.
              </p>
              <p className="text-[#181716]/90 font-normal">
                AC giúp bạn tiếp cận những giá trị đó theo cách dễ hiểu hơn, đồng thời tìm một cách mặc phù hợp với bản thân hôm nay.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
