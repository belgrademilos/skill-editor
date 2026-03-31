import { useRef, useMemo, useState } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  handleCommandNavigation,
} from "../../novel";
import {
  StarterKit,
  HorizontalRule,
  TiptapLink,
  TiptapUnderline,
  Placeholder,
  MarkdownExtension,
  HighlightExtension,
  TextStyle,
  Color,
  TaskList,
  TaskItem,
  CustomKeymap,
  UpdatedImage,
  GlobalDragHandle,
  Table,
  TableRow,
  TableCell,
  TableHeader,
  TableControls,
  Command,
  renderItems,
} from "../../novel/extensions";
import {
  handleImagePaste,
  handleImageDrop,
  createImageUpload,
} from "../../novel/plugins";
import { BubbleToolbar } from "./BubbleToolbar";
import { TableOfContents } from "./TableOfContents";
import { slashCommandItems } from "./SlashCommandItems";
import { getAllContent } from "../../novel/utils";
import type { Editor } from "@tiptap/core";

// Image upload: convert to base64 inline (no server needed)
const uploadFn = createImageUpload({
  validateFn: (file) => {
    if (!file.type.includes("image/")) return false;
    if (file.size / 1024 / 1024 > 20) return false;
    return true;
  },
  onUpload: async (file) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
    });
  },
});

interface NovelEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  filePath: string;
}

export function NovelEditor({ content, onChange, filePath }: NovelEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside leading-3 -mt-2",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside leading-3 -mt-2",
          },
        },
        listItem: {
          HTMLAttributes: { class: "leading-normal -mb-2" },
        },
        blockquote: {
          HTMLAttributes: { class: "border-l-4 border-accent" },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "rounded-md bg-bg-surface p-4 font-mono text-sm",
          },
        },
        code: {
          HTMLAttributes: {
            class:
              "rounded-md bg-bg-surface px-1.5 py-1 font-mono font-medium",
          },
        },
        horizontalRule: false,
        dropcursor: {
          color: "#D97757",
          width: 4,
        },
      }),
      HorizontalRule,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-accent underline underline-offset-[3px] hover:text-accent-hover transition-colors cursor-pointer",
        },
      }),
      UpdatedImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg border border-border",
        },
      }),
      TiptapUnderline,
      TextStyle,
      Color,
      HighlightExtension,
      TaskList.configure({
        HTMLAttributes: { class: "not-prose pl-2" },
      }),
      TaskItem.configure({
        HTMLAttributes: { class: "flex gap-2 items-start my-4" },
        nested: true,
      }),
      Placeholder,
      CustomKeymap,
      MarkdownExtension,
      GlobalDragHandle.configure({
        dragHandleWidth: 20,
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "novel-table" },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TableControls,
      Command.configure({
        suggestion: {
          items: () => slashCommandItems,
          render: () => renderItems(editorRef),
        },
      }),
    ],
    [],
  );

  const handleUpdate = ({ editor }: { editor: Editor }) => {
    const md = getAllContent(editor);
    onChange(md);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative" key={filePath}>
      <EditorRoot>
        <EditorContent
          ref={editorRef}
          className="flex-1 overflow-y-auto cursor-text"
          extensions={extensions}
          initialContent={content}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view: unknown, event: unknown) =>
                handleCommandNavigation(event as KeyboardEvent),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "tiptap max-w-4xl mx-auto px-6 py-6 min-h-full focus:outline-none xl:box-border xl:max-w-[81rem] xl:pr-[23.5rem]",
            },
          }}
          onUpdate={handleUpdate}
          onCreate={({ editor }) => {
            setEditorInstance(editor);
            setScrollEl(editorRef.current);
            const md = getAllContent(editor);
            if (md !== content) {
              onChange(md);
            }
          }}
          immediatelyRender={false}
        >
          <BubbleToolbar />

          <EditorCommand className="novel-command-menu z-50 h-auto max-h-[330px] overflow-y-auto rounded-lg border border-border bg-bg-sidebar shadow-xl">
            <EditorCommandEmpty className="px-3 py-2 text-text-muted text-sm">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {slashCommandItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-bg-hover aria-selected:bg-bg-hover cursor-pointer"
                  keywords={item.searchTerms}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-bg-surface">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
        <TableOfContents editor={editorInstance} scrollContainer={scrollEl} />
      </EditorRoot>
    </div>
  );
}
