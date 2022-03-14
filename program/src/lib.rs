use std::convert::TryInto;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
};
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize,BorshDeserialize, Debug)]
pub struct Data{
    key:Pubkey,
    ammount:String
}

#[derive(BorshSerialize,BorshDeserialize, Debug)]
pub struct Records{
    records:Vec<Data>
}

entrypoint!(prepare_instraction);

fn prepare_instraction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8]) -> ProgramResult {
    msg!("Transfering sol...");
    send_money(&accounts, &input)?;
    msg!("Writing data ...");
    let write = write_data(_program_id,&accounts, &input);
    if let Err(_err) = write{
        msg!("Some Error while writing a data {}", _err);
    }
    msg!("Ok!!");
    Ok(())
}


fn write_data(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8]) -> ProgramResult{
    let acc_iter = &mut accounts.iter();
    let sender_info = next_account_info(acc_iter)?;
    let  _ = next_account_info(acc_iter)?;
    let info = next_account_info(acc_iter)?;
    msg!("{}, {}", _program_id, info.key.to_string());
    let amount = get_amount(input);
    msg!("Start Deserialization");
    let mut rec = Records::deserialize(&mut &info.data.borrow()[..])?;
    msg!("Deserialization complete");
    if new_record(&mut rec, &*sender_info.key, &amount) {
        let record = Data{
            key: *sender_info.key,
            ammount: amount.to_string()};
        rec.records.push(record);
    }
    rec.serialize(&mut &mut info.data.borrow_mut()[..])?;
    msg!("Success writing");
    Ok(())
}

fn send_money(
    accounts: &[AccountInfo],
    input: &[u8]) -> ProgramResult{
    let acc_iter = &mut accounts.iter();
    let sender_info = next_account_info(acc_iter)?;
    let receiver_info = next_account_info(acc_iter)?;
    let amount = get_amount(input); 
    invoke(
        &system_instruction::transfer(
            sender_info.key, receiver_info.key, amount),
        &[sender_info.clone(), receiver_info.clone()]
    )?;
    msg!("Sender: {} Success", sender_info.key);
    Ok(())
}

fn get_amount(input: &[u8]) -> u64{
    let amount = input.get(..8).and_then(|slice| slice.try_into().ok())
        .map(u64::from_le_bytes)
        .ok_or(ProgramError::InvalidInstructionData).unwrap();
    amount
}

fn new_record( rec:&mut Records, sender_info:&Pubkey, ammount: &u64) -> bool{
    for i in rec.records.iter_mut(){
        if i.key.to_string().eq(&(*sender_info.to_string())){
            i.ammount = (i.ammount.parse::<u64>().unwrap()+ammount).to_string();
            return false
        }
    }
    true
}