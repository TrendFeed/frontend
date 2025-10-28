import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
            <HomeClient />
        </Suspense>
    );
}
