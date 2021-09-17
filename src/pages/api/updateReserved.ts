import { allowCors } from "../../glide-next";
import {
  connectSavedSeats,
  clearSeatsInRange,
  checkForSnapShot,
} from "../../redis";

//30 minutes in milliseconds for our update calculation
const THIRTY_MINUTES = 30 * 60 * 1000;

export default allowCors(async (req, res) => {
  const counter =
    (req.query.counter as string) ?? req.body?.params?.counter?.value ?? "";
  //check we have a valid counter first
  if (counter) {
    const client = await connectSavedSeats();
    //get time 30 minutes ago - any date <= this time should be removed
    const date = new Date();
    date.setMinutes(date.getMinutes() - 30);
    const currentTimeStamp = date.getTime();
    date.setMinutes(date.getMinutes() + 25);
    const expiringSoon = date.getTime();
    clearSeatsInRange(client, counter, -Infinity, currentTimeStamp);
    const data = await client.zRangeWithScores(
      counter,
      expiringSoon,
      date.getTime()
    );
    res.send({
      expiringSoon: data.length,
      savedSeats: client.zCard(counter),
    });
    checkForSnapShot(client, counter);
  }
});
