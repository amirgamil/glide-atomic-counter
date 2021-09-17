import { allowCors } from "../../glide-next";
import { connectSavedSeats } from "../../redis";


export default allowCors(async (req, res) => {
  const counter =
    (req.query.counter as string) ?? req.body?.params?.counter?.value ?? "";
  const seatID = 
    (req.query.seatID as string) ?? req.body?.params?.seatID?.value ?? "";
  //check we have a valid counter first
  if (counter) {
    const client = await connectSavedSeats();
    const timestamp = new Date();
    //check if this seat has already been reserved
    if (client.exists(seatID)) {
      res.send({reservedSeats: client.zCount(counter, -Infinity, Infinity)})
    } else {
      client.set(seatID, "1");
      //get current timestamp as an integer
      const intTimestamp = new Date().getTime();
      //add it to sorted set for this specific counter
      client.zAdd(counter, {score: intTimestamp, value: seatID});
      res.send({reservedSeats: client.zCount(counter, -Infinity, Infinity)})
    }
  }

});