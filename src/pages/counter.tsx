import { useEffect, useState } from "react";
import * as SVGLoaders from "svg-loaders-react";

const Button: React.FC<{ onClick?: () => void; className?: string }> = (
  props
) => {
  return (
    <button
      className={`py-6 text-2xl border rounded-lg shadow font-bold ${
        props.className ?? ""
      }`}
      style={{ touchAction: "manipulation" }}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

function CounterPage() {
  const [counter, setCounter] = useState<string | undefined>(undefined);
  const [count, setCount] = useState<number | undefined>(undefined);

  function refresh(localCounter = counter) {
    fetch(`/api/peek?counter=${localCounter}`)
      .then((x) => x.json())
      .then((x) => setCount(x.count));
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const counter = params.get("counter") ?? "root";
    setCounter(counter);

    refresh(counter);
    setInterval(() => refresh(counter), 2500);
  }, []);

  function inc() {
    // Count optimisically
    setCount(count ?? 0 + 1);
    setTimeout(async () => {
      const response = await fetch(`/api/inc?counter=${counter}`).then((x) =>
        x.json()
      );
      setCount(response.count);
    });
  }

  function dec() {
    // Count optimisically
    setCount(count ?? 0 - 1);
    setTimeout(async () => {
      const response = await fetch(`/api/dec?counter=${counter}`).then((x) =>
        x.json()
      );
      setCount(response.count);
    });
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-4">
      <div className="flex items-center py-20 h-28">
        {count !== undefined ? (
          <h1 className="text-8xl">{count}</h1>
        ) : (
          <SVGLoaders.SpinningCircles stroke="#aaa" />
        )}
      </div>

      <div className="flex flex-col w-full space-y-8">
        <Button onClick={inc} className="text-white bg-green-600">
          + Count
        </Button>
        <Button onClick={dec} className="text-white bg-red-500">
          – Count
        </Button>
      </div>
    </div>
  );
}

export default CounterPage;
