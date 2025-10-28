import { Suspense } from "react";
import NewsletterConfirmClient from "./NewsletterConfirmClient";

export default function NewsletterConfirmPage() {
  return (
      <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
        <NewsletterConfirmClient />
      </Suspense>
  );
}
