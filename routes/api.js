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
    })

    .put(async (req, res) => {
      try {
        console.log("put", req.body);
        const { report_id } = req.body;
        const board = req.params.board;
        
        const boardData = await BoardModel.findOne({ name: board });
        
        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }
    
        const reportedThread = boardData.threads.id(report_id);
        
        if (!reportedThread) {
          return res.status(404).json({ error: "Thread not found" });
        }
    
        reportedThread.reported = true;
        reportedThread.bumped_on = new Date();
        
        await boardData.save();
        res.json({ message: "Success" });
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error updating the thread" });
      }
    })

    .delete(async (req, res) => {
      try {
        console.log("delete", req.body);
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;
        
        const boardData = await BoardModel.findOne({ name: board });
        
        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }
        
        const threadToDelete = boardData.threads.id(thread_id);
        
        if (!threadToDelete) {
          return res.status(404).json({ error: "Thread not found" });
        }
        
        if (threadToDelete.delete_password !== delete_password) {
          return res.status(401).json({ error: "Incorrect password" });
        }
        
        threadToDelete.remove();
        await boardData.save();
        
        res.json({ message: "Thread successfully deleted" });
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error deleting the thread" });
      }
    })
    
        
  app.route('/api/replies/:board')

    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        let board = req.body.board;
        if (!board) {
          board = req.params.board;
        }
        const newReply = new ReplyModel({
          text: text,
          delete_password: delete_password,
        });
        let Boarddata = await BoardModel.findOne({ name: board });
        if (!Boarddata) {
          res.json("error", "Board not found");
        } else {
          const date = new Date();
          let threadToAddReply = boardData.threads.id(thread_id);
          threadToAddReply.bumped_on = date;
          threadToAddReply.replies.push(newReply);
          boardData.save((err, updatedData) => {
            res.json(updatedData);
          })
        }
      } catch (err) {
        console.log(err);
        res.send("There was an error");
      }
    })

    .get((req, res) => {
      const board = req.params.board;
      BoardModel.findOne({ name: board }, (err, data) => {
        if (!data) {
          console.log("No board with this name");
          res.json({ error: "No board with this name" });
        } else {
          console.log("data", data);
          const thread = data.threads.id(req.query.thread_id);
          res.json(thread);
        }

      });

    })

    .put(async (req, res) => {
      try {
        console.log("put", req.body);
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;

        const boardData = await BoardModel.findOne({ name: board });

        if (!boardData) {
          return res.status(404).json({ error: "Board not found" });
        }

        const threadToReport = boardData.threads.id(thread_id);
        
        if (!threadToReport) {
          return res.status(404).json({ error: "Thread not found" });
        }

        const replyToReport = threadToReport.replies.id(reply_id);

        if (!replyToReport) {
          return res.status(404).json({ error: "Reply not found" });
        }

        replyToReport.reported = true;
        threadToReport.bumped_on = new Date();

        await boardData.save();
        res.json({ message: "Reply successfully reported" });
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "There was an error reporting the reply" });
      }
    })

};
