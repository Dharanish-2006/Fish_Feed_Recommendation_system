import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Inbox } from 'lucide-react';

// ─── Motion presets ───────────────────────────────────────────────────────────
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, loading = false, className = '', icon: Icon
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0A141C] whitespace-nowrap';
  const variants = {
    primary:   'bg-[#FF6B4A] text-white hover:bg-[#E8552F] focus-visible:ring-[#FF6B4A] shadow-sm shadow-[#FF6B4A]/20',
    ocean:     'bg-[#0E4561] text-white hover:bg-[#0A3247] focus-visible:ring-[#0E4561] shadow-sm dark:bg-[#2389B5] dark:hover:bg-[#3FA3CC]',
    outline:   'border-[1.5px] border-[#0E4561] text-[#0E4561] hover:bg-[#0E4561] hover:text-white dark:border-[#3FA3CC] dark:text-[#3FA3CC] dark:hover:bg-[#3FA3CC] dark:hover:text-[#0A141C]',
    ghost:     'text-[#5C7384] hover:bg-[#E6EDF1] hover:text-[#2B3D4D] dark:text-[#93A4AF] dark:hover:bg-white/[0.06] dark:hover:text-[#EEF3F6]',
    danger:    'bg-[#DC4848] text-white hover:bg-[#c23d3d]',
    success:   'bg-[#1F9D6E] text-white hover:bg-[#19825b]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-[13px]',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-[15px]',
  };
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </motion.button>
  );
}

