import Image from '@tiptap/extension-image';

export const ImageExtended = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      'data-filename': {
        default: null,
        parseHTML: element => element.getAttribute('data-filename'),
        renderHTML: attributes => {
          if (!attributes['data-filename']) {
            return {};
          }
          return {
            'data-filename': attributes['data-filename'],
          };
        },
      },
    };
  },
});

