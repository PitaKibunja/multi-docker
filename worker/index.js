const {redisHost,redisPort} = require('./keys')
//collect the auth keys
const  redis= require('redis')
//connect to the redis client
const redisClient = redis.createClient({
    host: redisHost,
    port: redisPort,
    retry_strategy:() =>1000 
})

const sub = redisClient.duplicate()

//create the fibonnachi function
function fib(index) {
    if (index < 2) return 1
    return fib(index-1)+fib(index-2)
}

sub.on('message', (channel, message) => {
    redisClient.hset('values',message,fib(parseInt(message)))
})
sub.subscribe('insert')