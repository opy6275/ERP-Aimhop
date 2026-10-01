import React from "react";

interface AimHopLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  layout?: "horizontal" | "vertical";
  variant?: "colored" | "white";
  useBrandImage?: boolean;
}

export function AimHopLogo({
  className = "",
  size = 38,
  showText = true,
  layout = "horizontal",
  variant = "colored",
  useBrandImage = true,
}: AimHopLogoProps) {
  const isVertical = layout === "vertical";
  const textColor = variant === "white" ? "text-white" : "text-slate-900";
  const subtextColor = variant === "white" ? "text-slate-300" : "text-slate-500";

  return (
    <div
      className={`inline-flex ${
        isVertical ? "flex-col items-center text-center" : "items-center"
      } gap-2.5 select-none ${className}`}
    >
      {/* Official AimHop Emblem or Geometric Diamond */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center"
      >
        {useBrandImage ? (
          <img
            src="/brand-logo.png"
            alt="AimHop Logo"
            className="w-full h-full object-contain drop-shadow-sm select-none"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
          >
            <defs>
              <linearGradient id="aimhop-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            <rect
              x="20"
              y="20"
              width="60"
              height="60"
              rx="14"
              transform="rotate(45 50 50)"
              fill="url(#aimhop-grad-1)"
            />
            <rect
              x="32"
              y="32"
              width="36"
              height="36"
              rx="8"
              transform="rotate(45 50 50)"
              fill="#FFFFFF"
            />
            <rect
              x="40"
              y="40"
              width="20"
              height="20"
              rx="4"
              transform="rotate(45 50 50)"
              fill="url(#aimhop-grad-1)"
            />
          </svg>
        )}
      </div>

      {showText && (
        <div className={`flex flex-col ${isVertical ? "items-center" : "items-start"} leading-tight`}>
          <div className="flex items-baseline">
            <span
              className={`font-black tracking-tight ${textColor}`}
              style={{ fontSize: size * 0.58 }}
            >
              AimHop
            </span>
            <span
              className="font-black text-orange-500"
              style={{ fontSize: size * 0.65 }}
            >
              .
            </span>
          </div>
          <span
            className={`font-extrabold tracking-[0.24em] uppercase ${subtextColor}`}
            style={{ fontSize: Math.max(8, size * 0.2) }}
          >
            TECHNOLOGIES
          </span>
        </div>
      )}
    </div>
  );
}
