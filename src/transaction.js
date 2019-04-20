"use strict"
var util = require("util")
var Event = require("events").EventEmitter
var utf8 = require("utf8")
var baselib = require("swtc-factory").Wallet
var utils = require("swtc-utils")
const axios = require("axios")

/**
 * Post request to server with account secret
 * @param remote
 * @constructor
 */
function Transaction(remote, filter) {
  Event.call(this)

  var self = this
  self._remote = remote
  self._token = remote._token || "swt"
  self.tx_json = { Flags: 0, Fee: utils.getFee(self._token) }
  self._filter =
    filter ||
    function(v) {
      return v
    }
  self._secret = void 0
}
util.inherits(Transaction, Event)

/*
 * static function build payment tx
 * @param options
 *    source|from|account source account, required
 *    destination|to destination account, required
 *    amount payment amount, required
 * @returns {Transaction}
 */
Transaction.buildPaymentTx = function(options, remote = {}) {
  const tx = new Transaction(remote)
  if (options === null || typeof options !== "object") {
    tx.tx_json.obj = new Error("invalid options type")
    return tx
  }
  const src = options.source || options.from || options.account
  const dst = options.destination || options.to
  const amount = options.amount
  if (!utils.isValidAddress(src)) {
    tx.tx_json.src = new Error("invalid source address")
    return tx
  }
  if (!utils.isValidAddress(dst)) {
    tx.tx_json.dst = new Error("invalid destination address")
    return tx
  }
  if (!utils.isValidAmount(amount)) {
    tx.tx_json.amount = new Error("invalid amount")
    return tx
  }

  tx.tx_json.TransactionType = "Payment"
  tx.tx_json.Account = src
  tx.tx_json.Amount = utils.ToAmount(amount)
  tx.tx_json.Destination = dst
  return tx
}

/**
 * offer create
 * @param options
 *    type: 'Sell' or 'Buy'
 *    source|from|account maker account, required
 *    taker_gets|pays amount to take out, required
 *    taker_pays|gets amount to take in, required
 * @returns {Transaction}
 */
Transaction.buildOfferCreateTx = function(options, remote = {}) {
  var tx = new Transaction(remote)
  if (options === null || typeof options !== "object") {
    tx.tx_json.obj = new Error("invalid options type")
    return tx
  }

  var offer_type = options.type
  var src = options.source || options.from || options.account
  var taker_gets = options.taker_gets || options.pays
  var taker_pays = options.taker_pays || options.gets
  var app = options.app

  if (!utils.isValidAddress(src)) {
    tx.tx_json.src = new Error("invalid source address")
    return tx
  }
  if (
    typeof offer_type !== "string" ||
    !~Transaction.OfferTypes.indexOf(offer_type)
  ) {
    tx.tx_json.offer_type = new Error("invalid offer type")
    return tx
  }
  if (typeof taker_gets === "string" && !Number(taker_gets)) {
    tx.tx_json.taker_gets2 = new Error("invalid to pays amount")
    return tx
  }
  if (typeof taker_gets === "object" && !utils.isValidAmount(taker_gets)) {
    tx.tx_json.taker_gets2 = new Error("invalid to pays amount object")
    return tx
  }
  if (typeof taker_pays === "string" && !Number(taker_pays)) {
    tx.tx_json.taker_pays2 = new Error("invalid to gets amount")
    return tx
  }
  if (typeof taker_pays === "object" && !utils.isValidAmount(taker_pays)) {
    tx.tx_json.taker_pays2 = new Error("invalid to gets amount object")
    return tx
  }
  if (app && !/^[0-9]*[1-9][0-9]*$/.test(app)) {
    // 正整数
    tx.tx_json.app = new Error("invalid app, it is a positive integer.")
    return tx
  }

  tx.tx_json.TransactionType = "OfferCreate"
  if (offer_type === "Sell") tx.setFlags(offer_type)
  if (app) tx.tx_json.AppType = app
  tx.tx_json.Account = src
  tx.tx_json.TakerPays = utils.ToAmount(taker_pays, this._token)
  tx.tx_json.TakerGets = utils.ToAmount(taker_gets, this._token)

  return tx
}

/**
 * offer cancel
 * @param options
 *    source|from|account source account, required
 *    sequence, required
 * @returns {Transaction}
 */
