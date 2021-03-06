/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import vscode = require('vscode');
import { listPackages } from './goImport';
import * as _ from 'lodash';

export class GoCodeActionProvider implements vscode.CodeActionProvider {
	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): Thenable<vscode.Command[]> {
		
		let promises = context.diagnostics.map(diag => {
			// When a name is not found but could refer to a package, offer to add import 
			if(diag.message.indexOf("undefined: ") == 0) {
				let [_, name] = /^undefined: (\S*)/.exec(diag.message)
				return listPackages().then(packages => {
					let commands = packages
						.filter(pkg => pkg == name || pkg.endsWith("/" + name))
						.map(pkg => {
						return {
							title: "import \"" + pkg  +"\"",
							command: "go.import.add",
							arguments: [pkg]	
						}
					});
					return commands;
				});
			}
			return [];
		});

		return Promise.all(promises).then(arrs => { 
			return _.sortBy(
				_.uniq(_.flatten(arrs), x => x.title), 
				x => x.title
			);
		});
	}
}
