const fs = require('fs');
const iconv = require('iconv-lite');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const Readable = require('stream').Readable;

const fileTypes = {
  2: 'FoxBASE',
  3: 'FoxBASE+/Dbase III plus, no memo',
  48: 'Visual FoxPro',
  49: 'Visual FoxPro, autoincrement enabled',
  50: 'Visual FoxPro with field type Varchar or Varbinary',
  67: 'dBASE IV SQL table files, no memo',
  99: 'dBASE IV SQL system files, no memo',
  131: 'FoxBASE+/dBASE III PLUS, with memo',
  139: 'dBASE IV with memo',
  203: 'dBASE IV SQL table files, with memo',
  245: 'FoxPro 2.x (or earlier) with memo',
  229: 'HiPer-Six format with SMT memo file',
  251: 'FoxBASE',
};

const parseFileType = (buffer) => fileTypes[buffer.readUInt8(0, true)]
  ? fileTypes[buffer.readUInt8(0, true)]
  : 'uknown';

const parseDate = (buffer) => new Date(
  buffer.slice(0, 1).readUInt8(0, true) + 1900, // year
  buffer.slice(1, 2).readUInt8(0, true) - 1,  // month
  buffer.slice(2, 3).readUInt8(0, true) // date
);

// 12 – 27: Reserved
// 28: Table flags
// 29: Code page mark
// 30 - 31: Reserved, contains 0x00
const getHeader = (readStream) => {
  const buffer = readStream.read(32);
  return {
    type: parseFileType(buffer.slice(0, 1)),
    dateUpdated: parseDate(buffer.slice(1, 4)),
    numberOfRecords: buffer.slice(4, 8).readInt32LE(0, true),
    bytesOfHeader: buffer.slice(8, 10).readInt32LE(0, true),
    LengthPerRecord: buffer.slice(10, 12).readInt32LE(0, true),
  };
};

// 19 - 22	Value of autoincrement Next value
// 23	Value of autoincrement Step value
// 24 – 31	Reserved
const getField = (buffer) => (
  buffer.length < 32
    ? undefined
    : {
      name: buffer.slice(0, 11).toString('utf-8').replace(/[\u0000]+$/, ''),
      type: buffer.slice(11, 12).toString('utf-8'),
      displacement: buffer.slice(12, 16).readInt32LE(0, true),
      length: buffer.slice(16, 17).readInt32LE(0, true),
      decimalPlaces: buffer.slice(17, 18).readInt32LE(0, true),
      flag: buffer.slice(18, 19).readUInt8(0, true),
    }
);

const getListOfFields = (readStream, bytesOfHeader) => {
  const buffer = readStream.read(bytesOfHeader - 32);
  const ListOfFields = [];

  for (let i = 0, len = buffer.length; i < len; i += 32) {
    let field;
    if (field = getField(buffer.slice(i, i + 32))) {
      ListOfFields.push(field);
    }
  }
  return ListOfFields;
};

const dataTypes = {
  C(data) {
    return data;
  },
  N(data) {
    return +data;
  },
  L(data) {
    return data.toLowerCase() === 't';
  },
};

const parseDataByType = (data, type) => (
  dataTypes[type]
    ? dataTypes[type](data)
    : data  // default
);

const convertToObject = (data, ListOfFields, encoding, numOfRecord) => {
  const row = {
    '@numOfRecord': numOfRecord,
    '@deleted': data.slice(0, 1)[0] !== 32,
  };

  ListOfFields.reduce(function (acc, now) {
    const value = iconv
      .decode(data.slice(acc, acc + now.length), encoding)
      .replace(/^\s+|\s+$/g, '');
    row[now.name] = parseDataByType(value, now.type);
    return acc + now.length;
  }, 1);

  return row;
};

const dbfStream = (path, encoding = 'utf-8') => {
  const opt = { objectMode: true };
  util.inherits(Readable, EventEmitter);
  const stream = new Readable(opt);
  const readStream = fs.createReadStream(path);

  readStream._maxListeners = Infinity;
  //read file header first
  readStream.once('readable', () => {
    stream.header = getHeader(readStream);
  });

  //read Descriptor Array
  readStream.once('readable', () => {
    stream.header.listOfFields = getListOfFields(readStream, stream.header.bytesOfHeader);
    stream.emit('header', stream.header);
  });
  
  readStream.once('end', () => stream.push(null));
  
  let numOfRecord = 1;   //row number numOfRecord
  stream._read = () => {
    readStream.on('readable', function onData() {
      let chunk;
      while (null !== (chunk = readStream.read(stream.header.LengthPerRecord))) {
        stream.push(convertToObject(chunk, stream.header.listOfFields, encoding, numOfRecord++));
      }

      readStream.removeListener('readable', onData);
    });
  };

  return stream;
};

module.exports = dbfStream;
