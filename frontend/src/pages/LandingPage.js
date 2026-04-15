import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Shield, Users, Briefcase, ArrowRight, Clock, FileCheck, ChartBar,
  GraduationCap, Wrench, Globe, Building, Star, CheckCircle2,
  Smartphone, Award, TrendingUp, MapPin, Menu, X, ChevronRight, Zap, Heart, Phone, Mail
} from 'lucide-react';

const HERO_IMG = 'https://images.unsplash.com/photo-1758873268663-5a362616b5a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwdGVhbSUyMG9mZmljZSUyMG1vZGVybiUyMHdvcmtwbGFjZSUyMGNvbGxhYm9yYXRpb258ZW58MHx8fHwxNzczNTgwODM0fDA&ixlib=rb-4.1.0&q=85';
const WORKER_IMG = 'https://images.unsplash.com/photo-1768796372882-8b67936af681?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjB3b3JrZXIlMjBsb2dpc3RpY3MlMjBzYWZldHklMjB2ZXN0fGVufDB8fHx8MTc3MzU4MDgzNHww&ixlib=rb-4.1.0&q=85';
const EMPLOYER_IMG = 'https://images.unsplash.com/photo-1758520144427-ddb02ac74e9d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlb3BsZSUyMGhhbmRzaGFrZSUyMGhpcmluZyUyMHJlY3J1aXRtZW50fGVufDB8fHx8MTc3MzU4MDgyNnww&ixlib=rb-4.1.0&q=85';
const HEALTHCARE_IMG = 'https://images.unsplash.com/photo-1761234852472-85aeea9c3eac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwd29ya2VyJTIwbnVyc2UlMjBob3NwaXRhbCUyMHByb2Zlc3Npb25hbHxlbnwwfHx8fDE3NzM1ODA4Mjd8MA&ixlib=rb-4.1.0&q=85';
const CONSTRUCTION_IMG = 'https://images.unsplash.com/photo-1694522362256-6c907336af43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBzYWZldHklMjBoZWxtZXQlMjBzaXRlfGVufDB8fHx8MTc3MzU4MDgyN3ww&ixlib=rb-4.1.0&q=85';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`${className} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function AuthDialog({ open, onOpenChange, defaultTab = 'login' }) {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('worker');
  const [regPhone, setRegPhone] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try { await login(loginEmail, loginPassword); toast.success('Welcome back!'); }
    catch (err) { toast.error(err.response?.data?.detail || 'Login failed'); }
    finally { setIsLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try { await register({ email: regEmail, password: regPassword, full_name: regName, role: regRole, phone: regPhone }); toast.success('Account created!'); }
    catch (err) { toast.error(err.response?.data?.detail || 'Registration failed'); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-0 rounded-lg" data-testid="auth-dialog">
        <div className="bg-[#0F172A] px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-[#C5A059] rounded flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
              <DialogTitle className="font-['Oswald'] text-xl text-white tracking-wider">EVERDUTY</DialogTitle>
            </div>
            <p className="text-slate-400 text-xs">Global Multi-Industry Staffing Platform</p>
          </DialogHeader>
        </div>
        <div className="p-6">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-md mb-5">
              <TabsTrigger value="login" className="rounded-md font-['Oswald'] tracking-wider uppercase text-xs" data-testid="login-tab">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md font-['Oswald'] tracking-wider uppercase text-xs" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-xs font-bold tracking-wider uppercase text-slate-500">Email</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@company.com" className="mt-1 h-11 rounded-md border-slate-200 focus:border-[#C5A059] focus:ring-[#C5A059]" data-testid="login-email-input" required />
                </div>
                <div>
                  <Label className="text-xs font-bold tracking-wider uppercase text-slate-500">Password</Label>
                  <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter password" className="mt-1 h-11 rounded-md border-slate-200 focus:border-[#C5A059] focus:ring-[#C5A059]" data-testid="login-password-input" required />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#0F172A] text-white hover:bg-[#1e293b] rounded-md uppercase tracking-wider font-bold text-xs border-b-2 border-[#C5A059]" data-testid="login-submit-btn">
                  {isLoading ? <div className="gold-spinner mx-auto" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>}
                </Button>
                <p className="text-center text-[10px] text-slate-400 mt-2">Demo: admin@everduty.com / admin123</p>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <Label className="text-xs font-bold tracking-wider uppercase text-slate-500">Full Name</Label>
                  <Input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="John Smith" className="mt-1 h-10 rounded-md" data-testid="register-name-input" required />
                </div>
                <div>
                  <Label className="text-xs font-bold tracking-wider uppercase text-slate-500">Email</Label>
                  <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@email.com" className="mt-1 h-10 rounded-md" data-testid="register-email-input" required />
                </div>
                <div>
                  <Label className="text-xs font-bold tracking-wider uppercase text-slate-500">Password</Label>
                  <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 h-10 rounded-md" data-testid="register-password-input" required />
                </div>
                <div>
                  <Label className="text-xs font-bold tracking-wider uppercase text-slate-500">Register As</Label>
                  <Select value={regRole} onValueChange={setRegRole}>
                    <SelectTrigger className="mt-1 h-10 rounded-md" data-testid="register-role-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> Worker / Freelancer</div></SelectItem>
                      <SelectItem value="employer"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Employer / University</div></SelectItem>
                      <SelectItem value="agency"><div className="flex items-center gap-2"><Building className="w-4 h-4" /> Staffing Agency</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#C5A059] text-white hover:bg-[#b8933f] rounded-md uppercase tracking-wider font-bold text-xs" data-testid="register-submit-btn">
                  {isLoading ? <div className="gold-spinner mx-auto" /> : <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openAuth = (tab) => { setAuthTab(tab); setAuthOpen(true); setMobileNav(false); };
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileNav(false); };

  const services = [
    { icon: Clock, title: 'Temporary Shifts', desc: 'Browse and book temp shifts across 12+ industries. Healthcare, hospitality, security, warehousing and more.', color: '#C5A059' },
    { icon: Briefcase, title: 'Permanent Jobs', desc: 'Find full-time positions with visa sponsorship, remote options and competitive salaries worldwide.', color: '#3b82f6' },
    { icon: GraduationCap, title: 'Student Placements', desc: 'University and college placements with scholarship and visa support for international students.', color: '#8b5cf6' },
    { icon: Wrench, title: 'Freelance Marketplace', desc: 'Hire independent workers: nannies, tutors, trainers, cleaners, developers, tradespeople and 100+ more.', color: '#10b981' },
    { icon: Globe, title: 'International Recruitment', desc: 'Multi-country, multi-currency staffing with visa sponsorship tracking and relocation support.', color: '#f59e0b' },
    { icon: FileCheck, title: 'AI Compliance', desc: 'Automated document verification, fraud detection and expiry tracking powered by AI.', color: '#ef4444' },
  ];

  const stats = [
    { num: '50,000+', label: 'Active Workers', icon: Users },
    { num: '10,000+', label: 'Shifts Filled Monthly', icon: Clock },
    { num: '19+', label: 'Industries Covered', icon: Briefcase },
    { num: '30+', label: 'Countries Worldwide', icon: Globe },
  ];

  const steps = [
    { num: '01', title: 'Create Your Profile', desc: 'Sign up in under 2 minutes. Upload your documents, set your preferences, and get verified.', icon: Users },
    { num: '02', title: 'Browse Opportunities', desc: 'Explore thousands of shifts, permanent jobs, placements, and freelance gigs matched to your skills.', icon: Briefcase },
    { num: '03', title: 'Start Working', desc: 'Accept offers, clock in/out digitally, track your hours, and get paid on time every time.', icon: Zap },
  ];

  const testimonials = [
    { name: 'Sarah M.', role: 'Healthcare Worker', text: 'EverDuty completely changed my career. I went from struggling to find shifts to having my pick of the best hospitals in London. The app is incredibly easy to use.', rating: 5 },
    { name: 'James O.', role: 'HR Director, CarePlus', text: 'We reduced our agency spend by 35% while improving fill rates. The quality of workers on EverDuty is consistently outstanding. A game-changer for our staffing needs.', rating: 5 },
    { name: 'Priya K.', role: 'Agency Owner, SwiftStaff', text: 'As a small agency, EverDuty gave us the technology platform we needed without the massive upfront investment. Our worker pool grew 4x in just three months.', rating: 5 },
  ];

  const industries = [
    { name: 'Healthcare', img: HEALTHCARE_IMG },
    { name: 'Construction', img: CONSTRUCTION_IMG },
    { name: 'Warehousing', img: WORKER_IMG },
    { name: 'Hospitality', img: EMPLOYER_IMG },
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/95 backdrop-blur-md shadow-xl' : 'bg-transparent'}`} data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-16 lg:h-[72px]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#C5A059] rounded flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <span className="font-['Oswald'] text-xl lg:text-2xl font-bold text-white tracking-wider" data-testid="brand-name">EVERDUTY</span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            {[['services', 'Services'], ['workers', 'For Workers'], ['employers', 'For Employers'], ['agencies', 'For Agencies'], ['industries', 'Industries']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-sm text-slate-300 hover:text-[#C5A059] transition-colors font-medium">{label}</button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" onClick={() => openAuth('login')} className="text-white hover:text-[#C5A059] hover:bg-white/5 text-sm font-semibold" data-testid="nav-signin-btn">Sign In</Button>
            <Button onClick={() => openAuth('register')} className="bg-[#C5A059] hover:bg-[#b8933f] text-white rounded-full px-6 text-sm font-bold" data-testid="nav-getstarted-btn">Get Started</Button>
          </div>
          <button className="lg:hidden text-white" onClick={() => setMobileNav(!mobileNav)} data-testid="mobile-menu-btn">
            {mobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileNav && (
          <div className="lg:hidden bg-[#0F172A] border-t border-white/10 px-5 py-4 space-y-3 animate-fade-in">
            {[['services', 'Services'], ['workers', 'For Workers'], ['employers', 'For Employers'], ['agencies', 'For Agencies']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block text-sm text-slate-300 hover:text-[#C5A059] py-1.5 w-full text-left">{label}</button>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => openAuth('login')} className="flex-1 border-white/20 text-white hover:bg-white/5 text-sm">Sign In</Button>
              <Button onClick={() => openAuth('register')} className="flex-1 bg-[#C5A059] text-white text-sm">Get Started</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] lg:min-h-[92vh] flex items-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-[#0F172A]">
          <img src={HERO_IMG} alt="Team collaboration" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-[#0F172A]/60" />
          <div className="absolute inset-0 sidebar-texture opacity-20" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 w-full pt-24 lg:pt-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#C5A059]/15 border border-[#C5A059]/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[#C5A059] text-xs font-semibold tracking-wide">Global Staffing Platform</span>
            </div>
            <h1 className="font-['Oswald'] text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6" data-testid="hero-heading">
              The Future of<br />
              <span className="gold-gradient-text">Workforce Solutions</span>
            </h1>
            <p className="text-slate-400 text-base lg:text-lg leading-relaxed mb-8 max-w-xl">
              Connect with top talent across 19+ industries and 30+ countries. Temporary shifts, permanent jobs, student placements, and freelance services — all on one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button onClick={() => openAuth('register')} className="bg-[#C5A059] hover:bg-[#b8933f] text-white rounded-full h-12 px-8 text-sm font-bold shadow-lg shadow-[#C5A059]/20" data-testid="hero-getstarted-btn">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => openAuth('login')} className="border-white/20 text-white hover:bg-white/5 rounded-full h-12 px-8 text-sm font-semibold" data-testid="hero-signin-btn">
                Sign In to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Free to join</span></div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>No hidden fees</span></div>
              <div className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-emerald-400" /><span>Works on all devices</span></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-1 bg-white" data-testid="stats-section">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="bg-[#0F172A] rounded-2xl p-6 lg:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 shadow-2xl -translate-y-12">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 100} className="text-center">
                <s.icon className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <div className="font-['Oswald'] text-2xl lg:text-3xl font-bold text-white">{s.num}</div>
                <div className="text-slate-400 text-xs lg:text-sm mt-0.5">{s.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 lg:py-24 bg-white" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">What We Offer</span>
            <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight mt-2">One Platform, Every Opportunity</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-base">From temporary shifts to permanent placements, freelance gigs to international recruitment. Everything your workforce needs.</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {services.map((s, i) => (
              <FadeIn key={s.title} delay={i * 80}>
                <div className="group bg-white border border-slate-100 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full" data-testid={`service-card-${i}`}>
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}15` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <h3 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] tracking-wide mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* For Workers */}
      <section id="workers" className="py-16 lg:py-24 bg-slate-50" data-testid="workers-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <FadeIn>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img src={WORKER_IMG} alt="Workers in warehouse" className="w-full h-[360px] lg:h-[440px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">+340% More Opportunities</p>
                      <p className="text-xs text-slate-500">Workers find 3x more shifts on EverDuty</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">For Workers</span>
              <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight mt-2 mb-5">Find Your Next Opportunity</h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6">Whether you're looking for temporary shifts, a permanent career move, a student placement, or freelance work, EverDuty connects you with the right opportunities.</p>
              <div className="space-y-4 mb-8">
                {[
                  ['Browse thousands of shifts and jobs across 19+ industries', CheckCircle2],
                  ['Get instant notifications for roles matching your skills', CheckCircle2],
                  ['Track your hours, documents, and earnings in one place', CheckCircle2],
                  ['Earn referral bonuses through our tiered rewards program', Award],
                  ['Access 32+ training courses in our Academy', GraduationCap],
                ].map(([text, Icon]) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-[#C5A059] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => openAuth('register')} className="bg-[#C5A059] hover:bg-[#b8933f] text-white rounded-full h-11 px-7 text-sm font-bold" data-testid="workers-cta-btn">
                Join as a Worker <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* For Employers */}
      <section id="employers" className="py-16 lg:py-24 bg-white" data-testid="employers-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <FadeIn delay={150} className="order-2 lg:order-1">
              <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">For Employers</span>
              <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight mt-2 mb-5">Hire Smarter, Faster</h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6">Post shifts in seconds, review verified candidates, and fill positions faster than ever. Reduce costs, improve quality, and scale your workforce with confidence.</p>
              <div className="space-y-4 mb-8">
                {[
                  'Post temp shifts or permanent positions in under 60 seconds',
                  'Access pre-verified, document-checked workers instantly',
                  'AI-powered compliance and fraud detection',
                  'Digital timesheets and automated payroll tracking',
                  'Dedicated analytics dashboard for workforce insights',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#C5A059] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => openAuth('register')} className="bg-[#0F172A] hover:bg-[#1e293b] text-white rounded-full h-11 px-7 text-sm font-bold border-b-2 border-[#C5A059]" data-testid="employers-cta-btn">
                Start Hiring Today <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </FadeIn>
            <FadeIn className="order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img src={EMPLOYER_IMG} alt="Employer hiring" className="w-full h-[360px] lg:h-[440px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">Average Fill Time: 4 Hours</p>
                      <p className="text-xs text-slate-500">vs. 3-5 days with traditional agencies</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* For Agencies */}
      <section id="agencies" className="py-16 lg:py-24 bg-[#0F172A] relative overflow-hidden" data-testid="agencies-section">
        <div className="absolute inset-0 sidebar-texture opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <FadeIn>
              <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">For Staffing Agencies</span>
              <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-white tracking-tight mt-2 mb-5">Your Agency, Supercharged</h2>
              <p className="text-slate-400 text-base leading-relaxed mb-6">Don't have a technology platform? No problem. EverDuty gives your agency enterprise-grade tools without the enterprise price tag. Go digital in minutes, not months.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Building, title: 'Your Brand', desc: 'Post shifts and jobs under your agency name' },
                  { icon: Users, title: 'Worker Pool', desc: 'Build and manage your own verified workforce' },
                  { icon: ChartBar, title: 'Revenue Tracking', desc: 'Real-time commission and financial dashboards' },
                  { icon: Smartphone, title: 'Mobile Ready', desc: 'Full PWA app — installable on any device' },
                ].map((item) => (
                  <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <item.icon className="w-5 h-5 text-[#C5A059] mb-2" />
                    <p className="font-['Oswald'] text-sm font-semibold text-white tracking-wide">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => openAuth('register')} className="bg-[#C5A059] hover:bg-[#b8933f] text-white rounded-full h-11 px-7 text-sm font-bold" data-testid="agencies-cta-btn">
                Register Your Agency <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
                <p className="text-[#C5A059] font-['Oswald'] text-xs tracking-widest uppercase mb-5">Agency Dashboard Preview</p>
                <div className="space-y-3">
                  {[
                    { label: 'Active Workers', value: '247', change: '+18%' },
                    { label: 'Shifts This Month', value: '1,432', change: '+24%' },
                    { label: 'Monthly Revenue', value: '\u00a3142,800', change: '+31%' },
                    { label: 'Fill Rate', value: '94.2%', change: '+5.3%' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                      <span className="text-slate-400 text-sm">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-['Oswald'] text-lg font-bold text-white">{row.value}</span>
                        <span className="text-emerald-400 text-xs font-semibold">{row.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-slate-50" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">How It Works</span>
            <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight mt-2">Get Started in 3 Simple Steps</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 120}>
                <div className="text-center relative">
                  <div className="w-16 h-16 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 relative">
                    <step.icon className="w-7 h-7 text-[#C5A059]" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#0F172A] text-white font-['Oswald'] text-xs font-bold rounded-full flex items-center justify-center">{step.num}</span>
                  </div>
                  <h3 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] tracking-wide mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  {i < 2 && <ChevronRight className="hidden md:block w-6 h-6 text-slate-300 absolute top-8 -right-4" />}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-16 lg:py-24 bg-white" data-testid="industries-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-12">
            <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">Industries We Serve</span>
            <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight mt-2">Staffing Across Every Sector</h2>
          </FadeIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((ind, i) => (
              <FadeIn key={ind.name} delay={i * 80}>
                <div className="group relative rounded-xl overflow-hidden h-52 lg:h-64 cursor-pointer">
                  <img src={ind.img} alt={ind.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="font-['Oswald'] text-lg font-bold text-white tracking-wide">{ind.name}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="mt-8 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              {['Retail', 'Education', 'Tech', 'Finance', 'Transport', 'Security', 'Cleaning', 'Events', 'Legal', 'Manufacturing', 'Energy', 'Agriculture', 'Aviation', 'Maritime', 'Telecoms'].map((ind) => (
                <span key={ind} className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-full">{ind}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-slate-50" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="text-[#C5A059] font-semibold text-sm tracking-wide uppercase">Testimonials</span>
            <h2 className="font-['Oswald'] text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight mt-2">Trusted by Thousands</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-full flex flex-col" data-testid={`testimonial-card-${i}`}>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="w-9 h-9 bg-[#0F172A] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{t.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PWA Banner */}
      <section className="py-12 bg-[#C5A059]" data-testid="pwa-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <FadeIn>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-['Oswald'] text-xl font-bold text-white tracking-wide">Install EverDuty on Your Device</h3>
                  <p className="text-white/80 text-sm">Works like a native app on Android, iOS, and desktop. No app store needed.</p>
                </div>
              </div>
              <Button onClick={() => openAuth('register')} className="bg-[#0F172A] hover:bg-[#1e293b] text-white rounded-full h-11 px-8 text-sm font-bold flex-shrink-0" data-testid="pwa-cta-btn">
                Get the App <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28 bg-[#0F172A] relative overflow-hidden" data-testid="final-cta-section">
        <div className="absolute inset-0 sidebar-texture opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 lg:px-8 text-center">
          <FadeIn>
            <h2 className="font-['Oswald'] text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
              Ready to Transform<br />Your <span className="gold-gradient-text">Workforce?</span>
            </h2>
            <p className="text-slate-400 text-base lg:text-lg mb-8 max-w-xl mx-auto">Join thousands of workers, employers, and agencies already using EverDuty. Sign up in under 2 minutes — completely free.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button onClick={() => openAuth('register')} className="bg-[#C5A059] hover:bg-[#b8933f] text-white rounded-full h-12 px-8 text-sm font-bold shadow-lg shadow-[#C5A059]/20" data-testid="final-cta-register-btn">
                Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => openAuth('login')} className="border-white/20 text-white hover:bg-white/5 rounded-full h-12 px-8 text-sm font-semibold" data-testid="final-cta-signin-btn">
                Sign In
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0f1a] text-slate-400 py-12 lg:py-16" data-testid="footer-section">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-[#C5A059] rounded flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
                <span className="font-['Oswald'] text-lg font-bold text-white tracking-wider">EVERDUTY</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Global multi-industry staffing and recruitment platform. Connecting workers, employers, and agencies worldwide.</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5" /> <span>London, United Kingdom</span>
              </div>
            </div>
            <div>
              <p className="font-['Oswald'] text-sm font-semibold text-white tracking-wider uppercase mb-4">For Workers</p>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Find Temp Shifts</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Permanent Jobs</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Student Placements</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">List Freelance Services</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Training Academy</button></li>
              </ul>
            </div>
            <div>
              <p className="font-['Oswald'] text-sm font-semibold text-white tracking-wider uppercase mb-4">For Business</p>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Post Shifts</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Hire Permanent Staff</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">University Partnerships</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Agency Platform</button></li>
                <li><button onClick={() => openAuth('register')} className="hover:text-[#C5A059] transition-colors">Enterprise Solutions</button></li>
              </ul>
            </div>
            <div>
              <p className="font-['Oswald'] text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact</p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#C5A059]" /> hello@everduty.org</li>
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#C5A059]" /> +44 (0) 20 7946 0958</li>
                <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-[#C5A059]" /> everduty.org</li>
              </ul>
              <div className="flex gap-2 mt-4">
                <span className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[#C5A059]/20 transition-colors cursor-pointer"><Heart className="w-3.5 h-3.5" /></span>
                <span className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[#C5A059]/20 transition-colors cursor-pointer"><Users className="w-3.5 h-3.5" /></span>
                <span className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[#C5A059]/20 transition-colors cursor-pointer"><Globe className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-500">&copy; 2026 EverDuty Flex Staffing Solutions. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="hover:text-[#C5A059] cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-[#C5A059] cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-[#C5A059] cursor-pointer transition-colors">Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
