import * as os from 'os';
import * as path from "path";
import * as vscode from 'vscode';
import CompletionItemProvider from './features/completionItemProvider'
import Support from './support/support'

// POV-Ray Extension Activation
export function activate(context: vscode.ExtensionContext) {

    registerTasks();
    registerCommands(context);

    // Code Completion
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('povray', new CompletionItemProvider(), ' '));
}

// Create a Render Taks Definiton that we can use to pass around info about the render task
interface RenderTaskDefinition extends vscode.TaskDefinition {
    type: string;
    filePath: string;
    outFilePath: string;
}

// The Shell Context will help us determine what shell command to build
export interface ShellContext {
    platform: string;               // win32,linux,darwin
    isWindowsBash: boolean;
    isWindowsPowershell: boolean;
}

// Creates a task provider for POV-Ray files
export function registerTasks() {

    const taskType = "povray"; //This is the taskDefinitions type defined in package.json

    // create a task provider
    const povrayTaskProvider = {

        provideTasks(token?: vscode.CancellationToken) {

            /****************************************/
            /* POV-Ray Render Scene File Build Task */
            /****************************************/

            // Get the POV-Ray settings
            let settings = Support.getPOVSettings();

            if (settings.pvenginePath === undefined || settings.pvenginePath == null || settings.pvenginePath === "") {
                // Missing the critical path item
                vscode.window.showErrorMessage("Missing povray/pvengine configuration setting.");
                return [];
            }

            // Get information about the shell environment context
            let context = getShellContext(settings);

            // Get information about the currently open file
            let fileInfo = getFileInfo(context);

            if (fileInfo.filePath === undefined || fileInfo.filePath === "")
            {
                // We don't have a file so bail with no tasks
                return [];
            }

            // build the output file path based on the settings and appropriate to the shell context
            let outFilePath = buildOutFilePath(settings, fileInfo, context);

            // Make sure that the output file directory exists, create it if is doesn't
            Support.createDirIfMissing(outFilePath, context);

            // Build the povray executable to run in the shell based on the settings and appropriate to the shell context
            let povrayExe = buildShellPOVExe(settings, fileInfo, outFilePath, context);

            // Build the commandline render options to pass to the executable in the shell based on the settings and appropriate to the shell context
            let renderOptions = buildRenderOptions(settings, fileInfo, context);

            // Create the Shell Execution that runs the povray executable with the render options
            vscode.window.showInformationMessage(povrayExe + renderOptions);
            const execution = new vscode.ShellExecution(povrayExe + renderOptions, {cwd: fileInfo.fileDir});

            // Use the $povray problem matcher defined in the package.json problemMatchers
            const problemMatchers = ["$povray"];

            // Set up task definition with file information
            let taskDefinition: RenderTaskDefinition = {
                type: taskType,
                filePath: fileInfo.filePath,
                outFilePath: outFilePath
            };

            // define the build task
            const buildTask = new vscode.Task(
                taskDefinition,
                vscode.TaskScope.Workspace,
                "Render Scene",
                "POV-Ray",
                execution,
                problemMatchers);

            // set the task as part of the Build task group
            buildTask.group = vscode.TaskGroup.Build;
            // clear theterminal every time the tasl is run
            buildTask.presentationOptions.clear = true;
            // don't show a message indictating that the terminal will be reused for subsequent render tasks
            buildTask.presentationOptions.showReuseMessage = false;
            // reevaluate the vars every time
            buildTask.runOptions.reevaluateOnRerun = true;

            // return an array of tasks for this provider
            return [
                buildTask
            ];
        },

        // Legacy
        resolveTask(task: vscode.Task, token?: vscode.CancellationToken) {
            return task;
        }
    };

    // Set up a handler for when the task ends
    vscode.tasks.onDidEndTaskProcess((e) => {

        // If there is an exit code and it is 0 then we assume the render task was successful
        if (e.exitCode !== undefined && e.exitCode === 0) {

            // Get the task definition from the event
            let taskDefinition = e.execution.task.definition;

            // If we were rendering a .pov file rather than a .ini
            if (taskDefinition.filePath.endsWith(".pov")) {

                // Show an information notification to the user about the output file that was rendered
                vscode.window.showInformationMessage("Rendered: " + taskDefinition.outFilePath);

                const settings = Support.getPOVSettings();
                // If the the user has indicated that the image that ws rendered should be opened
                if (settings.openImageAfterRender === true)
                {
                    // Default to opening the image in the active column
                    let column = vscode.ViewColumn.Active;

                    // If the user has indicated that the image should be opened in a new column
                    if (settings.openImageAfterRenderInNewColumn === true)
                    {
                        // Set the column to be the one beside the active column
                        column = vscode.ViewColumn.Beside;
                    }

                    // Open the rendered image, but preserve the focus of the current document
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(taskDefinition.outFilePath), {viewColumn: column, preserveFocus: true});
                }

            }
        }
    });

    // Register the povray task provider with VS Code
    vscode.tasks.registerTaskProvider(taskType, povrayTaskProvider);
}

