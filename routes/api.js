module.exports = function (app) {

  app.route('/api/threads/:board').post(async (req, res) => {
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

      let Boarddata = await BoardModel.findOne({ name: board });

      if (!Boarddata) {
        const newBoard = new BoardModel({
          name: board,
          threads: [],
        });
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
  });

  app.route('/api/replies/:board');
};
