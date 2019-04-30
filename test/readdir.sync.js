'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const write = require('write');
const rimraf = require('rimraf');
const readdir = require('..');
const fixtures = (...args) => path.resolve(__dirname, 'fixtures', ...args);
let cleanup = () => {};

const options = { ignore: ['.DS_Store', 'Thumbs.db'] };

const unlinkSync = filepath => rimraf.sync(filepath);

const createFiles = names => {
  if (!names) return () => {};
  let files = names.map(name => fixtures(name));
  files.forEach(file => write.sync(file, 'temp'));
  return () => files.forEach(file => unlinkSync(file));
};

const deleteFixtures = () => {
  for (let file of fs.readdirSync(fixtures())) {
    unlinkSync(fixtures(file));
  }
};

const createSymlink = (type, linkname, files) => {
  let cleanup = files ? createFiles(files) : () => {};
  let dest = fixtures(linkname);
  let src = type === 'file' ? __filename : fixtures();
  fs.symlinkSync(src, dest, type);
  return () => {
    unlinkSync(dest);
    cleanup();
  };
};

const createSymlinks = (type, links, files) => {
  let cleanup = createFiles(files);
  let fns = links.map(link => createSymlink(type, link));
  return () => {
    fns.forEach(fn => fn());
    cleanup();
  };
};

