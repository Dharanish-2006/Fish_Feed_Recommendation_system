import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wheat,
  CheckCircle2,
  AlertTriangle,
  Star,
  Plus,
  Package,
  Boxes,
} from "lucide-react";
import { feedsApi, analyticsApi, speciesApi } from "../../api";
import {
  Card,
  StatCard,
  Button,
  Input,
  Select,
  Modal,
  SectionHeader,
  Badge,
  EmptyState,
  Spinner,
  Alert,
} from "../../components/ui";
import toast from "react-hot-toast";

export function SupplierDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .supplierDashboard()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner size={36} />
      </div>
    );

  return (
    <div className="space-y-7">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E4561] via-[#0A3247] to-[#061E2E] p-8 text-white"
      >
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#2389B5]/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-white/55 text-sm">Supplier Portal</p>
          <h1 className="text-[28px] font-bold mt-0.5 font-display tracking-tight">
            Product Overview
          </h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={data?.total_products}
          icon={Wheat}
          color="ocean"
        />
        <StatCard
          label="Available"
          value={data?.available_products}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          label="Low Stock"
          value={data?.low_stock_products}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          label="Top Feed"
          value={
            data?.top_recommended_feeds?.[0]?.feed__name?.split(" ")[0] || "—"
          }
          icon={Star}
          color="coral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.low_stock_list?.length > 0 && (
          <Card>
            <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-4 flex items-center gap-2">
              <AlertTriangle size={17} className="text-[#D89A2A]" /> Low Stock
              Alerts
            </h3>
            <div className="space-y-2">
              {data.low_stock_list.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-[#FCF3DF] rounded-xl border border-[#F2DBA0]"
                >
                  <p className="font-semibold text-sm text-[#8A6112]">
                    {f.name}
                  </p>
                  <Badge variant="warning">{f.stock_kg} kg left</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-4 flex items-center gap-2">
            <Star size={17} className="text-[#FF6B4A]" /> Top Recommended Feeds
          </h3>
          {data?.top_recommended_feeds?.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No data yet"
              description="Recommendations will appear here."
            />
          ) : (
            <div className="space-y-3">
              {data?.top_recommended_feeds?.map((f, i) => (
                <div key={f.feed__id} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#E3F1F7] text-[#0E4561] dark:text-[#6FB6D6] flex items-center justify-center text-[13px] font-extrabold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13.5px] text-[#14202B] dark:text-[#EEF3F6] truncate">
                      {f.feed__name}
                    </p>
                    <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
                      {f.times}× recommended · avg {Math.round(f.avg_score)}%
                      match
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function SupplierFeedsPage() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: "",
    brand: "",
    feed_form: "pellet",
    description: "",
    protein_percentage: "",
    fat_percentage: "",
    fiber_percentage: "",
    moisture_percentage: "",
    ash_percentage: "",
    energy_kcal_per_kg: "",
    price_per_kg: "",
    stock_quantity_kg: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setLoading(true);
    feedsApi
      .myFeeds()
      .then(({ data }) => setFeeds(data.results || data))
      .finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModal(true);
  };
  const openEdit = (feed) => {
    setEditTarget(feed);
    setForm({
      ...feed,
      fiber_percentage: feed.fiber_percentage || "",
      moisture_percentage: feed.moisture_percentage || "",
      ash_percentage: feed.ash_percentage || "",
      energy_kcal_per_kg: feed.energy_kcal_per_kg || "",
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await feedsApi.update(editTarget.id, form);
        toast.success("Product updated!");
      } else {
        await feedsApi.create(form);
        toast.success("Product created!");
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feed) => {
    if (!confirm(`Delete "${feed.name}"?`)) return;
    try {
      await feedsApi.delete(feed.id);
      toast.success("Product deleted.");
      load();
    } catch {
      toast.error("Could not delete.");
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Feed Products"
        subtitle="Manage your fish feed catalog"
        action={
          <Button variant="ocean" icon={Plus} onClick={openCreate}>
            New Product
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={36} />
        </div>
      ) : feeds.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wheat}
            title="No products yet"
            description="Add your first feed product to get listed in recommendations."
            action={
              <Button variant="ocean" size="sm" onClick={openCreate}>
                Add Product
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeds.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display truncate">
                    {f.name}
                  </p>
                  {f.brand && (
                    <p className="text-xs text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] mt-0.5">
                      {f.brand}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant={f.is_available ? "success" : "danger"}>
                    {f.is_available ? "Live" : "Off"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3">
                <div className="bg-[#E3F1F7] dark:bg-[#123347] rounded-lg p-2 text-center">
                  <p className="text-[10px] text-[#5C7384] dark:text-[#93A4AF] font-medium">
                    Protein
                  </p>
                  <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6] text-[13px]">
                    {f.protein_percentage}%
                  </p>
                </div>
                <div className="bg-[#FFEAE3] dark:bg-[#3A241D] rounded-lg p-2 text-center">
                  <p className="text-[10px] text-[#5C7384] dark:text-[#93A4AF] font-medium">
                    Fat
                  </p>
                  <p className="font-bold text-[#E8552F] text-[13px]">
                    {f.fat_percentage}%
                  </p>
                </div>
                <div className="bg-[#F4F8FA] dark:bg-[#0F1B25] rounded-lg p-2 text-center">
                  <p className="text-[10px] text-[#5C7384] dark:text-[#93A4AF] font-medium">
                    Stock
                  </p>
                  <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13px]">
                    {f.stock_quantity_kg}kg
                  </p>
                </div>
              </div>

              <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6] mb-3">
                ${Number(f.price_per_kg).toFixed(2)}
                <span className="text-xs font-normal text-[#9FB2BE] dark:text-[#5C7384]">
                  /kg
                </span>
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(f)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(f)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editTarget ? "Edit Product" : "New Feed Product"}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product name *"
              value={form.name}
              onChange={set("name")}
              required
            />
            <Input label="Brand" value={form.brand} onChange={set("brand")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Feed form"
              value={form.feed_form}
              onChange={set("feed_form")}
            >
              <option value="pellet">Pellet</option>
              <option value="crumble">Crumble</option>
              <option value="powder">Powder</option>
              <option value="flake">Flake</option>
              <option value="extruded">Extruded</option>
            </Select>
            <Input
              label="Price per kg ($) *"
              type="number"
              step="0.01"
              value={form.price_per_kg}
              onChange={set("price_per_kg")}
              required
            />
          </div>

          <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide pt-1">
            Nutritional Composition (%)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Protein *"
              type="number"
              step="0.1"
              value={form.protein_percentage}
              onChange={set("protein_percentage")}
              required
            />
            <Input
              label="Fat *"
              type="number"
              step="0.1"
              value={form.fat_percentage}
              onChange={set("fat_percentage")}
              required
            />
            <Input
              label="Fiber"
              type="number"
              step="0.1"
              value={form.fiber_percentage}
              onChange={set("fiber_percentage")}
            />
            <Input
              label="Moisture"
              type="number"
              step="0.1"
              value={form.moisture_percentage}
              onChange={set("moisture_percentage")}
            />
            <Input
              label="Ash"
              type="number"
              step="0.1"
              value={form.ash_percentage}
              onChange={set("ash_percentage")}
            />
            <Input
              label="Energy (kcal/kg)"
              type="number"
              value={form.energy_kcal_per_kg}
              onChange={set("energy_kcal_per_kg")}
            />
          </div>

          <Input
            label="Initial stock (kg)"
            type="number"
            step="0.1"
            value={form.stock_quantity_kg}
            onChange={set("stock_quantity_kg")}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ocean"
              className="flex-1"
              loading={saving}
            >
              {editTarget ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export function InventoryPage() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [target, setTarget] = useState(null);
  const [action, setAction] = useState("add");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    feedsApi
      .myFeeds()
      .then(({ data }) => setFeeds(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  const openUpdate = (feed, act) => {
    setTarget(feed);
    setAction(act);
    setQty("");
    setNotes("");
    setModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await feedsApi.updateInventory(target.id, {
        action,
        quantity_kg: Number(qty),
        notes,
      });
      toast.success(
        `Stock ${action === "add" ? "added" : action === "sell" ? "sold" : "adjusted"}!`,
      );
      setModal(false);
      const { data } = await feedsApi.myFeeds();
      setFeeds(data.results || data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update inventory.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner size={36} />
      </div>
    );

  const totalStock = feeds.reduce((s, f) => s + (f.stock_quantity_kg || 0), 0);
  const lowStock = feeds.filter((f) => f.stock_quantity_kg < 50);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inventory Management"
        subtitle="Track and update your stock levels"
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Stock"
          value={`${totalStock.toFixed(0)} kg`}
          icon={Boxes}
          color="ocean"
        />
        <StatCard
          label="Products"
          value={feeds.length}
          icon={Wheat}
          color="success"
        />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          icon={AlertTriangle}
          color="warning"
        />
      </div>

      {lowStock.length > 0 && (
        <Alert type="warning" icon={AlertTriangle}>
          {lowStock.length} product{lowStock.length > 1 ? "s are" : " is"}{" "}
          running low on stock.
        </Alert>
      )}

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E6EDF1] dark:border-[#233340]">
                <th className="text-left text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-6 py-4">
                  Product
                </th>
                <th className="text-right text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">
                  Stock
                </th>
                <th className="text-right text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-4 py-4">
                  Status
                </th>
                <th className="text-right text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-[#F4F8FA] dark:border-[#1A2733] last:border-0 hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">
                      {f.name}
                    </p>
                    {f.brand && (
                      <p className="text-xs text-[#9FB2BE] dark:text-[#5C7384]">
                        {f.brand}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`font-bold text-sm ${f.stock_quantity_kg < 50 ? "text-[#D89A2A]" : "text-[#14202B] dark:text-[#EEF3F6]"}`}
                    >
                      {f.stock_quantity_kg} kg
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Badge
                      variant={
                        f.is_available
                          ? f.stock_quantity_kg < 50
                            ? "warning"
                            : "success"
                          : "danger"
                      }
                    >
                      {f.is_available
                        ? f.stock_quantity_kg < 50
                          ? "Low"
                          : "OK"
                        : "Off"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ocean"
                        size="sm"
                        onClick={() => openUpdate(f, "add")}
                      >
                        + Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdate(f, "sell")}
                      >
                        − Sell
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUpdate(f, "adjust")}
                      >
                        Adjust
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`${action === "add" ? "Add Stock" : action === "sell" ? "Record Sale" : "Adjust Stock"} — ${target?.name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <p className="text-sm text-[#5C7384] dark:text-[#93A4AF]">
            Current stock:{" "}
            <span className="font-bold text-[#14202B] dark:text-[#EEF3F6]">
              {target?.stock_quantity_kg} kg
            </span>
          </p>
          <Input
            label={action === "adjust" ? "Set stock to (kg)" : "Quantity (kg)"}
            type="number"
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.0"
            required
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Delivery from supplier"
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ocean"
              className="flex-1"
              loading={saving}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
