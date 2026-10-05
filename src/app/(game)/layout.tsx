import { HotkeyListener } from "@/components/game/Hotkeys"; import EscMenu from "@/components/game/EscMenu"; import ChatDock from "@/components/game/ChatDock";
export default function GameLayout({ children }: { children: React.ReactNode }) { return <>{children}<EscMenu /><HotkeyListener /><ChatDock /></>; }
