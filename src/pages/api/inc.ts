import { allowCors } from "../../glide-next";
import { checkForSnapShot, connect } from "../../redis";

export default allowCors(async (req, res) => {
  const counter =
    (req.query.counter as string) ?? req.body?.params?.counter?.value ?? "";
  const client = await connect();
  const count = await client.increment(counter);
  await client.disconnect();
  res.send({ count });
  checkForSnapShot(client.getClient(), counter);
});
