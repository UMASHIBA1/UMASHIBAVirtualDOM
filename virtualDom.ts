type RECYCLED_NODE = 1;
type TEXT_NODE = 3;

type KeyAttribute = string | number | null | undefined;

// propにはkeyとoninputやclass、id等のHTMLElementもしくはSVGElementの属性の名前が入ります
interface DOMAttributes {
  key: KeyAttribute;
  [prop: string]: any;
}

type ElementAttachedVDOM = Element & { vdom: VirtualDOMType };

interface VirtualDOMType {
  name: ElementTagNameMap;
  props: DOMAttributes;
  children: (VirtualDOMType | string)[];
  realNode: Element;
  nodeType?: RECYCLED_NODE | TEXT_NODE;
  key: KeyAttribute;
}