// ─── IconButton ───────────────────────────────────────────────────────────────
export function IconButton({ icon: Icon, onClick, className = '', size = 18, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#5C7384] hover:bg-[#E6EDF1] hover:text-[#2B3D4D] dark:text-[#93A4AF] dark:hover:bg-white/[0.06] dark:hover:text-[#EEF3F6] transition-colors ${className}`}
    >
      <Icon size={size} strokeWidth={2} />
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', hover = false, padding = true, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-white dark:bg-[#14202B] rounded-2xl shadow-soft border border-[#E6EDF1] dark:border-[#233340] ${padding ? 'p-6' : ''} ${hover ? 'hover:shadow-soft-lg cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', icon: Icon }) {
  const variants = {
    default:    'bg-[#E6EDF1] text-[#5C7384] dark:bg-[#233340] dark:text-[#93A4AF]',
    ocean:      'bg-[#E3F1F7] text-[#0E4561] dark:bg-[#123347] dark:text-[#6FB6D6]',
    coral:      'bg-[#FFEAE3] text-[#E8552F] dark:bg-[#3A241D] dark:text-[#FF8A6E]',
    success:    'bg-[#E6F7EF] text-[#1F9D6E] dark:bg-[#103625] dark:text-[#34C28A]',
    warning:    'bg-[#FCF3DF] text-[#B27A1B] dark:bg-[#3A2D10] dark:text-[#E8B655]',
    danger:     'bg-[#FCE8E8] text-[#DC4848] dark:bg-[#3A1A1A] dark:text-[#F0716E]',
    freshwater: 'bg-[#E3F1F7] text-[#0E4561] dark:bg-[#123347] dark:text-[#6FB6D6]',
    saltwater:  'bg-[#E0F4F6] text-[#0E7C8A] dark:bg-[#0E2E33] dark:text-[#4DC2D1]',
    brackish:   'bg-[#E9F5EE] text-[#1F8A5E] dark:bg-[#11301F] dark:text-[#3FB87E]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${variants[variant] || variants.default}`}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, icon: Icon, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-[13px] font-semibold text-[#2B3D4D] dark:text-[#C7D3DA]">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9FB2BE] dark:text-[#5C7384] pointer-events-none">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
        <input
          {...props}
          className={`w-full rounded-xl border bg-white dark:bg-[#0F1B25] px-3.5 py-2.5 text-sm text-[#14202B] dark:text-[#EEF3F6] placeholder:text-[#9FB2BE] dark:placeholder:text-[#5C7384] transition-all duration-150 focus:outline-none focus:ring-[3px] focus:ring-[#0E4561]/12 dark:focus:ring-[#2389B5]/20 focus:border-[#0E4561] dark:focus:border-[#2389B5] ${error ? 'border-[#DC4848]' : 'border-[#E6EDF1] dark:border-[#233340]'} ${Icon ? 'pl-10' : ''} disabled:bg-[#F4F8FA] dark:disabled:bg-[#0A141C] disabled:text-[#9FB2BE]`}
        />
      </div>
      {error && <p className="text-xs text-[#DC4848] font-medium">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-[13px] font-semibold text-[#2B3D4D] dark:text-[#C7D3DA]">{label}</label>}
      <select
        {...props}
        className={`w-full rounded-xl border bg-white dark:bg-[#0F1B25] px-3.5 py-2.5 text-sm text-[#14202B] dark:text-[#EEF3F6] transition-all duration-150 focus:outline-none focus:ring-[3px] focus:ring-[#0E4561]/12 dark:focus:ring-[#2389B5]/20 focus:border-[#0E4561] dark:focus:border-[#2389B5] appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%235C7384%22 stroke-width=%221.5%22 fill=%22none%22/></svg>')] bg-no-repeat bg-[right_14px_center] pr-9 ${error ? 'border-[#DC4848]' : 'border-[#E6EDF1] dark:border-[#233340]'} disabled:bg-[#F4F8FA] dark:disabled:bg-[#0A141C] disabled:text-[#9FB2BE]`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#DC4848] font-medium">{error}</p>}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-[#0E4561] dark:text-[#3FA3CC] ${className}`} strokeWidth={2.25} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={36} />
        <p className="text-sm text-[#5C7384] dark:text-[#93A4AF] font-medium">Loading…</p>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[#F1F8FB] dark:bg-[#123347] flex items-center justify-center text-[#9FB2BE] dark:text-[#5C7384]">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[15px]">{title}</p>
        {description && <p className="text-sm text-[#5C7384] dark:text-[#93A4AF] mt-1 max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#0A1620]/55 dark:bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative bg-white dark:bg-[#14202B] rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6EDF1] dark:border-[#233340] sticky top-0 bg-white dark:bg-[#14202B] rounded-t-2xl">
              <h2 className="text-[17px] font-bold text-[#14202B] dark:text-[#EEF3F6] font-display">{title}</h2>
              <IconButton icon={X} onClick={onClose} label="Close" />
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 80, strokeWidth = 7 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#1F9D6E' : score >= 50 ? '#D89A2A' : '#DC4848';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" className="stroke-[#E6EDF1] dark:stroke-[#233340]" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.22} fontWeight="700" fill={color} fontFamily="Outfit, sans-serif">
        {score}%
      </text>
    </svg>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, trend, color = 'ocean' }) {
  const colors = {
    ocean:   'bg-[#E3F1F7] text-[#0E4561] dark:bg-[#123347] dark:text-[#6FB6D6]',
    coral:   'bg-[#FFEAE3] text-[#E8552F] dark:bg-[#3A241D] dark:text-[#FF8A6E]',
    success: 'bg-[#E6F7EF] text-[#1F9D6E] dark:bg-[#103625] dark:text-[#34C28A]',
    warning: 'bg-[#FCF3DF] text-[#B27A1B] dark:bg-[#3A2D10] dark:text-[#E8B655]',
  };
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[#5C7384] dark:text-[#93A4AF] font-semibold">{label}</p>
          <p className="text-[28px] leading-tight font-extrabold text-[#14202B] dark:text-[#EEF3F6] mt-1 font-display truncate">
            {value ?? '—'}
          </p>
          {trend !== undefined && (
            <p className="text-xs text-[#1F9D6E] dark:text-[#34C28A] mt-1 font-semibold">{trend}</p>
          )}
        </div>
        {Icon && (
          <span className={`p-2.5 rounded-xl shrink-0 ${colors[color]}`}>
            <Icon size={20} strokeWidth={2} />
          </span>
        )}
      </div>
    </Card>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
      <div>
        <h2 className="text-2xl font-bold text-[#14202B] dark:text-[#EEF3F6] font-display tracking-tight">{title}</h2>
        {subtitle && <p className="text-[14px] text-[#5C7384] dark:text-[#93A4AF] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children, icon: Icon }) {
  const styles = {
    info:    'bg-[#E3F1F7] border-[#BEDCE9] text-[#0E4561] dark:bg-[#123347] dark:border-[#1A4A63] dark:text-[#6FB6D6]',
    success: 'bg-[#E6F7EF] border-[#BCE6D2] text-[#176B4B] dark:bg-[#103625] dark:border-[#1A4F35] dark:text-[#34C28A]',
    warning: 'bg-[#FCF3DF] border-[#F2DBA0] text-[#8A6112] dark:bg-[#3A2D10] dark:border-[#4F3F18] dark:text-[#E8B655]',
    error:   'bg-[#FCE8E8] border-[#F3C2C2] text-[#A93636] dark:bg-[#3A1A1A] dark:border-[#4F2424] dark:text-[#F0716E]',
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {Icon && <Icon size={17} className="shrink-0 mt-0.5" strokeWidth={2.25} />}
      <div>{children}</div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-[#E6EDF1] dark:bg-[#0F1B25] rounded-xl p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            active === tab.id ? 'text-[#0E4561] dark:text-[#EEF3F6]' : 'text-[#5C7384] dark:text-[#93A4AF] hover:text-[#2B3D4D] dark:hover:text-[#C7D3DA]'
          }`}
        >
          {active === tab.id && (
            <motion.span
              layoutId="tab-pill"
              className="absolute inset-0 bg-white dark:bg-[#233340] rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
