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
          return res.json({ error: "No board with this name" });
        }

        const threads = data.threads
          .sort((a, b) => b.bumped_on - a.bumped_on)
          .slice(0, 10)
          .map((thread) => {
            const {
              _id,
              text,
              created_on,
              bumped_on,
              replies,
            } = thread;
            return {
              _id,
              text,
              created_on,
              bumped_on,
              replycount: replies.length,
              replies: replies
                .sort((a, b) => b.created_on - a.created_on)
                .slice(0, 3)
                .map((reply) => ({
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on,
                })),
            };
          });
        return res.json(threads);
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    })

    .put(async (req, res) => {
      try {
        const { report_id } = req.body;
        const board = req.params.board;
        const boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          return res.json({ error: "Board not found" });
        }

        let reportedThread = boardData.threads.id(report_id);
        if (!reportedThread) {
          return res.json({ error: "Thread not found" });
        }

        reportedThread.reported = true;
        await boardData.save();
        return res.send("reported");
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;

        if (!thread_id || !delete_password) {
          return res.status(400).send("Missing thread_id or delete_password");
        }
        
        const boardData = await BoardModel.findOne({ name: board }).exec();
        if (!boardData) {
          return res.json({ error: "Board not found" });
        }
        
        let threadToDelete = boardData.threads.id(thread_id);
        if (!threadToDelete) {
          return res.json({ error: "Thread not found" });
        }
  
        if (threadToDelete.delete_password === delete_password) {
          boardData.threads.pull(thread_id);
          await boardData.save();
          return res.send("success");
        } else {
          return res.send("incorrect password");
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
        newReply.created_on = new Date();
        thread.replies.push(newReply);
        thread.bumped_on = newReply.created_on;
        await boardData.save();
        return res.json(newReply);
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
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

        const threadResponse = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map((reply) => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on,
          })),
        };

        return res.json(threadResponse);
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    })
  
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;
        const data = await BoardModel.findOne({ name: board }).exec();
        if (!data) {
          return res.json({ error: "No board with this name" });
        }

        const thread = data.threads.id(thread_id);
        if (!thread) {
          return res.json({ error: "Thread not found" });
        }

        const reply = thread.replies.id(reply_id);
        if (!reply) {
          return res.json({ error: "Reply not found" });
        }

        reply.reported = true;
        await data.save();
        return res.send("reported");
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const board = req.params.board;
        const data = await BoardModel.findOne({ name: board }).exec();
        if (!data) {
          return res.json({ error: "No board with this name" });
        }

        const thread = data.threads.id(thread_id);
        if (!thread) {
          return res.json({ error: "Thread not found" });
        }

        const reply = thread.replies.id(reply_id);
        if (!reply) {
          return res.json({ error: "Reply not found" });
        }

        if (reply.delete_password === delete_password) {
          reply.text = "[deleted]";
          await data.save();
          return res.send("success");
        } else {
          return res.send("incorrect password");
        }
      } catch (err) {
        console.error("Error:", err);
        return res.status(500).send("Internal Server Error");
      }
    });
};
