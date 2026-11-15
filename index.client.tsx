import type { PluginClientContext } from "@getpaseo/plugin/client";
import { RitmoView } from "./client/RitmoView";
import { RitmoFooterItem } from "./client/RitmoFooterItem";

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "ritmo", title: "Ritmo consumo", Component: RitmoView });
  client.addSidebarFooterItem({ id: "ritmo", title: "Ritmo consumo", Component: RitmoFooterItem });
  client.addCommandCenterItem({
    id: "open-ritmo",
    title: "Apri Ritmo consumo",
    icon: "Gauge",
    context: "workspace",
    onSelect({ openScreen }) {
      openScreen({ screenId: "ritmo" });
    },
  });
  return () => {};
}
