// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import OpenAIClient from './resources/OpenAIClient';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Get configuration settings for your extension
	const configuration = vscode.workspace.getConfiguration('angreal');
	// Try to retrieve the OpenAI API key
	let openAIKey = configuration.get<string>('OpenAIKey');
	vscode.window.showInformationMessage('Open AI Key: ' + openAIKey);

	// If the OpenAI API key isn't available, display a warning
	if (!openAIKey) {
		vscode.window.showWarningMessage('OpenAI API key is not available. Please provide it in the configuration settings.');
	}
	else {
		let openAiClient = new OpenAIClient(openAIKey);
		let disposable = vscode.commands.registerCommand('angreal.suggestion', async () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const document = editor.document;
				const selection = editor.selection;
				const line = document.lineAt(selection.active.line).text.trim();

				const entireContent = document.getText();
	
				if (line.length === 0) {
					vscode.window.showWarningMessage('Current line is empty, please type something.');
					return;
				}

				let linesToComplete = await vscode.window.showInputBox({prompt: 'Enter the number of lines to complete'});
				if (!linesToComplete) {
					return;
				}
				const linesToCompleteQuantity = parseInt(linesToComplete.trim());
	
	
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "channeling with angreal...",
					cancellable: true
				}, async (progress, token) => {
					token.onCancellationRequested(() => {
						console.log("User canceled the long running operation");
					});
	
					progress.report({ increment: 0 });
					const response = await openAiClient.suggest(entireContent, line, linesToCompleteQuantity);
					// Add a newline to the beginning of the response 
					const formattedResponse = '\n' + response;
					progress.report({ increment: 100 });
	
					// Adding completion to the end of the line
					editor.edit(editBuilder => {
						const position = document.lineAt(selection.active.line).range.end;
						editBuilder.insert(position, formattedResponse);
					});
				});
			} else {
				vscode.window.showWarningMessage('No active editor found.');
			}
		});
	
		context.subscriptions.push(disposable);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
