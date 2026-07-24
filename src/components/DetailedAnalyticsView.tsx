import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Legend,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Clock,
  Globe,
  Award,
  Layers,
  RefreshCw,
  Zap,
  Star,
  Flame,
  Globe2,
  Activity,
  Compass,
  Film,
} from 'lucide-react';

interface DetailedAnalyticsData {
  runtimeDist: Array<{ range: string; count: number; avgRating: number; avgReviews: number }>;
  countryStats: Array<{ country: string; count: number; avgRating: number; avgReviews: number; high9Ratio: number }>;
  languageStats: Array<{ language: string; count: number; avgRating: number }>;
  starRatingBreakdown: Array<{ name: string; value: number; color: string }>;
  scoreRanges: Array<{ range: string; count: number }>;
  yearlyTrend: Array<{ year: number; count: number; avgRating: number }>;
  genreDeepStats: Array<{
    genre: string;
    count: number;
    avgRating: number;
    high9Ratio: number;
    high9Count: number;
    maxRating: number;
    topTitle: string;
    avgReviews: number;
  }>;
  genreRadar: Array<{
    genre: string;
    作品量: number;
    均分指数: number;
    神作占比: number;
    热度指数: number;
  }>;
  scatterMovies: Array<{ title: string; rating: number; rating_count: number; genre: string; year: number }>;
  top15Popular: Array<{ title: string; fullTitle: string; reviews: number; rating: number }>;
  quadrants: {
    highRatingHighReviews: number;
    highRatingLowReviews: number;
    avgRatingHighReviews: number;
    avgRatingLowReviews: number;
  };
}

