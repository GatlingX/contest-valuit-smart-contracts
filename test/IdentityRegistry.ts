import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { 
  IdentityRegistry, 
  IdentityRegistry__factory,
  ClaimTopicsRegistry,
  ClaimTopicsRegistry__factory,
  TREXImplementationAuthority,
  TREXImplementationAuthority__factory,
  TrustedIssuersRegistry,
  TrustedIssuersRegistry__factory,
  IdentityRegistryStorage,
  IdentityRegistryStorage__factory,
  Identity,
  Identity__factory,
 
} from "../typechain";

describe("Identity Registry Testing", function () {
  let owner: SignerWithAddress;
  let agent: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user1Identity: Identity;
  let user2Identity: Identity;
  let trexImplementationAuthority: TREXImplementationAuthority;
  let claimTopicsRegistryContract: ClaimTopicsRegistry;
  // Contract instances
  let identityRegistry: IdentityRegistry;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let identityRegistryStorage: IdentityRegistryStorage;
  let identityImplementation: Identity;

  beforeEach(async function () {
    // Get signers
    [owner, agent, user1, user2] = await ethers.getSigners();

    // Deploy dependencies
    identityImplementation = await new Identity__factory(owner).deploy(
      owner.address,
      true
    );

    claimTopicsRegistry = await new ClaimTopicsRegistry__factory(owner).deploy();
    trustedIssuersRegistry = await new TrustedIssuersRegistry__factory(owner).deploy();
    identityRegistryStorage = await new IdentityRegistryStorage__factory(owner).deploy();

    // Deploy IdentityRegistry
    identityRegistry = await new IdentityRegistry__factory(owner).deploy();
    trexImplementationAuthority = await new TREXImplementationAuthority__factory(owner).deploy(
      true,
      owner.address,
      owner.address
    );

    await identityRegistryStorage.init();
    await claimTopicsRegistry.init();

    await identityRegistry.init(
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address
    );
   

     // Add agent and bind identity registry
     await identityRegistry.addAgent(owner.address);
     await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address);
 
     // Create identities for users
     user1Identity = await new Identity__factory(owner).deploy(
       user1.address,
       true
     );
     user2Identity = await new Identity__factory(owner).deploy(
       user2.address,
       true
     );

     // Prepare contracts struct for Implementation Authority
    const contractsStruct = {
      ctrImplementation: claimTopicsRegistry.address,
      tokenImplementation:  identityRegistry.address,
      irImplementation:  identityRegistry.address,
      irsImplementation:   identityRegistryStorage.address,
      tirImplementation:  trustedIssuersRegistry.address,
      mcImplementation:  trustedIssuersRegistry.address,
    };

    const versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
     await trexImplementationAuthority
     .connect(owner)
     .addAndUseTREXVersion(versionStruct, contractsStruct);   
  });

  describe("Initialization", function () {
    it("Should set the correct registries during initialization", async function () {
      expect(await identityRegistry.topicsRegistry()).to.equal(claimTopicsRegistry.address);
      expect(await identityRegistry.issuersRegistry()).to.equal(trustedIssuersRegistry.address);
      expect(await identityRegistry.identityStorage()).to.equal(identityRegistryStorage.address);
    });

    it("Should revert initialization with zero addresses", async function () {
      const newIdentityRegistry = await new IdentityRegistry__factory(owner).deploy();
      
      await expect(
        newIdentityRegistry.init(
          ethers.constants.AddressZero,
          claimTopicsRegistry.address,
          identityRegistryStorage.address
        )
      ).to.be.revertedWith("invalid argument - zero address");

      await expect(
        newIdentityRegistry.init(
          trustedIssuersRegistry.address,
          ethers.constants.AddressZero,
          identityRegistryStorage.address
        )
      ).to.be.revertedWith("invalid argument - zero address");

      await expect(
        newIdentityRegistry.init(
          trustedIssuersRegistry.address,
          claimTopicsRegistry.address,
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith("invalid argument - zero address");
    });
  });

  describe("Identity Registration", function () {
    
    const countryCode = 840; // US country code

   
    it("Should allow registering an identity", async function () {

      
        // Register identity
       await identityRegistry.registerIdentity(
        user1.address, 
        user1Identity.address, 
        countryCode
      );

      // Check identity is registered
      expect(await identityRegistry.contains(user1.address)).to.be.true;
      expect(await identityRegistry.identity(user1.address)).to.equal(user1Identity.address);
      expect(await identityRegistry.investorCountry(user1.address)).to.equal(countryCode);
    });

    it("Should allow batch registration of identities", async function () {
      
      // Batch register identities
      await identityRegistry.batchRegisterIdentity(
        [user1.address, user2.address],
        [user1Identity.address, user2Identity.address],
        [countryCode, 124] 
      );

      // Verify registrations
      expect(await identityRegistry.contains(user1.address)).to.be.true;
      expect(await identityRegistry.contains(user2.address)).to.be.true;
    });

    it("Should revert registering identity if called by non-agent", async function () {
      await expect(
        identityRegistry.connect(user1).registerIdentity(
          user1.address, 
          user1Identity.address, 
          countryCode
        )
      ).to.be.revertedWith("AgentRole: caller does not have the Agent role");
    });
  });

  describe("Identity Management", function () {
   
    const initialCountryCode = 840; // US country code

    beforeEach(async function () {
      
      await identityRegistry.registerIdentity(
        user1.address, 
        user1Identity.address, 
        initialCountryCode
      );
    });

    it("Should allow updating identity", async function () {
      // Create a new identity
      const newIdentity = await new Identity__factory(owner).deploy(
        user1.address,
        true
      );

      // Update identity
      await identityRegistry.updateIdentity(user1.address, newIdentity.address);

      // Verify updated identity
      expect(await identityRegistry.identity(user1.address)).to.equal(newIdentity.address);
    });

    it("Should allow updating country", async function () {
      const newCountryCode = 124; // Canada

      // Update country
      await identityRegistry.updateCountry(user1.address, newCountryCode);

      // Verify updated country
      expect(await identityRegistry.investorCountry(user1.address)).to.equal(newCountryCode);
    });
    it("Should revert updating identity if called by non-agent", async function () {
      const newIdentity = await new Identity__factory(owner).deploy(
        user1.address,
        true
      );

      await expect(
        identityRegistry.connect(user1).updateIdentity(user1.address, newIdentity.address)
      ).to.be.revertedWith("AgentRole: caller does not have the Agent role");
    });

  });

  describe("Identity Deletion", function () {
    const countryCode = 840; 
    beforeEach(async function () {
      
      // Register initial identity
      await identityRegistry.registerIdentity(
        user1.address, 
        user1Identity.address, 
        countryCode
      );
    });

    it("Should allow deleting identity", async function () {
      // Delete identity
      await identityRegistry.deleteIdentity(user1.address);

      // Check identity is deleted
      expect(await identityRegistry.contains(user1.address)).to.be.false;
      
    });

    it("Should revert deleting identity if called by non-agent", async function () {
      await expect(
        identityRegistry.connect(user1).deleteIdentity(user1.address)
      ).to.be.revertedWith("AgentRole: caller does not have the Agent role");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to set Identity Registry Storage", async function () {
      const newIdentityRegistryStorage = await new IdentityRegistryStorage__factory(owner).deploy();
      await newIdentityRegistryStorage.init();

      await identityRegistry.setIdentityRegistryStorage(newIdentityRegistryStorage.address);

      expect(await identityRegistry.identityStorage()).to.equal(newIdentityRegistryStorage.address);
    });

    it("Should allow owner to set Claim Topics Registry", async function () {
      const newClaimTopicsRegistry = await new ClaimTopicsRegistry__factory(owner).deploy();

      await identityRegistry.setClaimTopicsRegistry(newClaimTopicsRegistry.address);

      expect(await identityRegistry.topicsRegistry()).to.equal(newClaimTopicsRegistry.address);
    });

    it("Should allow owner to set Trusted Issuers Registry", async function () {
      const newTrustedIssuersRegistry = await new TrustedIssuersRegistry__factory(owner).deploy();

      await identityRegistry.setTrustedIssuersRegistry(newTrustedIssuersRegistry.address);

      expect(await identityRegistry.issuersRegistry()).to.equal(newTrustedIssuersRegistry.address);
    });

    it("Should revert registry configuration if called by non-owner", async function () {
      const newIdentityRegistryStorage = await new IdentityRegistryStorage__factory(owner).deploy();
      await newIdentityRegistryStorage.init();

      await expect(
        identityRegistry.connect(user1).setIdentityRegistryStorage(newIdentityRegistryStorage.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        identityRegistry.connect(user1).setClaimTopicsRegistry(claimTopicsRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        identityRegistry.connect(user1).setTrustedIssuersRegistry(trustedIssuersRegistry.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Verification", function () {
    let userIdentity: Identity;

    beforeEach(async function () {
      // Create an identity for the user
      userIdentity = await new Identity__factory(owner).deploy(
        user1.address,
        true
      );

      // Register initial identity
      await identityRegistry.registerIdentity(
        user1.address, 
        userIdentity.address, 
        840 // US country code
      );
    });

    it("Should return false for unverified identity when claim topics exist", async function () {
       const claimTopic = 1;

    // Add claim topic to the ClaimTopicsRegistry
    await claimTopicsRegistry.connect(owner).addClaimTopic(claimTopic);

    // Debug: Check if the claim topic was added correctly
    const claimTopics = await claimTopicsRegistry.getClaimTopics();
    expect(claimTopics.length).to.equal(1);
    expect(claimTopics[0]).to.equal(claimTopic);

    // Debug: Verify the user identity is correctly stored in the Identity Registry
    const userIdentity = await identityRegistry.identity(user1.address);
    expect(userIdentity).to.not.equal(ethers.constants.AddressZero);

    // Verify that the user is not verified because no claims are linked to the user
    const isVerified = await identityRegistry.connect(owner).isVerified(user1.address);
    expect(isVerified).to.be.false;
    });

    it("Should return true when no claim topics are required", async function () {
      // Verify should return true when no claim topics exist
      expect(await identityRegistry.isVerified(user1.address)).to.be.true;
    });
  });
});