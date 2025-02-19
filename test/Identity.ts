import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Identity, Identity__factory } from "../typechain";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Identity Contract Testing", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let identity: Identity;
  let identityLib: Identity;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy library version
    identityLib = await new Identity__factory(owner).deploy(
      owner.address,
      true
    );

    // Deploy actual identity contract
    identity = await new Identity__factory(owner).deploy(
      owner.address,
      false
    );
  });

  describe("Constructor & Initialization", function () {
    it("Should set initial management key correctly during construction", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [owner.address]));
      const [purposes] = await identity.getKey(keyHash);
      expect(purposes[0].toNumber()).to.equal(1); // Convert BigNumber to number for comparison
    });

    it("Should prevent initialization with zero address", async function () {
      const newIdentity = await new Identity__factory(owner).deploy(
        owner.address,
        false
      );
      await expect(
        newIdentity.initialize(ethers.constants.AddressZero)
      ).to.be.rejectedWith("invalid argument - zero address");
    });

    it("Should prevent double initialization", async function () {
      await expect(
        identity.initialize(user1.address)
      ).to.be.rejectedWith("Initial key was already setup.");
    });

    it("Should prevent direct interaction with library contract", async function () {
      await expect(
        identityLib.execute(user1.address, 0, "0x")
      ).to.be.rejectedWith("Interacting with the library contract is forbidden.");
    });
  });

  describe("Key Management", function () {
    it("Should add new key with multiple purposes", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      
      await identity.addKey(keyHash, 2, 1);
      await identity.addKey(keyHash, 3, 1);
      
      const [purposes] = await identity.getKey(keyHash);
      const purposeNumbers = purposes.map(p => p.toNumber());
      expect(purposeNumbers).to.include(2);
      expect(purposeNumbers).to.include(3);
    });

    it("Should prevent adding duplicate purpose to existing key", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      
      await identity.addKey(keyHash, 2, 1);
      await expect(
        identity.addKey(keyHash, 2, 1)
      ).to.be.rejectedWith("Conflict: Key already has purpose");
    });

    it("Should prevent non-management keys from adding new keys", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      
      await identity.addKey(keyHash, 2, 1); // Add ACTION key
      await expect(
        identity.connect(user1).addKey(keyHash, 3, 1)
      ).to.be.rejectedWith("Permissions: Sender does not have management key");
    });

    it("Should remove key purpose correctly", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      
      await identity.addKey(keyHash, 2, 1);
      await identity.removeKey(keyHash, 2);
      
      const [purposes] = await identity.getKey(keyHash);
      const purposeNumbers = purposes.map(p => p.toNumber());
      expect(purposeNumbers).to.not.include(2);
    });

    it("Should fail when removing non-existent key", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await expect(
        identity.removeKey(keyHash, 2)
      ).to.be.rejectedWith("NonExisting: Key isn't registered");
    });

    it("Should fail when removing non-existent purpose", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await identity.addKey(keyHash, 2, 1);
      await expect(
        identity.removeKey(keyHash, 3)
      ).to.be.rejectedWith("NonExisting: Key doesn't have such purpose");
    });
  });

  describe("Execution Management", function () {
    it("Should execute transaction with management key immediately", async function () {
      const tx = await identity.execute(user2.address, 0, "0x");
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "Executed");
      expect(event).to.not.be.undefined;
    });

    it("Should execute transaction with action key for external calls", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await identity.addKey(keyHash, 2, 1); // Add ACTION key
      
      const tx = await identity.connect(user1).execute(user2.address, 0, "0x");
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "Executed");
      expect(event).to.not.be.undefined;
    });

    it("Should prevent action key from executing internal calls", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await identity.addKey(keyHash, 2, 1); // Add ACTION key
      
      const data = identity.interface.encodeFunctionData("addKey", [keyHash, 3, 1]);
      const tx = await identity.connect(user1).execute(identity.address, 0, data);
      const receipt = await tx.wait();
      expect(receipt.events?.some(e => e.event === "Executed")).to.be.false;
    });

  
  });

  describe("Claim Management", function () {
    let claimHash: string;
    const topic = 1;
    const scheme = 1;
    const signature = "0x";
    const data = "0x";
    const uri = "https://example.com";

    beforeEach(async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await identity.addKey(keyHash, 3, 1); // CLAIM key
      claimHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [identity.address, topic]));
    });

    it("Should add claim with valid claim signer", async function () {
      await identity.connect(user1).addClaim(topic, scheme, identity.address, signature, data, uri);
      const claim = await identity.getClaim(claimHash);
      expect(claim.topic.toNumber()).to.equal(topic);
    });

    it("Should prevent adding claim without claim signer key", async function () {
      await expect(
        identity.connect(user2).addClaim(topic, scheme, identity.address, signature, data, uri)
      ).to.be.rejectedWith("Permissions: Sender does not have claim signer key");
    });

    it("Should update existing claim", async function () {
      await identity.connect(user1).addClaim(topic, scheme, identity.address, signature, data, uri);
      const newData = "0x1234";
      await identity.connect(user1).addClaim(topic, scheme, identity.address, signature, newData, uri);
      const claim = await identity.getClaim(claimHash);
      expect(claim.data).to.equal(newData);
    });

    it("Should remove claim correctly", async function () {
      await identity.connect(user1).addClaim(topic, scheme, identity.address, signature, data, uri);
      await identity.connect(user1).removeClaim(claimHash);
      const claim = await identity.getClaim(claimHash);
      expect(claim.topic.toNumber()).to.equal(0);
    });

    it("Should fail removing non-existent claim", async function () {
      await expect(
        identity.connect(user1).removeClaim(claimHash)
      ).to.be.rejectedWith("NonExisting: There is no claim with this ID");
    });
  });

  describe("Key Query Functions", function () {
    it("Should return correct key purposes", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await identity.addKey(keyHash, 2, 1);
      await identity.addKey(keyHash, 3, 1);
      
      const purposes = await identity.getKeyPurposes(keyHash);
      const purposeNumbers = purposes.map(p => p.toNumber());
      expect(purposeNumbers).to.include(2);
      expect(purposeNumbers).to.include(3);
    });

    it("Should return correct keys by purpose", async function () {
      const keyHash1 = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      const keyHash2 = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user2.address]));
      
      await identity.addKey(keyHash1, 2, 1);
      await identity.addKey(keyHash2, 2, 1);
      
      const keys = await identity.getKeysByPurpose(2);
      expect(keys).to.include(keyHash1);
      expect(keys).to.include(keyHash2);
    });

    it("Should correctly check if key has purpose", async function () {
      const keyHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address"], [user1.address]));
      await identity.addKey(keyHash, 2, 1);
      
      expect(await identity.keyHasPurpose(keyHash, 2)).to.be.true;
      expect(await identity.keyHasPurpose(keyHash, 3)).to.be.false;
    });
  });

  
});