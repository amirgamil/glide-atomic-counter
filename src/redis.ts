import { createClient } from "redis";
import { RedisClientType } from "redis/dist/lib/client";
import { RedisModules, RedisModule } from "redis/dist/lib/commands";
import { RedisLuaScripts } from "redis/dist/lib/lua-script";

export type Counter = string;
export type Node = string;

function lastUpdatedKey(counter: Counter, node: Node): string {
  return `${counter}:${node}`;
}

function basicCountKey(counter: Counter): string {
  return `${counter}-count`;
}

export class CounterClient {
  constructor(
    private readonly client: RedisClientType<RedisModules, RedisLuaScripts>
  ) {}

  public async getDistributedNodeCount(counter: Counter): Promise<number> {
    const counts = await this.client.hVals(counter);
    const countSum = counts
      .map((c) => Number.parseInt(c, 10))
      .reduce((acc, n) => acc + n, 0);

    return countSum;
  }

  public async updateCount(
    counter: Counter,
    node: Node,
    count: number,
    updated: string
  ) {
    const lastUpdated = lastUpdatedKey(counter, node);
    const lastUpdate = await this.client.get(lastUpdated);
    if (new Date(lastUpdate).getTime() < new Date(updated).getTime()) {
      await this.client.set(lastUpdated, updated);
      await this.client.hSet(counter, { [node]: `${count}` });
    }
  }

  public async getBasicCount(counter: Counter): Promise<number> {
    const basicCount = basicCountKey(counter);
    const s = (await this.client.get(basicCount)) ?? "0";
    return Number.parseInt(s);
  }

  public async increment(counter: Counter) {
    const basicCount = basicCountKey(counter);
    const newCount = await this.client.incr(basicCount);
    this.client.hSet(`${counter}_current`, { num_taken: newCount });
    return newCount;
  }

  public async decrement(counter: Counter) {
    const basicCount = basicCountKey(counter);
    const newCount = await this.client.decr(basicCount);
    this.client.hSet(`${counter}_current`, { num_taken: newCount });
    return newCount;
  }

  public getClient() {
    return this.client;
  }

  public async getNodes(counter: Counter) {
    return { ...(await this.client.hGetAll(counter)) };
  }

  public async disconnect() {
    await this.client.disconnect();
  }
}

function setUpClient() {
  const client = createClient({
    socket: {
      url: process.env.REDIS!,
    },
  });

  client.on("error", (err: any) => {
    throw new Error(`Redis Client Error ${err}`);
  });
  return client;
}

export async function connect() {
  const client = setUpClient();
  await client.connect();
  return new CounterClient(client);
}

export async function connectSavedSeats() {
  const client = setUpClient();
  await client.connect();
  return client;
}

export function clearSeatsInRange(
  client: RedisClientType<Record<string, RedisModule>, RedisLuaScripts>,
  counter: string,
  min: number,
  max: number
) {
  //in order to make this action atomic (and ensure we don't lose a key written in the same, use multi and exec block)
  client.multi();
  //first get the actual elements and remove them from our hash map since they no longer exist
  client
    .zRangeWithScores(counter, min, max)
    .then((data) => data.forEach((el) => client.del(el.value)));
  //remove elements from our sorted set
  client.zRemRangeByScore(counter, min, max);
  client.exec();
}

//Store global time of last snapshot as last_snapshot_<counter>

/*** All snapshots are saved in Redis as hashmaps
 * with:
 * key: Snapshot <current counter>_<current day as number>_<current hour in local time>
 * and fields:
 *  seats_taken: int
 *  seats_reserved: int
 *  expired_reservations: int
 *  average_reservation_time: int ***/
export async function createSnapshot(
  client: RedisClientType<Record<string, RedisModule>, RedisLuaScripts>,
  counter: string
) {
  const currentTime = new Date();
  const globalCounterKey = counter + "_current";
  const newSnapshotKey = `${counter}_${currentTime.getDay()}_${currentTime.getHours()}`;
  let seatsReserved = await client.zCard(counter);
  let expiredReservations =
    (await client.hGet(globalCounterKey, "num_expired")) ?? "0";
  let averageReservationTime =
    (await client.hGet(globalCounterKey, "average_reservation_time")) ?? "0";
  let seatsTaken = (await client.hGet(globalCounterKey, "num_taken")) ?? "0";
  //clear previous global info for this counter to prepare for new snapshot
  await client.hSet(newSnapshotKey, {
    seats_taken: seatsTaken,
    seats_reserved: `${seatsReserved}`,
    expired_reservations: expiredReservations,
    average_reservation_time: averageReservationTime,
  });
  //update new last snapshot time
  await client.set(`last_snapshot_${counter}`, `currentTime.getDate()`);
}

const HOUR = 1000 * 60 * 60;
export async function checkForSnapShot(
  client: RedisClientType<Record<string, RedisModule>, RedisLuaScripts>,
  counter: string
) {
  let shouldSnapshot = false;
  if (client.exists(`last_snapshot_${counter}`)) {
    const lastDate = await client.get(`last_snapshot_${counter}`);
    const lastSnapTime = new Date(lastDate);
    const currentTime = new Date();
    const diffTime = currentTime.valueOf() - lastSnapTime.valueOf();
    if (diffTime > HOUR) {
      shouldSnapshot = true;
    }
  } else {
    //first time
    shouldSnapshot = true;
  }
  if (shouldSnapshot) {
    createSnapshot(client, counter);
  }
}

/**** 
written here for documentation
How do we store the data we need in Redis?
- Store a sorted set for each counter (sorted by an integer representing the time via date.getTime) using their seatID as the value (obleviates the
  need for storing the date separately)
- Also store a set of the seatID keys to ensure we don't reserve duplicates
- Store a hashmap of each <counter>_current which is needed to store global info at any point in time
for the snapshots. Hashmap looks like this
  key: <counter>_current
  num_expired: int
  //need the two variables to calculate the average time
  //num_reserved_intime = number of people who reserved who then checked back
  num_reserved_intime: int
  total_time_reserved: int
  num_taken: int
- Store global time of last snapshot as last_snapshot_<counter>
*****/
