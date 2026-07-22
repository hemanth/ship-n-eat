export async function detectOccasion(octokit, context, config) {
  const { eventName, payload } = context;
  const occasionConfig = config.occasions || {};

  // PR Occasions
  if (eventName === 'pull_request' && payload.action === 'closed' && payload.pull_request.merged) {
    const prNumber = payload.pull_request.number;
    const repo = context.repo;

    const labels = payload.pull_request.labels.map(l => l.name);
    const celebrateLabel = occasionConfig.custom_label?.label || 'celebrate';
    if (occasionConfig.custom_label?.enabled !== false && labels.includes(celebrateLabel)) {
      return { occasion: 'custom_label', message: occasionConfig.custom_label?.message || 'A special PR was merged!', budget: occasionConfig.custom_label?.budget || 50, meta: { prNumber } };
    }

    const { data: prs } = await octokit.rest.pulls.list({
      owner: repo.owner,
      repo: repo.repo,
      state: 'closed',
      per_page: 100
    });
    
    const mergedPrs = prs.filter(pr => pr.merged_at);
    const prCount = mergedPrs.length;

    if (occasionConfig.first_pr_merged?.enabled !== false && prCount === 1) {
      return { occasion: 'first_pr_merged', message: occasionConfig.first_pr_merged?.message || 'First PR merged!', budget: occasionConfig.first_pr_merged?.budget || 50, meta: { prNumber } };
    }

    const milestones = occasionConfig.pr_milestone?.milestones || [10, 50, 100, 500, 1000];
    if (occasionConfig.pr_milestone?.enabled !== false && milestones.includes(prCount)) {
      return { occasion: 'pr_milestone', message: occasionConfig.pr_milestone?.message || `Merged PR #${prCount}!`, budget: occasionConfig.pr_milestone?.budget || 100, meta: { prNumber, prCount } };
    }
  }

  // Issue Occasions
  if (eventName === 'issues' && payload.action === 'closed') {
    const issueNumber = payload.issue.number;
    
    const labels = payload.issue.labels.map(l => l.name);
    const celebrateLabel = occasionConfig.custom_label?.label || 'celebrate';
    if (occasionConfig.custom_label?.enabled !== false && labels.includes(celebrateLabel)) {
      return { occasion: 'custom_label', message: occasionConfig.custom_label?.message || 'A special issue was closed!', budget: occasionConfig.custom_label?.budget || 50, meta: { issueNumber } };
    }
    
    const repo = context.repo;
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: repo.owner,
      repo: repo.repo,
      state: 'closed',
      per_page: 100
    });

    const issueCount = issues.length;

    if (occasionConfig.first_issue_closed?.enabled !== false && issueCount === 1) {
      return { occasion: 'first_issue_closed', message: occasionConfig.first_issue_closed?.message || 'First issue closed!', budget: occasionConfig.first_issue_closed?.budget || 30, meta: { issueNumber } };
    }

    const milestones = occasionConfig.issue_milestone?.milestones || [10, 50, 100, 500, 1000];
    if (occasionConfig.issue_milestone?.enabled !== false && milestones.includes(issueCount)) {
      return { occasion: 'issue_milestone', message: occasionConfig.issue_milestone?.message || `Closed issue #${issueCount}!`, budget: occasionConfig.issue_milestone?.budget || 80, meta: { issueNumber, issueCount } };
    }
  }

  // Release Occasions
  if (eventName === 'release' && payload.action === 'published') {
    const tagName = payload.release.tag_name;
    const repo = context.repo;
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner: repo.owner,
      repo: repo.repo,
      per_page: 100
    });

    const releaseCount = releases.length;

    if (occasionConfig.first_release?.enabled !== false && releaseCount === 1) {
      return { occasion: 'first_release', message: occasionConfig.first_release?.message || 'First release published!', budget: occasionConfig.first_release?.budget || 150, meta: { tagName } };
    }

    const isMajor = tagName.match(/^v?[0-9]+\.0\.0$/);
    if (occasionConfig.major_release?.enabled !== false && isMajor) {
      return { occasion: 'major_release', message: occasionConfig.major_release?.message || `Major release ${tagName} published!`, budget: occasionConfig.major_release?.budget || 200, meta: { tagName } };
    }

    if (occasionConfig.release?.enabled !== false) {
      return { occasion: 'release', message: occasionConfig.release?.message || `Release ${tagName} published!`, budget: occasionConfig.release?.budget || 50, meta: { tagName } };
    }
  }

  // Star Milestone Occasion
  if (eventName === 'watch' && payload.action === 'started') {
    const repo = context.repo;
    const { data: repoData } = await octokit.rest.repos.get({
      owner: repo.owner,
      repo: repo.repo
    });

    const starCount = repoData.stargazers_count;
    const milestones = occasionConfig.star_milestone?.milestones || [100, 500, 1000, 5000];

    if (occasionConfig.star_milestone?.enabled !== false && milestones.includes(starCount)) {
      return { occasion: 'star_milestone', message: occasionConfig.star_milestone?.message || `Reached ${starCount} stars!`, budget: occasionConfig.star_milestone?.budget || 100, meta: { starCount } };
    }
  }

  return null;
}
