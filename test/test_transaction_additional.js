const chai = require("chai")
const expect = chai.expect
const Remote = require("./remote").Remote
const TX = require("../").Transaction
const config = require("./config")
const DATA = require("./config_data")
const sinon = require("sinon")
const utils = require("swtc-utils")
const axios = require("axios")
let { JT_NODE } = config
let pair = "SWT:JJCC/jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or"

describe("test transaction additions", function() {
  describe("test build payment transaction", function() {
    this.timeout(15000)
    let tx = TX.buildPaymentTx({
      source: DATA.address,
      to: DATA.address2,
      amount: { value: 0.1, currency: "SWT", issuer: "" }
    })
    it("if did not provide remote", function() {
      expect(tx._remote).to.deep.equal({})
    })
    it("remote using tapi", function() {
      let tx = TX.buildPaymentTx(
        {
          source: DATA.address,
          to: DATA.address2,
          amount: { value: 0.1, currency: "SWT", issuer: "" }
        },
        { _axios: axios.create({ baseURL: `${DATA.server}/v2/` }) }
      )
      expect(tx._remote).to.be.an("object")
    })
    it("has _token", function() {
      expect(tx._token).to.equal("swt")
    })
    it("has tx_json.Fee", function() {
      expect(tx.tx_json.Fee).to.equal(utils.getFee(tx._token))
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
      let tx = TX.buildPaymentTx(
        {
          source: DATA.address,
          to: DATA.address2,
          amount: { value: 0.1, currency: "SWT", issuer: "" }
        },
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
    it("sign and submit", async function() {
      let result = await tx.submitApi()
      // console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
  describe("test build offer create transaction", function() {
    this.timeout(15000)
    let tx = TX.buildOfferCreateTx({
      type: "Buy",
      account: DATA.address,
      taker_gets: { value: 1, currency: "SWT", issuer: "" },
      taker_pays: { value: 0.007, currency: "CNY", issuer: DATA.issuer }
    })
    it("if did not provide remote", function() {
      expect(tx._remote).to.deep.equal({})
    })
    it("remote using tapi", function() {
      let tx = TX.buildOfferCreateTx(
        {
          type: "Buy",
          account: DATA.address,
          taker_gets: { value: 1, currency: "SWT", issuer: "" },
          taker_pays: { value: 0.007, currency: "CNY", issuer: DATA.issuer }
        },
        { _axios: axios.create({ baseURL: `${DATA.server}/v2/` }) }
      )
      expect(tx._remote).to.be.an("object")
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
      let tx = TX.buildOfferCreateTx(
        {
          type: "Buy",
          account: DATA.address,
          taker_gets: { value: 1, currency: "SWT", issuer: "" },
          taker_pays: { value: 0.007, currency: "CNY", issuer: DATA.issuer }
        },
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
      let result = await tx.submitApi()
      // console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
  describe("test build offer cancel transaction", function() {
    this.timeout(15000)
    let tx = TX.buildOfferCancelTx({ account: DATA.address, sequence: 100 })
    it("if did not provide remote", function() {
      expect(tx._remote).to.deep.equal({})
    })
    it("remote using tapi", function() {
      let tx = TX.buildOfferCreateTx(
        { account: DATA.address, sequence: 100 },
        { _axios: axios.create({ baseURL: `${DATA.server}/v2/` }) }
      )
      expect(tx._remote).to.be.an("object")
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
      let tx = TX.buildOfferCreateTx(
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
      let result = await tx.submitApi()
      // console.log(result.data)
      expect(result).to.be.an("object")
    })
  })
})
