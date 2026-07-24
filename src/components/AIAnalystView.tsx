import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Film,
  RefreshCw,
  Lightbulb,
  Key,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Cpu,
  AlertTriangle,
  Zap,
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Movie } from '../types';
import Markdown from 'react-markdown';

interface AIAnalystViewProps {
  selectedMovieForAI: Movie | null;
  onClearSelectedMovie: () => void;
}

export interface AIModelItem {
  id: string;
  rawName: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
}

export interface ModelTestState {
  status: 'idle' | 'testing' | 'success' | 'error';
  reply?: string;
  responseTimeMs?: number;
  error?: string;
}

export const AIAnalystView: React.FC<AIAnalystViewProps> = ({
  selectedMovieForAI,
  onClearSelectedMovie,
}) => {
  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('douban_gemini_api_key') || '';
  });
  const [showKey, setShowKey] = useState<boolean>(false);

  // Models State
  const [models, setModels] = useState<AIModelItem[]>([]);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<string | null>(() => {
    return localStorage.getItem('douban_selected_ai_model') || null;
  });

  // Modal State for Model Picker
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');

  // Model Testing State
  const [testPrompt, setTestPrompt] = useState<string>('你好');
  const [testingAll, setTestingAll] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Record<string, ModelTestState>>({});

  // Chat & AI Generation State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; modelUsed?: string }>
  >([
    {
      sender: 'ai',
      text: '你好！我是豆瓣电影 AI 数据分析师。请先在上方**手动填写 Gemini API 密钥**，点击 **“选择/切换模型”** 弹窗选择并测试您的 AI 模型，即可开始智能分析与深度影评推荐。',
    },
  ]);

  const presetQuestions = [
    '🌟 基于电影数据库，推荐5部9.0分以上的不容错过的烧脑悬疑神作',
    '📈 分析豆瓣高分电影中，近30年中国大陆、香港与日本电影在类型上的变迁趋势',
    '🎬 周星驰、宫崎骏与诺兰三位知名导演作品的口碑评定与受众评分特征分析',
    '🍿 帮我推荐适合周末晚上与亲友一起观看的温馨治愈系高分电影',
  ];

  // Fetch models from backend
  const handleFetchModels = async (keyToUse?: string, autoOpenModal = false) => {
    const key = keyToUse !== undefined ? keyToUse : apiKey;
    if (!key || !key.trim()) {
      setModels([]);
      setSelectedModel(null);
      setModelsError('请先填写有效的 API 密钥');
      localStorage.removeItem('douban_gemini_api_key');
      localStorage.removeItem('douban_selected_ai_model');
      return;
    }

    setFetchingModels(true);
    setModelsError(null);

    const DEFAULT_STATIC_MODELS: AIModelItem[] = [
      { id: 'gemini-2.5-flash', rawName: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', description: '推荐：适合快速高效的文本和电影数据深度分析', supportedGenerationMethods: ['generateContent'] },
      { id: 'gemini-2.5-pro', rawName: 'models/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', description: '高阶：适合复杂的深度逻辑推理与结构化报告生成', supportedGenerationMethods: ['generateContent'] },
      { id: 'gemini-1.5-flash', rawName: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: '经典：经典快速响应模型', supportedGenerationMethods: ['generateContent'] },
      { id: 'gemini-1.5-pro', rawName: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: '经典：超大上下文深度理解模型', supportedGenerationMethods: ['generateContent'] },
    ];

    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key.trim() }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('SERVER_OFFLINE');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || '获取模型失败，请检查密钥');
      }

      const fetchedList: AIModelItem[] = data.models || [];
      setModels(fetchedList);

      // Store key in localStorage
      localStorage.setItem('douban_gemini_api_key', key.trim());

      // Auto select default model if not selected or invalid
      if (fetchedList.length > 0) {
        const exist = fetchedList.find((m) => m.id === selectedModel);
        if (!exist) {
          const defaultPreferred =
            fetchedList.find((m) => m.id.includes('2.5-flash')) ||
            fetchedList.find((m) => m.id.includes('1.5-flash')) ||
            fetchedList[0];
          setSelectedModel(defaultPreferred.id);
          localStorage.setItem('douban_selected_ai_model', defaultPreferred.id);
        }
      } else {
        setSelectedModel(null);
        localStorage.removeItem('douban_selected_ai_model');
      }

      if (autoOpenModal) {
        setIsModelModalOpen(true);
      }
    } catch (err: any) {
      if (err.message === 'SERVER_OFFLINE' || err.name === 'SyntaxError' || err.message?.includes('JSON') || err.message?.includes('fetch')) {
        setModels(DEFAULT_STATIC_MODELS);
        setSelectedModel('gemini-2.5-flash');
        localStorage.setItem('douban_gemini_api_key', key.trim());
        localStorage.setItem('douban_selected_ai_model', 'gemini-2.5-flash');
      } else {
        setModels([]);
        setSelectedModel(null);
        localStorage.removeItem('douban_selected_ai_model');
        setModelsError(err.message || '模型密钥验证错误或无法连接到 Gemini API');
      }
    } finally {
      setFetchingModels(false);
    }
  };

  // Open Model Modal
  const handleOpenModelModal = () => {
    if (!apiKey.trim()) {
      setModelsError('请先填写有效的 API 密钥');
      return;
    }

    if (models.length === 0) {
      handleFetchModels(apiKey, true);
    } else {
      setIsModelModalOpen(true);
    }
  };

  // Auto fetch models on initial mount if apiKey exists
  useEffect(() => {
    if (apiKey.trim() && models.length === 0 && !modelsError) {
      handleFetchModels(apiKey);
    }
  }, []);

  // Key input change handler
  const handleKeyChange = (val: string) => {
    setApiKey(val);
    if (!val.trim()) {
      // Key deleted/cleared by user -> invalidate models & selected model
      setModels([]);
      setSelectedModel(null);
      setModelsError(null);
      setTestResults({});
      setIsModelModalOpen(false);
      localStorage.removeItem('douban_gemini_api_key');
      localStorage.removeItem('douban_selected_ai_model');
    }
  };

  // Clear key
  const handleClearKey = () => {
    setApiKey('');
    setModels([]);
    setSelectedModel(null);
    setModelsError(null);
    setTestResults({});
    setIsModelModalOpen(false);
    localStorage.removeItem('douban_gemini_api_key');
    localStorage.removeItem('douban_selected_ai_model');
  };

  // Select model handler
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('douban_selected_ai_model', modelId);
  };

  // Single Model Test
  const testSingleModel = async (modelId: string) => {
    if (!apiKey.trim()) return;

    setTestResults((prev) => ({
      ...prev,
      [modelId]: { status: 'testing' },
    }));

    try {
      const res = await fetch('/api/ai/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: modelId,
          testPrompt: testPrompt.trim() || '你好',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('SERVER_OFFLINE');
      }

      const data = await res.json();
      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [modelId]: {
            status: 'success',
            reply: data.reply,
            responseTimeMs: data.responseTimeMs,
          },
        }));
      } else {
        throw new Error(data.error || '测试返回异常');
      }
    } catch (err: any) {
      if (err.message === 'SERVER_OFFLINE' || err.name === 'SyntaxError' || err.message?.includes('JSON') || err.message?.includes('fetch')) {
        // Fallback to direct client-side Google Gemini REST API call
        const startTime = Date.now();
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey.trim()}`;
          const directRes = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: testPrompt.trim() || '你好' }] }]
            }),
          });
          const directData = await directRes.json();
          if (!directRes.ok) {
            throw new Error(directData.error?.message || 'Gemini 密钥或模型不可用');
          }
          const replyText = directData.candidates?.[0]?.content?.parts?.[0]?.text || '模型连通成功';
          const duration = Date.now() - startTime;
          setTestResults((prev) => ({
            ...prev,
            [modelId]: {
              status: 'success',
              reply: replyText,
              responseTimeMs: duration,
            },
          }));
        } catch (directErr: any) {
          setTestResults((prev) => ({
            ...prev,
            [modelId]: {
              status: 'error',
              error: directErr.message || '网络或密钥连通失败',
            },
          }));
        }
      } else {
        setTestResults((prev) => ({
          ...prev,
          [modelId]: {
            status: 'error',
            error: err.message || '网络连接测试失败',
          },
        }));
      }
    }
  };

  // Test All Models
  const handleTestAllModels = async () => {
    if (models.length === 0 || !apiKey.trim() || testingAll) return;

    setTestingAll(true);

    const initialMap: Record<string, ModelTestState> = {};
    models.forEach((m) => {
      initialMap[m.id] = { status: 'testing' };
    });
    setTestResults((prev) => ({ ...prev, ...initialMap }));

    await Promise.all(models.map((m) => testSingleModel(m.id)));

    setTestingAll(false);
  };

  // Send Prompt to AI Analyst
  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || loading) return;

    if (!apiKey.trim()) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'user', text: query },
        {
          sender: 'ai',
          text: '⚠️ 请先在上方手动填写您的 **Gemini API 密钥**。',
        },
      ]);
      setPrompt('');
      return;
    }

    if (!selectedModel) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'user', text: query },
        {
          sender: 'ai',
          text: '⚠️ 请先在上方点击 **“选择/切换模型”** 弹窗中选择一个用于生成分析的 **AI 模型**。',
        },
      ]);
      setPrompt('');
      return;
    }

    const userMsg = { sender: 'user' as const, text: query };
    setChatHistory((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: selectedModel,
          prompt: query,
          movieId: selectedMovieForAI ? selectedMovieForAI.id : undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('SERVER_OFFLINE');
      }

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: data.response, modelUsed: data.modelUsed || selectedModel },
      ]);
    } catch (err: any) {
      if (err.message === 'SERVER_OFFLINE' || err.name === 'SyntaxError' || err.message?.includes('JSON') || err.message?.includes('fetch')) {
        // Fallback to direct client-side call to Google Gemini REST API
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`;
          let fullPrompt = query;
          if (selectedMovieForAI) {
            fullPrompt = `[针对电影《${selectedMovieForAI.title}》（导演:${selectedMovieForAI.director}，评分:${selectedMovieForAI.rating}分，类型:${selectedMovieForAI.genre}）的分析分析请求]:\n${query}`;
          }

          const directRes = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }]
            }),
          });
          const directData = await directRes.json();
          if (!directRes.ok) {
            throw new Error(directData.error?.message || 'Gemini 密钥或模型不可用');
          }
          const replyText = directData.candidates?.[0]?.content?.parts?.[0]?.text || '生成成功';
          setChatHistory((prev) => [
            ...prev,
            { sender: 'ai', text: replyText, modelUsed: selectedModel },
          ]);
        } catch (directErr: any) {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: 'ai',
              text: `⚠️ 分析生成失败: ${directErr.message || '网络连接或密钥验证失败'}`,
            },
          ]);
        }
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `⚠️ 分析生成失败: ${err.message || '请检查密钥或选择其他可用模型'}`,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter models by search query in modal
  const filteredModels = models.filter((m) => {
    const q = modelSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.id.toLowerCase().includes(q) ||
      m.displayName.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">AI 智能影评与数据洞察台</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            自定义配置 Gemini API 密钥，点击弹窗界面轻松选择模型与全模组响应测试
          </p>
        </div>

        {selectedMovieForAI && (
          <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs text-purple-300">
            <Film className="w-4 h-4 text-purple-400" />
            <span>当前深度分析电影: <strong>{selectedMovieForAI.title}</strong></span>
            <button
              onClick={onClearSelectedMovie}
              className="ml-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* API Key Input & Model Quick Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">手动配置 API 密钥与选择 AI 模型</h3>
          </div>

          {selectedModel ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>已选模型: <strong>{selectedModel}</strong></span>
              </div>
              <button
                onClick={handleOpenModelModal}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-full border border-purple-400/30 transition-all flex items-center space-x-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>切换模型</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-amber-400 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>暂未选择模型</span>
            </div>
          )}
        </div>

        {/* Form Inputs & Model Modal Launcher Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="请输入您的 Gemini API Key (例如: AIzaSy...)"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              title={showKey ? '隐藏密钥' : '显示密钥'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenModelModal}
              disabled={fetchingModels || !apiKey.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-purple-900/30 whitespace-nowrap"
            >
              {fetchingModels ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>获取模型列表中...</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>打开选择模型弹窗 {models.length > 0 && `(${models.length})`}</span>
                </>
              )}
            </button>

            {apiKey && (
              <button
                onClick={handleClearKey}
                className="px-3 py-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 rounded-xl text-xs transition-colors flex items-center space-x-1 whitespace-nowrap"
                title="删除/清除密钥"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除密钥</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Notice */}
        {modelsError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">密钥/模型验证说明：</p>
              <p className="text-red-300/80 mt-0.5">{modelsError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Preset Questions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 flex items-center space-x-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>常用 AI 智能洞察问题预设</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(q)}
              disabled={loading || !apiKey.trim() || !selectedModel}
              className="p-3 bg-slate-900 hover:bg-slate-800/80 disabled:opacity-40 border border-slate-800 text-slate-300 rounded-xl text-left transition-colors flex items-start space-x-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{q}</span>
            </button>
          ))}
        </div>
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
                className={`p-4 rounded-2xl text-xs max-w-3xl leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-100'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200'
                }`}
              >
                {msg.sender === 'ai' && msg.modelUsed && (
                  <div className="text-[10px] text-purple-400/80 font-mono flex items-center space-x-1 pb-1 border-b border-slate-700/60">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>模型生成: {msg.modelUsed}</span>
                  </div>
                )}

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
              <span>
                模型 <strong>{selectedModel}</strong> 正在智能检索 SQLite 数据库并撰写深度报告...
              </span>
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
            disabled={!apiKey.trim() || !selectedModel}
            placeholder={
              !apiKey.trim()
                ? '请先在上方输入您的 Gemini API 密钥...'
                : !selectedModel
                ? '请点击“选择/切换模型”弹窗选择一个 AI 模型...'
                : selectedMovieForAI
                ? `针对《${selectedMovieForAI.title}》提问，例如：分析其5星高评分的剧情亮点...`
                : '输入想要分析的电影话题、类型偏好或数据疑问...'
            }
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim() || !apiKey.trim() || !selectedModel}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-purple-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </form>
      </div>

      {/* ========================================= */}
      {/* MODEL SELECTION & TESTING POPUP MODAL    */}
      {/* ========================================= */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>选择 Gemini AI 模型</span>
                    <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-purple-300 font-mono">
                      共 {models.length} 个模型
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    勾选选择对应的生成模型，或对所有模型进行连通性测试
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModelModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar: Search & Test All */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder="搜索模型名称 (如: 2.5-flash, pro...)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              {/* Batch Test Controls */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="测试文本 (默认: 你好)"
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 w-36 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleTestAllModels}
                  disabled={testingAll || models.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 whitespace-nowrap shadow-md shadow-emerald-900/20"
                >
                  {testingAll ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在测试全部...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>一键测试全部模型</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Content: Model Cards */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-3 custom-scrollbar">
              {filteredModels.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  未匹配到相关模型或 API 密钥列表为空
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredModels.map((m) => {
                    const isSelected = selectedModel === m.id;
                    const testState = testResults[m.id];

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-mono text-xs font-bold text-white break-all">
                              {m.id}
                            </div>

                            {isSelected ? (
                              <span className="flex-shrink-0 px-2.5 py-1 bg-emerald-500 text-slate-950 font-extrabold text-[11px] rounded-full flex items-center space-x-1 shadow-sm">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>已选择</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectModel(m.id)}
                                className="flex-shrink-0 px-3 py-1 bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 text-[11px] font-medium rounded-full border border-slate-700 transition-colors"
                              >
                                选择此模型
                              </button>
                            )}
                          </div>

                          {m.displayName && m.displayName !== m.id && (
                            <p className="text-[11px] text-purple-300/80 mt-1">{m.displayName}</p>
                          )}

                          {m.description && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {m.description}
                            </p>
                          )}
                        </div>

                        {/* Test Status & Trigger */}
                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <div>
                            {testState?.status === 'testing' && (
                              <span className="text-amber-400 flex items-center space-x-1 font-mono text-[11px]">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>测试响应中...</span>
                              </span>
                            )}
                            {testState?.status === 'success' && (
                              <div className="text-emerald-400 flex items-center space-x-1 font-mono text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-medium">连通正常 ({testState.responseTimeMs}ms)</span>
                              </div>
                            )}
                            {testState?.status === 'error' && (
                              <div className="text-red-400 flex items-center space-x-1 font-mono text-[11px]">
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                                <span className="font-medium">响应异常</span>
                              </div>
                            )}
                            {(!testState || testState.status === 'idle') && (
                              <span className="text-slate-500 text-[11px]">未做连通测试</span>
                            )}
                          </div>

                          <button
                            onClick={() => testSingleModel(m.id)}
                            disabled={testState?.status === 'testing'}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Play className="w-2.5 h-2.5 fill-slate-300" />
                            <span>测试此模型</span>
                          </button>
                        </div>

                        {/* Test Reply or Error Box */}
                        {testState?.status === 'success' && testState.reply && (
                          <div className="p-2.5 bg-slate-900/90 border border-emerald-500/20 rounded-xl text-[11px] text-slate-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
                            <span className="text-emerald-400 font-bold block mb-1">测试回复 preview:</span>
                            {testState.reply}
                          </div>
                        )}
                        {testState?.status === 'error' && testState.error && (
                          <div className="p-2.5 bg-red-950/40 border border-red-500/20 rounded-xl text-[11px] text-red-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
                            <span className="text-red-400 font-bold block mb-1">报错原因:</span>
                            {testState.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                {selectedModel ? (
                  <span>当前已确认选择: <strong className="text-emerald-400">{selectedModel}</strong></span>
                ) : (
                  <span className="text-amber-400">尚未选择任何模型</span>
                )}
              </div>
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-purple-900/30"
              >
                完成选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
