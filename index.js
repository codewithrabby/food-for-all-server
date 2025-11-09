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

// Get foods
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


// Get all foods

app.get("/all-foods", async (req, res) => {
  try {
    const foods = await foodsCollection.find().sort({ quantity: -1 }).toArray();
    res.send(foods);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch all foods" });
  }
});


app.get("/food-requests/:foodId", async (req, res) => {
  try {
    const { foodId } = req.params;
    const foodRequestsCollection = client.db("food-for-all").collection("foodRequests");

    const requests = await foodRequestsCollection.find({ foodId }).toArray();
    res.send(requests);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch requests" });
  }
});


// Post a food request
app.post("/food-requests", async (req, res) => {
  try {
    const request = req.body;
    const foodRequestsCollection = client.db("food-for-all").collection("foodRequests");

    const result = await foodRequestsCollection.insertOne({
      ...request,
      status: "pending",
      createdAt: new Date(),
    });

    res.send(result);
  } catch (err) {
    console.error("Error saving food request:", err);
    res.status(500).send({ message: "Failed to submit food request" });
  }
});

app.post("/foods", async (req, res) => {
  try {
    const foodData = req.body;

    const foodsCollection = client.db("food-for-all").collection("foods");

    const newFood = {
      ...foodData,
      status: "available",
      createdAt: new Date(),
    };

    const result = await foodsCollection.insertOne(newFood);
    res.status(201).send({ success: true, foodId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to add food" });
  }
});




app.patch("/food-requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const foodRequestsCollection = client.db("food-for-all").collection("foodRequests");
    const foodsCollection = client.db("food-for-all").collection("foods");

    if (action === "accept") {
      await foodRequestsCollection.updateOne(
        { _id: new require("mongodb").ObjectId(requestId) },
        { $set: { status: "accepted" } }
      );

      const request = await foodRequestsCollection.findOne({ _id: new require("mongodb").ObjectId(requestId) });
      await foodsCollection.updateOne(
        { _id: new require("mongodb").ObjectId(request.foodId) },
        { $set: { status: "donated" } }
      );
    } else if (action === "reject") {
      await foodRequestsCollection.updateOne(
        { _id: new require("mongodb").ObjectId(requestId) },
        { $set: { status: "rejected" } }
      );
    }

    res.send({ message: "Request updated" });
  } catch (err) {
    res.status(500).send({ message: "Failed to update request" });
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