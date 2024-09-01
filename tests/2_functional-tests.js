const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testThread_id;
let testReply_id;

suite('Functional Tests', function() {
  
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Creating a new thread', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text: 'Test thread text',
            delete_password: 'password'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'replies');
            done();
          });
      });
    });

    suite('GET', function() {
      test('Viewing the 10 most recent threads with 3 replies each', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            res.body.forEach(thread => {
              assert.isArray(thread.replies);
              assert.isAtMost(thread.replies.length, 3);
            });
            done();
          });
      });
    });

    suite('DELETE', function() {
      test('Deleting a thread with the incorrect password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: testThread_id,
            delete_password: 'wrongpassword'
          })
          .end(function(err, res) {
            assert.equal(res.status, 401);
            assert.equal(res.body.error, 'Incorrect password');
            done();
          });
      });

      test('Deleting a thread with the correct password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: testThread_id,
            delete_password: 'password'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Thread successfully deleted');
            done();
          });
      });
    });

    suite('PUT', function() {
      test('Reporting a thread', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({
            report_id: testThread_id
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Success');
            done();
          });
      });
    });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Creating a new reply', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: testThread_id,
            text: 'Test reply text',
            delete_password: 'password'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            done();
          });
      });
    });

    suite('GET', function() {
      test('Viewing a single thread with all replies', function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({ thread_id: testThread_id })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, 'replies');
            assert.isArray(res.body.replies);
            done();
          });
      });
    });

    suite('DELETE', function() {
      test('Deleting a reply with the incorrect password', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: '5f665eb46e296f6b9b6a504d', // replace with a real thread id
            reply_id: '5f665eb46e296f6b9b6a504e', // replace with a real reply id
            delete_password: 'wrongpassword'
          })
          .end(function(err, res) {
            assert.equal(res.status, 401);
            assert.equal(res.body.error, 'Incorrect password');
            done();
          });
      });

      test('Deleting a reply with the correct password', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: testThread_id,
            reply_id: testReply_id,
            delete_password: 'password'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Reply successfully deleted');
            done();
          });
      });
    });

    suite('PUT', function() {
      test('Reporting a reply', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({
            thread_id: testThread_id,
            reply_id: testReply_id,
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Reply successfully reported');
            done();
          });
      });
    });

  });

});
