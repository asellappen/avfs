'use strict';

var chai   = require('chai');
var expect = chai.expect;

module.exports = function (fs) {

  describe('renameSync()', function () {

    it('should rename files', function () {
      var result = fs.renameSync('/tmp/file', '/tmp/new');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/tmp/new').that.contain('Hello, friend.');
    });

    it('should move files', function () {
      var result = fs.renameSync('/tmp/file', '/dir/file');

      expect(result).to.be.an('undefined');
      expect(fs.files).to.contain.an.avfs.file('/dir/file').that.contain('Hello, friend.');
    });

    it('should throw on non existing path', function () {
      expect(function () {
        fs.renameSync('/tmp/not', '/tmp/new');
      }).to.throw(Error, 'ENOENT, no such file or directory \'/tmp/not\'');
    });

    it('should throw on new path under old path', function () {
      expect(function () {
        fs.renameSync('/tmp/file', '/tmp/file/new');
      }).to.throw(Error, 'EINVAL, invalid argument \'/tmp/file\'');
    });

    it('should throw on not directory parent', function () {
      expect(function () {
        fs.renameSync('/tmp/file/file', '/dir/file');
      }).to.throw(Error, 'ENOTDIR, not a directory \'/tmp/file/file\'');
    });

    it('should throw on not writable parent directory', function () {
      expect(function () {
        fs.renameSync('/perm/file', '/tmp/new');
      }).to.throw(Error, 'EACCES, permission denied \'/perm/file\'');
    });

    it('should throw on not writable destination directory', function () {
      expect(function () {
        fs.renameSync('/tmp/file', '/perm/new');
      }).to.throw(Error, 'EACCES, permission denied \'/tmp/file\'');
    });

  });

};
