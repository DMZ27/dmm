import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  MessageCircle,
  LocateFixed,
  ExternalLink,
  Clock3,
  Route,
} from "lucide-react";
import { CONTACT } from "@/lib/dmm/catalog";
import { Button } from "@/components/ui/button";
import { whatsappHref } from "@/lib/utils";

export const Route = createFileRoute("/local")({
  component: LocalPage,
  head: () => ({
    meta: [
      { title: "Localização DMM — Mapa e rota em Benguela" },
      {
        name: "description",
        content:
          "Veja onde está a Central DMM em Benguela, a sua posição actual e a rota até nós — tudo dentro do site.",
      },
    ],
  }),
});

const DMM_LAT = CONTACT.lat;
const DMM_LNG = CONTACT.lng;

type Coords = { lat: number; lng: number };

type RouteInfo = {
  distanceKm: number;
  durationMin: number;
};

function loadLeaflet(): Promise<typeof window & { L: any }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Mapa só no browser."));
      return;
    }
    const w = window as typeof window & { L?: any };
    if (w.L) {
      resolve(w as typeof window & { L: any });
      return;
    }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(w as typeof window & { L: any }));
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o mapa.")));
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(w as typeof window & { L: any });
    script.onerror = () => reject(new Error("Falha ao carregar o mapa."));
    document.body.appendChild(script);
  });
}

async function fetchRoute(from: Coords, to: Coords): Promise<{ info: RouteInfo; latlngs: [number, number][] } | null> {
  // OSRM público — perfil carro
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = data.routes?.[0];
    if (!route) return null;
    const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    return {
      info: {
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMin: Math.max(1, Math.round(route.duration / 60)),
      },
      latlngs,
    };
  } catch {
    return null;
  }
}

