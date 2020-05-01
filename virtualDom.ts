type TEXT_NODE = 3;

type KeyAttribute = string | number | null;

type DOMAttributeName = "key" | string;
// propにはkeyとoninputやclass、id等のHTMLElementもしくはSVGElementの属性の名前が入ります
interface DOMAttributes {
  key?: KeyAttribute;
  [prop: string]: any;
}

// eventNameはinputやsubmit,click等のoninput等のon以降の文字の小文字が入る
interface HandlersType {
  [eventName: string]: (event: Event) => void;
}

type ElementAttachedNeedAttr = Element & {
  vdom?: VirtualNodeType;
  eventHandlers?: HandlersType; //handlersにイベントを入れておいてoninput等のイベントを管理する
};

type ExpandElement = ElementAttachedNeedAttr | Text;

interface VirtualNodeType {
  name: ElementTagNameMap | string;
  props: DOMAttributes;
  children: VirtualNodeType[];
  realNode: ExpandElement | null;
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

// NOTE ElementAttachedNeedAttr.handlersに存在する関数を呼びだすだけの関数
// イベント追加時にこれをaddEventListenerする事でイベント変更時にElementAttachedNeedAttr.handlersの関数を変えるだけで良い
const listenerFunc = (event: Event) => {
  const realNode = event.currentTarget as ElementAttachedNeedAttr;
  if (realNode.eventHandlers !== undefined) {
    realNode.eventHandlers[event.type](event);
  }
};

// FIXME SVG系の処理を入れる
const patchProperty = (
  realNode: ElementAttachedNeedAttr,
  propName: DOMAttributeName,
  oldPropValue: any,
  newPropValue: any
) => {
  // NOTE key属性は一つのrealNodeに対して固有でないといけないから変更しない
  if (propName === "key") {
  }
  // イベントリスナー属性について
  else if (propName[0] === "o" && propName[1] === "n") {
    const eventName = propName.slice(2).toLowerCase();

    if (realNode.eventHandlers === undefined) {
      realNode.eventHandlers = {};
    }

    realNode.eventHandlers[eventName] = newPropValue;

    if (
      newPropValue === null ||
      newPropValue === undefined ||
      newPropValue === false
    ) {
      realNode.removeEventListener(eventName, listenerFunc);
    } else if (!oldPropValue) {
      realNode.addEventListener(eventName, listenerFunc);
    }
  }
  // 属性を削除する場合
  else if (newPropValue === null || newPropValue === undefined) {
    realNode.removeAttribute(propName);
  } else {
    realNode.setAttribute(propName, newPropValue);
  }
};

// FIXME isSVG等のフラグを追加してSVGも作成できるようにする
const createRealNodeFromVNode = (VNode: VirtualNodeType) => {
  let realNode: Element | Text;
  if (VNode.nodeType === TEXT_NODE) {
    if (typeof VNode.name === "string") {
      realNode = document.createTextNode(VNode.name);
    } else {
      console.error(
        "Error! createRealNodeFromVNode does not work, because rendering nodeType is TEXT_NODE, but VNode.name is not string"
      );
      return null;
    }
  } else {
    // FIXME createElementは受け取る引数の型が決まっていているが結構適当にstring型で渡してしまった。後でcreateElementの受け取る型について調べて直す
    realNode = document.createElement(VNode.name as string);
    for (const propName in VNode.props) {
      patchProperty(realNode, propName, null, VNode.props[propName]);
    }

    for (const child of VNode.children) {
      const realChildNode = createRealNodeFromVNode(child);
      if (realChildNode !== null) {
        realNode.append(realChildNode);
      }
    }
  }
  return realNode;
};

const renderTextNode = (
  realNode: VirtualNodeType["realNode"],
  newVNode: VirtualNodeType
) => {
  if (realNode !== null) {
    if (typeof newVNode.name === "string") {
      realNode.nodeValue = newVNode.name;
      return realNode;
    } else {
      console.error(
        "Error! renderNode does not work, because rendering nodeType is TEXT_NODE, but newNode.name is not string."
      );
      return realNode;
    }
  } else {
    console.error(
      "Error! renderNode does not work, because redering nodeType is TEXT_NODE, but realNode is null. can't add text to node"
    );
    return realNode;
  }
};

const renderNode = (
  parentNode: Element,
  realNode: VirtualNodeType["realNode"],
  oldVNode: VirtualNodeType | null,
  newVNode: VirtualNodeType
) => {
  if (newVNode === oldVNode) {
  } else if (
    oldVNode !== null &&
    newVNode.nodeType === TEXT_NODE &&
    oldVNode.nodeType === TEXT_NODE
  ) {
    realNode = renderTextNode(realNode, newVNode);
  }
};

export const render = (
  realNode: ElementAttachedNeedAttr,
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
