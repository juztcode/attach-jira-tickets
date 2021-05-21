const fs = require('fs')
const core = require('@actions/core');

function generateReleaseNotes(branchDiffFile, projectKey, createReleaseUrl) {
  const data = fs.readFileSync(branchDiffFile, 'utf8');
  const lines = data.split(/\r?\n/);
  console.log("Lines: " + lines.length);

  const re = new RegExp(`${projectKey}-([0-9]*)`);
  const tickets = {};

  for (const line of lines) {
    const words = line.trim().split(" ");

    for (const word of words) {
      const r = word.trim().match(re);

      if (r) {
        tickets[r[0]] = true;
      }
    }
  }

  const ticketIds = Object.keys(tickets);
  console.log("Detected tickets: " + JSON.stringify(ticketIds));

  let releaseNotes = "## Changes\n";

  for (const ticketId of ticketIds) {
    releaseNotes += `- ${ticketId}\n`;
  }

  if (!!createReleaseUrl) {
    let createRelease = createReleaseUrl + "&issuelinks-linktype=releases&issuelinks-issues=DELETE";

    for (const ticketId of ticketIds) {
      createRelease += `&issuelinks-issues=${ticketId}`
    }

    releaseNotes += `\n## Links\n`;
    releaseNotes += `- [Create Release Ticket](${encodeURI(createRelease)})`;
  }

  return releaseNotes;
}

async function run() {
  try {
    const branchDiffFile = core.getInput('branch-diff-file', {required: true});
    const projectKey = core.getInput('jira-project-key', {required: true});
    const createReleaseUrl = core.getInput('jira-url', {required: false});

    const releaseNotes = generateReleaseNotes(branchDiffFile, projectKey, createReleaseUrl);
    core.setOutput('release-notes', releaseNotes);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run()
