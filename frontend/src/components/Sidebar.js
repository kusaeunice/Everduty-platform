import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, CalendarDays, FileText, Wallet, User, LogOut, Menu, X,
  ChevronRight, Briefcase, GraduationCap, Wrench, Globe, Building, Users, Plane, Clock,
  Gift, BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';

const navItems = {
  worker: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'shifts', label: 'Temp Shifts', icon: Clock },
    { key: 'permanent-jobs', label: 'Permanent Jobs', icon: Briefcase },
    { key: 'freelance', label: 'Freelance', icon: Wrench },
    { key: 'student', label: 'Student Placements', icon: GraduationCap },
    { key: 'my-shifts', label: 'My Applications', icon: FileText },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'earnings', label: 'Earnings', icon: Wallet },
    { key: 'visa', label: 'Visa & International', icon: Plane },
    { key: 'referrals', label: 'Referrals', icon: Gift },
    { key: 'academy', label: 'Academy', icon: BookOpen },
    { key: 'profile', label: 'Profile', icon: User },
  ],
  employer: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'shifts', label: 'Temp Shifts', icon: Clock },
    { key: 'permanent-jobs', label: 'Permanent Jobs', icon: Briefcase },
    { key: 'student', label: 'Student Placements', icon: GraduationCap },
    { key: 'applicants', label: 'Applicants', icon: Users },
    { key: 'timesheets', label: 'Timesheets', icon: FileText },
    { key: 'organization', label: 'Organization', icon: Building },
    { key: 'referrals', label: 'Referrals', icon: Gift },
    { key: 'academy', label: 'Academy', icon: BookOpen },
  ],
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'workers', label: 'Workers', icon: User },
    { key: 'employers', label: 'Employers', icon: Building },
    { key: 'agencies', label: 'Agencies', icon: Globe },
    { key: 'shifts', label: 'Temp Shifts', icon: Clock },
    { key: 'permanent-jobs', label: 'Permanent Jobs', icon: Briefcase },
    { key: 'freelancers', label: 'Freelancers', icon: Wrench },
    { key: 'student', label: 'Student Placements', icon: GraduationCap },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'timesheets', label: 'Timesheets', icon: FileText },
    { key: 'visa', label: 'Visa Applications', icon: Plane },
    { key: 'finance', label: 'Finance', icon: Wallet },
    { key: 'referrals', label: 'Referrals', icon: Gift },
    { key: 'academy', label: 'Academy', icon: BookOpen },
  ],
  agency: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'shifts', label: 'Temp Shifts', icon: Clock },
    { key: 'permanent-jobs', label: 'Permanent Jobs', icon: Briefcase },
    { key: 'applicants', label: 'Applicants', icon: Users },
    { key: 'workers', label: 'Worker Pool', icon: User },
    { key: 'shared-workers', label: 'Find Workers', icon: Globe },
    { key: 'timesheets', label: 'Timesheets', icon: FileText },
    { key: 'referrals', label: 'Referrals', icon: Gift },
    { key: 'academy', label: 'Academy', icon: BookOpen },
    { key: 'settings', label: 'Agency Settings', icon: Shield },
  ],
};

export function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems[user?.role] || [];
  const handleLogout = () => { logout(); navigate('/'); };
  const roleLabel = user?.role === 'admin' ? 'Super Admin' : user?.role === 'employer' ? 'Employer Portal' : user?.role === 'agency' ? 'Agency Portal' : 'Worker App';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C5A059] rounded-sm flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
          <div>
            <p className="font-['Oswald'] text-lg font-bold text-white tracking-wider leading-none">EVERDUTY</p>
            <p className="text-[10px] text-[#C5A059] tracking-[0.2em] uppercase mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13px] font-medium transition-all duration-200 group
                ${isActive ? 'bg-[#C5A059]/20 text-[#C5A059] border-l-2 border-[#C5A059]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              data-testid={`nav-${item.key}`}>
              <item.icon className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="tracking-wide">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-[#C5A059]" />}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] text-sm font-bold">{user?.full_name?.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-sm h-8 text-xs" data-testid="logout-btn">
          <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0F172A] text-white rounded-sm flex items-center justify-center shadow-lg" data-testid="mobile-menu-toggle">
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-[#0F172A] sidebar-texture z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}><SidebarContent /></div>
      <div className="hidden md:block fixed top-0 left-0 h-screen w-64 bg-[#0F172A] sidebar-texture z-30"><SidebarContent /></div>
    </>
  );
}
