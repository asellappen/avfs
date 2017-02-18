'use strict';

var chai   = require('chai');
var expect = chai.expect;

var storage = require('../../lib/common/storage');

function expectError(error, message, data) {
  expect(error).to.be.an('error');

  expect(error.message).to.equal(message);

  Object.keys(data).forEach(function (property) {
    expect(error[property]).to.equal(data[property]);
  });
}

function d(directory) {
  return Object.defineProperties(directory, {
    '@type': {
      value:        'directory',
      configurable: false,
      enumerable:   false,
      writable:     false
    }
  });
}

function f() {
  return Object.defineProperties({}, {
    '@type': {
      value:        'file',
      configurable: false,
      enumerable:   false,
      writable:     false
    }
  });
}

var files = {
  dir: d({
    file: f()
  })
};

describe('common/storage', function () {

  it('should expose storage function', function () {
    expect(storage).to.contain.keys([
      'parse',
      'get',
      'set',
      'unset'
    ]);
  });

  describe('parse()', function () {

    it('should return path elements', function () {
      expect(storage.parse('/path/to/file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
      expect(storage.parse('path/to/file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
      expect(storage.parse('C:\\path\\to\\file.txt')).to.deep.equal(['C:', 'path', 'to', 'file.txt']);
      expect(storage.parse('path\\to\\file.txt')).to.deep.equal(['path', 'to', 'file.txt']);
    });

  });

  describe('get()', function () {

    it('should return the element', function () {
      expect(storage.get(files, 'test', '/dir')).to.equal(files.dir);
      expect(storage.get(files, 'test', '/dir/file')).to.equal(files.dir.file);
    });

    it('should slice the path', function () {
      expect(storage.get(files, 'test', '/dir/file', 1)).to.equal(files.dir);
    });

    it('should set parameters on error', function () {
      try {
        storage.get(files, {syscall: 'test', filepath: '/other/path'}, '/not/file');
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/other/path');
        expect(error.syscall).to.equal('test');
      }

      try {
        storage.get(files, {syscall: 'test'}, '/not/file');
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/not/file');
        expect(error.syscall).to.equal('test');
      }
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.get(files, 'test', '/not/file');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.get(files, 'test', '/dir/file/test');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/dir/file/test\'');
    });

  });

  describe('set()', function () {

    it('should set the element', function () {
      var file = f();

      storage.set(files, 'test', '/dir/test', file);

      expect(files.dir).to.contain.keys('test');
      expect(files.dir.test).to.equal(file);
    });

    it('should set parameters on error', function () {
      try {
        storage.set(files, {syscall: 'test', filepath: '/other/path'}, '/not/file', f());
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/other/path');
        expect(error.syscall).to.equal('test');
      }

      try {
        storage.set(files, {syscall: 'test'}, '/not/file', f());
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/not/file');
        expect(error.syscall).to.equal('test');
      }
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.set(files, 'test', '/not/file', f());
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.set(files, 'test', '/dir/file/test', f());
      }).to.throw(Error, 'ENOTDIR, not a directory \'/dir/file/test\'');
    });

  });

  describe('unset()', function () {

    it('should unset the element', function () {
      storage.unset(files, 'test', '/dir/test');

      expect(files.dir).to.not.contain.keys('test');
    });

    it('should unset parameters on error', function () {
      try {
        storage.unset(files, {syscall: 'test', filepath: '/other/path'}, '/not/file', f());
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/other/path');
        expect(error.syscall).to.equal('test');
      }

      try {
        storage.unset(files, {syscall: 'test'}, '/not/file', f());
      } catch (error) {
        expect(error.code).to.equal('ENOENT');
        expect(error.path).to.equal('/not/file');
        expect(error.syscall).to.equal('test');
      }
    });

    it('should throw on missing directory in path', function () {
      expect(function () {
        storage.unset(files, 'test', '/not/file', f());
      }).to.throw(Error, 'ENOENT, no such file or directory \'/not/file\'');
    });

    it('should throw on not directory element in path', function () {
      expect(function () {
        storage.unset(files, 'test', '/dir/file/test', f());
      }).to.throw(Error, 'ENOTDIR, not a directory \'/dir/file/test\'');
    });

  });

});
