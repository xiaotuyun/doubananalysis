import React from 'react';
import { X, Star, ExternalLink, Sparkles, Calendar, Clock, Globe, Award } from 'lucide-react';
import { Movie } from '../types';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSelectMovieAI: (movie: Movie) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onSelectMovieAI,
}) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Rating Header */}
        <div className="space-y-2 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
              SQLite ID: #{movie.id}
            </span>
            {movie.year && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                {movie.year} 年作品
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">{movie.title}</h2>
          {movie.alias && <p className="text-xs text-slate-400 italic">又名: {movie.alias}</p>}
        </div>

        {/* Score & Star Weight Bar */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-2xl shadow-inner">
              {movie.rating}
            </div>
            <div>
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round((movie.rating || 0) / 2) ? 'fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-300 mt-1 font-semibold">
                已收集 {(movie.rating_count / 10000).toFixed(1)} 万+ 条豆瓣影评
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="text-center bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
              <span className="text-amber-400 font-bold block">{movie.five_star || '45.0%'}</span>
              <span className="text-[10px] text-slate-400">5星好评占比</span>
            </div>
            <div className="text-center bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
              <span className="text-emerald-400 font-bold block">{movie.four_star || '35.0%'}</span>
              <span className="text-[10px] text-slate-400">4星好评占比</span>
            </div>
          </div>
        </div>

        {/* Grid Meta Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">导演:</span>
            <span className="text-slate-200 font-medium">{movie.director || '未知'}</span>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">编剧:</span>
            <span className="text-slate-200 font-medium">{movie.screenwriter || '未知'}</span>
          </div>

          <div className="sm:col-span-2 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">主演:</span>
            <span className="text-slate-200 font-medium">{movie.actors || '未知'}</span>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">类型与题材:</span>
            <span className="text-slate-200 font-medium">{movie.genre || '剧情'}</span>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">国家与语言:</span>
            <span className="text-slate-200 font-medium">{movie.country} · {movie.language}</span>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">上映日期:</span>
            <span className="text-slate-200 font-medium">{movie.release_date || '未知'}</span>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">片长:</span>
            <span className="text-slate-200 font-medium">{movie.runtime || '未知'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => {
              onClose();
              onSelectMovieAI(movie);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-purple-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>生成 Gemini AI 智能影评报告</span>
          </button>

          <div className="flex items-center space-x-2">
            {movie.link && (
              <a
                href={movie.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
              >
                <span>豆瓣原链接</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
