#!/usr/bin/env bash
set -eo pipefail

# resolve-jules-conflicts.sh
# Automatically resolves merge conflicts on Jules persistent memory files (.Jules/*.md, .jules/*.md)
# using Git's native 3-way union merge.

TARGET_BRANCH="${1:-origin/main}"
echo "==> Fetching ${TARGET_BRANCH}..."
git fetch origin main

# Check if TARGET_BRANCH is already ancestor
if git merge-base --is-ancestor "${TARGET_BRANCH}" HEAD; then
  echo "==> Branch is already up to date with ${TARGET_BRANCH}."
  exit 0
fi

echo "==> Attempting merge with ${TARGET_BRANCH}..."
if git merge --no-edit "${TARGET_BRANCH}"; then
  echo "==> Clean merge completed successfully."
  exit 0
fi

echo "==> Conflicts detected. Inspecting unmerged files..."
UNMERGED_FILES=$(git diff --name-only --diff-filter=U)
echo "Unmerged files:"
echo "${UNMERGED_FILES}"

# Check for non-Jules conflicting files
NON_JULES_CONFLICTS=$(echo "${UNMERGED_FILES}" | grep -vE '^\.([jJ]ules)/.*\.md$' || true)

if [ -n "${NON_JULES_CONFLICTS}" ]; then
  echo "==> Conflicts exist in source code files:"
  echo "${NON_JULES_CONFLICTS}"
  echo "==> Aborting automatic merge to preserve source code safety."
  git merge --abort
  exit 1
fi

echo "==> Conflicts are isolated to Jules memory files. Resolving via 3-way union merge..."
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

for FILE in ${UNMERGED_FILES}; do
  echo "--> Union-merging: ${FILE}"
  mkdir -p "${TMP_DIR}/$(dirname "${FILE}")"
  BASE="${TMP_DIR}/${FILE}.base"
  OURS="${TMP_DIR}/${FILE}.ours"
  THEIRS="${TMP_DIR}/${FILE}.theirs"

  # Extract 3-way stages: 1=base, 2=ours (PR), 3=theirs (target)
  git show :1:"${FILE}" > "${BASE}" 2>/dev/null || touch "${BASE}"
  git show :2:"${FILE}" > "${OURS}" 2>/dev/null || touch "${OURS}"
  git show :3:"${FILE}" > "${THEIRS}" 2>/dev/null || touch "${THEIRS}"

  # Run RCS 3-way union merge
  git merge-file -q --union "${OURS}" "${BASE}" "${THEIRS}"

  # Write back resolved file and stage
  cp "${OURS}" "${FILE}"
  git add "${FILE}"
done

git commit -m "chore(agents): auto-resolve Jules memory conflicts with main [skip ci]"
echo "==> Successfully resolved memory conflicts."
