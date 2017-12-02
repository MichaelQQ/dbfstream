const dbfstream = require('../index');
const test = require('tape').test;
const deepFreeze = require('deep-freeze');
const fs = require('fs');

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
