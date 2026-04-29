const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")
const pino = require('pino')
const readline = require("readline")
const fs = require('fs')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startBot() {
    // Biar gak error "Session" lama, kita pake folder fresh
    const { state, saveCreds } = await useMultiFileAuthState('session_wexin')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, 
        logger: pino({ level: "silent" }), // Ini biar log 'berisik' tadi ILANG
        browser: ["Ubuntu", "Chrome", "20.0.0.0"]
    })

    // --- LOGIC PAIRING CODE YANG LEBIH RAPI ---
    if (!sock.authState.creds.registered) {
        console.clear() // Bersihin layar Termux
        console.log("========================================")
        console.log("     WEXIN REACT CORE - PAIRING CODE    ")
        console.log("========================================")
        
        const phoneNumber = await question('Masukkan nomor WA (Contoh: 628xxx): ')
        await delay(3000)
        const code = await sock.requestPairingCode(phoneNumber.trim())
        
        console.log(`\n👉 KODE PAIRING LO: ${code}`)
        console.log("\nCara Pakai:")
        console.log("1. Buka WA > Perangkat Tertaut > Tautkan Perangkat")
        console.log("2. Pilih 'Tautkan dengan nomor telepon saja'")
        console.log("3. Masukkan kode di atas.\n")
    }

    // --- LOGIC AUTO REACT CHANNEL ---
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        
        if (msg.key.remoteJid.endsWith('@newsletter')) {
            const emojis = ["🔥", "🚀", "🖕", "💯", "🤮"] // Bebas ganti
            const count = 5 // Bebas berapa kali
            
            console.log(`[+] Ada postingan baru! Gas ${count} react...`)
            
            for (let i = 0; i < count; i++) {
                try {
                    await delay(1500)
                    await sock.sendMessage(msg.key.remoteJid, {
                        react: { text: emojis[i % emojis.length], key: msg.key }
                    })
                } catch (e) { console.log("Gagal react, skip...") }
            }
        }
    })

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            console.log('\n✅ BOT BERHASIL CONNECT! Ready to spam reactions! 🚀')
        }
        if (connection === 'close') {
            console.log('Koneksi putus, mencoba menyambung ulang...')
            startBot()
        }
    })
}

startBot()
        