Transaction.buildOfferCancelTx = function(options, remote = {}) {
  var tx = new Transaction(remote)
  if (options === null || typeof options !== "object") {
    tx.tx_json.obj = new Error("invalid options type")
    return tx
  }

  var src = options.source || options.from || options.account
  var sequence = options.sequence

  if (!utils.isValidAddress(src)) {
    tx.tx_json.src = new Error("invalid source address")
    return tx
  }
  if (!Number(sequence)) {
    tx.tx_json.sequence = new Error("invalid sequence param")
    return tx
  }

  tx.tx_json.TransactionType = "OfferCancel"
  tx.tx_json.Account = src
  tx.tx_json.OfferSequence = Number(sequence)

  return tx
}

Transaction.set_clear_flags = {
  AccountSet: {
    asfRequireDest: 1,
    asfRequireAuth: 2,
    asfDisallowSWT: 3,
    asfDisableMaster: 4,
    asfNoFreeze: 6,
    asfGlobalFreeze: 7
  }
}

Transaction.flags = {
  // Universal flags can apply to any transaction type
  Universal: {
    FullyCanonicalSig: 0x80000000
  },

  AccountSet: {
    RequireDestTag: 0x00010000,
    OptionalDestTag: 0x00020000,
    RequireAuth: 0x00040000,
    OptionalAuth: 0x00080000,
    DisallowSWT: 0x00100000,
    AllowSWT: 0x00200000
  },

  TrustSet: {
    SetAuth: 0x00010000,
    NoSkywell: 0x00020000,
    SetNoSkywell: 0x00020000,
    ClearNoSkywell: 0x00040000,
    SetFreeze: 0x00100000,
    ClearFreeze: 0x00200000
  },

  OfferCreate: {
    Passive: 0x00010000,
    ImmediateOrCancel: 0x00020000,
    FillOrKill: 0x00040000,
    Sell: 0x00080000
  },

  Payment: {
    NoSkywellDirect: 0x00010000,
    PartialPayment: 0x00020000,
    LimitQuality: 0x00040000
  },

  RelationSet: {
    Authorize: 0x00000001,
    Freeze: 0x00000011
  }
}

Transaction.OfferTypes = ["Sell", "Buy"]
Transaction.RelationTypes = ["trust", "authorize", "freeze", "unfreeze"]
Transaction.AccountSetTypes = ["property", "delegate", "signer"]

/**
 * parse json transaction as tx_json
 * @param val
 * @returns {Transaction}
 */
Transaction.prototype.parseJson = function(val) {
  this.tx_json = val
  return this
}

/**
 * get transaction account
 * @returns {Transaction.tx_json.Account}
 */
Transaction.prototype.getAccount = function() {
  return this.tx_json.Account
}

/**
 * get transaction type
 * @returns {exports.result.TransactionType|*|string}
 */
Transaction.prototype.getTransactionType = function() {
  return this.tx_json.TransactionType
}

/**
 * set secret
 * @param secret
 */
Transaction.prototype.setSecret = function(secret) {
  if (!baselib.isValidSecret(secret)) {
    this.tx_json._secret = new Error("invalid secret")
    return
  }
  this._secret = secret
}

function __hexToString(h) {
  var a = []
  var i = 0

  if (h.length % 2) {
    a.push(String.fromCharCode(parseInt(h.substring(0, 1), 16)))
    i = 1
  }

  for (; i < h.length; i += 2) {
    a.push(String.fromCharCode(parseInt(h.substring(i, i + 2), 16)))
  }

  return a.join("")
}

function __stringToHex(s) {
  var result = ""
  for (var i = 0; i < s.length; i++) {
    var b = s.charCodeAt(i)
    result += b < 16 ? "0" + b.toString(16) : b.toString(16)
  }
  return result
}

/**
 * just only memo data
 * @param memo
 */
Transaction.prototype.addMemo = function(memo) {
  if (typeof memo !== "string") {
    this.tx_json.memo_type = new TypeError("invalid memo type")
    return this
  }
  if (memo.length > 2048) {
    this.tx_json.memo_len = new TypeError("memo is too long")
    return this
  }
  var _memo = {}
  _memo.MemoData = __stringToHex(utf8.encode(memo))
  this.tx_json.Memos = (this.tx_json.Memos || []).concat({ Memo: _memo })
}

