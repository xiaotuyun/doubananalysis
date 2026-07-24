import React, { useState, useEffect } from 'react';
import { Star, Heart, Trash2, Edit2, Film, Eye } from 'lucide-react';
import { User, Movie } from '../types';
import { getStoredMovies } from '../data/staticAnalytics';

interface FavoritesViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectMovieDetail: (movie: Movie) => void;
  onRemoveFavorite: (favoriteId: number) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  currentUser,
  onOpenAuth,
  onSelectMovieDetail,
  onRemoveFavorite,
}) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setFavorites(data);
        return;
      }
    } catch {}

    // Offline fallback for static hosting
    try {
      const key = `douban_fav_${currentUser.id}`;
      const saved = localStorage.getItem(key);
      const favIds: number[] = saved ? JSON.parse(saved) : [];
      const allMovies = getStoredMovies();
      const favMovies = allMovies
        .filter(m => favIds.includes(m.id))
        .map(m => ({ ...m, favorite_id: m.id }));
      setFavorites(favMovies);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-white my-8 max-w-md mx-auto shadow-xl">
        <Heart className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold">请先登录账号</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          登录后可随时保存个人心仪影单，并在 SQLite 数据库中录入专属观影手记。
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          立即登录 / 注册
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-amber-400 fill-amber-400" />
            <h2 className="text-xl font-bold">{currentUser.username} 的观影宝藏盒</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            在 SQLite `user_favorites` 表中持久化保存您喜爱的电影作品与观后笔记
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">加载个人收藏列表...</div>
      ) : favorites.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">暂无收藏的电影</p>
          <p className="text-xs text-slate-500 mt-1">可在“电影数据库”页面中点击红心按钮添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.favorite_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3
                    onClick={() => onSelectMovieDetail(fav)}
                    className="font-bold text-sm text-slate-100 hover:text-emerald-400 cursor-pointer"
                  >
                    {fav.title}
                  </h3>
                  <div className="flex items-center space-x-1 text-amber-400 font-extrabold text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{fav.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  导演: {fav.director} · {fav.genre} ({fav.year})
                </p>

                {fav.note && (
                  <div className="mt-3 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300 italic">
                    “{fav.note}”
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => onSelectMovieDetail(fav)}
                  className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>查看详情</span>
                </button>

                <button
                  onClick={() => onRemoveFavorite(fav.favorite_id)}
                  className="text-slate-500 hover:text-red-400 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>取消收藏</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
