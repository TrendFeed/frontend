"use client";

import { useState } from "react";
import AdvertisingDialog from "./AdvertisingDialog";

export default function AdvertisingButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen(true)}
                className="
          fixed bottom-6 right-6 z-50
          bg-blue-600 hover:bg-blue-500
          text-white rounded-full p-4 shadow-xl
          transition-all duration-200
        "
            >
                📣
            </button>

            {/* Dialog */}
            <AdvertisingDialog open={open} onClose={() => setOpen(false)} />
        </>
    );
}
