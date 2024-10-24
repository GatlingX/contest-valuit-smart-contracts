import { expect, use } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
    ClaimIssuer,
    ClaimIssuer__factory,
    ClaimTopicsRegistry,
    ClaimTopicsRegistry__factory,
    CountryAllowModule,
    CountryAllowModule__factory,
    EquityConfig,
    EquityConfig__factory,
    Escrow,
    Escrow__factory,
    EscrowProxy,
    EscrowProxy__factory,
    FactoryProxy,
    FactoryProxy__factory,
    Fund,
    Fund__factory,
    FundFactory,
    FundFactory__factory,
    HoldTimeModule,
    HoldTimeModule__factory,
    Identity,
    Identity__factory,
    IdentityRegistry,
    IdentityRegistry__factory,
    IdentityRegistryStorage,
    IdentityRegistryStorage__factory,
    IdFactory,
    IdFactory__factory,
    ImplementationAuthority,
    ImplementationAuthority__factory,
    MaxBalanceModule,
    MaxBalanceModule__factory,
    ModularCompliance,
    ModularCompliance__factory,
    SupplyLimitModule,
    SupplyLimitModule__factory,
    Token,
    Token__factory,
    TREXFactory,
    TREXFactory__factory,
    TREXImplementationAuthority,
    TREXImplementationAuthority__factory,
    TrustedIssuersRegistry,
    TrustedIssuersRegistry__factory,
    USDC,
    USDC__factory,
    USDT,
    USDT__factory,
    VERC20,
    VERC20__factory,
    Wrapper,
    Wrapper__factory,
} from "../typechain";
import { sync } from "glob";
import { token } from "../typechain/contracts";

