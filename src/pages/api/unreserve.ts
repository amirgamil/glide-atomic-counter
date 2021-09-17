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
    //confirm this seat has already been reserved
    if (client.exists(seatID)) {
      //remove the key from our hashmap
      client.del(seatID);
      //remove key from our sorted set
      client.zRem(counter, seatID);
      //use zCard since faster than zRange
      res.send({ reservedSeats: client.zCard(counter) });
    }
  }
});
