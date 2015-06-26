/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../../declares.d.ts" />
'use strict';
define(["require", "exports", 'vs/languages/lib/javascriptSnippets',
    'monaco', './configuration'],
    function (require, exports, monaco, Snippets, Configuration) {
        var SuggestSupport = (function () {
            function SuggestSupport(ctx, client) {
                this.triggerCharacters = ['.'];
                this.excludeTokens = ['string', 'comment', 'numeric'];
                this.sortBy = [{ type: 'reference', partSeparator: '/' }];
                this.modelService = ctx.modelService;
                this.client = client;
                this.config = Configuration.defaultConfiguration;
            }
            SuggestSupport.prototype.setConfiguration = function (config) {
                this.config = config;
            };
            SuggestSupport.prototype.log = function (msg) {
                if (this.config.debug) {
                    console.log("Rust.SuggestSupport: " + msg);
                }
            }
            SuggestSupport.prototype.suggest = function (resource, position) {
                var _this = this;
                var filepath = this.client.asAbsolutePath(resource);
                var model = this.modelService.getModel(resource);
                var requestColumn = position.column - 1;//racer does not like end of words
                var wordAtPosition = model.getWordAtPosition(position, false);
                var args = [
                    'complete',
                    position.lineNumber,
                    requestColumn,
                    filepath
                ];
                if (wordAtPosition) {
                    requestColumn = wordAtPosition.startColumn;
                }
                // Need to capture the word at position before we send the request.
                // The model can move forward while the request is evaluated.
                var matches = this.client.execute(args);
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
                var suggests = [];
                for (var i = 0; i < matches.length; i++) {
                    var element = matches[i];
                    suggests.push({
                        label: element.name,
                        codeSnippet: element.name,
                        type: element.kind
                    });
                }
                var currentWord = '';
                if (wordAtPosition && wordAtPosition.startColumn < position.column) {
                    currentWord = wordAtPosition.word.substr(0, position.column - wordAtPosition.startColumn);
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
                var _this = this;
                //if (suggestion.type === 'snippet') {
                return monaco.Promise.as(suggestion);
                //}
                var args = {
                    file: this.client.asAbsolutePath(resource),
                    line: position.lineNumber,
                    offset: position.column,
                    entryNames: [
                        suggestion.label
                    ]
                };
            };
            return SuggestSupport;
        })();
        return SuggestSupport;
    });
