const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const ReComment = require("../models/recomment");
const Image = require("../models/image");
const fs = require("fs");
const path = require("path");

module.exports = class PostService {
  static async imageUpload(req, res) {
    console.log(req.files);
    res.json(req.files.map((v) => v.filename));
  }

  static async imageDelete(req, res, next) {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, "..", "uploads", filename);

      // 이미지 파일 삭제
      fs.unlinkSync(filePath);
      res.status(200).json({ filename: filename }); // 성공 응답
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const post = await Post.create({
        content: req.body.content,
        userIdx: /*post 모델에서 관계 설정한 foreignKey 컬럼명*/ req.user.id,
        //passport를 통해서 로그인하면 세션 데이터 해석 후 user 정보가 req.user에 담겨서 id값이 생김
      });

      if (req.body.image) {
        if (Array.isArray(req.body.image)) {
          //이미지를 여러 개 올리면 image: [1.png, 2.png] 배열로 올라감
          const images = await Promise.all(
            req.body.image.map((image) => Image.create({ src: image }))
          );
          await post.addImages(images); //addImages는 Post 모델 관계 설정에서 나온 함수
        } else {
          const image = await Image.create({ src: req.body.image });
          await post.addImages(image);

          //이미지를 하나만 올리면 image: 1.png
        }
      }
      const fullPost = await Post.findOne({
        where: { id: post.id }, //게시글 쓰면 자동으로 id 생성
        include: [
          {
            model: Image,
          },
          {
            model: User, //게시글 작성자
            attributes: ["id", "email", "nickname"],
          },
          {
            model: User, //좋아요 누른 사람
            as: "Likers", //post.Likers.id 이런 식으로 불러옴
            attributes: ["id", "nickname"],
          },
          {
            model: Comment,
            include: [
              {
                model: ReComment,
                include: [{ model: User, attributes: ["id", "nickname"] }],
                attributes: ["id", "content"],
              },
              {
                model: User, //댓글 작성자
                attributes: ["id", "nickname"],
              },
            ],
          },
        ],
      });
      res.status(200).json(fullPost);
    } catch (err) {
      console.error(err);
      next(err); //status 500임
    }
  }
  //----------------------------------------------------------------------

  static async update(req, res, next) {
    try {
      const postId = req.params.postId;
      await Post.update(
        {
          content: req.body.content,
        },
        {
          where: {
            id: postId,
            userIdx: req.user.id,
          },
        }
      );
      res.status(200).json({
        PostId: parseInt(postId, 10),
        content: req.body.content,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  //----------------------------------------------------------------------

  static async readAll(req, res, next) {
    try {
      const posts = await Post.findAll({
        // where: { userIdx: req.uer.id },내 것만 가져오기 *로그인 하면 req.user.id 생김
        limit: 10,
        //  offset: 0, //0~10  0에서 limit 만큼 가져와라
        include: [
          { model: User, attributes: ["id", "email", "nickname"] },
          { model: Image },
          {
            model: User,
            as: "Likers",
            attributes: ["id", "nickname"],
          },
          {
            model: Comment,
            include: [
              {
                model: ReComment,
                include: [{ model: User, attributes: ["id", "nickname"] }],
                attributes: ["id", "content"],
              },
              {
                model: User, //댓글 작성자
                attributes: ["id", "nickname"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]], //DESC 내림차순 ASC 오름차순
      });
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async read(req, res, next) {
    try {
      const post = await Post.findOne({
        where: { id: req.params.postId },
      });
      if (!post) {
        return res.status(404).send("존재하지 않는 게시글입니다");
      }
      const fullPost = await Post.findOne({
        where: { id: post.id },
        include: [
          {
            model: User,
            attributes: ["id", "email", "nickname"],
          },

          {
            model: User,
            as: "Likers",
            attributes: ["id", "nickname"],
          },
          { model: Image },
          {
            model: Comment,
            include: [
              {
                model: ReComment,
                include: [{ model: User, attributes: ["id", "nickname"] }],
                attributes: ["id", "content"],
              },
              {
                model: User, //댓글 작성자
                attributes: ["id", "nickname"],
              },
            ],
          },
        ],
      });
      res.status(200).json(fullPost);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async delete(req, res, next) {
    try {
      const postId = req.params.postId;
      // 이미지 파일 삭제 로직
      const images = await Image.findAll({
        where: {
          PostId: postId,
        },
      });

      images.forEach(async (image) => {
        const filename = image.src;
        const filePath = path.join(__dirname, "..", "uploads", filename);

        try {
          // 이미지 파일 삭제
          fs.unlinkSync(filePath);
          res.status(200);
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      });

      // 이미지 삭제 후 포스트 삭제
      await Image.destroy({
        where: {
          PostId: postId,
        },
      });
      Post.destroy({
        where: {
          id: postId,
          userIdx: req.user.id,
        },
      });

      res.status(200).json({ PostId: parseInt(postId, 10) }); //saga의 result 응답데이터, reducer의 action.data.PostId
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  //----------------------------------------------------------------------
  static async commentCreate(req, res, next) {
    try {
      const post = await Post.findOne({
        where: { id: req.params.postId },
      });
      if (!post) {
        return res.status(403).send("존재하지 않는 게시글입니다");
      }
      const comment = await Comment.create({
        content: req.body.content,
        PostId: parseInt(req.params.postId, 10),
        UserId: req.user.id,
      });
      const fullComment = await Comment.findOne({
        where: { id: comment.id },
        include: [
          {
            model: User,
            attributes: ["id", "nickname"],
          },
          {
            model: Post,
            attributes: ["id"],
          },
          {
            model: ReComment,
            include: [{ model: User, attributes: ["id", "nickname"] }],
            attributes: ["id", "content"],
          },
        ],
      });
      res.status(201).json(fullComment);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  //----------------------------------------------------------------------
  static async commentDelete(req, res, next) {
    try {
      const postId = req.params.postId;
      const commentId = req.params.commentId;

      await Comment.destroy({
        where: { id: commentId, UserId: req.user.id },
      });
      res.status(200).json({
        PostId: parseInt(postId, 10), //reducer의 action.data. 값
        CommentId: parseInt(commentId, 10),
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async commentUpdate(req, res, next) {
    try {
      const postId = req.params.postId;
      const commentId = req.params.commentId;

      await Comment.update(
        {
          content: req.body.content,
        },
        {
          where: {
            id: commentId,
            UserId: req.user.id,
          },
        }
      );
      res.status(200).json({
        PostId: parseInt(postId, 10),
        CommentId: parseInt(commentId, 10),
        content: req.body.content,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  //----------------------------------------------------------------------
  static async ReCommentCreate(req, res, next) {
    try {
      const post = await Post.findOne({
        where: { id: req.params.postId },
      });
      if (!post) {
        return res.status(403).send("존재하지 않는 게시글입니다");
      }
      const comment = await Comment.findOne({
        where: { id: req.params.commentId },
      });
      if (!comment) {
        return res.status(403).send("존재하지 않는 댓글입니다");
      }
      const reComment = await ReComment.create({
        PostId: post.id,
        content: req.body.content,
        CommentId: parseInt(req.params.commentId, 10),
        UserId: req.user.id,
      });
      const fullReComment = await ReComment.findOne({
        where: { id: reComment.id },
        include: [
          {
            model: User,
            attributes: ["id", "nickname"],
          },
          {
            model: Comment,
            attributes: ["id", "content"],
          },
        ],
      });
      res.status(201).json(fullReComment);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------
  static async reCommentDelete(req, res, next) {
    try {
      const postId = req.params.postId;
      const commentId = req.params.commentId;
      const reCommentId = req.params.reCommentId;
      await ReComment.destroy({
        where: { id: reCommentId, UserId: req.user.id },
      });
      res.status(200).json({
        PostId: parseInt(postId, 10), //reducer의 action.data. 값
        CommentId: parseInt(commentId, 10),
        ReCommentId: parseInt(reCommentId, 10),
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async reCommentUpdate(req, res, next) {
    try {
      const postId = req.params.postId;
      const commentId = req.params.commentId;
      const reCommentId = req.params.reCommentId;
      await ReComment.update(
        {
          content: req.body.content,
        },
        {
          where: {
            id: reCommentId,
            UserId: req.user.id,
          },
        }
      );
      res.status(200).json({
        PostId: parseInt(postId, 10),
        CommentId: parseInt(commentId, 10),
        ReCommentId: parseInt(reCommentId, 10),
        content: req.body.content,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  //-----------like----------------------------
  static async postLike(req, res, next) {
    try {
      const post = await Post.findOne({
        where: { id: req.params.postId },
      });
      if (!post) {
        return res.status(403).send("게시글이 존재하지 않습니다.");
      }
      await post.addLikers(req.user.id);
      res.json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  static async postUnLike(req, res, next) {
    try {
      const post = await Post.findOne({
        where: { id: req.params.postId },
      });
      if (!post) {
        return res.status(403).send("게시글이 존재하지 않습니다.");
      }
      await post.removeLikers(req.user.id);
      res.status(200).json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
};