describe(" Tokenization Testing ", function () {
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let tokenIssuer: SignerWithAddress;
    let transferAgent: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;


    //Implementation
    let claimTopicsRegistryImplementation: ClaimTopicsRegistry;
    let trustedIssuersRegistryImplementation: TrustedIssuersRegistry;
    let identityRegistryStorageImplementation: IdentityRegistryStorage;
    let identityRegistryImplementation: IdentityRegistry;
    let modularComplianceImplementation: ModularCompliance;
    let tokenImplementation: Token;
    let trexFactory: TREXFactory;
    let trexImplementationAuthority: TREXImplementationAuthority;

    //Identity
    let identityImplementation: Identity;
    let identityImplementationAuthority: ImplementationAuthority;
    let identityFactory: IdFactory;

    //Compliance Modules
    let countryAllowCompliance: CountryAllowModule;
    let supplyLimitCompliance: SupplyLimitModule;
    let maxBalanceCompliance: MaxBalanceModule;
    let holdTimeCompliance: HoldTimeModule;

    //Fund Contract & EquityConfig Contract
    let fund: Fund;
    let fundFactory: FundFactory;
    let implFund: ImplementationAuthority;
    let fundProxy: FactoryProxy;
    let equityConfig: EquityConfig;
    let implEquityConfig: ImplementationAuthority;
    let claimIssuerImplementation: ClaimIssuer;

    //Wrapper Contarct
    let wrapper: Wrapper;
    let verc20: VERC20;

    // Escrow contract 
    let usdc: USDC;
    let usdt: USDT;
    let escrow: Escrow;
    let proxy: EscrowProxy;

    beforeEach(" ", async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        tokenIssuer = signers[1];
        transferAgent = signers[2];
        user1 = signers[4];
        user2 = signers[5];
        user3 = signers[20];


        //  let trustSigner =  provider.getSigner(trust.address)

        claimTopicsRegistryImplementation = await new ClaimTopicsRegistry__factory(
            owner
        ).deploy();

        trustedIssuersRegistryImplementation =
            await new TrustedIssuersRegistry__factory(owner).deploy();

        identityRegistryStorageImplementation =
            await new IdentityRegistryStorage__factory(owner).deploy();

        identityRegistryImplementation = await new IdentityRegistry__factory(
            owner
        ).deploy();

        modularComplianceImplementation = await new ModularCompliance__factory(
            owner
        ).deploy();

        tokenImplementation = await new Token__factory(owner).deploy();

        trexImplementationAuthority =
            await new TREXImplementationAuthority__factory(owner).deploy(
                true,
                ethers.constants.AddressZero,
                ethers.constants.AddressZero
            );

        // ONCHAIN IDENTITY
        identityImplementation = await new Identity__factory(owner).deploy(
            owner.address,
            true
        );

        identityImplementationAuthority =
            await new ImplementationAuthority__factory(owner).deploy(
                identityImplementation.address
            );

        identityFactory = await new IdFactory__factory(owner).deploy(
            identityImplementationAuthority.address
        );

        const contractsStruct = {
            tokenImplementation: tokenImplementation.address,
            ctrImplementation: claimTopicsRegistryImplementation.address,
            irImplementation: identityRegistryImplementation.address,
            irsImplementation: identityRegistryStorageImplementation.address,
            tirImplementation: trustedIssuersRegistryImplementation.address,
            mcImplementation: modularComplianceImplementation.address,
        };
        const versionStruct = {
            major: 4,
            minor: 0,
            patch: 0,
        };

        await trexImplementationAuthority
            .connect(owner)
            .addAndUseTREXVersion(versionStruct, contractsStruct);
        await trustedIssuersRegistryImplementation.init();

        //Compliance Modules

        countryAllowCompliance = await new CountryAllowModule__factory(
            owner
        ).deploy();

        supplyLimitCompliance = await new SupplyLimitModule__factory(
            owner
        ).deploy();

        maxBalanceCompliance = await new MaxBalanceModule__factory(owner).deploy();

        holdTimeCompliance = await new HoldTimeModule__factory(owner).deploy();

        //Fund Contract

        fund = await new Fund__factory(owner).deploy();
        equityConfig = await new EquityConfig__factory(owner).deploy();
        implFund = await new ImplementationAuthority__factory(owner).deploy(
            fund.address
        );
        implEquityConfig = await new ImplementationAuthority__factory(owner).deploy(
            equityConfig.address
        );
        fundFactory = await new FundFactory__factory(owner).deploy();
        fundProxy = await new FactoryProxy__factory(owner).deploy();

        //Wrapper
        verc20 = await new VERC20__factory(owner).deploy();
        wrapper = await new Wrapper__factory(owner).deploy(
            verc20.address
        );

        await fundProxy.upgradeTo(fundFactory.address);
        await claimTopicsRegistryImplementation.init();

        trexFactory = await new TREXFactory__factory(owner).deploy(
            trexImplementationAuthority.address,
            identityFactory.address,
            wrapper.address
        );
        await identityRegistryImplementation.init(
            trustedIssuersRegistryImplementation.address,
            claimTopicsRegistryImplementation.address,
            identityRegistryStorageImplementation.address
        );
        await identityRegistryImplementation.addAgent(owner.address);
        await identityRegistryImplementation.addAgent(
            identityRegistryImplementation.address
        );
        await identityRegistryStorageImplementation.init();
        await identityRegistryStorageImplementation.addAgent(
            identityRegistryImplementation.address
        );

        usdc = await new USDC__factory(owner).deploy();
        usdt = await new USDT__factory(owner).deploy();
       
        escrow = await new Escrow__factory(owner).deploy();
        proxy = await new EscrowProxy__factory(owner).deploy();
       
        await proxy.connect(owner).upgradeTo(escrow.address);
        escrow = await new Escrow__factory(owner).attach(proxy.address);
        await escrow.connect(owner).init([usdc.address, usdt.address], 10);

    });


    it("testing for rescueAnyERC20Tokens in Escrow", async () => {

        await escrow.connect(owner).rescueAnyERC20Tokens(usdc.address, owner.address, 10);
        await escrow.connect(owner).rescueAnyERC20Tokens(usdt.address, owner.address, 10);

        await expect(escrow.connect(user1).rescueAnyERC20Tokens(usdc.address, owner.address, 10)).to.be.rejectedWith('Ownable: caller is not the owner');
        await expect(escrow.connect(owner).rescueAnyERC20Tokens(tokenImplementation.address, owner.address, 10)).to.be.rejectedWith('Insufficient Balance');

    });

    it("testing for setAdminFee in Escrow", async () => {
        await escrow.connect(owner).setAdminFee(8);
        await expect(escrow.connect(user1).setAdminFee(8)).to.be.rejectedWith('Ownable: caller is not the owner');
    });

    it("testing for setAdminWallet in Escrow", async () => {
        await escrow.connect(owner).setAdminWallet(transferAgent.address);
        await expect(escrow.connect(user1).setAdminWallet(transferAgent.address)).to.be.rejectedWith('Ownable: caller is not the owner');
        await expect(escrow.connect(owner).setAdminWallet(ethers.constants.AddressZero)).to.be.rejectedWith('Zero Address');

    })

    it("testing for deposit in Escrow", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await tokenAttached?.connect(user1).mint(user1.address, 100);
        expect(await tokenAttached?.balanceOf(user1.address)).to.be.equal(100);

        await escrow.connect(user1).deposit(String(tokenAttached?.address), 10, "1", "tokenAttached");

        expect(await tokenAttached?.balanceOf(user1.address)).to.be.equal(100);

    })

    it("testing for (Zero Address not allowed) in deposit function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await tokenAttached?.connect(user1).mint(user1.address, 100);
        expect(await tokenAttached?.balanceOf(user1.address)).to.be.equal(100);

        await expect(escrow.connect(user1).deposit('0x0000000000000000000000000000000000000000', 10, "1", "tokenAttached")).to.be.rejectedWith('Zero Address not allowed')


    })

    it("testing for (Amount should be greater than 0) in deposit function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await tokenAttached?.connect(user1).mint(user1.address, 100);
        expect(await tokenAttached?.balanceOf(user1.address)).to.be.equal(100);

        await expect(escrow.connect(user1).deposit(String(tokenAttached?.address), 0, "1", "tokenAttached")).to.be.rejectedWith('Amount should be greater than 0')


    })

    it("testing for (Investor not whitelisted) in deposit function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        // await identityRegisteryAttached
        //     .connect(user1)
        //     .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.false;

        await expect(escrow.connect(user1).deposit(String(tokenAttached?.address), 10, "1", "tokenAttached")).to.be.rejectedWith('Investor not whitelisted');

    })

    it("testing for (Order Already Created) in deposit function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await escrow.connect(user1).deposit(String(tokenAttached?.address), 10, "1", "tokenAttached");
        await expect(escrow.connect(user1).deposit(String(tokenAttached?.address), 20, "1", "tokenAttached")).to.be.rejectedWith('Order Already Created');


    })

    it("testing for settlement function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await escrow.connect(user1).deposit(String(tokenAttached?.address), 10000000000000, "1", "tokenAttached");
        await escrow.connect(user1).settlement("1");

    });

    it("testing for (Invalid Issuer) in settlement function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await escrow.connect(user1).deposit(String(tokenAttached?.address), 1000, "1", "tokenAttached");
        await expect(escrow.connect(owner).settlement("1")).to.be.rejectedWith('Invalid Issuer');


    })

    it("testing for (Order Already Settled) in settlement function", async () => {
        let tokenDetails = {
            owner: owner.address,
            name: "Nickel",
            symbol: "NKL",
            decimals: 18,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            wrap: false,
            irAgents: [user1.address],
            tokenAgents: [user1.address],
            transferAgents: [],
            complianceModules: [
                countryAllowCompliance.address,
                supplyLimitCompliance.address,
                maxBalanceCompliance.address,
                holdTimeCompliance.address,
            ],
            complianceSettings: [
                "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
                "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
            ],
        };

        let claimDetails = {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
        };

        await identityFactory.addTokenFactory(trexFactory.address);

        const TX = await trexFactory.deployTREXSuite(
            "process.env.TOKEN_SALT",
            tokenDetails,
            claimDetails
        );

        const receipt = await TX.wait();

        const event = receipt.events?.find(
            (event) => event.event === "TREXSuiteDeployed"
        );

        let token = event?.args;

        let tokenAttached;
        let firstAddress;

        if (Array.isArray(token) && token.length > 0) {
            firstAddress = token[0]; // Directly accessing the first element
            tokenAttached = await tokenImplementation.attach(firstAddress);
        }

        expect(await tokenAttached?.name()).to.equal("Nickel");
        expect(await tokenAttached?.symbol()).to.equal("NKL");

        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
            String(identityRegistryAddress)
        );

        await identityRegisteryAttached
            .connect(user1)
            .registerIdentity(user1.address, String(user1Identity), 91);


        const userIsVerified = await identityRegisteryAttached.connect(owner).isVerified(user1.address);
        expect(userIsVerified).to.be.true;

        await escrow.connect(user1).deposit(String(tokenAttached?.address), 1000, "1", "tokenAttached");
        await escrow.connect(user1).settlement("1");
        await expect(escrow.connect(user1).settlement("1")).to.be.rejectedWith('Order Already Settled');


    })

    it("should return the correct stablecoin address for 'usdc'", async function () {
        const usdcAddress = await escrow.getStableCoin("usdc");
        expect(usdcAddress).to.equal(usdc.address);

    })
    it("should return the correct stablecoin address for 'usdt'", async function () {
        const usdtAddress = await escrow.getStableCoin("usdt");
        expect(usdtAddress).to.equal(usdt.address);
    });

    it("should return the correct stablecoin name for USDC address", async function () {
        const coinName = await escrow.getStableCoinName(usdc.address);
        expect(coinName).to.equal("usdc");
    });

    it("should return the correct stablecoin name for USDT address", async function () {
        const coinName = await escrow.getStableCoinName(usdt.address);
        expect(coinName).to.equal("usdt");
    });

})
