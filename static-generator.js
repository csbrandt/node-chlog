var fs = require('fs');
var _ = require('lodash');
var $ = require('cheerio');
var Handlebars = require('handlebars');
var marked = require('marked');
var rss = require('rss');
var highlight = require('highlight.js');
var tileTemplateSrc = fs.readFileSync(__dirname + '/template/tiles.html', "utf8");
var postTileTemplateSrc = fs.readFileSync(__dirname + '/template/posttile.html', "utf8");
var postTemplateSrc = fs.readFileSync(__dirname + '/template/post.html', "utf8");

var POSTS_PER_PAGE = 8;
var generator = exports;

generator.generateDoc = function(posts, settings) {
   var doc = {
      'feed.rss': {
         'content_type': 'application/rss+xml',
         'data': this.generateFeed(posts, settings)
      }
   };

   Object.assign(doc, this.generateTiles(posts, settings));

   posts.forEach(function(post, name) {
      var postMap = this.generatePost(post, settings);
      doc[Object.keys(postMap)[0]] = postMap[Object.keys(postMap)[0]];

   }.bind(this));

   return doc;
};

generator.generatePost = function(doc, settings) {
   var postTemplate = Handlebars.compile(postTemplateSrc);
   var post = {};

   marked.setOptions({
      highlight: function (code) {
         return highlight.highlightAuto(code).value;
      }
   });

   marked(doc.input, function(err, content) {
      var $parsed = $('<div />').html(content);
      $parsed.find('h1').first().remove();
      $parsed.find('p > img').first().parent().remove();

      doc.content = $parsed.html();
      doc.published = (new Date(doc.published)).toLocaleDateString();

      var page = postTemplate(Object.assign({}, doc, settings));

      post[doc._id + '.html'] = {
         "content_type": "text/html",
         "data": page
      };
   });

   return post;
};

generator.generateTiles = function(posts, settings) {
   var tileTemplate = Handlebars.compile(tileTemplateSrc);
   var postTileTemplate = Handlebars.compile(postTileTemplateSrc);
   var pages = _.range(1, Math.max(2, Math.ceil(posts.length / POSTS_PER_PAGE)));
   var page;
   var tiles = {};
   var postsMarkup = '';

   posts.sort(function(a, b) {
      if (a.published < b.published) {
         return 1;
      }

      if (a.published > b.published) {
         return -1;
      }

      return 0;
   });

   // for each page generate tiles
   pages.forEach(function(pageNum) {
      posts.slice(POSTS_PER_PAGE * (pageNum - 1), POSTS_PER_PAGE * pageNum).forEach(function(post, index) {
         post.index = index;
         post.published = (new Date(post.published)).toLocaleDateString();
         postsMarkup += postTileTemplate(generator.generateContentPreview(post));
      });

      page = tileTemplate(Object.assign({
         nextPageNum: pageNum + 1,
         prevPageNum: (pageNum === 2) ? 'index' : pageNum - 1,
         firstPage: (pageNum === 1),
         lastPage: (pageNum === pages.length),
         posts: postsMarkup
      }, settings));

      tiles[((pageNum === 1) ? 'index' : pageNum) + '.html'] = {
         "content_type": "text/html",
         "data": page
      };

   });

   return tiles;
};

generator.generateContentPreview = function(post) {
   var content = marked(post.input);
   var $parsed = $('<div />').html(content);
   // pick the first header from this content
   var firstHeaderHTML = $parsed.find('h1').first().wrap('<div />').parent().html();

   // include image if present on post
   var $firstImg = $parsed.find('img').first();

   if ($firstImg.length) {
      post.bgImgUrl = $firstImg.attr('src');
   }

   post.preview = firstHeaderHTML;
   return post;
};

generator.generateFeed = function(posts, settings) {
   var feed = new rss({
      title: settings.title,
      description: settings.description,
      generator: "RSS for Node",
      feed_url: settings.host + "/feed.rss",
      site_url: settings.host
   });

   posts.forEach(function(post, name) {
      feed.item({
         //title:
         //description:
         url: settings.host + "/" + post._id + ".html",
         guid: post._id,
         author: settings.author,
         date: post.published
      });
   });

   return feed.xml();
};
