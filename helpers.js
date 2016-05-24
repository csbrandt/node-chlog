var Handlebars = require('handlebars');

// HELPER: #key_value
//
// Usage: {{#key_value obj}} Key: {{key}} // Value: {{value}} {{/key_value}}
//
// Iterate over an object, setting 'key' and 'value' for each property in
// the object.
Handlebars.registerHelper("key_value", function(obj, context) {
   var buffer = "",
      key;

   for (key in obj) {
      if (obj.hasOwnProperty(key)) {
         buffer += context.fn({
            key: key,
            value: obj[key]
         });
      }
   }

   return buffer;
});

Handlebars.registerHelper("locale_date_string", function(date) {
   return new Date(date).toLocaleDateString();
});

Handlebars.registerHelper("ifOdd", function(index, options) {
   if ((this.index + (Math.floor(this.index / 2) % 2)) % 2) {
      return options.fn(this);
   } else {
      return options.inverse(this);
   }
});
