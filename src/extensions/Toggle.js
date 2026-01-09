import { Node } from '@tiptap/core';
import React from 'react';
import { createRoot } from 'react-dom/client';
import EditToggleModal from '../components/EditToggleModal';

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
      icono: {
        default: '',
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
      "data-icono": node.attrs.icono || "",
    },
    ["div", { class: "toggle-header" }, node.attrs.titulo],
    ["div", { class: "toggle-contenido" }, 0],
  ];
},

addNodeView() {
  return ({ node, editor, getPos }) => {
    // Remover console.log para evitar spam en consola

    const wrapper = document.createElement('div');
    wrapper.dataset.tipo = 'toggle';
    wrapper.dataset.abierto = node.attrs.abierto;

    // HEADER
    const header = document.createElement('div');
    header.className = 'toggle-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '8px';
    header.style.cursor = 'pointer';
    header.style.fontWeight = 'bold';
    header.style.userSelect = 'none';
    header.style.marginBottom = '4px';
    header.style.padding = '0.5rem';
    header.style.borderRadius = '4px';
    header.style.transition = 'background-color 0.2s';

    // Contenedor del título (icono + texto editable)
    const tituloContainer = document.createElement('div');
    tituloContainer.style.display = 'flex';
    tituloContainer.style.alignItems = 'center';
    tituloContainer.style.gap = '6px';
    tituloContainer.style.flex = '1';
    tituloContainer.style.minWidth = '0';

    // Icono (si existe)
    const iconoEl = document.createElement('span');
    iconoEl.className = 'toggle-icono';
    iconoEl.style.fontSize = '1.1rem';
    iconoEl.style.flexShrink = '0';
    if (node.attrs.icono) {
      iconoEl.textContent = node.attrs.icono;
    }

    // Título editable
    const tituloEl = document.createElement('span');
    tituloEl.className = 'toggle-titulo';
    tituloEl.contentEditable = 'true';
    tituloEl.style.flex = '1';
    tituloEl.style.minWidth = '0';
    tituloEl.style.outline = 'none';
    tituloEl.style.cursor = 'text';
    tituloEl.textContent = node.attrs.titulo || 'Bloque Desplegable';

    // Prevenir que el click en el título editable active el toggle
    tituloEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Guardar cambios en el título
    tituloEl.addEventListener('blur', () => {
      const nuevoTitulo = tituloEl.textContent.trim() || 'Bloque Desplegable';
      if (nuevoTitulo !== node.attrs.titulo) {
        const tr = editor.state.tr.setNodeMarkup(getPos(), undefined, {
          ...node.attrs,
          titulo: nuevoTitulo,
        });
        editor.view.dispatch(tr);
      }
    });

    // Prevenir Enter en el título (cerrar edición)
    tituloEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tituloEl.blur();
        // Mover el cursor al contenido
        setTimeout(() => {
          editor.chain().focus().run();
        }, 0);
      }
    });

    // Botón para editar título (lápiz)
    const editarBtn = document.createElement('button');
    editarBtn.innerText = '✏️';
    editarBtn.style.fontSize = '0.9rem';
    editarBtn.style.marginLeft = '4px';
    editarBtn.style.cursor = 'pointer';
    editarBtn.style.background = 'none';
    editarBtn.style.border = 'none';
    editarBtn.style.padding = '2px 4px';
    editarBtn.style.borderRadius = '4px';
    editarBtn.style.opacity = '0.6';
    editarBtn.style.transition = 'opacity 0.2s';
    editarBtn.title = 'Editar título';
    editarBtn.type = 'button'; // Asegurar que no sea submit
    editarBtn.setAttribute('data-action', 'edit-toggle');
    editarBtn.style.pointerEvents = 'auto'; // Asegurar que pueda recibir clicks
    editarBtn.style.zIndex = '10'; // Asegurar que esté por encima
    
    // Registrar eventos hover solo si no están ya registrados
    // Usar una propiedad del botón para rastrear si ya están registrados
    if (!editarBtn.dataset.hoverEventsRegistered) {
      editarBtn.dataset.hoverEventsRegistered = 'true';
      editarBtn.addEventListener('mouseenter', () => {
        editarBtn.style.opacity = '1';
      });
      editarBtn.addEventListener('mouseleave', () => {
        editarBtn.style.opacity = '0.6';
      });
    }
    
    // Contenedor para el modal
    let modalContainer = null;
    let modalRoot = null;

    // Función para abrir el modal de edición
    const openEditModal = () => {
      console.log('🔧 openEditModal llamado');
      
      // Intentar obtener la posición del nodo
      let currentPos = null;
      try {
        currentPos = getPos();
        if (typeof currentPos === 'function') {
          // getPos puede ser una función en algunos casos
          currentPos = currentPos();
        }
      } catch (e) {
        console.error('❌ Error al obtener posición:', e);
      }
      
      // Si getPos falla, buscar el nodo usando el wrapper DOM
      if (currentPos === null || currentPos === undefined) {
        console.log('🔧 getPos falló, buscando nodo por DOM...');
        // Buscar el nodo en el documento usando el wrapper como referencia
        const view = editor.view;
        let foundPos = null;
        
        // Buscar todos los nodos toggle y encontrar el que corresponde a este wrapper
        editor.state.doc.descendants((n, pos) => {
          if (n.type.name === 'toggle') {
            try {
              // Intentar obtener el NodeView para esta posición
              const nodeView = view.nodeViews.get(pos);
              if (nodeView && nodeView.dom === wrapper) {
                foundPos = pos;
                return false; // Detener búsqueda
              }
            } catch (e) {
              // Continuar buscando
            }
          }
        });
        
        if (foundPos !== null) {
          currentPos = foundPos;
          console.log('🔧 Nodo encontrado en posición:', currentPos);
        } else {
          console.warn('⚠️ No se pudo encontrar la posición exacta');
        }
      }
      
      // Obtener el nodo actual - usar el del closure si no encontramos posición
      let currentNode = node; // Usar el nodo del closure por defecto
      if (currentPos !== null && currentPos !== undefined) {
        try {
          const nodeAtPos = editor.state.doc.nodeAt(currentPos);
          if (nodeAtPos && nodeAtPos.type.name === 'toggle') {
            currentNode = nodeAtPos;
          }
        } catch (e) {
          console.warn('⚠️ Error al obtener nodo en posición, usando nodo del closure');
        }
      }
      
      if (!currentNode || currentNode.type.name !== 'toggle') {
        console.error('❌ El nodo no es un toggle o no existe');
        return;
      }
      
      // Limpiar modal anterior si existe
      if (modalContainer && modalContainer.parentNode) {
        try {
          if (modalRoot) {
            modalRoot.unmount();
          }
          modalContainer.parentNode.removeChild(modalContainer);
        } catch (e) {
          // Ignorar errores
        }
      }
      
      // Crear nuevo contenedor para el modal
      modalContainer = document.createElement('div');
      modalContainer.id = `toggle-edit-modal-${currentPos}-${Date.now()}`;
      document.body.appendChild(modalContainer);
      modalRoot = createRoot(modalContainer);

      // Renderizar el modal
      modalRoot.render(
        React.createElement(EditToggleModal, {
          isOpen: true,
          onClose: () => {
            if (modalRoot) {
              modalRoot.unmount();
              modalRoot = null;
            }
            if (modalContainer && modalContainer.parentNode) {
              modalContainer.parentNode.removeChild(modalContainer);
            }
            modalContainer = null;
          },
          currentTitulo: currentNode.attrs.titulo || 'Bloque Desplegable',
          currentIcono: currentNode.attrs.icono || '',
          onSave: (data) => {
            // Intentar obtener la posición
            let pos = null;
            try {
              pos = getPos();
            } catch (e) {
              console.error('❌ Error al obtener posición en onSave:', e);
            }
            
            // Si getPos falla, buscar el nodo por atributos
            if (pos === null || pos === undefined) {
              let foundPos = null;
              editor.state.doc.descendants((n, p) => {
                if (n.type.name === 'toggle' && n.attrs.titulo === currentNode.attrs.titulo) {
                  foundPos = p;
                  return false;
                }
              });
              pos = foundPos;
            }
            
            if (pos === null || pos === undefined) {
              console.error('❌ No se pudo obtener la posición para guardar');
              return;
            }
            
            const nodeToUpdate = editor.state.doc.nodeAt(pos);
            if (!nodeToUpdate || nodeToUpdate.type.name !== 'toggle') {
              console.error('❌ El nodo no es un toggle o no existe');
              return;
            }
            
            const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
              ...nodeToUpdate.attrs,
              titulo: data.titulo,
              icono: data.icono,
            });
            editor.view.dispatch(tr);
          }
        })
      );
    };

    // Función para registrar eventos del botón editar (solo una vez)
    // Usar un atributo del botón para rastrear si ya están registrados
    const registerEditButtonEvents = () => {
      if (editarBtn.dataset.eventsRegistered === 'true') {
        return; // Ya están registrados, no hacer nada
      }
      
      console.log('🔧 Registrando eventos del botón editar (una sola vez)');
      editarBtn.dataset.eventsRegistered = 'true';
      
      // Handler para el click - usar mousedown en lugar de click para evitar conflictos
      const handleEditClick = (e) => {
        console.log('🔧 Click en botón editar - handler ejecutado');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openEditModal();
      };
      
      // Usar mousedown como método principal (más confiable que click)
      const handleEditMouseDown = (e) => {
        console.log('🔧 mousedown en botón editar - abriendo modal');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Abrir modal directamente sin setTimeout
        openEditModal();
      };
      
      // Método 1: onclick
      editarBtn.onclick = handleEditClick;
      
      // Método 2: mousedown (más confiable que click)
      editarBtn.addEventListener('mousedown', handleEditMouseDown, true);
      
      // Método 3: click como respaldo
      editarBtn.addEventListener('click', handleEditClick, true);
    };

    // Botón para agregar/editar icono
    const iconoBtn = document.createElement('button');
    iconoBtn.innerText = '🎨';
    iconoBtn.style.fontSize = '0.9rem';
    iconoBtn.style.cursor = 'pointer';
    iconoBtn.style.background = 'none';
    iconoBtn.style.border = 'none';
    iconoBtn.style.padding = '2px 4px';
    iconoBtn.style.borderRadius = '4px';
    iconoBtn.style.opacity = '0.6';
    iconoBtn.style.transition = 'opacity 0.2s';
    iconoBtn.title = 'Agregar/editar icono';
    // Registrar eventos hover solo si no están ya registrados
    if (!iconoBtn.dataset.hoverEventsRegistered) {
      iconoBtn.dataset.hoverEventsRegistered = 'true';
      iconoBtn.addEventListener('mouseenter', () => {
        iconoBtn.style.opacity = '1';
      });
      iconoBtn.addEventListener('mouseleave', () => {
        iconoBtn.style.opacity = '0.6';
      });
    }
    iconoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Obtener posición del botón para mostrar el EmojiPicker
      const rect = iconoBtn.getBoundingClientRect();
      const toggleId = `toggle-${getPos()}-${Date.now()}`;
      
      // Guardar referencia al toggle actual para cuando se seleccione el emoji
      const currentToggleData = {
        toggleId,
        getPos,
        node,
        editor,
        updateIcono: (nuevoIcono) => {
          const currentPos = getPos();
          if (currentPos === null || currentPos === undefined) return;
          
          const currentNode = editor.state.doc.nodeAt(currentPos);
          if (!currentNode || currentNode.type.name !== 'toggle') return;
          
          const tr = editor.state.tr.setNodeMarkup(currentPos, undefined, {
            ...currentNode.attrs,
            icono: nuevoIcono,
          });
          editor.view.dispatch(tr);
        }
      };
      
      // Guardar en el editor para acceso posterior
      if (!editor.storage.toggleEditing) {
        editor.storage.toggleEditing = {};
      }
      editor.storage.toggleEditing[toggleId] = currentToggleData;

      // Calcular posición para el EmojiPicker
      const pickerWidth = 420;
      const pickerHeight = 400;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let leftPosition = rect.left + window.scrollX;
      if (leftPosition + pickerWidth > viewportWidth - 10) {
        leftPosition = viewportWidth - pickerWidth - 10;
      }
      
      let topPosition = rect.bottom + window.scrollY + 5;
      const spaceBelow = viewportHeight - (rect.bottom + window.scrollY);
      if (spaceBelow < pickerHeight && rect.top + window.scrollY > spaceBelow) {
        topPosition = rect.top + window.scrollY - pickerHeight - 5;
      }
      if (topPosition + pickerHeight > viewportHeight - 10) {
        topPosition = viewportHeight - pickerHeight - 10;
      }

      // Disparar evento para abrir el EmojiPicker
      const event = new CustomEvent('open-emoji-picker', {
        detail: {
          editor: editor,
          range: null,
          position: {
            top: Math.max(10, topPosition),
            left: Math.max(10, leftPosition)
          },
          toggleId: toggleId,
          currentEmoji: node.attrs.icono || ''
        },
        bubbles: true,
        cancelable: true
      });
      
      // Disparar el evento en window para asegurar que se capture
      window.dispatchEvent(event);
      
      // También disparar en document por si acaso
      document.dispatchEvent(event);
    });

    // Icono de colapsar (>)
    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'toggle-collapse-icon';
    collapseIcon.textContent = '>';
    collapseIcon.style.fontSize = '1rem';
    collapseIcon.style.flexShrink = '0';
    collapseIcon.style.transition = 'transform 0.2s';
    collapseIcon.style.transform = node.attrs.abierto ? 'rotate(90deg)' : 'rotate(0deg)';
    collapseIcon.style.marginLeft = 'auto';

    // Actualizar icono de colapsar cuando cambia el estado
    const updateCollapseIcon = (abierto) => {
      collapseIcon.style.transform = abierto ? 'rotate(90deg)' : 'rotate(0deg)';
    };

    // CLICK en header para toggle (excepto en el título editable y botones)
    // IMPORTANTE: Registrar DESPUÉS de agregar los botones al DOM
    // Usar capture: false para que los botones manejen primero su evento
    const handleHeaderClick = (e) => {
      // No hacer toggle si se hace click en el título editable o en los botones
      const clickedElement = e.target;
      
      // Verificar si el click es en un botón o dentro de un botón
      const isButtonClick = clickedElement === tituloEl || 
                           clickedElement === iconoBtn || 
                           clickedElement === iconoEl || 
                           clickedElement === editarBtn ||
                           clickedElement.closest('button') !== null;
      
      if (isButtonClick) {
        console.log('🔧 Header click detectado pero es un botón, ignorando');
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const abierto = !(wrapper.dataset.abierto === 'true');
      wrapper.dataset.abierto = abierto;
      content.style.display = abierto ? 'block' : 'none';
      updateCollapseIcon(abierto);

      const tr = editor.state.tr.setNodeMarkup(getPos(), undefined, {
        ...node.attrs,
        abierto,
      });
      editor.view.dispatch(tr);
    };

    tituloContainer.appendChild(iconoEl);
    tituloContainer.appendChild(tituloEl);
    header.appendChild(tituloContainer);
    header.appendChild(editarBtn);
    header.appendChild(iconoBtn);
    header.appendChild(collapseIcon);
    
    // Registrar el listener del header DESPUÉS de agregar los botones al DOM
    header.addEventListener('click', handleHeaderClick, false);
    
    // Registrar eventos del botón editar DESPUÉS de agregar al DOM
    registerEditButtonEvents();

    // CONTENIDO EDITABLE
    const content = document.createElement('div');
    content.className = 'toggle-contenido';
    content.style.borderLeft = '2px solid #ccc';
    content.style.paddingLeft = '8px';
    content.style.marginTop = '4px';
    if (!node.attrs.abierto) content.style.display = 'none';

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    // Registrar delegación de eventos en el wrapper DESPUÉS de agregar los elementos
    wrapper.addEventListener('click', (e) => {
      // Verificar si el click es en el botón editar
      const clickedElement = e.target;
      const isEditButton = clickedElement === editarBtn || 
                          clickedElement.closest('button[data-action="edit-toggle"]') === editarBtn ||
                          (clickedElement.tagName === 'BUTTON' && clickedElement.getAttribute('data-action') === 'edit-toggle');
      
      if (isEditButton) {
        console.log('🔧 Click en botón editar detectado (delegación wrapper)');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openEditModal();
        return;
      }
    }, true); // Usar capture: true para capturar antes que otros handlers

    // Función para limpiar el modal
    const cleanupModal = () => {
      if (modalRoot) {
        try {
          modalRoot.unmount();
        } catch (e) {
          // Ignorar errores al desmontar
        }
        modalRoot = null;
      }
      if (modalContainer && modalContainer.parentNode) {
        try {
          modalContainer.parentNode.removeChild(modalContainer);
        } catch (e) {
          // Ignorar errores al remover
        }
      }
      modalContainer = null;
    };

    return {
      dom: wrapper,
      contentDOM: content,
      destroy: () => {
        cleanupModal();
      },
      update: (updatedNode) => {
        if (updatedNode.type.name !== 'toggle') return false;
        
        // Comparar con el nodo actual
        const currentAttrs = node.attrs;
        const newAttrs = updatedNode.attrs;
        
        // Solo actualizar si realmente cambió algo
        const iconoCambio = newAttrs.icono !== currentAttrs.icono;
        const tituloCambio = newAttrs.titulo !== currentAttrs.titulo;
        const abiertoCambio = newAttrs.abierto !== currentAttrs.abierto;
        
        // Si no hay cambios, solo actualizar la referencia del nodo y retornar true
        // (retornar true significa que el NodeView puede manejar la actualización)
        if (!iconoCambio && !tituloCambio && !abiertoCambio) {
          node = updatedNode;
          return true; // El NodeView puede manejar esta actualización (no hay cambios visuales)
        }
        
        // Hay cambios, actualizar el DOM
        let changed = false;
        
        // Actualizar icono solo si cambió
        if (iconoCambio) {
          if (newAttrs.icono) {
            iconoEl.textContent = newAttrs.icono;
            iconoEl.style.display = 'inline';
          } else {
            iconoEl.textContent = '';
            iconoEl.style.display = 'none';
          }
          changed = true;
        }

        // Actualizar título solo si cambió y no está siendo editado
        if (tituloCambio && document.activeElement !== tituloEl) {
          tituloEl.textContent = newAttrs.titulo || 'Bloque Desplegable';
          changed = true;
        }

        // Actualizar estado de colapsado solo si cambió
        if (abiertoCambio) {
          const abierto = newAttrs.abierto;
          wrapper.dataset.abierto = abierto;
          content.style.display = abierto ? 'block' : 'none';
          updateCollapseIcon(abierto);
          changed = true;
        }

        // Actualizar referencia del nodo
        node = updatedNode;

        // Retornar true significa que el NodeView manejó la actualización
        return true;
      },
    };
  };
}


});









