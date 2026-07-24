import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Download, Star, ExternalLink, Edit3, Trash2, 
  ChevronLeft, ChevronRight, Eye, Grid, List, Sparkles, Heart, Film,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, RefreshCw, FileText, DownloadCloud, Lock, LogIn
} from 'lucide-react';
import Papa from 'papaparse';
import { Movie, User } from '../types';
import { getStaticMovies, getStoredMovies, ALL_STATIC_MOVIES } from '../data/staticAnalytics';

interface MovieLibraryProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectMovieDetail: (movie: Movie) => void;
  onSelectMovieAI: (movie: Movie) => void;
  favorites: number[];
  onToggleFavorite: (movieId: number) => void;
  onMovieCountChange?: () => void;
}

const FALLBACK_MOVIES: Movie[] = [
  { id: 1, movie_id: '1292052', link: 'https://movie.douban.com/subject/1292052/', title: '肖申克的救赎', director: '弗兰克·德拉邦特', screenwriter: '弗兰克·德拉邦特', actors: '蒂姆·罗宾斯 / 摩根·弗里曼', genre: '剧情 / 犯罪', country: '美国', language: '英语', release_date: '1994-09-10', runtime: '142分钟', alias: '月黑高飞 / 刺激1995', imdb: 'tt0111161', rating: 9.7, rating_count: 2980000, five_star: '85.2%', four_star: '12.4%', year: 1994 },
  { id: 2, movie_id: '1291546', link: 'https://movie.douban.com/subject/1291546/', title: '霸王别姬', director: '陈凯歌', screenwriter: '李碧华 / 芦苇', actors: '张国荣 / 张丰毅 / 巩俐', genre: '剧情 / 爱情 / 同性', country: '中国大陆 / 中国香港', language: '汉语普通话', release_date: '1993-01-01', runtime: '171分钟', alias: '再见，我的妾 / Farewell My Concubine', imdb: 'tt0106332', rating: 9.6, rating_count: 2120000, five_star: '82.1%', four_star: '14.3%', year: 1993 },
  { id: 3, movie_id: '1295038', link: 'https://movie.douban.com/subject/1295038/', title: '哈利·波特与魔法石', director: '克里斯·哥伦布', screenwriter: '史蒂夫·克洛夫斯', actors: '丹尼尔·雷德克里夫 / 艾玛·沃森', genre: '奇幻 / 冒险', country: '英国 / 美国', language: '英语', release_date: '2001-11-16', runtime: '152分钟', alias: '哈利波特1', imdb: 'tt0241527', rating: 9.2, rating_count: 1250000, five_star: '68.0%', four_star: '25.0%', year: 2001 },
  { id: 4, movie_id: '1292720', link: 'https://movie.douban.com/subject/1292720/', title: '阿甘正传', director: '罗伯特·泽米吉斯', screenwriter: '埃里克·罗斯', actors: '汤姆·汉克斯 / 罗宾·怀特', genre: '剧情 / 爱情', country: '美国', language: '英语', release_date: '1994-06-23', runtime: '142分钟', alias: '福雷斯特·甘普', imdb: 'tt0109830', rating: 9.5, rating_count: 2190000, five_star: '78.5%', four_star: '17.2%', year: 1994 },
  { id: 5, movie_id: '1292722', link: 'https://movie.douban.com/subject/1292722/', title: '泰坦尼克号', director: '詹姆斯·卡梅隆', screenwriter: '詹姆斯·卡梅隆', actors: '莱昂纳多·迪卡普里奥 / 凯特·温丝莱特', genre: '剧情 / 爱情 / 灾难', country: '美国', language: '英语 / 意大利语', release_date: '1997-12-19', runtime: '194分钟', alias: '铁达尼号', imdb: 'tt0120338', rating: 9.5, rating_count: 2100000, five_star: '77.8%', four_star: '18.1%', year: 1997 },
  { id: 6, movie_id: '1291561', link: 'https://movie.douban.com/subject/1291561/', title: '千与千寻', director: '宫崎骏', screenwriter: '宫崎骏', actors: '柊瑠美 / 入野自由 / 夏木真理', genre: '剧情 / 动画 / 奇幻', country: '日本', language: '日语', release_date: '2001-07-20', runtime: '125分钟', alias: '神隐少女 / Spirited Away', imdb: 'tt0245429', rating: 9.4, rating_count: 2280000, five_star: '74.2%', four_star: '21.0%', year: 2001 },
  { id: 7, movie_id: '3541415', link: 'https://movie.douban.com/subject/3541415/', title: '盗梦空间', director: '克里斯托弗·诺兰', screenwriter: '克里斯托弗·诺兰', actors: '莱昂纳多·迪卡普里奥 / 约瑟夫·高登-莱维特', genre: '剧情 / 科幻 / 悬疑 / 冒险', country: '美国 / 英国', language: '英语 / 日语', release_date: '2010-07-16', runtime: '148分钟', alias: '奠基 / 潜行凶间', imdb: 'tt1375666', rating: 9.4, rating_count: 2050000, five_star: '73.5%', four_star: '21.5%', year: 2010 },
  { id: 8, movie_id: '1889243', link: 'https://movie.douban.com/subject/1889243/', title: '星际穿越', director: '克里斯托弗·诺兰', screenwriter: '乔纳森·诺兰 / 克里斯托弗·诺兰', actors: '马修·麦康纳 / 安妮·海瑟薇', genre: '剧情 / 科幻 / 冒险', country: '美国 / 英国 / 加拿大', language: '英语', release_date: '2014-11-07', runtime: '169分钟', alias: '星际启示录', imdb: 'tt0816692', rating: 9.4, rating_count: 1820000, five_star: '73.0%', four_star: '21.8%', year: 2014 },
];

