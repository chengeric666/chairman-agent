'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Shield, Lock } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Footer } from '@/components/layout/Footer'

export function LoginForm() {
  const [password, setPassword] = useState('')
  const [mounted, setMounted] = useState(false)
  const { login, isLoading, error } = useAuth()
  const { authRequired, checkAuthRequired, hasHydrated, isAuthenticated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [configInfo, setConfigInfo] = useState<{ apiUrl: string; version: string; buildTime: string } | null>(null)
  const router = useRouter()

  // Mount animation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load config info for debugging
  useEffect(() => {
    getConfig().then(cfg => {
      setConfigInfo({
        apiUrl: cfg.apiUrl,
        version: cfg.version,
        buildTime: cfg.buildTime,
      })
    }).catch(err => {
      console.error('Failed to load config:', err)
    })
  }, [])

  // Check if authentication is required on mount
  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const checkAuth = async () => {
      try {
        const required = await checkAuthRequired()

        // If auth is not required, redirect to notebooks
        if (!required) {
          router.push('/notebooks')
        }
      } catch (error) {
        console.error('Error checking auth requirement:', error)
        // On error, assume auth is required to be safe
      } finally {
        setIsCheckingAuth(false)
      }
    }

    // If we already know auth status, use it
    if (authRequired !== null) {
      if (!authRequired && isAuthenticated) {
        router.push('/notebooks')
      } else {
        setIsCheckingAuth(false)
      }
    } else {
      void checkAuth()
    }
  }, [hasHydrated, authRequired, checkAuthRequired, router, isAuthenticated])

  // Show loading while checking if auth is required
  if (!hasHydrated || isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    )
  }

  // If we still don't know if auth is required (connection error), show error
  if (authRequired === null) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl border border-slate-200/60">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-xl text-slate-900">连接错误</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                无法连接到API服务器
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {error || '无法连接到服务器，请检查API服务是否正常运行。'}
                  </div>
                </div>

                <Button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  重新连接
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      try {
        await login(password)
      } catch (error) {
        console.error('Unhandled error during login:', error)
        // The auth store should handle most errors, but this catches any unhandled ones
      }
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        @keyframes morph {
          0%, 100% {
            d: path('M0,100 C150,120 350,80 500,100 L500,0 L0,0 Z');
          }
          50% {
            d: path('M0,80 C150,100 350,60 500,80 L500,0 L0,0 Z');
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(3deg);
          }
          66% {
            transform: translate(-20px, -15px) rotate(-2deg);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 20px) scale(1.05);
          }
        }

        @keyframes fade-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.6));
          }
        }

        .login-animate {
          animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .login-animate-delay {
          opacity: 0;
          animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
        }

        .organic-shape-1 {
          animation: float-slow 20s ease-in-out infinite;
        }

        .organic-shape-2 {
          animation: float-slower 25s ease-in-out infinite;
          animation-delay: -5s;
        }

        .tech-font {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }

        .input-elegant-focus:focus {
          outline: none;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.12),
            0 1px 3px rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
        {/* Immersive Flow Field - Full-width organic waves inspired by TuringFlow circulation */}

        {/* Top wave - Full width, cyan/blue flowing from sky */}
        <svg className="absolute top-0 left-0 w-full h-1/3 opacity-40 organic-shape-1" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="top-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
              <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.25 }} />
            </linearGradient>
          </defs>
          <path d="M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z" fill="url(#top-gradient)">
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z;
                M0,0 L0,200 Q300,240 600,220 T1200,200 L1200,0 Z;
                M0,0 L0,240 Q300,280 600,260 T1200,240 L1200,0 Z;
                M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z
              "
            />
          </path>
        </svg>

        {/* Bottom wave - Full width, indigo/purple flowing from earth */}
        <svg className="absolute bottom-0 left-0 w-full h-1/3 opacity-35 organic-shape-2" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bottom-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          <path d="M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z" fill="url(#bottom-gradient)">
            <animate
              attributeName="d"
              dur="18s"
              repeatCount="indefinite"
              values="
                M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z;
                M0,400 L0,160 Q300,120 600,140 T1200,160 L1200,400 Z;
                M0,400 L0,200 Q300,160 600,180 T1200,200 L1200,400 Z;
                M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z
              "
            />
          </path>
        </svg>

        {/* Left vertical accent curve - for visual balance */}
        <svg className="absolute left-0 top-1/4 h-1/2 w-1/6 opacity-25" viewBox="0 0 200 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="left-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#14b8a6', stopOpacity: 0.35 }} />
              <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.15 }} />
            </linearGradient>
          </defs>
          <path d="M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z" fill="url(#left-gradient)">
            <animate
              attributeName="d"
              dur="15s"
              repeatCount="indefinite"
              values="
                M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z;
                M0,0 Q80,150 100,300 Q80,450 0,600 L0,0 Z;
                M0,0 Q90,150 70,300 Q70,450 0,600 L0,0 Z;
                M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z
              "
            />
          </path>
        </svg>

        {/* Right subtle accent curve - for balance */}
        <svg className="absolute right-0 top-1/3 h-2/5 w-1/8 opacity-20" viewBox="0 0 150 500" preserveAspectRatio="none">
          <defs>
            <linearGradient id="right-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.15 }} />
            </linearGradient>
          </defs>
          <path d="M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z" fill="url(#right-gradient)">
            <animate
              attributeName="d"
              dur="20s"
              repeatCount="indefinite"
              values="
                M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z;
                M150,0 Q70,125 50,250 Q70,375 150,500 L150,0 Z;
                M150,0 Q60,125 80,250 Q80,375 150,500 L150,0 Z;
                M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z
              "
            />
          </path>
        </svg>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md">
            {/* Logo and Brand - horizontal alignment */}
            <div className={`flex items-center justify-center gap-4 mb-6 ${mounted ? 'login-animate' : 'opacity-0'}`}>
              <img
                src="/turingflow-logo.png"
                alt="TuringFlow"
                className="h-14 w-auto"
              />
              <div className="relative">
                <h1 className="text-5xl font-bold text-slate-900 tech-font tracking-tight">
                  董智
                </h1>
                {/* Organic flowing underline */}
                <svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                      <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path d="M0,4 Q25,2 50,4 T100,4" stroke="url(#underline-gradient)" strokeWidth="2" fill="none">
                    <animate
                      attributeName="d"
                      dur="4s"
                      repeatCount="indefinite"
                      values="
                        M0,4 Q25,2 50,4 T100,4;
                        M0,4 Q25,6 50,4 T100,4;
                        M0,4 Q25,2 50,4 T100,4
                      "
                    />
                  </path>
                </svg>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 tech-font mb-8 font-medium">
              智能知识管理平台
            </p>

            {/* Login Card */}
            <Card className={`bg-white/90 backdrop-blur-sm shadow-2xl border border-slate-200/60 overflow-hidden relative ${mounted ? 'login-animate-delay' : 'opacity-0'}`}>
              {/* Organic wave accent on card top */}
              <svg className="absolute top-0 left-0 w-full h-2" viewBox="0 0 400 8" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="card-accent" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                    <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 0.6 }} />
                    <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                  </linearGradient>
                </defs>
                <path d="M0,4 Q100,2 200,4 T400,4" stroke="url(#card-accent)" strokeWidth="3" fill="none">
                  <animate
                    attributeName="d"
                    dur="5s"
                    repeatCount="indefinite"
                    values="
                      M0,4 Q100,2 200,4 T400,4;
                      M0,4 Q100,6 200,4 T400,4;
                      M0,4 Q100,2 200,4 T400,4
                    "
                  />
                </path>
              </svg>

              <CardHeader className="space-y-1 pb-4 pt-6">
                <CardTitle className="text-2xl text-slate-900 tech-font font-semibold">
                  登录
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 tech-font">
                  输入密码访问您的知识库
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 tech-font focus:border-blue-500 input-elegant-focus transition-all duration-300"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-3 tech-font">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white tech-font font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    disabled={isLoading || !password.trim()}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        登录中...
                      </span>
                    ) : '登录'}
                  </Button>

                  {/* Security indicator */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-green-700 font-medium tech-font" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                        <Shield className="h-4 w-4" />
                        <span>安全登录</span>
                      </div>
                      <div className="w-px h-4 bg-slate-300"></div>
                      <div className="flex items-center gap-2 text-slate-600 tech-font">
                        <Lock className="h-4 w-4" />
                        <span>数据加密</span>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Organic flowing dots */}
            <div className="mt-6 flex justify-center gap-2">
              <svg width="32" height="8" viewBox="0 0 32 8">
                <circle cx="4" cy="4" r="2" fill="#60a5fa" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="16" cy="4" r="2" fill="#60a5fa" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="28" cy="4" r="2" fill="#60a5fa" opacity="0.2">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.6s" />
                </circle>
              </svg>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
