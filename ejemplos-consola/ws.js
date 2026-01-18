const accountSid = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const authToken = '[AuthToken]';
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
                from: 'whatsapp:+14155238886',
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: '{"1":"12/1","2":"3pm"}',
        to: 'whatsapp:+573236368624'
    })
    .then(message => console.log(message.sid))
    .done();