// Registers command handlers for POV-Ray files
export function registerCommands(context: vscode.ExtensionContext) {

    const renderCommand = 'povray.render';

    // Create a command handler for running the POV-Ray Render Build Task
    const renderCommandHandler = (uri:vscode.Uri) => {

        // Fetch all of the povray tasks
        vscode.tasks.fetchTasks({type: "povray"}).then((tasks) => {

            // Loop through the tasks and find the Render Scene Build Task
            tasks.forEach(task => {

                if (task.group === vscode.TaskGroup.Build && task.name === "Render Scene") {
                    // Execute the task
                    vscode.tasks.executeTask(task);
                }
            });
        });
    };

    // Register the render command handler and add it to the context subscriptions
    context.subscriptions.push(vscode.commands.registerCommand(renderCommand, renderCommandHandler));

}

// Gets the shell context for the current OS and VS Code configuration
export function getShellContext(settings: any) : ShellContext {
    let shellContext: ShellContext = {
        platform: os.platform(),
        isWindowsBash: settings.win32Terminal == "Bash",
        isWindowsPowershell: settings.win32Terminal == "Powershell (vscode default)"
    };

    return shellContext;
}

// Gets information about the file in the active Text Editor
export function getFileInfo(context: ShellContext) {
    // Get inormation about currently open file path
    let fileInfo = {
        filePath: "",
        fileName: "",
        fileExt: "",
        fileDir: ""
    };

    if (vscode.window.activeTextEditor !== undefined) {

        fileInfo.filePath = vscode.window.activeTextEditor.document.fileName;
        fileInfo.fileDir = Support.getDirName(fileInfo.filePath, context) + "/";
        fileInfo.fileName = path.basename(fileInfo.filePath);
        fileInfo.fileExt = path.extname(fileInfo.filePath);
    }

    return fileInfo;
}

export function getOutputFileExtension(settings: any) {
    let outExt = ".png";
    switch (settings.outputFormat) {
        case "png - Portable Network Graphics": outExt = ".png"; break;
        case "jpg - JPEG (lossy)": outExt = ".jpg"; break;
        case "bmp - Bitmap": outExt = ".bmp"; break;
        case "tga - Targa-24 (compressed)": outExt = ".tga"; break;
        case "tga - Targa-24": outExt = ".tga"; break;
        case "exr - OpenEXR High Dynamic-Range": outExt = ".exr"; break;
        case "hdr - Radiance High Dynamic-Range": outExt = ".hdr"; break;
        case "ppm - Portable Pixmap": outExt = ".ppm"; break;
    }

    return outExt;
}

