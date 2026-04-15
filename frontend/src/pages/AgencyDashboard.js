import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { ReferralView } from '../components/ReferralView';
import { AcademyView } from '../components/AcademyView';
import api from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  CalendarDays, MapPin, Clock, Banknote, Users, Plus, CheckCircle, XCircle,
  Building, Briefcase, TrendingUp, AlertTriangle, FileText, Globe, Eye,
  UserPlus, Trash2, Search, Shield
} from 'lucide-react';

const INDUSTRIES = [
  "Healthcare", "Social Care", "Hospitality", "Cleaning", "Retail",
  "Transport & Logistics", "Warehousing", "Security", "Education Support",
  "Office & Admin", "Farming & Seasonal", "Construction Support",
  "Technology", "Finance & Banking", "Legal", "Manufacturing"
];

// ============ SETUP VIEW ============
function AgencySetupView({ onComplete }) {
  const [form, setForm] = useState({
    name: '', industry: '', description: '', address: '', city: '',
    postcode: '', phone: '', email: '', website: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/agency/register', form);
      toast.success('Agency registered! Pending admin approval.');
      onComplete();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="agency-setup">
      <div className="bg-[#0F172A] rounded-sm p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent" />
        <div className="relative">
          <h1 className="font-['Oswald'] text-2xl font-bold text-white">Set Up Your Agency</h1>
          <p className="text-sm text-slate-400 mt-1">Register your staffing agency to start posting shifts and managing workers</p>
        </div>
      </div>
      <form onSubmit={submit} className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Agency Name *</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="mt-1 h-10 rounded-sm" data-testid="agency-name-input" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry *</Label>
            <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}>
              <SelectTrigger className="mt-1 h-10 rounded-sm" data-testid="agency-industry-select"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select></div>
        </div>
        <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Description</Label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 w-full h-20 border rounded-sm p-2 text-sm" /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Postcode</Label><Input value={form.postcode} onChange={e => setForm({...form, postcode: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Website</Label><Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
        </div>
        <Button type="submit" disabled={submitting || !form.name || !form.industry} className="w-full bg-[#0F172A] text-white border-b-2 border-[#C5A059] rounded-sm uppercase tracking-wider font-bold h-11" data-testid="register-agency-btn">
          {submitting ? <div className="gold-spinner" /> : 'Register Agency'}
        </Button>
      </form>
    </div>
  );
}

