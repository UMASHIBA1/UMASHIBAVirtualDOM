import { h, render } from "./virtualDom";

interface HTMLElementEvent<T extends HTMLElement> extends Event {
  target: T;
}

const setState = (state: string) => {
  const node = document.getElementById("app");

  if (node !== null) {
    render(
      node,
      h("div", {}, [
        h("h1", {}, [state]),
        h(
          "input",
          {
            type: "text",
            value: state,
            oninput: (e: HTMLElementEvent<HTMLInputElement>) =>
              setState(e.target.value),
            autofocus: true,
          },
          []
        ),
      ])
    );
  }
};
