const chai = require("chai")
const expect = chai.expect
const Remote = require("../").Remote
const TX = require("swtc-transaction").Transaction
const config = require("./config")
const DATA = require("./config_data")
const sinon = require("sinon")
const utils = require("swtc-utils").utils
const axios = require("axios")
const sleep = time => new Promise(res => setTimeout(() => res(), time))
let { JT_NODE, TEST_NODE } = config
let pair = "SWT:JJCC/jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or"
const remote = new Remote({
  server: TEST_NODE,
  local_sign: true,
  issuer: config.issuer
})

describe("test transaction additions", function() {
  describe("test build payment transaction", function() {
    this.timeout(15000)
    let tx = remote.buildPaymentTx({
      source: DATA.address,
      to: DATA.address2,
      amount: remote.makeAmount(0.1),
      memo: "memo",
      secret: DATA.secret,
      sequence: "100"
    })
    it("has _token", function() {
      expect(tx._token.toLowerCase()).to.equal("swt")
    })
    it("has tx_json.Fee", function() {
      expect(tx.tx_json.Fee).to.equal(utils.getFee(tx._token))
    })
    it("setSecret", function() {
      tx.setSecret(DATA.secret)
      expect(tx._secret).to.equal(DATA.secret)
    })
    it("setSequence", function() {
      tx.setSequence(101)
      expect(tx.tx_json.Sequence).to.equal(101)
    })
    it("sign with sequence set", function() {
      let callback = (error, blob) => {
        if (error) {
          throw error
        } else {
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("sign without sequence set", function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: remote.makeAmount(0.1)
      })
      tx.setSecret(DATA.secret)
      let callback = (error, blob) => {
        if (error) {
          expect(error).to.equal("should not throw")
        } else {
          expect(tx.tx_json.Sequence).to.be.a("number")
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("sign and submit", async function() {
      await remote.connectPromise()
      let result = await tx.submitPromise()
      console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
  describe("test build offer create transaction", function() {
    this.timeout(15000)
    let tx = remote.buildOfferCreateTx({
      type: "Buy",
      account: DATA.address,
      taker_gets: remote.makeAmount(0.1),
      taker_pays: remote.makeAmount(0.007, "CNY")
    })
    it("setSecret", function() {
      tx.setSecret(DATA.secret)
      expect(tx._secret).to.equal(DATA.secret)
    })
    it("setSequence", function() {
      tx.setSequence(100)
      expect(tx.tx_json.Sequence).to.equal(100)
    })
    it("sign with sequence set", function() {
      let callback = (error, blob) => {
        if (error) {
          throw error
        } else {
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("sign without sequence set", function() {
      let tx = remote.buildOfferCreateTx({
        type: "Buy",
        account: DATA.address,
        taker_gets: { value: 1, currency: "SWT", issuer: "" },
        taker_pays: { value: 0.007, currency: "CNY", issuer: DATA.issuer }
      })
      tx.setSecret(DATA.secret)
      let callback = (error, blob) => {
        if (error) {
          expect(error).to.equal("should not throw")
        } else {
          expect(tx.tx_json.Sequence).to.be.a("number")
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("submit", async function() {
      let result = await tx.submitPromise()
      // console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
  describe("test build offer cancel transaction", function() {
    this.timeout(15000)
    let tx = remote.buildOfferCancelTx({ account: DATA.address, sequence: 100 })
    it("setSecret", function() {
      tx.setSecret(DATA.secret)
      expect(tx._secret).to.equal(DATA.secret)
    })
    it("setSequence", function() {
      tx.setSequence(100)
      expect(tx.tx_json.Sequence).to.equal(100)
    })
    it("sign with sequence set", function() {
      let callback = (error, blob) => {
        if (error) {
          expect(error).to.equal("should not throw")
        } else {
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("sign without sequence set", function() {
      let tx = remote.buildOfferCancelTx(
        { account: DATA.address, sequence: 100 },
        { _axios: axios.create({ baseURL: `${DATA.server}/v2/` }) }
      )
      tx.setSecret(DATA.secret)
      let callback = (error, blob) => {
        if (error) {
          expect(error).to.equal("should not throw")
        } else {
          expect(tx.tx_json.Sequence).to.be.a("number")
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("submit", async function() {
      let result = await tx.submitPromise()
      // console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
  describe("test relation transaction", function() {
    this.timeout(15000)
    let tx = remote.buildRelationTx({
      target: DATA.address2,
      account: DATA.address,
      type: "authorize",
      limit: { value: 11, currency: "CNY", issuer: DATA.issuer }
    })
    it("setSecret", function() {
      tx.setSecret(DATA.secret)
      expect(tx._secret).to.equal(DATA.secret)
    })
    it("setSequence", function() {
      tx.setSequence(100)
      expect(tx.tx_json.Sequence).to.equal(100)
    })
    it("sign with sequence set", function() {
      let callback = (error, blob) => {
        if (error) {
          expect(error).to.equal("should not throw")
        } else {
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("sign without sequence set", function() {
      let tx = remote.buildRelationTx({
        target: DATA.address2,
        account: DATA.address,
        type: "freeze",
        limit: { value: 11, currency: "CNY", issuer: DATA.issuer }
      })
      tx.setSecret(DATA.secret)
      let callback = (error, blob) => {
        if (error) {
          expect(error).to.equal("should not throw")
        } else {
          expect(tx.tx_json.Sequence).to.be.a("number")
          expect(tx.tx_json.blob).to.equal(blob)
        }
      }
      tx.sign(callback)
    })
    it("submit", async function() {
      let result = await tx.submitPromise()
      // console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
  describe("test .signPromise()", function() {
    this.timeout(15000)
    let tx = remote.buildPaymentTx({
      source: DATA.address,
      to: DATA.address2,
      amount: { value: 0.1, currency: "SWT", issuer: "" }
    })
    it("setSecret", function() {
      tx.setSecret(DATA.secret)
      expect(tx._secret).to.equal(DATA.secret)
    })
    it("setSequence", function() {
      tx.setSequence(100)
      expect(tx.tx_json.Sequence).to.equal(100)
    })
    it(".signPromise() with sequence set", async function() {
      let blob = await tx.signPromise()
      expect(tx.tx_json).to.have.property("blob")
      expect(tx.tx_json.blob).to.be.equal(blob)
    })
    it("signPromise() with secret and sequence param", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: { value: 0.1, currency: "SWT", issuer: "" }
      })
      let blob = await tx.signPromise(DATA.secret, "", 10)
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json.Sequence).to.be.equal(10)
      expect(tx.tx_json).to.have.property("blob")
      expect(tx.tx_json.blob).to.be.equal(blob)
    })
    it("signPromise() with secret param", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: { value: 0.1, currency: "SWT", issuer: "" }
      })
      let blob = await tx.signPromise(DATA.secret)
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json).to.have.property("blob")
      expect(tx.tx_json.blob).to.be.equal(blob)
    })
    it("signPromise() without sequence set", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: { value: 0.1, currency: "SWT", issuer: "" }
      })
      tx.setSecret(DATA.secret)
      let blob = await tx.signPromise()
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json).to.have.property("blob")
      expect(tx.tx_json.blob).to.be.equal(blob)
    })
  })
  describe("test .submitPromise()", function() {
    this.timeout(20000)
    it(".submitPromise()", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: remote.makeAmount(1.9999099)
      })
      tx.setSecret(DATA.secret)
      let result = await tx.submitPromise()
      await sleep(15000)
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json).to.have.property("blob")
      expect(result).to.have.property("engine_result")
      expect(result.engine_result).to.be.equal("tesSUCCESS")
      expect(result).to.have.property("tx_blob")
      expect(tx.tx_json.blob).to.be.equal(result.tx_blob)
    })
    it(".submitPromise() with secret param", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: { value: 0.99999099, currency: "SWT", issuer: "" }
      })
      let result = await tx.submitPromise(DATA.secret)
      await sleep(15000)
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json).to.have.property("blob")
      expect(result).to.have.property("engine_result")
      expect(result.engine_result).to.be.equal("tesSUCCESS")
      expect(result).to.have.property("tx_blob")
      expect(tx.tx_json.blob).to.be.equal(result.tx_blob)
    })
    it(".submitPromise() with secret and memo param", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: { value: 1.999999, currency: "SWT", issuer: "" }
      })
      let result = await tx.submitPromise(DATA.secret, "hello memo")
      await sleep(15000)
      expect(tx.tx_json).to.have.property("Memos")
      expect(tx.tx_json.Memos).to.be.a("array")
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json).to.have.property("blob")
      expect(result).to.have.property("engine_result")
      expect(result.engine_result).to.be.equal("tesSUCCESS")
      expect(result).to.have.property("tx_blob")
      expect(tx.tx_json.blob).to.be.equal(result.tx_blob)
    })
    it(".submitPromise() with secret and sequence param", async function() {
      let tx = remote.buildPaymentTx({
        source: DATA.address,
        to: DATA.address2,
        amount: { value: 0.99999999, currency: "SWT", issuer: "" }
      })
      let result = await tx.submitPromise(DATA.secret, "", 10)
      remote.disconnect()
      expect(tx.tx_json).to.have.property("Sequence")
      expect(tx.tx_json.Sequence).to.be.a("number")
      expect(tx.tx_json.Sequence).to.be.equal(10)
      expect(tx.tx_json).to.have.property("blob")
      expect(result).to.have.property("engine_result")
      expect(result.engine_result).to.be.equal("tefPAST_SEQ")
      expect(result).to.have.property("tx_blob")
      expect(tx.tx_json.blob).to.be.equal(result.tx_blob)
    })
  })
})
