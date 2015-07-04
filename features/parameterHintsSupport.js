/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../../declares.d.ts" />
'use strict';
define(["require", "exports", 'monaco'], function (require, exports, monaco) {
    var ParameterHintsSupport = (function () {
        function ParameterHintsSupport(ctx, client) {
            this.triggerCharacters = ['(', ','];
            this.excludeTokens = ['string'];
            this.client = client;
            this.modelService = ctx.modelService;
            this.logger = ctx.logger;
        }
        ParameterHintsSupport.prototype.getParameterHints = function (resource, position) {
            this.logger.log("Param Hint Request");
            var model = this.modelService.getModel(resource);
            var line = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 0,
                endLineNumber: position.lineNumber + 1,
                endColumn: 0
            });
            this.logger.log(line);
            var paramIndex = 0;
            var funIndex = 0;
            for (var c = position.column + 1; c >= 0; c--) {
                if (line[c] == '(') {
                    funIndex = c - 1;
                    break;
                }
                if (line[c] == ',') paramIndex++;
            }
            var filepath = this.client.asAbsolutePath(resource);
            var matches = this.client.execute([
                'complete',
                position.lineNumber,
                funIndex - 1,//racer does not like end of words
                filepath
            ]);
            if (matches.length == 0 ||
                matches[0].kind != "Function") {
                this.logger.log("no function match");
                return null;
            }
            var match = matches[0];
            var paramStart = match.def.indexOf("(") + 1;
            var paramEnd = match.def.indexOf(")");
            var params = match.def.substr(paramStart, paramEnd - paramStart).split(",");
            var result = {
                currentSignature: 0,
                currentParameter: paramIndex,
                signatures: []
            };
            var signature = {
                label: match.def,
                documentation: null,
                parameters: []
            };
            result.signatures.push(signature);
            params.forEach(function (param) {
                var p = {
                    label: param,
                    documentation: "",
                    signatureLabelOffset: paramStart,
                    signatureLabelEnd: paramStart + param.length
                };
                signature.parameters.push(p);
                paramStart += param.length + 1;
            });
            return result;
            var args = {
                file: this.client.asAbsolutePath(resource),
                line: position.lineNumber,
                offset: position.column
            };
            if (!args.file) {
                return monaco.Promise.as(null);
            }
            return this.client.execute('signatureHelp', args).then(function (response) {
                var info = response.body;
                if (!info) {
                    return null;
                }
                var result = {
                    currentSignature: info.selectedItemIndex,
                    currentParameter: info.argumentIndex,
                    signatures: []
                };
                info.items.forEach(function (item) {
                    var signature = {
                        label: '',
                        documentation: null,
                        parameters: []
                    };
                    signature.label += Previewer.plain(item.prefixDisplayParts);
                    item.parameters.forEach(function (p, i, a) {
                        var label = Previewer.plain(p.displayParts);
                        var parameter = {
                            label: label,
                            documentation: Previewer.plain(p.documentation),
                            signatureLabelOffset: signature.label.length,
                            signatureLabelEnd: signature.label.length + label.length
                        };
                        signature.label += label;
                        signature.parameters.push(parameter);
                        if (i < a.length - 1) {
                            signature.label += Previewer.plain(item.separatorDisplayParts);
                        }
                    });
                    signature.label += Previewer.plain(item.suffixDisplayParts);
                    result.signatures.push(signature);
                });
                return result;
            }, function (err) {
                    return null;
                });
        };
        return ParameterHintsSupport;
    })();
    return ParameterHintsSupport;
});
