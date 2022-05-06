deploy:
	cd program; cargo build-bpf
	solana program deploy program/target/deploy/solana_try.so -u localhost --program-id wallets/program.json
start-back:
	cd python; python main.py;
run-client:
	cd client; npm start
deploy-devnet:
	cd program; cargo build-bpf
	solana program deploy program/target/deploy/solana_try.so -u devnet --program-id wallets/program.json
