const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys")
const pino = require('pino')
const readline = require("readline")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_wexin')
    
    // Kita paksa logger bener-bener diem (Level: fatal)
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }), 
        browser: ["Chrome (Linux)", "", ""]
    })

    // Logic Pairing Code
    if (!sock.authState.creds.registered) {
        console.clear()
        console.log("========================================")
        console.log("   WEXIN-REACT-CORE: MODE PAIRING")
        console.log("========================================")
        
        const num = await question('Masukkan nomor WA (Contoh: 628xxx): ')
        const phoneNumber = num.replace(/[^0-9]/g, '')
        
        // Kasih jeda dikit biar socket-nya siap
        await delay(3000)
        const code = await sock.requestPairingCode(phoneNumber)
        
        console.log(`\n👉 KODE PAIRING ANDA: ${code}\n`)
    }

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (msg.key.remoteJid.endsWith('@newsletter')) {
            // Setting: Bebas pilih emoji & jumlah
            const listEmoji = ["🔥", "🚀", "😂", "💯", "✅"]
            const jumlahReact = 5 
            
            console.log(`[LOG] Ada post baru! Kirim ${jumlahReact} reaksi...`)
            for (let i = 0; i < jumlahReact; i++) {
                await delay(2000)
                await sock.sendMessage(msg.key.remoteJid, {
                    react: { text: listEmoji[i % listEmoji.length], key: msg.key }
                })
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (up) => {
        const { connection } = up
        if (connection === 'open') console.log('\n[!] BOT CONNECTED!')
        if (connection === 'close') startBot()
    })
}

startBot()
            
