const fs = require('fs');
const iconv = require('iconv-lite');
const Readable = require('stream').Readable;

const parseDate = function (buffer) {
  const year  = buffer.slice(0, 1).readInt32LE(0, true) + 1900;
  const month = buffer.slice(1, 2).readInt32LE(0, true) - 1;
  const day   = buffer.slice(2, 3).readInt32LE(0, true);
  return new Date(year, month, day);
};

const parseFeildHeader = function (buffer) {
  const header = {
    name: buffer.slice(0, 11).toString('utf-8').replace(/[\u0000]+$/, ''),
    type: buffer.slice(11, 12).toString('utf-8'),
    displacement: buffer.slice(12, 16).readInt32LE(0, true),
    length: buffer.slice(16, 17).readInt32LE(0, true),
    decimalPlaces: buffer.slice(17, 18).readInt32LE(0, true),
  };
  return header;
};

const readFileHeader = (readStream) => {
  const buffer = readStream.read(32);
  var fileInfo = {};

  fileInfo.type = buffer.slice(0, 1).toString('utf-8');
  fileInfo.dateUpdated = parseDate(buffer.slice(1, 4));
  fileInfo.numberOfRecords = buffer.slice(4, 8).readInt32LE(0, true);
  fileInfo.start = buffer.slice(8, 10).readInt32LE(0, true);
  fileInfo.recordLength = buffer.slice(10, 12).readInt32LE(0, true);

  return fileInfo;
};

const readDescriptorArray = (readStream, start, feilds) => {
  const buffer = readStream.read(start - 32);
  var feilds = [];

  for (var i = 0, len = buffer.length; i < len; i += 32) {
    feilds.push(parseFeildHeader(buffer.slice(i, i + 32)));
  }

  return feilds;
};

const parseDataByType = (data, type) => {
  const result = {
    C: data,
    N: +data,
    L: data.toLowerCase() === 't',
  };
  return result[type];
};

const convertToObject = (data, feilds, encoding) => {
  var row = {};

  row['@deleted'] = data.slice(0, 1)[0] !== 32;
  feilds.reduce((acc, now) => {
    var value = iconv.decode(data.slice(acc, acc + now.length), encoding).replace(/^\s+|\s+$/g, '');
    row[now.name] = parseDataByType(value, now.type);

    return acc + now.length;
  }, 1);

  return row;
};

const DBFStream = function (path, encoding) {
  var opt = {
    objectMode: true,
  };
  var stream = new Readable(opt);
  var readStream = fs.createReadStream(path);

  encoding = encoding || 'utf-8';
  readStream._maxListeners = Infinity;
  //read file header first
  readStream.once('readable', function onFileHeader() {
    stream.fileInfo = readFileHeader(readStream);
  });

  //read Descriptor Array
  readStream.once('readable', function onDescriptorArray() {
    stream.fileInfo.feilds = readDescriptorArray(readStream, stream.fileInfo.start);
  });

  stream._read = () => {
    readStream.on('readable', function onData() {
      var chunk;
      while (null !== (chunk = readStream.read(stream.fileInfo.recordLength))) {
        stream.push(convertToObject(chunk, stream.fileInfo.feilds, encoding));
      }

      readStream.removeListener('readable', onData);
    });

    readStream.on('end', function onEnd() {
      stream.push(null);
      readStream.removeListener('end', onEnd);
    });
  };

  return stream;
};

module.exports = DBFStream;
