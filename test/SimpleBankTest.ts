import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("SimpleBank", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshopt in every test.
    async function deploySimpleBankFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, enrolledAccount, emptyEnrolledAccount, notEnrolledAccount] = await ethers.getSigners();
        const initial_balance = BigNumber.from(100);

        const SBank = await ethers.getContractFactory("SimpleBank");
        const bank = await SBank.deploy();
        await bank.connect(enrolledAccount).enroll();
        await bank.connect(enrolledAccount).deposit({value: initial_balance});
        await bank.connect(emptyEnrolledAccount).enroll();

        return { bank, owner, initial_balance, enrolledAccount, emptyEnrolledAccount, notEnrolledAccount };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { bank, owner } = await loadFixture(deploySimpleBankFixture);

            expect(await bank.owner()).to.equal(owner.address);
        });

    });

    describe("Enrolling", function () {
        it("Should show users as enrolled/not enrolled and balance = 0", async function () {
            const { bank, emptyEnrolledAccount, notEnrolledAccount } = await loadFixture(deploySimpleBankFixture);
            
            expect(!await bank.isEnrolled(notEnrolledAccount.address));
            expect(await bank.isEnrolled(emptyEnrolledAccount.address));
            expect(await bank.connect(emptyEnrolledAccount).getBalance()).to.equal(0);
            expect(await bank.connect(notEnrolledAccount).getBalance()).to.equal(0);
        });
        it("Should prevent not enrolled user to deposit", async function () {
            const { bank, notEnrolledAccount } = await loadFixture(deploySimpleBankFixture);
            
            await expect(bank.connect(notEnrolledAccount).deposit({ value: 20 })).to.be.revertedWith(
                "You are not enrolled in SimpleBank. Please enroll before other interactions"
                );

            expect(await bank.connect(notEnrolledAccount).getBalance()).to.equal(0);

        });
        it("Should allow enrolled user to deposit and balance should update accordingly", async function () {
            const { bank, emptyEnrolledAccount } = await loadFixture(deploySimpleBankFixture);
            const amount = 20;

            expect(await bank.connect(emptyEnrolledAccount).deposit({ value: amount }));
            expect(await bank.connect(emptyEnrolledAccount).getBalance()).to.equal(amount);
        });
    });

    describe("Wihdraw", function () {
        it("Should withdraw ", async function () {
            const { bank, enrolledAccount, initial_balance } = await loadFixture(deploySimpleBankFixture);

            const extract = BigNumber.from(20);

            expect(await bank.connect(enrolledAccount).withdraw(extract));

            expect(await bank.connect(enrolledAccount).getBalance()).to.equal(initial_balance.sub(extract));

            //expect(await enrolledAccount.getBalance()).to.equal(initial_balance.add(amount));
        });
        it("Should not withdraw bigger amount that actual balance", async function () {
            const { bank, enrolledAccount, initial_balance } = await loadFixture(deploySimpleBankFixture);

            const extract_value = initial_balance.add(1);

            await expect(bank.connect(enrolledAccount).withdraw(extract_value)).to.be.revertedWith(
                "You have not the required money to withdraw."
            );

            expect(await bank.connect(enrolledAccount).getBalance()).to.equal(initial_balance);
        });
    });


});