import { BubbleMenu } from "@tiptap/react/menus";
import type { BubbleMenuProps } from "@tiptap/react/menus";
import { useCurrentEditor } from "@tiptap/react";
import { isNodeSelection } from "@tiptap/core";
import { forwardRef, useMemo } from "react";
import type { ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";

export interface EditorBubbleProps
  extends Omit<BubbleMenuProps, "editor" | "children"> {
  readonly children: ReactNode;
}

export const EditorBubble = forwardRef<HTMLDivElement, EditorBubbleProps>(
  ({ children, options, ...rest }, ref) => {
    const { editor: currentEditor } = useCurrentEditor();

    const bubbleMenuProps = useMemo(() => {
      const shouldShow = ({
        editor,
        state,
      }: {
        editor: Editor;
        state: EditorState;
      }) => {
        const { selection } = state;
        const { empty } = selection;

        if (
          !editor.isEditable ||
          editor.isActive("image") ||
          empty ||
          isNodeSelection(selection)
        ) {
          return false;
        }
        return true;
      };

      return {
        shouldShow,
        options: {
          placement: "top" as const,
          ...options,
        },
        editor: currentEditor ?? undefined,
        ...rest,
      };
    }, [rest, options, currentEditor]);

    if (!currentEditor) return null;

    return (
      <div ref={ref}>
        <BubbleMenu {...bubbleMenuProps}>{children}</BubbleMenu>
      </div>
    );
  },
);

EditorBubble.displayName = "EditorBubble";
