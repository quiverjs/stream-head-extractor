
var pushbackStream = require('quiver-stream-pushback').pushbackStream

var extractStreamHeadWithSeparator = function(options, readStream, callback) {
  var separator = options.separator
  var maxHeadLength = options.maxHeadLength

  var headBuffer = ''

  var doPipe = function() {
    readStream.read(function(streamClosed, buffer) {
      if(streamClosed) return callback(error(400, 'Bad Request'))
      if(buffer.length == 0) return doPipe()

      var previousBufferSize = headBuffer.length
      headBuffer += buffer.toString('ascii')

      var separatorIndex = headBuffer.indexOf(separator)
      if(separatorIndex != -1) {
        var headContent = headBuffer.slice(0, separatorIndex)

        var restIndex = separatorIndex - previousBufferSize + separator.length
        
        if(restIndex != buffer.length) {
          var restBuffer = buffer.slice(restIndex)
          readStream = pushbackStream(readStream, [restBuffer])
        }

        return callback(null, headContent, readStream)
      }

      if(maxHeadLength && headBuffer.length > maxHeadLength) {
        return callback(error(431, 'Request Header Fields Too Large'))
      }

      doPipe()
    })
  }
  doPipe()
}

var extractFixedSizeHead = function(headSize, readStream, callback) {
  readStream.read(function(streamClosed, data) {
    if(streamClosed) return callback(error(400, 'stream ended prematurely'))
    if(!(data instanceof Buffer)) data = new Buffer(data)
    
    var bufferSize = data.length
    if(bufferSize == 0) return extractFixedSizeHead(headSize, readStream, callback)

    if(bufferSize >= headSize) {
      if(bufferSize > headSize) {
        var restSize = bufferSize - headSize
        var restBuffer = data.slice(headSize)
        readStream = pushbackStream(readStream, [restBuffer])
        data = data.slice(0, headSize)
        bufferSize = headSize
      }

      callback(null, data, readStream)
    } else {
      var restHeadSize = headSize - bufferSize
      extractFixedSizeHead(restHeadSize, readStream, function(err, restHeadBuffer, readStream) {
        if(err) return callback(err)

        var headBuffer = Buffer.concat([data, restHeadBuffer])
        callback(null, headBuffer, readStream)
      })
    }
  })
}

module.exports = {
  extractFixedSizeHead: extractFixedSizeHead,
  extractStreamHeadWithSeparator: extractStreamHeadWithSeparator
}