const https = require('https');

// Configuration from Jules/.env (Hardcoded for this session to ensure it works without complex env setups across repos)
const CONFIG = {
    url: 'https://atendsoft.uazapi.com/send/text',
    token: '6f727322-0ce3-46a6-945d-7ad34ca4825f',
    targetNumber: '553194959512'
};

const message = process.argv[2];

if (!message) {
    console.error("❌ Por favor, forneça uma mensagem como argumento.");
    process.exit(1);
}

const data = JSON.stringify({
    number: CONFIG.targetNumber,
    text: message
});

const options = {
    method: 'POST',
    headers: {
        'token': CONFIG.token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(CONFIG.url, options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("✅ Notificação WhatsApp enviada com sucesso!");
        } else {
            console.error(`❌ Falha ao enviar notificação. Status: ${res.statusCode}`);
            console.error(`Resposta: ${responseBody}`);
        }
    });
});

req.on('error', (error) => {
    console.error(`❌ Erro de requisição: ${error.message}`);
});

req.write(data);
req.end();
