import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import PostmanBlock from '../components/PostmanBlock';

export const PostmanNode = Node.create({
  name: 'postmanBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      method: {
        default: 'GET',
        parseHTML: element => element.getAttribute('data-method') || 'GET',
        renderHTML: attributes => {
          return {
            'data-method': attributes.method,
          };
        },
      },
      url: {
        default: '',
        parseHTML: element => element.getAttribute('data-url') || '',
        renderHTML: attributes => {
          if (!attributes.url) return {};
          return {
            'data-url': attributes.url,
          };
        },
      },
      headers: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-headers') || '[]',
        renderHTML: attributes => {
          return {
            'data-headers': attributes.headers,
          };
        },
      },
      body: {
        default: '',
        parseHTML: element => element.getAttribute('data-body') || '',
        renderHTML: attributes => {
          if (!attributes.body) return {};
          return {
            'data-body': attributes.body,
          };
        },
      },
      bodyType: {
        default: 'json',
        parseHTML: element => element.getAttribute('data-body-type') || 'json',
        renderHTML: attributes => {
          return {
            'data-body-type': attributes.bodyType,
          };
        },
      },
      response: {
        default: '',
        parseHTML: element => element.getAttribute('data-response') || '',
        renderHTML: attributes => {
          if (!attributes.response) return {};
          return {
            'data-response': attributes.response,
          };
        },
      },
      collections: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-collections') || '[]',
        renderHTML: attributes => {
          return {
            'data-collections': attributes.collections,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'postman-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['postman-block', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PostmanBlock);
  },
});

