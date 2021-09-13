import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";

function CounterPage() {
  const router = useRouter();
  const counter = router.query.counter ?? "root";

  const [count, setCount] = useState<number | undefined>(undefined);

  function refresh() {
    fetch(`/api/peek?counter=${counter}`)
      .then((x) => x.json())
      .then((x) => setCount(x.count));
  }

  useEffect(() => {
    refresh();
    setInterval(refresh, 2500);
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
