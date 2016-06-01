var fs = require('fs');
var less = require('less');
var del = require('delete');
var cssmin = require('cssmin');
var shortid = require('shortid');
var minify = require('html-minifier').minify;
var imagemin = require('imagemin');
var imageminMozjpeg = require('imagemin-mozjpeg');
var imageminPngquant = require('imagemin-pngquant');
var Generator = require('./static-generator');
var settings = require(process.cwd() + '/settings.json');
require('./helpers');
var publicDir = process.cwd() + '/public/';
var postsDir = process.cwd() + '/post/';
var postMetadata = require(postsDir + 'metadata.json');
var filenames = fs.readdirSync(postsDir);
var lessText = fs.readFileSync(process.cwd() + '/style/style.less', 'utf8');
var posts = [];

del.sync(['!' + publicDir + '.*', publicDir + '**/*']);

for (var key in postMetadata) {
   if (!postMetadata[key]._id) {
      postMetadata[key]._id = shortid.generate();
   }
}

fs.writeFileSync(postsDir + 'metadata.json', JSON.stringify(postMetadata));

filenames.forEach(function(post) {
   var postKey = post.split('.')[0];
   if (post.split('.').pop() === 'md') {
      posts.push({
         _id: postMetadata[postKey]._id,
         input: fs.readFileSync(postsDir + post, 'utf8'),
         published: postMetadata[postKey].published
      });
   }
});

var site = Generator.generateSite(posts, settings);

for (var file in site.root) {
   fs.writeFileSync(publicDir + file, minify(site.root[file].data, {
      collapseWhitespace: true,
      conservativeCollapse: true
   }));
}

for (var post in site.posts) {
   var postDir = publicDir + post;
   fs.mkdirSync(postDir);
   fs.writeFileSync(postDir + '/index.html', minify(site.posts[post].data, {
      collapseWhitespace: true,
      conservativeCollapse: true
   }));
}

imagemin([process.cwd() + '/image/*.{jpg,png}'], publicDir + 'image', {
   plugins: [
      imageminMozjpeg({
         targa: true
      }),
      imageminPngquant()
   ]
}).catch(function(err) {
   console.log(err);
});

less.render(lessText, function(e, output) {
   fs.mkdirSync(publicDir + 'css');
   fs.writeFileSync(publicDir + 'css/style.css', cssmin(output.css));
});
