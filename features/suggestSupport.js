/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../../declares.d.ts" />
'use strict';
define(["require", "exports", 'fs',
    'monaco'],
    function (require, exports, fs, monaco) {
        var SuggestSupport = (function () {
            function SuggestSupport(ctx, client) {
                this.triggerCharacters = ['.'];
                this.excludeTokens = ['string', 'comment', 'numeric'];
                this.sortBy = [{ type: 'reference', partSeparator: '/' }];
                this.modelService = ctx.modelService;
                this.logger = ctx.logger;
                this.client = client;
                this.lastResults = [];
                this.kinds = new Map();
                this.kinds.set('Function', 'function');
                this.kinds.set('Struct', 'class');
                this.kinds.set('Type', 'type');
                this.kinds.set('Trait', 'interface');
                this.kinds.set('Enum', 'enum');
                this.kinds.set('EnumVariant', 'enum');
                this.kinds.set('Module', 'module');
                var keywordsNames = [
                    'abstract',
                    'alignof',
                    'as',
                    'become',
                    'box',
                    'break',
                    'const',
                    'continue',
                    'crate',
                    'do',
                    'else',
                    'enum',
                    'extern',
                    'false',
                    'final',
                    'fn',
                    'for',
                    'if',
                    'impl',
                    'in',
                    'let',
                    'loop',
                    'macro',
                    'match',
                    'mod',
                    'move',
                    'mut',
                    'offsetof',
                    'override',
                    'priv',
                    'proc',
                    'pub',
                    'pure',
                    'ref',
                    'return',
                    'Self',
                    'self',
                    'sizeof',
                    'static',
                    'struct',
                    'super',
                    'trait',
                    'true',
                    'type',
                    'typeof',
                    'unsafe',
                    'unsized',
                    'use',
                    'virtual',
                    'where',
                    'while',
                    'yield'
                ];
                this.keywords = new Array();
                for (var kw = 0; kw < keywordsNames.length; kw++) {
                    this.keywords.push({
                        label: keywordsNames[kw],
                        codeSnippet: keywordsNames[kw],
                        type: 'keyword'
                    });
                }
                var basicTypesNames = [
                    'bool',
                    'char',
                    'f32',
                    'f64',
                    'i16',
                    'i32',
                    'i64',
                    'i8',
                    'isize',
                    'str',
                    'tuple',
                    'u16',
                    'u32',
                    'u64',
                    'u8',
                    'usize',
                    'Box',
                    'Option',
                    'Path',
                    'PathBuf',
                    'Result',
                    'String',
                    'Vec',
                    'Some',
                    'None',
                    'Ok',
                    'Err'
                ];
                this.basicTypes = new Array();
                for (var i = 0; i < basicTypesNames.length; i++) {
                    this.basicTypes.push({
                        label: basicTypesNames[i],
                        codeSnippet: basicTypesNames[i],
                        type: 'type'
                    });
                }
                var macrosNames = [
                    'macro_rules',
                    'format_args',
                    'env',
                    'option_env',
                    'concat_idents',
                    'concat',
                    'log_syntax',
                    'line',
                    'column',
                    'file',
                    'stringify',
                    'include',
                    'include_str',
                    'include_bytes',
                    'module_path',
                    'asm',
                    'cfg',
                    'trace_macros',
                    'panic',
                    'assert',
                    'assert_eq',
                    'debug_assert',
                    'debug_assert_eq',
                    'try',
                    'write',
                    'writeln',
                    'unreachable',
                    'unimplemented',
                    'format',
                    'print',
                    'println',
                    'select',
                    'vec',
                    'log',
                    'error',
                    'warn',
                    'info',
                    'debug',
                    'trace',
                    'log_enabled'
                ];
                this.macros = new Array();
                for (var i = 0; i < macrosNames.length; i++) {
                    this.macros.push({
                        label: macrosNames[i] + "!",
                        codeSnippet: macrosNames[i] + "!",
                        type: 'local function'
                    });
                }
                var traitsNames = [
                    'Copy',
                    'Send',
                    'Sized',
                    'Sync',
                    'Drop',
                    'Fn',
                    'FnMut',
                    'FnOnce',
                    'Clone',
                    'PartialEq',
                    'PartialOrd',
                    'Eq',
                    'Ord',
                    'Read',
                    'Write',
                    'Seek',
                    'BufRead',
                    'DoubleEndedIterator',
                    'ExactSizeIterator',
                    'Iterator',
                    'Extend',
                    'AsPath',
                    'AsSlice',
                    'Str',
                    'ToString'
                ];
                this.traits = new Array();
                for (var i = 0; i < traitsNames.length; i++) {
                    this.traits.push({
                        label: traitsNames[i],
                        codeSnippet: traitsNames[i],
                        type: 'interface'
                    });
                }
            }
            SuggestSupport.prototype.suggest = function (resource, position) {
                var filepath = this.client.asAbsolutePath(resource);
                var model = this.modelService.getModel(resource);
                var requestColumn = position.column;
                var wordAtPosition = model.getWordAtPosition(position, false);
                if (wordAtPosition) {
                    requestColumn = wordAtPosition.startColumn;
                }
                var isMemberCompletion = false;
                if (requestColumn > 0) {
                    var value = model.getValueInRange({
                        startLineNumber: position.lineNumber,
                        startColumn: requestColumn - 1,
                        endLineNumber: position.lineNumber,
                        endColumn: requestColumn
                    });
                    isMemberCompletion = value === '.';
                }
                var currentWord = '';
                if (wordAtPosition && wordAtPosition.startColumn < position.column) {
                    currentWord = wordAtPosition.word.substr(0, position.column - wordAtPosition.startColumn);
                }
                // Need to capture the word at position before we send the request.
                // The model can move forward while the request is evaluated.
                var matches = this.client.execute([
                    'complete',
                    position.lineNumber,
                    position.column - 1,//racer does not like end of words
                    filepath
                ]);
                this.lastResults = matches;
                var suggests = [];
                if (matches.length === 0 || !isMemberCompletion) {
                    if (currentWord.length === 0) {
                        if (model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: requestColumn - 5,
                            endLineNumber: position.lineNumber,
                            endColumn: requestColumn - 1
                        }) === "impl") {
                            suggests = suggests.concat(this.traits);
                        } else {
                            suggests = suggests.concat(this.keywords)
                                .concat(this.basicTypes)
                                .concat(this.macros);
                        }
                    }
                }
                for (var i = 0; i < matches.length; i++) {
                    var element = matches[i];
                    var kind = 'keyword';
                    if (this.kinds.has(element.kind)) {
                        kind = this.kinds.get(element.kind);
                    }
                    suggests.push({
                        label: " " + element.name,//adding a space before so racer results appear first
                        codeSnippet: element.name,
                        type: kind
                    });
                }
                return [
                    {
                        currentWord: currentWord,
                        suggestions: suggests
                    }
                ];
            }, function (err) {
                return [
                    {
                        currentWord: "error",
                        suggestions: [{ label: "error" }]
                    }
                ];
            };
            SuggestSupport.prototype.getSuggestionDetails = function (resource, position, suggestion) {
                this.logger.log("Suggestion details : " + suggestion.label);
                suggestion.documentationLabel = "";
                suggestion.typeLabel = "";
                if (suggestion.type == "keyword") {
                    return suggestion;
                }
                //suggestion.codeSnippet = "code snippet";
                var result = null;
                var label = suggestion.label.trim();
                for (var s = 0; s < this.lastResults.length; s++) {
                    if (this.lastResults[s].name === label) {
                        result = this.lastResults[s];
                        break;
                    }
                }
                if (result == null) {
                    this.logger.log("not found in last suggestions");
                    return suggestion;
                }
                suggestion.typeLabel = result.kind;
                this.logger.log("reading " + result.file);
                var data = fs.readFileSync(result.file, 'utf8').split('\n');
                if (data.length < result.line) {
                    this.logger.log("file too short");
                    return suggestion;
                }
                var endLine = result.line - 2;
                while (data[endLine].includes("#[")
                    || data[endLine].includes("// NB")
                    ) endLine--;
                if (!data[endLine].includes("///")) {
                    this.logger.log("no doc comment found");
                    return suggestion;
                }
                var startLine = endLine;
                while (data[startLine].includes("///")) {
                    startLine--;
                }
                this.logger.log("comment = " + startLine + "->" + endLine);
                var doc = "";
                for (var l = startLine + 1; l <= endLine; l++) {
                    var startComment = data[l].indexOf("///") + 4;
                    var docLine = data[l].substr(startComment);
                    if (docLine.indexOf("#") > 0) break;//stop on examples
                    doc += docLine;
                    if (doc.length > 75) break;//stop when to long to display
                }
                suggestion.documentationLabel = doc;

                return suggestion;
            };
            return SuggestSupport;
        })();
        return SuggestSupport;
    });
