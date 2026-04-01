import { Outlet } from "react-router";
import BotChatWidget from "./BotChatWidget";

export default function RootLayout() {
  return (
    <>
      <Outlet />
      <BotChatWidget />
    </>
  );
}
