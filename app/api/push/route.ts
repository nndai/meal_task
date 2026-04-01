import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    const { title, body, url, excludeEndpoint } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    // Using a service role key here would be better, but anon key works due to RLS policies
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const payload = JSON.stringify({
      title: title || "Thông báo mới",
      body: body || "Có cập nhật mới",
      url: url || "/"
    });

    const sendPromises = subscriptions.map((sub) => {
      // Bỏ qua thiết bị của người đang thao tác
      if (excludeEndpoint && sub.endpoint === excludeEndpoint) {
        return Promise.resolve();
      }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(pushSubscription, payload).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          return supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: subscriptions.length });
  } catch (err: any) {
    console.error("Lỗi khi gửi thông báo push:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
