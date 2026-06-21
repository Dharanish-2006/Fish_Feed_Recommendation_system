import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Fish, ClipboardList } from 'lucide-react';
import { farmsApi, feedsApi } from '../../api';
import { Card, Button, Input, Select, Modal, SectionHeader, EmptyState, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function FeedingHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [farms, setFarms] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  const [form, setForm] = useState({
    fish_stock: '', feed: '', quantity_kg: '',
    feeding_date: new Date().toISOString().split('T')[0], notes: '',
  });

  useEffect(() => {
    Promise.all([
      farmsApi.feedingHistory({ page_size: 50 }),
      farmsApi.list(),
      feedsApi.list({ page_size: 100 }),
    ]).then(([histRes, farmRes, feedRes]) => {
      setHistory(histRes.data.results || histRes.data);
      setFarms(farmRes.data.results || farmRes.data);
      setFeeds(feedRes.data.results || feedRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleFarmSelect = async (farmId) => {
    setSelectedFarmId(farmId);
    setForm((f) => ({ ...f, fish_stock: '' }));
    if (!farmId) { setStocks([]); return; }
    const { data } = await farmsApi.stocks(farmId);
    setStocks(data.results || data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await farmsApi.addFeeding(form);
      toast.success('Feeding record added!');
      setModal(false);
      setForm({ fish_stock: '', feed: '', quantity_kg: '', feeding_date: new Date().toISOString().split('T')[0], notes: '' });
      setSelectedFarmId(''); setStocks([]);
      const { data } = await farmsApi.feedingHistory({ page_size: 50 });
      setHistory(data.results || data);
    } catch { toast.error('Failed to save feeding record.'); }
    finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const grouped = history.reduce((acc, item) => {
    (acc[item.feeding_date] = acc[item.feeding_date] || []).push(item);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-6">
      <SectionHeader title="Feeding History" subtitle="Track what you've fed your fish stocks"
        action={<Button variant="ocean" icon={Plus} onClick={() => setModal(true)}>Log Feeding</Button>} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={36} /></div>
      ) : history.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No feeding records" description="Start logging your feeding activity to build a history."
            action={<Button variant="ocean" size="sm" onClick={() => setModal(true)}>Log First Feeding</Button>} />
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-[#E6EDF1]" />
                <span className="text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-2">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <div className="h-px flex-1 bg-[#E6EDF1]" />
              </div>
              <div className="space-y-2.5">
                {grouped[date].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-[#E3F1F7] dark:bg-[#123347] flex items-center justify-center shrink-0">
                        <Fish size={18} className="text-[#0E4561] dark:text-[#6FB6D6]" strokeWidth={2} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13.5px] text-[#14202B] dark:text-[#EEF3F6]">{item.species_name || 'Fish Stock'}</p>
                        <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">{item.feed_name || 'Unknown feed'}</p>
                        {item.notes && <p className="text-xs text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] italic mt-0.5">{item.notes}</p>}
                      </div>
                      <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6]">{item.quantity_kg} kg</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Log Feeding">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Farm" value={selectedFarmId} onChange={(e) => handleFarmSelect(e.target.value)}>
            <option value="">Select a farm…</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
          <Select label="Fish Stock *" value={form.fish_stock} onChange={set('fish_stock')} required disabled={!selectedFarmId}>
            <option value="">Select stock…</option>
            {stocks.map((s) => <option key={s.id} value={s.id}>{s.species_name} — {s.growth_stage}</option>)}
          </Select>
          <Select label="Feed Used *" value={form.feed} onChange={set('feed')} required>
            <option value="">Select feed…</option>
            {feeds.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.protein_percentage}% protein)</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity (kg) *" type="number" step="0.1" value={form.quantity_kg} onChange={set('quantity_kg')} required />
            <Input label="Date *" type="date" value={form.feeding_date} onChange={set('feeding_date')} required />
          </div>
          <Input label="Notes" value={form.notes} onChange={set('notes')} placeholder="Optional notes…" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" variant="ocean" className="flex-1" loading={saving}>Save Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
