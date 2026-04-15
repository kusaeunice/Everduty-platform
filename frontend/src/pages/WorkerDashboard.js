import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  CalendarDays, MapPin, Clock, Banknote, AlertTriangle, Search, FileUp, CheckCircle,
  XCircle, AlertCircle, Send, Briefcase, GraduationCap, Wrench, Globe, Plane,
  Star, Building, Plus, Heart, DollarSign, BookOpen, Eye
} from 'lucide-react';
import { ReferralView } from '../components/ReferralView';
import { AcademyView } from '../components/AcademyView';

function StatusBadge({ status }) {
  const styles = { open: 'bg-emerald-100 text-emerald-800', applied: 'bg-blue-100 text-blue-800', accepted: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800', pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', flagged: 'bg-orange-100 text-orange-800', filled: 'bg-slate-100 text-slate-600', completed: 'bg-blue-100 text-blue-800', shortlisted: 'bg-purple-100 text-purple-800', confirmed: 'bg-emerald-100 text-emerald-800', submitted: 'bg-blue-100 text-blue-800', active: 'bg-emerald-100 text-emerald-800' };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-slate-100 text-slate-600'}`} data-testid={`status-${status}`}>{status}</span>;
}

// ===== DASHBOARD =====
function DashboardView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myShifts, setMyShifts] = useState([]);
  const [earnings, setEarnings] = useState(null);
  useEffect(() => {
    Promise.all([api.get('/worker/profile'), api.get('/worker/my-shifts'), api.get('/worker/earnings')])
      .then(([p, s, e]) => { setProfile(p.data); setMyShifts(s.data); setEarnings(e.data); }).catch(console.error);
  }, []);
  const stats = [
    { label: 'Shifts Done', value: profile?.shifts_completed || 0, color: 'border-emerald-500' },
    { label: 'Earned', value: `£${earnings?.total_earned?.toFixed(2) || '0.00'}`, color: 'border-[#C5A059]' },
    { label: 'Pending', value: `£${earnings?.pending_amount?.toFixed(2) || '0.00'}`, color: 'border-amber-500' },
    { label: 'Rating', value: profile?.rating?.toFixed(1) || '0.0', color: 'border-blue-500' },
  ];
  return (
    <div className="space-y-6 animate-fade-in" data-testid="worker-dashboard-view">
      <div><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A] tracking-tight">Welcome, {user?.full_name}</h1><p className="text-sm text-slate-500 mt-1">Your staffing overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (<div key={s.label} className={`bg-white border-t-4 ${s.color} shadow-sm rounded-sm p-4`} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g,'-')}`}><p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{s.label}</p><p className="text-xl font-bold text-[#0F172A] mt-1 font-['Oswald']">{s.value}</p></div>))}
      </div>
      <div><h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] tracking-tight mb-3">My Shifts</h2>
        {myShifts.length === 0 ? <div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No shifts yet.</div> :
        <div className="space-y-2">{myShifts.slice(0,5).map(s => (<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between hover:border-[#C5A059]/30 transition-colors"><div><p className="font-semibold text-sm text-[#0F172A]">{s.title}</p><p className="text-xs text-slate-400">{s.location} &middot; {s.date} &middot; £{s.hourly_rate}/hr</p></div><StatusBadge status={s.application_status||s.status}/></div>))}</div>}
      </div>
    </div>
  );
}

// ===== BROWSE TEMP SHIFTS =====
function BrowseShifts() {
  const [shifts, setShifts] = useState([]); const [industry, setIndustry] = useState('all'); const [searchTerm, setSearchTerm] = useState(''); const [applying, setApplying] = useState(null);
  const loadShifts = useCallback(async () => { try { const p = {}; if(industry!=='all') p.industry=industry; if(searchTerm) p.location=searchTerm; const r = await api.get('/worker/shifts',{params:p}); setShifts(r.data); } catch(e){console.error(e);} }, [industry, searchTerm]);
  useEffect(() => { loadShifts(); }, [loadShifts]);
  const apply = async (id) => { setApplying(id); try { await api.post(`/worker/shifts/${id}/apply`); toast.success('Applied!'); loadShifts(); } catch(e) { toast.error(e.response?.data?.detail||'Failed'); } finally { setApplying(null); } };
  const industries = ['all','Healthcare','Social Care','Hospitality','Cleaning','Retail','Transport & Logistics','Warehousing','Security','Education Support','Office & Admin'];
  return (
    <div className="space-y-5 animate-fade-in" data-testid="browse-shifts-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Temporary Shifts</h1>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><Input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search location..." className="pl-10 h-10 rounded-sm" data-testid="shift-search-input"/></div>
        <Select value={industry} onValueChange={setIndustry}><SelectTrigger className="w-full md:w-52 h-10 rounded-sm" data-testid="industry-filter"><SelectValue/></SelectTrigger><SelectContent>{industries.map(i=><SelectItem key={i} value={i}>{i==='all'?'All Industries':i}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {shifts.map(s => (<div key={s.id} className="bg-white border border-slate-100 shadow-sm hover:border-[#C5A059]/40 hover:shadow-md transition-all rounded-sm overflow-hidden" data-testid={`shift-card-${s.id}`}>
          <div className="border-t-4 border-[#C5A059] p-4"><div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-[#0F172A] text-sm">{s.title}</h3>{s.urgent&&<span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">Urgent</span>}</div><p className="text-[10px] text-slate-400 mt-0.5">{s.industry} &middot; {s.employer_name}</p></div><span className="text-lg font-bold text-[#C5A059] font-['Oswald']">£{s.hourly_rate}<span className="text-[10px] text-slate-400 font-normal">/hr</span></span></div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3"><span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{s.location}</span><span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>{s.date}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{s.start_time}-{s.end_time}</span></div>
          {s.application_status ? <StatusBadge status={s.application_status}/> : <Button onClick={()=>apply(s.id)} disabled={applying===s.id} className="w-full bg-[#0F172A] text-white hover:bg-[#0F172A]/90 rounded-sm uppercase tracking-wider font-bold text-[10px] h-9 border-b-2 border-[#C5A059]" data-testid={`apply-btn-${s.id}`}>{applying===s.id?<div className="gold-spinner mx-auto"/>:'Apply Now'}</Button>}
          </div></div>))}
        {shifts.length===0&&<div className="col-span-2 bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No shifts found.</div>}
      </div>
    </div>
  );
}

// ===== PERMANENT JOBS =====
function PermanentJobs() {
  const [jobs, setJobs] = useState([]); const [applying, setApplying] = useState(null); const [filter, setFilter] = useState('all');
  useEffect(() => { api.get('/permanent-jobs', {params: filter!=='all'?{country:filter}:{}}).then(r=>setJobs(r.data)).catch(console.error); }, [filter]);
  const apply = async (id) => { setApplying(id); try { await api.post(`/permanent-jobs/${id}/apply`); toast.success('Application submitted!'); const r = await api.get('/permanent-jobs'); setJobs(r.data); } catch(e) { toast.error(e.response?.data?.detail||'Failed'); } finally { setApplying(null); } };
  return (
    <div className="space-y-5 animate-fade-in" data-testid="permanent-jobs-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Permanent Jobs</h1>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40 h-9 rounded-sm text-xs"><SelectValue placeholder="All Countries"/></SelectTrigger><SelectContent><SelectItem value="all">All Countries</SelectItem><SelectItem value="GB">UK</SelectItem><SelectItem value="AE">UAE</SelectItem><SelectItem value="US">USA</SelectItem><SelectItem value="CA">Canada</SelectItem></SelectContent></Select>
      </div>
      <div className="space-y-3">
        {jobs.map(j => (<div key={j.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4 hover:border-[#C5A059]/30 transition-colors" data-testid={`perm-job-${j.id}`}>
          <div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-[#0F172A]">{j.title}</h3>{j.visa_sponsorship&&<span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">Visa Sponsor</span>}{j.remote_option==='remote'&&<span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">Remote</span>}</div><p className="text-xs text-slate-400 mt-0.5">{j.industry} &middot; {j.employer_name} &middot; {j.job_type}</p></div>
          <div className="text-right"><p className="text-lg font-bold text-[#C5A059] font-['Oswald']">£{(j.salary_min/1000).toFixed(0)}k-{(j.salary_max/1000).toFixed(0)}k</p><p className="text-[10px] text-slate-400">{j.salary_type}</p></div></div>
          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{j.description}</p>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3"><span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{j.location}</span><span className="flex items-center gap-1"><Globe className="w-3 h-3"/>{j.country}</span>{j.experience_years>0&&<span className="flex items-center gap-1"><Briefcase className="w-3 h-3"/>{j.experience_years}+ yrs</span>}</div>
          {j.benefits?.length>0&&<div className="flex flex-wrap gap-1 mb-3">{j.benefits.map(b=><span key={b} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[10px]">{b}</span>)}</div>}
          {j.application_status ? <StatusBadge status={j.application_status}/> : <Button onClick={()=>apply(j.id)} disabled={applying===j.id} className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90 rounded-sm uppercase tracking-wider font-bold text-[10px] h-9 border-b-2 border-[#C5A059] px-6" data-testid={`apply-perm-${j.id}`}>{applying===j.id?<div className="gold-spinner"/>:'Apply'}</Button>}
        </div>))}
        {jobs.length===0&&<div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No permanent jobs available.</div>}
      </div>
    </div>
  );
}

// ===== FREELANCE =====
function FreelanceView() {
  const [tab, setTab] = useState('browse');
  const [services, setServices] = useState([]); const [myServices, setMyServices] = useState([]); const [bookings, setBookings] = useState(null);
  const [categories, setCategories] = useState([]); const [catFilter, setCatFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title:'', category:'', description:'', hourly_rate:'', pricing_type:'hourly', location:'', remote_available:false, experience_years:0 });

  useEffect(() => {
    api.get('/freelancer-categories').then(r=>setCategories(r.data.categories)).catch(console.error);
    api.get('/freelancer/my-services').then(r=>setMyServices(r.data)).catch(console.error);
    api.get('/freelancer/bookings').then(r=>setBookings(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const p = catFilter!=='all'?{category:catFilter}:{};
    api.get('/freelancer/browse',{params:p}).then(r=>setServices(r.data)).catch(console.error);
  }, [catFilter]);

  const createService = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      await api.post('/freelancer/services', {...form, hourly_rate: form.pricing_type==='hourly'?parseFloat(form.hourly_rate):null, fixed_price: form.pricing_type==='fixed'?parseFloat(form.hourly_rate):null, experience_years: parseInt(form.experience_years)||0});
      toast.success('Service listed!'); setShowCreate(false); setForm({title:'',category:'',description:'',hourly_rate:'',pricing_type:'hourly',location:'',remote_available:false,experience_years:0});
      api.get('/freelancer/my-services').then(r=>setMyServices(r.data));
    } catch(e) { toast.error('Failed'); } finally { setCreating(false); }
  };

  const bookService = async (service) => {
    try {
      await api.post('/freelancer/bookings', { service_id: service.id, freelancer_id: service.freelancer_id, date: new Date().toISOString().slice(0,10) });
      toast.success('Booking request sent!'); api.get('/freelancer/bookings').then(r=>setBookings(r.data));
    } catch(e) { toast.error(e.response?.data?.detail||'Failed'); }
  };

  const topCategories = ['all','Nanny','House Cleaner','Personal Trainer','Piano Instructor','Academic Tutor','Photographer','Web Developer','Handyman','Pet Sitter','Dog Walker','Plumber','Mobile Hair Stylist'];

  return (
    <div className="space-y-5 animate-fade-in" data-testid="freelance-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Freelance Marketplace</h1>
        <Button onClick={()=>setShowCreate(!showCreate)} className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="list-service-btn"><Plus className="w-3.5 h-3.5 mr-1"/>List Service</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 rounded-sm"><TabsTrigger value="browse" className="rounded-sm text-xs" data-testid="freelance-browse-tab">Browse Services</TabsTrigger><TabsTrigger value="my-services" className="rounded-sm text-xs" data-testid="freelance-my-tab">My Services</TabsTrigger><TabsTrigger value="bookings" className="rounded-sm text-xs" data-testid="freelance-bookings-tab">Bookings</TabsTrigger></TabsList>

        <TabsContent value="browse" className="mt-4">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topCategories.map(c=>(<button key={c} onClick={()=>setCatFilter(c)} className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all ${catFilter===c?'bg-[#C5A059] text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} data-testid={`cat-${c}`}>{c==='all'?'All':c}</button>))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {services.map(s=>(<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4 hover:border-[#C5A059]/30 transition-colors" data-testid={`service-${s.id}`}>
              <div className="flex items-start justify-between mb-2"><div><h3 className="font-semibold text-sm text-[#0F172A]">{s.title}</h3><p className="text-[10px] text-slate-400">{s.category} &middot; {s.freelancer_name}</p></div>
              <div className="text-right"><p className="text-lg font-bold text-[#C5A059] font-['Oswald']">£{s.hourly_rate||s.fixed_price}</p><p className="text-[9px] text-slate-400">{s.pricing_type==='hourly'?'/hr':s.pricing_type==='fixed'?'fixed':'nego.'}</p></div></div>
              <p className="text-xs text-slate-500 mb-2 line-clamp-2">{s.description}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3"><span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{s.location}</span>{s.remote_available&&<span className="flex items-center gap-1"><Globe className="w-3 h-3"/>Remote</span>}<span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#C5A059]"/>{s.rating||0}</span><span>{s.experience_years}yr exp</span></div>
              <Button onClick={()=>bookService(s)} className="w-full bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-[10px] h-8 border-b-2 border-[#C5A059]" data-testid={`book-${s.id}`}>Book Now</Button>
            </div>))}
            {services.length===0&&<div className="col-span-2 bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No services found.</div>}
          </div>
        </TabsContent>

        <TabsContent value="my-services" className="mt-4">
          {showCreate&&(<div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 mb-4 animate-slide-up">
            <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-3">List New Service</h2>
            <form onSubmit={createService} className="grid md:grid-cols-2 gap-3">
              <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Title</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="service-title-input" required/></div>
              <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Category</Label><Select value={form.category} onValueChange={v=>setForm({...form,category:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm" data-testid="service-category-select"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent className="max-h-60">{categories.slice(0,50).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="md:col-span-2"><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Description</Label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full h-16 border rounded-sm p-2 text-sm" required/></div>
              <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Rate (£)</Label><Input type="number" value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="service-rate-input" required/></div>
              <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
              <div className="flex items-end gap-3"><Switch checked={form.remote_available} onCheckedChange={v=>setForm({...form,remote_available:v})}/><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Remote Available</Label></div>
              <div className="md:col-span-2"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8" data-testid="submit-service-btn">{creating?<div className="gold-spinner"/>:'List Service'}</Button></div>
            </form>
          </div>)}
          <div className="space-y-2">{myServices.map(s=>(<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><p className="font-semibold text-sm text-[#0F172A]">{s.title}</p><p className="text-[10px] text-slate-400">{s.category} &middot; £{s.hourly_rate||s.fixed_price} &middot; {s.bookings_count} bookings</p></div><StatusBadge status={s.status}/></div>))}{myServices.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No services listed yet. Click "List Service" to get started.</div>}</div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <div className="space-y-4">
            <div><h3 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-2">Bookings as Freelancer</h3>
              {bookings?.as_freelancer?.length>0 ? bookings.as_freelancer.map(b=>(<div key={b.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between mb-2"><div><p className="font-semibold text-sm text-[#0F172A]">{b.service_title}</p><p className="text-[10px] text-slate-400">Client: {b.client_name} &middot; {b.date}</p></div><StatusBadge status={b.status}/></div>)) : <p className="text-sm text-slate-500">No bookings received.</p>}
            </div>
            <div><h3 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-2">My Bookings</h3>
              {bookings?.as_client?.length>0 ? bookings.as_client.map(b=>(<div key={b.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between mb-2"><div><p className="font-semibold text-sm text-[#0F172A]">{b.service_title}</p><p className="text-[10px] text-slate-400">Freelancer: {b.freelancer_name} &middot; {b.date}</p></div><StatusBadge status={b.status}/></div>)) : <p className="text-sm text-slate-500">No bookings made.</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== STUDENT PLACEMENTS =====
function StudentView() {
  const [placements, setPlacements] = useState([]); const [myApps, setMyApps] = useState([]); const [applying, setApplying] = useState(null); const [tab, setTab] = useState('browse');
  useEffect(() => { api.get('/placements').then(r=>setPlacements(r.data)).catch(console.error); api.get('/student/applications').then(r=>setMyApps(r.data)).catch(console.error); }, []);
  const apply = async (id) => { setApplying(id); try { await api.post(`/placements/${id}/apply`); toast.success('Applied!'); const r = await api.get('/placements'); setPlacements(r.data); const a = await api.get('/student/applications'); setMyApps(a.data); } catch(e) { toast.error(e.response?.data?.detail||'Failed'); } finally { setApplying(null); } };
  return (
    <div className="space-y-5 animate-fade-in" data-testid="student-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Student Placements</h1>
      <Tabs value={tab} onValueChange={setTab}><TabsList className="bg-slate-100 rounded-sm"><TabsTrigger value="browse" className="rounded-sm text-xs">Browse Placements</TabsTrigger><TabsTrigger value="my-apps" className="rounded-sm text-xs">My Applications ({myApps.length})</TabsTrigger></TabsList>
        <TabsContent value="browse" className="mt-4">
          <div className="space-y-3">{placements.map(p=>(<div key={p.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4 hover:border-[#C5A059]/30 transition-colors" data-testid={`placement-${p.id}`}>
            <div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-[#0F172A]">{p.title}</h3><span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">{p.placement_type}</span>{p.scholarship_available&&<span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">Scholarship</span>}{p.visa_support&&<span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">Visa Support</span>}</div><p className="text-xs text-slate-400 mt-0.5">{p.university_name} &middot; {p.program}</p></div>
            {p.tuition_fee>0&&<div className="text-right"><p className="text-lg font-bold text-[#C5A059] font-['Oswald']">£{p.tuition_fee?.toLocaleString()}</p><p className="text-[10px] text-slate-400">{p.duration_months}mo</p></div>}</div>
            <p className="text-xs text-slate-500 mb-2 line-clamp-2">{p.description}</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3"><span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{p.location}</span><span className="flex items-center gap-1"><Globe className="w-3 h-3"/>{p.country}</span>{p.intake&&<span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>Intake: {p.intake}</span>}</div>
            {p.application_status ? <StatusBadge status={p.application_status}/> : <Button onClick={()=>apply(p.id)} disabled={applying===p.id} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-[10px] h-9 border-b-2 border-[#C5A059] px-6" data-testid={`apply-placement-${p.id}`}>{applying===p.id?<div className="gold-spinner"/>:'Apply'}</Button>}
          </div>))}{placements.length===0&&<div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No placements available.</div>}</div>
        </TabsContent>
        <TabsContent value="my-apps" className="mt-4">
          <div className="space-y-2">{myApps.map(a=>(<div key={a.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><p className="font-semibold text-sm text-[#0F172A]">{a.title}</p><p className="text-[10px] text-slate-400">{a.university_name} &middot; {a.program}</p></div><StatusBadge status={a.application_status}/></div>))}{myApps.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No applications yet.</div>}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== MY SHIFTS / APPLICATIONS =====
function MyShifts() {
  const [shifts, setShifts] = useState([]); const [permApps, setPermApps] = useState([]);
  useEffect(() => { api.get('/worker/my-shifts').then(r=>setShifts(r.data)).catch(console.error); api.get('/worker/permanent-applications').then(r=>setPermApps(r.data)).catch(console.error); }, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="my-shifts-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">My Applications</h1>
      <h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A]">Temp Shift Applications</h2>
      <div className="space-y-2">{shifts.map(s=>(<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><p className="font-semibold text-sm text-[#0F172A]">{s.title}</p><p className="text-[10px] text-slate-400">{s.date} &middot; {s.start_time}-{s.end_time} &middot; £{s.hourly_rate}/hr</p></div><StatusBadge status={s.application_status||s.status}/></div>))}{shifts.length===0&&<p className="text-sm text-slate-500">No temp shift applications.</p>}</div>
      <h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] mt-6">Permanent Job Applications</h2>
      <div className="space-y-2">{permApps.map(j=>(<div key={j.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><p className="font-semibold text-sm text-[#0F172A]">{j.title}</p><p className="text-[10px] text-slate-400">{j.location} &middot; £{(j.salary_min/1000).toFixed(0)}k-{(j.salary_max/1000).toFixed(0)}k</p></div><StatusBadge status={j.application_status}/></div>))}{permApps.length===0&&<p className="text-sm text-slate-500">No permanent job applications.</p>}</div>
    </div>
  );
}

// ===== DOCUMENTS =====
function DocumentsView() {
  const [docs, setDocs] = useState([]); const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(''); const [docName, setDocName] = useState(''); const [expiry, setExpiry] = useState(''); const [file, setFile] = useState(null);
  useEffect(() => { api.get('/worker/documents').then(r=>setDocs(r.data)).catch(console.error); }, []);
  const handleUpload = async (e) => {
    e.preventDefault(); if(!file||!docType||!docName){toast.error('Fill all fields');return;} setUploading(true);
    try { const fd=new FormData(); fd.append('file',file); fd.append('doc_type',docType); fd.append('doc_name',docName); if(expiry)fd.append('expiry_date',expiry); await api.post('/worker/documents',fd,{headers:{'Content-Type':'multipart/form-data'}}); toast.success('Uploaded!'); setFile(null);setDocType('');setDocName('');setExpiry(''); api.get('/worker/documents').then(r=>setDocs(r.data)); }
    catch(e){toast.error('Failed');} finally{setUploading(false);}
  };
  const docTypes = ['Passport','BRP/Visa','DBS Certificate','NMC Pin','Driving Licence','SIA Licence','CSCS Card','CV','Training Certificate','Proof of Address','Insurance','Food Hygiene','Other'];
  return (
    <div className="space-y-5 animate-fade-in" data-testid="documents-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Compliance Documents</h1>
      <div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5">
        <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-3">Upload Document</h2>
        <form onSubmit={handleUpload} className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Type</Label><Select value={docType} onValueChange={setDocType}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm" data-testid="doc-type-select"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{docTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Name</Label><Input value={docName} onChange={e=>setDocName(e.target.value)} className="mt-1 h-10 rounded-sm text-sm" data-testid="doc-name-input"/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Expiry</Label><Input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} className="mt-1 h-10 rounded-sm text-sm" data-testid="doc-expiry-input"/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">File</Label><Input type="file" onChange={e=>setFile(e.target.files[0])} className="mt-1 h-10 rounded-sm text-sm" data-testid="doc-file-input" accept="image/*,.pdf"/></div>
          <div className="md:col-span-2"><Button type="submit" disabled={uploading} className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 rounded-sm uppercase tracking-wider font-bold text-xs h-10 px-6" data-testid="doc-upload-btn">{uploading?<div className="gold-spinner"/>:<><FileUp className="w-4 h-4 mr-1.5"/>Upload & Verify</>}</Button></div>
        </form>
      </div>
      <div className="space-y-2">{docs.map(d=>(<div key={d.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center gap-3"><div className={`w-7 h-7 rounded-sm flex items-center justify-center ${d.status==='approved'?'bg-emerald-100':d.status==='flagged'?'bg-orange-100':'bg-amber-100'}`}>{d.status==='approved'?<CheckCircle className="w-3.5 h-3.5 text-emerald-600"/>:d.status==='flagged'?<AlertCircle className="w-3.5 h-3.5 text-orange-600"/>:<Clock className="w-3.5 h-3.5 text-amber-600"/>}</div><div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-sm text-[#0F172A]">{d.doc_name}</p><StatusBadge status={d.status}/></div><p className="text-[10px] text-slate-400">{d.doc_type} &middot; {d.file_name}{d.ai_confidence!=null&&<> &middot; AI: <span className="font-semibold text-[#C5A059]">{d.ai_confidence}%</span></>}</p></div></div>))}{docs.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No documents.</div>}</div>
    </div>
  );
}

// ===== EARNINGS =====
function EarningsView() {
  const [earnings, setEarnings] = useState(null);
  useEffect(() => { api.get('/worker/earnings').then(r=>setEarnings(r.data)).catch(console.error); }, []);
  if(!earnings) return <div className="flex justify-center py-8"><div className="gold-spinner w-8 h-8"/></div>;
  return (
    <div className="space-y-5 animate-fade-in" data-testid="earnings-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Earnings</h1>
      <div className="grid grid-cols-2 gap-4"><div className="bg-white border-t-4 border-emerald-500 shadow-sm rounded-sm p-4"><p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Earned</p><p className="text-2xl font-bold text-emerald-700 font-['Oswald'] mt-1">£{earnings.total_earned.toFixed(2)}</p></div><div className="bg-white border-t-4 border-amber-500 shadow-sm rounded-sm p-4"><p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Pending</p><p className="text-2xl font-bold text-amber-700 font-['Oswald'] mt-1">£{earnings.pending_amount.toFixed(2)}</p></div></div>
      <h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A]">Timesheets</h2>
      <div className="space-y-2">{earnings.timesheets.map(ts=>(<div key={ts.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><p className="font-semibold text-sm text-[#0F172A]">{ts.shift_title}</p><p className="text-[10px] text-slate-400">{ts.date} &middot; {ts.hours_worked}h &middot; £{ts.hourly_rate}/hr</p></div><div className="text-right"><p className="font-bold text-[#0F172A] font-['Oswald']">£{ts.total_pay.toFixed(2)}</p><StatusBadge status={ts.status}/></div></div>))}{earnings.timesheets.length===0&&<p className="text-sm text-slate-500">No timesheets.</p>}</div>
    </div>
  );
}

// ===== VISA & INTERNATIONAL =====
function VisaView() {
  const [visas, setVisas] = useState([]); const [countries, setCountries] = useState([]); const [showCreate, setShowCreate] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({visa_type:'work', destination_country:'GB', current_country:'', purpose:'', notes:''});
  useEffect(() => { api.get('/visa-applications').then(r=>setVisas(r.data)).catch(console.error); api.get('/countries').then(r=>setCountries(r.data.countries)).catch(console.error); }, []);
  const submit = async (e) => {
    e.preventDefault(); setCreating(true);
    try { await api.post('/visa-applications', form); toast.success('Visa application submitted!'); setShowCreate(false); api.get('/visa-applications').then(r=>setVisas(r.data)); } catch(e){toast.error('Failed');} finally{setCreating(false);}
  };
  return (
    <div className="space-y-5 animate-fade-in" data-testid="visa-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Visa & International</h1><Button onClick={()=>setShowCreate(!showCreate)} className="bg-[#C5A059] text-white rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="new-visa-btn"><Plus className="w-3.5 h-3.5 mr-1"/>New Application</Button></div>
      {showCreate&&(<div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 animate-slide-up">
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Visa Type</Label><Select value={form.visa_type} onValueChange={v=>setForm({...form,visa_type:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="work">Work Visa</SelectItem><SelectItem value="student">Student Visa</SelectItem><SelectItem value="skilled_worker">Skilled Worker Visa</SelectItem><SelectItem value="sponsor">Sponsorship</SelectItem></SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Destination</Label><Select value={form.destination_country} onValueChange={v=>setForm({...form,destination_country:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent>{countries.map(c=><SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Current Country</Label><Select value={form.current_country} onValueChange={v=>setForm({...form,current_country:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{countries.map(c=><SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Purpose</Label><Input value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div className="md:col-span-2"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8">{creating?<div className="gold-spinner"/>:'Submit Application'}</Button></div>
        </form>
      </div>)}
      <div className="space-y-2">{visas.map(v=>(<div key={v.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><div className="flex items-center gap-2"><Plane className="w-4 h-4 text-[#C5A059]"/><p className="font-semibold text-sm text-[#0F172A]">{v.visa_type.replace('_',' ').toUpperCase()}</p><StatusBadge status={v.status}/></div><p className="text-[10px] text-slate-400 mt-0.5">{v.current_country} → {v.destination_country} &middot; {v.purpose}</p></div></div>))}{visas.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No visa applications.</div>}</div>
    </div>
  );
}

// ===== PROFILE =====
function ProfileView() {
  const { user } = useAuth(); const [profile, setProfile] = useState(null); const [editing, setEditing] = useState(false); const [form, setForm] = useState({});
  useEffect(() => { api.get('/worker/profile').then(r=>{setProfile(r.data);setForm(r.data);}).catch(console.error); }, []);
  const save = async () => { try { await api.put('/worker/profile', {skills:form.skills,industries:form.industries,bio:form.bio,location:form.location,hourly_rate:parseFloat(form.hourly_rate)||0,is_freelancer:form.is_freelancer,is_student:form.is_student}); const r = await api.get('/worker/profile'); setProfile(r.data); setEditing(false); toast.success('Saved'); } catch(e){toast.error('Failed');} };
  if(!profile) return <div className="flex justify-center py-8"><div className="gold-spinner w-8 h-8"/></div>;
  return (
    <div className="space-y-5 animate-fade-in" data-testid="profile-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">My Profile</h1><Button onClick={()=>editing?save():setEditing(true)} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-[10px] border-b-2 border-[#C5A059]" data-testid="edit-profile-btn">{editing?'Save':'Edit'}</Button></div>
      <div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 space-y-4">
        <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C5A059] text-xl font-bold font-['Oswald']">{user?.full_name?.charAt(0)}</div><div><h2 className="text-lg font-bold text-[#0F172A]">{user?.full_name}</h2><p className="text-xs text-slate-500">{user?.email}</p></div></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Location</Label>{editing?<Input value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})} className="mt-1 h-10 rounded-sm"/>:<p className="mt-1 text-sm text-[#0F172A]">{profile.location||'Not set'}</p>}</div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Hourly Rate</Label>{editing?<Input type="number" value={form.hourly_rate||''} onChange={e=>setForm({...form,hourly_rate:e.target.value})} className="mt-1 h-10 rounded-sm"/>:<p className="mt-1 text-sm text-[#0F172A]">£{profile.hourly_rate}/hr</p>}</div>
          <div className="md:col-span-2"><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Bio</Label>{editing?<textarea value={form.bio||''} onChange={e=>setForm({...form,bio:e.target.value})} className="mt-1 w-full h-16 border rounded-sm p-2 text-sm"/>:<p className="mt-1 text-sm text-slate-600">{profile.bio||'No bio'}</p>}</div>
          {editing&&<><div className="flex items-center gap-2"><Switch checked={form.is_freelancer} onCheckedChange={v=>setForm({...form,is_freelancer:v})}/><Label className="text-xs text-slate-500">I'm a Freelancer</Label></div><div className="flex items-center gap-2"><Switch checked={form.is_student} onCheckedChange={v=>setForm({...form,is_student:v})}/><Label className="text-xs text-slate-500">I'm a Student</Label></div></>}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN EXPORT =====
export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const render = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView/>;
      case 'shifts': return <BrowseShifts/>;
      case 'permanent-jobs': return <PermanentJobs/>;
      case 'freelance': return <FreelanceView/>;
      case 'student': return <StudentView/>;
      case 'my-shifts': return <MyShifts/>;
      case 'documents': return <DocumentsView/>;
      case 'earnings': return <EarningsView/>;
      case 'visa': return <VisaView/>;
      case 'referrals': return <ReferralView role="worker"/>;
      case 'academy': return <AcademyView role="worker"/>;
      case 'profile': return <ProfileView/>;
      default: return <DashboardView/>;
    }
  };
  return (<div className="min-h-screen bg-slate-50" data-testid="worker-dashboard"><Sidebar activeTab={activeTab} setActiveTab={setActiveTab}/><main className="md:ml-64 p-5 md:p-7 pt-14 md:pt-7">{render()}</main></div>);
}
