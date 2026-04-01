"use client";

import { useEffect, useState } from "react";
import { savePushSubscriptionInSupabase, removePushSubscriptionFromSupabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      navigator.serviceWorker.register("/sw.js").then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      alert("Trình duyệt của bạn không hỗ trợ thông báo đẩy.");
      return false;
    }

    setIsPending(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
        });
        
        setSubscription(sub);
        await savePushSubscriptionInSupabase(sub);
        return true;
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký thông báo:", error);
    } finally {
      setIsPending(false);
    }
    return false;
  };

  const unsubscribe = async () => {
    if (!subscription) return false;

    setIsPending(true);
    try {
      await subscription.unsubscribe();
      await removePushSubscriptionFromSupabase(subscription.endpoint);
      setSubscription(null);
      return true;
    } catch (error) {
      console.error("Lỗi khi hủy đăng ký thông báo:", error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { isSupported, permission, subscription, isPending, subscribe, unsubscribe };
}
