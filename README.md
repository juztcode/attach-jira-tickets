# Create release notes - Github action

A [GitHub Action](https://github.com/features/actions) to extract jira tickets from commits and generate release notes.

## Usage

1. Create a `.github/workflows/generate-notes.yml` file in your GitHub repo.
2. Add the following code to the `generate-notes.yml` file.

```yml
on:
  pull_request:
    types:
      - opened
      - synchronize
      - reopened
      - ready_for_review
    branches:
      - master

jobs:
  attach:
    runs-on: ubuntu-18.04

    steps:
      -   uses: actions/checkout@v2
          with:
            fetch-depth: 0

      -   name: Generate branch diff file
          if: success()
          run: |
            echo "Head branch: ${GITHUB_HEAD_REF}"
            echo "Base branch: ${GITHUB_BASE_REF}"
            git log origin/${GITHUB_BASE_REF}..origin/${GITHUB_HEAD_REF} > ./branch-diff.txt

      -   name: Generate release notes
          if: success()
          uses: juztcode/create-release-notes@1.0.0
          with:
            branch-diff-file: ./branch-diff.txt
            jira-project-key: TEST
            jira-url: "https://ustocktrade.atlassian.net/secure/CreateIssueDetails!init.jspa?pid=10907"
```

## Inputs

Input             | Purpose
------------------|---------------------------------------------------------------------------------------------------------------------------------------
branch-diff-file  | File contains commit message difference between head and base branches.
jira-project-key  | Jira project key used to extract ticket ids from commit message (TEST key will detect all ticket ids with pattern TEST-<num>).
previous-version  | Previous version released
new-version       | New version to be released
jira-url          | Jira url to use when generating create release ticket link.

## Outputs

Output            | Purpose
------------------|---------------------------------------------------------------------------------------------------------------------------------------
release-notes     | Generated release notes.
