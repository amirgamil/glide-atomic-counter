import { useEffect, useState } from "react";
import * as SVGLoaders from "svg-loaders-react";

const Button: React.FC<{ onClick?: () => void; className?: string }> = (
  props
) => {
  return (
    <button
      className={`py-6 text-2xl rounded-xl shadow font-bold ${
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
  const [maxCap, setMax] = useState<number>(0);
  const [count, setCount] = useState<number | undefined>(undefined);


  function refresh(localCounter = counter, maxCapacity = maxCap) {
    fetch(`/api/peek?counter=${localCounter}`)
      .then((x) => x.json())
      .then((x) => setCount(maxCapacity - x.count));
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const counter = params.get("counter") ?? "root";
    //default to 5000 if not set
    const maxParam = parseInt(params.get("max") ?? "5000");
    setMax(maxParam);
    setCounter(counter);
    
    refresh(counter, maxParam);
    setInterval(() => refresh(counter, maxParam), 2500);
  }, []);

  //icrement the number of seats taken (decrement available sets)
  function inc() {
    // Count optimisically
    setCount(count ?? 0 - 1);
    setTimeout(async () => {
      const response = await fetch(`/api/inc?counter=${counter}`).then((x) =>
        x.json()
      );
      setCount(maxCap - response.count);
    });
  }

  //decrement the number of seats taken (decrement available sets)
  function dec() {
    // Count optimisically
    setCount(count ?? 0 + 1);
    setTimeout(async () => {
      const response = await fetch(`/api/dec?counter=${counter}`).then((x) =>
        x.json()
      );
      setCount(maxCap- response.count);
    });
  }
  const widthProg = Math.round(((maxCap - (count ?? 0)) / maxCap) * 100).toLocaleString() + "%";
  return (
    <div className="flex flex-col items-center p-6">
      <div className="flex items-center h-60">
        {count !== undefined ? (
          <h1 className="font-black text-9xl dark:text-white">{count}</h1>
        ) : (
          <SVGLoaders.Oval stroke="#666" />
        )}
      </div>
      <div className="relative pt-1">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blueGray-200">
          <div style={{ width: widthProg }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blueGray-500"></div>
        </div>
      </div>

      <div className="flex flex-col w-full space-y-6">
        <Button onClick={inc} className="text-white bg-green-500">
          + Check-in
        </Button>
        <Button onClick={dec} className="text-white bg-red-500">
          – Check-out
        </Button>
      </div>
    </div>
  );
}

export default CounterPage;
