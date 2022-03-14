import "regenerator-runtime/runtime"
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    ConfirmedTransaction,
} from "@solana/web3.js"
import Wallet from "@project-serum/sol-wallet-adapter"
import lo from "buffer-layout"
import BN from "bn.js"

declare global {
    interface Window {
        solana: any
    }
}
export class TransactionWithSignature {
    constructor(
        public signature: string,
        public confirmedTransaction: ConfirmedTransaction
    ) {}
}

let payer: Keypair
let greetedPubkey:PublicKey

const path = "../wallets/id.json"
const pathe = "../wallets/testers.json"
const path_prog = "../wallets/program.json"

async function create_help_account(programId:PublicKey,payer:Keypair) {
    console.log("Ops");
    const SIZE = 1024;
    console.log("SIZE IS " + SIZE);
    await connection.getMinimumBalanceForRentExemption(
        SIZE,
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
        SIZE,
    );
    console.log("creating...");
    const transaction = new Transaction().add(
       SystemProgram.createAccountWithSeed({
          fromPubkey: payer.publicKey,
          basePubkey: payer.publicKey,
          seed: 'de',
          newAccountPubkey: greetedPubkey,
          lamports,
          space: SIZE,
          programId: programId,
        }),
    );
    await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log();
}

async function test(){
    console.log("test");
    let fs = require('fs');
    let private_key;
    let str = fs.readFileSync(pathe,'utf8')
    private_key = str.split('\n')[0]
    payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(private_key)))
    let programId = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(path_prog,'utf8').split('\n')[0]))).publicKey
    greetedPubkey = await PublicKey.createWithSeed(
        payer.publicKey,
        'de',
        programId,
    );
    console.log()
    console.log(payer.publicKey);
    const greetedAccount = await connection.getAccountInfo(greetedPubkey)
    if(greetedAccount == null){
        create_help_account(programId,payer)
    }
}

// const connection = new Connection("http://localhost:8899")
const connection = new Connection('https://api.devnet.solana.com')
// const connection = new Connection("https://testnet.solana.com")


// @ts-ignore
let solletWallet = new Wallet("https://www.sollet.io")
solletWallet.on("connect", (publicKey) => console.log("sollet connected", publicKey.toBase58()))

export async function connectSolletWallet() {
    await solletWallet.connect()
}

