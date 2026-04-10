function currentRepo(tp) {
  const notePath = String(tp.file.path(true) || "").replace(/\\/g, "/");
  const match = notePath.match(/^02 Repositories\/([^/]+)/);

  return match ? match[1] : "playground";
}

function repoFolder(tp) {
  return `02 Repositories/${currentRepo(tp)}`;
}

function repoHomeLink(tp) {
  return `[[${repoFolder(tp)}/00 Repo Home|Repo Home]]`;
}

module.exports = {
  currentRepo,
  repoFolder,
  repoHomeLink,
};
