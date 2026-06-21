import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Fish, MapPin, Droplets, Thermometer } from "lucide-react";
import { speciesApi } from "../../api";
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

function SpeciesCard({ s, onClick }) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover onClick={() => onClick(s)} className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#E3F1F7] dark:bg-[#123347] flex items-center justify-center shrink-0">
          <Fish
            size={22}
            className="text-[#0E4561] dark:text-[#6FB6D6]"
            strokeWidth={2}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display truncate">
            {s.name}
          </p>
          {s.scientific_name && (
            <p className="text-xs italic text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] truncate mt-0.5">
              {s.scientific_name}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <Badge variant={s.water_type}>{s.water_type}</Badge>
            <Badge variant="default">{s.growth_stage}</Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function SpeciesPage() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [waterFilter, setWaterFilter] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const params = {};
    if (waterFilter) params.water_type = waterFilter;
    if (search) params.q = search;
    speciesApi
      .list(params)
      .then(({ data }) => setSpecies(data.results || data))
      .finally(() => setLoading(false));
  }, [search, waterFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Fish Species"
        subtitle="Browse species and their nutritional requirements"
      />

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search species…"
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48"
        />
        <Select
          value={waterFilter}
          onChange={(e) => setWaterFilter(e.target.value)}
          className="w-44"
        >
          <option value="">All water types</option>
          <option value="freshwater">Freshwater</option>
          <option value="saltwater">Saltwater</option>
          <option value="brackish">Brackish</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={36} />
        </div>
      ) : species.length === 0 ? (
        <Card>
          <EmptyState
            icon={Fish}
            title="No species found"
            description="Try adjusting your search or filters."
          />
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {species.map((s) => (
            <SpeciesCard key={s.id} s={s} onClick={setSelected} />
          ))}
        </motion.div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ""}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-4">
            {selected.scientific_name && (
              <p className="italic text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] text-sm">
                {selected.scientific_name}
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={selected.water_type}>{selected.water_type}</Badge>
              <Badge variant="default">{selected.growth_stage}</Badge>
            </div>
            {selected.habitat && (
              <p className="text-sm text-[#2B3D4D] dark:text-[#C7D3DA] flex items-center gap-1.5">
                <MapPin
                  size={14}
                  className="text-[#9FB2BE] dark:text-[#5C7384]"
                />{" "}
                {selected.habitat}
              </p>
            )}
            {selected.description && (
              <p className="text-sm text-[#5C7384] dark:text-[#93A4AF]">
                {selected.description}
              </p>
            )}

            <div className="bg-[#F4F8FA] dark:bg-[#0F1B25] rounded-2xl p-4">
              <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide mb-3">
                Nutritional Requirements
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  [
                    "Protein",
                    selected.min_protein_requirement,
                    selected.max_protein_requirement,
                  ],
                  [
                    "Fat",
                    selected.min_fat_requirement,
                    selected.max_fat_requirement,
                  ],
                  [
                    "Fiber",
                    selected.min_fiber_requirement,
                    selected.max_fiber_requirement,
                  ],
                  [
                    "Moisture",
                    selected.min_moisture_requirement,
                    selected.max_moisture_requirement,
                  ],
                ].map(([label, min, max]) => (
                  <div
                    key={label}
                    className="bg-white dark:bg-[#14202B] rounded-xl p-3 border border-[#E6EDF1] dark:border-[#233340]"
                  >
                    <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
                      {label}
                    </p>
                    <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6]">
                      {min}–{max}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#E3F1F7] dark:bg-[#123347] rounded-2xl p-4">
              <p className="text-[11px] font-bold text-[#5C7384] dark:text-[#93A4AF] uppercase tracking-wide mb-3">
                Optimal Water Conditions
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white dark:bg-[#14202B] rounded-xl p-3 text-center border border-[#E6EDF1] dark:border-[#233340]">
                  <Thermometer
                    size={14}
                    className="text-[#0E4561] dark:text-[#6FB6D6] mx-auto mb-1"
                  />
                  <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6] text-sm">
                    {selected.optimal_temp_min}–{selected.optimal_temp_max}°C
                  </p>
                </div>
                <div className="bg-white dark:bg-[#14202B] rounded-xl p-3 text-center border border-[#E6EDF1] dark:border-[#233340]">
                  <Droplets
                    size={14}
                    className="text-[#0E4561] dark:text-[#6FB6D6] mx-auto mb-1"
                  />
                  <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6] text-sm">
                    pH {selected.optimal_ph_min}–{selected.optimal_ph_max}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#14202B] rounded-xl p-3 text-center border border-[#E6EDF1] dark:border-[#233340]">
                  <p className="text-xs text-[#5C7384]">Min DO</p>
                  <p className="font-bold text-[#0E4561] dark:text-[#6FB6D6] text-sm">
                    {selected.optimal_do_min} mg/L
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
