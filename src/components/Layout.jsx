// ══════════════════════════════════════════════════════════
// components/Layout.jsx — الغلاف العام: الشريط العلوي + شريط تنقل سفلي
// + زر الإضافة العائم + شريط عدم الاتصال
// ══════════════════════════════════════════════════════════
import { NavLink, Outlet } from 'react-router-dom';
import { useOnline } from '../hooks/useOnline';
import Header from './Header';

const NAV_ITEMS = [
  { to: '/', label: 'اليوم', icon: '☀️', end: true },
  { to: '/week', label: 'الأسبوع', icon: '📅' },
  { to: '/progress', label: 'التقدم', icon: '📈' },
  { to: '/quran', label: 'الورد', icon: '📖' },
  { to: '/recurring', label: 'المتكرر', icon: '🔁' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Layout() {
  const online = useOnline();

  return (
    <>
      {!online && <div className="شريط-عدم-الاتصال">لا يوجد اتصال — يعمل التطبيق محليًا ⚡</div>}
      <main className="الحاوية-الرئيسية">
        <Header />
        <Outlet />
      </main>
      <nav className="الشريط-السفلي">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'نشط' : '')}
          >
            <span className="أيقونة-التنقل">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="الزر-العائم">
        <NavLink to="/task/new" className="زر-عائم" aria-label="مهمة جديدة">
          +
        </NavLink>
      </div>
    </>
  );
}