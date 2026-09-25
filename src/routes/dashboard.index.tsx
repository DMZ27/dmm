import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, listMyOrders, type OrderListRow, type Profile } from "@/lib/dmm/server";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKz, orderCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({ component: Dashboard });

function Dashboard() {
  const { user, isPending } = useCurrentUserState();
  const [orders, setOrders] = useState<OrderListRow[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isPending || !user) return;
    Promise.all([listMyOrders(), getMyProfile()])
      .then(([o, p]) => {
        setOrders(o);
        setProfile(p);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro a carregar."));
  }, [isPending, user]);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-40" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-wait">ÁREA DO CLIENTE</p>
          <h1 className="mt-2 font-display text-4xl">Olá, {profile?.name ?? user.displayName ?? "cliente"}</h1>
          <p className="mt-2 text-fog">Acompanhe orçamentos, mensagens e entregas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.role === "ADMIN" && (
            <Button asChild variant="ink">
              <Link to="/admin">Painel admin</Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/servicos">Novo pedido</Link>
          </Button>
          <Button asChild variant="cream">
            <Link to="/conta">Conta</Link>
          </Button>
        </div>
      </div>
      {err && <p className="mt-4 text-sm text-bad">{err}</p>}
      <div className="mt-8">
        {orders === null ? (
          <Skeleton className="h-48" />
        ) : orders.length === 0 ? (
          <div className="rounded-[24px] bg-cream p-8">
            <p className="font-display text-2xl">Ainda não há pedidos</p>
            <p className="mt-2 text-sm text-fog">O primeiro briefing abre a conversa com a DMM.</p>
            <Button asChild className="mt-5">
              <Link to="/servicos">Fazer encomenda</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] bg-cream">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/dashboard/$orderId"
                params={{ orderId: o.id }}
                className="flex flex-col gap-2 border-b border-line px-5 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {orderCode(o.code)} — {o.title}
                  </p>
                  <p className="text-sm text-fog">{o.service_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-fog">{formatKz(o.quoted_price)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
