
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Store, Package, Users, BarChart3, Menu, X, Plus, Trash2, Edit2, Search, ArrowRight, CheckCircle2, ShoppingBag, LogIn, User, UserCircle, ClipboardList, MapPin, Settings, LogOut, Box, ShieldCheck, Map, Phone, Mail, Sparkles, Globe, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Product, Order, CartItem, UserRole, UserAccount, Review } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_USERS } from './store/initialData';
import { ApiService } from './services/api';

// Pages
import HomePage from './pages/customer/Home';
import ProductsPage from './pages/customer/Products';
import ProductDetailPage from './pages/customer/ProductDetail';
import CartPage from './pages/customer/Cart';
import CheckoutPage from './pages/customer/Checkout';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import ProfilePage from './pages/customer/Profile';
import MyOrdersPage from './pages/customer/MyOrders';
import OrderTrackingPage from './pages/customer/OrderTracking';
import TrackOrderSearch from './pages/customer/TrackOrderSearch';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';

export const GSLogo = ({ className = "h-8 w-8", useGradient = true }: { className?: string, useGradient?: boolean }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="gsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <filter id="gsGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path 
      d="M25,40 C25,10 55,2 85,15 C92,18 95,25 95,35 M5,65 C8,75 18,95 50,95 C82,95 95,75 95,55" 
      stroke={useGradient ? "url(#gsGradient)" : "currentColor"} 
      strokeWidth="8" 
      strokeLinecap="round" 
      filter="url(#gsGlow)"
    />
    <text 
      x="50" 
      y="65" 
      textAnchor="middle" 
      fill={useGradient ? "url(#gsGradient)" : "currentColor"} 
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: '42px', letterSpacing: '-2px' }}
    >
      GS
    </text>
  </svg>
);

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isServerSyncing, setIsServerSyncing] = useState(true);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('gs_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('gs_user_role');
    return (saved as UserRole) || UserRole.CUSTOMER;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('gs_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gs_user');
    return saved ? JSON.parse(saved) : { name: 'Guest User', email: 'guest@example.com' };
  });

  // Initial Server Fetch
  useEffect(() => {
    const initData = async () => {
      setIsServerSyncing(true);
      try {
        const [p, o, u] = await Promise.all([
          ApiService.products.getAll(),
          ApiService.orders.getAll(),
          ApiService.users.getAll()
        ]);
        setProducts(p);
        setOrders(o);
        setUsers(u);
      } catch (err) {
        console.error("Server Link Failed", err);
      } finally {
        setIsServerSyncing(false);
      }
    };
    initData();
  }, []);

  // Sync Auth and Cart locally
  useEffect(() => { localStorage.setItem('gs_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('gs_user_role', userRole); }, [userRole]);
  useEffect(() => { localStorage.setItem('gs_is_logged_in', isLoggedIn.toString()); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('gs_user', JSON.stringify(currentUser)); }, [currentUser]);

  // Server-Push Event Listener (Broadcast Channel)
  useEffect(() => {
    const channel = new BroadcastChannel('gs_cloud_sync_bus');
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'SYNC_PRODUCTS': setProducts(payload); break;
        case 'SYNC_ORDERS': setOrders(payload); break;
        case 'SYNC_USERS': setUsers(payload); break;
      }
    };
    return () => channel.close();
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const placeOrder = useCallback(async (customerInfo: { name: string; email: string; phone: string; address: string; city: string; zip: string }) => {
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
      customerName: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      shippingAddress: customerInfo.address,
      city: customerInfo.city,
      zipCode: customerInfo.zip,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    const response = await ApiService.orders.create(newOrder);
    setOrders(prev => [response, ...prev]);
    clearCart();
    return response.id;
  }, [cart, clearCart]);

  const addProduct = useCallback(async (product: Product) => {
    const response = await ApiService.products.save(product);
    setProducts(prev => [response, ...prev]);
  }, []);

  const updateProduct = useCallback(async (updated: Product) => {
    const response = await ApiService.products.save(updated);
    setProducts(prev => prev.map(p => p.id === updated.id ? response : p));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await ApiService.products.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);
  
  const addUser = useCallback(async (user: UserAccount) => {
    const response = await ApiService.users.save(user);
    setUsers(prev => [response, ...prev]);
  }, []);

  const updateUser = useCallback(async (updated: UserAccount) => {
    const response = await ApiService.users.save(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? response : u));
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await ApiService.users.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    const response = await ApiService.orders.update(orderId, updates);
    setOrders(prev => prev.map(o => o.id === orderId ? response : o));
  }, []);

  const addReview = useCallback(async (productId: string, review: Review) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    const updated = { ...target, reviews: [...(target.reviews || []), review] };
    await ApiService.products.save(updated);
    setProducts(prev => prev.map(p => p.id === productId ? updated : p));
  }, [products]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserRole(UserRole.CUSTOMER);
    setCurrentUser({ name: 'Guest User', email: 'guest@example.com' });
  }, []);

  const contextValue = useMemo(() => ({
    products, orders, cart, users, userRole, isLoggedIn, currentUser, isServerSyncing,
    addToCart, removeFromCart, updateCartQuantity, placeOrder, clearCart,
    addProduct, updateProduct, deleteProduct, updateOrder, addReview,
    addUser, updateUser, deleteUser,
    setUserRole, setIsLoggedIn, handleLogout, setCurrentUser
  }), [products, orders, cart, users, userRole, isLoggedIn, currentUser, isServerSyncing, addToCart, removeFromCart, updateCartQuantity, placeOrder, clearCart, addProduct, updateProduct, deleteProduct, updateOrder, addReview, addUser, updateUser, deleteUser, handleLogout]);

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/track-order" element={<TrackOrderSearch />} />
            <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
};

