const express = require("express");
const cors = require("cors");
require("dotenv").config();
const SSLCommerzPayment = require("sslcommerz-lts");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(
  "sk_test_51Oh87qCLld7PnE1516qNvATSBs96eemmbFnyg4RcdSzdAUosHn4ibNZVd46EQhOT8erjCliglaZYV574vWlMngRy00OtjExlxj"
);

const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "https://tradeswift.vercel.app",
      "https://tradeswift-git-main-shimas-projects.vercel.app",
    ],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d25u3si.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

async function run() {
  try {
    // await client.connect();
    // const depositCollection=client.db('depositsCollection').collection('deposit')
    const usersCollection = client.db("treading-platfrom").collection("user");
    const paymentCollection = client.db("treading-platfrom").collection("payment");

    // users related api
    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      // insert email if user doesn't exist :
      // you can do this many ways (1.email unique,2. upsert  3.simple checking)
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const body = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: body.name,
          birth: body.birth,
          country: body.country,
          address: body.address,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put("/deposit/:email", async (req, res) => {
      const email = req.params.email;
      const amount = parseInt(req.body.amount);
      const filter = { email: email };
      const userInfo = await usersCollection.findOne(filter)
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance:amount + userInfo.balance
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    
    app.put("/withdraw/:email", async (req, res) => {
      const email = req.params.email;
      const amount = parseInt(req.body.amount);
      const filter = { email: email };
      const userInfo = await usersCollection.findOne(filter)
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance : userInfo.balance -  amount,
          withdraw : userInfo.withdraw + amount
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.post('/payment',async(req,res)=>{
      const body = req.body;
      const result = await paymentCollection.insertOne(body)
      res.send(result)
    })

    //stripe payment 
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log(amount,price);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("tradeswift is running");
});

app.listen(port, () => {
  console.log(`tradeswift is running on port ${port}`);
});
