import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// Retrieve persisted text from globalState
	const persistedText = context.globalState.get<string>('workItemText', 'Your workitem! 🚀');

	// Retrieve settings
	const config = vscode.workspace.getConfiguration('statusBarWorkItem');
	const showIcon = config.get<boolean>('showIcon', false);
	const textColor = config.get<string>('textColor', '');
	let copyOnlyText = config.get<boolean>('copyOnlyText', false);

	// Validate textColor
	const isValidColor = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(textColor);
	const validatedTextColor = isValidColor ? textColor : ''; // Use default color if invalid

	// Create a status bar item for the icon
	const statusBarIcon = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarIcon.text = '$(pencil)';
	statusBarIcon.tooltip = 'Click to edit';
	statusBarIcon.command = 'extension.editWorkItemText';
	if (showIcon) {
		statusBarIcon.show();
	}

	// Create a status bar item for the text
	const statusBarText = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarText.text = persistedText;
	statusBarText.tooltip = 'Click to copy';
	statusBarText.command = 'extension.copyWorkItemText';
	statusBarText.color = validatedTextColor || undefined;
	statusBarText.show();

	// Register command to edit text
	const editTextCommand = vscode.commands.registerCommand('extension.editWorkItemText', async () => {
		const newText = await vscode.window.showInputBox({ prompt: 'Enter new text' });
		if (newText !== undefined) {
			statusBarText.text = newText;
			context.globalState.update('workItemText', newText); // Persist the new text
		}
	});

	// Register command to copy text
	const copyTextCommand = vscode.commands.registerCommand('extension.copyWorkItemText', () => {
		let textToCopy = statusBarText.text;
		if (copyOnlyText) {
			textToCopy = textToCopy.replace(/\p{Extended_Pictographic}/gu, '').trim();
		}
		vscode.env.clipboard.writeText(textToCopy);
		vscode.window.showInformationMessage('Text copied to clipboard!');
	});

	// Register command to change text color
	const changeTextColorCommand = vscode.commands.registerCommand('extension.changeTextColor', async () => {
		const commonColors = [
			{ label: 'Red', value: '#CC6666' },
			{ label: 'Green', value: '#66CC66' },
			{ label: 'Blue', value: '#6666CC' },
			{ label: 'Yellow', value: '#CCCC66' },
			{ label: 'Orange', value: '#CC9966' },
			{ label: 'Purple', value: '#9966CC' },
			{ label: 'Teal', value: '#66CCCC' },
			{ label: 'Pink', value: '#CC6699' },
			{ label: 'Black', value: '#333333' },
			{ label: 'White', value: '#CCCCCC' }
		];

		const selectedColor = await vscode.window.showQuickPick(
			commonColors.map(color => ({ label: color.label, description: color.value })),
			{ placeHolder: 'Select a color for the workitem text' }
		);

		if (selectedColor) {
			statusBarText.color = selectedColor.description;
			await vscode.workspace.getConfiguration('statusBarWorkItem').update('textColor', selectedColor.description, vscode.ConfigurationTarget.Global);
		}
	});

	// Register command to open settings
	const openSettingsCommand = vscode.commands.registerCommand('extension.openWorkItemSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:femartinezg.status-bar-workitem');
	});

	// Listen for configuration changes
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('statusBarWorkItem.showIcon')) {
			const showIcon = vscode.workspace.getConfiguration('statusBarWorkItem').get<boolean>('showIcon', false);
			if (showIcon) {
				statusBarText.hide(); // Temporarily hide text
				statusBarIcon.show();
				statusBarText.show(); // Show text after icon
			} else {
				statusBarIcon.hide();
			}
		}

		if (event.affectsConfiguration('statusBarWorkItem.textColor')) {
			const textColor = vscode.workspace.getConfiguration('statusBarWorkItem').get<string>('textColor', '');
			const isValidColor = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(textColor);
			statusBarText.color = isValidColor ? textColor : undefined; // Use default color if invalid
		}

		if (event.affectsConfiguration('statusBarWorkItem.copyOnlyText')) {
			copyOnlyText = vscode.workspace.getConfiguration('statusBarWorkItem').get<boolean>('copyOnlyText', false);
		}
	});

	context.subscriptions.push(statusBarIcon, statusBarText, editTextCommand, copyTextCommand, changeTextColorCommand, openSettingsCommand);
}

export function deactivate() {}
