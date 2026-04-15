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
  CalendarDays, MapPin, Clock, Banknote, Users, Plus, CheckCircle, XCircle,
  Building, Briefcase, AlertTriangle, FileText, GraduationCap, Globe, Eye, Star
} from 'lucide-react';
import { ReferralView } from '../components/ReferralView';
import { AcademyView } from '../components/AcademyView';

function StatusBadge({ status }) {
  const styles = { open:'bg-emerald-100 text-emerald-800', filled:'bg-blue-100 text-blue-800', applied:'bg-blue-100 text-blue-800', accepted:'bg-emerald-100 text-emerald-800', rejected:'bg-red-100 text-red-800', pending:'bg-amber-100 text-amber-800', approved:'bg-emerald-100 text-emerald-800', shortlisted:'bg-purple-100 text-purple-800', cancelled:'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]||'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

// ===== DASHBOARD =====
function DashboardView() {
  const { user } = useAuth(); const [shifts, setShifts] = useState([]); const [permJobs, setPermJobs] = useState([]); const [orgs, setOrgs] = useState([]);
  useEffect(() => { Promise.all([api.get('/employer/shifts'), api.get('/employer/permanent-jobs'), api.get('/employer/organization')]).then(([s,j,o])=>{setShifts(s.data);setPermJobs(j.data);setOrgs(o.data);}).catch(console.error); }, []);
  const openShifts = shifts.filter(s=>s.status==='open').length;
  const totalApps = shifts.reduce((a,s)=>a+(s.applicants_count||0),0);
  const stats = [
    {label:'Temp Shifts',value:shifts.length,color:'border-[#C5A059]'},{label:'Open Shifts',value:openShifts,color:'border-emerald-500'},
    {label:'Permanent Jobs',value:permJobs.length,color:'border-blue-500'},{label:'Applicants',value:totalApps,color:'border-amber-500'},
  ];
  return (
    <div className="space-y-6 animate-fade-in" data-testid="employer-dashboard-view">
      <div><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Welcome, {user?.full_name}</h1><p className="text-sm text-slate-500 mt-1">Employer Portal</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map(s=>(<div key={s.label} className={`bg-white border-t-4 ${s.color} shadow-sm rounded-sm p-4`} data-testid={`emp-stat-${s.label.toLowerCase().replace(/\s/g,'-')}`}><p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{s.label}</p><p className="text-xl font-bold text-[#0F172A] mt-1 font-['Oswald']">{s.value}</p></div>))}</div>
      <div><h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] mb-3">Recent Shifts</h2>
        <div className="space-y-2">{shifts.slice(0,5).map(s=>(<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between hover:border-[#C5A059]/30 transition-colors"><div><p className="font-semibold text-sm text-[#0F172A]">{s.title}</p><p className="text-[10px] text-slate-400">{s.industry} &middot; {s.date} &middot; {s.applicants_count} applicants</p></div><StatusBadge status={s.status}/></div>))}</div>
      </div>
    </div>
  );
}

// ===== MANAGE TEMP SHIFTS =====
function ManageShifts() {
  const [shifts, setShifts] = useState([]); const [showCreate, setShowCreate] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({title:'',industry:'',role:'',description:'',location:'',date:'',start_time:'',end_time:'',hourly_rate:'',positions:1,urgent:false,country:'GB'});
  const load = useCallback(async()=>{try{const r=await api.get('/employer/shifts');setShifts(r.data);}catch(e){console.error(e);}}, []);
  useEffect(()=>{load();}, [load]);
  const create = async(e)=>{ e.preventDefault();setCreating(true); try{await api.post('/employer/shifts',{...form,hourly_rate:parseFloat(form.hourly_rate),positions:parseInt(form.positions)});toast.success('Shift created!');setShowCreate(false);setForm({title:'',industry:'',role:'',description:'',location:'',date:'',start_time:'',end_time:'',hourly_rate:'',positions:1,urgent:false,country:'GB'});load();}catch(e){toast.error('Failed');}finally{setCreating(false);}};
  const industries = ['Healthcare','Social Care','Hospitality','Cleaning','Retail','Transport & Logistics','Warehousing','Security','Education Support','Office & Admin','Farming & Seasonal','Construction Support'];
  return (
    <div className="space-y-5 animate-fade-in" data-testid="manage-shifts-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Temporary Shifts</h1><Button onClick={()=>setShowCreate(!showCreate)} className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="create-shift-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Post Shift</Button></div>
      {showCreate&&(<div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 animate-slide-up">
        <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-3">New Shift</h2>
        <form onSubmit={create} className="grid md:grid-cols-3 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Title</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="shift-title-input" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry</Label><Select value={form.industry} onValueChange={v=>setForm({...form,industry:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm" data-testid="shift-industry-select"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{industries.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Role</Label><Input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="shift-role-input" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="shift-location-input" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Date</Label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="shift-date-input" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Start</Label><Input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">End</Label><Input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Rate (£/hr)</Label><Input type="number" step="0.5" value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" data-testid="shift-rate-input" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Positions</Label><Input type="number" min="1" value={form.positions} onChange={e=>setForm({...form,positions:e.target.value})} className="mt-1 h-10 rounded-sm text-sm"/></div>
          <div className="flex items-end gap-2 pb-1"><Switch checked={form.urgent} onCheckedChange={v=>setForm({...form,urgent:v})} data-testid="shift-urgent-switch"/><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Urgent</Label></div>
          <div className="md:col-span-3 flex gap-2"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8" data-testid="submit-shift-btn">{creating?<div className="gold-spinner"/>:'Post Shift'}</Button><Button type="button" variant="outline" onClick={()=>setShowCreate(false)} className="rounded-sm text-xs h-10">Cancel</Button></div>
        </form>
      </div>)}
      <div className="space-y-2">{shifts.map(s=>(<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between hover:border-[#C5A059]/30 transition-colors" data-testid={`emp-shift-${s.id}`}><div><div className="flex items-center gap-2"><h3 className="font-semibold text-sm text-[#0F172A]">{s.title}</h3>{s.urgent&&<AlertTriangle className="w-3 h-3 text-red-500"/>}<StatusBadge status={s.status}/></div><p className="text-[10px] text-slate-400">{s.industry} &middot; {s.location} &middot; {s.date} &middot; £{s.hourly_rate}/hr &middot; {s.filled_positions}/{s.positions} filled</p></div><span className="text-xs font-semibold text-[#C5A059]">{s.applicants_count} apps</span></div>))}{shifts.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No shifts. Click "Post Shift".</div>}</div>
    </div>
  );
}

// ===== PERMANENT JOBS =====
function PermanentJobsView() {
  const [jobs, setJobs] = useState([]); const [showCreate, setShowCreate] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({title:'',industry:'',role:'',description:'',location:'',salary_min:'',salary_max:'',salary_type:'annual',job_type:'full-time',visa_sponsorship:false,remote_option:'on-site',country:'GB',experience_years:0});
  const load = useCallback(async()=>{try{const r=await api.get('/employer/permanent-jobs');setJobs(r.data);}catch(e){console.error(e);}}, []);
  useEffect(()=>{load();}, [load]);
  const create = async(e)=>{ e.preventDefault();setCreating(true); try{await api.post('/employer/permanent-jobs',{...form,salary_min:parseFloat(form.salary_min),salary_max:parseFloat(form.salary_max),experience_years:parseInt(form.experience_years)||0});toast.success('Job posted!');setShowCreate(false);load();}catch(e){toast.error('Failed');}finally{setCreating(false);}};
  const industries = ['Healthcare','Social Care','Hospitality','Cleaning','Retail','Transport & Logistics','Warehousing','Security','Technology','Finance & Banking','Office & Admin'];
  return (
    <div className="space-y-5 animate-fade-in" data-testid="employer-perm-jobs-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Permanent Jobs</h1><Button onClick={()=>setShowCreate(!showCreate)} className="bg-[#C5A059] text-white rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="create-perm-job-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Post Job</Button></div>
      {showCreate&&(<div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 animate-slide-up">
        <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-3">New Permanent Job</h2>
        <form onSubmit={create} className="grid md:grid-cols-3 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Title</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry</Label><Select value={form.industry} onValueChange={v=>setForm({...form,industry:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{industries.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Role</Label><Input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Min Salary (£)</Label><Input type="number" value={form.salary_min} onChange={e=>setForm({...form,salary_min:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Max Salary (£)</Label><Input type="number" value={form.salary_max} onChange={e=>setForm({...form,salary_max:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Job Type</Label><Select value={form.job_type} onValueChange={v=>setForm({...form,job_type:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="full-time">Full-time</SelectItem><SelectItem value="part-time">Part-time</SelectItem><SelectItem value="contract">Contract</SelectItem></SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Remote</Label><Select value={form.remote_option} onValueChange={v=>setForm({...form,remote_option:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="on-site">On-site</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="remote">Remote</SelectItem></SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Country</Label><Select value={form.country} onValueChange={v=>setForm({...form,country:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="GB">UK</SelectItem><SelectItem value="US">USA</SelectItem><SelectItem value="AE">UAE</SelectItem><SelectItem value="CA">Canada</SelectItem><SelectItem value="AU">Australia</SelectItem></SelectContent></Select></div>
          <div className="flex items-end gap-2 pb-1"><Switch checked={form.visa_sponsorship} onCheckedChange={v=>setForm({...form,visa_sponsorship:v})}/><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Visa Sponsorship</Label></div>
          <div className="md:col-span-2"><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Description</Label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full h-16 border rounded-sm p-2 text-sm" required/></div>
          <div className="md:col-span-3"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8">{creating?<div className="gold-spinner"/>:'Post Job'}</Button></div>
        </form>
      </div>)}
      <div className="space-y-2">{jobs.map(j=>(<div key={j.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-sm text-[#0F172A]">{j.title}</h3>{j.visa_sponsorship&&<span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase">Visa</span>}<StatusBadge status={j.status}/></div><p className="text-[10px] text-slate-400">{j.industry} &middot; {j.location} &middot; £{(j.salary_min/1000).toFixed(0)}k-{(j.salary_max/1000).toFixed(0)}k &middot; {j.job_type}</p></div><span className="text-xs font-semibold text-[#C5A059]">{j.applicants_count} apps</span></div>))}{jobs.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No permanent jobs posted.</div>}</div>
    </div>
  );
}

// ===== STUDENT PLACEMENTS =====
function StudentPlacementsView() {
  const [placements, setPlacements] = useState([]); const [showCreate, setShowCreate] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({title:'',university_name:'',program:'',description:'',location:'',country:'GB',duration_months:12,tuition_fee:'',intake:'',scholarship_available:false,visa_support:false,placement_type:'university'});
  const load = useCallback(async()=>{try{const r=await api.get('/employer/placements');setPlacements(r.data);}catch(e){console.error(e);}}, []);
  useEffect(()=>{load();}, [load]);
  const create = async(e)=>{ e.preventDefault();setCreating(true); try{await api.post('/placements',{...form,tuition_fee:parseFloat(form.tuition_fee)||0,duration_months:parseInt(form.duration_months)});toast.success('Placement created!');setShowCreate(false);load();}catch(e){toast.error('Failed');}finally{setCreating(false);}};
  return (
    <div className="space-y-5 animate-fade-in" data-testid="employer-student-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Student Placements</h1><Button onClick={()=>setShowCreate(!showCreate)} className="bg-[#C5A059] text-white rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="create-placement-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Add Placement</Button></div>
      {showCreate&&(<div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 animate-slide-up">
        <form onSubmit={create} className="grid md:grid-cols-3 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Title</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">University/College</Label><Input value={form.university_name} onChange={e=>setForm({...form,university_name:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Program</Label><Input value={form.program} onChange={e=>setForm({...form,program:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Tuition (£)</Label><Input type="number" value={form.tuition_fee} onChange={e=>setForm({...form,tuition_fee:e.target.value})} className="mt-1 h-10 rounded-sm text-sm"/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Duration (months)</Label><Input type="number" value={form.duration_months} onChange={e=>setForm({...form,duration_months:e.target.value})} className="mt-1 h-10 rounded-sm text-sm"/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Intake</Label><Input value={form.intake} onChange={e=>setForm({...form,intake:e.target.value})} placeholder="September 2026" className="mt-1 h-10 rounded-sm text-sm"/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Type</Label><Select value={form.placement_type} onValueChange={v=>setForm({...form,placement_type:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="university">University</SelectItem><SelectItem value="college">College</SelectItem><SelectItem value="vocational">Vocational</SelectItem><SelectItem value="internship">Internship</SelectItem></SelectContent></Select></div>
          <div className="flex items-end gap-4"><div className="flex items-center gap-1"><Switch checked={form.visa_support} onCheckedChange={v=>setForm({...form,visa_support:v})}/><Label className="text-[10px] text-slate-400">Visa</Label></div><div className="flex items-center gap-1"><Switch checked={form.scholarship_available} onCheckedChange={v=>setForm({...form,scholarship_available:v})}/><Label className="text-[10px] text-slate-400">Scholarship</Label></div></div>
          <div className="md:col-span-3"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8">{creating?<div className="gold-spinner"/>:'Create Placement'}</Button></div>
        </form>
      </div>)}
      <div className="space-y-2">{placements.map(p=>(<div key={p.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3"><div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-[#C5A059]"/><h3 className="font-semibold text-sm text-[#0F172A]">{p.title}</h3><StatusBadge status={p.status}/></div><p className="text-[10px] text-slate-400">{p.university_name} &middot; {p.program} &middot; {p.location} &middot; {p.duration_months}mo</p></div>))}{placements.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No placements posted.</div>}</div>
    </div>
  );
}

// ===== APPLICANTS =====
function ApplicantsView() {
  const [shifts, setShifts] = useState([]); const [permJobs, setPermJobs] = useState([]); const [selectedId, setSelectedId] = useState(null); const [selectedType, setSelectedType] = useState('shift'); const [applicants, setApplicants] = useState([]); const [processing, setProcessing] = useState(null);
  useEffect(() => { api.get('/employer/shifts').then(r=>setShifts(r.data)).catch(console.error); api.get('/employer/permanent-jobs').then(r=>setPermJobs(r.data)).catch(console.error); }, []);
  const loadApps = async(id,type)=>{ setSelectedId(id);setSelectedType(type); try{ const r = type==='shift' ? await api.get(`/employer/shifts/${id}/applicants`) : await api.get(`/employer/permanent-jobs/${id}/applicants`); setApplicants(r.data); }catch(e){console.error(e);} };
  const handle = async(appId,action)=>{ setProcessing(appId); try{ const endpoint = selectedType==='shift' ? `/employer/applications/${appId}/${action}` : `/employer/job-applications/${appId}/${action}`; await api.post(endpoint); toast.success(`${action}ed`); loadApps(selectedId,selectedType); }catch(e){toast.error('Failed');}finally{setProcessing(null);} };
  return (
    <div className="space-y-5 animate-fade-in" data-testid="applicants-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Review Applicants</h1>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1">Temp Shifts</p>
          {shifts.filter(s=>s.applicants_count>0).map(s=>(<button key={s.id} onClick={()=>loadApps(s.id,'shift')} className={`w-full text-left p-2.5 rounded-sm border transition-all text-sm ${selectedId===s.id?'border-[#C5A059] bg-[#C5A059]/5':'border-slate-200 hover:border-[#C5A059]/30'}`}><p className="font-semibold text-[#0F172A] text-xs">{s.title}</p><p className="text-[10px] text-slate-400">{s.applicants_count} applicants</p></button>))}
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mt-3 mb-1">Permanent Jobs</p>
          {permJobs.filter(j=>j.applicants_count>0).map(j=>(<button key={j.id} onClick={()=>loadApps(j.id,'permanent')} className={`w-full text-left p-2.5 rounded-sm border transition-all text-sm ${selectedId===j.id?'border-[#C5A059] bg-[#C5A059]/5':'border-slate-200 hover:border-[#C5A059]/30'}`}><p className="font-semibold text-[#0F172A] text-xs">{j.title}</p><p className="text-[10px] text-slate-400">{j.applicants_count} applicants</p></button>))}
        </div>
        <div className="md:col-span-2 space-y-2">
          {applicants.map(a=>(<div key={a.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3" data-testid={`applicant-${a.id}`}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C5A059] text-xs font-bold">{a.worker_name?.charAt(0)}</div><div><p className="font-semibold text-sm text-[#0F172A]">{a.worker_name}</p><p className="text-[10px] text-slate-400">{a.worker?.email}</p></div></div><StatusBadge status={a.status}/></div>
            {a.worker_profile&&<div className="flex flex-wrap gap-1 mb-2">{a.worker_profile.skills?.map(sk=><span key={sk} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">{sk}</span>)}{a.worker_profile.rating>0&&<span className="px-1.5 py-0.5 bg-[#C5A059]/10 text-[#C5A059] rounded-full text-[10px] font-semibold">Rating: {a.worker_profile.rating}</span>}</div>}
            {a.status==='applied'&&<div className="flex gap-1.5"><Button size="sm" onClick={()=>handle(a.id,'accept')} disabled={processing===a.id} className="bg-emerald-600 text-white rounded-sm text-[10px] uppercase tracking-wider font-bold h-7" data-testid={`accept-${a.id}`}><CheckCircle className="w-3 h-3 mr-1"/>Accept</Button><Button size="sm" variant="outline" onClick={()=>handle(a.id,'reject')} disabled={processing===a.id} className="rounded-sm text-[10px] uppercase tracking-wider font-bold h-7 border-red-200 text-red-600" data-testid={`reject-${a.id}`}><XCircle className="w-3 h-3 mr-1"/>Reject</Button></div>}
          </div>))}
          {!selectedId&&<div className="bg-white rounded-sm shadow-sm p-8 text-center"><Users className="w-8 h-8 text-slate-300 mx-auto mb-2"/><p className="text-sm text-slate-500">Select a shift or job to view applicants</p></div>}
          {selectedId&&applicants.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No applicants.</div>}
        </div>
      </div>
    </div>
  );
}

// ===== TIMESHEETS =====
function TimesheetsView() {
  const [timesheets, setTimesheets] = useState([]); const [processing, setProcessing] = useState(null);
  const load = useCallback(async()=>{try{const r=await api.get('/employer/timesheets');setTimesheets(r.data);}catch(e){console.error(e);}}, []);
  useEffect(()=>{load();}, [load]);
  const handle = async(id,action)=>{setProcessing(id);try{await api.post(`/employer/timesheets/${id}/${action}`);toast.success(`Timesheet ${action}d`);load();}catch(e){toast.error('Failed');}finally{setProcessing(null);}};
  return (
    <div className="space-y-5 animate-fade-in" data-testid="emp-timesheets-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Timesheets</h1>
      <div className="space-y-2">{timesheets.map(ts=>(<div key={ts.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between"><div><p className="font-semibold text-sm text-[#0F172A]">{ts.shift_title}</p><p className="text-[10px] text-slate-400">{ts.worker_name} &middot; {ts.date} &middot; {ts.hours_worked}h</p></div><div className="flex items-center gap-2"><span className="font-bold text-[#0F172A] font-['Oswald'] text-sm">£{ts.total_pay?.toFixed(2)}</span>{ts.status==='pending'?<div className="flex gap-1"><Button size="sm" onClick={()=>handle(ts.id,'approve')} disabled={processing===ts.id} className="bg-emerald-600 text-white rounded-sm text-[10px] h-7"><CheckCircle className="w-3 h-3"/></Button><Button size="sm" variant="outline" onClick={()=>handle(ts.id,'reject')} disabled={processing===ts.id} className="rounded-sm text-[10px] h-7 border-red-200 text-red-600"><XCircle className="w-3 h-3"/></Button></div>:<StatusBadge status={ts.status}/>}</div></div>))}{timesheets.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No timesheets.</div>}</div>
    </div>
  );
}

// ===== ORGANIZATION =====
function OrganizationView() {
  const [orgs, setOrgs] = useState([]); const [showCreate, setShowCreate] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({name:'',industry:'',address:'',city:'',postcode:'',phone:'',description:'',country:'GB',org_type:'employer'});
  useEffect(()=>{api.get('/employer/organization').then(r=>setOrgs(r.data)).catch(console.error);}, []);
  const industries = ['Healthcare','Social Care','Hospitality','Cleaning','Retail','Transport & Logistics','Warehousing','Security','Education Support','Office & Admin'];
  const create = async(e)=>{e.preventDefault();setCreating(true);try{await api.post('/employer/organization',form);toast.success('Created!');setShowCreate(false);api.get('/employer/organization').then(r=>setOrgs(r.data));}catch(e){toast.error('Failed');}finally{setCreating(false);}};
  return (
    <div className="space-y-5 animate-fade-in" data-testid="organization-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Organization</h1><Button onClick={()=>setShowCreate(!showCreate)} className="bg-[#C5A059] text-white rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="create-org-btn"><Plus className="w-3.5 h-3.5 mr-1"/>Add</Button></div>
      {showCreate&&(<div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 animate-slide-up">
        <form onSubmit={create} className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 h-10 rounded-sm text-sm" required/></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry</Label><Select value={form.industry} onValueChange={v=>setForm({...form,industry:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{industries.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Type</Label><Select value={form.org_type} onValueChange={v=>setForm({...form,org_type:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="employer">Employer</SelectItem><SelectItem value="university">University/College</SelectItem><SelectItem value="agency">Agency</SelectItem></SelectContent></Select></div>
          <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Country</Label><Select value={form.country} onValueChange={v=>setForm({...form,country:v})}><SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="GB">UK</SelectItem><SelectItem value="US">USA</SelectItem><SelectItem value="AE">UAE</SelectItem><SelectItem value="CA">Canada</SelectItem></SelectContent></Select></div>
          <div className="md:col-span-2"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8">{creating?<div className="gold-spinner"/>:'Create'}</Button></div>
        </form>
      </div>)}
      <div className="grid md:grid-cols-2 gap-3">{orgs.map(o=>(<div key={o.id} className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-4"><div className="flex items-center gap-2 mb-2"><Building className="w-5 h-5 text-[#C5A059]"/><div><h3 className="font-semibold text-[#0F172A] text-sm">{o.name}</h3><p className="text-[10px] text-slate-400">{o.industry} &middot; {o.org_type} &middot; {o.country}</p></div></div></div>))}{orgs.length===0&&<div className="col-span-2 bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No organizations.</div>}</div>
    </div>
  );
}

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const render = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView/>;
      case 'shifts': return <ManageShifts/>;
      case 'permanent-jobs': return <PermanentJobsView/>;
      case 'student': return <StudentPlacementsView/>;
      case 'applicants': return <ApplicantsView/>;
      case 'timesheets': return <TimesheetsView/>;
      case 'organization': return <OrganizationView/>;
      case 'referrals': return <ReferralView role="employer"/>;
      case 'academy': return <AcademyView role="employer"/>;
      default: return <DashboardView/>;
    }
  };
  return (<div className="min-h-screen bg-slate-50" data-testid="employer-dashboard"><Sidebar activeTab={activeTab} setActiveTab={setActiveTab}/><main className="md:ml-64 p-5 md:p-7 pt-14 md:pt-7">{render()}</main></div>);
}
