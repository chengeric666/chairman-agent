import React from "react";

interface TuringFlowLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * TuringFlow Logo - 董智智能知识平台
 * 蓝色鲨鱼图标，象征智慧与速度
 */
export function TuringFlowLogo({
  width = 32,
  height = 32,
  className,
}: TuringFlowLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={width}
      height={height}
      className={className}
    >
      {/* 鲨鱼身体 - 流线型设计 */}
      <defs>
        <linearGradient id="sharkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="finGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* 鲨鱼主体 */}
      <path
        d="M15 50
           Q 25 35, 45 32
           Q 60 30, 75 38
           Q 88 45, 90 50
           Q 88 55, 75 62
           Q 60 70, 45 68
           Q 25 65, 15 50 Z"
        fill="url(#sharkGradient)"
      />

      {/* 背鳍 */}
      <path
        d="M50 32
           Q 48 15, 55 20
           Q 60 25, 58 32"
        fill="url(#finGradient)"
      />

      {/* 尾鳍 */}
      <path
        d="M15 50
           Q 5 40, 8 35
           Q 12 40, 15 50
           Q 12 60, 8 65
           Q 5 60, 15 50"
        fill="url(#finGradient)"
      />

      {/* 胸鳍 */}
      <path
        d="M55 55
           Q 50 65, 45 68
           Q 48 62, 55 55"
        fill="url(#finGradient)"
      />

      {/* 眼睛 */}
      <circle cx="78" cy="48" r="4" fill="#1E3A5F" />
      <circle cx="79" cy="47" r="1.5" fill="#FFFFFF" />

      {/* 鳃线 */}
      <path
        d="M70 45 Q 68 50, 70 55"
        stroke="#2563EB"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M66 44 Q 64 50, 66 56"
        stroke="#2563EB"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}

/**
 * TuringFlow 完整Logo（含文字）
 */
export function TuringFlowLogoFull({
  width = 180,
  height = 40,
  className,
}: TuringFlowLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <TuringFlowLogo width={height} height={height} />
      <div className="flex flex-col">
        <span
          className="text-lg font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          TuringFlow
        </span>
      </div>
    </div>
  );
}

export default TuringFlowLogo;
