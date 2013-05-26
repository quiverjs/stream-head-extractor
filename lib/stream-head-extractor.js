
var pushbackStream = require('quiver-stream-pushback').pushbackStream

var extractAsciiStreamHead = function(options, readStream, callback) {
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

module.exports = {
  extractAsciiStreamHead: extractAsciiStreamHead
}