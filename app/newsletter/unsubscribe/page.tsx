import { Suspense } from "react";
import NewsletterUnsubscribePage from "./UnsubscribeClient";

export default function Page() {
  return (
      <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
        <NewsletterUnsubscribePage />
      </Suspense>
  );
}