# @folder/readdir

> Recursively read a directory, blazing fast.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save @folder/readdir
```

## Usage

```js
const readdir = require('@folder/readdir');

// async usage
console.log(await readdir('.'));

// sync usage
console.log(readdir.sync('.'));
```

## Options

* [absolute](#absolute)
* [base](#base)
* [basename](#basename)
* [cwd](#cwd)
* [depth](#depth)
* [dot](#dot)
* [filter](#filter)
* [follow](#follow)
* [format](#format)
* [ignore](#ignore)
* [nodir](#nodir)
* [objects](#objects)
* [onDirectory](#ondirectory)
* [onEach](#oneach)
* [onFile](#onfile)
* [onPush](#onpush)
* [onSymbolicLink](#onsymboliclink)
* [realpath](#realpath)
* [recursive](#recursive)
* [relative](#relative)
* [symlinks](#symlinks)
* [unique](#unique)

### absolute

When true, absolute paths are returned. Otherwise, returned paths are relative to [options.base](#base) if defined, or the given directory.

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
console.log(await readdir('some/dir', { absolute: true }));
```

### base

The base directory from which relative paths should be created.

**Type**: `string`

**Default**: Defaults to the directory passed as the first argument.

**Example**

```js
const files = await readdir('some/dir', { base: 'dir' });
console.log(files);
```

### basename

When true, only the basename of each file is returned.

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
console.log(await readdir('some/dir', { basename: true }));
```

### depth

The maximum folder depth to recursively read directories.

**Type**: `number`

**Default**: `undefined`

**Example**

```js
const files = await readdir('some/dir', { depth: 2 });
console.log(files);
```

### dot

Include dotfiles in the result.

**Type**: `boolean`

**Default**: `false`

**Example**

```js
const files = await readdir('.');
console.log(files);
//=> ['LICENSE', 'README.md', 'package.json']

const files = await readdir('.', { dot: true });
console.log(files);
//=> ['.DS_Store', '.git', 'LICENSE', 'README.md', 'package.json']
```

### filter

**Type**: `function|string|array|regexp`

**Default**: `undefined`

**Example**

```js
// only return file paths with "foo" somewhere in the path
console.log(await readdir('some/dir', { filter: /foo/ }));

// only return file paths without "foo" somewhere in the path
console.log(await readdir('some/dir', { filter: file => !/foo/.test(file.path) }));
```

### follow

Follow symbolic links.

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
console.log(await readdir('some/dir', { follow: true }));
```

### format

Function to be called before a file or directory is pushed in the result array. Unlike [onEach](#oneach), this function is only called on returned files. This allows you to modify the result first, avoiding the need to recurse over the array again after it's returned.

**Type**: `function`

**Default**: `undefined`

```js
console.log(await readdir('some/dir', { format: true }));
```

### ignore

**Type**: `function|string|array|regexp`

**Default**: `undefined`

**Example**

```js
// ignore all files with "foo" in the path
console.log(await readdir('some/dir', { ignore: /foo/ }));
```

### nodir

When `true` directories are excluded from the result.

**Type**: `boolean`

**Default**: `undefined`

### objects

Return [fs.Dirent](https://nodejs.org/api/fs.html#fs_class_fs_dirent) objects instead of paths.

**Type**: `boolean`

**Default**: `undefined`

```js
console.log(await readdir('some/dir', { objects: true }));
```

### onDirectory

Function to be called on all directories.

**Type**: `function`

**Default**: `undefined`

**Example**

```js
const onDirectory = file => {
  if (file.name === 'node_modules') {
    file.recurse = false;
  }
};
console.log(await readdir('some/dir', { onDirectory }));
```

### onEach

Function to be called on all directories and files.

**Type**: `function`

**Default**: `undefined`

**Example**

```js
const onEach = file => {
  if (file.name === 'node_modules') {
    file.recurse = false;
  }
  if (file.isFile() && file.name[0] === '.') {
    file.keep = true;
  }
};
console.log(await readdir('some/dir', { onEach }));
```

### onFile

Function to be called on all files.

**Type**: `function`

**Default**: `undefined`

**Example**

```js
const onFile = file => {
  if (file.isFile() && file.name[0] === '.') {
    file.keep = true;
  }
};
console.log(await readdir('some/dir', { onFile }));
```

### onSymbolicLink

Function to be called on all symbolic links.

**Type**: `function`

**Default**: `undefined`

**Example**

```js
const onSymbolicLink = file => {
  // do stuff
};
console.log(await readdir('some/dir', { onSymbolicLink }));
```

### realpath

When true, the realpath of the file is returned in the result. This can be used in combination with other options, like `basename` or `relative`.

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
console.log(await readdir('some/dir', { realpath: true }));
```

### recursive

**Type**: `function`

**Type**: `string`

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
const files = await readdir('some/dir', { recursive: true });
console.log(files);
```

### symlinks

Returns the first directory level of symbolic links. Use [options.follow](#follow) to recursively follow symlinks.

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
console.log(await readdir('some/dir', { symlinks: true }));
```

### unique

Return only unique file paths. Only needed when [options.realpath](#realpath) is `true`.

**Type**: `boolean`

**Default**: `undefined`

**Example**

```js
console.log(await readdir('some/dir', { unique: true }));
```

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2019, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on July 02, 2019._