import TableCell from "@tiptap/extension-table-cell";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

export const TableCellExtended = TableCell.extend({
  name: 'tableCell',

  addAttributes() {
    return {
      ...this.parent?.(),
      tipo: {
        default: "text", // text | number | select | checkbox | image | percent | formula
      },
    };
  },

  addNodeView() {
    return ({ node, updateAttributes }) => {
      const tipo = node.attrs.tipo;
      const wrapper = document.createElement("td");

      const renderContent = () => {
        wrapper.innerHTML = ""; // limpia el contenido

        switch (tipo) {
          case "checkbox":
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = node.content?.content?.[0]?.text === "true";
            input.onchange = () => {
              wrapper.innerHTML = input.outerHTML;
              updateAttributes({ content: input.checked ? "true" : "false" });
            };
            wrapper.appendChild(input);
            break;

          case "percent":
            const value = parseInt(node.content?.content?.[0]?.text || "0", 10);
            const bar = document.createElement("div");
            bar.innerHTML = `
              <div style="width: 100%; background: #eee; border-radius: 4px; height: 12px; overflow: hidden;">
                <div style="width: ${value}%; background: #38bdf8; height: 100%;"></div>
              </div>
              <div style="text-align: center; font-size: 0.8rem; margin-top: 2px;">${value}%</div>
            `;
            wrapper.appendChild(bar);
            break;

          default:
            const content = document.createElement("div");
            content.setAttribute("data-type", tipo);
            content.style.minHeight = "24px";
            content.style.outline = "none";
            content.style.cursor = "text";
            content.contentEditable = true;
            wrapper.appendChild(content);
            break;
        }
      };

      renderContent();
      return {
        dom: wrapper,
        contentDOM: wrapper.querySelector("div[data-type]") || null,
      };
    };
  },
});

