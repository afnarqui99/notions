import { Node } from '@tiptap/core';

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      abierto: {
        default: true,
      },
      titulo: {
        default: 'Bloque Desplegable',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-tipo="toggle"]' }];
  },

renderHTML({ node }) {
  return [
    "div",
    {
      "data-tipo": "toggle",
      "data-abierto": node.attrs.abierto,
    },
    ["div", { class: "toggle-header" }, node.attrs.titulo],
    ["div", { class: "toggle-contenido" }, 0],
  ];
},

addNodeView() {
  return ({ node, editor, getPos }) => {
    console.log("👀 NodeView aplicado para toggle");

    const wrapper = document.createElement('div');
    wrapper.dataset.tipo = 'toggle';
    wrapper.dataset.abierto = node.attrs.abierto;

    // HEADER
    const header = document.createElement('div');
    header.className = 'toggle-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.cursor = 'pointer';
    header.style.fontWeight = 'bold';
    header.style.userSelect = 'none';
    header.style.marginBottom = '4px';

    const tituloEl = document.createElement('span');
    tituloEl.innerText = node.attrs.titulo || 'Bloque Desplegable';

    const editarBtn = document.createElement('button');
    editarBtn.innerText = '✏️';
    editarBtn.style.fontSize = '0.9rem';
    editarBtn.style.marginLeft = '8px';
    editarBtn.style.cursor = 'pointer';
    editarBtn.title = 'Editar título';
    editarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const nuevoTitulo = prompt(':', node.attrs.titulo);
      if (nuevoTitulo && nuevoTitulo !== node.attrs.titulo) {
        const tr = editor.state.tr.setNodeMarkup(getPos(), undefined, {
          ...node.attrs,
          titulo: nuevoTitulo,
        });
        editor.view.dispatch(tr);
      }
    });

    // CLICK en título para toggle
    tituloEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const abierto = !(wrapper.dataset.abierto === 'true');
      wrapper.dataset.abierto = abierto;
      content.style.display = abierto ? 'block' : 'none';

      const tr = editor.state.tr.setNodeMarkup(getPos(), undefined, {
        ...node.attrs,
        abierto,
      });
      editor.view.dispatch(tr);
    });

    header.appendChild(tituloEl);
    header.appendChild(editarBtn);

    // CONTENIDO EDITABLE
    const content = document.createElement('div');
    content.className = 'toggle-contenido';
    content.style.borderLeft = '2px solid #ccc';
    content.style.paddingLeft = '8px';
    content.style.marginTop = '4px';
    if (!node.attrs.abierto) content.style.display = 'none';

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    return {
      dom: wrapper,
      contentDOM: content,
    };
  };
}


});

