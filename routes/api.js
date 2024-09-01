"use strict";

const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;

module.exports = function (app) {
  app.route("/api/threads/:board")
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        let board = req.body.board;
        if (!board) {
          board = req.params.board;
        }
        const newThread = new ThreadModel({
          text: text,
          delete_password: delete_password,
          replies: [],
        });

        let boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          const newBoard = new BoardModel({
            name: board,
            threads: [],
          });

          newBoard.threads.push(newThread);
          await newBoard.save();
          return res.json(newThread);
        } else {
          boardData.threads.push(newThread);
          await boardData.save();
          return res.json(newThread);
        }
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    })

    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const data = await BoardModel.findOne({ name: board }).exec();
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
              replycount: thread.replies.length,
            };
          });
          res.json(threads);
        }
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
      }
    })

    .put(async (req, res) => {
      try {
        console.log("put", req.body);
        const { report_id } = req.body;
        const board = req.params.board;
        const boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          res.json({ error: "Board not found" });
        } else {
          const date = new Date();
          let reportedThread = boardData.threads.id(report_id);
          reportedThread.reported = true;
          reportedThread.bumped_on = date;
          await boardData.save();
          res.send("Success");
        }
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;
        
        console.log("Request body:", req.body);
        console.log("Board:", board);
        
        if (!thread_id || !delete_password) {
          console.log("Missing thread_id or delete_password");
          return res.status(400).send("Missing thread_id or delete_password");
        }
        
        const boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          console.log("Board not found");
          return res.json({ error: "Board not found" });
        }
        
        let threadToDelete = boardData.threads.id(thread_id);
        if (!threadToDelete) {
          console.log("Thread not found");
          return res.json({ error: "Thread not found" });
        }
  
        if (threadToDelete.delete_password === delete_password) {
          console.log("Password correct, deleting thread");
          threadToDelete.remove();
          await boardData.save();
          return res.send("Success");
        } else {
          console.log("Incorrect password");
          return res.send("Incorrect Password");
        }
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    });

    app.route("/api/replies/:board")
    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        const board = req.params.board;
        const newReply = new ReplyModel({ text, delete_password });
        const boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          return res.json({ error: "Board not found" });
        }
        const thread = boardData.threads.id(thread_id);
        if (!thread) {
          return res.json({ error: "Thread not found" });
        }
        thread.replies.push(newReply);
        thread.bumped_on = new Date();
        await boardData.save();
        res.json(newReply);
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
      }
    })
  
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const thread_id = req.query.thread_id;
        const boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          return res.json({ error: "Board not found" });
        }
        const thread = boardData.threads.id(thread_id);
        if (!thread) {
          return res.json({ error: "Thread not found" });
        }
        res.json(thread);
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
      }
    })
  
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;
        const data = await BoardModel.findOne({ name: board }).exec();
        if (!data) {
          console.log("No board with this name");
          res.json({ error: "No board with this name" });
        } else {
          console.log("data", data);
          let thread = data.threads.id(thread_id);
          let reply = thread.replies.id(reply_id);
          reply.reported = true;
          reply.bumped_on = new Date();
          await data.save();
          res.send("Success");
        }
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        console.log("delete reply body", req.body);
        const board = req.params.board;
        const data = await BoardModel.findOne({ name: board }).exec();
        if (!data) {
          console.log("No board with this name");
          res.json({ error: "No board with this name" });
        } else {
          console.log("data", data);
          let thread = data.threads.id(thread_id);
          let reply = thread.replies.id(reply_id);
          if (reply.delete_password === delete_password) {
            reply.remove();
            await data.save();
            res.send("Success");
          } else {
            res.send("Incorrect Password");
          }
        }
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
      }
    });
};
