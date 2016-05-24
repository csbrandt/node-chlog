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
var settings = require('./settings.json');
require('./helpers');
var publicDir = __dirname + '/public/';
var postsDir = __dirname + '/post/';
var filenames = fs.readdirSync(postsDir);
var lessText = fs.readFileSync(__dirname + '/style/style.less', 'utf8');
var posts = [];

del.sync(['public/**/*.html', 'public/**/*.css']);

filenames.forEach(function(post) {
   posts.push({
      _id: shortid.generate(),
      input: fs.readFileSync(postsDir + post, 'utf8'),
      published: fs.statSync(postsDir + post).ctime
   });
});

var doc = Generator.generateDoc(posts, settings);

for (var file in doc) {
   fs.writeFileSync(publicDir + file, minify(doc[file].data, {
      collapseWhitespace: true,
      conservativeCollapse: true
   }));
}

imagemin(['image/*.{jpg,png}'], publicDir + 'image', {
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
   fs.writeFileSync(publicDir + 'css/style.css', cssmin(output.css));
});