describe('readdir.sync', () => {
  beforeEach(() => deleteFixtures());
  beforeEach(() => rimraf.sync(path.join(__dirname, 'symlinks')));
  after(() => rimraf.sync(path.join(__dirname, 'symlinks')));
  after(() => deleteFixtures());
  process.on('exit', () => deleteFixtures());

  describe('no options', () => {
    it('should read files in a directory and return a promise with files', () => {
      let files = readdir.sync(__dirname);
      assert(files.some(file => path.basename(file) === 'readdir.js'));
      assert(files.some(file => path.basename(file) === 'fixtures'));
    });

    it('should return an array of files', () => {
      let files = readdir.sync(__dirname);
      assert(files.some(file => file === 'readdir.js'));
      assert(files.some(file => file === 'readdir.sync.js'));
      assert(files.some(file => file === 'fixtures'));
    });

    it('should call options.onFile on each file', () => {
      let files = readdir.sync(__dirname, {
        objects: true,
        onFile(file) {
          if (file.name === 'readdir.js') {
            file.stem = 'foo';
          }
          return file;
        }
      });

      assert(files.some(f => f.stem === 'foo' && f.name === 'readdir.js'));
    });

    it('should read only one level by default', () => {
      cleanup = createFiles(['a/a/a', 'a/a/b', 'a/a/c']);

      let files = readdir.sync(fixtures());
      cleanup();
      assert.equal(files.length, 1);
      assert.equal(files[0], 'a');
    });

    it('should take and array of directories', () => {
      cleanup = createFiles(['a/a/a', 'b/b/b']);

      let files = readdir.sync([fixtures('a'), fixtures('b')]);
      cleanup();
      assert.equal(files.length, 2);
      assert.equal(files[0], 'a');
      assert.equal(files[1], 'b');
    });
  });

  describe('options.depth', () => {
    it('should recursively read files (depth: 2)', () => {
      cleanup = createFiles(['a/b/c/d/e', 'a/a/b/c/d']);

      let files = readdir.sync(fixtures(), { depth: 2 });
      cleanup();
      files.sort();
      assert.deepEqual(files, [ 'a', 'a/a', 'a/b' ].sort());
    });

    it('should recursively read files (depth: 3)', () => {
      cleanup = createFiles(['a/b/c/d/e', 'a/a/b/c/d']);
      let files = readdir.sync(fixtures(), { depth: 3 });
      cleanup();
      files.sort();
      assert.deepEqual(files, [ 'a', 'a/a', 'a/a/b', 'a/b', 'a/b/c' ].sort());
    });

    it('should recursively read files (depth: 4)', () => {
      cleanup = createFiles(['a/b/c/d/e', 'a/a/b/c/d']);

      let files = readdir.sync(fixtures(), { depth: 4 });
      cleanup();
      files.sort();
      assert.deepEqual(files, [ 'a', 'a/a', 'a/a/b', 'a/a/b/c', 'a/b', 'a/b/c', 'a/b/c/d' ].sort());
    });

    it('should recursively read files (depth: 5)', () => {
      cleanup = createFiles(['a/b/c/d/e', 'a/a/b/c/d']);
      const expected = [ 'a', 'a/a', 'a/a/b', 'a/a/b/c', 'a/b', 'a/b/c', 'a/b/c/d', 'a/b/c/d/e', 'a/a/b/c/d' ];

      let files = readdir.sync(fixtures(), { depth: 5 });
      cleanup();
      files.sort();
      assert.deepEqual(files, expected.sort());
    });
  });

  describe('options.recurse', () => {
    it('should recursively read files', () => {
      cleanup = createFiles(['a/a/a', 'a/a/b', 'a/a/c']);

      let files = readdir.sync(fixtures(), { recursive: true });
      cleanup();
      files.sort();
      assert.deepEqual(files, [ 'a', 'a/a', 'a/a/a', 'a/a/b', 'a/a/c' ].sort());
    });

    it('should get first level symlinks by default', () => {
      let paths = ['a/a/a', 'a/a/b', 'a/a/c'];
      let links = ['b/a/a', 'b/a/b', 'b/a/c'];
      cleanup = createFiles(paths);

      for (let i = 0; i < links.length; i++) {
        fs.mkdirSync(path.dirname(fixtures(links[i])), { recursive: true });
        fs.symlinkSync(fixtures(paths[i]), fixtures(links[i]), 'file');
      }

      let files = readdir.sync(fixtures(), { recursive: true });
      cleanup();
      files.sort();
      assert.deepEqual(files, [ 'a', 'b', 'a/a', 'b/a', ...paths, ...links ].sort());
    });
  });

  describe('options.objects', () => {
    it('should return file objects', () => {
      let files = readdir.sync(__dirname, { objects: true });
      assert(files.some(file => file.name === 'readdir.js'));
      assert(files.some(file => file.name === 'fixtures'));
    });
  });

  describe('options.onFile', () => {
    it('should call options.onFile function on each file', () => {
      const onFile = file => {
        if (file.name === 'readdir.js') {
          file.path = path.join(path.dirname(file.path), 'foo.js');
          file.name = 'foo.js';
        }
        return file;
      };

      let files = readdir.sync(__dirname, { onFile });
      assert(files.some(file => path.basename(file) === 'foo.js'));
      assert(files.some(file => path.basename(file) === 'fixtures'));
    });

    it('should not keep files when file.keep is false', () => {
      let paths = ['a/a/a.md', 'a/a/b.txt', 'a/a/c.md', 'a/b/c/d.txt', 'a/b/b/b.md'];
      cleanup = createFiles(paths);

      const onFile = file => {
        file.keep = path.extname(file.path) === '.md';
      };

      let files = readdir.sync(fixtures(), { onFile, nodir: true, recursive: true });
      cleanup();
      assert.deepEqual(files, [ 'a/a/a.md', 'a/a/c.md', 'a/b/b/b.md' ]);
    });
  });

  describe('options.onDirectory', () => {
    it('should call options.onDirectory function on each directory', () => {
      const onDirectory = file => {
        if (file.name === 'fixtures') {
          file.path = path.join(path.dirname(file.path), 'actual');
          file.name = 'actual';
        }
      };

      let files = readdir.sync(__dirname, { onDirectory });
      assert(files.some(file => path.basename(file) === 'readdir.js'));
      assert(files.some(file => path.basename(file) === 'actual'));
    });

    it('should not recurse in a directory when file.recurse is false', () => {
      let paths = ['a/a/a.txt', 'a/a/b.txt', 'a/a/c.txt', 'a/b/c/d.txt', 'a/b/b/b.txt'];
      cleanup = createFiles(paths);

      const onDirectory = file => {
        file.recurse = file.name !== 'b';
        file.keep = false;
      };

      let files = readdir.sync(fixtures(), { recursive: true, onDirectory });
      cleanup();
      assert.deepEqual(files, [ 'a/a/a.txt', 'a/a/b.txt', 'a/a/c.txt' ]);
    });
  });

  describe('options.symlinks', () => {
    it('should get first-level symlinks by default', () => {
      let link = 'temp-symlink.js';
      cleanup = createSymlink('file', link, ['foo.js', 'bar.js']);

      let files = readdir.sync(fixtures(), { ...options });
      assert(files.length > 0);
      assert(files.some(name => name === link));
      assert(files.some(name => name === 'foo.js'));
      assert(files.some(name => name === 'bar.js'));
    });

    it('should not get first-level symlinks when disabled', () => {
      let paths = ['nested/a/a/a', 'nested/a/a/b', 'nested/a/a/c'];
      let links = ['nested/b/a/a', 'nested/b/a/b', 'nested/b/a/c'];
      cleanup = createFiles(paths);

      for (let i = 0; i < links.length; i++) {
        fs.mkdirSync(path.dirname(fixtures(links[i])), { recursive: true });
        fs.symlinkSync(fixtures(paths[i]), fixtures(links[i]), 'file');
      }

      fs.symlinkSync(fixtures('nested'), fixtures('symlinks'), 'dir');

      let files = readdir.sync(fixtures(), { recursive: true, symlinks: false });
      cleanup();
      unlinkSync(fixtures('symlinks'));

      assert(files.includes('nested'));
      assert(files.includes('nested/a'));
      assert(files.includes('nested/b'));
      assert(files.includes('nested/a/a'));
      assert(files.includes('nested/a/a/a'));

      assert(!files.includes('symlinks'));
      assert(!files.includes('symlinks/a'));
      assert(!files.includes('symlinks/b'));
      assert(!files.includes('symlinks/a/a'));
      assert(!files.includes('symlinks/a/a/a'));
    });

    it('should return symlinked files when not disabled on options', () => {
      try {
        let link = 'temp-symlink.js';
        cleanup = createSymlink('file', link, ['foo.js', 'bar.js']);

        let files = readdir.sync(fixtures(), { ...options });

        assert(files.length > 0);
        assert(files.some(name => name === link));
        assert(files.some(name => name === 'foo.js'));
        assert(files.some(name => name === 'bar.js'));

      } catch (err) {
        throw err;

      } finally {
        cleanup();
      }
    });

    it('should return symlinked directories when not disabled on options', () => {
      let opts = { ...options };

      try {
        let link = 'temp-symlink';
        cleanup = createSymlink('dir', link, ['foo.js', 'bar.js']);

        let files = readdir.sync(fixtures(), opts);

        assert(files.length > 0);
        assert(files.some(name => name === link));
        assert(files.some(name => name === 'foo.js'));
        assert(files.some(name => name === 'bar.js'));

      } catch (err) {
        throw err;

      } finally {
        cleanup();
      }
    });

    it('should ignore nested symlinked files that do not exist', () => {
      let opts = { ...options, symlinks: true };

      cleanup = createFiles(['foo.js', 'bar.js']);
      let tempfile = fixtures('tempfile.js');
      let link = fixtures('link.js');

      try {
        write.sync(tempfile, 'temp');
        fs.symlinkSync(tempfile, link, 'file');
        unlinkSync(tempfile);

        let files = readdir.sync(fixtures(), opts);

        assert(files.length > 0);
        assert(!files.some(name => name === link));
        assert(files.some(name => name === 'foo.js'));
        assert(files.some(name => name === 'bar.js'));

      } catch (err) {
        throw err;
      } finally {
        cleanup();
        unlinkSync(link);
      }
    });

    it('should ignore nested symlinked directories that do not exist', () => {
      let opts = { ...options, symlinks: true };
      cleanup = createFiles(['foo.js', 'bar.js']);

      let tempdir = fixtures('tempdir/a/b/c');
      let link = fixtures('link');

      try {
        fs.mkdirSync(tempdir, { recursive: true });
        fs.symlinkSync(tempdir, link, 'dir');
        rimraf.sync(tempdir);

        let files = readdir.sync(fixtures(), opts);

        assert(files.length > 0);
        assert(!files.some(name => name === link));
        assert(files.some(name => name === 'foo.js'));
        assert(files.some(name => name === 'bar.js'));

      } catch (err) {
        throw err;
      } finally {
        cleanup();
        unlinkSync(link);
      }
    });

    it('should only get first-level symlinks by default', () => {
      let paths = ['nested/a/a/a', 'nested/a/a/b', 'nested/a/a/c'];
      let links = ['nested/b/a/a', 'nested/b/a/b', 'nested/b/a/c'];
      cleanup = createFiles(paths);

      for (let i = 0; i < links.length; i++) {
        fs.mkdirSync(path.dirname(fixtures(links[i])), { recursive: true });
        fs.symlinkSync(fixtures(paths[i]), fixtures(links[i]), 'file');
      }

      fs.symlinkSync(fixtures('nested'), fixtures('symlinks'), 'dir');

      let files = readdir.sync(fixtures(), { recursive: true });
      cleanup();
      unlinkSync(fixtures('symlinks'));

      assert(files.includes('nested'));
      assert(files.includes('nested/a'));
      assert(files.includes('nested/b'));
      assert(files.includes('nested/a/a'));
      assert(files.includes('nested/a/a/a'));

      assert(files.includes('symlinks'));
      assert(!files.includes('symlinks/a'));
      assert(!files.includes('symlinks/b'));
      assert(!files.includes('symlinks/a/a'));
      assert(!files.includes('symlinks/a/a/a'));
    });

    it('should recursively get symlinks when specified', () => {
      let paths = ['nested/a/a/a', 'nested/a/a/b', 'nested/a/a/c'];
      let links = ['nested/b/a/a', 'nested/b/a/b', 'nested/b/a/c'];
      cleanup = createFiles(paths);

      for (let i = 0; i < links.length; i++) {
        fs.mkdirSync(path.dirname(fixtures(links[i])), { recursive: true });
        fs.symlinkSync(fixtures(paths[i]), fixtures(links[i]), 'file');
      }

      fs.symlinkSync(fixtures('nested'), fixtures('symlinks'), 'dir');

      let files = readdir.sync(fixtures(), { recursive: true, follow: true });
      cleanup();
      unlinkSync(fixtures('symlinks'));

      assert(files.includes('nested'));
      assert(files.includes('nested/a'));
      assert(files.includes('nested/b'));
      assert(files.includes('nested/a/a'));
      assert(files.includes('nested/a/a/a'));

      assert(files.includes('symlinks'));
      assert(files.includes('symlinks/a'));
      assert(files.includes('symlinks/b'));
      assert(files.includes('symlinks/a/a'));
      assert(files.includes('symlinks/a/a/a'));
    });
  });

  describe('options.realpath', () => {
    it('should return realpaths', () => {
      let paths = ['a/a/a', 'a/a/b', 'a/a/c'];
      let links = ['b/a/a', 'b/a/b', 'b/a/c'];
      cleanup = createFiles(paths);

      for (let i = 0; i < links.length; i++) {
        fs.mkdirSync(path.dirname(fixtures(links[i])), { recursive: true });
        fs.symlinkSync(fixtures(paths[i]), fixtures(links[i]), 'file');
      }

      let files = readdir.sync(fixtures(), { recursive: true, realpath: true });
      cleanup();
      assert.deepEqual(files.sort(), [ 'a', 'b', 'a/a', 'b/a', ...paths, ...paths ].sort());
    });

    it('should return realpaths with no duplicates when options.unique is true', () => {
      let paths = ['a/a/a', 'a/a/b', 'a/a/c'];
      let links = ['b/a/a', 'b/a/b', 'b/a/c'];
      cleanup = createFiles(paths);

      for (let i = 0; i < links.length; i++) {
        fs.mkdirSync(path.dirname(fixtures(links[i])), { recursive: true });
        fs.symlinkSync(fixtures(paths[i]), fixtures(links[i]), 'file');
      }

      let files = readdir.sync(fixtures(), { recursive: true, realpath: true, unique: true });
      cleanup();
      assert.deepEqual(files.sort(), [ 'a', 'b', 'a/a', 'b/a', ...paths ].sort());
    });
  });

  describe('options.relative', () => {
    it('should get relative paths for symlinked files', () => {
      let opts = { ...options, relative: true, symlinks: true, base: __dirname };
      let names = fs.readdirSync(path.join(__dirname, '..'));

      cleanup = createSymlinks('file', names, ['foo.js', 'bar.js']);

      let files = readdir.sync(fixtures(), opts);
      cleanup();
      assert(files.length > 0);
      // symlinks
      assert(files.some(name => name === 'fixtures/README.md'));
      assert(files.some(name => name === 'fixtures/LICENSE'));

      // files
      assert(files.some(name => name === 'fixtures/foo.js'));
      assert(files.some(name => name === 'fixtures/bar.js'));
    });

    it('should get relative paths for symlinked files', () => {
      let opts = { ...options, relative: true, symlinks: true, base: __dirname };
      let names = fs.readdirSync(path.join(__dirname, '..'));

      cleanup = createSymlinks('file', names, ['foo.js', 'bar.js']);

      let files = readdir.sync(fixtures(), opts);
      cleanup();
      assert(files.length > 0);
      // symlinks
      assert(files.some(name => name === 'fixtures/README.md'));
      assert(files.some(name => name === 'fixtures/LICENSE'));

      // files
      assert(files.some(name => name === 'fixtures/foo.js'));
      assert(files.some(name => name === 'fixtures/bar.js'));
    });
  });

  describe('options.filter', () => {
    let opts = { ...options, relative: true, symlinks: true, base: __dirname };

    it('should filter symlinks', () => {
      try {
        let names = fs.readdirSync(path.join(__dirname, '..'));
        cleanup = createSymlinks('file', names, ['foo.js', 'bar.js']);

        let filter = file => !/license/i.test(file.path);
        let files = readdir.sync(fixtures(), { ...opts, filter });

        assert(files.length > 0);
        // symlinks
        assert(files.some(name => name === 'fixtures/README.md'));
        assert(!files.some(name => name === 'fixtures/LICENSE'));

        // files
        assert(files.some(name => name === 'fixtures/foo.js'));
        assert(files.some(name => name === 'fixtures/bar.js'));

      } catch (err) {
        throw err;
      } finally {
        cleanup();
      }
    });

    it('should filter files', () => {
      let filter = file => /sync/.test(file.path);

      let files = readdir.sync(__dirname, { ...opts, filter });
      assert(files.includes('readdir.sync.js'));
    });

    it('should filter files recursively', () => {
      cleanup = createFiles(['c.md', 'a/a/a/a.md', 'a/a/a/c.txt', 'a/a/a/b.md', 'a/b.txt']);

      let filter = file => {
        return file.isFile() && path.extname(file.path) === '.md';
      };

      let files = readdir.sync(fixtures(), { recursive: true, filter });
      cleanup();
      assert.deepEqual(files, [ 'c.md', 'a/a/a/a.md', 'a/a/a/b.md' ].sort());
    });
  });
});
