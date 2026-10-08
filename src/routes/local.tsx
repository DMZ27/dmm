import { createFileRoute } from "@tanstack/react-router";
import { LocalMapView } from "@/components/dmm/local-map";

export const Route = createFileRoute("/local")({
  component: LocalPage,
});

function LocalPage() {
  return <LocalMapView />;
}
