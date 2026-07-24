import React from 'react';
import { 
  Film, 
  BarChart3, 
  PieChart as PieIcon,
  Database, 
  Terminal, 
  Sparkles, 
  Star, 
  User as UserIcon, 
  LogOut, 
  LogIn,
  Users
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  favoritesCount: number;
  totalMovies?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  favoritesCount,
  totalMovies,
}) => {
  const movieTabLabel = totalMovies !== undefined ? `电影数据库 (${totalMovies})` : '电影数据库';

  const navItems = [
    { id: 'dashboard', label: '数据大屏', icon: BarChart3 },
    { id: 'analytics', label: '图表分析界面', icon: PieIcon },
    { id: 'movies', label: movieTabLabel, icon: Film },
    { 
      id: 'users', 
      label: '用户表管理', 
      icon: Users, 
      badge: currentUser?.account === 'admin' ? null : '🔒管理员' 
    },
    { id: 'sql', label: 'SQL控制台', icon: Terminal },
    { id: 'ai', label: 'AI智能分析', icon: Sparkles },
    { id: 'favorites', label: '我的收藏', icon: Star, badge: favoritesCount > 0 ? favoritesCount : null },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Film className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  豆瓣电影数据分析平台
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SQLite 引擎
                </span>
              </div>
              <p className="text-xs text-slate-400">Douban Movies Data Analytics & AI Insight</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-slate-950 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-medium text-slate-200">{currentUser.username}</p>
                  <p className="text-[10px] text-slate-400">账号: {currentUser.account}</p>
                </div>
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  title="退出登录"
                  className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all font-semibold shadow-md shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>登录 / 注册</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
