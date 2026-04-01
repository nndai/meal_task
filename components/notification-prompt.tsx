"use client";

import { useEffect, useState } from "react";
import { useWebPush } from "@/hooks/useWebPush";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X, Loader2 } from "lucide-react";

export function NotificationPrompt() {
  const { isSupported, permission, isPending, subscribe } = useWebPush();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isSupported && permission === "default") {
      const dismissed = localStorage.getItem("push_prompt_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 2000); // Mở sau 2 giây để người dùng không bị giật mình
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, permission]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("push_prompt_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:bottom-8 md:left-auto md:right-8 md:w-96"
        >
          <div className="rounded-2xl border border-pink-200 bg-white p-4 shadow-xl shadow-pink-200/50 relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-pink-400 hover:text-pink-600 transition"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 mt-1">
                <BellRing size={20} />
              </div>
              <div className="pr-4">
                <h3 className="text-[15px] font-bold text-rose-950">Bật thông báo?</h3>
                <p className="mt-1.5 text-xs text-rose-700 leading-relaxed">
                  Bạn có muốn nhận thông báo ngay khi có người khác chọn hoặc bỏ nhiệm vụ không?
                </p>
                <div className="mt-3.5 flex gap-2">
                  <Button size="sm" onClick={handleSubscribe} disabled={isPending} className="bg-pink-600 text-white hover:bg-pink-700 h-8 text-xs px-3 min-w-[100px]">
                    {isPending ? <Loader2 className="animate-spin" size={14} /> : "Đồng ý nhận"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 h-8 text-xs font-semibold px-3 border-transparent">
                    Để sau
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
