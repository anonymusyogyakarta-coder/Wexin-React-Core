const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore,
    PHONENUMBER_MCC
} = require("@whiskeysockets/baileys")
const pino = require('pino')
const readline = require("readline")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_wexin')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // QR dimatikan biar bisa pairing code
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.0.0"]
    })

    // --- LOGIC PAIRING CODE ---
    if (!sock.authState.creds.registered) {
        console.log("=== WEXIN REACT CORE PAIRING ===")
        const phoneNumber = await question('Masukkan nomor WhatsApp lo (contoh: 62812xxx): ')
        const code = await sock.requestPairingCode(phoneNumber.trim())
        console.log(`\nKODE PAIRING LO: ${code}\n`)
        console.log("Buka WA > Perangkat Tertaut > Tautkan Perangkat > Tautkan dengan nomor telepon saja.")
    }

    // --- LOGIC AUTO REACT CHANNEL ---
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        
        if (msg.key.remoteJid.endsWith('@newsletter')) {
            const emojis = ["🔥", "🚀", "🤮"] // Ganti sesuka lo
            const count = 3 // Mau berapa kali react
            
            console.log(`Postingan baru di Channel! Gas kasih ${count} reaksi...`)
            
            for (let i = 0; i < count; i++) {
                await delay(2000) // Jeda biar gak kena spam filter
                await sock.sendMessage(msg.key.remoteJid, {
                    react: { text: emojis[i % emojis.length], key: msg.key }
                })
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') console.log('\nBot Berhasil Terhubung! Ready to React! 🚀')
        if (connection === 'close') startBot()
    })
}

startBot()
            
