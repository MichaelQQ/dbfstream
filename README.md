[![Build Status](https://travis-ci.org/MichaelQQ/dbfstream.svg)](https://travis-ci.org/MichaelQQ/dbfstream) [![Build status](https://ci.appveyor.com/api/projects/status/pxu5c6xyhinjc6d3?svg=true)](https://ci.appveyor.com/project/MichaelQQ/dbfstream)
[![npm version](https://badge.fury.io/js/dbfstream.svg)](https://badge.fury.io/js/dbfstream)
[![NPM Downloads](https://img.shields.io/npm/dt/dbfstream.svg)](https://www.npmjs.com/package/dbfstream)

DBFStream
===
This is a stream base .dbf Parser
Based on https://github.com/tamtakoe/node-dbf

# Usage

### creat dbf stream:

@source: dbf file path / readable stream
`const dbf = dbfstream(source, encoding);`

```js
const dbfstream = require('dbfstream');

var dbf = dbfstream('./test.dbf', 'utf-8');
```

### get dbf file header:

```js
dbf.on('header', header => {
  console.log(header);
});
```

### get dbf file data:

```js
dbf.on('readable', () => {
  console.log(stream.read());
});

//or flowing mode
dbf.on('data', (data) => {
    console.log(data);
});
```

### get dbf file error

```js
dbf.on('error', (err) => {
  console.log(err);
});
```

* Due to how the parser is written, currently the only condition that emits an error is insufficient bytes in the header.  

### dbf file stream end:

```js
dbf.on('end', () => {
    console.log('stream end');
});
```
