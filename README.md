[![npm version](https://badge.fury.io/js/dbfstream.svg)](https://badge.fury.io/js/dbfstream) [![NPM Downloads](https://img.shields.io/npm/dt/dbfstream.svg)](https://www.npmjs.com/package/dbfstream)

DBFStream
===
This is a stream base .dbf Parser
Based on https://github.com/tamtakoe/node-dbf

#Usage

###creat dbf stream:

`const dbf = dbfstream(dbf file path, encoding);`

```js
const dbfstream = require('dbfstream');

var dbf = dbfstream('./test.dbf', 'utf-8');
```

###get dbf file header:

```js
dbf.on('header', header => {
  console.log(header);
});
```

###get dbf file data:

```js
dbf.on('readable', () => {
  console.log(stream.read());
});

//or flowing mode
dbf.on('data', (data) => {
    console.log(data);
});
```

###dbf file stream end:

```js
dbf.on('end', () => {
    console.log('stream end');
});
```
