import { expect } from "chai";
import { ethers } from "hardhat";

describe("ELTX contracts", () => {
  it("allows treasury to mint and pause", async () => {
    const [treasury, alice] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ELTXToken");
    const token = await Token.deploy(treasury.address);
    await token.deployed();

    expect(await token.balanceOf(treasury.address)).to.equal(ethers.parseEther("1000000000"));

    await expect(token.connect(alice).mint(alice.address, 1)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(token.connect(treasury).mint(alice.address, ethers.parseEther("10"))).to.emit(token, "Transfer");

    await token.connect(treasury).pause();
    await expect(token.connect(alice).transfer(treasury.address, 1)).to.be.revertedWithCustomError(token, "EnforcedPause");
    await token.connect(treasury).unpause();
    await expect(token.connect(alice).transfer(treasury.address, 1)).to.emit(token, "Transfer");
  });

  it("wraps and unwraps ELTX", async () => {
    const [user] = await ethers.getSigners();
    const WELTX = await ethers.getContractFactory("WELTX");
    const weltx = await WELTX.deploy();
    await weltx.deployed();

    await expect(() =>
      weltx.connect(user).deposit({ value: ethers.parseEther("1") })
    ).to.changeEtherBalances([user, weltx], [-ethers.parseEther("1"), ethers.parseEther("1")]);

    await expect(() =>
      weltx.connect(user).withdraw(ethers.parseEther("0.4"))
    ).to.changeEtherBalances([user, weltx], [ethers.parseEther("0.4"), -ethers.parseEther("0.4")]);
  });

  it("performs a swap through Uniswap router", async () => {
    const [treasury, trader] = await ethers.getSigners();
    const ELTX = await ethers.getContractFactory("ELTXToken");
    const USDTE = await ethers.getContractFactory("USDTE");
    const WELTX = await ethers.getContractFactory("WELTX");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const Router = await ethers.getContractFactory("UniswapV2Router02");

    const eltx = await ELTX.deploy(treasury.address);
    await eltx.deployed();
    const usdte = await USDTE.deploy(treasury.address);
    await usdte.deployed();
    const weltx = await WELTX.deploy();
    await weltx.deployed();
    const factory = await Factory.deploy(treasury.address);
    await factory.deployed();
    const router = await Router.deploy(factory.address, weltx.address);
    await router.deployed();

    await usdte.connect(treasury).mint(treasury.address, ethers.parseUnits("50000", 6));
    await eltx.connect(treasury).approve(router.address, ethers.parseEther("1000000"));
    await usdte.connect(treasury).approve(router.address, ethers.parseUnits("50000", 6));

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    await router
      .connect(treasury)
      .addLiquidity(
        eltx.address,
        usdte.address,
        ethers.parseEther("100000"),
        ethers.parseUnits("30000", 6),
        0,
        0,
        treasury.address,
        deadline
      );

    await eltx.transfer(trader.address, ethers.parseEther("100"));
    await eltx.connect(trader).approve(router.address, ethers.parseEther("100"));

    const amountsOut = await router.getAmountsOut(ethers.parseEther("10"), [eltx.address, usdte.address]);
    const minAmountOut = (amountsOut[1] * 95n) / 100n;
    await router
      .connect(trader)
      .swapExactTokensForTokens(
        ethers.parseEther("10"),
        minAmountOut,
        [eltx.address, usdte.address],
        trader.address,
        deadline
      );

    const usdteBalance = await usdte.balanceOf(trader.address);
    expect(usdteBalance).to.be.gt(0);
  });
});
