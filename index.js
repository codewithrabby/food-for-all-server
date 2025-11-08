const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;



















// middleware
app.use(cors());
app.use(express.json());


const uri = "mongodb+srv://usersDB:SujWEEupiyWhviNr@cluster0.wv2xzqu.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});







const database = client.db("food-for-all");
const foodsCollection = database.collection("foods");

app.get('/', (req, res) => {
    res.send('Food for all server is running')
})






// Get all foods
app.get("/foods", async (req, res) => {
  try {
    const foods = await foodsCollection.find().sort({ quantity: -1 }).limit(6).toArray();
    res.send(foods);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch foods" });
  }
});

// Get single food details by ID
app.get("/foods/:id", async (req, res) => {
  const id = req.params.id;
  const { ObjectId } = require("mongodb");
  try {
    const food = await foodsCollection.findOne({ _id: new ObjectId(id) });
    res.send(food);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch food" });
  }
});















async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Food for all is running on port: ${port}`);
})