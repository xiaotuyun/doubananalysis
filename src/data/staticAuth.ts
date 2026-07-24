import { User } from '../types';
import { ALL_STATIC_MOVIES, getStoredMovies } from './staticAnalytics';

const PRESET_USERS: (User & { password?: string })[] = [
  { id: 1, account: 'admin', username: '系统管理员', created_at: '2024-01-01 00:00:00', password: '123456' },
  { id: 2, account: 'user', username: '影评极客', created_at: '2024-01-02 12:00:00', password: '123456' },
];

export function getLocalUsers(): (User & { password?: string })[] {
  try {
    const raw = localStorage.getItem('douban_local_users');
    const customUsers: (User & { password?: string })[] = raw ? JSON.parse(raw) : [];
    
    // Filter deleted preset IDs
    const deletedRaw = localStorage.getItem('douban_deleted_user_ids');
    const deletedIds: number[] = deletedRaw ? JSON.parse(deletedRaw) : [];

    const activePresets = PRESET_USERS.filter(u => !deletedIds.includes(u.id));
    return [...activePresets, ...customUsers];
  } catch {
    return PRESET_USERS;
  }
}

export function localLogin(account: string, pass: string): User {
  const users = getLocalUsers();
  const acc = account.trim();
  const found = users.find(u => u.account === acc);

  if (!found) {
    throw new Error('账号不存在');
  }

  if (found.password && found.password !== pass) {
    throw new Error('密码错误，请重新输入');
  }

  const { password, ...userObj } = found;
  return userObj;
}

export function localRegister(username: string, account: string, pass: string): User {
  const users = getLocalUsers();
  const acc = account.trim();
  const uname = username.trim() || acc;

  if (users.some(u => u.account === acc)) {
    throw new Error('该账号已被占用，请使用其他账号名');
  }

  const newUser: User & { password?: string } = {
    id: Date.now(),
    account: acc,
    username: uname,
    password: pass,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  try {
    const raw = localStorage.getItem('douban_local_users');
    const customUsers: (User & { password?: string })[] = raw ? JSON.parse(raw) : [];
    customUsers.push(newUser);
    localStorage.setItem('douban_local_users', JSON.stringify(customUsers));
  } catch {}

  const { password, ...userObj } = newUser;
  return userObj;
}

export function localDeleteUser(id: number): boolean {
  if (id === 1) {
    throw new Error('超级管理员 admin 受保护，不可删除');
  }

  try {
    const raw = localStorage.getItem('douban_local_users');
    let customUsers: (User & { password?: string })[] = raw ? JSON.parse(raw) : [];
    const isCustom = customUsers.some(u => u.id === id);

    if (isCustom) {
      customUsers = customUsers.filter(u => u.id !== id);
      localStorage.setItem('douban_local_users', JSON.stringify(customUsers));
    } else {
      const deletedRaw = localStorage.getItem('douban_deleted_user_ids');
      const deletedIds: number[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(id)) deletedIds.push(id);
      localStorage.setItem('douban_deleted_user_ids', JSON.stringify(deletedIds));
    }
    return true;
  } catch {
    return false;
  }
}

export function localExecuteSql(sql: string) {
  const cleanSql = sql.trim().toLowerCase();

  if (cleanSql.includes('from users')) {
    const users = getLocalUsers().map(u => ({
      id: u.id,
      username: u.username,
      account: u.account,
      created_at: u.created_at,
    }));
    return {
      columns: ['id', 'username', 'account', 'created_at'],
      rows: users,
      rowCount: users.length,
    };
  }

  // Querying clean_douban_movie_data
  const movies = getStoredMovies();
  let resultList = [...movies];

  if (cleanSql.includes('where rating >= 9.0')) {
    resultList = resultList.filter(m => m.rating >= 9.0);
  }

  if (cleanSql.includes('order by rating desc')) {
    resultList.sort((a, b) => b.rating - a.rating);
  } else if (cleanSql.includes('order by rating_count desc')) {
    resultList.sort((a, b) => b.rating_count - a.rating_count);
  }

  let limit = 15;
  const limitMatch = cleanSql.match(/limit\s+(\d+)/);
  if (limitMatch) {
    limit = parseInt(limitMatch[1], 10);
  }

  resultList = resultList.slice(0, limit);

  const rows = resultList.map(m => ({
    title: m.title,
    director: m.director,
    rating: m.rating,
    rating_count: m.rating_count,
    year: m.year || 1990,
  }));

  return {
    columns: ['title', 'director', 'rating', 'rating_count', 'year'],
    rows,
    rowCount: rows.length,
  };
}
