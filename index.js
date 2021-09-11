const fs = require('fs')
const core = require('@actions/core');

function generateReleaseNotes(branchDiffFile, projectKeys, previousVersion, newVersion, viewReleaseUrl, createReleaseUrl) {
  const data = fs.readFileSync(branchDiffFile, 'utf8');
  const lines = data.split(/\r?\n/);

  console.log("Previous version: " + previousVersion);
  console.log("New version: " + newVersion);
  console.log("Project keys: " + projectKeys);
  console.log("Lines: " + lines.length);

  const mergeRegExp = new RegExp('Merge branch .* into .*');
  const regExps = [];
  for (const projectKey of projectKeys) {
    if (projectKey === '*') {
      regExps.push(new RegExp('([A-Z].*)-([0-9].*)'));
    } else {
      regExps.push(new RegExp(`${projectKey.trim()}-([0-9].*)`));
    }
  }

  const tickets = {};

  for (const line of lines) {
    const mergeCommit = line.trim().match(mergeRegExp);
    if (!mergeCommit) {
      const words = line.trim().split(" ");

      for (const word of words) {
        for (const re of regExps) {
          const r = word.trim().match(re);

          if (r) {
            tickets[r[0]] = true;
          }
        }
      }
    }
  }

  const ticketIds = Object.keys(tickets)
    .sort((a, b) => {
      const partsA = a.split("-");
      const partsB = b.split("-");

      if (partsA[0] === partsB[0]) {
        return +partsA[1] - +partsB[1];
      } else {
        return partsA[0].localeCompare(partsB[0])
      }
    });

  console.log("Detected tickets: " + JSON.stringify(ticketIds));

  let releaseNotes = "";

  if (!!previousVersion) {
    releaseNotes += "## Version change\n";
    releaseNotes += `- Previous version: **${previousVersion}**\n`;
    releaseNotes += `- New version: **${newVersion}**\n`;
  }

  releaseNotes += "## Changes\n";
  for (const ticketId of ticketIds) {
    releaseNotes += `- ${ticketId}\n`;
  }

  if (!!viewReleaseUrl || !!createReleaseUrl) {
    releaseNotes += `\n## Links\n`;

    if (!!viewReleaseUrl) {
      releaseNotes += `- [View Release Ticket](${encodeURI(viewReleaseUrl)})\n`;
    }

    if (!!createReleaseUrl) {
      let createRelease = createReleaseUrl + "&issuelinks-linktype=releases&issuelinks-issues=DELETE";

      for (const ticketId of ticketIds) {
        createRelease += `&issuelinks-issues=${ticketId}`
      }

      releaseNotes += `- [Create Release Ticket](${encodeURI(createRelease)})\n`;
    }
  }

  return releaseNotes;
}

async function run() {
  try {
    const branchDiffFile = core.getInput('branch-diff-file', {required: true});
    const projectKey = core.getInput('jira-project-key', {required: true});
    const previousVersion = core.getInput("previous-version", {required: false});
    const newVersion = core.getInput("new-version", {required: false});
    const viewReleaseUrl = core.getInput("jira-view-release", {required: false})
    const createReleaseUrl = core.getInput('jira-create-release', {required: false});

    const releaseNotes = generateReleaseNotes(branchDiffFile, projectKey.split(","), previousVersion,
      newVersion, viewReleaseUrl, createReleaseUrl);
    core.setOutput('release-notes', releaseNotes);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run()
