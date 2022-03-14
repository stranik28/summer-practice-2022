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
    AccountInfo,
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

async function testerrrrrrrrr(ac:AccountInfo<Buffer>){
    let acc_bytes = ac.data;
    let dat = new TextDecoder().decode(acc_bytes);
    let dat_arr = dat.split(";");
    let i = 0;
    let final_arr = []
    dat_arr.forEach(element => {
        i++;
        if (i == 1){
            final_arr.push(element.slice(4))
        }
        else{
            final_arr.push(element)
        }
    });
    let y = final_arr.pop()
    console.log(final_arr.length);
    
    return final_arr
}

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
    console.log("Done");
}

async function prepare_note_account(){
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
    let greetedAccount = await connection.getAccountInfo(greetedPubkey)
    if(greetedAccount == null){
        create_help_account(programId,payer)
    }
    return greetedAccount
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
    greetedPubkey = await PublicKey.createWithSeed(
        payer.publicKey,
        'de',
        programId,
    );
    const greetedAccount = await connection.getAccountInfo(greetedPubkey)
    if(greetedAccount == null){
        console.log("Need to wait till create a new wallet");
    }
    
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
    let _ =prepare_note_account()
    // return
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
    let greetedAccount = await prepare_note_account();
    let output_list = document.querySelector('#output')
    output_list.textContent="Operation in progress"
    let array = await testerrrrrrrrr(greetedAccount)
    let pre_key = (document.querySelector('#person_key') as HTMLInputElement).value
    console.log(pre_key == "");
    if(pre_key != ""){
        let arra = []
        array.forEach(element => {
            if(element.split(",")[0] == pre_key){
                arra.push(element)
            }
        });
        array = arra
    }
    if(array.length == 0){
        output_list.innerHTML = "Seems like transactions not found"
    }
    else {
        output_list.innerHTML = ""
        let finale = 0
        array.forEach((mess, i) => {
            let sender = mess.split(",")[0]
            let am = mess.split(",")[1]
            output_list.innerHTML += `
        <li class="book__item" style="margin-top: 5px">${i + 1}. ${
                "sender: " +
                sender
                + " total donates: " + (am)
            }
        </ui>
    `;
        });
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
