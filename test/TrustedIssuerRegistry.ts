import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import {
  ClaimTopicsRegistry,
  ClaimTopicsRegistry__factory,
  IdentityRegistry,
  IdentityRegistry__factory,
  IdentityRegistryStorage,
  IdentityRegistryStorage__factory,
  TrustedIssuersRegistry,
  TrustedIssuersRegistry__factory,
  TrustedIssuersRegistryProxy__factory,
  TREXImplementationAuthority,
  TREXImplementationAuthority__factory,
  ModularCompliance,
  ModularCompliance__factory,
  Token,
  Token__factory
} from "../typechain";

describe("Trusted Issuers Registry Contract Testing", function () {
  let owner: SignerWithAddress;
  let agent: SignerWithAddress;
  let randomUser: SignerWithAddress;
  let issuer1: SignerWithAddress;
  let issuer2: SignerWithAddress;

  // Contract instances
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let trexImplementationAuthority: TREXImplementationAuthority;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let identityRegistryStorage: IdentityRegistryStorage;
  let identityRegistry: IdentityRegistry;

  beforeEach(async () => {
    // Get signers
    [owner, agent, randomUser, issuer1, issuer2] = await ethers.getSigners();

    // Deploy implementations
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
    const trustedIssuersRegistryProxy = await new TrustedIssuersRegistryProxy__factory(owner).deploy(
      trexImplementationAuthority.address
    );

    // Create contract instances
    trustedIssuersRegistry = TrustedIssuersRegistry__factory.connect(
      trustedIssuersRegistryProxy.address,
      owner
    );

    // Deploy and init other required contracts
    claimTopicsRegistry = await new ClaimTopicsRegistry__factory(owner).deploy();
    identityRegistryStorage = await new IdentityRegistryStorage__factory(owner).deploy();
    identityRegistry = await new IdentityRegistry__factory(owner).deploy();

    await claimTopicsRegistry.init();
    await identityRegistryStorage.init();
    await identityRegistry.init(
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address
    );
    
  });

  describe("Initialization", () => {
    it("should be initialized correctly", async () => {
      expect(await trustedIssuersRegistry.owner()).to.equal(owner.address);
    });
  });

  describe("addTrustedIssuer", () => {
    it("should add a trusted issuer successfully", async () => {
        const claimTopics = [1, 2, 3];
  
        await expect(trustedIssuersRegistry.addTrustedIssuer(issuer1.address, claimTopics))
          .to.emit(trustedIssuersRegistry, "TrustedIssuerAdded")
          .withArgs(issuer1.address, claimTopics);
      
        const trustedIssuers = await trustedIssuersRegistry.getTrustedIssuers();
        expect(trustedIssuers).to.include(issuer1.address);
      
        const issuerClaimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(issuer1.address);
        
        // Convert BigNumber array to regular number array for comparison
        const claimTopicsValues = issuerClaimTopics.map(topic => topic.toNumber());
        expect(claimTopicsValues).to.deep.equal(claimTopics);
    });

    it("should revert when adding zero address", async () => {
      await expect(
        trustedIssuersRegistry.addTrustedIssuer(ethers.constants.AddressZero, [1])
      ).to.be.revertedWith("invalid argument - zero address");
    });

    it("should revert when adding an existing trusted issuer", async () => {
      const claimTopics = [1, 2, 3];
      await trustedIssuersRegistry.addTrustedIssuer(issuer1.address, claimTopics);
      
      await expect(
        trustedIssuersRegistry.addTrustedIssuer(issuer1.address, claimTopics)
      ).to.be.revertedWith("trusted Issuer already exists");
    });

    it("should revert when claim topics are empty", async () => {
      await expect(
        trustedIssuersRegistry.addTrustedIssuer(issuer1.address, [])
      ).to.be.revertedWith("trusted claim topics cannot be empty");
    });

    it("should revert when claim topics exceed 15", async () => {
      const claimTopics = Array.from({length: 16}, (_, i) => i + 1);
      
      await expect(
        trustedIssuersRegistry.addTrustedIssuer(issuer1.address, claimTopics)
      ).to.be.revertedWith("cannot have more than 15 claim topics");
    });

    it("should revert when adding more than 50 trusted issuers", async () => {
        const claimTopics = [1];
      
        // Generate 50 unique addresses explicitly
        const additionalSigners = await Promise.all(
          Array(50).fill(null).map(async () => {
            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            await owner.sendTransaction({
              to: wallet.address,
              value: ethers.utils.parseEther("1")
            });
            return wallet;
          })
        );
  
        // Add 50 issuers
        for (const signer of additionalSigners) {
          await trustedIssuersRegistry.addTrustedIssuer(signer.address, claimTopics);
        }
  
        // Attempt to add 51st issuer should revert
        await expect(
          trustedIssuersRegistry.addTrustedIssuer(randomUser.address, claimTopics)
        ).to.be.revertedWith("cannot have more than 50 trusted issuers");
    });
  });

  describe("removeTrustedIssuer", () => {
    it("should remove a trusted issuer successfully", async () => {
      const claimTopics = [1, 2, 3];
      await trustedIssuersRegistry.addTrustedIssuer(issuer1.address, claimTopics);
      
      await expect(trustedIssuersRegistry.removeTrustedIssuer(issuer1.address))
        .to.emit(trustedIssuersRegistry, "TrustedIssuerRemoved")
        .withArgs(issuer1.address);

      const trustedIssuers = await trustedIssuersRegistry.getTrustedIssuers();
      expect(trustedIssuers).to.not.include(issuer1.address);
    });

    it("should revert when removing zero address", async () => {
      await expect(
        trustedIssuersRegistry.removeTrustedIssuer(ethers.constants.AddressZero)
      ).to.be.revertedWith("invalid argument - zero address");
    });

    it("should revert when removing a non-trusted issuer", async () => {
      await expect(
        trustedIssuersRegistry.removeTrustedIssuer(issuer1.address)
      ).to.be.revertedWith("NOT a trusted issuer");
    });
  });

  describe("updateIssuerClaimTopics", () => {
    it("should update claim topics successfully", async () => {

      const initialTopics = [1, 2, 3];
      const updatedTopics = [4, 5];

      await trustedIssuersRegistry.addTrustedIssuer(issuer1.address, initialTopics);
      
      await expect(trustedIssuersRegistry.updateIssuerClaimTopics(issuer1.address, updatedTopics))
        .to.emit(trustedIssuersRegistry, "ClaimTopicsUpdated")
        .withArgs(issuer1.address, updatedTopics);

      const issuerClaimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(issuer1.address);
      const claimTopicsValues = issuerClaimTopics.map(topic => topic.toNumber());
      expect( claimTopicsValues).to.deep.equal(updatedTopics);
    });

    it("should revert when updating topics for non-existing issuer", async () => {
      await expect(
        trustedIssuersRegistry.updateIssuerClaimTopics(issuer1.address, [1])
      ).to.be.revertedWith("NOT a trusted issuer");
    });

    it("should revert when updating with empty topics", async () => {
      await trustedIssuersRegistry.addTrustedIssuer(issuer1.address, [1]);
      
      await expect(
        trustedIssuersRegistry.updateIssuerClaimTopics(issuer1.address, [])
      ).to.be.revertedWith("claim topics cannot be empty");
    });

    it("should revert when updating with more than 15 topics", async () => {
      await trustedIssuersRegistry.addTrustedIssuer(issuer1.address, [1]);
      
      const claimTopics = Array.from({length: 16}, (_, i) => i + 1);
      
      await expect(
        trustedIssuersRegistry.updateIssuerClaimTopics(issuer1.address, claimTopics)
      ).to.be.revertedWith("cannot have more than 15 claim topics");
    });
  });

  describe("Getters", () => {
    beforeEach(async () => {
      await trustedIssuersRegistry.addTrustedIssuer(issuer1.address, [1, 2]);
      await trustedIssuersRegistry.addTrustedIssuer(issuer2.address, [3, 4]);
    });

    it("getTrustedIssuers should return all trusted issuers", async () => {
      const trustedIssuers = await trustedIssuersRegistry.getTrustedIssuers();
      expect(trustedIssuers).to.include(issuer1.address);
      expect(trustedIssuers).to.include(issuer2.address);
    });

    it("getTrustedIssuersForClaimTopic should return issuers for a specific topic", async () => {
      const issuersForTopic1 = await trustedIssuersRegistry.getTrustedIssuersForClaimTopic(1);
      expect(issuersForTopic1).to.include(issuer1.address);
    });

    it("isTrustedIssuer should correctly identify trusted issuers", async () => {
      expect(await trustedIssuersRegistry.isTrustedIssuer(issuer1.address)).to.be.true;
      expect(await trustedIssuersRegistry.isTrustedIssuer(randomUser.address)).to.be.false;
    });

    it("getTrustedIssuerClaimTopics should return claim topics for a trusted issuer", async () => {
        const claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(issuer1.address);
  
  // Convert BigNumber array to regular number array for comparison
  const claimTopicsValues = claimTopics.map(topic => topic.toNumber());
  expect(claimTopicsValues).to.deep.equal([1, 2]);
    });

    it("hasClaimTopic should correctly check if an issuer has a specific claim topic", async () => {
      expect(await trustedIssuersRegistry.hasClaimTopic(issuer1.address, 1)).to.be.true;
      expect(await trustedIssuersRegistry.hasClaimTopic(issuer1.address, 5)).to.be.false;
    });
  });

  describe("Access Control", () => {
    it("should revert when non-owner tries to add trusted issuer", async () => {
      await expect(
        trustedIssuersRegistry.connect(randomUser).addTrustedIssuer(issuer1.address, [1])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert when non-owner tries to remove trusted issuer", async () => {
      await expect(
        trustedIssuersRegistry.connect(randomUser).removeTrustedIssuer(issuer1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert when non-owner tries to update issuer claim topics", async () => {
      await expect(
        trustedIssuersRegistry.connect(randomUser).updateIssuerClaimTopics(issuer1.address, [1])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});