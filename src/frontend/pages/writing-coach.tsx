/**
 * WritingCoach - 创作助手页面
 * 基于董智知识库的AI辅助创作工具
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface WritingCoachPageProps {
  sessionId?: string;
}

interface WritingRequest {
  topic: string;
  purpose: string;
  audience?: string;
  style?: string;
  context?: string;
}

interface SuggestionItem {
  type: string;
  suggestion: string;
  priority: string;
}

interface StyleAnalysis {
  tone: string;
  clarity: number;
  conciseness: number;
  persuasiveness: number;
}

interface StyleImprovement {
  aspect: string;
  current_score: number;
  suggestion: string;
  impact: string;
}

const WritingCoachPage: React.FC<WritingCoachPageProps> = ({ sessionId }) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'suggestions' | 'style' | 'knowledge'>('suggestions');
  const [writingRequest, setWritingRequest] = useState<WritingRequest>({
    topic: '',
    purpose: '深度分析',
    audience: '高管团队',
    style: '专业正式'
  });
  const [draftText, setDraftText] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // 获取创作建议
  const handleGetSuggestions = async () => {
    if (!writingRequest.topic.trim()) {
      alert('请输入创作主题');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/canvas/writing-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(writingRequest)
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        alert('获取建议失败，请重试');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('获取建议时出错');
    } finally {
      setLoading(false);
    }
  };

  // 分析写作风格
  const handleAnalyzeStyle = async () => {
    if (!draftText.trim()) {
      alert('请输入要分析的文本');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/canvas/style-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftText }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStyleAnalysis(data.analysis);
      } else {
        alert('风格分析失败');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('分析时出错');
    } finally {
      setLoading(false);
    }
  };

  // 清空内容
  const handleClear = () => {
    if (window.confirm('确认清空所有内容？')) {
      setDraftText('');
      setSuggestions([]);
      setStyleAnalysis(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            📝 开智创作助手
          </h1>
          <p className="text-slate-600">
            基于董智知识库的AI辅助创作平台
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：创作输入 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">
                创作信息
              </h2>

              {/* 主题输入 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  创作主题 *
                </label>
                <input
                  type="text"
                  placeholder="例如: 人才战略"
                  value={writingRequest.topic}
                  onChange={(e) =>
                    setWritingRequest({ ...writingRequest, topic: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 创作目的 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  创作目的
                </label>
                <select
                  value={writingRequest.purpose}
                  onChange={(e) =>
                    setWritingRequest({ ...writingRequest, purpose: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>深度分析</option>
                  <option>战略规划</option>
                  <option>知识总结</option>
                  <option>对外传播</option>
                </select>
              </div>

              {/* 目标读者 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  目标读者
                </label>
                <input
                  type="text"
                  placeholder="例如: 高管团队"
                  value={writingRequest.audience}
                  onChange={(e) =>
                    setWritingRequest({
                      ...writingRequest,
                      audience: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 写作风格 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  写作风格
                </label>
                <select
                  value={writingRequest.style}
                  onChange={(e) =>
                    setWritingRequest({ ...writingRequest, style: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>专业正式</option>
                  <option>对话亲切</option>
                  <option>鼓舞激励</option>
                  <option>分析深刻</option>
                </select>
              </div>

              {/* 背景信息 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  背景信息（可选）
                </label>
                <textarea
                  placeholder="补充背景信息..."
                  value={writingRequest.context}
                  onChange={(e) =>
                    setWritingRequest({
                      ...writingRequest,
                      context: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24"
                />
              </div>

              {/* 操作按钮 */}
              <button
                onClick={handleGetSuggestions}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {loading ? '处理中...' : '获取创作建议'}
              </button>
            </div>
          </div>

          {/* 右侧：编辑器和建议 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 编辑器 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                ✍️ 创作编辑器
              </h2>
              <textarea
                ref={editorRef}
                placeholder="在此输入或粘贴您的创作内容..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAnalyzeStyle}
                  disabled={loading || !draftText.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  分析风格
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  清空
                </button>
              </div>
            </div>

            {/* 选项卡 */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`flex-1 py-4 font-medium text-center transition duration-200 ${
                    activeTab === 'suggestions'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💡 创作建议
                </button>
                <button
                  onClick={() => setActiveTab('style')}
                  className={`flex-1 py-4 font-medium text-center transition duration-200 ${
                    activeTab === 'style'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎯 风格分析
                </button>
                <button
                  onClick={() => setActiveTab('knowledge')}
                  className={`flex-1 py-4 font-medium text-center transition duration-200 ${
                    activeTab === 'knowledge'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📚 相关知识
                </button>
              </div>

              {/* 建议内容 */}
              <div className="p-6">
                {activeTab === 'suggestions' && (
                  <div className="space-y-4">
                    {suggestions.length > 0 ? (
                      suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">
                              {item.type === 'content'
                                ? '📄'
                                : item.type === 'structure'
                                ? '📊'
                                : '✨'}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">
                                {item.type === 'content'
                                  ? '内容建议'
                                  : item.type === 'structure'
                                  ? '结构建议'
                                  : '风格建议'}
                              </p>
                              <p className="text-slate-600 mt-1">
                                {item.suggestion}
                              </p>
                              <span className="inline-block mt-2 text-xs font-medium px-2 py-1 bg-blue-200 text-blue-800 rounded">
                                {item.priority === 'high'
                                  ? '高优先级'
                                  : '中等优先级'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-8">
                        点击"获取创作建议"查看AI生成的建议
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'style' && (
                  <div className="space-y-4">
                    {styleAnalysis ? (
                      <>
                        {/* 风格评分 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-1">语气</p>
                            <p className="text-lg font-semibold text-slate-800">
                              {styleAnalysis.tone}
                            </p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-1">清晰度</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${styleAnalysis.clarity * 100}%`
                                }}
                              />
                            </div>
                            <p className="text-sm mt-1">
                              {(styleAnalysis.clarity * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* 改进建议 */}
                        <div>
                          <h3 className="font-medium text-slate-800 mb-3">
                            改进建议
                          </h3>
                          <div className="space-y-3">
                            {[
                              {
                                aspect: '表述清晰度',
                                suggestion:
                                  '考虑使用更具体的例子来支持观点'
                              },
                              {
                                aspect: '逻辑连贯性',
                                suggestion:
                                  '在段落之间添加过渡句子以增强连贯性'
                              }
                            ].map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                              >
                                <p className="font-medium text-amber-900">
                                  {item.aspect}
                                </p>
                                <p className="text-sm text-amber-800 mt-1">
                                  {item.suggestion}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 text-center py-8">
                        输入文本并点击"分析风格"进行分析
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'knowledge' && (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-center py-8">
                      相关知识源将在此显示
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingCoachPage;
