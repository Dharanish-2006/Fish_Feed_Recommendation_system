import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Sparkles,
  AlertTriangle,
  Wheat,
  BellRing,
  CheckCheck,
  User as UserIcon,
} from "lucide-react";
import { notificationsApi, authApi } from "../../api";
import {
  Card,
  Button,
  Badge,
  SectionHeader,
  EmptyState,
  Spinner,
  Input,
  Alert,
} from "../../components/ui";
import { ThemeToggleRow } from "../../components/ui/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setLoading(true);
    notificationsApi
      .list()
      .then(({ data }) => setNotifications(data.results || data))
      .finally(() => setLoading(false));
  };

  const markAllRead = async () => {
    await notificationsApi.markRead();
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    toast.success("All marked as read.");
  };

  const markOne = async (n) => {
    if (n.is_read) return;
    await notificationsApi.markRead(n.id);
    setNotifications(
      notifications.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
    );
  };

  const typeIcon = {
    recommendation_ready: Sparkles,
    low_stock: AlertTriangle,
    feed_update: Wheat,
    system: Bell,
  };
  const typeBadge = {
    recommendation_ready: "ocean",
    low_stock: "warning",
    feed_update: "success",
    system: "default",
  };

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) =>
          filter === "unread" ? !n.is_read : n.is_read,
        );
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        action={
          unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={CheckCheck}
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          )
        }
      />

      <div className="flex gap-2">
        {[
          { id: "all", label: "All" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "read", label: "Read" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
              filter === tab.id
                ? "bg-[#0E4561] dark:bg-[#2389B5] text-white"
                : "bg-white dark:bg-[#14202B] text-[#5C7384] hover:text-[#2B3D4D] dark:text-[#C7D3DA] border border-[#E6EDF1] dark:border-[#233340]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={36} />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={BellRing}
            title="No notifications"
            description={
              filter === "unread"
                ? "You're all caught up!"
                : "Nothing here yet."
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((n) => {
              const Icon = typeIcon[n.notification_type] || Bell;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => markOne(n)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-soft ${
                    n.is_read
                      ? "bg-white dark:bg-[#14202B] border-[#E6EDF1] dark:border-[#233340]"
                      : "bg-[#E3F1F7] dark:bg-[#123347] border-[#0E4561]/15 dark:border-[#3FA3CC]/25"
                  }`}
                >
                  <span className="w-10 h-10 rounded-xl bg-white dark:bg-[#14202B] flex items-center justify-center shrink-0 shadow-sm">
                    <Icon
                      size={18}
                      className="text-[#0E4561] dark:text-[#6FB6D6]"
                      strokeWidth={2}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[13.5px] font-bold ${n.is_read ? "text-[#2B3D4D]" : "text-[#14202B] dark:text-[#EEF3F6]"}`}
                      >
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={typeBadge[n.notification_type] || "default"}
                        >
                          {n.notification_type?.replace(/_/g, " ")}
                        </Badge>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#FF6B4A] shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#5C7384] dark:text-[#93A4AF] mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-[#9FB2BE] dark:text-[#5C7384] dark:text-[#93A4AF] mt-1.5">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(form);
      updateUser(data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      toast.success("Password changed!");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwError(
        err.response?.data?.old_password?.[0] || "Failed to change password.",
      );
    } finally {
      setPwSaving(false);
    }
  };

  const roleColor = { farmer: "success", supplier: "ocean", admin: "coral" };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        title="Profile Settings"
        subtitle="Manage your account information"
      />

      <Card>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2389B5] to-[#0E4561] flex items-center justify-center shrink-0">
            <UserIcon size={28} className="text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xl text-[#14202B] dark:text-[#EEF3F6] font-display truncate">
              {user?.full_name}
            </p>
            <p className="text-sm text-[#5C7384] dark:text-[#93A4AF] truncate">
              {user?.email}
            </p>
            <div className="mt-2">
              <Badge variant={roleColor[user?.role] || "default"}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-5">
          Appearance
        </h3>
        <ThemeToggleRow />
      </Card>

      <Card>
        <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-5">
          Personal Information
        </h3>
        <form onSubmit={handleProfile} className="space-y-4">
          <Input
            label="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Input label="Email address" value={user?.email} disabled />
          <Input
            label="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+63 912 345 6789"
          />
          <Input
            label="Account role"
            value={user?.role}
            disabled
            className="capitalize"
          />
          <Button type="submit" variant="ocean" loading={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-bold text-[#14202B] dark:text-[#EEF3F6] font-display mb-5">
          Change Password
        </h3>
        {pwError && (
          <div className="mb-4">
            <Alert type="error">{pwError}</Alert>
          </div>
        )}
        <form onSubmit={handlePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={pwForm.old_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, old_password: e.target.value })
            }
            placeholder="••••••••"
            required
          />
          <Input
            label="New password"
            type="password"
            value={pwForm.new_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, new_password: e.target.value })
            }
            placeholder="Min. 8 characters"
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            placeholder="Repeat new password"
            required
          />
          <Button type="submit" variant="outline" loading={pwSaving}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
