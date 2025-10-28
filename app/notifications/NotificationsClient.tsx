"use client";

import { useMemo, useState } from "react";
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

type NotificationCategory = "all" | "unread" | "read";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionLabel: string;
  actionHref: string;
  category: "trending" | "newsletter" | "saved";
}

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New trending comic: shadcn/ui",
    description:
      "See why the latest panel on shadcn/ui is climbing the charts today.",
    timestamp: "6 minutes ago",
    read: false,
    actionLabel: "View comic",
    actionHref: "/comic/1",
    category: "trending",
  },
  {
    id: "notif-2",
    title: "Newsletter confirmation pending",
    description:
      "Complete your subscription so you never miss the Monday digest.",
    timestamp: "1 hour ago",
    read: false,
    actionLabel: "Confirm now",
    actionHref: "/newsletter/confirm?token=demo",
    category: "newsletter",
  },
  {
    id: "notif-3",
    title: "Saved comic update",
    description:
      "Next.js comic added two fresh panels based on community feedback.",
    timestamp: "Yesterday",
    read: true,
    actionLabel: "Open comic",
    actionHref: "/comic/2",
    category: "saved",
  },
  {
    id: "notif-4",
    title: "Weekly spotlight: microsoft/playwright",
    description:
      "Playwright continues to gain stars. Check the key insights recap.",
    timestamp: "2 days ago",
    read: true,
    actionLabel: "Read recap",
    actionHref: "/comic/3",
    category: "trending",
  },
];

const categoryLabels: Record<NotificationItem["category"], string> = {
  trending: "Trending",
  newsletter: "Newsletter",
  saved: "Saved comic",
};

const tabConfig: { id: NotificationCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

export default function NotificationsClient() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((item) =>
      activeTab === "unread" ? !item.read : item.read
    );
  }, [activeTab, notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  const toggleReadState = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read: !item.read,
            }
          : item
      )
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0D1117] py-10">
      <div className="mx-auto w-full max-w-4xl px-4">
        <header className="mb-10 flex flex-col gap-6 rounded-2xl border border-[#1F2A37] bg-[#111827] p-6 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2937] text-[#58A6FF]">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Notifications
                  </h1>
                  <p className="text-sm text-[#8B949E]">
                    Stay on top of new comics, saved updates, and newsletter
                    alerts.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-[#30363D] px-4 py-2 text-sm font-medium text-[#C9D1D9] transition-colors hover:bg-[#1F2937] hover:text-white hover:cursor-pointer"
              disabled={unreadCount === 0}
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
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all hover:cursor-pointer ${
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

        <main className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1F2A37] bg-[#111827] p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F2937] text-[#58A6FF]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                You&apos;re all caught up
              </h2>
              <p className="mt-2 text-sm text-[#8B949E]">
                When new comics drop or a saved repository changes, we&apos;ll
                ping you here first.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const icon =
                item.category === "trending"
                  ? Star
                  : item.category === "newsletter"
                  ? Mail
                  : Github;
              const Icon = icon;

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col gap-4 rounded-2xl border border-[#1F2A37] bg-[#111827] p-5 transition-colors hover:border-[#1F6FEB]/40 hover:bg-[#152238] ${
                    item.read ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
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
                              {item.timestamp}
                            </span>
                          </div>
                          <h3 className="mt-1 text-lg font-semibold text-white">
                            {item.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => toggleReadState(item.id)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:cursor-pointer ${
                            item.read
                              ? "bg-[#1F2937] text-[#9CA3AF] hover:bg-[#243045]"
                              : "bg-[#58A6FF]/20 text-[#58A6FF] hover:bg-[#58A6FF]/30"
                          }`}
                        >
                          {item.read ? "Mark unread" : "Mark read"}
                        </button>
                      </div>

                      <p className="mt-3 text-sm text-[#9CA3AF]">
                        {item.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Link
                          href={item.actionHref}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#1F6FEB]/40 bg-[#1F6FEB]/10 px-4 py-2 text-sm font-medium text-[#58A6FF] transition-colors hover:bg-[#1F6FEB]/20 hover:text-white hover:cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4" />
                          {item.actionLabel}
                        </Link>
                        <button
                          onClick={() => removeNotification(item.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#30363D] px-3 py-2 text-xs font-medium text-[#8B949E] transition-colors hover:bg-[#1F2937] hover:text-white hover:cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
