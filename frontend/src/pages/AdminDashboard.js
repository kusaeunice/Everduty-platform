import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users, Building, CalendarDays, FileText, Wallet, AlertTriangle, CheckCircle,
  XCircle, Clock, TrendingUp, Banknote, Briefcase, GraduationCap, Wrench, Plane, Globe, BarChart3,
  Shield
} from 'lucide-react';
import { ReferralView } from '../components/ReferralView';
import { AcademyView } from '../components/AcademyView';

function StatusBadge({ status }) {
  const styles = { open:'bg-emerald-100 text-emerald-800', filled:'bg-blue-100 text-blue-800', applied:'bg-blue-100 text-blue-800', accepted:'bg-emerald-100 text-emerald-800', rejected:'bg-red-100 text-red-800', pending:'bg-amber-100 text-amber-800', approved:'bg-emerald-100 text-emerald-800', flagged:'bg-orange-100 text-orange-800', active:'bg-emerald-100 text-emerald-800', suspended:'bg-red-100 text-red-800', submitted:'bg-blue-100 text-blue-800', confirmed:'bg-emerald-100 text-emerald-800' };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]||'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

// ===== DASHBOARD =====
function DashboardView() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/dashboard').then(r=>setData(r.data)).catch(console.error); }, []);
  if(!data) return <div className="flex justify-center py-12"><div className="gold-spinner w-8 h-8"/></div>;
  const stats = [
    {label:'Workers',value:data.stats.total_workers,icon:Users,color:'border-blue-500'},
    {label:'Employers',value:data.stats.total_employers,icon:Building,color:'border-emerald-500'},
    {label:'Temp Shifts',value:data.stats.total_shifts,icon:CalendarDays,color:'border-[#C5A059]'},
    {label:'Open Shifts',value:data.stats.open_shifts,icon:Clock,color:'border-amber-500'},
    {label:'Perm Jobs',value:data.stats.permanent_jobs,icon:Briefcase,color:'border-blue-500'},
    {label:'Freelancers',value:data.stats.active_freelancers,icon:Wrench,color:'border-purple-500'},
    {label:'Placements',value:data.stats.student_placements,icon:GraduationCap,color:'border-indigo-500'},
    {label:'Visa Apps',value:data.stats.visa_applications,icon:Plane,color:'border-cyan-500'},
    {label:'Pending Docs',value:data.stats.pending_documents,icon:FileText,color:'border-orange-500'},
    {label:'Pending TS',value:data.stats.pending_timesheets,icon:Clock,color:'border-amber-500'},
    {label:'Revenue',value:`£${data.stats.total_revenue.toFixed(2)}`,icon:Banknote,color:'border-emerald-500'},
    {label:'Commission',value:`£${data.stats.platform_commission.toFixed(2)}`,icon:TrendingUp,color:'border-[#C5A059]'},
  ];
  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-dashboard-view">
      <div><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Admin Dashboard</h1><p className="text-sm text-slate-500 mt-1">Platform overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stats.map(s=>(<div key={s.label} className={`bg-white border-t-4 ${s.color} shadow-sm rounded-sm p-4 hover:shadow-md transition-shadow`} data-testid={`admin-stat-${s.label.toLowerCase().replace(/\s/g,'-')}`}><div className="flex items-center justify-between mb-1"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">{s.label}</p><s.icon className="w-3.5 h-3.5 text-slate-400"/></div><p className="text-xl font-bold text-[#0F172A] font-['Oswald']">{s.value}</p></div>))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div><h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-2">Recent Shifts</h2><div className="space-y-1.5">{data.recent_shifts.map(s=>(<div key={s.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-2.5 flex items-center justify-between"><div><p className="font-semibold text-xs text-[#0F172A]">{s.title}</p><p className="text-[10px] text-slate-400">{s.industry} &middot; {s.date}</p></div><StatusBadge status={s.status}/></div>))}</div></div>
        <div><h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-2">Recent Applications</h2><div className="space-y-1.5">{data.recent_applications.map(a=>(<div key={a.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-2.5 flex items-center justify-between"><div><p className="font-semibold text-xs text-[#0F172A]">{a.worker_name}</p><p className="text-[10px] text-slate-400">Applied {a.applied_at?.slice(0,10)}</p></div><StatusBadge status={a.status}/></div>))}</div></div>
      </div>
    </div>
  );
}

