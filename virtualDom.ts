type RECYCLED_NODE = 1;
type TEXT_NODE = 3;

type KeyAttribute = string | number | null;

// propにはkeyとoninputやclass、id等のHTMLElementもしくはSVGElementの属性の名前が入ります
interface DOMAttributes {
  key?: KeyAttribute;
  [prop: string]: any;
}

type ElementAttachedVNode = Element & { vdom: VirtualDOMType };

interface VirtualDOMType {
  name: ElementTagNameMap | string;
  props: DOMAttributes;
  children: (VirtualDOMType | string)[];
  realNode?: ElementAttachedVNode;
  nodeType?: RECYCLED_NODE | TEXT_NODE;
  key: KeyAttribute;
}

const TEXT_NODE = 3;
const RECYCLED_NODE = 1;

const createVNode = (
  name: VirtualDOMType["name"],
  props: VirtualDOMType["props"],
  children: VirtualDOMType["children"],
  realNode: VirtualDOMType["realNode"],
  nodeType: VirtualDOMType["nodeType"],
  key: KeyAttribute
): VirtualDOMType => {
  return {
    name,
    props,
    children,
    realNode,
    nodeType,
    key,
  };
};

const createTextVNode = (
  name: string,
  realNode: VirtualDOMType["realNode"]
) => {
  return createVNode(name, {}, [], realNode, TEXT_NODE, null);
};
