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


  function refresh(localCounter = counter, maxCapacity = maxCap) {
    fetch(`/api/peek?counter=${localCounter}`)
      .then((x) => x.json())
      .then((x) => setCount(maxCapacity - x.count));
  }

  function refreshSavedSeats() {
    fetch(`api/updateReserved`)
    .then((x) => x.json())
    .then((x) => setSavedSeats(x.savedSeats));
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
    setInterval(() => refresh(counter, maxParam), 2500);
  }, []);



  function unreserveSeat(seatID: string) {
    if (savedSeats > 0) {
      setSavedSeats(savedSeats ?? 0 - 1);
      setTimeout(async () => {
        const response = await fetch(`/api/unreserve?counter=${counter}&seatID=${seatID}`).then((x) => x.json());
        setSavedSeats(response.savedSeats);
      })
    }
  } 

  function reserveSeat(seatID: string) {
    if (savedSeats < (counter ?? maxCap)) {
      setSavedSeats(savedSeats ?? 0 + 1);
      setTimeout(async () => {
        const response = await fetch(`/api/reserve?counter=${counter}&seatID=${seatID}`)
        .then((x) => x.json());
        setSavedSeats(response.savedSeats);
      })
    }
  }

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
  const widthProg = Math.round(((maxCap - (count ?? 0)) / maxCap) * 100).toLocaleString() + "%";
  console.log(widthProg);
  return (
    <div className="flex flex-col items-center p-6">
      <div style={{flexDirection: "column", margin: "25px 0 0 0", padding: "0 0 20px 0"}} className="flex items-center">
        {count !== undefined ? (
          <h2 className="font-black text-9xl dark:text-white">{count}</h2>
        ) : (
          <SVGLoaders.Oval stroke="#666" />
        )}
        <p style={{width: "100%", textAlign: "center"}}>available seats</p>
      </div>
      <div style={{marginBottom: "15px", width: "calc(100% - 2em)"}}>
        <h3 style={{width: "100%", textAlign: "center"}}>{widthProg} full</h3>
        <div style={{position: "relative", margin: "10px 0 10px 0", width: "100%"}}> 
          <div style={{width: "100%", height: "5px", backgroundColor: "grey", borderRadius: "5px"}}>
            <div style={{width: widthProg, backgroundColor: "red", height: "5px"}}></div>
          </div>
        </div>
        <div style={{width: "100%"}}>
          <ul style={{width: "100%"}}>
              <li>Seats Taken: {maxCap - (count ?? 0)}</li>
              <li>Seats Saved: {savedSeats}</li>
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