// ============ DASHBOARD VIEW ============
function DashboardView({ agency, stats }) {
  if (!agency) return null;
  const isPending = agency.status === 'pending';

  return (
    <div className="space-y-5" data-testid="agency-dashboard-view">
      {isPending && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm" data-testid="agency-pending-banner">
          <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />
            <div><p className="font-semibold text-amber-800 text-sm">Agency Pending Approval</p>
              <p className="text-xs text-amber-600">Your agency is under review. You'll be able to post shifts once approved by the admin.</p></div>
          </div>
        </div>
      )}
      <div className="bg-[#0F172A] rounded-sm p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] font-bold text-xl font-['Oswald']">
            {agency.name?.charAt(0)}
          </div>
          <div>
            <h1 className="font-['Oswald'] text-xl font-bold text-white">{agency.name}</h1>
            <p className="text-xs text-slate-400">{agency.industry} &middot; {agency.city || 'No location set'}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${agency.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : agency.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{agency.status}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open Shifts', value: stats.open_shifts || 0, color: 'border-blue-500', icon: Clock },
          { label: 'Worker Pool', value: stats.worker_pool || 0, color: 'border-emerald-500', icon: Users },
          { label: 'Total Revenue', value: `£${(stats.total_revenue || 0).toFixed(2)}`, color: 'border-[#C5A059]', icon: TrendingUp },
          { label: 'Net Revenue', value: `£${(stats.net_revenue || 0).toFixed(2)}`, color: 'border-purple-500', icon: Banknote },
          { label: 'Total Shifts', value: stats.total_shifts || 0, color: 'border-slate-400', icon: CalendarDays },
          { label: 'Perm Jobs', value: stats.total_jobs || 0, color: 'border-amber-500', icon: Briefcase },
          { label: 'Applications', value: stats.total_applications || 0, color: 'border-indigo-500', icon: FileText },
          { label: 'Commission', value: `£${(stats.platform_commission || 0).toFixed(2)}`, color: 'border-red-400', icon: Building },
        ].map(s => (
          <div key={s.label} className={`bg-white border-t-4 ${s.color} shadow-sm rounded-sm p-4`} data-testid={`agency-stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-1"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">{s.label}</p><s.icon className="w-3.5 h-3.5 text-slate-400" /></div>
            <p className="text-xl font-bold text-[#0F172A] font-['Oswald']">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SHIFTS VIEW ============
function ShiftsView({ agency }) {
  const [shifts, setShifts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', industry: '', role: '', description: '', location: '', date: '', start_time: '', end_time: '', hourly_rate: '', positions: '1', urgent: false, country: 'GB', currency: 'GBP' });
  const load = useCallback(() => { api.get('/agency/shifts').then(r => setShifts(r.data)).catch(console.error); }, []);
  useEffect(() => { load(); }, [load]);
  const create = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      await api.post('/agency/shifts', { ...form, hourly_rate: parseFloat(form.hourly_rate), positions: parseInt(form.positions) });
      toast.success('Shift created!'); setShowCreate(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setCreating(false); }
  };
  return (
    <div className="space-y-4" data-testid="agency-shifts-view">
      <div className="flex items-center justify-between">
        <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Temp Shifts</h1>
        {agency?.status === 'active' && <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#C5A059] text-white rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="create-shift-btn"><Plus className="w-3.5 h-3.5 mr-1" />Post Shift</Button>}
      </div>
      {showCreate && (
        <form onSubmit={create} className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-4 grid md:grid-cols-3 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" data-testid="shift-title-input" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry</Label>
            <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}><SelectTrigger className="mt-1 h-9 rounded-sm text-sm"><SelectValue /></SelectTrigger><SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Role</Label><Input value={form.role} onChange={e => setForm({...form, role: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Date</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Hourly Rate (£)</Label><Input type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">End Time</Label><Input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Positions</Label><Input type="number" value={form.positions} onChange={e => setForm({...form, positions: e.target.value})} className="mt-1 h-9 rounded-sm text-sm" /></div>
          <div className="md:col-span-3"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8" data-testid="submit-shift-btn">{creating ? <div className="gold-spinner" /> : 'Create Shift'}</Button></div>
        </form>
      )}
      <div className="space-y-2">
        {shifts.map(s => (
          <div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between hover:border-[#C5A059]/30 transition-colors" data-testid={`shift-${s.id}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-10 rounded-full ${s.status === 'open' ? 'bg-emerald-500' : s.status === 'filled' ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <div>
                <p className="font-semibold text-sm text-[#0F172A]">{s.title} {s.urgent && <span className="text-red-500 text-[10px]">URGENT</span>}</p>
                <p className="text-[10px] text-slate-400"><MapPin className="w-3 h-3 inline mr-0.5" />{s.location} &middot; {s.date} &middot; {s.start_time}-{s.end_time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#C5A059] font-['Oswald']">£{s.hourly_rate}/hr</p>
              <p className="text-[10px] text-slate-400">{s.applicants_count} applicants &middot; {s.filled_positions}/{s.positions} filled</p>
            </div>
          </div>
        ))}
        {shifts.length === 0 && <div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No shifts yet. Post your first shift!</div>}
      </div>
    </div>
  );
}

// ============ WORKER POOL VIEW ============
function WorkerPoolView() {
  const [workers, setWorkers] = useState([]);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const load = useCallback(() => { api.get('/agency/workers').then(r => setWorkers(r.data)).catch(console.error); }, []);
  useEffect(() => { load(); }, [load]);
  const invite = async (e) => {
    e.preventDefault(); setInviting(true);
    try { await api.post('/agency/invite-worker', { worker_email: email }); toast.success('Worker added!'); setEmail(''); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setInviting(false); }
  };
  const remove = async (id) => {
    try { await api.post(`/agency/remove-worker/${id}`); toast.success('Worker removed'); load(); }
    catch (e) { toast.error('Failed'); }
  };
  return (
    <div className="space-y-4" data-testid="agency-workers-view">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Worker Pool</h1>
      <form onSubmit={invite} className="flex gap-2">
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Worker email address" className="h-10 rounded-sm flex-1" data-testid="invite-worker-input" />
        <Button type="submit" disabled={inviting || !email} className="bg-[#C5A059] text-white rounded-sm uppercase tracking-wider font-bold text-[10px] h-10 px-4" data-testid="invite-worker-btn">
          <UserPlus className="w-3.5 h-3.5 mr-1" />{inviting ? 'Adding...' : 'Add Worker'}
        </Button>
      </form>
      <div className="space-y-2">
        {workers.map(w => (
          <div key={w.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between" data-testid={`pool-worker-${w.id}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C5A059] text-xs font-bold">{w.full_name?.charAt(0)}</div>
              <div>
                <p className="font-semibold text-sm text-[#0F172A]">{w.full_name}</p>
                <p className="text-[10px] text-slate-400">{w.email} &middot; {w.profile?.compliance_status} &middot; Rating: {w.profile?.rating || 0}</p>
              </div>
            </div>
            <Button onClick={() => remove(w.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-600 rounded-sm" data-testid={`remove-worker-${w.id}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {workers.length === 0 && <div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No workers in your pool yet. Add workers by email.</div>}
      </div>
    </div>
  );
}

// ============ SHARED WORKERS VIEW ============
function SharedWorkersView() {
  const [workers, setWorkers] = useState([]);
  const [industry, setIndustry] = useState('');
  useEffect(() => { api.get('/agency/shared-workers', { params: industry ? { industry } : {} }).then(r => setWorkers(r.data)).catch(console.error); }, [industry]);
  return (
    <div className="space-y-4" data-testid="agency-shared-workers">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Find Workers</h1>
      <p className="text-sm text-slate-500">Browse verified workers across the platform</p>
      <Select value={industry} onValueChange={setIndustry}>
        <SelectTrigger className="w-60 h-10 rounded-sm" data-testid="shared-workers-filter"><SelectValue placeholder="Filter by industry" /></SelectTrigger>
        <SelectContent><SelectItem value="">All Industries</SelectItem>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
      </Select>
      <div className="grid md:grid-cols-2 gap-3">
        {workers.map(w => (
          <div key={w.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4" data-testid={`shared-worker-${w.id}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C5A059] text-sm font-bold">{w.full_name?.charAt(0)}</div>
              <div><p className="font-semibold text-sm text-[#0F172A]">{w.full_name}</p><p className="text-[10px] text-slate-400">{w.country} &middot; Rating: {w.profile?.rating || 0} &middot; {w.profile?.shifts_completed || 0} shifts</p></div>
            </div>
            <div className="flex flex-wrap gap-1">{(w.profile?.skills || []).slice(0, 4).map(s => <span key={s} className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-600 rounded-sm">{s}</span>)}</div>
          </div>
        ))}
        {workers.length === 0 && <div className="col-span-2 bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No workers found.</div>}
      </div>
    </div>
  );
}

// ============ APPLICANTS VIEW ============
function ApplicantsView() {
  const [apps, setApps] = useState([]);
  const load = useCallback(() => { api.get('/agency/applicants').then(r => setApps(r.data)).catch(console.error); }, []);
  useEffect(() => { load(); }, [load]);
  const handle = async (id, action) => {
    try { await api.post(`/agency/applications/${id}/${action}`); toast.success(`Application ${action}ed`); load(); }
    catch (e) { toast.error('Failed'); }
  };
  return (
    <div className="space-y-4" data-testid="agency-applicants-view">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Applicants</h1>
      <div className="space-y-2">
        {apps.map(a => (
          <div key={a.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between" data-testid={`applicant-${a.id}`}>
            <div>
              <p className="font-semibold text-sm text-[#0F172A]">{a.worker?.full_name || 'Worker'}</p>
              <p className="text-[10px] text-slate-400">{a.shift?.title || 'Shift'} &middot; {a.shift?.date} &middot; £{a.shift?.hourly_rate}/hr</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${a.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : a.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{a.status}</span>
              {a.status === 'applied' && <>
                <Button onClick={() => handle(a.id, 'accept')} size="sm" className="bg-emerald-600 text-white rounded-sm h-7 text-[10px]" data-testid={`accept-${a.id}`}><CheckCircle className="w-3 h-3 mr-1" />Accept</Button>
                <Button onClick={() => handle(a.id, 'reject')} size="sm" variant="outline" className="rounded-sm h-7 text-[10px] text-red-500 border-red-200" data-testid={`reject-${a.id}`}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
              </>}
            </div>
          </div>
        ))}
        {apps.length === 0 && <div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No applicants yet.</div>}
      </div>
    </div>
  );
}

// ============ TIMESHEETS VIEW ============
function TimesheetsView() {
  const [timesheets, setTimesheets] = useState([]);
  useEffect(() => { api.get('/agency/timesheets').then(r => setTimesheets(r.data)).catch(console.error); }, []);
  return (
    <div className="space-y-4" data-testid="agency-timesheets-view">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Timesheets</h1>
      {timesheets.map(t => (
        <div key={t.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between">
          <div><p className="font-semibold text-sm text-[#0F172A]">{t.worker_name} - {t.shift_title}</p><p className="text-[10px] text-slate-400">{t.date} &middot; {t.hours_worked}h &middot; £{t.hourly_rate}/hr</p></div>
          <div className="text-right"><p className="font-bold text-[#C5A059] font-['Oswald']">£{t.total_pay?.toFixed(2)}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : t.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{t.status}</span></div>
        </div>
      ))}
      {timesheets.length === 0 && <div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No timesheets yet.</div>}
    </div>
  );
}

// ============ SETTINGS VIEW ============
function SettingsView({ agency, onUpdate }) {
  const [form, setForm] = useState({ name: '', industry: '', description: '', address: '', city: '', postcode: '', phone: '', email: '', website: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (agency) setForm({ name: agency.name || '', industry: agency.industry || '', description: agency.description || '', address: agency.address || '', city: agency.city || '', postcode: agency.postcode || '', phone: agency.phone || '', email: agency.email || '', website: agency.website || '' }); }, [agency]);
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/agency/profile', form); toast.success('Settings saved!'); onUpdate(); }
    catch (e) { toast.error('Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4 max-w-2xl" data-testid="agency-settings-view">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Agency Settings</h1>
      {agency && <div className="bg-white border border-slate-100 shadow-sm rounded-sm p-2 mb-4">
        <p className="text-[10px] text-slate-400">Status: <span className={`font-bold ${agency.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>{agency.status?.toUpperCase()}</span> &middot; Commission Rate: <span className="font-bold text-[#0F172A]">{agency.commission_rate}%</span></p>
      </div>}
      <form onSubmit={save} className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Agency Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry</Label>
            <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}><SelectTrigger className="mt-1 h-10 rounded-sm"><SelectValue /></SelectTrigger><SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Description</Label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 w-full h-16 border rounded-sm p-2 text-sm" /></div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Website</Label><Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="mt-1 h-10 rounded-sm" /></div>
        </div>
        <Button type="submit" disabled={saving} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8" data-testid="save-settings-btn">{saving ? <div className="gold-spinner" /> : 'Save Settings'}</Button>
      </form>
    </div>
  );
}

// ============ PERMANENT JOBS VIEW ============
function PermanentJobsView({ agency }) {
  const [jobs, setJobs] = useState([]);
  useEffect(() => { api.get('/agency/permanent-jobs').then(r => setJobs(r.data)).catch(console.error); }, []);
  return (
    <div className="space-y-4" data-testid="agency-jobs-view">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Permanent Jobs</h1>
      {jobs.map(j => (
        <div key={j.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between">
          <div><p className="font-semibold text-sm text-[#0F172A]">{j.title}</p><p className="text-[10px] text-slate-400">{j.industry} &middot; {j.location} &middot; {j.job_type}</p></div>
          <div className="text-right"><p className="font-bold text-[#C5A059] font-['Oswald']">£{j.salary_min?.toLocaleString()}-£{j.salary_max?.toLocaleString()}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${j.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{j.status}</span></div>
        </div>
      ))}
      {jobs.length === 0 && <div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No permanent jobs posted yet.</div>}
    </div>
  );
}

// ============ MAIN EXPORT ============
export default function AgencyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agency, setAgency] = useState(null);
  const [stats, setStats] = useState({});
  const [setupRequired, setSetupRequired] = useState(false);

  const loadAgency = useCallback(async () => {
    try {
      const r = await api.get('/agency/profile');
      if (r.data.setup_required) { setSetupRequired(true); return; }
      setAgency(r.data.agency);
      setSetupRequired(false);
      const d = await api.get('/agency/dashboard');
      setStats(d.data.stats || {});
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadAgency(); }, [loadAgency]);

  const render = () => {
    if (setupRequired) return <AgencySetupView onComplete={loadAgency} />;
    switch (activeTab) {
      case 'shifts': return <ShiftsView agency={agency} />;
      case 'permanent-jobs': return <PermanentJobsView agency={agency} />;
      case 'applicants': return <ApplicantsView />;
      case 'workers': return <WorkerPoolView />;
      case 'shared-workers': return <SharedWorkersView />;
      case 'timesheets': return <TimesheetsView />;
      case 'referrals': return <ReferralView role="agency" />;
      case 'academy': return <AcademyView role="agency" />;
      case 'settings': return <SettingsView agency={agency} onUpdate={loadAgency} />;
      default: return <DashboardView agency={agency} stats={stats} />;
    }
  };

  return (<div className="min-h-screen bg-slate-50 flex" data-testid="agency-dashboard"><Sidebar activeTab={activeTab} setActiveTab={setActiveTab} /><main className="flex-1 p-5 md:p-7 pt-14 md:pt-7">{render()}</main></div>);
}
