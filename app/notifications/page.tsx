import { Suspense } from "react";
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notifications - TrendFeed",
  description: "Review your latest TrendFeed updates and alerts.",
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="text-white text-center py-10">Loading notifications...</div>}>
      <NotificationsClient />
    </Suspense>
  );
}
