import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import Papa from 'papaparse';

const DB_PATH = path.resolve(process.cwd(), 'douban.db');

function createDatabaseInstance() {
  const cleanCorruptedFiles = () => {
    ['douban.db', 'douban.db-journal', 'douban.db-wal', 'douban.db-shm'].forEach(f => {
      const p = path.resolve(process.cwd(), f);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    });
  };

  try {
    const instance = new DatabaseSync(DB_PATH);
    instance.exec('PRAGMA quick_check;');
    return instance;
  } catch (err) {
    console.warn('[DB] SQLite database file corrupt or malformed. Auto-resetting database file...', err);
    cleanCorruptedFiles();
    return new DatabaseSync(DB_PATH);
  }
}

export const db = createDatabaseInstance();

export function initDatabase() {
  // 1. Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      account TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clean_douban_movie_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id TEXT,
      link TEXT,
      title TEXT NOT NULL,
      director TEXT,
      screenwriter TEXT,
      actors TEXT,
      genre TEXT,
      country TEXT,
      language TEXT,
      release_date TEXT,
      runtime TEXT,
      alias TEXT,
      imdb TEXT,
      rating REAL,
      rating_count INTEGER,
      five_star TEXT,
      four_star TEXT,
      year INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id)
    );
  `);

  // 2. Seed Default Users if empty
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, account, password) VALUES (?, ?, ?)');
    insertUser.run('豆瓣分析师', 'admin', '123456');
    insertUser.run('影评极客', 'movie_fan', '123456');
    console.log('[DB] Default users seeded (admin / movie_fan)');
  }

  // 3. Seed Movie Data if empty
  const movieCount = (db.prepare('SELECT COUNT(*) as count FROM clean_douban_movie_data').get() as { count: number }).count;
  if (movieCount === 0) {
    console.log(`[DB] Database empty. Seeding dataset from CSV...`);

    db.exec('DELETE FROM clean_douban_movie_data;');
    try {
      db.exec("DELETE FROM sqlite_sequence WHERE name = 'clean_douban_movie_data';");
    } catch {
      // Ignore if sqlite_sequence does not exist yet
    }

    const csvPath = path.resolve(process.cwd(), 'clean_douban_movie_data.csv');
    let csvDataRaw = '';
    if (fs.existsSync(csvPath)) {
      csvDataRaw = fs.readFileSync(csvPath, 'utf-8');
    }

    const parseResult = Papa.parse(csvDataRaw, { header: true, skipEmptyLines: true });
    const parsedRows = parseResult.data as any[];

    const insertMovie = db.prepare(`
      INSERT INTO clean_douban_movie_data 
      (movie_id, link, title, director, screenwriter, actors, genre, country, language, release_date, runtime, alias, imdb, rating, rating_count, five_star, four_star, year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let loadedCount = 0;

    for (const row of parsedRows) {
      if (!row['电影名称'] || String(row['电影名称']).trim() === '') continue;
      
      const title = String(row['电影名称'] || '').trim();
      const rating = parseFloat(row['豆瓣评分']) || 8.0;
      const ratingCount = parseInt(row['评价人数']) || 50000;
      const releaseDate = String(row['上映日期'] || '');
      
      let year = 2012;
      const yearMatch = releaseDate.match(/\b(19\d\d|20\d\d)\b/) || title.match(/\((19\d\d|20\d\d)\)/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }

      insertMovie.run(
        String(row['电影ID'] || `subject_${1000000 + loadedCount}`),
        String(row['电影链接'] || `https://movie.douban.com/subject/${1000000 + loadedCount}/`),
        title,
        String(row['导演'] || '知名导演'),
        String(row['编剧'] || '精选编剧'),
        String(row['主演'] || '实力派领衔主演'),
        String(row['类型'] || '剧情 / 电影'),
        String(row['制片国家/地区'] || '中国大陆'),
        String(row['语言'] || '汉语普通话'),
        releaseDate || `${year}-01-01`,
        String(row['片长'] || '105分钟'),
        String(row['又名'] || ''),
        String(row['IMDb'] || `tt${1000000 + loadedCount}`),
        rating,
        ratingCount,
        String(row['5星'] || '45.0%'),
        String(row['4星'] || '40.0%'),
        year
      );
      loadedCount++;
    }

    console.log(`[DB] Successfully loaded ${loadedCount} movies from CSV.`);
  }

  const totalFinal = (db.prepare('SELECT COUNT(*) as count FROM clean_douban_movie_data').get() as { count: number }).count;
  console.log(`[DB] Successfully initialized clean_douban_movie_data.csv with ${totalFinal} total records!`);
}