const FALLBACK_DATA: DetailedAnalyticsData = {
  runtimeDist: [
    { range: '< 90分钟', count: 42, avgRating: 8.62, avgReviews: 382000 },
    { range: '90-120分钟', count: 128, avgRating: 8.78, avgReviews: 540000 },
    { range: '120-150分钟', count: 64, avgRating: 8.92, avgReviews: 680000 },
    { range: '> 150分钟', count: 16, avgRating: 9.15, avgReviews: 820000 },
  ],
  countryStats: [
    { country: '美国', count: 120, avgRating: 8.85, avgReviews: 620000, high9Ratio: 28.5 },
    { country: '日本', count: 48, avgRating: 8.92, avgReviews: 450000, high9Ratio: 33.3 },
    { country: '中国香港', count: 32, avgRating: 8.75, avgReviews: 510000, high9Ratio: 21.8 },
    { country: '中国大陆', count: 28, avgRating: 8.68, avgReviews: 580000, high9Ratio: 17.8 },
    { country: '英国', count: 25, avgRating: 8.81, avgReviews: 490000, high9Ratio: 24.0 },
    { country: '法国', count: 18, avgRating: 8.79, avgReviews: 320000, high9Ratio: 22.2 },
    { country: '韩国', count: 15, avgRating: 8.76, avgReviews: 530000, high9Ratio: 20.0 },
    { country: '德国', count: 12, avgRating: 8.83, avgReviews: 310000, high9Ratio: 25.0 },
    { country: '意大利', count: 10, avgRating: 8.95, avgReviews: 420000, high9Ratio: 40.0 },
    { country: '印度', count: 8, avgRating: 8.72, avgReviews: 390000, high9Ratio: 12.5 },
    { country: '加拿大', count: 6, avgRating: 8.65, avgReviews: 280000, high9Ratio: 16.6 },
    { country: '西班牙', count: 5, avgRating: 8.70, avgReviews: 340000, high9Ratio: 20.0 },
  ],
  languageStats: [
    { language: '英语', count: 135, avgRating: 8.82 },
    { language: '日语', count: 45, avgRating: 8.91 },
    { language: '汉语普通话', count: 30, avgRating: 8.69 },
    { language: '粤语', count: 28, avgRating: 8.76 },
    { language: '法语', count: 16, avgRating: 8.78 },
    { language: '德语', count: 11, avgRating: 8.81 },
    { language: '韩语', count: 14, avgRating: 8.75 },
    { language: '意大利语', count: 9, avgRating: 8.94 },
    { language: '西班牙语', count: 6, avgRating: 8.71 },
    { language: '印地语', count: 7, avgRating: 8.73 },
  ],
  starRatingBreakdown: [
    { name: '5星 (极力推荐)', value: 54.2, color: '#10b981' },
    { name: '4星 (推荐)', value: 33.8, color: '#3b82f6' },
    { name: '3星及以下 (一般/较差)', value: 12.0, color: '#f59e0b' },
  ],
  scoreRanges: [
    { range: '8.0 - 8.4分', count: 62 },
    { range: '8.5 - 8.8分', count: 115 },
    { range: '8.9 - 9.2分', count: 58 },
    { range: '9.3分以上神作', count: 15 },
  ],
  yearlyTrend: [
    { year: 1980, count: 2, avgRating: 8.7 },
    { year: 1985, count: 3, avgRating: 8.8 },
    { year: 1990, count: 5, avgRating: 8.9 },
    { year: 1994, count: 9, avgRating: 9.2 },
    { year: 1998, count: 7, avgRating: 8.9 },
    { year: 2000, count: 8, avgRating: 8.8 },
    { year: 2004, count: 10, avgRating: 8.7 },
    { year: 2008, count: 12, avgRating: 8.9 },
    { year: 2010, count: 14, avgRating: 8.8 },
    { year: 2014, count: 15, avgRating: 8.9 },
    { year: 2018, count: 11, avgRating: 8.7 },
    { year: 2022, count: 8, avgRating: 8.6 },
    { year: 2024, count: 5, avgRating: 8.8 },
  ],
  genreDeepStats: [
    { genre: '剧情', count: 185, avgRating: 8.84, high9Ratio: 24.3, high9Count: 45, maxRating: 9.7, topTitle: '肖申克的救赎', avgReviews: 650000 },
    { genre: '喜剧', count: 52, avgRating: 8.68, high9Ratio: 15.3, high9Count: 8, maxRating: 9.3, topTitle: '美丽人生', avgReviews: 580000 },
    { genre: '动画', count: 48, avgRating: 8.95, high9Ratio: 37.5, high9Count: 18, maxRating: 9.4, topTitle: '千与千寻', avgReviews: 720000 },
    { genre: '爱情', count: 65, avgRating: 8.72, high9Ratio: 18.4, high9Count: 12, maxRating: 9.5, topTitle: '泰坦尼克号', avgReviews: 810000 },
    { genre: '科幻', count: 38, avgRating: 8.88, high9Ratio: 28.9, high9Count: 11, maxRating: 9.4, topTitle: '星际穿越', avgReviews: 890000 },
    { genre: '犯罪', count: 42, avgRating: 8.81, high9Ratio: 21.4, high9Count: 9, maxRating: 9.6, topTitle: '教父', avgReviews: 620000 },
    { genre: '悬疑', count: 35, avgRating: 8.75, high9Ratio: 17.1, high9Count: 6, maxRating: 9.3, topTitle: '盗梦空间', avgReviews: 850000 },
    { genre: '奇幻', count: 28, avgRating: 8.79, high9Ratio: 25.0, high9Count: 7, maxRating: 9.3, topTitle: '指环王3：王者无敌', avgReviews: 670000 },
    { genre: '纪录片', count: 20, avgRating: 9.12, high9Ratio: 55.0, high9Count: 11, maxRating: 9.6, topTitle: '地球脉动 第二季', avgReviews: 210000 },
  ],
  genreRadar: [
    { genre: '剧情', 作品量: 100, 均分指数: 88, 神作占比: 48, 热度指数: 85 },
    { genre: '动画', 作品量: 32, 均分指数: 90, 神作占比: 75, 热度指数: 92 },
    { genre: '科幻', 作品量: 25, 均分指数: 89, 神作占比: 58, 热度指数: 98 },
    { genre: '犯罪', 作品量: 28, 均分指数: 88, 神作占比: 43, 热度指数: 82 },
    { genre: '爱情', 作品量: 43, 均分指数: 87, 神作占比: 36, 热度指数: 88 },
    { genre: '喜剧', 作品量: 35, 均分指数: 86, 神作占比: 30, 热度指数: 76 },
  ],
  scatterMovies: [
    { title: '肖申克的救赎', rating: 9.7, rating_count: 2980000, genre: '剧情/犯罪', year: 1994 },
    { title: '霸王别姬', rating: 9.6, rating_count: 2120000, genre: '剧情/爱情', year: 1993 },
    { title: '阿甘正传', rating: 9.5, rating_count: 2190000, genre: '剧情/爱情', year: 1994 },
    { title: '泰坦尼克号', rating: 9.5, rating_count: 2100000, genre: '剧情/爱情', year: 1997 },
    { title: '千与千寻', rating: 9.4, rating_count: 2280000, genre: '动画/奇幻', year: 2001 },
    { title: '盗梦空间', rating: 9.4, rating_count: 2050000, genre: '剧情/科幻', year: 2010 },
    { title: '星际穿越', rating: 9.4, rating_count: 1820000, genre: '剧情/科幻', year: 2014 },
    { title: '楚门的世界', rating: 9.4, rating_count: 1650000, genre: '剧情/科幻', year: 1998 },
    { title: '忠犬八公的故事', rating: 9.4, rating_count: 1420000, genre: '剧情', year: 2009 },
    { title: '三傻大闹宝莱坞', rating: 9.2, rating_count: 1780000, genre: '剧情/喜剧', year: 2009 },
  ],
  top15Popular: [
    { title: '肖申克的救赎', fullTitle: '肖申克的救赎', reviews: 298, rating: 9.7 },
    { title: '千与千寻', fullTitle: '千与千寻', reviews: 228, rating: 9.4 },
    { title: '阿甘正传', fullTitle: '阿甘正传', reviews: 219, rating: 9.5 },
    { title: '霸王别姬', fullTitle: '霸王别姬', reviews: 212, rating: 9.6 },
    { title: '泰坦尼克号', fullTitle: '泰坦尼克号', reviews: 210, rating: 9.5 },
    { title: '盗梦空间', fullTitle: '盗梦空间', reviews: 205, rating: 9.4 },
    { title: '星际穿越', fullTitle: '星际穿越', reviews: 182, rating: 9.4 },
    { title: '三傻大闹宝莱坞', fullTitle: '三傻大闹宝莱坞', reviews: 178, rating: 9.2 },
    { title: '楚门的世界', fullTitle: '楚门的世界', reviews: 165, rating: 9.4 },
    { title: '疯狂动物城', fullTitle: '疯狂动物城', reviews: 162, rating: 9.2 },
    { title: '海上钢琴师', fullTitle: '海上钢琴师', reviews: 158, rating: 9.3 },
    { title: '机器人总动员', fullTitle: '机器人总动员', reviews: 145, rating: 9.3 },
    { title: '忠犬八公的故事', fullTitle: '忠犬八公的故事', reviews: 142, rating: 9.4 },
    { title: '无间道', fullTitle: '无间道', reviews: 138, rating: 9.3 },
    { title: '大话西游之大圣娶亲', fullTitle: '大话西游之大圣娶亲', reviews: 135, rating: 9.2 },
  ],
  quadrants: {
    highRatingHighReviews: 42,
    highRatingLowReviews: 18,
    avgRatingHighReviews: 15,
    avgRatingLowReviews: 5,
  },
};

