import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Film, Star, MessageSquare, RefreshCw, Lightbulb } from 'lucide-react';
import { Movie } from '../types';
import Markdown from 'react-markdown';

interface AIAnalystViewProps {
  selectedMovieForAI: Movie | null;
  onClearSelectedMovie: () => void;
}

export const AIAnalystView: React.FC<AIAnalystViewProps> = ({
  selectedMovieForAI,
  onClearSelectedMovie,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: '你好！我是基于 Gemini 3.6 Flash 的豆瓣电影 AI 数据分析师。你可以让我根据 SQLite 数据库内的豆瓣高分电影生成推荐榜单、分析某种类型的影史变迁，或者深度解析特定电影与导演风格。请问有什么想了解的？',
    },
  ]);

  const presetQuestions = [
    '🌟 基于电影数据库，推荐5部9.0分以上的不容错过的烧脑悬疑神作',
    '📈 分析豆瓣高分电影中，近30年中国大陆、香港与日本电影在类型上的变迁趋势',
    '🎬 周星驰、宫崎骏与诺兰三位知名导演作品的口碑评定与受众评分特征分析',
    '🍿 帮我推荐适合周末晚上与亲友一起观看的温馨治愈系高分电影',
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user' as const, text: query };
    setChatHistory((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          movieId: selectedMovieForAI ? selectedMovieForAI.id : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI 分析生成失败');
      }

      setChatHistory((prev) => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: `⚠️ 生成失败: ${err.message || '网络问题或未设置 GEMINI_API_KEY'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Gemini 3.6 Flash AI 智能影评与数据洞察</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            结合 SQLite 数据库内豆瓣电影数据与大语言模型，实时分析口碑结构与智能算法推荐
          </p>
        </div>

        {selectedMovieForAI && (
          <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs text-purple-300">
            <Film className="w-4 h-4 text-purple-400" />
            <span>当前选中: <strong>{selectedMovieForAI.title}</strong></span>
            <button
              onClick={onClearSelectedMovie}
              className="ml-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {presetQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(q)}
            disabled={loading}
            className="p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 rounded-xl text-left transition-colors flex items-start space-x-2"
          >
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{q}</span>
          </button>
        ))}
      </div>

      {/* Chat Display Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl min-h-[420px] flex flex-col justify-between">
        <div className="space-y-4 max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs max-w-3xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-100'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200'
                }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="markdown-body text-slate-200">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs p-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>Gemini AI 正在智能检索与撰写深度报告...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              selectedMovieForAI
                ? `针对《${selectedMovieForAI.title}》提问，例如：分析其5星高评分的剧情亮点...`
                : '输入想要分析的电影话题、类型偏好或数据疑问...'
            }
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-purple-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </form>
      </div>
    </div>
  );
};
