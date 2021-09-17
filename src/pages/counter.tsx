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
      style={{ touchAction: "manipulation", userSelect: "none" }}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

function CounterPage() {
  const [counter, setCounter] = useState<string | undefined>(undefined);
  const [maxCap, setMax] = useState<number>(0);
  const [count, setCount] = useState<number | undefined>(4500);
  const [savedSeats, setSavedSeats] = useState<number>(0);
  const [expiringSoon, setExpiringSoon] = useState<number>(0);

  function refresh(localCounter = counter, maxCapacity = maxCap) {
    fetch(`/api/peek?counter=${localCounter}`)
      .then((x) => x.json())
      .then((x) => setCount(maxCapacity - x.count));
  }

  function refreshSavedSeats() {
    fetch(`api/updateReserved?counter=${counter}`)
      .then((x) => x.json())
      .then((x) => {
        setSavedSeats(x.savedSeats);
        setExpiringSoon(x.expiringSoon);
      });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const counter = params.get("counter") ?? "root";
    //default to 5000 if not set
    const maxParam = parseInt(params.get("max") ?? "5000");
    setMax(maxParam);
    setCounter(counter);
    //will have to hit the reserve seats endpoint here
    setSavedSeats(0);
    refresh(counter, maxParam);
    setInterval(() => {
      refresh(counter, maxParam);
      refreshSavedSeats();
    }, 2500);
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
      setCount(maxCap - response.count);
    });
  }
  const widthProg =
    Math.round(((maxCap - (count ?? 0)) / maxCap) * 100).toLocaleString() + "%";
  console.log(widthProg);
  return (
    <div className="flex flex-col items-center p-6">
      <h5>Hole {counter}</h5>
      <div
        style={{
          flexDirection: "column",
          margin: "25px 0 0 0",
          padding: "0 0 20px 0",
        }}
        className="flex items-center"
      >
        {count !== undefined ? (
          <h3 className="font-black text-7xl dark:text-white">{count}</h3>
        ) : (
          <SVGLoaders.Oval stroke="#666" />
        )}
        <p style={{ width: "100%", textAlign: "center" }}>available seats</p>
      </div>
      <div style={{ marginBottom: "15px", width: "calc(100% - 2em)" }}>
        <h3 style={{ width: "100%", textAlign: "center" }}>{widthProg} full</h3>
        <div
          style={{
            position: "relative",
            margin: "10px 0 10px 0",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "rgb(220,220,220, 0.7)",
              borderRadius: "5px",
            }}
          >
            <div
              style={{
                width: widthProg,
                backgroundColor: "red",
                height: "8px",
                borderRadius: "5px",
              }}
            ></div>
          </div>
        </div>
        <div style={{ width: "100%" }}>
          <ul style={{ width: "100%", lineHeight: "35px" }}>
            <li style={{ borderBottom: "2px solid rgb(220,220,220, 0.7)" }}>
              Seats Taken: {maxCap - (count ?? 0)}
            </li>
            <li style={{ borderBottom: "2px solid rgb(220,220,220, 0.7)" }}>
              Seats Saved: {savedSeats}
            </li>
            <li>Saves Expiring Soon: {savedSeats}</li>
          </ul>
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