export function getOutputFormatOption(settings: any) {
    let formatOption = "";
    switch (settings.outputFormat) {
        case "png - Portable Network Graphics": formatOption = ""; break;
        case "jpg - JPEG (lossy)": formatOption = " Output_File_Type=J"; break;
        case "bmp - Bitmap": formatOption = " Output_File_Type=B"; break;
        case "tga - Targa-24 (compressed)": formatOption = " Output_File_Type=C"; break;
        case "tga - Targa-24": formatOption = " Output_File_Type=T"; break;
        case "exr - OpenEXR High Dynamic-Range": formatOption = " Output_File_Type=E"; break;
        case "hdr - Radiance High Dynamic-Range": formatOption = " Output_File_Type=H"; break;
        case "ppm - Portable Pixmap": formatOption = " Output_File_Type=P"; break;
    }

    return formatOption;
}

// Builds an output file path for rendering based on the file info, settings, and shell context
// Specifically checks for whether the user has configured an output path
export function buildOutFilePath(settings: any, fileInfo: any, context: ShellContext) {

    let outExt = getOutputFileExtension(settings);
    // Build the output file path
    // Default to the exact same path as the source file, except with an image extension
    let outFilePath = fileInfo.fileDir + fileInfo.fileName.replace(".pov", outExt).replace(".ini", outExt);
    // If the user has deinfed an output path in the settings
    if (settings.outputPath.length > 0)
    {
        if (settings.outputPath.startsWith(".")) {
            // the outputPath defined by the user appears to be relative
            outFilePath = fileInfo.fileDir + settings.outputPath + fileInfo.fileName.replace(".pov", outExt).replace(".ini", outExt);
        } else {
            // Use the custom output path plus the file name of the source file wirg rge extention changed to the image extension
            outFilePath = settings.outputPath + fileInfo.fileName.replace(".pov", outExt).replace(".ini", outExt);
        }

    }
    // Normalize the outFileName to make sure that it works for Windows
    outFilePath = Support.normalizePath(outFilePath, context);

    return outFilePath;
}

// Builds the command to call in the shell in order to run POV-Ray
// depending on the OS, Shell
export function buildShellPOVExe(settings: any, fileInfo: any, outFilePath: any, context: ShellContext) {
    // Default to running an executable called povray (Linux, Mac, WSL Ubuntu Bash, Git Bash)
    //let exe = "povray";
    let exe = Support.wrapPathSpaces(settings.pvenginePath, settings);

    // If we are running on Windows but not Bash
    if (context.platform === 'win32' && !context.isWindowsBash) {
        if (context.isWindowsPowershell) { exe = "& " + exe; }
        exe = exe + " /EXIT /RENDER";
    }

    return exe;
}

// Builds a string of commandline arguments to pass to the POV-Ray executable
// to indicate which file to render, the output path, the width and height, etc.
// based on the settings, file to render, output path provided, and the shell context
export function buildRenderOptions(settings: any, fileInfo: any, context: ShellContext) {

    // Start building the render command that will be run in the shell
    let renderOptions = getInputFileOption(settings, fileInfo, context) ;

    renderOptions += getDisplayRenderOption(settings);

    renderOptions += getDimensionOptions(settings, fileInfo);

    renderOptions += " " + Support.wrapPathSpaces("Output_File_Name=" + Support.normalizePath(fileInfo.fileDir + settings.outputPath, context), settings);

    renderOptions += getLibraryPathOption(settings, context);

    renderOptions += getOutputFormatOption(settings);

    renderOptions += getCustomCommandlineOptions(settings);

    // If the integrated terminal is Powershell running on Windows, we need to pipe the pvengine.exe through Out-Null
    // to make powershell wait for the rendering to complete and POV-Ray to close before continuing
    if (context.isWindowsPowershell) {
        renderOptions += " | Out-Null";
    }

    return renderOptions;
}

