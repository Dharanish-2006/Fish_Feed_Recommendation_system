import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { recommendationsApi, farmsApi } from "../../api";
import {
  Card,
  Button,
  Select,
  ScoreRing,
  SectionHeader,
  Badge,
  EmptyState,
  Spinner,
  Alert,
  PageLoader,
  fadeUp,
} from "../../components/ui";
import toast from "react-hot-toast";

function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false);
  const results = rec.results || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide">
              {rec.fish_stock_info?.farm} · {rec.fish_stock_info?.species}
            </p>
            <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mt-0.5">
              Feed Recommendation
            </p>
            <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] mt-1">
              Group:{" "}
              <span className="font-semibold capitalize text-[#0E4561] dark:text-[#6FB6D6]">
                {rec.predicted_feed_group?.replace(/_/g, " ")}
              </span>
              {" · "}
              {new Date(rec.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge
            variant={
              rec.status === "completed"
                ? "success"
                : rec.status === "failed"
                  ? "danger"
                  : "default"
            }
          >
            {rec.status}
          </Badge>
        </div>

        {rec.status === "failed" && (
          <div className="mb-4">
            <Alert type="error" icon={AlertTriangle}>
              Recommendation failed: {rec.error_message || "Unknown error"}
            </Alert>
          </div>
        )}

        <div className="space-y-2.5">
          {results.slice(0, expanded ? results.length : 3).map((result, i) => (
            <div
              key={result.id || i}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                i === 0
                  ? "bg-gradient-to-r from-[#E3F1F7] to-[#F1F8FB] ring-1 ring-[#0E4561]/10 dark:from-[#123347] dark:to-[#0F2536] dark:ring-[#3FA3CC]/20"
                  : "hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                  i === 0
                    ? "bg-[#FF6B4A] text-white"
                    : i === 1
                      ? "bg-[#9FB2BE] text-white"
                      : "bg-[#E6EDF1] dark:bg-[#233340] text-[#5C7384] dark:text-[#93A4AF]"
                }`}
              >
                {i + 1}
              </div>

              <ScoreRing
                score={Math.round(result.match_percentage)}
                size={56}
                strokeWidth={5}
              />

              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] text-[13.5px]">
                  {result.feed_name}
                </p>
                {result.feed_brand && (
                  <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
                    {result.feed_brand} · {result.supplier_name}
                  </p>
                )}
                <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] mt-1 line-clamp-2">
                  {result.explanation}
                </p>
              </div>

              <div className="text-right shrink-0">
                {result.price_per_kg && (
                  <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6] text-sm flex items-center gap-0.5 justify-end">
                    <DollarSign size={12} />
                    {Number(result.price_per_kg).toFixed(2)}/kg
                  </p>
                )}
                <p className="text-[11px] text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] mt-0.5">
                  Protein: {result.composition_snapshot?.protein}%
                </p>
                <p className="text-[11px] text-[#9FB2BE] dark:text-[#5C7384]">
                  Fat: {result.composition_snapshot?.fat}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {results.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-[#0E4561] dark:text-[#6FB6D6] font-semibold py-2.5 rounded-xl hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {expanded ? "Show less" : `Show ${results.length - 3} more options`}
          </button>
        )}
      </Card>
    </motion.div>
  );
}

export default function RecommendationsPage() {
  const [searchParams] = useSearchParams();
  const preselectedStockId = searchParams.get("stock");

  const [farms, setFarms] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState(
    preselectedStockId || "",
  );
  const [recommendations, setRecommendations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stocksLoading, setStocksLoading] = useState(false);

  useEffect(() => {
    Promise.all([farmsApi.list(), recommendationsApi.list({ page_size: 20 })])
      .then(([farmsRes, recsRes]) => {
        const farmData = farmsRes.data.results || farmsRes.data;
        setFarms(farmData);
        setRecommendations(recsRes.data.results || recsRes.data);
        if (preselectedStockId && farmData.length > 0) {
          farmData.forEach(async (farm) => {
            const { data } = await farmsApi.stocks(farm.id);
            const s = (data.results || data).find(
              (st) => st.id === Number(preselectedStockId),
            );
            if (s) {
              setSelectedFarmId(String(farm.id));
              setStocks(data.results || data);
            }
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFarmChange = async (farmId) => {
    setSelectedFarmId(farmId);
    setSelectedStockId("");
    if (!farmId) {
      setStocks([]);
      return;
    }
    setStocksLoading(true);
    try {
      const { data } = await farmsApi.stocks(farmId);
      setStocks(data.results || data);
    } finally {
      setStocksLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedStockId) {
      toast.error("Please select a fish stock first.");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await recommendationsApi.generate(
        Number(selectedStockId),
      );
      setRecommendations([data, ...recommendations]);
      toast.success("Recommendation ready!");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to generate recommendation.",
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Feed Recommendations"
        subtitle="Get AI-powered feed recommendations based on your fish stocks"
      />

      <motion.div {...fadeUp}>
        <Card>
          <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-4">
            Generate New Recommendation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <Select
              label="Farm"
              value={selectedFarmId}
              onChange={(e) => handleFarmChange(e.target.value)}
            >
              <option value="">Select a farm…</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>

            <Select
              label="Fish Stock"
              value={selectedStockId}
              onChange={(e) => setSelectedStockId(e.target.value)}
              disabled={!selectedFarmId || stocksLoading}
            >
              <option value="">
                {stocksLoading ? "Loading stocks…" : "Select a fish stock…"}
              </option>
              {stocks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.species_name} — {s.growth_stage} ({s.quantity} fish)
                </option>
              ))}
            </Select>

            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              loading={generating}
              disabled={!selectedStockId}
              icon={Sparkles}
            >
              {generating ? "Analysing…" : "Get Recommendation"}
            </Button>
          </div>

          {farms.length === 0 && (
            <div className="mt-4">
              <Alert type="info">
                You don't have any farms yet.{" "}
                <Link
                  to="/farmer/farms"
                  className="font-bold underline inline-flex items-center gap-1"
                >
                  Add a farm first <ArrowRight size={13} />
                </Link>
              </Alert>
            </div>
          )}
        </Card>
      </motion.div>

      {recommendations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description="Select a farm and fish stock above to get your first feed recommendation."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#5C7384] dark:text-[#93A4AF]">
            {recommendations.length} recommendation
            {recommendations.length !== 1 ? "s" : ""}
          </p>
          <AnimatePresence>
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
