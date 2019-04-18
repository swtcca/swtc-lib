/**
 * Created by Administrator on 2016/11/22.
 */
var util = require("util")
var Event = require("events").EventEmitter
var utils = require("swtc-utils")
const currency = utils.getCurrency()

/**
 * order book stub for all order book
 * key: currency/issuer:currency/issuer
 *  if swt, currency/issuer=SWT
 *  TODO keep every order book up state, and return state when needed
 *  not need to query jingtumd again
 * @param remote
 * @constructor
 */
function OrderBook(remote) {
  Event.call(this)

  var self = this
  self._remote = remote
  self._books = {}
  self._token = remote._token || "swt"

  self.on("newListener", function(key, listener) {
    if (key === "removeListener") return
    var pair = utils.parseKey(key)
    if (!pair) {
      self.pair = new Error("invalid key")
      return self
    }
    self._books[key] = listener
  })
  self.on("removeListener", function(key) {
    var pair = utils.parseKey(key)
    if (!pair) {
      self.pair = new Error("invalid key")
      return self
    }
    delete self._books[key]
  })
  // same implement as account stub, subscribe all and dispatch
  self._remote.on("transactions", self.__updateBooks.bind(self))
}

OrderBook.prototype.__updateBooks = function(data) {
  var self = this
  // dispatch
  if (data.meta) {
    var books = utils.affectedBooks(data)
    var _data = {
      tx: data.transaction,
      meta: data.meta,
      engine_result: data.engine_result,
      engine_result_code: data.engine_result_code,
      engine_result_message: data.engine_result_message,
      ledger_hash: data.ledger_hash,
      ledger_index: data.ledger_index,
      validated: data.validated
    }
    var _tx = utils.processTx(_data, data.transaction.Account)
    for (var i in books) {
      var callback = self._books[books[i]]
      if (callback) callback(_tx)
    }
  }
}

util.inherits(OrderBook, Event)

module.exports = OrderBook