Transaction.prototype.setFee = function(fee) {
  var _fee = parseInt(fee)
  if (isNaN(_fee)) {
    this.tx_json.Fee = new TypeError("invalid fee")
    return this
  }
  if (fee < 10) {
    this.tx_json.Fee = new TypeError("fee is too low")
    return this
  }
  this.tx_json.Fee = _fee
}

/**
 * set source tag
 * source tag is a 32 bit integer or undefined
 * @param tag
 */
/*
Transaction.prototype.setSourceTag = function(tag) {
    if (typeof tag !== Number || !isFinite(tag)) {
        throw new Error('invalid tag type');
    }
    this.tx_json.SourceTag = tag;
};

Transaction.prototype.setDestinationTag = function(tag) {
    if (typeof tag !== Number || !isFinite(tag)) {
        throw new Error('invalid tag type');
    }
    this.tx_json.DestinationTag = tag;
};
*/

function MaxAmount(amount) {
  if (typeof amount === "string" && Number(amount)) {
    var _amount = parseInt(Number(amount) * 1.0001)
    return String(_amount)
  }
  if (typeof amount === "object" && utils.isValidAmount(amount)) {
    var _value = Number(amount.value) * 1.0001
    amount.value = String(_value)
    return amount
  }
  return new Error("invalid amount to max")
}

/**
 * set a path to payment
 * this path is repesented as a key, which is computed in path find
 * so if one path you computed self is not allowed
 * when path set, sendmax is also set.
 * @param path
 */
Transaction.prototype.setPath = function(key) {
  // sha1 string
  if (typeof key !== "string" || key.length !== 40) {
    return new Error("invalid path key")
  }
  var item = this._remote._paths.get(key)
  if (!item) {
    return new Error("non exists path key")
  }
  if (item.path === "[]") {
    // 沒有支付路径，不需要传下面的参数
    return
  }
  var path = JSON.parse(item.path)
  this.tx_json.Paths = path
  var amount = MaxAmount(item.choice)
  this.tx_json.SendMax = amount
}

/**
 * limit send max amount
 * @param amount
 */
Transaction.prototype.setSendMax = function(amount) {
  if (!utils.isValidAmount(amount)) {
    return new Error("invalid send max amount")
  }
  this.tx_json.SendMax = amount
}

/**
 * transfer rate
 * between 0 and 1, type is number
 * @param rate
 */
Transaction.prototype.setTransferRate = function(rate) {
  if (typeof rate !== "number" || rate < 0 || rate > 1) {
    return new Error("invalid transfer rate")
  }
  this.tx_json.TransferRate = (rate + 1) * 1e9
}

/**
 * set transaction flags
 *
 */
Transaction.prototype.setFlags = function(flags) {
  if (flags === void 0) return

  if (typeof flags === "number") {
    this.tx_json.Flags = flags
    return
  }
  var transaction_flags = Transaction.flags[this.getTransactionType()] || {}
  var flag_set = Array.isArray(flags) ? flags : [].concat(flags)
  for (var i = 0; i < flag_set.length; ++i) {
    var flag = flag_set[i]
    if (transaction_flags.hasOwnProperty(flag)) {
      this.tx_json.Flags += transaction_flags[flag]
    }
  }
}

/* set sequence */
Transaction.prototype.setSequence = function(sequence) {
  if (!/^\+?[1-9][0-9]*$/.test(sequence)) {
    //正整数
    this.tx_json.Sequence = new TypeError("invalid sequence")
    return this
  }

  this.tx_json.Sequence = Number(sequence)
}

