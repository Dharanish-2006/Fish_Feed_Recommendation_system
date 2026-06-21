import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { feedsApi, recommendationsApi } from '../../api';
import { Card, Badge, SectionHeader, EmptyState, Spinner, ScoreRing, Input, Select } from '../../components/ui';
import { Sparkles } from 'lucide-react';

export function AdminFeedsPage() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formFilter, setFormFilter] = useState('');

  useEffect(() => {
    feedsApi.list({ search, feed_form: formFilter || undefined, page_size: 100 })
      .then(({ data }) => setFeeds(data.results || data)).finally(() => setLoading(false));
  }, [search, formFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Feed Products" subtitle="All feed products on the platform" />

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search feeds…" icon={Search} value={search}
          onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-48" />
        <Select value={formFilter} onChange={(e) => setFormFilter(e.target.value)} className="w-44">
          <option value="">All forms</option>
          <option value="pellet">Pellet</option>
          <option value="crumble">Crumble</option>
          <option value="powder">Powder</option>
          <option value="flake">Flake</option>
          <option value="extruded">Extruded</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={36} /></div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E6EDF1] dark:border-[#233340]">
                  {['Product', 'Supplier', 'Form', 'Protein', 'Fat', 'Price', 'Stock', 'Status'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feeds.map((f) => (
                  <tr key={f.id} className="border-b border-[#F4F8FA] dark:border-[#1A2733] last:border-0 hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors">
                    <td className="pl-6 pr-4 py-4">
                      <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">{f.name}</p>
                      {f.brand && <p className="text-xs text-[#9FB2BE] dark:text-[#5C7384]">{f.brand}</p>}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#5C7384] dark:text-[#93A4AF]">{f.supplier_name}</td>
                    <td className="px-4 py-4"><Badge variant="ocean">{f.feed_form}</Badge></td>
                    <td className="px-4 py-4 font-semibold text-sm text-[#0E4561] dark:text-[#6FB6D6]">{f.protein_percentage}%</td>
                    <td className="px-4 py-4 text-sm text-[#5C7384] dark:text-[#93A4AF]">{f.fat_percentage}%</td>
                    <td className="px-4 py-4 font-bold text-sm">${Number(f.price_per_kg).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-[#5C7384] dark:text-[#93A4AF]">{f.stock_quantity_kg} kg</td>
                    <td className="px-4 py-4">
                      <Badge variant={f.is_available ? 'success' : 'danger'}>{f.is_available ? 'Available' : 'Unavailable'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feeds.length === 0 && <div className="py-12 text-center text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] text-sm">No feeds found.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Admin Recommendations Viewer ──────────────────────────────────────────────
export function AdminRecommendationsPage() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = { page_size: 50 };
    if (statusFilter) params.status = statusFilter;
    recommendationsApi.list(params).then(({ data }) => setRecs(data.results || data)).finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Recommendations Monitor" subtitle="View all generated feed recommendations" />

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
        <option value="">All statuses</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
      </Select>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={36} /></div>
      ) : recs.length === 0 ? (
        <Card><EmptyState icon={Sparkles} title="No recommendations yet" /></Card>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const best = rec.results?.[0];
            return (
              <Card key={rec.id}>
                <div className="flex items-center gap-5">
                  {best && <ScoreRing score={Math.round(best.match_percentage)} size={60} strokeWidth={5} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">
                        {rec.fish_stock_info?.species} — {rec.fish_stock_info?.farm}
                      </p>
                      <Badge variant={rec.status === 'completed' ? 'success' : rec.status === 'failed' ? 'danger' : 'warning'}>
                        {rec.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] mt-1">
                      Group: <span className="font-semibold text-[#0E4561] dark:text-[#6FB6D6] capitalize">
                        {rec.predicted_feed_group?.replace(/_/g, ' ') || '—'}
                      </span>
                      {' · '}{rec.fish_stock_info?.growth_stage}{' · '}{new Date(rec.created_at).toLocaleString()}
                    </p>
                    {best && (
                      <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] mt-0.5">
                        Best: <span className="font-semibold text-[#14202B] dark:text-[#EEF3F6]">{best.feed_name}</span> ({best.match_percentage}% match)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] shrink-0">{rec.results?.length || 0} result{rec.results?.length !== 1 ? 's' : ''}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
