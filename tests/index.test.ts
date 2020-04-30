import { h } from "../virtualDom";

describe("h func test", () => {
  // normalArguments
  const name = "div";
  const props = { id: "sample" };
  const children: any[] = [];

  const normalVNode = {
    name: "div",
    props: { id: "sample" },
    children: [],
    realNode: null,
    nodeType: null,
    key: null,
  };

  const sampleText = "sampleText";
  const textVNode = {
    name: sampleText,
    props: {},
    children: [],
    realNode: null,
    nodeType: 3,
    key: null,
  };
  //

  test("normalArguments return correct result", () => {
    expect(h(name, props, children)).toEqual(normalVNode);
  });

  test("have VirtualNodeType children arguments return correct result", () => {
    expect(
      h(name, props, [h(name, props, children), h(name, props, children)])
    ).toEqual({
      name: "div",
      props: { id: "sample" },
      children: [normalVNode, normalVNode],
      realNode: null,
      nodeType: null,
      key: null,
    });
  });

  test("have string children arguments return correct result", () => {
    expect(h(name, props, [sampleText, sampleText])).toEqual({
      name: "div",
      props: { id: "sample" },
      children: [textVNode, textVNode],
      realNode: null,
      nodeType: null,
      key: null,
    });
  });

  test("have mixed children arguments return correct result", () => {
    expect(h(name, props, [h(name, props, children), sampleText])).toEqual({
      name: "div",
      props: { id: "sample" },
      children: [normalVNode, textVNode],
      realNode: null,
      nodeType: null,
      key: null,
    });
  });
});
