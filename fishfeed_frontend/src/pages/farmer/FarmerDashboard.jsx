import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sailboat,
  Fish,
  Waves as FishIcon,
  Sparkles,
  ChevronRight,
  Wheat,
  ClipboardList,
  Plus,
} from "lucide-react";
import { analyticsApi } from "../../api";
import {
  Card,
  StatCard,
  ScoreRing,
  Button,
  PageLoader,
  EmptyState,
  staggerContainer,
  staggerItem,
  fadeUp,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .farmerDashboard()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-7">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E4561] via-[#0A3247] to-[#061E2E] p-8 text-white"
      >
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#2389B5]/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-[#FF6B4A]/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-white/55 text-sm font-medium">{greeting()},</p>
            <h1 className="text-[28px] font-bold mt-0.5 font-display tracking-tight">
              {user?.full_name?.split(" ")[0]}
            </h1>
            <p className="text-white/55 text-sm mt-2.5 flex items-center gap-1.5 flex-wrap">
              <Sailboat size={14} /> {data?.farms_count} farm
              {data?.farms_count !== 1 ? "s" : ""}
              <span className="text-white/30">·</span>
              <Fish size={14} /> {data?.active_stocks} active stock
              {data?.active_stocks !== 1 ? "s" : ""}
              <span className="text-white/30">·</span>
              {data?.total_fish?.toLocaleString()} fish
            </p>
          </div>
          <Link to="/farmer/recommend">
            <Button variant="primary" size="lg" icon={Sparkles}>
              Get Recommendation
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Farms",
            value: data?.farms_count,
            icon: Sailboat,
            color: "ocean",
          },
          {
            label: "Fish Stocks",
            value: data?.active_stocks,
            icon: Fish,
            color: "success",
          },
          {
            label: "Total Fish",
            value: data?.total_fish?.toLocaleString(),
            icon: FishIcon,
            color: "ocean",
          },
          {
            label: "Recommendations",
            value: data?.recent_recommendations?.length,
            icon: Sparkles,
            color: "coral",
          },
        ].map((s) => (
          <motion.div key={s.label} variants={staggerItem}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display">
              Recent Recommendations
            </h3>
            <Link
              to="/farmer/recommend"
              className="text-xs text-[#0E4561] dark:text-[#6FB6D6] font-semibold hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {data?.recent_recommendations?.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recommendations yet"
              description="Add a fish stock to your farm to get started."
              action={
                <Link to="/farmer/farms">
                  <Button variant="ocean" size="sm">
                    Add Farm
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-1">
              {data?.recent_recommendations?.map((rec) => (
                <Link
                  key={rec.id}
                  to={`/farmer/recommend`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors -mx-1"
                >
                  <ScoreRing
                    score={Math.round(rec.match_percentage || 0)}
                    size={52}
                    strokeWidth={5}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13.5px] text-[#14202B] dark:text-[#EEF3F6] truncate">
                      {rec.fish_stock || "Fish Stock"}
                    </p>
                    <p className="text-xs text-[#5C7384] dark:text-[#93A4AF] truncate">
                      Best: {rec.best_feed || "—"}
                    </p>
                    <p className="text-[11px] text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] mt-0.5">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[#C7D6DD] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display">
              Feeding History
            </h3>
            <Link
              to="/farmer/history"
              className="text-xs text-[#0E4561] dark:text-[#6FB6D6] font-semibold hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {data?.recent_feeding?.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No feeding records"
              description="Log your feeding activity to track history."
            />
          ) : (
            <div className="space-y-1">
              {data?.recent_feeding?.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F4F8FA] dark:hover:bg-[#0F1B25] transition-colors -mx-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#E3F1F7] dark:bg-[#123347] flex items-center justify-center shrink-0">
                      <Fish
                        size={16}
                        className="text-[#0E4561] dark:text-[#6FB6D6]"
                        strokeWidth={2}
                      />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#14202B] dark:text-[#EEF3F6]">
                        {f.species}
                      </p>
                      <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
                        {f.feed}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0E4561] dark:text-[#6FB6D6]">
                      {f.quantity_kg}kg
                    </p>
                    <p className="text-[11px] text-[#9FB2BE] dark:text-[#5C7384]">
                      {f.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-5">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/farmer/farms", icon: Sailboat, label: "Manage Farms" },
            {
              to: "/farmer/recommend",
              icon: Sparkles,
              label: "Get Recommendation",
            },
            { to: "/farmer/species", icon: Fish, label: "Browse Species" },
            { to: "/farmer/feeds", icon: Wheat, label: "Browse Feeds" },
          ].map((action) => (
            <Link key={action.to} to={action.to}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-[#E6EDF1] dark:border-[#233340] hover:border-[#0E4561]/30 hover:bg-[#F1F8FB] dark:bg-[#123347] transition-colors text-center"
              >
                <span className="w-10 h-10 rounded-xl bg-[#E3F1F7] dark:bg-[#123347] flex items-center justify-center">
                  <action.icon
                    size={19}
                    className="text-[#0E4561] dark:text-[#6FB6D6]"
                    strokeWidth={2}
                  />
                </span>
                <span className="text-xs font-semibold text-[#2B3D4D] dark:text-[#C7D3DA]">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
