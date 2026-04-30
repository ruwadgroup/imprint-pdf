type JSXElementNode = {
  openingElement: { name: { type: string; name: string } };
};

function isDocument(node: JSXElementNode): boolean {
  return (
    node.openingElement.name.type === 'JSXIdentifier' &&
    node.openingElement.name.name === 'Document'
  );
}

export function createDocumentScope(): {
  enter: (node: JSXElementNode) => void;
  exit: (node: JSXElementNode) => void;
  active: () => boolean;
} {
  let depth = 0;
  return {
    enter(node) {
      if (isDocument(node)) depth++;
    },
    exit(node) {
      if (isDocument(node)) depth--;
    },
    active() {
      return depth > 0;
    },
  };
}