// ===== WORKERS =====
function WorkersView() {
  const [workers, setWorkers] = useState([]); const [processing, setProcessing] = useState(null);
  useEffect(()=>{api.get('/admin/workers').then(r=>setWorkers(r.data)).catch(console.error);}, []);
  const updateStatus = async(id,status)=>{setProcessing(id);try{await api.post(`/admin/users/${id}/status?status=${status}`);toast.success(`Worker ${status}`);api.get('/admin/workers').then(r=>setWorkers(r.data));}catch(e){toast.error('Failed');}finally{setProcessing(null);}};
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-workers-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Workers</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm" data-testid="workers-table"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Name</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Email</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Status</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Type</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Shifts</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Actions</th></tr></thead>
      <tbody>{workers.map(w=>(<tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`worker-row-${w.id}`}>
        <td className="p-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C5A059] text-[10px] font-bold">{w.full_name?.charAt(0)}</div><span className="font-medium text-[#0F172A] text-xs">{w.full_name}</span></div></td>
        <td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{w.email}</td>
        <td className="p-2.5 hidden md:table-cell"><StatusBadge status={w.status}/></td>
        <td className="p-2.5 text-[10px] text-slate-500 hidden md:table-cell">{w.profile?.is_freelancer?'Freelancer ':'Worker '}{w.profile?.is_student?'/ Student':''}</td>
        <td className="p-2.5 font-semibold text-xs hidden md:table-cell">{w.profile?.shifts_completed||0}</td>
        <td className="p-2.5">{w.status==='pending'&&<Button size="sm" onClick={()=>updateStatus(w.id,'active')} disabled={processing===w.id} className="bg-emerald-600 text-white rounded-sm text-[10px] h-6">Activate</Button>}{w.status==='active'&&<Button size="sm" variant="outline" onClick={()=>updateStatus(w.id,'suspended')} disabled={processing===w.id} className="rounded-sm text-[10px] h-6 border-red-200 text-red-600">Suspend</Button>}{w.status==='suspended'&&<Button size="sm" onClick={()=>updateStatus(w.id,'active')} disabled={processing===w.id} className="bg-emerald-600 text-white rounded-sm text-[10px] h-6">Reactivate</Button>}</td>
      </tr>))}</tbody></table>{workers.length===0&&<div className="p-6 text-center text-sm text-slate-500">No workers.</div>}</div>
    </div>
  );
}

