import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import CalendarStyle from './CalendarStyle';

export const CalendarNode = Node.create({
  name: 'calendar',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      calendarId: {
        default: null,
        parseHTML: element => {
          return element.getAttribute('data-calendar-id');
        },
        renderHTML: attributes => {
          if (attributes.calendarId) {
            return {
              'data-calendar-id': attributes.calendarId,
            };
          }
          return {};
        },
      },
      viewMode: {
        default: 'month',
        parseHTML: element => {
          return element.getAttribute('data-view-mode') || 'month';
        },
        renderHTML: attributes => {
          return {
            'data-view-mode': attributes.viewMode || 'month',
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'calendar-view' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['calendar-view', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalendarStyle);
  }
});









