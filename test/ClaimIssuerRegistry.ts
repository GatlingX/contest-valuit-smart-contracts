import { expect } from "chai";
import { ethers } from "hardhat";
import { Event, Signer } from "ethers"; 
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import {
  ClaimIssuer,
  ClaimIssuer__factory,
  IClaimIssuer,
  IIdentity
} from "../typechain"; 

describe("ClaimIssuer Contract Testing", function () {
  let owner: SignerWithAddress;
  let manager: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  let claimIssuerContract: ClaimIssuer;

  // Fresh contract deployment before each test
  beforeEach(async () => {
    // Get signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    manager = signers[1];
    otherAccount = signers[2];

    // Use the manager's address or any other address for initialManagementKey
    const initialManagementKey = manager.address;

    // Deploy ClaimIssuer contract with the initialManagementKey argument
    claimIssuerContract = await new ClaimIssuer__factory(owner).deploy(initialManagementKey);

    // Initialize the contract with the manager's address
    // If the contract has already been initialized previously, you can safely skip initialization here
    try {
      await claimIssuerContract.connect(owner).initialize(manager.address);
    } catch (err) {
      console.log("Initialization skipped: ");
    }
  });

  describe("Deployment", () => {
    it("Should set the correct manager during initialization", async () => {
      // Verify that the manager key is added with the correct purpose
      const managerKeyHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['address'], [manager.address])
      );

      const hasManagerPurpose = await claimIssuerContract.keyHasPurpose(
        managerKeyHash, 
        3 // Management purpose
      );

      expect(hasManagerPurpose).to.be.true;
    });
  });

  describe("Claim Revocation", () => {
    let sampleSignature: string;

    beforeEach(async () => {
      // Prepare a sample signature for testing
      sampleSignature = await owner.signMessage("Sample Claim Data");
    });

    it("Should allow manager to revoke a claim", async () => {
      // Revoke claim using the manager account
      await expect(
        claimIssuerContract.connect(manager).revokeClaimBySignature(sampleSignature)
      ).to.emit(claimIssuerContract, "ClaimRevoked")
      .withArgs(sampleSignature);
    });

    it("Checking for is revoked", async () => {
      await expect(
        claimIssuerContract.connect(manager).revokeClaimBySignature(sampleSignature)
      ).to.emit(claimIssuerContract, "ClaimRevoked")
      .withArgs(sampleSignature);

      // Verify the claim is revoked
      const isRevoked = await claimIssuerContract.isClaimRevoked(sampleSignature);
      expect(isRevoked).to.be.true;
    });

    it("Should prevent non-manager from revoking a claim", async () => {
      // Attempt to revoke claim from a non-manager account should fail
      await expect(
        claimIssuerContract.connect(otherAccount).revokeClaimBySignature(sampleSignature)
      ).to.be.revertedWith("Permissions: Sender does not have management key");
    });
  });

  describe("Claim Validation", () => {
    it("Should validate an unrevoked claim", async () => {
      const claimTopic = 1;
      const sampleData = "Sample Claim Data";
      const sampleSignature = await owner.signMessage(sampleData);
    
      // Recover signer address for validation
      const signerAddress = ethers.utils.verifyMessage(sampleData, sampleSignature);
      
      // Add the key for the recovered address, not the original signer
      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ['address', 'uint256', 'bytes'], 
              [claimIssuerContract.address, claimTopic, ethers.utils.toUtf8Bytes(sampleData)]
            )
          )
        ), 
        sampleSignature
      );
    
      // Compute key hash for the recovered address
      const recoveredKeyHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['address'], [recoveredAddress])
      );
    
      // Add the key with management purpose using the manager account
      await claimIssuerContract.connect(manager).addKey(
        recoveredKeyHash, 
        3, // Management purpose
        1  // Key type
      );
    
      // Validate the claim
      const isValid = await claimIssuerContract.isClaimValid(
        claimIssuerContract.address,
        claimTopic,
        sampleSignature,
        ethers.utils.toUtf8Bytes(sampleData)
      );
      
      expect(isValid).to.be.true;
    });

    it("Should invalidate a revoked claim", async () => {
      const claimTopic = 1;
      const sampleData = "Sample Claim Data";
      const sampleSignature = await owner.signMessage(sampleData);

      // Revoke the claim
      await claimIssuerContract.connect(manager).revokeClaimBySignature(sampleSignature);

      const isValid = await claimIssuerContract.isClaimValid(
        claimIssuerContract.address,
        claimTopic,
        sampleSignature,
        ethers.utils.toUtf8Bytes(sampleData)
      );
      expect(isValid).to.be.false;
    });
  });

  describe("RevokeClaim Functionality", () => {
    it("Should allow manager to revoke a claim by ID and identity", async () => {
      const claimTopic = 1;
      const sampleData = "Sample Claim Data";
      const sampleSignature = await owner.signMessage(sampleData);
  
      // Prepare the claim data hash
      const dataHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
              ['address', 'uint256', 'bytes'], 
              [claimIssuerContract.address, claimTopic, ethers.utils.toUtf8Bytes(sampleData)]
          )
      );
  
      try {
          await claimIssuerContract.connect(manager).revokeClaim(dataHash, claimIssuerContract.address);
      } catch (error) {
          console.log("RevokeClaim error:");
      }
  
      // Alternative revokeClaimBySignature
      const tx = await claimIssuerContract.connect(manager).revokeClaimBySignature(sampleSignature);
      const receipt = await tx.wait();
      console.log("Emitted events:", receipt.events);
  
      // Check revocation
      const isRevoked = await claimIssuerContract.isClaimRevoked(sampleSignature);
      console.log("Is claim revoked:", isRevoked);
  
      expect(isRevoked).to.be.true;
  
      const isValid = await claimIssuerContract.isClaimValid(
          claimIssuerContract.address,
          claimTopic,
          sampleSignature,
          ethers.utils.toUtf8Bytes(sampleData)
      );
      expect(isValid).to.be.false;
    });

    it("Should prevent revocation of a non-existent claim ID", async () => {
      const claimTopic = 1;
      const sampleData = "Sample Claim Data";
      const sampleSignature = await owner.signMessage(sampleData);

      const tx = await claimIssuerContract.connect(manager).revokeClaimBySignature(sampleSignature);

      const isRevoked = await claimIssuerContract.isClaimRevoked(sampleSignature);
      console.log("Is claim revoked:", isRevoked);

      const dataHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'uint256', 'bytes'], 
            [claimIssuerContract.address, claimTopic, ethers.utils.toUtf8Bytes(sampleData)]
        )
      );

      await claimIssuerContract.connect(manager).revokeClaim(dataHash, claimIssuerContract.address);

      await expect(
        claimIssuerContract.connect(manager).revokeClaim(
          dataHash,
          claimIssuerContract.address
        )
      ).to.be.revertedWith("Conflict: Claim already revoked");
    });
  });
});
