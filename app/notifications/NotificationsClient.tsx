"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Clock,
  Github,
  Mail,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { db } from "@/lib/firebase/config"; // ← 반드시 본인 프로젝트 경로로 바꿔야 함
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {RootState} from "@/lib/redux/store";
import { useSelector } from "react-redux";

type NotificationCategory = "all" | "unread" | "read";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: number; // Firestore 숫자로 저장됨
  read: boolean;
  actionLabel: string;
  actionHref: string;
  category: "trending" | "newsletter" | "saved";
}

// Firestore timestamp → "2 hours ago"
function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;

  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} sec ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minutes ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hours ago`;

  const day = Math.floor(hr / 24);
  return `${day} days ago`;
}

const categoryLabels = {
  trending: "Trending",
  newsletter: "Newsletter",
  saved: "Saved comic",
};

const tabConfig = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
] as const;

export default function NotificationsClient() {
  const user = useSelector((state: RootState) => state.user); // Redux slice
  const email = user?.profile?.email;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] =
      useState<NotificationCategory>("all");

  // 🔥 Firestore 실시간 구독
  useEffect(() => {
    if (!email) return;

    const q = query(
        collection(db, "notifications"),
        where("email", "==", email),
        orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as NotificationItem[];

      setNotifications(list);
    });

    return () => unsubscribe();
  }, [email]);

  const unreadCount = useMemo(
      () => notifications.filter((i) => !i.read).length,
      [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return activeTab === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.read);
  }, [activeTab, notifications]);

  // 로컬 상태만 변경 (Firestore 반영은 옵션)
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleReadState = (id: string) => {
    setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
      <div className="min-h-screen bg-[#0D1117] py-10">
        <div className="mx-auto w-full max-w-4xl px-4">
          {/* Header */}
          <header className="mb-10 flex flex-col gap-6 rounded-2xl border border-[#1F2A37] bg-[#111827] p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2937] text-[#58A6FF]">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Notifications
                  </h1>
                  <p className="text-sm text-[#8B949E]">
                    Stay on top of new comics, saved updates, and newsletter alerts.
                  </p>
                </div>
              </div>

              <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#30363D] px-4 py-2 text-sm font-medium text-[#C9D1D9] transition-colors hover:bg-[#1F2937]"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </button>
            </div>

            <nav className="flex items-center gap-2">
              {tabConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            isActive
                                ? "bg-[#1F6FEB]/20 text-[#58A6FF] border border-[#1F6FEB]/30"
                                : "text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#1F2937]"
                        }`}
                    >
                      {tab.label}
                      {tab.id === "unread" && unreadCount > 0 && (
                          <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#58A6FF] px-2 text-xs font-semibold text-white">
                      {unreadCount}
                    </span>
                      )}
                    </button>
                );
              })}
            </nav>
          </header>

          {/* Content */}
          <main className="space-y-4">
            {filteredNotifications.length === 0 ? (
                <EmptyState />
            ) : (
                filteredNotifications.map((item) => (
                    <NotificationCard
                        key={item.id}
                        item={item}
                        toggleReadState={toggleReadState}
                        removeNotification={removeNotification}
                    />
                ))
            )}
          </main>
        </div>
      </div>
  );
}

function EmptyState() {
  return (
      <div className="rounded-2xl border border-dashed border-[#1F2A37] bg-[#111827] p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F2937] text-[#58A6FF]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-white">No notifications</h2>
        <p className="mt-2 text-sm text-[#8B949E]">
          When new comics drop or updates happen, they will appear here.
        </p>
      </div>
  );
}

function NotificationCard({
                            item,
                            toggleReadState,
                            removeNotification,
                          }: {
  item: NotificationItem;
  toggleReadState: (id: string) => void;
  removeNotification: (id: string) => void;
}) {
  const icon =
      item.category === "trending"
          ? Star
          : item.category === "newsletter"
              ? Mail
              : Github;
  const Icon = icon;

  return (
      <div
          className={`group flex flex-col gap-4 rounded-2xl border border-[#1F2A37] bg-[#111827] p-5 transition-colors hover:border-[#1F6FEB]/40 hover:bg-[#152238] ${
              item.read ? "opacity-80" : ""
          }`}
      >
        <div className="flex items-start gap-4">
          <div
              className={`mt-1 flex h-12 w-12 items-center justify-center rounded-xl ${
                  item.category === "trending"
                      ? "bg-[#1F6FEB]/20 text-[#58A6FF]"
                      : item.category === "newsletter"
                          ? "bg-[#3FB950]/15 text-[#3FB950]"
                          : "bg-[#9E6FFF]/15 text-[#9E6FFF]"
              }`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8B949E]">
                  {categoryLabels[item.category]}
                </span>
                  <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                  <Clock className="h-3.5 w-3.5" />
                    {formatTimeAgo(item.timestamp)}
                </span>
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {item.title}
                </h3>
              </div>
              <button
                  onClick={() => toggleReadState(item.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      item.read
                          ? "bg-[#1F2937] text-[#9CA3AF] hover:bg-[#243045]"
                          : "bg-[#58A6FF]/20 text-[#58A6FF] hover:bg-[#58A6FF]/30"
                  }`}
              >
                {item.read ? "Mark unread" : "Mark read"}
              </button>
            </div>

            <p className="mt-3 text-sm text-[#9CA3AF]">{item.description}</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Link
                  href={item.actionHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#1F6FEB]/40 bg-[#1F6FEB]/10 px-4 py-2 text-sm font-medium text-[#58A6FF] transition-colors hover:bg-[#1F6FEB]/20"
              >
                <Sparkles className="h-4 w-4" />
                {item.actionLabel}
              </Link>
              <button
                  onClick={() => removeNotification(item.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#30363D] px-3 py-2 text-xs font-medium text-[#8B949E] transition-colors hover:bg-[#1F2937]"
              >
                <Trash2 className="h-4 w-4" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
