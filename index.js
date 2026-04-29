const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const express = require('express')
const app = express()

// Konfigurasi Bebas (Bisa lo ubah sesuka hati)
let config = {
    emojis: ["🔥", "🚀", "😂", "💯"], // Bebas pilih emoji apa aja
    count: 5, // Bebas mau berapa kali react per postingan
    delay: 2000 // Jeda antar react (ms) biar aman
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_wexin')
    const sock = makeWASocket({ auth: state, printQRInTerminal: true })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (msg.key.remoteJid.endsWith('@newsletter')) {
            console.log("Ada postingan baru! Gas react...")

            // Logic Bebas Berapa Kali React
            for (let i = 0; i < config.count; i++) {
                // Pilih emoji secara acak dari daftar atau urutan
                const chosenEmoji = config.emojis[i % config.emojis.length]
                
                setTimeout(async () => {
                    await sock.sendMessage(msg.key.remoteJid, {
                        react: { text: chosenEmoji, key: msg.key }
                    })
                }, i * config.delay) 
            }
        }
    })

    app.get('/', (req, res) => res.send('Wexin React Core is Active!'))
    app.listen(3000)
    sock.ev.on('creds.update', saveCreds)
}

startBot()
