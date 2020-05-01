type TEXT_NODE = 3;

type KeyAttribute = string | number | null;

// propにはkeyとoninputやclass、id等のHTMLElementもしくはSVGElementの属性の名前が入ります
interface DOMAttributes {
  key?: KeyAttribute;
  [prop: string]: any;
}

type ElementAttachedVNode = Element & { vdom?: VirtualNodeType };

interface VirtualNodeType {
  name: ElementTagNameMap | string;
  props: DOMAttributes;
  children: (VirtualNodeType | string)[];
  realNode: ElementAttachedVNode | null;
  nodeType: TEXT_NODE | null;
  key: KeyAttribute;
}

const TEXT_NODE = 3;

const createVNode = (
  name: VirtualNodeType["name"],
  props: VirtualNodeType["props"],
  children: VirtualNodeType["children"],
  realNode?: VirtualNodeType["realNode"],
  nodeType?: VirtualNodeType["nodeType"],
  key?: KeyAttribute
): VirtualNodeType => {
  return {
    name,
    props,
    children,
    realNode: realNode === undefined ? null : realNode,
    nodeType: nodeType === undefined ? null : nodeType,
    key: key === undefined ? null : key,
  };
};

const createTextVNode = (
  name: string,
  realNode?: VirtualNodeType["realNode"]
) => {
  return createVNode(name, {}, [], realNode, TEXT_NODE);
};

// 初期render時に本物のElementからVNodeを作成するための関数
const createVNodeFromRealElement = (realElement: Element): VirtualNodeType => {
  if (realElement.nodeType === TEXT_NODE) {
    return createTextVNode(realElement.nodeName, realElement);
  } else {
    const VNodeChildren: VirtualNodeType[] = [];
    const childrenLength = realElement.childNodes.length;
    for (let i = 0; i < childrenLength; i++) {
      const child = realElement.children.item(i);
      if (child !== null) {
        const childVNode = createVNodeFromRealElement(child);
        VNodeChildren.push(childVNode);
      }
    }

    const VNode = createVNode(
      realElement.nodeName.toLowerCase(),
      {},
      VNodeChildren,
      realElement,
      null
    );
    return VNode;
  }
};

const renderNode = (
  parentNode: Element,
  realNode: VirtualNodeType["realNode"],
  oldVNode: VirtualNodeType | null,
  newVNode: VirtualNodeType
) => {};

export const render = (
  realNode: ElementAttachedVNode,
  newVNode: VirtualNodeType
) => {
  if (realNode.parentElement !== null) {
    let oldVNode: VirtualNodeType;
    if (realNode.vdom === undefined) {
      oldVNode = createVNodeFromRealElement(realNode);
    } else {
      oldVNode = realNode.vdom;
    }

    renderNode(realNode.parentElement, realNode, oldVNode, newVNode);
  } else {
    console.error(
      "Error! render does not work, because the realNode does not have parentNode attribute."
    );
  }
};

export const h = (
  name: VirtualNodeType["name"],
  props: VirtualNodeType["props"],
  children: VirtualNodeType["children"],
  realNode?: VirtualNodeType["realNode"]
) => {
  const VNodeChildren: VirtualNodeType[] = [];
  for (const child of children) {
    if (typeof child === "string") {
      const textVNode = createTextVNode(child);
      VNodeChildren.push(textVNode);
    } else {
      VNodeChildren.push(child);
    }
  }

  const thisVNode = createVNode(
    name,
    props,
    VNodeChildren,
    realNode,
    null,
    props.key
  );

  return thisVNode;
};
