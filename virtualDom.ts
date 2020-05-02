type TEXT_NODE = 3;

type KeyAttribute = string | number;

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
  key: KeyAttribute | null;
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

const mergeProperties = (oldProps: DOMAttributes, newProp: DOMAttributes) => {
  const mergedProperties: DOMAttributes = {};

  for (const propName in oldProps) {
    mergedProperties[propName] = oldProps[propName];
  }

  for (const propName in newProp) {
    mergedProperties[propName] = newProp[propName];
  }

  return mergedProperties;
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

const updateNormalNode = (
  realNode: VirtualNodeType["realNode"],
  oldVNode: VirtualNodeType,
  newVNode: VirtualNodeType
) => {
  if (realNode !== null) {
    for (const propName in mergeProperties(oldVNode.props, newVNode.props)) {
      let compareValue;
      // inputやcheckbox等の入力系
      if (propName === "value" || propName === "checked") {
        compareValue = (realNode as HTMLInputElement)[propName];
      } else if (propName === "selected") {
        //型の関係でselectedだけvalue,checkedと別で比較
        compareValue = (realNode as HTMLOptionElement)[propName];
      } else {
        compareValue = oldVNode.props[propName];
      }
      if (compareValue !== newVNode.props) {
        patchProperty(
          realNode as ElementAttachedNeedAttr,
          propName,
          oldVNode.props[propName],
          newVNode.props[propName]
        );
      }
    }
  } else {
    console.error(
      "Error! renderNormalNode does not work, because realNode is null."
    );
  }
  return realNode;
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
  // 要素の追加、削除、もしくは<div>から<span>等、要素自体を変えた時の入れ替え処理
  else if (oldVNode === null || oldVNode.name !== newVNode.name) {
    const newRealNode = createRealNodeFromVNode(newVNode);
    if (newRealNode !== null) {
      realNode = parentNode.insertBefore(newRealNode, realNode);
    }

    if (oldVNode !== null && oldVNode.realNode !== null) {
      parentNode.removeChild(oldVNode.realNode);
    }
  }
  // 要素の更新
  else {
    // 要素の更新処理本体
    realNode = updateNormalNode(realNode, oldVNode, newVNode);
    if (realNode !== null) {
      // 子要素の作成削除更新処理
      let oldChildNowIndex = 0;
      let newChildNowIndex = 0;
      const oldChildrenLength = oldVNode.children.length;
      const newChildrenlength = newVNode.children.length;

      // 子要素の追加や削除処理の為にoldVNodeでkeyがある要素の連想配列が必要な為作成
      let hasKeyOldChildren: { [key in KeyAttribute]: VirtualNodeType } = {};
      for (const child of oldVNode.children) {
        const childKey = child.key;
        if (childKey !== null) {
          hasKeyOldChildren[childKey] = child;
        }
      }
      oldVNode.children.filter((VNode) => {
        if (VNode.key !== null) {
          return true;
        } else {
          false;
        }
      });
      // 同じく子要素の追加や削除処理の為に必要な為作成
      const renderedNewChildren: { [key in KeyAttribute]: "isRendered" } = {};

      while (newChildNowIndex <= newChildrenlength) {
        const oldChildVNode = oldVNode.children[oldChildNowIndex];
        const newChildVNode = newVNode.children[newChildNowIndex];
        const oldKey = oldChildVNode.key;
        const newKey = newChildVNode.key;

        // 既にrenderされているoldChildVNodeをスキップする処理
        if (oldKey !== null && renderedNewChildren[oldKey] === "isRendered") {
          oldChildNowIndex++;
          continue;
        }

        // NOTE keyを持っていない削除するべき要素を削除する処理
        // ※keyを持っている削除するべき要素は最後にまとめて削除する
        if (
          newKey !== null &&
          newKey === oldChildVNode.children[oldChildNowIndex + 1].key
        ) {
          // keyのない要素は以前のrenderの時と同じ位置になかったら削除する
          if (oldKey === null) {
            realNode.removeChild(
              oldChildVNode.realNode as ElementAttachedNeedAttr
            );
          }
          oldChildNowIndex++;
          continue;
        }

        if (newKey === null) {
          if (oldKey === null) {
            renderNode(
              realNode as ElementAttachedNeedAttr,
              oldChildVNode.realNode,
              oldChildVNode,
              newChildVNode
            );
          }
        } else {
          // 以前のrender時とkeyが変わっていなかった場合、更新
          if (oldKey === newKey) {
            const childRealNode = oldChildVNode.realNode;
            renderNode(
              realNode as ElementAttachedNeedAttr,
              childRealNode,
              oldChildVNode,
              newChildVNode
            );
          } else {
            const previousRenderValue = hasKeyOldChildren[newKey];
            if (
              previousRenderValue !== null ||
              previousRenderValue !== undefined
            ) {
              renderNode(
                realNode as ElementAttachedNeedAttr,
                previousRenderValue.realNode,
                previousRenderValue,
                newChildVNode
              );
              renderedNewChildren[newKey] = "isRendered";
            }
          }
        }

        oldChildNowIndex++;
        newChildNowIndex++;
      }
    } else {
      console.error("renderNode does not work well, because realNode is null.");
    }
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
