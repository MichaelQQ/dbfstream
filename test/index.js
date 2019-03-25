const dbfstream = require('../index');
const test = require('tape').test;
const deepFreeze = require('deep-freeze');
const fs = require('fs');
const Duplex = require('stream').Duplex;

const testDbfstrea = t => {
  const dbf = dbfstream(__dirname + '/test.dbf', 'utf-8');
  const actualData = [];

  dbf.on('header', data => {
    const expectHeader = {
    type: 'FoxBASE+/Dbase III plus, no memo',
    dateUpdated: new Date(1916, 5, 25),
    numberOfRecords: 5,
    bytesOfHeader: 129,
    LengthPerRecord: 26,
    listOfFields:
     [
       {
         name: 'NAME',
         type: 'C',
         displacement: 0,
         length: 7,
         decimalPlaces: 0,
         flag: 0
       },
       {
         name: 'BIRTHDAY',
         type: 'D',
         displacement: 0,
         length: 8,
         decimalPlaces: 0,
         flag: 0
       },
       {
         name: 'CELL',
         type: 'C',
         displacement: 0,
         length: 10,
         decimalPlaces: 0,
         flag: 0
       }
     ]
   };
    const actual = data;

    deepFreeze(expectHeader);
    deepFreeze(actual);

    t.deepEqual(actual, expectHeader, 'must return the file info object');
  });
  dbf.on('data', data => {
    if (!data['@deleted']) {
      actualData.push(data);
    }
  });
  dbf.on('end', data => {
    const expectData = [
      { '@numOfRecord': 1,
        '@deleted': false,
        NAME: 'Peter',
        BIRTHDAY: '20160909',
        CELL: '0912345678' },
      { '@numOfRecord': 2,
        '@deleted': false,
        NAME: 'Mary',
        BIRTHDAY: '20160520',
        CELL: '0922345678' },
      { '@numOfRecord': 3,
        '@deleted': false,
        NAME: 'Michael',
        BIRTHDAY: '20160808',
        CELL: '0932345678' },
      { '@numOfRecord': 4,
        '@deleted': false,
        NAME: 'Curry',
        BIRTHDAY: '20161010',
        CELL: '0942345678' },
      { '@numOfRecord': 5,
        '@deleted': false,
        NAME: 'James',
        BIRTHDAY: '20161225',
        CELL: '0911111111' },
      ];

    deepFreeze(expectData);
    deepFreeze(actualData);

    t.deepEqual(actualData, expectData, 'must return all data objects');
    t.end();
  });
};
test('Test stream based dbf file reader', testDbfstrea);

test('injected stream should be considered a data source', t => {
  const readableStream = fs.createReadStream(__dirname + '/test.dbf');
  const dbf = dbfstream(readableStream, 'utf-8');

  const actualData = [];

  dbf.on('header', data => {
    const expectHeader = {
    type: 'FoxBASE+/Dbase III plus, no memo',
    dateUpdated: new Date(1916, 5, 25),
    numberOfRecords: 5,
    bytesOfHeader: 129,
    LengthPerRecord: 26,
    listOfFields:
     [
       {
         name: 'NAME',
         type: 'C',
         displacement: 0,
         length: 7,
         decimalPlaces: 0,
         flag: 0
       },
       {
         name: 'BIRTHDAY',
         type: 'D',
         displacement: 0,
         length: 8,
         decimalPlaces: 0,
         flag: 0
       },
       {
         name: 'CELL',
         type: 'C',
         displacement: 0,
         length: 10,
         decimalPlaces: 0,
         flag: 0
       }
     ]
   };
    const actual = data;

    deepFreeze(expectHeader);
    deepFreeze(actual);

    t.deepEqual(actual, expectHeader, 'must return the file info object');
  });
  dbf.on('data', data => {
    if (!data['@deleted']) {
      actualData.push(data);
    }
  });
  dbf.on('end', data => {
    const expectData = [
      { '@numOfRecord': 1,
        '@deleted': false,
        NAME: 'Peter',
        BIRTHDAY: '20160909',
        CELL: '0912345678' },
      { '@numOfRecord': 2,
        '@deleted': false,
        NAME: 'Mary',
        BIRTHDAY: '20160520',
        CELL: '0922345678' },
      { '@numOfRecord': 3,
        '@deleted': false,
        NAME: 'Michael',
        BIRTHDAY: '20160808',
        CELL: '0932345678' },
      { '@numOfRecord': 4,
        '@deleted': false,
        NAME: 'Curry',
        BIRTHDAY: '20161010',
        CELL: '0942345678' },
      { '@numOfRecord': 5,
        '@deleted': false,
        NAME: 'James',
        BIRTHDAY: '20161225',
        CELL: '0911111111' },
      ];

    deepFreeze(expectData);
    deepFreeze(actualData);

    t.deepEqual(actualData, expectData, 'must return all data objects');
    t.end();

  });

});

