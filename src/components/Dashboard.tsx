import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { AnalyticsSummary } from '../types';
import { Film, Star, MessageSquare, TrendingUp, Award, Globe, Video, Sparkles, RefreshCw } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b', '#14b8a6', '#a855f7'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/summary');
      if (!res.ok) throw new Error('获取统计数据失败');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium">正在计算与聚类 SQLite 电影数据...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-400 bg-slate-900 border border-slate-800 rounded-xl my-8 max-w-xl mx-auto">
        <p className="text-sm font-semibold">{error || '加载异常'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800/90 to-emerald-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">豆瓣电影多维数据分析大屏</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              数据源: clean_douban_movie_data
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            包含完整 {data.totalMovies.toLocaleString()} 卷高分电影记录，涵盖类型分布、导演口碑、年代演进趋势及评分权重分析。
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="mt-4 md:mt-0 flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/60 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>刷新大屏指标</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">收录电影总数</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.totalMovies.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">部精选经典</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>数据表 `clean_douban_movie_data`</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">豆瓣平均得分</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{data.avgRating}</span>
            <span className="text-xs text-amber-400 font-medium">/ 10 分</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">最高评分: <strong className="text-amber-400">{data.maxRating}分</strong> (肖申克的救赎)</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">累计评价人次</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {(data.totalReviews / 100000000).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1">亿+ 条评分</span>
          </div>
          <p className="text-[11px] text-blue-400 mt-1">平均每部电影约 {(data.totalReviews / data.totalMovies / 10000).toFixed(1)} 万人评价</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">覆盖电影类型</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{data.topGenres.length}</span>
            <span className="text-xs text-purple-400 font-medium">+ 核心大类</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">最热门类型: <strong className="text-purple-300">剧情 / 喜剧 / 动作</strong></p>
        </div>
      </div>

      {/* Row 1 Charts: Rating Distribution & Genre Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Range Distribution */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span>豆瓣电影评分分布直方图</span>
              </h3>
              <p className="text-[11px] text-slate-400">各评分区间电影数量统计</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ratingDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} 部电影`, '数量']}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]}>
                  {data.ratingDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Genre Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <span>热门电影类型 TOP10 与平均分</span>
              </h3>
              <p className="text-[11px] text-slate-400">涵盖作品数量与该类型平均豆瓣评分</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topGenres} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="genre" type="category" stroke="#94a3b8" fontSize={11} width={50} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [name === 'count' ? `${val} 部` : `${val} 分`, name === 'count' ? '数量' : '均分']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="数量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Release Year / Decade Trend & Top Directors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decade Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>电影上映年代跨度演变趋势 (1920s - 2020s)</span>
              </h3>
              <p className="text-[11px] text-slate-400">各年代收录的经典电影数量及平均得分变迁</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.decadeTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="decade" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" domain={[7, 10]} stroke="#f59e0b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" name="电影数量" />
                <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="平均评分" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Directors List */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 mb-1">
              <Video className="w-4 h-4 text-purple-400" />
              <span>高产高分名导榜</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">入选作品数量 ≥ 2 部的代表性导演</p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {data.topDirectors.slice(0, 8).map((dir, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{dir.director}</p>
                      <p className="text-[10px] text-slate-400">上榜 {dir.count} 部作品</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400">{dir.avgRating} 分</span>
                    <p className="text-[10px] text-slate-500">平均分</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Rated vs Most Reviewed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Rated 5 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">神作榜 TOP 5（最高评分）</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {data.topRatedMovies.map((m, idx) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-extrabold text-amber-400 w-4">#{idx + 1}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{m.title}</h4>
                    <p className="text-[10px] text-slate-400">导演: {m.director} · {m.genre} ({m.year})</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-amber-400">{m.rating}</span>
                  <p className="text-[10px] text-slate-400">{(m.rating_count / 10000).toFixed(1)}万人看过</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Reviewed 5 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">爆款人气榜 TOP 5（评价人数最多）</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {data.mostReviewedMovies.map((m, idx) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-extrabold text-emerald-400 w-4">#{idx + 1}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{m.title}</h4>
                    <p className="text-[10px] text-slate-400">导演: {m.director} · {m.genre} ({m.year})</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">{(m.rating_count / 10000).toFixed(1)} 万评价</span>
                  <p className="text-[10px] text-amber-400 font-semibold">{m.rating} 分</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
