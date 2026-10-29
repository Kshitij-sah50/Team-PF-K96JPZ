"use client";
import { useEffect, useState } from "react";
import { trpc } from "~/trpc/client";
const storage = "tsukuyomi-push-device";
export function BackgroundAlerts({
  eventId,
  locationId,
}: {
  eventId?: string;
  locationId?: string;
}) {
  const [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [lead, setLead] = useState(15);
  const config = trpc.push.config.useQuery(undefined, { staleTime: 60000, retry: 0 });
  const register = trpc.push.register.useMutation(),
    remove = trpc.push.remove.useMutation(),
    schedule = trpc.push.schedule.useMutation(),
    cancel = trpc.push.cancel.useMutation();
  const list = trpc.push.list.useMutation();
  const loadAlerts = list.mutate;
  useEffect(() => {
    if (token) loadAlerts({ token });
  }, [token, loadAlerts]);
  useEffect(() => {
    try {
      setToken(localStorage.getItem(storage) ?? "");
    } catch {
      setMessage("Browser storage is unavailable; notification settings cannot be saved.");
    }
  }, []);
  async function enable() {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error("This browser does not support background push.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error("Allow notifications in browser settings to enable background alerts.");
      const registration = await navigator.serviceWorker.register("/push-worker.js");
      await navigator.serviceWorker.ready;
      const old = await registration.pushManager.getSubscription();
      if (old) await old.unsubscribe();
      const key = config.data!.publicKey;
      const binary = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
      const applicationServerKey = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const json = subscription.toJSON();
      try {
        const result = await register.mutateAsync({
          endpoint: subscription.endpoint,
          keys: { auth: json.keys!.auth!, p256dh: json.keys!.p256dh! },
        });
        localStorage.setItem(storage, result.token);
        setToken(result.token);
        setMessage("Background notifications enabled on this device.");
      } catch (cause) {
        await subscription.unsubscribe();
        throw cause;
      }
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="honor-observation">
      <h2>Alerts beyond this tab.</h2>
      <p className="lens-help">
        Browser push can arrive while the page is closed. Delivery needs network access, OS
        notification permission, and the server scheduler. Times may vary with device power-saving
        settings.
      </p>
      {!config.data?.enabled ? (
        <p className="lens-help">
          Server push setup is pending. Calendar downloads still provide reminders through your
          calendar app.
        </p>
      ) : !token ? (
        <button disabled={busy} onClick={() => void enable()}>
          {busy ? "Enabling…" : "Enable background notifications"}
        </button>
      ) : (
        <>
          {(eventId || locationId) && (
            <div className="bonus-form">
              <label>
                Lead time
                <select value={lead} onChange={(event) => setLead(Number(event.target.value))}>
                  <option value={0}>At event time</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </label>
              <button
                disabled={schedule.isPending}
                onClick={async () => {
                  try {
                    await schedule.mutateAsync({ token, eventId, locationId, lead });
                    setMessage("Background alert scheduled.");
                    await list.mutateAsync({ token });
                  } catch (cause) {
                    setMessage((cause as Error).message);
                  }
                }}
              >
                Schedule {eventId ? "event" : "next moonrise"} push
              </button>
            </div>
          )}
          {list.data?.map((job) => (
            <p className="lens-help" key={job.id}>
              {job.title} · {new Date(job.dueAt).toLocaleString()}{" "}
              <button
                disabled={cancel.isPending}
                onClick={async () => {
                  try {
                    await cancel.mutateAsync({ token, id: job.id });
                    await list.mutateAsync({ token });
                  } catch (cause) {
                    setMessage((cause as Error).message);
                  }
                }}
              >
                Cancel
              </button>
            </p>
          ))}
          {list.error && <p className="lens-error">{list.error.message}</p>}
          <button
            disabled={remove.isPending}
            onClick={async () => {
              try {
                await remove.mutateAsync({ token });
                const registration = await navigator.serviceWorker.getRegistration();
                await (await registration?.pushManager.getSubscription())?.unsubscribe();
                localStorage.removeItem(storage);
                setToken("");
                setMessage("Background alerts disabled and scheduled notifications removed.");
              } catch (cause) {
                setMessage((cause as Error).message);
              }
            }}
          >
            Disable this device
          </button>
        </>
      )}
      {message && (
        <p className="lens-help" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
