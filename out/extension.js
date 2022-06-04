"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const path = require("path");
const vscode = require("vscode");
const extensionProvider_1 = require("./extensionProvider");
function activate(context) {
    const provider = new extensionProvider_1.default(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(extensionProvider_1.default.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand("extension-poc.start", () => {
        ReactPanel.createOrShow(context.extensionPath);
    }));
}
exports.activate = activate;
/**
 * Manages react webview panels
 */
class ReactPanel {
    constructor(extensionPath, column) {
        this._disposables = [];
        this._extensionPath = extensionPath;
        this._panel = vscode.window.createWebviewPanel(ReactPanel.viewType, "React", column, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restric the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(this._extensionPath, "build")),
            ],
        });
        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "alert":
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionPath) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (ReactPanel.currentPanel) {
            ReactPanel.currentPanel._panel.reveal(column);
        }
        else {
            ReactPanel.currentPanel = new ReactPanel(extensionPath, column || vscode.ViewColumn.One);
        }
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: "refactor" });
    }
    dispose() {
        ReactPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _getHtmlForWebview() {
        const manifest = require(path.join(this._extensionPath, "build", "asset-manifest.json"));
        const mainScript = manifest["files"]["main.js"];
        const mainStyle = manifest["files"]["main.css"];
        const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, "build", mainScript));
        const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });
        const basePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, "build"));
        const baseUri = basePathOnDisk.with({ scheme: "vscode-resource" });
        const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, "build", mainStyle));
        const styleUri = stylePathOnDisk.with({ scheme: "vscode-resource" });
        // const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', mainStyle));
        // const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });
        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
    		<html lang="en">
    		<head>
    			<meta charset="utf-8">
    			<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    			<meta name="theme-color" content="#000000">
    			<title>React App</title>
    			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
          <link rel="stylesheet" type="text/css" href="${styleUri}">
    			<base href="${baseUri}/">
    		</head>
    		<body>
    			<noscript>You need to enable JavaScript to run this app.</noscript>
    			<div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
    		</body>
    		</html>`;
    }
}
ReactPanel.viewType = "react";
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map