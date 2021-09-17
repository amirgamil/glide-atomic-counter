import { allowCors } from "../../glide-next";
import { connectSavedSeats } from "../../redis";

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
    date.setMinutes(date.getMinutes() + 30);
    const currentTimeStamp = date.getTime();
    //confirm this seat has already been reserved
    //in order to make this action atomic (and ensure we don't lose a key written in the same, use multi and exec block)
    client.multi();
    //first get the actual elements and remove them from our hash map since they no longer exist
    client
      .zRangeWithScores(counter, -Infinity, currentTimeStamp)
      .then((data) => data.map((el) => client.del(el.value)));
    //remove elements from our sorted set
    client.zRemRangeByScore(counter, -Infinity, currentTimeStamp);
    client.exec();
  }
});
