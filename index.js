const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const express = require('express')
const pino = require('pino')
const app = express()
const port = 3000

app.use(express.json())

let sock
let pairingCode = "Belum ada nomor"
let config = {
    emojis: "🔥,🚀,🤮,🖕",
    count: 5
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_wexin')
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" })
    })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (msg.key.remoteJid.endsWith('@newsletter')) {
            const emojiList = config.emojis.split(',')
            for (let i = 0; i < config.count; i++) {
                await delay(2000)
                await sock.sendMessage(msg.key.remoteJid, {
                    react: { text: emojiList[i % emojiList.length].trim(), key: msg.key }
                })
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

// --- DASHBOARD WEB ---
app.get('/', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; background:#111; color:white; text-align:center; padding:50px;">
            <h1 style="color:#00ff00;">WEXIN REACT CORE</h1>
            <div style="border:1px solid #333; padding:20px; border-radius:10px;">
                <h3>Status: ${sock?.authState?.creds?.registered ? 'CONNECTED' : 'NOT CONNECTED'}</h3>
                <p>Kode Pairing Terakhir: <b style="font-size:24px; color:#ff00ff;">${pairingCode}</b></p>
                <hr>
                <form action="/pair" method="POST">
                    <input type="text" name="num" placeholder="628xxx" style="padding:10px;">
                    <button type="submit" style="padding:10px; background:green; color:white;">Dapatkan Kode</button>
                </form>
                <hr>
                <h3>Pengaturan Emoji</h3>
                <form action="/config" method="POST">
                    <input type="text" name="emojis" value="${config.emojis}" style="padding:10px; width:200px;"><br><br>
                    <input type="number" name="count" value="${config.count}" style="padding:10px;"><br><br>
                    <button type="submit" style="padding:10px; background:blue; color:white;">Update Config</button>
                </form>
            </div>
            <script>
                document.querySelectorAll('form').forEach(form => {
                    form.onsubmit = async (e) => {
                        e.preventDefault();
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        await fetch(form.action, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(data)
                        });
                        alert('Berhasil! Silakan refresh halaman.');
                        location.reload();
                    };
                });
            </script>
        </body>
    `)
})

app.post('/pair', async (req, res) => {
    const num = req.body.num.replace(/[^0-9]/g, '')
    if (num) {
        pairingCode = await sock.requestPairingCode(num)
        res.json({ code: pairingCode })
    }
})

app.post('/config', (req, res) => {
    config.emojis = req.body.emojis
    config.count = parseInt(req.body.count)
    res.json({ status: 'ok' })
})

app.listen(port, () => console.log('Web jalan di http://localhost:3000'))
startBot()
           
