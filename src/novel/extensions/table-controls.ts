import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const TableControls = Extension.create({
  name: "tableControls",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("tableControls"),

        view(editorView) {
          const container = editorView.dom.parentElement!;
          container.style.position = "relative";

          // ── Create buttons ──
          const addRowBtn = document.createElement("button");
          addRowBtn.className = "table-add-row-btn";
          addRowBtn.type = "button";
          addRowBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
          addRowBtn.style.display = "none";

          const addColBtn = document.createElement("button");
          addColBtn.className = "table-add-col-btn";
          addColBtn.type = "button";
          addColBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
          addColBtn.style.display = "none";

          container.appendChild(addRowBtn);
          container.appendChild(addColBtn);

          let hoveredTable: HTMLTableElement | null = null;
          let hideTimeout: ReturnType<typeof setTimeout> | null = null;

          function positionButtons(table: HTMLTableElement) {
            const tableRect = table.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop;

            // Row button: full-width pill below table
            addRowBtn.style.display = "flex";
            addRowBtn.style.left = `${tableRect.left - containerRect.left}px`;
            addRowBtn.style.top = `${tableRect.bottom - containerRect.top + scrollTop + 4}px`;
            addRowBtn.style.width = `${tableRect.width}px`;

            // Column button: full-height vertical pill to right of table
            addColBtn.style.display = "flex";
            addColBtn.style.left = `${tableRect.right - containerRect.left + 4}px`;
            addColBtn.style.top = `${tableRect.top - containerRect.top + scrollTop}px`;
            addColBtn.style.height = `${tableRect.height}px`;
          }

          function hideButtons() {
            addRowBtn.style.display = "none";
            addColBtn.style.display = "none";
            hoveredTable = null;
          }

          function scheduleHide() {
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideButtons, 300);
          }

          function cancelHide() {
            if (hideTimeout) {
              clearTimeout(hideTimeout);
              hideTimeout = null;
            }
          }

          // Find a ProseMirror position inside a specific cell
          function findCellPos(
            table: HTMLTableElement,
            lastRow: boolean,
            lastCol: boolean,
          ): number | null {
            const rows = table.querySelectorAll("tr");
            if (!rows.length) return null;

            const targetRow = lastRow ? rows[rows.length - 1] : rows[0];
            const cells = targetRow.querySelectorAll("th, td");
            if (!cells.length) return null;

            const targetCell = lastCol
              ? cells[cells.length - 1]
              : cells[0];

            try {
              return editorView.posAtDOM(targetCell, 0);
            } catch {
              return null;
            }
          }

          // ── Event handlers ──
          const onMouseMove = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Hovering over a button — keep visible
            if (
              target === addRowBtn ||
              target === addColBtn ||
              addRowBtn.contains(target) ||
              addColBtn.contains(target)
            ) {
              cancelHide();
              return;
            }

            const table = target.closest("table") as HTMLTableElement | null;
            if (table && container.contains(table)) {
              cancelHide();
              hoveredTable = table;
              positionButtons(table);
            } else if (hoveredTable) {
              scheduleHide();
            }
          };

          const onMouseLeave = () => {
            scheduleHide();
          };

          const onScroll = () => {
            if (hoveredTable && container.contains(hoveredTable)) {
              positionButtons(hoveredTable);
            }
          };

          // ── Click: add row at bottom ──
          addRowBtn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hoveredTable) return;

            const pos = findCellPos(hoveredTable, true, false);
            if (pos !== null) {
              editor.chain().focus(pos).addRowAfter().run();
              // Re-position after DOM update
              requestAnimationFrame(() => {
                if (hoveredTable && container.contains(hoveredTable)) {
                  positionButtons(hoveredTable);
                }
              });
            }
          });

          // ── Click: add column at right ──
          addColBtn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hoveredTable) return;

            const pos = findCellPos(hoveredTable, false, true);
            if (pos !== null) {
              editor.chain().focus(pos).addColumnAfter().run();
              requestAnimationFrame(() => {
                if (hoveredTable && container.contains(hoveredTable)) {
                  positionButtons(hoveredTable);
                }
              });
            }
          });

          // Keep buttons alive when hovered
          addRowBtn.addEventListener("mouseenter", cancelHide);
          addRowBtn.addEventListener("mouseleave", scheduleHide);
          addColBtn.addEventListener("mouseenter", cancelHide);
          addColBtn.addEventListener("mouseleave", scheduleHide);

          container.addEventListener("mousemove", onMouseMove);
          container.addEventListener("mouseleave", onMouseLeave);
          container.addEventListener("scroll", onScroll);

          return {
            update() {
              // Re-position if table still exists after editor update
              if (hoveredTable && container.contains(hoveredTable)) {
                positionButtons(hoveredTable);
              } else if (hoveredTable) {
                hideButtons();
              }
            },
            destroy() {
              container.removeEventListener("mousemove", onMouseMove);
              container.removeEventListener("mouseleave", onMouseLeave);
              container.removeEventListener("scroll", onScroll);
              addRowBtn.remove();
              addColBtn.remove();
              if (hideTimeout) clearTimeout(hideTimeout);
            },
          };
        },
      }),
    ];
  },
});