function signing(self, callback) {
  var jser = require("swtc-serializer").Serializer
  self.tx_json.Fee = self.tx_json.Fee / 1000000

  //payment
  if (
    self.tx_json.Amount &&
    JSON.stringify(self.tx_json.Amount).indexOf("{") < 0
  ) {
    //基础货币
    self.tx_json.Amount = Number(self.tx_json.Amount) / 1000000
  }
  if (self.tx_json.Memos) {
    var memos = self.tx_json.Memos
    for (var i = 0; i < memos.length; i++) {
      memos[i].Memo.MemoData = utf8.decode(
        __hexToString(memos[i].Memo.MemoData)
      )
    }
  }
  if (self.tx_json.SendMax && typeof self.tx_json.SendMax === "string") {
    self.tx_json.SendMax = Number(self.tx_json.SendMax) / 1000000
  }

  //order
  if (
    self.tx_json.TakerPays &&
    JSON.stringify(self.tx_json.TakerPays).indexOf("{") < 0
  ) {
    //基础货币
    self.tx_json.TakerPays = Number(self.tx_json.TakerPays) / 1000000
  }
  if (
    self.tx_json.TakerGets &&
    JSON.stringify(self.tx_json.TakerGets).indexOf("{") < 0
  ) {
    //基础货币
    self.tx_json.TakerGets = Number(self.tx_json.TakerGets) / 1000000
  }
  try {
    var wt = new baselib(self._secret)
    self.tx_json.SigningPubKey = wt.getPublicKey()
    var prefix = 0x53545800
    var hash = jser.from_json(self.tx_json).hash(prefix)
    self.tx_json.TxnSignature = wt.signTx(hash)
    self.tx_json.blob = jser.from_json(self.tx_json).to_hex()
    self._local_sign = true
    callback(null, self.tx_json.blob)
  } catch (e) {
    callback(e)
  }
}

Transaction.prototype.sign = function(callback) {
  var self = this
  if (self.tx_json.Sequence) {
    signing(self, callback)
    // callback(null, signing(self));
  } else if ("requestAccountInfo" in this._remote) {
    var req = this._remote.requestAccountInfo({
      account: self.tx_json.Account,
      type: "trust"
    })
    req.submit(function(err, data) {
      if (err) return callback(err)
      self.tx_json.Sequence = data.account_data.Sequence
      signing(self, callback)
      // callback(null, signing(self));
    })
  } else if ("getAccountBalances" in this._remote) {
    this._remote
      .getAccountBalances(self.tx_json.Account)
      .then(data => {
        self.tx_json.Sequence = data.sequence
        signing(self, callback)
      })
      .catch(error => {
        throw error
      })
  } else if ("_axios" in this._remote) {
    this._remote._axios
      .get(`accounts/${self.tx_json.Account}/balances`)
      .then(response => {
        self.tx_json.Sequence = response.data.sequence
        signing(self, callback)
      })
      .catch(error => {
        throw error
      })
  } else {
    // use api.jingtum.com to get sequence
    axios
      .get(
        `https://api.jingtum.com/v2/accounts/${self.tx_json.Account}/balances`
      )
      .then(response => {
        self.tx_json.Sequence = response.data.sequence
        signing(self, callback)
      })
      .catch(error => {
        throw error
      })
  }
}

/**
 * submit request to server
 * @param callback
 */
Transaction.prototype.submit = function(callback) {
  var self = this
  for (var key in self.tx_json) {
    if (self.tx_json[key] instanceof Error) {
      return callback(self.tx_json[key].message)
    }
  }

  var data = {}
  if (self.tx_json.TransactionType === "Signer") {
    //直接将blob传给底层
    data = {
      tx_blob: self.tx_json.blob
    }
    self._remote._submit("submit", data, self._filter, callback)
  } else if (self._remote._local_sign) {
    //签名之后传给底层
    self.sign(function(err, blob) {
      if (err) {
        return callback("sign error: " + err)
      } else {
        var data = {
          tx_blob: self.tx_json.blob
        }
        self._remote._submit("submit", data, self._filter, callback)
      }
    })
  } else {
    //不签名交易传给底层
    data = {
      secret: self._secret,
      tx_json: self.tx_json
    }
    self._remote._submit("submit", data, self._filter, callback)
  }
}

Transaction.prototype.submitApi = function() {
  var self = this
  for (var key in self.tx_json) {
    if (self.tx_json[key] instanceof Error) {
      return Promise.reject(self.tx_json[key].message)
    }
  }

  var data = {}
  if ("blob" in self.tx_json) {
    data = {
      blob: self.tx_json.blob
    }
    if ("postBlob" in self._remote) {
      // api remote
      return self._remote.postBlob(data)
    } else if ("_axios" in self._remote) {
      // api remote
      return self._remote._axios.post(`blob`, data)
    } else {
      // use api.jingtum.com directly
      return axios.post(`https://api.jingtum.com/v2/blob`, data)
    }
  } else {
    return Promise.reject("please local sign before this submit")
  }
}

module.exports = Transaction
