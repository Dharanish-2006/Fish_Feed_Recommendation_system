import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Wheat, AlertCircle } from "lucide-react";
import { feedsApi } from "../../api";
import {
  Card,
  Badge,
  Input,
  Select,
  SectionHeader,
  EmptyState,
  Spinner,
  Modal,
  staggerContainer,
  staggerItem,
} from "../../components/ui";

export function FarmerFeedsPage() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (formFilter) params.feed_form = formFilter;
    feedsApi
      .list(params)
      .then(({ data }) => setFeeds(data.results || data))
      .finally(() => setLoading(false));
  }, [search, formFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Browse Feeds"
        subtitle="Explore all available fish feed products"
      />

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search feeds…"
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48"
        />
        <Select
          value={formFilter}
          onChange={(e) => setFormFilter(e.target.value)}
          className="w-44"
        >
          <option value="">All forms</option>
          <option value="pellet">Pellet</option>
          <option value="crumble">Crumble</option>
          <option value="powder">Powder</option>
          <option value="flake">Flake</option>
          <option value="extruded">Extruded</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={36} />
        </div>
      ) : feeds.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wheat}
            title="No feeds found"
            description="Try different search terms."
          />
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {feeds.map((f) => (
            <motion.div key={f.id} variants={staggerItem}>
              <Card hover onClick={() => setSelected(f)}>
                <div className="flex items-start justify-between mb-3">
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
                  <Badge variant="ocean">{f.feed_form}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-[#E3F1F7] dark:bg-[#123347] rounded-xl p-2.5 text-center">
                    <p className="text-[11px] text-[#5C7384] dark:text-[#93A4AF] font-medium">
                      Protein
                    </p>
                    <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6]">
                      {f.protein_percentage}%
                    </p>
                  </div>
                  <div className="bg-[#FFEAE3] dark:bg-[#3A241D] rounded-xl p-2.5 text-center">
                    <p className="text-[11px] text-[#5C7384] dark:text-[#93A4AF] font-medium">
                      Fat
                    </p>
                    <p className="font-bold text-[#E8552F] dark:text-[#FF8A6E]">
                      {f.fat_percentage}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3.5">
                  <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] truncate">
                    by {f.supplier_name}
                  </p>
                  <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] shrink-0">
                    ${Number(f.price_per_kg).toFixed(2)}
                    <span className="text-xs font-normal text-[#9FB2BE] dark:text-[#5C7384]">
                      /kg
                    </span>
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ""}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="ocean">{selected.feed_form}</Badge>
              {!selected.is_available && (
                <Badge variant="danger" icon={AlertCircle}>
                  Out of stock
                </Badge>
              )}
            </div>
            {selected.description && (
              <p className="text-sm text-[#5C7384] dark:text-[#93A4AF]">
                {selected.description}
              </p>
            )}
            <div className="bg-[#F4F8FA] dark:bg-[#0F1B25] rounded-2xl p-4">
              <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide mb-3">
                Nutritional Composition
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Protein", selected.protein_percentage],
                  ["Fat", selected.fat_percentage],
                  ["Fiber", selected.fiber_percentage],
                  ["Moisture", selected.moisture_percentage],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-white dark:bg-[#14202B] rounded-xl p-2.5 text-center border border-[#E6EDF1] dark:border-[#233340]"
                  >
                    <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
                      {k}
                    </p>
                    <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6]">
                      {v}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#E3F1F7] dark:bg-[#123347] rounded-2xl">
              <div>
                <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
                  Price per kg
                </p>
                <p className="text-2xl font-bold text-[#0E4561] dark:text-[#6FB6D6] font-display">
                  ${Number(selected.price_per_kg).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#5C7384]">Stock</p>
                <p className="font-bold text-[#14202B] dark:text-[#EEF3F6]">
                  {selected.stock_quantity_kg} kg
                </p>
              </div>
            </div>
            <p className="text-sm text-[#5C7384] dark:text-[#93A4AF]">
              Supplied by{" "}
              <span className="font-semibold text-[#14202B] dark:text-[#EEF3F6]">
                {selected.supplier_name}
              </span>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