interface IAppContext {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  users: UserAccount[];
  userRole: UserRole;
  isLoggedIn: boolean;
  isServerSyncing: boolean;
  currentUser: { name: string, email: string };
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  placeOrder: (info: { name: string, email: string, phone: string, address: string, city: string, zip: string }) => Promise<string>;
  clearCart: () => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addUser: (user: UserAccount) => Promise<void>;
  updateUser: (user: UserAccount) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  addReview: (productId: string, review: Review) => Promise<void>;
  setUserRole: (role: UserRole) => void;
  setIsLoggedIn: (val: boolean) => void;
  handleLogout: () => void;
  setCurrentUser: (user: { name: string, email: string }) => void;
}

export const AppContext = React.createContext<IAppContext | null>(null);

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cart, userRole, isLoggedIn, handleLogout, currentUser, isServerSyncing } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAdminPath = location.pathname.startsWith('/admin');
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
    return `text-[10px] font-black px-6 py-2.5 rounded-full transition-all uppercase tracking-[0.2em] flex items-center gap-2 ${
      isActive 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
        : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
    }`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="gs-glass sticky top-0 z-[100] border-b border-slate-100/30">
        {isServerSyncing && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-600 animate-gs-progress" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            <div className="flex items-center gap-16">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="bg-slate-950 p-2.5 rounded-[1.25rem] shadow-2xl group-hover:scale-110 group-hover:shadow-blue-500/20 transition-all duration-500 relative">
                  <GSLogo className="h-7 w-7 text-white" />
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white transition-colors duration-500 ${isServerSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                </div>
                <span className="text-2xl font-black text-slate-950 tracking-tighter uppercase">GS Shopping</span>
              </Link>
              <div className="hidden md:flex md:space-x-2">
                {!isAdminPath ? (
                  <>
                    <Link to="/" className={getNavLinkClass('/')}>Home</Link>
                    <Link to="/products" className={getNavLinkClass('/products')}>Shop</Link>
                    <Link to="/track-order" className={getNavLinkClass('/track-order')}>Track</Link>
                  </>
                ) : (
                  <>
                    <Link to="/admin" className={getNavLinkClass('/admin')}><LayoutDashboard className="w-4 h-4" /> Overview</Link>
                    <Link to="/admin/products" className={getNavLinkClass('/admin/products')}><Package className="w-4 h-4" /> Assets</Link>
                    <Link to="/admin/orders" className={getNavLinkClass('/admin/orders')}><ShoppingCart className="w-4 h-4" /> Fulfilment</Link>
                    <Link to="/admin/users" className={getNavLinkClass('/admin/users')}><Users className="w-4 h-4" /> Team</Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {isLoggedIn ? (
                <div className="relative">
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 p-1 rounded-full border border-slate-100 hover:border-blue-200 hover:bg-white transition group pr-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-lg font-black group-hover:scale-105 transition-transform duration-300">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="hidden sm:block text-[10px] font-black text-slate-700 uppercase tracking-widest">{currentUser.name.split(' ')[0]}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-4 w-72 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] py-6 z-[110] animate-in fade-in slide-in-from-top-4 border border-slate-100">
                      <div className="px-8 py-4 mb-2 border-b border-slate-50">
                        <p className="text-sm font-black text-slate-950 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] truncate mt-1.5">{currentUser.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition"><UserCircle className="w-4.5 h-4.5" /> Identity Hub</Link>
                      <Link to="/my-orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition"><ClipboardList className="w-4.5 h-4.5" /> Logistics history</Link>
                      {userRole === UserRole.ADMIN && <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 transition border-t border-slate-50 mt-2"><LayoutDashboard className="w-4.5 h-4.5" /> Operations Hub</Link>}
                      <button onClick={() => { handleLogout(); setIsUserMenuOpen(false); navigate('/'); }} className="w-full text-left flex items-center gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition border-t border-slate-50 mt-2"><LogOut className="w-4.5 h-4.5" /> Terminate Session</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="hidden md:flex items-center gap-2 px-8 py-4 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-950/20 active:scale-95">Authorize Identity</Link>
              )}
              {!isAdminPath && (
                <Link to="/cart" className="relative p-4 bg-white rounded-full text-slate-950 hover:text-blue-600 transition shadow-sm hover:shadow-xl border border-slate-50">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-[10px] font-black leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full border-2 border-white shadow-xl">{cartCount}</span>}
                </Link>
              )}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-950 transition-colors hover:text-blue-600">{isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}</button>
            </div>
          </div>
        </div>
        
        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden gs-glass border-t border-slate-100 p-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-blue-50">Home</Link>
            <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-blue-50">Shop</Link>
            <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)} className="block px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-blue-50">Track</Link>
            {isLoggedIn ? (
              <>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-blue-50">Identity Hub</Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); navigate('/'); }} className="w-full text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-2xl mt-4">Terminate Session</button>
              </>
            ) : <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white bg-slate-950 rounded-2xl text-center">Login</Link>}
          </div>
        )}
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="bg-slate-950 text-white pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
            <div className="space-y-10">
              <Link to="/" className="flex items-center space-x-3 group w-fit">
                <div className="bg-blue-600 p-2.5 rounded-[1.25rem] shadow-xl">
                  <GSLogo className="h-7 w-7 text-white" useGradient={false} />
                </div>
                <span className="text-3xl font-black text-white tracking-tighter uppercase">GS Shopping</span>
              </Link>
              <p className="text-slate-400 max-w-sm text-lg font-medium leading-relaxed">
                Reimagining global retail through the lens of hyper-performance design and distributed logistics.
              </p>
              
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Phone className="w-5 h-5 text-blue-500 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Protocol</p>
                    <a href="tel:7090292677" className="text-lg font-black text-slate-300 hover:text-white transition-colors tracking-tight">7090292677</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Mail className="w-5 h-5 text-blue-500 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logistics Support</p>
                    <a href="mailto:yashu70902@gmail.com" className="text-lg font-black text-slate-300 hover:text-white transition-colors tracking-tight">yashu70902@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-32 pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">© 2024 GS Shopping Global Ecosystem. Optimized for speed.</p>
            <div className="flex gap-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span className="cursor-pointer hover:text-white transition-colors">US HQ</span>
              <span className="cursor-pointer hover:text-white transition-colors">EU HUB</span>
              <span className="cursor-pointer hover:text-white transition-colors">APAC LABS</span>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes gs-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-gs-progress {
          animation: gs-progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
