import type { PluginServerContext } from "@getpaseo/plugin/server";
import { ritmoConfigGetRpc, ritmoConfigSetRpc, ritmoUsageRpc } from "./shared/contract";
import { fetchRitmoUsage } from "./server/usage";
import { getRitmoConfig, setRitmoConfig } from "./server/config";

export default function contribute(server: PluginServerContext) {
  server.handle(ritmoUsageRpc, () => fetchRitmoUsage());
  server.handle(ritmoConfigGetRpc, () => getRitmoConfig());
  server.handle(ritmoConfigSetRpc, (input) => setRitmoConfig(input));
  return () => {};
}
