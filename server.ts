import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase } from './server/database.js';
import { GoogleGenAI } from '@google/genai';
import Papa from 'papaparse';

// Initialize SQLite Database
initDatabase();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini AI Client lazily or safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------
// 1. User Auth & Management APIs (用户表 API)
// ----------------------------------------------------

// User Registration
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, account, password } = req.body;
    if (!username || !account || !password) {
      return res.status(400).json({ error: '请填写完整的用户名称、账号和密码' });
    }

    const checkStmt = db.prepare('SELECT id FROM users WHERE account = ?');
    const existing = checkStmt.get(account);
    if (existing) {
      return res.status(400).json({ error: '该账号已被注册，请尝试其他账号' });
    }

    const insertStmt = db.prepare('INSERT INTO users (username, account, password) VALUES (?, ?, ?)');
    insertStmt.run(username, account, password);

    const newUser = db.prepare('SELECT id, username, account, created_at FROM users WHERE account = ?').get(account);
    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '注册失败' });
  }
});

// User Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { account, password } = req.body;
    if (!account || !password) {
      return res.status(400).json({ error: '请输入账号和密码' });
    }

    const stmt = db.prepare('SELECT id, username, account, password, created_at FROM users WHERE account = ?');
    const user = stmt.get(account) as any;

    if (!user || user.password !== password) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '登录失败' });
  }
});

// Get All Users (User Table Management)
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, account, created_at FROM users ORDER BY id DESC').all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
  try {
    const rawId = req.params.id;
    const numId = Number(rawId);

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ? OR id = ?').get(numId, rawId) as any;
    if (!targetUser) {
      return res.status(404).json({ error: '找不到要删除的用户记录' });
    }

    if (targetUser.account === 'admin') {
      return res.status(403).json({ error: '系统初始超级管理员账号 (admin) 受程序底层保护，不允许删除！' });
    }

    // Clean up associated user favorites
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? OR user_id = ?').run(numId, rawId);

    // Delete user record
    db.prepare('DELETE FROM users WHERE id = ? OR id = ?').run(numId, rawId);

    res.json({ success: true, message: `用户 ${targetUser.username} (${targetUser.account}) 已成功删除` });
  } catch (err: any) {
    console.error('[Delete User Error]:', err);
    res.status(500).json({ error: err.message || '删除用户失败' });
  }
});

// ----------------------------------------------------
// 2. Movies Data APIs (1769条 豆瓣电影数据 API)
// ----------------------------------------------------

