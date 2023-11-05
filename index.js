const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('hello every one')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8mn4lkn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("luxenest");
        const roomsCollection = database.collection("rooms");
        const bookingsRoomCollection = database.collection("bookingsRoom");

        // rooms related api
        app.get('/rooms', async (req, res) => {
            const shortFlied = req.query.shortFlied
            const shortOrder = req.query.shortOrder
            const shortObj = {}
            if (shortFlied && shortOrder) {
                shortObj[shortFlied] = shortOrder
            }
            const result = await roomsCollection.find().sort().toArray()
            res.send(result)
        })

        app.get('/roomDetail/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await roomsCollection.findOne(query)
            res.send(result)
        })


        // Room Booking related api
        app.post('/roomBooking', async (req, res) => {
            const newBooking = req.body
            const result = await bookingsRoomCollection.insertOne(newBooking)
            res.send(result)
        })

        app.put('/updateRoom', async (req, res) => {
            const updateRoom = req.body
            const id = req.body._id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    available: false
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`app running on port ${port}`)
})