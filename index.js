const { default: axios } = require('axios');
var express = require('express')
    , bodyParser = require('body-parser');
const http = require('http')
const socketIo = require('socket.io')

var app = express();

const server = http.createServer(app)

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(express.static('public'))

//socket start
const io = socketIo(server)

io.on('connection', (socket) => {
    console.log("A user connected");

    socket.on('message', (data) => {
        console.log("Message received", data)
        io.emit('message', data)
    })

    socket.on('disconnect', () => {
        console.log("A user disconnected")
    })

})
//socket end


const token = "EAAErMcwZCb1IBOwj1udTaBNFJRuRJZCZA3ZAmxQAHqjltoVatt2MXKs9qHj6nhVZAuK0gUmbH3rp0V9cheIGaSfufKGKU42zANFn44ulDk2USJxzNXw3VZBE7mQMncEuuJUnZBka4OK2CZB2lOWgiAm9zpo0lWnVIQqisStdgQhf2Ql7aroEXUbUSYmI8oZB4f9HxeWZBXSBhQrxmgZBEG0DnpZB218SZCUlAKkpxMeEZD"

app.get("/", function (request, response) {
    response.send('Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!');
});

app.get('/webhook', function (req, res) {
    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == '123456'
    ) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
});

app.post("/webhook", function (request, response) {
    const waId = request.body.entry[0].changes[0].value.contacts[0].wa_id;
    const contactName = request.body.entry[0].changes[0].value.contacts[0].profile.name;
    const messageBody = request.body.entry[0].changes[0].value.messages[0].text.body;
    const messageType = request.body.entry[0].changes[0].value.messages[0].type;
    const phoneNumberId = request.body.entry[0].changes[0].value.metadata.phone_number_id;

    console.log("===========================")
    console.log('Phone Number From:', waId);
    console.log('Contact Name:', contactName);
    console.log('Message Body:', messageBody);
    console.log('Message Type:', messageType);

    //socket code
    io.emit('apiData', messageBody)
    //socket code

    // Define the payload
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: waId,
        type: "text",
        text: {
            preview_url: false,
            body: `Hello SlowCoder, Your message received`
        }
    };

    // Define the headers
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    axios.post(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, payload, { headers })
        .then(response => {
            console.log('Message sent successfully:', response?.data);

            // Safely access the first contact in the contacts array
            const contact = response?.data?.contacts && response?.data?.contacts[0];

            if (contact) {
                console.log(`Message sent to: ${contact?.input}`);
                // Perform any other operations with contact here
            } else {
                console.error('No contacts returned in the response');
            }
        })
        .catch(error => {
            console.error('Error sending message:', error?.response ? error?.response.data : error.message);
        });

    response.sendStatus(200);
});

var listener = server.listen(3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});