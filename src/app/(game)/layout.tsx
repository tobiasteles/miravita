import GameBackground from "@/components/game/GameBackground";
import { HotkeyListener } from "@/components/game/Hotkeys";
import EscMenu from "@/components/game/EscMenu";
import ChatDock from "@/components/game/ChatDock";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameBackground />
      {children}
      <EscMenu />
      <HotkeyListener />
      <ChatDock />
    </>
  );
}