export function getInputFileOption(settings: any, fileInfo: any, context: ShellContext) {

    let fileInputOption = fileInfo.filePath;

    // Handle the cases where the input file name contains spaces
    if (fileInputOption.indexOf(" ") !== -1) {

        if (context.platform === "linux" || context.platform === "darwin" || context.isWindowsBash) {
            // For Mac, Linux, and WSL Bash we have to put some weird quoting aroun the filename
            // and escape the space
            // "'"File\ Name.pov"'""
            fileInputOption = '"\'"'+fileInfo.fileName.replace(/ /g, "\\ ")+'"\'"';
        }
        else {
            if (context.isWindowsPowershell) {
                fileInputOption = Support.wrapPathSpaces(fileInputOption, settings);
            } else {
                // CMD.exe
                // "File Name.pov"
                fileInputOption = '"${fileBasename}"';
            }
        }
    }

    return " "+fileInputOption;
}

export function getDisplayRenderOption(settings: any) {

    let displayRenderOption = " -D";

    if (settings.displayImageDuringRender === true) {
        displayRenderOption = "";
    }

    return displayRenderOption;
}

export function getDimensionOptions(settings: any, fileInfo: any) {

    let dimensionOptions = "";

    // if this is a .pov file, pass the default render width and height from the settings
    // as commandline arguments, otherwise we assume that the .ini file will include
    // width and height instructions
    if (fileInfo.fileExt !== undefined && fileInfo.fileExt === ".pov") {
        dimensionOptions = " Width=" + settings.defaultRenderWidth + " Height=" + settings.defaultRenderHeight;
    }

    return dimensionOptions;
}

/* export function getOutputPathOption(settings: any, context: ShellContext) {

    let outputPathOption = "";

    // If the user has set an output path for rendered files,
    // add the output path as a commandline argument
    if (settings.outputPath.length > 0) {

        // Use the actual path specified in the settings rather than the
        // calculated full path so that we avoid unnecessary problems with
        // output filenames that include spaces.
        // (Output file names with spaces fail when the shell is Powershell.
        // See: https://github.com/jmaxwilson/vscode-povray/issues/10 )
        let outFilePath = settings.outputPath;

        if (outFilePath.indexOf(" ") === -1)
        {
            if (context.isWindowsBash) {
            // If the shell is WSL Bash then we need to make sure that
            // the output path is translated into the correct WSL path
            // wslpath strips the final slash, but POV-Ray needs
            // a slash at the end to know that it is a path and not a filename
            // so we include a slash after the call to wslpath
            outFilePath = "$(wslpath \'"+outFilePath+"\')/";

            } else {

                // If the outFilePath has any spaces then we need to do some weird quoting
                // to get POV-Ray to parse it right depending on the OS & Shell

                if (context.platform === "linux" || context.platform === "darwin") {
                    // Linux, Mac
                    // "'"/directory/path\ 1/file\ 1.png"'"
                    outFilePath = '"\'"'+outFilePath.replace(/ /g, "\\ ").replace(/\\\\/g, "\\")+'"\'"';
                }
                else {
                        outFilePath = wrapPathSpaces(outFilePath, settings);
                    }
                }
        }

        outputPathOption = " Output_File_Name="+outFilePath;
    }

    return outputPathOption;
} */

export function getLibraryPathOption(settings: any, context: ShellContext) {

    let libraryOption = "";

    // If the user has set library path,
    // add the library path as a commandline argument
    if (settings.libraryPath.length > 0) {

        settings.libraryPath = Support.normalizePath(settings.libraryPath, context);

        if (context.isWindowsBash) {
            // If the shell is WSL Bash then we need to make sure that
            // the library path is translated into the correct WSL path
            libraryOption = " Library_Path=$(wslpath '"+settings.libraryPath+"')";

        } else {
           libraryOption = " " + Support.wrapPathSpaces("Library_Path=" + settings.libraryPath, settings);
        }
    }

    return libraryOption;
}

export function getCustomCommandlineOptions(settings: any) {

    let CustomOptions = "";

    if (settings.customCommandlineOptions.length > 0) {
        CustomOptions = " " + settings.customCommandlineOptions.trim();
    }

    return CustomOptions;
}

