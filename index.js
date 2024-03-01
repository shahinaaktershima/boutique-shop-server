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

    const paymentCollection = client
      .db("treading-platfrom")
      .collection("payment");
    const usersCollection = client.db("treading-platfrom").collection("user");
    const tradeCollection = client.db("treading-platfrom").collection("trading");
    const blogsCollection = client.db("tradeSwiftDB").collection("blogs");
    const tournamentsCollection = client
      .db("tournamentsCollection")
      .collection("tournamnetDb");

    app.get("/tournament", async (req, res) => {
      const result = await tournamentsCollection.find().toArray();
      res.send(result);
    });

    app.get("/tournament/details/:id", async (req, res) => {
      const id = req.params.id;

      const result = await tournamentsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // get all blog data api
    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });
    // get single blog data api
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const result = await blogsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // payment with stripe
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
      const userInfo = await usersCollection.findOne(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance: amount + userInfo.balance,
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
      const userInfo = await usersCollection.findOne(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance: userInfo.balance - amount,
          withdraw: userInfo.withdraw + amount,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.post("/payment", async (req, res) => {
      const body = req.body;
      const result = await paymentCollection.insertOne(body);
      res.send(result);
    });
    //stripe payment system
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
    // users related api
    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      res.send(user);
    });
    // for admin
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.post("/user", async (req, res) => {
      const user = req.body;
      // insert email if user doesn't exist :
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
    // get single blog data api
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const result = await blogsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // payment with stripe
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
          photo: body.photo,
          education: body.education,
          aboutme: body.aboutme,
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
      const userInfo = await usersCollection.findOne(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance: amount + userInfo.balance,
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
      const userInfo = await usersCollection.findOne(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          balance: userInfo.balance - amount,
          withdraw: userInfo.withdraw + amount,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.post("/payment", async (req, res) => {
      const body = req.body;
      const result = await paymentCollection.insertOne(body);
      res.send(result);
    });
    //stripe payment system
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
    // users related api
    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      res.send(user);
    });
    // for admin
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.post("/user", async (req, res) => {
      const user = req.body;
      // insert email if user doesn't exist :

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
    // delete
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/payment", async (req, res) => {
      const query = req.query.query;
      const currentPage = parseInt(req.query.currentPage);
      const filter2 = {
        "deposit.email": { $regex: "." + query + ".", $options: "i" },
      };
      const filter = { email: { $regex: "." + query + ".", $options: "i" } };
      const result = await paymentCollection
        .find(filter, filter2)
        .skip(currentPage * 10)
        .limit(10)
        .toArray();
      res.send(result);
    });

    app.get("/paymentCount", async (req, res) => {
      const count = await paymentCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // for user payment history
    app.get("/paymenthistory", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const filter2 = { "deposit.email": email };
      const result = await paymentCollection.find(filter || filter2).toArray();
      res.send(result);
    });

    // payment with sslcommerz
    const trans_id = new ObjectId().toString();
    console.log(trans_id);
    app.post("/paymentsystem", async (req, res) => {
      const deposit = req.body;
      console.log(req.body);
      const data = {
        total_amount: deposit.amount,
        currency: "BDT",
        tran_id: trans_id,
        success_url: `https://tradeswift-server.vercel.app/paymentsystem/success/${trans_id}`,
        fail_url: "http://localhost:3030/fail",
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: deposit.name,
        cus_email: deposit.email,
        cus_add1: "Dhaka",
      };
      console.log(data);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        const finalDeposit = {
          deposit,
          depositStatus: false,
          transactionId: trans_id,
        };
        const result = paymentCollection.insertOne(finalDeposit);
        console.log("Redirecting to: ", GatewayPageURL);
        app.post("/paymentsystem/success/:transId", async (req, res) => {
          console.log(req.params.transId);
          const result = await paymentCollection.updateOne(
            { transactionId: req.params.transId },
            {
              $set: {
                depositStatus: true,
              },
            }
          );

          if (result.modifiedCount > 0) {
            res.redirect(
              `https://tradeswift.vercel.app/userdashboard/success/${trans_id}`
            );
          }
        });
      });
      app.get("/paymentsystem", async (req, res) => {
        const cursor = paymentCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });
    });

    //imtiaj

    app.post('/trade',async(req,res)=>{
      const body = req.body;
      const result = await tradeCollection.insertOne(body)
      res.send(result)
    })

    app.get('/trade',async(req,res)=>{
      const email = req.query?.email;
      const query = {}
      if(email){
        query.email = email
      }
      const result = await tradeCollection.find(query).sort({time: 'asc'}).toArray()
      res.send(result)
    })

    app.put('/trade/:id',async(req,res)=>{
      const id = req.params?.id;
      const filter = {_id:new ObjectId(id)}
      const options = { upsert: true };
      const updatedDoc = {
        $set:{
          status : req?.body?.status
        }
      }
      console.log(id,updatedDoc);
      const result = await tradeCollection.updateOne(filter,updatedDoc,options)
      res.send(result)
    })

    app.put('/tradeUserUpdate/:email',async(req,res)=>{
      const email = req.params?.email;
      const filter = {email:email}
      const options = { upsert: true };
      const user = await usersCollection.findOne(filter)
      const amount = req.body?.amount
      const updatedDoc = {
        $set:{
          balance : user?.balance + amount,
          profit: user?.profit + amount 
        }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc,options)
      res.send(result)
    })

    app.put('/trade-uodate/:email',async(req,res)=>{
      const email = req.params?.email;
      const query = {email:email};
      const amount = req.body?.amount
      // console.log(query,amount);
      const options = { upsert: true };
      const user = await usersCollection.findOne(query)
      const updatedDoc = {
        $set:{
          balance:user?.balance - amount
        }
      }
      const result = await usersCollection.updateOne(query,updatedDoc,options)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("tradeswift is running");
});
app.listen(port, () => {
  console.log(`tradeswift is running on port ${port}`);
});