export const DetailedAnalyticsView: React.FC = () => {
  const [data, setData] = useState<DetailedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'geography' | 'runtime' | 'genres' | 'scatter'>('overview');

  const fetchDetailedAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/detailed');
      if (!res.ok) throw new Error('API Unavailable');
      const result = await res.json();
      setData(result);
    } catch {
      // Fallback to static mock data for static GitHub Pages deployment
      setData(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-medium text-slate-300">正在进行 SQLite 多维电影图表与矩阵深度计算...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-400 bg-slate-900 border border-slate-800 rounded-xl my-8 max-w-xl mx-auto shadow-xl">
        <p className="text-sm font-semibold">{error || '加载数据失败'}</p>
        <button
          onClick={fetchDetailedAnalytics}
          className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"
        >
          重新尝试
        </button>
      </div>
    );
  }

  const quadrantPieData = [
    { name: '高分爆款', value: data.quadrants.highRatingHighReviews, color: '#10b981' },
    { name: '高分宝藏', value: data.quadrants.highRatingLowReviews, color: '#8b5cf6' },
    { name: '热门平平', value: data.quadrants.avgRatingHighReviews, color: '#f59e0b' },
    { name: '普众小众', value: data.quadrants.avgRatingLowReviews, color: '#64748b' },
  ];

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <PieIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">电影数据深度图表分析中心</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              多维度多视图图表矩阵
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            切换下方分类页签，查看各个维度的多维度柱状图、折线图、饼图、雷达图及散点矩阵
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDetailedAnalytics}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>重新统计数据</span>
          </button>
        </div>
      </div>

      {/* Analytics Category Nav Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: '1. 综合洞察与评分分布', icon: Layers, chartsCount: 4 },
          { id: 'geography', label: '2. 地区与语言图表', icon: Globe2, chartsCount: 4 },
          { id: 'runtime', label: '3. 片长与品质分析', icon: Clock, chartsCount: 4 },
          { id: 'genres', label: '4. 类型与神作率矩阵', icon: Award, chartsCount: 4 },
          { id: 'scatter', label: '5. 热度与象限矩阵', icon: Flame, chartsCount: 4 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {tab.chartsCount}图
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================================== */}
      {/* TAB 1: 综合洞察与评分分布 (OVERVIEW & RATING) */}
      {/* ========================================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1.1: 五星/四星好评率占比 (Pie Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">图表 1.1：全库电影五星/四星好评配比</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  豆瓣评论者给出的5星(极力推荐)、4星(推荐)及3星以下比例均值
                </p>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.starRatingBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.starRatingBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val}%`, '平均占比']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800">
                {data.starRatingBreakdown.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">{item.name.split(' ')[0]}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: item.color }}>
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 1.2: 评分区间数量分布 (Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">图表 1.2：豆瓣评分区间作品数量分布</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  8.0-8.4分、8.5-8.8分、8.9-9.2分及 9.3分以上神作数量
                </p>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.scoreRanges} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val} 部`, '作品数量']}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]}>
                        {data.scoreRanges.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center pt-3 border-t border-slate-800">
                {data.scoreRanges.map((sr, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">{sr.range}</span>
                    <span className="text-xs font-bold text-emerald-400">{sr.count} 部</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1.3: 1980-2024 年高分作品产出与均分 (Area & Line Chart) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 1.3：1980 - 2024 年佳作产出数量与平均得分趋势</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">年度入榜经典作品数量（柱状）与该年度平均得分（曲线）</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.yearlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" domain={[8.0, 9.5]} stroke="#f59e0b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="作品数量(部)" />
                    <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} dot={false} name="平均得分" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 1.4: 四大象限占比分布 (Donut Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Flame className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold text-slate-100">图表 1.4：高分与热度象限分类</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">高分爆款 / 高分宝藏 / 大众热门 / 普众小众</p>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={quadrantPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {quadrantPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800 text-xs">
                {quadrantPieData.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: q.color }}></span>
                      <span>{q.name}</span>
                    </span>
                    <span className="font-bold text-slate-200">{q.value} 部</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================== */}
      {/* TAB 2: 地区与语言 (GEOGRAPHY & LANGUAGE) */}
      {/* ========================================================================================== */}
      {activeTab === 'geography' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2.1: 主要国家/地区作品数量排行榜 (Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Globe className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 2.1：主要国家/地区佳作产出 TOP 12</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">各国家/地区在数据库中的入榜经典作品数量</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.countryStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="country" stroke="#94a3b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={45} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} 部`, '作品数量']}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2.2: 各国家/地区平均得分对比 (Area Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 2.2：主要国家/地区作品平均得分对比</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">代表性国家与地区作品的平均豆瓣评分</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.countryStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="country" stroke="#94a3b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={45} />
                    <YAxis domain={[7.5, 9.5]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} 分`, '平均评分']}
                    />
                    <Area type="monotone" dataKey="avgRating" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2.3: 主要国家 9.0分以上“神作占比” (%) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 2.3：主要国家/地区神作率 (%) 比率</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">该国家入库作品中评分 ≥ 9.0 的神作比例</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.countryStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="%" />
                    <YAxis dataKey="country" type="category" stroke="#94a3b8" fontSize={10} width={65} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, '9.0分+神作占比']}
                    />
                    <Bar dataKey="high9Ratio" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2.4: 电影主要语言种类分布 TOP 10 (Horizontal Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 2.4：高分电影主要语言分布 TOP 10</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">英语、汉语普通话、日语、法语等对高分片的影响</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.languageStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="language" type="category" stroke="#94a3b8" fontSize={10} width={75} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} 部`, '作品数量']}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================== */}
      {/* TAB 3: 片长与品质 (RUNTIME ANALYSIS) */}
      {/* ========================================================================================== */}
      {activeTab === 'runtime' && (
        <div className="space-y-6">
          {/* Runtime KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.runtimeDist.map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-lg">
                <div>
                  <span className="text-xs font-bold text-emerald-400">{item.range}</span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-white">{item.count}</span>
                    <span className="text-xs text-slate-400">部作品</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">均分: <strong className="text-amber-400">{item.avgRating}分</strong></span>
                  <span className="text-slate-400">均评: <strong className="text-blue-400">{Math.round(item.avgReviews/10000)}万人</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3.1: 片长区间作品数量分布 (Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 3.1：电影片长区间作品数量</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">&lt;90min、90-120min、120-150min 与 &gt;150min 数量分布</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.runtimeDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} 部`, '作品数量']}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3.2: 片长与平均得分关联 (Line / Area Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 3.2：片长区间与平均得分关系</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">片长越长是否评分越高的趋势观察</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.runtimeDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[7.5, 9.5]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} 分`, '平均得分']}
                    />
                    <Area type="monotone" dataKey="avgRating" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3.3: 片长区间平均评价人数 (热度) 对比 (Bar Chart) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Flame className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-slate-100">图表 3.3：各片长区间电影平均评价人数（大众热度）</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">评价人数代表大众讨论热度与受众覆盖率</p>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.runtimeDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val.toLocaleString()} 人`, '平均评价人数']}
                  />
                  <Bar dataKey="avgReviews" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================== */}
      {/* TAB 4: 类型与神作率 (GENRE MATRIX) */}
      {/* ========================================================================================== */}
      {activeTab === 'genres' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 4.1: 核心电影类型作品数量 TOP 12 (Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Film className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 4.1：核心电影类型作品数量 TOP 12</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">剧情、喜剧、动作、爱情、科幻等主流类型占比</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.genreDeepStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="genre" stroke="#94a3b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={40} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} 部`, '作品数量']}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4.2: 各类型 9.0分以上“神作占比” (%) (Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 4.2：各类型 9.0分以上神作产出比率 (%)</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">动画、纪录片、剧情等高满意度爆款集中程度</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.genreDeepStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="genre" stroke="#94a3b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={40} />
                    <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, '9.0分+占比']}
                    />
                    <Bar dataKey="high9Ratio" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 4.3: Top 6 类型多维指数雷达图 (Radar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Compass className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 4.3：Top 6 类型多维指标雷达对比</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">标准化评估：作品量 / 均分 / 神作率 / 热度</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.genreRadar}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="genre" stroke="#94a3b8" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                    <Radar name="均分指数" dataKey="均分指数" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    <Radar name="神作占比" dataKey="神作占比" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4.4: 核心类型均分与最高分代表神作名录 */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 4.4：各类型最高分代表神作卡片与均分矩阵</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {data.genreDeepStats.slice(0, 9).map((g, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">{g.genre}</span>
                      <span className="text-[10px] text-slate-400">均分 <strong className="text-amber-400">{g.avgRating}</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium truncate pt-1">🏆 代表作：{g.topTitle}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1 mt-1">
                      <span>9分+神作: {g.high9Count}部</span>
                      <span className="text-amber-400 font-bold">{g.maxRating}分</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================== */}
      {/* TAB 5: 散点与象限 (SCATTER & QUADRANT MATRIX) */}
      {/* ========================================================================================== */}
      {activeTab === 'scatter' && (
        <div className="space-y-6">
          {/* Chart 5.1: 80部经典电影散点图 (Scatter Chart) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 5.1：评分 (Y轴) vs 评价人数 (X轴) 80部高分电影散点关联</h3>
              </div>
              <span className="text-xs text-slate-400">X轴: 评价人数(人) | Y轴: 豆瓣得分</span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" dataKey="rating_count" name="评价人数" stroke="#94a3b8" fontSize={10} unit="人" />
                  <YAxis type="number" dataKey="rating" name="豆瓣评分" domain={[7.5, 9.8]} stroke="#94a3b8" fontSize={10} unit="分" />
                  <ZAxis type="number" range={[40, 120]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      name === '评价人数' ? `${value.toLocaleString()}人` : `${value}分`,
                      name,
                    ]}
                  />
                  <Scatter name="电影" data={data.scatterMovies} fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 5.2: 全库人气王 TOP 15 评价人数 (万人) 榜单 (Bar Chart) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 5.2：全库大众评价热度最高 TOP 15 电影 (万人)</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">《肖申克的救赎》《霸王别姬》《泰坦尼克号》等大众热度榜</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.top15Popular} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="万" />
                    <YAxis dataKey="title" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val} 万人评价 (${item.payload.rating}分)`,
                        '评价人数',
                      ]}
                    />
                    <Bar dataKey="reviews" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5.3: 四大象限占比分布与代表作品卡片 */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">图表 5.3：四大象限作品明细分布</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <span className="text-xs font-bold text-emerald-400">🔥 高分爆款 ({data.quadrants.highRatingHighReviews}部)</span>
                  <p className="text-[10px] text-slate-400 mt-1">评分 ≥ 8.8 且 评价 ≥ 50万人</p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <span className="text-xs font-bold text-purple-300">💎 高分宝藏 ({data.quadrants.highRatingLowReviews}部)</span>
                  <p className="text-[10px] text-slate-400 mt-1">评分 ≥ 8.8 且 评价 &lt; 50万人</p>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <span className="text-xs font-bold text-amber-400">🍿 热门经典 ({data.quadrants.avgRatingHighReviews}部)</span>
                  <p className="text-[10px] text-slate-400 mt-1">评分 &lt; 8.8 且 评价 ≥ 50万人</p>
                </div>
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl">
                  <span className="text-xs font-bold text-slate-300">📽️ 普众小众 ({data.quadrants.avgRatingLowReviews}部)</span>
                  <p className="text-[10px] text-slate-400 mt-1">评分 &lt; 8.8 且 评价 &lt; 50万人</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-300 mb-2">🎯 代表高分爆款：</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.scatterMovies.slice(0, 8).map((m, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 flex items-center space-x-1">
                      <span>{m.title}</span>
                      <span className="text-amber-400 font-bold">{m.rating}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
