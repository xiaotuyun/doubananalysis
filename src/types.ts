export interface User {
  id: number;
  username: string;
  account: string;
  password?: string;
  created_at: string;
}

export interface Movie {
  id: number;
  movie_id: string;
  link: string;
  title: string;
  director: string;
  screenwriter: string;
  actors: string;
  genre: string;
  country: string;
  language: string;
  release_date: string;
  runtime: string;
  alias: string;
  imdb: string;
  rating: number;
  rating_count: number;
  five_star: string;
  four_star: string;
  year?: number;
}

export interface Favorite {
  id: number;
  user_id: number;
  movie_id: number;
  created_at: string;
  note?: string;
  movie?: Movie;
}

export interface AnalyticsSummary {
  totalMovies: number;
  avgRating: number;
  maxRating: number;
  totalReviews: number;
  ratingDist: { range: string; count: number }[];
  topGenres: { genre: string; count: number; avgRating: number }[];
  topDirectors: { director: string; count: number; avgRating: number }[];
  topCountries: { country: string; count: number }[];
  decadeTrend: { decade: string; count: number; avgRating: number }[];
  ratingVsReviews: { rating: number; reviewCount: number; title: string }[];
  topRatedMovies: Movie[];
  mostReviewedMovies: Movie[];
}

export interface FilterOptions {
  search?: string;
  genre?: string;
  country?: string;
  minRating?: number;
  maxRating?: number;
  startYear?: number;
  endYear?: number;
  sortBy?: 'rating' | 'rating_count' | 'release_date' | 'id';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
