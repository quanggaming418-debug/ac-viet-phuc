import React from 'react';

/**
 * AuroraBackground:
 * Provides intentional visual rhythm and hierarchy:
 * - Hero: aurora gradient is most prominent and captivating (top area).
 * - "Việt phục là gì?": near-white, calm breathing space for clean typography.
 * - "Ba dáng phục": soft, gentle ambient gradient accents around the cards.
 * - "Tìm bản phối": mostly pure white / near-white surface with only a faint ambient glow.
 */
export function AuroraBackground() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden z-0" 
      aria-hidden="true"
    >
      {/* ================= HERO LEVEL (Prominent Aurora Presence) ================= */}
      {/* Top right prominent aurora blend: Violet & Blue */}
      <div 
        className="absolute -top-[5%] -right-[8%] w-[620px] h-[620px] rounded-full blur-[130px] opacity-45"
        style={{
          background: 'radial-gradient(circle, #D9C6FF 0%, #BBD7FF 55%, transparent 75%)'
        }}
      />

      {/* Top left prominent aurora blend: Pink & Warm Yellow */}
      <div 
        className="absolute top-[3%] -left-[10%] w-[580px] h-[580px] rounded-full blur-[130px] opacity-40"
        style={{
          background: 'radial-gradient(circle, #F2C7D7 0%, #F7E3A7 50%, transparent 75%)'
        }}
      />

      {/* ================= "VIỆT PHỤC LÀ GÌ?" (Clean, near-white breathing space) ================= */}
      {/* Intentionally left clear of strong ambient orbs to create visual rhythm */}


      {/* ================= "BA DÁNG PHỤC" (Gentle, soft ambient accent) ================= */}
      {/* Mid-page subtle touch: Soft Green & Blue */}
      <div 
        className="absolute top-[48%] right-[-5%] w-[520px] h-[520px] rounded-full blur-[160px] opacity-20"
        style={{
          background: 'radial-gradient(circle, #CAE5D5 0%, #BBD7FF 60%, transparent 80%)'
        }}
      />


      {/* ================= "TÌM BẢN PHỐI" (Minimal faint glow, focused white surface) ================= */}
      {/* Bottom subtle ambient warmth: very faint warm yellow glow */}
      <div 
        className="absolute bottom-[4%] left-[15%] w-[480px] h-[480px] rounded-full blur-[180px] opacity-14"
        style={{
          background: 'radial-gradient(circle, #F7E3A7 0%, #F2C7D7 60%, transparent 80%)'
        }}
      />
    </div>
  );
}
