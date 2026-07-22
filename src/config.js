import * as core from '@actions/core';
import yaml from 'js-yaml';

export const DEFAULTS = {
  dryRun: false,
  restaurants: [],
  occasions: {
    first_pr_merged: { enabled: true, budget: 50, message: 'First PR merged!' },
    pr_milestone: { enabled: true, budget: 100, milestones: [10, 50, 100, 500, 1000] },
    first_issue_closed: { enabled: true, budget: 30, message: 'First issue closed!' },
    issue_milestone: { enabled: true, budget: 80, milestones: [10, 50, 100, 500, 1000] },
    release: { enabled: true, budget: 50 },
    major_release: { enabled: true, budget: 200 },
    first_release: { enabled: true, budget: 150 },
    star_milestone: { enabled: true, budget: 100, milestones: [100, 500, 1000, 5000] },
    custom_label: { enabled: true, budget: 50, label: 'celebrate' }
  }
};

export async function loadConfig(octokit, context) {
  try {
    const { repo } = context;
    const configPath = core.getInput('config-path') || '.github/ship-n-eat.yml';
    
    let fileContent;
    try {
      const response = await octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.repo,
        path: configPath,
        ref: context.sha
      });
      
      // GitHub API returns Base64 encoded content
      fileContent = Buffer.from(response.data.content, response.data.encoding).toString();
    } catch (error) {
      if (error.status === 404) {
        core.info(`Config file ${configPath} not found. Using defaults.`);
        return DEFAULTS;
      }
      throw error;
    }

    const parsedConfig = yaml.load(fileContent);
    return mergeConfigs(DEFAULTS, parsedConfig);
  } catch (error) {
    core.warning(`Error loading configuration: ${error.message}`);
    return null;
  }
}

function mergeConfigs(defaults, userConfig) {
  if (!userConfig) return defaults;
  const merged = { ...defaults, ...userConfig };
  
  if (userConfig.occasions) {
    merged.occasions = { ...defaults.occasions };
    for (const key of Object.keys(userConfig.occasions)) {
      merged.occasions[key] = { ...defaults.occasions[key], ...userConfig.occasions[key] };
    }
  }
  
  return merged;
}
