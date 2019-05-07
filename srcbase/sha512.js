"use strict"

var hashjs = require("hash.js")
var BN = require("bn.js")

function Sha512() {
  this.hash = hashjs.sha512()
}

Sha512.prototype.add = function(bytes) {
  this.hash.update(bytes)
  return this
}

Sha512.prototype.addU32 = function(i) {
  return this.add([
    (i >>> 24) & 0xff,
    (i >>> 16) & 0xff,
    (i >>> 8) & 0xff,
    i & 0xff
  ])
}

Sha512.prototype.finish = function() {
  return this.hash.digest()
}

Sha512.prototype.first256 = function() {
  return this.finish().slice(0, 32)
}

Sha512.prototype.first256BN = function() {
  return new BN(this.first256())
}

module.exports = Sha512
