import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import "@nomicfoundation/hardhat-chai-matchers"
import { 
  Verifier,
  Verifier__factory,
  Identity,
  Identity__factory,
  ClaimIssuer,
  ClaimIssuer__factory
} from "../typechain";

describe("Verifier Contract Testing", function () {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let trustedIssuer1: SignerWithAddress;
  let trustedIssuer2: SignerWithAddress;
  
  let verifier: Verifier;
  let identity: Identity;
  let claimIssuer1: ClaimIssuer;
  let claimIssuer2: ClaimIssuer;

  beforeEach(async function () {
    [owner, user, trustedIssuer1, trustedIssuer2] = await ethers.getSigners();

    // Deploy contracts
    verifier = await new Verifier__factory(owner).deploy();
    identity = await new Identity__factory(owner).deploy(user.address, true);
    claimIssuer1 = await new ClaimIssuer__factory(trustedIssuer1).deploy(owner.address);
    claimIssuer2 = await new ClaimIssuer__factory(trustedIssuer2).deploy(owner.address);
  });

  describe("Claim Topics Management", function () {
    describe("addClaimTopic", function () {
      it("should add a claim topic successfully", async function () {
        await expect(verifier.addClaimTopic(1))
          .to.emit(verifier, "ClaimTopicAdded")
          .withArgs(1);
          
        expect(await verifier.isClaimTopicRequired(1)).to.be.true;
      });

      it("should revert when adding duplicate claim topic", async function () {
        await verifier.addClaimTopic(1);
        await expect(verifier.addClaimTopic(1))
          .to.be.revertedWith("claimTopic already exists");
      });

      it("should revert when adding more than 15 topics", async function () {
        for (let i = 1; i <= 15; i++) {
          await verifier.addClaimTopic(i);
        }
        await expect(verifier.addClaimTopic(16))
          .to.be.revertedWith("cannot require more than 15 topics");
      });

      it("should revert when non-owner tries to add topic", async function () {
        await expect(verifier.connect(user).addClaimTopic(1))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("removeClaimTopic", function () {
      beforeEach(async function () {
        await verifier.addClaimTopic(1);
      });

      it("should remove a claim topic successfully", async function () {
        await expect(verifier.removeClaimTopic(1))
          .to.emit(verifier, "ClaimTopicRemoved")
          .withArgs(1);
          
        expect(await verifier.isClaimTopicRequired(1)).to.be.false;
      });

      it("should handle removing non-existent topic", async function () {
        await verifier.removeClaimTopic(2); // Should not revert
      });

      it("should revert when non-owner tries to remove topic", async function () {
        await expect(verifier.connect(user).removeClaimTopic(1))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("Trusted Issuers Management", function () {
    describe("addTrustedIssuer", function () {
      it("should add trusted issuer successfully", async function () {
        const claimTopics = [1, 2, 3];
        await expect(verifier.addTrustedIssuer(claimIssuer1.address, claimTopics))
          .to.emit(verifier, "TrustedIssuerAdded")
          .withArgs(claimIssuer1.address, claimTopics);
          
        expect(await verifier.isTrustedIssuer(claimIssuer1.address)).to.be.true;
      });

      it("should revert when adding zero address", async function () {
        await expect(verifier.addTrustedIssuer(ethers.constants.AddressZero, [1]))
          .to.be.revertedWith("invalid argument - zero address");
      });

      it("should revert when adding duplicate issuer", async function () {
        await verifier.addTrustedIssuer(claimIssuer1.address, [1]);
        await expect(verifier.addTrustedIssuer(claimIssuer1.address, [1]))
          .to.be.revertedWith("trusted Issuer already exists");
      });

      it("should revert when adding with empty claim topics", async function () {
        await expect(verifier.addTrustedIssuer(claimIssuer1.address, []))
          .to.be.revertedWith("trusted claim topics cannot be empty");
      });

      it("should revert when adding more than 15 claim topics", async function () {
        const topics = Array.from({length: 16}, (_, i) => i + 1);
        await expect(verifier.addTrustedIssuer(claimIssuer1.address, topics))
          .to.be.revertedWith("cannot have more than 15 claim topics");
      });

    
    });

    describe("removeTrustedIssuer", function () {
      beforeEach(async function () {
        await verifier.addTrustedIssuer(claimIssuer1.address, [1, 2]);
      });

      it("should remove trusted issuer successfully", async function () {
        await expect(verifier.removeTrustedIssuer(claimIssuer1.address))
          .to.emit(verifier, "TrustedIssuerRemoved")
          .withArgs(claimIssuer1.address);
          
        expect(await verifier.isTrustedIssuer(claimIssuer1.address)).to.be.false;
      });

      it("should revert when removing non-existent issuer", async function () {
        await expect(verifier.removeTrustedIssuer(claimIssuer2.address))
          .to.be.revertedWith("NOT a trusted issuer");
      });

      it("should revert when removing zero address", async function () {
        await expect(verifier.removeTrustedIssuer(ethers.constants.AddressZero))
          .to.be.revertedWith("invalid argument - zero address");
      });
    });

    describe("updateIssuerClaimTopics", function () {
      beforeEach(async function () {
        await verifier.addTrustedIssuer(claimIssuer1.address, [1, 2]);
      });

      it("should update claim topics successfully", async function () {
        const newTopics = [3, 4];
        await expect(verifier.updateIssuerClaimTopics(claimIssuer1.address, newTopics))
          .to.emit(verifier, "ClaimTopicsUpdated")
          .withArgs(claimIssuer1.address, newTopics);
          
        expect(await verifier.getTrustedIssuerClaimTopics(claimIssuer1.address))
          .to.deep.equal(newTopics);
      });

      it("should revert when updating non-existent issuer", async function () {
        await expect(verifier.updateIssuerClaimTopics(claimIssuer2.address, [1]))
          .to.be.revertedWith("NOT a trusted issuer");
      });

      it("should revert when updating with empty topics", async function () {
        await expect(verifier.updateIssuerClaimTopics(claimIssuer1.address, []))
          .to.be.revertedWith("claim topics cannot be empty");
      });

      it("should revert when updating with more than 15 topics", async function () {
        const topics = Array.from({length: 16}, (_, i) => i + 1);
        await expect(verifier.updateIssuerClaimTopics(claimIssuer1.address, topics))
          .to.be.revertedWith("cannot have more than 15 claim topics");
      });
    });
  });

  describe("Verification", function () {
    describe("verify", function () {
      beforeEach(async function () {
        await verifier.addClaimTopic(1);
        await verifier.addTrustedIssuer(claimIssuer1.address, [1]);
      });

      it("should return true when no claim topics required", async function () {
        const newVerifier = await new Verifier__factory(owner).deploy();
        expect(await newVerifier.verify(identity.address)).to.be.true;
      });

      it("should return false when no trusted issuers for claim topic", async function () {
        const newVerifier = await new Verifier__factory(owner).deploy();
        await newVerifier.addClaimTopic(2);
        expect(await newVerifier.verify(identity.address)).to.be.false;
      });
     
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await verifier.addTrustedIssuer(claimIssuer1.address, [1, 2]);
    });

    it("should get all trusted issuers", async function () {
      const issuers = await verifier.getTrustedIssuers();
      expect(issuers).to.include(claimIssuer1.address);
    });

    it("should get trusted issuers for claim topic", async function () {
      const issuers = await verifier.getTrustedIssuersForClaimTopic(1);
      expect(issuers).to.include(claimIssuer1.address);
    });

    it("should check if issuer has claim topic", async function () {
      expect(await verifier.hasClaimTopic(claimIssuer1.address, 1)).to.be.true;
      expect(await verifier.hasClaimTopic(claimIssuer1.address, 3)).to.be.false;
    });
  });
});
