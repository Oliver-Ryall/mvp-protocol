import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { candidatesList } from "./utils/candidatesList";
// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");

export type Candidate = {
  id: BigNumber;
  name: string;
  age: BigNumber;
  cult: string;
  votes: BigNumber;
};

describe("Candidates/Voting Contract", function () {
  let Candidates: any;
  let candidates: any;
  let Token: any;
  let token: any;

  // accounts
  let deployer: SignerWithAddress,
    account1: SignerWithAddress,
    account2: SignerWithAddress;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Token = await ethers.getContractFactory("WKND");
    Candidates = await ethers.getContractFactory("Candidates");
    [deployer, account1, account2] = await ethers.getSigners();
    token = await Token.deploy();
    candidates = await Candidates.deploy(token.address);
  });

  describe("Success cases", function () {
    this.beforeEach(async function () {
      await candidates.connect(deployer).addCandidates(candidatesList);
      await token.connect(deployer).mint(account1.address);
    });

    it("Should add a list of candidates to the contract", async function () {
      let list = await candidates._candidates(0);
      expect(list.id).to.equal(candidatesList[0].id);
      expect(list.name).to.equal(candidatesList[0].name);
      expect(list.age).to.equal(candidatesList[0].age);
      expect(list.cult).to.equal(candidatesList[0].cult);
      expect(list.votes).to.equal(candidatesList[0].votes);
    });
    it("Should vote for a candidate", async function () {
      expect((await candidates._candidates(0))[4]).to.equal(0);
      await candidates.connect(account1).vote(1, 1);
      expect((await candidates._candidates(0))[4]).to.equal(1);
    });
    it("Should return a list of top 3 candidates", async function () {
      expect(
        (await candidates.connect(account1).winningCandidates())[0].votes
      ).to.equal(0);
      await candidates.connect(account1).vote(1, 1);
      expect(
        (await candidates.connect(account1).winningCandidates())[0].votes
      ).to.equal(1);
    });
  });
  describe("Revert cases", function () {
    it("Should attempt to vote with no candidates signed up", async function () {
      await token.connect(deployer).mint(account1.address);
      await expect(candidates.connect(account1).vote(1, 1)).to.be.revertedWith(
        "NoCandidatesSignedUp()"
      );
    });
    it("Should attempt to vote without a token", async function () {
      const tokenBalance = await token.balanceOf(account1.address);
      await candidates.connect(deployer).addCandidates(candidatesList);
      await expect(candidates.connect(account1).vote(1, 1)).to.be.revertedWith(
        `InsufficientTokenBalance(${tokenBalance}, 1)`
      );
    });
    it("Should attempt to vote more times than tokens owned", async function () {
      await token.connect(deployer).mint(account1.address);
      const tokenBalance = await token.balanceOf(account1.address);
      await candidates.connect(deployer).addCandidates(candidatesList);
      await expect(
        candidates.connect(account1).vote(100, 1)
      ).to.be.revertedWith(`InsufficientTokenBalance(${tokenBalance}, 100)`);
    });
    it("Should attempt to vote for a wrong id", async function () {
      await token.connect(deployer).mint(account1.address);
      await candidates.connect(deployer).addCandidates(candidatesList);
      await expect(
        candidates.connect(account1).vote(1, 100)
      ).to.be.revertedWith("InvalidId(100)");
    });
  });
});
