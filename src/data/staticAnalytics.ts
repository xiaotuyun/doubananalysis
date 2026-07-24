import allMoviesRaw from './allMovies.json';
import { Movie, AnalyticsSummary, FilterOptions } from '../types';

export const ALL_STATIC_MOVIES: Movie[] = allMoviesRaw as Movie[];

// Helper to get all stored movies including local additions/updates
export function getStoredMovies(): Movie[] {
  try {
    const isCleared = localStorage.getItem('douban_cleared_all') === 'true';
    const custom = localStorage.getItem('douban_custom_movies');
    const customMovies: Movie[] = custom ? JSON.parse(custom) : [];
    
    const deletedIdsRaw = localStorage.getItem('douban_deleted_movie_ids');
    const deletedIds: number[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
    
    const baseMovies = isCleared ? [] : ALL_STATIC_MOVIES;
    
    // Deduplicate if customMovies overlay baseMovies
    let combined: Movie[] = [];
    if (baseMovies.length > 0 && customMovies.length > 0) {
      const customKeys = new Set(customMovies.map(m => String(m.movie_id || m.title || m.id)));
      const filteredBase = baseMovies.filter(m => !customKeys.has(String(m.movie_id || m.title || m.id)));
      combined = [...filteredBase, ...customMovies];
    } else {
      combined = [...baseMovies, ...customMovies];
    }

    return combined.filter(m => !deletedIds.includes(m.id));
  } catch {
    return ALL_STATIC_MOVIES;
  }
}

export function getStaticMovies(options: FilterOptions) {
  let movies = getStoredMovies();

  const search = options.search?.trim().toLowerCase();
  const genre = options.genre;
  const country = options.country;
  const minRating = options.minRating;
  const maxRating = options.maxRating;
  const startYear = options.startYear;
  const endYear = options.endYear;
  const sortBy = options.sortBy || 'rating';
  const sortOrder = options.sortOrder || 'desc';
  const page = options.page || 1;
  const limit = options.limit || 12;

  if (search) {
    movies = movies.filter(m =>
      m.title.toLowerCase().includes(search) ||
      m.director.toLowerCase().includes(search) ||
      m.actors.toLowerCase().includes(search) ||
      m.alias.toLowerCase().includes(search)
    );
  }

  if (genre) {
    movies = movies.filter(m => m.genre.includes(genre));
  }

  if (country) {
    movies = movies.filter(m => m.country.includes(country));
  }

  if (minRating !== undefined && !isNaN(minRating)) {
    movies = movies.filter(m => m.rating >= minRating);
  }

  if (maxRating !== undefined && !isNaN(maxRating)) {
    movies = movies.filter(m => m.rating <= maxRating);
  }

  if (startYear !== undefined && !isNaN(startYear)) {
    movies = movies.filter(m => (m.year || 0) >= startYear);
  }

  if (endYear !== undefined && !isNaN(endYear)) {
    movies = movies.filter(m => (m.year || 0) <= endYear);
  }

  // Sort
  movies.sort((a, b) => {
    let valA = a[sortBy as keyof Movie] as any;
    let valB = b[sortBy as keyof Movie] as any;

    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const total = movies.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedMovies = movies.slice(startIndex, startIndex + limit);

  return {
    movies: paginatedMovies,
    total,
    page,
    limit,
    totalPages,
  };
}

export function getStaticAnalyticsSummary(): AnalyticsSummary {
  const movies = getStoredMovies();
  const totalMovies = movies.length;

  if (totalMovies === 0) {
    return {
      totalMovies: 0,
      avgRating: 0,
      maxRating: 0,
      totalReviews: 0,
      ratingDist: [],
      topGenres: [],
      topDirectors: [],
      topCountries: [],
      decadeTrend: [],
      ratingVsReviews: [],
      topRatedMovies: [],
      mostReviewedMovies: [],
    };
  }

  const sumRating = movies.reduce((acc, m) => acc + (m.rating || 0), 0);
  const avgRating = Number((sumRating / totalMovies).toFixed(2));
  const maxRating = Math.max(...movies.map(m => m.rating || 0));
  const totalReviews = movies.reduce((acc, m) => acc + (m.rating_count || 0), 0);

  // Rating Distribution
  const r8_0 = movies.filter(m => m.rating >= 8.0 && m.rating < 8.5).length;
  const r8_5 = movies.filter(m => m.rating >= 8.5 && m.rating < 8.9).length;
  const r8_9 = movies.filter(m => m.rating >= 8.9 && m.rating < 9.3).length;
  const r9_3 = movies.filter(m => m.rating >= 9.3).length;
  const rOthers = movies.filter(m => m.rating < 8.0).length;

  const ratingDist = [
    { range: '< 8.0分', count: rOthers },
    { range: '8.0-8.4分', count: r8_0 },
    { range: '8.5-8.8分', count: r8_5 },
    { range: '8.9-9.2分', count: r8_9 },
    { range: '9.3分及以上神作', count: r9_3 },
  ].filter(item => item.count > 0);

  // Top Genres
  const genreMap: Record<string, { count: number; totalRating: number }> = {};
  movies.forEach(m => {
    if (!m.genre) return;
    const parts = m.genre.split('/').map(s => s.trim()).filter(Boolean);
    parts.forEach(g => {
      if (!genreMap[g]) genreMap[g] = { count: 0, totalRating: 0 };
      genreMap[g].count += 1;
      genreMap[g].totalRating += m.rating || 0;
    });
  });

  const topGenres = Object.entries(genreMap)
    .map(([genre, data]) => ({
      genre,
      count: data.count,
      avgRating: Number((data.totalRating / data.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top Directors
  const dirMap: Record<string, { count: number; totalRating: number }> = {};
  movies.forEach(m => {
    if (!m.director || m.director === '未知') return;
    const dirs = m.director.split('/').map(s => s.trim()).filter(Boolean);
    dirs.forEach(d => {
      if (!dirMap[d]) dirMap[d] = { count: 0, totalRating: 0 };
      dirMap[d].count += 1;
      dirMap[d].totalRating += m.rating || 0;
    });
  });

  const topDirectors = Object.entries(dirMap)
    .map(([director, data]) => ({
      director,
      count: data.count,
      avgRating: Number((data.totalRating / data.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count || b.avgRating - a.avgRating)
    .slice(0, 10);

  // Top Countries
  const countryMap: Record<string, number> = {};
  movies.forEach(m => {
    if (!m.country) return;
    const cList = m.country.split('/').map(s => s.trim()).filter(Boolean);
    cList.forEach(c => {
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
  });

  const topCountries = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Decade Trend
  const decadeMap: Record<string, { count: number; totalRating: number }> = {};
  movies.forEach(m => {
    const y = m.year || 0;
    if (!y) return;
    let dec = '1970年代及更早';
    if (y >= 2020) dec = '2020s';
    else if (y >= 2010) dec = '2010s';
    else if (y >= 2000) dec = '2000s';
    else if (y >= 1990) dec = '1990s';
    else if (y >= 1980) dec = '1980s';

    if (!decadeMap[dec]) decadeMap[dec] = { count: 0, totalRating: 0 };
    decadeMap[dec].count += 1;
    decadeMap[dec].totalRating += m.rating || 0;
  });

  const decadeOrder = ['1970年代及更早', '1980s', '1990s', '2000s', '2010s', '2020s'];
  const decadeTrend = decadeOrder
    .filter(d => decadeMap[d])
    .map(d => ({
      decade: d,
      count: decadeMap[d].count,
      avgRating: Number((decadeMap[d].totalRating / decadeMap[d].count).toFixed(2)),
    }));

  // Scatter plot (Rating vs Reviews)
  const ratingVsReviews = movies.slice(0, 100).map(m => ({
    title: m.title,
    rating: m.rating,
    reviewCount: m.rating_count,
  }));

  // Top Rated & Most Reviewed
  const sortedByRating = [...movies].sort((a, b) => b.rating - a.rating || b.rating_count - a.rating_count);
  const sortedByReviews = [...movies].sort((a, b) => b.rating_count - a.rating_count);

  return {
    totalMovies,
    avgRating,
    maxRating,
    totalReviews,
    ratingDist,
    topGenres,
    topDirectors,
    topCountries,
    decadeTrend,
    ratingVsReviews,
    topRatedMovies: sortedByRating.slice(0, 10),
    mostReviewedMovies: sortedByReviews.slice(0, 10),
  };
}

export function getStaticDetailedAnalyticsData() {
  const movies = getStoredMovies();

  // 1. Runtime Distribution
  let rUnder90 = 0, r90_120 = 0, r120_150 = 0, rOver150 = 0;
  let sUnder90 = 0, s90_120 = 0, s120_150 = 0, sOver150 = 0;
  let revUnder90 = 0, rev90_120 = 0, rev120_150 = 0, revOver150 = 0;

  movies.forEach(m => {
    const mins = parseInt(m.runtime || '0', 10) || 0;
    if (mins <= 0) return;
    if (mins < 90) {
      rUnder90++; sUnder90 += m.rating; revUnder90 += m.rating_count;
    } else if (mins <= 120) {
      r90_120++; s90_120 += m.rating; rev90_120 += m.rating_count;
    } else if (mins <= 150) {
      r120_150++; s120_150 += m.rating; rev120_150 += m.rating_count;
    } else {
      rOver150++; sOver150 += m.rating; revOver150 += m.rating_count;
    }
  });

  const runtimeDist = [
    { range: '< 90分钟', count: rUnder90, avgRating: rUnder90 ? Number((sUnder90 / rUnder90).toFixed(2)) : 0, avgReviews: rUnder90 ? Math.round(revUnder90 / rUnder90) : 0 },
    { range: '90-120分钟', count: r90_120, avgRating: r90_120 ? Number((s90_120 / r90_120).toFixed(2)) : 0, avgReviews: r90_120 ? Math.round(rev90_120 / r90_120) : 0 },
    { range: '120-150分钟', count: r120_150, avgRating: r120_150 ? Number((s120_150 / r120_150).toFixed(2)) : 0, avgReviews: r120_150 ? Math.round(rev120_150 / r120_150) : 0 },
    { range: '> 150分钟', count: rOver150, avgRating: rOver150 ? Number((sOver150 / rOver150).toFixed(2)) : 0, avgReviews: rOver150 ? Math.round(revOver150 / rOver150) : 0 },
  ];

  // 2. Country Stats
  const cMap: Record<string, { count: number; totalRating: number; totalRev: number; high9Count: number }> = {};
  movies.forEach(m => {
    if (!m.country) return;
    const parts = m.country.split('/').map(s => s.trim()).filter(Boolean);
    parts.forEach(c => {
      if (!cMap[c]) cMap[c] = { count: 0, totalRating: 0, totalRev: 0, high9Count: 0 };
      cMap[c].count++;
      cMap[c].totalRating += m.rating || 0;
      cMap[c].totalRev += m.rating_count || 0;
      if (m.rating >= 9.0) cMap[c].high9Count++;
    });
  });

  const countryStats = Object.entries(cMap)
    .map(([country, d]) => ({
      country,
      count: d.count,
      avgRating: Number((d.totalRating / d.count).toFixed(2)),
      avgReviews: Math.round(d.totalRev / d.count),
      high9Ratio: Number(((d.high9Count / d.count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // 3. Language Stats
  const lMap: Record<string, { count: number; totalRating: number }> = {};
  movies.forEach(m => {
    if (!m.language) return;
    const parts = m.language.split('/').map(s => s.trim()).filter(Boolean);
    parts.forEach(l => {
      if (!lMap[l]) lMap[l] = { count: 0, totalRating: 0 };
      lMap[l].count++;
      lMap[l].totalRating += m.rating || 0;
    });
  });

  const languageStats = Object.entries(lMap)
    .map(([language, d]) => ({
      language,
      count: d.count,
      avgRating: Number((d.totalRating / d.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Star Rating Breakdown (5-star average, 4-star average, 3-star and below)
  let fiveStarSum = 0, fourStarSum = 0, countStar = 0;
  movies.forEach(m => {
    const f5 = parseFloat(m.five_star || '0');
    const f4 = parseFloat(m.four_star || '0');
    if (f5 > 0) {
      fiveStarSum += f5;
      fourStarSum += f4;
      countStar++;
    }
  });

  const avg5 = countStar ? Number((fiveStarSum / countStar).toFixed(1)) : 55.0;
  const avg4 = countStar ? Number((fourStarSum / countStar).toFixed(1)) : 33.0;
  const avgRest = Number((100 - avg5 - avg4).toFixed(1));

  const starRatingBreakdown = [
    { name: '5星 (极力推荐)', value: avg5, color: '#10b981' },
    { name: '4星 (推荐)', value: avg4, color: '#3b82f6' },
    { name: '3星及以下 (一般/较差)', value: Math.max(0, avgRest), color: '#f59e0b' },
  ];

  // 5. Score Ranges
  const scoreRanges = [
    { range: '8.0 - 8.4分', count: movies.filter(m => m.rating >= 8.0 && m.rating < 8.5).length },
    { range: '8.5 - 8.8分', count: movies.filter(m => m.rating >= 8.5 && m.rating < 8.9).length },
    { range: '8.9 - 9.2分', count: movies.filter(m => m.rating >= 8.9 && m.rating < 9.3).length },
    { range: '9.3分以上神作', count: movies.filter(m => m.rating >= 9.3).length },
  ];

  // 6. Yearly Trend
  const yearMap: Record<number, { count: number; totalRating: number }> = {};
  movies.forEach(m => {
    const y = m.year;
    if (!y || y < 1950) return;
    if (!yearMap[y]) yearMap[y] = { count: 0, totalRating: 0 };
    yearMap[y].count++;
    yearMap[y].totalRating += m.rating || 0;
  });

  const yearlyTrend = Object.entries(yearMap)
    .map(([yr, d]) => ({
      year: Number(yr),
      count: d.count,
      avgRating: Number((d.totalRating / d.count).toFixed(2)),
    }))
    .sort((a, b) => a.year - b.year);

  // 7. Genre Deep Stats
  const gMap: Record<string, { count: number; totalRating: number; totalRev: number; high9Count: number; maxRating: number; topTitle: string }> = {};
  movies.forEach(m => {
    if (!m.genre) return;
    const parts = m.genre.split('/').map(s => s.trim()).filter(Boolean);
    parts.forEach(g => {
      if (!gMap[g]) {
        gMap[g] = { count: 0, totalRating: 0, totalRev: 0, high9Count: 0, maxRating: 0, topTitle: '' };
      }
      gMap[g].count++;
      gMap[g].totalRating += m.rating || 0;
      gMap[g].totalRev += m.rating_count || 0;
      if (m.rating >= 9.0) gMap[g].high9Count++;
      if (m.rating > gMap[g].maxRating) {
        gMap[g].maxRating = m.rating;
        gMap[g].topTitle = m.title;
      }
    });
  });

  const genreDeepStats = Object.entries(gMap)
    .map(([genre, d]) => ({
      genre,
      count: d.count,
      avgRating: Number((d.totalRating / d.count).toFixed(2)),
      high9Ratio: Number(((d.high9Count / d.count) * 100).toFixed(1)),
      high9Count: d.high9Count,
      maxRating: d.maxRating,
      topTitle: d.topTitle,
      avgReviews: Math.round(d.totalRev / d.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 8. Radar Chart
  const genreRadar = genreDeepStats.slice(0, 6).map(g => ({
    genre: g.genre,
    作品量: Math.min(100, Math.round((g.count / movies.length) * 500)),
    均分指数: Math.round(g.avgRating * 10),
    神作占比: Math.round(g.high9Ratio),
    热度指数: Math.min(100, Math.round(g.avgReviews / 10000)),
  }));

  // 9. Scatter Movies
  const scatterMovies = movies.slice(0, 20).map(m => ({
    title: m.title,
    rating: m.rating,
    rating_count: m.rating_count,
    genre: m.genre,
    year: m.year || 2000,
  }));

  // 10. Top 15 Popular
  const sortedPopular = [...movies].sort((a, b) => b.rating_count - a.rating_count).slice(0, 15);
  const top15Popular = sortedPopular.map(m => ({
    title: m.title.length > 8 ? m.title.slice(0, 8) + '...' : m.title,
    fullTitle: m.title,
    reviews: Math.round((m.rating_count || 0) / 10000),
    rating: m.rating,
  }));

  // 11. Quadrants
  const avgR = 8.8;
  const avgRev = 500000;
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
  movies.forEach(m => {
    if (m.rating >= avgR && m.rating_count >= avgRev) q1++;
    else if (m.rating >= avgR && m.rating_count < avgRev) q2++;
    else if (m.rating < avgR && m.rating_count >= avgRev) q3++;
    else q4++;
  });

  return {
    runtimeDist,
    countryStats,
    languageStats,
    starRatingBreakdown,
    scoreRanges,
    yearlyTrend,
    genreDeepStats,
    genreRadar,
    scatterMovies,
    top15Popular,
    quadrants: {
      highRatingHighReviews: q1,
      highRatingLowReviews: q2,
      avgRatingHighReviews: q3,
      avgRatingLowReviews: q4,
    },
  };
}
