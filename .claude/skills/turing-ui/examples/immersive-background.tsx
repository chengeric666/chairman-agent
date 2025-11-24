/**
 * TuringFlow 设计系统 - 沉浸式流动背景组件
 *
 * 这是一个可复用的背景组件，包含4层有机曲线：
 * - 顶部全屏波浪（Cyan→Blue渐变）
 * - 底部全屏波浪（Indigo→Purple渐变）
 * - 左侧垂直装饰（Teal→Cyan渐变）
 * - 右侧垂直装饰（Indigo→Purple渐变）
 *
 * 使用方法：
 * <ImmersiveFlowBackground>
 *   {children}
 * </ImmersiveFlowBackground>
 */

export function ImmersiveFlowBackground({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* CSS 动画 */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(3deg); }
          66% { transform: translate(-20px, -15px) rotate(-2deg); }
        }

        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 20px) scale(1.05); }
        }

        .organic-shape-1 {
          animation: float-slow 20s ease-in-out infinite;
        }

        .organic-shape-2 {
          animation: float-slower 25s ease-in-out infinite;
          animation-delay: -5s;
        }
      `}</style>

      {/* 主容器 */}
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">

        {/* 第1层：顶部波浪 - 天空流动 */}
        <svg className="absolute top-0 left-0 w-full h-1/3 opacity-40 organic-shape-1" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="top-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
              <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.25 }} />
            </linearGradient>
          </defs>
          <path d="M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z" fill="url(#top-gradient)">
            <animate attributeName="d" dur="12s" repeatCount="indefinite"
              values="M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z;
                      M0,0 L0,200 Q300,240 600,220 T1200,200 L1200,0 Z;
                      M0,0 L0,240 Q300,280 600,260 T1200,240 L1200,0 Z;
                      M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z" />
          </path>
        </svg>

        {/* 第2层：底部波浪 - 大地流动 */}
        <svg className="absolute bottom-0 left-0 w-full h-1/3 opacity-35 organic-shape-2" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bottom-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          <path d="M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z" fill="url(#bottom-gradient)">
            <animate attributeName="d" dur="18s" repeatCount="indefinite"
              values="M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z;
                      M0,400 L0,160 Q300,120 600,140 T1200,160 L1200,400 Z;
                      M0,400 L0,200 Q300,160 600,180 T1200,200 L1200,400 Z;
                      M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z" />
          </path>
        </svg>

        {/* 第3层：左侧装饰 - 视觉平衡 */}
        <svg className="absolute left-0 top-1/4 h-1/2 w-1/6 opacity-25" viewBox="0 0 200 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="left-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#14b8a6', stopOpacity: 0.35 }} />
              <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.15 }} />
            </linearGradient>
          </defs>
          <path d="M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z" fill="url(#left-gradient)">
            <animate attributeName="d" dur="15s" repeatCount="indefinite"
              values="M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z;
                      M0,0 Q80,150 100,300 Q80,450 0,600 L0,0 Z;
                      M0,0 Q90,150 70,300 Q70,450 0,600 L0,0 Z;
                      M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z" />
          </path>
        </svg>

        {/* 第4层：右侧装饰 - 视觉平衡 */}
        <svg className="absolute right-0 top-1/3 h-2/5 w-1/8 opacity-20" viewBox="0 0 150 500" preserveAspectRatio="none">
          <defs>
            <linearGradient id="right-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.15 }} />
            </linearGradient>
          </defs>
          <path d="M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z" fill="url(#right-gradient)">
            <animate attributeName="d" dur="20s" repeatCount="indefinite"
              values="M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z;
                      M150,0 Q70,125 50,250 Q70,375 150,500 L150,0 Z;
                      M150,0 Q60,125 80,250 Q80,375 150,500 L150,0 Z;
                      M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z" />
          </path>
        </svg>

        {/* 内容区域（z-index: 10 让内容浮在背景上） */}
        <div className="flex-1 relative z-10">
          {children}
        </div>
      </div>
    </>
  )
}
