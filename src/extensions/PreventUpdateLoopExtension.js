import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Extensión para prevenir bucles infinitos cuando se inserta contenido programáticamente
 * Marca las transacciones que vienen de comandos slash o inserciones programáticas
 */
export const PreventUpdateLoopExtension = Extension.create({
  name: 'preventUpdateLoop',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('preventUpdateLoop'),
        appendTransaction(transactions, oldState, newState) {
          // Marcar transacciones que vienen de comandos slash o inserciones programáticas
          // Estas transacciones tienen metadata específica o vienen de comandos
          const tr = newState.tr;
          
          // Verificar si alguna de las transacciones viene de una inserción programática
          const isProgrammatic = transactions.some(tr => {
            // Verificar metadata que indica inserción programática
            return tr.getMeta('preventUpdate') || 
                   tr.getMeta('jsonFormatter') ||
                   tr.getMeta('addToHistory') === false ||
                   // Si la transacción no tiene steps de usuario (viene de código)
                   (!tr.steps.some(step => step.stepType !== 'replace'));
          });
          
          if (isProgrammatic) {
            tr.setMeta('preventUpdate', true);
          }
          
          return tr;
        },
      }),
    ];
  },
});

