import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp } from 'lucide-react'

/**
 * TuringFlow 设计系统 - 仪表盘卡片示例
 *
 * 特点：
 * - 半透明白色背景 + 模糊效果
 * - 顶部流动装饰线
 * - 渐变按钮
 * - 高对比度文字
 */

export function DashboardCard() {
  return (
    <>
      {/* CSS 支持 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .tech-font {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }
      `}</style>

      {/* 漂浮卡片 */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-slate-200/60 overflow-hidden relative">
        {/* 顶部流动装饰线 */}
        <svg className="absolute top-0 left-0 w-full h-2" viewBox="0 0 400 8" preserveAspectRatio="none">
          <defs>
            <linearGradient id="card-accent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          <path d="M0,4 Q100,2 200,4 T400,4" stroke="url(#card-accent)" strokeWidth="3" fill="none">
            <animate attributeName="d" dur="5s" repeatCount="indefinite"
              values="M0,4 Q100,2 200,4 T400,4;
                      M0,4 Q100,6 200,4 T400,4;
                      M0,4 Q100,2 200,4 T400,4" />
          </path>
        </svg>

        <CardHeader className="space-y-1 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-slate-900 tech-font font-semibold">
              知识库统计
            </CardTitle>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium tech-font">+12%</span>
            </div>
          </div>
          <CardDescription className="text-sm text-slate-600 tech-font">
            本周新增了 24 条笔记
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6 space-y-6">
          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 tech-font">156</div>
              <div className="text-sm text-slate-600 tech-font mt-1">总笔记</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-3xl font-bold text-indigo-600 tech-font">42</div>
              <div className="text-sm text-slate-600 tech-font mt-1">笔记本</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-3xl font-bold text-purple-600 tech-font">8</div>
              <div className="text-sm text-slate-600 tech-font mt-1">数据源</div>
            </div>
          </div>

          {/* 渐变按钮 */}
          <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white tech-font font-medium shadow-md hover:shadow-lg transition-all duration-200">
            查看详情
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
