import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wheat, Package, Sprout, Fish, Sparkles, CheckCircle2,
  BarChart3, TrendingUp, Plus, Search
} from 'lucide-react';
import { analyticsApi, adminApi, speciesApi } from '../../api';
import {
  Card, StatCard, Button, Input, Select, Modal, SectionHeader,
  Badge, EmptyState, Spinner, Tabs
} from '../../components/ui';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.adminDashboard().then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner size={36} /></div>;

  const chartData = data?.top_recommended_feeds?.map((f) => ({
    name: f.feed__name?.split(' ').slice(0, 2).join(' '),
    times: f.times_recommended,
  })) || [];

  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E4561] via-[#0A3247] to-[#061E2E] p-8 text-white">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#2389B5]/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-white/55 text-sm">Admin Portal</p>
          <h1 className="text-[28px] font-bold mt-0.5 font-display tracking-tight">System Overview</h1>
          <p className="text-white/45 text-sm mt-1.5">{data?.last_30_days?.new_farmers} new farmers in the last 30 days</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers" value={data?.totals?.farmers} icon={Sprout} color="ocean" />
        <StatCard label="Suppliers" value={data?.totals?.suppliers} icon={Package} color="success" />
        <StatCard label="Feed Products" value={data?.totals?.feed_products} icon={Wheat} color="coral" />
        <StatCard label="Fish Species" value={data?.totals?.fish_species} icon={Fish} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Total Recommendations" value={data?.recommendations?.total} icon={Sparkles} color="ocean" />
        <StatCard label="Completed" value={data?.recommendations?.completed} icon={CheckCircle2} color="success" />
        <StatCard label="Avg Match Score" value={`${data?.recommendations?.avg_match_percentage}%`} icon={BarChart3} color="coral" />
      </div>

      {chartData.length > 0 && (
        <Card>
          <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-6">Top Recommended Feeds</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF1" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5C7384' }} axisLine={{ stroke: '#E6EDF1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5C7384' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E6EDF1', boxShadow: '0 8px 24px rgba(20,32,43,0.1)' }} />
              <Bar dataKey="times" fill="#0E4561" radius={[8, 8, 0, 0]} name="Times recommended" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="New Farmers (30d)" value={data?.last_30_days?.new_farmers} icon={TrendingUp} color="success" />
        <StatCard label="Recommendations (30d)" value={data?.last_30_days?.recommendations_generated} icon={Sparkles} color="ocean" />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    adminApi.users(params).then(({ data }) => setUsers(data.results || data)).finally(() => setLoading(false));
  }, [search]);

  const handleToggle = async (user) => {
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
      setUsers(users.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch { toast.error('Failed to update user.'); }
  };

  const filtered = activeTab === 'all' ? users : users.filter((u) => u.role === activeTab);
  const roleColor = { farmer: 'success', supplier: 'ocean', admin: 'coral' };

  return (
    <div className="space-y-6">
      <SectionHeader title="User Management" subtitle="View and manage all platform users" />

      <div className="flex gap-3 flex-wrap items-center">
        <Tabs tabs={[
          { id: 'all', label: 'All' }, { id: 'farmer', label: 'Farmers' },
          { id: 'supplier', label: 'Suppliers' }, { id: 'admin', label: 'Admins' },
        ]} active={activeTab} onChange={setActiveTab} />
        <Input placeholder="Search users…" icon={Search} value={search}
          onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-48" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={36} /></div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E6EDF1] dark:border-[#233340]">
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-6 py-4">User</th>
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">Role</th>
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">Joined</th>
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">Status</th>
                  <th className="text-right text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[#F4F8FA] dark:border-[#1A2733] last:border-0 hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">{u.full_name}</p>
                      <p className="text-xs text-[#9FB2BE] dark:text-[#5C7384]">{u.email}</p>
                    </td>
                    <td className="px-4 py-4"><Badge variant={roleColor[u.role] || 'default'}>{u.role}</Badge></td>
                    <td className="px-4 py-4 text-sm text-[#5C7384] dark:text-[#93A4AF]">{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant={u.is_active ? 'ghost' : 'success'} size="sm" onClick={() => handleToggle(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="py-12 text-center text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] text-sm">No users found.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

export function AdminSpeciesPage() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: '', scientific_name: '', habitat: '', water_type: 'freshwater',
    growth_stage: 'fingerling', description: '',
    min_protein_requirement: '', max_protein_requirement: '',
    min_fat_requirement: '', max_fat_requirement: '',
    min_fiber_requirement: 0, max_fiber_requirement: 10,
    min_moisture_requirement: 0, max_moisture_requirement: 15,
    optimal_temp_min: 20, optimal_temp_max: 30,
    optimal_ph_min: 6.5, optimal_ph_max: 8.5, optimal_do_min: 5.0,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    speciesApi.list({ page_size: 100 }).then(({ data }) => setSpecies(data.results || data)).finally(() => setLoading(false));
  };

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setModal(true); };
  const openEdit = (s) => { setEditTarget(s); setForm({ ...emptyForm, ...s }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) { await speciesApi.update(editTarget.id, form); toast.success('Species updated!'); }
      else { await speciesApi.create(form); toast.success('Species created!'); }
      setModal(false); load();
    } catch { toast.error('Save failed. Check your inputs.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try { await speciesApi.delete(s.id); toast.success('Species deleted.'); load(); }
    catch { toast.error('Could not delete.'); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <SectionHeader title="Species Management" subtitle="Add and manage fish species in the database"
        action={<Button variant="ocean" icon={Plus} onClick={openCreate}>Add Species</Button>} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={36} /></div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E6EDF1] dark:border-[#233340]">
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-6 py-4">Species</th>
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">Water Type</th>
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">Growth Stage</th>
                  <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">Protein Req.</th>
                  <th className="text-right text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {species.map((s) => (
                  <tr key={s.id} className="border-b border-[#F4F8FA] dark:border-[#1A2733] last:border-0 hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">{s.name}</p>
                      {s.scientific_name && <p className="text-xs italic text-[#9FB2BE] dark:text-[#5C7384]">{s.scientific_name}</p>}
                    </td>
                    <td className="px-4 py-4"><Badge variant={s.water_type}>{s.water_type}</Badge></td>
                    <td className="px-4 py-4 text-sm text-[#5C7384] dark:text-[#93A4AF] capitalize">{s.growth_stage}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#0E4561] dark:text-[#6FB6D6]">
                      {s.min_protein_requirement}–{s.max_protein_requirement}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit Species' : 'Add New Species'} width="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Common name *" value={form.name} onChange={set('name')} required />
            <Input label="Scientific name" value={form.scientific_name} onChange={set('scientific_name')} />
          </div>
          <Input label="Habitat" value={form.habitat} onChange={set('habitat')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Water type" value={form.water_type} onChange={set('water_type')}>
              <option value="freshwater">Freshwater</option>
              <option value="saltwater">Saltwater</option>
              <option value="brackish">Brackish</option>
            </Select>
            <Select label="Growth stage" value={form.growth_stage} onChange={set('growth_stage')}>
              <option value="fry">Fry</option>
              <option value="fingerling">Fingerling</option>
              <option value="juvenile">Juvenile</option>
              <option value="sub_adult">Sub-adult</option>
              <option value="adult">Adult</option>
            </Select>
          </div>
          <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide pt-1">Protein Requirements (%)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min protein *" type="number" step="0.1" value={form.min_protein_requirement} onChange={set('min_protein_requirement')} required />
            <Input label="Max protein *" type="number" step="0.1" value={form.max_protein_requirement} onChange={set('max_protein_requirement')} required />
          </div>
          <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide pt-1">Fat Requirements (%)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min fat *" type="number" step="0.1" value={form.min_fat_requirement} onChange={set('min_fat_requirement')} required />
            <Input label="Max fat *" type="number" step="0.1" value={form.max_fat_requirement} onChange={set('max_fat_requirement')} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" variant="ocean" className="flex-1" loading={saving}>
              {editTarget ? 'Save Changes' : 'Create Species'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
