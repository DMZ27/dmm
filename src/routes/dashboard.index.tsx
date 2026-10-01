import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, FolderOpen, Plus, Settings, Shield } from "lucide-react";
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
      <div className="mx-auto w-full max-w-[960px] px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-36" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const list = orders ?? [];
  const open = list.filter((o) => !["COMPLETED", "DELIVERED", "CANCELLED"].includes(o.status)).length;

  return (
    <div className="min-h-[70vh] bg-[#f6f7fb]">
      <div className="mx-auto w-full max-w-[960px] px-4 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">Área do cliente</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">
              Olá, {profile?.name?.split(" ")[0] ?? user.displayName ?? "cliente"}
            </h1>
            <p className="mt-1 text-sm text-fog">Os seus pedidos e orçamentos num só lugar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.role === "ADMIN" && (
              <Button asChild variant="ink" className="h-11 rounded-full">
                <Link to="/admin">
                  <Shield size={16} /> Admin
                </Link>
              </Button>
            )}
            <Button asChild className="h-11 rounded-full">
              <Link to="/assistente">Assistente IA</Link>
            </Button>
            <Button asChild className="h-11 rounded-full">
              <Link to="/servicos">
                <Plus size={16} /> Novo pedido
              </Link>
            </Button>
            <Button asChild variant="cream" className="h-11 rounded-full">
              <Link to="/conta">
                <Settings size={16} /> Conta
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-fog">Total de pedidos</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{list.length}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-fog">Em curso</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-brass">{open}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-line bg-white p-4 shadow-sm sm:col-span-1">
            <p className="text-xs font-semibold text-fog">Atalho</p>
            <Link to="/servicos" className="mt-2 inline-flex text-sm font-semibold text-ink underline-offset-2 hover:underline">
              Encomendar serviço →
            </Link>
          </div>
        </div>

        {err && (
          <p className="mt-4 rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{err}</p>
        )}

        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={18} className="text-brass" />
            <h2 className="font-display text-xl font-bold">Os meus pedidos</h2>
          </div>

          {orders === null ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
              <FolderOpen className="mx-auto text-fog" size={36} />
              <p className="mt-3 font-display text-xl font-bold">Ainda não tem pedidos</p>
              <p className="mt-1 text-sm text-fog">Comece por escolher um serviço e enviar o briefing.</p>
              <Button asChild className="mt-5 h-11 rounded-full">
                <Link to="/servicos">Ver serviços</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/dashboard/$orderId"
                    params={{ orderId: o.id }}
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-brass/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-fog">{orderCode(o.code)}</p>
                      <p className="mt-0.5 truncate font-semibold text-ink">{o.title}</p>
                      <p className="mt-0.5 text-sm text-fog">{o.service_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      {o.quoted_price != null && (
                        <span className="text-sm font-bold tabular-nums text-ink">
                          {formatKz(Number(o.quoted_price))}
                        </span>
                      )}
                      <StatusBadge status={o.status} />
                      <span className="text-sm font-semibold text-brass">Abrir →</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
