import { Suspense } from "react";
import ChatLuna from "@/components/ChatLuna";

export default function PaginaAsistente() {
  return (
    <Suspense>
      <ChatLuna />
    </Suspense>
  );
}