test('insufficient header bytes should emit error', t => {
  // use t.plan to show that the errors were actually emitted and handled
  t.plan(1);

  const readableStream = new Duplex();
  const dbf = dbfstream(readableStream, 'utf-8');

  dbf.on('error', err => {
    t.equals(err, `Unable to parse first 32 bytes from null header`);
  });
  dbf.on('header', actualHeader => {
    t.fail('no header should have been returned');
  });
  dbf.on('data', data => {
    t.fail('no record should have been found');
  });
  readableStream.push(null);
});

test('insufficient header bytes should emit error', t => {
  // use t.plan to show that the errors were actually emitted and handled
  t.plan(2);

  // min and max number of bytes for invalid header
  [1, 31].forEach(headerByteCount => {
    const buffer = Buffer.alloc(headerByteCount);

    const readableStream = new Duplex();
    readableStream.push(buffer);
    readableStream.push(null);

    const dbf = dbfstream(readableStream, 'utf-8');

    dbf.on('error', err => {
      t.equals(err, `Unable to parse first 32 bytes from header, found ${headerByteCount} byte(s)`);
    });
    dbf.on('header', actualHeader => {
      t.fail('no header should have been returned');
    });
    dbf.on('data', data => {
      t.fail('no record should have been found');
    });

  });

});

test('insufficient bytes available for a header field should leave undefined', t => {
  // use t.plan to show that the header was actually emitted and handled
  t.plan(1);

  // root header + 1 complete header field + 1 incomplete header field
  const buffer = Buffer.alloc(67);

  // write out file type
  buffer.writeUInt8(2, 0);
  // write out year/month/day
  buffer.writeUInt8(117, 1);
  buffer.writeUInt8(6, 2);
  buffer.writeUInt8(24, 3);
  // write out number of records
  buffer.writeUInt32LE(0, 4);
  // write out bytes of header
  buffer.writeUInt16LE(buffer.length, 8);
  // write out length per record
  buffer.writeUInt16LE(150, 10);

  // write out first header field
  // first field name
  buffer.write('field1', 32);
  // first field type
  buffer.write('C', 32+11);
  // first field length
  buffer.writeInt32LE(37, 32+16);

  // write out incomplete second header field
  // second field name
  buffer.write('fie', 64);
  // this field will be ignored since it contains fewer than 32 bytes

  const readableStream = new Duplex();
  readableStream.push(buffer);
  readableStream.push(null);

  const dbf = dbfstream(readableStream, 'utf-8');

  dbf.on('header', actualHeader => {
    const expectHeader = {
      type: 'FoxBASE',
      dateUpdated: new Date(2017, 5, 24),
      numberOfRecords: 0,
      bytesOfHeader: 67,
      LengthPerRecord: 150,
      listOfFields: [
        {
          name: 'field1',
          type: 'C',
          displacement: 0,
          length: 37,
          decimalPlaces: 0,
          flag: 0
        }
      ]
    };

    t.deepEqual(actualHeader, expectHeader, 'only 1 header should have been returned');

  });

  dbf.on('error', err => {
    t.fail('no error should have been emitted');
  });

  dbf.on('data', data => {
    t.fail('no record should have been found');
  });

})
