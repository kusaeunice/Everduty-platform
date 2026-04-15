import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  BookOpen, Award, Clock, GraduationCap, Plus, Search, Star,
  CheckCircle, CreditCard, Crown, BarChart3, Users
} from 'lucide-react';

function LevelBadge({ level }) {
  const styles = { beginner: 'bg-emerald-100 text-emerald-800', intermediate: 'bg-blue-100 text-blue-800', advanced: 'bg-purple-100 text-purple-800' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[level] || 'bg-slate-100 text-slate-600'}`}>{level}</span>;
}

// ===== COURSE CATALOG =====
function CourseCatalog({ onEnroll }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    api.get('/academy/categories').then(r => setCategories(r.data.categories || [])).catch(console.error);
  }, []);

  const loadCourses = useCallback(async () => {
    const params = {};
    if (catFilter !== 'all') params.category = catFilter;
    if (levelFilter !== 'all') params.level = levelFilter;
    try {
      const r = await api.get('/academy/courses', { params });
      setCourses(r.data);
    } catch (e) { console.error(e); }
  }, [catFilter, levelFilter]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const filteredCourses = searchTerm
    ? courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    : courses;

  const handleEnroll = async (course) => {
    setEnrolling(course.id);
    try {
      const res = await api.post(`/academy/courses/${course.id}/enroll`);
      if (res.data.requires_payment) {
        toast.info(`This course costs £${res.data.price}. Subscribe for unlimited access.`);
      } else {
        toast.success('Enrolled successfully!');
        onEnroll?.();
        loadCourses();
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to enroll');
    } finally { setEnrolling(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search courses..." className="pl-10 h-10 rounded-sm" data-testid="course-search-input" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full md:w-48 h-10 rounded-sm" data-testid="course-category-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full md:w-36 h-10 rounded-sm" data-testid="course-level-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCourses.map(c => (
          <div key={c.id} className="bg-white border border-slate-100 shadow-sm rounded-sm overflow-hidden hover:border-[#C5A059]/40 hover:shadow-md transition-all group" data-testid={`course-card-${c.id}`}>
            <div className="border-t-4 border-[#C5A059] p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#0F172A] leading-tight">{c.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.category} &middot; {c.industry}</p>
                </div>
                <div className="text-right ml-2">
                  {c.price > 0
                    ? <span className="text-lg font-bold text-[#C5A059] font-['Oswald']">£{c.price}</span>
                    : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">FREE</span>
                  }
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_hours}h</span>
                <LevelBadge level={c.level} />
                {c.is_certified && <span className="flex items-center gap-1"><Award className="w-3 h-3 text-[#C5A059]" />Certified</span>}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.enrollments_count} enrolled</span>
              </div>
              <Button
                onClick={() => handleEnroll(c)}
                disabled={enrolling === c.id}
                className="w-full bg-[#0F172A] text-white hover:bg-[#0F172A]/90 rounded-sm uppercase tracking-wider font-bold text-[10px] h-9 border-b-2 border-[#C5A059]"
                data-testid={`enroll-btn-${c.id}`}
              >
                {enrolling === c.id ? <div className="gold-spinner mx-auto" /> : <><BookOpen className="w-3.5 h-3.5 mr-1.5" />Enroll Now</>}
              </Button>
            </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full bg-white rounded-sm shadow-sm p-8 text-center text-sm text-slate-500">No courses found.</div>
        )}
      </div>
    </div>
  );
}

// ===== MY COURSES =====
function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [completing, setCompleting] = useState(null);

  const load = useCallback(async () => {
    try { const r = await api.get('/academy/my-courses'); setEnrollments(r.data); } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const completeCourse = async (courseId) => {
    setCompleting(courseId);
    try {
      await api.post(`/academy/courses/${courseId}/complete`);
      toast.success('Course completed! Certificate issued.');
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setCompleting(null); }
  };

  return (
    <div className="space-y-3">
      {enrollments.map(e => (
        <div key={e.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4 hover:border-[#C5A059]/30 transition-colors" data-testid={`enrollment-${e.id}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm text-[#0F172A]">{e.course_title || e.course?.title}</h3>
              <p className="text-[10px] text-slate-400">{e.course?.category} &middot; {e.course?.industry} &middot; {e.course?.duration_hours}h</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${e.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
              {e.status}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400">Progress</span>
              <span className="text-[10px] font-bold text-[#0F172A]">{e.progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${e.status === 'completed' ? 'bg-emerald-500' : 'bg-[#C5A059]'}`} style={{ width: `${e.progress}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">Enrolled: {e.enrolled_at?.slice(0, 10)}</p>
            {e.status === 'enrolled' && (
              <Button
                onClick={() => completeCourse(e.course_id)}
                disabled={completing === e.course_id}
                size="sm"
                className="bg-emerald-600 text-white rounded-sm text-[10px] uppercase tracking-wider font-bold h-7"
                data-testid={`complete-btn-${e.course_id}`}
              >
                {completing === e.course_id ? <div className="gold-spinner" /> : <><CheckCircle className="w-3 h-3 mr-1" />Mark Complete</>}
              </Button>
            )}
            {e.status === 'completed' && e.certificate_id && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold"><Award className="w-3 h-3" />Certificate Issued</span>
            )}
          </div>
        </div>
      ))}
      {enrollments.length === 0 && (
        <div className="bg-white rounded-sm shadow-sm p-8 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No courses yet. Browse the catalog to get started!</p>
        </div>
      )}
    </div>
  );
}

