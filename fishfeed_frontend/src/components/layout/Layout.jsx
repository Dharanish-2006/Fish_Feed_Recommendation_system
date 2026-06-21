import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';
import { ThemeToggleCompact } from '../ui/ThemeToggle';
import {
  LayoutDashboard, Sailboat, Sparkles, Fish, Wheat, ClipboardList,
  Package, Boxes, Users, ShieldCheck, Bell, User, LogOut, Menu, X, Waves
} from 'lucide-react';

const navItems = {
  farmer: [
    { to: '/farmer',            label: 'Dashboard',       icon: LayoutDashboard, end: true },
    { to: '/farmer/farms',      label: 'My Farms',        icon: Sailboat },
    { to: '/farmer/recommend',  label: 'Recommendations', icon: Sparkles },
    { to: '/farmer/species',    label: 'Fish Species',    icon: Fish },
    { to: '/farmer/feeds',      label: 'Browse Feeds',    icon: Wheat },
    { to: '/farmer/history',    label: 'Feeding History', icon: ClipboardList },
  ],
  supplier: [
    { to: '/supplier',           label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/supplier/feeds',     label: 'My Products', icon: Wheat },
    { to: '/supplier/inventory', label: 'Inventory',   icon: Boxes },
  ],
  admin: [
    { to: '/admin',                 label: 'Dashboard',       icon: LayoutDashboard, end: true },
    { to: '/admin/users',           label: 'Users',           icon: Users },
    { to: '/admin/species',         label: 'Species',         icon: Fish },
    { to: '/admin/feeds',           label: 'Feed Products',   icon: Wheat },
    { to: '/admin/recommendations', label: 'Recommendations', icon: Sparkles },
  ],
};

function NavItem({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
          isActive ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.06]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 bg-white/10 rounded-xl ring-1 ring-white/10"
              transition={{ type: 'spring', stiffness: 450, damping: 38 }}
            />
          )}
          <Icon size={17} strokeWidth={2} className="relative z-10 shrink-0" />
          <span className="relative z-10">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const items = navItems[user?.role] || [];

  useEffect(() => {
    const fetchUnread = () => notificationsApi.unreadCount()
      .then(({ data }) => setUnread(data.unread_count)).catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F4F8FA] dark:bg-[#0A141C] transition-colors duration-200">
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A3247] min-h-screen fixed top-0 left-0 z-30">
        <div className="px-5 py-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2389B5] to-[#0E4561] flex items-center justify-center shrink-0">
              <Waves size={18} className="text-white" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-[15px] leading-none font-display">AquaFeed</p>
              <p className="text-white/45 text-[11px] mt-1 capitalize font-medium">{user?.role} Portal</p>
            </div>
            <ThemeToggleCompact className="!text-white/55 hover:!bg-white/[0.08] hover:!text-white shrink-0" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {items.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.08] space-y-1">
          <NavItem to={`/${user?.role}/notifications`} label="Notifications" icon={Bell} />
          {unread > 0 && (
            <div className="px-3.5 -mt-1">
              <span className="inline-flex bg-[#FF6B4A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unread} new
              </span>
            </div>
          )}
          <NavItem to={`/${user?.role}/profile`} label={user?.full_name?.split(' ')[0] || 'Profile'} icon={User} />
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white/40 hover:bg-white/[0.06] hover:text-white/75 transition-colors">
            <LogOut size={17} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0A3247] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2389B5] to-[#0E4561] flex items-center justify-center">
            <Waves size={16} className="text-white" strokeWidth={2.25} />
          </div>
          <span className="text-white font-bold font-display">AquaFeed</span>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="bg-[#FF6B4A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
          <ThemeToggleCompact className="!text-white/70 hover:!bg-white/10 hover:!text-white" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#0A1620]/55 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 360, damping: 38 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#0A3247] z-50 lg:hidden flex flex-col pt-16"
            >
              <nav className="flex-1 px-3 py-4 space-y-1">
                {items.map((item) => <NavItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />)}
                <NavItem to={`/${user?.role}/notifications`} label="Notifications" icon={Bell} onClick={() => setSidebarOpen(false)} />
                <NavItem to={`/${user?.role}/profile`} label="Profile" icon={User} onClick={() => setSidebarOpen(false)} />
              </nav>
              <div className="px-3 py-4 border-t border-white/[0.08]">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white/40 hover:bg-white/[0.06] hover:text-white/75 transition-colors">
                  <LogOut size={17} /> Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen dot-grid">
        <motion.div
          key={typeof window !== 'undefined' ? window.location.pathname : 'main'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto px-5 sm:px-8 py-7 lg:py-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
