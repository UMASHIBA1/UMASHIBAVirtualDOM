import { h } from "../virtualDom";

test(`h('div', {id: 'sample'}, []) return 
{name: 'div', 
props: {id: 'sample'}, 
children: [], 
realNode: null, 
nodeType: null, 
key: null}`, () => {
  expect(h("div", { id: "sample" }, [])).toEqual({
    name: "div",
    props: { id: "sample" },
    children: [],
    realNode: null,
    nodeType: null,
    key: null,
  });
});
