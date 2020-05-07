// 型の定義

type TEXT_NODE = 3;

type KeyAttribute = string | number;

type DOMAttributeName = "key" | string;
// propにはkeyやonclick、class、id等のHTMLElementの属性の名前が入ります
interface DOMAttributes {
  key?: KeyAttribute;
  [prop: string]: any;
}

// eventNameはinputやsubmit,click等のoninput等のon以降の文字の小文字が入る
interface HandlersType {
  [eventName: string]: (event: Event) => void;
}

type ElementAttachedNeedAttr = HTMLElement & {
  vdom?: VirtualNodeType;
  eventHandlers?: HandlersType; //handlersにイベントを入れておいてoninput等のイベントを管理する
};

type TextAttachedVDom = Text & {
  vdom?: VirtualNodeType;
};

type ExpandElement = ElementAttachedNeedAttr | TextAttachedVDom;

interface VirtualNodeType {
  name: HTMLElementTagNameMap | string; // divやh1等の場合はHTMLElementTagNameMap、文字を表すVNodeの場合はstring型
  props: DOMAttributes; //HTML要素の属性
  children: VirtualNodeType[]; //子要素のVNodeのリスト
  realNode: ExpandElement | null; //実際の要素への参照
  nodeType: TEXT_NODE | null; // このVNodeのタイプ(文字を表すノードなのか要素を表すノードなのか)
  key: KeyAttribute | null; //keyを表す
}

// -------------------------型の定義ここまで-----------------------------

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
const createVNodeFromRealElement = (
  realElement: HTMLElement
): VirtualNodeType => {
  if (realElement.nodeType === TEXT_NODE) {
    return createTextVNode(realElement.nodeName, realElement);
  } else {
    const VNodeChildren: VirtualNodeType[] = [];
    const childrenLength = realElement.childNodes.length;
    for (let i = 0; i < childrenLength; i++) {
      const child = realElement.children.item(i);
      if (child !== null) {
        const childVNode = createVNodeFromRealElement(child as HTMLElement);
        VNodeChildren.push(childVNode);
      }
    }

    const props: VirtualNodeType["props"] = {};
    if (realElement.hasAttributes()) {
      const attributes = realElement.attributes;
      const attrLength = attributes.length;
      for (let i = 0; i < attrLength; i++) {
        const { name, value } = attributes[i];
        props[name] = value;
      }
    }

    const VNode = createVNode(
      realElement.nodeName.toLowerCase(),
      props,
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

const createRealNodeFromVNode = (VNode: VirtualNodeType) => {
  let realNode: ElementAttachedNeedAttr | TextAttachedVDom;
  if (VNode.nodeType === TEXT_NODE) {
    if (typeof VNode.name === "string") {
      realNode = document.createTextNode(VNode.name);
      // NOTE 要素を新しく作成する場合はchildrenに対してcreateRealNodeFromVNodeを再帰的に
      // 呼んでいる関係でここでVNodeとrealNodeの相互参照を作成する
      VNode.realNode = realNode;
      realNode.vdom = VNode;
    } else {
      console.error(
        "Error! createRealNodeFromVNode does not work, because rendering nodeType is TEXT_NODE, but VNode.name is not string"
      );
      return null;
    }
  } else {
    realNode = document.createElement(VNode.name as string);
    for (const propName in VNode.props) {
      patchProperty(realNode, propName, null, VNode.props[propName]);
    }
    // NOTE 要素を新しく作成する場合はchildrenに対してcreateRealNodeFromVNodeを再帰的に
    // 呼んでいる関係でここでVNodeとrealNodeの相互参照を作成する
    VNode.realNode = realNode;
    realNode.vdom = VNode;

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
        "Error! renderTextNode does not work, because rendering nodeType is TEXT_NODE, but newNode.name is not string."
      );
      return realNode;
    }
  } else {
    console.error(
      "Error! renderTextNode does not work, because redering nodeType is TEXT_NODE, but realNode is null. can't add text to node"
    );
    return realNode;
  }
};

// 渡された要素は更新するがそのchildrenは更新しない
const updateOnlyThisNode = (
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
      `Error! updateOnlyThisNode does not work, because realNode is null.\n
      [info]: oldVNode.name: ${oldVNode.name}, newVNode.name: ${newVNode.name}
      `
    );
  }
  return realNode;
};

