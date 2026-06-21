import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Ruler,
  Plus,
  Trash2,
  Sparkles,
  X,
  Fish,
  Sailboat,
} from "lucide-react";
import { farmsApi, speciesApi } from "../../api";
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  SectionHeader,
  Badge,
  Spinner,
  staggerContainer,
  staggerItem,
} from "../../components/ui";
import toast from "react-hot-toast";

function FarmCard({ farm, selected, onSelect, onDelete }) {
  return (
    <motion.div variants={staggerItem}>
      <Card
        hover
        onClick={() => onSelect(farm)}
        className={`cursor-pointer transition-all ${selected ? "ring-2 ring-[#0E4561]" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display">
              {farm.name}
            </p>
            {farm.location && (
              <p className="text-[13px] text-[#5C7384] dark:text-[#93A4AF] mt-1 flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0" />{" "}
                <span className="truncate">{farm.location}</span>
              </p>
            )}
            {farm.total_area_hectares > 0 && (
              <p className="text-[13px] text-[#5C7384] dark:text-[#93A4AF] mt-0.5 flex items-center gap-1.5">
                <Ruler size={13} /> {farm.total_area_hectares} ha
              </p>
            )}
          </div>
          <Badge variant="ocean">{farm.fish_stocks_count || 0} stocks</Badge>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="ocean"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(farm);
            }}
          >
            Manage Stocks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(farm);
            }}
          />
        </div>
      </Card>
    </motion.div>
  );
}

function StockCard({ stock, onDelete, onRecommend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl border border-[#E6EDF1] dark:border-[#233340] hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors"
    >
      <span className="w-11 h-11 rounded-xl bg-[#E3F1F7] dark:bg-[#123347] flex items-center justify-center shrink-0">
        <Fish
          size={20}
          className="text-[#0E4561] dark:text-[#6FB6D6]"
          strokeWidth={2}
        />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">
          {stock.species_name}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <Badge variant={stock.water_type}>{stock.water_type}</Badge>
          <Badge variant="default">{stock.growth_stage}</Badge>
          <Badge variant="ocean">{stock.quantity?.toLocaleString()} fish</Badge>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => onRecommend(stock)}
        >
          Feed
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          onClick={() => onDelete(stock)}
        />
      </div>
    </motion.div>
  );
}

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stocksLoading, setStocksLoading] = useState(false);

  const [farmModal, setFarmModal] = useState(false);
  const [stockModal, setStockModal] = useState(false);

  const [farmForm, setFarmForm] = useState({
    name: "",
    location: "",
    total_area_hectares: "",
  });
  const [stockForm, setStockForm] = useState({
    species: "",
    quantity: "",
    average_weight_grams: "",
    growth_stage: "fingerling",
    water_type: "freshwater",
    water_temperature: "",
    water_ph: "",
    dissolved_oxygen: "",
    water_condition: "good",
    stocking_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFarms();
    speciesApi
      .list({ page_size: 100 })
      .then(({ data }) => setSpecies(data.results || data));
  }, []);

  const loadFarms = async () => {
    setLoading(true);
    try {
      const { data } = await farmsApi.list();
      setFarms(data.results || data);
    } finally {
      setLoading(false);
    }
  };

  const selectFarm = async (farm) => {
    setSelectedFarm(farm);
    setStocksLoading(true);
    try {
      const { data } = await farmsApi.stocks(farm.id);
      setStocks(data.results || data);
    } finally {
      setStocksLoading(false);
    }
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await farmsApi.create(farmForm);
      toast.success("Farm created!");
      setFarmModal(false);
      setFarmForm({ name: "", location: "", total_area_hectares: "" });
      loadFarms();
    } catch {
      toast.error("Failed to create farm.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFarm = async (farm) => {
    if (!confirm(`Delete farm "${farm.name}"?`)) return;
    try {
      await farmsApi.delete(farm.id);
      toast.success("Farm deleted.");
      if (selectedFarm?.id === farm.id) setSelectedFarm(null);
      loadFarms();
    } catch {
      toast.error("Could not delete farm.");
    }
  };

  const handleCreateStock = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await farmsApi.createStock(selectedFarm.id, stockForm);
      toast.success("Fish stock added!");
      setStockModal(false);
      setStockForm({
        species: "",
        quantity: "",
        average_weight_grams: "",
        growth_stage: "fingerling",
        water_type: "freshwater",
        water_temperature: "",
        water_ph: "",
        dissolved_oxygen: "",
        water_condition: "good",
        stocking_date: new Date().toISOString().split("T")[0],
      });
      selectFarm(selectedFarm);
    } catch {
      toast.error("Failed to add stock.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStock = async (stock) => {
    if (!confirm("Remove this fish stock?")) return;
    try {
      await farmsApi.deleteStock(stock.id);
      toast.success("Stock removed.");
      selectFarm(selectedFarm);
    } catch {
      toast.error("Could not delete stock.");
    }
  };

  const handleRecommend = (stock) => {
    window.location.href = `/farmer/recommend?stock=${stock.id}`;
  };

  const setF = (k) => (e) => setFarmForm({ ...farmForm, [k]: e.target.value });
  const setS = (k) => (e) =>
    setStockForm({ ...stockForm, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Farms"
        subtitle="Manage your farms and fish stocks"
        action={
          <Button
            variant="ocean"
            icon={Plus}
            onClick={() => setFarmModal(true)}
          >
            New Farm
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="lg:col-span-1 space-y-3"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : farms.length === 0 ? (
            <Card>
              <EmptyState
                icon={Sailboat}
                title="No farms yet"
                description="Create your first farm to get started."
                action={
                  <Button
                    variant="ocean"
                    size="sm"
                    onClick={() => setFarmModal(true)}
                  >
                    Create Farm
                  </Button>
                }
              />
            </Card>
          ) : (
            farms.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                selected={selectedFarm?.id === farm.id}
                onSelect={selectFarm}
                onDelete={handleDeleteFarm}
              />
            ))
          )}
        </motion.div>

        <div className="lg:col-span-2">
          {!selectedFarm ? (
            <Card>
              <EmptyState
                icon={Fish}
                title="Select a farm"
                description="Choose a farm on the left to manage its fish stocks."
              />
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display">
                    {selectedFarm.name}
                  </h3>
                  <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] mt-0.5">
                    Fish Stocks
                  </p>
                </div>
                <Button
                  variant="ocean"
                  size="sm"
                  icon={Plus}
                  onClick={() => setStockModal(true)}
                >
                  Add Stock
                </Button>
              </div>

              {stocksLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : stocks.length === 0 ? (
                <EmptyState
                  icon={Fish}
                  title="No fish stocks"
                  description="Add your first fish stock to this farm."
                  action={
                    <Button
                      variant="ocean"
                      size="sm"
                      onClick={() => setStockModal(true)}
                    >
                      Add Stock
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {stocks.map((stock) => (
                      <StockCard
                        key={stock.id}
                        stock={stock}
                        onDelete={handleDeleteStock}
                        onRecommend={handleRecommend}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={farmModal}
        onClose={() => setFarmModal(false)}
        title="Create New Farm"
      >
        <form onSubmit={handleCreateFarm} className="space-y-4">
          <Input
            label="Farm name *"
            value={farmForm.name}
            onChange={setF("name")}
            placeholder="e.g. Laguna Fish Farm"
            required
          />
          <Input
            label="Location"
            value={farmForm.location}
            onChange={setF("location")}
            placeholder="e.g. Laguna, Philippines"
          />
          <Input
            label="Total area (hectares)"
            type="number"
            step="0.1"
            value={farmForm.total_area_hectares}
            onChange={setF("total_area_hectares")}
            placeholder="0.0"
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setFarmModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ocean"
              className="flex-1"
              loading={saving}
            >
              Create Farm
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={stockModal}
        onClose={() => setStockModal(false)}
        title="Add Fish Stock"
        width="max-w-2xl"
      >
        <form onSubmit={handleCreateStock} className="space-y-4">
          <Select
            label="Fish species *"
            value={stockForm.species}
            onChange={setS("species")}
            required
          >
            <option value="">Select species…</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity (fish) *"
              type="number"
              value={stockForm.quantity}
              onChange={setS("quantity")}
              placeholder="500"
              required
            />
            <Input
              label="Avg. weight (g)"
              type="number"
              step="0.1"
              value={stockForm.average_weight_grams}
              onChange={setS("average_weight_grams")}
              placeholder="15.0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Growth stage *"
              value={stockForm.growth_stage}
              onChange={setS("growth_stage")}
            >
              <option value="fry">Fry (0–30 days)</option>
              <option value="fingerling">Fingerling (1–3 mo)</option>
              <option value="juvenile">Juvenile (3–6 mo)</option>
              <option value="sub_adult">Sub-adult (6–12 mo)</option>
              <option value="adult">Adult (12+ mo)</option>
            </Select>
            <Select
              label="Water type *"
              value={stockForm.water_type}
              onChange={setS("water_type")}
            >
              <option value="freshwater">Freshwater</option>
              <option value="saltwater">Saltwater</option>
              <option value="brackish">Brackish</option>
            </Select>
          </div>

          <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide pt-1">
            Water Conditions (optional)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Temperature (°C)"
              type="number"
              step="0.1"
              value={stockForm.water_temperature}
              onChange={setS("water_temperature")}
              placeholder="28"
            />
            <Input
              label="pH"
              type="number"
              step="0.1"
              value={stockForm.water_ph}
              onChange={setS("water_ph")}
              placeholder="7.5"
            />
            <Input
              label="DO (mg/L)"
              type="number"
              step="0.1"
              value={stockForm.dissolved_oxygen}
              onChange={setS("dissolved_oxygen")}
              placeholder="6.0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Water condition"
              value={stockForm.water_condition}
              onChange={setS("water_condition")}
            >
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
            <Input
              label="Stocking date"
              type="date"
              value={stockForm.stocking_date}
              onChange={setS("stocking_date")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setStockModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ocean"
              className="flex-1"
              loading={saving}
            >
              Add Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
