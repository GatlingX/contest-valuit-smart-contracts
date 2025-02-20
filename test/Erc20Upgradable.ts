import { expect } from "chai";
import { ethers } from "hardhat";
import { Event, Signer } from "ethers"; 
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import {
  ERC20Upgradeable,
  ERC20Upgradeable__factory
} from "../typechain"; 

describe("ERC-20 upgradable code", function () {
    
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let erc20Upgradable:ERC20Upgradeable;

  // Fresh contract deployment before each test
  beforeEach(async () => {

    // Get signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];
    user2 = signers[2];

    erc20Upgradable = await new ERC20Upgradeable__factory(owner).deploy();
  });

  it("should return the correct total supply", async function () {
    const totalSupply = await erc20Upgradable.totalSupply();
    expect(totalSupply).to.equal(0);  // Assuming no tokens are minted yet
  });

  it("should return the correct balance of an account", async function () {
    const balanceOwner = await erc20Upgradable.balanceOf(owner.address);
    expect(balanceOwner).to.equal(0);  // Assuming no tokens are minted yet
  });

  it("should increase allowance correctly", async function () {
    const amount = ethers.utils.parseUnits("100", 18);
    await erc20Upgradable.approve(user1.address, amount);
    
    const initialAllowance = await erc20Upgradable.allowance(owner.address, user1.address);
    expect(initialAllowance).to.equal(amount);

    const addedValue = ethers.utils.parseUnits("50", 18);
    await erc20Upgradable.increaseAllowance(user1.address, addedValue);

    const newAllowance = await erc20Upgradable.allowance(owner.address, user1.address);
    expect(newAllowance).to.equal(ethers.utils.parseUnits("150", 18));
  });

  it("should decrease allowance correctly", async function () {
    const amount = ethers.utils.parseUnits("100", 18);
    await erc20Upgradable.approve(user1.address, amount);

    const initialAllowance = await erc20Upgradable.allowance(owner.address, user1.address);
    expect(initialAllowance).to.equal(amount);

    const subtractedValue = ethers.utils.parseUnits("30", 18);
    await erc20Upgradable.decreaseAllowance(user1.address, subtractedValue);

    const newAllowance = await erc20Upgradable.allowance(owner.address, user1.address);
    expect(newAllowance).to.equal(ethers.utils.parseUnits("70", 18));
  });

  it("should revert when decreasing allowance below zero", async function () {
    const amount = ethers.utils.parseUnits("100", 18);
    await erc20Upgradable.approve(user1.address, amount);

    await expect(
      erc20Upgradable.decreaseAllowance(user1.address, ethers.utils.parseUnits("200", 18))
    ).to.be.revertedWith("ERC20: decreased allowance below zero");
  });
  
});
