import { Db, MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI environment variable is not set");
}

const uri = process.env.MONGO_URI;
const options: MongoClientOptions = {};

let client: MongoClient;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export async function getDb(dbName = process.env.MONGO_DB_NAME || "ajmeraexchange"): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;