// Query Movies (Search, Filter, Sort, Pagination)
app.get('/api/movies', (req, res) => {
  try {
    const {
      search = '',
      genre = '',
      country = '',
      minRating,
      maxRating,
      startYear,
      endYear,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: (string | number)[] = [];

    if (search) {
      whereConditions.push('(title LIKE ? OR director LIKE ? OR actors LIKE ? OR alias LIKE ?)');
      const term = `%${String(search)}%`;
      params.push(term, term, term, term);
    }

    if (genre) {
      whereConditions.push('genre LIKE ?');
      params.push(`%${String(genre)}%`);
    }

    if (country) {
      whereConditions.push('country LIKE ?');
      params.push(`%${String(country)}%`);
    }

    if (minRating) {
      whereConditions.push('rating >= ?');
      params.push(parseFloat(minRating as string));
    }

    if (maxRating) {
      whereConditions.push('rating <= ?');
      params.push(parseFloat(maxRating as string));
    }

    if (startYear) {
      whereConditions.push('year >= ?');
      params.push(parseInt(startYear as string));
    }

    if (endYear) {
      whereConditions.push('year <= ?');
      params.push(parseInt(endYear as string));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['rating', 'rating_count', 'year', 'id', 'title'];
    const safeSortBy = validSortColumns.includes(sortBy as string) ? (sortBy as string) : 'rating';
    const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM clean_douban_movie_data ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...(params as any[])) as { total: number };
    const total = totalResult ? totalResult.total : 0;

    const dataQuery = `
      SELECT * FROM clean_douban_movie_data 
      ${whereClause} 
      ORDER BY ${safeSortBy} ${safeOrder} 
      LIMIT ? OFFSET ?
    `;
    const movies = db.prepare(dataQuery).all(...(params as any[]), limitNum, offset);

    res.json({
      movies,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Movie Details
app.get('/api/movies/:id', (req, res) => {
  try {
    const movie = db.prepare('SELECT * FROM clean_douban_movie_data WHERE id = ?').get(String(req.params.id));
    if (!movie) {
      return res.status(404).json({ error: '未找到该电影数据' });
    }
    res.json(movie);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add New Movie
app.post('/api/movies', (req, res) => {
  try {
    const {
      title,
      director,
      screenwriter,
      actors,
      genre,
      country,
      language,
      release_date,
      runtime,
      alias,
      imdb,
      rating,
      rating_count,
      five_star,
      four_star,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: '电影名称不能为空' });
    }

    let year = 2024;
    const yearMatch = (release_date || '').match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) year = parseInt(yearMatch[1]);

    const movieId = `custom_${Date.now()}`;
    const link = `https://movie.douban.com/subject/${movieId}/`;

    const stmt = db.prepare(`
      INSERT INTO clean_douban_movie_data 
      (movie_id, link, title, director, screenwriter, actors, genre, country, language, release_date, runtime, alias, imdb, rating, rating_count, five_star, four_star, year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      movieId,
      link,
      title,
      director || '未知',
      screenwriter || '未知',
      actors || '未知',
      genre || '剧情',
      country || '中国大陆',
      language || '汉语普通话',
      release_date || `${year}-01-01`,
      runtime || '100分钟',
      alias || '',
      imdb || '',
      parseFloat(rating) || 8.0,
      parseInt(rating_count) || 10000,
      five_star || '40.0%',
      four_star || '40.0%',
      year
    );

    const inserted = db.prepare('SELECT * FROM clean_douban_movie_data WHERE movie_id = ?').get(movieId);
    res.json({ success: true, movie: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Movie
app.put('/api/movies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      director,
      screenwriter,
      actors,
      genre,
      country,
      language,
      release_date,
      runtime,
      alias,
      imdb,
      rating,
      rating_count,
      five_star,
      four_star,
    } = req.body;

    let year = 2024;
    const yearMatch = (release_date || '').match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) year = parseInt(yearMatch[1]);

    const stmt = db.prepare(`
      UPDATE clean_douban_movie_data
      SET title = ?, director = ?, screenwriter = ?, actors = ?, genre = ?, country = ?, language = ?, release_date = ?, runtime = ?, alias = ?, imdb = ?, rating = ?, rating_count = ?, five_star = ?, four_star = ?, year = ?
      WHERE id = ?
    `);

    stmt.run(
      title,
      director,
      screenwriter,
      actors,
      genre,
      country,
      language,
      release_date,
      runtime,
      alias,
      imdb,
      parseFloat(rating),
      parseInt(rating_count),
      five_star,
      four_star,
      year,
      id
    );

    const updated = db.prepare('SELECT * FROM clean_douban_movie_data WHERE id = ?').get(id);
    res.json({ success: true, movie: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear Database (Delete All Movies)
const clearAllMoviesHandler = (req: any, res: any) => {
  console.log('[API] Clear all movies requested!');
  const account = req.body?.account || req.headers['x-user-account'];
  if (account !== 'admin') {
    return res.status(403).json({ error: '权限受限：清空数据功能仅限管理员（admin）操作，普通用户无法清空系统数据！' });
  }
  try {
    db.exec('DELETE FROM clean_douban_movie_data;');
    try {
      db.exec("DELETE FROM sqlite_sequence WHERE name = 'clean_douban_movie_data';");
    } catch {
      // ignore
    }
    res.json({ success: true, message: '已成功清空所有电影数据' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.delete('/api/movies', clearAllMoviesHandler);
app.delete('/api/movies/clear', clearAllMoviesHandler);
app.post('/api/movies/clear', clearAllMoviesHandler);

// Delete Single Movie
app.delete('/api/movies/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      res.status(400).json({ error: '无效的电影ID' });
      return;
    }
    db.prepare('DELETE FROM clean_douban_movie_data WHERE id = ?').run(String(id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Robust helper to extract movie fields from any CSV row object
function parseMovieRow(row: Record<string, any>, index: number, now: number) {
  if (!row || typeof row !== 'object') return null;

  // Normalize all keys: strip BOM, trim spaces, convert to lowercase
  const normMap: Record<string, string> = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = String(key || '').replace(/^\uFEFF/, '').trim().toLowerCase();
    const cleanVal = val !== null && val !== undefined ? String(val).trim() : '';
    normMap[cleanKey] = cleanVal;
  }

  // Check if row is completely empty
  const hasContent = Object.values(normMap).some(v => v !== '');
  if (!hasContent) return null;

  const getVal = (aliases: string[], fallback = '') => {
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase();
      if (normMap[cleanAlias] !== undefined && normMap[cleanAlias] !== '') {
        return normMap[cleanAlias];
      }
    }
    // Search substring match if exact key match failed
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase();
      for (const [k, v] of Object.entries(normMap)) {
        if (v && k.includes(cleanAlias)) {
          return v;
        }
      }
    }
    return fallback;
  };

  const movieId = getVal(['电影id', 'movie_id', 'id', 'subject_id', '条目id', 'id号'], `import_${now}_${index}`);
  
  let title = getVal(['电影名称', '电影名', '片名', '电影', '名称', '中文名', '主标题', 'title', 'name', 'subject_title', 'movie_title', 'movie_name', 'film_title', 'film_name', 'subject']);
  
  if (!title) {
    // If no title found via aliases, search any field containing title/name/名称
    for (const [k, v] of Object.entries(normMap)) {
      if ((k.includes('名称') || k.includes('title') || k.includes('片名') || k.includes('名')) && v) {
        title = v;
        break;
      }
    }
  }

  if (!title) {
    // Fallback title using alias or IMDb or movie_id if row contains other movie data
    const alias = getVal(['又名', 'alias', 'aka']);
    const imdb = getVal(['imdb']);
    if (alias) {
      title = alias;
    } else if (imdb) {
      title = `IMDb ${imdb}`;
    } else {
      title = `电影_${movieId}`;
    }
  }

  const link = getVal(['电影链接', '链接', 'link', 'url', 'douban_url', 'subject_link'], `https://movie.douban.com/subject/${movieId}/`);
  const director = getVal(['导演', 'director', 'directors'], '未知');
  const screenwriter = getVal(['编剧', 'screenwriter', 'writer', 'writers'], '未知');
  const actors = getVal(['主演', '演员', 'actors', 'actor', 'starring', 'casts'], '未知');
  const genre = getVal(['类型', 'genre', 'genres', 'category'], '剧情');
  const country = getVal(['制片国家/地区', '制片国家', '国家', '地区', 'country', 'region'], '中国大陆');
  const language = getVal(['语言', 'language', 'lang'], '汉语普通话');
  const releaseDate = getVal(['上映日期', '上映时间', '首播', '发行日期', 'release_date', 'pubdate', 'year'], '2024-01-01');
  const runtime = getVal(['片长', '时长', 'runtime', 'duration'], '120分钟');
  const aliasVal = getVal(['又名', '别名', '英文名', 'alias', 'aka'], '');
  const imdbVal = getVal(['imdb', 'imdb_id'], '');
  const fiveStar = getVal(['5星', '五星', 'five_star', '5_star'], '40.0%');
  const fourStar = getVal(['4星', '四星', 'four_star', '4_star'], '40.0%');

  const ratingRaw = getVal(['豆瓣评分', '评分', 'rating', 'score'], '8.0');
  const ratingVal = parseFloat(ratingRaw);

  const ratingCountRaw = getVal(['评价人数', '评分人数', '人数', 'rating_count', 'votes'], '10000');
  const ratingCountVal = parseInt(ratingCountRaw.replace(/,/g, ''), 10);

  let year = 2024;
  const yearMatch = releaseDate.match(/\b(19\d\d|20\d\d)\b/) || title.match(/\((19\d\d|20\d\d)\)/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  return {
    movieId,
    link,
    title,
    director,
    screenwriter,
    actors,
    genre,
    country,
    language,
    releaseDate,
    runtime,
    alias: aliasVal,
    imdb: imdbVal,
    rating: isNaN(ratingVal) ? 8.0 : ratingVal,
    ratingCount: isNaN(ratingCountVal) ? 10000 : ratingCountVal,
    fiveStar,
    fourStar,
    year
  };
}

// Import Movies CSV
app.post('/api/movies/import/csv', (req, res) => {
  try {
    const { csvContent, rows: clientRows, mode = 'append' } = req.body;

    let rows: any[] = [];
    if (Array.isArray(clientRows) && clientRows.length > 0) {
      rows = clientRows;
    } else if (typeof csvContent === 'string' && csvContent.trim()) {
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      rows = parsed.data || [];
    } else {
      return res.status(400).json({ error: '未能接收到有效的 CSV 数据内容' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: '解析后的 CSV 数据行数为 0，请检查文件内容' });
    }

    if (mode === 'overwrite') {
      db.exec('DELETE FROM clean_douban_movie_data;');
      try {
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'clean_douban_movie_data';");
      } catch {
        // ignore
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO clean_douban_movie_data 
      (movie_id, link, title, director, screenwriter, actors, genre, country, language, release_date, runtime, alias, imdb, rating, rating_count, five_star, four_star, year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let importedCount = 0;
    const now = Date.now();

    db.exec('BEGIN TRANSACTION;');
    try {
      for (let i = 0; i < rows.length; i++) {
        const item = parseMovieRow(rows[i], i, now);
        if (!item) continue;

        insertStmt.run(
          item.movieId,
          item.link,
          item.title,
          item.director,
          item.screenwriter,
          item.actors,
          item.genre,
          item.country,
          item.language,
          item.releaseDate,
          item.runtime,
          item.alias,
          item.imdb,
          item.rating,
          item.ratingCount,
          item.fiveStar,
          item.fourStar,
          item.year
        );
        importedCount++;
      }
      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    res.json({
      success: true,
      count: importedCount,
      message: `成功${mode === 'overwrite' ? '覆盖并' : '追加'}导入 ${importedCount} 条电影数据！`,
    });
  } catch (err: any) {
    console.error('[CSV Import Error]:', err);
    res.status(500).json({ error: err.message || '导入 CSV 失败' });
  }
});

// ----------------------------------------------------
// 3. Analytics API (豆瓣数据分析大屏 API)
// ----------------------------------------------------
app.get('/api/analytics/summary', (req, res) => {
  try {
    // Basic Aggregates
    const overall = db.prepare(`
      SELECT 
        COUNT(*) as totalMovies, 
        ROUND(AVG(rating), 2) as avgRating, 
        MAX(rating) as maxRating, 
        SUM(rating_count) as totalReviews
      FROM clean_douban_movie_data
    `).get() as any;

    // Rating Distribution Buckets
    const ratingDist = db.prepare(`
      SELECT 
        CASE 
          WHEN rating >= 9.5 THEN '9.5 - 10分'
          WHEN rating >= 9.0 THEN '9.0 - 9.4分'
          WHEN rating >= 8.5 THEN '8.5 - 8.9分'
          WHEN rating >= 8.0 THEN '8.0 - 8.4分'
          WHEN rating >= 7.5 THEN '7.5 - 7.9分'
          WHEN rating >= 7.0 THEN '7.0 - 7.4分'
          ELSE '7.0分以下'
        END as range,
        COUNT(*) as count
      FROM clean_douban_movie_data
      GROUP BY range
      ORDER BY MIN(rating) DESC
    `).all();

    // Top Genre Breakdown
    const allMovies = db.prepare('SELECT genre, rating FROM clean_douban_movie_data').all() as any[];
    const genreMap: Record<string, { count: number; totalRating: number }> = {};
    for (const m of allMovies) {
      if (!m.genre) continue;
      const genres = m.genre.split(/[\s\/]+/).map((g: string) => g.trim()).filter(Boolean);
      for (const g of genres) {
        if (!genreMap[g]) genreMap[g] = { count: 0, totalRating: 0 };
        genreMap[g].count++;
        genreMap[g].totalRating += m.rating || 0;
      }
    }

    const topGenres = Object.entries(genreMap)
      .map(([genre, val]) => ({
        genre,
        count: val.count,
        avgRating: parseFloat((val.totalRating / val.count).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top Directors
    const topDirectors = db.prepare(`
      SELECT director, COUNT(*) as count, ROUND(AVG(rating), 2) as avgRating
      FROM clean_douban_movie_data
      WHERE director IS NOT NULL AND director != '' AND director != '未知'
      GROUP BY director
      HAVING count >= 2
      ORDER BY count DESC, avgRating DESC
      LIMIT 12
    `).all();

    // Country / Region Breakdown
    const topCountries = db.prepare(`
      SELECT country, COUNT(*) as count
      FROM clean_douban_movie_data
      WHERE country IS NOT NULL AND country != ''
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // Release Year / Decade Trend
    const decadeTrend = db.prepare(`
      SELECT 
        (year / 10 * 10) || '年代' as decade,
        COUNT(*) as count,
        ROUND(AVG(rating), 2) as avgRating
      FROM clean_douban_movie_data
      WHERE year IS NOT NULL AND year > 1900
      GROUP BY decade
      ORDER BY MIN(year) ASC
    `).all();

    // Rating vs Reviews Correlation Sample
    const ratingVsReviews = db.prepare(`
      SELECT title, rating, rating_count as reviewCount
      FROM clean_douban_movie_data
      ORDER BY rating_count DESC
      LIMIT 50
    `).all();

    // Top Rated & Most Reviewed Movies
    const topRatedMovies = db.prepare(`
      SELECT id, title, director, rating, rating_count, year, genre
      FROM clean_douban_movie_data
      ORDER BY rating DESC, rating_count DESC
      LIMIT 5
    `).all();

    const mostReviewedMovies = db.prepare(`
      SELECT id, title, director, rating, rating_count, year, genre
      FROM clean_douban_movie_data
      ORDER BY rating_count DESC
      LIMIT 5
    `).all();

    res.json({
      ...overall,
      ratingDist,
      topGenres,
      topDirectors,
      topCountries,
      decadeTrend,
      ratingVsReviews,
      topRatedMovies,
      mostReviewedMovies,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. Personal Watchlist / Favorites API (用户收藏 API)
// ----------------------------------------------------

// Get User Favorites
app.get('/api/favorites', (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: '缺少userId参数' });
    }

    const favorites = db.prepare(`
      SELECT f.id as favorite_id, f.note, f.created_at as favorited_at, m.*
      FROM user_favorites f
      JOIN clean_douban_movie_data m ON f.movie_id = m.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(String(userId));

    res.json(favorites);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Favorite
app.post('/api/favorites', (req, res) => {
  try {
    const { userId, movieId, note } = req.body;
    if (!userId || !movieId) {
      return res.status(400).json({ error: 'userId和movieId为必填项' });
    }

    const check = db.prepare('SELECT id FROM user_favorites WHERE user_id = ? AND movie_id = ?').get(String(userId), String(movieId));
    if (check) {
      return res.status(400).json({ error: '已在您的收藏列表中' });
    }

    db.prepare('INSERT INTO user_favorites (user_id, movie_id, note) VALUES (?, ?, ?)').run(String(userId), String(movieId), note || '');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Favorite
app.delete('/api/favorites/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM user_favorites WHERE id = ?').run(String(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. Interactive SQL Console API (支持SQL查询 Console)
// ----------------------------------------------------
app.post('/api/sql/execute', (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: '请输入有效的 SQL 语句' });
    }

    const trimmedSql = sql.trim();
    // Safety check: Only allow SELECT queries to prevent corrupting database unintentionally
    if (!trimmedSql.toLowerCase().startsWith('select')) {
      return res.status(403).json({ error: 'SQL控制台目前仅支持 SELECT 读查询语句，以保障数据库安全' });
    }

    const startTime = Date.now();
    const rows = db.prepare(trimmedSql).all();
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      rowCount: rows.length,
      durationMs: duration,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      data: rows,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. Gemini AI Assistant & Recommender API (AI智能影评 - 手动密钥与动态模型)
// ----------------------------------------------------

// List models using custom API Key
app.post('/api/ai/models', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ error: '请先填写有效的 Gemini API 密钥' });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const listPager = await ai.models.list();
    const rawModels: any[] = [];

    if (listPager && Array.isArray((listPager as any).models)) {
      rawModels.push(...(listPager as any).models);
    } else if (listPager && typeof (listPager as any)[Symbol.asyncIterator] === 'function') {
      for await (const m of listPager) {
        rawModels.push(m);
      }
    } else if (listPager && typeof (listPager as any)[Symbol.iterator] === 'function') {
      for (const m of listPager as any) {
        rawModels.push(m);
      }
    }

    const formattedModels = rawModels
      .map((m: any) => {
        const rawName = m.name || '';
        const cleanName = rawName.replace(/^models\//, '');
        return {
          id: cleanName,
          rawName: rawName,
          displayName: m.displayName || cleanName,
          description: m.description || '',
          supportedGenerationMethods: m.supportedGenerationMethods || [],
        };
      })
      .filter((m: any) => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.length > 0) {
          return m.supportedGenerationMethods.includes('generateContent');
        }
        return m.id.includes('gemini') || m.id.includes('gemma');
      });

    if (formattedModels.length === 0) {
      return res.status(404).json({ error: '该 API 密钥账户下未找到可用的 Gemini 文本生成模型' });
    }

    res.json({ success: true, models: formattedModels });
  } catch (err: any) {
    console.error('[Get Models Error]:', err);
    res.status(400).json({
      error: err.message || '获取模型列表失败，请检查 API 密钥是否输入正确。',
    });
  }
});

// Test a specific model with test prompt
app.post('/api/ai/test-model', async (req, res) => {
  try {
    const { apiKey, model, testPrompt = '你好' } = req.body;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: '请提供 API 密钥' });
    }
    if (!model || !model.trim()) {
      return res.status(400).json({ error: '请提供测试模型名称' });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const startTime = Date.now();
    const result = await ai.models.generateContent({
      model: model.trim(),
      contents: testPrompt,
    });
    const endTime = Date.now();

    res.json({
      success: true,
      model: model,
      reply: result.text || '无返回文本',
      responseTimeMs: endTime - startTime,
    });
  } catch (err: any) {
    console.error(`[Test Model ${req.body.model} Error]:`, err);
    res.json({
      success: false,
      model: req.body.model,
      error: err.message || '模型测试响应失败',
    });
  }
});

// AI Generation / Analysis using custom key and chosen model
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { apiKey, model, prompt, type = 'general', movieId } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        error: '未输入 API 密钥，请在页面顶部手动填写您的 Gemini API Key。',
      });
    }

    if (!model || !model.trim()) {
      return res.status(400).json({
        error: '未选择模型，请先获取并选择要使用的 AI 模型。',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Context from database
    let dbContext = '';
    if (movieId) {
      const movie = db.prepare('SELECT * FROM clean_douban_movie_data WHERE id = ?').get(movieId) as any;
      if (movie) {
        dbContext = `\n目标电影详情：\n名称: ${movie.title}\n导演: ${movie.director}\n主演: ${movie.actors}\n类型: ${movie.genre}\n豆瓣评分: ${movie.rating} (${movie.rating_count}人评价)\n5星占比: ${movie.five_star}, 4星占比: ${movie.four_star}\n上映时间: ${movie.release_date}\n`;
      }
    }

    // System instruction
    const systemInstruction = `你是一位资深豆瓣电影首席数据分析师与影评专家。
你的任务是基于豆瓣电影1769条精选数据集，为用户提供客观、专业、生动且富有深度的电影数据分析、AI影评剖析与个性化推荐。
输出格式使用清晰的 Markdown 标题与列表，语气专业自然、富有文采。`;

    const userQuery = `${dbContext}\n用户问题/需求: ${prompt || '请对当前豆瓣电影数据集进行全面亮点洞察与推荐'}`;

    const geminiResponse = await ai.models.generateContent({
      model: model.trim(),
      contents: userQuery,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ response: geminiResponse.text, modelUsed: model });
  } catch (err: any) {
    console.error('[Gemini AI Error]:', err);
    res.status(500).json({ error: err.message || 'AI 分析生成失败' });
  }
});

// Download Dynamic CSV Endpoint (Export from SQLite DB)
app.get('/api/movies/export/csv', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM clean_douban_movie_data ORDER BY id ASC').all() as any[];

    const formattedData = rows.map((r) => ({
      '电影ID': r.movie_id || r.id,
      '电影链接': r.link || '',
      '电影名称': r.title || '',
      '导演': r.director || '',
      '编剧': r.screenwriter || '',
      '主演': r.actors || '',
      '类型': r.genre || '',
      '制片国家/地区': r.country || '',
      '语言': r.language || '',
      '上映日期': r.release_date || '',
      '片长': r.runtime || '',
      '又名': r.alias || '',
      'IMDb': r.imdb || '',
      '豆瓣评分': r.rating !== undefined && r.rating !== null ? r.rating : '',
      '评价人数': r.rating_count !== undefined && r.rating_count !== null ? r.rating_count : '',
      '5星': r.five_star || '',
      '4星': r.four_star || '',
    }));

    const csvString = Papa.unparse(formattedData);
    // Include UTF-8 BOM (\uFEFF) to ensure Chinese characters open correctly in Excel / WPS
    const csvContentWithBom = '\uFEFF' + csvString;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clean_douban_movie_data.csv"');
    res.status(200).send(csvContentWithBom);
  } catch (err: any) {
    console.error('[Export CSV Error]:', err);
    res.status(500).json({ error: err.message || '导出 CSV 失败' });
  }
});

// ----------------------------------------------------
// 7. Vite Integration & Development / Production Server
// ----------------------------------------------------
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Douban Movie Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
