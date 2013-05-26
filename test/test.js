
"use strict"

var should = require('should')
var streamConvert = require('quiver-stream-convert')
var extractAsciiStreamHead = require('../lib/stream-head-extractor').extractAsciiStreamHead


var assertBuffersSeparatedCorrectly = function(buffers, separator, callback) {
  var readStream = streamConvert.buffersToStream(buffers)

  extractAsciiStreamHead({ separator: separator }, readStream,
    function(err, streamHead, restStream) {
      if(err) throw err

      streamHead.should.equal('hello world')
      streamConvert.streamToBuffers(restStream, function(err, buffers) {
        if(err) throw err

        buffers.length.should.equal(2)
        buffers[0].should.equal('after ')
        buffers[1].should.equal('separator')

        callback()
      })
    })
}

describe('stream head extractor test', function() {
  it('ideal separated buffers', function(callback) {
    var testBuffers = [
      'hello ',
      'world',
      '::',
      'after ',
      'separator'
    ]

    assertBuffersSeparatedCorrectly(testBuffers, '::', callback)
  })

  it('separator in the middle of buffer', function(callback) {
    var testBuffers = [
      'hello ',
      'world::after ',
      'separator'
    ]

    assertBuffersSeparatedCorrectly(testBuffers, '::', callback)
  })

  it('separator separated in two buffers', function(callback) {
    var testBuffers = [
      'hello ',
      'world:',
      ':after ',
      'separator'
    ]

    assertBuffersSeparatedCorrectly(testBuffers, '::', callback)
  })

  it('separator separated in three buffers', function(callback) {
    var testBuffers = [
      'hello ',
      'world:',
      '::',
      ':after ',
      'separator'
    ]

    assertBuffersSeparatedCorrectly(testBuffers, '::::', callback)
  })
})