// ===== CERTIFICATES =====
function CertificatesView() {
  const [certs, setCerts] = useState([]);
  useEffect(() => { api.get('/academy/certificates').then(r => setCerts(r.data)).catch(console.error); }, []);

  return (
    <div className="space-y-3">
      {certs.map(c => (
        <div key={c.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-4 flex items-center gap-4 hover:border-[#C5A059]/30 transition-colors" data-testid={`cert-${c.id}`}>
          <div className="w-12 h-12 rounded-sm bg-[#C5A059]/10 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[#0F172A]">{c.certificate_name}</h3>
            <p className="text-[10px] text-slate-400">{c.course_title} &middot; {c.industry}</p>
            <p className="text-[10px] text-slate-400">Issued: {c.issued_at?.slice(0, 10)}</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            {c.status}
          </span>
        </div>
      ))}
      {certs.length === 0 && (
        <div className="bg-white rounded-sm shadow-sm p-8 text-center">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No certificates yet. Complete a course to earn one!</p>
        </div>
      )}
    </div>
  );
}

// ===== SUBSCRIPTION =====
function SubscriptionView() {
  const [subData, setSubData] = useState(null);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => { api.get('/academy/subscription').then(r => setSubData(r.data)).catch(console.error); }, []);

  const subscribe = async (plan) => {
    setSubscribing(plan);
    try {
      await api.post('/academy/subscription', { plan });
      toast.success('Subscribed successfully!');
      api.get('/academy/subscription').then(r => setSubData(r.data));
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSubscribing(null); }
  };

  return (
    <div className="space-y-4">
      {subData?.subscription && (
        <div className="bg-[#0F172A] rounded-sm p-5 relative overflow-hidden" data-testid="active-subscription">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent" />
          <div className="relative flex items-center gap-3">
            <Crown className="w-6 h-6 text-[#C5A059]" />
            <div>
              <p className="text-white font-semibold">Active Subscription</p>
              <p className="text-xs text-slate-400">{subData.subscription.plan} plan &middot; Expires: {subData.subscription.expires_at?.slice(0, 10)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {subData?.plans && Object.entries(subData.plans).map(([key, plan]) => (
          <div key={key} className={`bg-white border-2 shadow-sm rounded-sm p-5 ${subData?.subscription?.plan === key ? 'border-[#C5A059]' : 'border-slate-100'}`} data-testid={`plan-${key}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Oswald'] text-base font-semibold text-[#0F172A]">{plan.name}</h3>
              {key === 'annual' && <span className="text-[9px] font-bold tracking-wider uppercase text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-sm">Best Value</span>}
            </div>
            <p className="text-3xl font-bold text-[#0F172A] font-['Oswald']">£{plan.price}<span className="text-sm font-normal text-slate-400">/{key === 'monthly' ? 'mo' : 'yr'}</span></p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Unlimited access to all paid courses</p>
            <Button
              onClick={() => subscribe(key)}
              disabled={subscribing === key || subData?.subscription?.plan === key}
              className={`w-full rounded-sm uppercase tracking-wider font-bold text-[10px] h-10 ${subData?.subscription?.plan === key ? 'bg-slate-200 text-slate-500' : 'bg-[#C5A059] text-white hover:bg-[#C5A059]/90'}`}
              data-testid={`subscribe-btn-${key}`}
            >
              {subscribing === key ? <div className="gold-spinner" /> : subData?.subscription?.plan === key ? 'Current Plan' : <><CreditCard className="w-3.5 h-3.5 mr-1.5" />Subscribe</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ADMIN ACADEMY VIEW =====
function AdminAcademyView() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/academy').then(r => setData(r.data)).catch(console.error); }, []);

  if (!data) return <div className="flex justify-center py-12"><div className="gold-spinner w-8 h-8" /></div>;

  const stats = [
    { label: 'Total Courses', value: data.stats.total_courses, color: 'border-[#C5A059]', icon: BookOpen },
    { label: 'Enrollments', value: data.stats.total_enrollments, color: 'border-blue-500', icon: Users },
    { label: 'Completions', value: data.stats.total_completions, color: 'border-emerald-500', icon: CheckCircle },
    { label: 'Certificates', value: data.stats.certificates_issued, color: 'border-purple-500', icon: Award },
    { label: 'Active Subs', value: data.stats.active_subscriptions, color: 'border-amber-500', icon: Crown },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`bg-white border-t-4 ${s.color} shadow-sm rounded-sm p-4`} data-testid={`academy-stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">{s.label}</p>
              <s.icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-[#0F172A] font-['Oswald']">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A]">All Courses</h2>
      <div className="bg-white rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-sm" data-testid="admin-courses-table">
          <thead className="bg-[#0F172A] text-white">
            <tr>
              <th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Course</th>
              <th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Category</th>
              <th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Level</th>
              <th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Price</th>
              <th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase hidden md:table-cell">Enrollments</th>
              <th className="text-left p-2.5 text-[10px] font-bold tracking-wider uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.courses.map(c => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2.5">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[#0F172A] text-xs">{c.title}</span>
                    {c.is_certified && <Award className="w-3 h-3 text-[#C5A059]" />}
                  </div>
                </td>
                <td className="p-2.5 text-slate-500 text-xs hidden md:table-cell">{c.category}</td>
                <td className="p-2.5 hidden md:table-cell"><LevelBadge level={c.level} /></td>
                <td className="p-2.5 font-semibold text-xs hidden md:table-cell">{c.price > 0 ? `£${c.price}` : 'Free'}</td>
                <td className="p-2.5 text-xs hidden md:table-cell">{c.enrollments_count}</td>
                <td className="p-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== EMPLOYER CREATE COURSE =====
function CreateCourseView() {
  const [courses, setCourses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', category: '', industry: '', description: '',
    duration_hours: '', level: 'beginner', price: '0', is_certified: true,
    certificate_name: ''
  });

  useEffect(() => {
    api.get('/academy/my-created-courses').then(r => setCourses(r.data)).catch(console.error);
    api.get('/academy/categories').then(r => setCategories(r.data.categories || [])).catch(console.error);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/academy/courses', {
        ...form,
        duration_hours: parseFloat(form.duration_hours) || 1,
        price: parseFloat(form.price) || 0,
      });
      toast.success('Course created!');
      setShowCreate(false);
      setForm({ title: '', category: '', industry: '', description: '', duration_hours: '', level: 'beginner', price: '0', is_certified: true, certificate_name: '' });
      api.get('/academy/my-created-courses').then(r => setCourses(r.data));
    } catch (e) { toast.error('Failed to create course'); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A]">My Created Courses</h2>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 rounded-sm uppercase tracking-wider font-bold text-[10px]" data-testid="create-course-btn">
          <Plus className="w-3.5 h-3.5 mr-1" />Create Course
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5 animate-slide-up">
          <form onSubmit={create} className="grid md:grid-cols-3 gap-3">
            <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 h-10 rounded-sm text-sm" data-testid="course-title-input" required /></div>
            <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 h-10 rounded-sm text-sm" data-testid="course-category-select"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Industry</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className="mt-1 h-10 rounded-sm text-sm" required /></div>
            <div className="md:col-span-3"><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Description</Label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full h-16 border rounded-sm p-2 text-sm" required /></div>
            <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Duration (hours)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: e.target.value })} className="mt-1 h-10 rounded-sm text-sm" required /></div>
            <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Level</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger className="mt-1 h-10 rounded-sm text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Price (£)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1 h-10 rounded-sm text-sm" /></div>
            <div className="md:col-span-3"><Button type="submit" disabled={creating} className="bg-[#0F172A] text-white rounded-sm uppercase tracking-wider font-bold text-xs h-10 border-b-2 border-[#C5A059] px-8" data-testid="submit-course-btn">{creating ? <div className="gold-spinner" /> : 'Create Course'}</Button></div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {courses.map(c => (
          <div key={c.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between" data-testid={`my-course-${c.id}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-[#0F172A]">{c.title}</p>
                <LevelBadge level={c.level} />
              </div>
              <p className="text-[10px] text-slate-400">{c.category} &middot; {c.duration_hours}h &middot; {c.enrollments_count} enrolled &middot; {c.price > 0 ? `£${c.price}` : 'Free'}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {c.status}
            </span>
          </div>
        ))}
        {courses.length === 0 && <div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-slate-500">No courses created yet.</div>}
      </div>
    </div>
  );
}

// ===== MAIN EXPORT =====
export function AcademyView({ role }) {
  const [tab, setTab] = useState('catalog');
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = role === 'admin';
  const isEmployer = role === 'employer';

  return (
    <div className="space-y-5 animate-fade-in" data-testid="academy-view">
      <div>
        <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A] tracking-tight">Training Academy</h1>
        <p className="text-sm text-slate-500 mt-1">Upskill with industry-recognised certifications</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 rounded-sm">
          <TabsTrigger value="catalog" className="rounded-sm text-xs" data-testid="academy-catalog-tab">
            <BookOpen className="w-3.5 h-3.5 mr-1" />Course Catalog
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="my-courses" className="rounded-sm text-xs" data-testid="academy-my-courses-tab">
              <GraduationCap className="w-3.5 h-3.5 mr-1" />My Courses
            </TabsTrigger>
          )}
          {!isAdmin && (
            <TabsTrigger value="certificates" className="rounded-sm text-xs" data-testid="academy-certificates-tab">
              <Award className="w-3.5 h-3.5 mr-1" />Certificates
            </TabsTrigger>
          )}
          {!isAdmin && (
            <TabsTrigger value="subscription" className="rounded-sm text-xs" data-testid="academy-subscription-tab">
              <CreditCard className="w-3.5 h-3.5 mr-1" />Subscription
            </TabsTrigger>
          )}
          {(isEmployer || isAdmin) && (
            <TabsTrigger value="manage" className="rounded-sm text-xs" data-testid="academy-manage-tab">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />{isAdmin ? 'Overview' : 'My Courses'}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <CourseCatalog key={refreshKey} onEnroll={() => setRefreshKey(k => k + 1)} />
        </TabsContent>
        {!isAdmin && (
          <TabsContent value="my-courses" className="mt-4">
            <MyCourses key={refreshKey} />
          </TabsContent>
        )}
        {!isAdmin && (
          <TabsContent value="certificates" className="mt-4">
            <CertificatesView />
          </TabsContent>
        )}
        {!isAdmin && (
          <TabsContent value="subscription" className="mt-4">
            <SubscriptionView />
          </TabsContent>
        )}
        {(isEmployer || isAdmin) && (
          <TabsContent value="manage" className="mt-4">
            {isAdmin ? <AdminAcademyView /> : <CreateCourseView />}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
