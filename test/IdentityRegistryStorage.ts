import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import "@nomicfoundation/hardhat-chai-matchers"
import { 
  IdentityRegistryStorage, 
  IdentityRegistryStorage__factory,
  IdentityRegistry,
  IdentityRegistry__factory,
  Identity,
  Identity__factory,
  TREXImplementationAuthority,
  TREXImplementationAuthority__factory,
  ClaimTopicsRegistry,
  ClaimTopicsRegistry__factory,
  TrustedIssuersRegistry,
  TrustedIssuersRegistry__factory
} from "../typechain";

describe("Identity Registry Storage Contract Testing", function () {
  let owner: SignerWithAddress;
  let agent: SignerWithAddress;
  let randomUser: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Contract instances
  let identityRegistryStorage: IdentityRegistryStorage;
  let identityRegistry: IdentityRegistry;
  let user1Identity: Identity;
  let user2Identity: Identity;
  let trexImplementationAuthority: TREXImplementationAuthority;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;

  beforeEach(async function () {
    // Get signers
    [owner, agent, randomUser, user1, user2] = await ethers.getSigners();

    // Deploy implementations
    const identityRegistryStorageImpl = await new IdentityRegistryStorage__factory(owner).deploy();
    const identityRegistryImpl = await new IdentityRegistry__factory(owner).deploy();
    const claimTopicsRegistryImpl = await new ClaimTopicsRegistry__factory(owner).deploy();
    const trustedIssuersRegistryImpl = await new TrustedIssuersRegistry__factory(owner).deploy();

    // Deploy TREX Implementation Authority
    trexImplementationAuthority = await new TREXImplementationAuthority__factory(owner).deploy(
      true,
      owner.address,
      owner.address
    );

    // Prepare contracts struct for Implementation Authority
    const contractsStruct = {
      ctrImplementation: claimTopicsRegistryImpl.address,
      tokenImplementation: identityRegistryImpl.address,
      irImplementation: identityRegistryImpl.address,
      irsImplementation: identityRegistryStorageImpl.address,
      tirImplementation: trustedIssuersRegistryImpl.address,
      mcImplementation: trustedIssuersRegistryImpl.address,
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

    // Deploy contracts
    identityRegistryStorage = await new IdentityRegistryStorage__factory(owner).deploy();
    claimTopicsRegistry = await new ClaimTopicsRegistry__factory(owner).deploy();
    trustedIssuersRegistry = await new TrustedIssuersRegistry__factory(owner).deploy();
    identityRegistry = await new IdentityRegistry__factory(owner).deploy();

    // Initialize contracts
    await identityRegistryStorage.init();
    await claimTopicsRegistry.init();

    await identityRegistry.init(
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address
    );

    // Create identities for users
    user1Identity = await new Identity__factory(owner).deploy(
      user1.address,
      true
    );
    
    user2Identity = await new Identity__factory(owner).deploy(
      user2.address,
      true
    );

    // Add agent and bind identity registry
    await identityRegistryStorage.addAgent(owner.address);
    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address);
  });

  describe("addIdentityToStorage", function () {
    it("should add identity to storage successfully", async function () {
      const country = 250; // France country code

      await expect(
        identityRegistryStorage.addIdentityToStorage(user1.address, user1Identity.address, country)
      ).to.emit(identityRegistryStorage, "IdentityStored")
        .withArgs(user1.address, user1Identity.address);

      const storedIdentity = await identityRegistryStorage.storedIdentity(user1.address);
      const storedCountry = await identityRegistryStorage.storedInvestorCountry(user1.address);

      expect(storedIdentity).to.equal(user1Identity.address);
      expect(storedCountry).to.equal(country);
    });

    it("should revert if trying to add identity for an address with existing identity", async function () {
      const country = 250; // France country code

      await identityRegistryStorage.addIdentityToStorage(user1.address, user1Identity.address, country);

      await expect(
        identityRegistryStorage.addIdentityToStorage(user1.address, user2Identity.address, country)
      ).to.be.revertedWith("address stored already");
    });

    it("should revert if zero address is provided", async function () {
      await expect(
        identityRegistryStorage.addIdentityToStorage(ethers.constants.AddressZero, user1Identity.address, 250)
      ).to.be.revertedWith("invalid argument - zero address");

      await expect(
        identityRegistryStorage.addIdentityToStorage(user1.address, ethers.constants.AddressZero, 250)
      ).to.be.revertedWith("invalid argument - zero address");
    });
  });

  describe("modifyStoredIdentity", function () {
    it("should modify stored identity successfully", async function () {
      const country = 250; // France country code

      await identityRegistryStorage.addIdentityToStorage(user1.address, user1Identity.address, country);

      await expect(
        identityRegistryStorage.modifyStoredIdentity(user1.address, user2Identity.address)
      ).to.emit(identityRegistryStorage, "IdentityModified")
        .withArgs(user1Identity.address, user2Identity.address);

      const storedIdentity = await identityRegistryStorage.storedIdentity(user1.address);
      expect(storedIdentity).to.equal(user2Identity.address);
    });

    it("should revert if modifying identity for non-existing address", async function () {
      await expect(
        identityRegistryStorage.modifyStoredIdentity(user1.address, user2Identity.address)
      ).to.be.revertedWith("address not stored yet");
    });

    it("should revert if zero address is provided", async function () {
      await expect(
        identityRegistryStorage.modifyStoredIdentity(ethers.constants.AddressZero, user1Identity.address)
      ).to.be.revertedWith("invalid argument - zero address");

      await expect(
        identityRegistryStorage.modifyStoredIdentity(user1.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("invalid argument - zero address");
    });
  });

  describe("modifyStoredInvestorCountry", function () {
    it("should modify stored investor country successfully", async function () {
      const initialCountry = 250; // France country code
      const newCountry = 840; // United States country code

      await identityRegistryStorage.addIdentityToStorage(user1.address, user1Identity.address, initialCountry);

      await expect(
        identityRegistryStorage.modifyStoredInvestorCountry(user1.address, newCountry)
      ).to.emit(identityRegistryStorage, "CountryModified")
        .withArgs(user1.address, newCountry);

      const storedCountry = await identityRegistryStorage.storedInvestorCountry(user1.address);
      expect(storedCountry).to.equal(newCountry);
    });

    it("should revert if modifying country for non-existing address", async function () {
      await expect(
        identityRegistryStorage.modifyStoredInvestorCountry(user1.address, 840)
      ).to.be.revertedWith("address not stored yet");
    });

    it("should revert if zero address is provided", async function () {
      await expect(
        identityRegistryStorage.modifyStoredInvestorCountry(ethers.constants.AddressZero, 840)
      ).to.be.revertedWith("invalid argument - zero address");
    });
  });

  describe("removeIdentityFromStorage", function () {
    it("should remove identity from storage successfully", async function () {
      const country = 250; // France country code

      await identityRegistryStorage.addIdentityToStorage(user1.address, user1Identity.address, country);

      await expect(
        identityRegistryStorage.removeIdentityFromStorage(user1.address)
      ).to.emit(identityRegistryStorage, "IdentityUnstored")
        .withArgs(user1.address, user1Identity.address);

      const storedIdentity = await identityRegistryStorage.storedIdentity(user1.address);
      const storedCountry = await identityRegistryStorage.storedInvestorCountry(user1.address);

      expect(storedIdentity).to.equal(ethers.constants.AddressZero);
      expect(storedCountry).to.equal(0);
    });

    it("should revert if removing identity for non-existing address", async function () {
      await expect(
        identityRegistryStorage.removeIdentityFromStorage(user1.address)
      ).to.be.revertedWith("address not stored yet");
    });

    it("should revert if zero address is provided", async function () {
      await expect(
        identityRegistryStorage.removeIdentityFromStorage(ethers.constants.AddressZero)
      ).to.be.revertedWith("invalid argument - zero address");
    });
  });

  describe("bindIdentityRegistry", function () {
    it("should bind identity registry successfully", async function () {
      const newIdentityRegistry = await new IdentityRegistry__factory(owner).deploy();

      await expect(
        identityRegistryStorage.bindIdentityRegistry(newIdentityRegistry.address)
      ).to.emit(identityRegistryStorage, "IdentityRegistryBound")
        .withArgs(newIdentityRegistry.address);

      const linkedRegistries = await identityRegistryStorage.linkedIdentityRegistries();
      expect(linkedRegistries).to.include(newIdentityRegistry.address);
    });

    it("should bind identity registry successfully when no registries are bound", async function () {
      const newIdentityRegistry = await new IdentityRegistry__factory(owner).deploy();
      
      const beforeCount = await identityRegistryStorage.linkedIdentityRegistries();
      
      await identityRegistryStorage.bindIdentityRegistry(newIdentityRegistry.address);
      
      const afterCount = await identityRegistryStorage.linkedIdentityRegistries();
      expect(afterCount.length).to.equal(beforeCount.length + 1);
    });
     
    it("should bind multiple identity registries successfully", async function () {
      const registry1 = await new IdentityRegistry__factory(owner).deploy();
      const registry2 = await new IdentityRegistry__factory(owner).deploy();
      
      await identityRegistryStorage.bindIdentityRegistry(registry1.address);
      await identityRegistryStorage.bindIdentityRegistry(registry2.address);
      
      const registries = await identityRegistryStorage.linkedIdentityRegistries();
      expect(registries).to.include(registry1.address);
      expect(registries).to.include(registry2.address);
    });
       

    it("should revert if binding zero address", async function () {
      await expect(
        identityRegistryStorage.bindIdentityRegistry(ethers.constants.AddressZero)
      ).  to.be.revertedWith("invalid argument - zero address");
    });

    it("should limit identity registry bindings to 300", async function () {
      // Create and bind 299 identity registries
      for (let i = 0; i < 299; i++) {
        const newIdentityRegistry = await new IdentityRegistry__factory(owner).deploy();
        await identityRegistryStorage.bindIdentityRegistry(newIdentityRegistry.address);
      }

     

      // Attempt to bind 301st identity registry should revert
      const additionalIdentityRegistry = await new IdentityRegistry__factory(owner).deploy();
      await expect(
        identityRegistryStorage.bindIdentityRegistry(additionalIdentityRegistry.address)
      ).to.be.revertedWith("cannot bind more than 300 IR to 1 IRS");
    });
  });

  describe("unbindIdentityRegistry", function () {
    beforeEach(async function () {
        [owner, randomUser] = await ethers.getSigners();
    
        // Deploy the IdentityRegistryStorage
        identityRegistryStorage = await new IdentityRegistryStorage__factory(owner).deploy();
        
        // Initialize the contract
        await identityRegistryStorage.init();
        
        // Add owner as an agent (required for most operations)
        await identityRegistryStorage.addAgent(owner.address);
      });
    it("should unbind identity registry successfully", async function () {
      const newIdentityRegistry = await new IdentityRegistry__factory(owner).deploy();
      await identityRegistryStorage.bindIdentityRegistry(newIdentityRegistry.address);

      await expect(
        identityRegistryStorage.unbindIdentityRegistry(newIdentityRegistry.address)
      ).to.emit(identityRegistryStorage, "IdentityRegistryUnbound")
        .withArgs(newIdentityRegistry.address);

      const linkedRegistries = await identityRegistryStorage.linkedIdentityRegistries();
      expect(linkedRegistries).to.not.include(newIdentityRegistry.address);
    });

    it("should unbind the first registry in the array", async function () {
      const registry1 = await new IdentityRegistry__factory(owner).deploy();
      const registry2 = await new IdentityRegistry__factory(owner).deploy();
      
      await identityRegistryStorage.bindIdentityRegistry(registry1.address);
      await identityRegistryStorage.bindIdentityRegistry(registry2.address);
      
      await identityRegistryStorage.unbindIdentityRegistry(registry1.address);
      
      const registries = await identityRegistryStorage.linkedIdentityRegistries();
      expect(registries).to.not.include(registry1.address);
      expect(registries).to.include(registry2.address);
    });

    it("should unbind the last registry in the array", async function () {
      const registry1 = await new IdentityRegistry__factory(owner).deploy();
      const registry2 = await new IdentityRegistry__factory(owner).deploy();
      
      await identityRegistryStorage.bindIdentityRegistry(registry1.address);
      await identityRegistryStorage.bindIdentityRegistry(registry2.address);
      
      await identityRegistryStorage.unbindIdentityRegistry(registry2.address);
      
      const registries = await identityRegistryStorage.linkedIdentityRegistries();
      expect(registries).to.include(registry1.address);
      expect(registries).to.not.include(registry2.address);
    });
    it("should revert if unbinding when no registries are bound", async function () { 
        await expect(
          identityRegistryStorage.unbindIdentityRegistry(randomUser.address)
        ).to.be.revertedWith("identity registry is not stored");
      });

    it("should revert if unbinding zero address", async function () {
      await expect(
        identityRegistryStorage.unbindIdentityRegistry(ethers.constants.AddressZero)
      ).to.be.revertedWith("invalid argument - zero address");
    });

    it("should revert if non-agent tries to add identity", async function () {
      await expect(
        identityRegistryStorage.connect(randomUser).addIdentityToStorage(user1.address, user1Identity.address, 250)
      ).to.be.revertedWith("AgentRole: caller does not have the Agent role");
    });

    it("should revert if trying to remove an identity that was already removed", async function () {
      const country = 250;
      await identityRegistryStorage.addIdentityToStorage(user1.address, user1Identity.address, country);
      await identityRegistryStorage.removeIdentityFromStorage(user1.address);
      await expect(
        identityRegistryStorage.removeIdentityFromStorage(user1.address)
      ).to.be.revertedWith("address not stored yet");
    });  

  });

});