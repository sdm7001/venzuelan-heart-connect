import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Package, Sparkles, ArrowRight, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Order = {
  id: string;
  kind: "virtual" | "physical";
  status: string;
  created_at: string;
  updated_at: string;
  message: string | null;
  credit_cost: number | null;
  amount_cents: number | null;
  currency: string | null;
  sender_id: string;
  recipient_id: string;
  gift_id: string;
};

type EventRow = {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUS_TONE: Record<string, string> = {
  created: "bg-muted text-muted-foreground",
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  processing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  shipped: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  canceled: "bg-muted text-muted-foreground",
};

const LAST_VISIT_KEY = "myGifts:lastVisitedAt";

export function MyGiftsCard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventsByOrder, setEventsByOrder] = useState<Record<string, EventRow[]>>({});
  const [giftNames, setGiftNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Snapshot of last-visited timestamp captured on mount; stays fixed during the
  // session so unread highlights don't disappear as the user scrolls.
  const [lastVisitedAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = window.localStorage.getItem(LAST_VISIT_KEY);
    return v ? Number(v) || 0 : 0;
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Mark "visited now" when the card mounts with a user, so the next visit
  // compares against this moment.
  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    window.localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
  }, [user]);

  // Reset & load first page when user/tab changes
  useEffect(() => {
    if (!user) return;
    setOrders([]);
    setEventsByOrder({});
    setGiftNames({});
    setHasMore(true);
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  const loadPage = useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      if (!user) return;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const col = tab === "sent" ? "sender_id" : "recipient_id";

      // Keyset cursor: last-loaded created_at (only when paging further)
      const cursor = reset ? null : orders[orders.length - 1]?.created_at ?? null;

      let q = supabase
        .from("gift_orders")
        .select("*")
        .eq(col, user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) q = q.lt("created_at", cursor);

      const { data: o, error } = await q;
      if (error) {
        console.error("MyGiftsCard load error", error);
        if (reset) setLoading(false);
        else setLoadingMore(false);
        return;
      }

      const newRows = (o ?? []) as Order[];
      setHasMore(newRows.length === PAGE_SIZE);

      // Hydrate events + gift names for the new batch
      if (newRows.length > 0) {
        const orderIds = newRows.map(r => r.id);
        const newGiftIds = Array.from(
          new Set(newRows.map(r => r.gift_id).filter(id => !giftNames[id])),
        );

        const [{ data: ev }, { data: gs }] = await Promise.all([
          supabase
            .from("gift_order_events")
            .select("id, order_id, status, notes, created_at")
            .in("order_id", orderIds)
            .order("created_at", { ascending: false }),
          newGiftIds.length > 0
            ? supabase.from("gifts").select("id, name").in("id", newGiftIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        setEventsByOrder(prev => {
          const next = reset ? {} : { ...prev };
          (ev ?? []).forEach((e: any) => {
            (next[e.order_id] ||= []).push(e as EventRow);
          });
          return next;
        });

        if ((gs ?? []).length > 0) {
          setGiftNames(prev => {
            const next = reset ? {} : { ...prev };
            (gs ?? []).forEach((g: any) => {
              next[g.id] = g.name;
            });
            return next;
          });
        } else if (reset) {
          setGiftNames({});
        }
      } else if (reset) {
        setEventsByOrder({});
        setGiftNames({});
      }

      setOrders(prev => (reset ? newRows : [...prev, ...newRows]));

      if (reset) setLoading(false);
      else setLoadingMore(false);
    },
    [user, tab, orders, giftNames],
  );

  // Infinite scroll: observe sentinel
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || loadingMore || !hasMore || orders.length === 0) return;

    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) void loadPage();
      },
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadPage, loading, loadingMore, hasMore, orders.length]);

  const isUnread = (iso: string) =>
    lastVisitedAt > 0 && new Date(iso).getTime() > lastVisitedAt;

  const unreadCount = orders.reduce((acc, o) => {
    const evs = eventsByOrder[o.id] ?? [];
    const hasNewEvent = evs.some(e => isUnread(e.created_at));
    const hasNewOrder = isUnread(o.created_at);
    return acc + (hasNewEvent || hasNewOrder ? 1 : 0);
  }, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">My gifts</h2>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            onClick={() => setTab("sent")}
            className={cn(
              "px-3 py-1 text-xs rounded-md",
              tab === "sent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sent
          </button>
          <button
            onClick={() => setTab("received")}
            className={cn(
              "px-3 py-1 text-xs rounded-md",
              tab === "received" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Received
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          {tab === "sent" ? (
            <>
              You haven't sent any gifts yet.{" "}
              <Link to="/messages" className="text-primary underline">Open a chat</Link> to send one.
            </>
          ) : (
            "No gifts received yet."
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map(o => {
            const events = eventsByOrder[o.id] ?? [];
            const latest = events[0];
            const newOrder = isUnread(o.created_at);
            const newEventCount = events.filter(e => isUnread(e.created_at)).length;
            const isNew = newOrder || newEventCount > 0;
            return (
              <li key={o.id} className="py-4">
                <Link
                  to={`/gifts/${o.id}`}
                  className={cn(
                    "block group -mx-2 px-2 rounded-lg hover:bg-muted/40 transition-colors",
                    isNew && "bg-primary/5 ring-1 ring-primary/20",
                  )}
                >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-muted-foreground relative">
                    {o.kind === "virtual"
                      ? <Sparkles className="h-4 w-4" />
                      : <Package className="h-4 w-4" />}
                    {isNew && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{giftNames[o.gift_id] ?? "Gift"}</span>
                      <Badge variant="outline" className="text-xs capitalize">{o.kind}</Badge>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        STATUS_TONE[o.status] ?? "bg-muted text-muted-foreground"
                      )}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                      {isNew && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-primary text-primary-foreground">
                          {newOrder && newEventCount === 0
                            ? "New"
                            : `${newEventCount} new update${newEventCount === 1 ? "" : "s"}`}
                        </Badge>
                      )}
                      {o.kind === "virtual" && o.credit_cost != null && (
                        <span className="text-xs text-muted-foreground">{o.credit_cost} cr</span>
                      )}
                      {o.kind === "physical" && o.amount_cents != null && (
                        <span className="text-xs text-muted-foreground">
                          {(o.amount_cents / 100).toFixed(2)} {o.currency ?? "USD"}
                        </span>
                      )}
                    </div>
                    {o.message && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2 italic">
                        "{o.message}"
                      </div>
                    )}

                    {/* Status timeline (latest 3 events) */}
                    {events.length > 0 ? (
                      <ol className="mt-3 space-y-1.5">
                        {events.slice(0, 3).map((e, i) => (
                          <li key={e.id} className="flex items-start gap-2 text-xs">
                            <span className={cn(
                              "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                              i === 0 ? "bg-primary" : "bg-muted-foreground/40"
                            )} />
                            <div className="flex-1">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded capitalize",
                                STATUS_TONE[e.status] ?? "bg-muted text-muted-foreground"
                              )}>
                                {e.status.replace(/_/g, " ")}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                {new Date(e.created_at).toLocaleString()}
                              </span>
                              {e.notes && (
                                <div className="text-muted-foreground mt-0.5">{e.notes}</div>
                              )}
                            </div>
                          </li>
                        ))}
                        {events.length > 3 && (
                          <li className="text-xs text-muted-foreground pl-3.5">
                            +{events.length - 3} earlier event{events.length - 3 === 1 ? "" : "s"}
                          </li>
                        )}
                      </ol>
                    ) : (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        No status updates yet — created {new Date(o.created_at).toLocaleString()}
                        {latest && <ArrowRight className="h-3 w-3" />}
                      </div>
                    )}
                  </div>
                </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Infinite scroll sentinel + load-more fallback */}
      {!loading && orders.length > 0 && (
        <div className="mt-2">
          <div ref={sentinelRef} aria-hidden className="h-1" />
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading older gifts…
            </div>
          ) : hasMore ? (
            <div className="flex justify-center pt-2">
              <Button size="sm" variant="ghost" onClick={() => void loadPage()}>
                Load more
              </Button>
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-2">
              No more gifts to load.
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border flex justify-end">
        <Button asChild size="sm" variant="soft">
          <Link to="/gifts/send">
            Send a new gift <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
