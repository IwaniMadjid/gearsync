/**
 * Shared design tokens & UI primitives — GearSync × units.gr
 */

export const T = {
  bg:      '#0c0b0f',
  surface: '#131118',
  raised:  '#1a1820',
  overlay: '#211f2a',
  border:  '#22202b',
  border2: '#2e2b3a',
  border3: '#3d3a4d',
  textPri: '#e8e0d0',
  textSec: '#7a7470',
  textMut: '#524e4b',
  gold:    '#c8a660',
  goldBg:  'rgba(200, 166, 96, 0.07)',
  goldDim: '#a88845',
  jade:    '#72b08a',
  jadeBg:  'rgba(114, 176, 138, 0.08)',
  ember:   '#c47060',
  emberBg: 'rgba(196, 112, 96, 0.08)',
  sky:     '#70a8c4',
  skyBg:   'rgba(112, 168, 196, 0.08)',
};

export const inputStyle = {
  background:   T.raised,
  border:       `1px solid ${T.border2}`,
  borderRadius: 3,
  color:        T.textPri,
  padding:      '8px 12px',
  fontSize:     '0.8rem',
  width:        '100%',
  outline:      'none',
  transition:   'border-color 0.15s',
};

export const selectStyle = { ...inputStyle, cursor: 'pointer' };

export const btnPrimary = {
  background:   T.gold,
  color:        T.surface,
  border:       'none',
  borderRadius: 3,
  padding:      '9px 20px',
  fontSize:     '0.78rem',
  fontWeight:   600,
  letterSpacing:'0.04em',
  cursor:       'pointer',
  transition:   'background 0.15s',
};

export const btnSecondary = {
  background:   T.raised,
  color:        T.textSec,
  border:       `1px solid ${T.border2}`,
  borderRadius: 3,
  padding:      '8px 16px',
  fontSize:     '0.78rem',
  fontWeight:   500,
  cursor:       'pointer',
  transition:   'background 0.15s',
};

export const Card = ({ children, style = {}, pad = true }) => (
  <div style={{
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    ...(pad ? { padding: '0' } : {}),
    ...style,
  }}>
    {children}
  </div>
);

export const CardHeader = ({ title, action, gold }) => (
  <div style={{
    padding: '14px 20px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(12, 11, 15, 0.4)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 5, height: 5, background: gold ? T.gold : T.border3, borderRadius: 1, transform: 'rotate(45deg)' }} />
      <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textSec }}>
        {title}
      </span>
    </div>
    {action}
  </div>
);

export const Eyebrow = ({ children, gold, style = {} }) => (
  <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: gold ? T.gold : T.textMut, ...style }}>
    {children}
  </p>
);

export const GoldBtn = ({ children, onClick, type = 'button', disabled = false, style = {} }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    style={{ ...btnPrimary, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
    {children}
  </button>
);

export const ModalOverlay = ({ children, onClose }) => (
  <div
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(6, 5, 10, 0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
  >
    {children}
  </div>
);

export const ModalBox = ({ children, style = {} }) => (
  <div style={{
    background: T.surface,
    border: `1px solid ${T.border2}`,
    borderRadius: 6,
    width: '100%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    ...style,
  }}>
    {children}
  </div>
);

export const ModalHeader = ({ title, onClose }) => (
  <div style={{
    padding: '16px 22px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(12, 11, 15, 0.5)',
    flexShrink: 0,
  }}>
    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: T.textPri, letterSpacing: '0.04em' }}>{title}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', padding: 4 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  </div>
);

export const Field = ({ label, children, gold }) => (
  <div>
    <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: gold ? T.gold : T.textMut, marginBottom: 6 }}>
      {label}
    </p>
    {children}
  </div>
);

export const Input = ({ style = {}, ...props }) => (
  <input
    style={{ ...inputStyle, ...style }}
    onFocus={e => e.target.style.borderColor = T.gold}
    onBlur={e => e.target.style.borderColor = T.border2}
    {...props}
  />
);

export const Select = ({ style = {}, children, ...props }) => (
  <select
    style={{ ...selectStyle, ...style }}
    onFocus={e => e.target.style.borderColor = T.gold}
    onBlur={e => e.target.style.borderColor = T.border2}
    {...props}
  >
    {children}
  </select>
);

export const Badge = ({ children, type = 'default' }) => {
  const colors = {
    success: { bg: 'rgba(114, 176, 138, 0.1)', color: '#72b08a', border: 'rgba(114, 176, 138, 0.2)' },
    warning: { bg: 'rgba(200, 166, 96, 0.1)',  color: '#c8a660', border: 'rgba(200, 166, 96, 0.2)' },
    danger:  { bg: 'rgba(196, 112, 96, 0.1)',  color: '#c47060', border: 'rgba(196, 112, 96, 0.2)' },
    sky:     { bg: 'rgba(112, 168, 196, 0.1)', color: '#70a8c4', border: 'rgba(112, 168, 196, 0.2)' },
    default: { bg: T.raised, color: T.textSec, border: T.border2 },
  };
  const c = colors[type] || colors.default;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 2, padding: '2px 7px', fontSize: '0.65rem', fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};

export const THead = ({ cols }) => (
  <thead>
    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
      {cols.map((c, i) => (
        <th key={i} style={{
          padding: '10px 16px',
          textAlign: typeof c === 'object' ? c.align || 'left' : 'left',
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.textMut,
          background: 'rgba(12, 11, 15, 0.4)',
          whiteSpace: 'nowrap',
        }}>
          {typeof c === 'object' ? c.label : c}
        </th>
      ))}
    </tr>
  </thead>
);