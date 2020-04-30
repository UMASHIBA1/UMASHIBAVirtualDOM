type RECYCLED_NODE = 1;
type TEXT_NODE = 3;

type KeyAttribute = string | number | null;

// propにはkeyとoninputやclass、id等のHTMLElementもしくはSVGElementの属性の名前が入ります
interface DOMAttributes {
  key?: KeyAttribute;
  [prop: string]: any;
}

type ElementAttachedVNode = Element & { vdom: VirtualNodeType };

interface VirtualNodeType {
  name: ElementTagNameMap | string;
  props: DOMAttributes;
  children: (VirtualNodeType | string)[];
  realNode: ElementAttachedVNode | null;
  nodeType: RECYCLED_NODE | TEXT_NODE;
  key: KeyAttribute;
}

const TEXT_NODE = 3;
const RECYCLED_NODE = 1;

const createVNode = (
  name: VirtualNodeType["name"],
  props: VirtualNodeType["props"],
  children: VirtualNodeType["children"],
  realNode: VirtualNodeType["realNode"],
  nodeType: VirtualNodeType["nodeType"],
  key: KeyAttribute
): VirtualNodeType => {
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
  realNode: VirtualNodeType["realNode"]
) => {
  return createVNode(name, {}, [], realNode, TEXT_NODE, null);
};
