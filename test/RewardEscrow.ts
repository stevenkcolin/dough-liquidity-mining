import { Signer, constants, BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import TimeTraveler from "../utils/TimeTraveler";
import { deployContract, solidity } from "ethereum-waffle";
import { use, expect } from "chai";

use(solidity);

import { RewardEscrow } from "../typechain/RewardEscrow";
import { DoughMock } from "../typechain/DoughMock";

import RewardEscrowArtifact from "../artifacts/contracts/RewardEscrow.sol/RewardEscrow.json";
import DoughMockArtifact from "../artifacts/contracts/mock/DoughMock.sol/DoughMock.json";
import { parseEther } from "ethers/lib/utils";


describe('RewardEscrow', function() {
    this.timeout(3000000);
	const SECOND = 1000;
	const DAY = 86400;
	const WEEK = 604800;
	const YEAR = 31556926;

    let owner:string;
    let ownerSigner: Signer;
    let rewardContractAccount:string;
    let rewardContractAccountSigner: Signer;
    let account1:string;
    let account1Signer: Signer;
    let account2:string;
    let account2Signer: Signer;
    let signers: Signer[];
    let rewardEscrow: RewardEscrow;
    let dough: DoughMock;
    let rewardContract: string;
	let timeTraveler: TimeTraveler;
	
	const initial_supply = 1000000;

	// Run once at beginning - snapshots will take care of resetting this before each test
	before(async () => {
        signers = await ethers.getSigners();
        owner = await signers[0].getAddress();
        rewardContractAccount = await signers[1].getAddress();
        account1 = await signers[2].getAddress();
		account2 = await signers[3].getAddress();
		
		console.log(`owner is ${owner}`);
		console.log(`rewardContractAccount is ${rewardContractAccount}`);
		console.log(`account1 is ${account1}`);
		console.log(`account2 is ${account2}`);

        [
            ownerSigner,
            rewardContractAccountSigner,
            account1Signer,
            account2Signer
        ] = signers;

		dough = await deployContract(signers[0], DoughMockArtifact) as DoughMock;
		console.log(`dough is: ${dough.address}`);

		rewardEscrow = await deployContract(signers[0], RewardEscrowArtifact) as RewardEscrow
		console.log(`rewardEscrow is: ${rewardEscrow.address}`);
		
		rewardEscrow["initialize(address,string,string)"](dough.address, "TEST", "TEST");

        dough.mint(owner, parseEther(initial_supply.toString()));

        timeTraveler = new TimeTraveler(network.provider);
		await timeTraveler.snapshot();
		console.log("----------------------- end of before each -------------------------");
    });
    
    beforeEach(async() => {
        await timeTraveler.revertSnapshot();
    });

	describe('Constructor & Settings ', async () => {

		// it('get rewardEscrow infomation', async () => {
		// 		const doughAddress = await rewardEscrow.dough();
		// 		console.log(`doughAddress is: ${doughAddress}`);

		// 		const ownerAddress = await rewardEscrow.owner();
		// 		console.log(`ownerAddress is: ${ownerAddress}`);

		// 		const totalSupply = await rewardEscrow.totalSupply();
		// 		console.log(`totalSupply is: ${totalSupply}`);
				
		// 	});

		// it('should set dough on contructor', async () => {
		// 	const doughAddress = await rewardEscrow.dough();
		// 	console.log(`doughAddress is ${doughAddress}`);
		// 	expect(doughAddress).to.eq(dough.address);
		// });

		// it('should set owner on contructor', async () => {
		// 	const ownerAddress = await rewardEscrow.owner();
		// 	expect(ownerAddress).to.eq(owner);
		// });

		// it('should allow owner to set dough', async () => {
		// 	await rewardEscrow.setDough(constants.AddressZero);
		// 	const doughAddress = await rewardEscrow.dough();
		// 	expect(doughAddress, constants.AddressZero);
		// });
	});

	describe('Given there are no escrow entries', async () => {
		// // test for account1
		// it('then numVestingEntries should return 0', async () => {
		// 	expect(await rewardEscrow.numVestingEntries(account1)).to.eq(0);
		// });
		// it('then getNextVestingEntry should return 0', async () => {
		// 	const nextVestingEntry = await rewardEscrow.getNextVestingEntry(account1);
		// 	expect(nextVestingEntry[0]).to.eq(0);
		// 	expect(nextVestingEntry[1]).to.eq(0);
		// });
		// it('then vest should do nothing and not revert', async () => {
		// 	await rewardEscrow.connect(account1Signer).vest();
		// 	expect(await rewardEscrow.totalVestedAccountBalance(account1)).to.eq(0);
		// });

		// // test for account2
		// it('then numVestingEntries should return 0', async () => {
		// 	expect(await rewardEscrow.numVestingEntries(account2)).to.eq(0);
		// });
		// it('then getNextVestingEntry should return 0', async () => {
		// 	const nextVestingEntry = await rewardEscrow.getNextVestingEntry(account2);
		// 	expect(nextVestingEntry[0]).to.eq(0);
		// 	expect(nextVestingEntry[1]).to.eq(0);
		// });
		// it('then vest should do nothing and not revert', async () => {
		// 	await rewardEscrow.connect(account1Signer).vest();
		// 	expect(await rewardEscrow.totalVestedAccountBalance(account2)).to.eq(0);
		// });
	});

	describe('Functions', async () => {
		beforeEach(async () => {
			// Ensure only FeePool Address can call rewardEscrow.appendVestingEntry()
			await rewardEscrow.addRewardsContract(rewardContractAccount);
			const isRewardContract = await rewardEscrow.isRewardContract(rewardContractAccount);
			expect(isRewardContract).to.be.true;
		});

		describe('Vesting Schedule Writes', async () => {
			// it('should not create a vesting entry with a zero amount', async () => {
			// 	// Transfer of DOUGH to the escrow must occur before creating an entry
			// 	await dough.transfer(rewardEscrow.address, parseEther("1"));
			// 	console.log(`rewardEscrow address is ${rewardEscrow.address}`);
			// 	console.log(`rewardContractAccount is: ${rewardContractAccount}`);
			// 	await expect(rewardEscrow.connect(rewardContractAccount).appendVestingEntry(account1, parseEther('0'))).to.be.revertedWith("Quantity cannot be zero");

			// });

			it('should create a vesting entry with 1 ethers amount', async () => {
				// Transfer of DOUGH to the escrow must occur before creating an entry
				await dough.transfer(rewardEscrow.address, parseEther("10000"));
				console.log(`rewardEscrow address is ${rewardEscrow.address}`);
				
				console.log(`rewardContractAccountSigner is: ${await rewardContractAccountSigner.getAddress()}`);
				await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('2500'));
				await timeTraveler.increaseTime(WEEK);
				await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('2500'));
				await timeTraveler.increaseTime(WEEK*2);
				await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('5000'));

				const numVestingEntries = await (await rewardEscrow.connect(rewardContractAccountSigner).numVestingEntries(account1)).toString();
				console.log(`numVestingEntries is: ${numVestingEntries} `);

				const totalSupply = await (await rewardEscrow.connect(rewardContractAccountSigner).totalSupply()).toString();
				console.log(`totalSupply is: ${totalSupply} `);


				const getVestingTimeForIndex0 = await (await rewardEscrow.connect(rewardContractAccountSigner).getVestingTime(account1,0)).toString();
				console.log(`getVestingTimeForIndex0 is: ${getVestingTimeForIndex0} `);

				const getVestingTimeForIndex1 = await (await rewardEscrow.connect(rewardContractAccountSigner).getVestingTime(account1,1)).toString();
				console.log(`getVestingTimeForIndex1 is: ${getVestingTimeForIndex1} `);

				const getVestingTimeForIndex2 = await (await rewardEscrow.connect(rewardContractAccountSigner).getVestingTime(account1,2)).toString();
				console.log(`getVestingTimeForIndex2 is: ${getVestingTimeForIndex2} `);


				
				// const balanceOfRewardEscrow = await dough.balanceOf(rewardEscrow.address);
				// console.log(`balanceOfRewardEscrow is: ${balanceOfRewardEscrow}`);
			});

		// 	it('should not create a vesting entry if there is not enough DOUGH in the contracts balance', async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating an entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('1'));
		// 		await expect(rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('10'))).to.be.revertedWith(" Must be enough balance in the contract to provide for the vesting entry");
		// 	});
		});

		// describe('Vesting Schedule Reads ', async () => {
		// 	beforeEach(async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating a vestinng entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('6000'));

		// 		// Add a few vesting entries as the feepool address
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1000'));
		// 		await timeTraveler.increaseTime(WEEK);
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('2000'));
		// 		await timeTraveler.increaseTime(WEEK);
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('3000'));
		// 	});

		// 	it('should append a vesting entry and increase the contracts balance', async () => {
		// 		const balanceOfRewardEscrow = await dough.balanceOf(rewardEscrow.address);
		// 		expect(balanceOfRewardEscrow).to.eq(parseEther('6000'));
		// 	});

		// 	it('should get an accounts total Vested Account Balance', async () => {
		// 		const balanceOf = await rewardEscrow.balanceOf(account1);
		// 		expect(balanceOf).to.eq(parseEther('6000'));
		// 	});

		// 	it('should get an accounts number of vesting entries', async () => {
		// 		const numVestingEntries = await rewardEscrow.numVestingEntries(account1);
		// 		expect(numVestingEntries).to.eq(3);
		// 	});

		// 	it('should get an accounts vesting schedule entry by index', async () => {
		// 		let vestingScheduleEntry;
		// 		vestingScheduleEntry = await rewardEscrow.getVestingScheduleEntry(account1, 0);
		// 		expect(vestingScheduleEntry[1]).to.eq(parseEther('1000'));

		// 		vestingScheduleEntry = await rewardEscrow.getVestingScheduleEntry(account1, 1);
		// 		expect(vestingScheduleEntry[1]).to.eq(parseEther('2000'));

		// 		vestingScheduleEntry = await rewardEscrow.getVestingScheduleEntry(account1, 2);
		// 		expect(vestingScheduleEntry[1]).to.eq(parseEther('3000'));
		// 	});

		// 	it('should get an accounts vesting time for a vesting entry index', async () => {
        //         const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        //         // One year minus two weeks and a day
		// 		const oneYearAhead = BigNumber.from(timestamp + DAY * 349);
		// 		expect(await rewardEscrow.getVestingTime(account1, 0)).to.be.at.least(oneYearAhead);
		// 		expect(await rewardEscrow.getVestingTime(account1, 1)).to.be.at.least(oneYearAhead);
		// 		expect(await rewardEscrow.getVestingTime(account1, 2)).to.be.at.least(oneYearAhead);
		// 	});

		// 	it('should get an accounts vesting quantity for a vesting entry index', async () => {
		// 		expect(await rewardEscrow.getVestingQuantity(account1, 0)).to.eq(parseEther('1000'));
		// 		expect(await rewardEscrow.getVestingQuantity(account1, 1)).to.eq(parseEther('2000'));
		// 		expect(await rewardEscrow.getVestingQuantity(account1, 2)).to.eq(parseEther('3000'));
		// 	});
	    // });

		// describe('Partial Vesting', async () => {
		// 	beforeEach(async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating a vestinng entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('6000'));

		// 		// Add a few vesting entries as the feepool address
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1000'));
		// 		await timeTraveler.increaseTime(WEEK);
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('2000'));
		// 		await timeTraveler.increaseTime(WEEK);
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('3000'));

		// 		// fastForward to vest only the first weeks entry
		// 		await timeTraveler.increaseTime(YEAR - WEEK * 2);

		// 		// Vest
		// 		await rewardEscrow.connect(account1Signer).vest();
		// 	});

		// 	it('should get an accounts next vesting entry index', async () => {
		// 		expect(await rewardEscrow.getNextVestingIndex(account1)).to.eq(1);
		// 	});

		// 	it('should get an accounts next vesting entry', async () => {
		// 		const vestingScheduleEntry = await rewardEscrow.getNextVestingEntry(account1);
		// 		expect(vestingScheduleEntry[1]).to.eq(parseEther('2000'));
		// 	});

		// 	it('should get an accounts next vesting time', async () => {
        //         const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
		// 		const fiveDaysAhead = BigNumber.from(timestamp + DAY * 5);
		// 		expect(await rewardEscrow.getNextVestingTime(account1)).to.be.at.least(fiveDaysAhead);
		// 	});

		// 	it('should get an accounts next vesting quantity', async () => {
		// 		const nextVestingQuantity = await rewardEscrow.getNextVestingQuantity(account1);
		// 		expect(nextVestingQuantity).to.eq(parseEther('2000'));
		// 	});
		// });

		// describe('Vesting', async () => {
		// 	beforeEach(async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating a vestinng entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('6000'));

		// 		// Add a few vesting entries as the feepool address
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1000'));
		// 		await timeTraveler.increaseTime(WEEK);
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('2000'));
		// 		await timeTraveler.increaseTime(WEEK);
		// 		await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('3000'));

		// 		// Need to go into the future to vest
		// 		await timeTraveler.increaseTime(YEAR + WEEK * 3);
		// 	});

		// 	it('should vest and transfer DOUGH from contract to the user', async () => {
		// 		await rewardEscrow.connect(account1Signer).vest();

		// 		// Check user has all their vested DOUGH
		// 		expect(await dough.balanceOf(account1)).to.eq(parseEther('6000'));

		// 		// Check rewardEscrow does not have any DOUGH
		// 		expect(await dough.balanceOf(rewardEscrow.address)).to.eq(parseEther('0'));
		// 	});

		// 	it('should vest and emit a Vest event', async () => {
		// 		const vestTransaction = await (await rewardEscrow.connect(account1Signer).vest()).wait(1);

		// 		// Vested(msg.sender, now, total);
        //         const vestedEvent = vestTransaction.events.find(event => event.event === 'Vested');
        //         expect(vestedEvent.args.beneficiary).to.eq(account1);
        //         expect(vestedEvent.args.value).to.eq(parseEther('6000'));
		// 	});

		// 	it('should vest and update totalEscrowedAccountBalance', async () => {
		// 		// This account should have an escrowedAccountBalance
		// 		let escrowedAccountBalance = await rewardEscrow.totalEscrowedAccountBalance(account1);
		// 		expect(escrowedAccountBalance).to.eq(parseEther('6000'));

		// 		// Vest
		// 		await rewardEscrow.connect(account1Signer).vest();

		// 		// This account should not have any amount escrowed
		// 		escrowedAccountBalance = await rewardEscrow.totalEscrowedAccountBalance(account1);
		// 		expect(escrowedAccountBalance).to.eq(parseEther('0'));
		// 	});

		// 	it('should vest and update totalVestedAccountBalance', async () => {
		// 		// This account should have zero totalVestedAccountBalance
		// 		let totalVestedAccountBalance = await rewardEscrow.totalVestedAccountBalance(account1);
		// 		expect(totalVestedAccountBalance).to.eq(parseEther('0'));

		// 		// Vest
		// 		await rewardEscrow.connect(account1Signer).vest();

		// 		// This account should have vested its whole amount
		// 		totalVestedAccountBalance = await rewardEscrow.totalVestedAccountBalance(account1);
		// 		expect(totalVestedAccountBalance).to.eq(parseEther('6000'));
		// 	});

		// 	it('should vest and update totalEscrowedBalance', async () => {
		// 		await rewardEscrow.connect(account1Signer).vest();
		// 		// There should be no Escrowed balance left in the contract
		// 		expect(await rewardEscrow.totalEscrowedBalance()).to.eq(parseEther('0'));
		// 	});
        // });
        

        // describe("Vesting entries", async() => {
        //     it("Appending when there are no previous entries should create a new one", async() => {
        //         dough.transfer(rewardEscrow.address, parseEther("1"));
        //         await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther("1"));

        //         const numberOfEntries = await rewardEscrow.numVestingEntries(account1);
        //         const entryQuantity = await rewardEscrow.getVestingQuantity(account1, 0);
        //         const vestingBalance = await rewardEscrow.balanceOf(account1);

        //         expect(numberOfEntries).to.eq(1);
        //         expect(entryQuantity).to.eq(parseEther("1"));
        //         expect(vestingBalance).to.eq(parseEther("1"));
                
        //     });
        //     it("Appending when the current entry is less than a week old should add the amount to the current one", async() => {
        //         dough.transfer(rewardEscrow.address, parseEther("2"));
        //         await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther("1"));

        //         await timeTraveler.increaseTime(60);

        //         await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther("1"));

        //         const numberOfEntries = await rewardEscrow.numVestingEntries(account1);
        //         const entryQuantity = await rewardEscrow.getVestingQuantity(account1, 0);
        //         const vestingBalance = await rewardEscrow.balanceOf(account1);

        //         expect(numberOfEntries).to.eq(1);
        //         expect(entryQuantity).to.eq(parseEther("2"));
        //         expect(vestingBalance).to.eq(parseEther("2"));
        //     });
        //     it("Appending when the current entry is more than a week old should create a new one", async() => {
        //         dough.transfer(rewardEscrow.address, parseEther("2"));
        //         await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther("1"));

        //         await timeTraveler.increaseTime(WEEK + 10);

        //         await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther("1"));

        //         const numberOfEntries = await rewardEscrow.numVestingEntries(account1);
        //         const entry1Quantity = await rewardEscrow.getVestingQuantity(account1, 0);
        //         const entry2Quantity = await rewardEscrow.getVestingQuantity(account1, 1);
        //         const vestingBalance = await rewardEscrow.balanceOf(account1);

        //         expect(numberOfEntries).to.eq(2);
        //         expect(entry1Quantity).to.eq(parseEther("1"));
        //         expect(entry2Quantity).to.eq(parseEther("1"));
        //         expect(vestingBalance).to.eq(parseEther("2"));
        //     });
        // });

        // describe("Adding and removal of reward contracts", async() => {
        //     const PLACE_HOLDER_ADDRESS = "0x0000000000000000000000000000000000000001";

        //     it("Adding a reward contract should work", async() => {
        //         await rewardEscrow.addRewardsContract(PLACE_HOLDER_ADDRESS);
        //         const isRewardContract = await rewardEscrow.isRewardContract(PLACE_HOLDER_ADDRESS);
        //         expect(isRewardContract).to.be.true;
        //     });
        //     it("Adding a reward contract from a non owner should fail", async() => {
        //         await expect(rewardEscrow.connect(account1Signer).addRewardsContract(PLACE_HOLDER_ADDRESS)).to.be.revertedWith("caller is not the owner");
        //     });
        //     it("Removing a reward contract should work", async() => {
        //         await rewardEscrow.addRewardsContract(PLACE_HOLDER_ADDRESS);
        //         await rewardEscrow.removeRewardsContract(PLACE_HOLDER_ADDRESS);
        //         const isRewardContract = await rewardEscrow.isRewardContract(PLACE_HOLDER_ADDRESS);
        //         expect(isRewardContract).to.be.false;
        //     });
        //     it("Removing a reward contract from a non owner should fail", async() => {
        //         await rewardEscrow.addRewardsContract(PLACE_HOLDER_ADDRESS);

        //         await expect(rewardEscrow.connect(account1Signer).removeRewardsContract(PLACE_HOLDER_ADDRESS)).to.be.revertedWith("caller is not the owner");
        //     });
        // });

		// describe('Stress Test', () => {
		// 	it('should not create more than MAX_VESTING_ENTRIES vesting entries', async () => {
		// 		const MAX_VESTING_ENTRIES = 260; // await rewardEscrow.MAX_VESTING_ENTRIES();

		// 		// Transfer of DOUGH to the escrow must occur before creating an entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('265'));

		// 		// append the MAX_VESTING_ENTRIES to the schedule
		// 		for (let i = 0; i < MAX_VESTING_ENTRIES + 1; i++) {
		// 			await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1'), {gasLimit: 1000000});
		// 			await timeTraveler.increaseTime(WEEK + 60);
		// 		}
		// 		// assert adding 1 more above the MAX_VESTING_ENTRIES fails
		// 		await expect(rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1'))).to.be.revertedWith("Vesting schedule is too long");
		// 	}).timeout(60e3);

		// 	it('should be able to vest 52 week * 5 years vesting entries', async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating an entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('260'));

		// 		const MAX_VESTING_ENTRIES = 260; // await rewardEscrow.MAX_VESTING_ENTRIES();

		// 		// Append the MAX_VESTING_ENTRIES to the schedule
		// 		for (let i = 0; i < MAX_VESTING_ENTRIES; i++) {
		// 			await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1'), { gasLimit: 1000000});
		// 			await timeTraveler.increaseTime(WEEK + 60);
		// 		}

		// 		// Need to go into the future to vest
		// 		await timeTraveler.increaseTime(YEAR * 100);

		// 		// Vest
		// 		await rewardEscrow.connect(account1Signer).vest();

		// 		// Check user has all their vested DOUGH
		// 		expect(await dough.balanceOf(account1)).to.eq(parseEther('260'));

		// 		// Check rewardEscrow does not have any DOUGH
		// 		expect(await dough.balanceOf(rewardEscrow.address)).to.eq(parseEther('0'));

		// 		// This account should have vested its whole amount
		// 		expect(await rewardEscrow.totalEscrowedAccountBalance(account1)).to.eq(parseEther('0'));

		// 		// This account should have vested its whole amount
		// 		expect(await rewardEscrow.totalVestedAccountBalance(account1)).to.eq(parseEther('260'));
		// 	}).timeout(60e3);

		// 	it('should be able to read an accounts schedule of 5 vesting entries', async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating an entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('5'));

		// 		const VESTING_ENTRIES = 5;

		// 		// Append the VESTING_ENTRIES to the schedule
		// 		for (let i = 0; i < VESTING_ENTRIES; i++) {
		// 			await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1'));
		// 			await timeTraveler.increaseTime(WEEK + 60);
		// 		}

		// 		// Get the vesting Schedule
		// 		const accountSchedule = await rewardEscrow.checkAccountSchedule(account1);

		// 		// Check accountSchedule entries
		// 		for (let i = 1; i < VESTING_ENTRIES; i += 2) {
		// 			if (accountSchedule[i]) {
		// 				expect(accountSchedule[i]).to.eq(parseEther('1'));
		// 			}
		// 		}
		// 	}).timeout(60e3);

		// 	it('should be able to read the full account schedule 52 week * 5 years vesting entries', async () => {
		// 		// Transfer of DOUGH to the escrow must occur before creating an entry
		// 		await dough.transfer(rewardEscrow.address, parseEther('260'));

		// 		const MAX_VESTING_ENTRIES = 260; // await rewardEscrow.MAX_VESTING_ENTRIES();

		// 		// Append the MAX_VESTING_ENTRIES to the schedule
		// 		for (let i = 0; i < MAX_VESTING_ENTRIES; i++) {
		// 			await rewardEscrow.connect(rewardContractAccountSigner).appendVestingEntry(account1, parseEther('1'), {gasLimit: 1000000});
		// 			await timeTraveler.increaseTime(WEEK + 60);
		// 		}

		// 		// Get the vesting Schedule
		// 		const accountSchedule = await rewardEscrow.checkAccountSchedule(account1);

		// 		// Check accountSchedule entries
		// 		for (let i = 1; i < MAX_VESTING_ENTRIES; i += 2) {
		// 			expect(accountSchedule[i]).to.eq(parseEther('1'));
		// 		}
		// 	}).timeout(60e3);
		// });
	});
});
