import { useState } from "react";
import { EditorBubble } from "../../novel";
import { NodeSelector } from "./selectors/node-selector";
import { LinkSelector } from "./selectors/link-selector";
import { TextFormatSelector } from "./selectors/text-format-selector";
import { Separator } from "../ui/separator";

export function BubbleToolbar() {
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);

  return (
    <EditorBubble
      options={{ placement: "top" }}
      className="novel-bubble-menu"
    >
      <div className="flex items-center rounded-lg border border-border bg-bg-sidebar p-1 shadow-xl">
        <NodeSelector open={openNode} onOpenChange={setOpenNode} />
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        <LinkSelector open={openLink} onOpenChange={setOpenLink} />
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        <TextFormatSelector />
      </div>
    </EditorBubble>
  );
}
