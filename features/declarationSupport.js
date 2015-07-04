/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../../declares.d.ts" />
'use strict';
define(["require", "exports", 'monaco'], function (require, exports, monaco) {
    var DeclarationSupport = (function () {
        function DeclarationSupport(ctx, client) {
            this.tokens = [];
            this.client = client;
            this.logger = ctx.logger;
            this.modelService = ctx.modelService;
        }
        DeclarationSupport.prototype.findDeclaration = function (resource, position) {
            var file = this.client.asAbsolutePath(resource);
            var model = this.modelService.getModel(resource);
            if (!file) {
                return monaco.Promise.as(null);
            }
            var res = this.client.saveAndExec(model, [
                "find-definition",
                position.lineNumber,
                position.column - 1,
                file
            ]);
            if (res.length == 0) {
                this.logger.log("No declaration");
                return null;
            }
            var result = res[0];
            var resource = this.client.asUrl(result.file);
            this.logger.log("Declaration for '" + result.name + "' in '" + resource + "' @ " + result.line + ":" + result.column)
            return {
                resourceUrl: resource,
                range: {
                    startLineNumber: result.line,
                    startColumn: result.column,
                    endLineNumber: result.line,
                    endColumn: result.column + result.name.length
                }
            };
        };
        return DeclarationSupport;
    })();
    return DeclarationSupport;
});
