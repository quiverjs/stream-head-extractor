
"use strict"

var should = require('should')
var streamConvert = require('quiver-stream-convert')
var headExtractor = require('../lib/stream-head-extractor')


var assertBuffersSeparatedCorrectly = function(buffers, separator, callback) {
  var readStream = streamConvert.buffersToStream(buffers)

  headExtractor.extractStreamHeadWithSeparator({ separator: separator }, readStream,
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

describe('fixed head extractor test', function() {
  it('trivial fixed head', function(callback) {
    var testBuffers = [
      '1234',
      'hello ',
      'world'
    ]

    var readStream = streamConvert.buffersToStream(testBuffers)
    headExtractor.extractFixedSizeHead(4, readStream, function(err, head, readStream) {
      if(err) throw err

      head.toString().should.equal('1234')
      streamConvert.streamToText(readStream, function(err, text) {
        if(err) throw err

        text.should.equal('hello world')
        callback()
      })
    })
  })

  it('multiple fixed head', function(callback) {
    var testBuffers = [
      '12',
      '3',
      '4hello ',
      'world'
    ]

    var readStream = streamConvert.buffersToStream(testBuffers)
    headExtractor.extractFixedSizeHead(4, readStream, function(err, head, readStream) {
      if(err) throw err

      head.toString().should.equal('1234')
      streamConvert.streamToText(readStream, function(err, text) {
        if(err) throw err

        text.should.equal('hello world')
        callback()
      })
    })
  })

  it('unicode fixed head', function(callback) {
    var testHead = '世界你好'
    var testHeadBuffer = new Buffer(testHead)

    var testBuffers = [
      testHeadBuffer.slice(0, 5),
      testHeadBuffer.slice(5, 10),
      Buffer.concat([testHeadBuffer.slice(10, 12), new Buffer('hell')]),
      'o world'
    ]


    var readStream = streamConvert.buffersToStream(testBuffers)
    headExtractor.extractFixedSizeHead(12, readStream, function(err, head, readStream) {
      if(err) throw err

      head.toString().should.equal(testHead)
      streamConvert.streamToText(readStream, function(err, text) {
        if(err) throw err

        text.should.equal('hello world')
        callback()
      })
    })
  })
})

describe('stream head separator extractor test', function() {
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

  it('test beginning separate', function(callback) {
    var testBuffers = [
      '::',
      'hello ',
      'world'
    ]

    var readStream = streamConvert.buffersToStream(testBuffers)

    headExtractor.extractStreamHeadWithSeparator({ separator: '::' }, readStream,
      function(err, streamHead, restStream) {
        if(err) throw err

        streamHead.should.equal('')
        streamConvert.streamToText(restStream, function(err, text) {
          if(err) throw err

          text.should.equal('hello world')
          callback()
        })
      })
  })

  it('test beginning separate', function(callback) {
    var testBuffers = [
      ':',
      ':hello ',
      'world'
    ]

    var readStream = streamConvert.buffersToStream(testBuffers)

    headExtractor.extractStreamHeadWithSeparator({ separator: '::' }, readStream,
      function(err, streamHead, restStream) {
        if(err) throw err

        streamHead.should.equal('')
        streamConvert.streamToText(restStream, function(err, text) {
          if(err) throw err

          text.should.equal('hello world')
          callback()
        })
      })
  })
})