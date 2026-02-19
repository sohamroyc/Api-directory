
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Moon, 
  Sun, 
  Layers, 
  Database, 
  Github, 
  Sparkles,
  Zap,
  LayoutGrid,
  Globe,
  Lock,
  MessageSquare,
  Cpu,
  Terminal,
  MapPin,
  Music,
  User as UserIcon,
  LogOut,
  Heart,
  X,
  Mail,
  Key,
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { PublicApi, ApiCategory, User, ViewState, Favorite } from './types';
import { CATEGORIES, INITIAL_MOCK_APIS } from './constants';
import ApiCard from './components/ApiCard';
import SkeletonCard from './components/SkeletonCard';
import { discoverNewApis, summarizeApi } from './services/geminiService';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  [ApiCategory.ALL]: <LayoutGrid size={18} />,
  [ApiCategory.DATA]: <Database size={18} />,
  [ApiCategory.AUTH]: <Lock size={18} />,
  [ApiCategory.SOCIAL]: <MessageSquare size={18} />,
  [ApiCategory.FINANCE]: <Zap size={18} />,
  [ApiCategory.AI]: <Cpu size={18} />,
  [ApiCategory.DEVELOPER]: <Terminal size={18} />,
  [ApiCategory.GEOLOCATION]: <MapPin size={18} />,
  [ApiCategory.ENTERTAINMENT]: <Music size={18} />,
  [ApiCategory.OTHERS]: <Globe size={18} />,
};

