import GameBackground from "@/components/game/GameBackground";
import ActionFeedback from "@/components/game/ActionFeedback";
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
      <ActionFeedback />
      {children}
      <EscMenu />
      <HotkeyListener />
      <ChatDock />
    </>
  );
}
