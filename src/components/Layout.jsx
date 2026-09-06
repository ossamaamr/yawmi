// ══════════════════════════════════════════════════════════
// components/Layout.jsx — الغلاف العام: شريط تنقل سفلي + شريط عدم الاتصال
// ══════════════════════════════════════════════════════════
import { NavLink, Outlet } from 'react-router-dom';
import { useOnline } from '../hooks/useOnline';

const NAV_ITEMS = [
  { to: '/', label: 'اليوم', icon: '☀️', end: true },
  { to: '/week', label: 'الأسبوع', icon: '📅' },
  { to: '/progress', label: 'التقدم', icon: '📈' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Layout() {
  const online = useOnline();

  return (
    <>
      {!online && <div className="offline-bar">لا يوجد اتصال — يعمل التطبيق محليًا ⚡</div>}
      <main className="main-wrap">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="fab">
        <NavLink to="/task/new" className="fab-btn" aria-label="مهمة جديدة">
          +
        </NavLink>
      </div>
    </>
  );
}