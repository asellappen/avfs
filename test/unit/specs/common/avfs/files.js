'use strict';

var chai   = require('chai');
var expect = chai.expect;

var elements = require('lib/common/elements');
var factory  = require('lib/common/avfs/files');

var AVFSError = require('lib/common/avfs-error');
var Storage   = require('lib/common/storage');

var constants = {
  S_IFDIR: 16384, // 0040000 - directory

  O_RDONLY: 1,
  O_WRONLY: 2,
  O_RDWR:   4,
  O_CREAT:  8,
  O_EXCL:   16,
  O_TRUNC:  32,
  O_APPEND: 64
};

describe('common/avfs/files', function () {

  var storage = new Storage();
  var handles = {next: 0};

  var base = factory(storage, constants, handles);

  beforeEach(function () {
    storage.files = elements.directory(parseInt('0755', 8), {
      file: elements.file(parseInt('0777', 8), new Buffer('Hello, friend.')),
      dir:  elements.directory(parseInt('0755', 8)),
      perm: elements.directory(parseInt('0000', 8))
    });
  });

  describe('appendFile()', function () {

    it('should append buffer to file', function () {
      var result = base.appendFile('/file', new Buffer(' Hello, world !'));

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append string to file', function () {
      var result = base.appendFile('/file', ' Hello, world !');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend. Hello, world !');
    });

    it('should append encoded string to file', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.appendFile('/new', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain(content);
    });

    it('should accept encoding option', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.appendFile('/new', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain(content);
    });

    it('should accept mode option', function () {
      var result = base.appendFile('/new', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        base.appendFile('/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

    it('should create non existing file', function () {
      var result = base.appendFile('/new', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain('Hello, friend.');
    });

  });

  describe('readFile()', function () {

    it('should return the file buffer', function () {
      var content = base.readFile('/file');

      expect(content).to.be.an.instanceof(Buffer);
      expect(content.toString()).to.equal('Hello, friend.');
    });

    it('should return an encoded string', function () {
      var content = base.readFile('/file', {encoding: 'utf8'});

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should accept encoding option', function () {
      var content = base.readFile('/file', 'utf8');

      expect(content).to.be.a('string');
      expect(content).to.equal('Hello, friend.');
    });

    it('should throw EISDIR on directory', function () {
      expect(function () {
        base.readFile('/dir');
      }).to.throw(AVFSError, {code: 'EISDIR'});
    });

  });

  describe('rename()', function () {

    it('should rename files', function () {
      var result = base.rename('/file', '/new');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/new').that.contain('Hello, friend.');
    });

    it('should move files', function () {
      var result = base.rename('/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/dir/file').that.contain('Hello, friend.');
    });

    it('should throw EINVAL on new path under old path', function () {
      expect(function () {
        base.rename('/file', '/file/new');
      }).to.throw(AVFSError, {code: 'EINVAL'});
    });

    it('should throw EACCES on not writable parent directory', function () {
      expect(function () {
        base.rename('/perm/file', '/new');
      }).to.throw(AVFSError, {code: 'EACCES'});
    });

    it('should throw EACCES on not writable destination directory', function () {
      expect(function () {
        base.rename('/file', '/perm/new');
      }).to.throw(AVFSError, {code: 'EACCES'});
    });

  });

  describe('truncate()', function () {

    it('should truncate file', function () {
      var result = base.truncate('/file');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.is.clear();
    });

    it('should truncate file to the specified length', function () {
      var content = new Buffer('Hello, friend.');

      var result = base.truncate('/file', 3);

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content.slice(0, 3).toString());
    });

    it('should throw ENOENT on not existing path', function () {
      expect(function () {
        base.truncate('/not');
      }).to.throw(AVFSError, {code: 'ENOENT'});
    });

  });

  describe('writeFile()', function () {

    it('should write buffer to file', function () {
      var result = base.writeFile('/file', new Buffer('Hello, friend.'));

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write string to file', function () {
      storage.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var result = base.writeFile('/file', 'Hello, friend.');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain('Hello, friend.');
    });

    it('should write encoded string to file', function () {
      storage.files = elements.directory('0755', {
        tmp: elements.directory('0777', {})
      });

      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.writeFile('/file', 'aàâäeéèâë', {encoding: 'ascii'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content);
    });

    it('should accept encoding option', function () {
      var content = new Buffer('aàâäeéèâë', 'ascii').toString();

      var result = base.writeFile('/file', 'aàâäeéèâë', 'ascii');

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').that.contain(content);
    });

    it('should accept mode option', function () {
      var result = base.writeFile('/file', 'OK', {mode: '0700'});

      expect(result).to.be.an('undefined');
      expect(storage.files).to.contain.an.avfs.file('/file').with.mode('0700');
    });

    it('should accept flag option', function () {
      expect(function () {
        base.writeFile('/file', 'OK', {flag: 'r'});
      }).to.throw(Error, {code: 'EBADF'});
    });

  });

});