function LocalPage() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const [userPos, setUserPos] = useState<Coords | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [status, setStatus] = useState("A carregar mapa…");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = await loadLeaflet();
        if (cancelled || !mapEl.current || mapRef.current) return;
        const L = w.L;
        const map = L.map(mapEl.current, { zoomControl: true }).setView([DMM_LAT, DMM_LNG], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const dmmIcon = L.divIcon({
          className: "",
          html: `<div style="background:#0a1628;color:#e8b923;border:2px solid #e8b923;border-radius:999px;width:36px;height:36px;display:grid;place-items:center;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.35)">DMM</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker([DMM_LAT, DMM_LNG], { icon: dmmIcon })
          .addTo(map)
          .bindPopup(`<strong>${CONTACT.addressLabel}</strong><br/>${CONTACT.city}`);

        mapRef.current = map;
        setStatus("Mapa pronto. Pode usar a sua localização.");
        setTimeout(() => map.invalidateSize(), 100);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Não foi possível carregar o mapa.");
        setStatus("");
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const drawUserAndRoute = useCallback(async (pos: Coords) => {
    const w = window as typeof window & { L?: any };
    const L = w.L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([pos.lat, pos.lng]);
    } else {
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="background:#2563eb;border:3px solid #fff;border-radius:999px;width:18px;height:18px;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("A sua posição");
    }

    const routed = await fetchRoute(pos, { lat: DMM_LAT, lng: DMM_LNG });
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (routed) {
      routeLineRef.current = L.polyline(routed.latlngs, {
        color: "#e8b923",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
      setRouteInfo(routed.info);
      setStatus("Rota calculada até à DMM.");
    } else {
      map.fitBounds(L.latLngBounds([pos.lat, pos.lng], [DMM_LAT, DMM_LNG]), { padding: [50, 50] });
      setRouteInfo(null);
      setStatus("Posição obtida. Rota automática indisponível — use o link Google Maps.");
    }
  }, []);

  function locateMe() {
    setErr("");
    if (!navigator.geolocation) {
      setErr("Este dispositivo não suporta geolocalização.");
      return;
    }
    setBusy(true);
    setStatus("A pedir a sua localização…");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserPos(pos);
        try {
          await drawUserAndRoute(pos);
        } finally {
          setBusy(false);
        }
      },
      (e) => {
        setBusy(false);
        if (e.code === e.PERMISSION_DENIED) {
          setErr("Permissão negada. Active a localização no browser e tente de novo.");
        } else {
          setErr("Não foi possível obter a localização. Tente ao ar livre ou verifique o GPS.");
        }
        setStatus("Mapa pronto.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  const mapsDirectionsUrl = userPos
    ? `https://www.google.com/maps/dir/?api=1&origin=${userPos.lat},${userPos.lng}&destination=${DMM_LAT},${DMM_LNG}`
    : `https://www.google.com/maps/dir/?api=1&destination=${DMM_LAT},${DMM_LNG}`;

  const osmUrl = `https://www.openstreetmap.org/?mlat=${DMM_LAT}&mlon=${DMM_LNG}#map=16/${DMM_LAT}/${DMM_LNG}`;

  return (
    <div className="min-h-[70vh] bg-[#f4f5f8]">
      <section className="relative overflow-hidden bg-navy text-paper">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(232,185,35,0.14), transparent 55%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-4 py-12 sm:py-14">
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-brass" />
            <p className="text-xs font-semibold tracking-[0.18em] text-brass-2 uppercase">
              Localização
            </p>
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4vw,2.6rem)] font-extrabold leading-tight">
            Encontre a DMM em Benguela
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/75 sm:text-base">
            Mapa interativo, a sua posição actual e rota até à central — sem sair do site.
            Atendimento para qualquer zona de Benguela.
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        {/* Mapa */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-sm text-fog">{status || "—"}</p>
            <Button
              type="button"
              className="h-10 rounded-full"
              disabled={busy}
              onClick={locateMe}
            >
              <LocateFixed size={16} />
              {busy ? "A localizar…" : "A minha localização"}
            </Button>
          </div>
          <div ref={mapEl} className="h-[min(62vh,520px)] w-full bg-[#e8ecf1]" />
          {err && (
            <p className="border-t border-line bg-bad/10 px-4 py-3 text-sm text-bad">{err}</p>
          )}
        </div>

        {/* Painel lateral */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-brass">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{CONTACT.addressLabel}</h2>
                <p className="mt-1 text-sm text-fog">{CONTACT.city}</p>
                <p className="mt-2 text-xs text-fog">
                  Coord.: {DMM_LAT.toFixed(5)}, {DMM_LNG.toFixed(5)}
                </p>
              </div>
            </div>
          </div>

          {routeInfo && (
            <div className="rounded-2xl border border-brass/30 bg-brass/10 p-5">
              <div className="flex items-center gap-2 text-navy">
                <Route size={18} />
                <h3 className="font-display text-base font-bold">Rota estimada</h3>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/80 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-fog">Distância</p>
                  <p className="font-display text-xl font-bold text-ink">{routeInfo.distanceKm} km</p>
                </div>
                <div className="rounded-xl bg-white/80 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-fog">Tempo</p>
                  <p className="font-display text-xl font-bold text-ink">~{routeInfo.durationMin} min</p>
                </div>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-fog">
                <Clock3 size={12} className="mt-0.5 shrink-0" />
                Estimativa de carro (OSRM). Trânsito real pode variar.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-bold text-ink">Navegação</h3>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-paper hover:bg-navy/90"
              >
                <Navigation size={16} /> Abrir no Google Maps
              </a>
              <a
                href={osmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-cream text-sm font-semibold text-ink hover:bg-paper-2"
              >
                <ExternalLink size={16} /> Ver no OpenStreetMap
              </a>
              <a
                href={whatsappHref(
                  userPos
                    ? `Olá DMM, estou a caminho. A minha posição: https://www.google.com/maps?q=${userPos.lat},${userPos.lng}`
                    : "Olá DMM, preciso de indicações para chegar à central.",
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brass/40 bg-brass/15 text-sm font-semibold text-ink hover:bg-brass/25"
              >
                <MessageCircle size={16} /> WhatsApp {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-cream p-5 text-sm text-fog">
            <p className="font-semibold text-ink">Nota</p>
            <p className="mt-1 leading-relaxed">
              A localização usa o GPS do seu dispositivo (com a sua permissão). O mapa é
              OpenStreetMap. Se o pin da DMM não coincidir com a morada exacta, diga-nos as
              coordenadas correctas e actualizamos em minutos.
            </p>
            <Button asChild variant="cream" className="mt-3 h-10 w-full rounded-full">
              <Link to="/contato">Outros contactos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
