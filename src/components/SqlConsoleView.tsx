import React, { useState } from 'react';
import { Terminal, Play, RotateCcw, AlertCircle, CheckCircle2, Clock, Table } from 'lucide-react';

export const SqlConsoleView: React.FC = () => {
  const [sql, setSql] = useState(`SELECT title, director, rating, rating_count, year \nFROM clean_douban_movie_data \nWHERE rating >= 9.0 \nORDER BY rating DESC \nLIMIT 15;`);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sampleQueries = [
    {
      label: '高分神作 TOP 15',
      sql: `SELECT title, director, rating, rating_count, year \nFROM clean_douban_movie_data \nWHERE rating >= 9.0 \nORDER BY rating DESC \nLIMIT 15;`,
    },
    {
      label: '统计各类型电影均分与数量',
      sql: `SELECT genre, COUNT(*) as movie_count, ROUND(AVG(rating), 2) as avg_rating \nFROM clean_douban_movie_data \nGROUP BY genre \nHAVING movie_count > 5 \nORDER BY movie_count DESC;`,
    },
    {
      label: '查看所有系统用户表数据',
      sql: `SELECT id, username, account, created_at \nFROM users;`,
    },
    {
      label: '评价人数最多的超级爆款',
      sql: `SELECT title, director, rating_count, rating, release_date \nFROM clean_douban_movie_data \nORDER BY rating_count DESC \nLIMIT 10;`,
    },
  ];

  const handleExecuteSql = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SQL 执行失败');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold">SQLite 交互式 SQL 控制台</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            支持对 `clean_douban_movie_data` 与 `users` 表直接编写原生的 SQL 语法并快速预览分析结果
          </p>
        </div>
      </div>

      {/* Preset Queries */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-400 py-1 font-semibold flex items-center space-x-1">快捷模板:</span>
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setSql(q.sql)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Code Editor Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
          <span className="font-mono text-slate-400 font-bold flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>SQLite SQL Editor</span>
          </span>
          <button
            onClick={() => setSql('')}
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>清空</span>
          </button>
        </div>

        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={5}
          placeholder="输入 SELECT 查询语句..."
          className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 custom-scrollbar"
        />

        <div className="flex justify-end">
          <button
            onClick={handleExecuteSql}
            disabled={loading || !sql.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{loading ? '执行查询中...' : '运行 SQL 语句'}</span>
          </button>
        </div>
      </div>

      {/* Query Result Section */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3">
          <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3 text-emerald-400 font-semibold">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>查询成功</span>
              </span>
              <span className="text-slate-400 flex items-center space-x-1">
                <Table className="w-3.5 h-3.5" />
                <span>返回 {result.rowCount} 行记录</span>
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px] flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>耗时: {result.durationMs} ms</span>
            </span>
          </div>

          {result.data.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              无返回匹配结果数据
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800 text-slate-300 border-b border-slate-700 sticky top-0">
                  <tr>
                    {result.columns.map((col: string) => (
                      <th key={col} className="p-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {result.data.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {result.columns.map((col: string) => (
                        <td key={col} className="p-3 text-slate-200">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