const App: React.FC = () => {
  // Navigation & UI State
  const [view, setView] = useState<ViewState>('landing');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Data State
  const [apis, setApis] = useState<PublicApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ApiCategory.ALL);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Initial Load
  useEffect(() => {
    const savedApis = localStorage.getItem('discovered_apis');
    if (savedApis) setApis(JSON.parse(savedApis));
    else setApis(INITIAL_MOCK_APIS);

    const session = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('current_user');
    if (session && savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadFavorites(user.id);
      setView('dashboard');
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- Auth Handlers ---
  const loadFavorites = (userId: string) => {
    const allFavs: Favorite[] = JSON.parse(localStorage.getItem('platform_favorites') || '[]');
    const userFavs = allFavs.filter(f => f.user_id === userId).map(f => f.api_id);
    setFavorites(userFavs);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const users = JSON.parse(localStorage.getItem('platform_users') || '[]');
    if (users.find((u: any) => u.email === authForm.email)) {
      setAuthError('Email already exists');
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: authForm.username,
      email: authForm.email,
      created_at: new Date().toISOString()
    };

    const usersWithPass = [...users, { ...newUser, password: authForm.password }];
    localStorage.setItem('platform_users', JSON.stringify(usersWithPass));
    
    // Simulate Login
    setCurrentUser(newUser);
    localStorage.setItem('current_user', JSON.stringify(newUser));
    localStorage.setItem('auth_token', 'simulated_jwt_token_' + newUser.id);
    setView('dashboard');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const users = JSON.parse(localStorage.getItem('platform_users') || '[]');
    const user = users.find((u: any) => u.email === authForm.email && u.password === authForm.password);
    
    if (user) {
      const { password, ...safeUser } = user;
      setCurrentUser(safeUser);
      localStorage.setItem('current_user', JSON.stringify(safeUser));
      localStorage.setItem('auth_token', 'simulated_jwt_token_' + user.id);
      loadFavorites(user.id);
      setView('dashboard');
    } else {
      setAuthError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setFavorites([]);
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    setView('landing');
  };

  const toggleFavorite = (apiId: string) => {
    if (!currentUser) {
      setView('login');
      return;
    }

    let allFavs: Favorite[] = JSON.parse(localStorage.getItem('platform_favorites') || '[]');
    const isFav = favorites.includes(apiId);

    if (isFav) {
      allFavs = allFavs.filter(f => !(f.user_id === currentUser.id && f.api_id === apiId));
      setFavorites(prev => prev.filter(id => id !== apiId));
    } else {
      allFavs.push({ user_id: currentUser.id, api_id: apiId, created_at: new Date().toISOString() });
      setFavorites(prev => [...prev, apiId]);
    }

    localStorage.setItem('platform_favorites', JSON.stringify(allFavs));
  };

  // --- API Discovery ---
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const categoryToSearch = selectedCategory === ApiCategory.ALL ? 'Most Popular' : selectedCategory;
      const result = await discoverNewApis(categoryToSearch);
      
      const newApis: PublicApi[] = result.apis.map((a, i) => ({
        ...a,
        id: `${Date.now()}-${i}`,
        created_at: new Date().toISOString()
      }));

      setApis(prev => {
        const existingKeys = new Set(prev.map(p => `${p.name}-${p.website}`));
        const uniqueNew = newApis.filter(n => !existingKeys.has(`${n.name}-${n.website}`));
        const updatedList = [...uniqueNew, ...prev].slice(0, 100);
        localStorage.setItem('discovered_apis', JSON.stringify(updatedList));
        return updatedList;
      });

      // Async background summarization
      newApis.slice(0, 2).forEach(async (api) => {
        const summary = await summarizeApi(api.name, api.description);
        setApis(current => current.map(c => c.name === api.name ? { ...c, ai_summary: summary } : c));
      });
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const filteredApis = useMemo(() => {
    return apis
      .filter(api => {
        const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             api.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (view === 'favorites') {
          return matchesSearch && favorites.includes(api.id);
        }
        
        const matchesCategory = selectedCategory === ApiCategory.ALL || api.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [apis, searchQuery, selectedCategory, favorites, view]);

  // --- Render Helpers ---
  const renderNavbar = () => (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 py-3' : 'py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={() => { setView('landing'); setSelectedCategory(ApiCategory.ALL); }}
        >
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
            <Zap size={22} fill="white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            APIDir<span className="text-brand-600">.</span>
          </span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />

          {currentUser ? (
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setView('favorites')} 
                className={`p-2.5 rounded-xl transition-all ${view === 'favorites' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                title="Favorites"
              >
                <Heart size={20} fill={favorites.length > 0 ? "currentColor" : "none"} className={favorites.length > 0 ? "text-rose-500" : ""} />
              </button>
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{currentUser.username}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-500">Member since {new Date(currentUser.created_at).getFullYear()}</p>
              </div>
              <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 text-gray-500 transition-all">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={() => setView('login')} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-brand-600">Log in</button>
              <button onClick={() => setView('signup')} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl shadow-xl shadow-black/5 active:scale-95 transition-all">Sign up</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderAuthForm = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-600"></div>
        <button onClick={() => setView('landing')} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-600 transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          {view === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
          {view === 'login' ? 'Discover the best APIs for your next project.' : 'Join 50,000+ developers discovering APIs.'}
        </p>

        {authError && (
          <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center">
            <X size={16} className="mr-2" /> {authError}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-5">
          {view === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="text" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-500 rounded-2xl outline-none text-gray-900 dark:text-white" placeholder="johndoe"
                  value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required type="email" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-500 rounded-2xl outline-none text-gray-900 dark:text-white" placeholder="name@company.com"
                value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required type="password" minLength={6} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-500 rounded-2xl outline-none text-gray-900 dark:text-white" placeholder="••••••••"
                value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] mt-4">
            {view === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 text-center text-sm">
          <p className="text-gray-500 dark:text-slate-400">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="ml-2 text-brand-600 font-bold hover:underline">
              {view === 'login' ? 'Get started' : 'Log in instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="pt-32 pb-20 px-6">
      {/* Search & Header */}
      <section className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">
          {view === 'favorites' ? 'Your Saved Toolkit' : 'The AI-Powered API Directory'}
        </h1>
        
        <div className="relative max-w-2xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-900 dark:text-white text-lg"
              placeholder="Search verified APIs (e.g. 'Stripe', 'Twilio')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {view !== 'favorites' && (
              <button 
                onClick={handleRefresh} 
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      {view !== 'favorites' && (
        <div className="max-w-7xl mx-auto mb-16 overflow-x-auto no-scrollbar py-2">
          <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 flex items-center px-6 py-3.5 rounded-2xl text-sm font-bold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-500/20'
                    : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-brand-200 dark:hover:border-slate-700'
                }`}
              >
                <span className={`mr-2.5 ${selectedCategory === cat ? 'text-white' : 'text-brand-500'}`}>
                  {CATEGORY_ICONS[cat]}
                </span>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <section className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center">
            <Layers size={22} className="mr-3 text-brand-600" />
            {view === 'favorites' ? 'Saved Collections' : `${selectedCategory} Discovery`}
            <span className="ml-4 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-xs font-bold text-brand-600 dark:text-brand-400">
              {filteredApis.length} Results
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredApis.length > 0 ? (
            filteredApis.map((api) => (
              <ApiCard 
                key={api.id} 
                api={api} 
                currentUser={currentUser} 
                onToggleFavorite={toggleFavorite} 
                isFavorited={favorites.includes(api.id)}
              />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-white/40 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
              <div className="mx-auto w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-gray-300 dark:text-slate-700 mb-6">
                {view === 'favorites' ? <Heart size={40} className="text-rose-400" /> : <Database size={40} />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {view === 'favorites' ? 'No saved APIs yet' : 'No matches found'}
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                {view === 'favorites' 
                  ? "Start saving tools you're interested in and they'll appear here for quick access."
                  : "We couldn't find any tools matching your filters. Try a different category or discover new ones."}
              </p>
              {view !== 'favorites' && (
                <button onClick={handleRefresh} className="mt-8 px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all">
                  Refresh Discovery
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderLanding = () => (
    <div className="pt-40 pb-20">
      <section className="max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-bold mb-8">
          <CheckCircle2 size={16} className="mr-2" />
          The largest verified API directory on the web
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
          Find the perfect <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Public API</span> for your app.
        </h1>
        <p className="text-xl text-gray-500 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Stop digging through GitHub and outdated lists. Our AI discovery engine crawls the web to bring you verified, production-ready public APIs in real-time.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setView('dashboard')}
            className="w-full sm:w-auto px-10 py-5 bg-brand-600 text-white rounded-2xl font-bold text-lg hover:bg-brand-700 shadow-2xl shadow-brand-500/20 transition-all active:scale-95 flex items-center justify-center"
          >
            Explore Directory
            <ArrowRight size={20} className="ml-2" />
          </button>
          <button 
            onClick={() => setView('signup')}
            className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl font-bold text-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            Join the Community
          </button>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 grayscale opacity-50 dark:invert">
          {['Stripe', 'Twilio', 'GitHub', 'AWS'].map(brand => (
            <div key={brand} className="flex items-center justify-center p-4 bg-gray-50 rounded-2xl font-bold text-2xl text-gray-400">
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Grid */}
      <section className="max-w-7xl mx-auto px-6 mt-32">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Toolkits</h2>
          <button onClick={() => setView('dashboard')} className="text-brand-600 font-bold flex items-center hover:underline">
            View All APIs <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apis.slice(0, 3).map(api => (
            <ApiCard key={api.id} api={api} currentUser={currentUser} onToggleFavorite={toggleFavorite} isFavorited={favorites.includes(api.id)} />
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen mesh-gradient transition-colors duration-500">
      {renderNavbar()}
      {view === 'landing' && renderLanding()}
      {(view === 'login' || view === 'signup') && renderAuthForm()}
      {(view === 'dashboard' || view === 'favorites') && renderDashboard()}
      
      <footer className="py-20 px-6 border-t border-gray-100 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white"><Zap size={16} fill="white" /></div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">APIDir.</span>
            </div>
            <p className="text-gray-500 dark:text-slate-400 max-w-xs mb-8">
              Empowering developers to discover the world's best programmatic interfaces through AI-driven search and verified documentation.
            </p>
            <div className="flex space-x-4">
              <Github className="text-gray-400 hover:text-brand-600 cursor-pointer" />
              <Layers className="text-gray-400 hover:text-brand-600 cursor-pointer" />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Directory</h4>
            <ul className="space-y-4 text-gray-500 dark:text-slate-400">
              <li className="hover:text-brand-600 cursor-pointer">Popular APIs</li>
              <li className="hover:text-brand-600 cursor-pointer">AI Category</li>
              <li className="hover:text-brand-600 cursor-pointer">Developer Tools</li>
              <li className="hover:text-brand-600 cursor-pointer">Verified only</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-gray-500 dark:text-slate-400">
              <li className="hover:text-brand-600 cursor-pointer">Privacy Policy</li>
              <li className="hover:text-brand-600 cursor-pointer">Terms of Service</li>
              <li className="hover:text-brand-600 cursor-pointer">Cookie Settings</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-100 dark:border-slate-900 flex justify-between items-center text-xs text-gray-400">
          <span>© 2024 APIDir Platform. All rights reserved.</span>
          <span className="flex items-center"><Sparkles size={12} className="mr-1 text-brand-500" /> Powered by Gemini-3 Flash</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
