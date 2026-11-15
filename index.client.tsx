import type { PluginClientContext } from "@getpaseo/plugin/client";
import { RitmoView } from "./client/RitmoView";
import { RitmoFooterItem } from "./client/RitmoFooterItem";
import { messages } from "./client/i18n";

// I titoli sono messaggi tradotti (PluginText): l'app li mostra nella lingua corrente.
export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "ritmo", title: messages.message("screen.title"), Component: RitmoView });
  client.addSidebarFooterItem({
    id: "ritmo",
    title: messages.message("footer.title"),
    Component: RitmoFooterItem,
  });
  client.addCommandCenterItem({
    id: "open-ritmo",
    title: messages.message("command.open"),
    icon: "Gauge",
    context: "workspace",
    onSelect({ openScreen }) {
      openScreen({ screenId: "ritmo" });
    },
  });
  return () => {};
}
