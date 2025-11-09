const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://usersDB:SujWEEupiyWhviNr@cluster0.wv2xzqu.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully!");

    const database = client.db("food-for-all");
    const foodsCollection = database.collection("foods");
    const foodRequestsCollection = database.collection("foodRequests");

    app.get("/", (req, res) => {
      res.send("Food for all server is running");
    });

    // Get foods
    app.get("/foods", async (req, res) => {
      try {
        const foods = await foodsCollection
          .find()
          .sort({ quantity: -1 })
          .limit(6)
          .toArray();
        res.send(foods);
      } catch (err) {
        console.error("Error fetching foods:", err);
        res.status(500).send({ message: "Failed to fetch foods" });
      }
    });

    // Get single food details by ID
    app.get("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const food = await foodsCollection.findOne({ _id: new ObjectId(id) });
        res.send(food);
      } catch (err) {
        console.error("Error fetching single food:", err);
        res.status(500).send({ message: "Failed to fetch food" });
      }
    });

    // Get all foods
    app.get("/all-foods", async (req, res) => {
      try {
        const foods = await foodsCollection
          .find()
          .sort({ quantity: -1 })
          .toArray();
        res.send(foods);
      } catch (err) {
        console.error("Error fetching all foods:", err);
        res.status(500).send({ message: "Failed to fetch all foods" });
      }
    });

    // Post a food
    app.post("/foods", async (req, res) => {
      try {
        const foodData = req.body;
        const newFood = {
          ...foodData,
          status: "available",
          createdAt: new Date(),
        };
        const result = await foodsCollection.insertOne(newFood);
        res.status(201).send({ success: true, foodId: result.insertedId });
      } catch (err) {
        console.error("Error adding food:", err);
        res.status(500).send({ message: "Failed to add food" });
      }
    });

    // Post food request
    app.post("/food-requests", async (req, res) => {
      try {
        const request = req.body;
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

    app.get("/my-foods", async (req, res) => {
      try {
        const email = req.query.email;
        const foods = await foodsCollection
          .find({ userEmail: email })
          .toArray();
        res.send(foods);
      } catch (err) {
        console.error("Error fetching user foods:", err);
        res.status(500).send({ message: "Failed to fetch foods" });
      }
    });

    app.put("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedFood = req.body;
        const result = await foodsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedFood }
        );
        res.send(result);
      } catch (err) {
        console.error("Error updating food:", err);
        res.status(500).send({ message: "Failed to update food" });
      }
    });

    app.delete("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await foodsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        console.error("Error deleting food:", err);
        res.status(500).send({ message: "Failed to delete food" });
      }
    });

    app.get("/my-food-requests", async (req, res) => {
      try {
        const email = req.query.email;
        const requests = await foodRequestsCollection
          .find({ userEmail: email })
          .toArray();
        res.send(requests);
      } catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).send({ message: "Failed to fetch requests" });
      }
    });

    // Patch food request status
    app.patch("/food-requests/:requestId", async (req, res) => {
      try {
        const { requestId } = req.params;
        const { action } = req.body;

        if (action === "accept") {
          await foodRequestsCollection.updateOne(
            { _id: new ObjectId(requestId) },
            { $set: { status: "accepted" } }
          );

          const request = await foodRequestsCollection.findOne({
            _id: new ObjectId(requestId),
          });
          await foodsCollection.updateOne(
            { _id: new ObjectId(request.foodId) },
            { $set: { status: "donated" } }
          );
        } else if (action === "reject") {
          await foodRequestsCollection.updateOne(
            { _id: new ObjectId(requestId) },
            { $set: { status: "rejected" } }
          );
        }

        res.send({ message: "Request updated" });
      } catch (err) {
        console.error("Error updating request:", err);
        res.status(500).send({ message: "Failed to update request" });
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  } catch (err) {
    console.error("Connection error:", err);
  }
}

run().catch(console.dir);
