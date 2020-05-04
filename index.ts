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
        h("h1", {}, [state]), //タダの文字を表したい場合はh関数のchildrenに文字のみ渡す
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

setState("Hello");
