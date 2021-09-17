import { allowCors } from "../../glide-next";
import { connectSavedSeats, checkForSnapShot } from "../../redis";

export default allowCors(async (req, res) => {
  const counter =
    (req.query.counter as string) ?? req.body?.params?.counter?.value ?? "";
  const seatID =
    (req.query.seatID as string) ?? req.body?.params?.seatID?.value ?? "";
  //check we have a valid counter first
  if (counter) {
    const client = await connectSavedSeats();
    const timestamp = new Date().getTime();
    //if this seat has already been reserved, unreserve it
    const exists = await client.exists(seatID);
    if (exists) {
      const globalKey = `${counter}_current`;
      //update the globals we need for tracking before removing
      const numReserved = await client.hGet(globalKey, "num_reserved_intime");
      const totalTimeSoFar =
        (await client.hGet(globalKey, "total_time_reserved")) ?? "0";
      const updatedNumReserved = parseInt(numReserved ?? "0", 10) + 1;

      //get time of reservation for the seat and calculate amount of
      //time the seat was reserved for then update globals
      const timeReserved = (await client.zScore(counter, seatID)) ?? 0;
      if (timeReserved !== 0) {
        const timeDateReserved = new Date(timeReserved).getMinutes();
        const newTotalTime = parseInt(totalTimeSoFar) + timeDateReserved;
        client.hSet(`${counter}_current`, {
          number_reserved_intime: updatedNumReserved,
          total_time_reserved: newTotalTime,
        });
      }
      //remove the key from our hashmap
      client.del(seatID);
      //remove key from our sorted set
      client.zRem(counter, seatID);
      //use zCard since faster than zRange
      res.send({ reservedSeats: client.zCard(counter) });
    } else {
      //otherwise reserve the seat
      client.set(seatID, "1");
      //get current timestamp as an integer
      //add it to sorted set for this specific counter
      client.zAdd(counter, { score: timestamp, value: seatID });
      res.send({ reservedSeats: client.zCard(counter) });
    }
    checkForSnapShot(client, counter);
  }
});
