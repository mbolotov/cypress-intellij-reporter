const path = require('path')
    , processStdoutWrite = process.stdout.write.bind(process.stdout)
    , processStderrWrite = process.stderr.write.bind(process.stderr)
    , MOCHA = 'mocha';

var doEscapeCharCode = (function () {
  var obj = {};

  function addMapping(fromChar, toChar) {
    if (fromChar.length !== 1 || toChar.length !== 1) {
      throw Error('String length should be 1');
    }
    var fromCharCode = fromChar.charCodeAt(0);
    if (typeof obj[fromCharCode] === 'undefined') {
      obj[fromCharCode] = toChar;
    }
    else {
      throw Error('Bad mapping');
    }
  }

  addMapping('\n', 'n');
  addMapping('\r', 'r');
  addMapping('\u0085', 'x');
  addMapping('\u2028', 'l');
  addMapping('\u2029', 'p');
  addMapping('|', '|');
  addMapping('\'', '\'');
  addMapping('[', '[');
  addMapping(']', ']');

  return function (charCode) {
    return obj[charCode];
  };
}());

function isAttributeValueEscapingNeeded(str) {
  var len = str.length;
  for (var i = 0; i < len; i++) {
    if (doEscapeCharCode(str.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}

function escapeAttributeValue(str) {
  if (!isAttributeValueEscapingNeeded(str)) {
    return str;
  }
  var res = ''
    , len = str.length;
  for (var i = 0; i < len; i++) {
    var escaped = doEscapeCharCode(str.charCodeAt(i));
    if (escaped) {
      res += '|';
      res += escaped;
    }
    else {
      res += str.charAt(i);
    }
  }
  return res;
}

/**
 * @param {Array.<string>} list
 * @param {number} fromInclusive
 * @param {number} toExclusive
 * @param {string} delimiterChar one character string
 * @returns {string}
 */
function joinList(list, fromInclusive, toExclusive, delimiterChar) {
  if (list.length === 0) {
    return '';
  }
  if (delimiterChar.length !== 1) {
    throw Error('Delimiter is expected to be a character, but "' + delimiterChar + '" received');
  }
  var addDelimiter = false
    , escapeChar = '\\'
    , escapeCharCode = escapeChar.charCodeAt(0)
    , delimiterCharCode = delimiterChar.charCodeAt(0)
    , result = ''
    , item
    , itemLength
    , ch
    , chCode;
  for (var itemId = fromInclusive; itemId < toExclusive; itemId++) {
    if (addDelimiter) {
      result += delimiterChar;
    }
    addDelimiter = true;
    item = list[itemId];
    itemLength = item.length;
    for (var i = 0; i < itemLength; i++) {
      ch = item.charAt(i);
      chCode = item.charCodeAt(i);
      if (chCode === delimiterCharCode || chCode === escapeCharCode) {
        result += escapeChar;
      }
      result += ch;
    }
  }
  return result;
}

var toString = {}.toString;

/**
 * @param {*} value
 * @return {boolean}
 */
function isString(value) {
  return isStringPrimitive(value) || toString.call(value) === '[object String]';
}

/**
 * @param {*} value
 * @return {boolean}
 */
function isStringPrimitive(value) {
  return typeof value === 'string';
}

function safeFn(fn) {
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (ex) {
      const message = ex.message || '';
      const stack = ex.stack || '';
      warn(stack.indexOf(message) >= 0 ? stack : message + '\n' + stack);
    }
  };
}

function warn(...args) {
  const util = require('util');
  const str = 'warn mocha-intellij: ' + util.format.apply(util, args) + '\n';
  try {
    processStderrWrite(str);
  }
  catch (ex) {
    try {
      processStdoutWrite(str);
    }
    catch (ex) {
      // do nothing
    }
  }
}

function writeToStdout(str) {
  processStdoutWrite(str);
}

function writeToStderr(str) {
  processStderrWrite(str);
}

function toUnixPath(path) {
  return path.split("\\").join("/");
}

exports.escapeAttributeValue = escapeAttributeValue;
exports.joinList = joinList;
exports.isString = isString;
exports.isStringPrimitive = isStringPrimitive;
exports.safeFn = safeFn;
exports.writeToStdout = writeToStdout;
exports.writeToStderr = writeToStderr;
