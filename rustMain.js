/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../declares.d.ts" />
'use strict';
define(["require", "exports", 'monaco', 'child_process', 'path',
    './features/declarationSupport', './features/suggestSupport',
    './features/commentsSupport',
    './features/parameterHintsSupport',
    './features/configuration', './rustServiceClient'],
    function (require, exports, monaco, cp, path,
        DeclarationSupport, SuggestSupport,
        CommentsSupport,
        ParameterHintsSupport,
        Configuration, RustServiceClient) {

        var Logger = (function () {
            function Logger() {
                this.logFun = function (msg) { };
            }
            Logger.prototype.activate = function () {
                this.logFun = function (msg) { console.log(msg); };
            };
            Logger.prototype.log = function (msg) {
                this.logFun(msg);
            };
            return Logger;
        })();
        function activate(_ctx) {
            var MODE_ID = 'rust';
            monaco.Modes.TokenTypeClassificationSupport.register(MODE_ID, {
                nonWordTokenTypes: [
                    'delimiter',
                    'delimiter.paren',
                    'delimiter.curly',
                    'delimiter.square'
                ]
            });
            monaco.Modes.ElectricCharacterSupport.register(MODE_ID, {
                brackets: [
                    { tokenType: 'delimiter.curly.rs', open: '{', close: '}', isElectric: true },
                    { tokenType: 'delimiter.square.rs', open: '[', close: ']', isElectric: true },
                    { tokenType: 'delimiter.paren.rs', open: '(', close: ')', isElectric: true }
                ],
                docComment: { scope: 'comment.documentation', open: '/**', lineStart: ' * ', close: ' */' }
            });
            monaco.Modes.CharacterPairSupport.register(MODE_ID, {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"', notIn: ['string'] },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] }
                ]
            });
            var logger = new Logger();
            var ctx = {
                modelService: _ctx.modelService,
                markerService: _ctx.markerService,
                configurationService: _ctx.configurationService,
                logger: logger
            };
            var client = new RustServiceClient(logger);

            monaco.Modes.CommentsSupport.register(MODE_ID, new CommentsSupport());
            monaco.Modes.ParameterHintsSupport.register(MODE_ID, new ParameterHintsSupport(ctx, client));
            /*monaco.Modes.OccurrencesSupport.register(MODE_ID, new OccurrencesSupport(ctx, client));
            monaco.Modes.ExtraInfoSupport.register(MODE_ID, new ExtraInfoSupport(ctx, client));
            monaco.Modes.ReferenceSupport.register(MODE_ID, new ReferenceSupport(ctx, client));
            monaco.Modes.OutlineSupport.register(MODE_ID, new OutlineSupport(ctx, client));
            monaco.Modes.RenameSupport.register(MODE_ID, new RenameSupport(ctx, client));
            monaco.Modes.FormattingSupport.register(MODE_ID, new FormattingSupport(ctx, client));          
            new BufferSyncSupport(ctx, client, MODE_ID);*/
            // Register suggest support as soon as possible and load configuration lazily
            // TODO: Eventually support eventing on the configuration service & adopt here
            monaco.Modes.DeclarationSupport.register(MODE_ID, new DeclarationSupport(ctx, client));
            var suggestSupport = new SuggestSupport(ctx, client);
            monaco.Modes.SuggestSupport.register(MODE_ID, suggestSupport);

            Configuration.load(MODE_ID, ctx.configurationService).then(function (config) {
                //			console.log('XX loaded ' + config);
                if (config.debug) {
                    logger.activate();
                }
                client.setConfiguration(config);

            });
        }
        exports.activate = activate;
    });