const { redisHost,redisPort,pgUser,pgHost,pgDatabase,pgPassword,pgPort} = require('./keys')


//Express App setup
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

//Postgress Client Setup
const { pool, Pool } = require('pg')
const pgClient = new Pool({
    user: pgUser,
    host: pgHost,
    database: pgDatabase,
    password: pgPassword,
    port:pgPort
})

pgClient.on('error', () => console.log('Lost PG connection'))

//create the table to host the data submitted
pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err))
    
//Redis client setup
const redis = require('redis')
const redisClient = redis.createClient({
    host: redisHost,
    port: redisPort,
    retry_strategy: () => 1000
})
const redisPublisher = redisClient.duplicate()


//Express route handlers
app.get('/', (req, res) => {
    res.send('Hi')
})

//get all the data saved in the database
app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values')
    res.send(values.rows)
})

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values)
    })
})

app.post('/values', async (req, res) => {
    const index = req.body.index
    
    //ensure the index is less than 40
    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high')
    }
    redisClient.hset('values', index, 'Nothing yet!')
    redisPublisher.publish('insert', index)
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index])
    
    res.send({working:true})
})

app.listen(5000, err => {
    console.log('Listening')
})