async function prepareTransaction(userPubkey: PublicKey, resiver_key:PublicKey): Promise<Transaction> {
    let input = (document.getElementById("lamp") as HTMLInputElement).value
    console.log(input);
    const programId = new PublicKey("ECZ5ugVFShgcrZTSKPWoHv9mtCX1Z6U1ukrXtYPB2zRV")
    const data = Buffer.alloc(64)
    lo.ns64("value").encode(new BN(input), data)

    const ix = new TransactionInstruction({
        keys: [
            { pubkey: userPubkey, isSigner: true, isWritable: true },
            { pubkey: resiver_key, isSigner: false, isWritable: true },
            { pubkey: greetedPubkey, isSigner: false, isWritable: true} ,
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: programId,
        data: data,
    })
    let tx = new Transaction()
    tx.add(ix)
    tx.feePayer = userPubkey
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    return tx
}

export async function sendViaSolletDonation() {
    test()
    let output_list = document.querySelector('#inform')
    output_list.textContent="Confirm transaction"
    console.log("sendViaSollet called," +  solletWallet.publicKey)
    // Public key of wallet, that collect donations
    const resiver_key = new PublicKey("Enb754f3DVeuNpAX12mna3PkQrhEw17nmMkAfCqqcx76")
    const tx = await prepareTransaction(solletWallet.publicKey , resiver_key)
    console.log("sendViaSollet called next")
    let signed = await solletWallet.signTransaction(tx)
    output_list.textContent="Confirmation transaction"
    console.log("sendViaSollet called last one")
    await broadcastSignedTransaction(signed)
}

export async function sendViaSolletWithdraw(b) {
    let output_list = document.querySelector('#inform_withdraw')
    output_list.textContent="Withdraw in progress"
    let input = (document.getElementById("pub_key") as HTMLInputElement).value
    let val
    let fee = 7000
    if(b) {
        val = (document.getElementById("lamp_withdraw") as HTMLInputElement).value
    }
    else{
        val = await
            connection.getBalance(new PublicKey("Enb754f3DVeuNpAX12mna3PkQrhEw17nmMkAfCqqcx76")) - fee
    }
    let resiver_key = new PublicKey(input)
    console.log("sendViaSolletWithdraw, " + resiver_key)
    const fs = require('fs');
    let private_key;
    let str = fs.readFileSync(path,'utf8');
    private_key = str.split('\n')[0];
    const programKeypair = new PublicKey("ECZ5ugVFShgcrZTSKPWoHv9mtCX1Z6U1ukrXtYPB2zRV")
    const sender_key = Keypair.fromSecretKey(Buffer.from(JSON.parse(private_key)))
    const data = Buffer.alloc(8)
    lo.ns64("value").encode(new BN(val), data)
    const ix = new TransactionInstruction({
        keys: [
            { pubkey: sender_key.publicKey, isSigner: true, isWritable: true },
            { pubkey: resiver_key, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: programKeypair,
        data: data,
    })
    const res = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [sender_key])
    output_list.textContent="Success withdraw"
    console.log("Success withdraw " + res)
}

async function broadcastSignedTransaction(signed) {
    let signature = await connection.sendRawTransaction(signed.serialize())
    console.log("Submitted transaction " + signature + ", awaiting confirmation")
    await connection.confirmTransaction(signature)
    console.log("Transaction " + signature + " confirmed")
    let output_list = document.querySelector('#inform')
    output_list.textContent="Success donation"
}

export async function getTransactions(){
    let limit = parseInt((document.querySelector('#nums_limit') as HTMLInputElement).value.trim())
    console.log("getTransactions")
    console.log(limit)
    let pre_key = (document.querySelector('#person_key') as HTMLInputElement).value
    let keys = new PublicKey("Enb754f3DVeuNpAX12mna3PkQrhEw17nmMkAfCqqcx76")
    const r = await connection.getSignaturesForAddress(keys)
    let array = []
    let b = pre_key == ""
    let output_list = document.querySelector('#output')
    output_list.textContent="Operation in progress"
    if (limit < 1 || limit > r.length || isNaN(limit)) {
        limit = r.length
        console.log(limit + " limits")
    }
    for(let i = 0; i < limit || (!b && array.length < limit && i < r.length) ;i++){
        if(!b){
            const transa = await connection.getTransaction(r[i].signature)
            if(transa.transaction.message.accountKeys[0].toBase58() == pre_key)
                array.push(transa)
        }
        else {
            const transa = await connection.getTransaction(r[i].signature)
            array.push(transa)
        }
    }

    if(array.length == 0){
        output_list.innerHTML = "Seems like transactions not found"
    }
    else {
        output_list.innerHTML = ""
        let finale = 0
        let output_final = document.querySelector('#output_final')
        array.forEach((mess, i) => {
            let am = mess.meta.preBalances[0] - mess.meta.postBalances[0] - mess.meta.fee
            finale+= am
            output_list.innerHTML += `
        <li class="book__item" style="margin-top: 5px">${i + 1}. ${
                "sender: " +
                mess.transaction.message.accountKeys[0].toBase58()
                + " amount: " + (am)
            }
        </ui>
    `;
        });
        output_final.innerHTML = "Sum of all donates: " + finale
    }
}

export async function getBalance(){
    const transSignature = await
        connection.getBalance(new PublicKey("Enb754f3DVeuNpAX12mna3PkQrhEw17nmMkAfCqqcx76"))
    document.getElementById("balance").textContent=transSignature+" Sol"
}

export async function login(){
    let login = (document.querySelector('#login') as HTMLInputElement).value
    let password = (document.querySelector('#password') as HTMLInputElement).value
    if(login == "admin" && password == "admin"){
        (document.querySelector('#admin_off') as HTMLBodyElement).style.display = 'none'
        let a = (document.querySelector('#admin_on')as HTMLBodyElement)
        a .style.display = 'block'
    }
    else {
        (document.querySelector('#err_mes') as HTMLBodyElement).textContent = "Login/Password error"
    }
}
