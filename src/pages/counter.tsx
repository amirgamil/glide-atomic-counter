import { useEffect, useState } from "react";

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

  async function inc() {
    const response = await fetch(`/api/inc?counter=${counter}`).then((x) =>
      x.json()
    );
    setCount(response.count);
  }

  async function dec() {
    const response = await fetch(`/api/dec?counter=${counter}`).then((x) =>
      x.json()
    );
    setCount(response.count);
  }

  return (
    <div className="flex flex-col space-y-4 items-center">
      <h1
        className="text-5xl mb-10"
        style={{ opacity: count === undefined ? 0 : 1 }}
      >
        {count}
      </h1>
      <caption>Counter: {counter}</caption>
      <div className="grid grid-cols-2 gap-5">
        <button className="rounded-lg border shadow p-4" onClick={dec}>
          Decrement
        </button>
        <button className="rounded-lg border shadow p-4" onClick={inc}>
          Increment
        </button>
      </div>
    </div>
  );
}

export default CounterPage;
