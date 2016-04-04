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
stream.on('readable', () => {
  console.log(stream.read());
});

//or flowing mode
stream.on('data', (data) => {
    console.log(data);
});
```

###dbf file stream end:

```js
stream.on('end', () => {
    console.log('stream end');
});
```
