const {Task} = require('@dotcom-tool-kit/types');
const {exec} = require('child_process');
const {hookFork, waitOnExit} = require('@dotcom-tool-kit/logger');

class Prebuild extends Task {
    async run() {
        this.logger.info('Initializing prebuild task');

        // Execute the shell command to perform the prebuild steps
        const child = await exec(
            'bash -c "rm -rf node_modules/n-feedback && mkdir -p node_modules/n-feedback && cp main.scss node_modules/n-feedback/main.scss && cp index.js node_modules/n-feedback/index.js && cp -r src/ node_modules/n-feedback/src/ && cp -r templates/ node_modules/n-feedback/templates/"'
        );

        hookFork(this.logger, 'Prebuild task run', child);

        // Wait for the child process to exit
        return waitOnExit('Prebuild task complete', child);
    }
}

exports.tasks = [Prebuild];