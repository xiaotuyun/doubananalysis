import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Key, ShieldCheck, RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle2, X, Lock, LogIn } from 'lucide-react';
import { User } from '../types';

interface UsersViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser, onOpenAuth }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Custom Modal & Banner State
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [toastNotice, setToastNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isAdmin = currentUser?.account === 'admin';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, account, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '添加用户失败');
      }

      setUsername('');
      setAccount('');
      setPassword('');
      setToastNotice({ type: 'success', text: `新增用户 ${data.user?.username || username} 成功！` });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePromptDelete = (userItem: any) => {
    if (userItem.account === 'admin') {
      setToastNotice({ type: 'error', text: '系统初始超级管理员账号 (admin) 受程序底层保护，无法被删除！' });
      return;
    }
    setUserToDelete(userItem);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const item = userToDelete;
    setUserToDelete(null);
    setDeletingId(item.id);

    try {
      const res = await fetch(`/api/users/${item.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setToastNotice({ type: 'success', text: data.message || `用户 ${item.username} 已成功彻底删除！` });
        fetchUsers();
      } else {
        setToastNotice({ type: 'error', text: `删除失败: ${data.error || '未知错误'}` });
      }
    } catch (err: any) {
      console.error(err);
      setToastNotice({ type: 'error', text: `删除异常: ${err.message || '网络连接失败'}` });
    } finally {
      setDeletingId(null);
    }
  };

  // Permission Guard: Normal users cannot view user management table
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-6 animate-fade-in text-slate-100">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">🔒 权限受限：用户表管理仅限管理员访问</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            出于数据安全与系统安全隔离考量，【用户表管理】模块包含系统所有账号的数据，仅供超级管理员查阅与维护。普通用户无权查看此数据。
          </p>
        </div>

        <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl text-xs text-left space-y-2 text-slate-300 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">当前身份状态：</span>
            <span className="font-bold text-amber-400">
              {currentUser ? `普通用户 (${currentUser.username})` : '未登录访客'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">访问权限要求：</span>
            <span className="text-emerald-400 font-semibold">超级管理员</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>切换管理员账号登录</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white relative">
      {/* Toast Notification Banner */}
      {toastNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg text-sm transition-all animate-fade-in ${
            toastNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{toastNotice.text}</span>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">确认删除用户账号？</h3>
                <p className="text-xs text-slate-400">SQLite 数据库 `users` 表操作不可逆</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">用户 ID:</span>
                <span className="font-mono text-slate-200">#{userToDelete.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">用户名称:</span>
                <span className="font-bold text-emerald-400">{userToDelete.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">账号代码:</span>
                <span className="font-mono text-amber-300">{userToDelete.account}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              确定要删除此用户吗？删除后该用户将无法再登录系统，关联的影评及收藏记录也会同步清除。
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>确认彻底删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold">SQLite 用户数据表管理 (`users` 表)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            支持动态维护：用户ID (id) · 用户名称 (username) · 账号 (account) · 密码 (password)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{showPasswords ? '明文隐藏密码' : '取消密码掩码'}</span>
          </button>

          <button
            onClick={fetchUsers}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新数据表</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add User Form */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg h-fit">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">新增用户记录</h3>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleAddUser} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">用户名称 (username)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: 极客影评员"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">账号 (account)</label>
              <input
                type="text"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="例如: user_2024"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">密码 (password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置该账号密码"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20"
            >
              插入到 users 表
            </button>
          </form>
        </div>

        {/* Users List Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              当前数据库包含 <strong className="text-emerald-400">{users.length}</strong> 条用户账号记录
            </span>
            <span className="text-[11px] text-slate-400">SQLite 独立用户表与外键联动控制</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">用户名称 (username)</th>
                  <th className="p-3">账号 (account)</th>
                  <th className="p-3">密码 (password)</th>
                  <th className="p-3">注册时间</th>
                  <th className="p-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-500">#{u.id}</td>
                    <td className="p-3 font-bold text-slate-100 flex items-center space-x-1.5">
                      {u.account === 'admin' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                      ) : (
                        <Key className="w-3.5 h-3.5 text-slate-400 inline" />
                      )}
                      <span>{u.username}</span>
                      {u.account === 'admin' && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          管理员
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-emerald-400">{u.account}</td>
                    <td className="p-3 font-mono text-slate-400">
                      {showPasswords ? (u.account === 'admin' ? '•••••••• (已保护)' : '••••••••') : '••••••••'}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(u.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {u.account === 'admin' ? (
                        <span className="text-[11px] text-slate-500 italic" title="初始管理员受系统保护">
                          系统保护
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePromptDelete(u)}
                          disabled={deletingId === u.id}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors inline-flex items-center space-x-1 disabled:opacity-50"
                          title="从数据库中删除此账号"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>删除</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