// ===== EMPLOYERS =====
function EmployersView() {
  const [employers, setEmployers] = useState([]);
  useEffect(()=>{api.get('/admin/employers').then(r=>setEmployers(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-employers-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Employers</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Name</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Email</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Organizations</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{employers.map(e=>(<tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] text-[10px] font-bold">{e.full_name?.charAt(0)}</div><span className="font-medium text-[#0F172A] text-xs">{e.full_name}</span></div></td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{e.email}</td><td className="p-2.5 text-xs hidden md:table-cell">{e.organizations?.map(o=>o.name).join(', ')||'None'}</td><td className="p-2.5"><StatusBadge status={e.status}/></td></tr>))}</tbody></table>{employers.length===0&&<div className="p-6 text-center text-sm text-slate-500">No employers.</div>}</div>
    </div>
  );
}

// ===== ALL SHIFTS =====
function AllShiftsView() {
  const [shifts, setShifts] = useState([]);
  useEffect(()=>{api.get('/admin/shifts').then(r=>setShifts(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-shifts-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">All Temp Shifts</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Title</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Industry</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Location</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Date</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Rate</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{shifts.map(s=>(<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5"><div className="flex items-center gap-1"><span className="font-medium text-[#0F172A] text-xs">{s.title}</span>{s.urgent&&<AlertTriangle className="w-3 h-3 text-red-500"/>}</div></td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{s.industry}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{s.location}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{s.date}</td><td className="p-2.5 font-semibold text-xs hidden md:table-cell">£{s.hourly_rate}</td><td className="p-2.5"><StatusBadge status={s.status}/></td></tr>))}</tbody></table>{shifts.length===0&&<div className="p-6 text-center text-sm text-slate-500">No shifts.</div>}</div>
    </div>
  );
}

// ===== PERMANENT JOBS =====
function PermanentJobsView() {
  const [jobs, setJobs] = useState([]);
  useEffect(()=>{api.get('/admin/permanent-jobs').then(r=>setJobs(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-perm-jobs-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Permanent Jobs</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Title</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Industry</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Location</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Salary</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Type</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{jobs.map(j=>(<tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5"><div className="flex items-center gap-1"><span className="font-medium text-[#0F172A] text-xs">{j.title}</span>{j.visa_sponsorship&&<Globe className="w-3 h-3 text-blue-500"/>}</div></td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{j.industry}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{j.location} ({j.country})</td><td className="p-2.5 font-semibold text-xs hidden md:table-cell">£{(j.salary_min/1000).toFixed(0)}k-{(j.salary_max/1000).toFixed(0)}k</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{j.job_type}</td><td className="p-2.5"><StatusBadge status={j.status}/></td></tr>))}</tbody></table>{jobs.length===0&&<div className="p-6 text-center text-sm text-slate-500">No permanent jobs.</div>}</div>
    </div>
  );
}

// ===== FREELANCERS =====
function FreelancersView() {
  const [services, setServices] = useState([]);
  useEffect(()=>{api.get('/admin/freelancers').then(r=>setServices(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-freelancers-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Freelancer Services</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Service</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Category</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Freelancer</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Rate</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Bookings</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{services.map(s=>(<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5 font-medium text-[#0F172A] text-xs">{s.title}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{s.category}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{s.freelancer_name}</td><td className="p-2.5 font-semibold text-xs hidden md:table-cell">£{s.hourly_rate||s.fixed_price}</td><td className="p-2.5 text-xs hidden md:table-cell">{s.bookings_count}</td><td className="p-2.5"><StatusBadge status={s.status}/></td></tr>))}</tbody></table>{services.length===0&&<div className="p-6 text-center text-sm text-slate-500">No freelancer services.</div>}</div>
    </div>
  );
}

// ===== STUDENT PLACEMENTS =====
function StudentPlacementsView() {
  const [placements, setPlacements] = useState([]);
  useEffect(()=>{api.get('/admin/placements').then(r=>setPlacements(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-student-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Student Placements</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Title</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">University</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Program</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Location</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Type</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{placements.map(p=>(<tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5"><div className="flex items-center gap-1"><span className="font-medium text-[#0F172A] text-xs">{p.title}</span>{p.visa_support&&<Plane className="w-3 h-3 text-blue-500"/>}</div></td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{p.university_name}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{p.program}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{p.location} ({p.country})</td><td className="p-2.5 text-xs hidden md:table-cell">{p.placement_type}</td><td className="p-2.5"><StatusBadge status={p.status}/></td></tr>))}</tbody></table>{placements.length===0&&<div className="p-6 text-center text-sm text-slate-500">No placements.</div>}</div>
    </div>
  );
}

// ===== DOCUMENTS =====
function DocumentsView() {
  const [docs, setDocs] = useState([]); const [filter, setFilter] = useState('all'); const [processing, setProcessing] = useState(null);
  const load = useCallback(async()=>{try{const p=filter!=='all'?{status:filter}:{};const r=await api.get('/admin/documents',{params:p});setDocs(r.data);}catch(e){console.error(e);}}, [filter]);
  useEffect(()=>{load();}, [load]);
  const handle = async(id,action)=>{setProcessing(id);try{await api.post(`/admin/documents/${id}/${action}`);toast.success(`Document ${action}d`);load();}catch(e){toast.error('Failed');}finally{setProcessing(null);}};
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-documents-view">
      <div className="flex items-center justify-between"><h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Document Review</h1>
        <Tabs value={filter} onValueChange={setFilter} className="w-auto"><TabsList className="bg-slate-100 rounded-sm"><TabsTrigger value="all" className="rounded-sm text-[10px]">All</TabsTrigger><TabsTrigger value="pending" className="rounded-sm text-[10px]">Pending</TabsTrigger><TabsTrigger value="flagged" className="rounded-sm text-[10px]">Flagged</TabsTrigger><TabsTrigger value="approved" className="rounded-sm text-[10px]">Approved</TabsTrigger></TabsList></Tabs>
      </div>
      <div className="space-y-2">{docs.map(d=>(<div key={d.id} className={`bg-white border shadow-sm rounded-sm p-3 ${d.status==='flagged'?'border-orange-300':'border-slate-100'}`} data-testid={`admin-doc-${d.id}`}>
        <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-sm flex items-center justify-center ${d.status==='flagged'?'bg-orange-100':d.status==='approved'?'bg-emerald-100':'bg-amber-100'}`}>{d.status==='flagged'?<AlertTriangle className="w-3 h-3 text-orange-600"/>:d.status==='approved'?<CheckCircle className="w-3 h-3 text-emerald-600"/>:<Clock className="w-3 h-3 text-amber-600"/>}</div><div><p className="font-semibold text-xs text-[#0F172A]">{d.doc_name}</p><p className="text-[10px] text-slate-400">{d.doc_type} &middot; {d.worker_name} &middot; {d.uploaded_at?.slice(0,10)}</p></div></div><StatusBadge status={d.status}/></div>
        {d.ai_confidence!=null&&<div className="flex gap-3 text-[10px] mb-1"><span className="text-slate-500">AI: <span className={`font-bold ${d.ai_confidence>=70?'text-emerald-600':d.ai_confidence>=40?'text-amber-600':'text-red-600'}`}>{d.ai_confidence}%</span></span>{d.ai_review?.recommendation&&<span className="text-slate-500">Rec: <span className="font-semibold">{d.ai_review.recommendation}</span></span>}</div>}
        {d.ai_review?.summary&&<p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-sm mb-1">{d.ai_review.summary}</p>}
        {(d.status==='pending'||d.status==='flagged')&&<div className="flex gap-1.5 mt-1"><Button size="sm" onClick={()=>handle(d.id,'approve')} disabled={processing===d.id} className="bg-emerald-600 text-white rounded-sm text-[10px] h-6 uppercase tracking-wider font-bold" data-testid={`approve-doc-${d.id}`}><CheckCircle className="w-3 h-3 mr-1"/>Approve</Button><Button size="sm" variant="outline" onClick={()=>handle(d.id,'reject')} disabled={processing===d.id} className="rounded-sm text-[10px] h-6 border-red-200 text-red-600 uppercase tracking-wider font-bold" data-testid={`reject-doc-${d.id}`}><XCircle className="w-3 h-3 mr-1"/>Reject</Button></div>}
      </div>))}{docs.length===0&&<div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No documents.</div>}</div>
    </div>
  );
}

// ===== TIMESHEETS =====
function TimesheetsView() {
  const [ts, setTs] = useState([]);
  useEffect(()=>{api.get('/admin/timesheets').then(r=>setTs(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-timesheets-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Timesheets</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Worker</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Shift</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Date</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Hours</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Pay</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{ts.map(t=>(<tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5 font-medium text-[#0F172A] text-xs">{t.worker_name}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{t.shift_title}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{t.date}</td><td className="p-2.5 text-xs hidden md:table-cell">{t.hours_worked}h</td><td className="p-2.5 font-semibold text-xs">£{t.total_pay?.toFixed(2)}</td><td className="p-2.5"><StatusBadge status={t.status}/></td></tr>))}</tbody></table>{ts.length===0&&<div className="p-6 text-center text-sm text-slate-500">No timesheets.</div>}</div>
    </div>
  );
}

// ===== VISA APPLICATIONS =====
function VisaView() {
  const [visas, setVisas] = useState([]);
  useEffect(()=>{api.get('/admin/visa-applications').then(r=>setVisas(r.data)).catch(console.error);}, []);
  return (
    <div className="space-y-5 animate-fade-in" data-testid="admin-visa-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Visa Applications</h1>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#0F172A] text-white"><tr><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Applicant</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Type</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Route</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Purpose</th><th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th></tr></thead>
      <tbody>{visas.map(v=>(<tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-2.5 font-medium text-[#0F172A] text-xs">{v.user_name}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{v.visa_type.replace('_',' ')}</td><td className="p-2.5 text-xs hidden md:table-cell">{v.current_country} → {v.destination_country}</td><td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{v.purpose}</td><td className="p-2.5"><StatusBadge status={v.status}/></td></tr>))}</tbody></table>{visas.length===0&&<div className="p-6 text-center text-sm text-slate-500">No visa applications.</div>}</div>
    </div>
  );
}

// ===== FINANCE =====
function FinanceView() {
  const [finance, setFinance] = useState(null);
  useEffect(()=>{api.get('/admin/finance').then(r=>setFinance(r.data)).catch(console.error);}, []);
  if(!finance) return <div className="flex justify-center py-12"><div className="gold-spinner w-8 h-8"/></div>;
  const cards = [
    {label:'Total Gross',value:`£${finance.total_gross_pay.toFixed(2)}`,color:'border-[#C5A059]',icon:Banknote},
    {label:'Approved',value:`£${finance.approved_pay.toFixed(2)}`,color:'border-emerald-500',icon:CheckCircle},
    {label:'Pending',value:`£${finance.pending_pay.toFixed(2)}`,color:'border-amber-500',icon:Clock},
    {label:'Platform Revenue',value:`£${finance.platform_revenue.toFixed(2)}`,color:'border-[#C5A059]',icon:TrendingUp},
    {label:'Net Worker Pay',value:`£${finance.net_worker_pay.toFixed(2)}`,color:'border-blue-500',icon:Users},
    {label:'Timesheets',value:finance.timesheets_count,color:'border-slate-400',icon:FileText},
  ];
  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-finance-view">
      <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A]">Finance Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{cards.map(c=>(<div key={c.label} className={`bg-white border-t-4 ${c.color} shadow-sm rounded-sm p-4 hover:shadow-md transition-shadow`}><div className="flex items-center justify-between mb-1"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">{c.label}</p><c.icon className="w-3.5 h-3.5 text-slate-400"/></div><p className="text-xl font-bold text-[#0F172A] font-['Oswald']">{c.value}</p></div>))}</div>
      <div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5"><h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-3">Revenue Breakdown</h2><div className="grid md:grid-cols-3 gap-4">{[{label:'Commission Rate',value:`${(finance.platform_commission_rate*100).toFixed(0)}%`,color:'text-[#C5A059]'},{label:'Approved TS',value:finance.approved_count,color:'text-emerald-600'},{label:'Pending TS',value:finance.pending_count,color:'text-amber-600'}].map(i=>(<div key={i.label} className="text-center p-3 bg-slate-50 rounded-sm"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">{i.label}</p><p className={`text-2xl font-bold font-['Oswald'] mt-1 ${i.color}`}>{i.value}</p></div>))}</div></div>
    </div>
  );
}

function AgenciesView() {
  const [agencies, setAgencies] = useState([]);
  const load = useCallback(() => { api.get('/admin/agencies').then(r => setAgencies(r.data)).catch(console.error); }, []);
  useEffect(() => { load(); }, [load]);
  const approve = async (id) => { try { await api.post(`/admin/agencies/${id}/approve`); toast.success('Agency approved'); load(); } catch(e) { toast.error('Failed'); } };
  const suspend = async (id) => { try { await api.post(`/admin/agencies/${id}/suspend`); toast.success('Agency suspended'); load(); } catch(e) { toast.error('Failed'); } };
  return (
    <div className="space-y-4" data-testid="admin-agencies-view">
      <h1 className="font-['Oswald'] text-2xl font-bold text-[#0F172A]">Agency Management</h1>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-4"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Total Agencies</p><p className="text-2xl font-bold font-['Oswald'] text-[#0F172A]">{agencies.length}</p></div>
        <div className="bg-white border-t-4 border-emerald-500 shadow-sm rounded-sm p-4"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Active</p><p className="text-2xl font-bold font-['Oswald'] text-emerald-600">{agencies.filter(a => a.status === 'active').length}</p></div>
        <div className="bg-white border-t-4 border-amber-500 shadow-sm rounded-sm p-4"><p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Pending</p><p className="text-2xl font-bold font-['Oswald'] text-amber-600">{agencies.filter(a => a.status === 'pending').length}</p></div>
      </div>
      <div className="space-y-2">
        {agencies.map(a => (
          <div key={a.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4" data-testid={`agency-${a.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-[#0F172A] flex items-center justify-center text-[#C5A059] font-bold">{a.name?.charAt(0)}</div>
                <div><p className="font-semibold text-sm text-[#0F172A]">{a.name}</p><p className="text-[10px] text-slate-400">{a.owner_name} ({a.owner_email}) &middot; {a.industry} &middot; {a.city}</p>
                  <p className="text-[10px] text-slate-400">Commission: {a.commission_rate}% &middot; Workers: {a.worker_pool_count}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.status === 'active' ? 'bg-emerald-100 text-emerald-800' : a.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{a.status}</span>
                {a.status === 'pending' && <Button onClick={() => approve(a.id)} size="sm" className="bg-emerald-600 text-white rounded-sm h-7 text-[10px]" data-testid={`approve-agency-${a.id}`}><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>}
                {a.status === 'active' && <Button onClick={() => suspend(a.id)} size="sm" variant="outline" className="rounded-sm h-7 text-[10px] text-red-500 border-red-200" data-testid={`suspend-agency-${a.id}`}><XCircle className="w-3 h-3 mr-1" />Suspend</Button>}
              </div>
            </div>
          </div>
        ))}
        {agencies.length === 0 && <div className="bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No agencies registered yet.</div>}
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const render = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView/>;
      case 'workers': return <WorkersView/>;
      case 'employers': return <EmployersView/>;
      case 'shifts': return <AllShiftsView/>;
      case 'permanent-jobs': return <PermanentJobsView/>;
      case 'freelancers': return <FreelancersView/>;
      case 'student': return <StudentPlacementsView/>;
      case 'documents': return <DocumentsView/>;
      case 'timesheets': return <TimesheetsView/>;
      case 'visa': return <VisaView/>;
      case 'finance': return <FinanceView/>;
      case 'agencies': return <AgenciesView/>;
      case 'referrals': return <ReferralView role="admin"/>;
      case 'academy': return <AcademyView role="admin"/>;
      default: return <DashboardView/>;
    }
  };
  return (<div className="min-h-screen bg-slate-50" data-testid="admin-dashboard"><Sidebar activeTab={activeTab} setActiveTab={setActiveTab}/><main className="md:ml-64 p-5 md:p-7 pt-14 md:pt-7">{render()}</main></div>);
}
