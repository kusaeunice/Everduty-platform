import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Copy, Gift, Users, TrendingUp, Award, ChevronRight, Share2 } from 'lucide-react';

const TIER_CONFIG = {
  none: { color: 'from-slate-300 to-slate-200', border: 'border-slate-300', bg: 'bg-slate-100', text: 'text-slate-500', min: 0, max: 0 },
  bronze: { color: 'from-amber-700 to-amber-600', border: 'border-amber-600', bg: 'bg-amber-600/10', text: 'text-amber-700', min: 1, max: 5 },
  silver: { color: 'from-slate-400 to-slate-300', border: 'border-slate-400', bg: 'bg-slate-400/10', text: 'text-slate-600', min: 6, max: 15 },
  gold: { color: 'from-[#C5A059] to-yellow-500', border: 'border-[#C5A059]', bg: 'bg-[#C5A059]/10', text: 'text-[#C5A059]', min: 16, max: null },
};

export function ReferralView({ role }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get('/referral/stats'),
          api.get('/referral/history'),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data);
        if (role === 'admin') {
          const adminRes = await api.get('/admin/referrals');
          setAdminData(adminRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  const copyCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      toast.success('Referral code copied!');
    }
  };

  const shareLink = () => {
    const url = `${window.location.origin}?ref=${stats?.referral_code}`;
    if (navigator.share) {
      navigator.share({ title: 'Join EverDuty', text: `Join EverDuty Flex Staffing using my referral code: ${stats?.referral_code}`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="gold-spinner w-8 h-8" /></div>;

  const tierInfo = stats?.tier ? TIER_CONFIG[stats.tier] : TIER_CONFIG.bronze;
  const progress = stats?.total_referrals || 0;
  const nextTierNeeded = stats?.next_tier?.referrals_needed;
  const progressPct = stats?.tier === 'gold' ? 100 : stats?.tier === 'silver' ? Math.min(((progress - 5) / 10) * 100, 100) : Math.min((progress / 5) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="referral-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Oswald'] text-3xl font-bold text-[#0F172A] tracking-tight">Referral Programme</h1>
          <p className="text-sm text-slate-500 mt-1">Earn bonuses by referring workers and employers</p>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-[#0F172A] rounded-sm p-6 relative overflow-hidden" data-testid="referral-code-card">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent" />
        <div className="relative">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C5A059] mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <span className="font-['Oswald'] text-3xl font-bold text-white tracking-wider" data-testid="referral-code-display">{stats?.referral_code || '---'}</span>
            <Button onClick={copyCode} variant="ghost" className="text-[#C5A059] hover:bg-[#C5A059]/10 rounded-sm h-9 w-9 p-0" data-testid="copy-code-btn">
              <Copy className="w-4 h-4" />
            </Button>
            <Button onClick={shareLink} variant="ghost" className="text-[#C5A059] hover:bg-[#C5A059]/10 rounded-sm h-9 w-9 p-0" data-testid="share-code-btn">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Share this code with colleagues and friends</p>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-sm p-5" data-testid="tier-progress-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className={`w-5 h-5 ${tierInfo.text}`} />
            <h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] tracking-tight">
              {stats?.tier ? stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1) : 'No'} Tier
            </h2>
          </div>
          {nextTierNeeded > 0 && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              {nextTierNeeded} more to next tier <ChevronRight className="w-3 h-3 inline" />
            </span>
          )}
        </div>

        {/* Tier visual */}
        <div className="flex gap-2 mb-4">
          {['bronze', 'silver', 'gold'].map((t) => {
            const active = stats?.tier === t;
            const passed = (t === 'bronze' && ['silver', 'gold'].includes(stats?.tier)) || (t === 'silver' && stats?.tier === 'gold');
            const cfg = TIER_CONFIG[t];
            return (
              <div
                key={t}
                className={`flex-1 p-3 rounded-sm border-2 transition-all ${active ? cfg.border + ' ' + cfg.bg : passed ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white'}`}
                data-testid={`tier-${t}`}
              >
                <p className={`text-[10px] font-bold tracking-[0.15em] uppercase ${active ? cfg.text : 'text-slate-400'}`}>{t}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{TIER_CONFIG[t].min}-{TIER_CONFIG[t].max || '+'} referrals</p>
                {active && <p className="text-xs font-bold text-[#0F172A] mt-1">{stats?.tier_config?.worker_bonus ? `£${stats.tier_config.worker_bonus} bonus` : ''}</p>}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${tierInfo.color} rounded-full transition-all duration-700`}
            style={{ width: `${progressPct}%` }}
            data-testid="tier-progress-bar"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">{progress} total referral{progress !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Referrals', value: stats?.total_referrals || 0, icon: Users, color: 'border-blue-500' },
          { label: 'Total Bonus', value: `£${(stats?.total_bonus || 0).toFixed(2)}`, icon: Gift, color: 'border-[#C5A059]' },
          { label: 'Paid Bonus', value: `£${(stats?.paid_bonus || 0).toFixed(2)}`, icon: TrendingUp, color: 'border-emerald-500' },
          { label: 'Pending', value: `£${(stats?.pending_bonus || 0).toFixed(2)}`, icon: Gift, color: 'border-amber-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-white border-t-4 ${s.color} shadow-sm rounded-sm p-4`} data-testid={`ref-stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">{s.label}</p>
              <s.icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-[#0F172A] font-['Oswald']">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Admin Platform-wide Stats */}
      {role === 'admin' && adminData && (
        <div className="bg-white border-t-4 border-[#C5A059] shadow-sm rounded-sm p-5" data-testid="admin-referral-stats">
          <h2 className="font-['Oswald'] text-base font-semibold text-[#0F172A] mb-3">Platform Referral Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-sm">
              <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Total Referrals</p>
              <p className="text-2xl font-bold font-['Oswald'] text-[#0F172A] mt-1">{adminData.total_count}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-sm">
              <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Total Bonus Liability</p>
              <p className="text-2xl font-bold font-['Oswald'] text-[#C5A059] mt-1">£{adminData.total_bonus_liability?.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-sm">
              <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">Active Referrers</p>
              <p className="text-2xl font-bold font-['Oswald'] text-emerald-600 mt-1">{new Set(adminData.referrals?.map(r => r.referrer_id)).size}</p>
            </div>
          </div>
        </div>
      )}

      {/* Referral History */}
      <div>
        <h2 className="font-['Oswald'] text-lg font-semibold text-[#0F172A] tracking-tight mb-3">Referral History</h2>
        <div className="space-y-2">
          {(role === 'admin' ? adminData?.referrals || [] : history).map((r) => (
            <div key={r.id} className="bg-white border border-slate-100 shadow-sm rounded-sm p-3 flex items-center justify-between hover:border-[#C5A059]/30 transition-colors" data-testid={`referral-${r.id}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-[#C5A059] text-xs font-bold">
                  {r.referred_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#0F172A]">{r.referred_name || 'User'}</p>
                  <p className="text-[10px] text-slate-400">
                    {r.referred_role} &middot; {r.tier} tier &middot; {r.created_at?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#C5A059] font-['Oswald']">£{r.bonus_amount?.toFixed(2)}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
          {history.length === 0 && role !== 'admin' && (
            <div className="bg-white rounded-sm shadow-sm p-8 text-center">
              <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No referrals yet. Share your code to start earning!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
