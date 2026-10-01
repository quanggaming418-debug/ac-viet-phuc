import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-[#E9E6E1]/70 py-8 px-6 text-center relative z-10">
      <p className="text-xs text-[#77736E] tracking-tight">
        AC © {new Date().getFullYear()} — Tôn trọng bản sắc, đồng hành phong cách cá nhân.
      </p>
    </footer>
  );
}