const renderNode = (
  parentNode: HTMLElement,
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
  // 要素の追加、削除、もしくは<div>から<span>等、要素の種類自体を変えた時の入れ替え処理
  else if (oldVNode === null || oldVNode.name !== newVNode.name) {
    const newRealNode = createRealNodeFromVNode(newVNode);
    if (newRealNode !== null) {
      parentNode.insertBefore(newRealNode, realNode);
    }

    if (oldVNode !== null && oldVNode.realNode !== null) {
      parentNode.removeChild(oldVNode.realNode);
    }
  }
  // 要素の更新
  else {
    // 要素の更新処理本体
    realNode = updateOnlyThisNode(realNode, oldVNode, newVNode);
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
      // 同じく子要素の追加や削除処理の為に必要な為作成
      const renderedNewChildren: { [key in KeyAttribute]: "isRendered" } = {};

      while (newChildNowIndex < newChildrenlength) {
        let oldChildVNode: VirtualNodeType | null;
        let oldKey: string | number | null;
        if (oldVNode.children[oldChildNowIndex] === undefined) {
          oldChildVNode = null;
          oldKey = null;
        } else {
          oldChildVNode = oldVNode.children[oldChildNowIndex];
          oldKey = oldChildVNode.key;
        }
        const newChildVNode = newVNode.children[newChildNowIndex];
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
          oldChildVNode !== null &&
          oldChildVNode.children[oldChildNowIndex + 1] !== undefined &&
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

        // keyを持っていない子要素の更新処理
        if (newKey === null) {
          if (oldChildVNode !== null && oldKey === null) {
            renderNode(
              realNode as ElementAttachedNeedAttr,
              oldChildVNode.realNode,
              oldChildVNode,
              newChildVNode
            );
            newChildNowIndex++;
          }
          oldChildNowIndex++;
        } else {
          // 以前のrender時とkeyが変わっていなかった場合、更新
          if (oldChildVNode !== null && oldKey === newKey) {
            const childRealNode = oldChildVNode.realNode;
            renderNode(
              realNode as ElementAttachedNeedAttr,
              childRealNode,
              oldChildVNode,
              newChildVNode
            );
            renderedNewChildren[newKey] = "isRendered";
            oldChildNowIndex++;
          } else {
            const previousRenderValue = hasKeyOldChildren[newKey];
            // 以前のrender時には既にこのkeyを持つ要素が存在していた場合
            if (
              previousRenderValue !== null &&
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
            // keyを持つ要素の追加処理
            else {
              renderNode(
                realNode as ElementAttachedNeedAttr,
                null,
                null,
                newChildVNode
              );
            }
            renderedNewChildren[newKey] = "isRendered";
          }

          newChildNowIndex++;
        }
      }

      // 前のwhile処理で利用されなかった到達しなかったoldVNodeのindexの内keyを持っていないモノを削除
      while (oldChildNowIndex < oldChildrenLength) {
        const unreachOldVNode = oldVNode.children[oldChildNowIndex];
        if (unreachOldVNode.key === null || unreachOldVNode.key === undefined) {
          if (unreachOldVNode.realNode !== null) {
            realNode.removeChild(unreachOldVNode.realNode);
          }
        }
        oldChildNowIndex++;
      }

      // keyをもつoldVNodeの子要素の中で新しいVNodeでは削除されているものを削除
      for (const oldKey in hasKeyOldChildren) {
        if (
          renderedNewChildren[oldKey] === null ||
          renderedNewChildren[oldKey] === undefined
        ) {
          const willRemoveNode = hasKeyOldChildren[oldKey].realNode;
          if (willRemoveNode !== null) {
            realNode.removeChild(willRemoveNode);
          }
        }
      }
    } else {
      console.error("renderNode does not work well, because realNode is null.");
    }
  }

  if (realNode !== null) {
    // NOTE newVNodeに対応する実際の要素を代入する。これを次の更新の際に使う
    newVNode.realNode = realNode;
    // NOTE 今後更新する際に差分を検出する為実際のHTML要素に対してvdomプロパティを加える
    // このvdomプロパティが次の更新の際のoldVNodeになる
    realNode.vdom = newVNode;
  }

  return realNode;
};

export const render = (
  realNode: ElementAttachedNeedAttr,
  newVNode: VirtualNodeType
) => {
  if (realNode.parentElement !== null) {
    let oldVNode: VirtualNodeType | null;
    // NOTE realNode.vdomがあった場合はoldVNodeにそれをいれる。oldVNodeは更新の際の差分検出処理に使う
    if (realNode.vdom === undefined) {
      oldVNode = null;
    } else {
      oldVNode = realNode.vdom;
    }

    renderNode(realNode.parentElement, realNode, oldVNode, newVNode);
  } else {
    console.error(
      "Error! render func does not work, because the realNode does not have parentNode attribute."
    );
  }
};

export const h = (
  name: VirtualNodeType["name"],
  props: VirtualNodeType["props"],
  children: (VirtualNodeType | string)[],
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
