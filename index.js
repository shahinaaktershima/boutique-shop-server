const express = require('express');
const cors = require('cors');
require('dotenv').config()
const SSLCommerzPayment = require('sslcommerz-lts')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port=process.env.PORT||5000;
// middleware
app.use(cors());
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000',"https://tradeswift.vercel.app","https://tradeswift-git-main-shimas-projects.vercel.app"],
  credentials: true,
}))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d25u3si.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

async function run() {
  try {
   
    // await client.connect();
  const depositCollection=client.db('depositsCollection').collection('deposit')
  const usersCollection=client.db('treading-platfrom').collection('user');
  const tournamentsCollection=client.db('tournamentsCollection').collection('tournamnetDb');
  const Complete_tournamentsCollection=client.db('tournamentsCollection').collection('complete_tournament');


  const verifyAdmin=async(req,res,next)=>{
    const email=req.decoded.email;
    const query={email:email};
    const user=await usersCollection.findOne(query);
    const isAdmin=user?.role ==='admin';
    if(!isAdmin){
      return res.status(403).send({message:'forbidden access'});
    }
    next();
  }
  // users related api
  app.get('/user/admin/:email',async(req,res)=>{
  const email=req.params.email;
  if(email!== req.decoded.email){
  return res.status(403).send({message:'forbidden access'})
  }
  const query={email:email};
  const user=await usersCollection.findOne(query);
  let admin=false;
  if(user){
    admin =user?.role ==='admin';
  
  }
  res.send({admin})
  })
  app.post('/user',async(req,res)=>{
  
    const user=req.body;
    // insert email if user doesn't exist :
    // you can do this many ways (1.email unique,2. upsert  3.simple checking)
    const query={email:user.email}
    const existingUser=await usersCollection.findOne(query);
    if(existingUser){
      return res.send({message:'user already exists', insertedId:null})
    }
    const result=await usersCollection.insertOne(user);
    res.send(result)
  });
  app.get('/user',async(req,res)=>{
    console.log(req.headers);
    const result=await usersCollection.find().toArray();
    res.send(result);
  });



const trans_id=new ObjectId().toString();
   app.post('/deposit',async(req,res)=>{
    const deposit=req.body;
    console.log(req.body);
    const data = {
      total_amount: deposit.number,
      currency: 'BDT',
      tran_id: trans_id, // use unique tran_id for each api call
      success_url: `https://tradeswift.vercel.app/payment/success/${trans_id}`,
      fail_url: 'http://localhost:3030/fail',
      cancel_url: 'http://localhost:3030/cancel',
      ipn_url: 'http://localhost:3030/ipn',
      shipping_method: 'Courier',
      product_name: 'Computer.',
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: deposit.name,
      cus_email: deposit.email,
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
      cus_fax: '01711111111',
      ship_name: 'Customer Name',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
  };
  console.log(data);
  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
  sslcz.init(data).then(apiResponse => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL
      res.send({url: GatewayPageURL})
 const finalDeposit={
  deposit,depositStatus:false,
  transactionId:trans_id
 }

 const result= depositCollection.insertOne(finalDeposit)
      console.log('Redirecting to: ', GatewayPageURL)
  });


  app.post('/payment/success/:transId',async(req,res)=>{
    console.log(req.params.transId);
    const result= await depositCollection.updateOne({transactionId:req.params.transId},{
      $set:{
        depositStatus:true
      }
    }
    )

    if( result.modifiedCount>0){
      res.redirect(`https://tradeswift.vercel.app/payment/success/${req.params.transId}`)
    }
  })


   })

   app.get('/deposit',async(req,res)=>{
    const cursor=depositCollection.find();
    const result=await cursor.toArray();
    res.send(result)
  })

  app.get('/userdashboard/tournament' , async(req,res)=>{
   
    const result  = await tournamentsCollection.find().toArray();
    res.send(result);
  } )

  app.get('/userdashboard/tournament/:id', async (req, res) => {

    const id = req.params.id;

    const query =  { _id : new ObjectId(id) };

    const result = await tournamentsCollection.findOne(query);

    res.send(result);
    
  });
  

  app.get('/userdashboard/complete_tournament' , async(req,res)=>{
   
    const result  = await Complete_tournamentsCollection.find().toArray();
    res.send(result);
  } )




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('tradeswift is running')
})

app.listen(port,()=>{
    console.log(`tradeswift is running on port ${port}`);
})