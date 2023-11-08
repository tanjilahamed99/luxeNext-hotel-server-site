const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
    origin: [
        'https://luxenest-hotel.web.app',
        'https://luxenest-hotel.firebaseapp.com'
    ],
    credentials: true
}))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('hello every one')
})

// / middle were
const verifyToken = async (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'forbidden' })
        }
        req.user = decoded
        next()
    })

}


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
        const reviewCollection = database.collection("review");

        // jwt token related api

        app.post('/jwt', async (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite:false
                })
                .send({success: true})
        })

        app.post('/logout', (req, res) => {
            res
                .clearCookie('token', { maxAge: 0 })
                .send({ logout: true })
        })



        // rooms related api
        app.get('/rooms', async (req, res) => {

            const body = req.body

            const shortFlied = req.query.shortFlied
            const shortOrder = req.query.shortOrder

            console.log()

            const shortObj = {}

            if (shortFlied !== 'undefined' && shortOrder !== 'undefined') {
                shortObj[shortFlied] = shortOrder
                console.log('ase')
            }
            const result = await roomsCollection.find().sort(shortObj).toArray()
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
            const id = req.body._id
            const available = req.body.available
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    available: available
                },
            };
            const result = await roomsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.get('/roomBooking', async (req, res) => {
            // const tokenEmail = req.user
            const email = req.query.email

            // console.log(tokenEmail,email)

            // if (tokenEmail === email) {
            //     return res.status(401).send({ message: 'forbidden' })
            // }
            const query = { email: email }
            const result = await bookingsRoomCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/roomBooking/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingsRoomCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/delateUpdate', async (req, res) => {
            const roomType = req.body.roomType
            const filter = { roomType: roomType }
            const updateDoc = {
                $set: {
                    available: true
                },
            }
            const result = await roomsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        app.get('/updateDate/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingsRoomCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/updateDate', async (req, res) => {
            const checkIn = req.body.checkIn
            const checkOut = req.body.checkOut
            const id = req.body._id

            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    checkIn: checkIn,
                    checkOut: checkOut
                }
            }
            const result = await bookingsRoomCollection.updateOne(query, updateDoc)
            res.send(result)
        })


        //review

        app.post('/review', async (req, res) => {
            const reviewData = req.body
            const result = await reviewCollection.insertOne(reviewData)
            res.send(result)
        })

        app.get('/review', async (req, res) => {
            const roomType = req.query.roomType
            const query = { roomType: roomType }
            const result = await reviewCollection.find(query).toArray()
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