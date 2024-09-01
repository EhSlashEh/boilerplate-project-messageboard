'use strict';
const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;
module.exports = function (app) {
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        let board = req.body.board;
        if (!board) {
          board = req.params.board;
        }
        console.log("post", req.body);
        const newThread = new ThreadModel({
          text: text,
          delete_password: delete_password,
          replies: [],
        });
        console.log("newThread", newThread);
        let Boarddata = await BoardModel.findOne({ name: board });
        if (!Boarddata) {
          const newBoard = new BoardModel({
            name: board,
            threads: [],
          });
          console.log("newBoard", newBoard);
          newBoard.threads.push(newThread);
          const data = await newBoard.save();
          res.json(newThread);
        } else {
          Boarddata.threads.push(newThread);
          const data = await Boarddata.save();
          res.json(newThread);
        }
      } catch (err) {
        console.log(err);
        res.send("There was an error saving in post");
      }
    })

    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const data = await BoardModel.findOne({ name: board });
    
        if (!data) {
          console.log("No board with this name");
          res.json({ error: "No board with this name" });
        } else {
          console.log("data", data);
          const threads = data.threads.map((thread) => {
            const {
              _id,
              text,
              created_on,
              bumped_on,
              reported,
              delete_password,
              replies,
            } = thread;
            return {
              _id,
              text,
              created_on,
              bumped_on,
              reported,
              delete_password,
              replies,
              replycount: replies.length,
            };
          });
          res.json(threads);
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error fetching the threads" });
      }
    });
    
  app.route('/api/replies/:board');
};
