import { useEffect, useState } from "react";
import { Bold, Italic, Strikethrough, Code, Minus } from "lucide-react";
import { EditorBubbleItem, useEditor } from "../../../novel";
import type { EditorInstance } from "../../../novel";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

type FormatItem = {
  name: string;
  icon: LucideIcon;
  command: (editor: EditorInstance) => void;
  isActive: (editor: EditorInstance) => boolean;
};

const items: FormatItem[] = [
  {
    name: "Bold",
    icon: Bold,
    command: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    name: "Italic",
    icon: Italic,
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    name: "Strikethrough",
    icon: Strikethrough,
    command: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive("strike"),
  },
  {
    name: "Code",
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive("code"),
  },
  {
    name: "Horizontal Line",
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
  },
];

export const TextFormatSelector = () => {
  const { editor } = useEditor();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5">
      {items.map((item) => (
        <EditorBubbleItem
          key={item.name}
          onSelect={(editor) => item.command(editor)}
          className={cn(
            "flex cursor-pointer items-center justify-center rounded p-1.5 hover:bg-bg-hover",
            item.isActive(editor)
              ? "text-accent"
              : "text-text-primary",
          )}
        >
          <item.icon className="h-4 w-4" />
        </EditorBubbleItem>
      ))}
    </div>
  );
};
