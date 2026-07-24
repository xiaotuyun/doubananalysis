import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { DetailedAnalyticsView } from './components/DetailedAnalyticsView';
import { MovieLibrary } from './components/MovieLibrary';
import { UsersView } from './components/UsersView';
import { SqlConsoleView } from './components/SqlConsoleView';
import { AIAnalystView } from './components/AIAnalystView';
import { FavoritesView } from './components/FavoritesView';
import { MovieDetailModal } from './components/MovieDetailModal';
import { Movie, User } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('douban_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<Movie | null>(null);
  const [selectedMovieForAI, setSelectedMovieForAI] = useState<Movie | null>(null);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<number[]>([]);
  const [totalMoviesCount, setTotalMoviesCount] = useState<number | undefined>(undefined);

  // Fetch total count of movies
  const fetchTotalMoviesCount = async () => {
    try {
      const res = await fetch('/api/movies?page=1&limit=1');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.total === 'number') {
          setTotalMoviesCount(data.total);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTotalMoviesCount();
  }, []);

  // Fetch favorites for current user
  const fetchUserFavorites = async () => {
    if (!currentUser) {
      setFavoriteMovieIds([]);
      return;
    }
    try {
      const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavoriteMovieIds(data.map((item: any) => item.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserFavorites();
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('douban_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('douban_user');
    setFavoriteMovieIds([]);
  };

  const handleToggleFavorite = async (movieId: number) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    const isFav = favoriteMovieIds.includes(movieId);
    if (isFav) {
      // Find favorite_id to delete
      try {
        const res = await fetch(`/api/favorites?userId=${currentUser.id}`);
        if (res.ok) {
          const list = await res.json();
          const target = list.find((item: any) => item.id === movieId);
          if (target) {
            await fetch(`/api/favorites/${target.favorite_id}`, { method: 'DELETE' });
            fetchUserFavorites();
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, movieId }),
        });
        fetchUserFavorites();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemoveFavoriteById = async (favoriteId: number) => {
    try {
      await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
      fetchUserFavorites();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMovieAI = (movie: Movie) => {
    setSelectedMovieForAI(movie);
    setActiveTab('ai');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Header Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        favoritesCount={favoriteMovieIds.length}
        totalMovies={totalMoviesCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && <Dashboard />}

        {activeTab === 'analytics' && <DetailedAnalyticsView />}

        {activeTab === 'movies' && (
          <MovieLibrary
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSelectMovieDetail={(m) => setSelectedMovieDetail(m)}
            onSelectMovieAI={handleSelectMovieAI}
            favorites={favoriteMovieIds}
            onToggleFavorite={handleToggleFavorite}
            onMovieCountChange={fetchTotalMoviesCount}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'sql' && <SqlConsoleView />}

        {activeTab === 'ai' && (
          <AIAnalystView
            selectedMovieForAI={selectedMovieForAI}
            onClearSelectedMovie={() => setSelectedMovieForAI(null)}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSelectMovieDetail={(m) => setSelectedMovieDetail(m)}
            onRemoveFavorite={handleRemoveFavoriteById}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Movie Details Modal */}
      <MovieDetailModal
        movie={selectedMovieDetail}
        onClose={() => setSelectedMovieDetail(null)}
        onSelectMovieAI={handleSelectMovieAI}
      />
    </div>
  );
}

export default App;
