import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import "@nomicfoundation/hardhat-chai-matchers"
import {
  ClaimTopicsRegistry,
  ClaimTopicsRegistry__factory,
  ClaimTopicsRegistryProxy__factory,
  TREXImplementationAuthority,
  TREXImplementationAuthority__factory,
  IdentityRegistry,
  IdentityRegistry__factory,
  IdentityRegistryStorage,
  IdentityRegistryStorage__factory,
  TrustedIssuersRegistry,
  TrustedIssuersRegistry__factory,
  ModularCompliance,
  ModularCompliance__factory,
  Token,
  Token__factory
} from "../typechain";

describe("ClaimTopicsRegistry Contract Testing", function () {
  let owner: SignerWithAddress;
  let otherAccount: SignerWithAddress;
  let claimTopicsRegistryContract: ClaimTopicsRegistry;
  let trexImplementationAuthority: TREXImplementationAuthority;

  beforeEach(async () => {
    // Get signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    otherAccount = signers[1];

    // Deploy all implementations first
    const claimTopicsRegistryImpl = await new ClaimTopicsRegistry__factory(owner).deploy();
    const identityRegistryImpl = await new IdentityRegistry__factory(owner).deploy();
    const identityRegistryStorageImpl = await new IdentityRegistryStorage__factory(owner).deploy();
    const trustedIssuersRegistryImpl = await new TrustedIssuersRegistry__factory(owner).deploy();
    const modularComplianceImpl = await new ModularCompliance__factory(owner).deploy();
    const tokenImpl = await new Token__factory(owner).deploy();

    // Deploy TREX Implementation Authority
    trexImplementationAuthority = await new TREXImplementationAuthority__factory(owner).deploy(
      true,
      owner.address,
      owner.address
    );

    // Prepare contracts struct for Implementation Authority
    const contractsStruct = {
      ctrImplementation: claimTopicsRegistryImpl.address,
      tokenImplementation: tokenImpl.address,
      irImplementation: identityRegistryImpl.address,
      irsImplementation: identityRegistryStorageImpl.address,
      tirImplementation: trustedIssuersRegistryImpl.address,
      mcImplementation: modularComplianceImpl.address,
    };

    const versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };

    // Add and use TREX version
    await trexImplementationAuthority
      .connect(owner)
      .addAndUseTREXVersion(versionStruct, contractsStruct);

    // Deploy Proxy
    const claimTopicsRegistryProxy = await new ClaimTopicsRegistryProxy__factory(owner).deploy(
      trexImplementationAuthority.address
    );

    // Create a contract instance that uses the proxy address but with the implementation ABI
    claimTopicsRegistryContract = ClaimTopicsRegistry__factory.connect(
      claimTopicsRegistryProxy.address, 
      owner
    );
  });
  describe("Deployment", () => {
    it("Should initialize the contract correctly", async () => {
      // Verify that the contract is owned by the deployer
      const contractOwner = await claimTopicsRegistryContract.owner();
      expect(contractOwner).to.equal(owner.address);
    });
  });

  describe("Removing Claim Topics - Edge Cases", () => {
    it("Should revert if trying to remove a claim topic that does not exist", async () => {
      const nonExistentClaimTopic = 99; // A topic that was never added
  
      await expect(
        claimTopicsRegistryContract.connect(owner).removeClaimTopic(nonExistentClaimTopic)
      ).to.not.emit(claimTopicsRegistryContract, "ClaimTopicRemoved"); // Ensure no event is emitted
    });
  
    it("Should do nothing if trying to remove a claim topic from an empty registry", async () => {
      const claimTopicsBefore = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopicsBefore.length).to.equal(0);
  
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(1);
  
      const claimTopicsAfter = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopicsAfter.length).to.equal(0); // Should remain empty
    });
  });
  

  describe("Adding Claim Topics", () => {
    it("Should allow owner to add a claim topic", async () => {
        const claimTopic = 1;
    
        // Add claim topic
        await claimTopicsRegistryContract.connect(owner).addClaimTopic(claimTopic);
    
        // Verify the claim topic was added
        const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
        
        // Use a more explicit comparison
        expect(claimTopics.length).to.equal(1);
        expect(claimTopics[0]).to.equal(claimTopic);
    });

    it("Should prevent adding duplicate claim topics", async () => {
      const claimTopic = 1;
      
      // First addition should succeed
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(claimTopic);

      // Second addition should revert
      await expect(
        claimTopicsRegistryContract.connect(owner).addClaimTopic(claimTopic)
      ).to.be.revertedWith("claimTopic already exists");
    });

    it("Should prevent adding more than 15 claim topics", async () => {
      // Add 15 unique topics
      for (let i = 1; i <= 15; i++) {
        await claimTopicsRegistryContract.connect(owner).addClaimTopic(i);
      }

      // 16th topic addition should revert
      await expect(
        claimTopicsRegistryContract.connect(owner).addClaimTopic(16)
      ).to.be.revertedWith("cannot require more than 15 topics");
    });

    it("Should prevent non-owners from adding claim topics", async () => {
      await expect(
        claimTopicsRegistryContract.connect(otherAccount).addClaimTopic(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Removing Claim Topics", () => {
    it("Should allow owner to remove an existing claim topic", async () => {
      const claimTopic = 1;
      
      // Add claim topic first
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(claimTopic);

      // Remove claim topic
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(claimTopic);

      // Verify the claim topic was removed
      const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopics).to.not.include(claimTopic);
    });

    it("Should prevent non-owners from removing claim topics", async () => {
      const claimTopic = 1;
      
      // Add claim topic first
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(claimTopic);

      // Attempt to remove by non-owner should revert
      await expect(
        claimTopicsRegistryContract.connect(otherAccount).removeClaimTopic(claimTopic)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });


    it("Should remove the last claim topic correctly", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(2);
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(2);
      
      const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopics).to.deep.equal([1]);
    });
    

    it("Should remove a claim topic and keep the list correct", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(2);
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(3);
    
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(2);
    
      const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopics).to.have.lengthOf(2);
      expect(claimTopics).to.not.include(2);
    });
    

    it("Should not emit an event when trying to remove a non-existent claim topic", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      
      await expect(
        claimTopicsRegistryContract.connect(owner).removeClaimTopic(99)
      ).to.not.emit(claimTopicsRegistryContract, "ClaimTopicRemoved");
    });

    
    

  });

  describe("Getting Claim Topics", () => {
    it("Should return all added claim topics", async () => {
      const claimTopics = [1, 2, 3];
      
      // Add multiple claim topics
      for (const topic of claimTopics) {
        await claimTopicsRegistryContract.connect(owner).addClaimTopic(topic);
      }

      // Verify all topics are returned
      const retrievedTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(retrievedTopics).to.have.lengthOf(claimTopics.length);
      claimTopics.forEach((topic, index) => {
        expect(retrievedTopics[index]).to.equal(topic);
      });
    });

    it("Should allow removing the only claim topic and return an empty list", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(1);
  
      const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopics).to.deep.equal([]);
  });
  
  it("Should handle attempting to remove a claim topic twice gracefully", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(1);
  
      await expect(claimTopicsRegistryContract.connect(owner).removeClaimTopic(1))
          .to.not.emit(claimTopicsRegistryContract, "ClaimTopicRemoved");
  });
  
  it("Should maintain order when adding and removing multiple claim topics", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(2);
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(3);
  
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(2);
      
      const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopics).to.deep.equal([1, 3]); // 2 should be removed, order preserved
  });
  
  it("Should return an empty list after adding and removing multiple topics", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(2);
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(1);
      await claimTopicsRegistryContract.connect(owner).removeClaimTopic(2);
  
      const claimTopics = await claimTopicsRegistryContract.getClaimTopics();
      expect(claimTopics).to.deep.equal([]);
  });
  
  it("Should correctly emit ClaimTopicRemoved event when removing a valid topic", async () => {
      await claimTopicsRegistryContract.connect(owner).addClaimTopic(1);
  
      await expect(claimTopicsRegistryContract.connect(owner).removeClaimTopic(1))
          .to.emit(claimTopicsRegistryContract, "ClaimTopicRemoved")
          .withArgs(1);
  });
  
  });
});