export const MovieLibrary: React.FC<MovieLibraryProps> = ({
  currentUser,
  onOpenAuth,
  onSelectMovieDetail,
  onSelectMovieAI,
  favorites,
  onToggleFavorite,
  onMovieCountChange,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [country, setCountry] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'rating_count' | 'year' | 'id'>('rating');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    director: '',
    screenwriter: '',
    actors: '',
    genre: '剧情',
    country: '中国大陆',
    language: '汉语普通话',
    release_date: '2024-01-01',
    runtime: '120分钟',
    alias: '',
    imdb: '',
    rating: '8.5',
    rating_count: '50000',
    five_star: '50.0%',
    four_star: '35.0%',
  });

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Clear All Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearRestrictedModalOpen, setIsClearRestrictedModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirmClearAll = async () => {
    if (currentUser?.account !== 'admin') {
      alert('权限受限：清空数据功能仅限管理员（admin）操作！');
      setIsClearModalOpen(false);
      return;
    }
    setIsClearing(true);
    try {
      const res = await fetch('/api/movies', { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: currentUser?.account })
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('SERVER_OFFLINE');
      }
      const data = await res.json();
      if (data.success) {
        setIsClearModalOpen(false);
        fetchMovies();
        onMovieCountChange?.();
      } else {
        alert(data.error || '清空失败');
      }
    } catch (err: any) {
      if (err.message === 'SERVER_OFFLINE' || err.name === 'SyntaxError' || err.message?.includes('JSON') || err.message?.includes('fetch')) {
        localStorage.setItem('douban_cleared_all', 'true');
        localStorage.removeItem('douban_custom_movies');
        localStorage.removeItem('douban_deleted_movie_ids');
        setIsClearModalOpen(false);
        fetchMovies();
        onMovieCountChange?.();
      } else {
        alert(err.message || '网络或服务器错误');
      }
    } finally {
      setIsClearing(false);
    }
  };

  const handleOpenCsvModal = () => {
    setCsvFile(null);
    setCsvPreviewData([]);
    setCsvHeaders([]);
    setImportResult(null);
    setIsCsvModalOpen(true);
  };

  const handleLoadBuiltin1000Data = () => {
    const rows = ALL_STATIC_MOVIES.map((m) => ({
      '电影ID': m.movie_id || String(m.id),
      '电影链接': m.link || '',
      '电影名称': m.title,
      '豆瓣评分': m.rating,
      '评价人数': m.rating_count,
      '导演': m.director,
      '编剧': m.screenwriter,
      '主演': m.actors,
      '类型': m.genre,
      '制片国家/地区': m.country,
      '语言': m.language,
      '上映日期': m.release_date,
      '片长': m.runtime,
      '又名': m.alias,
      'IMDb': m.imdb,
      '5星': m.five_star || '0%',
      '4星': m.four_star || '0%',
    }));

    setCsvPreviewData(rows);
    setCsvHeaders([
      '电影ID', '电影名称', '豆瓣评分', '评价人数', '导演', '主演', '类型', '制片国家/地区', '上映日期', '片长'
    ]);
    setCsvFile(null);
    setImportResult({
      success: true,
      message: `已成功载入内置 1,000 条豆瓣精选电影全量数据！请选择覆盖模式后点击下方【确认导入】。`,
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const validRows = results.data.filter((row: any) => {
            if (!row || typeof row !== 'object') return false;
            return Object.values(row).some(
              (v) => v !== null && v !== undefined && String(v).trim() !== ''
            );
          });
          setCsvPreviewData(validRows);
          setCsvHeaders(results.meta.fields || []);
        } else {
          setCsvPreviewData([]);
          setCsvHeaders([]);
        }
      },
      error: (err) => {
        setImportResult({ success: false, message: `解析 CSV 异常: ${err.message}` });
      },
    });
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/movies/export/csv');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('csv')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'clean_douban_movie_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      throw new Error('SERVER_OFFLINE');
    } catch {
      // Offline fallback: generate CSV client-side using getStoredMovies()
      try {
        const movies = getStoredMovies();
        const exportRows = movies.map(m => ({
          '电影ID': m.movie_id || String(m.id),
          '电影链接': m.link || '',
          '电影名称': m.title,
          '豆瓣评分': m.rating,
          '评价人数': m.rating_count,
          '导演': m.director,
          '编剧': m.screenwriter,
          '主演': m.actors,
          '类型': m.genre,
          '制片国家/地区': m.country,
          '语言': m.language,
          '上映日期': m.release_date,
          '片长': m.runtime,
          '又名': m.alias,
          'IMDb': m.imdb,
          '5星': m.five_star || '0%',
          '4星': m.four_star || '0%',
        }));

        const csvContent = Papa.unparse(exportRows);
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'clean_douban_movie_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        alert('导出 CSV 失败: ' + err.message);
      }
    }
  };

  const handleDownloadTemplate = () => {
    const templateCsv = `电影名称,豆瓣评分,评价人数,导演,编剧,主演,类型,制片国家/地区,语言,上映日期,片长,又名,IMDb,5星,4星
肖申克的救赎,9.7,2980000,弗兰克·德拉邦特,斯蒂芬·金,蒂姆·罗宾斯 / 摩根·弗里曼,剧情 / 犯罪,美国,英语,1994-09-10,142分钟,月黑高飞 / 刺激1995,tt0111161,85.2%,12.5%
霸王别姬,9.6,2150000,陈凯歌,李碧华,张国荣 / 张丰毅 / 巩俐,剧情 / 爱情 / 同性,中国香港 / 中国大陆,汉语普通话,1993-01-01,171分钟,再见，我的妾,tt0106332,83.0%,14.0%`;

    const blob = new Blob(['\uFEFF' + templateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '豆瓣电影_导入数据模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteCsvImport = async () => {
    if (csvPreviewData.length === 0) {
      setImportResult({ success: false, message: '请先选择要导入的 CSV 文件或载入内置 1000 条数据' });
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/movies/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: csvPreviewData,
          mode: importMode,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('SERVER_OFFLINE');
      }

      const data = await res.json();
      if (data.success) {
        setImportResult({ success: true, message: data.message });
        fetchMovies();
        onMovieCountChange?.();
      } else {
        setImportResult({ success: false, message: data.error || '导入 CSV 失败' });
      }
    } catch (err: any) {
      if (err.message === 'SERVER_OFFLINE' || err.name === 'SyntaxError' || err.message?.includes('JSON') || err.message?.includes('fetch')) {
        // Local fallback for GitHub Pages
        try {
          const formattedMovies: Movie[] = csvPreviewData.map((row: any, idx: number) => {
            const getNum = (v: any, def = 0) => {
              const n = parseFloat(v);
              return isNaN(n) ? def : n;
            };
            const getInt = (v: any, def = 0) => {
              const n = parseInt(v, 10);
              return isNaN(n) ? def : n;
            };

            const rawRelDate = String(row['上映日期'] || row['release_date'] || '').trim();
            let year: number | undefined = undefined;
            const match = rawRelDate.match(/\b(18|19|20)\d{2}\b/);
            if (match) {
              year = parseInt(match[0], 10);
            }

            return {
              id: Date.now() + idx,
              movie_id: String(row['电影ID'] || row['movie_id'] || (Date.now() + idx)),
              link: String(row['电影链接'] || row['link'] || ''),
              title: String(row['电影名称'] || row['title'] || '未命名电影'),
              director: String(row['导演'] || row['director'] || '未知'),
              screenwriter: String(row['编剧'] || row['screenwriter'] || '未知'),
              actors: String(row['主演'] || row['actors'] || '未知'),
              genre: String(row['类型'] || row['genre'] || '其他'),
              country: String(row['制片国家/地区'] || row['country'] || '其他'),
              language: String(row['语言'] || row['language'] || '未知'),
              release_date: rawRelDate,
              runtime: String(row['片长'] || row['runtime'] || ''),
              alias: String(row['又名'] || row['alias'] || ''),
              imdb: String(row['IMDb'] || row['imdb'] || ''),
              rating: getNum(row['豆瓣评分'] ?? row['rating'], 0),
              rating_count: getInt(row['评价人数'] ?? row['rating_count'], 0),
              five_star: String(row['5星'] || row['five_star'] || '0%'),
              four_star: String(row['4星'] || row['four_star'] || '0%'),
              year
            };
          });

          if (importMode === 'overwrite') {
            localStorage.removeItem('douban_cleared_all');
            localStorage.removeItem('douban_deleted_movie_ids');
            localStorage.setItem('douban_custom_movies', JSON.stringify(formattedMovies));
          } else {
            localStorage.removeItem('douban_cleared_all');
            const existing = getStoredMovies();
            const combined = [...existing, ...formattedMovies];
            localStorage.setItem('douban_custom_movies', JSON.stringify(combined));
          }

          setImportResult({
            success: true,
            message: `成功${importMode === 'overwrite' ? '重置并' : ''}导入 ${formattedMovies.length} 条电影数据！`,
          });
          fetchMovies();
          onMovieCountChange?.();
        } catch (localErr: any) {
          setImportResult({ success: false, message: `离线导入异常: ${localErr.message}` });
        }
      } else {
        setImportResult({ success: false, message: err.message || '网络或服务端异常' });
      }
    } finally {
      setImportLoading(false);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        genre,
        country,
        minRating,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/movies?${params.toString()}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('SERVER_OFFLINE');
      }
      const data = await res.json();

      setMovies(data.movies);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // Fallback to client-side static filterable & paginated movies list (1000 items) on GitHub Pages static deployment
      const resData = getStaticMovies({
        page,
        limit: 12,
        search,
        genre,
        country,
        minRating: minRating ? Number(minRating) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      setMovies(resData.movies);
      setTotal(resData.total);
      setTotalPages(resData.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page, genre, country, minRating, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMovies();
  };

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      director: '',
      screenwriter: '',
      actors: '',
      genre: '剧情',
      country: '中国大陆',
      language: '汉语普通话',
      release_date: '2024-01-01',
      runtime: '120分钟',
      alias: '',
      imdb: '',
      rating: '8.5',
      rating_count: '50000',
      five_star: '50.0%',
      four_star: '35.0%',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      director: movie.director || '',
      screenwriter: movie.screenwriter || '',
      actors: movie.actors || '',
      genre: movie.genre || '剧情',
      country: movie.country || '中国大陆',
      language: movie.language || '汉语普通话',
      release_date: movie.release_date || '2024-01-01',
      runtime: movie.runtime || '120分钟',
      alias: movie.alias || '',
      imdb: movie.imdb || '',
      rating: String(movie.rating || 8.0),
      rating_count: String(movie.rating_count || 10000),
      five_star: movie.five_star || '40.0%',
      four_star: movie.four_star || '40.0%',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (movie: Movie) => {
    setMovieToDelete(movie);
  };

  const handleConfirmDeleteMovie = async () => {
    if (!movieToDelete) return;
    const targetId = movieToDelete.id;
    setMovieToDelete(null);

    try {
      const res = await fetch(`/api/movies/${targetId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMovies();
        onMovieCountChange?.();
      } else {
        throw new Error('API delete failed');
      }
    } catch {
      // Offline fallback: store deleted ID in localStorage
      try {
        const raw = localStorage.getItem('douban_deleted_movie_ids');
        const list: number[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(targetId)) list.push(targetId);
        localStorage.setItem('douban_deleted_movie_ids', JSON.stringify(list));
      } catch {}
      fetchMovies();
      onMovieCountChange?.();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingMovie ? 'PUT' : 'POST';
    const url = editingMovie ? `/api/movies/${editingMovie.id}` : '/api/movies';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMovies();
      } else {
        throw new Error('API save failed');
      }
    } catch {
      // Offline fallback: save to localStorage custom movies
      try {
        const raw = localStorage.getItem('douban_custom_movies');
        let customList: Movie[] = raw ? JSON.parse(raw) : [];
        const formattedData = {
          ...formData,
          rating: Number(formData.rating) || 0,
          rating_count: Number(formData.rating_count) || 0,
          year: formData.release_date ? parseInt(formData.release_date, 10) || undefined : undefined,
        };

        if (editingMovie) {
          customList = customList.map(m => m.id === editingMovie.id ? { ...m, ...formattedData } : m);
        } else {
          const newM: Movie = {
            id: Date.now(),
            movie_id: String(Date.now()),
            link: '',
            ...formattedData,
          };
          customList.push(newM);
        }
        localStorage.setItem('douban_custom_movies', JSON.stringify(customList));
      } catch {}
      setIsModalOpen(false);
      fetchMovies();
      onMovieCountChange?.();
    }
  };

  const genresOptions = ['剧情', '喜剧', '动作', '爱情', '科幻', '动画', '悬疑', '惊悚', '犯罪', '奇幻', '冒险', '战争', '历史', '纪录片'];
  const countriesOptions = ['中国大陆', '中国香港', '中国台湾', '美国', '日本', '英国', '法国', '韩国', '德国', '意大利', '印度'];

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white">
      {/* Search & Actions Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索电影名称 / 导演 / 主演 / 又名..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10"
            >
              搜索
            </button>
          </form>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700 rounded-xl text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加电影</span>
            </button>

            <button
              onClick={handleOpenCsvModal}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 rounded-xl text-xs transition-colors"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>导入 CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 rounded-xl text-xs transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>导出 CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser?.account !== 'admin') {
                  setIsClearRestrictedModalOpen(true);
                  return;
                }
                setIsClearModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30 rounded-xl text-xs transition-colors"
              title="一键清空所有电影数据"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>清空数据</span>
            </button>

            {/* View mode toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="网格卡片"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="数据表格"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>筛选过滤:</span>
          </div>

          <select
            value={genre}
            onChange={(e) => { setGenre(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">全部类型</option>
            {genresOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">全部制片国家</option>
            {countriesOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">最低评分限制</option>
            <option value="9.0">9.0分以上 (极品神作)</option>
            <option value="8.5">8.5分以上 (精选推荐)</option>
            <option value="8.0">8.0分以上 (口碑佳作)</option>
            <option value="7.5">7.5分以上</option>
          </select>

          <div className="ml-auto flex items-center space-x-2">
            <span className="text-slate-400">排序:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="rating-desc">评分从高到低</option>
              <option value="rating-asc">评分从低到高</option>
              <option value="rating_count-desc">评价人数最多</option>
              <option value="year-desc">上映年份最新</option>
              <option value="id-asc">默认SQLite编号</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>已从 SQLite 找到 <strong className="text-emerald-400">{total}</strong> 部符合条件的记录（第 {page} / {totalPages} 页）</span>
        <span>提示: 单击卡片可查看完整豆瓣详情与 Star 权重占比</span>
      </div>

      {/* Movie Grid or Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">加载 SQLite 电影列表...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">数据库暂无电影数据或未找到匹配项</p>
            <p className="text-xs text-slate-500 mt-1">
              若数据已清空，可随时点击上方 <strong className="text-emerald-400">「导入 CSV」</strong> 重新上传或初始化，也可点击 <strong className="text-emerald-400">「添加电影」</strong> 手动录入。
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center space-x-3">
            <button
              onClick={handleOpenCsvModal}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              导入 / 恢复 CSV 数据
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
            >
              添加单条电影
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {movies.map((m) => {
            const isFav = favorites.includes(m.id);
            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col justify-between group transition-all hover:-translate-y-1"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                      #{m.id}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onToggleFavorite(m.id)}
                        className={`p-1 rounded-lg transition-colors ${isFav ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                        title={isFav ? '已收藏' : '收藏到我的影单'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Rating */}
                  <h3 
                    onClick={() => onSelectMovieDetail(m)}
                    className="font-bold text-sm text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer line-clamp-2"
                  >
                    {m.title}
                  </h3>

                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{m.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {(m.rating_count / 10000).toFixed(1)} 万评价
                    </span>
                  </div>

                  {/* Metadata tags */}
                  <div className="mt-3 space-y-1 text-[11px] text-slate-300">
                    <p className="truncate"><span className="text-slate-500">导演:</span> {m.director || '未知'}</p>
                    <p className="truncate"><span className="text-slate-500">主演:</span> {m.actors || '未知'}</p>
                    <p className="truncate"><span className="text-slate-500">国家/类型:</span> {m.country} · {m.genre}</p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onSelectMovieDetail(m)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>详情</span>
                  </button>

                  <button
                    onClick={() => onSelectMovieAI(m)}
                    className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI解析</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="编辑"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-1 text-slate-400 hover:text-red-400"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">电影名称</th>
                  <th className="p-3">豆瓣评分</th>
                  <th className="p-3">评价人数</th>
                  <th className="p-3">导演</th>
                  <th className="p-3">类型</th>
                  <th className="p-3">国家/地区</th>
                  <th className="p-3">片长</th>
                  <th className="p-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-500">#{m.id}</td>
                    <td className="p-3 font-bold text-slate-100 hover:text-emerald-400 cursor-pointer" onClick={() => onSelectMovieDetail(m)}>
                      {m.title}
                    </td>
                    <td className="p-3">
                      <span className="text-amber-400 font-bold">{m.rating}</span>
                    </td>
                    <td className="p-3 text-slate-300">{(m.rating_count / 10000).toFixed(1)} 万</td>
                    <td className="p-3 text-slate-300">{m.director}</td>
                    <td className="p-3 text-slate-300">{m.genre}</td>
                    <td className="p-3 text-slate-400">{m.country}</td>
                    <td className="p-3 text-slate-400">{m.runtime}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectMovieDetail(m)}
                          className="text-slate-400 hover:text-emerald-400 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="text-slate-400 hover:text-red-400 p-1"
                          title="删除电影"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>上一页</span>
        </button>

        <span className="text-xs text-slate-400">
          第 <strong className="text-emerald-400">{page}</strong> 页 / 共 {totalPages} 页
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-lg transition-colors"
        >
          <span>下一页</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingMovie ? '编辑电影数据记录' : '新增电影记录至 SQLite'}
            </h3>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">电影名称</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">导演</label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">编剧</label>
                <input
                  type="text"
                  value={formData.screenwriter}
                  onChange={(e) => setFormData({ ...formData, screenwriter: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">主演</label>
                <input
                  type="text"
                  value={formData.actors}
                  onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">类型</label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">制片国家/地区</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">豆瓣评分</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">评价人数</label>
                <input
                  type="number"
                  value={formData.rating_count}
                  onChange={(e) => setFormData({ ...formData, rating_count: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">5星占比</label>
                <input
                  type="text"
                  value={formData.five_star}
                  onChange={(e) => setFormData({ ...formData, five_star: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">4星占比</label>
                <input
                  type="text"
                  value={formData.four_star}
                  onChange={(e) => setFormData({ ...formData, four_star: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="col-span-2 flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400"
                >
                  保存记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">批量导入 CSV 电影数据</h3>
                  <p className="text-xs text-slate-400">选择 .csv 文件导入或清空重置 SQLite 数据库 `clean_douban_movie_data`</p>
                </div>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Load Builtin 1000 Dataset Banner */}
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl text-xs">
              <div className="flex items-center space-x-2.5 text-emerald-200">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300 block text-sm">内置 1,000 条豆瓣精选电影数据源</span>
                  <span className="text-[11px] text-emerald-400/80">无需上传文件，可一键载入包含评分、人数、导演等完整属性的 1,000 条电影记录</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadBuiltin1000Data}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>一键载入 1000 条数据</span>
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>不确定格式？可直接下载符合标准的样例 CSV 模板文件</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded-lg font-medium transition-colors shrink-0"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>下载 CSV 模板</span>
              </button>
            </div>

            {/* Drop / Select File Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">选择 CSV 数据文件</label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center transition-colors bg-slate-800/30">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="w-8 h-8 text-emerald-400/80" />
                  <div className="text-xs text-slate-300">
                    {csvFile ? (
                      <span className="font-semibold text-emerald-400">{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
                    ) : (
                      <>点击选择或拖拽 <span className="text-emerald-400 font-semibold">.csv 文件</span> 到此处上传</>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">支持中文列头: 电影名称, 豆瓣评分, 评价人数, 导演, 主演, 类型, 上映日期 等</p>
                </div>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {csvPreviewData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>成功识别 {csvPreviewData.length} 条有效数据行 ({csvHeaders.length} 列)</span>
                  </span>
                  <span className="text-slate-500">仅预览前 5 行</span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-40 bg-slate-950/60">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60">
                        {csvHeaders.slice(0, 6).map((h, i) => (
                          <th key={i} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {csvPreviewData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {csvHeaders.slice(0, 6).map((h, i) => (
                            <td key={i} className="px-3 py-1.5 whitespace-nowrap max-w-[120px] truncate">
                              {String(row[h] || '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Mode Options */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-300">导入覆盖模式</label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'append' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold block text-white">📥 追加导入 (Append)</span>
                    <span className="text-[11px] opacity-80">保留现有电影数据，将 CSV 内容新增追加到末尾</span>
                  </div>
                </label>

                <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'overwrite' ? 'bg-red-500/10 border-red-500/50 text-red-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === 'overwrite'}
                    onChange={() => setImportMode('overwrite')}
                    className="mt-0.5 text-red-500 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold block text-white">🔄 覆盖重置 (Overwrite)</span>
                    <span className="text-[11px] opacity-80">清空数据库中现存电影，完全替换为 CSV 新数据</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Result Message */}
            {importResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
                importResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {importResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{importResult.message}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                取消
              </button>

              <button
                type="button"
                disabled={importLoading || csvPreviewData.length === 0}
                onClick={handleExecuteCsvImport}
                className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                {importLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>数据导入中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>确认导入 {csvPreviewData.length ? `(${csvPreviewData.length} 条)` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">确认清空所有电影数据？</h3>
                <p className="text-xs text-slate-400 mt-0.5">该操作将清空 SQLite 数据库中的所有电影记录，清空后可随时通过“导入 CSV”重新填充数据。</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/30 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              ⚠️ <strong>警告：</strong> 此操作将清除数据库中存有的所有电影数据条目，请谨慎操作！
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleConfirmClearAll}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-500/20"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>正在清空...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>确认一键清空</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Restricted Modal for Normal Users */}
      {isClearRestrictedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold text-white">🔒 权限受限：清空数据功能仅限管理员操作</h3>
              <p className="text-xs text-slate-400">
                出于系统数据安全防范，【一键清空数据】属于高危高权限操作，仅允许超级管理员账号执行。普通用户无权进行此项操作。
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">当前登录身份：</span>
                <span className="font-bold text-amber-400">
                  {currentUser ? `普通用户 (${currentUser.username})` : '未登录访客'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">所需权限要求：</span>
                <span className="text-emerald-400 font-semibold">超级管理员 (admin)</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearRestrictedModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                我知道了
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsClearRestrictedModalOpen(false);
                  onOpenAuth();
                }}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>切换管理员账号</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Movie Modal */}
      {movieToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">确认删除此电影？</h3>
                <p className="text-xs text-slate-400 mt-0.5">SQLite 数据库 `clean_douban_movie_data` 操作</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">电影名称:</span>
                <span className="font-bold text-white">{movieToDelete.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">豆瓣评分:</span>
                <span className="text-amber-400 font-bold">{movieToDelete.rating} 分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">导演:</span>
                <span className="text-slate-300">{movieToDelete.director}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMovieToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMovie}
                className="flex items-center space-x-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
