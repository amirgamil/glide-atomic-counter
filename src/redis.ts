import { createClient } from "redis";
import { RedisClientType } from "redis/dist/lib/client";
import { RedisModules } from "redis/dist/lib/commands";
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
    return await this.client.incr(basicCount);
  }

  public async decrement(counter: Counter) {
    const basicCount = basicCountKey(counter);
    return await this.client.decr(basicCount);
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
/**** 
written here for documentation
How do we store the data we need in Redis?
- Store a sorted set for each counter (sorted by an integer representing the time via date.getTime) using their seatID as the value (obleviates the
  need for storing the date separately)
- Also store a set of the seatID keys to ensure we don't reserve duplicates
*****/