import { useSyncExternalStore } from "react";
import { getSyncSnapshot, subscribeSync } from "@/offline";

// Estado de conexión y sincronización para la interfaz.
export const useSyncState = () => useSyncExternalStore(subscribeSync, getSyncSnapshot);
