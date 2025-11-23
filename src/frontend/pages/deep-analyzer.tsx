/**
 * DeepAnalyzer - 深度分析页面
 * 基于OpenDeepResearch的思想体系化和深度研究工具
 */

import React, { useState, useEffect } from 'react';

interface AnalysisRequest {
  topic: string;
  analysis_type: 'systemize' | 'meeting' | 'principles' | 'connections' | 'research';
  depth: 'shallow' | 'moderate' | 'deep' | 'expert';
  scope: 'narrow' | 'broad' | 'systematic' | 'comparative';
  context?: string;
}

interface AnalysisResult {
  task_id: string;
  summary: string;
  results: {
    core_findings: string[];
    detailed_analysis: string;
    framework: string;
    implications: string;
  };
  insights: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    action_items: string[];
  }>;
  sources: Array<{
    title: string;
    relevance: number;
    excerpt: string;
  }>;
  quality_metrics: {
    coverage: number;
    depth: number;
    relevance: number;
    accuracy: number;
  };
}

const DeepAnalyzerPage: React.FC = () => {
  // 状态管理
  const [request, setRequest] = useState<AnalysisRequest>({
    topic: '',
    analysis_type: 'systemize',
    depth: 'moderate',
    scope: 'systematic'
  });

  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 启动分析
  const handleStartAnalysis = async () => {
    if (!request.topic.trim()) {
      alert('请输入分析主题');
      return;
    }

    setLoading(true);
    setStatus('processing');
    setProgress(0);

    try {
      const response = await fetch('/api/analyze/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const data = await response.json();
        setTaskId(data.task_id);
        // 开始轮询状态
        pollStatus(data.task_id);
      } else {
        setStatus('error');
        alert('启动分析失败');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      alert('启动分析时出错');
    } finally {
      setLoading(false);
    }
  };

  // 轮询任务状态
  const pollStatus = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analyze/status/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);

          if (data.status === 'completed') {
            clearInterval(pollInterval);
            setStatus('completed');
            // 获取完整结果
            getResults(id);
          } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            setStatus('error');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // 每2秒检查一次

    // 60秒后停止轮询
    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  // 获取完整结果
  const getResults = async (id: string) => {
    try {
      const response = await fetch(`/api/analyze/results/${id}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  // 生成分析类型标签
  const analysisTypeLabels: Record<string, string> = {
    systemize: '思想体系化',
    meeting: '会议分析',
    principles: '原则提取',
    connections: '思想关联',
    research: '综合研究'
  };

  // 生成深度标签
  const depthLabels: Record<string, string> = {
    shallow: '浅层',
    moderate: '中等',
    deep: '深度',
    expert: '专家级'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔍 开智深度分析
          </h1>
          <p className="text-slate-600">
            AI驱动的思想体系化和深度研究工具
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：分析配置 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4 sticky top-8">
              <h2 className="text-xl font-semibold text-slate-800">
                分析配置
              </h2>

              {/* 分析主题 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  分析主题 *
                </label>
                <input
                  type="text"
                  placeholder="例如: 人才战略的演进"
                  value={request.topic}
                  onChange={(e) =>
                    setRequest({ ...request, topic: e.target.value })
                  }
                  disabled={status === 'processing'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
              </div>

              {/* 分析类型 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  分析类型
                </label>
                <select
                  value={request.analysis_type}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      analysis_type: e.target.value as any
                    })
                  }
                  disabled={status === 'processing'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="systemize">思想体系化</option>
                  <option value="meeting">会议分析</option>
                  <option value="principles">原则提取</option>
                  <option value="connections">思想关联</option>
                  <option value="research">综合研究</option>
                </select>
              </div>

              {/* 分析深度 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  分析深度
                </label>
                <select
                  value={request.depth}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      depth: e.target.value as any
                    })
                  }
                  disabled={status === 'processing'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="shallow">浅层分析</option>
                  <option value="moderate">中等深度</option>
                  <option value="deep">深度分析</option>
                  <option value="expert">专家级分析</option>
                </select>
              </div>

              {/* 分析范围 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  分析范围
                </label>
                <select
                  value={request.scope}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      scope: e.target.value as any
                    })
                  }
                  disabled={status === 'processing'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="narrow">聚焦</option>
                  <option value="broad">宽泛</option>
                  <option value="systematic">系统全面</option>
                  <option value="comparative">对比分析</option>
                </select>
              </div>

              {/* 背景信息 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  背景信息（可选）
                </label>
                <textarea
                  placeholder="补充背景信息..."
                  value={request.context}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      context: e.target.value
                    })
                  }
                  disabled={status === 'processing'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 disabled:bg-gray-100"
                />
              </div>

              {/* 启动按钮 */}
              <button
                onClick={handleStartAnalysis}
                disabled={loading || status === 'processing'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {loading
                  ? '启动中...'
                  : status === 'processing'
                  ? '分析中...'
                  : '启动分析'}
              </button>

              {/* 进度条 */}
              {status === 'processing' && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>分析进度</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：结果显示 */}
          <div className="lg:col-span-2">
            {status === 'idle' && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  准备好开始分析了吗？
                </h3>
                <p className="text-slate-600">
                  配置分析参数，点击"启动分析"开始深度研究
                </p>
              </div>
            )}

            {status === 'processing' && (
              <div className="bg-white rounded-lg shadow-md p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin">
                    <div className="text-5xl">⚙️</div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    正在进行深度分析...
                  </h3>
                  <p className="text-slate-600">
                    请耐心等待，分析可能需要 30-120 秒
                  </p>
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>整体进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'completed' && results && (
              <div className="space-y-6">
                {/* 摘要 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    📋 分析摘要
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {results.summary}
                  </p>
                </div>

                {/* 核心发现 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    💡 核心发现
                  </h3>
                  <ul className="space-y-2">
                    {results.results.core_findings.map((finding, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-indigo-600 font-bold">
                          {idx + 1}.
                        </span>
                        <span className="text-slate-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 关键洞察 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    🎯 关键洞察
                  </h3>
                  <div className="space-y-3">
                    {results.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
                      >
                        <p className="font-medium text-indigo-900">
                          {insight.title}
                        </p>
                        <p className="text-sm text-indigo-800 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 建议 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    📌 建议和行动
                  </h3>
                  <div className="space-y-4">
                    {results.recommendations.map((rec, idx) => (
                      <div key={idx} className="border-l-4 border-green-500 pl-4">
                        <p className="font-medium text-slate-800">
                          {rec.title}
                        </p>
                        <p className="text-slate-600 mt-1">{rec.description}</p>
                        <div className="mt-2 space-y-1">
                          {rec.action_items.map((item, i) => (
                            <p key={i} className="text-sm text-slate-600">
                              • {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 质量指标 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    📊 质量指标
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(results.quality_metrics).map(
                      ([key, value]) => (
                        <div key={key} className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600 mb-2">
                            {key === 'coverage'
                              ? '覆盖度'
                              : key === 'depth'
                              ? '深度'
                              : key === 'relevance'
                              ? '相关性'
                              : '准确性'}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${value * 100}%` }}
                            />
                          </div>
                          <p className="text-lg font-semibold text-slate-800">
                            {(value * 100).toFixed(0)}%
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-5xl mb-4">❌</div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  分析失败
                </h3>
                <p className="text-slate-600 mb-4">
                  分析过程中发生错误，请检查输入内容后重试
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setTaskId(null);
                    setResults(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  重新开始
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepAnalyzerPage;
