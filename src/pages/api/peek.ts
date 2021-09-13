import { allowCors } from "../../glide-next";
import { connect } from "../../redis";

export default allowCors(async (req, res) => {
  const counter = (req.query.counter as string) ?? req.body?.counter;
  const client = await connect();
  const count = await client.getBasicCount(counter);
  await client.disconnect();
  res.send({ count });
});
