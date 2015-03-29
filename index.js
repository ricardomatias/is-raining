#!/usr/bin/env node

var request = require('superagent');
var cheerio = require('cheerio');
var chalk = require('chalk');
var program = require('commander');

program
  .version('0.0.1')
  .usage('<place> <flag>')
  .option('-t --temperature', 'Print the local temperature')
  .parse(process.argv);

var args = process.argv.slice(2);

if (!program.args.length) {
  return program.help();
}

var keywords = args.filter(function(keyword) {
  var parse = Number.isNaN(parseInt(keyword), 10);
  if(!parse) {
    console.log(chalk.yellow('Try again with a city name!'));
    process.exit(1);
  }
  return parse;
}).join('-');

var api = 'http://isitraining.in/' + keywords;

request
  .get(api)
  .end(function(err, res) {
    if (err) {
      console.log(chalk.yellow('There was a problem looking up to the sky!'));
      process.exit(1);
    }

    var $ = cheerio.load(res.text);
    var $base = $('.result').parent();
    var answer = {
      main: $('.result').text(),
      strong: [],
      text: []
    };

    var message = {
      'No': chalk.blue.bold(answer.main),
      'Oops!': chalk.yellow(answer.main),
      'Yes': chalk.green.bold(answer.main)
    };

    $base.children('h2').contents().each(function(index, el) {
      if (answer.main === 'Oops!' && el.type === 'text') {
        console.log(message[answer.main] + ' ' + el.data);
        process.exit(1);
      }

      if (el.type === 'text') {
        answer.text.push(el.data);
      }

      if (el.type === 'tag' && el.name === 'strong') {
        answer.strong.push(el.children[0].data);
      }
    });

    if (answer.main === 'No' || answer.main === 'Yes') {
      console.log(message[answer.main] + '! In ' + chalk.yellow.bold(answer.strong[0]) + ' the weather is ' + chalk.white.bold(answer.strong[1]) + '!');
    }

    if (program.temperature && answer.main !== 'Oops!') {
      console.log('The temperature is around ' + chalk.blue.bold(answer.text[2].trim()));
    }

  });
